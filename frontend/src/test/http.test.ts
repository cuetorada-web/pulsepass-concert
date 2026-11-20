import { describe, expect, it } from 'vitest'
import { http as ruta, HttpResponse } from 'msw'
import { z } from 'zod'
import { http } from '../lib/http'
import { guardarSesion, obtenerSesion } from '../features/auth/sesion'
import { server } from './server'
import { errorApi } from './fixtures'
import { destinoSeguro } from '../lib/validacion'
import { precioCOP } from '../lib/formato'
describe('Cliente HTTP', () => {
  it('envía Bearer solo en el encabezado', async () => {
    guardarSesion('token-prueba', 900)
    server.use(
      ruta.get('*/api/prueba', ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer token-prueba')
        expect(request.url).not.toContain('token-prueba')
        return HttpResponse.json({ ok: true })
      }),
    )
    await http('/api/prueba', z.object({ ok: z.boolean() }))
  })
  it('no envía token en una operación pública', async () => {
    guardarSesion('token-prueba', 900)
    server.use(
      ruta.get('*/api/prueba', ({ request }) => {
        expect(request.headers.has('Authorization')).toBe(false)
        return HttpResponse.json({})
      }),
    )
    await http('/api/prueba', z.object({}), undefined, { publica: true })
  })
  it.each([400, 401, 403, 404, 409, 500])(
    'mapea el estado %i sin filtrar errores internos',
    async (status) => {
      server.use(
        ruta.get('*/api/prueba', () =>
          HttpResponse.json(errorApi(status, 'Mensaje controlado'), { status }),
        ),
      )
      await expect(http('/api/prueba', z.object({}))).rejects.toMatchObject({ status })
    },
  )
  it('conserva details de validación', async () => {
    server.use(
      ruta.get('*/api/prueba', () =>
        HttpResponse.json(errorApi(400, 'Validación', { name: 'Obligatorio' }), {
          status: 400,
        }),
      ),
    )
    await expect(http('/api/prueba', z.object({}))).rejects.toMatchObject({
      details: { name: 'Obligatorio' },
    })
  })
  it('cierra sesión ante 401 autenticado', async () => {
    guardarSesion('token-prueba', 900)
    server.use(ruta.get('*/api/prueba', () => HttpResponse.json({}, { status: 401 })))
    await expect(http('/api/prueba', z.object({}))).rejects.toMatchObject({ status: 401 })
    expect(obtenerSesion()).toEqual({ estado: 'anonima', expirada: true })
    expect(sessionStorage.getItem('pulsepass.sesion')).toBeNull()
  })
  it('usa mensaje seguro ante cuerpo de error inválido', async () => {
    server.use(
      ruta.get('*/api/prueba', () => new HttpResponse('SQL secreto', { status: 500 })),
    )
    await expect(http('/api/prueba', z.object({}))).rejects.not.toThrow('SQL secreto')
  })
  it('rechaza respuestas que no cumplen el contrato', async () => {
    server.use(ruta.get('*/api/prueba', () => HttpResponse.json({ ok: 'sí' })))
    await expect(http('/api/prueba', z.object({ ok: z.boolean() }))).rejects.toThrow(
      'formato inesperado',
    )
  })
  it('muestra error de red', async () => {
    server.use(ruta.get('*/api/prueba', () => HttpResponse.error()))
    await expect(http('/api/prueba', z.object({}))).rejects.toMatchObject({ status: 0 })
  })
})
it.each(['https://evil.test', '//evil.test', '/\\evil.test', '/login', '/registro'])(
  'rechaza destino externo o circular %s',
  (desde) => expect(destinoSeguro({ desde })).toBe('/'),
)
it('conserva destino interno con filtros', () =>
  expect(destinoSeguro({ desde: '/mis-tickets?estado=PAID' })).toBe(
    '/mis-tickets?estado=PAID',
  ))
it('formatea precios COP', () => expect(precioCOP(250000)).toContain('250.000'))
