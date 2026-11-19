import { expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import axe from 'axe-core'
import { mostrar } from './render'
import { evento, usuario } from './fixtures'
import Inicio from '../pages/Inicio'
import Eventos from '../pages/Eventos'
import Login from '../pages/Login'
import Registro from '../pages/Registro'
import MisTickets from '../pages/MisTickets'
import AdminNuevoEvento from '../pages/AdminNuevoEvento'
import type { ReactNode } from 'react'
interface Caso {
  nombre: string
  pagina: ReactNode
  espera: string
}
const casos: Caso[] = [
  { nombre: 'Inicio', pagina: <Inicio />, espera: evento.name },
  { nombre: 'Cartelera', pagina: <Eventos />, espera: evento.name },
  { nombre: 'Login', pagina: <Login />, espera: 'Inicia sesión' },
  { nombre: 'Registro', pagina: <Registro />, espera: 'Crea tu cuenta' },
  { nombre: 'Tickets', pagina: <MisTickets />, espera: 'Mis tickets' },
  { nombre: 'Crear evento', pagina: <AdminNuevoEvento />, espera: 'Nuevo evento' },
]
it.each(casos)(
  '$nombre no tiene errores críticos de estructura y etiquetas',
  async ({ nombre, pagina, espera }) => {
    mostrar(
      <main>{pagina}</main>,
      '/',
      nombre === 'Tickets' ? { estado: 'autenticada', usuario } : undefined,
    )
    await screen.findByRole('heading', { name: espera })
    const resultado = await axe.run(document.body, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(
      resultado.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      ),
    ).toEqual([])
  },
)
