const fs = require("fs")
const assert = require("assert")
const package = require("./package")

async function moduleTest() {
  try {
    await fs.promises.rm(`${__dirname}/tmp`, { recursive: true })
  } catch {
  }

  assert(package.files.includes("FileLoadBalancer.js"))
  assert(package.files.includes("FileServer.js"))
  assert(package.files.includes("FileClient.js"))

  const tmp = await fs.promises.mkdir(`${__dirname}/tmp`)
  for (const filename of package.files) {
    await fs.promises.writeFile(
      `${__dirname}/tmp/${filename}`,
      await fs.promises.readFile(`${__dirname}/${filename}`)
    )
  }
  for (const filename of package.files) {
    require(`./tmp/${filename}`)
  }
  await fs.promises.rm(`${__dirname}/tmp`, { recursive: true })
  console.log("Success")
}

moduleTest()
