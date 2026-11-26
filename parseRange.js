/**
 * @name parseRange
 *
 * @docs
 * ```specscript
 * parseRange(
 *   range string,
 *   contentLength number,
 *   defaultRangeLength number
 * ) -> [start number, end number]
 * ```
 */
function parseRange(range, contentLength, defaultRangeLength) {
  let [start, end] = range.split("=")[1].split("-").map(Number)
  if (end === 0) {
    end = start + defaultRangeLength
  }
  if (end >= contentLength) {
    end = contentLength - 1
  }
  return [start, end]
}

module.exports = parseRange
