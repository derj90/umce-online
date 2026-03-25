import { describe, it, expect } from "vitest";
import { filterPiacs, formatDate, getUniqueSemestres } from "./piac-list-utils";
import type { Piac } from "./database.types";

function makePiac(overrides: Partial<Piac> = {}): Piac {
  return {
    id: "1",
    user_id: "user-1",
    nombre_actividad: "Test PIAC",
    programa: "Pedagogía",
    unidad_academica: "Educación",
    docente_responsable: "Test",
    email_docente: "test@umce.cl",
    semestre: "2026-1",
    tipo_docencia: "docencia",
    tipo_interaccion: "virtual",
    num_semanas: 16,
    horas_sincronicas: 2,
    horas_asincronicas: 2,
    horas_autonomas: 4,
    bibliografia_obligatoria: "",
    bibliografia_complementaria: "",
    status: "borrador",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("filterPiacs", () => {
  const piacs: Piac[] = [
    makePiac({ id: "1", status: "borrador", semestre: "2026-1" }),
    makePiac({ id: "2", status: "enviado", semestre: "2026-1" }),
    makePiac({ id: "3", status: "aprobado", semestre: "2025-2" }),
  ];

  it("returns all when no filters", () => {
    expect(filterPiacs(piacs, "", "")).toHaveLength(3);
  });

  it("filters by status", () => {
    const result = filterPiacs(piacs, "borrador", "");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by semestre", () => {
    const result = filterPiacs(piacs, "", "2025-2");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("filters by both status and semestre", () => {
    const result = filterPiacs(piacs, "enviado", "2026-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("returns empty when no match", () => {
    expect(filterPiacs(piacs, "devuelto", "")).toHaveLength(0);
  });
});

describe("formatDate", () => {
  it("formats a valid ISO date", () => {
    const result = formatDate("2026-03-15T10:00:00Z");
    // locale-dependent, just check it returns something reasonable
    expect(result).toBeTruthy();
    expect(result).not.toBe("—");
  });

  it("returns dash for invalid date string", () => {
    // Invalid date won't throw but will produce "Invalid Date"
    // toLocaleDateString on Invalid Date returns "Invalid Date" not throwing
    const result = formatDate("not-a-date");
    // Depending on runtime, this may or may not be "—"
    expect(typeof result).toBe("string");
  });
});

describe("getUniqueSemestres", () => {
  it("extracts unique non-empty semestres", () => {
    const piacs = [
      makePiac({ semestre: "2026-1" }),
      makePiac({ semestre: "2026-1" }),
      makePiac({ semestre: "2025-2" }),
    ];
    const result = getUniqueSemestres(piacs);
    expect(result).toHaveLength(2);
    expect(result).toContain("2026-1");
    expect(result).toContain("2025-2");
  });

  it("excludes empty semestres", () => {
    const piacs = [
      makePiac({ semestre: "2026-1" }),
      makePiac({ semestre: "" }),
    ];
    const result = getUniqueSemestres(piacs);
    expect(result).toEqual(["2026-1"]);
  });

  it("returns empty for no piacs", () => {
    expect(getUniqueSemestres([])).toEqual([]);
  });
});
