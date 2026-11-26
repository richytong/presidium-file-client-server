const parseRange = require("./parseRange")

/**
 * @name ResponseHeaders
 *
 * @docs
 * ```specscript
 * ResponseHeaders(
 *   metadata { ContentLength: number, ContentType: string },
 *   cors boolean|string,
 *   range string,
 *   defaultRangeLength number
 * ) -> responseHeaders {
 *   "Content-Length": number,
 *   "Content-Type": string,
 *   "Accept-Ranges": "bytes",
 *   "Content-Encoding": string,
 *   "Content-Range": string,
 * }
 * ```
 */
function ResponseHeaders(metadata, cors, range, defaultRangeLength) {
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
    if (!/bytes=\d+-\d*/.test(range)) {
      const error = new Error("Bad Request: Invalid range.")
      error.code = 400
      throw error
    }
    const [start, end] = parseRange(
      range, metadata.ContentLength, defaultRangeLength)
    responseHeaders["Content-Range"] =
      `bytes ${start}-${end}/${metadata.ContentLength}`
    responseHeaders["Content-Length"] = end - start + 1
  }

  return responseHeaders
}

module.exports = ResponseHeaders
