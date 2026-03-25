"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PiacStatus, UserRol, PiacComentario, TipoDocencia, TipoInteraccion, TipoEvaluacion } from "@/lib/database.types";
import {
  getAllowedTransitions,
  canEdit,
  validateForSubmission,
  STATUS_LABELS,
  STATUS_COLORS,
  TRANSITION_LABELS,
} from "@/lib/piac-states";
import { SectionComments, CommentBadge } from "@/components/piac-comentarios";
import { countUnresolvedBySeccion, STEP_TO_SECCION } from "@/lib/piac-comentarios-utils";

type Nucleo = {
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

type Evaluacion = {
  nombre: string;
  tipo: string;
  nucleoIndex: number;
  ponderacion: number;
  semanaEntrega: number;
};

type PiacData = {
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

const defaultNucleo: Nucleo = {
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

const defaultEvaluacion: Evaluacion = {
  nombre: "",
  tipo: "tarea",
  nucleoIndex: 0,
  ponderacion: 0,
  semanaEntrega: 1,
};

const initialData: PiacData = {
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

const STEPS = [
  "Identificación",
  "Modalidad",
  "Núcleos",
  "Evaluaciones",
  "Bibliografía",
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 5000;

export function PiacForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<PiacData>(initialData);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [piacStatus, setPiacStatus] = useState<PiacStatus>("borrador");
  const [userRole, setUserRole] = useState<UserRol>("docente");

  const [comentarios, setComentarios] = useState<PiacComentario[]>([]);

  const supabase = useRef(createClient());
  const piacIdRef = useRef<string | null>(searchParams.get("id"));
  const userIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const skipNextAutosave = useRef(true); // skip initial render

  const isEditable = canEdit(userRole, piacStatus);
  const unresolvedCounts = countUnresolvedBySeccion(comentarios);

  const update = <K extends keyof PiacData>(key: K, value: PiacData[K]) => {
    if (!isEditable) return;
    setData((prev) => ({ ...prev, [key]: value }));
  };

  // ─── Get current user + profile (role) ─────────────────────────────────
  useEffect(() => {
    const sb = supabase.current;
    sb.auth.getUser().then(async ({ data: { user } }) => {
      userIdRef.current = user?.id ?? null;
      if (user) {
        const { data: profile } = await sb
          .from("profiles")
          .select("rol")
          .eq("id", user.id)
          .single();
        if (profile?.rol) setUserRole(profile.rol as UserRol);
      }
    });
  }, []);

  const sctTotal = Math.round(
    (data.horasSincronicas + data.horasAsincronicas + data.horasAutonomas) *
      data.numSemanas /
      27
  );

  // ─── Load comments ──────────────────────────────────────────────────────
  const loadComentarios = useCallback(async (piacId: string) => {
    const sb = supabase.current;
    const { data } = await sb
      .from("piac_comentarios")
      .select("*")
      .eq("piac_id", piacId)
      .order("created_at", { ascending: true });
    setComentarios(data ?? []);
  }, []);

  // ─── Load existing PIAC ─────────────────────────────────────────────────
  const loadPiac = useCallback(async (id: string) => {
    setIsLoading(true);
    const sb = supabase.current;

    const [piacRes, nucleosRes, evalsRes] = await Promise.all([
      sb.from("piacs").select("*").eq("id", id).single(),
      sb.from("piac_nucleos").select("*").eq("piac_id", id).order("orden"),
      sb.from("piac_evaluaciones").select("*").eq("piac_id", id),
    ]);

    if (piacRes.error || !piacRes.data) {
      setIsLoading(false);
      return;
    }

    const p = piacRes.data;
    const nucleos = nucleosRes.data ?? [];
    const evals = evalsRes.data ?? [];

    setPiacStatus(p.status as PiacStatus);

    // Map nucleo IDs to indices for evaluacion.nucleoIndex
    const nucleoIdToIndex = new Map(nucleos.map((n, i) => [n.id, i]));

    setData({
      nombreActividad: p.nombre_actividad,
      programa: p.programa,
      unidadAcademica: p.unidad_academica,
      docenteResponsable: p.docente_responsable,
      emailDocente: p.email_docente,
      semestre: p.semestre,
      tipoDocencia: p.tipo_docencia,
      tipoInteraccion: p.tipo_interaccion,
      numSemanas: p.num_semanas,
      horasSincronicas: p.horas_sincronicas,
      horasAsincronicas: p.horas_asincronicas,
      horasAutonomas: p.horas_autonomas,
      nucleos: nucleos.length > 0
        ? nucleos.map((n) => ({
            nombre: n.nombre,
            semanaInicio: n.semana_inicio,
            semanaFin: n.semana_fin,
            resultadoFormativo: n.resultado_formativo,
            criteriosEvaluacion: n.criterios_evaluacion,
            temas: n.temas,
            actividadesSincronicas: n.actividades_sincronicas,
            actividadesAsincronicas: n.actividades_asincronicas,
            actividadesAutonomas: n.actividades_autonomas,
          }))
        : [{ ...defaultNucleo }],
      evaluaciones: evals.length > 0
        ? evals.map((e) => ({
            nombre: e.nombre,
            tipo: e.tipo,
            nucleoIndex: nucleoIdToIndex.get(e.nucleo_id ?? "") ?? 0,
            ponderacion: e.ponderacion,
            semanaEntrega: e.semana_entrega,
          }))
        : [{ ...defaultEvaluacion }],
      bibliografiaObligatoria: p.bibliografia_obligatoria,
      bibliografiaComplementaria: p.bibliografia_complementaria,
    });

    // Load comments for this PIAC
    loadComentarios(id);

    // Allow autosave after load completes
    skipNextAutosave.current = true;
    setIsLoading(false);
  }, [loadComentarios]);

  // Load on mount if ?id= is present
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      piacIdRef.current = id;
      loadPiac(id);
    }
  }, [searchParams, loadPiac]);

  // ─── Save PIAC ──────────────────────────────────────────────────────────
  const savePiac = useCallback(async () => {
    if (!isEditable) return;
    setSaveStatus("saving");
    const sb = supabase.current;

    try {
      const piacRow = {
        user_id: userIdRef.current,
        nombre_actividad: data.nombreActividad,
        programa: data.programa,
        unidad_academica: data.unidadAcademica,
        docente_responsable: data.docenteResponsable,
        email_docente: data.emailDocente,
        semestre: data.semestre,
        tipo_docencia: data.tipoDocencia as TipoDocencia,
        tipo_interaccion: data.tipoInteraccion as TipoInteraccion,
        num_semanas: data.numSemanas,
        horas_sincronicas: data.horasSincronicas,
        horas_asincronicas: data.horasAsincronicas,
        horas_autonomas: data.horasAutonomas,
        bibliografia_obligatoria: data.bibliografiaObligatoria,
        bibliografia_complementaria: data.bibliografiaComplementaria,
        status: piacStatus,
      };

      let piacId = piacIdRef.current;

      if (!piacId) {
        // CREATE
        const { data: inserted, error } = await sb
          .from("piacs")
          .insert(piacRow)
          .select("id")
          .single();
        if (error) throw error;
        piacId = inserted.id;
        piacIdRef.current = piacId;
        // Update URL without full navigation
        window.history.replaceState(null, "", `?id=${piacId}`);
      } else {
        // UPDATE
        const { error } = await sb
          .from("piacs")
          .update(piacRow)
          .eq("id", piacId);
        if (error) throw error;
      }

      // Sync nucleos: delete all, re-insert
      await sb.from("piac_evaluaciones").delete().eq("piac_id", piacId);
      await sb.from("piac_nucleos").delete().eq("piac_id", piacId);

      const nucleoInserts = data.nucleos.map((n, i) => ({
        piac_id: piacId!,
        orden: i + 1,
        nombre: n.nombre || `Núcleo ${i + 1}`,
        semana_inicio: n.semanaInicio,
        semana_fin: n.semanaFin,
        resultado_formativo: n.resultadoFormativo,
        criterios_evaluacion: n.criteriosEvaluacion,
        temas: n.temas,
        actividades_sincronicas: n.actividadesSincronicas,
        actividades_asincronicas: n.actividadesAsincronicas,
        actividades_autonomas: n.actividadesAutonomas,
      }));

      const { data: insertedNucleos, error: nucleoErr } = await sb
        .from("piac_nucleos")
        .insert(nucleoInserts)
        .select("id");
      if (nucleoErr) throw nucleoErr;

      // Map evaluacion nucleoIndex → nucleo_id
      const nucleoIds = (insertedNucleos ?? []).map((n) => n.id);

      const evalInserts = data.evaluaciones.map((e) => ({
        piac_id: piacId!,
        nucleo_id: nucleoIds[e.nucleoIndex] ?? null,
        nombre: e.nombre || "Sin nombre",
        tipo: e.tipo as TipoEvaluacion,
        ponderacion: e.ponderacion,
        semana_entrega: e.semanaEntrega,
      }));

      if (evalInserts.length > 0) {
        const { error: evalErr } = await sb
          .from("piac_evaluaciones")
          .insert(evalInserts);
        if (evalErr) throw evalErr;
      }

      setSaveStatus("saved");
    } catch (err) {
      console.error("Error saving PIAC:", err);
      setSaveStatus("error");
    }
  }, [data, piacStatus, isEditable]);

  // ─── Autosave with debounce ─────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || !isEditable) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      savePiac();
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [data, isLoading, isEditable, savePiac]);

  // ─── Transition status ──────────────────────────────────────────────────
  const transitionStatus = useCallback(async (newStatus: PiacStatus) => {
    const piacId = piacIdRef.current;
    if (!piacId) return;

    // If moving to "enviado", validate first
    if (newStatus === "enviado") {
      const errors = validateForSubmission(data.evaluaciones);
      if (errors.length > 0) {
        alert(errors.map((e) => e.message).join("\n"));
        return;
      }
      // Save content before submitting
      if (isEditable) await savePiac();
    }

    const sb = supabase.current;

    // Get current version count for this PIAC
    const { count } = await sb
      .from("piac_versiones")
      .select("*", { count: "exact", head: true })
      .eq("piac_id", piacId);

    // Create version snapshot
    await sb.from("piac_versiones").insert({
      piac_id: piacId,
      version: (count ?? 0) + 1,
      data_snapshot: { ...data, status_from: piacStatus, status_to: newStatus } as unknown as Record<string, unknown>,
      changed_by: userIdRef.current,
    });

    // Update status
    const { error } = await sb
      .from("piacs")
      .update({ status: newStatus })
      .eq("id", piacId);

    if (error) {
      console.error("Error transitioning status:", error);
      alert("Error al cambiar el estado del PIAC.");
      return;
    }

    setPiacStatus(newStatus);
    setSaveStatus("saved");
  }, [data, piacStatus, isEditable, savePiac]);

  const allowedTransitions = getAllowedTransitions(userRole, piacStatus);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Formulario */}
      <div>
        {/* Status badge + Steps indicator + save status */}
        <div className="mb-4 flex items-center gap-3">
          <StatusBadge status={piacStatus} />
          {!isEditable && (
            <span className="text-xs text-gray-500">Solo lectura</span>
          )}
          <div className="ml-auto">
            <SaveIndicator status={saveStatus} />
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex flex-1 gap-1">
            {STEPS.map((label, i) => {
              const seccion = STEP_TO_SECCION[i];
              const unresolvedCount = seccion ? unresolvedCounts[seccion] : 0;
              return (
                <button
                  key={label}
                  onClick={() => setStep(i)}
                  className={`relative flex-1 rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                    i === step
                      ? "bg-[var(--color-umce-blue)] text-white"
                      : i < step
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {label}
                  {unresolvedCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                      {unresolvedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
            Cargando PIAC...
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            {step === 0 && (
              <StepIdentificacion data={data} update={update} disabled={!isEditable} />
            )}
            {step === 1 && (
              <StepModalidad data={data} update={update} sct={sctTotal} disabled={!isEditable} />
            )}
            {step === 2 && <StepNucleos data={data} setData={setData} disabled={!isEditable} />}
            {step === 3 && <StepEvaluaciones data={data} setData={setData} disabled={!isEditable} />}
            {step === 4 && <StepBibliografia data={data} update={update} disabled={!isEditable} />}

            {/* Inline comments for current section */}
            {piacIdRef.current && (
              <SectionComments
                comentarios={comentarios}
                seccion={STEP_TO_SECCION[step]}
                piacId={piacIdRef.current}
                userRole={userRole}
                userId={userIdRef.current}
                onUpdate={() => loadComentarios(piacIdRef.current!)}
              />
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Anterior
          </button>
          {step < STEPS.length - 1 && (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-[var(--color-umce-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Siguiente
            </button>
          )}
        </div>

        {/* Status transition actions */}
        {piacIdRef.current && allowedTransitions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <span className="w-full text-xs font-medium text-gray-500 mb-1">
              Acciones disponibles:
            </span>
            {allowedTransitions.map((target) => (
              <button
                key={target}
                onClick={() => transitionStatus(target)}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                  target === "aprobado"
                    ? "bg-green-600 hover:bg-green-700"
                    : target === "devuelto"
                      ? "bg-red-600 hover:bg-red-700"
                      : target === "enviado"
                        ? "bg-[var(--color-umce-accent)] hover:bg-emerald-600"
                        : "bg-[var(--color-umce-blue)] hover:bg-blue-800"
                }`}
              >
                {TRANSITION_LABELS[target]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="hidden lg:block">
        <div className="sticky top-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Preview del curso
          </h3>
          <Preview data={data} sct={sctTotal} />
        </div>
      </div>
    </div>
  );
}

/* ─── Status Badge ─── */

function StatusBadge({ status }: { status: PiacStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

/* ─── Save Indicator ─── */

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const styles: Record<SaveStatus, { text: string; className: string }> = {
    idle: { text: "", className: "" },
    saving: {
      text: "Guardando...",
      className: "text-blue-600",
    },
    saved: {
      text: "Guardado",
      className: "text-green-600",
    },
    error: {
      text: "Error al guardar",
      className: "text-red-600",
    },
  };

  const { text, className } = styles[status];

  return (
    <span className={`shrink-0 text-xs font-medium ${className}`}>
      {status === "saving" && (
        <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {text}
    </span>
  );
}

/* ─── Step Components ─── */

function StepIdentificacion({
  data,
  update,
  disabled,
}: {
  data: PiacData;
  update: <K extends keyof PiacData>(key: K, value: PiacData[K]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bloque 1 — Identificación</h2>
      <Field
        label="Nombre de la actividad curricular"
        value={data.nombreActividad}
        onChange={(v) => update("nombreActividad", v)}
        placeholder="Ej: Comunicación y Aprendizaje para NEE"
        disabled={disabled}
      />
      <Field
        label="Programa de postgrado"
        value={data.programa}
        onChange={(v) => update("programa", v)}
        placeholder="Ej: Magíster en Educación Especial"
        disabled={disabled}
      />
      <Field
        label="Unidad académica"
        value={data.unidadAcademica}
        onChange={(v) => update("unidadAcademica", v)}
        placeholder="Ej: Depto. Educación Diferencial"
        disabled={disabled}
      />
      <Field
        label="Docente(s) responsable(s)"
        value={data.docenteResponsable}
        onChange={(v) => update("docenteResponsable", v)}
        disabled={disabled}
      />
      <Field
        label="Email docente"
        value={data.emailDocente}
        onChange={(v) => update("emailDocente", v)}
        type="email"
        disabled={disabled}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Semestre
        </label>
        <select
          value={data.semestre}
          onChange={(e) => update("semestre", e.target.value)}
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          <option value="2026-1">1° Semestre 2026</option>
          <option value="2026-2">2° Semestre 2026</option>
          <option value="2027-1">1° Semestre 2027</option>
        </select>
      </div>
    </div>
  );
}

function StepModalidad({
  data,
  update,
  sct,
  disabled,
}: {
  data: PiacData;
  update: <K extends keyof PiacData>(key: K, value: PiacData[K]) => void;
  sct: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Bloque 2 — Modalidad y distribución temporal
      </h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo de docencia
        </label>
        <select
          value={data.tipoDocencia}
          onChange={(e) => update("tipoDocencia", e.target.value)}
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          <option value="docencia">Docencia</option>
          <option value="co-docencia">Co-docencia</option>
          <option value="colegiada">Colegiada</option>
          <option value="mixta">Mixta</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo de interacción
        </label>
        <select
          value={data.tipoInteraccion}
          onChange={(e) => update("tipoInteraccion", e.target.value)}
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          <option value="virtual">Virtual</option>
          <option value="semipresencial">Semipresencial</option>
        </select>
      </div>
      <NumberField
        label="Número de semanas"
        value={data.numSemanas}
        onChange={(v) => update("numSemanas", v)}
        min={4}
        max={20}
        disabled={disabled}
      />
      <div className="grid grid-cols-3 gap-3">
        <NumberField
          label="Hrs sincrónicas/sem"
          value={data.horasSincronicas}
          onChange={(v) => update("horasSincronicas", v)}
          min={0}
          max={20}
          disabled={disabled}
        />
        <NumberField
          label="Hrs asincrónicas/sem"
          value={data.horasAsincronicas}
          onChange={(v) => update("horasAsincronicas", v)}
          min={0}
          max={20}
          disabled={disabled}
        />
        <NumberField
          label="Hrs autónomas/sem"
          value={data.horasAutonomas}
          onChange={(v) => update("horasAutonomas", v)}
          min={0}
          max={20}
          disabled={disabled}
        />
      </div>
      <div className="rounded-lg bg-blue-50 p-4 text-sm">
        <p className="font-medium text-blue-900">Cálculo SCT automático</p>
        <p className="mt-1 text-blue-700">
          {data.horasSincronicas + data.horasAsincronicas + data.horasAutonomas}{" "}
          hrs/semana × {data.numSemanas} semanas ={" "}
          {(data.horasSincronicas + data.horasAsincronicas + data.horasAutonomas) * data.numSemanas}{" "}
          hrs totales ÷ 27 = <strong>{sct} SCT</strong>
        </p>
      </div>
    </div>
  );
}

function StepNucleos({
  data,
  setData,
  disabled,
}: {
  data: PiacData;
  setData: React.Dispatch<React.SetStateAction<PiacData>>;
  disabled?: boolean;
}) {
  const addNucleo = () => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      nucleos: [
        ...prev.nucleos,
        {
          ...defaultNucleo,
          semanaInicio: prev.nucleos.length > 0
            ? prev.nucleos[prev.nucleos.length - 1].semanaFin + 1
            : 1,
          semanaFin: Math.min(
            prev.numSemanas,
            (prev.nucleos.length > 0
              ? prev.nucleos[prev.nucleos.length - 1].semanaFin
              : 0) + 4
          ),
        },
      ],
    }));
  };

  const updateNucleo = (index: number, field: keyof Nucleo, value: string | number) => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      nucleos: prev.nucleos.map((n, i) =>
        i === index ? { ...n, [field]: value } : n
      ),
    }));
  };

  const removeNucleo = (index: number) => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      nucleos: prev.nucleos.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bloque 3 — Núcleos de aprendizaje</h2>
        {!disabled && (
          <button
            onClick={addNucleo}
            className="rounded-lg bg-[var(--color-umce-blue)] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
          >
            + Agregar núcleo
          </button>
        )}
      </div>

      {data.nucleos.map((nucleo, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Núcleo {i + 1}</h3>
            {!disabled && data.nucleos.length > 1 && (
              <button
                onClick={() => removeNucleo(i)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            )}
          </div>
          <Field
            label="Nombre del núcleo"
            value={nucleo.nombre}
            onChange={(v) => updateNucleo(i, "nombre", v)}
            placeholder="Ej: Fundamentos de la comunicación aumentativa"
            disabled={disabled}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Semana inicio"
              value={nucleo.semanaInicio}
              onChange={(v) => updateNucleo(i, "semanaInicio", v)}
              min={1}
              max={data.numSemanas}
              disabled={disabled}
            />
            <NumberField
              label="Semana fin"
              value={nucleo.semanaFin}
              onChange={(v) => updateNucleo(i, "semanaFin", v)}
              min={nucleo.semanaInicio}
              max={data.numSemanas}
              disabled={disabled}
            />
          </div>
          <TextArea
            label="Resultado formativo"
            value={nucleo.resultadoFormativo}
            onChange={(v) => updateNucleo(i, "resultadoFormativo", v)}
            placeholder="Verbo en presente indicativo: Diseña, Analiza, Evalúa..."
            disabled={disabled}
          />
          <TextArea
            label="Criterios de evaluación"
            value={nucleo.criteriosEvaluacion}
            onChange={(v) => updateNucleo(i, "criteriosEvaluacion", v)}
            disabled={disabled}
          />
          <TextArea
            label="Temas / contenidos"
            value={nucleo.temas}
            onChange={(v) => updateNucleo(i, "temas", v)}
            disabled={disabled}
          />
          <TextArea
            label="Actividades sincrónicas"
            value={nucleo.actividadesSincronicas}
            onChange={(v) => updateNucleo(i, "actividadesSincronicas", v)}
            placeholder="Nombre + descripción breve"
            disabled={disabled}
          />
          <TextArea
            label="Actividades asincrónicas (foro, tarea, wiki, cuestionario)"
            value={nucleo.actividadesAsincronicas}
            onChange={(v) => updateNucleo(i, "actividadesAsincronicas", v)}
            disabled={disabled}
          />
          <TextArea
            label="Actividades autónomas (lecturas)"
            value={nucleo.actividadesAutonomas}
            onChange={(v) => updateNucleo(i, "actividadesAutonomas", v)}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}

function StepEvaluaciones({
  data,
  setData,
  disabled,
}: {
  data: PiacData;
  setData: React.Dispatch<React.SetStateAction<PiacData>>;
  disabled?: boolean;
}) {
  const addEval = () => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      evaluaciones: [...prev.evaluaciones, { ...defaultEvaluacion }],
    }));
  };

  const updateEval = (index: number, field: keyof Evaluacion, value: string | number) => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      evaluaciones: prev.evaluaciones.map((e, i) =>
        i === index ? { ...e, [field]: value } : e
      ),
    }));
  };

  const removeEval = (index: number) => {
    if (disabled) return;
    setData((prev) => ({
      ...prev,
      evaluaciones: prev.evaluaciones.filter((_, i) => i !== index),
    }));
  };

  const totalPonderacion = data.evaluaciones.reduce(
    (sum, e) => sum + e.ponderacion,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bloque 4 — Evaluaciones sumativas</h2>
        {!disabled && (
          <button
            onClick={addEval}
            className="rounded-lg bg-[var(--color-umce-blue)] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
          >
            + Agregar evaluación
          </button>
        )}
      </div>

      {data.evaluaciones.length < 3 && (
        <p className="text-sm text-amber-600">
          Mínimo 3 evaluaciones sumativas por reglamento.
        </p>
      )}

      {data.evaluaciones.map((ev, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Evaluación {i + 1}</h3>
            {!disabled && data.evaluaciones.length > 1 && (
              <button
                onClick={() => removeEval(i)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            )}
          </div>
          <Field
            label="Nombre"
            value={ev.nombre}
            onChange={(v) => updateEval(i, "nombre", v)}
            disabled={disabled}
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={ev.tipo}
                onChange={(e) => updateEval(i, "tipo", e.target.value)}
                disabled={disabled}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <option value="tarea">Tarea</option>
                <option value="prueba">Prueba</option>
                <option value="proyecto">Proyecto</option>
                <option value="portfolio">Portafolio</option>
              </select>
            </div>
            <NumberField
              label="Ponderación %"
              value={ev.ponderacion}
              onChange={(v) => updateEval(i, "ponderacion", v)}
              min={0}
              max={100}
              disabled={disabled}
            />
            <NumberField
              label="Semana entrega"
              value={ev.semanaEntrega}
              onChange={(v) => updateEval(i, "semanaEntrega", v)}
              min={1}
              max={data.numSemanas}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Núcleo al que tributa
            </label>
            <select
              value={ev.nucleoIndex}
              onChange={(e) => updateEval(i, "nucleoIndex", Number(e.target.value))}
              disabled={disabled}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {data.nucleos.map((n, ni) => (
                <option key={ni} value={ni}>
                  Núcleo {ni + 1}{n.nombre ? `: ${n.nombre}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      <div
        className={`rounded-lg p-3 text-sm font-medium ${
          totalPonderacion === 100
            ? "bg-green-50 text-green-800"
            : "bg-red-50 text-red-800"
        }`}
      >
        Total ponderación: {totalPonderacion}%{" "}
        {totalPonderacion !== 100 && "(debe sumar 100%)"}
      </div>
    </div>
  );
}

function StepBibliografia({
  data,
  update,
  disabled,
}: {
  data: PiacData;
  update: <K extends keyof PiacData>(key: K, value: PiacData[K]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bloque 5 — Bibliografía</h2>
      <TextArea
        label="Bibliografía obligatoria"
        value={data.bibliografiaObligatoria}
        onChange={(v) => update("bibliografiaObligatoria", v)}
        placeholder="Formato APA. Una referencia por línea."
        rows={6}
        disabled={disabled}
      />
      <TextArea
        label="Bibliografía complementaria"
        value={data.bibliografiaComplementaria}
        onChange={(v) => update("bibliografiaComplementaria", v)}
        placeholder="Formato APA. Una referencia por línea."
        rows={4}
        disabled={disabled}
      />
    </div>
  );
}

/* ─── Preview ─── */

function Preview({ data, sct }: { data: PiacData; sct: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Course header */}
      <div className="bg-[var(--color-umce-blue)] px-5 py-4 text-white">
        <h3 className="font-bold">
          {data.nombreActividad || "Nombre de la actividad curricular"}
        </h3>
        <p className="mt-1 text-sm text-blue-200">
          {data.programa || "Programa"} · {data.semestre} · {sct} SCT
        </p>
        {data.docenteResponsable && (
          <p className="mt-1 text-sm text-blue-300">
            {data.docenteResponsable}
          </p>
        )}
      </div>

      {/* Course structure */}
      <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
        {data.nucleos.map((nucleo, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                {i + 1}
              </span>
              <h4 className="font-semibold text-gray-900">
                {nucleo.nombre || `Núcleo ${i + 1}`}
              </h4>
            </div>
            <p className="ml-8 mt-1 text-xs text-gray-500">
              Semanas {nucleo.semanaInicio}–{nucleo.semanaFin}
            </p>

            {nucleo.resultadoFormativo && (
              <p className="ml-8 mt-2 text-sm text-gray-700 italic">
                RF: {nucleo.resultadoFormativo}
              </p>
            )}

            <div className="ml-8 mt-3 space-y-1.5">
              {nucleo.actividadesSincronicas && (
                <div className="flex items-start gap-2 text-sm">
                  <span>🎥</span>
                  <span className="text-gray-700">
                    {nucleo.actividadesSincronicas}
                  </span>
                </div>
              )}
              {nucleo.actividadesAsincronicas && (
                <div className="flex items-start gap-2 text-sm">
                  <span>💬</span>
                  <span className="text-gray-700">
                    {nucleo.actividadesAsincronicas}
                  </span>
                </div>
              )}
              {nucleo.actividadesAutonomas && (
                <div className="flex items-start gap-2 text-sm">
                  <span>📚</span>
                  <span className="text-gray-700">
                    {nucleo.actividadesAutonomas}
                  </span>
                </div>
              )}
            </div>

            {/* Evaluaciones de este núcleo */}
            {data.evaluaciones
              .filter((e) => e.nucleoIndex === i && e.nombre)
              .map((ev, ei) => (
                <div
                  key={ei}
                  className="ml-8 mt-2 flex items-start gap-2 text-sm"
                >
                  <span>⭐</span>
                  <span className="text-gray-700">
                    {ev.nombre} ({ev.ponderacion}%) — Semana {ev.semanaEntrega}
                  </span>
                </div>
              ))}
          </div>
        ))}

        {/* Bibliografía */}
        {(data.bibliografiaObligatoria || data.bibliografiaComplementaria) && (
          <div className="p-4">
            <h4 className="font-semibold text-gray-900">📖 Bibliografía</h4>
            {data.bibliografiaObligatoria && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Obligatoria
                </p>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                  {data.bibliografiaObligatoria}
                </p>
              </div>
            )}
            {data.bibliografiaComplementaria && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Complementaria
                </p>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                  {data.bibliografiaComplementaria}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shared UI components ─── */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
      />
    </div>
  );
}
