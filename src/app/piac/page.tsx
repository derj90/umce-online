import type { Metadata } from "next";
import { Suspense } from "react";
import { PiacForm } from "./piac-form";

export const metadata: Metadata = {
  title: "Formulario PIAC",
  description:
    "Plan Instruccional de Actividad Curricular — Formulario estructurado para diseño de cursos virtuales UMCE",
};

export default function PiacPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Formulario PIAC</h1>
        <p className="mt-2 text-gray-600">
          Plan Instruccional de Actividad Curricular. Completa el formulario
          paso a paso — la preview del curso se actualiza en tiempo real.
        </p>
      </div>

      <Suspense fallback={<div className="text-gray-500">Cargando formulario...</div>}>
        <PiacForm />
      </Suspense>
    </div>
  );
}
