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
