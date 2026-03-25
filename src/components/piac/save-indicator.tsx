import type { SaveStatus } from "@/types/piac";

export function SaveIndicator({ status }: { status: SaveStatus }) {
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
