import { createClient } from "@/lib/supabase/server";
import { notifyStatusChange } from "@/lib/email/notify";
import type { PiacStatus } from "@/lib/database.types";

export async function POST(request: Request) {
  try {
    const { piacId, newStatus, comentario } = (await request.json()) as {
      piacId?: string;
      newStatus?: PiacStatus;
      comentario?: string;
    };

    if (!piacId || !newStatus) {
      return Response.json(
        { error: "piacId and newStatus are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify caller is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    // Fetch the PIAC
    const { data: piac, error: piacError } = await supabase
      .from("piacs")
      .select("id, nombre_actividad, docente_responsable, programa, email_docente, user_id")
      .eq("id", piacId)
      .single();

    if (piacError || !piac) {
      return Response.json({ error: "PIAC no encontrado" }, { status: 404 });
    }

    const result = await notifyStatusChange(supabase, piac, newStatus, comentario);

    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[api/notify]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
