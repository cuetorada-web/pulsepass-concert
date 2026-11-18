import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../features/auth/AuthContext'
import { cerrarSesion } from '../features/auth/sesion'
import { RUTAS } from '../lib/rutas'

const enlacesPublicos = [
  { ruta: RUTAS.inicio, texto: 'Inicio' },
  { ruta: RUTAS.eventos, texto: 'Eventos' },
  { ruta: RUTAS.artistas, texto: 'Artistas' },
  { ruta: RUTAS.sedes, texto: 'Sedes' },
]

export default function Layout() {
  const auth = useAuth()
  const ubicacion = useLocation()

  if (
    auth.estado === 'anonima' &&
    auth.expirada &&
    ubicacion.pathname !== RUTAS.login
  ) {
    return <Navigate to={RUTAS.login} replace />
  }

  const esAutenticada = auth.estado === 'autenticada'
  const esAdmin =
    esAutenticada && auth.usuario.roles.includes('ADMIN')

  const enlaces = [
    ...enlacesPublicos,
    ...(esAutenticada
      ? [{ ruta: RUTAS.misTickets, texto: 'Mis tickets' }]
      : []),
    ...(esAdmin
      ? [{ ruta: RUTAS.adminEventos, texto: 'Administrar eventos' }]
      : []),
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:block focus:bg-white focus:p-4"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <Link
            to={RUTAS.inicio}
            className="text-2xl font-bold tracking-tight text-primary-600"
          >
            PulsePass
          </Link>

          <nav aria-label="Navegación principal" className="flex flex-wrap gap-2">
            {enlaces.map(({ ruta, texto }) => (
              <NavLink
                key={ruta}
                to={ruta}
                end={ruta === RUTAS.inicio}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2 text-sm font-medium',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                {texto}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {auth.estado === 'autenticada' ? (
              <>
                <span className="text-slate-600">
                  Hola, {auth.usuario.username}
                </span>
                <button
                  type="button"
                  onClick={() => cerrarSesion()}
                  className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-100"
                >
                  Cerrar sesión
                </button>
              </>
            ) : auth.estado === 'cargando' ? (
              <span role="status">Comprobando sesión…</span>
            ) : (
              <>
                <Link to={RUTAS.login} className="text-primary-700">
                  Iniciar sesión
                </Link>
                <Link
                  to={RUTAS.registro}
                  className="rounded-lg bg-primary-600 px-3 py-2 text-white hover:bg-primary-700"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-5 py-10"
      >
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 px-5 py-6 text-center text-sm text-slate-500">
        PulsePass · Plataforma de eventos y entradas
      </footer>
    </div>
  )
}