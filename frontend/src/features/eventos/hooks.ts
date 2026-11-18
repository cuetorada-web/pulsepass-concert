import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '../../lib/queryClient'
import {
  asociarArtistaEvento,
  crearEvento,
  obtenerEvento,
  obtenerEventosPorArtista,
  obtenerEventosPublicados,
  publicarEvento,
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

export function useCrearEvento() {
  return useMutation({
    mutationFn: crearEvento,
    onSuccess: (eventoCreado) => {
      queryClient.setQueryData(
        ['eventos', 'detalle', eventoCreado.eventCode],
        eventoCreado,
      )
      void queryClient.invalidateQueries({
        queryKey: ['eventos', 'publicados'],
      })
    },
  })
}

export function usePublicarEvento() {
  return useMutation({
    mutationFn: publicarEvento,
    onSuccess: (eventoActualizado) => {
      queryClient.setQueryData(
        ['eventos', 'detalle', eventoActualizado.eventCode],
        eventoActualizado,
      )
      void queryClient.invalidateQueries({
        queryKey: ['eventos', 'publicados'],
      })
    },
  })
}

export function useAsociarArtistaEvento() {
  return useMutation({
    mutationFn: ({
      eventCode,
      artistId,
    }: {
      eventCode: string
      artistId: number
    }) => asociarArtistaEvento(eventCode, artistId),
    onSuccess: (eventoActualizado) => {
      queryClient.setQueryData(
        ['eventos', 'detalle', eventoActualizado.eventCode],
        eventoActualizado,
      )
    },
  })
}