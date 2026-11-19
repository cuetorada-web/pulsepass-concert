import { z } from 'zod'
import { Link, useParams } from 'react-router'
import ErrorConsulta from '../components/ErrorConsulta'
import { useSede } from '../features/sedes/hooks'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'
import NoEncontrada from './NoEncontrada'

const codigoSchema = z
  .string()
  .min(1)
  .max(30)
  .refine((valor) => valor.trim().length > 0)
  .refine((valor) => !/[/?#\\]/.test(valor))

const formatoNumero = new Intl.NumberFormat('es-CO')

interface InformacionSedeProps {
  code: string
}

function InformacionSede({ code }: InformacionSedeProps) {
  const consulta = useSede(code)

  if (consulta.isPending) {
    return <p role="status">Cargando sede…</p>
  }

  if (consulta.isError) {
    if (consulta.error instanceof ApiError && consulta.error.status === 404) {
      return <NoEncontrada />
    }

    return (
      <ErrorConsulta
        titulo="No pudimos cargar la sede"
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => {
          void consulta.refetch()
        }}
      />
    )
  }

  const sede = consulta.data

  return (
    <section aria-labelledby="titulo-sede">
      <Link to={RUTAS.sedes} className="text-sm font-semibold text-primary-700 underline">
        Volver a sedes
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold text-primary-700">{sede.city}</p>

        <h1 id="titulo-sede" className="mt-3 text-3xl font-bold">
          {sede.name}
        </h1>

        <p className="mt-2 text-sm text-slate-500">{sede.code}</p>

        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Dirección</dt>
            <dd className="mt-1 text-slate-600">{sede.address}</dd>
          </div>

          <div>
            <dt className="font-semibold">Ciudad</dt>
            <dd className="mt-1 text-slate-600">{sede.city}</dd>
          </div>

          <div>
            <dt className="font-semibold">Capacidad de la sede</dt>
            <dd className="mt-1 text-slate-600">
              {formatoNumero.format(sede.capacity)} personas
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Estado</dt>
            <dd className="mt-1 text-slate-600">{sede.active ? 'Activa' : 'Inactiva'}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

export default function DetalleSede() {
  const { code } = useParams()
  const resultado = codigoSchema.safeParse(code)

  if (!resultado.success) {
    return <NoEncontrada />
  }

  return <InformacionSede key={resultado.data} code={resultado.data} />
}
