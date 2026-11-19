import { useEffect, useState } from 'react'
export default function Avisos() {
  const [mensaje, setMensaje] = useState('')
  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout>
    const recibir = (evento: Event) => {
      if (!(evento instanceof CustomEvent) || typeof evento.detail !== 'string') return
      setMensaje(evento.detail)
      clearTimeout(temporizador)
      temporizador = setTimeout(() => setMensaje(''), 5000)
    }
    window.addEventListener('pulsepass:aviso', recibir)
    return () => {
      window.removeEventListener('pulsepass:aviso', recibir)
      clearTimeout(temporizador)
    }
  }, [])
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 max-w-[calc(100%-2rem)]"
    >
      {mensaje && <p className="notice-success shadow-lg">{mensaje}</p>}
    </div>
  )
}
