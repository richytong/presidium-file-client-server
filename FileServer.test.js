require("rubico/global")
const assert = require("assert")
const HTTP = require("presidium/HTTP")
const Readable = require("presidium/Readable")
const fs = require("fs")
const stream = require("stream")
const zlib = require("zlib")
const FileServer = require("./FileServer")

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

  const http = new HTTP("localhost:7357")

  const response1 = await http.GET("/health")
  assert.equal(response1.status, 200)
  const text1 = await Readable.Text(response1)
  assert.equal(text1, "OK")

  const response2 = await http.OPTIONS("/")
  assert.equal(response2.status, 204)
  const text2 = await Readable.Text(response2)
  assert.equal(text2, "")

  const filePath1 = "/media/test-1.mp4"
  const testBuffer1 = Buffer.from([1, 2, 3])

  const response3 = await http.PUT(`/${filePath1}`, {
    body: testBuffer1,
  })
  assert.equal(response3.status, 200)
  const data3 = await Readable.JSON(response3)
  assert.equal(data3.Url, filePath1)
  assert.equal(data3.ContentType, "application/octet-stream")
  assert.equal(data3.ContentLength, Buffer.byteLength(testBuffer1))

  {
    const response = await http.HEAD(`/${filePath1}`)
    assert.equal(response.status, 200)
    assert.equal(response.headers["content-type"], "application/octet-stream")
    assert.equal(response.headers["content-length"], Buffer.byteLength(testBuffer1))
    assert.equal(response.headers["access-control-allow-origin"], null)
    assert.equal(response.headers["accept-ranges"], "bytes")
    const message = await Readable.Text(response)
    assert.equal(message.length, 0)
  }

  const response4 = await http.GET(`/${filePath1}`)
  assert.equal(response4.status, 200)
  assert.equal(response4.headers["content-type"], "application/octet-stream")
  assert.equal(response4.headers["content-length"], Buffer.byteLength(testBuffer1))
  assert.equal(response4.headers["access-control-allow-origin"], null)
  assert.equal(response4.headers["accept-ranges"], "bytes")
  const data4 = await Readable.Buffer(response4)
  assert(testBuffer1.equals(data4))

  const response41 = await http.DELETE(`/${filePath1}`)
  assert.equal(response41.status, 200)
  const message41 = await Readable.Text(response41)
  assert.equal(message41, "OK")

  const response42 = await http.DELETE(`/${filePath1}`)
  assert.equal(response42.status, 404)
  const message42 = await Readable.Text(response42)
  assert.equal(message42, "Not Found")

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

  const response5 = await http.PUT(`/${filePath2}`, {
    headers: {
      "Content-Type": "text/html",
      "Content-Encoding": "gzip",
    },
    body: stream.Readable.from([html1]).pipe(zlib.createGzip()),
  })
  assert.equal(response5.status, 200)
  const data5 = await Readable.JSON(response5)
  assert.equal(data5.Url, filePath2)
  assert.equal(data5.ContentLength, html1CompressedContentLength)
  assert.equal(data5.ContentEncoding, "gzip")
  assert.equal(data5.ContentType, "text/html")

  const response6 = await http.GET(`/${filePath2}`)
  assert.equal(response6.status, 200)
  assert.equal(response6.headers["content-type"], "text/html")
  assert.equal(response6.headers["content-encoding"], "gzip")
  assert.equal(response6.headers["content-length"], html1CompressedContentLength)
  const text6 = await Readable.Text(response6.pipe(zlib.createGunzip()))
  assert.equal(html1, text6)

  const response7 = await http.GET("/assets/not-found")
  assert.equal(response7.status, 404)
  const text7 = await Readable.Text(response7)
  assert.equal(text7, "Not Found")

  const response8 = await http.GET("/x/not-found")
  assert.equal(response8.status, 404)
  const text8 = await Readable.Text(response8)
  assert.equal(text8, "Not Found")

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
    cors: true,
  })
  await fileServer.init()

  fileServer.listen(7358)

  const http = new HTTP("localhost:7358")

  const response1 = await http.GET("/health")
  assert.equal(response1.status, 200)
  const text1 = await Readable.Text(response1)
  assert.equal(text1, "OK")

  const response2 = await http.OPTIONS("/")
  assert.equal(response2.status, 204)
  const text2 = await Readable.Text(response2)
  assert.equal(text2, "")

  const filePath1 = "/media/test-1.webm"
  const testData1 = fs.createReadStream(`${__dirname}/test-data/sample-vertical-5s.webm`)

  let testData1ContentLength = 0
  testData1.on("data", chunk => {
    testData1ContentLength += chunk.length
  })

  const response3 = await http.PUT(`/${filePath1}`, {
    headers: {
      "Content-Type": "video/webm",
    },
    body: testData1,
  })
  assert.equal(response3.status, 200)
  const data3 = await Readable.JSON(response3)
  assert.equal(data3.Url, filePath1)
  assert.equal(data3.ContentType, "video/webm")
  assert.equal(data3.ContentLength, testData1ContentLength)

  {
    const response = await http.HEAD(`/${filePath1}`)
    assert.equal(response.status, 200)
    assert.equal(response.headers["content-type"], "video/webm")
    assert.equal(response.headers["content-length"], testData1ContentLength)
    assert.equal(response.headers["access-control-allow-origin"], "*")
    assert.equal(response.headers["accept-ranges"], "bytes")
    assert.equal(response.headers["content-range"], null)
    const message = await Readable.Text(response)
    assert.equal(message.length, 0)
  }

  const response4 = await http.GET(`/${filePath1}`)
  assert.equal(response4.status, 200)
  assert.equal(response4.headers["content-type"], "video/webm")
  assert.equal(response4.headers["content-length"], testData1ContentLength)
  assert.equal(response4.headers["access-control-allow-origin"], "*")
  assert.equal(response4.headers["accept-ranges"], "bytes")
  assert.equal(response4.headers["content-range"], null)
  const retrievedData1 = await Readable.Buffer(response4)
  assert.equal(retrievedData1.length, testData1ContentLength)

  {
    const response = await http.GET(`/${filePath1}`, {
      headers: {
        "Range": "bytes=0-1000",
      },
    })
    assert.equal(response.status, 206)
    assert.equal(response.headers["content-type"], "video/webm")
    assert.equal(response.headers["content-length"], "1000")
    assert.equal(response.headers["access-control-allow-origin"], "*")
    assert.equal(response.headers["accept-ranges"], "bytes")
    assert.equal(response.headers["content-range"], `bytes 0-1000/${testData1ContentLength}`)
    const retrievedData = await Readable.Buffer(response)
    assert.equal(retrievedData.length, 1000)
  }

  {
    const response = await http.GET(`/${filePath1}`, {
      headers: {
        "Range": "bytes=0-",
      },
    })
    assert.equal(response.status, 206)
    assert.equal(response.headers["content-type"], "video/webm")
    assert.equal(response.headers["content-length"], `${testData1ContentLength}`)
    assert.equal(response.headers["access-control-allow-origin"], "*")
    assert.equal(response.headers["accept-ranges"], "bytes")
    assert.equal(response.headers["content-range"], `bytes 0-${testData1ContentLength}/${testData1ContentLength}`)
    const retrievedData = await Readable.Buffer(response)
    assert.equal(retrievedData.length, testData1ContentLength)
  }

  const response41 = await http.DELETE(`/${filePath1}`)
  assert.equal(response41.status, 200)
  const message41 = await Readable.Text(response41)
  assert.equal(message41, "OK")

  const response42 = await http.DELETE(`/${filePath1}`)
  assert.equal(response42.status, 404)
  const message42 = await Readable.Text(response42)
  assert.equal(message42, "Not Found")

  fileServer.close()
}

async function test2() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
    await fs.promises.rm(`${__dirname}/file-root`, { recursive: true })
  } catch {
  }

  const fileServer = new FileServer({
    dir: `${__dirname}/file-root/test-dir`,
    databasePath: `${__dirname}/database`,
    cors: true,
    defaultRangeEnd: 5000,
  })
  await fileServer.init()

  fileServer.listen(7359)

  const http = new HTTP("localhost:7359")

  const response1 = await http.GET("/health")
  assert.equal(response1.status, 200)
  const text1 = await Readable.Text(response1)
  assert.equal(text1, "OK")

  const response2 = await http.OPTIONS("/")
  assert.equal(response2.status, 204)
  const text2 = await Readable.Text(response2)
  assert.equal(text2, "")

  const filePath1 = "/media/test-1.webm"
  const testData1 = fs.createReadStream(`${__dirname}/test-data/sample-vertical-5s.webm`)

  let testData1ContentLength = 0
  testData1.on("data", chunk => {
    testData1ContentLength += chunk.length
  })

  const response3 = await http.PUT(`/${filePath1}`, {
    headers: {
      "Content-Type": "video/webm",
    },
    body: testData1,
  })
  assert.equal(response3.status, 200)
  const data3 = await Readable.JSON(response3)
  assert.equal(data3.Url, filePath1)
  assert.equal(data3.ContentType, "video/webm")
  assert.equal(data3.ContentLength, testData1ContentLength)

  {
    const response = await http.HEAD(`/${filePath1}`)
    assert.equal(response.status, 200)
    assert.equal(response.headers["content-type"], "video/webm")
    assert.equal(response.headers["content-length"], testData1ContentLength)
    assert.equal(response.headers["access-control-allow-origin"], "*")
    assert.equal(response.headers["accept-ranges"], "bytes")
    assert.equal(response.headers["content-range"], null)
    const message = await Readable.Text(response)
    assert.equal(message.length, 0)
  }

  const response4 = await http.GET(`/${filePath1}`)
  assert.equal(response4.status, 200)
  assert.equal(response4.headers["content-type"], "video/webm")
  assert.equal(response4.headers["content-length"], testData1ContentLength)
  assert.equal(response4.headers["access-control-allow-origin"], "*")
  assert.equal(response4.headers["accept-ranges"], "bytes")
  assert.equal(response4.headers["content-range"], null)
  const retrievedData1 = await Readable.Buffer(response4)
  assert.equal(retrievedData1.length, testData1ContentLength)

  {
    const response = await http.GET(`/${filePath1}`, {
      headers: {
        "Range": "bytes=0-1000",
      },
    })
    assert.equal(response.status, 206)
    assert.equal(response.headers["content-type"], "video/webm")
    assert.equal(response.headers["content-length"], "1000")
    assert.equal(response.headers["access-control-allow-origin"], "*")
    assert.equal(response.headers["accept-ranges"], "bytes")
    assert.equal(response.headers["content-range"], `bytes 0-1000/${testData1ContentLength}`)
    const retrievedData = await Readable.Buffer(response)
    assert.equal(retrievedData.length, 1000)
  }

  {
    const response = await http.GET(`/${filePath1}`, {
      headers: {
        "Range": "bytes=0-",
      },
    })
    assert.equal(response.status, 206)
    assert.equal(response.headers["content-type"], "video/webm")
    assert.equal(response.headers["content-length"], "5000")
    assert.equal(response.headers["access-control-allow-origin"], "*")
    assert.equal(response.headers["accept-ranges"], "bytes")
    assert.equal(response.headers["content-range"], `bytes 0-5000/${testData1ContentLength}`)
    const retrievedData = await Readable.Buffer(response)
    assert.equal(retrievedData.length, 5000)
  }

  {
    const response = await http.GET(`/${filePath1}`, {
      headers: {
        "Range": "bytes=3333-",
      },
    })
    assert.equal(response.status, 206)
    assert.equal(response.headers["content-type"], "video/webm")
    assert.equal(response.headers["content-length"], "5000")
    assert.equal(response.headers["access-control-allow-origin"], "*")
    assert.equal(response.headers["accept-ranges"], "bytes")
    assert.equal(response.headers["content-range"], `bytes 3333-8333/${testData1ContentLength}`)
    const retrievedData = await Readable.Buffer(response)
    assert.equal(retrievedData.length, 5000)
  }

  const response41 = await http.DELETE(`/${filePath1}`)
  assert.equal(response41.status, 200)
  const message41 = await Readable.Text(response41)
  assert.equal(message41, "OK")

  const response42 = await http.DELETE(`/${filePath1}`)
  assert.equal(response42.status, 404)
  const message42 = await Readable.Text(response42)
  assert.equal(message42, "Not Found")

  fileServer.close()
}

async function test3() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
    await fs.promises.rm(`${__dirname}/file-root`, { recursive: true })
  } catch {
  }

  const fileServer = new FileServer({
    dir: `${__dirname}/file-root/test-dir`,
    databasePath: `${__dirname}/database`,
    cors: "localhost",
  })
  await fileServer.init()

  fileServer.listen(7360)

  const http = new HTTP("localhost:7360")

  const response1 = await http.GET("/health")
  assert.equal(response1.status, 200)
  const text1 = await Readable.Text(response1)
  assert.equal(text1, "OK")

  const response2 = await http.OPTIONS("/")
  assert.equal(response2.status, 204)
  const text2 = await Readable.Text(response2)
  assert.equal(text2, "")

  const filePath1 = "/media/magnet-field.jpg"
  const testData1 = fs.createReadStream(`${__dirname}/test-data/magnet-field.jpg`)

  let testData1ContentLength = 0
  testData1.on("data", chunk => {
    testData1ContentLength += chunk.length
  })

  const response3 = await http.PUT(`/${filePath1}`, {
    headers: {
      "Content-Type": "image/jpeg",
    },
    body: testData1,
  })
  assert.equal(response3.status, 200)
  const data3 = await Readable.JSON(response3)
  assert.equal(data3.Url, filePath1)
  assert.equal(data3.ContentType, "image/jpeg")
  assert.equal(data3.ContentLength, testData1ContentLength)

  {
    const response = await http.HEAD(`/${filePath1}`)
    assert.equal(response.status, 200)
    assert.equal(response.headers["content-type"], "image/jpeg")
    assert.equal(response.headers["content-length"], testData1ContentLength)
    assert.equal(response.headers["access-control-allow-origin"], "localhost")
    assert.equal(response.headers["accept-ranges"], "bytes")
    const message = await Readable.Text(response)
    assert.equal(message.length, 0)
  }

  const response4 = await http.GET(`/${filePath1}`)
  assert.equal(response4.status, 200)
  assert.equal(response4.headers["content-type"], "image/jpeg")
  assert.equal(response4.headers["content-length"], testData1ContentLength)
  assert.equal(response4.headers["access-control-allow-origin"], "localhost")
  assert.equal(response4.headers["accept-ranges"], "bytes")
  const retrievedData1 = await Readable.Buffer(response4)
  assert.equal(retrievedData1.length, testData1ContentLength)

  const response41 = await http.DELETE(`/${filePath1}`)
  assert.equal(response41.status, 200)
  const message41 = await Readable.Text(response41)
  assert.equal(message41, "OK")

  const response42 = await http.DELETE(`/${filePath1}`)
  assert.equal(response42.status, 404)
  const message42 = await Readable.Text(response42)
  assert.equal(message42, "Not Found")

  fileServer.close()
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
