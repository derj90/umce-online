import { describe, it, expect } from "vitest";
import {
  tipoDocenciaLabel,
  tipoInteraccionLabel,
  tipoEvaluacionLabel,
  computeSct,
  buildIdentificacionRows,
  buildNucleoRows,
  buildEvaluacionesTableData,
  buildPdfFilename,
} from "./piac-pdf-utils";
import type { PiacData, Nucleo, Evaluacion } from "@/types/piac";
import { initialPiacData, defaultNucleo, defaultEvaluacion } from "@/types/piac";

const sampleData: PiacData = {
  ...initialPiacData,
  nombreActividad: "Didáctica de la Matemática",
  programa: "Pedagogía en Matemática",
  unidadAcademica: "Facultad de Ciencias",
  docenteResponsable: "María González",
  emailDocente: "maria.gonzalez@umce.cl",
  semestre: "2026-2",
  tipoDocencia: "docencia",
  tipoInteraccion: "virtual",
  numSemanas: 16,
  horasSincronicas: 3,
  horasAsincronicas: 3,
  horasAutonomas: 4,
  nucleos: [
    {
      ...defaultNucleo,
      nombre: "Fundamentos",
      semanaInicio: 1,
      semanaFin: 4,
      resultadoFormativo: "Comprender fundamentos",
      criteriosEvaluacion: "Criterio 1",
      temas: "Tema A",
      actividadesSincronicas: "Clase expositiva",
      actividadesAsincronicas: "Foro",
      actividadesAutonomas: "Lectura",
    },
  ],
  evaluaciones: [
    {
      nombre: "Ensayo 1",
      tipo: "tarea",
      nucleoIndex: 0,
      ponderacion: 40,
      semanaEntrega: 4,
    },
    {
      nombre: "Prueba parcial",
      tipo: "prueba",
      nucleoIndex: 0,
      ponderacion: 60,
      semanaEntrega: 8,
    },
  ],
  bibliografiaObligatoria: "Libro A",
  bibliografiaComplementaria: "Libro B",
};

describe("tipoDocenciaLabel", () => {
  it("returns known label", () => {
    expect(tipoDocenciaLabel("docencia")).toBe("Docencia");
    expect(tipoDocenciaLabel("practica")).toBe("Práctica");
  });
  it("returns raw value for unknown type", () => {
    expect(tipoDocenciaLabel("unknown")).toBe("unknown");
  });
});

describe("tipoInteraccionLabel", () => {
  it("returns known label", () => {
    expect(tipoInteraccionLabel("virtual")).toBe("Virtual");
    expect(tipoInteraccionLabel("hibrida")).toBe("Híbrida");
  });
});

describe("tipoEvaluacionLabel", () => {
  it("returns known label", () => {
    expect(tipoEvaluacionLabel("tarea")).toBe("Tarea");
    expect(tipoEvaluacionLabel("portfolio")).toBe("Portafolio");
  });
});

describe("computeSct", () => {
  it("computes SCT correctly", () => {
    // (3+3+4)*16/27 = 160/27 ≈ 5.93 → 6
    expect(computeSct(sampleData)).toBe(6);
  });
  it("rounds to nearest integer", () => {
    const d = { ...sampleData, horasSincronicas: 1, horasAsincronicas: 1, horasAutonomas: 1, numSemanas: 10 };
    // (1+1+1)*10/27 = 30/27 ≈ 1.11 → 1
    expect(computeSct(d)).toBe(1);
  });
});

describe("buildIdentificacionRows", () => {
  it("returns correct number of rows", () => {
    const rows = buildIdentificacionRows(sampleData);
    expect(rows).toHaveLength(11);
  });
  it("includes activity name", () => {
    const rows = buildIdentificacionRows(sampleData);
    expect(rows[0]).toEqual(["Actividad Curricular", "Didáctica de la Matemática"]);
  });
  it("uses dash for empty fields", () => {
    const emptyData = { ...sampleData, nombreActividad: "" };
    const rows = buildIdentificacionRows(emptyData);
    expect(rows[0][1]).toBe("—");
  });
});

describe("buildNucleoRows", () => {
  it("returns 8 rows per nucleo", () => {
    const rows = buildNucleoRows(sampleData.nucleos[0], 0);
    expect(rows).toHaveLength(8);
  });
  it("formats week range", () => {
    const rows = buildNucleoRows(sampleData.nucleos[0], 0);
    expect(rows[1]).toEqual(["Semanas", "1 – 4"]);
  });
  it("uses default name for empty nucleo", () => {
    const empty: Nucleo = { ...defaultNucleo, nombre: "" };
    const rows = buildNucleoRows(empty, 2);
    expect(rows[0]).toEqual(["Nombre", "Núcleo 3"]);
  });
});

describe("buildEvaluacionesTableData", () => {
  it("returns one row per evaluacion", () => {
    const rows = buildEvaluacionesTableData(sampleData.evaluaciones, sampleData.nucleos);
    expect(rows).toHaveLength(2);
  });
  it("formats ponderacion with %", () => {
    const rows = buildEvaluacionesTableData(sampleData.evaluaciones, sampleData.nucleos);
    expect(rows[0][3]).toBe("40%");
  });
  it("includes nucleo name", () => {
    const rows = buildEvaluacionesTableData(sampleData.evaluaciones, sampleData.nucleos);
    expect(rows[0][2]).toBe("Fundamentos");
  });
  it("falls back to Núcleo N for missing index", () => {
    const evals: Evaluacion[] = [{ ...defaultEvaluacion, nucleoIndex: 5 }];
    const rows = buildEvaluacionesTableData(evals, sampleData.nucleos);
    expect(rows[0][2]).toBe("Núcleo 6");
  });
});

describe("buildPdfFilename", () => {
  it("builds filename with program, activity, semester", () => {
    const filename = buildPdfFilename(sampleData);
    expect(filename).toBe("PIAC_Pedagogía_en_Matemática_Didáctica_de_la_Matemática_2026-2.pdf");
  });
  it("uses defaults for empty data", () => {
    const empty = { ...sampleData, programa: "", nombreActividad: "" };
    const filename = buildPdfFilename(empty);
    expect(filename).toBe("PIAC_Programa_Actividad_2026-2.pdf");
  });
  it("strips special characters", () => {
    const d = { ...sampleData, programa: "Prog@#$rama!" };
    const filename = buildPdfFilename(d);
    expect(filename).toContain("Programa");
    expect(filename).not.toContain("@");
  });
});
