/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const fs = require("fs")
const { access, open } = require("fs/promises")
const os = { path: require("path") }
const notFoundHandler = require("./notFoundHandler")

/**
 * @name readFileHandler
 *
 * @docs
 * ```specscript
 * module http "https://nodejs.org/api/http.html"
 *
 * readFileHandler(request http.ClientRequest, response http.ServerResponse) -> Promise<>
 * ```
 */
async function readFileHandler(request, response) {
  const relativeFilePath = request.pathSegments.join("/")
  const filePath = os.path.join(this.dir, relativeFilePath)

  try {
    await access(filePath)
  } catch {
    return notFoundHandler(request, response)
  }

  const fileHandle = await open(filePath)
  const stats = await fileHandle.stat()

  let metadataBuffer = Buffer.alloc(0)
  {
    let buffer = Buffer.alloc(64)
    while (!buffer.includes(this.delimiter)) {
      let position = stats.size - metadataBuffer.length - buffer.length
      if (position < 0) {
        buffer = Buffer.alloc(stats.size - metadataBuffer.length)
        position = 0
      }
      await fileHandle.read(buffer, {
        offset: 0,
        length: buffer.length,
        position,
      })
      metadataBuffer = Buffer.concat([buffer, metadataBuffer])
    }
    metadataBuffer =
      metadataBuffer.slice(metadataBuffer.indexOf(this.delimiter) + 1, metadataBuffer.length)
  }

  const metadata = JSON.parse(metadataBuffer.toString("utf8"))

  await fileHandle.close()

  const responseHeaders = {
    "Content-Length": metadata.ContentLength,
    "Content-Type": metadata.ContentType,
    ...this.cors === true ? {
      'Access-Control-Allow-Origin': '*',
    } : this.cors ? {
      'Access-Control-Allow-Origin': this.cors,
    } : {},
  }
  if (metadata.ContentEncoding) {
    responseHeaders["Content-Encoding"] = metadata.ContentEncoding
  }

  const fileReadStream = fs.createReadStream(filePath, {
    start: 0,
    end: stats.size - metadataBuffer.length,
  })
  response.writeHead(200, responseHeaders)
  fileReadStream.pipe(response)
  fileReadStream.on("end", thunkify.call(response.end, response))
}

module.exports = readFileHandler
