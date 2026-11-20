import { expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { http, HttpResponse } from 'msw'
import { server } from './server'
import { mostrar } from './render'
import { artista, ticket, usuario, errorApi } from './fixtures'
import { AuthContext } from '../features/auth/AuthContext'
import { queryClient } from '../lib/queryClient'
import { router as routerApp } from '../router'
import Inicio from '../pages/Inicio'
import Cuenta from '../pages/Cuenta'
import DetalleTicket from '../pages/DetalleTicket'
import ValidacionIngreso from '../pages/ValidacionIngreso'
import AdminDetalleEvento from '../pages/AdminDetalleEvento'
import DetalleEvento from '../pages/DetalleEvento'
import Login from '../pages/Login'
import Registro from '../pages/Registro'
import ErrorPagina from '../pages/ErrorPagina'

const auth = { estado: 'autenticada' as const, usuario }
const staff = {
  estado: 'autenticada' as const,
  usuario: { ...usuario, roles: ['STAFF' as const] },
}

it('Inicio no ofrece «Ver mis tickets» a STAFF', () => {
  mostrar(<Inicio />, '/', staff)
  expect(screen.queryByRole('link', { name: 'Ver mis tickets' })).toBeNull()
})
it('Inicio ofrece «Ver mis tickets» a USER', () => {
  mostrar(<Inicio />, '/', auth)
  expect(screen.getByRole('link', { name: 'Ver mis tickets' })).toBeInTheDocument()
})
it('Cuenta no ofrece «Ver mis tickets» a STAFF', async () => {
  mostrar(<Cuenta />, '/cuenta', staff)
  expect(await screen.findByRole('heading', { name: 'Mi cuenta' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Ver mis tickets' })).toBeNull()
})

// TEST-FE-TKT-009
for (const status of [403, 404]) {
  it(`ticket ajeno (${status}) muestra «Ticket no disponible» sin datos`, async () => {
    server.use(
      http.get('*/api/tickets/:code', () =>
        HttpResponse.json(errorApi(status, 'x'), { status }),
      ),
    )
    mostrar(<DetalleTicket />, '/mis-tickets/TKT-AJENO', auth, '/mis-tickets/:ticketCode')
    expect(
      await screen.findByRole('heading', { name: 'Ticket no disponible' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(ticket.eventName)).toBeNull()
  })
}

// TEST-FE-STF-003
it('validar ingreso: ticket inexistente muestra «Ticket no encontrado»', async () => {
  server.use(
    http.get('*/api/tickets/:code', () =>
      HttpResponse.json(errorApi(404, 'No existe'), { status: 404 }),
    ),
  )
  mostrar(<ValidacionIngreso />, '/', staff)
  await userEvent.type(screen.getByLabelText('Código del ticket'), 'TKT-NO')
  await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
  expect(await screen.findByText('Ticket no encontrado')).toBeInTheDocument()
})
it('validar ingreso: el campo recibe el foco al abrir', () => {
  mostrar(<ValidacionIngreso />, '/', staff)
  expect(screen.getByLabelText('Código del ticket')).toHaveFocus()
})
it('validar ingreso: tras registrar el ingreso se limpia el campo', async () => {
  server.use(
    http.get('*/api/tickets/:code', () => HttpResponse.json(ticket)),
    http.patch('*/api/tickets/:code/use', () =>
      HttpResponse.json({ ...ticket, status: 'USED' }),
    ),
  )
  mostrar(<ValidacionIngreso />, '/', staff)
  await userEvent.type(screen.getByLabelText('Código del ticket'), 'TKT-001')
  await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Marcar como usado' }))
  expect(await screen.findByText('Ingreso registrado.')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByLabelText('Código del ticket')).toHaveValue(''))
})

// TEST-FE-GEN-001
it('ruta inexistente muestra la página 404', async () => {
  const r = createMemoryRouter(routerApp.routes, { initialEntries: ['/no-existe'] })
  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ estado: 'anonima', expirada: false }}>
        <RouterProvider router={r} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  expect(
    await screen.findByRole('heading', { name: 'Página no encontrada' }),
  ).toBeInTheDocument()
})

// TEST-FE-GEN-002
it('ErrorPagina muestra un mensaje seguro sin stack trace', async () => {
  function Rota(): never {
    throw new Error('SECRETO-INTERNO at Object.<anonymous> (/src/x.ts:10:5)')
  }
  const r = createMemoryRouter(
    [{ path: '/', Component: Rota, ErrorBoundary: ErrorPagina }],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={r} />)
  expect(
    await screen.findByRole('heading', { name: '¡Ups! Algo salió mal.' }),
  ).toBeInTheDocument()
  expect(document.body.textContent).not.toMatch(/SECRETO-INTERNO|\.ts:|at Object/)
})

it('detalle de ticket: código en monoespaciada y botón Copiar', async () => {
  server.use(http.get('*/api/tickets/:code', () => HttpResponse.json(ticket)))
  const usuarioEvento = userEvent.setup()
  mostrar(<DetalleTicket />, '/mis-tickets/X', auth, '/mis-tickets/:ticketCode')
  const codigo = await screen.findByText(ticket.ticketCode)
  expect(codigo).toHaveClass('font-mono')
  await usuarioEvento.click(screen.getByRole('button', { name: /copiar/i }))
  expect(await screen.findByText('Copiado')).toBeInTheDocument()
  expect(await navigator.clipboard.readText()).toBe(ticket.ticketCode)
})

it('admin: el select no ofrece artistas ya asociados', async () => {
  const otro = { ...artista, id: 99, stageName: 'Otro Artista' }
  server.use(http.get('*/api/artists/active', () => HttpResponse.json([artista, otro])))
  mostrar(<AdminDetalleEvento />, '/admin/eventos/CMF', auth, '/admin/eventos/:eventCode')
  const select = await screen.findByLabelText('Agregar artista')
  const opciones = Array.from(select.querySelectorAll('option')).map((o) => o.textContent)
  expect(opciones).toContain('Otro Artista')
  expect(opciones).not.toContain(artista.stageName)
})

it('compra: los tipos de entrada son radios', async () => {
  mostrar(<DetalleEvento />, '/eventos/CMF-2027', auth, '/eventos/:eventCode')
  expect(await screen.findAllByRole('radio')).toHaveLength(4)
  expect(screen.getByRole('radio', { name: /general/i })).toBeChecked()
})

it('login: botón mostrar/ocultar contraseña', async () => {
  mostrar(<Login />)
  const campo = await screen.findByLabelText('Contraseña')
  expect(campo).toHaveAttribute('type', 'password')
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
  expect(campo).toHaveAttribute('type', 'text')
  await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
  expect(campo).toHaveAttribute('type', 'password')
})

it('registro: medidor de fortaleza de la contraseña', async () => {
  mostrar(<Registro />, '/registro')
  const campo = screen.getByLabelText('Contraseña')
  await userEvent.type(campo, 'abcdefghijkl')
  expect(await screen.findByText('Fortaleza: baja')).toBeInTheDocument()
  await userEvent.clear(campo)
  await userEvent.type(campo, 'UnaClaveMuyLarga#2026')
  expect(await screen.findByText('Fortaleza: alta')).toBeInTheDocument()
})
