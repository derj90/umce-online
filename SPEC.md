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

**Estado**: PENDIENTE
**Ultima sesion**: —
**Objetivo**: El sistema lee un PIAC desde Google Drive, lee un curso Moodle via API, y encuentra relaciones/discrepancias entre ambos.

### Leer antes de empezar (completar cuando se inicie)
- SPEC Fase 2 detallada (este archivo, se completa antes de empezar)
- Notion: definiciones tecnicas del PIAC → https://www.notion.so/32e0778552798118ab7dcf2563971f21
- `server.js` — endpoints existentes de Moodle API (lineas ~700-900)
- Orientaciones PIAC UGCI → https://www.notion.so/2696ea8a1d8f43a68458dea55f29606a

### Esqueleto (se detalla con David antes de ejecutar)
- [ ] 2.1 Endpoint para vincular PIAC (link Drive) + curso Moodle (ID) — config manual por DI
- [ ] 2.2 Google Drive API: leer documento Word, extraer estructura (nucleos, RF, CE, repertorio evaluativo)
- [ ] 2.3 LLM: parsear PIAC a JSON estructurado
- [ ] 2.4 Moodle API: leer estructura del curso (secciones, actividades, visibility, mod_data)
- [ ] 2.5 Motor matching: relacionar elementos PIAC ↔ Moodle
- [ ] 2.6 Detectar discrepancias (elemento en PIAC sin correspondencia en Moodle y viceversa)
- [ ] 2.7 Almacenar resultado en Supabase schema portal (nuevas tablas)
- [ ] 2.8 UI basica para ver resultado del matching (vista DI)

### Anti-patrones de esta fase
- NO crear formulario que reemplace el PIAC — se LEE desde Drive
- NO modificar nada en Moodle — solo lectura
- NO generar elementos automaticamente — la IA observa y reporta

---

## Fase 3: Visado + Curso virtual del estudiante

**Estado**: PENDIENTE
**Ultima sesion**: —
**Objetivo**: DI/docente visan elementos. El estudiante ve un "curso virtual" armado con lo visado.

### Esqueleto (se detalla con David antes de ejecutar)
- [ ] 3.1 Toggle de visado por elemento (UI para DI/docente)
- [ ] 3.2 Leer estado de visibilidad de Moodle (oculto / oculto-por-enlace / visible)
- [ ] 3.3 Regla: "oculto pero disponible por enlace" requiere aprobacion manual
- [ ] 3.4 Vista "curso virtual" para estudiante — mezcla PIAC (estructura) + Moodle (contenido visado)
- [ ] 3.5 Click en elemento → redirige al recurso en Moodle
- [ ] 3.6 Temporalidad configurable por DI (fecha auto o manual)
- [ ] 3.7 Referencia visual: induccion2026.udfv.cloud como modelo de experiencia

### Anti-patrones de esta fase
- NO duplicar contenido de Moodle — el curso virtual es un VISOR, los recursos estan en Moodle
- NO crear un LMS paralelo

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
