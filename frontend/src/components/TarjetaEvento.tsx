import { Link } from 'react-router'
import { categorias, estados } from '../features/eventos/tipos'
import type { EventoResumen } from '../features/eventos/tipos'
import { RUTAS } from '../lib/rutas'
import { fecha } from '../lib/formato'
import Badge from './Badge'
import {
  IconoCultura,
  IconoDeporte,
  IconoEducacion,
  IconoEntretenimiento,
  IconoMusica,
  IconoTecnologia,
} from './Iconos'

const portadas = {
  MUSIC: 'bg-indigo-100 text-indigo-700',
  SPORTS: 'bg-emerald-100 text-emerald-800',
  TECHNOLOGY: 'bg-sky-100 text-sky-800',
  EDUCATION: 'bg-amber-100 text-amber-800',
  CULTURE: 'bg-rose-100 text-rose-800',
  ENTERTAINMENT: 'bg-violet-100 text-violet-800',
}
const iconos = {
  MUSIC: IconoMusica,
  SPORTS: IconoDeporte,
  TECHNOLOGY: IconoTecnologia,
  EDUCATION: IconoEducacion,
  CULTURE: IconoCultura,
  ENTERTAINMENT: IconoEntretenimiento,
}
interface Props {
  evento: EventoResumen
}
export default function TarjetaEvento({ evento }: Props) {
  const Icono = iconos[evento.category]
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div
        aria-hidden="true"
        className={`flex h-32 items-center justify-center text-5xl ${portadas[evento.category]}`}
      >
        <Icono />
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {categorias[evento.category]}
        </p>
        <h2 className="mt-2 text-lg font-bold">
          <Link to={RUTAS.evento(evento.eventCode)} className="hover:text-marca-700">
            {evento.name}
          </Link>
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          <time dateTime={evento.eventDate}>{fecha(evento.eventDate)}</time>
        </p>
        <p className="mt-2 text-sm text-slate-600">{evento.venueName}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Badge estado={evento.status} texto={estados[evento.status]} />
          <Link
            to={RUTAS.evento(evento.eventCode)}
            aria-label={`Ver detalle de ${evento.name}`}
            className="text-sm font-semibold text-marca-700"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  )
}
