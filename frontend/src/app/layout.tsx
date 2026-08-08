import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'SQAUT — AI-Powered Code Review Assistant',
  description: 'Upload source code, run AI-powered reviews, explore files, and chat with an AI assistant about your codebase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a2e',
                color: '#f0f0f5',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#1a1a2e' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
