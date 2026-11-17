import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
import ErrorConsulta from '../components/ErrorConsulta'
import { useArtistasActivos } from '../features/artistas/hooks'

export default function Artistas() {
  const consulta = useArtistasActivos()

  return (
    <section aria-labelledby="titulo-artistas">
      <h1
        id="titulo-artistas"
        className="text-3xl font-bold tracking-tight"
      >
        Artistas
      </h1>

      <p className="mt-3 text-slate-600">
        Conoce a quienes hacen posible cada experiencia.
      </p>

      {consulta.isPending ? (
        <p role="status" className="mt-8 text-slate-600">
          Cargando artistas…
        </p>
      ) : consulta.isError ? (
        <ErrorConsulta
          titulo="No pudimos cargar los artistas"
          error={consulta.error}
          reintentando={consulta.isFetching}
          onReintentar={() => {
            void consulta.refetch()
          }}
        />
      ) : consulta.data.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">
            Todavía no hay artistas disponibles
          </h2>

          <p className="mt-3 text-slate-600">
            Vuelve pronto para conocer las novedades.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {consulta.data.map((artista) => (
            <li key={artista.id}>
              <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  Artista
                </span>

                <h2 className="mt-4 text-xl font-bold">
                  {artista.stageName}
                </h2>

                <dl className="mt-6 space-y-4 text-sm">
                  <div>
                    <dt className="font-semibold">País</dt>
                    <dd className="mt-1 text-slate-600">
                      {artista.country?.trim() || 'No informado'}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-semibold">Género</dt>
                    <dd className="mt-1 text-slate-600">
                      {artista.genre?.trim() || 'No informado'}
                    </dd>
                  </div>
                </dl>

                <Link
                  to={RUTAS.artista(artista.id)}
                  aria-label={`Ver detalle de ${artista.stageName}`}
                  className="mt-6 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
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