import { createClient } from "@/lib/supabase/server";
import { buildCoursePlan } from "@/lib/moodle/generator-utils";
import { generateMoodleCourse } from "@/lib/moodle/generator";
import type { PiacNucleo, PiacEvaluacion } from "@/lib/database.types";

export async function POST(request: Request) {
  try {
    const { piacId } = (await request.json()) as { piacId?: string };

    if (!piacId) {
      return Response.json({ error: "piacId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify caller is DI or coordinador
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.rol !== "di" && profile.rol !== "coordinador")) {
      return Response.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Fetch the approved PIAC + relations
    const { data: piac, error: piacError } = await supabase
      .from("piacs")
      .select("*")
      .eq("id", piacId)
      .single();

    if (piacError || !piac) {
      return Response.json({ error: "PIAC no encontrado" }, { status: 404 });
    }

    if (piac.status !== "aprobado") {
      return Response.json(
        { error: "Solo se pueden generar aulas de PIACs aprobados" },
        { status: 400 },
      );
    }

    const [{ data: nucleos }, { data: evaluaciones }] = await Promise.all([
      supabase
        .from("piac_nucleos")
        .select("*")
        .eq("piac_id", piacId)
        .order("orden"),
      supabase
        .from("piac_evaluaciones")
        .select("*")
        .eq("piac_id", piacId),
    ]);

    if (!nucleos?.length) {
      return Response.json(
        { error: "El PIAC no tiene núcleos definidos" },
        { status: 400 },
      );
    }

    // Build the plan
    const plan = buildCoursePlan({
      piacId: piac.id,
      nombreActividad: piac.nombre_actividad,
      programa: piac.programa,
      semestre: piac.semestre,
      docenteResponsable: piac.docente_responsable,
      nucleos: nucleos as PiacNucleo[],
      evaluaciones: (evaluaciones ?? []) as PiacEvaluacion[],
    });

    // Execute generation
    const result = await generateMoodleCourse(plan, piac.email_docente);

    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return Response.json({ error: message }, { status: 500 });
  }
}
