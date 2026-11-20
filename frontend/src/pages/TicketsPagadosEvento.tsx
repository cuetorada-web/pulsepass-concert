import { useNavigate, useParams } from 'react-router'
import { useTicketsPagados } from '../features/tickets/hooks'
import { tiposTicket } from '../features/tickets/tipos'
import { codigoSchema } from '../lib/validacion'
import { precioCOP } from '../lib/formato'
import { RUTAS } from '../lib/rutas'
import BusquedaCodigo from '../components/BusquedaCodigo'
import ErrorConsulta from '../components/ErrorConsulta'
import IngresoTicket from '../components/IngresoTicket'
import { Tabla } from '../components/ui'
import NoEncontrada from './NoEncontrada'
import Cargando from '../components/Cargando'
interface Props {
  codigo: string
}
function Listado({ codigo }: Props) {
  const consulta = useTicketsPagados(codigo)
  if (consulta.isPending) return <Cargando texto="Cargando tickets pagados…" />
  if (consulta.isError)
    return (
      <ErrorConsulta
        titulo="No pudimos consultar los tickets"
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => void consulta.refetch()}
      />
    )
  return (
    <div className="mt-8">
      <p role="status" className="mb-4 text-sm text-slate-600">
        Total: {consulta.data.length} tickets pagados
      </p>
      {consulta.data.length === 0 ? (
        <div className="surface">No hay tickets pagados para este código de evento.</div>
      ) : (
        <>
          <div className="hidden md:block">
            <Tabla
              titulo={`Tickets pagados de ${codigo}`}
              filas={consulta.data}
              clave={(t) => t.id}
              columnas={[
                { encabezado: 'Código', celda: (t) => t.ticketCode },
                { encabezado: 'Tipo', celda: (t) => tiposTicket[t.type] },
                { encabezado: 'Titular', celda: (t) => t.userEmail },
                { encabezado: 'Precio', celda: (t) => precioCOP(t.price) },
                { encabezado: 'Acción', celda: (t) => <IngresoTicket ticket={t} /> },
              ]}
            />
          </div>
          <ul className="grid gap-4 md:hidden">
            {consulta.data.map((ticket) => (
              <li key={ticket.id} className="surface">
                <h2 className="font-bold break-all">{ticket.ticketCode}</h2>
                <p className="mt-2 text-sm text-slate-600">{ticket.eventName}</p>
                <p className="my-3 text-sm break-all text-slate-600">
                  {tiposTicket[ticket.type]} · {ticket.userEmail} ·{' '}
                  {precioCOP(ticket.price)}
                </p>
                <IngresoTicket ticket={ticket} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
export default function TicketsPagadosEvento() {
  const { eventCode } = useParams()
  const navegar = useNavigate()
  const resultado = codigoSchema.safeParse(eventCode)
  if (eventCode !== undefined && !resultado.success) return <NoEncontrada />
  return (
    <section>
      <h1 className="text-3xl font-bold">
        Tickets pagados{resultado.success ? ` · ${resultado.data}` : ''}
      </h1>
      <BusquedaCodigo
        key={`busqueda-${eventCode ?? 'buscar'}`}
        etiqueta="Código del evento"
        inicial={eventCode}
        onBuscar={(codigo) => void navegar(RUTAS.pagados(codigo))}
      />
      {resultado.success && (
        <Listado key={`lista-${resultado.data}`} codigo={resultado.data} />
      )}
    </section>
  )
}
