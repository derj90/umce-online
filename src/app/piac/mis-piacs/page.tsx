import type { Metadata } from "next";
import { Suspense } from "react";
import { PiacList } from "./piac-list";

export const metadata: Metadata = {
  title: "Mis PIACs",
  description: "Listado de PIACs del docente",
};

export default function MisPiacsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis PIACs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona tus Planes Integrales de Actividad Curricular.
          </p>
        </div>
        <a
          href="/piac"
          className="rounded-lg bg-[var(--color-umce-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-umce-blue)]/90"
        >
          Nuevo PIAC
        </a>
      </div>
      <Suspense
        fallback={<div className="text-sm text-gray-500">Cargando...</div>}
      >
        <PiacList />
      </Suspense>
    </div>
  );
}
