import { z } from 'zod'
import { artistaSchema } from '../artistas/tipos'

export const categoriaEventoSchema = z.enum([
  'MUSIC',
  'SPORTS',
  'TECHNOLOGY',
  'EDUCATION',
  'CULTURE',
  'ENTERTAINMENT',
])

export const estadoEventoSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'SOLD_OUT',
  'CANCELLED',
  'FINISHED',
])

export const eventoResumenSchema = z.object({
  id: z.number().int().positive(),
  eventCode: z.string().min(1),
  name: z.string().min(1),
  category: categoriaEventoSchema,
  status: estadoEventoSchema,
  eventDate: z.iso.datetime({ local: true }),
  venueName: z.string(),
})

export const eventosSchema = z.array(eventoResumenSchema)

export type CategoriaEvento = z.infer<typeof categoriaEventoSchema>
export type EstadoEvento = z.infer<typeof estadoEventoSchema>
export type EventoResumen = z.infer<typeof eventoResumenSchema>

export const categorias: Record<CategoriaEvento, string> = {
  MUSIC: 'Música',
  SPORTS: 'Deportes',
  TECHNOLOGY: 'Tecnología',
  EDUCATION: 'Educación',
  CULTURE: 'Cultura',
  ENTERTAINMENT: 'Entretenimiento',
}

export const estados: Record<EstadoEvento, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  SOLD_OUT: 'Agotado',
  CANCELLED: 'Cancelado',
  FINISHED: 'Finalizado',
}

export const eventoDetalleSchema = eventoResumenSchema.extend({
  description: z.string().nullable(),
  minimumAge: z.number().int().nonnegative(),
  venueCode: z.string().min(1),
  artists: z.array(artistaSchema),
})

export type EventoDetalle = z.infer<typeof eventoDetalleSchema>

export const crearEventoSchema = z.object({
  eventCode: z
    .string()
    .trim()
    .min(1, 'El código del evento es obligatorio.')
    .max(30, 'Usa máximo 30 caracteres.'),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre del evento es obligatorio.'),
  description: z
    .string()
    .max(1000, 'La descripción puede tener máximo 1000 caracteres.'),
  category: categoriaEventoSchema,
  eventDate: z
    .string()
    .min(1, 'Selecciona la fecha y hora del evento.'),
  minimumAge: z
    .number()
    .int('Debe ser un número entero.')
    .min(0, 'La edad mínima no puede ser negativa.'),
  venueCode: z
    .string()
    .trim()
    .min(1, 'Selecciona una sede.'),
})

export type DatosCrearEvento = z.infer<typeof crearEventoSchema>