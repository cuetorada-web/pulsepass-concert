import { http } from '../../lib/http'
import {
  loginSchema,
  registroSchema,
  respuestaLoginSchema,
  usuarioAutenticadoSchema,
  usuarioSchema,
} from './tipos'
import type { DatosLogin, DatosRegistro } from './tipos'

export function registrarUsuario(datos: DatosRegistro) {
  return http('/api/users', usuarioSchema, undefined, {
    method: 'POST',
    body: registroSchema.parse(datos),
    publica: true,
  })
}

export function iniciarSesion(datos: DatosLogin) {
  return http('/api/auth/login', respuestaLoginSchema, undefined, {
    method: 'POST',
    body: loginSchema.parse(datos),
    publica: true,
  })
}

export function obtenerUsuarioActual(signal?: AbortSignal) {
  return http('/api/auth/me', usuarioAutenticadoSchema, signal)
}
