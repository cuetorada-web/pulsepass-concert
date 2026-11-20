import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { artista, evento, perfil, sede, ticket, usuario } from './fixtures'
export const server = setupServer(
  http.get('*/api/events/published', () => HttpResponse.json([evento])),
  http.get('*/api/events/by-artist', () => HttpResponse.json([evento])),
  http.get('*/api/events/:code/tickets/paid', () => HttpResponse.json([ticket])),
  http.get('*/api/events/:code', () => HttpResponse.json(evento)),
  http.get('*/api/artists/active', () => HttpResponse.json([artista])),
  http.get('*/api/artists/by-stage-name', () => HttpResponse.json(artista)),
  http.get('*/api/artists/:id', () => HttpResponse.json(artista)),
  http.get('*/api/venues/active', () => HttpResponse.json([sede])),
  http.get('*/api/venues/:code', () => HttpResponse.json(sede)),
  http.get('*/api/auth/me', () => HttpResponse.json(usuario)),
  http.post('*/api/auth/login', () =>
    HttpResponse.json({
      accessToken: 'token-prueba',
      tokenType: 'Bearer',
      expiresIn: 900,
    }),
  ),
  http.post('*/api/users', () => HttpResponse.json(perfil, { status: 201 })),
  http.get('*/api/users/by-email', () => HttpResponse.json(perfil)),
  http.get('*/api/users/by-username', () => HttpResponse.json(perfil)),
  http.get('*/api/tickets/by-user', () => HttpResponse.json([ticket])),
  http.get('*/api/tickets/:code', () => HttpResponse.json(ticket)),
  http.post('*/api/tickets', () => HttpResponse.json(ticket, { status: 201 })),
  http.patch('*/api/tickets/:code/cancel', () =>
    HttpResponse.json({ ...ticket, status: 'CANCELLED' }),
  ),
  http.patch('*/api/tickets/:code/use', () =>
    HttpResponse.json({ ...ticket, status: 'USED' }),
  ),
  http.post('*/api/events', () =>
    HttpResponse.json({ ...evento, status: 'DRAFT' }, { status: 201 }),
  ),
  http.patch('*/api/events/:code/publish', () => HttpResponse.json(evento)),
  http.post('*/api/events/:code/artists/:id', () => HttpResponse.json(evento)),
)
