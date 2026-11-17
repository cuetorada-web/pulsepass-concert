export const RUTAS = {
  inicio: '/',
  eventos: '/eventos',
  artistas: '/artistas',
  sedes: '/sedes',
  registro: '/registro',
  login: '/login',

  detalleArtista: '/artistas/:id',
  detalleSede: '/sedes/:code',
  detalleEvento: '/eventos/:eventCode',

  artista: (id: number) => `/artistas/${id}`,
  sede: (code: string) => `/sedes/${encodeURIComponent(code)}`,
  evento: (eventCode: string) =>
    `/eventos/${encodeURIComponent(eventCode)}`,
} as const