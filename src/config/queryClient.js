/**
 * Cliente global de TanStack Query para caché inteligente, reintentos y sincronización.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 15,
      gcTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
