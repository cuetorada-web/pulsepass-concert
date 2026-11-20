import { z } from 'zod'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { http } from '../lib/http'
import { artistaSchema } from '../features/artistas/tipos'
import Cargando from '../components/Cargando'
import {
  obtenerEventosPorArtista,
  obtenerEventosPublicados,
} from '../features/eventos/api'
import { categoriaEventoSchema, categorias } from '../features/eventos/tipos'
import TarjetaEvento from '../components/TarjetaEvento'
import ErrorConsulta from '../components/ErrorConsulta'
import Estado from '../components/Estado'
import { RUTAS } from '../lib/rutas'

const filtrosSchema = z.object({
  q: z.string().max(150).catch(''),
  categoria: categoriaEventoSchema.or(z.literal('')).catch(''),
  artista: z.string().max(120).catch(''),
})
export default function Eventos() {
  const [parametros, setParametros] = useSearchParams()
  const filtros = filtrosSchema.parse({
    q: parametros.get('q') ?? '',
    categoria: parametros.get('categoria') ?? '',
    artista: parametros.get('artista') ?? '',
  })
  const consulta = useQuery({
    queryKey: filtros.artista
      ? ['eventos', 'por-artista', filtros.artista]
      : ['eventos', 'publicados'],
    queryFn: ({ signal }) =>
      filtros.artista
        ? obtenerEventosPorArtista(filtros.artista, signal)
        : obtenerEventosPublicados(signal),
  })
  const artista = useQuery({
    queryKey: ['artistas', 'nombre', filtros.artista],
    queryFn: ({ signal }) =>
      http(
        `/api/artists/by-stage-name?stageName=${encodeURIComponent(filtros.artista)}`,
        artistaSchema,
        signal,
        { publica: true },
      ),
    enabled: Boolean(filtros.artista),
  })
  function cambiar(clave: string, valor: string) {
    setParametros(
      (prev) => {
        const siguiente = new URLSearchParams(prev)
        if (valor) siguiente.set(clave, valor)
        else siguiente.delete(clave)
        return siguiente
      },
      { replace: true },
    )
  }
  const eventos =
    consulta.data?.filter(
      (e) =>
        (!filtros.categoria || e.category === filtros.categoria) &&
        `${e.name} ${e.eventCode} ${e.venueName}`
          .toLocaleLowerCase('es-CO')
          .includes(filtros.q.toLocaleLowerCase('es-CO')),
    ) ?? []
  return (
    <section>
      <h1 className="text-3xl font-bold">Cartelera</h1>
      <p className="mt-3 text-slate-600">Encuentra tu próxima experiencia.</p>
      <div className="surface my-7 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="filtro-texto" className="text-sm font-semibold">
            Buscar por nombre
          </label>
          <input
            id="filtro-texto"
            value={filtros.q}
            onChange={(e) => cambiar('q', e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="filtro-categoria" className="text-sm font-semibold">
            Categoría
          </label>
          <select
            id="filtro-categoria"
            value={filtros.categoria}
            onChange={(e) => cambiar('categoria', e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Todas</option>
            {categoriaEventoSchema.options.map((c) => (
              <option key={c} value={c}>
                {categorias[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filtro-artista" className="text-sm font-semibold">
            Artista (nombre exacto)
          </label>
          <input
            id="filtro-artista"
            value={filtros.artista}
            onChange={(e) => cambiar('artista', e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <button
          type="button"
          onClick={() => setParametros({})}
          className="text-left text-sm font-semibold text-marca-700"
        >
          Limpiar filtros
        </button>
      </div>
      {artista.data && (
        <p className="mb-5 text-sm">
          Eventos de{' '}
          <Link className="text-marca-700 underline" to={RUTAS.artista(artista.data.id)}>
            {artista.data.stageName}
          </Link>
        </p>
      )}
      {consulta.isPending ? (
        <Cargando texto="Cargando eventos…" />
      ) : consulta.isError ? (
        <ErrorConsulta
          titulo="No pudimos cargar los eventos"
          error={consulta.error}
          reintentando={consulta.isFetching}
          onReintentar={() => void consulta.refetch()}
        />
      ) : eventos.length === 0 ? (
        <Estado
          titulo={
            consulta.data.length === 0
              ? 'Todavía no hay eventos publicados'
              : 'No encontramos eventos con esos filtros'
          }
          mensaje="Prueba otra búsqueda o vuelve pronto para descubrir nuevas experiencias."
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((evento) => (
            <li key={evento.id}>
              <TarjetaEvento evento={evento} />
            </li>
          ))}
        </ul>
      )}
      {filtros.artista && artista.isError && (
        <p role="status" className="mt-4 text-sm text-slate-600">
          No pudimos resolver el perfil de ese artista. Revisa el nombre exacto.
        </p>
      )}
    </section>
  )
}
