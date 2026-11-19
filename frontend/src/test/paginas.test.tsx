import { expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { server } from './server'
import { mostrar } from './render'
import { evento, ticket, usuario, errorApi } from './fixtures'
import Eventos from '../pages/Eventos'
import Artistas from '../pages/Artistas'
import Sedes from '../pages/Sedes'
import Inicio from '../pages/Inicio'
import Login from '../pages/Login'
import Registro from '../pages/Registro'
import MisTickets from '../pages/MisTickets'
import DetalleTicket from '../pages/DetalleTicket'
import DetalleEvento from '../pages/DetalleEvento'
import DetalleArtista from '../pages/DetalleArtista'
import DetalleSede from '../pages/DetalleSede'
import ConfirmacionCompra from '../pages/ConfirmacionCompra'
import ValidacionIngreso from '../pages/ValidacionIngreso'
import TicketsPagadosEvento from '../pages/TicketsPagadosEvento'
import Cuenta from '../pages/Cuenta'
import AdminEventos from '../pages/AdminEventos'
import AdminNuevoEvento from '../pages/AdminNuevoEvento'
import AdminDetalleEvento from '../pages/AdminDetalleEvento'
import RutaProtegida from '../components/RutaProtegida'
import { queryClient } from '../lib/queryClient'

const auth = { estado: 'autenticada' as const, usuario }
it('catálogo carga datos reales del contrato', async () => {
  mostrar(<Eventos />)
  expect(await screen.findByRole('heading', { name: evento.name })).toBeInTheDocument()
})
it('catálogo muestra estado cargando', async () => {
  server.use(
    http.get('*/api/events/published', async () => {
      await delay(100)
      return HttpResponse.json([])
    }),
  )
  mostrar(<Eventos />)
  expect(screen.getByRole('status')).toHaveTextContent('Cargando')
})
it('catálogo vacío', async () => {
  server.use(http.get('*/api/events/published', () => HttpResponse.json([])))
  mostrar(<Eventos />)
  expect(await screen.findByText('Todavía no hay eventos publicados')).toBeInTheDocument()
})
it('catálogo permite reintentar un error', async () => {
  server.use(
    http.get('*/api/events/published', () => HttpResponse.json({}, { status: 500 })),
  )
  mostrar(<Eventos />)
  expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
})
it('filtros persisten en la URL', async () => {
  const router = mostrar(<Eventos />)
  await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'SPORTS')
  expect(router.state.location.search).toContain('categoria=SPORTS')
  expect(
    await screen.findByText('No encontramos eventos con esos filtros'),
  ).toBeInTheDocument()
})
it('artistas activos y enlace de detalle', async () => {
  mostrar(<Artistas />)
  expect(
    await screen.findByRole('link', { name: 'Ver detalle de Solar Beat' }),
  ).toHaveAttribute('href', '/artistas/1')
})
it('sedes activas', async () => {
  mostrar(<Sedes />)
  expect(
    await screen.findByRole('heading', { name: 'Marina Convention Center' }),
  ).toBeInTheDocument()
})
it('inicio presenta próximos eventos y artistas', async () => {
  mostrar(<Inicio />)
  expect(await screen.findByRole('heading', { name: evento.name })).toBeInTheDocument()
  expect(await screen.findByText('Solar Beat')).toBeInTheDocument()
})
it('detalle de artista consulta sus eventos', async () => {
  mostrar(<DetalleArtista />, '/artistas/1', undefined, '/artistas/:id')
  expect(await screen.findByRole('heading', { name: 'Solar Beat' })).toBeInTheDocument()
  expect(await screen.findByRole('link', { name: evento.name })).toBeInTheDocument()
})
it('artista con id inválido no llama a la API', async () => {
  let llamadas = 0
  server.use(
    http.get('*/api/artists/:id', () => {
      llamadas++
      return HttpResponse.json({})
    }),
  )
  mostrar(<DetalleArtista />, '/artistas/abc', undefined, '/artistas/:id')
  expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
  expect(llamadas).toBe(0)
})
it('detalle de sede', async () => {
  mostrar(<DetalleSede />, '/sedes/VEN-01', undefined, '/sedes/:code')
  expect(
    await screen.findByRole('heading', { name: 'Marina Convention Center' }),
  ).toBeInTheDocument()
})
it('evento no disponible ante 404', async () => {
  server.use(http.get('*/api/events/:code', () => HttpResponse.json({}, { status: 404 })))
  mostrar(<DetalleEvento />, '/eventos/NO', undefined, '/eventos/:eventCode')
  expect(await screen.findByText('Evento no disponible')).toBeInTheDocument()
})
it('evento agotado no permite comprar', async () => {
  server.use(
    http.get('*/api/events/:code', () =>
      HttpResponse.json({ ...evento, status: 'SOLD_OUT' }),
    ),
  )
  mostrar(<DetalleEvento />, '/eventos/CMF-2027', auth, '/eventos/:eventCode')
  expect(
    await screen.findByText('La compra no está disponible para este evento.'),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Comprar entrada' }),
  ).not.toBeInTheDocument()
})
it('login vacío no dispara peticiones', async () => {
  let llamadas = 0
  server.use(
    http.post('*/api/auth/login', () => {
      llamadas++
      return HttpResponse.json({})
    }),
  )
  mostrar(<Login />)
  await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  expect(await screen.findByText('Escribe tu contraseña.')).toBeInTheDocument()
  expect(llamadas).toBe(0)
})
it('login 401 muestra credenciales inválidas', async () => {
  server.use(http.post('*/api/auth/login', () => HttpResponse.json({}, { status: 401 })))
  mostrar(<Login />)
  await userEvent.type(screen.getByLabelText('Usuario o correo electrónico'), 'andrea')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'incorrecta')
  await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  expect(await screen.findByText('Credenciales inválidas.')).toBeInTheDocument()
})
it('registro inválido no envía datos', async () => {
  let llamadas = 0
  server.use(
    http.post('*/api/users', () => {
      llamadas++
      return HttpResponse.json({})
    }),
  )
  mostrar(<Registro />)
  await userEvent.type(screen.getByLabelText('Contraseña'), 'corta')
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect(await screen.findByText('Usa al menos 12 caracteres.')).toBeInTheDocument()
  expect(llamadas).toBe(0)
})
it('mis tickets filtra por estado sin cambiar datos del servidor', async () => {
  mostrar(<MisTickets />, '/mis-tickets', auth)
  expect(
    await screen.findByRole('heading', { name: ticket.eventName }),
  ).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Cancelado' }))
  expect(await screen.findByText('No tienes tickets con este estado')).toBeInTheDocument()
})
it('mis tickets vacío', async () => {
  server.use(http.get('*/api/tickets/by-user', () => HttpResponse.json([])))
  mostrar(<MisTickets />, '/mis-tickets', auth)
  expect(
    await screen.findByText('Todavía no tienes tickets registrados'),
  ).toBeInTheDocument()
})
it('cancelar ticket conserva modal ante 409', async () => {
  server.use(
    http.patch('*/api/tickets/:code/cancel', () =>
      HttpResponse.json(errorApi(409, 'No se puede cancelar ahora'), { status: 409 }),
    ),
  )
  mostrar(<DetalleTicket />, '/mis-tickets/TKT-001', auth, '/mis-tickets/:ticketCode')
  await userEvent.click(await screen.findByRole('button', { name: 'Cancelar ticket' }))
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar cancelación' }))
  expect(await screen.findByText('No se puede cancelar ahora')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
it('cancelar actualiza el ticket y cierra el diálogo', async () => {
  mostrar(<DetalleTicket />, '/mis-tickets/TKT-001', auth, '/mis-tickets/:ticketCode')
  await userEvent.click(await screen.findByRole('button', { name: 'Cancelar ticket' }))
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar cancelación' }))
  expect(await screen.findByText('Cancelado')).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})
it('ticket usado no ofrece cancelación', async () => {
  server.use(
    http.get('*/api/tickets/:code', () =>
      HttpResponse.json({ ...ticket, status: 'USED' }),
    ),
  )
  mostrar(<DetalleTicket />, '/mis-tickets/TKT-001', auth, '/mis-tickets/:ticketCode')
  expect(await screen.findByText('Usado')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Cancelar ticket' }),
  ).not.toBeInTheDocument()
})
it('confirmación carga ticket desde la API', async () => {
  mostrar(
    <ConfirmacionCompra />,
    '/compra/confirmacion/TKT-001',
    auth,
    '/compra/confirmacion/:ticketCode',
  )
  expect(await screen.findByText('¡Compra realizada con éxito!')).toBeInTheDocument()
})
it('validación de ingreso cambia PAID a USED', async () => {
  mostrar(<ValidacionIngreso />, '/', auth)
  await userEvent.type(screen.getByLabelText('Código del ticket'), 'TKT-001')
  await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Marcar como usado' }))
  expect(await screen.findByText('Ingreso registrado.')).toBeInTheDocument()
  expect(screen.getByText('Usado')).toBeInTheDocument()
})
it('lista de tickets pagados por evento', async () => {
  mostrar(
    <TicketsPagadosEvento />,
    '/staff/eventos/CMF-2027/tickets',
    auth,
    '/staff/eventos/:eventCode/tickets',
  )
  expect((await screen.findAllByText('TKT-001')).length).toBeGreaterThan(0)
})
it('cuenta permite consultar por username', async () => {
  mostrar(<Cuenta />, '/', auth)
  expect(await screen.findByText('Andrea Ruiz')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Consultar por usuario' }))
  expect(await screen.findByText('Andrea Ruiz')).toBeInTheDocument()
})
it('admin permite buscar borradores por código', async () => {
  const router = mostrar(<AdminEventos />)
  await userEvent.type(screen.getByLabelText('Buscar evento por código'), 'BORRADOR-01')
  await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/admin/eventos/BORRADOR-01'),
  )
})
it('crear evento valida campos sin petición', async () => {
  let llamadas = 0
  server.use(
    http.post('*/api/events', () => {
      llamadas++
      return HttpResponse.json({})
    }),
  )
  mostrar(<AdminNuevoEvento />)
  await userEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
  expect(
    await screen.findByText('El código del evento es obligatorio.'),
  ).toBeInTheDocument()
  expect(llamadas).toBe(0)
})
it('publicación pide confirmación y actualiza el estado', async () => {
  server.use(
    http.get('*/api/events/:code', () =>
      HttpResponse.json({ ...evento, status: 'DRAFT' }),
    ),
  )
  mostrar(
    <AdminDetalleEvento />,
    '/admin/eventos/CMF-2027',
    auth,
    '/admin/eventos/:eventCode',
  )
  await userEvent.click(await screen.findByRole('button', { name: 'Publicar evento' }))
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar publicación' }))
  expect(await screen.findByText('El evento ha sido publicado.')).toBeInTheDocument()
  expect(
    queryClient.getQueryData(['eventos', 'detalle', evento.eventCode]),
  ).toMatchObject({ status: 'PUBLISHED' })
})
it('guarda anónima conserva destino', async () => {
  const router = mostrar(
    <RutaProtegida>
      <h1>Privado</h1>
    </RutaProtegida>,
    '/mis-tickets',
  )
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(router.state.location.state).toEqual({ desde: '/mis-tickets' })
})
it('guarda USER rechaza ADMIN con 403', async () => {
  const router = mostrar(
    <RutaProtegida rolesPermitidos={['ADMIN']}>
      <h1>Privado</h1>
    </RutaProtegida>,
    '/admin/eventos',
    auth,
  )
  await waitFor(() => expect(router.state.location.pathname).toBe('/403'))
})
it('guarda ADMIN permite entrar', () => {
  mostrar(
    <RutaProtegida rolesPermitidos={['ADMIN']}>
      <h1>Privado</h1>
    </RutaProtegida>,
    '/',
    { estado: 'autenticada', usuario: { ...usuario, roles: ['ADMIN'] } },
  )
  expect(screen.getByRole('heading', { name: 'Privado' })).toBeInTheDocument()
})
