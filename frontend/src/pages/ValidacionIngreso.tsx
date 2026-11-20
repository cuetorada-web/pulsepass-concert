import { useState } from 'react'
import { useTicket } from '../features/tickets/hooks'
import { estadosTicket, tiposTicket } from '../features/tickets/tipos'
import BusquedaCodigo from '../components/BusquedaCodigo'
import ErrorConsulta from '../components/ErrorConsulta'
import IngresoTicket from '../components/IngresoTicket'
import { ApiError } from '../lib/http'
import CodigoTexto from '../components/CodigoTexto'
import Badge from '../components/Badge'
import Cargando from '../components/Cargando'
interface Props {
  codigo: string
  onIngreso: () => void
}
function Resultado({ codigo, onIngreso }: Props) {
  const consulta = useTicket(codigo)
  if (consulta.isPending) return <Cargando texto="Buscando ticket…" />
  if (consulta.isError)
    return (
      <ErrorConsulta
        titulo={
          consulta.error instanceof ApiError && consulta.error.status === 404
            ? 'Ticket no encontrado'
            : 'No pudimos buscar el ticket'
        }
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => void consulta.refetch()}
      />
    )
  const ticket = consulta.data
  return (
    <div className="surface mt-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-xl font-bold">{ticket.eventName}</h2>
        <Badge estado={ticket.status} texto={estadosTicket[ticket.status]} />
      </div>
      <p className="mt-3 text-sm break-all text-slate-600">
        <CodigoTexto codigo={ticket.ticketCode} /> · {tiposTicket[ticket.type]}
      </p>
      <p className="mt-2 mb-6 text-sm break-all text-slate-600">{ticket.userEmail}</p>
      <IngresoTicket ticket={ticket} onExito={onIngreso} />
    </div>
  )
}
export default function ValidacionIngreso() {
  const [busqueda, setBusqueda] = useState<{ codigo: string; intento: number } | null>(
    null,
  )
  const [limpieza, setLimpieza] = useState(0)
  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Validación de ingreso</h1>
      <p className="mt-3 text-slate-600">
        Busca el código de la entrada y registra el acceso.
      </p>
      <BusquedaCodigo
        key={limpieza}
        enfocar
        etiqueta="Código del ticket"
        onBuscar={(codigo) =>
          setBusqueda((prev) => ({ codigo, intento: (prev?.intento ?? 0) + 1 }))
        }
      />
      {busqueda && (
        <Resultado
          key={busqueda.intento}
          codigo={busqueda.codigo}
          onIngreso={() => setLimpieza((n) => n + 1)}
        />
      )}
    </section>
  )
}
