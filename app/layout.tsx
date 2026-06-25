import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "O'Globo Cargo - Solicitud de Recogida",
  description: "Plataforma de solicitud de recogida de paquetes internacionales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
