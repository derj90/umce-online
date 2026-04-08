# Arquitectura Técnica: Cómo se Alimenta el Curso Virtual

**Fecha:** 2026-04-07  
**Basado en:** server.js ~6400 líneas (estado real), docs 01-05, memorias activas

---

## 1. Diagrama del Flujo de Datos (ASCII)

Desde el primer momento de configuración hasta el estudiante que ve el curso:

```
  [DISEÑADOR INSTRUCCIONAL]
          |
          | 1. Vincula PIAC + Moodle
          v
  POST /api/piac/link
  ┌─────────────────────────────────────────────────────────────────┐
  │ portal.piac_links                                               │
  │ {moodle_platform, moodle_course_id, drive_url, course_name}    │
  └────────────────────┬────────────────────────────────────────────┘
                       |
          | 2. Dispara análisis completo
          v
  POST /api/piac/:linkId/analyze  (o /parse + /snapshot + /match por separado)
          |
          |─── A) Descarga PIAC de Drive (Google Drive API, udfv@ OAuth)
          |         └── mammoth.extractRawText(.docx) → texto plano
          |         └── callClaudeProxy() → LLM extrae JSON estructurado
          |         └── GUARDA → portal.piac_parsed {parsed_json}
          |
          |─── B) Toma snapshot de Moodle (REST API directa)
          |         └── core_course_get_contents → secciones + módulos
          |         └── mod_assign_get_assignments → fechas y notas
          |         └── mod_forum_get_forums_by_courses → foros
          |         └── mod_url_get_urls_by_courses → URLs externas
          |         └── mod_resource_get_resources_by_courses → archivos
          |         └── GUARDA → portal.moodle_snapshots {snapshot_json}
          |
          |─── C) Matching engine (determinístico, sin LLM)
          |         └── runMatching(piac_parsed, moodle_snapshot)
          |         └── Cruza: núcleo → sección, sesión → book/page, foros, evaluaciones
          |         └── GUARDA → portal.matching_results {matches_json, summary_json}
          |         └── GUARDA → portal.discrepancies (críticas, warnings, info)
          |
          v
  [DI configura el curso virtual]
          |
          |─── PUT /api/piac/:linkId/config
          |         └── portal.curso_virtual_config
          |         └── docente_foto, bio, video_bienvenida, mensaje_bienvenida
          |         └── politicas_curso, conocimientos_previos, competencias_digitales
          |         └── actividades_config (visibilidad por cmid — "visado DI")
          |         └── objetivos_semanales (texto adicional por semana)
          |
          |─── POST /api/piac/:linkId/bibliografia (o enriquecer)
          |         └── portal.curso_virtual_bibliografia
          |         └── clasificacion (obligatoria/complementaria), nucleo_asociado
          |
          |─── POST /api/piac/:linkId/recursos
          |         └── portal.recursos_adicionales (links, archivos, videos externos)
          |
          |─── POST /api/piac/:linkId/config/publish
          |         └── config.publicado = true (condición para que estudiantes accedan)
          |
          v
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │              GET /api/curso-virtual/:linkId  (estudiante autenticado)       │
  │                                                                             │
  │  Fuentes que se consolidan en este endpoint:                                │
  │                                                                             │
  │  1. portal.piac_links          → plataforma Moodle, course_id              │
  │  2. portal.piac_parsed         → núcleos, RF, CE, temas, bibliografía,     │
  │                                   metodología, evaluaciones_sumativas       │
  │  3. portal.moodle_snapshots    → secciones, módulos, fechas, archivos      │
  │  4. portal.matching_results    → cómo se cruzan PIAC y Moodle              │
  │  5. portal.curso_virtual_config → config DI + defaults institucionales     │
  │  6. portal.recursos_adicionales → recursos extra del DI                    │
  │  7. portal.curso_virtual_bibliografia → bibliografía enriquecida            │
  │  8. Moodle API live            → foto docente, imagen curso, foros live     │
  │  9. portal.cache_recordings    → grabaciones desde mod_data Moodle         │
  │  10. portal.cache_calendar     → calendario de eventos del curso           │
  │  11. Moodle API live personal  → completion por actividad (por usuario)    │
  │  12. Moodle API live personal  → calificaciones (gradereport)              │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
          |
          v
  [ESTUDIANTE ve el curso en /curso-virtual/:linkId]
```

### Detalle del merge en el endpoint (líneas 4667-4958 server.js)

```
Promise.all([
  piac_parsed      → piac
  moodle_snapshots → snapshot
  matching_results → matching (referencia, no usado directamente en la vista)
  curso_virtual_config → config + defaults institucionales fusionados
  recursos_adicionales → filtrado visible=true
])

+ async personal = Promise.all([
    resolveMoodleUserId(email)   → portal.user_moodle_mapping (caché) o Moodle API
    fetchCompletion()            → Moodle core_completion_get_activities_completion_status
    fetchGrades()                → Moodle gradereport_user_get_grade_items
    fetchCachedRecordings()      → portal.cache_recordings
    fetchCachedCalendar()        → portal.cache_calendar
])
```

---

## 2. Fuentes de Datos por Elemento del Curso

| Elemento visible al estudiante | Fuente primaria | Fuente fallback | Endpoint que lo sirve | Estado |
|---|---|---|---|---|
| Nombre del curso | `piac_parsed.parsed_json.identificacion.nombre` | `piac_links.course_name` | `GET /api/curso-virtual/:linkId` | Implementado |
| Programa/carrera del curso | `piac_parsed.parsed_json.identificacion.programa` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Nombre del docente | `piac_parsed.parsed_json.identificacion.docente` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Foto del docente | `curso_virtual_config.docente_foto_url` | Moodle `core_user_get_users_by_field` (profileimageurl) | `GET /api/curso-virtual/:linkId` | Implementado |
| Bio del docente | `curso_virtual_config.docente_bio` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Video de bienvenida | `curso_virtual_config.docente_video_bienvenida` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Mensaje de bienvenida | `curso_virtual_config.docente_mensaje_bienvenida` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Horario de atención docente | `curso_virtual_config.docente_horario_atencion` | `institutional_defaults.docente_horario_atencion` | `GET /api/curso-virtual/:linkId` | Implementado |
| Imagen del curso (banner) | Moodle `core_course_get_courses_by_field` (overviewfiles) | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Modalidad | `piac_parsed.identificacion.modalidad` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Semanas / Créditos SCT / Horas | `piac_parsed.identificacion` (semanas, creditos_sct, horas) | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Metodología | `piac_parsed.metodologia` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Núcleos (lista, nombre, semanas) | `piac_parsed.nucleos[]` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Resultado Formativo (RF) por núcleo | `piac_parsed.nucleos[].resultado_formativo` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Criterios de Evaluación (CE) | `piac_parsed.nucleos[].criterios_evaluacion` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Temas por núcleo | `piac_parsed.nucleos[].temas` | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Contenidos Moodle por núcleo (pages, resources, scorm, h5p, lesson) | `moodle_snapshots` → sección vinculada al núcleo | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Books por semana (contenido de sesión) | `moodle_snapshots` → books indexados por número de sesión | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Capítulos de un book (HTML) | Moodle `mod_book_get_books_by_courses` + `mod_book_view_book` | — | `GET /api/curso-virtual/book/:platform/:cmid` | Implementado |
| Páginas Moodle (HTML) | Moodle `mod_page_get_pages_by_courses` | — | `GET /api/curso-virtual/page/:platform/:cmid` | Implementado |
| Foros por sesión/semana | `moodle_snapshots` → foros indexados por nombre ("Forum session N") | Moodle live `mod_forum_get_forums_by_courses` para forumId | `GET /api/curso-virtual/:linkId` | Implementado |
| Discusiones de un foro | Moodle `mod_forum_get_forum_discussions` | — | `GET /api/curso-virtual/forum/:platform/:forumId` | Implementado |
| Responder foro | Moodle `mod_forum_add_discussion_post` | — | `POST /api/curso-virtual/forum/:platform/:forumId/reply` | Implementado |
| Evaluaciones (assign/quiz) por núcleo | `moodle_snapshots` → assigns y quizzes en la sección del núcleo | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Fechas de entrega de evaluaciones | `moodle_snapshots` → `dates.duedate` (de `mod_assign_get_assignments`) | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Evaluaciones sumativas (tabla general) | `piac_parsed.evaluaciones_sumativas[]` (nombre, ponderación) | — | `GET /api/curso-virtual/:linkId` | Implementado |
| Calificaciones del estudiante | Moodle live `gradereport_user_get_grade_items` (por usuario) | — | `GET /api/curso-virtual/:linkId` `.personal.grades` | Implementado |
| Progreso/completion por actividad | Moodle live `core_completion_get_activities_completion_status` | — | `GET /api/curso-virtual/:linkId` `.personal.completion` | Implementado |
| Grabaciones de clases | `portal.cache_recordings` (cron que lee `mod_data` de Moodle) | — | `GET /api/curso-virtual/:linkId` `.personal.recordings` | Implementado (depende del cron VPS) |
| Calendario de eventos | `portal.cache_calendar` (cron) | — | `GET /api/curso-virtual/:linkId` `.personal.calendar` | Implementado (depende del cron VPS) |
| Bibliografía (texto plano) | `piac_parsed.bibliografia[]` | — | `GET /api/curso-virtual/:linkId` `.curso.bibliografia` | Implementado |
| Bibliografía enriquecida (clasificada, por núcleo) | `portal.curso_virtual_bibliografia` | — | `GET /api/curso-virtual/:linkId` `.curso.bibliografia_rich` | Implementado (requiere carga manual por DI) |
| Recursos compartidos (sección 0 y secciones soporte) | `moodle_snapshots` → secciones 0 o con nombre soporte | — | `GET /api/curso-virtual/:linkId` `.recursos_compartidos` | Implementado |
| Recursos adicionales del DI (links, archivos extra) | `portal.recursos_adicionales` | — | `GET /api/curso-virtual/:linkId` `.recursos_adicionales` | Implementado |
| Políticas del curso / integridad | `curso_virtual_config.politicas_curso` / `politica_integridad` | `institutional_defaults` | `GET /api/curso-virtual/:linkId` | Implementado |
| Conocimientos previos / competencias digitales | `curso_virtual_config.conocimientos_previos` | `institutional_defaults` | `GET /api/curso-virtual/:linkId` | Implementado |
| URL del curso en Moodle | `piac_links` → `moodle_platform` + `moodle_course_id` | — | `GET /api/curso-virtual/:linkId` `.moodle.courseUrl` | Implementado |
| Visibilidad de actividades ("visado DI") | `curso_virtual_config.actividades_config[cmid].visible` | — | `GET /api/curso-virtual/:linkId` (filtro `isVisadoVisible`) | Implementado |
| Sumarios de sección Moodle | `moodle_snapshots` → `section.summary` | — | `GET /api/curso-virtual/:linkId` `.sectionSummaries` | Implementado |
| Perfil académico del estudiante (carrera, ramos) | UCampus API → `portal.ucampus` schema (Supabase) | — | `GET /api/ucampus` (separado) | Implementado (no cruzado con curso aún) |

---

## 3. APIs Existentes vs APIs Necesarias

### Endpoints PIAC/Curso ya implementados

| Endpoint | Método | Descripción | Auth |
|---|---|---|---|
| `/api/piac/link` | POST | Vincular PIAC Drive + curso Moodle | DI/Admin |
| `/api/piac/links` | GET | Listar vínculos activos | DI/Admin |
| `/api/piac/link/:id` | GET | Detalle de un vínculo | DI/Admin |
| `/api/piac/link/:id` | DELETE | Eliminar vínculo | DI/Admin |
| `/api/piac/:linkId/parse` | POST | Parsear PIAC con LLM (asíncrono, retorna jobId) | DI/Admin |
| `/api/piac/job/:jobId` | GET | Estado del job de parseo | DI/Admin |
| `/api/piac/:linkId/snapshot` | POST | Tomar snapshot de Moodle | DI/Admin |
| `/api/piac/:linkId/match` | POST | Ejecutar matching engine | DI/Admin |
| `/api/piac/:linkId/analyze` | POST | Analizar completo (parse + snapshot + match) | DI/Admin |
| `/api/piac/discrepancy/:id/resolve` | POST | Resolver discrepancia manualmente | DI/Admin |
| `/api/piac/discrepancy/:id/unresolve` | POST | Desmarcar resolución | DI/Admin |
| `/api/piac/:linkId/bibliografia` | GET | Leer bibliografía enriquecida | Público |
| `/api/piac/:linkId/bibliografia` | POST | Agregar entrada bibliográfica | DI/Admin |
| `/api/piac/bibliografia/:id` | PUT | Actualizar entrada | DI/Admin |
| `/api/piac/bibliografia/:id` | DELETE | Eliminar entrada | DI/Admin |
| `/api/piac/:linkId/bibliografia/calidad` | GET | Análisis LLM de calidad bibliográfica | DI/Admin |
| `/api/piac/:linkId/config` | GET | Leer config DI del curso | DI/Admin |
| `/api/piac/:linkId/config` | PUT | Actualizar config DI | DI/Admin |
| `/api/piac/:linkId/recursos` | GET | Recursos adicionales | DI/Admin |
| `/api/piac/:linkId/recursos` | POST | Agregar recurso | DI/Admin |
| `/api/piac/:linkId/recursos/upload` | POST | Subir archivo recurso | DI/Admin |
| `/api/piac/recursos/:id` | PUT | Actualizar recurso | DI/Admin |
| `/api/piac/recursos/:id` | DELETE | Eliminar recurso | DI/Admin |
| `/api/piac/:linkId/config/publish` | POST | Publicar curso | DI/Admin |
| `/api/piac/:linkId/config/unpublish` | POST | Despublicar curso | DI/Admin |
| `/api/piac/:linkId/preview` | GET | Preview del curso (ignora publicado) | DI/Admin |
| `/api/piac/:linkId/badges` | GET | Badges del curso | Auth |
| `/api/curso-landing/:linkId` | GET | Vista pública sin auth (landing) | Público |
| `/api/curso-virtual/:linkId` | GET | Vista completa con datos personales | Auth |
| `/api/curso-virtual/:linkId/refresh` | POST | Refrescar datos personales (throttled 5min) | Auth |
| `/api/curso-virtual/book/:platform/:cmid` | GET | Capítulos de book con HTML | Auth |
| `/api/curso-virtual/page/:platform/:cmid` | GET | Contenido de page con HTML | Auth |
| `/api/curso-virtual/forum/:platform/:forumId` | GET | Discusiones de un foro | Auth |
| `/api/curso-virtual/forum/:platform/:forumId/reply` | POST | Responder en foro | Auth |

### Endpoints UCampus existentes

| Endpoint | Método | Descripción | Auth |
|---|---|---|---|
| `/api/ucampus` | GET | Perfil académico del usuario autenticado (docente + estudiante) | Auth |
| `/api/ucampus/seccion/:idCurso` | GET | Lista de estudiantes de una sección | Auth + Admin |

### Endpoints que faltan para el flujo completo

| Endpoint faltante | Prioridad | Descripción | Impacto |
|---|---|---|---|
| `GET /api/curso-virtual/:linkId/ucampus-enriched` | Alta | Cruzar perfil UCampus del estudiante con el curso actual (carrera, semestre, nota de pre-requisito) | Personalización contextual |
| `GET /api/piac/:linkId/discrepancias` | Media | Listar discrepancias activas con filtros (por severidad, por núcleo) | Panel DI |
| `POST /api/piac/:linkId/snapshot/refresh` | Media | Re-tomar snapshot (sin re-parsear PIAC) para actualizar estructura Moodle | Actualización de contenidos |
| `GET /api/piac/:linkId/historial` | Media | Historial de versiones de parse + snapshots + matchings | Auditoría DI |
| `POST /api/piac/:linkId/config/actividades` | Media | Actualizar visado DI de actividades masivamente (no de una en una) | UX DI |
| `GET /api/curso-virtual/:linkId/progreso` | Alta | Resumen de avance del estudiante (% completado, semana actual, próxima actividad) | UX estudiante |
| `POST /api/piac/:linkId/parse/enrich` | Baja | Re-parsear y enriquecer PIAC existente sin sobreescribir (diff incremental) | Actualización PIAC |
| `GET /api/piac/link/:id/comparar` | Baja | Comparar dos versiones de snapshot (detección de cambios en Moodle) | QA DI |
| `POST /api/xapi/statements` | Baja | Registrar eventos xAPI al LRS (lrs.udfv.cloud) desde acciones del curso virtual | Learning analytics |

---

## 4. Flujo de Edición y Actualización (Perspectiva DI)

### 4.1 Configurar un curso nuevo

```
1. DI accede a /admin/piac o panel de administración
2. POST /api/piac/link
   → {moodle_platform, moodle_course_id, drive_url}
   → server.js verifica curso en Moodle (core_course_get_courses)
   → GUARDA portal.piac_links
   → Retorna linkId

3. POST /api/piac/:linkId/analyze   (análisis completo en un paso)
   → Descarga PIAC de Drive (Google Drive API con OAuth udfv@)
   → LLM extrae JSON (claude-proxy-container o fallback)
   → Snapshot Moodle (5 llamadas API paralelas)
   → runMatching() deterministico
   → GUARDA en: piac_parsed, moodle_snapshots, matching_results, discrepancies

4. GET /api/piac/:linkId/preview    (DI revisa resultado)

5. PUT /api/piac/:linkId/config     (DI configura experiencia)
   → docente_foto_url, bio, video_bienvenida, mensaje_bienvenida
   → politicas_curso, conocimientos_previos, competencias_digitales
   → actividades_config (ocultar actividades que no quiere mostrar)

6. POST /api/piac/:linkId/config/publish   (publicar)
   → Verifica que piac_parsed y moodle_snapshots existan
   → config.publicado = true
   → Estudiantes pueden ahora acceder
```

**UI existente:** El panel DI está implementado en `/admin/piac-manager` (HTML + JS en `public/`). No existe un "wizard paso a paso" — el DI ejecuta análisis, revisa discrepancias y configura manualmente.

### 4.2 Actualizar PIAC (docente entrega versión revisada)

```
1. Docente actualiza el archivo .docx en Google Drive (misma URL)
2. DI ejecuta POST /api/piac/:linkId/parse  (re-parsea sin re-snapshottear)
   → Incrementa version en piac_parsed
   → NO borra versión anterior (historial implícito por order desc)

3. POST /api/piac/:linkId/match  (re-corre matching con nuevo PIAC + snapshot existente)
   → Regenera matching_results y discrepancies
```

**Pendiente:** No existe diff incremental. Cada re-parseo es completo.

### 4.3 Actualizar datos de Moodle (docente agrega actividades)

```
1. DI ejecuta POST /api/piac/:linkId/snapshot  (re-snapshot sin re-parsear PIAC)
   → Nueva fila en moodle_snapshots
   → Versión anterior queda en historial

2. POST /api/piac/:linkId/match  (re-corre matching con PIAC existente + nuevo snapshot)
```

**Pendiente:** No existe endpoint `POST /api/piac/:linkId/snapshot/refresh` explícito que combine estos dos pasos.

### 4.4 Publicar / Despublicar

```
Publicar:   POST /api/piac/:linkId/config/publish
  → Requiere piac_parsed + moodle_snapshots presentes
  → config.publicado = true, publicado_at = now(), publicado_por = email

Despublicar: POST /api/piac/:linkId/config/unpublish
  → config.publicado = false
  → Estudiantes ven fallback con solo nombre + URL directa a Moodle
```

**Fallback para estudiantes cuando no publicado** (líneas 4689-4699 server.js):
```json
{
  "fallback": true,
  "curso": { "nombre": "..." },
  "moodle": { "platform": "...", "courseUrl": "https://virtual.umce.cl/course/view.php?id=..." }
}
```

### 4.5 Qué UI existe vs qué falta

| Acción DI | UI existente | Estado |
|---|---|---|
| Vincular PIAC + Moodle | `/admin/piac-manager` | Implementado |
| Ejecutar análisis | `/admin/piac-manager` (botón Analizar) | Implementado |
| Ver discrepancias | `/admin/piac-manager` (lista de discrepancias) | Implementado |
| Resolver discrepancias | `/admin/piac-manager` (botón Resolver) | Implementado |
| Configurar docente (foto, bio, video) | `/admin/piac-manager` (sección config) | Implementado |
| Visado de actividades (ocultar cmids) | `/admin/piac-manager` (toggle por actividad) | Implementado |
| Gestionar bibliografía enriquecida | `/admin/piac-manager` (tabla bibliografía) | Implementado |
| Agregar recursos adicionales | `/admin/piac-manager` (formulario recursos) | Implementado |
| Preview antes de publicar | `/api/piac/:linkId/preview` | Implementado |
| Publicar / Despublicar | `/admin/piac-manager` (botón Publicar) | Implementado |
| Ver historial de versiones | No existe UI | Pendiente |
| Comparar dos snapshots Moodle | No existe | Pendiente |
| Notificar docente de discrepancias | No existe | Pendiente |

---

## 5. Conexión con EdX / EOL

### Contexto actual (abril 2026)

El proyecto EdX/EOL (cursos.umce.cl) es un SaaS de Open edX operado por UChile (EOL) bajo convenio FUE-MINEDUC UMCE22992. UMCE paga ~$30MM/año y tiene acceso hasta jun 2027. Hay además un proyecto FONDEF ID25I10459 ($237M, 24 meses) donde UMCE es entidad asociada y sus datos de estudiantes alimentan investigación de learning analytics con ML.

**Estado de integración con UMCE.online: CERO.** No hay ningún endpoint ni código que conecte con cursos.umce.cl.

### Qué se podría integrar (técnicamente factible)

| Integración | Mecanismo | Complejidad | Valor |
|---|---|---|---|
| **Catálogo de cursos EOL** | Open edX REST API (`/api/catalog/v1/courses/`) — pública si está habilitada | Baja | Listar cursos disponibles en UMCE.online |
| **Inscripción en cursos EOL** | Open edX Enrollment API (`/api/enrollment/v1/enrollment`) — requiere token | Media | Flujo de inscripción directo desde UMCE.online |
| **Progreso del estudiante en EOL** | Open edX Course Completion API + Grades API — requiere autenticación por usuario | Alta | Panel unificado Moodle + EdX |
| **xAPI desde EOL al LRS propio** | Configurar EOL para emitir xAPI statements a `lrs.udfv.cloud` | Alta (requiere acceso config EOL) | Learning analytics unificado |
| **Single Sign-On** | SAML/LTI 1.3 entre UMCE.online y EOL — requiere gestión con UChile/EOL | Muy alta | Experiencia sin fricción |
| **Certificados EOL en UMCE.online** | Open edX Certificates API — mostrar certificados obtenidos | Media | Trayectoria formativa completa |

### Recomendación pragmática

Dado que UDFV fue desplazada del liderazgo del proyecto EOL (Marisol Hernandez coordina por mandato Tatiana), la integración más segura y que no requiere negociación institucional es:

1. **Enlace unidireccional:** Mostrar en el perfil del estudiante de UMCE.online un enlace a sus cursos en cursos.umce.cl (sin API, solo navegación).
2. **Si EOL expone API pública:** Consumir catálogo para mostrar qué cursos están disponibles en EOL, complementario a los cursos en Moodle.
3. **xAPI convergencia:** A mediano plazo, si EOL emite eventos xAPI (Open edX ya tiene soporte nativo), estos pueden llegar al mismo `lrs.udfv.cloud` y aparecer en dashboards analíticos.

---

## 6. Conexión con UCampus

### Qué ya funciona (implementado en server.js líneas 609-1130)

**Schema UCampus en Supabase Self-Hosted:** El VPS sincroniza UCampus 2x/día (cron) al schema `ucampus` de Supabase Self-Hosted (supabase.udfv.cloud). Las tablas clave son:

- `ucampus.personas` — RUT, email, nombres
- `ucampus.cursos_dictados` — cursos que dicta el docente este periodo
- `ucampus.cursos_inscritos` — cursos en que está inscrito el estudiante
- `ucampus.ramos` — catálogo de ramos (nombre, código)
- `ucampus.cursos` — secciones con cupos, modalidad, departamento
- `ucampus.horarios` — horarios por sección
- `ucampus.carreras_alumnos` — carrera del estudiante
- `ucampus.carreras` — nombres de carreras

**Endpoint `GET /api/ucampus`:**
- Busca al usuario autenticado por email en `personas`
- Retorna: `asDocente` (secciones que dicta, inscritos, horarios) + `asEstudiante` (ramos inscritos, nota final, carrera)
- No requiere integración directa con UCampus — lee desde Supabase sincronizado

**`GET /api/ucampus/seccion/:idCurso`:** Lista estudiantes inscritos en una sección (solo admin).

### Qué falta: cruzar UCampus con el Curso Virtual

El problema actual es que UCampus y el curso virtual son **silos separados** en la respuesta del servidor. `GET /api/ucampus` y `GET /api/curso-virtual/:linkId` son endpoints independientes que el frontend puede llamar en paralelo, pero no hay cruce de datos en el backend.

| Enriquecimiento pendiente | Descripción | Impacto |
|---|---|---|
| **Validar inscripción** | Verificar que el estudiante esté inscrito en el ramo asociado al curso virtual antes de mostrar contenido completo | Control de acceso pedagógico |
| **Contexto de carrera** | Mostrar al estudiante "este curso pertenece a tu malla de carrera X, año Y" | Motivación y pertenencia |
| **Créditos SCT en contexto** | Relacionar los créditos del PIAC con la carga SCT del semestre del estudiante (todos sus ramos) | Prevención de sobrecarga |
| **Pre-requisitos cumplidos** | Si UCampus expone notas de ramos anteriores, verificar pre-requisitos del programa | Orientación académica |
| **Docente ve su sección en UCampus + curso Moodle** | Al abrir el curso virtual, el docente podría ver: "tienes X estudiantes inscritos en UCampus, Y en Moodle" (comparar) | Gestión docente |
| **Sincronización de fechas** | UCampus tiene fechas oficiales de evaluaciones. Cruzarlas con las fechas del PIAC y del snapshot Moodle para detectar inconsistencias | QA automático |

### Implementación sugerida (bajo esfuerzo)

```javascript
// En GET /api/curso-virtual/:linkId, después de resolver personal data:
// Si el estudiante tiene datos UCampus, agregar al objeto personal:
const ucampusData = await supabaseQuery('personas', `email=eq.${userEmail}&limit=1`, 'ucampus');
if (ucampusData[0]) {
  const inscritos = await supabaseQuery('cursos_inscritos', `rut=eq.${ucampusData[0].rut}&periodo=eq.${periodo}`, 'ucampus');
  personal.ucampus = {
    carrera: ...,   // desde carreras_alumnos
    inscritoEnRamo: inscritos.some(i => ramoMatch(i, link)),  // si el ramo UCampus = ramo Moodle
    creditosSemestre: ...   // suma de créditos de todos sus ramos
  };
}
```

La dificultad principal es el **matching ramo UCampus ↔ curso Moodle**, ya que no hay FK explícita. Hay que hacer matching por nombre de ramo o código, lo que requiere un campo `ucampus_codigo_ramo` en `piac_links` que el DI configura al vincular.

---

## 7. Gaps Técnicos Priorizados

Ordenados por impacto en la experiencia del estudiante y operación del DI:

### Alta prioridad (bloquean casos de uso principales)

| # | Gap | Descripción | Esfuerzo estimado |
|---|---|---|---|
| 1 | **Panel de progreso del estudiante** | `GET /api/curso-virtual/:linkId/progreso` que calcule % completado, semana actual según fechas, próxima actividad pendiente. Hoy los datos de completion existen (`.personal.completion`) pero no hay vista consolidada | 1-2 días |
| 2 | **Re-snapshot sin re-parsear** | Endpoint explícito `POST /api/piac/:linkId/snapshot/refresh` que tome nuevo snapshot de Moodle y re-corra matching, sin tocar el PIAC parseado. Hoy el DI debe hacer dos pasos manuales y saber el orden correcto | 0.5 días |
| 3 | **Cron de grabaciones y calendario** | `portal.cache_recordings` y `portal.cache_calendar` dependen de un cron en el VPS que lea `mod_data` de Moodle. Este cron existe (sistema recording_pipeline.py) pero no está documentado su estado ni si está corriendo para todos los cursos | Verificar + 1 día si falta |
| 4 | **Matching ramo UCampus ↔ curso Moodle** | Campo `ucampus_codigo_ramo` en `piac_links` para que el DI lo configure, y luego cruzar en el endpoint del curso virtual | 1 día |

### Media prioridad (mejoran la operación DI)

| # | Gap | Descripción | Esfuerzo estimado |
|---|---|---|---|
| 5 | **Historial de versiones en UI** | Panel DI que muestre: "parseado 3 veces, última versión 2026-04-01; snapshot 2 veces, última 2026-04-03" con opción de ver JSON de cada versión | 1 día |
| 6 | **Notificación de discrepancias** | Al finalizar el análisis, enviar email al DI con resumen de discrepancias críticas y warnings (usar Brevo noreply@udfv.cloud) | 0.5 días |
| 7 | **Actualización masiva de visado** | UI para ocultar/mostrar grupos de actividades por tipo (ocultar todos los quizzes, ocultar todas las páginas de una sección) en lugar de toggle uno a uno | 1 día |
| 8 | **Bibliografía: importar desde PIAC directamente** | Botón en el panel DI: "Importar bibliografía del PIAC a la tabla enriquecida" — actualmente se hace a mano. La bibliografía del PIAC está en `piac_parsed.bibliografia[]` | 0.5 días |

### Baja prioridad (valor analítico y estratégico)

| # | Gap | Descripción | Esfuerzo estimado |
|---|---|---|---|
| 9 | **xAPI desde el curso virtual al LRS** | Registrar eventos (abrir libro, completar actividad, escribir en foro) con `POST /xAPI/statements` a `lrs.udfv.cloud`. Base para el FONDEF analytics | 2-3 días |
| 10 | **Integración catálogo EOL** | Consumir API Open edX para mostrar cursos disponibles en cursos.umce.cl en UMCE.online (catálogo complementario) | 1-2 días (depende de que EOL exponga API) |
| 11 | **Comparador de snapshots** | Endpoint `GET /api/piac/link/:id/comparar?v1=:id1&v2=:id2` que muestre diff entre dos snapshots Moodle (actividades agregadas/eliminadas/modificadas) | 1 día |
| 12 | **Open Badges por completar curso** | Otorgar badge automáticamente cuando `completion` marca todas las actividades requeridas como completas. La infraestructura OB 3.0 ya existe (17 endpoints implementados) | 1 día |

---

## Mapa de Tablas Supabase Self-Hosted (schema portal) — Relevantes al Curso Virtual

```
portal.piac_links              → Vínculo entre PIAC Drive y curso Moodle
portal.piac_parsed             → JSON estructurado del PIAC (múltiples versiones)
portal.moodle_snapshots        → Snapshot de secciones/módulos Moodle (múltiples versiones)
portal.matching_results        → Resultado del crossing PIAC vs Moodle
portal.discrepancies           → Discrepancias detectadas (con estado de resolución)
portal.curso_virtual_config    → Config DI: foto docente, bio, políticas, visado, publicado
portal.institutional_defaults  → Políticas y textos por defecto institucionales
portal.recursos_adicionales    → Recursos extra que el DI agrega manualmente
portal.curso_virtual_bibliografia → Bibliografía enriquecida y clasificada por el DI
portal.user_moodle_mapping     → Caché email UMCE ↔ userId Moodle (por plataforma)
portal.cache_recordings        → Grabaciones cacheadas por cron (lee mod_data Moodle)
portal.cache_calendar          → Calendario cacheado por cron
ucampus.personas               → Directorio de personas UMCE (sincronizado 2x/día)
ucampus.cursos_inscritos       → Inscripciones de estudiantes por periodo
ucampus.cursos_dictados        → Cursos que dicta cada docente
ucampus.ramos                  → Catálogo de ramos
ucampus.carreras_alumnos       → Carrera del estudiante
```
