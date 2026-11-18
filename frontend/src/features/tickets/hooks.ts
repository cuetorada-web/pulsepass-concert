import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '../../lib/queryClient'
import {
  cancelarTicket,
  comprarTicket,
  listarTicketsUsuario,
  obtenerTicket,
} from './api'

export function useTicketsUsuario(email?: string) {
  return useQuery({
    queryKey: ['tickets', 'usuario', email],
    queryFn: ({ signal }) => listarTicketsUsuario(email ?? '', signal),
    enabled: Boolean(email),
  })
}

export function useTicket(ticketCode: string) {
  return useQuery({
    queryKey: ['tickets', 'detalle', ticketCode],
    queryFn: ({ signal }) => obtenerTicket(ticketCode, signal),
  })
}

export function useComprarTicket() {
  return useMutation({
    mutationFn: comprarTicket,
    onSuccess: (ticketCreado) => {
      void queryClient.invalidateQueries({
        queryKey: ['tickets', 'usuario', ticketCreado.userEmail],
      })
    },
  })
}

export function useCancelarTicket() {
  return useMutation({
    mutationFn: cancelarTicket,
    onSuccess: (ticketActualizado) => {
      void queryClient.invalidateQueries({
        queryKey: ['tickets', 'usuario', ticketActualizado.userEmail],
      })
      queryClient.setQueryData(
        ['tickets', 'detalle', ticketActualizado.ticketCode],
        ticketActualizado,
      )
    },
  })
}