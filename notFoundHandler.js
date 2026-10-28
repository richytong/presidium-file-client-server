/**
 * @name notFoundHandler
 *
 * @docs
 * ```coffeescript [specscript]
 * module http "https://nodejs.org/api/http.html"
 *
 * notFoundHandler(
 *   request http.ClientRequest,
 *   response http.ServerResponse
 * ) -> undefined
 * ```
 */
function notFoundHandler(request, response) {
  response.writeHead(404, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*",
  })
  response.end("Not Found")
}

module.exports = notFoundHandler
