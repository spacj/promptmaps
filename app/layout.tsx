export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script 
          async 
          src="https://www.googletagmanager.com/gtag/js?id=G-LX069HN2R1"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LX069HN2R1');
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}