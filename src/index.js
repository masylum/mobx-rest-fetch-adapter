/* global fetch, Headers, Request */
// @flow
type OptionsRequest = {
  abort: () => void;
  promise: Promise<*>;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Options = {
  method: Method;
  onProgress?: (num: number) => mixed;
  data?: ?{ [key: string]: mixed };
}

function ajaxOptions (options: Options): any {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')
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

  get (path: string, data: ?{}, options?: {} = {}): OptionsRequest {
    return ajax(
      `${this.apiPath}${path}`,
      Object.assign({}, { method: 'GET', data }, options)
    )
  },

  post (path: string, data: ?{}, options?: {} = {}): OptionsRequest {
    return ajax(
      `${this.apiPath}${path}`,
      Object.assign({}, { method: 'POST', data }, options)
    )
  },

  put (path: string, data: ?{}, options?: {} = {}): OptionsRequest {
    return ajax(
      `${this.apiPath}${path}`,
      Object.assign({}, { method: 'PUT', data }, options)
    )
  },

  del (path: string, options?: {} = {}): OptionsRequest {
    return ajax(
      `${this.apiPath}${path}`,
      Object.assign({}, { method: 'DELETE' }, options)
    )
  }
}
