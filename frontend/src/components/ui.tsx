import { clsx } from 'clsx'
import { useId, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { IconoOjo, IconoOjoOculto } from './Iconos'

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
interface CampoContrasenaProps extends Omit<CampoProps, 'type'> {
  children?: ReactNode
}
export function CampoContrasena({
  etiqueta,
  error,
  id: idProp,
  className,
  children,
  ...props
}: CampoContrasenaProps) {
  const generado = useId()
  const id = idProp ?? generado
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {etiqueta}
      </label>
      <div className="relative mt-2">
        <input
          {...props}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={clsx(
            'w-full rounded-lg border border-slate-300 py-2 pr-12 pl-3',
            className,
          )}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-lg text-xl text-slate-600"
        >
          {visible ? <IconoOjoOculto /> : <IconoOjo />}
        </button>
      </div>
      {children}
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
