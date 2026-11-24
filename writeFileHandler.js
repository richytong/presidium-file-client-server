/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

const fs = require("fs")
const { mkdir } = require("fs/promises")
const os = { path: require("path") }

/**
 * @name writeFileHandler
 *
 * @docs
 * ```specscript
 * module http "https://nodejs.org/api/http.html"
 *
 * writeFileHandler(request http.ClientRequest, response http.ServerResponse) -> Promise<>
 * ```
 */
async function writeFileHandler(request, response) {
  const relativeFilePath = request.pathSegments.join("/")
  const filePath = os.path.join(this.dir, relativeFilePath)

  const fileDir = filePath.split("/").slice(0, -1).join("/")
  await mkdir(fileDir, { recursive: true })
  const fileWriteStream = fs.createWriteStream(filePath)

  let contentLength = 0
  request.on("data", chunk => {
    contentLength += Buffer.byteLength(chunk)
    fileWriteStream.write(chunk)
  })

  await new Promise(resolve => {
    request.on("end", resolve)
  })

  const metadata = {
    Url: "/" + relativeFilePath,
    ContentLength: contentLength,
  }
  if (request.headers["content-type"]) {
    metadata.ContentType = request.headers["content-type"]
  } else {
    metadata.ContentType = "application/octet-stream"
  }
  if (request.headers["content-encoding"]) {
    metadata.ContentEncoding = request.headers["content-encoding"]
  }

  const metadataJson = JSON.stringify(metadata)
  fileWriteStream.write(Buffer.from(this.delimiter, "utf8"))
  fileWriteStream.write(Buffer.from(metadataJson, "utf8"))
  fileWriteStream.end()

  await new Promise((resolve, reject) => {
    fileWriteStream.on("finish", resolve)
    fileWriteStream.on("error", reject)
  })

  response.writeHead(200, {
    "Content-Type": "application/json",
  })
  response.end(metadataJson)
}

module.exports = writeFileHandler
