import { Link, useRevalidator } from 'react-router'
import { RUTAS } from '../lib/rutas'
export default function ErrorPagina() {
  const revalidacion = useRevalidator()
  return (
    <main className="surface mx-auto my-16 max-w-xl text-center">
      <h1 className="text-2xl font-bold">¡Ups! Algo salió mal.</h1>
      <p className="mt-4 text-slate-600">
        Ocurrió un error inesperado. Inténtalo más tarde.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={() => void revalidacion.revalidate()}
        >
          Reintentar
        </button>
        <Link className="btn-secondary" to={RUTAS.inicio}>
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
