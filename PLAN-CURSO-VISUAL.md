# Plan: Espacio de Aprendizaje UMCE.online
## Integrado con los 5 Momentos de Virtualización y PIAC/ADDIE

*Generado 07-Abr-2026 — Sesión 41*

---

## Contexto

El Course Template System actual (landing-template.html + curso-template.html) es funcional pero desconectado del modelo pedagógico. El espacio de aprendizaje debe ser la **manifestación visual del Momento 4** (implementación), alimentado por el **Momento 3** (PIAC), evaluado por el **Momento 5** (QA rúbrica).

### Estándar de referencia
- **sustentabilidad2026** (React/Vite): watercolor canvas, DUA 8 funciones, cards ricas, paleta Pantone Botanical
- **CURSO-VIRTUAL-SPEC.md**: "experiencia comparable a Coursera pero con estructura pedagógica del PIAC"
- **6 principios**: mobile-first, progresión visible, alineación transparente, accesibilidad nativa, carga cognitiva mínima, tiempo como recurso

### Backends disponibles
| Backend | Datos clave | Acceso |
|---------|-------------|--------|
| Moodle (5 inst.) | Contenido, calificaciones, completion, entregas, foros | REST API (36 WS) |
| UCampus | Personas, carreras, malla, notas, horarios | Supabase sync 2x/día |
| Supabase portal | Inscripciones, progreso, badges OB3.0, PIAC parseado, config | PostgREST |
| Google Drive | PIAC (Word → mammoth → LLM → JSON estructurado) | OAuth udfv@ |
| Ralph LRS | xAPI: progressed, answered, completed, duración | REST xAPI 1.0.3 |
| YouTube | Videos clases, upload automático | oEmbed + Data API v3 |

### Estructura PIAC (ya parseada a JSON)
```
identificacion (nombre, programa, docente, modalidad, horas, SCT)
nucleos[] (numero, nombre, RF, CE[], temas[], repertorio_evaluativo[])
  sesiones[] (sincronico, asincronico, autonomo, recursos[])
evaluaciones_sumativas[] (nombre, ponderacion, nucleo)
metodologia, bibliografia[]
```

---

## Fases y Agentes

### FASE 0 — Rediseño del Schema de Curso (diseño, no código)
**Objetivo**: Un JSON de configuración que refleje la estructura PIAC/ADDIE y soporte todos los tipos de curso.

**Agente 0A — Schema Architect** (Opus)
- Input: estructura PIAC parseada, CURSO-VIRTUAL-SPEC.md, 5 tipos de curso
- Output: JSON Schema v2 del curso con:
  - Módulos como núcleos PIAC (RF, CE, temas)
  - Sesiones con secuencia antes/durante/después
  - Evaluaciones con ponderación y CE referenciado
  - Recursos tipificados (video, lectura, descargable, actividad Moodle)
  - Tiempos SCT (horas sincrónicas, asincrónicas, autónomas)
  - Campo `courseType` que activa distintos componentes del template
  - Conexiones a backends (Moodle courseId, UCampus ramo, PIAC driveId)

**Agente 0B — Course Type Configurator** (Sonnet)
- Input: 5 tipos de curso, schema v2, componentes del template
- Output: Tabla de configuración por tipo:
  | Componente | Autoformación | Tutoreado | Diplomado | Taller | Inducción |
  |------------|:---:|:---:|:---:|:---:|:---:|
  | Sidebar módulos | ✓ | ✓ | ✓ | — | ✓ |
  | Secuencia antes/durante/después | — | ✓ | ✓ | ✓ | — |
  | Quiz aleatorio | ✓ | — | ✓ | — | ✓ |
  | Entregas Moodle | — | ✓ | ✓ | ✓ | — |
  | Foro integrado | — | ✓ | — | ✓ | — |
  | Calificaciones | — | ✓ | ✓ | ✓ | — |
  | Calendario sesiones | — | ✓ | ✓ | ✓ | — |
  | Badge/certificado | — | — | ✓ | ✓ | ✓ |
  | xAPI tracking | ✓ | ✓ | ✓ | ✓ | ✓ |
  | Dashboard progreso | ✓ | ✓ | ✓ | — | ✓ |

**Agente 0C — Migration Planner** (Sonnet)
- Input: sustentabilidad.json actual, schema v2
- Output: Script/guía para migrar los JSONs actuales al schema v2 sin romper lo que funciona

---

### FASE 1 — Pulido Visual Profesional (código CSS + JS)
**Objetivo**: Eliminar lo "precario" y alcanzar nivel profesional.

**Agente 1A — Typography & Layout** (Sonnet)
- Cambios en curso-template.html:
  - Body font-size 17px, line-height 1.7
  - Content max-width 680px
  - Escala tipográfica sistemática (H1-H4 con ratio 1.25)
  - Letter-spacing -0.02em en headings
  - Fondo #f8fafc en vez de blanco puro

**Agente 1B — Sidebar Redesign** (Sonnet)
- Módulos como acordeón colapsable (solo el activo expandido)
- Left-border 3px accent en ítem activo
- Estado bloqueado con candado
- Punto azul para ítems nuevos/no vistos
- Progress bar con gradiente primary→secondary
- En mobile: drawer con FAB toggle

**Agente 1C — Signaling System** (Sonnet)
- Slide header: "Módulo 2 · Slide 3 de 6 · ~8 min"
- Portada de módulo: RF, CE, tiempo estimado, "Lo que vas a aprender"
- Sistema de callouts CSS: .callout-info, .callout-tip, .callout-warning, .callout-key, .callout-example
- Resource cards tipificadas: lectura, video, descargable, actividad
- Breadcrumb de contexto permanente

**Agente 1D — Quiz Enhancement** (Sonnet)
- Fix: no re-renderizar DOM completo al seleccionar opción
- Progress dots por pregunta
- Feedback explicativo por respuesta incorrecta
- Animación de transición entre preguntas
- Jerarquía visual: "Continuar" primario vs "Reintentar" outline
- Pantalla de completado: animación scale + confetti (respetar prefers-reduced-motion)

**Agente 1E — DUA & Accessibility** (Sonnet)
- Widget DUA completo (8 funciones como sustentabilidad2026):
  tamaño texto, contraste, OpenDyslexic, espaciado, resaltar enlaces, cursor grande, guía lectura, pausar animaciones
- aria-live en content-area
- role="radiogroup" en quiz options
- Verificación contraste todos los colores
- focus-visible en todos los interactivos

**Agente 1F — Generative Art per Course** (Sonnet)
- Arte generativo p5.js temático por curso (no genérico):
  - Sustentabilidad: watercolor + hojas + paleta botanical
  - Modelo Educativo: nodos conectados + paleta indigo
  - Inducción: partículas ascendentes + paleta teal
- Mouse interaction (repulsión/atracción)
- Configurable desde el JSON del curso (campo `generativeArt`)

---

### FASE 2 — Conexión con Backends (código Express + API)
**Objetivo**: El curso se alimenta de datos reales, no solo del JSON estático.

**Agente 2A — Moodle Content Bridge** (Sonnet)
- Endpoint: GET /api/curso/:slug/contenido
- Llama a core_course_get_contents + mod_page/resource/url/forum
- Cachea en Supabase (invalidar con core_course_get_updates_since)
- Renderiza contenido Moodle en el espacio de aprendizaje
- Reemplaza @@PLUGINFILE@@ con URLs tokenizadas

**Agente 2B — Progress & Grades Bridge** (Sonnet)
- Endpoint: GET /api/curso/:slug/progreso/:userId
- Llama a: core_completion_get_activities_completion_status, gradereport_user_get_grade_items, mod_assign_get_submission_status
- Muestra: completion real, calificaciones, entregas con feedback
- Progreso curricular: slides vistas (50%) + quizzes/entregas aprobadas (50%)

**Agente 2C — UCampus Profile Integration** (Sonnet)
- Enriquecer perfil del estudiante con datos UCampus:
  nombre, carrera, año ingreso, avance malla
- Mostrar en sidebar o header del curso
- Fallback graceful si el RUT no está en UCampus (42% de casos)

**Agente 2D — xAPI Analytics Dashboard** (Sonnet)
- Mini-dashboard del participante al completar módulo:
  - Tiempo total dedicado
  - Score vs promedio de la cohorte
  - Slides donde más tiempo pasó
  - Preguntas con más errores
- Consulta Ralph LRS por actor.mbox + activity.id

**Agente 2E — PIAC Auto-Renderer** (Opus)
- Si el curso tiene piac_link_id en Supabase:
  - Leer piac_parsed JSON
  - Auto-generar la estructura del curso desde el PIAC
  - Núcleos → módulos, sesiones → slides con antes/durante/después
  - Evaluaciones sumativas → sección de evaluaciones con ponderación
  - RF → portada de módulo, CE → checklist visible
- Esto es el puente M3→M4: el PIAC define, el template renderiza

---

### FASE 3 — Configuración Adaptativa (MOCA conceptual)
**Objetivo**: Cada tipo de curso activa distintos componentes automáticamente.

**Agente 3A — Adaptive Config Engine** (Opus)
- Leer `courseType` del JSON
- Activar/desactivar componentes según la tabla de Agente 0B
- Ejemplo: un curso tutoreado muestra foro + calendario + entregas; un autoformación muestra solo quiz + progreso

**Agente 3B — Pre-Assessment** (Sonnet)
- Quiz diagnóstico opcional al inicio del curso
- Resultado personaliza recomendaciones de contenido
- Almacena perfil del estudiante para adaptar la experiencia

**Agente 3C — Badge Generator** (Sonnet)
- Al completar: generar badge visual SVG con nombre + fecha + curso
- Descargable como PNG
- Integrar con sistema OB3.0 existente en Supabase (user_badges)

---

## Orden de ejecución sugerido

```
Sesión próxima:  FASE 0 completa (schema + tipos + migración)
Sesión siguiente: FASE 1A-1C (tipografía, sidebar, señalización)
Después:          FASE 1D-1F (quiz, DUA, arte generativo)
Después:          FASE 2E primero (PIAC auto-renderer — es el core)
Después:          FASE 2A-2D (bridges con backends)
Futuro:           FASE 3 (MOCA — requiere validación empírica)
```

## Archivos de referencia
- ~/Documents/umce-online/CURSO-VIRTUAL-SPEC.md — spec del curso virtual
- ~/Documents/umce-online/VISION.md — visión 7 pilares
- ~/Documents/37_DESIGN/knowledge/ — Design System UDFV (7 docs)
- ~/Documents/37_DESIGN/knowledge/ecosystem-map-umce-online.md — mapa backends
- ~/Documents/umce-online/src/public/autoformacion/ — templates actuales
- ~/Documents/curso-sustentabilidad-landing/src/ — referencia visual (React/Vite)
