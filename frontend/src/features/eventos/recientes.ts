import { z } from 'zod'
const schema = z.array(z.object({ eventCode: z.string(), name: z.string() }))
const clave = 'pulsepass.eventos-creados'
export function eventosRecordados() {
  try {
    const contenido: unknown = JSON.parse(sessionStorage.getItem(clave) ?? '[]')
    return schema.parse(contenido)
  } catch {
    return []
  }
}
export function recordarEvento(evento: { eventCode: string; name: string }) {
  try {
    const lista = eventosRecordados().filter((e) => e.eventCode !== evento.eventCode)
    sessionStorage.setItem(
      clave,
      JSON.stringify([...lista, { eventCode: evento.eventCode, name: evento.name }]),
    )
  } catch {
    /* Historial opcional de esta pestaña. */
  }
}
