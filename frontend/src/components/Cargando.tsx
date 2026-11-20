interface Props {
  texto: string
}
export default function Cargando({ texto }: Props) {
  return (
    <div role="status" aria-busy="true" className="mt-6 animate-pulse space-y-3">
      <span className="sr-only">{texto}</span>
      <div aria-hidden="true" className="h-32 rounded-xl bg-slate-200" />
      <div aria-hidden="true" className="h-4 w-2/3 rounded bg-slate-200" />
      <div aria-hidden="true" className="h-4 w-1/2 rounded bg-slate-200" />
    </div>
  )
}
