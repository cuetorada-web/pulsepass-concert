import { http } from '../../lib/http'
import { artistaSchema, artistasSchema } from './tipos'

export function obtenerArtistasActivos(signal?: AbortSignal) {
  return http('/api/artists/active', artistasSchema, signal, {
    publica: true,
  })
}

export function obtenerArtista(id: number, signal?: AbortSignal) {
  return http(`/api/artists/${id}`, artistaSchema, signal, {
    publica: true,
  })
}
