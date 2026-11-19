import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../features/auth/AuthContext'
import { RUTAS } from '../lib/rutas'

type Rol = 'USER' | 'STAFF' | 'ADMIN'

interface PropiedadesRutaProtegida {
  children: ReactNode
  rolesPermitidos?: readonly Rol[]
}

export default function RutaProtegida({
  children,
  rolesPermitidos,
}: PropiedadesRutaProtegida) {
  const auth = useAuth()
  const ubicacion = useLocation()

  if (auth.estado === 'cargando') {
    return (
      <p role="status" className="text-slate-600">
        Verificando permisos de acceso…
      </p>
    )
  }

  if (auth.estado === 'error') {
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {auth.mensaje}
      </p>
    )
  }

  if (auth.estado === 'anonima') {
    return (
      <Navigate
        to={RUTAS.login}
        replace
        state={{ desde: ubicacion.pathname + ubicacion.search }}
      />
    )
  }

  if (
    rolesPermitidos &&
    !rolesPermitidos.some((rol) => auth.usuario.roles.includes(rol))
  ) {
    return <Navigate to={RUTAS.sinPermisos} replace />
  }

  return <>{children}</>
}
