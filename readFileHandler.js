/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const fs = require("fs")
const os = { path: require("path") }
const ResponseHeaders = require("./ResponseHeaders")
const notFoundHandler = require("./notFoundHandler")
const parseRange = require("./parseRange")

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

  const metadataJson = await this.metadataHt.get(filePath)
  if (metadataJson == null) {
    return notFoundHandler(request, response)
  }
  const metadata = JSON.parse(metadataJson)

  const responseHeaders = ResponseHeaders(
    metadata, this.cors, request.headers["range"], this.defaultRangeEnd)

  if (responseHeaders["Content-Range"]) {
    const [start, end] = parseRange(
      request.headers["range"], metadata.ContentLength, this.defaultRangeEnd)
    const fileReadStream = fs.createReadStream(filePath, { start, end })
    response.writeHead(200, responseHeaders)
    fileReadStream.pipe(response)
    fileReadStream.on("end", thunkify.call(response.end, response))
  } else {
    const fileReadStream = fs.createReadStream(filePath)
    response.writeHead(200, responseHeaders)
    fileReadStream.pipe(response)
    fileReadStream.on("end", thunkify.call(response.end, response))
  }
}

module.exports = readFileHandler
