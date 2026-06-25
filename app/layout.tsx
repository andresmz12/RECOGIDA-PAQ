import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
