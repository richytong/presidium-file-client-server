require("rubico/global")
const fs = require("fs")
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

  const metadataJson = await this.metadataHt.get(filePath)
  if (metadataJson == null) {
    return notFoundHandler(request, response)
  }
  const metadata = JSON.parse(metadataJson)

  const responseHeaders = {
    "Content-Length": metadata.ContentLength,
    "Content-Type": metadata.ContentType,
  }
  if (metadata.ContentEncoding) {
    responseHeaders["Content-Encoding"] = metadata.ContentEncoding
  }

  const fileReadStream = fs.createReadStream(filePath)
  response.writeHead(200, responseHeaders)
  fileReadStream.pipe(response)
  fileReadStream.on("end", thunkify.call(response.end, response))
}

module.exports = readFileHandler
