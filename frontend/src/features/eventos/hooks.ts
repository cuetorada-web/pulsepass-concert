import { useQuery } from '@tanstack/react-query'
import {
  obtenerEvento,
  obtenerEventosPorArtista,
  obtenerEventosPublicados,
} from './api'

export function useEventosPublicados() {
  return useQuery({
    queryKey: ['eventos', 'publicados'],
    queryFn: ({ signal }) => obtenerEventosPublicados(signal),
  })
}

export function useEventosPorArtista(stageName: string) {
  return useQuery({
    queryKey: ['eventos', 'por-artista', stageName],
    queryFn: ({ signal }) => obtenerEventosPorArtista(stageName, signal),
  })
}
export function useEvento(eventCode: string) {
  return useQuery({
    queryKey: ['eventos', 'detalle', eventCode],
    queryFn: ({ signal }) => obtenerEvento(eventCode, signal),
  })
}