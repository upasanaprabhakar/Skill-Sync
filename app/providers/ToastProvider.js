'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#FFFFFF',
          color: '#1F2937',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          border: '1px solid #E5E7EB',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '500px',
        },
        success: {
          duration: 3000,
          style: {
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #10B981',
          },
          iconTheme: {
            primary: '#10B981',
            secondary: '#FFFFFF',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #DC2626',
          },
          iconTheme: {
            primary: '#DC2626',
            secondary: '#FFFFFF',
          },
        },
        loading: {
          style: {
            background: '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #6366F1',
          },
          iconTheme: {
            primary: '#6366F1',
            secondary: '#FFFFFF',
          },
        },
      }}
    />
  );
}