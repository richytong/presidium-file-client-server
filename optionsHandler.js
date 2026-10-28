/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

/**
 * @name optionsHandler
 *
 * @docs
 * ```coffeescript [specscript]
 * module http "https://nodejs.org/api/http.html"
 *
 * optionsHandler(
 *   request http.ClientRequest,
 *   response http.ServerResponse
 * ) -> undefined
 * ```
 */
function optionsHandler(request, response) {
  response.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  })
  response.end()
}

module.exports = optionsHandler
