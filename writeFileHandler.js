const fs = require("fs")
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
  await fs.promises.mkdir(fileDir, { recursive: true })
  const fileWriteStream = fs.createWriteStream(filePath)

  let contentLength = 0
  request.pipe(fileWriteStream)
  request.on("data", chunk => {
    contentLength += Buffer.byteLength(chunk)
  })

  await new Promise((resolve, reject) => {
    fileWriteStream.on("finish", resolve)
    fileWriteStream.on("error", reject)
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
  await this.metadataHt.set(filePath, metadataJson)

  response.writeHead(200, {
    "Content-Type": "application/json",
  })
  response.end(metadataJson)
}

module.exports = writeFileHandler
