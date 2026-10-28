const crypto = require("crypto")

function hash(filePath, length) {
  const digest = crypto.createHash("md5").update(filePath).digest()
  const integerHash = digest.readUInt16BE(0)
  const index = Math.floor(integerHash / 65535 * length)
  return index
}

module.exports = hash
