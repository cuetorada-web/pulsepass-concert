import { useQuery } from '@tanstack/react-query'
import { http } from '../../lib/http'
import { usuarioSchema } from './tipos'

export function usePerfilUsuario(email?: string, username?: string, porUsername = false) {
  return useQuery({
    queryKey: ['usuario', email, porUsername ? username : 'email'],
    queryFn: ({ signal }) =>
      porUsername
        ? http(
            `/api/users/by-username?username=${encodeURIComponent(username ?? '')}`,
            usuarioSchema,
            signal,
          )
        : http(
            `/api/users/by-email?email=${encodeURIComponent(email ?? '')}`,
            usuarioSchema,
            signal,
          ),
    enabled: Boolean(email && username),
  })
}
