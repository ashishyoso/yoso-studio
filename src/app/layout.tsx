import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YOSO Studio — AI Design',
  description: 'Internal AI-powered design studio for brand-consistent creative generation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
