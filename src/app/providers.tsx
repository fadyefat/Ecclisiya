import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { Toaster } from 'sonner';
import { ThemeProvider, useTheme } from '../lib/theme-context';

const ThemedToaster: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  return (
    <Toaster
      position="bottom-left"
      dir="rtl"
      theme={isLight ? 'light' : 'dark'}
      toastOptions={{
        style: {
          background: isLight ? '#FFFFFF' : '#17191F',
          border: isLight ? '1px solid #EEE7E4' : '1px solid #30333E',
          color: isLight ? '#2C181D' : '#F1F2F7',
          fontFamily: 'Noto Sans Arabic, sans-serif',
          fontSize: '13px',
          boxShadow: isLight
            ? '0 10px 25px -5px rgba(122, 24, 43, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        },
      }}
    />
  );
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        {children}
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
};
