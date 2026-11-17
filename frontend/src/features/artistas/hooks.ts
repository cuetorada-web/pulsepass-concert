import { useQuery } from '@tanstack/react-query'
import { obtenerArtista, obtenerArtistasActivos } from './api'

export function useArtistasActivos() {
  return useQuery({
    queryKey: ['artistas', 'activos'],
    queryFn: ({ signal }) => obtenerArtistasActivos(signal),
  })
}

export function useArtista(id: number) {
  return useQuery({
    queryKey: ['artistas', 'detalle', id],
    queryFn: ({ signal }) => obtenerArtista(id, signal),
  })
}