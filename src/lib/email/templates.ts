import type { PiacStatus } from "@/lib/database.types";

export type NotificationType = "enviado" | "aprobado" | "devuelto";

export interface TemplateData {
  piacNombre: string;
  docenteNombre: string;
  programa: string;
  piacUrl: string;
  comentario?: string;
}

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
<div style="background:#003366;padding:20px 24px">
<span style="color:#fff;font-size:18px;font-weight:600">UMCE Online</span>
</div>
<div style="padding:24px">${body}</div>
<div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af">
UMCE Online — Universidad Metropolitana de Ciencias de la Educación
</div>
</div>
</body>
</html>`;
}

export function enviadoTemplate(d: TemplateData): { subject: string; html: string } {
  return {
    subject: `Nuevo PIAC enviado: ${d.piacNombre}`,
    html: layout(`
<h2 style="margin:0 0 12px;font-size:18px;color:#111827">Nuevo PIAC para revisión</h2>
<p style="margin:0 0 8px;color:#374151;font-size:14px">
El docente <strong>${d.docenteNombre}</strong> ha enviado su PIAC para revisión.
</p>
<table style="width:100%;margin:16px 0;font-size:14px;color:#374151">
<tr><td style="padding:4px 0;font-weight:600">Actividad:</td><td style="padding:4px 0">${d.piacNombre}</td></tr>
<tr><td style="padding:4px 0;font-weight:600">Programa:</td><td style="padding:4px 0">${d.programa}</td></tr>
</table>
<a href="${d.piacUrl}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#003366;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">
Ver PIAC
</a>`),
  };
}

export function aprobadoTemplate(d: TemplateData): { subject: string; html: string } {
  return {
    subject: `PIAC aprobado: ${d.piacNombre}`,
    html: layout(`
<h2 style="margin:0 0 12px;font-size:18px;color:#059669">PIAC Aprobado</h2>
<p style="margin:0 0 8px;color:#374151;font-size:14px">
Tu PIAC ha sido <strong style="color:#059669">aprobado</strong> por la Dirección de Innovación.
</p>
<table style="width:100%;margin:16px 0;font-size:14px;color:#374151">
<tr><td style="padding:4px 0;font-weight:600">Actividad:</td><td style="padding:4px 0">${d.piacNombre}</td></tr>
<tr><td style="padding:4px 0;font-weight:600">Programa:</td><td style="padding:4px 0">${d.programa}</td></tr>
</table>
<a href="${d.piacUrl}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">
Ver PIAC aprobado
</a>`),
  };
}

export function devueltoTemplate(d: TemplateData): { subject: string; html: string } {
  const commentBlock = d.comentario
    ? `<div style="margin:16px 0;padding:12px 16px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:14px;color:#92400e">
<strong>Comentario de la DI:</strong><br>${d.comentario.replace(/\n/g, "<br>")}
</div>`
    : "";

  return {
    subject: `PIAC devuelto: ${d.piacNombre}`,
    html: layout(`
<h2 style="margin:0 0 12px;font-size:18px;color:#dc2626">PIAC Devuelto</h2>
<p style="margin:0 0 8px;color:#374151;font-size:14px">
Tu PIAC ha sido <strong style="color:#dc2626">devuelto</strong> con observaciones para corrección.
</p>
<table style="width:100%;margin:16px 0;font-size:14px;color:#374151">
<tr><td style="padding:4px 0;font-weight:600">Actividad:</td><td style="padding:4px 0">${d.piacNombre}</td></tr>
<tr><td style="padding:4px 0;font-weight:600">Programa:</td><td style="padding:4px 0">${d.programa}</td></tr>
</table>
${commentBlock}
<a href="${d.piacUrl}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">
Revisar y corregir
</a>`),
  };
}

export function buildTemplate(
  type: NotificationType,
  data: TemplateData,
): { subject: string; html: string } {
  switch (type) {
    case "enviado":
      return enviadoTemplate(data);
    case "aprobado":
      return aprobadoTemplate(data);
    case "devuelto":
      return devueltoTemplate(data);
  }
}

/** Maps a PIAC status to its notification type, if any. */
export function statusToNotificationType(
  status: PiacStatus,
): NotificationType | null {
  if (status === "enviado") return "enviado";
  if (status === "aprobado") return "aprobado";
  if (status === "devuelto") return "devuelto";
  return null;
}
