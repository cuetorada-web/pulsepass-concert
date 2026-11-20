import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import ErrorConsulta from '../components/ErrorConsulta'
import { useSedesActivas } from '../features/sedes/hooks'
import Cargando from '../components/Cargando'

const formatoNumero = new Intl.NumberFormat('es-CO')

export default function Sedes() {
  const consulta = useSedesActivas()

  return (
    <section aria-labelledby="titulo-sedes">
      <h1 id="titulo-sedes" className="text-3xl font-bold tracking-tight">
        Sedes
      </h1>

      <p className="mt-3 text-slate-600">
        Descubre los lugares donde suceden los eventos.
      </p>

      {consulta.isPending ? (
        <Cargando texto="Cargando sedes…" />
      ) : consulta.isError ? (
        <ErrorConsulta
          titulo="No pudimos cargar las sedes"
          error={consulta.error}
          reintentando={consulta.isFetching}
          onReintentar={() => {
            void consulta.refetch()
          }}
        />
      ) : consulta.data.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">Todavía no hay sedes disponibles</h2>

          <p className="mt-3 text-slate-600">
            Aquí aparecerán los espacios disponibles para los eventos.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {consulta.data.map((sede) => (
            <li key={sede.id}>
              <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="inline-block rounded-full bg-marca-50 px-3 py-1 text-xs font-semibold text-marca-700">
                  {sede.city}
                </span>

                <h2 className="mt-4 text-xl font-bold">{sede.name}</h2>

                <p className="mt-2 text-sm text-slate-500">{sede.code}</p>

                <dl className="mt-6 space-y-4 text-sm">
                  <div>
                    <dt className="font-semibold">Dirección</dt>
                    <dd className="mt-1 text-slate-600">{sede.address}</dd>
                  </div>

                  <div>
                    <dt className="font-semibold">Capacidad de la sede</dt>
                    <dd className="mt-1 text-slate-600">
                      {formatoNumero.format(sede.capacity)} personas
                    </dd>
                  </div>
                </dl>
                <Link
                  to={RUTAS.sede(sede.code)}
                  aria-label={`Ver detalle de ${sede.name}`}
                  className="mt-6 inline-flex rounded-lg bg-marca-600 px-4 py-2 text-sm font-semibold text-white hover:bg-marca-700"
                >
                  Ver detalle
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
