import { ApiError } from '../lib/http'

interface ErrorConsultaProps {
  titulo: string
  error: unknown
  reintentando: boolean
  onReintentar: () => void
}

export default function ErrorConsulta({
  titulo,
  error,
  reintentando,
  onReintentar,
}: ErrorConsultaProps) {
  return (
    <div
      role="alert"
      className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"
    >
      <h2 className="font-semibold text-red-900">
        {titulo}
      </h2>

      <p className="mt-2 text-red-800">
        {error instanceof ApiError
          ? error.message
          : 'Ocurrió un error inesperado. Intenta nuevamente.'}
      </p>

      <button
        type="button"
        onClick={onReintentar}
        disabled={reintentando}
        className="mt-4 rounded-lg bg-white px-4 py-2 font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
      >
        {reintentando ? 'Reintentando…' : 'Reintentar'}
      </button>
    </div>
  )
}