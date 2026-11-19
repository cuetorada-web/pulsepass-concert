import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../features/auth/AuthContext'
import { useComprarTicket } from '../features/tickets/hooks'
import { tipoTicketSchema, tiposTicket } from '../features/tickets/tipos'
import type { EventoDetalle } from '../features/eventos/tipos'
import { RUTAS } from '../lib/rutas'
import Modal from './Modal'
const schema = z.object({ type: tipoTicketSchema })
interface Props {
  evento: EventoDetalle
}
export default function CompraTicket({ evento }: Props) {
  const auth = useAuth()
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const compra = useComprarTicket()
  const [confirmacion, setConfirmacion] = useState<z.infer<typeof schema> | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'GENERAL' },
  })
  if (evento.status !== 'PUBLISHED')
    return (
      <aside className="surface">
        <h2 className="text-xl font-bold">Entradas</h2>
        <p className="mt-4 text-slate-600">
          La compra no está disponible para este evento.
        </p>
      </aside>
    )
  if (auth.estado === 'cargando') return <p role="status">Comprobando sesión…</p>
  if (auth.estado === 'error') return <p role="alert">{auth.mensaje}</p>
  if (auth.estado !== 'autenticada')
    return (
      <aside className="surface">
        <h2 className="text-xl font-bold">Entradas</h2>
        <p className="mt-3 text-slate-600">Inicia sesión para comprar tu entrada.</p>
        <Link
          className="btn-primary mt-5"
          to={RUTAS.login}
          state={{ desde: ubicacion.pathname + ubicacion.search }}
        >
          Iniciar sesión para comprar
        </Link>
      </aside>
    )
  function comprar() {
    if (!confirmacion || auth.estado !== 'autenticada') return
    compra.mutate(
      {
        type: confirmacion.type,
        eventCode: evento.eventCode,
        userEmail: auth.usuario.email,
      },
      { onSuccess: (ticket) => void navegar(RUTAS.confirmacion(ticket.ticketCode)) },
    )
  }
  return (
    <aside className="surface h-fit">
      <h2 className="text-xl font-bold">Entradas</h2>
      <form
        noValidate
        onSubmit={handleSubmit((datos) => {
          compra.reset()
          setConfirmacion(datos)
        })}
        className="mt-5"
      >
        <label htmlFor="tipo-ticket" className="text-sm font-semibold">
          Selecciona tu entrada
        </label>
        <select
          id="tipo-ticket"
          {...register('type')}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          {tipoTicketSchema.options.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tiposTicket[tipo]}
            </option>
          ))}
        </select>
        {errors.type && <p role="alert">{errors.type.message}</p>}
        <button className="btn-primary mt-5 w-full" type="submit">
          Comprar entrada
        </button>
        <p className="mt-4 text-sm text-slate-500">
          El precio final se informa al emitir la entrada.
        </p>
      </form>
      {confirmacion && (
        <Modal
          titulo="Confirmar compra"
          ocupado={compra.isPending}
          onCerrar={() => setConfirmacion(null)}
        >
          <p className="font-semibold">{evento.name}</p>
          <p className="mt-3">Tipo: {tiposTicket[confirmacion.type]}</p>
          <p className="mt-3 break-all text-sm text-slate-600">
            Titular: {auth.usuario.email}
          </p>
          <p className="mt-4 text-sm text-slate-600">
            El precio final y la disponibilidad se confirman al emitir la entrada.
          </p>
          {compra.isError && (
            <p role="alert" className="notice-error mt-4">
              {compra.error.message}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="btn-secondary"
              disabled={compra.isPending}
              onClick={() => setConfirmacion(null)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              disabled={compra.isPending}
              onClick={comprar}
              type="button"
            >
              {compra.isPending ? 'Comprando…' : 'Confirmar compra'}
            </button>
          </div>
        </Modal>
      )}
    </aside>
  )
}
