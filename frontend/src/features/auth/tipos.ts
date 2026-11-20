import { z } from 'zod'

export const registroSchema = z.object({
  username: z.string().trim().min(1, 'Escribe tu usuario.'),
  email: z.email('Escribe un correo válido.'),
  firstName: z.string().trim().min(1, 'Escribe tus nombres.'),
  lastName: z.string().trim().min(1, 'Escribe tus apellidos.'),
  phone: z.string(),
  city: z.string(),
  birthDate: z.iso.date('Selecciona una fecha válida.').refine((valor) => {
    const hoy = new Date(Date.now())
    const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    return valor <= fechaLocal
  }, 'La fecha de nacimiento no puede ser futura.'),
  password: z
    .string()
    .min(12, 'Usa al menos 12 caracteres.')
    .max(72, 'Usa como máximo 72 caracteres.')
    .refine(
      (valor) => new TextEncoder().encode(valor).length <= 72,
      'La contraseña supera el límite de 72 bytes.',
    ),
})

export type DatosRegistro = z.infer<typeof registroSchema>

export const usuarioSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  email: z.email(),
  active: z.boolean(),
  firstName: z.string(),
  lastName: z.string(),
})
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Escribe tu usuario o correo.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
})

export type DatosLogin = z.infer<typeof loginSchema>

export const respuestaLoginSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive().max(86400),
})

export const usuarioAutenticadoSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  email: z.email(),
  roles: z.array(z.enum(['USER', 'STAFF', 'ADMIN'])),
})
