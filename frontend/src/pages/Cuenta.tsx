import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../features/auth/AuthContext'
import { cerrarSesion } from '../features/auth/sesion'
import { usePerfilUsuario } from '../features/auth/usuarios'
import ErrorConsulta from '../components/ErrorConsulta'
import { RUTAS } from '../lib/rutas'
import Cargando from '../components/Cargando'

export default function Cuenta() {
  const auth = useAuth()
  const [porUsername, setPorUsername] = useState(false)
  const usuario = auth.estado === 'autenticada' ? auth.usuario : undefined
  const perfil = usePerfilUsuario(usuario?.email, usuario?.username, porUsername)
  return (
    <section>
      <h1 className="text-3xl font-bold">Mi cuenta</h1>
      {perfil.isPending ? (
        <Cargando texto="Cargando cuenta…" />
      ) : perfil.isError ? (
        <ErrorConsulta
          titulo="No pudimos cargar tu cuenta"
          error={perfil.error}
          reintentando={perfil.isFetching}
          onReintentar={() => void perfil.refetch()}
        />
      ) : (
        <div className="surface mt-6 flex flex-wrap items-center gap-6">
          <div className="avatar" aria-hidden="true">
            {perfil.data.firstName.slice(0, 1)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">
              {perfil.data.firstName} {perfil.data.lastName}
            </h2>
            <p className="mt-2 break-all text-slate-600">{perfil.data.email}</p>
            <p className="mt-1 text-sm text-slate-500">Usuario: {perfil.data.username}</p>
          </div>
          <div className="text-sm">
            <p>Rol: {usuario?.roles.join(', ')}</p>
            <p className="mt-2 text-emerald-700">
              {perfil.data.active ? 'Cuenta activa' : 'Cuenta inactiva'}
            </p>
          </div>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {usuario?.roles.includes('USER') && (
          <Link className="btn-primary" to={RUTAS.misTickets}>
            Ver mis tickets
          </Link>
        )}
        <button
          className="btn-secondary"
          type="button"
          onClick={() => setPorUsername((v) => !v)}
        >
          {porUsername ? 'Consultar por correo' : 'Consultar por usuario'}
        </button>
        <button className="btn-secondary" type="button" onClick={() => cerrarSesion()}>
          Cerrar sesión
        </button>
      </div>
    </section>
  )
}
