import { Link, useParams } from 'react-router'
import { codigoSchema } from '../lib/validacion'
import { useTicket } from '../features/tickets/hooks'
import { precioCOP } from '../lib/formato'
import { RUTAS } from '../lib/rutas'
import ErrorConsulta from '../components/ErrorConsulta'
import NoEncontrada from './NoEncontrada'

interface Props {
  codigo: string
}
function Confirmacion({ codigo }: Props) {
  const consulta = useTicket(codigo)
  if (consulta.isPending) return <p role="status">Cargando confirmación…</p>
  if (consulta.isError)
    return (
      <ErrorConsulta
        titulo="Ticket no disponible"
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => void consulta.refetch()}
      />
    )
  const ticket = consulta.data
  return (
    <section className="surface mx-auto max-w-xl py-14 text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-800"
      >
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-bold">¡Compra realizada con éxito!</h1>
      <p className="mt-4 font-semibold">{ticket.eventName}</p>
      <p className="mt-2 break-all text-sm text-slate-600">Ticket: {ticket.ticketCode}</p>
      <p className="mt-2 text-slate-600">Total: {precioCOP(ticket.price)}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link className="btn-primary" to={RUTAS.ticket(ticket.ticketCode)}>
          Ver mi ticket
        </Link>
        <Link className="btn-secondary" to={RUTAS.eventos}>
          Seguir explorando
        </Link>
      </div>
    </section>
  )
}
export default function ConfirmacionCompra() {
  const { ticketCode } = useParams()
  const resultado = codigoSchema.safeParse(ticketCode)
  return resultado.success ? <Confirmacion codigo={resultado.data} /> : <NoEncontrada />
}
