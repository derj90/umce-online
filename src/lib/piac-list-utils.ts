import type { Piac, PiacStatus } from "./database.types";

/** Filter PIACs by status and semestre. */
export function filterPiacs(
  piacs: Piac[],
  filterStatus: "" | PiacStatus,
  filterSemestre: string,
): Piac[] {
  return piacs.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterSemestre && p.semestre !== filterSemestre) return false;
    return true;
  });
}

/** Format an ISO date string for display. */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/** Extract unique non-empty semestre values from PIACs. */
export function getUniqueSemestres(piacs: Piac[]): string[] {
  return [...new Set(piacs.map((p) => p.semestre).filter(Boolean))];
}
