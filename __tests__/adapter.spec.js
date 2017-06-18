import adapter, { ajaxOptions, checkStatus } from '../src'
global.fetch = require('jest-fetch-mock')

adapter.apiPath = '/api'

let ret
function lastRequest () {
  const mock = global.fetch.mock
  return mock.calls[mock.calls.length - 1][0]
}

function injectDone (values) {
  global.fetch.mockResponseOnce(
    JSON.stringify(values), { status: 200 }
  )
}

function injectFail (values) {
  global.fetch.mockResponseOnce(
    JSON.stringify(values), { status: 422 }
  )
}

function testCommonOptions (method) {
  return it('deep merges the default `commonOptions` with the passed options', () => {
    adapter.commonOptions = {
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
      : ['/users', null, options]

    const request = adapter[method].apply(adapter, args)

    return request.promise.then(() => {
      expect(lastRequest().headers.get('some-header')).toEqual('test1')
      expect(lastRequest().headers.get('some-other-header')).toEqual('test2')
    })
  })
}

describe('adapter', () => {
  beforeEach(() => {
    adapter.commonOptions = {}
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
  })

  describe('checkStatus(response)', () => {
    describe('if response is ok', () => {
      it('returns a resolved promise with the parsed json', () => {
        expect.assertions(1)

        const someData = { data: 'ok' }
        const response = {
          ok: true,
          json: () => Promise.resolve(someData)
        }

        return checkStatus(response).then(json => {
          expect(json).toEqual(someData)
        })
      })
    })

    describe('if response is not ok', () => {
      it('returns a rejected promise with the parsed json', () => {
        expect.assertions(1)

        const someData = { errors: { name: 'Already in use' } }
        const response = {
          ok: false,
          json: () => Promise.resolve(someData)
        }

        return checkStatus(response).catch(json => {
          expect(json).toEqual(someData)
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

        return ret.promise.catch((vals) => {
          expect(vals).toEqual({})
        })
      })
    })
  })

  describe('get', () => {
    const data = { manager_id: 2 }

    const action = () => {
      ret = adapter.get('/users', data)
    }

    testCommonOptions('get')

    describe('when it resolves', () => {
      const values = { id: 1, name: 'paco' }

      beforeEach(() => {
        injectDone(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect(ret.abort).toBeTruthy()

        return ret.promise.then((vals) => {
          expect(vals).toEqual(values)
          expect(lastRequest().url).toBe('/api/users?manager_id=2')
          expect(lastRequest().method).toBe('GET')
          expect(lastRequest().headers.map['content-type']).toEqual(['application/json'])
        })
      })
    })

    describe('when it fails', () => {
      const values = {errors: ['foo']}

      beforeEach(() => {
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect.assertions(2)

        expect(ret.abort).toBeTruthy()

        return ret.promise.catch((vals) => {
          expect(vals).toEqual(['foo'])
        })
      })
    })
  })

  describe('post', () => {
    let data

    const action = () => {
      ret = adapter.post('/users', data)
    }

    testCommonOptions('post')

    describe('when it resolves', () => {
      const values = { id: 1, name: 'paco' }

      beforeEach(() => {
        data = { name: 'paco' }
        injectDone(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect(ret.abort).toBeTruthy()

        return ret.promise.then((vals) => {
          expect(vals).toEqual(values)
          expect(lastRequest().url).toBe('/api/users')
          expect(lastRequest().method).toBe('POST')
          expect(lastRequest().headers.map['content-type']).toEqual(['application/json'])
          expect(lastRequest()._bodyInit).toBe('{"name":"paco"}')
        })
      })
    })

    describe('when it fails', () => {
      const values = {errors: ['foo']}

      beforeEach(() => {
        data = { name: 'paco' }
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect.assertions(2)

        expect(ret.abort).toBeTruthy()

        return ret.promise.catch((vals) => {
          expect(vals).toEqual(['foo'])
        })
      })
    })
  })

  describe('put', () => {
    const data = { name: 'paco' }

    const action = () => {
      ret = adapter.put('/users', data)
    }

    testCommonOptions('put')

    describe('when it resolves', () => {
      const values = { id: 1, name: 'paco' }

      beforeEach(() => {
        injectDone(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect(ret.abort).toBeTruthy()

        return ret.promise.then((vals) => {
          expect(vals).toEqual(values)
          expect(lastRequest().url).toBe('/api/users')
          expect(lastRequest().method).toBe('PUT')
          expect(lastRequest().headers.map['content-type']).toEqual(['application/json'])
          expect(lastRequest()._bodyInit).toBe('{"name":"paco"}')
        })
      })
    })

    describe('when it fails', () => {
      const values = {errors: ['foo']}

      beforeEach(() => {
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect.assertions(2)

        expect(ret.abort).toBeTruthy()

        return ret.promise.catch((vals) => {
          expect(vals).toEqual(['foo'])
        })
      })
    })
  })

  describe('del', () => {
    const action = () => {
      ret = adapter.del('/users')
    }

    testCommonOptions('del')

    describe('when it resolves', () => {
      const values = { id: 1, name: 'paco' }

      beforeEach(() => {
        injectDone(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect(ret.abort).toBeTruthy()

        return ret.promise.then((vals) => {
          expect(vals).toEqual(values)
          expect(lastRequest().url).toEqual('/api/users')
          expect(lastRequest().method).toBe('DELETE')
          expect(lastRequest().headers.map['content-type']).toEqual(['application/json'])
        })
      })
    })

    describe('when it fails', () => {
      const values = {errors: ['foo']}

      beforeEach(() => {
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect.assertions(2)

        expect(ret.abort).toBeTruthy()

        return ret.promise.catch((vals) => {
          expect(vals).toEqual(['foo'])
        })
      })
    })
  })
})
