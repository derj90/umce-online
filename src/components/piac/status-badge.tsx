import type { PiacStatus } from "@/lib/database.types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/piac-states";

export function StatusBadge({ status }: { status: PiacStatus }) {
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
