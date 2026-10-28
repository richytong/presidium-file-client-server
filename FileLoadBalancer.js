/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const HTTP = require("presidium/HTTP")
const loadBalancerHandler = require("./loadBalancerHandler")
const healthCheckHandler = require("./healthCheckHandler")
const notFoundHandler = require("./notFoundHandler")
const errorHandler = require("./errorHandler")
const defaultHash = require("./hash")

/**
 * @name FileLoadBalancer
 *
 * @docs
 * ```specscript
 * module http "https://nodejs.org/api/http.html"
 *
 * HttpHandler(http.ClientRequest, http.ServerResponse) -> Promise<>|undefined
 *
 * new FileLoadBalancer(options {
 *   serverIps: Array<string>|Array<Array<string>>,
 * }, ...handlers Arguments<HttpHandler>) -> FileLoadBalancer
 *
 * new FileLoadBalancer(
 *   hash(fileUrl string, serverIpsLength number) -> serverIndex Promise|number,
 *   options {
 *     serverIps: Array<string>|Array<Array<string>>,
 *   },
 *   ...handlers Arguments<HttpHandler>
 * ) -> FileLoadBalancer
 * ```
 */
class FileLoadBalancer {
  constructor(hash, options, ...handlers) {
    if (typeof hash == "function") {
      this.hash = hash
    } else {
      this.hash = defaultHash
      handlers.shift(options)
      options = hash
    }
    this.serverIps = options.serverIps
    this.handlers = handlers
    this.clients = new Map()
    this.closed = false

    const router = tryCatch(
      switchCase(
        request => request.path == "/health",
        healthCheckHandler,

        curry.call(loadBalancerHandler, this),
      ),
      errorHandler
    )

    const handler = all.series([
      ...this.handlers,
      request => {
        const { pathname } = new URL(`http://*${request.url}`)
        request.path = decodeURIComponent(
          pathname == "/" ? pathname
          : pathname.endsWith("/") ? pathname.slice(0, -1)
          : pathname
        )
        request.pathSegments = request.path.slice(1).split("/")
        request.pathDepth = request.pathSegments.length
      },
      router,
    ])

    this.server = HTTP.Server(handler)
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
    this.closed = true
  }

}

module.exports = FileLoadBalancer
