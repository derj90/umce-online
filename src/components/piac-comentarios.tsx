"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  PiacComentario,
  ComentarioSeccion,
  UserRol,
} from "@/lib/database.types";
import {
  filterBySeccion,
  sortComentarios,
  formatComentarioDate,
  getSeccionLabel,
} from "@/lib/piac-comentarios-utils";

// ─── Comment Badge (shows unresolved count next to section titles) ────────

export function CommentBadge({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  if (count === 0) return null;
  return (
    <button
      onClick={onClick}
      className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200 transition-colors"
      title={`${count} comentario${count > 1 ? "s" : ""} pendiente${count > 1 ? "s" : ""}`}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
      {count}
    </button>
  );
}

// ─── Add Comment Button (for DI/coordinador) ──────────────────────────────

export function AddCommentButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="ml-2 inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      title="Agregar comentario"
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Comentar
    </button>
  );
}

// ─── Section Comments Panel ───────────────────────────────────────────────

export function SectionComments({
  comentarios,
  seccion,
  nucleoOrden,
  piacId,
  userRole,
  userId,
  onUpdate,
}: {
  comentarios: PiacComentario[];
  seccion: ComentarioSeccion;
  nucleoOrden?: number;
  piacId: string;
  userRole: UserRol;
  userId: string | null;
  onUpdate: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);

  const sectionComments = sortComentarios(
    filterBySeccion(comentarios, seccion, nucleoOrden),
  );

  const canComment = userRole === "di" || userRole === "coordinador";
  const canResolve = userRole === "docente" || userRole === "coordinador";

  async function addComment() {
    if (!newText.trim() || !piacId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("piac_comentarios").insert({
      piac_id: piacId,
      user_id: userId,
      seccion,
      nucleo_orden: seccion === "nucleo" ? (nucleoOrden ?? null) : null,
      texto: newText.trim(),
      resolved: false,
      resolved_by: null,
    });
    if (error) {
      console.error("Error adding comment:", error);
    } else {
      setNewText("");
      setShowForm(false);
      onUpdate();
    }
    setSaving(false);
  }

  async function toggleResolved(comentario: PiacComentario) {
    const supabase = createClient();
    const newResolved = !comentario.resolved;
    const { error } = await supabase
      .from("piac_comentarios")
      .update({
        resolved: newResolved,
        resolved_by: newResolved ? userId : null,
        resolved_at: newResolved ? new Date().toISOString() : null,
      })
      .eq("id", comentario.id);
    if (error) {
      console.error("Error updating comment:", error);
    } else {
      onUpdate();
    }
  }

  if (sectionComments.length === 0 && !canComment) return null;

  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
          Comentarios — {getSeccionLabel(seccion, nucleoOrden)}
        </h4>
        {canComment && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-amber-700 hover:text-amber-900 font-medium"
          >
            + Agregar
          </button>
        )}
      </div>

      {sectionComments.map((c) => (
        <div
          key={c.id}
          className={`mb-2 rounded-md border p-2 text-sm ${
            c.resolved
              ? "border-gray-200 bg-gray-50 text-gray-500"
              : "border-amber-200 bg-white text-gray-800"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={c.resolved ? "line-through" : ""}>{c.texto}</p>
            {(canResolve || (canComment && c.user_id === userId)) && (
              <button
                onClick={() => toggleResolved(c)}
                className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                  c.resolved
                    ? "text-amber-600 hover:bg-amber-100"
                    : "text-green-600 hover:bg-green-100"
                }`}
                title={c.resolved ? "Reabrir" : "Marcar resuelto"}
              >
                {c.resolved ? "Reabrir" : "Resolver"}
              </button>
            )}
          </div>
          <span className="mt-1 block text-xs text-gray-400">
            {formatComentarioDate(c.created_at)}
            {c.resolved && c.resolved_at && (
              <> — resuelto {formatComentarioDate(c.resolved_at)}</>
            )}
          </span>
        </div>
      ))}

      {showForm && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Escribe tu comentario..."
            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                addComment();
              }
            }}
          />
          <button
            onClick={addComment}
            disabled={saving || !newText.trim()}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? "..." : "Enviar"}
          </button>
          <button
            onClick={() => {
              setShowForm(false);
              setNewText("");
            }}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {sectionComments.length === 0 && !showForm && (
        <p className="text-xs text-amber-600/60 italic">Sin comentarios</p>
      )}
    </div>
  );
}

// ─── Full Comments Sidebar (for the PIAC form right panel) ────────────────

export function ComentariosSidebar({
  comentarios,
  piacId,
  userRole,
  userId,
  onUpdate,
}: {
  comentarios: PiacComentario[];
  piacId: string;
  userRole: UserRol;
  userId: string | null;
  onUpdate: () => void;
}) {
  const sections: { seccion: ComentarioSeccion; nucleoOrden?: number }[] = [
    { seccion: "general" },
    { seccion: "identificacion" },
    { seccion: "modalidad" },
    { seccion: "evaluaciones" },
    { seccion: "bibliografia" },
  ];

  // Add nucleo sections dynamically based on existing comments
  const nucleoOrdenes = [
    ...new Set(
      comentarios
        .filter((c) => c.seccion === "nucleo" && c.nucleo_orden != null)
        .map((c) => c.nucleo_orden!),
    ),
  ].sort((a, b) => a - b);

  const allSections = [
    sections[0], // general
    sections[1], // identificacion
    sections[2], // modalidad
    ...nucleoOrdenes.map((n) => ({ seccion: "nucleo" as ComentarioSeccion, nucleoOrden: n })),
    sections[3], // evaluaciones
    sections[4], // bibliografia
  ];

  const unresolvedTotal = comentarios.filter((c) => !c.resolved).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Comentarios de revisión</h3>
        {unresolvedTotal > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {unresolvedTotal} pendiente{unresolvedTotal > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {allSections.map((s, i) => (
          <SectionComments
            key={`${s.seccion}-${s.nucleoOrden ?? i}`}
            comentarios={comentarios}
            seccion={s.seccion}
            nucleoOrden={s.nucleoOrden}
            piacId={piacId}
            userRole={userRole}
            userId={userId}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}
