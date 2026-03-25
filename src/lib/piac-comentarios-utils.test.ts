import { describe, it, expect } from "vitest";
import type { PiacComentario } from "./database.types";
import {
  filterBySeccion,
  countUnresolvedBySeccion,
  countTotalUnresolved,
  sortComentarios,
  formatComentarioDate,
  getSeccionLabel,
  STEP_TO_SECCION,
} from "./piac-comentarios-utils";

function makeComentario(
  overrides: Partial<PiacComentario> = {},
): PiacComentario {
  return {
    id: "c1",
    piac_id: "p1",
    user_id: "u1",
    seccion: "identificacion",
    nucleo_orden: null,
    texto: "Revisar nombre",
    resolved: false,
    resolved_by: null,
    resolved_at: null,
    created_at: "2026-03-25T10:00:00Z",
    ...overrides,
  };
}

describe("filterBySeccion", () => {
  const comentarios: PiacComentario[] = [
    makeComentario({ id: "c1", seccion: "identificacion" }),
    makeComentario({ id: "c2", seccion: "nucleo", nucleo_orden: 1 }),
    makeComentario({ id: "c3", seccion: "nucleo", nucleo_orden: 2 }),
    makeComentario({ id: "c4", seccion: "evaluaciones" }),
  ];

  it("filters by section", () => {
    expect(filterBySeccion(comentarios, "identificacion")).toHaveLength(1);
    expect(filterBySeccion(comentarios, "evaluaciones")).toHaveLength(1);
    expect(filterBySeccion(comentarios, "bibliografia")).toHaveLength(0);
  });

  it("filters nucleo by orden", () => {
    expect(filterBySeccion(comentarios, "nucleo", 1)).toHaveLength(1);
    expect(filterBySeccion(comentarios, "nucleo", 2)).toHaveLength(1);
    expect(filterBySeccion(comentarios, "nucleo", 3)).toHaveLength(0);
  });

  it("returns all nucleo comments when no orden specified", () => {
    expect(filterBySeccion(comentarios, "nucleo")).toHaveLength(2);
  });
});

describe("countUnresolvedBySeccion", () => {
  it("counts unresolved per section", () => {
    const comentarios: PiacComentario[] = [
      makeComentario({ seccion: "identificacion", resolved: false }),
      makeComentario({ seccion: "identificacion", resolved: true }),
      makeComentario({ seccion: "nucleo", resolved: false }),
      makeComentario({ seccion: "evaluaciones", resolved: false }),
    ];
    const counts = countUnresolvedBySeccion(comentarios);
    expect(counts.identificacion).toBe(1);
    expect(counts.nucleo).toBe(1);
    expect(counts.evaluaciones).toBe(1);
    expect(counts.modalidad).toBe(0);
    expect(counts.bibliografia).toBe(0);
    expect(counts.general).toBe(0);
  });

  it("returns zeros for empty array", () => {
    const counts = countUnresolvedBySeccion([]);
    expect(counts.identificacion).toBe(0);
  });
});

describe("countTotalUnresolved", () => {
  it("counts total unresolved", () => {
    const comentarios: PiacComentario[] = [
      makeComentario({ resolved: false }),
      makeComentario({ resolved: true }),
      makeComentario({ resolved: false }),
    ];
    expect(countTotalUnresolved(comentarios)).toBe(2);
  });

  it("returns 0 for empty array", () => {
    expect(countTotalUnresolved([])).toBe(0);
  });
});

describe("sortComentarios", () => {
  it("puts unresolved first", () => {
    const comentarios: PiacComentario[] = [
      makeComentario({ id: "c1", resolved: true, created_at: "2026-03-25T12:00:00Z" }),
      makeComentario({ id: "c2", resolved: false, created_at: "2026-03-25T10:00:00Z" }),
    ];
    const sorted = sortComentarios(comentarios);
    expect(sorted[0].id).toBe("c2");
    expect(sorted[1].id).toBe("c1");
  });

  it("sorts by date descending within same resolved status", () => {
    const comentarios: PiacComentario[] = [
      makeComentario({ id: "c1", resolved: false, created_at: "2026-03-25T08:00:00Z" }),
      makeComentario({ id: "c2", resolved: false, created_at: "2026-03-25T12:00:00Z" }),
      makeComentario({ id: "c3", resolved: false, created_at: "2026-03-25T10:00:00Z" }),
    ];
    const sorted = sortComentarios(comentarios);
    expect(sorted.map((c) => c.id)).toEqual(["c2", "c3", "c1"]);
  });

  it("does not mutate original array", () => {
    const comentarios: PiacComentario[] = [
      makeComentario({ id: "c1" }),
      makeComentario({ id: "c2" }),
    ];
    const sorted = sortComentarios(comentarios);
    expect(sorted).not.toBe(comentarios);
  });
});

describe("formatComentarioDate", () => {
  it("formats ISO date to es-CL locale", () => {
    const result = formatComentarioDate("2026-03-25T10:30:00Z");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("returns a string on invalid date", () => {
    const result = formatComentarioDate("not-a-date");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("getSeccionLabel", () => {
  it("returns label for standard section", () => {
    expect(getSeccionLabel("identificacion")).toBe("Identificación");
    expect(getSeccionLabel("evaluaciones")).toBe("Evaluaciones");
  });

  it("returns nucleo label with orden", () => {
    expect(getSeccionLabel("nucleo", 2)).toBe("Núcleo 2");
  });

  it("returns generic nucleo label without orden", () => {
    expect(getSeccionLabel("nucleo")).toBe("Núcleo");
  });
});

describe("STEP_TO_SECCION", () => {
  it("maps 5 steps to sections", () => {
    expect(STEP_TO_SECCION).toHaveLength(5);
    expect(STEP_TO_SECCION[0]).toBe("identificacion");
    expect(STEP_TO_SECCION[4]).toBe("bibliografia");
  });
});
