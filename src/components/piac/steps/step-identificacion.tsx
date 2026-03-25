import type { PiacData } from "@/types/piac";
import { Field } from "@/components/ui/field";

export function StepIdentificacion({
  data,
  update,
  disabled,
}: {
  data: PiacData;
  update: <K extends keyof PiacData>(key: K, value: PiacData[K]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bloque 1 — Identificación</h2>
      <Field
        label="Nombre de la actividad curricular"
        value={data.nombreActividad}
        onChange={(v) => update("nombreActividad", v)}
        placeholder="Ej: Comunicación y Aprendizaje para NEE"
        disabled={disabled}
      />
      <Field
        label="Programa de postgrado"
        value={data.programa}
        onChange={(v) => update("programa", v)}
        placeholder="Ej: Magíster en Educación Especial"
        disabled={disabled}
      />
      <Field
        label="Unidad académica"
        value={data.unidadAcademica}
        onChange={(v) => update("unidadAcademica", v)}
        placeholder="Ej: Depto. Educación Diferencial"
        disabled={disabled}
      />
      <Field
        label="Docente(s) responsable(s)"
        value={data.docenteResponsable}
        onChange={(v) => update("docenteResponsable", v)}
        disabled={disabled}
      />
      <Field
        label="Email docente"
        value={data.emailDocente}
        onChange={(v) => update("emailDocente", v)}
        type="email"
        disabled={disabled}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Semestre
        </label>
        <select
          value={data.semestre}
          onChange={(e) => update("semestre", e.target.value)}
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          <option value="2026-1">1° Semestre 2026</option>
          <option value="2026-2">2° Semestre 2026</option>
          <option value="2027-1">1° Semestre 2027</option>
        </select>
      </div>
    </div>
  );
}
