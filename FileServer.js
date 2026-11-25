/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const http = require("http")
const { statfs } = require("fs/promises")
const DiskHashTable = require("presidium/DiskHashTable")
const healthCheckHandler = require("./healthCheckHandler")
const optionsHandler = require("./optionsHandler")
const headFileHandler = require("./headFileHandler")
const readFileHandler = require("./readFileHandler")
const writeFileHandler = require("./writeFileHandler")
const deleteFileHandler = require("./deleteFileHandler")
const notFoundHandler = require("./notFoundHandler")
const errorHandler = require("./errorHandler")

/**
 * @name FileServer
 *
 * @docs
 * ```specscript
 * module http "https://nodejs.org/api/http.html"
 *
 * type HttpHandler(request http.ClientRequest, response http.ServerResponse) -> undefined
 *
 * new FileServer(options {
 *   dir: string,
 *   cors: boolean|string,
 *   delimiter: string,
 *   defaultRangeEnd: number,
 * }, ...handlers Array<HttpHandler>) -> FileServer
 * ```
 *
 * Presidium FileServer class. Creates a file server.
 *
 * Arguments:
 *   * `options`
 *     * `dir` - `string` - the absolute path on the machine running the file server to the directory of the file server files.
 *     * `cors` - `boolean|string` - whether to enable cross-origin resource sharing for all origins. If this value is a string, the value of the string will be provided as the value of the `Access-Control-Allow-Origin` header on all file resources served by the file server.
 *     * `delimiter` - `string` - a character or string that will separate the file data from the metadata during storage.
 *     * `defaultRangeEnd` - `number` - the default value of the end of the range for range requests. Defaults to 10000000 (10MB).
 *   * `handlers` - `Arguments<HttpHandler>` - HTTP handlers that process the request in order before it is processed by the file server.
 *
 * Return:
 *   * `server` - [`FileServer`](/docs/FileServer) - a FileServer instance.
 *
 * ```javascript
 * const server = new FileServer({
 *   databasePath: `${__dirname}/file`,
 * })
 * await server.init()
 *
 * server.listen(8080, () => {
 *   console.log("File server listening on port 8080")
 * })
 * ```
 *
 * ## Metadata database directory
 * A metadata database directory is created to store metadata about the files. The metadata database directory is always located at `<dir>/__metadata`.
 *
 * ## Requesting a file resource from clients
 * Files stored on the file server can be accessed by clients with a GET request to the file server at the url of the file.
 *
 * ```html
 * <img src="http://your-file-server-ip:8999/assets/your-image.jpg" alt="">
 *
 * <video src="http://your-file-server-ip:8999/assets/your-media.mp4">
 * ```
 */
class FileServer {
  constructor(options, ...handlers) {
    this.dir = options.dir
    this.cors = options.cors
    this.delimiter = options.delimiter ?? ""
    this.handlers = handlers
    this.defaultRangeEnd = options.defaultRangeEnd ?? 10000000

    const router = tryCatch(switchCase(
      request => request.path == "/health",
      healthCheckHandler,

      request => request.method == "OPTIONS",
      optionsHandler,

      request => request.method == "HEAD",
      curry.call(headFileHandler, this, __, __),

      request => request.method == "PUT",
      curry.call(writeFileHandler, this, __, __),

      request => request.method == "GET",
      curry.call(readFileHandler, this, __, __),

      request => request.method == "DELETE",
      curry.call(deleteFileHandler, this, __, __),

      notFoundHandler,
    ), errorHandler)

    const handler = all.series([
      ...this.handlers,
      function prepare(request, response) {
        const { pathname, searchParams } = new URL(`http://*${request.url}`)
        request.path = decodeURIComponent(
          pathname == "/" ? pathname
          : pathname.endsWith("/") ? pathname.slice(0, -1)
          : pathname
        )
        request.pathSegments = request.path.slice(1).split("/")
      },
      router
    ])

    const server = http.createServer(handler)

    this.server = server
  }

  /**
   * @name init
   *
   * @docs
   * ```specscript
   * init() -> Promise<>
   * ```
   *
   * Initializes the file server.
   *
   * Arguments:
   *   * (none)
   *
   * Return:
   *   * Empty promise.
   *
   * ```javascript
   * await server.init()
   * ```
   */
  async init() {
    const stats = await statfs("/")
    const totalBytes = stats.bsize * stats.blocks
    const itemSize = 9216
    const initialLength = Math.floor(totalBytes / itemSize)

    const metadataHt = new DiskHashTable({
      storagePath: `${this.dir}/__metadata/storage`,
      headerPath: `${this.dir}/__metadata/header`,
      initialLength,
      itemSize,
    })
    await metadataHt.init()
    this.metadataHt = metadataHt
  }

  /**
   * @name listen
   *
   * @docs
   * ```specscript
   * listen(port number) -> undefined
   * listen(port number, callback function) -> undefined
   * ```
   *
   * Starts the file server listening on the specified port with an optional callback function.
   *
   * Arguments:
   *   * `port` - `number` - the port on which the file server will listen.
   *   * `callback` - `function` - a callback function to call once the file server has started listening.
   *
   * Return:
   *   * `undefined`
   *
   * ```javascript
   * server.listen(8080)
   * ```
   */
  listen(port, callback) {
    this.server.listen(port, callback)
  }

  /**
   * @name close
   *
   * @docs
   * ```specscript
   * close() -> undefined
   * ```
   *
   * Closes the file server.
   *
   * Arguments:
   *   * (none)
   *
   * Return:
   *   * `undefined`
   *
   * ```javascript
   * server.close()
   * ```
   */
  close() {
    this.metadataHt.close()
    this.server.close()
  }
}

module.exports = FileServer
