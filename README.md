# Presidium File Client and Server
![presidium](https://rubico.land/assets/presidium-logo-3-w200.jpg)

Source code: [GitHub](https://github.com/richytong/presidium-file-client-server) |
License: [CFOSS](https://cloutsworld.com/en-us/legal/license/cfoss)

![Node.js CI](https://github.com/richytong/presidium-file-client-server/workflows/Node.js%20CI/badge.svg)
[![codecov](https://codecov.io/gh/richytong/presidium-file-client-server/graph/badge.svg?token=07P6G8GIOQ)](https://codecov.io/gh/richytong/presidium-file-client-server)
[![npm version](https://img.shields.io/npm/v/presidium-file-client-server.svg?style=flat)](https://www.npmjs.com/package/presidium-file-client-server)

Presidium file client and server.

## Host your own file service
```javascript
const FileServer = require("presidium-file-client-server/FileServer")

const fileServer = new FileServer({
  dir: `${__dirname}/files`,
  databasePath: `${__dirname}/database`,
})
await fileServer.init()

fileServer.listen(9000, () => {
  console.log("File server listening on port 9000")
})
```

## Call your file service
```javascript
const DiskHashTableClient = require("presidium-file-client-server/FileClient")

const fileClient = new FileClient({
  serverUrl: "http://localhost:9000",
})

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Page</title>
</head>
<body>
    <h1>My Page</h1>
</body>
</html>
`

await fileClient.write("/public/my-page", html, {
  ContentType: "text/html",
})

const data = await fileClient.read("/public/my-page")
data.FileStream.pipe(process.stdout)
```

## Distribute content from your file service
```javascript
const FileLoadBalancer = require("presidium-file-client-server/FileLoadBalancer")

function hash(filePath, length) {
  const digest = crypto.createHash("md5").update(filePath).digest()
  const integerHash = digest.readUInt16BE(0)
  const index = Math.floor(integerHash / 65535 * length)
  return index
}

const loadBalancer = new DatabaseLoadBalancer(hash, {
  serverIps: ["10.0.0.1:8080", "10.0.0.2:8080"],
})

loadBalancer.listen(6333, () => {
  console.log("Database load balancer listening on port 6333")
})
```

## Installation

with [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm):
```bash
npm i presidium-db-client-server
```

## License
Presidium DB Client and Server is distributed under the [CFOSS License](https://cloutsworld.com/en-us/legal/license/cfoss).

## Support
 * minimum Node.js version: 16
