import type { SupabaseClient } from "@supabase/supabase-js";
import type { PiacStatus } from "@/lib/database.types";
import { statusToNotificationType, buildTemplate } from "./templates";
import type { TemplateData } from "./templates";
import { sendEmail } from "./client";

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin.replace(
      "supabase.",
      "",
    )
  : "https://umce.online";

/** Build the public PIAC URL. */
export function buildPiacUrl(piacId: string): string {
  return `${BASE_URL}/piac?id=${piacId}`;
}

/**
 * Resolve recipient emails for a notification.
 * - enviado → all DI + coordinador profiles
 * - aprobado/devuelto → the PIAC owner (docente)
 */
export async function getRecipients(
  supabase: SupabaseClient,
  newStatus: PiacStatus,
  piac: { user_id: string | null; email_docente: string },
): Promise<string[]> {
  if (newStatus === "enviado") {
    // Notify DI and coordinador users
    const { data: reviewers } = await supabase
      .from("profiles")
      .select("email")
      .in("rol", ["di", "coordinador"]);
    return (reviewers ?? []).map((r) => r.email).filter(Boolean);
  }

  // aprobado / devuelto → notify the docente owner
  if (piac.email_docente) return [piac.email_docente];

  // Fallback: look up email from profiles
  if (piac.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", piac.user_id)
      .single();
    if (profile?.email) return [profile.email];
  }

  return [];
}

/**
 * Send notification emails for a PIAC status change.
 * Safe to call for any transition — returns early if no notification is needed.
 */
export async function notifyStatusChange(
  supabase: SupabaseClient,
  piac: {
    id: string;
    nombre_actividad: string;
    docente_responsable: string;
    programa: string;
    email_docente: string;
    user_id: string | null;
  },
  newStatus: PiacStatus,
  comentario?: string,
): Promise<{ sent: number; skipped: boolean }> {
  const type = statusToNotificationType(newStatus);
  if (!type) return { sent: 0, skipped: true };

  const recipients = await getRecipients(supabase, newStatus, piac);
  if (recipients.length === 0) return { sent: 0, skipped: true };

  const templateData: TemplateData = {
    piacNombre: piac.nombre_actividad || "Sin nombre",
    docenteNombre: piac.docente_responsable || "Docente",
    programa: piac.programa || "—",
    piacUrl: buildPiacUrl(piac.id),
    comentario,
  };

  const { subject, html } = buildTemplate(type, templateData);

  let sent = 0;
  for (const email of recipients) {
    try {
      await sendEmail(email, subject, html);
      sent++;
    } catch (err) {
      console.error(`[email] Failed to send to ${email}:`, err);
    }
  }

  return { sent, skipped: false };
}
