import { useState } from 'react'
import { useCancelarTicket } from '../features/tickets/hooks'
import type { Ticket } from '../features/tickets/tipos'
import Modal from './Modal'
interface Props {
  ticket: Ticket
}
export default function CancelarTicket({ ticket }: Props) {
  const [abierto, setAbierto] = useState(false)
  const cancelacion = useCancelarTicket()
  if (ticket.status !== 'PAID') return null
  return (
    <>
      <button
        type="button"
        className="btn-danger"
        onClick={() => {
          cancelacion.reset()
          setAbierto(true)
        }}
      >
        Cancelar ticket
      </button>
      {abierto && (
        <Modal
          titulo="Cancelar ticket"
          ocupado={cancelacion.isPending}
          onCerrar={() => setAbierto(false)}
        >
          <p>¿Deseas cancelar la entrada para {ticket.eventName}?</p>
          <p className="mt-3 text-sm text-slate-600">Esta acción no se puede deshacer.</p>
          {cancelacion.isError && (
            <p role="alert" className="notice-error mt-4">
              {cancelacion.error.message}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={cancelacion.isPending}
              onClick={() => setAbierto(false)}
              className="btn-secondary"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={cancelacion.isPending}
              onClick={() =>
                cancelacion.mutate(ticket.ticketCode, {
                  onSuccess: () => setAbierto(false),
                })
              }
              className="btn-danger"
            >
              {cancelacion.isPending ? 'Cancelando…' : 'Confirmar cancelación'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
