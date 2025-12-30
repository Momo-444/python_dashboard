import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// Pour les données qui changent rarement (configuration, rôles, etc.)
export const staticQueryOptions = {
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000, // 1 heure
};

// Pour les données temps réel (leads, devis)
export const realtimeQueryOptions = {
  staleTime: 0, // Toujours considérer comme stale pour Realtime
  gcTime: 5 * 60 * 1000, // 5 minutes
};
