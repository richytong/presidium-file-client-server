const os = { path: require("path") }
const ResponseHeaders = require("./ResponseHeaders")

/**
 * @name headFileHandler
 *
 * @docs
 * ```specscript
 * module http "https://nodejs.org/api/http.html"
 *
 * headFileHandler(request http.ClientRequest, response http.ServerResponse) -> Promise<>
 * ```
 */
async function headFileHandler(request, response) {
  const relativeFilePath = request.pathSegments.join("/")
  const filePath = os.path.join(this.dir, relativeFilePath)

  const metadataJson = await this.metadataHt.get(filePath)
  if (metadataJson == null) {
    return notFoundHandler(request, response)
  }
  const metadata = JSON.parse(metadataJson)

  response.writeHead(200, ResponseHeaders(
    metadata, this.cors, request.headers["range"], this.defaultRangeLength))
  response.end()
}

module.exports = headFileHandler
