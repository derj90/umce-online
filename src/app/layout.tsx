import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

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
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-gray-50 py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
            <p>Unidad de Desarrollo y Formación Virtual — UMCE</p>
            <p className="mt-1">
              <a href="mailto:udfv@umce.cl" className="hover:text-blue-700">
                udfv@umce.cl
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
