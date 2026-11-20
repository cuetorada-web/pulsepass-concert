import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './server'
import { cerrarSesion } from '../features/auth/sesion'
import { queryClient } from '../lib/queryClient'
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  queryClient.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false },
  })
})
afterEach(() => {
  cleanup()
  cerrarSesion()
  sessionStorage.clear()
  localStorage.clear()
  server.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => server.close())
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  })),
})
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}
