/**
 * Pure mapping functions for PIAC → Moodle course generation.
 * No side effects — safe to test without mocking.
 */

import type { PiacNucleo, PiacEvaluacion, TipoEvaluacion } from "../database.types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MoodleActivityType = "assign" | "quiz";

export type MoodleSectionPlan = {
  sectionNum: number;
  name: string;
  summary: string;
};

export type MoodleActivityPlan = {
  sectionNum: number;
  name: string;
  type: MoodleActivityType;
  weight: number;
};

export type MoodleCoursePlan = {
  fullname: string;
  shortname: string;
  categoryid: number;
  numsections: number;
  summary: string;
  sections: MoodleSectionPlan[];
  activities: MoodleActivityPlan[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

/** Default Moodle category for generated courses. */
export const DEFAULT_CATEGORY_ID = 1;

/** Maps PIAC evaluation types to Moodle activity module types. */
const TIPO_TO_MODULE: Record<TipoEvaluacion, MoodleActivityType> = {
  tarea: "assign",
  prueba: "quiz",
  proyecto: "assign",
  portfolio: "assign",
};

// ─── Pure mapping functions ──────────────────────────────────────────────────

/** Generate a unique shortname for the course. */
export function buildShortname(
  programa: string,
  semestre: string,
  piacId: string,
): string {
  const prefix = programa
    .replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, "")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
    .slice(0, 6);

  const suffix = piacId.slice(0, 6);
  return `${prefix}-${semestre}-${suffix}`;
}

/** Map PIAC núcleos to Moodle section plans. Sections are 1-indexed (0 = general). */
export function mapNucleosSections(
  nucleos: PiacNucleo[],
): MoodleSectionPlan[] {
  return nucleos
    .sort((a, b) => a.orden - b.orden)
    .map((nucleo, idx) => ({
      sectionNum: idx + 1,
      name: nucleo.nombre || `Núcleo ${idx + 1}`,
      summary: [
        nucleo.resultado_formativo &&
          `<p><strong>Resultado formativo:</strong> ${nucleo.resultado_formativo}</p>`,
        nucleo.temas && `<p><strong>Temas:</strong> ${nucleo.temas}</p>`,
        `<p>Semanas ${nucleo.semana_inicio}–${nucleo.semana_fin}</p>`,
      ]
        .filter(Boolean)
        .join("\n"),
    }));
}

/** Build a lookup from nucleo DB id → sectionNum. */
export function buildNucleoSectionMap(
  nucleos: PiacNucleo[],
): Map<string, number> {
  const sorted = [...nucleos].sort((a, b) => a.orden - b.orden);
  const map = new Map<string, number>();
  sorted.forEach((n, idx) => map.set(n.id, idx + 1));
  return map;
}

/** Map PIAC evaluaciones to Moodle activity plans. */
export function mapEvaluacionesActivities(
  evaluaciones: PiacEvaluacion[],
  nucleoSectionMap: Map<string, number>,
): MoodleActivityPlan[] {
  return evaluaciones.map((ev) => ({
    sectionNum: ev.nucleo_id ? (nucleoSectionMap.get(ev.nucleo_id) ?? 1) : 1,
    name: ev.nombre || "Evaluación",
    type: TIPO_TO_MODULE[ev.tipo] ?? "assign",
    weight: ev.ponderacion,
  }));
}

/** Build the full course plan from PIAC data + relations. */
export function buildCoursePlan(params: {
  piacId: string;
  nombreActividad: string;
  programa: string;
  semestre: string;
  docenteResponsable: string;
  nucleos: PiacNucleo[];
  evaluaciones: PiacEvaluacion[];
  categoryid?: number;
}): MoodleCoursePlan {
  const sections = mapNucleosSections(params.nucleos);
  const nucleoSectionMap = buildNucleoSectionMap(params.nucleos);
  const activities = mapEvaluacionesActivities(
    params.evaluaciones,
    nucleoSectionMap,
  );

  return {
    fullname: params.nombreActividad,
    shortname: buildShortname(
      params.programa,
      params.semestre,
      params.piacId,
    ),
    categoryid: params.categoryid ?? DEFAULT_CATEGORY_ID,
    numsections: sections.length,
    summary: `Curso generado desde PIAC. Docente: ${params.docenteResponsable}. Programa: ${params.programa}.`,
    sections,
    activities,
  };
}
