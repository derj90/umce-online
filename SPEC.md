# SPEC.md — Especificacion de desarrollo UMCE.online

Ultima actualizacion: 25-mar-2026

Este archivo es la fuente de verdad para el desarrollo. Cada fase tiene:
- Estado (PENDIENTE / EN PROGRESO / COMPLETADA)
- Que leer antes de empezar
- Que construir (concreto)
- Criterios de aceptacion
- Anti-patrones especificos de la fase

Las fases se detallan solo cuando estan proximas a ejecutarse.
Las fases futuras son esqueleto — se completan con David antes de empezar.

---

## Fase 1: Migracion virtual.udfv.cloud → umce.online

**Estado**: COMPLETADA
**Ultima sesion**: 25-mar-2026
**Objetivo**: El portal actual (virtual.udfv.cloud) funciona identico en umce.online. Sin cambios de funcionalidad.

### Leer antes de empezar
- `~/Documents/43_VIRTUAL_UMCE_WEB/src/server.js` — lineas 1-100 (config, middleware, imports)
- `~/Documents/43_VIRTUAL_UMCE_WEB/src/Dockerfile`
- `~/Documents/43_VIRTUAL_UMCE_WEB/src/.github/workflows/deploy.yml`
- `~/Documents/43_VIRTUAL_UMCE_WEB/src/package.json`
- `~/Documents/43_VIRTUAL_UMCE_WEB/src/.env` (estructura, NO copiar tokens)

### Que construir

- [x] **1.1 Copiar codebase** — Traer `src/` completo de 43_VIRTUAL_UMCE_WEB a este repo
- [x] **1.2 Actualizar BASE_URL** — Cambiar `https://virtual.udfv.cloud` a `https://umce.online` en server.js y 60+ refs en HTML/XML
- [x] **1.3 Actualizar OAuth callback** — David creo nuevo Client OAuth (ID: ...29q632sd) con redirect https://umce.online/auth/callback
- [x] **1.4 Configurar Traefik** — Labels Docker actualizados para umce.online + www + piac con SSL
- [x] **1.5 Actualizar deploy script** — docker-compose.yml actualizado para Express (era Next.js), credenciales OAuth nuevas
- [x] **1.6 Actualizar CI/CD** — `.github/workflows/deploy.yml` apunta a /opt/deploy-umce-online.sh, VPS_SSH_KEY secret configurado
- [x] **1.7 Redirect dominio anterior** — virtual.udfv.cloud redirige 308 permanente a umce.online (container viejo detenido)
- [x] **1.8 Verificar SSL** — HTTPS 200, Let's Encrypt via Traefik funcionando
- [x] **1.9 Test OAuth completo** — Login david.reyes_j@umce.cl OK, sesion activa, cookie, Admin visible
- [x] **1.10 Test funcionalidades** — API catalogo (13 programas), mis-cursos (24 cursos, 5 Moodles), modo Admin OK
- [x] **1.11 Test mobile** — N/A, app movil aun no publicada
- [x] **1.12 Documentar .env.example** — Template con 17 variables sin tokens reales

### Criterios de aceptacion
- umce.online sirve exactamente lo mismo que virtual.udfv.cloud
- virtual.udfv.cloud redirige a umce.online
- Google OAuth funciona con el nuevo dominio
- Las 5 conexiones Moodle responden correctamente
- Chatbot Claude funciona
- Admin panel funciona para ADMIN_EMAILS y EDITOR_EMAILS
- No hay tokens ni secrets en el repo

### Anti-patrones de esta fase
- NO refactorizar codigo durante la migracion — es copy+paste+config, nada mas
- NO agregar features nuevas — la migracion es transparente
- NO cambiar la estructura de archivos — mantener la misma organizacion
- NO tocar el schema de Supabase — solo cambiar la URL si es necesario

### Notas
- El container actual en VPS se llama `virtual-udfv-1bqt3f-virtual-udfv-1`
- Puerto interno: 3000
- David debe actualizar manualmente: Google Cloud Console OAuth redirect, Capacitor config

---

## Fase 2: Lector PIAC + Lector Moodle + Matching

**Estado**: EN PROGRESO
**Ultima sesion**: 25-mar-2026
**Objetivo**: El sistema lee un PIAC desde Google Drive, lee un curso Moodle via API, y encuentra relaciones/discrepancias entre ambos. El DI ve el resultado en un panel.

### Leer antes de empezar
- [x] SPEC Fase 2 detallada (este archivo)
- [x] Notion: definiciones tecnicas del PIAC → https://www.notion.so/32e0778552798118ab7dcf2563971f21
- [x] Notion: Orientaciones PIAC UGCI → https://www.notion.so/2696ea8a1d8f43a68458dea55f29606a
- [x] Notion: Arquitectura umce.online → https://www.notion.so/32e07785527981b48f90e52a5db26506
- [x] Notion: Motor IA Cron + LLM → https://www.notion.so/32e077855279818ea757d4449a7c4760
- [x] `server.js` — moodleCall helper (linea 154), PLATFORMS config (linea 88), queryAllPlatforms (linea 285)
- [x] `server.js` — portalQuery/portalMutate helpers (lineas 577-618)
- [x] `server.js` — claude-proxy-container (linea 1202, puerto 3099)
- [x] `server.js` — adminOrEditorMiddleware (linea 353)
- [x] `schema-portal.sql` — tablas existentes: programs, courses, team_members, etc.

### Decisiones de David (25-mar-2026)
- Drive API: usar cuenta udfv@umce.cl (OAuth existente)
- LLM: reutilizar claude-proxy-container del VPS (suscripcion Claude Max)
- Visualizacion del "curso virtual" (cruce PIAC↔Moodle) requiere revision iterativa
- Plataformas foco: virtual.umce.cl (principal), evirtual.umce.cl (secundario)

### Dependencias nuevas
- `mammoth` — Word (.docx) → texto/HTML, ~200KB, sin binarios nativos
- `googleapis` — Google Drive API v3 para descargar PIACs

### Variables de entorno nuevas (.env)
- `GOOGLE_DRIVE_CLIENT_ID` — OAuth client ID (puede reusar el existente)
- `GOOGLE_DRIVE_CLIENT_SECRET` — OAuth client secret
- `GOOGLE_DRIVE_REFRESH_TOKEN` — refresh token de udfv@umce.cl con scope drive.readonly

### Que construir

- [x] **2.1 Tablas SQL en schema portal**
  - `piac_links` — vinculo PIAC Drive ↔ curso Moodle (DI configura manualmente)
    - id, program_id (FK nullable), moodle_course_id, moodle_platform, drive_file_id, drive_url, course_name, linked_by, status (active|archived), created_at, updated_at
  - `piac_parsed` — estructura JSON extraida del Word
    - id, piac_link_id (FK), version, raw_text, parsed_json (JSONB), llm_model, tokens_used, parsed_at
  - `moodle_snapshots` — snapshot de la estructura del curso Moodle
    - id, piac_link_id (FK), sections_count, activities_count, snapshot_json (JSONB), snapshot_at
  - `matching_results` — resultado del matching PIAC↔Moodle
    - id, piac_link_id (FK), piac_parsed_id (FK), moodle_snapshot_id (FK), matches_json (JSONB), summary_json (JSONB), created_at
  - `discrepancies` — discrepancias individuales
    - id, matching_id (FK), type (missing_in_moodle|missing_in_piac|mismatch), severity (critical|warning|info), piac_element, moodle_element, description, resolved (bool), resolved_by, resolved_at, created_at
  - Crear archivo `schema-piac.sql` con la migracion
  - Agregar RLS, indices, grants (mismo patron que schema-portal.sql)

- [x] **2.2 Endpoints vincular PIAC + curso Moodle**
  - `POST /api/piac/link` (adminOrEditor) — body: { moodle_platform, moodle_course_id, drive_url }
    - Validar: curso existe en Moodle via moodleCall(platform, 'core_course_get_courses', {options: {ids: [id]}})
    - Extraer drive_file_id del URL de Drive
    - Guardar en piac_links
  - `GET /api/piac/links` (adminOrEditor) — lista todos los vinculos con ultimo estado de matching
  - `GET /api/piac/link/:id` (adminOrEditor) — detalle con parsed, snapshot, matching, discrepancias
  - `DELETE /api/piac/link/:id` (admin) — soft delete (status→archived)

- [x] **2.3 Lector Drive: descargar Word**
  - Google Drive API v3: files.get + files.export (o media download para .docx)
  - Auth: OAuth2 con refresh token de udfv@umce.cl (scope drive.readonly)
  - Extraer texto con mammoth: docx buffer → texto plano
  - Guardar raw_text en piac_parsed
  - Endpoint: `POST /api/piac/:linkId/parse` (adminOrEditor) — trigger manual

- [x] **2.4 LLM: PIAC texto → JSON estructurado**
  - Llamar claude-proxy-container con system prompt + texto del PIAC
  - System prompt con schema JSON esperado + definiciones UGCI (nucleos, RF, CE, repertorio)
  - Output JSON:
    ```json
    {
      "identificacion": {
        "nombre": "", "programa": "", "docente": "", "email_docente": "",
        "semestre": "", "modalidad": "", "tipo_docencia": "",
        "horas": { "sincronicas": 0, "asincronicas": 0, "autonomas": 0 },
        "semanas": 0, "creditos_sct": 0
      },
      "nucleos": [{
        "numero": 1, "nombre": "",
        "semanas": { "inicio": 1, "fin": 4 },
        "resultado_formativo": "",
        "criterios_evaluacion": [""],
        "temas": [""],
        "repertorio_evaluativo": [""]
      }],
      "evaluaciones_sumativas": [{ "nombre": "", "ponderacion": 0, "nucleo": 0 }],
      "metodologia": "",
      "bibliografia": [{ "referencia": "", "url": "" }]
    }
    ```
  - Guardar parsed_json + llm_model + tokens en piac_parsed

- [x] **2.5 Lector Moodle: snapshot estructura del curso**
  - `core_course_get_contents` → secciones, modulos, visibilidad
  - `mod_assign_get_assignments` → tareas con fechas
  - `mod_forum_get_forums_by_courses` → foros
  - `mod_url_get_urls_by_courses` → URLs (Zoom, recursos externos)
  - `mod_resource_get_resources_by_courses` → archivos adjuntos
  - Snapshot JSON normalizado:
    ```json
    {
      "course": { "id": 0, "fullname": "", "platform": "" },
      "sections": [{
        "id": 0, "number": 0, "name": "", "visible": true,
        "modules": [{
          "id": 0, "modname": "", "name": "", "visible": true,
          "modplural": "", "url": "", "description": "",
          "dates": { "added": 0, "due": 0 },
          "contents": [{ "filename": "", "fileurl": "" }]
        }]
      }]
    }
    ```
  - Guardar en moodle_snapshots
  - Endpoint: `POST /api/piac/:linkId/snapshot` (adminOrEditor) — trigger manual

- [x] **2.6 Motor matching (logica determinista, sin LLM)**
  - Input: piac_parsed.parsed_json + moodle_snapshot.snapshot_json
  - Mapeo: seccion Moodle N → nucleo PIAC N (por posicion, seccion 0 = general)
  - Por cada nucleo: buscar actividades Moodle que correspondan a lo declarado
    - Sincronicas (RF/sesion) → URLs tipo Zoom
    - Asincronicas (foros, tareas) → mod_forum, mod_assign
    - Evaluaciones → mod_assign con fecha
    - Recursos → mod_resource, mod_url
  - Clasificar: { matched, unmatched_piac, unmatched_moodle, partial }
  - Guardar matches_json + summary_json en matching_results
  - Endpoint: `POST /api/piac/:linkId/match` (adminOrEditor) — trigger manual
  - Endpoint alternativo: `POST /api/piac/:linkId/analyze` — ejecuta parse + snapshot + match en secuencia

- [x] **2.7 Detectar y clasificar discrepancias**
  - Se ejecuta como parte del matching (paso 2.6)
  - Tipos:
    - `missing_in_moodle`: PIAC declara actividad/evaluacion/recurso que no existe en Moodle
    - `missing_in_piac`: Moodle tiene elemento sin correspondencia en PIAC
    - `mismatch`: existe en ambos pero inconsistente (nombre, fecha, visibilidad)
  - Severidad:
    - `critical`: seccion oculta que deberia estar visible, tarea sin fecha, zoom link ausente
    - `warning`: foro sin descripcion, nombre no coincide, recurso sin contenido
    - `info`: elementos extra en Moodle no declarados en PIAC
  - Guardar en discrepancies con FK a matching_results

- [x] **2.8 UI basica vista DI (piac.html)**
  - Nueva pagina `public/piac.html` protegida por auth (adminOrEditor)
  - Agregar link en nav para admin/editor
  - Secciones:
    1. Lista de vinculos PIAC-Moodle con badges de estado (sin analizar / ok / alertas)
    2. Formulario para crear nuevo vinculo (seleccionar plataforma + course ID + pegar link Drive)
    3. Vista de detalle al hacer click en un vinculo:
       - Panel izquierdo: estructura PIAC (nucleos, RF, CE, actividades declaradas)
       - Panel derecho: estructura Moodle (secciones, modulos, visibilidad)
       - Centro/abajo: discrepancias coloreadas por severidad
       - Cada discrepancia con link directo al elemento en Moodle
    4. Boton "Analizar" → ejecuta parse + snapshot + match
  - Estilo: Tailwind CDN, consistente con paginas existentes del portal

### Criterios de aceptacion
- DI puede vincular un PIAC de Drive con un curso de cualquier plataforma Moodle
- El sistema descarga el Word, extrae estructura via LLM, y la muestra como JSON legible
- El sistema lee la estructura completa del curso Moodle via API
- El matching muestra lado a lado: que hay en PIAC vs que hay en Moodle
- Las discrepancias se clasifican con severidad y tienen link directo a Moodle
- No se modifica nada en Moodle ni en Drive — todo es lectura
- Las tablas en Supabase almacenan el historial de analisis

### Anti-patrones de esta fase
- NO crear formulario que reemplace el PIAC — se LEE desde Drive
- NO modificar nada en Moodle — solo lectura
- NO generar elementos automaticamente — la IA observa y reporta
- NO usar LLM para el matching — es logica determinista (comparar JSONs)
- NO implementar cron automatico — en Fase 2 todo es trigger manual (cron es Fase 4)
- NO construir vista de estudiante — eso es Fase 3, aqui solo vista DI

---

## Fase 3: Visado + Curso virtual del estudiante

**Estado**: EN PROGRESO
**Ultima sesion**: 25-mar-2026
**Objetivo**: DI/docente visan elementos. El estudiante ve un "curso virtual" armado con lo visado.

### Leer antes de empezar
- [x] CURSO-VIRTUAL-SPEC.md — spec completo del curso virtual (v2, 1054 lineas, 19 secciones)
- [x] SESSION-NOTES-CURSO-VIRTUAL.md — decisiones de David validadas con Cowork
- [x] `src/server.js` lineas 2893-3021 — API /api/curso-virtual/:linkId existente
- [x] `src/public/curso-virtual.html` — HTML actual (se reescribe)
- [x] `src/schema-piac.sql` — schema actual de tablas PIAC
- [x] induccion2026.udfv.cloud — patrones UX extraidos (paleta UMCE, split layout, sidebar, progresion)
- [ ] `src/server.js` lineas 1202-1399 — chatbot API (leer al llegar a 3.7)

### Referencia visual (extraida de induccion2026.udfv.cloud)
- Paleta: azul UMCE #1e3a8a + dorado #d4940f + arena #ede5d8
- Layout: sidebar con secciones jerarquicas + area principal
- Color por modulo/nucleo para diferenciacion visual
- Mobile: sidebar colapsa a hamburguesa, cards 100% ancho
- Tipografia: system font, headings bold, labels uppercase

### Fase 3-A: Estructura y bienvenida (MVP visor)

- [ ] **3.1 Schema SQL** — Tablas `curso_virtual_config` + `institutional_defaults` en schema portal
- [ ] **3.2 Endpoints config** — GET/PUT /api/piac/:linkId/config, publish/unpublish, preview, institutional-defaults (6 endpoints)
- [ ] **3.3 Reescribir curso-virtual.html** — Layout sidebar + area principal, mobile-first. Paleta UMCE. Iconos Lucide SVG
- [ ] **3.4 Seccion Inicio** — Bienvenida, docente, objetivos, modalidad, horas, como funciona, soporte
- [ ] **3.5 Nucleos con contenido** — Vista semanal Antes/Durante/Despues. Contenido desde API existente. Sin completion. Click → Moodle
- [ ] **3.6 Barra superior** — Entrar a clase (Zoom LTI), Grabaciones, Calendario (placeholder), Tareas, Ayuda
- [ ] **3.7 Chatbot generico** — Incluir shared/chatbot.js (ya funcional)
- [ ] **3.8 Accesibilidad base** — Landmarks ARIA, headings, skip links, contraste AA, focus visible, alt text, 44px touch targets

### Fase 3-B: Visado y configuracion DI

- [ ] **3.9 Toggle visado** — En panel PIAC, toggle por elemento visible/oculto para estudiante
- [ ] **3.10 UI configuracion DI** — Pestanas: Bienvenida, Politicas, Contenido, Objetivos semanales, Foros
- [ ] **3.11 Preview** — Boton que abre vista estudiante con datos del DI actual (ignora publicado)
- [ ] **3.12 Publicar/despublicar** — Toggle que controla visibilidad para estudiantes
- [ ] **3.13 Fallbacks** — Sin PIAC → link Moodle. No publicado → link Moodle. Sin analisis → error

### Anti-patrones de esta fase
- NO datos personalizados (sin completion, sin notas) — eso es Fase 5
- NO cron automatico — todo trigger manual
- NO duplicar contenido de Moodle — el curso virtual es un VISOR
- NO crear un LMS paralelo
- NO modificar nada en Moodle — solo lectura

---

## Fase 4: Motor IA cron + Panel DI alertas

**Estado**: PENDIENTE
**Ultima sesion**: —
**Objetivo**: El sistema corre periodicamente, detecta cambios, y alerta al DI de discrepancias.

### Esqueleto (se detalla con David antes de ejecutar)
- [ ] 4.1 Cron frecuente: detectar cambios en Drive (PIAC) o Moodle (curso)
- [ ] 4.2 Cron nocturno: reporte consolidado de discrepancias
- [ ] 4.3 Cron horario (17-22h): verificar links Zoom para clases del dia
- [ ] 4.4 Panel DI: vista de alertas, discrepancias, estado de visado
- [ ] 4.5 Asignacion DI a programa/curso (editores actuales = DIs en umce.online)
- [ ] 4.6 Notificaciones (push o email) para alertas criticas

---

## Fase 5: Experiencia estudiante completa

**Estado**: PENDIENTE
**Ultima sesion**: —
**Objetivo**: El estudiante tiene una experiencia completa: ruta de progresion, nucleos, contenido, registro de vuelta en Moodle.

### Esqueleto (se detalla con David antes de ejecutar)
- [ ] 5.1 Ruta de progresion visual por nucleo
- [ ] 5.2 Grabaciones integradas (desde mod_data Moodle)
- [ ] 5.3 Horario, companeros, docente, recursos
- [ ] 5.4 Actividades y rubricas visibles
- [ ] 5.5 Registro de interacciones de vuelta en Moodle (completions, grades)
- [ ] 5.6 Landing pages por programa (alimenta estrategia de posicionamiento digital)

---

## Fase 6: Integracion Acompana UMCE

**Estado**: PENDIENTE
**Ultima sesion**: —
**Objetivo**: Datos de Acompana UMCE disponibles en umce.online (read-only).

### Esqueleto (se detalla con David antes de ejecutar)
- [ ] 6.1 Conexion read-only a Supabase Cloud (145 tablas Acompana)
- [ ] 6.2 Malla curricular visible en contexto del programa
- [ ] 6.3 Salas/horarios integrados
- [ ] 6.4 Datos academicos relevantes para el estudiante
- [ ] 6.5 Talleres formacion TIC (conexion al modulo de Acompana)

### Leer antes de empezar (completar cuando se inicie)
- `~/Documents/17_Proyecto_App_AcompanaUMCE/` — estructura y API
- Supabase Cloud: fbsxssizabrcqlsvkegh.supabase.co

---

## Registro de sesiones

Cada sesion que trabaje en este proyecto registra aqui que se hizo.

| Fecha | Fase | Que se hizo | Resultado |
|-------|------|-------------|-----------|
| 25-mar-2026 | Pre-fase | Correccion de vision, limpieza repo, definiciones tecnicas, benchmark RRSS, creacion sistema de desarrollo (CLAUDE.md + SPEC.md) | Sistema listo para Fase 1 |
| 25-mar-2026 | Fase 1 | Migracion completa: codebase copiado, URLs actualizadas (60+ refs), OAuth nuevo, Traefik+SSL, CI/CD, redirect 301 virtual.udfv.cloud→umce.online | COMPLETADA — 12/12 pasos |
| 25-mar-2026 | Fase 2 | Implementacion completa: schema SQL (5 tablas), Drive API + mammoth, LLM parse via claude-proxy, Moodle snapshot (5 endpoints), motor matching determinista, detector discrepancias, UI panel DI (piac.html) | 8/8 pasos codificados — pendiente deploy + test con PIAC real |
