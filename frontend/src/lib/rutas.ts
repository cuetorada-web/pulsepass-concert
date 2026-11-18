export const RUTAS = {
  inicio: '/',
  eventos: '/eventos',
  artistas: '/artistas',
  sedes: '/sedes',
  registro: '/registro',
  login: '/login',

  misTickets: '/mis-tickets',
  detalleTicket: '/mis-tickets/:ticketCode',

  adminEventos: '/admin/eventos',
  adminNuevoEvento: '/admin/eventos/nuevo',
  adminDetalleEvento: '/admin/eventos/:eventCode',

  detalleArtista: '/artistas/:id',
  detalleSede: '/sedes/:code',
  detalleEvento: '/eventos/:eventCode',

  artista: (id: number) => `/artistas/${id}`,
  sede: (code: string) => `/sedes/${encodeURIComponent(code)}`,
  evento: (eventCode: string) =>
    `/eventos/${encodeURIComponent(eventCode)}`,
  ticket: (ticketCode: string) =>
    `/mis-tickets/${encodeURIComponent(ticketCode)}`,
  adminEvento: (eventCode: string) =>
    `/admin/eventos/${encodeURIComponent(eventCode)}`,
} as const