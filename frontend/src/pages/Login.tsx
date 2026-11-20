import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../features/auth/AuthContext'
import { useLogin } from '../features/auth/hooks'
import { CampoContrasena } from '../components/ui'
import { loginSchema } from '../features/auth/tipos'
import type { DatosLogin } from '../features/auth/tipos'
import { cerrarSesion } from '../features/auth/sesion'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'
import { destinoSeguro } from '../lib/validacion'

const estadoNavegacionSchema = z.object({
  registroExitoso: z.boolean().optional(),
})

export default function Login() {
  const auth = useAuth()
  const login = useLogin()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const destino = destinoSeguro(ubicacion.state as unknown)

  const aviso = estadoNavegacionSchema.safeParse(ubicacion.state as unknown)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosLogin>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  async function enviar(datos: DatosLogin) {
    try {
      await login.mutateAsync(datos)
      await navegar(destino, { replace: true })
    } catch {
      // La mutación conserva el error para mostrarlo en el formulario.
    }
  }

  if (auth.estado === 'autenticada') {
    return <Navigate to={destino} replace />
  }

  if (auth.estado === 'cargando') {
    return <p role="status">Comprobando sesión…</p>
  }

  return (
    <section
      aria-labelledby="titulo-login"
      className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-10"
    >
      <h1 id="titulo-login" className="text-3xl font-bold">
        Inicia sesión
      </h1>

      <p className="mt-3 text-slate-600">Accede a tu cuenta de PulsePass.</p>

      {aviso.success && aviso.data.registroExitoso && (
        <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-900">
          Tu cuenta fue creada. Ya puedes iniciar sesión.
        </p>
      )}

      {auth.estado === 'anonima' && auth.expirada && (
        <p role="status" className="mt-5 rounded-lg bg-amber-50 p-4 text-amber-900">
          Tu sesión expiró. Inicia sesión nuevamente.
        </p>
      )}

      {auth.estado === 'error' && (
        <div role="alert" className="mt-5 rounded-lg bg-amber-50 p-4">
          <p>{auth.mensaje}</p>
          <button type="button" onClick={() => cerrarSesion()} className="mt-3 underline">
            Volver a iniciar sesión
          </button>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit(enviar)} className="mt-8">
        <fieldset disabled={login.isPending} className="space-y-5">
          <legend className="sr-only">Credenciales de acceso</legend>

          <div>
            <label htmlFor="identifier" className="block text-sm font-semibold">
              Usuario o correo electrónico
            </label>
            <input
              id="identifier"
              autoComplete="username"
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? 'identifier-error' : undefined}
              {...register('identifier')}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            {errors.identifier && (
              <p id="identifier-error" role="alert" className="mt-1 text-sm text-red-700">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <CampoContrasena
            etiqueta="Contraseña"
            id="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </fieldset>

        {login.isError && (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-800">
            {login.error instanceof ApiError
              ? login.error.status === 401
                ? 'Credenciales inválidas.'
                : login.error.message
              : 'No pudimos iniciar sesión. Intenta nuevamente.'}
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending || auth.estado === 'error'}
          className="mt-6 w-full rounded-xl bg-marca-600 px-6 py-3 font-semibold text-white hover:bg-marca-700 disabled:opacity-60"
        >
          {login.isPending ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Todavía no tienes cuenta?{' '}
        <Link to={RUTAS.registro} className="font-semibold text-marca-700 underline">
          Regístrate
        </Link>
      </p>
    </section>
  )
}
