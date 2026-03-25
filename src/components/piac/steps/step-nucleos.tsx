import type { PiacData, Nucleo } from "@/types/piac";
import { defaultNucleo } from "@/types/piac";
import { Field, NumberField, TextArea } from "@/components/ui/field";

export function StepNucleos({
  data,
  setData,
  disabled,
}: {
  data: PiacData;
  setData: React.Dispatch<React.SetStateAction<PiacData>>;
  disabled?: boolean;
}) {
  const addNucleo = () => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      nucleos: [
        ...prev.nucleos,
        {
          ...defaultNucleo,
          semanaInicio: prev.nucleos.length > 0
            ? prev.nucleos[prev.nucleos.length - 1].semanaFin + 1
            : 1,
          semanaFin: Math.min(
            prev.numSemanas,
            (prev.nucleos.length > 0
              ? prev.nucleos[prev.nucleos.length - 1].semanaFin
              : 0) + 4
          ),
        },
      ],
    }));
  };

  const updateNucleo = (index: number, field: keyof Nucleo, value: string | number) => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      nucleos: prev.nucleos.map((n, i) =>
        i === index ? { ...n, [field]: value } : n
      ),
    }));
  };

  const removeNucleo = (index: number) => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      nucleos: prev.nucleos.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bloque 3 — Núcleos de aprendizaje</h2>
        {!disabled && (
          <button
            onClick={addNucleo}
            className="rounded-lg bg-[var(--color-umce-blue)] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
          >
            + Agregar núcleo
          </button>
        )}
      </div>

      {data.nucleos.map((nucleo, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Núcleo {i + 1}</h3>
            {!disabled && data.nucleos.length > 1 && (
              <button
                onClick={() => removeNucleo(i)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            )}
          </div>
          <Field
            label="Nombre del núcleo"
            value={nucleo.nombre}
            onChange={(v) => updateNucleo(i, "nombre", v)}
            placeholder="Ej: Fundamentos de la comunicación aumentativa"
            disabled={disabled}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Semana inicio"
              value={nucleo.semanaInicio}
              onChange={(v) => updateNucleo(i, "semanaInicio", v)}
              min={1}
              max={data.numSemanas}
              disabled={disabled}
            />
            <NumberField
              label="Semana fin"
              value={nucleo.semanaFin}
              onChange={(v) => updateNucleo(i, "semanaFin", v)}
              min={nucleo.semanaInicio}
              max={data.numSemanas}
              disabled={disabled}
            />
          </div>
          <TextArea
            label="Resultado formativo"
            value={nucleo.resultadoFormativo}
            onChange={(v) => updateNucleo(i, "resultadoFormativo", v)}
            placeholder="Verbo en presente indicativo: Diseña, Analiza, Evalúa..."
            disabled={disabled}
          />
          <TextArea
            label="Criterios de evaluación"
            value={nucleo.criteriosEvaluacion}
            onChange={(v) => updateNucleo(i, "criteriosEvaluacion", v)}
            disabled={disabled}
          />
          <TextArea
            label="Temas / contenidos"
            value={nucleo.temas}
            onChange={(v) => updateNucleo(i, "temas", v)}
            disabled={disabled}
          />
          <TextArea
            label="Actividades sincrónicas"
            value={nucleo.actividadesSincronicas}
            onChange={(v) => updateNucleo(i, "actividadesSincronicas", v)}
            placeholder="Nombre + descripción breve"
            disabled={disabled}
          />
          <TextArea
            label="Actividades asincrónicas (foro, tarea, wiki, cuestionario)"
            value={nucleo.actividadesAsincronicas}
            onChange={(v) => updateNucleo(i, "actividadesAsincronicas", v)}
            disabled={disabled}
          />
          <TextArea
            label="Actividades autónomas (lecturas)"
            value={nucleo.actividadesAutonomas}
            onChange={(v) => updateNucleo(i, "actividadesAutonomas", v)}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}
