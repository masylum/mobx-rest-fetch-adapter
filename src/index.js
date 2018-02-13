/* global fetch, Headers */
// @flow
import qs from 'qs'
import merge from 'lodash.merge'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'

type AdapterRequest = {
  abort: () => void,
  promise: Promise<*>
}

type RequestOptions = {
  method: Method,
  headers?: { [string]: string },
  data?: { [string]: mixed },
  qs?: { [string]: mixed },
}

type RequestResponse = {
  ok: boolean,
  json(): mixed
}

type RequestError = {
  errors?: mixed
}

export function ajaxOptions (options: RequestOptions): any {
  const { headers, data, ...otherOptions } = options
  const baseHeaders = {}

  if (data) {
    baseHeaders['Content-Type'] = 'application/json'
  }

  const headersObject = new Headers(
    Object.assign(baseHeaders, headers)
  )

  return {
    ...otherOptions,
    headers: headersObject,
    body: data ? JSON.stringify(data) : undefined
  }
}

export function checkStatus (response: RequestResponse): Promise<*> {
  return response.ok ? Promise.resolve(response) : Promise.reject(response)
}

const methodsMapping = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  patch: 'PATCH',
  del: 'DELETE',
  head: 'HEAD'
}

const adapter = {
  urlRoot: '',
  defaults: {},

  errorUnwrap (error?: RequestError, _config: {}) {
    return (error ? error.errors : {}) || {}
  },

  request (path: string, options: RequestOptions) {
    let url = `${this.urlRoot}${path}`
    let rejectPromise

    options = merge({}, this.defaults, options)

    const finalOptions = { ...options }

    if (options.method === 'GET' && options.data) {
      url = `${url}?${qs.stringify(options.data, options.qs)}`

      delete options.data
      delete options.qs
    }

    const xhr = fetch(url, ajaxOptions(options))
    const promise: Promise<*> = new Promise((resolve, reject) => {
      rejectPromise = reject
      xhr
        .then(checkStatus)
        .then(response => response.json())
        .then(resolve)
        .catch(response => {
          response.json().then(error => {
            reject({
              requestResponse: response,
              error: this.errorUnwrap(error, { options: finalOptions, path })
            })
          })
        })
    })

    const abort = () => rejectPromise('abort')

    return { abort, promise }
  },

  del (path: string, options?: {}): AdapterRequest {
    return this.request(path, merge({ method: 'DELETE' }, options))
  }
}

for (const method in methodsMapping) {
  if (method === 'del') {
    continue
  }

  adapter[method] = function (path: string, data?: {}, options?: {}): AdapterRequest {
    return this.request(path, merge({ method: methodsMapping[method] }, options, { data }))
  }
}

export default adapter
