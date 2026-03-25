import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero with gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-umce-blue)] via-[#1e3a5f] to-[#0f2640] py-24 text-white sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            Universidad Metropolitana de Ciencias de la Educación
          </p>
          <h1 className="mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            UMCE
            <span className="text-blue-400">.online</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-200">
            Plataforma de gestión académica virtual. Diseño instruccional,
            experiencia estudiantil y Moodle integrados en un solo ecosistema.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/piac"
              className="inline-flex w-full items-center justify-center rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-[var(--color-umce-blue)] shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl sm:w-auto"
            >
              Formulario PIAC
            </Link>
            <a
              href="https://virtual.umce.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-lg border border-blue-400/40 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:border-blue-300 hover:bg-white/10 sm:w-auto"
            >
              Ir a Moodle
            </a>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Cómo funciona
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
            Un flujo simple que conecta diseño instruccional con tu aula virtual.
          </p>

          <div className="relative mt-14">
            {/* Connector line (desktop) */}
            <div className="absolute top-8 right-[16.67%] left-[16.67%] hidden h-0.5 bg-gray-200 md:block" />

            <div className="grid gap-10 md:grid-cols-3 md:gap-8">
              <Step
                number={1}
                title="Diseña tu PIAC"
                description="Completa el formulario con los núcleos temáticos, evaluaciones y estructura de tu asignatura."
              />
              <Step
                number={2}
                title="Revisión DI"
                description="El equipo de Diseño Instruccional revisa, sugiere ajustes y aprueba la planificación."
              />
              <Step
                number={3}
                title="Aula lista"
                description="El PIAC aprobado genera la estructura de tu curso en Moodle automáticamente."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tres herramientas */}
      <section className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Tres herramientas, un ecosistema
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
            UMCE.online integra diseño instruccional, experiencia estudiantil y
            la plataforma Moodle en un solo lugar.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card
              title="Formulario PIAC"
              description="Los docentes llenan un formulario estructurado. El DI revisa y aprueba. El aula se genera automáticamente en Moodle."
              href="/piac"
              status="En desarrollo"
            />
            <Card
              title="Portal de Estudiantes"
              description="Interfaz diseñada para estudiantes: agenda semanal, actividades pendientes, progreso por curso."
              href="#"
              status="Próximamente"
            />
            <Card
              title="Moodle (Backend)"
              description="Moodle sigue siendo el motor: calificaciones, actividades, datos. Solo cambia cómo se presenta."
              href="https://virtual.umce.cl"
              status="Activo"
            />
          </div>
        </div>
      </section>

      {/* Estado del proyecto */}
      <section className="py-16">
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

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-umce-blue)] text-lg font-bold text-white shadow-md">
        {number}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {description}
      </p>
    </div>
  );
}

function Card({
  title,
  description,
  href,
  status,
}: {
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
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
