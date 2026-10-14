import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { Toaster } from 'sonner';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-left"
        dir="rtl"
        theme="dark"
        toastOptions={{
          style: {
            background: '#17191F',
            border: '1px solid #30333E',
            color: '#F1F2F7',
            fontFamily: 'Noto Sans Arabic, sans-serif',
            fontSize: '13px',
          },
        }}
      />
    </QueryClientProvider>
  );
};
