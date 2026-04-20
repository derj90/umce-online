# UMCE.online

Este proyecto es la evolucion de virtual.udfv.cloud. NO es un proyecto nuevo.
El codebase original esta en `~/Documents/43_VIRTUAL_UMCE_WEB/src/` y se migra aqui.

## Sistema de desarrollo

Este proyecto usa 3 capas de contexto. Respetar el orden:

1. **CLAUDE.md** (este archivo) — reglas irrompibles, se carga automaticamente
2. **SPEC.md** (en este repo) — spec por fase, avance, que leer antes de codificar
3. **Notion** (pagina indice) — mapa del proyecto, definiciones tecnicas, investigaciones

### Flujo por sesion
1. CLAUDE.md se carga solo (reglas)
2. Leer SPEC.md → ir a la fase con estado EN PROGRESO o PENDIENTE
3. Leer SOLO los archivos que SPEC indica para esa fase
4. Si necesita contexto adicional → consultar Notion via MCP
5. Proponer que se va a hacer → David valida
6. Ejecutar → David revisa resultado
7. Actualizar checkboxes en SPEC.md
8. Al cerrar: `/session-end` sincroniza CEREBRO + hub

### NO hacer
- NO ejecutar Task Master ni loops autonomos sin supervision
- NO leer todo el codebase al inicio — solo lo que SPEC indica
- NO crear archivos de plan/estado fuera de SPEC.md (evitar duplicacion)

---

## Reglas criticas

### Stack (irrompible)
- Express + vanilla JS + Tailwind CDN (NO Next.js, NO React, NO TypeScript)
- Dependencias core: express, firebase-admin, multer
- Dependencias PIAC: mammoth, googleapis
- Dependencias Open Badges 3.0 (aprobadas 26-mar-2026): @digitalcredentials/open-badges-context, @digitalcredentials/vc, @digitalcredentials/ed25519-multikey, @digitalcredentials/eddsa-rdfc-2022-cryptosuite, @digitalcredentials/data-integrity, @digitalcredentials/security-document-loader
- HTML pages en `public/` con shared components (nav, footer, chatbot)
- Tailwind compilado en build, CDN como fallback

### Auth (irrompible)
- Google OAuth @umce.cl con restriccion de dominio (`hd: umce.cl`)
- HMAC-SHA256 session cookie (`umce_session`), 24h o 30d con "remember"
- Token format: `base64({username}|{email}|{timestamp}|{ttl}|{hmac})`
- NO Supabase Auth, NO JWT libraries, NO sesiones en DB
- Roles por email: ADMIN_EMAILS (hardcoded), EDITOR_EMAILS (desde .env)

### Base de datos (irrompible)
- Supabase self-hosted en supabase.udfv.cloud
- Extender schema `portal` existente (programs, courses, team_members, news, testimonials, chat_sessions, chat_messages, resources, device_tokens)
- Helper functions en server.js: supabaseQuery, supabaseInsert, supabaseManyInsert, supabaseUpdate, supabaseDelete
- NO crear schema nuevo, NO crear DB separada

### PIAC (irrompible)
- Se lee desde Google Drive API. El PIAC es un documento Word que vive en la nube de Drive
- NO se sube, NO se copia, NO se reemplaza con formulario web
- Carpeta compartida entre david.reyes_j@ y udfv@

### IA (irrompible)
- NO crea ni modifica nada en Moodle ni en Drive
- Solo observa, relaciona, presenta al estudiante, y alerta al DI/docente de discrepancias
- Motor IA como cron en VPS (frecuente + nocturno + horario)

### Moodle (irrompible)
- 5 plataformas conectadas via REST API (evirtual, practica, virtual, pregrado, postgrado)
- Grabaciones estan en actividades mod_data de Moodle (NO en Supabase)
- Plantilla estandar: Fecha (date), Enlace YouTube (url), Archivo (file opcional)
- NUNCA modificar cursos reales sin confirmacion explicita de David

### Scopes por sub-proyecto dentro del repo (irrompible)
Este repo soporta 7 pilares UDFV simultáneos — varios en producción con usuarios reales. Antes de tocar archivos, identificar en qué sub-proyecto estás y leer su scope:

- **Plan Formativo VcM** (6to nodo pipeline, multi-curso, SCORM+xAPI+Moodle): leer `VCM-WORK-SCOPE.md` (lista blanca/negra de archivos, endpoints permitidos, reglas arquitectónicas). OBLIGATORIO antes de codear VcM.
- **Sustentabilidad** (Pilar 4, OPERATIVO con ~700 inscripciones): NO TOCAR sin autorización explícita. Archivos: `autoformacion-sustentabilidad*`, `autoformacion/courses/sustentabilidad*`, quiz engine compartido.
- **Virtualización / Mesa 1** (Pilar 1): `virtualizacion-*.html`, `sct-data.json`.
- **Formación docente / SDPA / Open Badges** (Pilar 6): `formacion-docente*`, `sdpa-admin.html`, `verificar-credencial.html`.
- **Curso virtual / PIAC / matching IA** (Pilares 2, 3, 5): `curso-virtual.html`, `piac.html`, `mis-cursos.html`.

**Regla**: al entrar a una sesión, identificar el sub-proyecto del trabajo y respetar SU scope. Modificar archivos de otros pilares requiere confirmación explícita de David.

---

## Anti-patrones (errores reales cometidos, NO repetir)

1. **PRD sin contexto** — Se escribio un PRD sin leer el codigo existente, Notion, ni CEREBRO. Task Master ejecuto 15 tareas perfectas en la direccion equivocada. TODO el codigo fue descartado.
2. **Reinventar auth** — Se implemento Supabase Auth con registro email/password cuando ya existia Google OAuth funcionando.
3. **Stack equivocado** — Se construyo con Next.js 16 + React + TypeScript en vez de extender Express + vanilla JS.
4. **PIAC como formulario** — Se creo un formulario web para reemplazar el Word. El PIAC se LEE desde Drive, no se reemplaza.
5. **IA que crea** — Se construyo un sistema donde la IA generaba elementos Moodle. La IA NO crea nada.
6. **Loop autonomo** — Task Master ejecuto 15 tareas sin supervision mientras David no estaba. Amplifica errores.
7. **No leer CEREBRO** — Se ignoraron los docs de estrategia digital (38_WEB) y el contexto de CEREBRO.

---

## Contexto obligatorio antes de codificar

1. Leer SPEC.md en este repo (fase actual)
2. Leer los archivos que SPEC indica para esa fase
3. Consultar Notion si se necesita contexto adicional: https://www.notion.so/32e0778552798118ab7dcf2563971f21
4. Si es primera sesion del proyecto: leer CEREBRO ~/Documents/00_CEREBRO/ESTADO-ACTUAL.md (proyecto 10)

## Referencia rapida del codebase original

- **Server**: `~/Documents/43_VIRTUAL_UMCE_WEB/src/server.js` (~2000 lineas, puerto 3000)
- **Pages**: `~/Documents/43_VIRTUAL_UMCE_WEB/src/public/` (11 HTML + shared/)
- **Docker**: `~/Documents/43_VIRTUAL_UMCE_WEB/src/Dockerfile` (Node 20 Alpine)
- **Schema**: `~/Documents/43_VIRTUAL_UMCE_WEB/src/schema-portal.sql`
- **Deploy**: `/opt/deploy-umce-online.sh` en VPS 82.29.61.165
- **CI/CD**: `.github/workflows/deploy.yml` → SSH → VPS
