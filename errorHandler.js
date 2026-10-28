/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

/**
 * @name errorHandler
 *
 * @docs
 * ```coffeescript [specscript]
 * module http "https://nodejs.org/api/http.html"
 *
 * errorHandler(
 *   error Error,
 *   request http.ClientRequest,
 *   response http.ServerResponse
 * ) -> undefined
 * ```
 */
function errorHandler(error, request, response) {
  if (typeof error.code != 'number') {
    error.code = 500
  }
  response.writeHead(error.code, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/plain',
  })
  response.end("Internal Server Error")
}

module.exports = errorHandler
