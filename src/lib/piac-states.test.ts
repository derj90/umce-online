import { describe, it, expect } from "vitest";
import {
  getAllowedTransitions,
  canTransition,
  canEdit,
  validateForSubmission,
} from "./piac-states";

describe("getAllowedTransitions", () => {
  it("docente can only send borrador to enviado", () => {
    expect(getAllowedTransitions("docente", "borrador")).toEqual(["enviado"]);
  });

  it("docente can re-send devuelto to enviado", () => {
    expect(getAllowedTransitions("docente", "devuelto")).toEqual(["enviado"]);
  });

  it("docente cannot transition from enviado", () => {
    expect(getAllowedTransitions("docente", "enviado")).toEqual([]);
  });

  it("docente cannot transition from en_revision", () => {
    expect(getAllowedTransitions("docente", "en_revision")).toEqual([]);
  });

  it("docente cannot transition from aprobado", () => {
    expect(getAllowedTransitions("docente", "aprobado")).toEqual([]);
  });

  it("DI can take review of enviado", () => {
    expect(getAllowedTransitions("di", "enviado")).toEqual(["en_revision"]);
  });

  it("DI can approve or return from en_revision", () => {
    expect(getAllowedTransitions("di", "en_revision")).toEqual([
      "aprobado",
      "devuelto",
    ]);
  });

  it("DI cannot act on borrador", () => {
    expect(getAllowedTransitions("di", "borrador")).toEqual([]);
  });

  it("coordinador can transition from any state", () => {
    expect(getAllowedTransitions("coordinador", "borrador").length).toBeGreaterThan(0);
    expect(getAllowedTransitions("coordinador", "enviado").length).toBeGreaterThan(0);
    expect(getAllowedTransitions("coordinador", "en_revision").length).toBeGreaterThan(0);
    expect(getAllowedTransitions("coordinador", "aprobado").length).toBeGreaterThan(0);
    expect(getAllowedTransitions("coordinador", "devuelto").length).toBeGreaterThan(0);
  });
});

describe("canTransition", () => {
  it("docente borrador→enviado is valid", () => {
    expect(canTransition("docente", "borrador", "enviado")).toBe(true);
  });

  it("docente borrador→aprobado is invalid", () => {
    expect(canTransition("docente", "borrador", "aprobado")).toBe(false);
  });

  it("di enviado→en_revision is valid", () => {
    expect(canTransition("di", "enviado", "en_revision")).toBe(true);
  });

  it("di en_revision→aprobado is valid", () => {
    expect(canTransition("di", "en_revision", "aprobado")).toBe(true);
  });

  it("di en_revision→devuelto is valid", () => {
    expect(canTransition("di", "en_revision", "devuelto")).toBe(true);
  });

  it("coordinador can do anything", () => {
    expect(canTransition("coordinador", "aprobado", "borrador")).toBe(true);
  });
});

describe("canEdit", () => {
  it("docente can edit borrador", () => {
    expect(canEdit("docente", "borrador")).toBe(true);
  });

  it("docente can edit devuelto", () => {
    expect(canEdit("docente", "devuelto")).toBe(true);
  });

  it("docente cannot edit enviado", () => {
    expect(canEdit("docente", "enviado")).toBe(false);
  });

  it("docente cannot edit en_revision", () => {
    expect(canEdit("docente", "en_revision")).toBe(false);
  });

  it("docente cannot edit aprobado", () => {
    expect(canEdit("docente", "aprobado")).toBe(false);
  });

  it("DI cannot edit content", () => {
    expect(canEdit("di", "enviado")).toBe(false);
    expect(canEdit("di", "en_revision")).toBe(false);
  });

  it("coordinador can always edit", () => {
    expect(canEdit("coordinador", "borrador")).toBe(true);
    expect(canEdit("coordinador", "enviado")).toBe(true);
    expect(canEdit("coordinador", "aprobado")).toBe(true);
  });
});

describe("validateForSubmission", () => {
  it("passes with 3+ evaluaciones summing 100%", () => {
    const evals = [
      { ponderacion: 30 },
      { ponderacion: 30 },
      { ponderacion: 40 },
    ];
    expect(validateForSubmission(evals)).toEqual([]);
  });

  it("fails with fewer than 3 evaluaciones", () => {
    const evals = [{ ponderacion: 50 }, { ponderacion: 50 }];
    const errors = validateForSubmission(evals);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("evaluaciones");
  });

  it("fails when ponderacion != 100", () => {
    const evals = [
      { ponderacion: 30 },
      { ponderacion: 30 },
      { ponderacion: 30 },
    ];
    const errors = validateForSubmission(evals);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("ponderacion");
  });

  it("returns both errors when both conditions fail", () => {
    const evals = [{ ponderacion: 30 }, { ponderacion: 30 }];
    const errors = validateForSubmission(evals);
    expect(errors).toHaveLength(2);
  });
});
