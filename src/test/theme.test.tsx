import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ThemeProvider, useTheme } from '../lib/theme-context';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const TestThemeConsumer: React.FC = () => {
  const { themeMode, resolvedTheme, setThemeMode, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-mode">{themeMode}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button onClick={() => setThemeMode('light')}>Set Light</button>
      <button onClick={() => setThemeMode('dark')}>Set Dark</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
};

describe('Theme System & Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  it('initializes with default light theme and sets HTML classes', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('switches between light and dark modes and persists to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <TestThemeConsumer />
      </ThemeProvider>
    );

    // Switch to dark
    await user.click(screen.getByText('Set Dark'));
    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('ecclisiya_theme_mode')).toBe('dark');

    // Toggle back to light
    await user.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.getItem('ecclisiya_theme_mode')).toBe('light');
  });

  it('renders theme choices in SettingsPage and allows changing theme', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <MemoryRouter>
        <ThemeProvider defaultTheme="light">
          <QueryClientProvider client={queryClient}>
            <SettingsPage />
          </QueryClientProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    // Verify Theme card headers
    expect(await screen.findByText('مظهر التطبيق والسمة (Dark & Light Mode)')).toBeInTheDocument();
    expect(screen.getByText('الوضع الفاتح (هوية الكنيسة)')).toBeInTheDocument();
    expect(screen.getByText('الوضع الداكن (Dark Mode)')).toBeInTheDocument();

    // Click on Dark Mode card
    const darkModeButton = screen.getByText('الوضع الداكن (Dark Mode)').closest('button');
    expect(darkModeButton).toBeInTheDocument();
    if (darkModeButton) {
      await user.click(darkModeButton);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    }

    // Click on Light Mode card
    const lightModeButton = screen.getByText('الوضع الفاتح (هوية الكنيسة)').closest('button');
    expect(lightModeButton).toBeInTheDocument();
    if (lightModeButton) {
      await user.click(lightModeButton);
      expect(document.documentElement.classList.contains('light')).toBe(true);
    }
  });
});
