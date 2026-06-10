import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './lib/auth-context';
import { AppFrame } from './ui/app-frame';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontDisplay = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: 'Farmhouse',
  description: 'Admin panel for Farmhouse backend',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="app-body">
        <AuthProvider>
          <AppFrame>{children}</AppFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
