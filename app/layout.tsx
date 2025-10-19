import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mind Map AI Generator',
  description: 'Create mind maps and generate optimized AI prompts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}