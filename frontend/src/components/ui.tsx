import { clsx } from 'clsx'
import { useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'

interface BotonProps extends ComponentProps<'button'> {
  variante?: 'primario' | 'secundario' | 'peligro'
  cargando?: boolean
}
const variantes = {
  primario: 'btn-primary',
  secundario: 'btn-secondary',
  peligro: 'btn-danger',
}
export function Boton({
  variante = 'primario',
  cargando = false,
  disabled,
  className,
  children,
  ...props
}: BotonProps) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clsx(variantes[variante], className)}
    >
      {children}
    </button>
  )
}
interface CampoProps extends ComponentProps<'input'> {
  etiqueta: string
  error?: string
}
export function Campo({ etiqueta, error, id: idProp, className, ...props }: CampoProps) {
  const generado = useId()
  const id = idProp ?? generado
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {etiqueta}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(
          'mt-2 w-full rounded-lg border border-slate-300 px-3 py-2',
          className,
        )}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
interface SelectorProps extends ComponentProps<'select'> {
  etiqueta: string
  error?: string
}
export function Selector({
  etiqueta,
  error,
  id: idProp,
  children,
  ...props
}: SelectorProps) {
  const generado = useId()
  const id = idProp ?? generado
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {etiqueta}
      </label>
      <select
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
interface TarjetaProps {
  children: ReactNode
  className?: string
}
export function Tarjeta({ children, className }: TarjetaProps) {
  return <div className={clsx('surface', className)}>{children}</div>
}
interface Columna<T> {
  encabezado: string
  celda: (fila: T) => ReactNode
}
interface TablaProps<T> {
  titulo: string
  columnas: Columna<T>[]
  filas: T[]
  clave: (fila: T) => string | number
}
export function Tabla<T>({ titulo, columnas, filas, clave }: TablaProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{titulo}</caption>
        <thead className="bg-slate-100">
          <tr>
            {columnas.map((c) => (
              <th key={c.encabezado} scope="col" className="px-4 py-3 font-semibold">
                {c.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={clave(fila)} className="border-t border-slate-200">
              {columnas.map((c) => (
                <td key={c.encabezado} className="px-4 py-4">
                  {c.celda(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
