import { useState } from 'react'
import { z } from 'zod'
import { Link, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useArtistasActivos } from '../features/artistas/hooks'
import {
  useEvento,
  usePublicarEvento,
  useAsociarArtistaEvento,
} from '../features/eventos/hooks'
import { estados } from '../features/eventos/tipos'
import { codigoSchema } from '../lib/validacion'
import { fecha } from '../lib/formato'
import { RUTAS } from '../lib/rutas'
import Modal from '../components/Modal'
import ErrorConsulta from '../components/ErrorConsulta'
import Badge from '../components/Badge'
import NoEncontrada from './NoEncontrada'
const schema = z.object({
  artistId: z.string().regex(/^[1-9]\d*$/, 'Selecciona un artista.'),
})
interface Props {
  codigo: string
}
function Gestion({ codigo }: Props) {
  const evento = useEvento(codigo)
  const artistas = useArtistasActivos()
  const publicar = usePublicarEvento()
  const asociar = useAsociarArtistaEvento()
  const [confirmar, setConfirmar] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { artistId: '' },
  })
  if (evento.isPending) return <p role="status">Cargando evento…</p>
  if (evento.isError)
    return (
      <ErrorConsulta
        titulo="Evento no disponible"
        error={evento.error}
        reintentando={evento.isFetching}
        onReintentar={() => void evento.refetch()}
      />
    )
  const e = evento.data
  return (
    <section>
      <Link to={RUTAS.adminEventos} className="text-sm text-primary-700 underline">
        Volver a eventos
      </Link>
      <div className="surface mt-6">
        <div className="flex flex-wrap justify-between gap-4">
          <h1 className="text-3xl font-bold">{e.name}</h1>
          <Badge estado={e.status} texto={estados[e.status]} />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {e.eventCode} · {fecha(e.eventDate)} · {e.venueName}
        </p>
        <p className="mt-5 whitespace-pre-line text-slate-600">{e.description}</p>
      </div>
      <section className="surface mt-6">
        <h2 className="text-xl font-bold">Publicación</h2>
        <p className="mt-3 text-slate-600">
          El evento solo es visible en la cartelera cuando está publicado.
        </p>
        {e.status === 'DRAFT' ? (
          <button
            className="btn-primary mt-4"
            type="button"
            onClick={() => {
              publicar.reset()
              setConfirmar(true)
            }}
          >
            Publicar evento
          </button>
        ) : (
          <Link className="btn-secondary mt-4" to={RUTAS.evento(e.eventCode)}>
            Ver página pública
          </Link>
        )}
        {publicar.isSuccess && (
          <p role="status" className="notice-success mt-4">
            El evento ha sido publicado.
          </p>
        )}
      </section>
      <section className="surface mt-6">
        <h2 className="text-xl font-bold">Artistas asociados</h2>
        {e.artists.length === 0 ? (
          <p className="mt-3 text-slate-600">Todavía no hay artistas asociados.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {e.artists.map((a) => (
              <li key={a.id}>
                <Link to={RUTAS.artista(a.id)} className="text-primary-700 underline">
                  {a.stageName}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {artistas.isPending ? (
          <p role="status" className="mt-5">
            Cargando artistas…
          </p>
        ) : artistas.isError ? (
          <ErrorConsulta
            titulo="No pudimos cargar artistas"
            error={artistas.error}
            reintentando={artistas.isFetching}
            onReintentar={() => void artistas.refetch()}
          />
        ) : (
          <form
            noValidate
            className="mt-6"
            onSubmit={handleSubmit(({ artistId }) =>
              asociar.mutate(
                { eventCode: e.eventCode, artistId: Number(artistId) },
                { onSuccess: () => reset() },
              ),
            )}
          >
            <label htmlFor="artistId" className="text-sm font-semibold">
              Agregar artista
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              <select
                id="artistId"
                {...register('artistId')}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Selecciona un artista</option>
                {artistas.data.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.stageName}
                  </option>
                ))}
              </select>
              <button
                className="btn-primary"
                disabled={asociar.isPending || artistas.data.length === 0}
                type="submit"
              >
                {asociar.isPending ? 'Asociando…' : 'Asociar'}
              </button>
            </div>
            {errors.artistId && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {errors.artistId.message}
              </p>
            )}
          </form>
        )}
        {asociar.isError && (
          <p role="alert" className="notice-error mt-4">
            {asociar.error.message}
          </p>
        )}
        {asociar.isSuccess && (
          <p role="status" className="notice-success mt-4">
            Artista asociado correctamente.
          </p>
        )}
      </section>
      <Link to={RUTAS.pagados(e.eventCode)} className="btn-secondary mt-6">
        Ver tickets pagados
      </Link>
      {confirmar && (
        <Modal
          titulo="Publicar evento"
          ocupado={publicar.isPending}
          onCerrar={() => setConfirmar(false)}
        >
          <p>¿Quieres publicar {e.name} en la cartelera?</p>
          {publicar.isError && (
            <p role="alert" className="notice-error mt-4">
              {publicar.error.message}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={publicar.isPending}
              className="btn-secondary"
              onClick={() => setConfirmar(false)}
            >
              Volver
            </button>
            <button
              type="button"
              disabled={publicar.isPending}
              className="btn-primary"
              onClick={() =>
                publicar.mutate(e.eventCode, { onSuccess: () => setConfirmar(false) })
              }
            >
              {publicar.isPending ? 'Publicando…' : 'Confirmar publicación'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}
export default function AdminDetalleEvento() {
  const { eventCode } = useParams()
  const r = codigoSchema.max(30).safeParse(eventCode)
  return r.success ? <Gestion codigo={r.data} /> : <NoEncontrada />
}
