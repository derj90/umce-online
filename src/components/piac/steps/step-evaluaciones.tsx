import type { PiacData, Evaluacion } from "@/types/piac";
import { defaultEvaluacion } from "@/types/piac";
import { Field, NumberField } from "@/components/ui/field";

export function StepEvaluaciones({
  data,
  setData,
  disabled,
}: {
  data: PiacData;
  setData: React.Dispatch<React.SetStateAction<PiacData>>;
  disabled?: boolean;
}) {
  const addEval = () => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      evaluaciones: [...prev.evaluaciones, { ...defaultEvaluacion }],
    }));
  };

  const updateEval = (index: number, field: keyof Evaluacion, value: string | number) => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      evaluaciones: prev.evaluaciones.map((e, i) =>
        i === index ? { ...e, [field]: value } : e
      ),
    }));
  };

  const removeEval = (index: number) => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      evaluaciones: prev.evaluaciones.filter((_, i) => i !== index),
    }));
  };

  const totalPonderacion = data.evaluaciones.reduce(
    (sum, e) => sum + e.ponderacion,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bloque 4 — Evaluaciones sumativas</h2>
        {!disabled && (
          <button
            onClick={addEval}
            className="rounded-lg bg-[var(--color-umce-blue)] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
          >
            + Agregar evaluación
          </button>
        )}
      </div>

      {data.evaluaciones.length < 3 && (
        <p className="text-sm text-amber-600">
          Mínimo 3 evaluaciones sumativas por reglamento.
        </p>
      )}

      {data.evaluaciones.map((ev, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Evaluación {i + 1}</h3>
            {!disabled && data.evaluaciones.length > 1 && (
              <button
                onClick={() => removeEval(i)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            )}
          </div>
          <Field
            label="Nombre"
            value={ev.nombre}
            onChange={(v) => updateEval(i, "nombre", v)}
            disabled={disabled}
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={ev.tipo}
                onChange={(e) => updateEval(i, "tipo", e.target.value)}
                disabled={disabled}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <option value="tarea">Tarea</option>
                <option value="prueba">Prueba</option>
                <option value="proyecto">Proyecto</option>
                <option value="portfolio">Portafolio</option>
              </select>
            </div>
            <NumberField
              label="Ponderación %"
              value={ev.ponderacion}
              onChange={(v) => updateEval(i, "ponderacion", v)}
              min={0}
              max={100}
              disabled={disabled}
            />
            <NumberField
              label="Semana entrega"
              value={ev.semanaEntrega}
              onChange={(v) => updateEval(i, "semanaEntrega", v)}
              min={1}
              max={data.numSemanas}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Núcleo al que tributa
            </label>
            <select
              value={ev.nucleoIndex}
              onChange={(e) => updateEval(i, "nucleoIndex", Number(e.target.value))}
              disabled={disabled}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {data.nucleos.map((n, ni) => (
                <option key={ni} value={ni}>
                  Núcleo {ni + 1}{n.nombre ? `: ${n.nombre}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      <div
        className={`rounded-lg p-3 text-sm font-medium ${
          totalPonderacion === 100
            ? "bg-green-50 text-green-800"
            : "bg-red-50 text-red-800"
        }`}
      >
        Total ponderación: {totalPonderacion}%{" "}
        {totalPonderacion !== 100 && "(debe sumar 100%)"}
      </div>
    </div>
  );
}
