import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

/* Las dos tipografías del Club: Inter para leer y Space Grotesk para los títulos.
   Las mismas que el panel y la Bóveda. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/**
 * Lo que se ve al compartir el enlace (WhatsApp, Telegram, iMessage). El icono y la
 * imagen de previsualización salen de `icon.png`, `apple-icon.png` y
 * `opengraph-image.png`, que están en esta misma carpeta: Next los toma por su nombre.
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://tareas.clubdemonetizacion.com"),
  applicationName: "Tareas del Club",
  title: {
    default: "Tareas — Club de Monetización",
    template: "%s — Tareas del Club",
  },
  description: "Las tareas del equipo del Club de Monetización.",
  openGraph: {
    title: "Tareas — Club de Monetización",
    description: "Las tareas del equipo del Club de Monetización.",
    siteName: "Club de Monetización",
    url: "https://tareas.clubdemonetizacion.com",
    locale: "es_MX",
    type: "website",
  },
  // Es una herramienta interna del equipo: no tiene por qué salir en buscadores.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      {/* El azul hondo del Club, el mismo del panel y la Bóveda. */}
      <body
        className="min-h-full flex flex-col"
        style={{ background: "#05091a" }}
      >
        {children}
      </body>
    </html>
  );
}
