import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { codigoSchema } from '../lib/validacion'
import { Boton, Campo } from './ui'
const schema = z.object({ codigo: codigoSchema })
interface Props {
  etiqueta: string
  onBuscar: (codigo: string) => void
  inicial?: string
  enfocar?: boolean
}
export default function BusquedaCodigo({
  etiqueta,
  onBuscar,
  inicial = '',
  enfocar = false,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { codigo: inicial },
  })
  return (
    <form
      noValidate
      onSubmit={handleSubmit(({ codigo }) => onBuscar(codigo))}
      className="surface mt-6"
    >
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
        <Campo
          etiqueta={etiqueta}
          id="codigo-busqueda"
          {...register('codigo')}
          autoComplete="off"
          autoFocus={enfocar}
          error={errors.codigo?.message}
        />
        <Boton type="submit">Buscar</Boton>
      </div>
    </form>
  )
}
