import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface Props {
  titulo: string
  children: ReactNode
  onCerrar: () => void
  ocupado?: boolean
}

export default function Modal({ titulo, children, onCerrar, ocupado = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const anterior = document.activeElement
    const dialogo = ref.current
    dialogo?.showModal()
    return () => {
      dialogo?.close()
      if (anterior instanceof HTMLElement) anterior.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className="modal"
      onCancel={(e) => {
        e.preventDefault()
        if (!ocupado) onCerrar()
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id={id} className="text-xl font-bold">
          {titulo}
        </h2>
        <button
          type="button"
          aria-label="Cerrar diálogo"
          disabled={ocupado}
          onClick={onCerrar}
          className="rounded-lg px-3 py-2"
        >
          ✕
        </button>
      </div>
      <div className="mt-5">{children}</div>
    </dialog>
  )
}
