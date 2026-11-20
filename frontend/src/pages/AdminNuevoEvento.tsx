import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCrearEvento } from '../features/eventos/hooks'
import { categorias, crearEventoSchema } from '../features/eventos/tipos'
import type { DatosCrearEvento } from '../features/eventos/tipos'
import { useSedesActivas } from '../features/sedes/hooks'
import { RUTAS } from '../lib/rutas'
import { ApiError } from '../lib/http'
import ErrorConsulta from '../components/ErrorConsulta'
import Cargando from '../components/Cargando'
const campos = [
  { nombre: 'eventCode', etiqueta: 'Código del evento', tipo: 'text' },
  { nombre: 'name', etiqueta: 'Nombre', tipo: 'text' },
  { nombre: 'eventDate', etiqueta: 'Fecha y hora', tipo: 'datetime-local' },
  {
    nombre: 'minimumAge',
    etiqueta: 'Edad mínima (0 = todas las edades)',
    tipo: 'number',
  },
] as const
const camposServidor = crearEventoSchema.keyof()
export default function AdminNuevoEvento() {
  const navegar = useNavigate()
  const sedes = useSedesActivas()
  const creacion = useCrearEvento()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DatosCrearEvento>({
    resolver: zodResolver(crearEventoSchema),
    defaultValues: {
      eventCode: '',
      name: '',
      description: '',
      category: 'MUSIC',
      eventDate: '',
      minimumAge: 0,
      venueCode: '',
    },
  })
  async function enviar(datos: DatosCrearEvento) {
    try {
      const creado = await creacion.mutateAsync({
        ...datos,
        eventDate:
          datos.eventDate.length === 16 ? `${datos.eventDate}:00` : datos.eventDate,
      })
      await navegar(RUTAS.adminEvento(creado.eventCode))
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 400)
        for (const [clave, mensaje] of Object.entries(error.details)) {
          const campo = camposServidor.safeParse(clave)
          if (campo.success && typeof mensaje === 'string')
            setError(campo.data, { message: mensaje })
        }
    }
  }
  return (
    <section className="mx-auto max-w-2xl">
      <Link className="text-sm text-marca-700 underline" to={RUTAS.adminEventos}>
        Volver a eventos
      </Link>
      <h1 className="mt-5 text-3xl font-bold">Nuevo evento</h1>
      <form noValidate onSubmit={handleSubmit(enviar)} className="surface mt-6">
        <fieldset disabled={creacion.isPending} className="space-y-5">
          <legend className="sr-only">Información del evento</legend>
          {campos.map((campo) => (
            <div key={campo.nombre}>
              <label htmlFor={campo.nombre} className="block text-sm font-semibold">
                {campo.etiqueta}
              </label>
              <input
                id={campo.nombre}
                type={campo.tipo}
                {...register(
                  campo.nombre,
                  campo.nombre === 'minimumAge' ? { valueAsNumber: true } : {},
                )}
                aria-invalid={Boolean(errors[campo.nombre])}
                aria-describedby={
                  errors[campo.nombre] ? `${campo.nombre}-error` : undefined
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              {errors[campo.nombre] && (
                <p
                  id={`${campo.nombre}-error`}
                  role="alert"
                  className="mt-1 text-sm text-red-700"
                >
                  {errors[campo.nombre]?.message}
                </p>
              )}
            </div>
          ))}
          <div>
            <label htmlFor="description" className="text-sm font-semibold">
              Descripción
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            {errors.description && (
              <p role="alert" className="text-sm text-red-700">
                {errors.description.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="category" className="text-sm font-semibold">
              Categoría
            </label>
            <select
              id="category"
              {...register('category')}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {Object.entries(categorias).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
            {errors.category && <p role="alert">{errors.category.message}</p>}
          </div>
          <div>
            <label htmlFor="venueCode" className="text-sm font-semibold">
              Sede
            </label>
            {sedes.isPending ? (
              <Cargando texto="Cargando sedes…" />
            ) : sedes.isError ? (
              <ErrorConsulta
                titulo="No pudimos cargar sedes"
                error={sedes.error}
                reintentando={sedes.isFetching}
                onReintentar={() => void sedes.refetch()}
              />
            ) : (
              <>
                <select
                  id="venueCode"
                  {...register('venueCode')}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Selecciona una sede</option>
                  {sedes.data.map((sede) => (
                    <option key={sede.id} value={sede.code}>
                      {sede.name} · {sede.city}
                    </option>
                  ))}
                </select>
                {sedes.data.length === 0 && (
                  <p className="mt-2 text-sm text-slate-600">
                    No hay sedes activas disponibles.
                  </p>
                )}
              </>
            )}
            {errors.venueCode && (
              <p role="alert" className="text-sm text-red-700">
                {errors.venueCode.message}
              </p>
            )}
          </div>
        </fieldset>
        {creacion.isError && (
          <p role="alert" className="notice-error mt-5">
            {creacion.error.message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Link className="btn-secondary" to={RUTAS.adminEventos}>
            Cancelar
          </Link>
          <button type="submit" className="btn-primary" disabled={creacion.isPending}>
            {creacion.isPending ? 'Creando…' : 'Crear evento'}
          </button>
        </div>
      </form>
    </section>
  )
}
