import adapter, { ajaxOptions, checkStatus } from '../src'
import qs from 'qs'

global.fetch = require('jest-fetch-mock')
adapter.urlRoot = '/api'

let ret
function lastRequest () {
  const mock = global.fetch.mock
  const lastCall = mock.calls[mock.calls.length - 1]

  return {
    url: lastCall[0],
    ...lastCall[1]
  }
}

function injectDone (values) {
  global.fetch.mockResponseOnce(JSON.stringify(values), { status: 200 })
}

function injectFail (values, status = 422) {
  global.fetch.mockResponseOnce(JSON.stringify(values), { status })
}

function testDefaults (method) {
  return it('deep merges the default `defaults` with the passed options', () => {
    adapter.defaults = {
      headers: {
        'some-header': 'test1'
      }
    }

    const options = {
      headers: {
        'some-other-header': 'test2'
      }
    }

    injectDone({})

    const args = method === 'del'
      ? ['/users', options]
      : ['/users', {}, options]

    const request = adapter[method].apply(adapter, args)

    return request.promise.then(() => {
      expect(lastRequest().headers.get('some-header')).toEqual('test1')
      expect(lastRequest().headers.get('some-other-header')).toEqual('test2')
    })
  })
}

describe('adapter', () => {
  beforeEach(() => {
    adapter.defaults = {}
  })

  describe('ajaxOptions(options)', () => {
    it('allows to define custom headers', () => {
      const options = ajaxOptions({
        headers: {
          'some-header': 'test1',
          'some-other-header': 'test2'
        }
      })

      expect(options.headers.get('some-header')).toEqual('test1')
      expect(options.headers.get('some-other-header')).toEqual('test2')
    })

    it('allows to pass any option to fetch', () => {
      const options = ajaxOptions({
        credentials: 'same-origin'
      })

      expect(options.credentials).toEqual('same-origin')
    })

    describe('if options.data is not specified', () => {
      // https://github.com/github/fetch/issues/402
      it('body should be undefined', () => {
        const options = ajaxOptions({ data: null })

        expect(options.body).toBeUndefined()
      })
    })
  })

  describe('checkStatus(response)', () => {
    describe('if response is ok', () => {
      it('returns a resolved promise', () => {
        expect.assertions(1)

        const someData = { data: 'ok' }
        const response = {
          ok: true,
          json: () => Promise.resolve(someData)
        }

        return checkStatus(response).then(vals => {
          return vals.json().then(response => {
            expect(response).toEqual(someData)
          })
        })
      })
    })

    describe('if response is not ok', () => {
      it('returns a rejected promise', () => {
        expect.assertions(1)

        const someData = { errors: { name: 'Already in use' } }
        const response = {
          ok: false,
          json: () => Promise.resolve(someData)
        }

        return checkStatus(response).catch(vals => {
          return vals.json().then(error => {
            expect(error).toEqual(someData)
          })
        })
      })
    })
  })

  describe('ajax', () => {
    describe('when it fails with a malformed response', () => {
      const values = 'ERROR'

      beforeEach(() => {
        injectFail(values)
        ret = adapter.get('/users')
      })

      it('returns the error wrapper into an array', () => {
        expect.assertions(2)

        expect(ret.abort).toBeTruthy()

        return ret.promise.catch(vals => {
          expect(vals.error).toEqual({})
        })
      })
    })

    describe('when it fails', () => {
      it('should allow to get the response status', () => {
        injectFail({ errors: 'Not found' }, 404)

        const ret = adapter.get('/users')

        return ret.promise.catch(vals => {
          expect(vals.requestResponse.status).toBe(404)
        })
      })
    })

    describe('when aborted', () => {
      it('rejects the request promise with an "abort" message', () => {
        const { abort, promise } = adapter.get()

        abort()

        return promise.catch(vals => {
          expect(vals).toEqual('abort')
        })
      })
    })

    it('should allow to pass options to qs.stringify', () => {
      const data = { someArray: [1, 2, 3] }
      const qsOptions = { indices: false }

      adapter.get('/users', data, { qs: qsOptions })

      expect(lastRequest().url.split('?')[1]).toEqual(qs.stringify(data, qsOptions))
    })
  })

  describe('get', () => {
    const data = { manager_id: 2 }

    const action = () => {
      ret = adapter.get('/users', data)
    }

    testDefaults('get')

    describe('when it resolves', () => {
      const values = { id: 1, name: 'paco' }

      beforeEach(() => {
        injectDone(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect(ret.abort).toBeTruthy()

        return ret.promise.then(vals => {
          expect(vals).toEqual(values)
          expect(lastRequest().url).toBe('/api/users?manager_id=2')
          expect(lastRequest().method).toBe('GET')
          expect(lastRequest().headers.map).toEqual({})
        })
      })
    })

    describe('when it fails', () => {
      const values = { errors: ['foo'] }

      beforeEach(() => {
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect.assertions(2)

        expect(ret.abort).toBeTruthy()

        return ret.promise.catch(vals => {
          expect(vals.error).toEqual(['foo'])
        })
      })
    })
  })

  describe('post', () => {
    let data

    const action = () => {
      ret = adapter.post('/users', data)
    }

    testDefaults('post')

    describe('when it resolves', () => {
      const values = { id: 1, name: 'paco' }

      beforeEach(() => {
        data = { name: 'paco' }
        injectDone(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect(ret.abort).toBeTruthy()

        return ret.promise.then(vals => {
          expect(vals).toEqual(values)
          expect(lastRequest().url).toBe('/api/users')
          expect(lastRequest().method).toBe('POST')
          expect(lastRequest().headers.map['content-type']).toEqual([
            'application/json'
          ])
          expect(lastRequest().body).toBe('{"name":"paco"}')
        })
      })
    })

    describe('when it fails', () => {
      const values = { errors: ['foo'] }

      beforeEach(() => {
        data = { name: 'paco' }
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect.assertions(2)

        expect(ret.abort).toBeTruthy()

        return ret.promise.catch(vals => {
          expect(vals.error).toEqual(['foo'])
        })
      })
    })
  })

  describe('put', () => {
    const data = { name: 'paco' }

    const action = () => {
      ret = adapter.put('/users', data)
    }

    testDefaults('put')

    describe('when it resolves', () => {
      const values = { id: 1, name: 'paco' }

      beforeEach(() => {
        injectDone(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect(ret.abort).toBeTruthy()

        return ret.promise.then(vals => {
          expect(vals).toEqual(values)
          expect(lastRequest().url).toBe('/api/users')
          expect(lastRequest().method).toBe('PUT')
          expect(lastRequest().headers.map['content-type']).toEqual([
            'application/json'
          ])
          expect(lastRequest().body).toBe('{"name":"paco"}')
        })
      })
    })

    describe('when it fails', () => {
      const values = { errors: ['foo'] }

      beforeEach(() => {
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect.assertions(2)

        expect(ret.abort).toBeTruthy()

        return ret.promise.catch(vals => {
          expect(vals.error).toEqual(['foo'])
        })
      })
    })
  })

  describe('del', () => {
    const action = () => {
      ret = adapter.del('/users')
    }

    testDefaults('del')

    describe('when it resolves', () => {
      const values = { id: 1, name: 'paco' }

      beforeEach(() => {
        injectDone(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect(ret.abort).toBeTruthy()

        return ret.promise.then(vals => {
          expect(vals).toEqual(values)
          expect(lastRequest().url).toEqual('/api/users')
          expect(lastRequest().method).toBe('DELETE')
          expect(lastRequest().headers.map).toEqual({})
        })
      })
    })

    describe('when it fails', () => {
      const values = { errors: ['foo'] }

      beforeEach(() => {
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect.assertions(2)

        expect(ret.abort).toBeTruthy()

        return ret.promise.catch(vals => {
          expect(vals.error).toEqual(['foo'])
        })
      })
    })
  })
})
