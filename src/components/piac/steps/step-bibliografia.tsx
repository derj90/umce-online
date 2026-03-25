import type { PiacData } from "@/types/piac";
import { TextArea } from "@/components/ui/field";

export function StepBibliografia({
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
      <h2 className="text-lg font-semibold">Bloque 5 — Bibliografía</h2>
      <TextArea
        label="Bibliografía obligatoria"
        value={data.bibliografiaObligatoria}
        onChange={(v) => update("bibliografiaObligatoria", v)}
        placeholder="Formato APA. Una referencia por línea."
        rows={6}
        disabled={disabled}
      />
      <TextArea
        label="Bibliografía complementaria"
        value={data.bibliografiaComplementaria}
        onChange={(v) => update("bibliografiaComplementaria", v)}
        placeholder="Formato APA. Una referencia por línea."
        rows={4}
        disabled={disabled}
      />
    </div>
  );
}
