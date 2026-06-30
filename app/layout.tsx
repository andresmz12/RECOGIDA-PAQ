import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

// Display: strong, corporate grotesque for headlines (replaces Poppins)
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

// Body: engineered, professional sans for UI text (replaces Inter)
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "O'Globo Cargo — International Package Pickup",
  description:
    "Request international package pickups, track in real time, and manage operations with O'Globo Cargo.",
};

// Explicit mobile viewport + browser theme color. width=device-width with an
// initial scale of 1 keeps the layout responsive on phones; maximumScale is
// left open so users can still pinch-zoom for accessibility.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#142b45",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${archivo.variable} ${plex.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
