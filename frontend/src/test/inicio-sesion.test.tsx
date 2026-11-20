import { expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { mostrar } from './render'
import { usuario } from './fixtures'
import Inicio from '../pages/Inicio'

it('inicio ofrece registro para visitantes', () => {
  mostrar(<Inicio />)
  expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute(
    'href',
    '/registro',
  )
})
it('inicio ofrece tickets y oculta registro al iniciar sesión', () => {
  mostrar(<Inicio />, '/', { estado: 'autenticada', usuario })
  expect(screen.queryByRole('link', { name: 'Crear cuenta' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ver mis tickets' })).toHaveAttribute(
    'href',
    '/mis-tickets',
  )
})
it('no ofrece registro mientras comprueba la sesión', () => {
  mostrar(<Inicio />, '/', { estado: 'cargando' })
  expect(screen.queryByRole('link', { name: 'Crear cuenta' })).not.toBeInTheDocument()
})
