import adapter from '../src'

adapter.apiPath = '/api'

const noop = () => {}

const injectDone = (values) => {
  fetch = jest.genMockFunction().mockImplementation((url, options) => {
    return {
      done: (cb) => {
        cb(values)
        return { fail: noop }
      }
    }
  })
}

const injectFail = (values) => {
  fetch = jest.genMockFunction().mockImplementation((url, options) => {
    return {
      done: () => {
        return {
          fail: (cb) => {
            cb({ responseText: values })
          }
        }
      }
    }
  })
}

describe('adapter', () => {
  describe('ajax', () => {
    describe('when it fails with a malformed response', () => {
      let ret
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
    let ret
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
          expect(fetch.mock.calls[0][0]).toBe('/api/users')
          expect(fetch.mock.calls[0][1]).toEqual({ data })
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
    let ret
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
          expect(fetch.mock.calls[0][0]).toBe('/api/users')
          expect(fetch.mock.calls[0][1]).toEqual({
            method: 'POST',
            contentType: 'application/json',
            data: '{"name":"paco"}'
          })
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

    describe('when it contains a file', () => {
      const values = { id: 1, avatar: 'lol.png' }

      beforeEach(() => {
        data = { avatar: new File([''], 'filename') }
        injectDone(values)
        action()
      })

      it('sends a xhr request with data parameters', () => {
        expect(ret.abort).toBeTruthy()

        return ret.promise.then((vals) => {
          const res = fetch.mock.calls[0][1]

          expect(vals).toEqual(values)
          expect(fetch.mock.calls[0][0]).toBe('/api/users')
          expect(res.cache).toBe(false)
          expect(res.contentType).toBe(false)
          expect(res.data).toBeTruthy()
          expect(res.method).toBe('POST')
          expect(res.processData).toBe(false)
          expect(res.xhr).toBeTruthy()
        })
      })
    })
  })

  describe('put', () => {
    let ret
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
          expect(fetch.mock.calls[0][0]).toBe('/api/users')
          expect(fetch.mock.calls[0][1]).toEqual({
            method: 'PUT',
            contentType: 'application/json',
            data: '{"name":"paco"}'
          })
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
    let ret

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
          expect(fetch.mock.calls[0][0]).toBe('/api/users')
          expect(fetch.mock.calls[0][1]).toEqual({
            method: 'DELETE',
            contentType: 'application/json',
            data: null
          })
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
