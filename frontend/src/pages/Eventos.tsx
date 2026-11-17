import { useEventosPublicados } from '../features/eventos/hooks'
import { categorias, estados } from '../features/eventos/tipos'
import { ApiError } from '../lib/http'
import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
})

export default function Eventos() {
  const consulta = useEventosPublicados()

  return (
    <section aria-labelledby="titulo-eventos">
      <h1
        id="titulo-eventos"
        className="text-3xl font-bold tracking-tight"
      >
        Explora los eventos
      </h1>

      <p className="mt-3 text-slate-600">
        Encuentra tu próxima experiencia.
      </p>

      {consulta.isPending ? (
        <p role="status" className="mt-8 text-slate-600">
          Cargando eventos…
        </p>
      ) : consulta.isError ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <h2 className="font-semibold text-red-900">
            No pudimos cargar los eventos
          </h2>

          <p className="mt-2 text-red-800">
            {consulta.error instanceof ApiError
              ? consulta.error.message
              : 'Ocurrió un error inesperado.'}
          </p>

          <button
            type="button"
            onClick={() => void consulta.refetch()}
            disabled={consulta.isFetching}
            className="mt-4 rounded-lg bg-white px-4 py-2 font-medium text-red-800 disabled:opacity-50"
          >
            {consulta.isFetching ? 'Reintentando…' : 'Reintentar'}
          </button>
        </div>
      ) : consulta.data.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">
            Todavía no hay eventos publicados
          </h2>

          <p className="mt-3 text-slate-600">
            Vuelve pronto para descubrir nuevas experiencias.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {consulta.data.map((evento) => (
            <article
              key={evento.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  {categorias[evento.category]}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {estados[evento.status]}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold">
                {evento.name}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {evento.eventCode}
              </p>

              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-900">
                    Fecha
                  </dt>
                  <dd className="mt-1 text-slate-600">
                    <time dateTime={evento.eventDate}>
                      {formatoFecha.format(new Date(evento.eventDate))}
                    </time>
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-900">
                    Sede
                  </dt>
                  <dd className="mt-1 text-slate-600">
                    {evento.venueName}
                  </dd>
                </div>
              </dl>
             <Link
                to={RUTAS.evento(evento.eventCode)}
                aria-label={`Ver detalle de ${evento.name}`}
                className="mt-6 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Ver detalle
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}