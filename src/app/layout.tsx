import type { Metadata } from "next";
import Script from "next/script"; // <--- TAMBAHKAN IMPORT INI
import "./globals.css";

export const metadata: Metadata = {
  title: "BukuTamu SaaS",
  description: "Sistem Manajemen Pengunjung Sekolah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0C3B2E" />
      </head>
      <body className={`antialiased`}>
        {children}
        
        {/* Gunakan komponen Script dari next/script, BUKAN tag <script> biasa */}
        <Script id="service-worker-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('SW registered: ', registration);
                }, function(registrationError) {
                  console.log('SW registration failed: ', registrationError);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}