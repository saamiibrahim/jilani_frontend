'use client';
import React from 'react';
import { ActiveThemeProvider } from '../themes/active-theme';
import { AuthProvider } from '@/lib/auth';
import QueryProvider from './query-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthProvider>
        <ActiveThemeProvider initialTheme={activeThemeValue}>
          <QueryProvider>{children}</QueryProvider>
        </ActiveThemeProvider>
      </AuthProvider>
    </>
  );
}
