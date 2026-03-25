export type Nucleo = {
  nombre: string;
  semanaInicio: number;
  semanaFin: number;
  resultadoFormativo: string;
  criteriosEvaluacion: string;
  temas: string;
  actividadesSincronicas: string;
  actividadesAsincronicas: string;
  actividadesAutonomas: string;
};

export type Evaluacion = {
  nombre: string;
  tipo: string;
  nucleoIndex: number;
  ponderacion: number;
  semanaEntrega: number;
};

export type PiacData = {
  // Bloque 1 — Identificación
  nombreActividad: string;
  programa: string;
  unidadAcademica: string;
  docenteResponsable: string;
  emailDocente: string;
  semestre: string;
  // Bloque 2 — Modalidad
  tipoDocencia: string;
  tipoInteraccion: string;
  numSemanas: number;
  horasSincronicas: number;
  horasAsincronicas: number;
  horasAutonomas: number;
  // Bloque 3 — Núcleos
  nucleos: Nucleo[];
  // Bloque 4 — Evaluaciones
  evaluaciones: Evaluacion[];
  // Bloque 5 — Bibliografía
  bibliografiaObligatoria: string;
  bibliografiaComplementaria: string;
};

export const defaultNucleo: Nucleo = {
  nombre: "",
  semanaInicio: 1,
  semanaFin: 4,
  resultadoFormativo: "",
  criteriosEvaluacion: "",
  temas: "",
  actividadesSincronicas: "",
  actividadesAsincronicas: "",
  actividadesAutonomas: "",
};

export const defaultEvaluacion: Evaluacion = {
  nombre: "",
  tipo: "tarea",
  nucleoIndex: 0,
  ponderacion: 0,
  semanaEntrega: 1,
};

export const initialPiacData: PiacData = {
  nombreActividad: "",
  programa: "",
  unidadAcademica: "",
  docenteResponsable: "",
  emailDocente: "",
  semestre: "2026-2",
  tipoDocencia: "docencia",
  tipoInteraccion: "virtual",
  numSemanas: 16,
  horasSincronicas: 3,
  horasAsincronicas: 3,
  horasAutonomas: 4,
  nucleos: [{ ...defaultNucleo }],
  evaluaciones: [{ ...defaultEvaluacion }],
  bibliografiaObligatoria: "",
  bibliografiaComplementaria: "",
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export const STEPS = [
  "Identificación",
  "Modalidad",
  "Núcleos",
  "Evaluaciones",
  "Bibliografía",
];
