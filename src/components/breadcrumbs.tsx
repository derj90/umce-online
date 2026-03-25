"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  piac: "PIAC",
  login: "Ingresar",
  registro: "Registro",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-gray-100 bg-gray-50"
    >
      <div className="mx-auto max-w-6xl px-4 py-2">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Inicio
            </Link>
          </li>
          {segments.map((segment, i) => {
            const href = "/" + segments.slice(0, i + 1).join("/");
            const isLast = i === segments.length - 1;
            const label = labels[segment] ?? decodeURIComponent(segment);

            return (
              <li key={href} className="flex items-center gap-1.5">
                <span className="text-gray-300" aria-hidden="true">
                  /
                </span>
                {isLast ? (
                  <span className="font-medium text-gray-900">{label}</span>
                ) : (
                  <Link
                    href={href}
                    className="hover:text-gray-900 transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
