import { expect, it, vi } from 'vitest'
import { screen, waitFor, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { server } from './server'
import { mostrar } from './render'
import { evento, usuario, ticket, errorApi } from './fixtures'
import { queryClient } from '../lib/queryClient'
import AuthProvider from '../features/auth/AuthProvider'
import { guardarSesion, cerrarSesion, obtenerSesion } from '../features/auth/sesion'
import { registroSchema } from '../features/auth/tipos'
import Login from '../pages/Login'
import Registro from '../pages/Registro'
import DetalleEvento from '../pages/DetalleEvento'
import AdminNuevoEvento from '../pages/AdminNuevoEvento'
import ValidacionIngreso from '../pages/ValidacionIngreso'
import AdminDetalleEvento from '../pages/AdminDetalleEvento'
import Layout from '../layouts/Layout'
import RutaProtegida from '../components/RutaProtegida'

const auth = { estado: 'autenticada' as const, usuario }
async function rellenarRegistro() {
  await userEvent.type(screen.getByLabelText('Usuario'), 'andrea')
  await userEvent.type(screen.getByLabelText('Correo electrónico'), 'andrea@example.com')
  await userEvent.type(screen.getByLabelText('Nombres'), 'Andrea')
  await userEvent.type(screen.getByLabelText('Apellidos'), 'Ruiz')
  await userEvent.type(screen.getByLabelText('Fecha de nacimiento'), '1990-01-01')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'UnaClaveDePrueba123')
}
it('login válido vuelve al destino solicitado', async () => {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <Login /> },
      { path: '/destino', element: <h1>Destino protegido</h1> },
    ],
    { initialEntries: [{ pathname: '/login', state: { desde: '/destino' } }] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  await userEvent.type(screen.getByLabelText('Usuario o correo electrónico'), 'andrea')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'UnaClaveDePrueba123')
  await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  expect(
    await screen.findByRole('heading', { name: 'Destino protegido' }),
  ).toBeInTheDocument()
  expect(obtenerSesion().estado).toBe('conToken')
})
it('registro exitoso redirige al login', async () => {
  const router = mostrar(<Registro />)
  await rellenarRegistro()
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(router.state.location.state).toEqual({ registroExitoso: true })
})
it('registro 409 no revela si el correo existe', async () => {
  server.use(
    http.post('*/api/users', () =>
      HttpResponse.json(errorApi(409, 'Correo privado duplicado'), { status: 409 }),
    ),
  )
  mostrar(<Registro />)
  await rellenarRegistro()
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect(await screen.findByRole('alert')).not.toHaveTextContent(
    'Correo privado duplicado',
  )
})
it('compra usa email de sesión y redirige a confirmación', async () => {
  let enviado: unknown
  server.use(
    http.post('*/api/tickets', async ({ request }) => {
      enviado = await request.json()
      return HttpResponse.json(ticket, { status: 201 })
    }),
  )
  const router = mostrar(
    <DetalleEvento />,
    '/eventos/CMF-2027',
    auth,
    '/eventos/:eventCode',
  )
  await userEvent.click(await screen.findByRole('button', { name: 'Comprar entrada' }))
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }))
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/compra/confirmacion/TKT-001'),
  )
  expect(enviado).toEqual({
    eventCode: evento.eventCode,
    userEmail: usuario.email,
    type: 'GENERAL',
  })
})
it('compra 409 mantiene abierto el diálogo', async () => {
  server.use(
    http.post('*/api/tickets', () =>
      HttpResponse.json(errorApi(409, 'Capacidad agotada'), { status: 409 }),
    ),
  )
  mostrar(<DetalleEvento />, '/eventos/CMF-2027', auth, '/eventos/:eventCode')
  await userEvent.click(await screen.findByRole('button', { name: 'Comprar entrada' }))
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar compra' }))
  expect(await screen.findByText('Capacidad agotada')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
it('compra anónima recuerda el evento', async () => {
  const router = mostrar(
    <DetalleEvento />,
    '/eventos/CMF-2027',
    undefined,
    '/eventos/:eventCode',
  )
  await userEvent.click(
    await screen.findByRole('link', { name: 'Iniciar sesión para comprar' }),
  )
  expect(router.state.location.state).toEqual({ desde: '/eventos/CMF-2027' })
})
it('crear evento mapea 400 a campos', async () => {
  server.use(
    http.post('*/api/events', () =>
      HttpResponse.json(errorApi(400, 'Validación', { name: 'Nombre rechazado' }), {
        status: 400,
      }),
    ),
  )
  mostrar(<AdminNuevoEvento />)
  await userEvent.type(screen.getByLabelText('Código del evento'), 'CMF')
  await userEvent.type(screen.getByLabelText('Nombre'), 'Concierto')
  await userEvent.type(screen.getByLabelText('Fecha y hora'), '2027-06-20T19:00')
  await userEvent.selectOptions(await screen.findByLabelText('Sede'), 'VEN-01')
  await userEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
  expect((await screen.findAllByText(/Nombre rechazado/)).length).toBeGreaterThan(0)
})
it('segundo uso 409 se muestra como rechazo', async () => {
  server.use(
    http.patch('*/api/tickets/:code/use', () =>
      HttpResponse.json(errorApi(409, 'El ticket ya fue utilizado'), { status: 409 }),
    ),
  )
  mostrar(<ValidacionIngreso />, '/', auth)
  await userEvent.type(screen.getByLabelText('Código del ticket'), 'TKT-001')
  await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Marcar como usado' }))
  expect(await screen.findByText('El ticket ya fue utilizado')).toBeInTheDocument()
})
it('asociación duplicada 409 se conserva como aviso', async () => {
  server.use(
    http.get('*/api/events/:code', () => HttpResponse.json({ ...evento, artists: [] })),
    http.post('*/api/events/:code/artists/:id', () =>
      HttpResponse.json(errorApi(409, 'Artista ya asociado'), { status: 409 }),
    ),
  )
  mostrar(<AdminDetalleEvento />, '/admin/eventos/CMF', auth, '/admin/eventos/:eventCode')
  await userEvent.selectOptions(await screen.findByLabelText('Agregar artista'), '1')
  await userEvent.click(screen.getByRole('button', { name: 'Asociar' }))
  expect(await screen.findByText('Artista ya asociado')).toBeInTheDocument()
})
it('STAFF entra al módulo de ingreso', () => {
  mostrar(
    <RutaProtegida rolesPermitidos={['STAFF', 'ADMIN']}>
      <h1>Ingreso STAFF</h1>
    </RutaProtegida>,
    '/',
    { estado: 'autenticada', usuario: { ...usuario, roles: ['STAFF'] } },
  )
  expect(screen.getByRole('heading', { name: 'Ingreso STAFF' })).toBeInTheDocument()
})
it('cerrar sesión elimina token y caché', () => {
  guardarSesion('token-prueba', 900)
  queryClient.setQueryData(['privado'], ['datos'])
  cerrarSesion()
  expect(sessionStorage.getItem('pulsepass.sesion')).toBeNull()
  expect(queryClient.getQueryData(['privado'])).toBeUndefined()
})
it('la sesión vence con el tiempo indicado', () => {
  vi.useFakeTimers()
  try {
    guardarSesion('token-prueba', 1)
    vi.advanceTimersByTime(1001)
    expect(obtenerSesion()).toEqual({ estado: 'anonima', expirada: true })
  } finally {
    vi.useRealTimers()
  }
})
it('validación de fecha futura es determinista', () => {
  vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-11-19T12:00:00Z').getTime())
  expect(
    registroSchema.safeParse({
      username: 'andrea',
      email: 'andrea@example.com',
      firstName: 'Andrea',
      lastName: 'Ruiz',
      phone: '',
      city: '',
      birthDate: '2027-01-01',
      password: 'UnaClaveDePrueba123',
    }).success,
  ).toBe(false)
})
it('navbar móvil abre y cierra con Escape', async () => {
  mostrar(<Layout />)
  const boton = screen.getByRole('button', { name: 'Abrir menú' })
  await userEvent.click(boton)
  expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await userEvent.tab()
  await userEvent.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})
