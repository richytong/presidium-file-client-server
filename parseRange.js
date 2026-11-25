/**
 * @name parseRange
 *
 * @docs
 * ```specscript
 * parseRange(
 *   range string,
 *   contentLength number,
 *   defaultRangeEnd number
 * ) -> [start number, end number]
 * ```
 */
function parseRange(range, contentLength, defaultRangeEnd) {
  let [start, end] = range.split("=")[1].split("-").map(Number)
  if (end === 0) {
    end = Math.min(contentLength, defaultRangeEnd)
  }
  return [start, end]
}

module.exports = parseRange
