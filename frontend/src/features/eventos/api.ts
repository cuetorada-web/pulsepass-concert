import { http } from '../../lib/http'
import {
  type DatosCrearEvento,
  type EventoDetalle,
  eventoDetalleSchema,
  eventosSchema,
} from './tipos'

export function obtenerEventosPublicados(signal?: AbortSignal) {
  return http('/api/events/published', eventosSchema, signal, {
    publica: true,
  })
}

export function obtenerEventosPorArtista(stageName: string, signal?: AbortSignal) {
  const parametros = new URLSearchParams({ stageName })

  return http(`/api/events/by-artist?${parametros.toString()}`, eventosSchema, signal, {
    publica: true,
  })
}

export function obtenerEvento(eventCode: string, signal?: AbortSignal) {
  return http(`/api/events/${encodeURIComponent(eventCode)}`, eventoDetalleSchema, signal)
}

export function crearEvento(datos: DatosCrearEvento): Promise<EventoDetalle> {
  return http('/api/events', eventoDetalleSchema, undefined, {
    method: 'POST',
    body: datos,
  })
}

export function publicarEvento(eventCode: string): Promise<EventoDetalle> {
  return http(
    `/api/events/${encodeURIComponent(eventCode)}/publish`,
    eventoDetalleSchema,
    undefined,
    {
      method: 'PATCH',
    },
  )
}

export function asociarArtistaEvento(
  eventCode: string,
  artistId: number,
): Promise<EventoDetalle> {
  return http(
    `/api/events/${encodeURIComponent(eventCode)}/artists/${artistId}`,
    eventoDetalleSchema,
    undefined,
    {
      method: 'POST',
    },
  )
}
