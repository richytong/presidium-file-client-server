const assert = require("assert")
const fs = require("fs")
const http = require("http")
const Readable = require("presidium/Readable")
const FileLoadBalancer = require("./FileLoadBalancer")
const FileServer = require("./FileServer")
const FileClient = require("./FileClient")

async function test0() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
    await fs.promises.rm(`${__dirname}/file-root`, { recursive: true })
  } catch {
  }

  const server = new FileServer({
    dir: `${__dirname}/file-root/file-load-balancer`,
    databasePath: `${__dirname}/database`,
    metadataTableInitialLength: 1024,
    metadataTableItemSize: 1024,
  })
  await server.init()

  server.listen(7357)

  const loadBalancer = new FileLoadBalancer(
    async () => 0,
    { serverIps: ["http://localhost:7357"] }
  )

  loadBalancer.listen(6333)

  const fileClient1 = new FileClient({
    serverUrl: "http://localhost:6333",
  })

  await fileClient1.write("/a", "1", { ContentType: "text/plain" })
  await fileClient1.write("/b", "2", { ContentType: "text/plain" })
  await fileClient1.write("/c", "3", { ContentType: "text/plain" })

  const fileA = await fileClient1.read("/a")
  const fileB = await fileClient1.read("/b")
  const fileC = await fileClient1.read("/c")

  assert.equal(fileA.ContentType, "text/plain")
  assert.equal(fileA.ContentLength, 1)
  assert.equal(fileB.ContentType, "text/plain")
  assert.equal(fileB.ContentLength, 1)
  assert.equal(fileC.ContentType, "text/plain")
  assert.equal(fileC.ContentLength, 1)

  const contentA = await Readable.Text(fileA.FileStream)
  const contentB = await Readable.Text(fileB.FileStream)
  const contentC = await Readable.Text(fileC.FileStream)

  assert.equal(contentA, "1")
  assert.equal(contentB, "2")
  assert.equal(contentC, "3")

  const didDeleteA = await fileClient1.delete("/a")
  const didDeleteB = await fileClient1.delete("/b")
  const didDeleteC = await fileClient1.delete("/c")

  assert.strictEqual(didDeleteA, true)
  assert.strictEqual(didDeleteB, true)
  assert.strictEqual(didDeleteC, true)

  const didDeleteA2 = await fileClient1.delete("/a")
  const didDeleteB2 = await fileClient1.delete("/b")
  const didDeleteC2 = await fileClient1.delete("/c")

  assert.strictEqual(didDeleteA2, false)
  assert.strictEqual(didDeleteB2, false)
  assert.strictEqual(didDeleteC2, false)

  assert.strictEqual(await fileClient1.read("/not-found"), undefined)

  loadBalancer.close()
  server.close()

  assert(loadBalancer.closed)
}

async function test1() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
    await fs.promises.rm(`${__dirname}/file-root`, { recursive: true })
  } catch {
  }

  const events = []

  const server1 = new FileServer({
    dir: `${__dirname}/file-root/file-load-balancer/file-server-1`,
    databasePath: `${__dirname}/database`,
    metadataTableInitialLength: 1024,
    metadataTableItemSize: 1024,
  }, request => {
    events.push({ server: 1, fileUrl: request.url })
  })
  await server1.init()

  server1.listen(7358)

  const server2 = new FileServer({
    dir: `${__dirname}/file-root/file-load-balancer/file-server-2`,
    databasePath: `${__dirname}/database`,
    metadataTableInitialLength: 1024,
    metadataTableItemSize: 1024,
  }, request => {
    events.push({ server: 2, fileUrl: request.url })
  })
  await server2.init()

  server2.listen(7359)

  const server3 = new FileServer({
    dir: `${__dirname}/file-root/file-load-balancer/file-server-3`,
    databasePath: `${__dirname}/database`,
    metadataTableInitialLength: 1024,
    metadataTableItemSize: 1024,
  }, request => {
    events.push({ server: 3, fileUrl: request.url })
  })
  await server3.init()

  server3.listen(7360)

  function hash(fileUrl, length) {
    if (length == null) {
      throw new Error("length")
    }
    if (fileUrl.slice(1) <= "i") {
      return 0
    }
    if (fileUrl.slice(1) <= "r") {
      return 1
    }
    return 2
  }

  let n = 0
  let p = 0

  const loadBalancer = new FileLoadBalancer(hash, {
    serverIps: [
      "localhost:7358",
      "localhost:7359",
      "localhost:7360",
    ],
  }, () => {
    n += 1
  }, () => {
    p = n
  })

  loadBalancer.listen(6333)

  const fileClient1 = new FileClient({
    serverUrl: "http://localhost:6333",
  })

  await fileClient1.write("/a", "1", { ContentType: "text/plain" })

  assert.equal(n, 1)
  assert.equal(p, 1)

  await fileClient1.write("/j", "10", { ContentType: "text/plain" })

  assert.equal(n, 2)
  assert.equal(p, 2)

  await fileClient1.write("/z", "26", { ContentType: "text/plain" })

  assert.equal(n, 3)
  assert.equal(p, 3)

  assert.equal(events.length, 3)
  assert.equal(events[0].server, 1)
  assert.equal(events[0].fileUrl, "/a")
  assert.equal(events[1].server, 2)
  assert.equal(events[1].fileUrl, "/j")
  assert.equal(events[2].server, 3)
  assert.equal(events[2].fileUrl, "/z")

  const fileA = await fileClient1.read("/a")
  const contentA = await Readable.Text(fileA.FileStream)

  assert.equal(n, 4)
  assert.equal(p, 4)

  const fileB = await fileClient1.read("/j")
  const contentB = await Readable.Text(fileB.FileStream)

  assert.equal(n, 5)
  assert.equal(p, 5)

  const fileC = await fileClient1.read("/z")
  const contentC = await Readable.Text(fileC.FileStream)

  assert.equal(n, 6)
  assert.equal(p, 6)

  assert.equal(events.length, 6)
  assert.equal(events[0].server, 1)
  assert.equal(events[0].fileUrl, "/a")
  assert.equal(events[1].server, 2)
  assert.equal(events[1].fileUrl, "/j")
  assert.equal(events[2].server, 3)
  assert.equal(events[2].fileUrl, "/z")
  assert.equal(events[3].server, 1)
  assert.equal(events[3].fileUrl, "/a")
  assert.equal(events[4].server, 2)
  assert.equal(events[4].fileUrl, "/j")
  assert.equal(events[5].server, 3)
  assert.equal(events[5].fileUrl, "/z")

  assert.equal(contentA, "1")
  assert.equal(contentB, "10")
  assert.equal(contentC, "26")

  loadBalancer.close()
  server1.close()
  server2.close()
  server3.close()
}

async function test2() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
    await fs.promises.rm(`${__dirname}/file-root`, { recursive: true })
  } catch {
  }

  const server1 = new FileServer({
    dir: `${__dirname}/file-root/file-load-balancer/file-server-1`,
    databasePath: `${__dirname}/database`,
    metadataTableName: "Metadata",
    metadataTableInitialLength: 1024,
    metadataTableItemSize: 1024,
  })
  await server1.init()

  server1.listen(7361)

  const server2 = new FileServer({
    dir: `${__dirname}/file-root/file-load-balancer/file-server-2`,
    databasePath: `${__dirname}/database`,
    metadataTableName: "Metadata",
    metadataTableInitialLength: 1024,
    metadataTableItemSize: 1024,
  })
  await server2.init()

  server2.listen(7362)

  const server3 = new FileServer({
    dir: `${__dirname}/file-root/file-load-balancer/file-server-3`,
    databasePath: `${__dirname}/database`,
    metadataTableName: "Metadata",
    metadataTableInitialLength: 1024,
    metadataTableItemSize: 1024,
  })
  await server3.init()

  server3.listen(7363)

  const loadBalancer = new FileLoadBalancer(() => 0, {
    serverIps: [[
      "localhost:7361",
      "localhost:7362",
      "localhost:7363",
    ]],
  })

  loadBalancer.listen(6334)

  const fileClient1 = new FileClient({
    serverUrl: "http://localhost:6334",
  })

  await fileClient1.write("/a", "1", { ContentType: "text/plain" })
  await fileClient1.write("/b", "2", { ContentType: "text/plain" })
  await fileClient1.write("/c", "3", { ContentType: "text/plain" })

  const fileA = await fileClient1.read("/a")
  const fileB = await fileClient1.read("/b")
  const fileC = await fileClient1.read("/c")

  const contentA = await Readable.Text(fileA.FileStream)
  const contentB = await Readable.Text(fileB.FileStream)
  const contentC = await Readable.Text(fileC.FileStream)

  assert.equal(contentA, "1")
  assert.equal(contentB, "2")
  assert.equal(contentC, "3")

  loadBalancer.close()
  server1.close()
  server2.close()
  server3.close()
}

async function test3() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
    await fs.promises.rm(`${__dirname}/file-root`, { recursive: true })
  } catch {
  }

  const server1 = new FileServer({
    dir: `${__dirname}/file-root/file-load-balancer/file-server-1`,
    databasePath: `${__dirname}/database`,
    metadataTableInitialLength: 1024,
    metadataTableItemSize: 1024,
  })
  await server1.init()

  server1.listen(7364)

  const server2 = new FileServer({
    dir: `${__dirname}/file-root/file-load-balancer/file-server-2`,
    databasePath: `${__dirname}/database`,
    metadataTableInitialLength: 1024,
    metadataTableItemSize: 1024,
  })
  await server2.init()

  server2.listen(7365)

  const server3 = http.createServer((request, response) => {
    response.writeHead(500, {
      "Content-Type": "text/plain",
    })
    response.end("Test Internal Server Error")
  })

  server3.listen(7366)

  const loadBalancer = new FileLoadBalancer(() => 0, {
    serverIps: [[
      "localhost:7364",
      "localhost:7365",
      "localhost:7366",
    ]],
  })

  loadBalancer.listen(6335)

  const fileClient1 = new FileClient({
    serverUrl: "http://localhost:6335",
  })

  consoleError = console.error
  const errors = []
  console.error = error => {
    errors.push(error)
  }

  await fileClient1.write("/a", "1", { ContentType: "text/plain" })

  assert.equal(errors.length, 1)
  assert.equal(errors[0].message, "Test Internal Server Error")

  await fileClient1.write("/b", "2", { ContentType: "text/plain" })

  assert.equal(errors.length, 2)
  assert.equal(errors[0].message, "Test Internal Server Error")
  assert.equal(errors[1].message, "Test Internal Server Error")

  console.error = consoleError

  loadBalancer.close()
  server1.close()
  server2.close()
  server3.close()
}

async function test() {
  await test0()
  await test1()
  await test2()
  await test3()
  console.log("Success")
}

if (process.argv[1] == __filename) {
  process.env.NODE_ENV = "test"
  test()
}

module.exports = test
