import type { PiacData } from "@/types/piac";

export function PiacPreview({ data, sct }: { data: PiacData; sct: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Course header */}
      <div className="bg-[var(--color-umce-blue)] px-5 py-4 text-white">
        <h3 className="font-bold">
          {data.nombreActividad || "Nombre de la actividad curricular"}
        </h3>
        <p className="mt-1 text-sm text-blue-200">
          {data.programa || "Programa"} · {data.semestre} · {sct} SCT
        </p>
        {data.docenteResponsable && (
          <p className="mt-1 text-sm text-blue-300">
            {data.docenteResponsable}
          </p>
        )}
      </div>

      {/* Course structure */}
      <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
        {data.nucleos.map((nucleo, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                {i + 1}
              </span>
              <h4 className="font-semibold text-gray-900">
                {nucleo.nombre || `Núcleo ${i + 1}`}
              </h4>
            </div>
            <p className="ml-8 mt-1 text-xs text-gray-500">
              Semanas {nucleo.semanaInicio}–{nucleo.semanaFin}
            </p>

            {nucleo.resultadoFormativo && (
              <p className="ml-8 mt-2 text-sm text-gray-700 italic">
                RF: {nucleo.resultadoFormativo}
              </p>
            )}

            <div className="ml-8 mt-3 space-y-1.5">
              {nucleo.actividadesSincronicas && (
                <div className="flex items-start gap-2 text-sm">
                  <span>🎥</span>
                  <span className="text-gray-700">
                    {nucleo.actividadesSincronicas}
                  </span>
                </div>
              )}
              {nucleo.actividadesAsincronicas && (
                <div className="flex items-start gap-2 text-sm">
                  <span>💬</span>
                  <span className="text-gray-700">
                    {nucleo.actividadesAsincronicas}
                  </span>
                </div>
              )}
              {nucleo.actividadesAutonomas && (
                <div className="flex items-start gap-2 text-sm">
                  <span>📚</span>
                  <span className="text-gray-700">
                    {nucleo.actividadesAutonomas}
                  </span>
                </div>
              )}
            </div>

            {/* Evaluaciones de este núcleo */}
            {data.evaluaciones
              .filter((e) => e.nucleoIndex === i && e.nombre)
              .map((ev, ei) => (
                <div
                  key={ei}
                  className="ml-8 mt-2 flex items-start gap-2 text-sm"
                >
                  <span>⭐</span>
                  <span className="text-gray-700">
                    {ev.nombre} ({ev.ponderacion}%) — Semana {ev.semanaEntrega}
                  </span>
                </div>
              ))}
          </div>
        ))}

        {/* Bibliografía */}
        {(data.bibliografiaObligatoria || data.bibliografiaComplementaria) && (
          <div className="p-4">
            <h4 className="font-semibold text-gray-900">📖 Bibliografía</h4>
            {data.bibliografiaObligatoria && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Obligatoria
                </p>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                  {data.bibliografiaObligatoria}
                </p>
              </div>
            )}
            {data.bibliografiaComplementaria && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Complementaria
                </p>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                  {data.bibliografiaComplementaria}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
