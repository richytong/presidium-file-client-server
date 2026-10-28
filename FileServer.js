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
 * HttpHandler(request http.ClientRequest, response http.ServerResponse) -> ()
 *
 * FileServer(options {
 *   dir: string,
 *   databasePath: string,
 *   metadataTableInitialLength: number,
 *   metadataTableItemSize: number,
 * }, ...handlers Array<HttpHandler>) -> FileServer
 * ```
 */
class FileServer {
  constructor(options, ...handlers) {
    this.dir = options.dir
    this.databasePath = options.databasePath
    this.metadataTableName = options.manifestTableName ?? "Metadata"
    this.metadataTableInitialLength = options.manifestTableInitialLength ?? 1048576
    this.metadataTableItemSize = options.manifestTableItemSize ?? 1024
    this.handlers = handlers
  }

  /**
   * @name init
   *
   * @docs
   * ```specscript
   * init() -> Promise<>
   * ```
   */
  async init() {
    const metadataHt = new DiskHashTable({
      storagePath: `${this.databasePath}/${this.manifestTableName}/storage`,
      headerPath: `${this.databasePath}/${this.manifestTableName}/header`,
      initialLength: this.metadataTableInitialLength,
      itemSize: this.metadataTableItemSize,
    })
    await metadataHt.init()
    this.metadataHt = metadataHt

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
    this.metadataHt.close()
    this.server.close()
  }
}

module.exports = FileServer
