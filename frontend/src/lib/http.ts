import { z } from 'zod'
import { cerrarSesion, obtenerSesion } from '../features/auth/sesion'

const errorRespuestaSchema = z.object({
  timestamp: z.string(),
  status: z.number().int(),
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).nullish(),
})

export class ApiError extends Error {
  readonly status: number
  readonly details: Record<string, unknown>

  constructor(message: string, status: number, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function mensajePorEstado(status: number): string {
  switch (status) {
    case 400:
      return 'La solicitud contiene datos inválidos.'
    case 401:
      return 'Necesitas iniciar sesión para continuar.'
    case 403:
      return 'No tienes permiso para realizar esta acción.'
    case 404:
      return 'No se encontró el recurso solicitado.'
    case 409:
      return 'No se pudo completar la operación.'
    default:
      return 'No pudimos completar la solicitud. Intenta nuevamente.'
  }
}

interface OpcionesHttp {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  publica?: boolean
}

export async function http<T>(
  ruta: `/api/${string}`,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
  opciones: OpcionesHttp = {},
): Promise<T> {
  const sesion = obtenerSesion()

  const token =
    !opciones.publica && sesion.estado === 'conToken' ? sesion.sesion.token : undefined

  let respuesta: Response

  try {
    respuesta = await fetch(new URL(ruta, window.location.origin), {
      method: opciones.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(opciones.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
      signal,
    })
  } catch (error: unknown) {
    if (signal?.aborted) {
      throw error
    }

    throw new ApiError(
      'No pudimos conectar con el servidor. Comprueba que el backend esté encendido.',
      0,
    )
  }

  const contenido: unknown = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    const resultado = errorRespuestaSchema.safeParse(contenido)

    if (respuesta.status === 401 && token) {
      const vigente = obtenerSesion()

      if (vigente.estado === 'conToken' && vigente.sesion.token === token) {
        cerrarSesion(true)
      }
    }

    const mensaje =
      respuesta.status === 400 && resultado.success && resultado.data.details
        ? [
            mensajePorEstado(400),
            ...Object.values(resultado.data.details).filter(
              (valor): valor is string => typeof valor === 'string',
            ),
          ].join(' ')
        : respuesta.status === 409 && resultado.success
          ? resultado.data.message
          : mensajePorEstado(respuesta.status)

    throw new ApiError(
      mensaje,
      respuesta.status,
      resultado.success ? (resultado.data.details ?? {}) : {},
    )
  }

  const resultado = schema.safeParse(contenido)

  if (!resultado.success) {
    throw new ApiError(
      'El servidor devolvió datos con un formato inesperado.',
      respuesta.status,
    )
  }

  return resultado.data
}
