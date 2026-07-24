import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

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

// Headline: modern grotesque with character for landing headlines
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-condensed",
  display: "swap",
});

// Mono: waybill labels, codes and micro-copy (landing)
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-plex",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: "O'Globo Cargo — International Package Pickup",
  description:
    "Request international package pickups, track in real time, and manage operations with O'Globo Cargo.",
  openGraph: {
    title: "O'Globo Cargo — International Package Pickup",
    description:
      "Request international package pickups, track in real time, and manage operations with O'Globo Cargo.",
    type: "website",
    siteName: "O'Globo Cargo",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c1b2e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${archivo.variable} ${plex.variable} ${grotesk.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
