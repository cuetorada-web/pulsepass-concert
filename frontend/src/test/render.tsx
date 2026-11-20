import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AuthContext } from '../features/auth/AuthContext'
import type { EstadoAuth } from '../features/auth/AuthContext'
import { queryClient } from '../lib/queryClient'
export function mostrar(
  elemento: ReactNode,
  ruta = '/',
  auth: EstadoAuth = { estado: 'anonima', expirada: false },
  patron = '*',
) {
  const router = createMemoryRouter(
    [
      { path: patron, element: elemento },
      { path: '/login', element: <h1>Login destino</h1> },
      { path: '/403', element: <h1>Sin permisos</h1> },
      { path: '/destino', element: <h1>Destino protegido</h1> },
      ...(patron === '*'
        ? []
        : [{ path: '*', element: <h1>Destino de la operación</h1> }]),
    ],
    { initialEntries: [ruta] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return router
}
