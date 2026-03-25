import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Breadcrumbs } from "@/components/breadcrumbs";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "UMCE Online",
    template: "%s | UMCE Online",
  },
  description:
    "Plataforma de gestión académica virtual — Universidad Metropolitana de Ciencias de la Educación",
  openGraph: {
    title: "UMCE Online",
    description:
      "Plataforma de gestión académica virtual — UMCE",
    url: "https://umce.online",
    siteName: "UMCE Online",
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Nav />
        <Breadcrumbs />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-[var(--color-umce-blue)] py-10 text-blue-200">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 sm:grid-cols-3">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-xs font-bold text-[var(--color-umce-blue)]">
                    U
                  </div>
                  <span className="text-base font-semibold text-white">
                    UMCE.online
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed">
                  Plataforma de gestión académica virtual de la Universidad
                  Metropolitana de Ciencias de la Educación.
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Accesos
                </h4>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <a href="/piac" className="hover:text-white transition-colors">
                      Formulario PIAC
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://virtual.umce.cl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      Moodle UMCE
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.umce.cl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      umce.cl
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Contacto
                </h4>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <a
                      href="mailto:udfv@umce.cl"
                      className="hover:text-white transition-colors"
                    >
                      udfv@umce.cl
                    </a>
                  </li>
                  <li>Av. José Pedro Alessandri 774, Ñuñoa</li>
                  <li>Santiago, Chile</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 border-t border-blue-800 pt-6 text-center text-xs text-blue-300">
              Unidad de Desarrollo y Formación Virtual (UDFV) — UMCE
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
