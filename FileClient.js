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
 * }) -> FileClient
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
   * module stream "https://nodejs.org/api/stream.html"
   *
   * delete(url string) -> didDelete Promise<boolean>
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
