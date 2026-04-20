# VcM — Scope de trabajo (OBLIGATORIO para Antigravity / cualquier IDE)

> Este archivo delimita **exactamente** qué puede tocar quien trabaje en el Plan Formativo VcM dentro de este repo. Leerlo ANTES de escribir una sola línea. Sin excepciones.

**Proyecto**: Plan Formativo VcM — Vinculación con el Medio (6to nodo del pipeline Curso Virtual UDFV).
**Naturaleza**: Multi-curso, no curso único.
**Documentación canónica**: `~/udfv-hub/projects/plan-formativo-vcm/ESTADO.md` (leer ANTES).
**Creado**: 2026-04-20.

---

## Contexto crítico del repo

Este repo (`umce-online`) soporta **7 pilares UDFV simultáneos** con cosas **en producción con usuarios reales**. Modificar fuera del scope VcM rompe trabajo terminado de otros pilares.

Pilares vivos (**NO TOCAR mientras trabajas en VcM**):
1. **Sustentabilidad (Pilar 4)** — OPERATIVO con ~700 inscripciones. Usuarios reales midiendo.
2. **Calculadora SCT + QA + Asistente + Planificador (Pilar 1)** — Mesa 1, entregables mayo.
3. **Curso virtual + PIAC + matching IA (Pilares 2, 3, 5)** — sistema en producción.
4. **Formación docente + SDPA + Open Badges (Pilar 6)** — infraestructura crítica.
5. **Admin + dashboards** — herramientas internas UDFV.

---

## Lista BLANCA (scope permitido — aquí sí escribir)

### Archivos nuevos a crear
```
src/public/vcm-panel.html                          # panel del plan (vcm.umce.online)
src/public/vcm-<slug>.html                         # landing pre-inscripción por curso
src/public/vcm-<slug>-curso.html                   # dashboard post-inscripción por curso
src/public/autoformacion/vcm-templates/            # carpeta nueva — templates parametrizables
  ├── landing-template.html
  ├── dashboard-template.html
  ├── panel-template.html
  └── README.md
src/public/autoformacion/courses/vcm-<slug>.json   # config por curso
src/public/autoformacion/courses/vcm-<slug>-questions.json  # solo si aplica
src/public/autoformacion/js/vcm-*.js               # scripts específicos VcM (scorm-bridge, xapi-tracker-vcm, etc.)
src/public/assets/vcm/                             # assets propios VcM (imágenes, iconos, paleta)
```

### Archivos existentes a modificar (con reglas)
```
src/server.js                                      # SOLO agregar endpoints /api/vcm/*, NO tocar otros endpoints
```

### Endpoints backend nuevos permitidos (agregar al final de server.js, agrupados con comentario `// === VCM ===`)
```
POST   /api/vcm/enroll                             # inscripción a curso del plan
GET    /api/vcm/status/:token                      # estado de inscripción + progreso
PATCH  /api/vcm/progress                           # actualización de progreso (xAPI mirror)
POST   /api/vcm/complete                           # marca completado + certificado
GET    /api/vcm/mi-ruta/:token                     # ruta agregada del estudiante en el plan
GET    /api/vcm/panel                              # metadata pública de todos los cursos del plan
```

---

## Lista NEGRA (scope prohibido — NO tocar sin autorización explícita de David)

### Archivos tabú (producción o de otros pilares)
```
src/public/autoformacion-sustentabilidad*.html     # Pilar 4 Sustentabilidad OPERATIVO
src/public/autoformacion/courses/sustentabilidad*.json
src/public/autoformacion/js/questions.js           # quiz engine Sustentabilidad
src/public/autoformacion/js/quiz-engine.js
src/public/autoformacion/js/xapi-tracker-autoformacion.js
src/public/virtualizacion-*.html                   # Pilar 1 Mesa 1 (SCT, QA, asistente, planificador, fundamentos, rubrica)
src/public/sct-data.json
src/public/formacion-docente*.html                 # Pilar 6
src/public/formacion-docente/
src/public/curso-virtual.html                      # Pilar 2
src/public/piac.html                               # Pilar 3
src/public/mis-cursos.html                         # Pilar 5
src/public/admin.html                              # herramientas internas
src/public/sdpa-admin.html                         # SDPA
src/public/verificar-credencial.html               # Open Badges
src/public/demo-curso.html
src/public/design-system-espacio-aprendizaje.html
src/public/sustentabilidad2026/                    # React experimental
```

### Archivos compartidos (tocar SOLO si es estrictamente necesario + confirmar con David ANTES)
```
src/public/shared/                                 # nav, footer, chatbot compartidos
src/public/assets/                                 # NO agregar al root — usar assets/vcm/
src/public/accesibilidad-dua.js                    # widget DUA global
src/public/index.html                              # home global
src/public/ayuda.html
src/public/privacidad.html
src/public/404.html
src/public/robots.txt
src/public/sitemap.xml
src/public/audio/                                  # narradores
src/public/data/
tailwind.config.*                                  # config global
package.json                                       # deps solo si ESTRICTAMENTE necesario
.github/workflows/                                 # CI/CD
```

### Endpoints server.js tabú (NO modificar — solo leer para entender patrón)
```
/autoformacion/:slug                              # routing genérico compartido con Sustentabilidad
/autoformacion/:slug/curso                        # routing genérico compartido
/api/portal/*                                     # sistema Portal UDFV
/api/piac/*                                       # sistema PIAC
/api/chat/*                                       # asistente
/api/badges/*                                     # Open Badges
/api/drive/*                                      # Google Drive integration
/auth/*                                           # Google OAuth
cualquier endpoint sin prefijo /api/vcm/
```

---

## Reglas arquitectónicas VcM (NO NEGOCIABLES)

### Stack (del CLAUDE.md raíz, reafirmado)
- Express + vanilla JS + Tailwind CDN (NO Next.js, NO React, NO TypeScript)
- Auth: Google OAuth @umce.cl existente + token HMAC sesión. NO crear auth nueva.
- DB: Supabase self-hosted (supabase.udfv.cloud), schema `portal`, helpers existentes (`supabaseQuery`, `supabaseInsert`, etc.)

### VcM-específicas
1. **Contenido = SCORMs empaquetados** subidos a Moodle. NO quiz nativo JS como Sustentabilidad.
2. **Evaluación = Moodle**. Frontend solo refleja gradebook, NO calcula notas.
3. **Tracking = xAPI → Ralph LRS** (`lrs.udfv.cloud`). Activity IDs: `https://vcm.umce.online/cursos/{slug}/...`
4. **Un curso Moodle por cada curso del plan** (no contenedor único).
5. **Templates parametrizables obligatorios** — landing + dashboard + panel se construyen UNA vez y se parametrizan con JSON config (`autoformacion/courses/vcm-<slug>.json`). NO copy-paste HTML por curso.
6. **Supabase**: reutilizar tabla `portal.autoformacion_enrollments` distinguiendo por `course_slug` (`vcm-fundamentos`, etc.) + `plan_slug='vcm'`. NO crear tabla nueva sin justificación.
7. **Design System UDFV — 37_DESIGN (OBLIGATORIO, SOLO LECTURA)**:
   - Ubicación: `~/Documents/37_DESIGN/knowledge/` (carpeta **externa** al repo — NO copiar contenido aquí, NO modificar esa carpeta desde este trabajo)
   - Abrir como workspace adicional en Antigravity (multi-root) o mantener los archivos abiertos durante el trabajo VcM
   - Documentos obligatorios de leer ANTES de crear mockups / escribir CSS / definir componentes:
     - `~/Documents/37_DESIGN/knowledge/design-systems/udfv-design-system.md` — tokens, tipografía, Tailwind config, paleta institucional
     - `~/Documents/37_DESIGN/knowledge/ux-principles-udfv.md` — 10 principios UX + 15 puntos accesibilidad UDFV
     - `~/Documents/37_DESIGN/knowledge/landing-blueprint-umce-online.md` — blueprint oficial de landings UMCE.online
     - `~/Documents/37_DESIGN/knowledge/curso-visual-framework.md` — 14 elementos visuales estándar de curso
     - `~/Documents/37_DESIGN/knowledge/scorm-design-system.md` — design system específico para SCORMs (CRÍTICO para VcM)
     - `~/Documents/37_DESIGN/knowledge/moodle-css-theming.md` — selectores Moodle 4.x/3.8 (para integración visual SCORM+Moodle)
     - `~/Documents/37_DESIGN/knowledge/academic-research-ux-elearning.md` — CLT, Mayer, QM 7th, UDL
   - Reglas: NO inventar tokens, NO inventar tipografía, NO inventar paletas fuera del DS. Si algo falta en el DS, proponer la extensión a David ANTES de improvisar.
   - Componentes React de referencia (solo lectura, NO portar directo — el stack aquí es vanilla JS): `~/Documents/37_DESIGN/projects/components/`
8. **Paleta**: violeta base (trabajo previo de Sergio, pendiente recibir) sobre tokens UDFV institucionales.
9. **Accesibilidad DUA**: reutilizar `accesibilidad-dua.js` global — NO duplicar widget.

### Flujo de desarrollo obligatorio
1. **Diseño primero (Figma)** — regla CLAUDE.md del sistema. NUNCA codear directo sin mockup validado por David.
2. **Leer `ESTADO.md` del hub** (`~/udfv-hub/projects/plan-formativo-vcm/ESTADO.md`) ANTES de cada sesión.
3. **Proponer antes de ejecutar** — David valida scope antes de commits con muchos archivos.
4. **Anti-patrones ya documentados en CLAUDE.md raíz aplican**: NO reinventar auth, NO cambiar stack, NO PRD sin contexto, NO loops autónomos, NO IA que crea en Moodle.

### Cursos reales (regla global memoria Claude)
- **NUNCA crear/modificar/configurar cursos reales Moodle sin confirmación explícita** de David. Solo cursos de prueba.

---

## Insumos bloqueantes (pendiente recibir de VcM — reunión 20-abr)

Hasta no tener esto, NO arrancar código de un curso específico:
- [ ] Listado DEFINITIVO de cursos del plan (cantidad y nombres exactos)
- [ ] Acceso Moodle al curso fuente "Fundamentos para una Universidad Pública Transformadora"
- [ ] Paquetes SCORM de cada curso (.zip)
- [ ] Material visual de Sergio (paleta violeta detalle)
- [ ] Contacto técnico VcM
- [ ] Decisiones: auto-instruccional vs tutor, certificación por curso vs plan completo, uso de IA para revisión automática

Lo que **sí** se puede avanzar sin esos insumos (para no quedar bloqueado):
- Templates HTML base (landing / dashboard / panel) con placeholders
- Configs JSON de ejemplo para estructura
- Endpoints backend `/api/vcm/*` con schema validado (sin crear cursos Moodle reales)
- CSS / paleta tokens usando violetas del Design System UDFV como provisional

---

## Si encuentras ambigüedad

Preguntar a David ANTES de asumir. Mejor una pregunta extra que romper Sustentabilidad en producción.
