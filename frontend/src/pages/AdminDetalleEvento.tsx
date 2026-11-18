import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { Link, useParams } from 'react-router'
import ErrorConsulta from '../components/ErrorConsulta'
import { useArtistasActivos } from '../features/artistas/hooks'
import {
  useAsociarArtistaEvento,
  useEvento,
  usePublicarEvento,
} from '../features/eventos/hooks'
import { categorias, estados } from '../features/eventos/tipos'
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

function EventoAdminNoEncontrado() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-bold">Evento no encontrado</h1>
      <p className="mt-4 text-slate-600">
        No existe un evento registrado con ese código.
      </p>
      <Link
        to={RUTAS.adminEventos}
        className="mt-6 inline-flex rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700"
      >
        Volver a administrar eventos
      </Link>
    </section>
  )
}

function PanelGestionEvento({ eventCode }: { eventCode: string }) {
  const consulta = useEvento(eventCode)
  const artistasConsulta = useArtistasActivos()
  const publicacion = usePublicarEvento()
  const asociacion = useAsociarArtistaEvento()

  const [artistaSeleccionado, setArtistaSeleccionado] = useState('')
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  if (consulta.isPending) {
    return <p role="status">Cargando información del evento…</p>
  }

  if (consulta.isError) {
    if (
      consulta.error instanceof ApiError &&
      consulta.error.status === 404
    ) {
      return <EventoAdminNoEncontrado />
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
  const idsAsociados = new Set(evento.artists.map((a) => a.id))
  const artistasDisponibles = (artistasConsulta.data ?? []).filter(
    (artista) => !idsAsociados.has(artista.id),
  )

  function manejarPublicar() {
    setErrorAccion(null)
    setMensajeExito(null)

    publicacion.mutate(evento.eventCode, {
      onSuccess: () => {
        setMensajeExito('El evento ha sido publicado y ya está disponible en cartelera.')
      },
      onError: (error) => {
        setErrorAccion(
          error instanceof Error
            ? error.message
            : 'No pudimos publicar el evento.',
        )
      },
    })
  }

  function manejarAsociarArtista(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorAccion(null)
    setMensajeExito(null)

    const artistId = Number(artistaSeleccionado)
    if (!Number.isInteger(artistId) || artistId <= 0) {
      setErrorAccion('Selecciona un artista válido.')
      return
    }

    asociacion.mutate(
      { eventCode: evento.eventCode, artistId },
      {
        onSuccess: () => {
          setArtistaSeleccionado('')
          setMensajeExito('Artista asociado correctamente al evento.')
        },
        onError: (error) => {
          setErrorAccion(
            error instanceof Error
              ? error.message
              : 'No pudimos asociar el artista al evento.',
          )
        },
      },
    )
  }

  return (
    <section aria-labelledby="titulo-gestion-evento">
      <Link
        to={RUTAS.adminEventos}
        className="text-sm font-semibold text-primary-700 underline"
      >
        Volver a administrar eventos
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
              {categorias[evento.category]}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {estados[evento.status]}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {evento.status === 'PUBLISHED' && (
              <Link
                to={RUTAS.evento(evento.eventCode)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ver página pública
              </Link>
            )}

            {evento.status === 'DRAFT' && (
              <button
                type="button"
                disabled={publicacion.isPending}
                onClick={manejarPublicar}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {publicacion.isPending ? 'Publicando…' : 'Publicar evento'}
              </button>
            )}
          </div>
        </div>

        <h1
          id="titulo-gestion-evento"
          className="mt-5 text-3xl font-bold tracking-tight"
        >
          {evento.name}
        </h1>
        <p className="mt-1 font-mono text-sm text-slate-500">
          {evento.eventCode}
        </p>

        <p className="mt-5 whitespace-pre-line text-slate-600">
          {evento.description?.trim() || 'Sin descripción.'}
        </p>

        <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-semibold text-slate-700">Fecha y hora</dt>
            <dd className="mt-1 text-slate-600">
              {formatoFecha.format(new Date(evento.eventDate))}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Sede</dt>
            <dd className="mt-1 text-slate-600">{evento.venueName}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Edad mínima</dt>
            <dd className="mt-1 text-slate-600">
              {evento.minimumAge === 0
                ? 'Todas las edades'
                : `${evento.minimumAge} años`}
            </dd>
          </div>
        </dl>

        {errorAccion && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorAccion}
          </p>
        )}

        {mensajeExito && (
          <p
            role="status"
            className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            {mensajeExito}
          </p>
        )}
      </div>

      <section
        aria-labelledby="titulo-lineup-admin"
        className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <h2 id="titulo-lineup-admin" className="text-xl font-bold">
          Artistas asociados ({evento.artists.length})
        </h2>

        {evento.artists.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Este evento aún no tiene artistas asignados.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {evento.artists.map((artista) => (
              <li
                key={artista.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {artista.stageName}
                  </p>
                  <p className="text-slate-500">
                    {artista.genre?.trim() || 'Género no informado'}
                  </p>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  ID #{artista.id}
                </span>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={manejarAsociarArtista}
          className="mt-6 border-t border-slate-200 pt-6"
        >
          <label
            htmlFor="select-artista"
            className="block text-sm font-semibold text-slate-700"
          >
            Agregar artista al evento
          </label>

          {artistasConsulta.isPending ? (
            <p role="status" className="mt-2 text-sm text-slate-500">
              Cargando artistas activos…
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-3">
              <select
                id="select-artista"
                value={artistaSeleccionado}
                onChange={(e) => setArtistaSeleccionado(e.target.value)}
                disabled={asociacion.isPending || artistasDisponibles.length === 0}
                className="min-w-60 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              >
                <option value="">
                  {artistasDisponibles.length === 0
                    ? 'No hay más artistas disponibles'
                    : 'Selecciona un artista…'}
                </option>
                {artistasDisponibles.map((artista) => (
                  <option key={artista.id} value={artista.id}>
                    {artista.stageName}
                    {artista.genre ? ` (${artista.genre})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={
                  asociacion.isPending ||
                  !artistaSeleccionado ||
                  artistasDisponibles.length === 0
                }
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {asociacion.isPending ? 'Asociando…' : 'Asociar artista'}
              </button>
            </div>
          )}
        </form>
      </section>
    </section>
  )
}

export default function AdminDetalleEvento() {
  const { eventCode } = useParams()
  const resultado = codigoSchema.safeParse(eventCode)

  if (!resultado.success) {
    return <EventoAdminNoEncontrado />
  }

  return (
    <PanelGestionEvento
      key={resultado.data}
      eventCode={resultado.data}
    />
  )
}