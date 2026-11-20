import { Link, useNavigate } from 'react-router'
import { useEventosPublicados } from '../features/eventos/hooks'
import { eventosRecordados } from '../features/eventos/recientes'
import { RUTAS } from '../lib/rutas'
import BusquedaCodigo from '../components/BusquedaCodigo'
import ErrorConsulta from '../components/ErrorConsulta'
import Cargando from '../components/Cargando'
export default function AdminEventos() {
  const navegar = useNavigate()
  const consulta = useEventosPublicados()
  const recientes = eventosRecordados()
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Administración de eventos</h1>
        <Link className="btn-primary" to={RUTAS.adminNuevoEvento}>
          Nuevo evento
        </Link>
      </div>
      <BusquedaCodigo
        etiqueta="Buscar evento por código"
        onBuscar={(codigo) => void navegar(RUTAS.adminEvento(codigo))}
      />
      <section className="mt-8">
        <h2 className="text-xl font-bold">Creados en esta sesión</h2>
        {recientes.length === 0 ? (
          <p className="mt-4 text-slate-600">
            Todavía no has creado eventos en esta sesión.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recientes.map((evento) => (
              <li
                key={evento.eventCode}
                className="surface flex flex-wrap justify-between gap-3"
              >
                <span>
                  {evento.eventCode} · {evento.name}
                </span>
                <Link
                  className="text-marca-700 underline"
                  to={RUTAS.adminEvento(evento.eventCode)}
                >
                  Gestionar
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 rounded-lg bg-marca-50 p-4 text-sm text-marca-700">
          Los borradores se consultan por su código. Esta lista recuerda los creados
          durante la sesión actual.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-bold">Eventos publicados</h2>
        {consulta.isPending ? (
          <Cargando texto="Cargando eventos…" />
        ) : consulta.isError ? (
          <ErrorConsulta
            titulo="No pudimos cargar eventos"
            error={consulta.error}
            reintentando={consulta.isFetching}
            onReintentar={() => void consulta.refetch()}
          />
        ) : consulta.data.length === 0 ? (
          <p className="mt-4 text-slate-600">Todavía no hay eventos publicados.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {consulta.data.map((e) => (
              <li className="surface flex flex-wrap justify-between gap-3" key={e.id}>
                <span>
                  {e.eventCode} · {e.name}
                </span>
                <Link
                  className="text-marca-700 underline"
                  to={RUTAS.adminEvento(e.eventCode)}
                >
                  Gestionar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
