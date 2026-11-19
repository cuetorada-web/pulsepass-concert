import { it, expect } from 'vitest'
import type { ReactNode } from 'react'
import { screen } from '@testing-library/react'
import { http, HttpResponse, delay } from 'msw'
import { server } from './server'
import { mostrar } from './render'
import { usuario } from './fixtures'
import type { EstadoAuth } from '../features/auth/AuthContext'
import Artistas from '../pages/Artistas'
import Sedes from '../pages/Sedes'
import DetalleArtista from '../pages/DetalleArtista'
import DetalleSede from '../pages/DetalleSede'
import DetalleEvento from '../pages/DetalleEvento'
import MisTickets from '../pages/MisTickets'
import DetalleTicket from '../pages/DetalleTicket'
import ConfirmacionCompra from '../pages/ConfirmacionCompra'
import Cuenta from '../pages/Cuenta'
import TicketsPagadosEvento from '../pages/TicketsPagadosEvento'
import AdminEventos from '../pages/AdminEventos'
import AdminDetalleEvento from '../pages/AdminDetalleEvento'
interface Caso {
  nombre: string
  pagina: ReactNode
  endpoint: string
  ruta: string
  patron: string
}
const auth: EstadoAuth = { estado: 'autenticada', usuario }
const casos: Caso[] = [
  {
    nombre: 'Artistas',
    pagina: <Artistas />,
    endpoint: '*/api/artists/active',
    ruta: '/artistas',
    patron: '/artistas',
  },
  {
    nombre: 'Sedes',
    pagina: <Sedes />,
    endpoint: '*/api/venues/active',
    ruta: '/sedes',
    patron: '/sedes',
  },
  {
    nombre: 'DetalleArtista',
    pagina: <DetalleArtista />,
    endpoint: '*/api/artists/:id',
    ruta: '/artistas/1',
    patron: '/artistas/:id',
  },
  {
    nombre: 'DetalleSede',
    pagina: <DetalleSede />,
    endpoint: '*/api/venues/:code',
    ruta: '/sedes/VEN-01',
    patron: '/sedes/:code',
  },
  {
    nombre: 'DetalleEvento',
    pagina: <DetalleEvento />,
    endpoint: '*/api/events/:code',
    ruta: '/eventos/CMF',
    patron: '/eventos/:eventCode',
  },
  {
    nombre: 'MisTickets',
    pagina: <MisTickets />,
    endpoint: '*/api/tickets/by-user',
    ruta: '/mis-tickets',
    patron: '/mis-tickets',
  },
  {
    nombre: 'DetalleTicket',
    pagina: <DetalleTicket />,
    endpoint: '*/api/tickets/:code',
    ruta: '/mis-tickets/TKT',
    patron: '/mis-tickets/:ticketCode',
  },
  {
    nombre: 'Confirmacion',
    pagina: <ConfirmacionCompra />,
    endpoint: '*/api/tickets/:code',
    ruta: '/compra/confirmacion/TKT',
    patron: '/compra/confirmacion/:ticketCode',
  },
  {
    nombre: 'Cuenta',
    pagina: <Cuenta />,
    endpoint: '*/api/users/by-email',
    ruta: '/cuenta',
    patron: '/cuenta',
  },
  {
    nombre: 'TicketsPagados',
    pagina: <TicketsPagadosEvento />,
    endpoint: '*/api/events/:code/tickets/paid',
    ruta: '/staff/eventos/CMF/tickets',
    patron: '/staff/eventos/:eventCode/tickets',
  },
  {
    nombre: 'AdminEventos',
    pagina: <AdminEventos />,
    endpoint: '*/api/events/published',
    ruta: '/admin/eventos',
    patron: '/admin/eventos',
  },
  {
    nombre: 'AdminDetalle',
    pagina: <AdminDetalleEvento />,
    endpoint: '*/api/events/:code',
    ruta: '/admin/eventos/CMF',
    patron: '/admin/eventos/:eventCode',
  },
]
it.each(casos)('$nombre muestra carga', async ({ pagina, endpoint, ruta, patron }) => {
  server.use(
    http.get(endpoint, async () => {
      await delay(100)
      return HttpResponse.json({})
    }),
  )
  mostrar(pagina, ruta, auth, patron)
  expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
})
it.each(casos)(
  '$nombre muestra error recuperable',
  async ({ pagina, endpoint, ruta, patron }) => {
    server.use(http.get(endpoint, () => HttpResponse.json({}, { status: 500 })))
    mostrar(pagina, ruta, auth, patron)
    expect(
      (await screen.findAllByRole('button', { name: 'Reintentar' })).length,
    ).toBeGreaterThan(0)
  },
)
it.each([
  {
    pagina: <Artistas />,
    endpoint: '*/api/artists/active',
    mensaje: 'Todavía no hay artistas disponibles',
  },
  {
    pagina: <Sedes />,
    endpoint: '*/api/venues/active',
    mensaje: 'Todavía no hay sedes disponibles',
  },
  {
    pagina: <TicketsPagadosEvento />,
    endpoint: '*/api/events/:code/tickets/paid',
    mensaje: 'No hay tickets pagados para este código de evento.',
  },
])('lista vacía: $mensaje', async ({ pagina, endpoint, mensaje }) => {
  server.use(http.get(endpoint, () => HttpResponse.json([])))
  mostrar(pagina, '/staff/eventos/CMF/tickets', auth, '/staff/eventos/:eventCode/tickets')
  expect(await screen.findByText(mensaje)).toBeInTheDocument()
})
