import { MutationCache, QueryClient } from '@tanstack/react-query'
import { avisar } from './avisos'

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: () => avisar('Operación completada correctamente.'),
  }),
  defaultOptions: {
    mutations: { retry: false },
    queries: {
      staleTime: 60_000,
      retry: (intento, error) =>
        intento < 1 &&
        (!('status' in error) ||
          error.status === 0 ||
          (typeof error.status === 'number' && error.status >= 500)),
    },
  },
})
