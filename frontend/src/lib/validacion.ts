import { z } from 'zod'

export const codigoSchema = z
  .string()
  .trim()
  .min(1, 'Escribe el código.')
  .max(100)
  .refine((v) => !/[/?#\\]/.test(v), 'Código inválido.')
export const destinoSchema = z
  .string()
  .refine(
    (v) =>
      /^\/(?!\/)/.test(v) &&
      !v.includes('\\') &&
      [...v].every((c) => c.charCodeAt(0) >= 32) &&
      !/^\/(login|registro)(?:[/?#]|$)/.test(v),
  )
export const navegacionSchema = z.object({
  desde: destinoSchema.optional(),
  registroExitoso: z.boolean().optional(),
})

export function destinoSeguro(estado: unknown) {
  const resultado = navegacionSchema.safeParse(estado)
  return resultado.success ? (resultado.data.desde ?? '/') : '/'
}

export type NivelFortaleza = 'vacia' | 'debil' | 'media' | 'fuerte'
export function fortalezaContrasena(clave: string): {
  puntos: number
  nivel: NivelFortaleza
} {
  if (clave.length === 0) return { puntos: 0, nivel: 'vacia' }
  const puntos = [
    clave.length >= 12,
    clave.length >= 16,
    /[a-z]/.test(clave) && /[A-Z]/.test(clave),
    /\d/.test(clave),
    /[^A-Za-z0-9]/.test(clave),
  ].filter(Boolean).length
  return { puntos, nivel: puntos <= 1 ? 'debil' : puntos <= 3 ? 'media' : 'fuerte' }
}
