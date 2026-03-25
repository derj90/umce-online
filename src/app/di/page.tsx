import type { Metadata } from "next";
import { Suspense } from "react";
import { DiPanel } from "./di-panel";

export const metadata: Metadata = {
  title: "Panel DI — Revisión de PIACs",
  description: "Dashboard de revisión de PIACs para Diseñadores Instruccionales",
};

export default function DiPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Panel DI</h1>
        <p className="mt-1 text-sm text-gray-600">
          Revisión de Planes Integrales de Actividad Curricular.
        </p>
      </div>
      <Suspense
        fallback={<div className="text-sm text-gray-500">Cargando...</div>}
      >
        <DiPanel />
      </Suspense>
    </div>
  );
}
