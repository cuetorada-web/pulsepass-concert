import { createContext, useContext } from 'react'
import { z } from 'zod'
import { usuarioAutenticadoSchema } from './tipos'

type UsuarioAutenticado = z.infer<typeof usuarioAutenticadoSchema>

export type EstadoAuth =
  | { estado: 'anonima'; expirada: boolean }
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'autenticada'; usuario: UsuarioAutenticado }

export const AuthContext = createContext<EstadoAuth | undefined>(
  undefined,
)

export function useAuth() {
  const contexto = useContext(AuthContext)

  if (contexto === undefined) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  }

  return contexto
}