import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import ErrorConsulta from '../components/ErrorConsulta'
import { useEventosPublicados } from '../features/eventos/hooks'
import { categorias, estados } from '../features/eventos/tipos'
import { RUTAS } from '../lib/rutas'

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function AdminEventos() {
  const navigate = useNavigate()
  const consulta = useEventosPublicados()
  const [codigoBusqueda, setCodigoBusqueda] = useState('')

  function manejarBusquedaPorCodigo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const limpio = codigoBusqueda.trim()
    if (!limpio) return
    void navigate(RUTAS.adminEvento(limpio))
  }

  return (
    <section aria-labelledby="titulo-admin-eventos">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            id="titulo-admin-eventos"
            className="text-3xl font-bold tracking-tight"
          >
            Administrar eventos
          </h1>
          <p className="mt-2 text-slate-600">
            Crea nuevos eventos, asocia artistas y publica carteleras.
          </p>
        </div>

        <Link
          to={RUTAS.adminNuevoEvento}
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Nuevo evento
        </Link>
      </div>

      <form
        onSubmit={manejarBusquedaPorCodigo}
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <label
          htmlFor="buscar-event-code"
          className="block text-sm font-semibold text-slate-800"
        >
          Gestionar evento por código (incluye borradores)
        </label>
        <div className="mt-2 flex flex-wrap gap-3">
          <input
            id="buscar-event-code"
            type="text"
            placeholder="Ej. EVT-2026-001"
            value={codigoBusqueda}
            onChange={(e) => setCodigoBusqueda(e.target.value)}
            className="min-w-60 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Abrir gestión
          </button>
        </div>
      </form>

      <div className="mt-10">
        <h2 className="text-xl font-bold">Eventos publicados</h2>

        {consulta.isPending ? (
          <p role="status" className="mt-4 text-slate-600">
            Cargando eventos…
          </p>
        ) : consulta.isError ? (
          <div className="mt-4">
            <ErrorConsulta
              titulo="No pudimos cargar los eventos"
              error={consulta.error}
              reintentando={consulta.isFetching}
              onReintentar={() => {
                void consulta.refetch()
              }}
            />
          </div>
        ) : consulta.data.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-100 p-5 text-sm text-slate-600">
            Aún no hay eventos publicados. Crea uno con el botón «Nuevo evento».
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {consulta.data.map((evento) => (
              <li
                key={evento.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                      {categorias[evento.category]}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {estados[evento.status]}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold">{evento.name}</h3>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {evento.eventCode} · {evento.venueName}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    <time dateTime={evento.eventDate}>
                      {formatoFecha.format(new Date(evento.eventDate))}
                    </time>
                  </p>
                </div>

                <div className="mt-5 pt-2">
                  <Link
                    to={RUTAS.adminEvento(evento.eventCode)}
                    className="text-sm font-semibold text-primary-700 underline"
                  >
                    Administrar evento
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}