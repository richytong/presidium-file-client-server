/**
 * Presidium File Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const HTTP = require("presidium/HTTP")
const Readable = require("presidium/Readable")

/**
 * @name FileClient
 *
 * @docs
 * ```specscript
 * new FileClient(options {
 *   serverUrl: string,
 * }) -> fileClient FileClient
 * ```
 *
 * Presidium FileClient class. Creates a file client.
 *
 * Arguments:
 *   * `options`
 *     * `serverUrl` - `string` - the url of the file server.
 *
 * Return:
 *   * `fileClient` - [`FileClient`](/docs/FileClient) - a FileClient instance.
 *
 * ```javascript
 * const fileClient = new FileClient({
 *   serverUrl: "http://your-file-load-balancer-server:8080",
 * })
 * ```
 */
class FileClient {
  constructor(options) {
    this.serverUrl = options.serverUrl
    this.http = new HTTP(this.serverUrl)
  }

  /**
   * @name write
   *
   * @docs
   * ```specscript
   * module stream "https://nodejs.org/api/stream.html"
   *
   * write(url string, fileStream stream.Readable, options {
   *   ContentType: string,
   *   ContentEncoding: string,
   * }) -> data Promise<{
   *   metadata: {
   *     Url: string,
   *     ContentLength: number,
   *     ContentType: string,
   *     ContentEncoding: string,
   *   },
   * }>
   * ```
   *
   * Writes file data to the file server at the specified URL.
   *
   * Arguments:
   *   * `url` - `string` - the URL of the file on the file server.
   *   * `fileStream` - `stream.Readable` - the file data.
   *   * `options`
   *     * `ContentType` - `string` - the content type or mime type of the file. Represents the value of the `Content-Type` header of the file served by the file server.
   *     * `ContentEncoding` - `string` - the content encoding of the file. Represents the value of the `Content-Encoding` header of the file served by the file server.
   *
   * Return:
   *   * `data` - `Promise<object>`
   *     * `metadata`
   *       * `Url` - `string` - the URL of the file on the file server.
   *       * `ContentLength` - `number` - the length in bytes of the file data. Represents the value of the `Content-Length` header of the file served by the file server.
   *       * `ContentType` - `string` - the content type or mime type of the file. Represents the value of the `Content-Type` header of the file served by the file server.
   *       * `ContentEncoding` - `string` - the content encoding of the file. Represents the value of the `Content-Encoding` header of the file served by the file server.
   *
   * ```javascript
   * const yourMedia = fs.createWriteStream("/path/to/your-media.mp4")
   *
   * await fileClient.write("/assets/your-media.mp4", yourMedia, {
   *   ContentType: "video/mp4",
   * })
   * ```
   */
  async write(url, fileStream, options = {}) {
    const response = await this.http.PUT(url, {
      headers: filter({
        "Content-Type": options.ContentType,
        "Content-Encoding": options.ContentEncoding,
      }, __),
      body: fileStream,
    })
    if (response.ok) {
      const data = await Readable.JSON(response)
      return data
    }
    const message = await Readable.Text(response)
    const error = new Error(message)
    throw error
  }

  /**
   * @name read
   *
   * @docs
   * ```specscript
   * module stream "https://nodejs.org/api/stream.html"
   *
   * read(url string) -> data Promise<{
   *   FileStream: stream.Readable,
   *   ContentLength: number,
   *   ContentType: string,
   *   ContentEncoding: string,
   * }>
   *
   * read(url string) -> Promise<undefined>
   * ```
   *
   * Reads file data from the file server at the specified URL.
   *
   * Arguments:
   *   * `url` - `string` - the URL of the file on the file server.
   *
   * Return:
   *   * `data` - `Promise<object>`
   *     * `FileStream` - `stream.Readable` - the file data.
   *     * `ContentLength` - `number` - the length in bytes of the file data. Represents the value of the `Content-Length` header of the file served by the file server.
   *     * `ContentType` - `string` - the content type or mime type of the file. Represents the value of the `Content-Type` header of the file served by the file server.
   *     * `ContentEncoding` - `string` - the content encoding of the file. Represents the value of the `Content-Encoding` header of the file served by the file server.
   *
   * ```javascript
   * const data = await fileClient.read("/assets/your-media.mp4")
   * ```
   *
   * See [Requesting a file resource from clients](/docs/FileServer#requesting-a-file-resource-from-clients) for accessing file resources from browser and mobile clients.
   */
  async read(url) {
    const response = await this.http.GET(url)
    if (response.status == 404) {
      await Readable.Text(response)
      return undefined
    }
    if (response.ok) {
      return filter({
        FileStream: response,
        ContentLength: response.headers["content-length"],
        ContentType: response.headers["content-type"],
        ContentEncoding: response.headers["content-encoding"],
      }, __)
    }
    const message = await Readable.Text(response)
    const error = new Error(message)
    throw error
  }

  /**
   * @name delete
   *
   * @docs
   * ```specscript
   * delete(url string) -> didDelete Promise<boolean>
   * ```
   *
   * Deletes the file data indicated by the specified URL from the file server.
   *
   * Arguments:
   *   * `url` - `string` - the URL of the file on the file server.
   *
   * Return:
   *   * `didDelete` - `Promise<boolean>` - whether the file data was found and deleted on the file server.
   *
   * ```javascript
   * await fileClient.delete("/assets/your-media.mp4")
   * ```
   */
  async delete(url) {
    const response = await this.http.DELETE(url)
    if (response.status == 404) {
      await Readable.Text(response)
      return false
    }
    if (response.ok) {
      await Readable.Text(response)
      return true
    }
    const message = await Readable.Text(response)
    const error = new Error(message)
    throw error
  }
}

module.exports = FileClient
