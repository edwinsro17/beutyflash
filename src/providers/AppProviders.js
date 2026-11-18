import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../config/queryClient';
import { initSentry } from '../config/sentry';

export default function AppProviders({ children }) {
  useEffect(() => {
    initSentry();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
