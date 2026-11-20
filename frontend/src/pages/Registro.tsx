import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useRegistro } from '../features/auth/hooks'
import { registroSchema } from '../features/auth/tipos'
import type { DatosRegistro } from '../features/auth/tipos'
import { ApiError } from '../lib/http'
import { Navigate } from 'react-router'
import { CampoContrasena } from '../components/ui'
import { fortalezaContrasena } from '../lib/validacion'
import { RUTAS } from '../lib/rutas'
import { useAuth } from '../features/auth/AuthContext'

const barras = {
  vacia: 'bg-slate-200',
  debil: 'bg-red-500',
  media: 'bg-amber-500',
  fuerte: 'bg-emerald-600',
}
const textoFortaleza = {
  vacia: '',
  debil: 'Fortaleza: baja',
  media: 'Fortaleza: media',
  fuerte: 'Fortaleza: alta',
}

const campos = [
  {
    nombre: 'username',
    etiqueta: 'Usuario',
    tipo: 'text',
    autocompletar: 'username',
    obligatorio: true,
  },
  {
    nombre: 'email',
    etiqueta: 'Correo electrónico',
    tipo: 'email',
    autocompletar: 'email',
    obligatorio: true,
  },
  {
    nombre: 'firstName',
    etiqueta: 'Nombres',
    tipo: 'text',
    autocompletar: 'given-name',
    obligatorio: true,
  },
  {
    nombre: 'lastName',
    etiqueta: 'Apellidos',
    tipo: 'text',
    autocompletar: 'family-name',
    obligatorio: true,
  },
  {
    nombre: 'phone',
    etiqueta: 'Teléfono (opcional)',
    tipo: 'tel',
    autocompletar: 'tel',
    obligatorio: false,
  },
  {
    nombre: 'city',
    etiqueta: 'Ciudad (opcional)',
    tipo: 'text',
    autocompletar: 'address-level2',
    obligatorio: false,
  },
  {
    nombre: 'birthDate',
    etiqueta: 'Fecha de nacimiento',
    tipo: 'date',
    autocompletar: 'bday',
    obligatorio: true,
  },
  {
    nombre: 'password',
    etiqueta: 'Contraseña',
    tipo: 'password',
    autocompletar: 'new-password',
    obligatorio: true,
  },
] as const

export default function Registro() {
  const auth = useAuth()
  const registro = useRegistro()

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      city: '',
      birthDate: '',
      password: '',
    },
  })

  const fortaleza = fortalezaContrasena(useWatch({ control, name: 'password' }) ?? '')

  async function enviar(datos: DatosRegistro) {
    try {
      await registro.mutateAsync(datos)
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 400) {
        for (const campo of campos) {
          const mensaje = error.details[campo.nombre]

          if (typeof mensaje === 'string') {
            setError(campo.nombre, {
              type: 'server',
              message: mensaje,
            })
          }
        }
      }
    }
  }

  if (auth.estado === 'autenticada') return <Navigate to={RUTAS.inicio} replace />

  if (registro.isSuccess) {
    return <Navigate to={RUTAS.login} replace state={{ registroExitoso: true }} />
  }

  return (
    <section
      aria-labelledby="titulo-registro"
      className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10"
    >
      <h1 id="titulo-registro" className="text-3xl font-bold">
        Crea tu cuenta
      </h1>

      <p className="mt-3 text-slate-600">
        Regístrate para gestionar tus entradas en PulsePass.
      </p>

      <form noValidate onSubmit={handleSubmit(enviar)} className="mt-8">
        <fieldset disabled={registro.isPending} className="grid gap-5 sm:grid-cols-2">
          <legend className="sr-only">Datos de registro</legend>

          {campos.map((campo) => {
            const error = errors[campo.nombre]

            if (campo.nombre === 'password')
              return (
                <div key={campo.nombre} className="sm:col-span-2">
                  <CampoContrasena
                    etiqueta={campo.etiqueta}
                    id={campo.nombre}
                    autoComplete={campo.autocompletar}
                    required={campo.obligatorio}
                    error={error?.message}
                    {...register('password')}
                  >
                    <div aria-hidden="true" className="mt-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={`h-1.5 flex-1 rounded-full ${
                            n <= fortaleza.puntos ? barras[fortaleza.nivel] : barras.vacia
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {textoFortaleza[fortaleza.nivel]}
                    </p>
                  </CampoContrasena>
                </div>
              )

            return (
              <div key={campo.nombre}>
                <label htmlFor={campo.nombre} className="block text-sm font-semibold">
                  {campo.etiqueta}
                </label>

                <input
                  id={campo.nombre}
                  type={campo.tipo}
                  autoComplete={campo.autocompletar}
                  required={campo.obligatorio}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${campo.nombre}-error` : undefined}
                  {...register(campo.nombre)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                />

                {error && (
                  <p
                    id={`${campo.nombre}-error`}
                    className="mt-1 text-sm text-red-700"
                    role="alert"
                  >
                    {error.message}
                  </p>
                )}
              </div>
            )
          })}
        </fieldset>

        <p className="mt-4 text-sm text-slate-500">
          La contraseña debe tener entre 12 y 72 caracteres.
        </p>

        {registro.isError && (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-800">
            {registro.error instanceof ApiError
              ? registro.error.status === 409
                ? 'No pudimos crear la cuenta. Prueba con otro usuario o correo electrónico.'
                : registro.error.message
              : 'Ocurrió un error inesperado. Intenta nuevamente.'}
          </p>
        )}

        <button
          type="submit"
          disabled={registro.isPending}
          className="mt-6 w-full rounded-xl bg-marca-600 px-6 py-3 font-semibold text-white hover:bg-marca-700 disabled:cursor-wait disabled:opacity-60"
        >
          {registro.isPending ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </section>
  )
}
