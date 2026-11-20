import { http } from '../../lib/http'
import { sedeSchema, sedesSchema } from './tipos'

export function obtenerSedesActivas(signal?: AbortSignal) {
  return http('/api/venues/active', sedesSchema, signal, {
    publica: true,
  })
}

export function obtenerSede(code: string, signal?: AbortSignal) {
  return http(`/api/venues/${encodeURIComponent(code)}`, sedeSchema, signal, {
    publica: true,
  })
}
