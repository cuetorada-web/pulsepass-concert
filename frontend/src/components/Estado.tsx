import { Link } from 'react-router'
import { IconoVacio } from './Iconos'
import { RUTAS } from '../lib/rutas'

interface Props {
  titulo: string
  mensaje?: string
}
export default function Estado({ titulo, mensaje }: Props) {
  return (
    <div className="surface py-12 text-center">
      <div
        aria-hidden="true"
        className="mb-4 flex justify-center text-4xl text-marca-600"
      >
        <IconoVacio />
      </div>
      <h2 className="text-xl font-bold">{titulo}</h2>
      {mensaje && <p className="mx-auto mt-3 max-w-lg text-slate-600">{mensaje}</p>}
      <Link className="btn-secondary mt-6" to={RUTAS.eventos}>
        Ver eventos
      </Link>
    </div>
  )
}
