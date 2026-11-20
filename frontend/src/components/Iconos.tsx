import type { ComponentProps } from 'react'

function Base(props: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  )
}
export function IconoMusica(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </Base>
  )
}
export function IconoDeporte(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3v18" />
    </Base>
  )
}
export function IconoTecnologia(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Base>
  )
}
export function IconoEducacion(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
    </Base>
  )
}
export function IconoCultura(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-6 10 6z" />
    </Base>
  )
}
export function IconoEntretenimiento(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    </Base>
  )
}
export function IconoCerrar(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  )
}
export function IconoVacio(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" />
    </Base>
  )
}
export function IconoOjo(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  )
}
export function IconoOjoOculto(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.2-1" />
    </Base>
  )
}
export function IconoCopiar(props: ComponentProps<'svg'>) {
  return (
    <Base {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </Base>
  )
}
