import { clsx } from 'clsx'
const tonos: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  DRAFT: 'bg-slate-200 text-slate-700',
  USED: 'bg-slate-200 text-slate-700',
  FINISHED: 'bg-slate-200 text-slate-700',
  SOLD_OUT: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RESERVED: 'bg-sky-100 text-sky-800',
}
interface Props {
  estado: string
  texto: string
}
export default function Badge({ estado, texto }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
        tonos[estado] ?? 'bg-marca-50 text-marca-700',
      )}
    >
      {texto}
    </span>
  )
}
