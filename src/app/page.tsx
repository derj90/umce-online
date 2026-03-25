import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[var(--color-umce-blue)] py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            UMCE.online
          </h1>
          <p className="mt-4 text-lg text-blue-200">
            Gestión académica virtual de la Universidad Metropolitana de
            Ciencias de la Educación
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/piac"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[var(--color-umce-blue)] shadow-sm hover:bg-blue-50 transition-colors"
            >
              Formulario PIAC
            </Link>
            <a
              href="https://virtual.umce.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-blue-300 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
            >
              Ir a Moodle
            </a>
          </div>
        </div>
      </section>

      {/* Tres capas */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Tres herramientas, un ecosistema
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
            UMCE.online integra diseño instruccional, experiencia estudiantil y
            la plataforma Moodle en un solo lugar.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card
              icon="📝"
              title="Formulario PIAC"
              description="Los docentes llenan un formulario estructurado. El DI revisa y aprueba. El aula se genera automáticamente en Moodle."
              href="/piac"
              status="En desarrollo"
            />
            <Card
              icon="🎓"
              title="Portal de Estudiantes"
              description="Interfaz diseñada para estudiantes: agenda semanal, actividades pendientes, progreso por curso."
              href="#"
              status="Próximamente"
            />
            <Card
              icon="⚙️"
              title="Moodle (Backend)"
              description="Moodle sigue siendo el motor: calificaciones, actividades, datos. Solo cambia cómo se presenta."
              href="https://virtual.umce.cl"
              status="Activo"
            />
          </div>
        </div>
      </section>

      {/* Estado del proyecto */}
      <section className="border-t border-gray-200 bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Estado del proyecto
          </h2>
          <p className="mt-3 text-gray-600">
            UMCE.online está en construcción. La primera herramienta disponible
            es el formulario PIAC para diseño instruccional.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Fase 1 — En desarrollo
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({
  icon,
  title,
  description,
  href,
  status,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  status: string;
}) {
  const isExternal = href.startsWith("http");
  const isDisabled = href === "#";

  const statusColor =
    status === "Activo"
      ? "bg-green-100 text-green-800"
      : status === "En desarrollo"
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 text-gray-600";

  const content = (
    <div className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
      <span className="text-3xl">{icon}</span>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-gray-600">{description}</p>
      <div className="mt-4">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}
        >
          {status}
        </span>
      </div>
    </div>
  );

  if (isDisabled) return content;
  if (isExternal)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );

  return (
    <Link href={href}>
      {content}
    </Link>
  );
}
