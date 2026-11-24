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
 * type HttpHandler(http.ClientRequest, http.ServerResponse) -> Promise<>|undefined
 *
 * new FileLoadBalancer(options {
 *   serverAddresses: Array<string>|Array<Array<string>>,
 * }, ...handlers Arguments<HttpHandler>) -> FileLoadBalancer
 *
 * hash(fileUrl string, serverAddressesLength number) -> serverIndex Promise|number
 *
 * new FileLoadBalancer(hash, options {
 *   serverAddresses: Array<string>|Array<Array<string>>,
 * }, ...handlers Arguments<HttpHandler>) -> FileLoadBalancer
 * ```
 *
 * Presidium FileLoadBalancer class. Creates a file load balancer server.
 *
 * Arguments:
 *   * `options`
 *     * `serverAddresses` - `Array<string>|Array<Array<string>>` - the server addresses to load balance. An array of arrays of server addresses means the request data should be replicated across the array of server addresses indicated by the hash function.
 *
 * Return:
 *   * `server` - [`DatabaseLoadBalancer`](/docs/DatabaseLoadBalancer) - a DatabaseLoadBalancer instance.
 *
 * ```javascript
 * const server = new DatabaseLoadBalancer({
 *   serverAddresses: ["10.0.0.1:8080", "10.0.0.2:8080", "10.0.0.3:8080"],
 * })
 *
 * server.listen(8080, () => {
 *   console.log("Database load balancer server listening on port 8080")
 * })
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
    this.serverAddresses = options.serverAddresses ?? options.serverIps
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
