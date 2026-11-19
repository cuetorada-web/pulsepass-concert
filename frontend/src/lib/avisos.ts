export function avisar(mensaje: string) {
  window.dispatchEvent(new CustomEvent('pulsepass:aviso', { detail: mensaje }))
}
