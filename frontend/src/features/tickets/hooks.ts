import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '../../lib/queryClient'
import {
  cancelarTicket,
  comprarTicket,
  listarTicketsUsuario,
  obtenerTicket,
  usarTicket,
  listarTicketsPagados,
} from './api'

export function useTicketsUsuario(email?: string) {
  return useQuery({
    queryKey: ['tickets', 'usuario', email],
    queryFn: ({ signal }) => listarTicketsUsuario(email ?? '', signal),
    enabled: Boolean(email),
    staleTime: 15_000,
  })
}

export function useTicket(ticketCode: string) {
  return useQuery({
    queryKey: ['tickets', 'detalle', ticketCode],
    queryFn: ({ signal }) => obtenerTicket(ticketCode, signal),
    staleTime: 15_000,
    refetchOnMount: 'always',
  })
}

export function useComprarTicket() {
  return useMutation({
    mutationFn: comprarTicket,
    onSuccess: (ticketCreado) => {
      queryClient.setQueryData(
        ['tickets', 'detalle', ticketCreado.ticketCode],
        ticketCreado,
      )
      void queryClient.invalidateQueries({ queryKey: ['eventos'] })
      void queryClient.invalidateQueries({
        queryKey: ['tickets', 'pagados', ticketCreado.eventCode],
      })
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
        queryKey: ['tickets', 'pagados', ticketActualizado.eventCode],
      })
      void queryClient.invalidateQueries({ queryKey: ['eventos'] })
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

export function useTicketsPagados(eventCode: string) {
  return useQuery({
    queryKey: ['tickets', 'pagados', eventCode],
    queryFn: ({ signal }) => listarTicketsPagados(eventCode, signal),
    staleTime: 15_000,
  })
}

export function useUsarTicket() {
  return useMutation({
    mutationFn: usarTicket,
    onSuccess: (ticket) => {
      queryClient.setQueryData(['tickets', 'detalle', ticket.ticketCode], ticket)
      void queryClient.invalidateQueries({
        queryKey: ['tickets', 'usuario', ticket.userEmail],
      })
      void queryClient.invalidateQueries({
        queryKey: ['tickets', 'pagados', ticket.eventCode],
      })
    },
  })
}
