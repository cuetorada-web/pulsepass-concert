import { useQuery } from '@tanstack/react-query'
import { obtenerSede, obtenerSedesActivas } from './api'

export function useSedesActivas() {
  return useQuery({
    staleTime: 300_000,
    queryKey: ['sedes', 'activas'],
    queryFn: ({ signal }) => obtenerSedesActivas(signal),
  })
}

export function useSede(code: string) {
  return useQuery({
    staleTime: 300_000,
    queryKey: ['sedes', 'detalle', code],
    queryFn: ({ signal }) => obtenerSede(code, signal),
  })
}
