import { z } from 'zod'
import { queryClient } from '../../lib/queryClient'

const CLAVE = 'pulsepass.sesion'

const sesionSchema = z.object({
  token: z.string().min(1),
  expiraEn: z.number().int().positive(),
})

type Sesion = z.infer<typeof sesionSchema>

type EstadoSesion =
  { estado: 'anonima'; expirada: boolean } | { estado: 'conToken'; sesion: Sesion }

function restaurar(): EstadoSesion {
  try {
    const texto = sessionStorage.getItem(CLAVE)

    if (!texto) {
      return { estado: 'anonima', expirada: false }
    }

    const contenido: unknown = JSON.parse(texto)
    const resultado = sesionSchema.safeParse(contenido)

    if (resultado.success && resultado.data.expiraEn > Date.now()) {
      return { estado: 'conToken', sesion: resultado.data }
    }

    sessionStorage.removeItem(CLAVE)
    sessionStorage.removeItem('pulsepass.eventos-creados')
    return { estado: 'anonima', expirada: true }
  } catch {
    return { estado: 'anonima', expirada: false }
  }
}

let actual: EstadoSesion = restaurar()
let temporizador: ReturnType<typeof setTimeout> | undefined

const oyentes = new Set<() => void>()

export function obtenerSesion() {
  return actual
}

export function suscribirSesion(oyente: () => void) {
  oyentes.add(oyente)

  return () => {
    oyentes.delete(oyente)
  }
}

function notificar() {
  oyentes.forEach((oyente) => oyente())
}

export function cerrarSesion(expirada = false) {
  clearTimeout(temporizador)
  actual = { estado: 'anonima', expirada }

  try {
    sessionStorage.removeItem(CLAVE)
    sessionStorage.removeItem('pulsepass.eventos-creados')
  } catch {
    // La sesión en memoria se cierra aunque el almacenamiento no esté disponible.
  }

  queryClient.clear()
  notificar()
}

function programarExpiracion() {
  clearTimeout(temporizador)

  if (actual.estado === 'conToken') {
    const tiempoRestante = actual.sesion.expiraEn - Date.now()

    temporizador = setTimeout(() => cerrarSesion(true), Math.max(0, tiempoRestante))
  }
}

export function guardarSesion(token: string, expiresIn: number) {
  const sesion = sesionSchema.parse({
    token,
    expiraEn: Date.now() + expiresIn * 1000,
  })

  queryClient.clear()

  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion))
  } catch {
    // Si el navegador bloquea el almacenamiento, se conserva en memoria.
  }

  actual = { estado: 'conToken', sesion }
  programarExpiracion()
  notificar()
}

programarExpiracion()
