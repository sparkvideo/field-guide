import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { VerseSheetProvider } from "@/components/VerseSheet";
import { APP_TITLE } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: "Verses and talking points for live conversations.",
  manifest: "/manifest.json",
  applicationName: "Field Guide",
  appleWebApp: { capable: true, title: "Field Guide", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/favicon.png", apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
  other: { "apple-mobile-web-app-capable": "yes", "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0d10",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body>
        <VerseSheetProvider>{children}</VerseSheetProvider>
        <AppShell />
      </body>
    </html>
  );
}
