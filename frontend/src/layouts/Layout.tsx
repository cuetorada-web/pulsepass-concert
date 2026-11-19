import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../features/auth/AuthContext'
import { cerrarSesion } from '../features/auth/sesion'
import { RUTAS } from '../lib/rutas'
import Avisos from '../components/Avisos'

function temaInicial() {
  try {
    const tema = localStorage.getItem('pulsepass.tema')
    if (tema === 'dark' || tema === 'light') return tema
  } catch {
    /* Preferencia opcional. */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
export default function Layout() {
  const auth = useAuth()
  const ubicacion = useLocation()
  const [menu, setMenu] = useState(false)
  const [tema, setTema] = useState(temaInicial)
  const botonMenu = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
    document.documentElement.style.colorScheme = tema
    try {
      localStorage.setItem('pulsepass.tema', tema)
    } catch {
      /* Preferencia opcional. */
    }
  }, [tema])
  useEffect(() => {
    const marco = requestAnimationFrame(() =>
      document.getElementById('contenido')?.focus({ preventScroll: true }),
    )
    return () => cancelAnimationFrame(marco)
  }, [ubicacion.pathname])
  const autenticada = auth.estado === 'autenticada'
  const operativo =
    autenticada && auth.usuario.roles.some((r) => r === 'ADMIN' || r === 'STAFF')
  const admin = autenticada && auth.usuario.roles.includes('ADMIN')
  const enlaces = [
    { ruta: RUTAS.eventos, texto: 'Eventos' },
    { ruta: RUTAS.artistas, texto: 'Artistas' },
    { ruta: RUTAS.sedes, texto: 'Sedes' },
    ...(autenticada ? [{ ruta: RUTAS.misTickets, texto: 'Mis tickets' }] : []),
    ...(operativo
      ? [
          { ruta: RUTAS.validacionIngreso, texto: 'Validar ingreso' },
          { ruta: RUTAS.buscarTicketsPagados, texto: 'Tickets pagados' },
        ]
      : []),
    ...(admin ? [{ ruta: RUTAS.adminEventos, texto: 'Administrar eventos' }] : []),
  ]
  if (auth.estado === 'anonima' && auth.expirada && ubicacion.pathname !== RUTAS.login)
    return (
      <Navigate
        to={RUTAS.login}
        replace
        state={{ desde: ubicacion.pathname + ubicacion.search }}
      />
    )
  return (
    <div className="flex min-h-screen flex-col">
      <Avisos />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:block focus:bg-white focus:p-4"
      >
        Saltar al contenido
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link
            to={RUTAS.inicio}
            className="flex items-center gap-2 text-xl font-bold tracking-tight"
            onClick={() => setMenu(false)}
          >
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-lg bg-primary-600 text-white"
            >
              ♫
            </span>
            PulsePass
          </Link>
          <button
            ref={botonMenu}
            type="button"
            aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menu}
            aria-controls="navegacion-principal"
            className="rounded-lg border border-slate-200 px-3 py-2 md:hidden"
            onClick={() => setMenu(!menu)}
          >
            {menu ? '✕' : '☰'}
          </button>
          <div
            id="navegacion-principal"
            className={`${menu ? 'flex' : 'hidden'} w-full flex-col gap-4 md:flex md:w-auto md:flex-1 md:flex-row md:flex-wrap md:items-center md:justify-end`}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setMenu(false)
                botonMenu.current?.focus()
              }
            }}
          >
            <nav
              aria-label="Navegación principal"
              className="flex flex-col gap-1 md:flex-row md:flex-wrap"
            >
              {enlaces.map(({ ruta, texto }) => (
                <NavLink
                  key={ruta}
                  to={ruta}
                  onClick={() => setMenu(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'}`
                  }
                >
                  {texto}
                </NavLink>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {autenticada ? (
                <>
                  <Link
                    to={RUTAS.cuenta}
                    onClick={() => setMenu(false)}
                    className="font-semibold text-primary-700"
                  >
                    {auth.usuario.username}
                  </Link>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      cerrarSesion()
                      setMenu(false)
                    }}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : auth.estado === 'cargando' ? (
                <span role="status">Comprobando sesión…</span>
              ) : (
                <>
                  <Link
                    to={RUTAS.login}
                    onClick={() => setMenu(false)}
                    className="text-primary-700"
                  >
                    Ingresar
                  </Link>
                  <Link
                    to={RUTAS.registro}
                    onClick={() => setMenu(false)}
                    className="btn-primary"
                  >
                    Registrarse
                  </Link>
                </>
              )}
              <button
                type="button"
                aria-label={
                  tema === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
                onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
              >
                {tema === 'dark' ? '☀' : '☾'}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-9 outline-none"
      >
        <Outlet />
      </main>
      <footer className="mt-12 border-t border-slate-200 px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} PulsePass · Caso de estudio académico</p>
          <nav aria-label="Enlaces del pie" className="flex gap-4">
            <Link to={RUTAS.eventos}>Eventos</Link>
            <Link to={RUTAS.artistas}>Artistas</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
