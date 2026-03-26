# UMCE.online — Donde estamos y hacia donde va

## Contexto

La UDFV opera 5 plataformas Moodle con cerca de 1.900 cursos activos. La gestion de estos cursos — desde la planificacion instruccional hasta el seguimiento del estudiante — depende de procesos manuales y conocimiento distribuido en personas. umce.online nace para darle estructura digital a ese trabajo.

No es el unico sistema. Es parte de un ecosistema que se ha ido construyendo pieza por pieza, resolviendo problemas concretos con herramientas que ya funcionan.

## Lo que ya funciona

### Dashboard docente (dashboard.udfv.cloud) — en produccion desde febrero 2026

Panel de seguimiento academico integrado directamente en Moodle via LTI 1.3. El docente ve desde dentro de su curso:

- Participacion de cada estudiante (al dia, rezagado, sin actividad) con logica de semestre
- Mapa del curso con porcentaje de completitud por seccion y actividad
- Entregas pendientes con indicadores de urgencia
- Tiempo de dedicacion estimado (3 metodos de calculo segun disponibilidad de datos)

El estudiante ve su propio avance: actividades completadas, pendientes, proximas fechas.

Para coordinadores de programa, cruza datos de Moodle con UCampus: cohortes por ano de ingreso, estudiantes matriculados vs inscritos en Moodle, situaciones academicas, alertas de discrepancia.

v4.2.1 desplegado. 233 cursos, 11 programas. Express + LTI 1.3 + PostgreSQL + Supabase + APIs Moodle y UCampus.

### Portal umce.online — en produccion desde marzo 2026

Punto de entrada unificado que integra las 5 plataformas Moodle bajo una sola autenticacion institucional (@umce.cl):

- Catalogo de programas y cursos con estado de inscripcion
- "Mis cursos" consolidado desde las 5 plataformas
- Lector de PIAC: extrae la estructura pedagogica desde Google Drive y la compara con lo implementado en Moodle
- Curso virtual para estudiantes: vista consolidada de contenidos, grabaciones, evaluaciones y progreso
- Panel de discrepancias para disenadores instruccionales
- Motor de alertas (cron cada 6 horas): cambios en estructura, grabaciones nuevas, plazos proximos

### Moodle Monitor — en produccion desde marzo 2026

Monitoreo automatico de las 5 plataformas cada 30 minutos. Registra estado en Notion y envia alertas via Telegram cuando una plataforma no responde. 1.876 cursos supervisados.

### Asistente UDFV (Telegram) — en produccion

Bot @asistente_udfv_bot con backend Claude Sonnet. Conectado a 5 APIs Moodle para consultas en lenguaje natural: "cuantos estudiantes tiene el curso X", "quien no ha entregado la tarea Y".

## Lo que se esta construyendo

**Sistema de reconocimiento academico con credenciales verificables.** Cuatro niveles:

1. **Logros** dentro de un curso (nucleo completado, evaluacion entregada, participacion)
2. **Modulo completado** — la asignatura aprobada como unidad basica verificable
3. **Microcredencial** — conjunto de modulos que equivale a una salida intermedia (ej: diplomado)
4. **Progreso hacia grado** — vista informativa del avance en el programa completo

Las credenciales se emiten en formato Open Badges 3.0 (estandar W3C/1EdTech), firmadas con Ed25519. Verificables por terceros sin depender de la plataforma de la UMCE. El schema, los endpoints y la infraestructura de firma estan listos. Falta el otorgamiento automatico y las vistas de usuario.

Alineado con la hoja de ruta de modularizacion curricular de la UGCI (2026-2029): certificacion por modulo, microcredenciales apilables, reconocimiento de aprendizajes previos.

## Rol de la IA

La IA tiene limites claros en todos estos sistemas: lee datos, detecta patrones, presenta informacion, genera alertas. No crea contenido, no modifica calificaciones, no toma decisiones pedagogicas. Permite que un equipo de 2-3 personas tenga visibilidad sobre 1.900 cursos en 5 plataformas — tarea imposible manualmente.

## Stack compartido

Todo el ecosistema usa el mismo stack: Express, PostgreSQL (Supabase self-hosted), APIs REST de Moodle, Docker en VPS institucional. Sin dependencias de proveedores cerrados. Cada pieza se comunica con las demas via APIs internas.

## Que sigue

- Integracion con Acompana UMCE (datos de acompanamiento estudiantil)
- Otorgamiento automatico de insignias basado en datos reales de Moodle
- Vistas de logros para estudiantes y desarrollo academico para docentes
- Convergencia del dashboard docente con el curso virtual de umce.online
- Rediseno visual con identidad institucional
