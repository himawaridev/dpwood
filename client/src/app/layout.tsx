
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import AppBootLoader from "@/components/AppBootLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DPWOOD Store - Nội Thất Gỗ Cao Cấp",
    template: "%s | DPWOOD Store",
  },
  description:
    "Cửa hàng nội thất và các sản phẩm từ gỗ cao cấp. Thiết kế sang trọng, chất lượng bền bỉ.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "DPWOOD Store - Nội Thất Gỗ Cao Cấp",
    description:
      "Cửa hàng nội thất và các sản phẩm từ gỗ cao cấp. Thiết kế sang trọng, chất lượng bền bỉ.",
    url: "https://dpwood.store",
    siteName: "DPWOOD",
    images: [
      {
        url: "https://dpwood.store/linkbanner.png",
        width: 1200,
        height: 630,
        alt: "DPWOOD Store - Nội Thất Gỗ Cao Cấp",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DPWOOD Store - Nội Thất Gỗ Cao Cấp",
    description:
      "Cửa hàng nội thất và các sản phẩm từ gỗ cao cấp. Thiết kế sang trọng, chất lượng bền bỉ.",
    images: ["https://dpwood.store/linkbanner.png"],
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
        <AppBootLoader />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
