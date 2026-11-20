import { useEffect, useState } from 'react'
import { IconoCopiar } from './Iconos'

interface Props {
  texto: string
}
export default function BotonCopiar({ texto }: Props) {
  const [copiado, setCopiado] = useState(false)
  useEffect(() => {
    if (!copiado) return
    const temporizador = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(temporizador)
  }, [copiado])
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }
  return (
    <button
      type="button"
      className="btn-secondary inline-flex items-center gap-2"
      onClick={() => void copiar()}
    >
      <IconoCopiar />
      <span aria-live="polite">{copiado ? 'Copiado' : 'Copiar'}</span>
    </button>
  )
}
