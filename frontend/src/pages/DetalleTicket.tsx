import { useState } from 'react'
import { z } from 'zod'
import { Link, useParams } from 'react-router'
import ErrorConsulta from '../components/ErrorConsulta'
import { useCancelarTicket, useTicket } from '../features/tickets/hooks'
import {
  estadosTicket,
  tiposTicket,
  type EstadoTicket,
} from '../features/tickets/tipos'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'

const codigoTicketSchema = z
  .string()
  .min(1)
  .max(40)
  .refine((valor) => valor.trim().length > 0)
  .refine((valor) => !/[/?#\\]/.test(valor))

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
})

const formatoMoneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const estilosEstado: Record<EstadoTicket, string> = {
  RESERVED: 'bg-amber-50 text-amber-800',
  PAID: 'bg-emerald-50 text-emerald-800',
  CANCELLED: 'bg-red-50 text-red-700',
  USED: 'bg-slate-100 text-slate-700',
}

function TicketNoDisponible() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-bold">Ticket no disponible</h1>
      <p className="mt-4 text-slate-600">
        No encontramos un ticket válido con ese código.
      </p>
      <Link
        to={RUTAS.misTickets}
        className="mt-6 inline-flex rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700"
      >
        Volver a mis tickets
      </Link>
    </section>
  )
}

function InformacionTicket({ ticketCode }: { ticketCode: string }) {
  const consulta = useTicket(ticketCode)
  const cancelacion = useCancelarTicket()
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false)
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null)

  if (consulta.isPending) {
    return <p role="status">Cargando detalle del ticket…</p>
  }

  if (consulta.isError) {
    if (
      consulta.error instanceof ApiError &&
      [403, 404].includes(consulta.error.status)
    ) {
      return <TicketNoDisponible />
    }

    return (
      <ErrorConsulta
        titulo="No pudimos cargar el ticket"
        error={consulta.error}
        reintentando={consulta.isFetching}
        onReintentar={() => {
          void consulta.refetch()
        }}
      />
    )
  }

  const ticket = consulta.data
  const puedeCancelarse =
    ticket.status === 'RESERVED' || ticket.status === 'PAID'

  function confirmarCancelacionTicket() {
    setErrorCancelacion(null)
    cancelacion.mutate(ticket.ticketCode, {
      onSuccess: () => {
        setConfirmandoCancelacion(false)
      },
      onError: (error) => {
        setErrorCancelacion(
          error instanceof Error
            ? error.message
            : 'No pudimos cancelar el ticket.',
        )
      },
    })
  }

  return (
    <section aria-labelledby="titulo-detalle-ticket">
      <Link
        to={RUTAS.misTickets}
        className="text-sm font-semibold text-primary-700 underline"
      >
        Volver a mis tickets
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
            {tiposTicket[ticket.type]}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${estilosEstado[ticket.status]}`}
          >
            {estadosTicket[ticket.status]}
          </span>
        </div>

        <h1
          id="titulo-detalle-ticket"
          className="mt-5 text-3xl font-bold tracking-tight"
        >
          {ticket.eventName}
        </h1>

        <p className="mt-2 font-mono text-sm text-slate-500">
          Código de entrada: {ticket.ticketCode}
        </p>

        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Titular</dt>
            <dd className="mt-1 text-slate-600">{ticket.userEmail}</dd>
          </div>

          <div>
            <dt className="font-semibold">Valor pagado / reservado</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatoMoneda.format(ticket.price)}
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Fecha de emisión</dt>
            <dd className="mt-1 text-slate-600">
              <time dateTime={ticket.purchaseDate}>
                {formatoFecha.format(new Date(ticket.purchaseDate))}
              </time>
            </dd>
          </div>

          <div>
            <dt className="font-semibold">Evento</dt>
            <dd className="mt-1">
              <Link
                to={RUTAS.evento(ticket.eventCode)}
                className="text-primary-700 underline"
              >
                Ver página del evento ({ticket.eventCode})
              </Link>
            </dd>
          </div>
        </dl>

        {puedeCancelarse && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            {!confirmandoCancelacion ? (
              <button
                type="button"
                onClick={() => setConfirmandoCancelacion(true)}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Cancelar entrada
              </button>
            ) : (
              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-sm font-medium text-red-900">
                  ¿Seguro que deseas cancelar este ticket? Esta acción no se puede deshacer.
                </p>

                {errorCancelacion && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    {errorCancelacion}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={cancelacion.isPending}
                    onClick={confirmarCancelacionTicket}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {cancelacion.isPending
                      ? 'Cancelando…'
                      : 'Sí, cancelar ticket'}
                  </button>

                  <button
                    type="button"
                    disabled={cancelacion.isPending}
                    onClick={() => {
                      setConfirmandoCancelacion(false)
                      setErrorCancelacion(null)
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    No, conservar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default function DetalleTicket() {
  const { ticketCode } = useParams()
  const resultado = codigoTicketSchema.safeParse(ticketCode)

  if (!resultado.success) {
    return <TicketNoDisponible />
  }

  return (
    <InformacionTicket
      key={resultado.data}
      ticketCode={resultado.data}
    />
  )
}