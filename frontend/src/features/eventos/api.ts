import { http } from '../../lib/http'
import { eventoDetalleSchema, eventosSchema } from './tipos'


export function obtenerEventosPublicados(signal?: AbortSignal) {
  return http('/api/events/published', eventosSchema, signal, {
    publica: true,
  })
}

export function obtenerEventosPorArtista(
  stageName: string,
  signal?: AbortSignal,
) {
  const parametros = new URLSearchParams({ stageName })

  return http(
    `/api/events/by-artist?${parametros.toString()}`,
    eventosSchema,
    signal,
    { publica: true },
  )
}
export function obtenerEvento(
  eventCode: string,
  signal?: AbortSignal,
) {
  return http(
    `/api/events/${encodeURIComponent(eventCode)}`,
    eventoDetalleSchema,
    signal,
  )
}