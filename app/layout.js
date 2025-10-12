'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { SocketProvider } from './context/SocketContext';
import ToastProvider from './providers/ToastProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <SocketProvider>
            {children}
            <ToastProvider />
          </SocketProvider>
        </SessionProvider>
      </body>
    </html>
  );
}