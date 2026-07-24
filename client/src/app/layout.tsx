
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import AppBootLoader from "@/components/AppBootLoader";
import BackendKeepAlive from "@/components/BackendKeepAlive";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dpwood.store"),
  title: {
    default: "DPWOOD Store - Đồ Gia Dụng Nhà Bếp",
    template: "%s | DPWOOD Store",
  },
  description:
    "Mua sắm nồi chảo, dụng cụ bếp, bộ bàn ăn, hộp bảo quản và đồ gia dụng tiện ích tại DPWOOD.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "DPWOOD Store - Đồ Gia Dụng Nhà Bếp",
    description:
      "Nồi chảo, dụng cụ bếp, bộ bàn ăn, hộp bảo quản và sản phẩm tiện ích cho căn bếp hiện đại.",
    url: "https://dpwood.store",
    siteName: "DPWOOD",
    images: [
      {
        url: "/dpwood-kitchen-social.png",
        width: 1200,
        height: 630,
        alt: "Đồ gia dụng nhà bếp tại DPWOOD Store",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DPWOOD Store - Đồ Gia Dụng Nhà Bếp",
    description:
      "Nồi chảo, dụng cụ bếp, bộ bàn ăn, hộp bảo quản và sản phẩm tiện ích cho căn bếp hiện đại.",
    images: ["/dpwood-kitchen-social.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="dpwood-ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}',{send_page_view:false});`}
            </Script>
          </>
        ) : null}
        <AppBootLoader />
        <BackendKeepAlive />
        <Providers>
          <AnalyticsTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
