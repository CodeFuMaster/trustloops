export interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

export interface UploadOptions {
  onProgress?: (p: UploadProgress) => void
  signal?: AbortSignal
}

// XHR-based upload to support progress events
export async function uploadWithProgress(url: string, body: FormData, options: UploadOptions = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    if (options.signal) {
      const onAbort = () => {
        xhr.abort()
        reject(new DOMException('Aborted', 'AbortError'))
      }
      if (options.signal.aborted) return onAbort()
      options.signal.addEventListener('abort', onAbort, { once: true })
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options.onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100)
        options.onProgress({ loaded: e.loaded, total: e.total, percent })
      }
    }

    xhr.onload = () => {
      const headersRaw = xhr.getAllResponseHeaders()
      const headers = new Headers()
      headersRaw.trim().split(/\r?\n/).forEach(line => {
        const idx = line.indexOf(':')
        if (idx > -1) {
          const key = line.slice(0, idx).trim()
          const val = line.slice(idx + 1).trim()
          headers.append(key, val)
        }
      })
      const response = new Response(xhr.response, { status: xhr.status, statusText: xhr.statusText, headers })
      resolve(response)
    }

    xhr.onerror = () => reject(new TypeError('Network request failed'))
    xhr.ontimeout = () => reject(new TypeError('Network request timed out'))

    xhr.send(body)
  })
}
