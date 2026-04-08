# Flujo de Edición y Actualización del Diseñador Instruccional (DI)

**Fecha**: 2026-04-07
**Versión**: 1.0
**Basado en**: `server.js` (líneas 3994–5490), `piac.html` (panel UI actual), `CURSO-VIRTUAL-SPEC.md` (sección "Flujo del DI"), `03-pipeline-planificador-piac-moodle.md`

---

## 1. Flujo actual del DI (lo que YA funciona)

### Requisitos de acceso

El DI necesita estar autenticado con Google OAuth `@umce.cl` y tener rol `admin` o `editor` (definido en `ADMIN_EMAILS` / `EDITOR_EMAILS` en `.env`). Todos los endpoints del Panel PIAC usan `adminOrEditorMiddleware`.

### Paso a paso: crear y analizar un vínculo

**Paso 1 — Acceder al panel PIAC**
- URL: `/piac.html`
- La página verifica sesión activa; si no hay sesión redirige al auth gate.
- Se carga la lista de vínculos PIAC activos (`GET /api/piac/links`).

**Paso 2 — Crear un nuevo vínculo**
- El DI hace clic en "Nuevo vínculo".
- Rellena 3 campos: plataforma Moodle (select entre 5 opciones), ID del curso Moodle (número), URL del PIAC en Google Drive.
- Envía `POST /api/piac/link` con `{ moodle_platform, moodle_course_id, drive_url, program_id? }`.
- El servidor extrae el `drive_file_id` de la URL y persiste en la tabla `piac_links`.
- Respuesta: `{ id, platform, course_id, drive_url }`.

**Paso 3 — Abrir el detalle del vínculo**
- Click en un vínculo de la lista carga `GET /api/piac/link/:id`.
- Se muestra cabecera con nombre del curso, plataforma, badge de estado, botones de acción.

**Paso 4 — Ejecutar el análisis completo (parse + snapshot + match)**
- El DI hace clic en "Comparar PIAC con Moodle" → llama `POST /api/piac/:linkId/analyze`.
- Pipeline interno (todo en una sola llamada):
  1. **Parse PIAC** (`POST /api/piac/:linkId/parse` internamente): descarga el `.docx` de Google Drive, lo convierte a texto con `mammoth`, lo pasa a Claude (proxy interno) con un system prompt especializado, guarda el JSON estructurado en `piac_parsed`.
  2. **Snapshot Moodle** (`POST /api/piac/:linkId/snapshot` internamente): llama `core_course_get_contents` a la plataforma correspondiente, guarda la estructura de secciones y actividades en `moodle_snapshots`.
  3. **Matching** (`POST /api/piac/:linkId/match` internamente): cruza `piac_parsed` con `moodle_snapshots`, genera discrepancias (`piac_discrepancies`) y resultados de matching (`matching_results`).
- La UI muestra barra de progreso con 3 pasos visibles ("Leyendo PIAC", "Leyendo Moodle", "Comparando").
- Tiempo estimado: 10–30 segundos.
- Alternativas granulares (menú "..."):
  - "Solo leer PIAC" → `POST /api/piac/:linkId/parse` (async, retorna `jobId`, se hace polling en `GET /api/piac/job/:jobId`).
  - "Solo leer Moodle" → `POST /api/piac/:linkId/snapshot`.

**Paso 5 — Ver resultados del análisis**
- 4 pestañas de resultados:
  - **Planificación**: PIAC parseado en formato legible.
  - **Comparación**: tabla de matching PIAC ↔ Moodle, elemento a elemento.
  - **Problemas**: discrepancias clasificadas por severidad (crítica / advertencia / info).
  - **Datos**: JSON técnico crudo de PIAC y snapshot.
- Tarjetas de resumen: número de núcleos, secciones, vinculados, críticas, advertencias.
- El DI puede resolver discrepancias inline: selecciona acción y guarda con `POST /api/piac/discrepancy/:id/resolve`.

**Paso 6 — Organizar el curso virtual**
- Botón "Organizar" → panel de drag & drop sobre actividades por sección.
- Permite reordenar y marcar visibilidad (ojo por actividad).
- Guarda cambios en `actividades_config` dentro de `curso_virtual_config` vía `PUT /api/piac/:linkId/config`.

**Paso 7 — Configurar el curso virtual**
- Botón "Configurar" → abre el panel de configuración (integrado en `piac.html`).
- 6 pestañas (ver sección 4 para detalle):
  1. Bienvenida
  2. Políticas
  3. Contenido
  4. Objetivos semanales
  5. Foros
  6. Bibliografía
- Cada pestaña guarda al hacer clic "Guardar" → `PUT /api/piac/:linkId/config`.
- Toggle "Publicar" en la cabecera del panel → `POST /api/piac/:linkId/config/publish` o `/unpublish`.

**Paso 8 — Preview**
- Enlace "Preview" en la cabecera del panel config → `GET /api/piac/:linkId/preview`.
- Devuelve la misma estructura que el endpoint `curso-virtual` pero ignorando el flag `publicado`.
- Abre en nueva pestaña la vista del estudiante con los datos actuales del DI.

**Paso 9 — Publicar**
- Toggle "Publicar" o botón equivalente → `POST /api/piac/:linkId/config/publish`.
- Validación previa: si no existe `piac_parsed` + `moodle_snapshots`, el servidor devuelve error 400.
- Si pasa la validación: `publicado=true` en `curso_virtual_config`.
- El curso virtual queda visible para estudiantes autenticados.

### Gestión de bibliografía

Ya implementado en la pestaña "Bibliografía" del panel config:
- Listar: `GET /api/piac/:linkId/bibliografia`
- Agregar: `POST /api/piac/:linkId/bibliografia`
- Editar: `PUT /api/piac/bibliografia/:id`
- Eliminar: `DELETE /api/piac/bibliografia/:id`
- Dashboard de calidad: `GET /api/piac/:linkId/bibliografia/calidad`

### Gestión de recursos adicionales

Para recursos que no vienen del PIAC ni de Moodle:
- `GET /api/piac/:linkId/recursos`
- `POST /api/piac/:linkId/recursos` (URL)
- `POST /api/piac/:linkId/recursos/upload` (archivo subido con multer)
- `PUT /api/piac/recursos/:id`
- `DELETE /api/piac/recursos/:id`

---

## 2. Flujo objetivo del DI (lo que DEBERÍA funcionar según el SPEC)

Según `CURSO-VIRTUAL-SPEC.md` y `03-pipeline-planificador-piac-moodle.md`, el flujo completo previsto tiene dos rutas de entrada al vínculo PIAC-Moodle:

### Ruta A: Desde el Planificador (flujo ideal)

```
1. DI usa el Planificador Curricular (virtualizacion-planificador.html)
   → Configura: módulo, SCT, semanas, perfil, formato
   → Agrega actividades de aprendizaje (categorías IN, EC, EA, EB, EE, ED, EV)
   → Valida carga horaria (semáforo verde/amarillo/rojo)
   → Hace clic "Guardar diseño"
   → POST /api/planificador/guardar → persiste en planificador_designs

2. DI genera borrador PIAC desde el diseño
   → POST /api/planificador/:id/generar-piac
   → Algoritmo transforma actividades en estructura de núcleos/sesiones
   → Guarda en piac_drafts (status='draft')

3. DI exporta borrador a Google Drive como documento Word
   → POST /api/planificador/:id/exportar-drive
   → Genera Google Doc en la carpeta compartida
   → Retorna drive_url para el siguiente paso

4. DI completa y ajusta el documento Word en Google Drive
   (edición directa en Drive — fuera del sistema)

5. DI crea vínculo PIAC-Moodle
   → POST /api/piac/link con el drive_url ya conocido + moodle_course_id
   → El borrador queda linked_piac_id en piac_drafts

6. DI ejecuta análisis: parse + snapshot + match
   → POST /api/piac/:linkId/analyze

7. DI configura el curso virtual
   → Panel config con 6 pestañas (ya implementado)
   → PUT /api/piac/:linkId/config

8. DI hace preview y valida
   → GET /api/piac/:linkId/preview

9. DI publica el curso
   → POST /api/piac/:linkId/config/publish
```

### Ruta B: Desde PIAC existente (flujo actual — ya funciona)

```
1. DI tiene el PIAC en Google Drive (pre-existente)
2. DI crea vínculo: POST /api/piac/link
3. DI ejecuta análisis: POST /api/piac/:linkId/analyze
4. DI configura: PUT /api/piac/:linkId/config (6 pestañas)
5. DI hace preview: GET /api/piac/:linkId/preview
6. DI publica: POST /api/piac/:linkId/config/publish
```

---

## 3. Gap analysis

| Paso del flujo | Estado actual | Qué falta |
|---|---|---|
| **Crear vínculo PIAC-Moodle** | Implementado | — |
| **Parse PIAC desde Drive (async)** | Implementado | — |
| **Snapshot Moodle** | Implementado | — |
| **Matching PIAC ↔ Moodle** | Implementado | — |
| **Resolver discrepancias** | Implementado | — |
| **Organizar actividades (drag & drop)** | Implementado | — |
| **Panel config: pestaña Bienvenida** | Implementado | — |
| **Panel config: pestaña Políticas** | Implementado | — |
| **Panel config: pestaña Contenido** | Implementado (toggle visible/oculto) | Falta: tiempo estimado por actividad (minutos), etiqueta obligatorio/complementario por actividad, objetivo de aprendizaje asociado por actividad |
| **Panel config: pestaña Objetivos semanales** | Implementado (campo texto libre por semana) | Se poblan dinámicamente desde snapshot; falta validar que los campos se generen correctamente si el parsing de semanas falla |
| **Panel config: pestaña Foros** | Implementado (cmid de foro presentación + consultas) | — |
| **Panel config: pestaña Bibliografía** | Implementado (CRUD completo + formulario inline) | Falta: pre-carga automática desde `piac_parsed.parsed_json.bibliografia` al abrir la pestaña; actualmente es CRUD manual; falta cron de verificación de URLs/DOI (SPEC fase 4) |
| **Preview antes de publicar** | Implementado | La UI actual tiene el enlace "Preview" en la cabecera del config panel, pero no hay botón dedicado de preview antes de abrir el panel de configuración |
| **Publicar / Despublicar** | Implementado (toggle switch + endpoints) | — |
| **Validación pre-publicación** (exige parsed + snapshot) | Implementado en endpoint | No hay indicador visual claro en la UI que explique por qué está bloqueado si falta análisis |
| **Planificador → guardar diseño** | Pendiente | `POST /api/planificador/guardar` no está en `server.js` actual; está documentado en doc 03 pero no implementado |
| **Generar borrador PIAC desde planificador** | Pendiente | `POST /api/planificador/:id/generar-piac` y la función `generatePIACDraft()` están solo en el doc 03, no en el servidor |
| **Exportar borrador PIAC a Drive** | Pendiente | `POST /api/planificador/:id/exportar-drive` no existe |
| **Vincular diseño de planificador con piac_link** | Pendiente | FK `piac_link_id` en `planificador_designs` está definida en el schema del doc 03, no aplicada |
| **Validación cruzada M3↔M4↔M5** | Pendiente | `validation_runs` y `GET /api/validacion/:designId` no implementados |
| **Defaults institucionales editables (admin)** | Parcialmente implementado | `GET /api/institutional-defaults` y `PUT /api/institutional-defaults/:key` existen; no hay UI en el panel para editarlos |
| **Tiempos de respuesta (email, foro, tareas)** | Implementado en config | — |
| **Cron verificación URLs bibliografía** | Pendiente | SPEC indica verificación semanal vía HEAD requests + CrossRef API (Fase 4) |
| **Dashboard calidad bibliografía agregado** | Parcialmente | `GET /api/piac/:linkId/bibliografia/calidad` existe; vista de acreditación institucional (`/api/admin/calidad-bibliografica`) no implementada |
| **Rol "docente" con acceso limitado** | Pendiente | SPEC indica que en fase futura el docente podría configurar su propio curso; actualmente solo admin/editor |
| **Notificación push al publicar** | Pendiente | SPEC indica push al publicar por primera vez (Fase 3-B) |

---

## 4. UI de edición

### Lo que tiene la UI actual (piac.html)

La UI está en una sola página (`/piac.html`). El flujo de edición vive en el panel inferior que se abre al hacer clic en "Configurar" desde el detalle de un vínculo.

#### Estructura general

```
+------------------------------------------------------------------+
|  [U] /  Panel PIAC       [Admin] [Mis cursos]    user@umce.cl   |
+------------------------------------------------------------------+
|                                                                    |
|  Panel PIAC                           [+ Nuevo vínculo]          |
|  Esta herramienta compara la planificación...                     |
|                                                                    |
|  [ Lista de vínculos PIAC-Moodle ]                               |
|    Vínculo N — PLATAFORMA — ID — drive_url                       |
|                                                                    |
+------------------------------------------------------------------+
  (al click en un vínculo)
+------------------------------------------------------------------+
|  [<] NOMBRE DEL CURSO   [BADGE plataforma]                       |
|                                                                    |
|  [Comparar PIAC con Moodle]  [status]                            |
|  [Curso virtual] [Organizar] [Configurar] [...]                  |
|                                                                    |
|  Barra de progreso (hidden → visible al analizar)                |
|  ○ Leyendo PIAC   ○ Leyendo Moodle   ○ Comparando               |
|                                                                    |
|  [Planificación] [Comparación N] [Problemas N] [Datos]           |
|  ----------------------------------------------------------       |
|  (contenido de la pestaña activa)                                |
|                                                                    |
|  Alertas del curso                                               |
|                                                                    |
|  +-- Panel Configurar (hidden → visible al clic) ─────────────+ |
|  | Configurar curso virtual     [No publicado] [toggle] [Preview]||
|  |                                                               ||
|  | [Bienvenida] [Políticas] [Contenido] [Obj. semanales] [Foros]||
|  | [Bibliografía]                                                ||
|  | ──────────────────────────────────────────────────────────── ||
|  | (formulario de la pestaña activa)                            ||
|  | [Guardar]                                                     ||
|  +───────────────────────────────────────────────────────────── +|
+------------------------------------------------------------------+
```

#### Las 6 pestañas del panel de configuración (implementadas)

| # | Pestaña | Campos implementados |
|---|---------|---------------------|
| 1 | **Bienvenida** | Foto docente (URL), Video bienvenida (URL YouTube), Bio profesional, Mensaje de bienvenida, Descripción motivacional, Horario atención, Conocimientos previos |
| 2 | **Políticas** | Políticas del curso (textarea), Política de integridad académica, Requisitos de participación en foros, Competencias digitales esperadas, Tiempos de respuesta (email / foro / tareas) |
| 3 | **Contenido** | Lista de actividades por sección con toggle visible/oculto; botones "Mostrar todas" / "Ocultar todas" |
| 4 | **Objetivos semanales** | Campo de texto libre por semana (generado dinámicamente desde el PIAC) |
| 5 | **Foros** | Foro de presentación (cmid), Foro de consultas generales (cmid) |
| 6 | **Bibliografía** | CRUD completo: título*, autores, año, tipo, clasificación, acceso, núcleo, URL, DOI, toggle "es clásico"; lista con indicadores de estado |

#### Lo que debería tener (gaps de la pestaña Contenido)

Según el SPEC, la pestaña "Contenido" debería tener por actividad:

```
+-- Actividad: "Foro Sesión 3" ─────────────────────────────────+
| [ojo] Visible para estudiantes                                   |
| Tipo: [Obligatorio v]  [Complementario]                          |
| Tiempo estimado: [__] min                                        |
| Objetivo de aprendizaje: [______________________________]        |
| Link Moodle: [abrir]                                             |
+──────────────────────────────────────────────────────────────── +
```

Actualmente solo tiene el toggle de visibilidad (ojo). Faltan los 3 campos adicionales.

#### Wireframe del flujo DI completo (ASCII)

```
LISTA DE VÍNCULOS
┌────────────────────────────────────────────────────────────┐
│ Vínculo 1 — virtual — Fundamentos Educación Intercultural  │
│ Vínculo 2 — postgrado — Metodología Investigación          │
│ [+ Nuevo vínculo]                                          │
└────────────────────────────────────────────────────────────┘
           │
           ▼ click
DETALLE DEL VÍNCULO
┌────────────────────────────────────────────────────────────┐
│ [<] Fundamentos Educación Intercultural  [VIRTUAL]         │
│                                                            │
│ TOOLBAR:                                                   │
│ [Comparar PIAC con Moodle]  •  [Curso virtual ↗]          │
│                             [Organizar] [Configurar] [···] │
└────────────────────────────────────────────────────────────┘
           │
           ▼ click "Comparar"
ANÁLISIS (4 pestañas)
┌────────────────────────────────────────────────────────────┐
│ [Planificación] [Comparación 12] [Problemas 3] [Datos]     │
│                                                            │
│ (contenido del análisis)                                   │
└────────────────────────────────────────────────────────────┘
           │
           ▼ click "Configurar"
PANEL CONFIG (6 pestañas, debajo del análisis)
┌────────────────────────────────────────────────────────────┐
│ Configurar curso virtual                                   │
│ [No publicado ○────] [Preview ↗]                           │
│                                                            │
│ [Bienvenida][Políticas][Contenido][Obj. sem.][Foros][Biblio]│
│ ──────────────────────────────────────────────────────────  │
│ (formulario pestaña activa)                                │
│                                                            │
│ [Guardar]                                                  │
└────────────────────────────────────────────────────────────┘
           │
           ▼ toggle "Publicar"
PUBLICADO
┌────────────────────────────────────────────────────────────┐
│ [Publicado ●────]  ← switch verde                          │
│ Visible para estudiantes desde ahora                       │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Ciclo de actualización

### Actualización de un curso ya publicado

Un curso publicado (`publicado=true`) puede actualizarse en cualquier momento sin necesidad de despublicar.

#### Qué es automático

| Dato | Mecanismo | Frecuencia |
|------|-----------|-----------|
| Datos dinámicos del estudiante (completion, notas) | Cron que actualiza `cache_completions`, `cache_grades`, `cache_submissions` | Frecuente + nocturno + horario (según SPEC) |
| Alertas del curso | `GET /api/piac/:linkId/notifications` en el panel DI | Bajo demanda (botón "Actualizar") |
| Verificación de URLs bibliografía | Cron semanal HEAD requests + CrossRef | Semanal (Fase 4, aún pendiente) |

#### Qué es manual (lo hace el DI)

**Escenario 1: El PIAC cambió en Drive**
```
1. DI abre Panel PIAC → selecciona el vínculo
2. Click "Comparar PIAC con Moodle" (o "Solo leer PIAC" desde el menú "...")
   → POST /api/piac/:linkId/analyze  (o /parse solo)
   → Nueva versión en piac_parsed (version N+1)
3. El análisis muestra qué cambió respecto al snapshot de Moodle
4. DI resuelve nuevas discrepancias si las hay
5. DI actualiza configuración si es necesario (PUT /api/piac/:linkId/config)
6. El curso virtual ya sirve la nueva estructura (no requiere re-publicar)
```

**Escenario 2: El curso Moodle cambió (docente agregó/quitó actividades)**
```
1. DI abre Panel PIAC → selecciona el vínculo
2. Click "Solo leer Moodle" desde el menú "..." 
   → POST /api/piac/:linkId/snapshot
   → Nuevo snapshot en moodle_snapshots
3. Click "Comparar PIAC con Moodle" para ejecutar matching con el nuevo snapshot
   → POST /api/piac/:linkId/analyze
4. DI revisa nuevas discrepancias
5. DI ajusta visibilidad de actividades nuevas (pestaña Contenido)
6. Cambios se guardan con PUT /api/piac/:linkId/config
```

**Escenario 3: El DI quiere actualizar solo la configuración (texto, políticas, fotos)**
```
1. DI abre Panel PIAC → selecciona el vínculo
2. Click "Configurar"
3. Edita los campos en las pestañas correspondientes
4. Click "Guardar"
   → PUT /api/piac/:linkId/config (partial update, no sobreescribe campos no tocados)
5. El curso virtual refleja los cambios de inmediato
   (no requiere re-publicar ni nuevo análisis)
```

**Escenario 4: El DI quiere retirar temporalmente el curso**
```
1. DI abre Panel PIAC → selecciona el vínculo → "Configurar"
2. Toggle "Publicado" → apagar
   → POST /api/piac/:linkId/config/unpublish
   → publicado=false
3. Los estudiantes ven fallback: vista simplificada + link a Moodle
4. Para volver a publicar: toggle → encender → POST /api/piac/:linkId/config/publish
```

### Versioning del análisis

- Cada ejecución de parse crea una nueva versión en `piac_parsed` (campo `version` incremental).
- Cada snapshot crea un nuevo registro en `moodle_snapshots`.
- El `GET /api/piac/link/:id` siempre devuelve el **más reciente** (`order=parsed_at.desc limit=1`, `order=snapshot_at.desc limit=1`).
- Las versiones anteriores permanecen en Supabase para auditoría, pero no se muestran en la UI actual.

### Tabla resumen: automático vs. manual

| Acción | Automático | Manual (DI) | Endpoint |
|--------|-----------|-------------|----------|
| Refresh PIAC desde Drive | No | Sí — "Comparar" o "Solo leer PIAC" | `POST /analyze` o `/parse` |
| Refresh snapshot Moodle | No | Sí — "Solo leer Moodle" | `POST /snapshot` |
| Re-ejecutar matching | No | Sí — parte del "Comparar" | `POST /analyze` o `/match` |
| Actualizar config (textos, fotos) | No | Sí — panel config pestañas | `PUT /config` |
| Toggle visibilidad de actividades | No | Sí — pestaña Contenido | `PUT /config` (actividades_config) |
| Verificación URLs bibliografía | Sí (cron — pendiente) | No | — |
| Cache completion/notas estudiante | Sí (cron) | No directo | — |
| Publicar / Despublicar | No | Sí — toggle en panel config | `POST /config/publish` o `/unpublish` |

---

## Notas técnicas relevantes

- **PUT /api/piac/:linkId/config** hace upsert: si no existe config crea, si existe actualiza. Los campos `publicado`, `publicado_at`, `publicado_por` están protegidos y solo se modifican via los endpoints `/publish` y `/unpublish`.
- **GET /api/piac/:linkId/preview** reutiliza la lógica del endpoint `curso-virtual` pero salta el check de `publicado=true`. Requiere que exista al menos 1 `piac_parsed` + 1 `moodle_snapshots`; si no existe, devuelve 404 con mensaje "Curso sin análisis — ejecuta Analizar primero".
- **POST /api/piac/:linkId/config/publish** valida que existan `piac_parsed` y `moodle_snapshots` antes de publicar. Si no hay análisis, devuelve 400.
- **La configuración siempre tiene defaults institucionales**: si el DI no configura nada, el estudiante igual ve textos razonables desde `institutional_defaults`. Los campos marcados como "Obligatorio" en el SPEC nunca quedan vacíos.
- **El PIAC nunca se sube**: se lee desde Google Drive en cada parse. El DI edita el Word en Drive directamente; el sistema solo descarga y parsea.
- **La IA no crea ni modifica nada en Moodle**: solo observa, parsea, compara y alerta.
