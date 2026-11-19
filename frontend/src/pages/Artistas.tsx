import { Link } from 'react-router'
import { useArtistasActivos } from '../features/artistas/hooks'
import ErrorConsulta from '../components/ErrorConsulta'
import Estado from '../components/Estado'
import { RUTAS } from '../lib/rutas'
export default function Artistas() {
  const consulta = useArtistasActivos()
  return (
    <section>
      <h1 className="text-3xl font-bold">Artistas</h1>
      <p className="mt-3 text-slate-600">
        Conoce a quienes hacen posible cada experiencia.
      </p>
      {consulta.isPending ? (
        <p role="status" className="mt-6">
          Cargando artistas…
        </p>
      ) : consulta.isError ? (
        <ErrorConsulta
          titulo="No pudimos cargar los artistas"
          error={consulta.error}
          reintentando={consulta.isFetching}
          onReintentar={() => void consulta.refetch()}
        />
      ) : consulta.data.length === 0 ? (
        <div className="mt-6">
          <Estado titulo="Todavía no hay artistas disponibles" />
        </div>
      ) : (
        <ul className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {consulta.data.map((a) => (
            <li key={a.id} className="surface text-center">
              <div className="avatar mx-auto" aria-hidden="true">
                {a.stageName
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <h2 className="mt-4 text-lg font-bold">{a.stageName}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {a.genre?.trim() || 'Género no informado'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {a.country?.trim() || 'País no informado'}
              </p>
              <Link
                to={RUTAS.artista(a.id)}
                aria-label={`Ver detalle de ${a.stageName}`}
                className="mt-5 inline-block text-sm font-semibold text-primary-700 underline"
              >
                Ver detalle
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
