import { Link } from 'react-router'
import ErrorConsulta from '../components/ErrorConsulta'
import { useAuth } from '../features/auth/AuthContext'
import { useTicketsUsuario } from '../features/tickets/hooks'
import {
  estadosTicket,
  tiposTicket,
  type EstadoTicket,
} from '../features/tickets/tipos'
import { RUTAS } from '../lib/rutas'

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatoMoneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const estilosEstado: Record<EstadoTicket, string> = {
  RESERVED: 'bg-amber-50 text-amber-800',
  PAID: 'bg-emerald-50 text-emerald-800',
  CANCELLED: 'bg-red-50 text-red-700',
  USED: 'bg-slate-100 text-slate-700',
}

export default function MisTickets() {
  const auth = useAuth()
  const email =
    auth.estado === 'autenticada' ? auth.usuario.email : undefined

  const consulta = useTicketsUsuario(email)

  if (consulta.isPending) {
    return <p role="status">Cargando tus tickets…</p>
  }

  if (consulta.isError) {
    return (
      <ErrorConsulta
        titulo="No pudimos cargar tus tickets"
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => {
          void consulta.refetch()
        }}
      />
    )
  }

  const tickets = consulta.data

  return (
    <section aria-labelledby="titulo-mis-tickets">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            id="titulo-mis-tickets"
            className="text-3xl font-bold tracking-tight"
          >
            Mis tickets
          </h1>
          <p className="mt-2 text-slate-600">
            Consulta y gestiona las entradas asociadas a tu cuenta.
          </p>
        </div>

        <Link
          to={RUTAS.eventos}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Explorar eventos
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="text-lg font-bold">
            Todavía no tienes tickets registrados
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Cuando compres o reserves una entrada para un evento, aparecerá aquí.
          </p>
          <Link
            to={RUTAS.eventos}
            className="mt-5 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Ver eventos disponibles
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                    {tiposTicket[ticket.type]}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${estilosEstado[ticket.status]}`}
                  >
                    {estadosTicket[ticket.status]}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-bold">
                  <Link
                    to={RUTAS.evento(ticket.eventCode)}
                    className="hover:text-primary-700 hover:underline"
                  >
                    {ticket.eventName}
                  </Link>
                </h2>

                <p className="mt-1 font-mono text-xs text-slate-500">
                  Código: {ticket.ticketCode}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Valor</dt>
                    <dd className="font-semibold text-slate-900">
                      {formatoMoneda.format(ticket.price)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Fecha de compra</dt>
                    <dd className="text-slate-700">
                      <time dateTime={ticket.purchaseDate}>
                        {formatoFecha.format(new Date(ticket.purchaseDate))}
                      </time>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 pt-2">
                <Link
                  to={RUTAS.ticket(ticket.ticketCode)}
                  className="inline-flex text-sm font-semibold text-primary-700 underline"
                >
                  Ver detalle del ticket
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}