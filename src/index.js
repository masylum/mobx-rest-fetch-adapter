/* global fetch, Headers */
// @flow
import qs from 'qs'
import merge from 'lodash.merge'
import ponyfill from 'fetch-ponyfill'

type OptionsRequest = {
  abort: () => void,
  promise: Promise<*>
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Options = {
  method: Method,
  headers?: ?{ [key: string]: string },
  onProgress?: (num: number) => mixed,
  data?: ?{ [key: string]: mixed },
  qsOptions?: ?{ [key: mixed]: mixed }
}

export function ajaxOptions (options: Options): any {
  let HeadersConstructor = Headers
  const { headers, data, ...otherOptions } = options
  const baseHeaders = {}

  if (typeof HeadersConstructor === 'undefined') {
    HeadersConstructor = ponyfill().Headers
  }

  if (data) {
    baseHeaders['Content-Type'] = 'application/json'
  }

  const headersObject = new HeadersConstructor(
    Object.assign(baseHeaders, headers)
  )

  return {
    ...otherOptions,
    headers: headersObject,
    body: data ? JSON.stringify(data) : null
  }
}

export function checkStatus (response: any): any {
  return response.json().then(json => {
    return response.ok ? json : Promise.reject(json)
  })
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
  apiPath: '',
  defaults: {},

  request (method: string, path: string, options?: {} = {}): OptionsRequest {
    let url = `${this.apiPath}${path}`
    let fetchMethod = fetch
    let rejectPromise

    options = merge({}, this.defaults, { method }, options)

    if (method === 'GET' && options.data) {
      url = `${url}?${qs.stringify(options.data, options.qsOptions)}`
      delete options.data
      delete options.qsOptions
    }

    if (typeof fetchMethod === 'undefined') {
      fetchMethod = ponyfill().fetch
    }

    const xhr = fetchMethod(url, ajaxOptions(options))
    const promise = new Promise((resolve, reject) => {
      rejectPromise = reject
      xhr.then(checkStatus).then(resolve, error => {
        const ret = error ? error.errors : {}

        return reject(ret || {})
      })
    })

    const abort = () => rejectPromise('abort')

    return { abort, promise }
  }
}

for (const method in methodsMapping) {
  adapter[method] = function (path: string, options ?: {} = {}): OptionsRequest {
    return this.request(methodsMapping[method], path, options)
  }
}

export default adapter
