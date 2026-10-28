const assert = require("assert")
const hash = require("./hash")

async function test0() {
  const index = hash("/a", 2)
  assert.equal(typeof index, "number")
  assert(index === 1 || index === 0)
}

async function test() {
  await test0()
  console.log("Success")
}

if (process.argv[1] == __filename) {
  test()
}

module.exports = test
