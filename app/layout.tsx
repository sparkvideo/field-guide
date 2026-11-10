import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { VerseSheetProvider } from "@/components/VerseSheet";
import { APP_TITLE } from "@/lib/config";
import "@fontsource/spectral/latin-500.css";
import "@fontsource/spectral/latin-500-italic.css";
import "@fontsource/spectral/latin-700.css";
import "@fontsource/spectral/latin-700-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: "Verses and talking points for live conversations.",
  manifest: "/manifest.json",
  applicationName: "Apologetics Field Guide",
  appleWebApp: { capable: true, title: "Apologetics Field Guide", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon.png", sizes: "48x48", type: "image/png" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  },
  formatDetection: { telephone: false },
  other: { "apple-mobile-web-app-capable": "yes", "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e1210",
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
