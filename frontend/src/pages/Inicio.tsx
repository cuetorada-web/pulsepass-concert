import { Link } from 'react-router'
import { useEventosPublicados } from '../features/eventos/hooks'
import { useArtistasActivos } from '../features/artistas/hooks'
import { RUTAS } from '../lib/rutas'
import TarjetaEvento from '../components/TarjetaEvento'
import ErrorConsulta from '../components/ErrorConsulta'
import Estado from '../components/Estado'
import { useAuth } from '../features/auth/AuthContext'
export default function Inicio() {
  const auth = useAuth()
  const eventos = useEventosPublicados()
  const artistas = useArtistasActivos()
  return (
    <div>
      <section className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 px-6 py-12 text-white sm:px-10 sm:py-14">
        <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
          Descubre los mejores eventos
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/90">
          Música, cultura, deporte y tecnología en un solo lugar.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            to={RUTAS.eventos}
            className="hero-cta rounded-lg px-6 py-3 text-center text-sm font-bold"
          >
            Ver cartelera
          </Link>
          {auth.estado === 'autenticada' ? (
            <Link
              to={RUTAS.misTickets}
              className="rounded-lg border border-white/70 px-6 py-3 text-center text-sm font-semibold"
            >
              Ver mis tickets
            </Link>
          ) : auth.estado === 'anonima' ? (
            <Link
              to={RUTAS.registro}
              className="rounded-lg border border-white/70 px-6 py-3 text-center text-sm font-semibold"
            >
              Crear cuenta
            </Link>
          ) : null}
        </div>
      </section>
      <section className="mt-10" aria-labelledby="proximos-eventos">
        <div className="mb-5 flex justify-between gap-3">
          <h2 id="proximos-eventos" className="text-xl font-bold">
            Próximos eventos
          </h2>
          <Link className="text-sm font-semibold text-primary-700" to={RUTAS.eventos}>
            Ver cartelera
          </Link>
        </div>
        {eventos.isPending ? (
          <p role="status">Cargando eventos…</p>
        ) : eventos.isError ? (
          <ErrorConsulta
            titulo="No pudimos cargar los eventos"
            error={eventos.error}
            reintentando={eventos.isFetching}
            onReintentar={() => void eventos.refetch()}
          />
        ) : eventos.data.length === 0 ? (
          <Estado titulo="Todavía no hay eventos publicados" />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.data.slice(0, 3).map((evento) => (
              <li key={evento.id}>
                <TarjetaEvento evento={evento} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-10" aria-labelledby="artistas-destacados">
        <div className="mb-5 flex justify-between gap-3">
          <h2 id="artistas-destacados" className="text-xl font-bold">
            Artistas destacados
          </h2>
          <Link to={RUTAS.artistas} className="text-sm font-semibold text-primary-700">
            Ver todos
          </Link>
        </div>
        {artistas.isPending ? (
          <p role="status">Cargando artistas…</p>
        ) : artistas.isError ? (
          <ErrorConsulta
            titulo="No pudimos cargar artistas"
            error={artistas.error}
            reintentando={artistas.isFetching}
            onReintentar={() => void artistas.refetch()}
          />
        ) : artistas.data.length === 0 ? (
          <p className="text-slate-600">Todavía no hay artistas disponibles.</p>
        ) : (
          <ul className="flex flex-wrap gap-6">
            {artistas.data.slice(0, 3).map((a) => (
              <li key={a.id}>
                <Link className="flex items-center gap-3" to={RUTAS.artista(a.id)}>
                  <span className="avatar" aria-hidden="true">
                    {a.stageName
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span className="text-sm font-semibold">{a.stageName}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
