import { useQuery } from '@tanstack/react-query'
import { obtenerArtista, obtenerArtistasActivos } from './api'

export function useArtistasActivos() {
  return useQuery({
    staleTime: 300_000,
    queryKey: ['artistas', 'activos'],
    queryFn: ({ signal }) => obtenerArtistasActivos(signal),
  })
}

export function useArtista(id: number) {
  return useQuery({
    staleTime: 300_000,
    queryKey: ['artistas', 'detalle', id],
    queryFn: ({ signal }) => obtenerArtista(id, signal),
  })
}
