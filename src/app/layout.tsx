import type { Metadata, Viewport } from "next";
import "./globals.css";

import { AppTokenLogin } from "@/features/auth/app-token-login";
import { assetPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "大宜宾 AI 能力平台",
  description: "大宜宾 App 内嵌 AI 能力体验",
  icons: {
    icon: assetPath("/brand/dayibin-icon.png"),
    shortcut: assetPath("/brand/dayibin-icon.png"),
    apple: assetPath("/brand/dayibin-icon.png"),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AppTokenLogin />
        {children}
      </body>
    </html>
  );
}
