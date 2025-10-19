import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mind Map Prompts AI Generator',
  description: 'Create mind maps and generate optimized AI prompts for code, image, video, text and much wider generation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script 
          async 
          src="https://www.googletagmanager.com/gtag/js?id=G-LX069HN2R1"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LX069HN2R1');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}