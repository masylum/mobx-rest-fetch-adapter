import adapter from '../src'
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

describe('adapter', () => {
  describe('ajax', () => {
    describe('when it fails with a malformed response', () => {
      const values = 'ERROR'

      beforeEach(() => {
        injectFail(values)
        ret = adapter.get('/users')
      })

      it('returns the error wrapper into an array', () => {
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
      const values = '{"errors": ["foo"]}'

      beforeEach(() => {
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
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
      const values = '{"errors": ["foo"]}'

      beforeEach(() => {
        data = { name: 'paco' }
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
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
      const values = '{"errors": ["foo"]}'

      beforeEach(() => {
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
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
      const values = '{"errors": ["foo"]}'

      beforeEach(() => {
        injectFail(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect(ret.abort).toBeTruthy()

        return ret.promise.catch((vals) => {
          expect(vals).toEqual(['foo'])
        })
      })
    })
  })
})
