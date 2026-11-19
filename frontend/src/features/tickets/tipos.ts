import { z } from 'zod'

export const tipoTicketSchema = z.enum(['GENERAL', 'VIP', 'BACKSTAGE', 'STUDENT'])

export const estadoTicketSchema = z.enum(['RESERVED', 'PAID', 'CANCELLED', 'USED'])

export const ticketSchema = z.object({
  id: z.number().int().positive(),
  ticketCode: z.string().min(1),
  type: tipoTicketSchema,
  price: z.number().nonnegative(),
  status: estadoTicketSchema,
  purchaseDate: z.iso.datetime({ local: true }),
  userEmail: z.email(),
  eventCode: z.string().min(1),
  eventName: z.string().min(1),
})

export const ticketsSchema = z.array(ticketSchema)

export const compraTicketSchema = z.object({
  userEmail: z.email('Escribe un correo válido.'),
  eventCode: z.string().trim().min(1, 'El código del evento es obligatorio.'),
  type: tipoTicketSchema,
})

export type TipoTicket = z.infer<typeof tipoTicketSchema>
export type EstadoTicket = z.infer<typeof estadoTicketSchema>
export type Ticket = z.infer<typeof ticketSchema>
export type DatosCompraTicket = z.infer<typeof compraTicketSchema>

export const tiposTicket: Record<TipoTicket, string> = {
  GENERAL: 'General',
  VIP: 'VIP',
  BACKSTAGE: 'Backstage',
  STUDENT: 'Estudiante',
}

export const estadosTicket: Record<EstadoTicket, string> = {
  RESERVED: 'Reservado',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
  USED: 'Usado',
}
