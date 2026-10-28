require("rubico/global")
const fs = require("fs")
const os = { path: require("path") }
const notFoundHandler = require("./notFoundHandler")

/**
 * @name deleteFileHandler
 *
 * @docs
 * ```specscript
 * module http "https://nodejs.org/api/http.html"
 *
 * deleteFileHandler(request http.ClientRequest, response http.ServerResponse) -> Promise<>
 * ```
 */
async function deleteFileHandler(request, response) {
  const relativeFilePath = request.pathSegments.join("/")
  const filePath = os.path.join(this.dir, relativeFilePath)

  const metadataJson = await this.metadataHt.get(filePath)
  if (metadataJson == null) {
    return notFoundHandler(request, response)
  }

  await this.metadataHt.delete(filePath)
  await fs.promises.rm(filePath)

  response.writeHead(200, {
    "Content-Type": "text/plain",
  })
  response.end("OK")
}

module.exports = deleteFileHandler
