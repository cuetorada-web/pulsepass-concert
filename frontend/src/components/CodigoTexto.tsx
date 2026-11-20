import { clsx } from 'clsx'

interface Props {
  codigo: string
  className?: string
}
export default function CodigoTexto({ codigo, className }: Props) {
  return <span className={clsx('font-mono', className)}>{codigo}</span>
}
