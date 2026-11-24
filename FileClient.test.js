const assert = require("assert")
const fs = require("fs")
const stream = require("stream")
const zlib = require("zlib")
const http = require("http")
const Readable = require("presidium/Readable")
const FileServer = require("./FileServer")
const FileClient = require("./FileClient")

async function test0() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
    await fs.promises.rm(`${__dirname}/file-root`, { recursive: true })
  } catch {
  }

  const fileServer = new FileServer({
    dir: `${__dirname}/file-root/test-dir`,
    databasePath: `${__dirname}/database`,
  })
  await fileServer.init()

  fileServer.listen(7357)

  const fileClient = new FileClient({
    serverUrl: 'localhost:7357',
  })

  const filePath1 = "/media/test-1.webm"
  const testData1 = fs.createReadStream(`${__dirname}/test-data/sample-vertical-5s.webm`)

  let testData1ContentLength = 0
  testData1.on("data", chunk => {
    testData1ContentLength += chunk.length
  })

  const metadata1 = await fileClient.write(filePath1, testData1, {
    ContentType: "video/webm",
  })
  assert.equal(metadata1.Url, filePath1)
  assert.equal(metadata1.ContentType, "video/webm")
  assert.equal(metadata1.ContentLength, testData1ContentLength)

  const data1 = await fileClient.read(filePath1)
  assert.equal(data1.ContentType, "video/webm")
  assert.equal(data1.ContentLength, testData1ContentLength)
  const retrievedData1 = await Readable.Buffer(data1.FileStream)
  assert.equal(retrievedData1.length, testData1ContentLength)

  const didDelete1 = await fileClient.delete(filePath1)
  assert.strictEqual(didDelete1, true)

  const didDelete2 = await fileClient.delete(filePath1)
  assert.strictEqual(didDelete2, false)
  
  fileServer.close()
}

async function test1() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
    await fs.promises.rm(`${__dirname}/file-root`, { recursive: true })
  } catch {
  }

  const fileServer = new FileServer({
    dir: `${__dirname}/file-root/test-dir`,
    databasePath: `${__dirname}/database`,
  })
  await fileServer.init()

  fileServer.listen(7357)

  const fileClient = new FileClient({
    serverUrl: 'localhost:7357',
  })

  const filePath1 = "/media/magnet-field.jpg"
  const testData1 = fs.createReadStream(`${__dirname}/test-data/magnet-field.jpg`)

  let testData1ContentLength = 0
  testData1.on("data", chunk => {
    testData1ContentLength += chunk.length
  })

  const metadata1 = await fileClient.write(filePath1, testData1, {
    ContentType: "image/jpeg",
  })
  assert.equal(metadata1.Url, filePath1)
  assert.equal(metadata1.ContentType, "image/jpeg")
  assert.equal(metadata1.ContentLength, testData1ContentLength)

  const data1 = await fileClient.read(filePath1)
  assert.equal(data1.ContentType, "image/jpeg")
  assert.equal(data1.ContentLength, testData1ContentLength)
  const retrievedData1 = await Readable.Buffer(data1.FileStream)
  assert.equal(retrievedData1.length, testData1ContentLength)

  const didDelete1 = await fileClient.delete(filePath1)
  assert.strictEqual(didDelete1, true)

  const didDelete2 = await fileClient.delete(filePath1)
  assert.strictEqual(didDelete2, false)

  const filePath2 = "/html/test-1.html"

  const html1 = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
</head>
<body>
</body>
</html>
  `

  const html1CompressedStream = stream.Readable.from([html1]).pipe(zlib.createGzip())
  let html1CompressedContentLength = 0
  html1CompressedStream.on("data", chunk => {
    html1CompressedContentLength += Buffer.byteLength(chunk)
  })

  const metadata2 = await fileClient.write(filePath2, html1CompressedStream, {
    ContentType: "text/html",
    ContentEncoding: "gzip",
  })

  assert.equal(metadata2.Url, filePath2)
  assert.equal(metadata2.ContentLength, html1CompressedContentLength)
  assert.equal(metadata2.ContentEncoding, "gzip")
  assert.equal(metadata2.ContentType, "text/html")

  const data2 = await fileClient.read(filePath2)
  assert.equal(data2.ContentLength, html1CompressedContentLength)
  assert.equal(data2.ContentType, "text/html")
  assert.equal(data2.ContentEncoding, "gzip")
  const text6 = await Readable.Text(data2.FileStream.pipe(zlib.createGunzip()))
  assert.equal(html1, text6)

  assert.strictEqual(await fileClient.read("/assets/not-found"), undefined)
  
  fileServer.close()
}

async function test2() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
    await fs.promises.rm(`${__dirname}/file-root`, { recursive: true })
  } catch {
  }

  const fileServer = http.createServer((request, response) => {
    response.writeHead(500, {
      "Content-Type": "text/plain",
    })
    response.end("Internal Server Error")
  })

  fileServer.listen(7358)

  const fileClient = new FileClient({
    serverUrl: 'localhost:7358',
  })

  await assert.rejects(
    () => fileClient.write("/a", "1"),
    new Error("Internal Server Error")
  )

  await assert.rejects(
    () => fileClient.read("/a"),
    new Error("Internal Server Error")
  )

  await assert.rejects(
    () => fileClient.delete("/a"),
    new Error("Internal Server Error")
  )

  fileServer.close()
}

async function test() {
  await test0()
  await test1()
  await test2()
  console.log("Success")
}

if (process.argv[1] == __filename) {
  process.env.NODE_ENV = "test"
  test()
}

module.exports = test
