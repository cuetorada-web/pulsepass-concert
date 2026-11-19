import { z } from 'zod'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../features/auth/AuthContext'
import { useTicketsUsuario } from '../features/tickets/hooks'
import { estadoTicketSchema, estadosTicket, tiposTicket } from '../features/tickets/tipos'
import { RUTAS } from '../lib/rutas'
import { precioCOP, fecha } from '../lib/formato'
import Badge from '../components/Badge'
import CancelarTicket from '../components/CancelarTicket'
import ErrorConsulta from '../components/ErrorConsulta'
import Estado from '../components/Estado'
const filtroSchema = estadoTicketSchema.or(z.literal('')).catch('')
export default function MisTickets() {
  const auth = useAuth()
  const consulta = useTicketsUsuario(
    auth.estado === 'autenticada' ? auth.usuario.email : undefined,
  )
  const [parametros, setParametros] = useSearchParams()
  const filtro = filtroSchema.parse(parametros.get('estado') ?? '')
  const tickets = consulta.data?.filter((t) => !filtro || t.status === filtro) ?? []
  return (
    <section>
      <h1 className="text-3xl font-bold">Mis tickets</h1>
      <p className="mt-3 text-slate-600">Consulta y gestiona tus entradas.</p>
      <div
        role="group"
        aria-label="Filtrar por estado"
        className="my-6 flex flex-wrap gap-2"
      >
        {(['', ...estadoTicketSchema.options] as const).map((estado) => (
          <button
            key={estado}
            type="button"
            aria-pressed={filtro === estado}
            onClick={() => setParametros(estado ? { estado } : {})}
            className={filtro === estado ? 'btn-primary' : 'btn-secondary'}
          >
            {estado ? estadosTicket[estado] : 'Todos'}
          </button>
        ))}
      </div>
      {consulta.isPending ? (
        <p role="status">Cargando tus tickets…</p>
      ) : consulta.isError ? (
        <ErrorConsulta
          titulo="No pudimos cargar tus tickets"
          error={consulta.error}
          reintentando={consulta.isFetching}
          onReintentar={() => void consulta.refetch()}
        />
      ) : tickets.length === 0 ? (
        <Estado
          titulo={
            filtro
              ? 'No tienes tickets con este estado'
              : 'Todavía no tienes tickets registrados'
          }
          mensaje="Explora la cartelera para encontrar tu próxima experiencia."
        />
      ) : (
        <ul className="space-y-4">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="surface">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="text-lg font-bold">{ticket.eventName}</h2>
                <Badge estado={ticket.status} texto={estadosTicket[ticket.status]} />
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {tiposTicket[ticket.type]} · {precioCOP(ticket.price)} ·{' '}
                {fecha(ticket.purchaseDate)}
              </p>
              <p className="mt-2 break-all text-sm text-slate-500">{ticket.ticketCode}</p>
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <Link className="btn-secondary" to={RUTAS.ticket(ticket.ticketCode)}>
                  Ver detalle
                </Link>
                <CancelarTicket ticket={ticket} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
