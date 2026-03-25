import type { PiacData, Nucleo, Evaluacion } from "@/types/piac";

/** Labels for tipoDocencia */
const TIPO_DOCENCIA_LABEL: Record<string, string> = {
  docencia: "Docencia",
  "co-docencia": "Co-docencia",
  colegiada: "Colegiada",
  mixta: "Mixta",
};

/** Labels for tipoInteraccion */
const TIPO_INTERACCION_LABEL: Record<string, string> = {
  virtual: "Virtual",
  semipresencial: "Semipresencial",
};

/** Labels for evaluation types */
const TIPO_EVALUACION_LABEL: Record<string, string> = {
  tarea: "Tarea",
  prueba: "Prueba",
  proyecto: "Proyecto",
  portfolio: "Portafolio",
};

export function tipoDocenciaLabel(tipo: string): string {
  return TIPO_DOCENCIA_LABEL[tipo] ?? tipo;
}

export function tipoInteraccionLabel(tipo: string): string {
  return TIPO_INTERACCION_LABEL[tipo] ?? tipo;
}

export function tipoEvaluacionLabel(tipo: string): string {
  return TIPO_EVALUACION_LABEL[tipo] ?? tipo;
}

export function computeSct(data: PiacData): number {
  return Math.round(
    (data.horasSincronicas + data.horasAsincronicas + data.horasAutonomas) *
      data.numSemanas /
      27
  );
}

export function buildIdentificacionRows(data: PiacData): string[][] {
  const sct = computeSct(data);
  return [
    ["Actividad Curricular", data.nombreActividad || "—"],
    ["Programa", data.programa || "—"],
    ["Unidad Académica", data.unidadAcademica || "—"],
    ["Docente Responsable", data.docenteResponsable || "—"],
    ["Email Docente", data.emailDocente || "—"],
    ["Semestre", data.semestre || "—"],
    ["Tipo de Docencia", tipoDocenciaLabel(data.tipoDocencia)],
    ["Tipo de Interacción", tipoInteraccionLabel(data.tipoInteraccion)],
    ["Semanas", String(data.numSemanas)],
    [
      "Horas Semanales",
      `Sincrónicas: ${data.horasSincronicas} · Asincrónicas: ${data.horasAsincronicas} · Autónomas: ${data.horasAutonomas}`,
    ],
    ["SCT", String(sct)],
  ];
}

export function buildNucleoRows(nucleo: Nucleo, index: number): string[][] {
  return [
    ["Nombre", nucleo.nombre || `Núcleo ${index + 1}`],
    ["Semanas", `${nucleo.semanaInicio} – ${nucleo.semanaFin}`],
    ["Resultado Formativo", nucleo.resultadoFormativo || "—"],
    ["Criterios de Evaluación", nucleo.criteriosEvaluacion || "—"],
    ["Temas", nucleo.temas || "—"],
    ["Actividades Sincrónicas", nucleo.actividadesSincronicas || "—"],
    ["Actividades Asincrónicas", nucleo.actividadesAsincronicas || "—"],
    ["Actividades Autónomas", nucleo.actividadesAutonomas || "—"],
  ];
}

export function buildEvaluacionesTableData(
  evaluaciones: Evaluacion[],
  nucleos: Nucleo[]
): string[][] {
  return evaluaciones.map((ev) => [
    ev.nombre || "—",
    tipoEvaluacionLabel(ev.tipo),
    nucleos[ev.nucleoIndex]?.nombre || `Núcleo ${ev.nucleoIndex + 1}`,
    `${ev.ponderacion}%`,
    `Semana ${ev.semanaEntrega}`,
  ]);
}

export function buildPdfFilename(data: PiacData): string {
  const clean = (s: string) =>
    s
      .trim()
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 40);
  const programa = clean(data.programa) || "Programa";
  const actividad = clean(data.nombreActividad) || "Actividad";
  const semestre = data.semestre.replace(/\s+/g, "_") || "Semestre";
  return `PIAC_${programa}_${actividad}_${semestre}.pdf`;
}
