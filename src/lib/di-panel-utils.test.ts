import { describe, it, expect } from "vitest";
import {
  filterDiPiacs,
  countByStatus,
  getUniqueProgramas,
  getUniqueSemestres,
  type PiacForReview,
} from "./di-panel-utils";
import type { PiacStatus } from "./database.types";

function makePiac(overrides: Partial<PiacForReview> = {}): PiacForReview {
  return {
    id: "1",
    user_id: "u1",
    nombre_actividad: "Test PIAC",
    programa: "Pedagogía en Matemáticas",
    unidad_academica: "Fac. Ciencias",
    docente_responsable: "Juan Pérez",
    email_docente: "juan@umce.cl",
    semestre: "2026-1",
    tipo_docencia: "docencia",
    tipo_interaccion: "virtual",
    num_semanas: 16,
    horas_sincronicas: 2,
    horas_asincronicas: 2,
    horas_autonomas: 4,
    bibliografia_obligatoria: "",
    bibliografia_complementaria: "",
    status: "enviado",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-20T00:00:00Z",
    ...overrides,
  };
}

describe("filterDiPiacs", () => {
  const piacs: PiacForReview[] = [
    makePiac({ id: "1", status: "enviado", programa: "Matemáticas", docente_responsable: "Ana López", semestre: "2026-1" }),
    makePiac({ id: "2", status: "en_revision", programa: "Historia", docente_responsable: "Pedro Soto", semestre: "2026-1" }),
    makePiac({ id: "3", status: "aprobado", programa: "Matemáticas", docente_responsable: "Ana López", semestre: "2026-2" }),
    makePiac({ id: "4", status: "devuelto", programa: "Historia", docente_responsable: "María Ruiz", semestre: "2026-2" }),
  ];

  it("returns all when no filters", () => {
    expect(filterDiPiacs(piacs, { status: "", programa: "", docente: "", semestre: "" })).toHaveLength(4);
  });

  it("filters by status", () => {
    const result = filterDiPiacs(piacs, { status: "enviado", programa: "", docente: "", semestre: "" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by programa", () => {
    const result = filterDiPiacs(piacs, { status: "", programa: "Matemáticas", docente: "", semestre: "" });
    expect(result).toHaveLength(2);
  });

  it("filters by docente (case-insensitive partial match)", () => {
    const result = filterDiPiacs(piacs, { status: "", programa: "", docente: "ana", semestre: "" });
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.docente_responsable.toLowerCase().includes("ana"))).toBe(true);
  });

  it("filters by semestre", () => {
    const result = filterDiPiacs(piacs, { status: "", programa: "", docente: "", semestre: "2026-2" });
    expect(result).toHaveLength(2);
  });

  it("combines multiple filters", () => {
    const result = filterDiPiacs(piacs, { status: "enviado", programa: "Matemáticas", docente: "", semestre: "2026-1" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
});

describe("countByStatus", () => {
  it("counts PIACs per status", () => {
    const piacs: PiacForReview[] = [
      makePiac({ status: "enviado" }),
      makePiac({ status: "enviado" }),
      makePiac({ status: "en_revision" }),
      makePiac({ status: "aprobado" }),
    ];
    const counts = countByStatus(piacs);
    expect(counts.enviado).toBe(2);
    expect(counts.en_revision).toBe(1);
    expect(counts.aprobado).toBe(1);
    expect(counts.devuelto).toBe(0);
    expect(counts.borrador).toBe(0);
  });

  it("returns zeros for empty array", () => {
    const counts = countByStatus([]);
    expect(counts.enviado).toBe(0);
    expect(counts.en_revision).toBe(0);
  });
});

describe("getUniqueProgramas", () => {
  it("extracts unique sorted programas", () => {
    const piacs: PiacForReview[] = [
      makePiac({ programa: "Historia" }),
      makePiac({ programa: "Matemáticas" }),
      makePiac({ programa: "Historia" }),
    ];
    expect(getUniqueProgramas(piacs)).toEqual(["Historia", "Matemáticas"]);
  });

  it("filters out empty programas", () => {
    const piacs: PiacForReview[] = [
      makePiac({ programa: "" }),
      makePiac({ programa: "Historia" }),
    ];
    expect(getUniqueProgramas(piacs)).toEqual(["Historia"]);
  });
});

describe("getUniqueSemestres", () => {
  it("extracts unique sorted semestres", () => {
    const piacs: PiacForReview[] = [
      makePiac({ semestre: "2026-2" }),
      makePiac({ semestre: "2026-1" }),
      makePiac({ semestre: "2026-2" }),
    ];
    expect(getUniqueSemestres(piacs)).toEqual(["2026-1", "2026-2"]);
  });
});
