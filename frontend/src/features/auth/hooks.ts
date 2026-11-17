import { useMutation } from '@tanstack/react-query'
import { iniciarSesion, obtenerUsuarioActual, registrarUsuario } from './api'
import { cerrarSesion, guardarSesion } from './sesion'
import { queryClient } from '../../lib/queryClient'

export const consultaUsuarioActual = {
  queryKey: ['auth', 'me'],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    obtenerUsuarioActual(signal),
  staleTime: 60_000,
}

export function useRegistro() {
  return useMutation({
    mutationFn: registrarUsuario,
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: async (
      datos: Parameters<typeof iniciarSesion>[0],
    ) => {
      const respuesta = await iniciarSesion(datos)

      guardarSesion(respuesta.accessToken, respuesta.expiresIn)

      try {
        return await queryClient.fetchQuery(consultaUsuarioActual)
      } catch (error: unknown) {
        cerrarSesion()
        throw error
      }
    },
  })
}