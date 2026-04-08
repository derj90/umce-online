# Arquitectura de Capas del Sistema UMCE.online

**Fecha**: 2026-04-07
**Version**: 1.0
**Basado en**: server.js (~6400 lineas), docs 01-08, CURSO-VIRTUAL-SPEC.md, memorias activas
**Proposito**: Documento maestro que nombra cada capa, define responsabilidades, establece reglas de sincronizacion y resuelve conflictos entre fuentes de datos.

---

## 1. Las 5 capas del sistema

El sistema UMCE.online tiene 5 capas con nombres que el equipo puede usar en conversacion:

| # | Nombre de la capa | Alias corto | Responsabilidad |
|---|-------------------|-------------|-----------------|
| 1 | **Registro Academico** | RA | Fuente de verdad institucional: matriculas, mallas, docentes asignados, notas oficiales, calendario academico |
| 2 | **Motor de Contenido** | MC | Fuente de verdad del curso: actividades, recursos, foros, evaluaciones, calificaciones, completion, grabaciones |
| 3 | **Inteligencia Curricular** | IC | Procesamiento y cruce: parseo del PIAC, snapshot de Moodle, matching, configuracion DI, cache de datos dinamicos |
| 4 | **Experiencia del Estudiante** | EE | Presentacion: lo que ve el estudiante, el docente y el DI en UMCE.online |
| 5 | **Observatorio de Calidad** | OC | Analisis: QA preventivo, QA de implementacion, QA operacional, auditor nocturno, dashboard docente, xAPI/LRS |

### Que vive en cada capa

**Capa 1 — Registro Academico (RA)**
- UCampus (sistema institucional, fuera de nuestro control)
- Replica en Supabase: schema `ucampus` (17 tablas, sync 2x/dia via cron VPS)
- Tablas clave: `personas`, `cursos_dictados`, `cursos_inscritos`, `ramos`, `carreras_alumnos`, `horarios`
- EdX/EOL (cursos.umce.cl) — sin integracion actual, enlace unidireccional futuro

**Capa 2 — Motor de Contenido (MC)**
- Moodle (5 instancias): evirtual, practica, virtual, pregrado, postgrado
- Google Drive: documentos PIAC (.docx) compartidos entre david.reyes_j@ y udfv@
- Cada plataforma Moodle tiene su token REST de lectura en `.env`
- REGLA: La IA nunca crea ni modifica nada en Moodle ni en Drive

**Capa 3 — Inteligencia Curricular (IC)**
- Server Express (server.js, puerto 3000, VPS 82.29.61.165)
- Supabase Self-Hosted (supabase.udfv.cloud, schema `portal`)
- Tablas de procesamiento: `piac_links`, `piac_parsed`, `moodle_snapshots`, `matching_results`, `discrepancies`
- Tablas de configuracion DI: `curso_virtual_config`, `curso_virtual_bibliografia`, `recursos_adicionales`, `institutional_defaults`
- Tablas de cache: `cache_recordings`, `cache_calendar` (implementadas), `cache_completions`, `cache_grades`, `cache_submissions` (definidas en schema, pendientes de cron)
- Tabla de mapeo: `user_moodle_mapping` (email UMCE <-> userId Moodle por plataforma)

**Capa 4 — Experiencia del Estudiante (EE)**
- Curso Virtual: `/curso-virtual/:linkId` (vista estudiante/docente)
- Demo: `/demo` (muestra para Mesa 1)
- Panel PIAC: `/piac.html` (herramienta del DI)
- Planificador: `/virtualizacion/planificador` (herramienta de diseno)
- Sistema QA: `/virtualizacion/qa` (evaluacion de calidad)
- Mis cursos: `/mis-cursos.html` (listado de cursos del usuario)
- Landing publica: `/api/curso-landing/:linkId` (vista sin auth)

**Capa 5 — Observatorio de Calidad (OC)**
- QA Preventivo: valida planificacion antes de implementacion (8 checks, endpoint `POST /api/qa/preventivo`)
- QA de Implementacion: cruza PIAC vs Moodle con 77 indicadores D1-D6 (`POST /api/qa/:linkId/implementacion`)
- QA Operacional / Auditor Nocturno: analisis automatico de salud de cursos (conceptual, Python cron)
- Dashboard Docente: https://dashboard.udfv.cloud (servicio independiente)
- Ralph LRS: https://lrs.udfv.cloud (Learning Record Store, xAPI)
- Moodle Monitor: cron cada 30 min, Notion DB + alertas Telegram (1,876 cursos)

---

## 2. Diagrama de capas (ASCII)

```
                    CAPA 1 — REGISTRO ACADEMICO (RA)
                    ================================
                    [ UCampus ]         [ EdX/EOL ]
                         |                  (sin integracion)
                         | sync 2x/dia
                         v
                    [ Supabase schema ucampus ]
                         |
                         | lectura
                         v
          +--------------+------------------------------------------+
          |                                                         |
          |        CAPA 3 — INTELIGENCIA CURRICULAR (IC)            |
          |        =========================================        |
          |                                                         |
CAPA 2    |   [ PIAC Parser ]  [ Matching Engine ]  [ Config DI ]   |
=======   |        ^                  ^                    |        |
          |        |                  |                    |        |
[ Google  |---->  parse            match              publicar      |
  Drive ] |   (mammoth+LLM)    (deterministico)          |        |
          |        |                  |                    v        |
[ Moodle  |---->  snapshot         discrepancias    curso_virtual   |
  x5    ] |   (REST API)              |              _config       |
          |        |                  v                    |        |
          |        v            [ Supabase schema portal ]          |
          |   [ Cache cron ]                                        |
          |   recordings, calendar, completion*, grades*             |
          |                                                         |
          +---------+-------------------------------------------+---+
                    |                                           |
                    | JSON consolidado                          | alertas
                    v                                           v
          CAPA 4 — EXPERIENCIA DEL ESTUDIANTE (EE)    CAPA 5 — OBSERVATORIO
          =========================================    DE CALIDAD (OC)
          [ Curso Virtual ]  [ Panel PIAC ]            ====================
          [ Planificador  ]  [ Mis Cursos ]            [ QA Preventivo   ]
          [ Landing       ]  [ Demo       ]            [ QA Implementac. ]
                                                       [ Auditor PA.xx   ]
                                                       [ Dashboard       ]
                                                       [ Ralph LRS       ]


LEYENDA DE FLECHAS:
  ────>   Lectura unidireccional (solo lee, nunca escribe)
  <---->  Bidireccional (lee y escribe)
  - - ->  Planificada, no implementada
  [  * ]  Schema definido, cron pendiente
```

### Mapa de lectura/escritura entre sistemas

```
UCampus ──lectura──> Supabase ucampus ──lectura──> IC (server.js)
Google Drive ──lectura──> IC (PIAC Parser, mammoth + LLM)
Moodle x5 ──lectura──> IC (snapshot, completion, grades, recordings, calendar, foros)
Moodle x5 <──escritura── IC (SOLO: mod_forum_add_discussion_post — responder foro)
IC (Supabase portal) ──lectura──> EE (endpoints JSON)
IC (Supabase portal) ──lectura──> OC (QA engine, auditor)
EE (Panel PIAC) ──escritura──> IC (config, bibliografia, recursos, publicacion)
EE (Curso Virtual) ──escritura──> IC (refresh personal, responder foro)
```

---

## 3. Nomenclatura de los flujos

Cada flujo de datos tiene un nombre para que el equipo pueda referirse a el sin ambiguedad:

| Nombre del flujo | Que hace | Trigger | Frecuencia | Estado |
|------------------|----------|---------|------------|--------|
| **Sync UCampus** | UCampus REST API -> Supabase schema `ucampus` (17 tablas) | Cron VPS | 2x/dia | Implementado |
| **Parse PIAC** | Google Drive -> mammoth -> Claude LLM -> `piac_parsed` (JSON) | DI manual ("Comparar" o "Solo leer PIAC") | Bajo demanda | Implementado |
| **Snapshot Moodle** | `core_course_get_contents` + 4 APIs mas -> `moodle_snapshots` | DI manual ("Comparar" o "Solo leer Moodle") | Bajo demanda | Implementado |
| **Matching** | `piac_parsed` vs `moodle_snapshots` -> `matching_results` + `discrepancies` | DI manual (parte de "Comparar") | Bajo demanda | Implementado |
| **Visado DI** | DI configura visibilidad/ocultamiento de actividades en `actividades_config` | DI manual (panel config, pestana Contenido) | Bajo demanda | Implementado |
| **Publicacion** | Toggle `publicado=true` en `curso_virtual_config` | DI manual (toggle en panel) | Bajo demanda | Implementado |
| **Refresh Personal** | Moodle live -> completion + grades + recordings + calendar del usuario | Estudiante abre curso / boton "Actualizar" (throttle 5 min) | Por request | Implementado (live, no cache) |
| **Cache Recordings** | Cron lee `mod_data` de Moodle -> `cache_recordings` | Cron VPS (recording_pipeline.py) | Cada 6h (objetivo) | Parcialmente implementado |
| **Cache Calendar** | Cron lee `core_calendar_get_calendar_events` -> `cache_calendar` | Cron VPS | Cada 6h (objetivo) | Parcialmente implementado |
| **Cache Completion** | Cron lee completion por usuario/curso -> `cache_completions` | Cron VPS | Cada 15 min (horario clase) / 1h (resto) | Schema definido, cron pendiente |
| **Cache Grades** | Cron lee `gradereport_user_get_grade_items` -> `cache_grades` | Cron VPS | Cada 1h | Schema definido, cron pendiente |
| **Cache Submissions** | Cron lee `mod_assign_get_submissions` -> `cache_submissions` | Cron VPS | Cada 30 min | Schema definido, cron pendiente |
| **QA Preventivo** | JSON del planificador -> 8 checks automaticos -> semaforo | DI manual (planificador) | Bajo demanda | Definido, endpoint pendiente |
| **QA Implementacion** | PIAC + Snapshot -> 77 indicadores D1-D6 -> scores por dimension | DI manual o cron semanal | Bajo demanda / semanal | Definido, endpoint pendiente |
| **QA Operacional** | Auditor nocturno: salud + coherencia + riesgo + MOCA | Cron nocturno | Diario nocturno | Conceptual |
| **Consolidacion Curso** | Merge de 12 fuentes en un solo JSON para el estudiante | Estudiante abre `GET /api/curso-virtual/:linkId` | Por request | Implementado |
| **xAPI Statement** | Evento en curso virtual -> `POST /xAPI/statements` -> Ralph LRS | Accion del estudiante | Tiempo real (futuro) | No implementado |

---

## 4. Reglas de sincronizacion

### 4.1 Matriz de sincronizacion entre pares de sistemas

| Par de sistemas | Direccion | Frecuencia | Trigger | Latencia | Conflictos |
|-----------------|-----------|------------|---------|----------|------------|
| UCampus -> Supabase ucampus | Unidireccional | 2x/dia | Cron VPS | 0-12h | UCampus siempre gana (fuente de verdad institucional) |
| Google Drive -> piac_parsed | Unidireccional | Bajo demanda | DI clickea "Comparar" o "Solo leer PIAC" | 10-30 seg | Cada parse crea nueva version; historial se conserva |
| Moodle -> moodle_snapshots | Unidireccional | Bajo demanda | DI clickea "Comparar" o "Solo leer Moodle" | 5-15 seg | Cada snapshot crea nueva version; historial se conserva |
| piac_parsed + moodle_snapshots -> matching_results | Derivada | Bajo demanda | Parte de "Comparar" | 2-5 seg | El matching es deterministico; se regenera completo |
| DI -> curso_virtual_config | Unidireccional | Bajo demanda | DI guarda en panel config | Inmediato | DI es dueno; se aplica sin conflicto |
| Moodle live -> datos personales (completion, grades) | Unidireccional | Por request | Estudiante abre el curso | 2-5 seg (call Moodle) | Moodle es fuente de verdad; se lee en tiempo real |
| Moodle -> cache_recordings | Unidireccional | Cada 6h | Cron VPS | 0-6h | Cron sobrescribe; Moodle siempre gana |
| Moodle -> cache_calendar | Unidireccional | Cada 6h | Cron VPS | 0-6h | Cron sobrescribe; Moodle siempre gana |
| Moodle -> cache_completions | Unidireccional | 15 min - 1h | Cron VPS (pendiente) | 0-1h | Cron sobrescribe; Moodle siempre gana |
| Moodle -> cache_grades | Unidireccional | Cada 1h | Cron VPS (pendiente) | 0-1h | Cron sobrescribe; Moodle siempre gana |
| Curso Virtual -> Moodle (responder foro) | Unidireccional (escritura) | Tiempo real | Estudiante responde foro | Inmediato | Escribe directo en Moodle via `mod_forum_add_discussion_post` |

### 4.2 Escenarios concretos de sincronizacion

**Escenario 1: Docente cambia fecha de entrega en Moodle**
```
Moodle: cambio inmediato (el docente lo hizo directamente)
Supabase (moodle_snapshots): NO se actualiza automaticamente
UMCE.online (curso virtual): muestra la fecha del ULTIMO SNAPSHOT, que esta desactualizada
Para que se refleje: el DI debe ejecutar "Solo leer Moodle" (POST /api/piac/:linkId/snapshot)
Latencia real: indefinida hasta que el DI re-snapshottee

ESTADO ACTUAL: manual, no automatico
ESTADO OBJETIVO: cron toma snapshot diario de cursos publicados -> max 24h de latencia
```

**Escenario 2: DI oculta actividad en panel PIAC**
```
DI: clickea toggle de visibilidad en pestana "Contenido" del panel config
Supabase: actividades_config[cmid].visible = false (inmediato, via PUT /api/piac/:linkId/config)
UMCE.online (curso virtual): el filtro isVisadoVisible() excluye la actividad en la proxima carga
Latencia: inmediata (proximo request del estudiante)
Moodle: NO se modifica (la actividad sigue visible en Moodle directo)

ESTADO ACTUAL: implementado y funcional
```

**Escenario 3: Estudiante entrega tarea en Moodle**
```
Moodle: estado de entrega cambia a "submitted" inmediato
Supabase (cache_submissions): NO se actualiza (cron pendiente de implementacion)
UMCE.online (completion): se lee en TIEMPO REAL via fetchCompletion() cuando el estudiante abre el curso
UMCE.online (grades): si la tarea ya fue calificada, se lee via fetchGrades()
Dashboard docente: depende del cron de Moodle Monitor (cada 30 min)
LRS (xAPI): NO se registra (integracion xAPI no implementada)
Latencia para el estudiante: inmediata si recarga el curso (call Moodle live, throttle 5 min)
Latencia para metricas agregadas: indefinida (cron de cache no implementado)

ESTADO ACTUAL: lectura live funciona; cache y xAPI pendientes
```

**Escenario 4: UCampus dice que el estudiante se retiro**
```
UCampus: actualiza estado del estudiante
Supabase ucampus: refleja el cambio en el proximo sync (0-12h)
UMCE.online (curso virtual): el estudiante SIGUE pudiendo acceder
  (auth es por @umce.cl, no por inscripcion UCampus)
  El endpoint NO valida inscripcion UCampus antes de mostrar contenido
Latencia: no aplica — el retiro no bloquea acceso actualmente

ESTADO ACTUAL: sin validacion de inscripcion
ESTADO OBJETIVO: verificar en cursos_inscritos si el estudiante sigue matriculado;
  si se retiro, mostrar banner informativo pero NO bloquear contenido
```

**Escenario 5: El PIAC cambia en Drive (docente entrega version revisada)**
```
Google Drive: archivo .docx actualizado (misma URL)
Supabase (piac_parsed): NO se actualiza automaticamente
UMCE.online (curso virtual): sigue mostrando la version anterior del PIAC
Para que se refleje: DI ejecuta "Comparar" o "Solo leer PIAC"
  -> nueva version en piac_parsed (version N+1)
  -> si se re-corre matching, se detectan nuevas discrepancias
Latencia real: indefinida hasta intervencion del DI

ESTADO ACTUAL: manual, intencionalmente manual (el DI controla cuando actualizar)
```

**Escenario 6: Moodle API no responde (timeout)**
```
Datos estructurales (contenido del curso): se sirven desde snapshot cacheado en Supabase -> nunca fallan
Datos dinamicos (completion, grades): se sirven desde cache si existe
  Si cache existe pero expirado: mostrar datos viejos + indicador "Actualizado hace X min"
  Si cache no existe: mostrar curso sin datos personales + mensaje "Cargando progresion..."
  Retry asincrono en background
Zoom link: si LTI no responde -> "Enlace de clase no disponible"

ESTADO ACTUAL: fallback estructural funciona; fallback de cache depende de tablas pendientes
```

---

## 5. Tabla maestra: Accion -> Efecto en cada capa

### Acciones del Estudiante

| Accion | Moodle (MC) | UCampus (RA) | Supabase portal (IC) | UMCE.online (EE) | LRS (OC) |
|--------|-------------|--------------|----------------------|-------------------|----------|
| Abre el curso virtual | -- | -- | Lectura: piac_parsed, snapshot, config, cache. Escritura: user_moodle_mapping (cache email->userId) | Renderiza JSON consolidado de 12 fuentes | -- (futuro: xAPI "accessed") |
| Completa una actividad en Moodle | completion_status cambia | -- | Cache expira (si cron activo, se actualiza en 15-60 min) | Visible en proximo refresh (live call o cache) | -- (futuro: xAPI "completed") |
| Entrega tarea en Moodle | submission status = submitted | -- | Cache expira (cron pendiente) | Visible en proximo refresh (live call) | -- (futuro: xAPI "submitted") |
| Responde foro desde UMCE.online | Post creado via mod_forum_add_discussion_post | -- | -- | Confirmacion inmediata | -- (futuro: xAPI "commented") |
| Clickea "Actualizar" (refresh) | Se llaman completion + grades APIs | -- | user_moodle_mapping leido | Datos personales actualizados (throttle 5 min) | -- |
| Se retira del ramo | -- | Estado cambia en UCampus | Reflejado en ucampus.cursos_inscritos (0-12h) | Sin efecto (no valida inscripcion actualmente) | -- |

### Acciones del Disenador Instruccional (DI)

| Accion | Moodle (MC) | UCampus (RA) | Supabase portal (IC) | UMCE.online (EE) | LRS (OC) |
|--------|-------------|--------------|----------------------|-------------------|----------|
| Crea vinculo PIAC-Moodle | Verificacion lectura (core_course_get_courses) | -- | INSERT piac_links | Nuevo curso disponible para configurar | -- |
| Ejecuta "Comparar PIAC con Moodle" | Lectura: 5 APIs en paralelo (contents, assign, forum, url, resource) | -- | INSERT piac_parsed + moodle_snapshots + matching_results + discrepancies | Panel muestra resultados en 4 pestanas | -- |
| Oculta actividad (pestana Contenido) | -- | -- | UPDATE actividades_config[cmid].visible=false | Actividad desaparece para estudiantes (inmediato) | -- |
| Muestra actividad oculta | -- | -- | UPDATE actividades_config[cmid].visible=true | Actividad aparece para estudiantes (inmediato) | -- |
| Configura bienvenida/politicas/foros | -- | -- | UPSERT curso_virtual_config (campos especificos) | Reflejado en proximo request | -- |
| Agrega bibliografia enriquecida | -- | -- | INSERT curso_virtual_bibliografia | Visible en seccion bibliografia del curso | -- |
| Agrega recurso adicional (link o archivo) | -- | -- | INSERT recursos_adicionales (+ multer para archivos) | Visible en seccion recursos del curso | -- |
| Publica el curso | -- | -- | UPDATE config.publicado=true, publicado_at, publicado_por | Estudiantes pueden acceder al curso virtual | -- |
| Despublica el curso | -- | -- | UPDATE config.publicado=false | Estudiantes ven fallback: nombre + link a Moodle | -- |
| Resuelve discrepancia | -- | -- | UPDATE discrepancies[id].resolved=true | Desaparece de la lista de problemas en panel | -- |

### Acciones del Docente

| Accion | Moodle (MC) | UCampus (RA) | Supabase portal (IC) | UMCE.online (EE) | LRS (OC) |
|--------|-------------|--------------|----------------------|-------------------|----------|
| Agrega actividad en Moodle | Modulo creado en el curso | -- | NO detectado hasta proximo snapshot | Invisible hasta que DI re-snapshottee | -- |
| Cambia fecha de entrega en Moodle | Fecha actualizada | -- | NO detectado hasta proximo snapshot | Fecha vieja mostrada hasta snapshot | -- |
| Oculta seccion en Moodle | Seccion invisible para estudiantes en Moodle | -- | NO detectado hasta proximo snapshot | Seccion sigue visible en UMCE.online (dato viejo) | -- |
| Sube grabacion a mod_data en Moodle | Entrada creada en database de Moodle | -- | cache_recordings se actualiza en proximo cron (0-6h) | Grabacion visible tras refresh de cache | -- |
| Califica tarea en Moodle | Nota registrada en gradebook | -- | cache_grades se actualiza (live o cron) | Nota visible para estudiante en proximo refresh | -- |

### Acciones del Sistema (automaticas)

| Accion | Moodle (MC) | UCampus (RA) | Supabase portal (IC) | UMCE.online (EE) | LRS (OC) |
|--------|-------------|--------------|----------------------|-------------------|----------|
| Cron Sync UCampus (2x/dia) | -- | Lee via REST API | UPSERT en 17 tablas de schema ucampus | Sin efecto directo (datos disponibles para cruce) | -- |
| Cron Cache Recordings (cada 6h) | Lee mod_data por curso | -- | UPSERT cache_recordings | Grabaciones actualizadas | -- |
| Cron Cache Calendar (cada 6h) | Lee calendar events | -- | UPSERT cache_calendar | Calendario actualizado | -- |
| Cron Cache Completion (15min-1h) | Lee completion por usuario | -- | UPSERT cache_completions | Progresion actualizada sin llamar Moodle live | -- |
| Cron Moodle Monitor (cada 30min) | Lee metricas de 1,876 cursos | -- | -- (escribe a Notion) | -- | Alertas en Telegram + Notion DB |
| Auditor Nocturno (futuro) | Lee multiples APIs | -- | Escribe qa_implementation_results, alertas | Alertas visibles para DI y docente | Alimenta dashboard |

---

## 6. Reglas de prioridad cuando hay conflicto

### Conflicto 1: Moodle dice que una actividad existe, pero el DI la oculto

**Regla: El DI gana en UMCE.online. Moodle no se modifica.**

```
Escenario: Moodle tiene "Quiz Sesion 5" (visible=true), pero el DI marco
actividades_config[cmid].visible=false en curso_virtual_config.

Resultado:
  - En UMCE.online: la actividad NO se muestra al estudiante
  - En Moodle directo: la actividad SI es visible
  - El filtro isVisadoVisible() en el endpoint curso-virtual excluye la actividad

Justificacion: El DI tiene control editorial sobre la experiencia del estudiante
en UMCE.online. La visibilidad en UMCE.online es independiente de Moodle.
El estudiante que acceda a Moodle directamente si vera la actividad.
```

### Conflicto 2: El PIAC dice 16 sesiones pero Moodle tiene 12

**Regla: El PIAC es la referencia de diseno, Moodle es la implementacion. Se muestra lo que hay en Moodle y se alerta la discrepancia.**

```
Escenario: piac_parsed.nucleos tiene 4 nucleos con 4 sesiones cada uno (16 total),
pero moodle_snapshots muestra solo 12 secciones con contenido.

Resultado:
  - El Matching Engine detecta 4 sesiones como "missing_in_moodle"
  - Se crean 4 registros en portal.discrepancies con severity=critica
  - En UMCE.online: se muestran los 4 nucleos del PIAC, pero las semanas
    sin contenido Moodle aparecen con mensaje "Esta semana no tiene actividades asignadas"
  - En Panel PIAC: el DI ve las 4 discrepancias criticas en la pestana "Problemas"
  - El DI puede: resolver la discrepancia (marcar como intencionada) o pedir al docente
    que complete las 4 sesiones faltantes en Moodle

Justificacion: La estructura de navegacion viene del PIAC (es el diseno curricular).
El contenido viene de Moodle (es la implementacion). Si falta contenido, se senala.
```

### Conflicto 3: UCampus dice que el docente es X pero el PIAC dice Y

**Regla: UCampus es la fuente de verdad institucional. El PIAC puede tener datos obsoletos.**

```
Escenario: ucampus.cursos_dictados dice que el docente de seccion 301 es
"Maria Gonzalez", pero piac_parsed.identificacion.docente dice "Juan Perez".

Resultado:
  - Para la verificacion de permisos (docenteOwnerMiddleware): se usa UCampus
    -> Maria Gonzalez tiene acceso de docente al curso
  - Para la informacion visible al estudiante: se usa curso_virtual_config
    -> El DI configura foto/bio/nombre del docente actual (Maria)
  - Si el DI no ha actualizado la config: el PIAC muestra "Juan Perez"
    -> Discrepancia detectable pero no automatizada actualmente

ESTADO ACTUAL: No hay cruce automatico UCampus-PIAC para docente.
La verificacion de docente existe via cursos_dictados, pero solo para endpoints
que usan el patron de seccion (GET /api/ucampus/seccion/:idCurso).
```

### Conflicto 4: Snapshot Moodle desactualizado vs realidad de Moodle

**Regla: El snapshot es una foto en el tiempo. La realidad de Moodle puede haber cambiado. Para datos estructurales, el snapshot prevalece hasta que se tome uno nuevo. Para datos personales (completion, grades), se lee en tiempo real.**

```
Escenario: El snapshot dice que hay 15 actividades en la seccion 3.
El docente agrego 2 actividades nuevas en Moodle ayer.
El DI no ha re-snapshotteado.

Resultado:
  - En UMCE.online: se muestran las 15 actividades del snapshot viejo
  - Las 2 actividades nuevas NO aparecen en UMCE.online
  - El estudiante SI puede acceder a las actividades nuevas via Moodle directo
  - Cuando el DI ejecute "Solo leer Moodle", las 2 actividades apareceran
    y el matching detectara nuevas actividades sin correspondencia en el PIAC

Justificacion: El snapshot manual es intencional — el DI controla cuando
incorporar cambios de Moodle a la experiencia del estudiante. Esto evita que
cambios no revisados del docente aparezcan sin visado.
```

### Conflicto 5: Cache expirado vs datos en tiempo real

**Regla: Cache viejo > no mostrar nada. Datos en tiempo real > cache viejo cuando estan disponibles.**

```
Escenario: cache_completions tiene datos de hace 2 horas.
Moodle API esta respondiendo lento (timeout en 5 seg).

Resultado:
  - Se muestra el cache viejo con indicador "Actualizado hace 2h"
  - Se lanza un refresh asincrono en background
  - Cuando el refresh completa, el proximo request mostrara datos frescos
  - Si el cache no existe en absoluto: se muestra el curso sin datos
    de progresion, con mensaje "Cargando tu progresion..."

NOTA: Actualmente fetchCompletion() y fetchGrades() son llamadas LIVE a Moodle
(no leen de cache). El modelo de cache con TTL esta definido en el SPEC pero
las tablas cache_completions/grades/submissions aun no tienen cron que las llene.
```

### Conflicto 6: Datos del DI vs Defaults institucionales

**Regla: Si el DI configuro un campo, su valor prevalece. Si no configuro, se usa el default institucional.**

```
Implementacion actual (ya funciona):
  resolvedConfig = {
    ...institutionalDefaults,    // base: textos institucionales
    ...cursoVirtualConfig        // override: lo que el DI configuro
  }

Campos con default institucional:
  - politica_integridad (texto UMCE sobre plagio)
  - politicas_curso (asistencia, late policy)
  - competencias_digitales (manejo de herramientas)
  - docente_horario_atencion ("Consultar por email")
  - docente_tiempos_respuesta (email 48h, foro 48h, tareas 7 dias)

El DI puede sobrescribir cualquiera de estos campos por curso.
Si deja un campo vacio, el default institucional se muestra.
```

---

## 7. Estado actual vs estado objetivo

### Capa 1 — Registro Academico (RA)

| Regla de sincronizacion | Implementada | Que falta |
|-------------------------|-------------|-----------|
| UCampus -> Supabase ucampus (2x/dia) | SI | Funcional. Cron en VPS |
| UCampus cruzado con curso virtual (inscripcion, carrera) | NO | Endpoint `GET /api/curso-virtual/:linkId/ucampus-enriched`. Falta campo `ucampus_codigo_ramo` en `piac_links` para matching ramo <-> curso |
| Validacion de inscripcion antes de mostrar curso | NO | Verificar en `cursos_inscritos` si el estudiante sigue matriculado. Mostrar banner si se retiro, NO bloquear |
| EdX/EOL integracion | NO | Sin API, sin plan. Solo enlace unidireccional futuro |

### Capa 2 — Motor de Contenido (MC)

| Regla de sincronizacion | Implementada | Que falta |
|-------------------------|-------------|-----------|
| Parse PIAC desde Drive (manual) | SI | Funcional, async con jobId |
| Snapshot Moodle (manual) | SI | Funcional. Falta endpoint combinado `snapshot/refresh` (snapshot + matching en un paso) |
| Matching PIAC vs Moodle (manual) | SI | Funcional, deterministico |
| Escritura en Moodle (responder foro) | SI | Solo `mod_forum_add_discussion_post`. No hay escritura de fechas, descripciones, ni grabaciones |
| Snapshot automatico para cursos publicados | NO | Cron diario que tome snapshot de cursos con `publicado=true` y re-corra matching. Alertaria cambios sin intervencion DI |
| Token Moodle con escritura para docente | NO | Necesario para Fase C (edicion docente). Requiere token personal via `validateMoodleLogin()` |

### Capa 3 — Inteligencia Curricular (IC)

| Regla de sincronizacion | Implementada | Que falta |
|-------------------------|-------------|-----------|
| Configuracion DI (config, bibliografia, recursos) | SI | Funcional. Falta: tiempo estimado por actividad, etiqueta obligatorio/complementario, objetivo de aprendizaje por actividad |
| Publicacion/despublicacion | SI | Funcional. Falta notificacion push al publicar (Fase 3-B) |
| cache_recordings (cron mod_data) | PARCIAL | recording_pipeline.py existe. No confirmado que corra para todos los cursos con piac_links |
| cache_calendar (cron calendar events) | PARCIAL | Similar a recordings — necesita verificacion |
| cache_completions (cron) | NO | Schema definido en schema-fase4.sql. Cron no implementado. Actualmente se lee LIVE de Moodle |
| cache_grades (cron) | NO | Schema definido. Cron no implementado. Actualmente se lee LIVE de Moodle |
| cache_submissions (cron) | NO | Schema definido. Cron no implementado. No se lee en el endpoint actual |
| user_moodle_mapping (cache email->userId) | SI | Funcional. Se cachea al primer acceso |
| Verificacion URLs bibliografia (cron semanal) | NO | HEAD requests + CrossRef API. Definido en SPEC Fase 4, no implementado |
| Defaults institucionales editables | PARCIAL | Endpoints GET/PUT existen. No hay UI de admin para editarlos |

### Capa 4 — Experiencia del Estudiante (EE)

| Regla de sincronizacion | Implementada | Que falta |
|-------------------------|-------------|-----------|
| Consolidacion curso (12 fuentes -> JSON) | SI | Funcional. El endpoint merge es el corazon del sistema |
| Refresh personal (throttle 5 min) | SI | Funcional. `POST /api/curso-virtual/:linkId/refresh` |
| Progreso consolidado del estudiante | NO | `GET /api/curso-virtual/:linkId/progreso` con % completado, semana actual, proxima actividad |
| Vista docente enriquecida (Fase A) | NO | Deteccion de rol docente, lista de alumnos, completion agregado, alertas docente |
| Edicion docente limitada (Fase B) | NO | `PATCH /docente/config`, toggle visibilidad, agregar recursos. Requiere middleware `docenteOwnerMiddleware` |
| Edicion docente avanzada (Fase C) | NO | Cambio de fechas en Moodle, agregar grabaciones. Requiere token Moodle con escritura |

### Capa 5 — Observatorio de Calidad (OC)

| Regla de sincronizacion | Implementada | Que falta |
|-------------------------|-------------|-----------|
| QA Preventivo (8 checks del planificador) | NO | Endpoint `POST /api/qa/preventivo` definido en doc 04, no implementado en server.js |
| QA de Implementacion (77 indicadores) | NO | Endpoint `POST /api/qa/:linkId/implementacion` definido en doc 04, no implementado |
| QA Operacional / Auditor Nocturno | NO | Conceptual (4 capas: salud, coherencia, riesgo, MOCA). Python cron |
| Dashboard docente (dashboard.udfv.cloud) | SI | Funcional, servicio independiente v4.1.1 |
| Ralph LRS (lrs.udfv.cloud) | SI | Funcional, pero UMCE.online no emite statements xAPI |
| xAPI desde curso virtual | NO | `POST /api/xapi/statements` para registrar eventos. Base para FONDEF analytics |
| Moodle Monitor (cron 30 min) | SI | Funcional. 1,876 cursos, Notion DB + Telegram |
| Notificacion de discrepancias al DI | NO | Email via Brevo al completar analisis con discrepancias criticas |
| Alertas operacionales al docente | NO | Entregas sin calificar, estudiantes inactivos, foros sin respuesta. Requiere cron + endpoints |

---

## 8. Principios de arquitectura (reglas irrompibles del sistema)

1. **Moodle es la fuente de verdad del contenido.** Todo lo que el estudiante hace (entregar tarea, completar actividad, participar en foro) sucede en Moodle. UMCE.online observa, no reemplaza.

2. **UCampus es la fuente de verdad institucional.** Matriculas, mallas, notas oficiales vienen de UCampus. Cuando UCampus contradice al PIAC, UCampus gana para datos institucionales.

3. **El PIAC es la fuente de verdad del diseno curricular.** La estructura de nucleos, resultados formativos, criterios de evaluacion y bibliografia provienen del PIAC. El PIAC estructura la navegacion; Moodle llena el contenido.

4. **La IA nunca crea ni modifica nada.** No escribe en Moodle, no edita el PIAC en Drive, no cambia configuraciones sin intervencion humana. Solo observa, parsea, compara, presenta y alerta.

5. **El DI es el gatekeeper.** Ningun cambio en Moodle se refleja automaticamente en UMCE.online hasta que el DI toma un nuevo snapshot. El DI controla que se muestra y que se oculta.

6. **Snapshot manual es intencional.** El DI decide cuando incorporar cambios de Moodle a la experiencia del estudiante. Esto evita que errores o contenido no revisado del docente aparezcan sin visado.

7. **Datos personales se leen en tiempo real cuando es posible.** Completion y grades se llaman a Moodle live por usuario. Cuando el cron de cache este activo, se serviran desde cache con TTL y fallback.

8. **Ante falla, degradar gracefully.** Si Moodle no responde: mostrar datos del snapshot/cache. Si cache no existe: mostrar curso sin datos personales. Nunca bloquear acceso al contenido por un timeout.

---

## 9. Glosario para el equipo

| Termino | Significado |
|---------|-------------|
| **PIAC** | Plan Integral de Actividades Curriculares — documento Word en Google Drive que describe el diseno del curso |
| **Snapshot** | Foto en el tiempo de la estructura de un curso en Moodle (secciones, actividades, foros, fechas) |
| **Parse** | Proceso de leer el PIAC de Drive, convertirlo a texto con mammoth, y extraer JSON estructurado con LLM |
| **Matching** | Cruce deterministico entre PIAC parseado y snapshot Moodle para detectar correspondencias y discrepancias |
| **Visado DI** | Configuracion de visibilidad por actividad que el DI controla en UMCE.online (independiente de la visibilidad en Moodle) |
| **Discrepancia** | Diferencia detectada entre lo que dice el PIAC y lo que existe en Moodle (critica / warning / info) |
| **Refresh Personal** | Llamada en tiempo real a Moodle para obtener completion + grades del estudiante que abre el curso |
| **Cache** | Tablas en Supabase que almacenan datos de Moodle para evitar llamadas en tiempo real. Llenadas por cron |
| **TTL** | Time To Live — tiempo maximo que un dato en cache se considera fresco antes de necesitar actualizacion |
| **Link (piac_link)** | Registro que vincula un PIAC de Drive con un curso de Moodle. Es la entidad central del sistema |
| **Config** | Configuracion del curso virtual que el DI edita: bienvenida, politicas, visibilidad, foros, bibliografia |
| **Consolidacion** | Proceso que une 12 fuentes de datos en un solo JSON que el frontend consume para renderizar el curso |
| **Publicado** | Flag en curso_virtual_config. Si true, los estudiantes pueden acceder. Si false, ven fallback con link a Moodle |
