export type PiacStatus =
  | "borrador"
  | "enviado"
  | "en_revision"
  | "aprobado"
  | "devuelto";

export type TipoDocencia = "docencia" | "co-docencia" | "colegiada" | "mixta";
export type TipoInteraccion = "virtual" | "semipresencial";
export type TipoEvaluacion = "tarea" | "prueba" | "proyecto" | "portfolio";

// ─── Row types (what you get back from queries) ─────────────────────────────

export interface Piac {
  id: string;
  user_id: string | null;
  nombre_actividad: string;
  programa: string;
  unidad_academica: string;
  docente_responsable: string;
  email_docente: string;
  semestre: string;
  tipo_docencia: TipoDocencia;
  tipo_interaccion: TipoInteraccion;
  num_semanas: number;
  horas_sincronicas: number;
  horas_asincronicas: number;
  horas_autonomas: number;
  bibliografia_obligatoria: string;
  bibliografia_complementaria: string;
  status: PiacStatus;
  created_at: string;
  updated_at: string;
}

export interface PiacNucleo {
  id: string;
  piac_id: string;
  orden: number;
  nombre: string;
  semana_inicio: number;
  semana_fin: number;
  resultado_formativo: string;
  criterios_evaluacion: string;
  temas: string;
  actividades_sincronicas: string;
  actividades_asincronicas: string;
  actividades_autonomas: string;
}

export interface PiacEvaluacion {
  id: string;
  piac_id: string;
  nucleo_id: string | null;
  nombre: string;
  tipo: TipoEvaluacion;
  ponderacion: number;
  semana_entrega: number;
}

export interface PiacVersion {
  id: string;
  piac_id: string;
  version: number;
  data_snapshot: Record<string, unknown>;
  changed_by: string | null;
  created_at: string;
}

// ─── Insert types (omit server-generated fields) ────────────────────────────

export type PiacInsert = Omit<Piac, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export type PiacNucleoInsert = Omit<PiacNucleo, "id"> & {
  id?: string;
};

export type PiacEvaluacionInsert = Omit<PiacEvaluacion, "id"> & {
  id?: string;
};

export type PiacVersionInsert = Omit<PiacVersion, "id" | "created_at"> & {
  id?: string;
};

// ─── Update types ───────────────────────────────────────────────────────────

export type PiacUpdate = Partial<Omit<Piac, "id" | "created_at" | "updated_at">>;
export type PiacNucleoUpdate = Partial<Omit<PiacNucleo, "id" | "piac_id">>;
export type PiacEvaluacionUpdate = Partial<Omit<PiacEvaluacion, "id" | "piac_id">>;

// ─── Supabase Database type (for createClient<Database>) ────────────────────

export interface Database {
  public: {
    Tables: {
      piacs: {
        Row: Piac;
        Insert: PiacInsert;
        Update: PiacUpdate;
      };
      piac_nucleos: {
        Row: PiacNucleo;
        Insert: PiacNucleoInsert;
        Update: PiacNucleoUpdate;
      };
      piac_evaluaciones: {
        Row: PiacEvaluacion;
        Insert: PiacEvaluacionInsert;
        Update: PiacEvaluacionUpdate;
      };
      piac_versiones: {
        Row: PiacVersion;
        Insert: PiacVersionInsert;
        Update: Record<string, never>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
