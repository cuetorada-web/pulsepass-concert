import { useQuery } from '@tanstack/react-query'
import { obtenerSede, obtenerSedesActivas } from './api'

export function useSedesActivas() {
  return useQuery({
    queryKey: ['sedes', 'activas'],
    queryFn: ({ signal }) => obtenerSedesActivas(signal),
  })
}

export function useSede(code: string) {
  return useQuery({
    queryKey: ['sedes', 'detalle', code],
    queryFn: ({ signal }) => obtenerSede(code, signal),
  })
}