import type { PiacData } from "@/types/piac";
import { NumberField } from "@/components/ui/field";

export function StepModalidad({
  data,
  update,
  sct,
  disabled,
}: {
  data: PiacData;
  update: <K extends keyof PiacData>(key: K, value: PiacData[K]) => void;
  sct: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Bloque 2 — Modalidad y distribución temporal
      </h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo de docencia
        </label>
        <select
          value={data.tipoDocencia}
          onChange={(e) => update("tipoDocencia", e.target.value)}
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          <option value="docencia">Docencia</option>
          <option value="co-docencia">Co-docencia</option>
          <option value="colegiada">Colegiada</option>
          <option value="mixta">Mixta</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo de interacción
        </label>
        <select
          value={data.tipoInteraccion}
          onChange={(e) => update("tipoInteraccion", e.target.value)}
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          <option value="virtual">Virtual</option>
          <option value="semipresencial">Semipresencial</option>
        </select>
      </div>
      <NumberField
        label="Número de semanas"
        value={data.numSemanas}
        onChange={(v) => update("numSemanas", v)}
        min={4}
        max={20}
        disabled={disabled}
      />
      <div className="grid grid-cols-3 gap-3">
        <NumberField
          label="Hrs sincrónicas/sem"
          value={data.horasSincronicas}
          onChange={(v) => update("horasSincronicas", v)}
          min={0}
          max={20}
          disabled={disabled}
        />
        <NumberField
          label="Hrs asincrónicas/sem"
          value={data.horasAsincronicas}
          onChange={(v) => update("horasAsincronicas", v)}
          min={0}
          max={20}
          disabled={disabled}
        />
        <NumberField
          label="Hrs autónomas/sem"
          value={data.horasAutonomas}
          onChange={(v) => update("horasAutonomas", v)}
          min={0}
          max={20}
          disabled={disabled}
        />
      </div>
      <div className="rounded-lg bg-blue-50 p-4 text-sm">
        <p className="font-medium text-blue-900">Cálculo SCT automático</p>
        <p className="mt-1 text-blue-700">
          {data.horasSincronicas + data.horasAsincronicas + data.horasAutonomas}{" "}
          hrs/semana × {data.numSemanas} semanas ={" "}
          {(data.horasSincronicas + data.horasAsincronicas + data.horasAutonomas) * data.numSemanas}{" "}
          hrs totales ÷ 27 = <strong>{sct} SCT</strong>
        </p>
      </div>
    </div>
  );
}
