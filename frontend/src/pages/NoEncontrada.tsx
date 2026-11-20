import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'

export default function NoEncontrada() {
  return (
    <section aria-labelledby="titulo-no-encontrada" className="py-16 text-center">
      <p className="text-lg font-semibold text-marca-600">404</p>

      <h1 id="titulo-no-encontrada" className="mt-3 text-3xl font-bold">
        Página no encontrada
      </h1>

      <p className="mt-4 text-slate-600">La dirección que buscas no existe.</p>

      <Link
        to={RUTAS.inicio}
        className="mt-8 inline-flex rounded-xl bg-marca-600 px-6 py-3 font-semibold text-white hover:bg-marca-700"
      >
        Volver al inicio
      </Link>
    </section>
  )
}
