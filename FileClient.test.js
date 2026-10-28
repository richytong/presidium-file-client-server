const assert = require("assert")
const stream = require("stream")
const zlib = require("zlib")
const Readable = require("presidium/Readable")
const FileServer = require("./FileServer")
const FileClient = require("./FileClient")

async function test0() {
  const fileServer = new FileServer({
    dir: `${__dirname}/file-root/test-dir`,
    metadataTableInitialLength: 1048576,
    metadataTableItemSize: 512,
    metadataTableStoragePath: `${__dirname}/database/Metadata/storage`,
    metadataTableHeaderPath: `${__dirname}/database/Metadata/header`,
  })
  await fileServer.init()

  fileServer.listen(7357)

  const fileClient = new FileClient({
    serverUrl: 'localhost:7357',
  })

  const filePath1 = "/media/test-1.mp4"
  const testBuffer1 = Buffer.from([1, 2, 3])

  const metadata1 = await fileClient.write(filePath1, testBuffer1)
  assert.equal(metadata1.Url, filePath1)
  assert.equal(metadata1.ContentType, "application/octet-stream")
  assert.equal(metadata1.ContentLength, Buffer.byteLength(testBuffer1))

  const data1 = await fileClient.read(filePath1)
  assert.equal(data1.ContentType, "application/octet-stream")
  assert.equal(data1.ContentLength, Buffer.byteLength(testBuffer1))
  const fileBuffer1 = await Readable.Buffer(data1.FileStream)
  assert(testBuffer1.equals(fileBuffer1))

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

async function test() {
  await test0()
  console.log("Success")
}

if (process.argv[1] == __filename) {
  process.env.NODE_ENV = "test"
  test()
}

module.exports = test
