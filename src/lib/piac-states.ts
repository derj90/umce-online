import type { PiacStatus, UserRol } from "./database.types";

// ─── Valid transitions per role ──────────────────────────────────────────────

const TRANSITIONS: Record<UserRol, Partial<Record<PiacStatus, PiacStatus[]>>> = {
  docente: {
    borrador: ["enviado"],
    devuelto: ["enviado"],
  },
  di: {
    enviado: ["en_revision"],
    en_revision: ["aprobado", "devuelto"],
  },
  coordinador: {
    borrador: ["enviado", "en_revision", "aprobado", "devuelto"],
    enviado: ["en_revision", "aprobado", "devuelto", "borrador"],
    en_revision: ["aprobado", "devuelto", "borrador"],
    aprobado: ["devuelto", "borrador"],
    devuelto: ["enviado", "en_revision", "aprobado", "borrador"],
  },
};

/** Returns the list of statuses that `role` can move `currentStatus` to. */
export function getAllowedTransitions(
  role: UserRol,
  currentStatus: PiacStatus,
): PiacStatus[] {
  return TRANSITIONS[role]?.[currentStatus] ?? [];
}

/** Check if a specific transition is valid for a role. */
export function canTransition(
  role: UserRol,
  from: PiacStatus,
  to: PiacStatus,
): boolean {
  return getAllowedTransitions(role, from).includes(to);
}

/** Whether the user can edit the PIAC content (not just transition status). */
export function canEdit(role: UserRol, status: PiacStatus): boolean {
  if (role === "coordinador") return true;
  if (role === "docente") return status === "borrador" || status === "devuelto";
  // DI can't edit content — only transition status
  return false;
}

// ─── Submission validation ───────────────────────────────────────────────────

export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Validates that a PIAC is ready to be submitted (borrador → enviado).
 * Returns an empty array if valid.
 */
export function validateForSubmission(evaluaciones: {
  ponderacion: number;
}[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (evaluaciones.length < 3) {
    errors.push({
      field: "evaluaciones",
      message: "Se requieren al menos 3 evaluaciones sumativas.",
    });
  }

  const totalPonderacion = evaluaciones.reduce(
    (sum, e) => sum + e.ponderacion,
    0,
  );
  if (totalPonderacion !== 100) {
    errors.push({
      field: "ponderacion",
      message: `La ponderación total debe ser 100% (actual: ${totalPonderacion}%).`,
    });
  }

  return errors;
}

// ─── Status display helpers ──────────────────────────────────────────────────

export const STATUS_LABELS: Record<PiacStatus, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  devuelto: "Devuelto",
};

export const STATUS_COLORS: Record<
  PiacStatus,
  { bg: string; text: string; dot: string }
> = {
  borrador: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  enviado: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-400" },
  en_revision: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-400",
  },
  aprobado: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-400",
  },
  devuelto: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-400" },
};

/** Label for transition buttons */
export const TRANSITION_LABELS: Record<PiacStatus, string> = {
  borrador: "Devolver a borrador",
  enviado: "Enviar para revisión",
  en_revision: "Tomar revisión",
  aprobado: "Aprobar",
  devuelto: "Devolver",
};
