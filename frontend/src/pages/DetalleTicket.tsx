import { Link, useParams } from 'react-router'
import { useTicket } from '../features/tickets/hooks'
import { estadosTicket, tiposTicket } from '../features/tickets/tipos'
import { codigoSchema } from '../lib/validacion'
import { fecha, precioCOP } from '../lib/formato'
import { RUTAS } from '../lib/rutas'
import { ApiError } from '../lib/http'
import BotonCopiar from '../components/BotonCopiar'
import CodigoTexto from '../components/CodigoTexto'
import Badge from '../components/Badge'
import ErrorConsulta from '../components/ErrorConsulta'
import CancelarTicket from '../components/CancelarTicket'
import Cargando from '../components/Cargando'
function NoDisponible() {
  return (
    <section className="surface">
      <h1 className="text-2xl font-bold">Ticket no disponible</h1>
      <p className="mt-3 text-slate-600">
        No encontramos una entrada disponible para tu cuenta.
      </p>
      <Link className="btn-primary mt-5" to={RUTAS.misTickets}>
        Volver a mis tickets
      </Link>
    </section>
  )
}
interface Props {
  codigo: string
}
function Contenido({ codigo }: Props) {
  const consulta = useTicket(codigo)
  if (consulta.isPending) return <Cargando texto="Cargando detalle del ticket…" />
  if (consulta.isError)
    return consulta.error instanceof ApiError &&
      [403, 404].includes(consulta.error.status) ? (
      <NoDisponible />
    ) : (
      <ErrorConsulta
        titulo="No pudimos cargar el ticket"
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => void consulta.refetch()}
      />
    )
  const t = consulta.data
  return (
    <section>
      <Link to={RUTAS.misTickets} className="text-sm text-marca-700 underline">
        Volver a mis tickets
      </Link>
      <div className="surface mt-6">
        <div className="flex flex-wrap justify-between gap-4">
          <h1 className="text-2xl font-bold">{t.eventName}</h1>
          <Badge estado={t.status} texto={estadosTicket[t.status]} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Código{' '}
            <CodigoTexto
              codigo={t.ticketCode}
              className="text-base break-all text-slate-900"
            />
          </p>
          <BotonCopiar texto={t.ticketCode} />
        </div>
        <p className="mt-3 text-sm text-slate-600">Presenta este código en el ingreso.</p>
        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          {[
            ['Tipo', tiposTicket[t.type]],
            ['Precio', precioCOP(t.price)],
            ['Comprado el', fecha(t.purchaseDate)],
            ['Titular', t.userEmail],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt className="text-sm font-semibold">{etiqueta}</dt>
              <dd className="mt-2 break-all text-slate-600">{valor}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap justify-between gap-4 border-t border-slate-200 pt-6">
          <Link className="text-marca-700 underline" to={RUTAS.evento(t.eventCode)}>
            Ver evento
          </Link>
          <CancelarTicket ticket={t} />
        </div>
      </div>
    </section>
  )
}
export default function DetalleTicket() {
  const { ticketCode } = useParams()
  const r = codigoSchema.safeParse(ticketCode)
  return r.success ? <Contenido key={r.data} codigo={r.data} /> : <NoDisponible />
}
