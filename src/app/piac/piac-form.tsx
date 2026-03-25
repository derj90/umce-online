"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PiacStatus, UserRol, PiacComentario, TipoDocencia, TipoInteraccion, TipoEvaluacion } from "@/lib/database.types";
import {
  getAllowedTransitions,
  canEdit,
  validateForSubmission,
  TRANSITION_LABELS,
} from "@/lib/piac-states";
import { SectionComments, CommentBadge } from "@/components/piac-comentarios";
import { countUnresolvedBySeccion, STEP_TO_SECCION } from "@/lib/piac-comentarios-utils";

import type { PiacData, SaveStatus } from "@/types/piac";
import { initialPiacData, STEPS } from "@/types/piac";
import { StatusBadge } from "@/components/piac/status-badge";
import { SaveIndicator } from "@/components/piac/save-indicator";
import { StepIdentificacion } from "@/components/piac/steps/step-identificacion";
import { StepModalidad } from "@/components/piac/steps/step-modalidad";
import { StepNucleos } from "@/components/piac/steps/step-nucleos";
import { StepEvaluaciones } from "@/components/piac/steps/step-evaluaciones";
import { StepBibliografia } from "@/components/piac/steps/step-bibliografia";
import { PiacPreview } from "@/components/piac/preview/piac-preview";
import { generatePiacPdf } from "@/lib/piac-pdf";

const DEBOUNCE_MS = 5000;

export function PiacForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<PiacData>(initialPiacData);
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
        : [{ ...initialPiacData.nucleos[0] }],
      evaluaciones: evals.length > 0
        ? evals.map((e) => ({
            nombre: e.nombre,
            tipo: e.tipo,
            nucleoIndex: nucleoIdToIndex.get(e.nucleo_id ?? "") ?? 0,
            ponderacion: e.ponderacion,
            semanaEntrega: e.semana_entrega,
          }))
        : [{ ...initialPiacData.evaluaciones[0] }],
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

    // Fire-and-forget email notification
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ piacId, newStatus }),
    }).catch(() => {});
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

        {/* Download PDF */}
        {piacIdRef.current && (
          <div className="mt-4">
            <button
              onClick={() => generatePiacPdf(data)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar PDF
            </button>
          </div>
        )}

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
          <PiacPreview data={data} sct={sctTotal} />
        </div>
      </div>
    </div>
  );
}
