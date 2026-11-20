import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AuthContext } from './AuthContext'
import type { EstadoAuth } from './AuthContext'
import { consultaUsuarioActual } from './hooks'
import { obtenerSesion, suscribirSesion } from './sesion'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const sesion = useSyncExternalStore(suscribirSesion, obtenerSesion)

  const consulta = useQuery({
    ...consultaUsuarioActual,
    enabled: sesion.estado === 'conToken',
    retry: false,
  })

  let auth: EstadoAuth

  if (sesion.estado === 'anonima') {
    auth = { estado: 'anonima', expirada: sesion.expirada }
  } else if (consulta.isPending) {
    auth = { estado: 'cargando' }
  } else if (consulta.isError) {
    auth = {
      estado: 'error',
      mensaje: 'No pudimos comprobar tu sesión. Intenta iniciar sesión otra vez.',
    }
  } else {
    auth = { estado: 'autenticada', usuario: consulta.data }
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
