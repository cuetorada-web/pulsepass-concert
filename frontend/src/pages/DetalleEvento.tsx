import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { Link, useLocation, useParams } from 'react-router'
import ErrorConsulta from '../components/ErrorConsulta'
import { useAuth } from '../features/auth/AuthContext'
import { useEvento } from '../features/eventos/hooks'
import { categorias, estados } from '../features/eventos/tipos'
import { useComprarTicket } from '../features/tickets/hooks'
import {
  tiposTicket,
  tipoTicketSchema,
  type TipoTicket,
} from '../features/tickets/tipos'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

const codigoSchema = z
  .string()
  .min(1)
  .max(30)
  .refine((valor) => valor.trim().length > 0)
  .refine((valor) => !/[/?#\\]/.test(valor))

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
})

const formatoMoneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface InformacionEventoProps {
  eventCode: string
}

function EventoNoDisponible() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-bold">
        Evento no disponible
      </h1>

      <p className="mt-4 text-slate-600">
        No encontramos un evento disponible con esa dirección.
      </p>

      <Link
        to={RUTAS.eventos}
        className="mt-6 inline-flex rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700"
      >
        Volver a eventos
      </Link>
    </section>
  )
}

function InformacionEvento({
  eventCode,
}: InformacionEventoProps) {
  const auth = useAuth()
  const ubicacion = useLocation()
  const consulta = useEvento(eventCode)
  const compra = useComprarTicket()
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoTicket>('GENERAL')
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)

  if (consulta.isPending) {
    return <p role="status">Cargando evento…</p>
  }

  if (consulta.isError) {
    if (
      consulta.error instanceof ApiError &&
      [403, 404].includes(consulta.error.status)
    ) {
      return <EventoNoDisponible />
    }

    return (
      <ErrorConsulta
        titulo="No pudimos cargar el evento"
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => {
          void consulta.refetch()
        }}
      />
    )
  }

  const evento = consulta.data

  function manejarCompra(eventoFormulario: FormEvent<HTMLFormElement>) {
    eventoFormulario.preventDefault()
    setErrorFormulario(null)

    if (auth.estado !== 'autenticada') {
      return
    }

    const tipoValidado = tipoTicketSchema.safeParse(tipoSeleccionado)
    if (!tipoValidado.success) {
      setErrorFormulario('Selecciona un tipo de entrada válido.')
      return
    }

    compra.mutate(
      {
        userEmail: auth.usuario.email,
        eventCode: evento.eventCode,
        type: tipoValidado.data,
      },
      {
        onError: (error) => {
          setErrorFormulario(
            error instanceof Error
              ? error.message
              : 'No pudimos procesar la compra del ticket.',
          )
        },
      },
    )
  }

  return (
    <section aria-labelledby="titulo-evento">
      <Link
        to={RUTAS.eventos}
        className="text-sm font-semibold text-primary-700 underline"
      >
        Volver a eventos
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
            {categorias[evento.category]}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {estados[evento.status]}
          </span>
        </div>

        <h1
          id="titulo-evento"
          className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl"
        >
          {evento.name}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {evento.eventCode}
        </p>

        <p className="mt-6 whitespace-pre-line leading-7 text-slate-600">
          {evento.description?.trim() || 'Sin descripción disponible.'}
        </p>

        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Fecha y hora</dt>
            <dd className="mt-1 text-slate-600">
              <time dateTime={evento.eventDate}>
                {formatoFecha.format(new Date(evento.eventDate))}
              </time>
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

          <div>
            <dt className="font-semibold">Sede</dt>
            <dd className="mt-1">
              <Link
                to={RUTAS.sede(evento.venueCode)}
                className="text-primary-700 underline"
              >
                {evento.venueName}
              </Link>
            </dd>
          </div>
        </dl>

        <div className="mt-8 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold">Adquirir entradas</h2>

         {evento.status !== 'PUBLISHED' ? (
            <p className="mt-3 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
              La venta de entradas no está habilitada para este evento (estado actual:{' '}
              <strong>{estados[evento.status]}</strong>).
            </p>
          ) : auth.estado === 'cargando' ? (
            <p role="status" className="mt-3 text-sm text-slate-600">
              Comprobando sesión…
            </p>
          ) : auth.estado === 'error' ? (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {auth.mensaje}
            </p>
          ) : auth.estado !== 'autenticada' ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-700">
                Inicia sesión con tu cuenta para reservar o comprar entradas para este evento.
              </p>
              <Link
                to={RUTAS.login}
                state={{ desde: ubicacion.pathname }}
                className="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Iniciar sesión para comprar
              </Link>
            </div>
          ) : (
            <form onSubmit={manejarCompra} className="mt-4 max-w-md space-y-4">
              <div>
                <label
                  htmlFor="tipo-ticket"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Tipo de entrada
                </label>
                <select
                  id="tipo-ticket"
                  value={tipoSeleccionado}
                  onChange={(e) =>
                    setTipoSeleccionado(e.target.value as TipoTicket)
                  }
                  disabled={compra.isPending}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                >
                  {tipoTicketSchema.options.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tiposTicket[tipo]}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-slate-500">
                La entrada se emitirá a nombre de{' '}
                <span className="font-medium text-slate-700">
                  {auth.usuario.email}
                </span>
                .
              </p>

              {errorFormulario && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {errorFormulario}
                </p>
              )}

              {compra.isSuccess && (
                <div
                  role="status"
                  className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900"
                >
                  <p className="font-semibold">
                    ¡Entrada registrada con éxito!
                  </p>
                  <p className="mt-1">
                    Código:{' '}
                    <span className="font-mono font-semibold">
                      {compra.data.ticketCode}
                    </span>{' '}
                    · Valor: {formatoMoneda.format(compra.data.price)}
                  </p>
                  <Link
                    to={RUTAS.ticket(compra.data.ticketCode)}
                    className="mt-2 inline-block font-semibold text-emerald-800 underline"
                  >
                    Ver detalle del ticket
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={compra.isPending}
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {compra.isPending ? 'Procesando compra…' : 'Comprar entrada'}
              </button>
            </form>
          )}
        </div>
      </div>

      <section
        aria-labelledby="titulo-artistas-evento"
        className="mt-10"
      >
        <h2
          id="titulo-artistas-evento"
          className="text-2xl font-bold"
        >
          Artistas del evento
        </h2>

        {evento.artists.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-100 p-5 text-slate-600">
            Todavía no hay artistas asociados a este evento.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {evento.artists.map((artista) => (
              <li
                key={artista.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <h3 className="text-lg font-bold">
                  {artista.stageName}
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  {artista.genre?.trim() || 'Género no informado'}
                </p>

                <Link
                  to={RUTAS.artista(artista.id)}
                  aria-label={`Ver perfil de ${artista.stageName}`}
                  className="mt-4 inline-flex text-sm font-semibold text-primary-700 underline"
                >
                  Ver perfil
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

export default function DetalleEvento() {
  const { eventCode } = useParams()
  const resultado = codigoSchema.safeParse(eventCode)

  if (!resultado.success) {
    return <EventoNoDisponible />
  }

  return (
    <InformacionEvento
      key={resultado.data}
      eventCode={resultado.data}
    />
  )
}