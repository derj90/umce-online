"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  TRANSITION_LABELS,
  getAllowedTransitions,
} from "@/lib/piac-states";
import {
  filterDiPiacs,
  countByStatus,
  getUniqueProgramas,
  getUniqueSemestres,
  DI_VISIBLE_STATUSES,
  type PiacForReview,
} from "@/lib/di-panel-utils";
import { formatDate } from "@/lib/piac-list-utils";
import type { PiacStatus, UserRol, PiacComentario } from "@/lib/database.types";
import { countTotalUnresolved } from "@/lib/piac-comentarios-utils";

const DI_STATUS_OPTIONS: { value: "" | PiacStatus; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "enviado", label: "Enviado" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobado", label: "Aprobado" },
  { value: "devuelto", label: "Devuelto" },
];

export function DiPanel() {
  const [piacs, setPiacs] = useState<PiacForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRol>("docente");

  // Filters
  const [filterStatus, setFilterStatus] = useState<"" | PiacStatus>("");
  const [filterPrograma, setFilterPrograma] = useState("");
  const [filterDocente, setFilterDocente] = useState("");
  const [filterSemestre, setFilterSemestre] = useState("");

  // Comments per PIAC
  const [comentariosByPiac, setComentariosByPiac] = useState<Record<string, PiacComentario[]>>({});

  // Action state
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [returnModal, setReturnModal] = useState<PiacForReview | null>(null);
  const [returnComment, setReturnComment] = useState("");

  // Moodle generation state
  const [generating, setGenerating] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<{
    courseUrl: string;
    sectionsCreated: number;
    activitiesCreated: number;
    teacherEnrolled: boolean;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Debes iniciar sesión.");
      setLoading(false);
      return;
    }

    // Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.rol !== "di" && profile.rol !== "coordinador")) {
      setError("No tienes permisos para acceder al panel DI.");
      setLoading(false);
      return;
    }

    setUserRole(profile.rol);

    // Fetch all non-borrador PIACs (DI sees enviado, en_revision, aprobado, devuelto)
    const { data, error: fetchError } = await supabase
      .from("piacs")
      .select("*")
      .in("status", DI_VISIBLE_STATUSES)
      .order("updated_at", { ascending: false });

    if (fetchError) {
      setError("Error al cargar PIACs: " + fetchError.message);
    } else {
      setPiacs(data ?? []);

      // Fetch comments for all visible PIACs
      if (data && data.length > 0) {
        const piacIds = data.map((p) => p.id);
        const { data: allComments } = await supabase
          .from("piac_comentarios")
          .select("*")
          .in("piac_id", piacIds);

        if (allComments) {
          const grouped: Record<string, PiacComentario[]> = {};
          for (const c of allComments) {
            if (!grouped[c.piac_id]) grouped[c.piac_id] = [];
            grouped[c.piac_id].push(c);
          }
          setComentariosByPiac(grouped);
        }
      }
    }
    setLoading(false);
  }

  async function handleTransition(piac: PiacForReview, newStatus: PiacStatus) {
    setTransitioning(piac.id);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("piacs")
      .update({ status: newStatus })
      .eq("id", piac.id);

    if (updateError) {
      alert("Error: " + updateError.message);
    } else {
      // Create version snapshot
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("piac_versiones").insert({
        piac_id: piac.id,
        version: Date.now(),
        data_snapshot: { ...piac, status: newStatus },
        changed_by: user?.id ?? null,
      });

      setPiacs((prev) =>
        prev.map((p) => (p.id === piac.id ? { ...p, status: newStatus } : p)),
      );
    }
    setTransitioning(null);
  }

  async function handleReturn(piac: PiacForReview) {
    if (!returnComment.trim()) {
      alert("Debes agregar un comentario al devolver un PIAC.");
      return;
    }

    setTransitioning(piac.id);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("piacs")
      .update({ status: "devuelto" as PiacStatus })
      .eq("id", piac.id);

    if (updateError) {
      alert("Error: " + updateError.message);
      setTransitioning(null);
      return;
    }

    // Create version snapshot with comment
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("piac_versiones").insert({
      piac_id: piac.id,
      version: Date.now(),
      data_snapshot: {
        ...piac,
        status: "devuelto",
        comentario_devolucion: returnComment.trim(),
      },
      changed_by: user?.id ?? null,
    });

    setPiacs((prev) =>
      prev.map((p) =>
        p.id === piac.id ? { ...p, status: "devuelto" as PiacStatus } : p,
      ),
    );

    setReturnModal(null);
    setReturnComment("");
    setTransitioning(null);
  }

  async function handleGenerateMoodle(piacId: string) {
    if (!confirm("¿Generar aula Moodle para este PIAC aprobado?")) return;

    setGenerating(piacId);
    try {
      const res = await fetch("/api/moodle/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piacId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + (data.error ?? "Error desconocido"));
        return;
      }

      setGenerationResult(data);
    } catch (err) {
      alert("Error de conexión al generar aula.");
    } finally {
      setGenerating(null);
    }
  }

  const filtered = filterDiPiacs(piacs, {
    status: filterStatus,
    programa: filterPrograma,
    docente: filterDocente,
    semestre: filterSemestre,
  });
  const counts = countByStatus(piacs);
  const programas = getUniqueProgramas(piacs);
  const semestres = getUniqueSemestres(piacs);

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando panel DI...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            ["enviado", "Pendientes"],
            ["en_revision", "En revisión"],
            ["aprobado", "Aprobados"],
            ["devuelto", "Devueltos"],
          ] as [PiacStatus, string][]
        ).map(([status, label]) => {
          const colors = STATUS_COLORS[status];
          return (
            <button
              key={status}
              onClick={() =>
                setFilterStatus(filterStatus === status ? "" : status)
              }
              className={`rounded-xl border p-4 text-left transition-colors ${
                filterStatus === status
                  ? "border-[var(--color-umce-blue)] ring-1 ring-[var(--color-umce-blue)]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${colors.dot}`}
                />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {counts[status]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "" | PiacStatus)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[var(--color-umce-light)] focus:ring-1 focus:ring-[var(--color-umce-light)] focus:outline-none"
        >
          {DI_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {programas.length > 1 && (
          <select
            value={filterPrograma}
            onChange={(e) => setFilterPrograma(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[var(--color-umce-light)] focus:ring-1 focus:ring-[var(--color-umce-light)] focus:outline-none"
          >
            <option value="">Todos los programas</option>
            {programas.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}

        {semestres.length > 1 && (
          <select
            value={filterSemestre}
            onChange={(e) => setFilterSemestre(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[var(--color-umce-light)] focus:ring-1 focus:ring-[var(--color-umce-light)] focus:outline-none"
          >
            <option value="">Todos los semestres</option>
            {semestres.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="Buscar docente..."
          value={filterDocente}
          onChange={(e) => setFilterDocente(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[var(--color-umce-light)] focus:ring-1 focus:ring-[var(--color-umce-light)] focus:outline-none"
        />

        <span className="ml-auto self-center text-sm text-gray-500">
          {filtered.length} de {piacs.length}
        </span>
      </div>

      {/* Table */}
      {piacs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <h3 className="text-base font-medium text-gray-900">
            No hay PIACs para revisar
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Cuando los docentes envíen sus PIACs, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Nombre
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-700 sm:table-cell">
                  Docente
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-700 md:table-cell">
                  Programa
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Estado
                </th>
                <th className="hidden px-4 py-3 text-center font-medium text-gray-700 sm:table-cell">
                  Notas
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-700 lg:table-cell">
                  Modificado
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((piac) => {
                const colors = STATUS_COLORS[piac.status];
                const transitions = getAllowedTransitions(
                  userRole,
                  piac.status,
                );
                const isTransitioning = transitioning === piac.id;

                return (
                  <tr
                    key={piac.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {piac.nombre_actividad || (
                        <span className="italic text-gray-400">
                          Sin nombre
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                      {piac.docente_responsable || "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                      {piac.programa || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${colors.dot}`}
                        />
                        {STATUS_LABELS[piac.status]}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-center sm:table-cell">
                      {(() => {
                        const comments = comentariosByPiac[piac.id] ?? [];
                        const unresolved = countTotalUnresolved(comments);
                        if (comments.length === 0) return <span className="text-gray-300">—</span>;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              unresolved > 0
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {unresolved > 0 ? `${unresolved} pendiente${unresolved > 1 ? "s" : ""}` : "resueltos"}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">
                      {formatDate(piac.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Link
                          href={`/piac?id=${piac.id}`}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                          Ver
                        </Link>
                        {piac.status === "aprobado" && (
                          <button
                            onClick={() => handleGenerateMoodle(piac.id)}
                            disabled={generating === piac.id}
                            className="rounded-md bg-[var(--color-umce-blue)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {generating === piac.id
                              ? "Generando..."
                              : "Generar aula"}
                          </button>
                        )}
                        {transitions.map((target) =>
                          target === "devuelto" ? (
                            <button
                              key={target}
                              onClick={() => {
                                setReturnModal(piac);
                                setReturnComment("");
                              }}
                              disabled={isTransitioning}
                              className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {TRANSITION_LABELS[target]}
                            </button>
                          ) : (
                            <button
                              key={target}
                              onClick={() =>
                                handleTransition(piac, target)
                              }
                              disabled={isTransitioning}
                              className={`rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                                target === "aprobado"
                                  ? "text-green-600 hover:bg-green-50"
                                  : target === "en_revision"
                                    ? "text-yellow-600 hover:bg-yellow-50"
                                    : "text-[var(--color-umce-blue)] hover:bg-blue-50"
                              }`}
                            >
                              {isTransitioning
                                ? "..."
                                : TRANSITION_LABELS[target]}
                            </button>
                          ),
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && piacs.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          No hay PIACs con los filtros seleccionados.
        </div>
      )}

      {/* Generation result modal */}
      {generationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-green-700">
              Aula Moodle creada
            </h3>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>Secciones creadas: {generationResult.sectionsCreated}</p>
              <p>Actividades creadas: {generationResult.activitiesCreated}</p>
              <p>
                Docente inscrito:{" "}
                {generationResult.teacherEnrolled ? "Sí" : "No (verificar manualmente)"}
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setGenerationResult(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
              <a
                href={generationResult.courseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-[var(--color-umce-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Ir al aula
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Return modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              Devolver PIAC
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {returnModal.nombre_actividad || "Sin nombre"} —{" "}
              {returnModal.docente_responsable}
            </p>
            <textarea
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              placeholder="Comentarios para el docente (obligatorio)..."
              rows={4}
              className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-umce-light)] focus:ring-1 focus:ring-[var(--color-umce-light)] focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setReturnModal(null);
                  setReturnComment("");
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReturn(returnModal)}
                disabled={
                  !returnComment.trim() || transitioning === returnModal.id
                }
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {transitioning === returnModal.id
                  ? "Devolviendo..."
                  : "Devolver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
