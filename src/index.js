/* global fetch, Headers, Request */
// @flow
import qs from 'qs'
import deepExtend from 'deep-extend'
type OptionsRequest = {
  abort: () => void;
  promise: Promise<*>;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Options = {
  method: Method;
  headers?: ?{ [key: string]: string };
  onProgress?: (num: number) => mixed;
  data?: ?{ [key: string]: mixed };
}

export function ajaxOptions (options: Options): any {
  const headers = new Headers(Object.assign({}, {
    'Content-Type': 'application/json'
  }, options.headers))

  return {
    method: options.method,
    headers,
    body: options.data ? JSON.stringify(options.data) : null
  }
}

function parseJson (str: string): ?{[key: string]: mixed} {
  try {
    return JSON.parse(str)
  } catch (_error) {
    return null
  }
}

function ajax (url: string, options: Options): OptionsRequest {
  if (options.method === 'GET' && options.data) {
    url = `${url}?${qs.stringify(options.data)}`
    delete options.data
  }
  const request = new Request(url, ajaxOptions(options))
  const xhr = fetch(request)
  const promise = new Promise((resolve, reject) => {
    xhr.then(
      (response) => {
        response.json().then(resolve)
      },
      (error) => {
        const json = parseJson(error)
        const ret = json ? json.errors : {}

        return reject(ret || {})
      })
  })

  const abort = () => {} // noop, fetch is not cancelable

  return { abort, promise }
}

export default {
  apiPath: '',
  commonOptions: {},

  get (path: string, data: ?{}, options?: {} = {}): OptionsRequest {
    return ajax(
      `${this.apiPath}${path}`,
      deepExtend({}, { method: 'GET' }, this.commonOptions, options, { data })
    )
  },

  post (path: string, data: ?{}, options?: {} = {}): OptionsRequest {
    return ajax(
      `${this.apiPath}${path}`,
      deepExtend({}, { method: 'POST' }, this.commonOptions, options, { data })
    )
  },

  put (path: string, data: ?{}, options?: {} = {}): OptionsRequest {
    return ajax(
      `${this.apiPath}${path}`,
      deepExtend({}, { method: 'PUT' }, this.commonOptions, options, { data })
    )
  },

  del (path: string, options?: {} = {}): OptionsRequest {
    return ajax(
      `${this.apiPath}${path}`,
      deepExtend({}, { method: 'DELETE' }, this.commonOptions, options)
    )
  }
}
