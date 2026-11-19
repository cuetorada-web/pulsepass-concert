import { useUsarTicket } from '../features/tickets/hooks'
import type { Ticket } from '../features/tickets/tipos'
interface Props {
  ticket: Ticket
}
export default function IngresoTicket({ ticket }: Props) {
  const ingreso = useUsarTicket()
  return (
    <div>
      {ticket.status === 'PAID' && (
        <button
          type="button"
          className="btn-primary"
          disabled={ingreso.isPending}
          onClick={() => ingreso.mutate(ticket.ticketCode)}
        >
          {ingreso.isPending ? 'Registrando…' : 'Marcar como usado'}
        </button>
      )}
      {ingreso.isSuccess && (
        <p role="status" className="notice-success mt-4">
          Ingreso registrado.
        </p>
      )}
      {ingreso.isError && (
        <p role="alert" className="notice-error mt-4">
          {ingreso.error.message}
        </p>
      )}
      {ticket.status !== 'PAID' && !ingreso.isSuccess && (
        <p className="mt-3 text-slate-600">
          El ticket ya fue utilizado o no está disponible para ingreso.
        </p>
      )}
    </div>
  )
}
