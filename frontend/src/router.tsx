import { createBrowserRouter } from 'react-router'
import Layout from './layouts/Layout'
import { RUTAS } from './lib/rutas'
import Inicio from './pages/Inicio'

export const router = createBrowserRouter([
  {
    path: RUTAS.inicio,
    Component: Layout,
    children: [
              {
        path: RUTAS.detalleArtista,
        lazy: async () => {
          const { default: Component } = await import('./pages/DetalleArtista')
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
        path: RUTAS.detalleSede,
        lazy: async () => {
          const { default: Component } = await import('./pages/DetalleSede')
          return { Component }
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
        path: RUTAS.artistas,
        lazy: async () => {
          const { default: Component } = await import('./pages/Artistas')
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
        path: RUTAS.login,
        lazy: async () => {
          const { default: Component } = await import('./pages/Login')
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