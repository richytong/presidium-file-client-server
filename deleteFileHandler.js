/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const { access, rm } = require("fs/promises")
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

  try {
    await access(filePath)
  } catch {
    return notFoundHandler(request, response)
  }

  await rm(filePath)

  response.writeHead(200, {
    "Content-Type": "text/plain",
  })
  response.end("OK")
}

module.exports = deleteFileHandler
