import { Link, useParams } from 'react-router'
import { useEvento } from '../features/eventos/hooks'
import { categorias, estados } from '../features/eventos/tipos'
import { codigoSchema } from '../lib/validacion'
import { RUTAS } from '../lib/rutas'
import { fecha } from '../lib/formato'
import { ApiError } from '../lib/http'
import CompraTicket from '../components/CompraTicket'
import Badge from '../components/Badge'
import ErrorConsulta from '../components/ErrorConsulta'
import Cargando from '../components/Cargando'

function NoDisponible() {
  return (
    <section className="surface py-16 text-center">
      <h1 className="text-3xl font-bold">Evento no disponible</h1>
      <p className="mt-4 text-slate-600">
        No encontramos un evento disponible con esa dirección.
      </p>
      <Link className="btn-primary mt-6" to={RUTAS.eventos}>
        Volver a eventos
      </Link>
    </section>
  )
}
interface Props {
  codigo: string
}
function Contenido({ codigo }: Props) {
  const consulta = useEvento(codigo)
  if (consulta.isPending) return <Cargando texto="Cargando evento…" />
  if (consulta.isError) {
    if (consulta.error instanceof ApiError && [403, 404].includes(consulta.error.status))
      return <NoDisponible />
    return (
      <ErrorConsulta
        titulo="No pudimos cargar el evento"
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => void consulta.refetch()}
      />
    )
  }
  const evento = consulta.data
  return (
    <section className="pb-24 md:pb-0">
      <Link to={RUTAS.eventos} className="text-sm text-marca-700 underline">
        Volver a eventos
      </Link>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div
            aria-hidden="true"
            className="flex h-44 items-center justify-center bg-marca-100 text-7xl text-marca-700"
          >
            ♫
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap gap-3">
              <span className="text-sm text-slate-500">
                {categorias[evento.category]}
              </span>
              <Badge estado={evento.status} texto={estados[evento.status]} />
            </div>
            <h1 className="mt-4 text-3xl font-bold">{evento.name}</h1>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Fecha y hora</dt>
                <dd className="mt-1 text-slate-600">
                  <time dateTime={evento.eventDate}>{fecha(evento.eventDate)}</time>
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Edad mínima</dt>
                <dd className="mt-1 text-slate-600">
                  {evento.minimumAge === 0
                    ? 'Todas las edades'
                    : `${evento.minimumAge} años`}
                </dd>
              </div>
            </dl>
            <p className="mt-6 leading-7 whitespace-pre-line text-slate-600">
              {evento.description?.trim() || 'Sin descripción disponible.'}
            </p>
            <section className="mt-8">
              <h2 className="text-lg font-bold">Artistas</h2>
              {evento.artists.length === 0 ? (
                <p className="mt-3 text-slate-600">
                  Todavía no hay artistas asociados a este evento.
                </p>
              ) : (
                <ul className="mt-4 flex flex-wrap gap-3">
                  {evento.artists.map((a) => (
                    <li key={a.id}>
                      <Link
                        to={RUTAS.artista(a.id)}
                        className="inline-flex rounded-full bg-marca-50 px-4 py-2 text-sm font-semibold text-marca-700"
                      >
                        {a.stageName}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-lg font-bold">Sede</h2>
              <Link
                className="mt-3 inline-block text-marca-700 underline"
                to={RUTAS.sede(evento.venueCode)}
              >
                {evento.venueName}
              </Link>
            </section>
          </div>
        </div>
        <CompraTicket evento={evento} />
      </div>
    </section>
  )
}
export default function DetalleEvento() {
  const { eventCode } = useParams()
  const resultado = codigoSchema.max(30).safeParse(eventCode)
  return resultado.success ? (
    <Contenido key={resultado.data} codigo={resultado.data} />
  ) : (
    <NoDisponible />
  )
}
