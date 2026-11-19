import { z } from 'zod'
import { Link, useParams } from 'react-router'
import ErrorConsulta from '../components/ErrorConsulta'
import { useArtista } from '../features/artistas/hooks'
import { useEventosPorArtista } from '../features/eventos/hooks'
import { categorias } from '../features/eventos/tipos'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'
import NoEncontrada from './NoEncontrada'

const idSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER))

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
})

interface PerfilArtistaProps {
  id: number
}

interface EventosArtistaProps {
  stageName: string
}

function EventosArtista({ stageName }: EventosArtistaProps) {
  const consulta = useEventosPorArtista(stageName)

  if (consulta.isPending) {
    return (
      <p role="status" className="mt-4">
        Cargando eventos…
      </p>
    )
  }

  if (consulta.isError) {
    return (
      <ErrorConsulta
        titulo="No pudimos cargar sus eventos"
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => {
          void consulta.refetch()
        }}
      />
    )
  }

  if (consulta.data.length === 0) {
    return (
      <p className="mt-4 rounded-xl bg-slate-100 p-5 text-slate-600">
        Este artista todavía no tiene eventos publicados disponibles.
      </p>
    )
  }

  return (
    <ul className="mt-5 grid gap-4 md:grid-cols-2">
      {consulta.data.map((evento) => (
        <li key={evento.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-primary-700">
            {categorias[evento.category]}
          </p>

          <h3 className="mt-2 text-lg font-bold">
            <Link
              to={RUTAS.evento(evento.eventCode)}
              className="text-primary-700 underline"
            >
              {evento.name}
            </Link>
          </h3>

          <p className="mt-3 text-sm text-slate-600">
            <time dateTime={evento.eventDate}>
              {formatoFecha.format(new Date(evento.eventDate))}
            </time>
          </p>

          <p className="mt-2 text-sm text-slate-600">{evento.venueName}</p>
        </li>
      ))}
    </ul>
  )
}

function PerfilArtista({ id }: PerfilArtistaProps) {
  const consulta = useArtista(id)

  if (consulta.isPending) {
    return <p role="status">Cargando artista…</p>
  }

  if (consulta.isError) {
    if (consulta.error instanceof ApiError && consulta.error.status === 404) {
      return <NoEncontrada />
    }

    return (
      <ErrorConsulta
        titulo="No pudimos cargar el artista"
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => {
          void consulta.refetch()
        }}
      />
    )
  }

  const artista = consulta.data

  return (
    <section aria-labelledby="titulo-artista">
      <Link
        to={RUTAS.artistas}
        className="text-sm font-semibold text-primary-700 underline"
      >
        Volver a artistas
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold text-primary-700">Perfil de artista</p>

        <h1 id="titulo-artista" className="mt-3 text-3xl font-bold">
          {artista.stageName}
        </h1>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
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
      </div>

      <section aria-labelledby="titulo-eventos-artista" className="mt-10">
        <h2 id="titulo-eventos-artista" className="text-2xl font-bold">
          Eventos del artista
        </h2>

        <EventosArtista stageName={artista.stageName} />
      </section>
    </section>
  )
}

export default function DetalleArtista() {
  const { id } = useParams()
  const resultado = idSchema.safeParse(id)

  if (!resultado.success) {
    return <NoEncontrada />
  }

  return <PerfilArtista key={resultado.data} id={resultado.data} />
}
