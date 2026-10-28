/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

/**
 * @name healthCheckHandler
 *
 * @docs
 * ```coffeescript [specscript]
 * module http "https://nodejs.org/api/http.html"
 *
 * healthCheckHandler(
 *   request http.ClientRequest,
 *   response http.ServerResponse
 * ) -> undefined
 * ```
 */
function healthCheckHandler(request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/plain',
  })
  response.end('OK')
}

module.exports = healthCheckHandler
