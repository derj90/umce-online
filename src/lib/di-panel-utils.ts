import type { Piac, PiacStatus } from "./database.types";

/** PIAC with extra display fields for the DI panel. */
export type PiacForReview = Piac & {
  docente_email?: string;
};

/** Statuses visible to DI reviewers. */
export const DI_VISIBLE_STATUSES: PiacStatus[] = [
  "enviado",
  "en_revision",
  "aprobado",
  "devuelto",
];

/** Filter PIACs by status, programa, docente name, and semestre. */
export function filterDiPiacs(
  piacs: PiacForReview[],
  filters: {
    status: "" | PiacStatus;
    programa: string;
    docente: string;
    semestre: string;
  },
): PiacForReview[] {
  return piacs.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.programa && p.programa !== filters.programa) return false;
    if (
      filters.docente &&
      !p.docente_responsable
        .toLowerCase()
        .includes(filters.docente.toLowerCase())
    )
      return false;
    if (filters.semestre && p.semestre !== filters.semestre) return false;
    return true;
  });
}

/** Count PIACs per status. */
export function countByStatus(
  piacs: PiacForReview[],
): Record<PiacStatus, number> {
  const counts: Record<PiacStatus, number> = {
    borrador: 0,
    enviado: 0,
    en_revision: 0,
    aprobado: 0,
    devuelto: 0,
  };
  for (const p of piacs) {
    counts[p.status]++;
  }
  return counts;
}

/** Extract unique non-empty programa values. */
export function getUniqueProgramas(piacs: PiacForReview[]): string[] {
  return [...new Set(piacs.map((p) => p.programa).filter(Boolean))].sort();
}

/** Extract unique non-empty semestre values. */
export function getUniqueSemestres(piacs: PiacForReview[]): string[] {
  return [...new Set(piacs.map((p) => p.semestre).filter(Boolean))].sort();
}
