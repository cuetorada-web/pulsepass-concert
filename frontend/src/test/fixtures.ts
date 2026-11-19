export const artista = {
  id: 1,
  stageName: 'Solar Beat',
  country: 'Colombia',
  genre: 'Electronic',
  active: true,
}
export const sede = {
  id: 1,
  code: 'VEN-01',
  name: 'Marina Convention Center',
  city: 'Santa Marta',
  address: 'Calle 1',
  capacity: 100,
  active: true,
}
export const evento = {
  id: 1,
  eventCode: 'CMF-2027',
  name: 'Caribbean Music Fest 2027',
  category: 'MUSIC',
  status: 'PUBLISHED',
  eventDate: '2027-06-20T19:00:00',
  venueName: sede.name,
  venueCode: sede.code,
  description: 'Una experiencia musical.',
  minimumAge: 0,
  artists: [artista],
}
export const ticket = {
  id: 1,
  ticketCode: 'TKT-001',
  type: 'VIP',
  status: 'PAID',
  price: 250000,
  purchaseDate: '2026-11-19T10:00:00',
  userEmail: 'andrea@example.com',
  eventCode: evento.eventCode,
  eventName: evento.name,
}
export const usuario = {
  id: 1,
  username: 'andrea',
  email: 'andrea@example.com',
  roles: ['USER'] as ('USER' | 'STAFF' | 'ADMIN')[],
}
export const perfil = { ...usuario, active: true, firstName: 'Andrea', lastName: 'Ruiz' }
export function errorApi(
  status: number,
  message = 'Operación rechazada',
  details: Record<string, string> = {},
) {
  return { timestamp: '2026-11-19T10:00:00', status, error: 'Error', message, details }
}
