/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

const HTTP = require("presidium/HTTP")
const Readable = require("presidium/Readable")
const stream = require("stream")

/**
 * @name getClient
 *
 * @docs
 * ```specscript
 * module HTTP "https://presidium.services/docs/HTTP"
 *
 * getClient(serverIp string) -> client HTTP
 * ```
 */
function getClient(serverIp) {
  let client
  if (this.clients.has(serverIp)) {
    client = this.clients.get(serverIp)
  } else {
    client = new HTTP(serverIp)
    this.clients.set(serverIp, client)
  }
  return client
}

/**
 * @name loadBalancerHandler
 *
 * @docs
 * ```specscript
 * module HTTP "https://presidium.services/docs/HTTP"
 *
 * loadBalancerHandler(HTTP.Request, HTTP.Response) -> ()
 * ```
 */
async function loadBalancerHandler(request, response) {
  const fileUrl = request.url

  let index = this.hash(fileUrl, this.serverIps.length)
  if (typeof index.then == "function") {
    index = await index
  }

  const serverIpOrIps = this.serverIps[index]

  if (Array.isArray(serverIpOrIps)) {
    const passthroughStreams = []
    for (let i = 0; i < serverIpOrIps.length; i++) {
      passthroughStreams.push(new stream.PassThrough())
    }

    request.on("data", chunk => {
      passthroughStreams.forEach(stream => {
        stream.write(chunk)
      })
    })

    request.on("end", () => {
      passthroughStreams.forEach(stream => {
        stream.end()
      })
    })

    await forEach(serverIpOrIps, async (serverIp, index) => {
      const client = getClient.call(this, serverIp)

      const serverResponse = await client[request.method](request.url, {
        headers: request.headers,
        body: passthroughStreams[index],
      })

      if (index == 0) {
        response.writeHead(serverResponse.status, serverResponse.headers)
        serverResponse.pipe(response)
      } else {
        const text = await Readable.Text(serverResponse)
        if (serverResponse.ok) {
        } else {
          console.error(new Error(text))
        }
      }
    })

  } else {
    const client = getClient.call(this, serverIpOrIps)

    const serverResponse = await client[request.method](request.url, {
      headers: request.headers,
      body: request,
    })

    response.writeHead(serverResponse.status, serverResponse.headers)
    serverResponse.pipe(response)
  }

}

module.exports = loadBalancerHandler
