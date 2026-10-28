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
const FileClient = require("presidium-file-client-server/FileClient")

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

## Load balance and distribute content from your file service
```javascript
const FileLoadBalancer = require("presidium-file-client-server/FileLoadBalancer")

const loadBalancer = new DatabaseLoadBalancer({
  serverIps: ["10.0.0.1:8080", "10.0.0.2:8080"],
})

loadBalancer.listen(9000, () => {
  console.log("Database load balancer listening on port 9000")
})
```

## Installation

with [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm):
```bash
npm i presidium-file-client-server
```

## License
Presidium File Client and Server is distributed under the [CFOSS License](https://cloutsworld.com/en-us/legal/license/cfoss).

## Support
 * minimum Node.js version: 16
