import type { PiacComentario, ComentarioSeccion } from "./database.types";

export const SECCION_LABELS: Record<ComentarioSeccion, string> = {
  identificacion: "Identificación",
  modalidad: "Modalidad",
  nucleo: "Núcleo",
  evaluaciones: "Evaluaciones",
  bibliografia: "Bibliografía",
  general: "General",
};

/** Map form step index (0-4) to seccion name */
export const STEP_TO_SECCION: ComentarioSeccion[] = [
  "identificacion",
  "modalidad",
  "nucleo",
  "evaluaciones",
  "bibliografia",
];

/** Filter comments by section */
export function filterBySeccion(
  comentarios: PiacComentario[],
  seccion: ComentarioSeccion,
  nucleoOrden?: number,
): PiacComentario[] {
  return comentarios.filter((c) => {
    if (c.seccion !== seccion) return false;
    if (seccion === "nucleo" && nucleoOrden !== undefined) {
      return c.nucleo_orden === nucleoOrden;
    }
    return true;
  });
}

/** Count unresolved comments per section */
export function countUnresolvedBySeccion(
  comentarios: PiacComentario[],
): Record<ComentarioSeccion, number> {
  const counts: Record<ComentarioSeccion, number> = {
    identificacion: 0,
    modalidad: 0,
    nucleo: 0,
    evaluaciones: 0,
    bibliografia: 0,
    general: 0,
  };

  for (const c of comentarios) {
    if (!c.resolved) {
      counts[c.seccion]++;
    }
  }

  return counts;
}

/** Total unresolved comments */
export function countTotalUnresolved(comentarios: PiacComentario[]): number {
  return comentarios.filter((c) => !c.resolved).length;
}

/** Sort comments: unresolved first, then by date descending */
export function sortComentarios(comentarios: PiacComentario[]): PiacComentario[] {
  return [...comentarios].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/** Format comment date for display */
export function formatComentarioDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

/** Get display label for a comment's section */
export function getSeccionLabel(
  seccion: ComentarioSeccion,
  nucleoOrden?: number | null,
): string {
  if (seccion === "nucleo" && nucleoOrden != null) {
    return `Núcleo ${nucleoOrden}`;
  }
  return SECCION_LABELS[seccion];
}
