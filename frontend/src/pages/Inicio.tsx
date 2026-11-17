import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'

export default function Inicio() {
  return (
    <section
      aria-labelledby="titulo-inicio"
      className="rounded-3xl border border-slate-200 bg-white px-6 py-12 sm:p-16"
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">
        Eventos, artistas y experiencias
      </p>

      <h1
        id="titulo-inicio"
        className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl"
      >
        Tu próxima experiencia comienza aquí.
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
        Descubre eventos, conoce a tus artistas favoritos y encuentra
        experiencias para compartir.
      </p>

      <Link
        to={RUTAS.eventos}
        className="mt-8 inline-flex rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
      >
        Explorar eventos
      </Link>
    </section>
  )
}