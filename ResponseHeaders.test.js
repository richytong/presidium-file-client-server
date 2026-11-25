const assert = require("assert")
const ResponseHeaders = require("./ResponseHeaders")

function test0() {
  const responseHeaders0 = ResponseHeaders({
    ContentType: "text/plain",
    ContentLength: 1024,
  })
  assert.equal(responseHeaders0["Content-Type"], "text/plain")
  assert.equal(responseHeaders0["Content-Length"], 1024)
  assert.equal(responseHeaders0["Accept-Ranges"], "bytes")
  assert.equal(responseHeaders0["Access-Control-Allow-Origin"], null)
  assert.equal(responseHeaders0["Content-Range"], null)

  const responseHeaders1 = ResponseHeaders({
    ContentType: "text/plain",
    ContentLength: 1024,
    ContentEncoding: "compress",
  }, true)
  assert.equal(responseHeaders1["Content-Type"], "text/plain")
  assert.equal(responseHeaders1["Content-Length"], 1024)
  assert.equal(responseHeaders1["Content-Encoding"], "compress")
  assert.equal(responseHeaders1["Accept-Ranges"], "bytes")
  assert.equal(responseHeaders1["Access-Control-Allow-Origin"], "*")
  assert.equal(responseHeaders1["Content-Range"], null)

  const responseHeaders2 = ResponseHeaders({
    ContentType: "text/plain",
    ContentLength: 1024,
  }, "http://localhost:8080")
  assert.equal(responseHeaders2["Content-Type"], "text/plain")
  assert.equal(responseHeaders2["Content-Length"], 1024)
  assert.equal(responseHeaders2["Accept-Ranges"], "bytes")
  assert.equal(responseHeaders2["Access-Control-Allow-Origin"], "http://localhost:8080")
  assert.equal(responseHeaders2["Content-Range"], null)

  const responseHeaders3 = ResponseHeaders({
    ContentType: "video/mp4",
    ContentLength: 1048576,
  }, "http://localhost:8080", "bytes=0-1000", 10000)
  assert.equal(responseHeaders3["Content-Type"], "video/mp4")
  assert.equal(responseHeaders3["Content-Length"], 1000)
  assert.equal(responseHeaders3["Accept-Ranges"], "bytes")
  assert.equal(responseHeaders3["Access-Control-Allow-Origin"], "http://localhost:8080")
  assert.equal(responseHeaders3["Access-Control-Allow-Origin"], "http://localhost:8080")
  assert.equal(responseHeaders3["Content-Range"], "bytes 0-1000/1048576")

  const responseHeaders4 = ResponseHeaders({
    ContentType: "video/mp4",
    ContentLength: 1048576,
  }, "http://localhost:8080", "bytes=0-", 10000)
  assert.equal(responseHeaders4["Content-Type"], "video/mp4")
  assert.equal(responseHeaders4["Content-Length"], 10000)
  assert.equal(responseHeaders4["Accept-Ranges"], "bytes")
  assert.equal(responseHeaders4["Access-Control-Allow-Origin"], "http://localhost:8080")
  assert.equal(responseHeaders4["Access-Control-Allow-Origin"], "http://localhost:8080")
  assert.equal(responseHeaders4["Content-Range"], "bytes 0-10000/1048576")

  const responseHeaders5 = ResponseHeaders({
    ContentType: "video/mp4",
    ContentLength: 1048576,
  }, "http://localhost:8080", "bytes=10000-", 10000)
  assert.equal(responseHeaders5["Content-Type"], "video/mp4")
  assert.equal(responseHeaders5["Content-Length"], 10000)
  assert.equal(responseHeaders5["Accept-Ranges"], "bytes")
  assert.equal(responseHeaders5["Access-Control-Allow-Origin"], "http://localhost:8080")
  assert.equal(responseHeaders5["Access-Control-Allow-Origin"], "http://localhost:8080")
  assert.equal(responseHeaders5["Content-Range"], "bytes 10000-20000/1048576")

  const responseHeaders6 = ResponseHeaders({
    ContentType: "video/mp4",
    ContentLength: 1048576,
  }, "http://localhost:8080", "bytes=1048000-", 10000)
  assert.equal(responseHeaders6["Content-Type"], "video/mp4")
  assert.equal(responseHeaders6["Content-Length"], 576)
  assert.equal(responseHeaders6["Accept-Ranges"], "bytes")
  assert.equal(responseHeaders6["Access-Control-Allow-Origin"], "http://localhost:8080")
  assert.equal(responseHeaders6["Access-Control-Allow-Origin"], "http://localhost:8080")
  assert.equal(responseHeaders6["Content-Range"], "bytes 1048000-1048576/1048576")

  assert.throws(() => {
    ResponseHeaders({
      ContentType: "video/mp4",
      ContentLength: 1048576,
    }, "http://localhost:8080", "x=0-1000")
  }, { name: "Error", message: "Bad Request: Invalid range.", code: 400 })

  assert.throws(() => {
    ResponseHeaders({
      ContentType: "video/mp4",
      ContentLength: 1048576,
    }, "http://localhost:8080", "bytes=-1-1000")
  }, { name: "Error", message: "Bad Request: Invalid range.", code: 400 })

  assert.throws(() => {
    ResponseHeaders({
      ContentType: "video/mp4",
      ContentLength: 1048576,
    }, "http://localhost:8080", "bytes=1048000-1049000")
  }, { name: "Error", message: "Bad Request: Invalid range.", code: 400 })
}

function test() {
  test0()
  console.log("Success")
}

if (process.argv[1] == __filename) {
  test()
}

module.exports = test
