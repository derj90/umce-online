"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/piac-states";
import { filterPiacs, formatDate, getUniqueSemestres } from "@/lib/piac-list-utils";
import type { Piac, PiacStatus } from "@/lib/database.types";

const STATUS_OPTIONS: { value: "" | PiacStatus; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "borrador", label: "Borrador" },
  { value: "enviado", label: "Enviado" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobado", label: "Aprobado" },
  { value: "devuelto", label: "Devuelto" },
];

export function PiacList() {
  const [piacs, setPiacs] = useState<Piac[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"" | PiacStatus>("");
  const [filterSemestre, setFilterSemestre] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadPiacs() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Debes iniciar sesión para ver tus PIACs.");
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("piacs")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (fetchError) {
      setError("Error al cargar PIACs: " + fetchError.message);
    } else {
      setPiacs(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPiacs();
  }, []);

  async function handleDelete(piac: Piac) {
    if (piac.status !== "borrador") return;
    if (!confirm(`¿Eliminar "${piac.nombre_actividad || "Sin nombre"}"?`))
      return;

    setDeleting(piac.id);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("piacs")
      .delete()
      .eq("id", piac.id);

    if (deleteError) {
      alert("Error al eliminar: " + deleteError.message);
    } else {
      setPiacs((prev) => prev.filter((p) => p.id !== piac.id));
    }
    setDeleting(null);
  }

  const filtered = filterPiacs(piacs, filterStatus, filterSemestre);
  const semestres = getUniqueSemestres(piacs);

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando PIACs...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (piacs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
        <h3 className="text-base font-medium text-gray-900">
          No tienes PIACs todavía
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Crea tu primer Plan Integral de Actividad Curricular.
        </p>
        <Link
          href="/piac"
          className="mt-4 inline-block rounded-lg bg-[var(--color-umce-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-umce-blue)]/90"
        >
          Crear PIAC
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as "" | PiacStatus)
          }
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[var(--color-umce-light)] focus:ring-1 focus:ring-[var(--color-umce-light)] focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

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

        <span className="ml-auto self-center text-sm text-gray-500">
          {filtered.length} de {piacs.length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Nombre
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Programa
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-gray-700 md:table-cell">
                Semestre
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Estado
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-gray-700 sm:table-cell">
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
              const isDeleting = deleting === piac.id;

              return (
                <tr
                  key={piac.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {piac.nombre_actividad || (
                      <span className="italic text-gray-400">Sin nombre</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {piac.programa || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {piac.semestre || "—"}
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
                  <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                    {formatDate(piac.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {piac.status === "borrador" ? (
                        <Link
                          href={`/piac?id=${piac.id}`}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-[var(--color-umce-blue)] hover:bg-blue-50"
                        >
                          Editar
                        </Link>
                      ) : (
                        <Link
                          href={`/piac?id=${piac.id}`}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                          Ver
                        </Link>
                      )}
                      {piac.status === "borrador" && (
                        <button
                          onClick={() => handleDelete(piac)}
                          disabled={isDeleting}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {isDeleting ? "..." : "Eliminar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && piacs.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          No hay PIACs con los filtros seleccionados.
        </div>
      )}
    </div>
  );
}
