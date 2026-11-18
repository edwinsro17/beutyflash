/**
 * Hook modular de sincronización con TanStack Query + ObserverEventBus.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sincronizarEstadoDesdeSupabase } from '../theme/colors';
import { appEventBus, APP_EVENTS } from '../patterns/ObserverEventBus';

export function useSupabaseSync(rolActual = 'cliente', onSynced = null) {
  const query = useQuery({
    queryKey: ['beautyflash-sync', rolActual],
    queryFn: async () => {
      await sincronizarEstadoDesdeSupabase(rolActual);
      if (onSynced) onSynced();
      return Date.now();
    },
    refetchInterval: 2500,
  });

  useEffect(() => {
    const unsub1 = appEventBus.subscribe(APP_EVENTS.REQUEST_STATUS_CHANGED, () => {
      if (onSynced) onSynced();
    });
    const unsub2 = appEventBus.subscribe(APP_EVENTS.CHAT_MESSAGE_RECEIVED, () => {
      if (onSynced) onSynced();
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [onSynced]);

  return query;
}
