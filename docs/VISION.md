# UMCE.online — Donde estamos y hacia donde va

## Contexto

La UDFV opera 5 plataformas Moodle con cerca de 1.900 cursos activos. La gestion de estos cursos — desde la planificacion instruccional hasta el seguimiento del estudiante — depende de procesos manuales y conocimiento distribuido en personas. umce.online nace para darle estructura digital a ese trabajo.

## Lo que existe hoy (marzo 2026)

- **Portal unificado** en umce.online que integra las 5 plataformas Moodle bajo una sola autenticacion institucional (@umce.cl)
- **Lector de PIAC** que extrae automaticamente la estructura pedagogica desde Google Drive y la compara con lo implementado en Moodle
- **Curso virtual** para estudiantes: vista consolidada de contenidos, grabaciones, evaluaciones y progreso de un curso — informacion que en Moodle esta dispersa en multiples pantallas
- **Panel de discrepancias** para disenadores instruccionales: diferencias entre lo planificado y lo implementado, detectadas automaticamente
- **Motor de alertas** (cron cada 6 horas): cambios en estructura de cursos, grabaciones nuevas, plazos proximos

Stack: Express, PostgreSQL (Supabase), APIs REST de Moodle, Google Drive API. Todo open source, desplegado en VPS institucional con Docker.

## Lo que se esta construyendo

**Sistema de reconocimiento academico con credenciales verificables.** Cuatro niveles:

1. **Logros** dentro de un curso (nucleo completado, evaluacion entregada, participacion)
2. **Modulo completado** — la asignatura aprobada como unidad basica verificable
3. **Microcredencial** — conjunto de modulos que equivale a una salida intermedia (ej: diplomado)
4. **Progreso hacia grado** — vista informativa del avance en el programa completo

Las credenciales se emiten en formato Open Badges 3.0 (estandar W3C/1EdTech), firmadas con Ed25519. Esto significa que son verificables por terceros — empleadores, otras universidades, organismos de acreditacion — sin depender de la plataforma de la UMCE. El schema, los endpoints y la infraestructura de firma estan listos. Falta el otorgamiento automatico y las vistas de usuario.

Este sistema esta alineado con la hoja de ruta de modularizacion curricular de la UGCI (2026-2029): certificacion por modulo, microcredenciales apilables, y eventualmente reconocimiento de aprendizajes previos.

## Rol de la IA

La IA en umce.online tiene limites claros: lee documentos, detecta discrepancias, presenta informacion al usuario y genera alertas. No crea contenido en Moodle, no modifica calificaciones, no toma decisiones pedagogicas. Permite que un equipo reducido tenga visibilidad sobre 1.900 cursos — tarea imposible manualmente.

## Que sigue

- Integracion con el sistema Acompana UMCE (datos de acompanamiento estudiantil, lectura)
- Otorgamiento automatico de insignias basado en datos reales de Moodle
- Vista "Mis logros" para estudiantes y "Mi desarrollo academico" para docentes (certificacion TIC, Ruta Formativa IA)
- Rediseno visual con identidad institucional
