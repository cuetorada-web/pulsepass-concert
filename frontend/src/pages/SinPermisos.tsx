import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'
export default function SinPermisos() {
  return (
    <section className="surface mx-auto max-w-xl py-16 text-center">
      <p className="text-5xl font-bold text-marca-600">403</p>
      <h1 className="mt-4 text-2xl font-bold">
        No tienes permiso para acceder a esta sección
      </h1>
      <p className="mt-4 text-slate-600">Tu cuenta no tiene los permisos necesarios.</p>
      <Link className="btn-primary mt-6" to={RUTAS.inicio}>
        Volver al inicio
      </Link>
    </section>
  )
}
