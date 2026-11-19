import { Link } from 'react-router'
import { RUTAS } from '../lib/rutas'

interface Props {
  titulo: string
  mensaje?: string
}
export default function Estado({ titulo, mensaje }: Props) {
  return (
    <div className="surface py-12 text-center">
      <div aria-hidden="true" className="mb-4 text-3xl text-primary-600">
        ◇
      </div>
      <h2 className="text-xl font-bold">{titulo}</h2>
      {mensaje && <p className="mx-auto mt-3 max-w-lg text-slate-600">{mensaje}</p>}
      <Link className="btn-secondary mt-6" to={RUTAS.eventos}>
        Ver eventos
      </Link>
    </div>
  )
}
