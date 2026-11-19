import { createBrowserRouter } from 'react-router'
import RutaProtegida from './components/RutaProtegida'
import Layout from './layouts/Layout'
import { RUTAS } from './lib/rutas'
import Inicio from './pages/Inicio'
import ErrorPagina from './pages/ErrorPagina'

export const router = createBrowserRouter([
  {
    path: RUTAS.inicio,
    Component: Layout,
    ErrorBoundary: ErrorPagina,
    children: [
      {
        index: true,
        Component: Inicio,
      },
      {
        path: RUTAS.eventos,
        lazy: async () => {
          const { default: Component } = await import('./pages/Eventos')
          return { Component }
        },
      },
      {
        path: RUTAS.detalleEvento,
        lazy: async () => {
          const { default: Component } = await import('./pages/DetalleEvento')
          return { Component }
        },
      },
      {
        path: RUTAS.artistas,
        lazy: async () => {
          const { default: Component } = await import('./pages/Artistas')
          return { Component }
        },
      },
      {
        path: RUTAS.detalleArtista,
        lazy: async () => {
          const { default: Component } = await import('./pages/DetalleArtista')
          return { Component }
        },
      },
      {
        path: RUTAS.sedes,
        lazy: async () => {
          const { default: Component } = await import('./pages/Sedes')
          return { Component }
        },
      },
      {
        path: RUTAS.detalleSede,
        lazy: async () => {
          const { default: Component } = await import('./pages/DetalleSede')
          return { Component }
        },
      },
      {
        path: RUTAS.misTickets,
        lazy: async () => {
          const { default: MisTickets } = await import('./pages/MisTickets')
          return {
            Component: () => (
              <RutaProtegida>
                <MisTickets />
              </RutaProtegida>
            ),
          }
        },
      },
      {
        path: RUTAS.detalleTicket,
        lazy: async () => {
          const { default: DetalleTicket } = await import('./pages/DetalleTicket')
          return {
            Component: () => (
              <RutaProtegida>
                <DetalleTicket />
              </RutaProtegida>
            ),
          }
        },
      },
      {
        path: RUTAS.adminEventos,
        lazy: async () => {
          const { default: AdminEventos } = await import('./pages/AdminEventos')
          return {
            Component: () => (
              <RutaProtegida rolesPermitidos={['ADMIN']}>
                <AdminEventos />
              </RutaProtegida>
            ),
          }
        },
      },
      {
        path: RUTAS.adminNuevoEvento,
        lazy: async () => {
          const { default: AdminNuevoEvento } = await import('./pages/AdminNuevoEvento')
          return {
            Component: () => (
              <RutaProtegida rolesPermitidos={['ADMIN']}>
                <AdminNuevoEvento />
              </RutaProtegida>
            ),
          }
        },
      },
      {
        path: RUTAS.adminDetalleEvento,
        lazy: async () => {
          const { default: AdminDetalleEvento } =
            await import('./pages/AdminDetalleEvento')
          return {
            Component: () => (
              <RutaProtegida rolesPermitidos={['ADMIN']}>
                <AdminDetalleEvento />
              </RutaProtegida>
            ),
          }
        },
      },
      {
        path: RUTAS.registro,
        lazy: async () => {
          const { default: Component } = await import('./pages/Registro')
          return { Component }
        },
      },
      {
        path: RUTAS.login,
        lazy: async () => {
          const { default: Component } = await import('./pages/Login')
          return { Component }
        },
      },
      {
        path: RUTAS.cuenta,
        lazy: async () => {
          const { default: Pagina } = await import('./pages/Cuenta')
          return {
            Component: () => (
              <RutaProtegida>
                <Pagina />
              </RutaProtegida>
            ),
          }
        },
      },
      {
        path: RUTAS.confirmacionCompra,
        lazy: async () => {
          const { default: Pagina } = await import('./pages/ConfirmacionCompra')
          return {
            Component: () => (
              <RutaProtegida>
                <Pagina />
              </RutaProtegida>
            ),
          }
        },
      },
      {
        path: RUTAS.validacionIngreso,
        lazy: async () => {
          const { default: Pagina } = await import('./pages/ValidacionIngreso')
          return {
            Component: () => (
              <RutaProtegida rolesPermitidos={['STAFF', 'ADMIN']}>
                <Pagina />
              </RutaProtegida>
            ),
          }
        },
      },
      {
        path: RUTAS.buscarTicketsPagados,
        lazy: async () => {
          const { default: Pagina } = await import('./pages/TicketsPagadosEvento')
          return {
            Component: () => (
              <RutaProtegida rolesPermitidos={['STAFF', 'ADMIN']}>
                <Pagina />
              </RutaProtegida>
            ),
          }
        },
      },
      {
        path: RUTAS.ticketsPagados,
        lazy: async () => {
          const { default: Pagina } = await import('./pages/TicketsPagadosEvento')
          return {
            Component: () => (
              <RutaProtegida rolesPermitidos={['STAFF', 'ADMIN']}>
                <Pagina />
              </RutaProtegida>
            ),
          }
        },
      },
      {
        path: RUTAS.sinPermisos,
        lazy: async () => {
          const { default: Component } = await import('./pages/SinPermisos')
          return { Component }
        },
      },
      {
        path: '*',
        lazy: async () => {
          const { default: Component } = await import('./pages/NoEncontrada')
          return { Component }
        },
      },
    ],
  },
])
