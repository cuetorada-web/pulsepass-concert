import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCrearEvento } from '../features/eventos/hooks'
import {
  categoriaEventoSchema,
  categorias,
  crearEventoSchema,
  type CategoriaEvento,
} from '../features/eventos/tipos'
import { useSedesActivas } from '../features/sedes/hooks'
import { RUTAS } from '../lib/rutas'

export default function AdminNuevoEvento() {
  const navigate = useNavigate()
  const sedesConsulta = useSedesActivas()
  const creacion = useCrearEvento()

  const [eventCode, setEventCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<CategoriaEvento>('MUSIC')
  const [eventDate, setEventDate] = useState('')
  const [minimumAge, setMinimumAge] = useState('0')
  const [venueCode, setVenueCode] = useState('')
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)

  function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorFormulario(null)

    const fechaNormalizada =
      eventDate.length === 16 ? `${eventDate}:00` : eventDate

    const validacion = crearEventoSchema.safeParse({
      eventCode,
      name,
      description,
      category,
      eventDate: fechaNormalizada,
      minimumAge: Number(minimumAge),
      venueCode,
    })

    if (!validacion.success) {
      setErrorFormulario(
        validacion.error.issues[0]?.message ??
          'Revisa los datos ingresados.',
      )
      return
    }

    creacion.mutate(validacion.data, {
      onSuccess: (eventoCreado) => {
        void navigate(RUTAS.adminEvento(eventoCreado.eventCode))
      },
      onError: (error) => {
        setErrorFormulario(
          error instanceof Error
            ? error.message
            : 'No pudimos crear el evento.',
        )
      },
    })
  }

  return (
    <section aria-labelledby="titulo-nuevo-evento" className="max-w-2xl">
      <Link
        to={RUTAS.adminEventos}
        className="text-sm font-semibold text-primary-700 underline"
      >
        Volver a administrar eventos
      </Link>

      <h1
        id="titulo-nuevo-evento"
        className="mt-4 text-3xl font-bold tracking-tight"
      >
        Crear nuevo evento
      </h1>
      <p className="mt-2 text-slate-600">
        El evento se creará en estado <strong>Borrador</strong> para que puedas asociar artistas antes de publicarlo.
      </p>

      <form
        onSubmit={manejarEnvio}
        className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="eventCode"
              className="block text-sm font-semibold text-slate-700"
            >
              Código del evento
            </label>
            <input
              id="eventCode"
              type="text"
              required
              placeholder="Ej. EVT-ROCK-2026"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value)}
              disabled={creacion.isPending}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-semibold text-slate-700"
            >
              Categoría
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as CategoriaEvento)
              }
              disabled={creacion.isPending}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
            >
              {categoriaEventoSchema.options.map((cat) => (
                <option key={cat} value={cat}>
                  {categorias[cat]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-slate-700"
          >
            Nombre del evento
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Ej. Festival Caribe Sonoro 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={creacion.isPending}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-slate-700"
          >
            Descripción
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Detalles del espectáculo, apertura de puertas, recomendaciones…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={creacion.isPending}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="eventDate"
              className="block text-sm font-semibold text-slate-700"
            >
              Fecha y hora
            </label>
            <input
              id="eventDate"
              type="datetime-local"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={creacion.isPending}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="minimumAge"
              className="block text-sm font-semibold text-slate-700"
            >
              Edad mínima (0 = todas las edades)
            </label>
            <input
              id="minimumAge"
              type="number"
              min={0}
              required
              value={minimumAge}
              onChange={(e) => setMinimumAge(e.target.value)}
              disabled={creacion.isPending}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="venueCode"
            className="block text-sm font-semibold text-slate-700"
          >
            Sede
          </label>
          {sedesConsulta.isPending ? (
            <p role="status" className="mt-1.5 text-sm text-slate-500">
              Cargando sedes activas…
            </p>
          ) : sedesConsulta.isError ? (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              No pudimos cargar las sedes activas.
            </p>
          ) : (
            <select
              id="venueCode"
              required
              value={venueCode}
              onChange={(e) => setVenueCode(e.target.value)}
              disabled={creacion.isPending}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
            >
              <option value="">Selecciona una sede…</option>
              {sedesConsulta.data.map((sede) => (
                <option key={sede.id} value={sede.code}>
                  {sede.name} ({sede.city}) — Cap. {sede.capacity}
                </option>
              ))}
            </select>
          )}
        </div>

        {errorFormulario && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorFormulario}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={creacion.isPending}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {creacion.isPending ? 'Guardando evento…' : 'Crear borrador de evento'}
          </button>

          <Link
            to={RUTAS.adminEventos}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}