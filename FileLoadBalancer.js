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
 *   * `hash` - `function` - a function that resolves the index of the server address to route a request. Defaults to an MD5 hash function.
 *   * `handlers` - `Arguments<HttpHandler>` - HTTP handlers that process the request in order before it is processed by the file load balancer server.
 *
 * Return:
 *   * `server` - [`FileLoadBalancer`](/docs/FileLoadBalancer) - a FileLoadBalancer instance.
 *
 * ```javascript
 * const server = new FileLoadBalancer({
 *   serverAddresses: ["10.0.0.1:8080", "10.0.0.2:8080", "10.0.0.3:8080"],
 * })
 *
 * server.listen(8080, () => {
 *   console.log("File load balancer server listening on port 8080")
 * })
 * ```
 *
 * ## Requesting a file resource from clients
 * Files stored on the file servers load balanced by the file load balancer server can be accessed by clients with a GET request to the file load balancer server at the url of the file.
 *
 * ```html
 * <img src="http://your-file-server-ip:8999/assets/your-image.jpg" alt="">
 *
 * <video src="http://your-file-server-ip:8999/assets/your-media.mp4">
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
   * listen(port number) -> undefined
   * listen(port number, callback function) -> undefined
   * ```
   *
   * Starts the file load balancer server listening on the specified port with an optional callback function.
   *
   * Arguments:
   *   * `port` - `number` - the port on which the file load balancer server will listen.
   *   * `callback` - `function` - a callback function to call once the file load balancer server has started listening.
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
   * Closes the file load balancer server.
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
    this.server.close()
    this.closed = true
  }

}

module.exports = FileLoadBalancer
