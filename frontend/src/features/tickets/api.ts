import { http } from '../../lib/http'
import {
  type DatosCompraTicket,
  type Ticket,
  ticketSchema,
  ticketsSchema,
} from './tipos'

export function listarTicketsUsuario(
  email: string,
  signal?: AbortSignal,
): Promise<Ticket[]> {
  return http(
    `/api/tickets/by-user?email=${encodeURIComponent(email)}`,
    ticketsSchema,
    signal,
  )
}

export function obtenerTicket(
  ticketCode: string,
  signal?: AbortSignal,
): Promise<Ticket> {
  return http(
    `/api/tickets/${encodeURIComponent(ticketCode)}`,
    ticketSchema,
    signal,
  )
}

export function comprarTicket(
  datos: DatosCompraTicket,
): Promise<Ticket> {
  return http('/api/tickets', ticketSchema, undefined, {
    method: 'POST',
    body: datos,
  })
}

export function cancelarTicket(
  ticketCode: string,
): Promise<Ticket> {
  return http(
    `/api/tickets/${encodeURIComponent(ticketCode)}/cancel`,
    ticketSchema,
    undefined,
    {
      method: 'PATCH',
    },
  )
}