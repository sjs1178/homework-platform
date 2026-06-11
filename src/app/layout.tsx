import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "kiddoloop",
  description: "아이가 스스로 만드는 숙제 루틴",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/appicon-180.png", sizes: "180x180" }],
    shortcut: "/favicon-32.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "kiddoloop",
  },
  openGraph: {
    title: "kiddoloop",
    description: "아이가 스스로 만드는 숙제 루틴",
    siteName: "kiddoloop",
    locale: "ko_KR",
    type: "website",
  },
  other: {
    "google-adsense-account": "ca-pub-6623044023673047",
  },
};

export const viewport: Viewport = {
  themeColor: "#16A34A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6623044023673047"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
