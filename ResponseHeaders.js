/**
 * @name ResponseHeaders
 *
 * @docs
 * ```specscript
 * ResponseHeaders(metadata {
 *   ContentLength: number,
 *   ContentType: string,
 * }, cors boolean|string, range string)
 * ```
 */
function ResponseHeaders(metadata, cors = false, range) {
  const responseHeaders = {
    "Content-Length": metadata.ContentLength,
    "Content-Type": metadata.ContentType,
    "Accept-Ranges": "bytes",
  }

  if (cors === true) {
    responseHeaders["Access-Control-Allow-Origin"] = "*"
  } else if (cors) {
    responseHeaders["Access-Control-Allow-Origin"] = cors
  }

  if (metadata.ContentEncoding) {
    responseHeaders["Content-Encoding"] = metadata.ContentEncoding
  }

  if (range) {
    if (!/bytes=\d+-\d+/.test(range)) {
      const error = new Error("Bad Request: Invalid range.")
      error.code = 400
      throw error
    }
    const [start, end] = range.split("=")[1].split("-").map(Number)
    if (end > metadata.ContentLength) {
      const error = new Error("Bad Request: Invalid range.")
      error.code = 400
      throw error
    }
    responseHeaders["Content-Range"] =
      `bytes ${start}-${end}/${metadata.ContentLength}`
    responseHeaders["Content-Length"] = end - start
  }

  return responseHeaders
}

module.exports = ResponseHeaders
