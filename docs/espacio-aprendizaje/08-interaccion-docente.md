# Interaccion del Docente con la Capa Visible del Curso

**Fecha**: 2026-04-07
**Version**: 1.0
**Basado en**: `server.js` (endpoints `/api/curso-virtual`, `/api/piac/*`, `/api/ucampus/*`, `/api/docente/*`), `CURSO-VIRTUAL-SPEC.md`, `02-ux-experiencia-unificada.md`, `07-flujo-edicion-di.md`, `04-qa-ciclo-retroalimentacion.md`

---

## Estado actual del sistema de roles

El servidor implementa **3 roles** (no 4): `admin`, `editor`, y usuario autenticado sin rol de CMS.

```
ADMIN_EMAILS: hardcoded en .env (david.reyes_j@umce.cl, udfv@umce.cl)
EDITOR_EMAILS: desde .env (DIes del equipo UDFV)
Cualquier @umce.cl autenticado: accede a /api/curso-virtual como lector/estudiante
```

El rol "docente" como entidad del sistema **no existe aun** en el servidor. Un docente UMCE con email @umce.cl puede autenticarse via Google OAuth, pero en `getUserRole()` devuelve `null` — es decir, tiene acceso de lectura autenticada pero no tiene privilegios de CMS.

La tabla `cursos_dictados` en Supabase (schema `ucampus`) permite verificar si un usuario es docente de una seccion concreta. El endpoint `GET /api/ucampus/seccion/:idCurso` ya usa esta logica: permite acceso al docente de la seccion o a un admin.

---

## 1. Roles y matriz de capacidades

| Accion | Estudiante | Docente (@umce.cl) | DI (editor) | Admin |
|--------|-----------|--------------------|-------------|-------|
| Ver curso virtual publicado | SI | SI | SI | SI |
| Ver curso no publicado | NO (fallback a Moodle) | NO (*) | SI | SI |
| Ver datos de completion propios | SI | SI | SI | SI |
| Ver datos de completion de otros | NO | NO (*) | NO | SI (via ?email=) |
| Ver notas propias inline | SI | SI | SI | SI |
| Ver lista de inscritos de su seccion | NO | SI (`/api/ucampus/seccion/:id`) | NO | SI |
| Ver lista de cursos que dicta (UCampus) | NO | SI (`/api/ucampus`) | NO | SI |
| Editar config del curso (bienvenida, politicas, contenido) | NO | NO (*) | SI | SI |
| Ocultar/mostrar actividades | NO | NO (*) | SI | SI |
| Agregar recursos adicionales | NO | NO (*) | SI | SI |
| Publicar / despublicar un curso | NO | NO | SI | SI |
| Ejecutar analisis PIAC-Moodle | NO | NO | SI | SI |
| Resolver discrepancias | NO | NO | SI | SI |
| Crear/revocar badges | NO | NO | SI | SI |
| Acceder al panel PIAC (`/piac.html`) | NO | NO | SI | SI |
| Impersonar otro usuario (`?email=`) | NO | NO | NO | SI |
| Ver alertas QA del curso | NO | NO (*) | SI | SI |
| Ver notificaciones del curso (`/api/piac/:linkId/notifications`) | NO | NO (*) | SI | SI |

(*) = capacidad prevista en el SPEC, pendiente de implementacion tecnica. Ver seccion 6.

---

## 2. Vista del docente vs vista del estudiante

### Lo que ambos ven igual

Cuando un docente accede a `/api/curso-virtual/:linkId` con su sesion activa, recibe exactamente el mismo payload que un estudiante: estructura de nucleos, contenido, evaluaciones, recursos, config resuelta con defaults institucionales, y sus propios datos personales (completion, grades, recordings, calendar). La diferencia es cero a nivel de endpoint actual.

### Lo que el docente necesita ver que el estudiante no ve

Estas capacidades existen en la infraestructura pero no se proyectan aun en la capa visible del curso (requieren implementacion en Fase A):

**1. Lista de estudiantes por actividad**
- Fuente: `GET /api/ucampus/seccion/:idCurso` devuelve el listado de inscritos con RUT.
- Completion por estudiante: `core_completion_get_activities_completion_status` (Moodle API, por usuario individual). Requiere iterar sobre cada inscrito.
- Estado actual: el endpoint de seccion existe y esta protegido por verificacion de docente en `cursos_dictados`, pero no hay un endpoint que agregue completion de todos los inscritos.
- Endpoint necesario (nuevo): `GET /api/curso-virtual/:linkId/docente/completion` — devuelve, por actividad, cuantos y quienes completaron.

**2. Estado de completion de la clase (X de Y completaron)**
- Calculable desde `cache_completions` si el cron la llena por curso (no por usuario individual).
- Estado actual: `cache_completions` no esta implementado en el servidor; `fetchCompletion` se llama por usuario en tiempo real.
- Endpoint necesario (nuevo): agregado de completion por curso, ejecutado por cron y cacheado.

**3. Alertas QA del curso**
- Fuente: `GET /api/piac/:linkId/notifications` — lista discrepancias y alertas del PIAC-Moodle.
- Estado actual: el endpoint existe pero requiere `adminOrEditorMiddleware`. El docente no tiene acceso.
- Requiere: abrir el endpoint al docente propietario (verificar via `cursos_dictados`).

**4. Hallazgos del Auditor Academico**
- Conceptual (ver `memory/project_auditor_academico.md`): 4 capas (salud, coherencia pedagogica, riesgo, MOCA).
- No implementado en `server.js`. Es la capa de observacion nocturna que alimentaria alertas al DI y al docente.
- Fuente proyectada: resultados de QA (`qa_evaluations` de doc 04), discrepancias activas, cache_completions.

**5. Feedback pendiente de dar**
- Fuente: `mod_assign_get_submissions` (Moodle API) — devuelve entregas con estado `submitted` sin calificacion.
- Estado actual: no hay un endpoint en server.js que exponga esto al docente.
- Endpoint necesario: `GET /api/curso-virtual/:linkId/docente/pendientes` — tareas entregadas sin calificar, con fecha de entrega y dias transcurridos.

**6. Tiempos de respuesta propios**
- El DI configura los "tiempos de respuesta esperados" en `curso_virtual_config.docente_tiempos_respuesta`.
- Comparar con el comportamiento real del docente requiere datos de actividad en foros y gradebook que no se capturan actualmente.
- No implementado.

---

## 3. Acciones de edicion del docente desde la capa visible

### Estado de situacion

Actualmente, el docente no tiene ningun endpoint de escritura propio. Todo lo que afecta al curso virtual pasa por el panel PIAC (`/piac.html`) que requiere rol `admin` o `editor`. La propuesta aqui es definir que acciones tiene sentido delegar al docente directamente desde la vista del curso, sin requerir que acceda al panel PIAC.

### Tabla: acciones de edicion posibles para el docente

| Accion | API Moodle necesaria | Endpoint server.js necesario | Notas |
|--------|---------------------|------------------------------|-------|
| Actualizar mensaje de bienvenida | No (dato en `curso_virtual_config`) | `PATCH /api/curso-virtual/:linkId/docente/config` (nuevo) | Solo campos de bienvenida, bio, foto — no la estructura del curso |
| Cambiar fecha de entrega de una tarea | `mod_assign_update_instance` (Moodle WS) | `PATCH /api/curso-virtual/:linkId/docente/actividad/:cmid/fecha` (nuevo) | Moodle WS `mod_assign_update_instance` requiere token con capacidad de edicion; el token actual es de lectura. Necesita token admin o token de docente |
| Ocultar/mostrar una actividad desde la vista del curso | Solo en `actividades_config` (Supabase) — no modifica Moodle | `PATCH /api/piac/:linkId/config` (existe, pero requiere editor) — adaptar para docente propietario | La visibilidad en UMCE.online es independiente de la visibilidad en Moodle. El docente puede ocultar desde aqui sin tocar Moodle |
| Agregar un recurso adicional (link) | No (dato en `recursos_adicionales`) | `POST /api/piac/:linkId/recursos` (existe, requiere editor) — adaptar | Misma tabla, solo ampliar permisos al docente propietario |
| Agregar un recurso (PDF subido) | No (multer en `/uploads`) | `POST /api/piac/:linkId/recursos/upload` (existe, requiere editor) | Riesgo de almacenamiento; limitar tamano y tipo MIME |
| Editar instrucciones de un foro | `mod_forum_update_discussion` — no en el token actual | No implementado | Requiere token con permisos de edicion en Moodle. Muy complejo para Fase B |
| Subir grabacion de clase (enlace YouTube) | `core_course_get_contents` (lectura) + `core_course_update_course` o `mod_data_add_entry` (escritura) | No implementado | Las grabaciones estan en `mod_data`. Agregar entrada desde UMCE.online requiere el WS `mod_data_add_entry`. Factible, incluido en funciones del token si se configura |

### Regla de autorizacion para el docente

Para cada accion de escritura, el servidor debe verificar que el docente solicitante es propietario del curso. El flujo es:

```
1. Obtener email del usuario autenticado (req.userEmail via authMiddleware)
2. Buscar RUT en Supabase: supabaseQuery('personas', `email=eq.${email}`)
3. Verificar en cursos_dictados: supabaseQuery('cursos_dictados', `rut=eq.${rut}&id_curso=eq.${moodleCourseId}`)
4. Si no esta en cursos_dictados Y no es admin: 403
```

Esta logica ya existe en `GET /api/ucampus/seccion/:idCurso` y puede extraerse como middleware reutilizable.

---

## 4. Compartir entre docentes y programas

### Estado actual del sistema

No existe ningun mecanismo de compartir entre docentes. Los recursos adicionales (`recursos_adicionales`) son propios de cada `piac_link_id`. La configuracion (`curso_virtual_config`) es por curso. No hay un "catalogo de recursos compartidos" ni un sistema de reutilizacion.

### Propuesta de arquitectura para compartir

**4.1 Compartir un recurso (lectura, video) con otro docente**

Opcion A — exportar/importar entre piac_links:
- El docente A hace `GET /api/piac/:linkId/recursos` y descarga la lista.
- Un admin copia ese recurso a otro `piac_link_id` via `POST /api/piac/:linkId2/recursos`.
- Sin interfaz especifica: actualmente el panel PIAC permitiria esto si el DI lo hace manualmente.

Opcion B — pool institucional de recursos (tabla separada, futura):
- Nueva tabla `portal.recursos_institucionales` con `tipo`, `categoria`, `url`, `autor`, `programa`.
- El docente "importa" un recurso del pool a su `recursos_adicionales`.
- Requiere nueva tabla, nuevo endpoint, y UI en el panel.

**4.2 Reutilizar una actividad de otro semestre**

El historial de versiones esta en Supabase: `piac_parsed` (versiones por linkId), `moodle_snapshots`, `matching_results`. Pero no hay un mecanismo de "clonar configuracion de curso anterior".

Propuesta: `POST /api/piac/:linkId/clonar-config?from=:oldLinkId` (nuevo endpoint, admin/editor).
- Copia `curso_virtual_config`, `curso_virtual_bibliografia`, `recursos_adicionales` de un link a otro.
- No copia analisis (piac_parsed, snapshots) — esos son del nuevo PIAC.
- Util al inicio de semestre cuando el docente repite un curso.

**4.3 Exportar configuracion como plantilla**

```
GET /api/piac/:linkId/exportar-plantilla
→ JSON con:
  - config: { bienvenida, politicas, tiempos_respuesta, competencias_digitales }
  - recursos_adicionales: [ { titulo, tipo, url, descripcion } ]
  - bibliografia: [ { titulo, autores, anio, tipo, clasificacion, nucleo } ]
  - (sin datos personales ni completion)

POST /api/piac/:linkId/importar-plantilla
  body: el JSON anterior
  → upsert en config + recursos + bibliografia del nuevo link
```

Esto es mas sencillo que una tabla de plantillas y permite al DI compartir configuraciones entre cursos del mismo programa via archivo JSON.

---

## 5. Notificaciones y alertas para el docente

### Alertas operacionales (origen: Moodle API)

| Alerta | Condicion | Fuente API Moodle | Frecuencia sugerida |
|--------|-----------|-------------------|---------------------|
| "N estudiantes no han accedido en 14 dias" | `core_enrol_get_enrolled_users` con campo `lastaccess`, filtrar los que tienen `lastaccess < now - 14d` | `core_enrol_get_enrolled_users` | Cron diario nocturno |
| "Tienes N entregas sin calificar hace mas de 7 dias" | `mod_assign_get_submissions` con `status=submitted` y `timemodified < now - 7d`, `grade=-1` | `mod_assign_get_submissions` | Cron diario |
| "Foro X lleva N dias sin respuesta tuya" | `mod_forum_get_forum_discussions` + verificar que el ultimo post no es del docente | `mod_forum_get_forum_discussions` | Cron diario |
| "Nueva entrega en tarea Y" | `mod_assign_get_submissions` — delta respecto a ultimo check | `mod_assign_get_submissions` | Cron cada 2-4h o push Moodle |

### Alertas QA del curso (origen: Auditor PA.xx / Matching Engine)

| Alerta | Condicion | Fuente | Cuando |
|--------|-----------|--------|--------|
| "El Auditor detecto: gradebook oculto" | `course.showgrades=0` en snapshot Moodle | `core_course_get_courses` en snapshot | Al tomar snapshot / cron semanal |
| "El Auditor detecto: 3 secciones ocultas que el PIAC indica como activas" | Discrepancias tipo `missing_section` o `visibility_mismatch` en `matching_results` | Matching engine (ya existe) | Al ejecutar `/analyze` |
| "QA: tu curso cumple 65% de los indicadores, D2 es la mas baja" | Score de `qa_evaluations` < umbral por dimension (doc 04) | Sistema QA (doc 04, pendiente M5) | Al ejecutar QA (manual o cron semanal) |
| "Hay actividades en el PIAC que no existen en Moodle" | Discrepancias tipo `missing_in_moodle` en `piac_discrepancies` | Matching engine (ya existe) | Al ejecutar `/analyze` |

### Alertas de apoyo estudiantil (origen: cache Supabase + Moodle)

| Alerta | Condicion | Fuente |
|--------|-----------|--------|
| "El estudiante X no ha completado ninguna actividad en el nucleo 2" | `cache_completions` (cron) — 0% en nucleo actual con semanas ya transcurridas | cache_completions (pendiente implementacion) |
| "Promedio del curso esta por debajo del 4.0" | Agregado de `cache_grades` (cron) | cache_grades (pendiente) |

### Canal de entrega de alertas

El servidor ya tiene infraestructura de push (Firebase, tabla `device_tokens`). Las alertas al docente podrian entregarse por:
1. **Badge en topbar del curso virtual** — indicador de alertas activas, panel desplegable.
2. **Push notification** (movil) — via Firebase, mismo mecanismo que ya se usa para noticias.
3. **Email transaccional** — via Brevo (noreply@udfv.cloud), bajo demanda o digest diario.

El endpoint `GET /api/piac/:linkId/notifications` ya existe y devuelve alertas del Panel PIAC. En Fase A se necesita un endpoint analogo accesible por el docente: `GET /api/curso-virtual/:linkId/docente/alertas`.

---

## 6. Implementacion progresiva

### Fase A: Vista enriquecida del docente (solo lectura)

**Objetivo**: el docente ve mas datos que el estudiante desde la misma URL del curso virtual, sin acceso al panel PIAC.

**Que se necesita tecnicamente:**

1. Agregar deteccion de rol de docente en `GET /api/curso-virtual/:linkId`:
   - Si el usuario autenticado esta en `cursos_dictados` para el `moodle_course_id` del link, inyectar `docente: true` en el payload.
   - Costo: 1 query a Supabase por request (o cacheable por sesion).

2. Nuevo endpoint `GET /api/curso-virtual/:linkId/docente/alumnos`:
   - Devuelve lista de inscritos (de `cursos_inscritos` en UCampus).
   - Por ahora solo lista nombres y RUT anonimizado (o emails si disponibles).
   - Protegido: solo docente propietario o admin.

3. Nuevo endpoint `GET /api/curso-virtual/:linkId/docente/completion-agregado`:
   - Llama `core_completion_get_activities_completion_status` para una muestra de inscritos (o todos, si el curso tiene <= 30).
   - Devuelve: `{ cmid: X, completados: N, total: M }` por actividad.
   - Alternativa mas liviana: usar la tabla `moodle_snapshots` con el campo `completiontracking` por modulo para estimar cuales actividades tienen completion activado.

4. Frontend: agregar bloque "Vista docente" colapsable en la seccion Inicio del curso virtual, con:
   - Numero de inscritos activos (ultimo acceso < 14 dias)
   - Progreso agregado de la clase por nucleo
   - N entregas sin calificar
   - Boton "Ver detalle" que abre el panel expandido

**Que ya existe:**
- `GET /api/ucampus/seccion/:idCurso` (lista de inscritos, requiere ajuste de permisos)
- `GET /api/piac/:linkId/notifications` (alertas del DI — adaptar para docente)
- `fetchCompletion()` en server.js (completion individual, reutilizable)
- `resolveTargetEmail()` + patron de verificacion en `cursos_dictados` (ya en `/api/ucampus/seccion`)

---

### Fase B: Edicion basica desde la vista del curso

**Objetivo**: el docente puede hacer cambios de bajo riesgo sin salir de la vista del curso, sin acceder al panel PIAC.

**Que se necesita tecnicamente:**

1. Middleware `docenteOwnerMiddleware(req, res, next)`:
   - Verifica que `req.userEmail` esta en `cursos_dictados` para el `moodle_course_id` del link.
   - Reutiliza la logica existente en `GET /api/ucampus/seccion/:idCurso`.

2. Nuevo endpoint `PATCH /api/curso-virtual/:linkId/docente/config`:
   - Campos permitidos: `docente_foto_url`, `docente_bio`, `docente_video_bienvenida`, `docente_mensaje_bienvenida`, `docente_horario_atencion`, `docente_tiempos_respuesta`.
   - NO permite modificar: `publicado`, `actividades_config`, `politicas_curso`, `politica_integridad` (esos siguen siendo del DI).
   - Hace PATCH sobre `curso_virtual_config` en Supabase directamente.

3. Nuevo endpoint `PATCH /api/curso-virtual/:linkId/docente/actividad/:cmid/visibilidad`:
   - Permite toggle `visible: true/false` en `actividades_config[cmid]` dentro de `curso_virtual_config`.
   - Solo modifica la visibilidad en UMCE.online, NO en Moodle.
   - Requiere `docenteOwnerMiddleware`.

4. Ampliar `POST /api/piac/:linkId/recursos` y `POST /api/piac/:linkId/recursos/upload`:
   - Cambiar middleware de `adminOrEditorMiddleware` a `adminOrEditorOrDocenteOwnerMiddleware`.
   - El docente puede agregar recursos pero no puede eliminar los que no creo el.

5. Frontend: modo edicion inline en la vista del curso.
   - Boton "Editar" visible solo si `docente: true` en el payload.
   - Para la bienvenida: campo de texto editable inline con guardar/cancelar.
   - Para actividades: icono de ojo al lado de cada actividad en modo docente.
   - Para recursos: boton "+ Agregar recurso" en la seccion correspondiente.

**Que ya existe:**
- `PUT /api/piac/:linkId/config` (upsert de toda la config — se puede reutilizar con whitelist de campos)
- `POST /api/piac/:linkId/recursos` y `/upload` (existen, solo ampliar permisos)
- `resolvedConfig.actividades_config` (estructura ya definida en el endpoint)

---

### Fase C: Edicion avanzada con sincronizacion bidireccional a Moodle

**Objetivo**: el docente puede modificar elementos que viven en Moodle desde la vista del curso: fechas, descripciones de foros, agregar grabaciones.

**Que se necesita tecnicamente:**

1. **Token de Moodle con permisos de escritura para el docente:**
   - El token actual en `.env` (MOODLE_*_TOKEN) es un token de administrador usado para lectura global. Para escritura por parte del docente, se necesita:
     - Opcion A: usar el mismo token admin para operaciones acotadas (simplifica implementacion, mayor riesgo).
     - Opcion B: autenticar al docente en Moodle con sus propias credenciales (`validateMoodleLogin`), obtener un token personal, usarlo para las operaciones de escritura (mayor seguridad, mayor complejidad).
   - El servidor ya tiene `validateMoodleLogin()` implementado. El flujo seria: al primer uso de Fase C, el docente ingresa su RUT (username Moodle) y el sistema valida via Moodle login/token.php. El token resultante se almacena temporalmente en sesion (no en Supabase — riesgo de seguridad).

2. **Cambio de fechas de entrega:**
   - WS: `mod_assign_update_instance` (requiere el token del docente o admin con capability `mod/assign:addinstance`).
   - Alternativa mas segura: solo actualizar la fecha en `actividades_config` de UMCE.online (sin tocar Moodle) y mostrar la fecha actualizada al estudiante — no sincroniza con Moodle pero no requiere escritura.

3. **Edicion de instrucciones de foros:**
   - WS: `mod_forum_update_discussion` — disponibilidad variable segun version de Moodle.
   - Para Moodle 3.8 (postgrado): verificar si el WS existe. En 3.8 no siempre esta disponible.
   - Alternativa: link directo al foro en Moodle para edicion ahi.

4. **Agregar grabacion de clase:**
   - WS: `mod_data_add_entry` — agrega una entrada al campo mod_data del curso.
   - Requiere conocer el `dataid` y los `fieldids` del mod_data de grabaciones del curso.
   - El snapshot ya captura modulos `mod_data` — los `fieldids` podrian extraerse del snapshot.
   - Factible con token admin. Con token del docente requiere que el docente tenga capacidad de agregar entradas al database de Moodle.
   - Endpoint nuevo: `POST /api/curso-virtual/:linkId/docente/grabacion` — recibe `{ fecha, youtube_url, titulo }`, llama `mod_data_add_entry`.

5. **Sincronizacion bidireccional completa:**
   - Cuando el docente cambia algo en Moodle directamente (agrega un recurso, cambia una fecha), UMCE.online debe detectarlo en el proximo snapshot.
   - El flujo ya existe: DI hace "Solo leer Moodle" (`POST /api/piac/:linkId/snapshot`) para actualizar el snapshot.
   - En Fase C, un cron podria tomar snapshots automaticos cuando se detectan cambios (via webhook de Moodle si disponible, o por comparacion periodica).

**Que ya existe:**
- `validateMoodleLogin()` (autenticacion de usuario en Moodle)
- `moodleCall()` (generico, acepta cualquier token)
- `POST /api/piac/:linkId/snapshot` (para refrescar el estado de Moodle)
- Estructura de `moodle_snapshots` con `snapshot_json` que incluye `mod_data`

---

## 7. Tabla de dependencias entre fases

| Componente | Fase A | Fase B | Fase C | Dependencias |
|------------|--------|--------|--------|--------------|
| Deteccion de rol docente en `/api/curso-virtual` | X | — | — | `cursos_dictados` en UCampus |
| Middleware `docenteOwnerMiddleware` | — | X | X | Fase A (deteccion) |
| Vista enriquecida en frontend | X | — | — | Fase A (backend) |
| `PATCH /docente/config` (bienvenida) | — | X | — | Fase B (middleware) |
| Toggle visibilidad actividades (docente) | — | X | — | Fase B (middleware) |
| Agregar recursos adicionales (docente) | — | X | — | Fase B (middleware) |
| Cambio de fechas en Moodle | — | — | X | Token con escritura |
| Agregar grabacion (`mod_data_add_entry`) | — | — | X | Token con escritura |
| Alertas docente (`/docente/alertas`) | X | — | — | Matching engine existente |
| Completion agregado del curso | X | — | — | Cron + cache, o llamada directa |

---

## 8. Puntos de decision criticos

**Decision 1 — Verificacion de docente por UCampus o por PIAC**

El sistema actual verifica al docente via `cursos_dictados` en el schema UCampus (RUT del docente contra el ID de curso UCampus). El problema: el `moodle_course_id` que usa UMCE.online no es el mismo que el `id_curso` de UCampus. Se necesita una tabla de mapeo `moodle_course_id ↔ id_curso_ucampus`. Esta tabla no existe. Alternativa provisional: verificar el email del docente contra `piac.identificacion.email_docente` del PIAC parseado — si el email del docente autenticado coincide con el email del docente en el PIAC, se le otorgan permisos de escritura limitada.

**Decision 2 — Separacion de permisos DI vs docente**

El DI tiene acceso completo a la configuracion del curso via el panel PIAC. El docente en Fase B tendra acceso a un subset de campos. Para evitar que el docente sobreescriba la configuracion del DI, el `PATCH /docente/config` debe implementar una whitelist estricta de campos editables. Los campos criticos (`actividades_config` completo, `politica_integridad`, el toggle de publicacion) quedan exclusivamente en manos del DI.

**Decision 3 — Token Moodle para escritura en Fase C**

Usar el token admin para escritura de docentes introduce riesgo (cualquier docente podria afectar cualquier curso si hay un bug de autorizacion). La alternativa segura es autenticar al docente con sus propias credenciales Moodle (RUT/password) y usar ese token personal. Esto requiere que el docente ingrese su contrasena una vez por sesion, lo que puede ser friccion. Evaluar segun casos de uso reales antes de implementar Fase C.
