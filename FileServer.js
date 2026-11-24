/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const http = require("http")
const DiskHashTable = require("presidium/DiskHashTable")
const healthCheckHandler = require("./healthCheckHandler")
const optionsHandler = require("./optionsHandler")
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
 * type HttpHandler(request http.ClientRequest, response http.ServerResponse) -> ()
 *
 * new FileServer(options {
 *   dir: string,
 *   cors: boolean,
 *   delimiter: string,
 * }, ...handlers Array<HttpHandler>) -> FileServer
 * ```
 */
class FileServer {
  constructor(options, ...handlers) {
    this.dir = options.dir
    this.cors = options.cors
    this.delimiter = options.delimiter ?? ""
    this.handlers = handlers

    const router = tryCatch(switchCase(
      request => request.path == "/health",
      healthCheckHandler,

      request => request.method == "OPTIONS",
      optionsHandler,

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

  async init() {
  }

  /**
   * @name listen
   *
   * @docs
   * ```specscript
   * listen(port number) -> ()
   * listen(port number, callback function) -> ()
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
   * close() -> ()
   * ```
   */
  close() {
    this.server.close()
  }
}

module.exports = FileServer
