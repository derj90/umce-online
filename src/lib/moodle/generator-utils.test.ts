import { describe, it, expect } from "vitest";
import {
  buildShortname,
  mapNucleosSections,
  buildNucleoSectionMap,
  mapEvaluacionesActivities,
  buildCoursePlan,
  DEFAULT_CATEGORY_ID,
} from "./generator-utils";
import type { PiacNucleo, PiacEvaluacion } from "../database.types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeNucleo = (overrides: Partial<PiacNucleo> = {}): PiacNucleo => ({
  id: "n1",
  piac_id: "p1",
  orden: 1,
  nombre: "Núcleo 1",
  semana_inicio: 1,
  semana_fin: 4,
  resultado_formativo: "RF1",
  criterios_evaluacion: "CE1",
  temas: "Tema A",
  actividades_sincronicas: "",
  actividades_asincronicas: "",
  actividades_autonomas: "",
  ...overrides,
});

const makeEval = (overrides: Partial<PiacEvaluacion> = {}): PiacEvaluacion => ({
  id: "e1",
  piac_id: "p1",
  nucleo_id: "n1",
  nombre: "Tarea 1",
  tipo: "tarea",
  ponderacion: 30,
  semana_entrega: 4,
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("buildShortname", () => {
  it("creates shortname from programa initials + semestre + piac prefix", () => {
    const result = buildShortname("Educación Básica", "2026-2", "abc123xyz");
    expect(result).toBe("EB-2026-2-abc123");
  });

  it("handles long programa names by truncating to 6 chars", () => {
    const result = buildShortname(
      "Licenciatura en Pedagogía en Educación Física Deportes y Recreación",
      "2026-1",
      "def456",
    );
    expect(result.split("-")[0].length).toBeLessThanOrEqual(6);
  });

  it("strips non-alpha characters from programa", () => {
    const result = buildShortname("Educ. (Básica) 2026", "2026-2", "abcdef");
    expect(result).toMatch(/^[A-Z]+-2026-2-[a-z0-9]+$/);
  });
});

describe("mapNucleosSections", () => {
  it("maps nucleos to 1-indexed sections sorted by orden", () => {
    const nucleos = [
      makeNucleo({ id: "n2", orden: 2, nombre: "Segundo" }),
      makeNucleo({ id: "n1", orden: 1, nombre: "Primero" }),
    ];
    const sections = mapNucleosSections(nucleos);
    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({ sectionNum: 1, name: "Primero" });
    expect(sections[1]).toMatchObject({ sectionNum: 2, name: "Segundo" });
  });

  it("uses fallback name when nucleo nombre is empty", () => {
    const sections = mapNucleosSections([makeNucleo({ nombre: "" })]);
    expect(sections[0].name).toBe("Núcleo 1");
  });

  it("includes resultado formativo and temas in summary", () => {
    const sections = mapNucleosSections([makeNucleo()]);
    expect(sections[0].summary).toContain("RF1");
    expect(sections[0].summary).toContain("Tema A");
    expect(sections[0].summary).toContain("Semanas 1–4");
  });
});

describe("buildNucleoSectionMap", () => {
  it("maps nucleo IDs to section numbers", () => {
    const nucleos = [
      makeNucleo({ id: "n1", orden: 1 }),
      makeNucleo({ id: "n2", orden: 2 }),
      makeNucleo({ id: "n3", orden: 3 }),
    ];
    const map = buildNucleoSectionMap(nucleos);
    expect(map.get("n1")).toBe(1);
    expect(map.get("n2")).toBe(2);
    expect(map.get("n3")).toBe(3);
  });

  it("handles out-of-order input", () => {
    const nucleos = [
      makeNucleo({ id: "n3", orden: 3 }),
      makeNucleo({ id: "n1", orden: 1 }),
    ];
    const map = buildNucleoSectionMap(nucleos);
    expect(map.get("n1")).toBe(1);
    expect(map.get("n3")).toBe(2);
  });
});

describe("mapEvaluacionesActivities", () => {
  it("maps tarea to assign type", () => {
    const map = new Map([["n1", 1]]);
    const acts = mapEvaluacionesActivities([makeEval({ tipo: "tarea" })], map);
    expect(acts[0].type).toBe("assign");
  });

  it("maps prueba to quiz type", () => {
    const map = new Map([["n1", 1]]);
    const acts = mapEvaluacionesActivities([makeEval({ tipo: "prueba" })], map);
    expect(acts[0].type).toBe("quiz");
  });

  it("maps proyecto and portfolio to assign type", () => {
    const map = new Map([["n1", 1]]);
    const proyecto = mapEvaluacionesActivities([makeEval({ tipo: "proyecto" })], map);
    const portfolio = mapEvaluacionesActivities([makeEval({ tipo: "portfolio" })], map);
    expect(proyecto[0].type).toBe("assign");
    expect(portfolio[0].type).toBe("assign");
  });

  it("assigns correct section from nucleo map", () => {
    const map = new Map([
      ["n1", 1],
      ["n2", 2],
    ]);
    const acts = mapEvaluacionesActivities(
      [makeEval({ nucleo_id: "n2" })],
      map,
    );
    expect(acts[0].sectionNum).toBe(2);
  });

  it("defaults to section 1 if nucleo_id is null", () => {
    const map = new Map([["n1", 1]]);
    const acts = mapEvaluacionesActivities(
      [makeEval({ nucleo_id: null })],
      map,
    );
    expect(acts[0].sectionNum).toBe(1);
  });

  it("preserves ponderacion as weight", () => {
    const map = new Map([["n1", 1]]);
    const acts = mapEvaluacionesActivities(
      [makeEval({ ponderacion: 40 })],
      map,
    );
    expect(acts[0].weight).toBe(40);
  });
});

describe("buildCoursePlan", () => {
  it("builds a complete course plan from PIAC data", () => {
    const nucleos = [
      makeNucleo({ id: "n1", orden: 1, nombre: "Fundamentos" }),
      makeNucleo({ id: "n2", orden: 2, nombre: "Aplicación" }),
    ];
    const evaluaciones = [
      makeEval({ nucleo_id: "n1", nombre: "Ensayo", tipo: "tarea", ponderacion: 40 }),
      makeEval({ id: "e2", nucleo_id: "n2", nombre: "Examen", tipo: "prueba", ponderacion: 60 }),
    ];

    const plan = buildCoursePlan({
      piacId: "abc123",
      nombreActividad: "Didáctica General",
      programa: "Educación Básica",
      semestre: "2026-2",
      docenteResponsable: "Prof. Test",
      nucleos,
      evaluaciones,
    });

    expect(plan.fullname).toBe("Didáctica General");
    expect(plan.shortname).toContain("EB");
    expect(plan.categoryid).toBe(DEFAULT_CATEGORY_ID);
    expect(plan.numsections).toBe(2);
    expect(plan.sections).toHaveLength(2);
    expect(plan.activities).toHaveLength(2);
    expect(plan.activities[0].type).toBe("assign");
    expect(plan.activities[1].type).toBe("quiz");
    expect(plan.summary).toContain("Prof. Test");
  });

  it("accepts custom categoryid", () => {
    const plan = buildCoursePlan({
      piacId: "x",
      nombreActividad: "Test",
      programa: "Test",
      semestre: "2026-1",
      docenteResponsable: "Test",
      nucleos: [makeNucleo()],
      evaluaciones: [],
      categoryid: 42,
    });
    expect(plan.categoryid).toBe(42);
  });
});
