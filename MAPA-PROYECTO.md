# Mapa del proyecto UMCE.online

Ultima actualizacion: 06-abr-2026
Proposito: saber que existe, que importa, y que ignorar. Leer esto antes de abrir cualquier otra cosa.

---

## Fuente de verdad (leer siempre)

| Archivo | Que es | Cuando leer |
|---------|--------|-------------|
| `CLAUDE.md` | Reglas irrompibles (stack, auth, DB, PIAC, IA, Moodle) | Se carga solo. No tocar |
| `SPEC.md` | Fases de desarrollo con checkboxes. Fases 1-5 completadas, 5.5 completada, Fase 6 pendiente | Al inicio de cada sesion |
| `VISION.md` (raiz) | Vision estrategica 01-Abr-2026: 7 pilares, secuencia abril-junio, primer hit Sustentabilidad | Cuando se necesite contexto de por que se hace algo |

## Referencia util (leer solo si SPEC lo pide)

| Archivo | Que es | Nota |
|---------|--------|------|
| `CURSO-VIRTUAL-SPEC.md` | Spec detallado del curso virtual (2128 lineas). QM Rubric, benchmark, layout, secciones, accesibilidad | Ya ejecutado en Fases 3-5. Consultar si hay dudas de diseno |
| `SESSION-NOTES-CURSO-VIRTUAL.md` | Decisiones de David validadas en sesion 25-26 mar | Referencia historica. No leer proactivamente |
| `docs/VISION.md` | Vision operativa anterior (ecosistema, dashboard, portal, lo que funciona) | OBSOLETO — reemplazado por VISION.md raiz (01-Abr-2026) |
| `docs/contexto-institucional/` | Contexto de la UMCE para el proyecto | Consultar si se necesita contexto institucional |
| `docs/mesa2-aporte-udfv.md` | Aporte UDFV a Mesa 2 virtualizacion | Referencia puntual |

## Carpetas externas relacionadas

| Carpeta | Que es | Estado |
|---------|--------|--------|
| `43_VIRTUAL_UMCE_WEB/` | Codebase original de virtual.udfv.cloud | LEGACY — migrado a umce-online en Fase 1. No usar para desarrollo. El src/server.js es util como referencia historica si se necesita comparar |
| `38_WEB/` | Estrategia digital: SEO, RRSS, UX, guia editorial (16 docs) | CONTEXTO ESTRATEGICO — no es codigo. Util si se trabaja en portal publico, marketing, o contenido web. No leer proactivamente |
| `00_CEREBRO/` | Estado general de todos los proyectos UDFV | umce.online es proyecto #10 en ESTADO-ACTUAL.md. Consultar solo si se necesita contexto cruzado con otros proyectos (Zoom, Moodle Monitor, etc.) |
| `ARCHIVOS_UMCE/` | Archivo documental institucional (+260 archivos: PIACs, resoluciones, lineamientos) | REPOSITORIO — no es un proyecto. Contiene PIACs de referencia y docs normativos. Buscar aqui si se necesita un documento institucional especifico |
| `propuesta-virtual-umce/` | Landing HTML estatica (95KB, un solo archivo) | OBSOLETO — era un prototipo/mockup anterior al portal actual |
| `37_Diplomado_Competencias_Digitales/` | Diplomado de competencias digitales para docentes | OTRO PROYECTO — no tiene relacion directa con umce-online |

## Donde esta el proyecto hoy (06-abr-2026)

El codigo esta en `umce-online/src/`. Fases 1 a 5.5 completadas. Hay un curso virtual funcional con PIAC reader, matching Moodle, vista estudiante personalizada, cron de actualizacion, y chatbot contextual.

Segun VISION.md, lo siguiente es:
- Abril: curso autoformacion Sustentabilidad como primer producto terminado
- Mayo: Modelo Educativo UDA + VcM
- Junio: 3 cursos vivos + analytics

La Fase 6 (integracion Acompana) esta pendiente y es esqueleto.

## Notion: pagina indice del proyecto

URL: https://www.notion.so/32e0778552798118ab7dcf2563971f21
Actualizada: 06-abr-2026. Contiene el mapa del proyecto, links tematicos, estado actual, y mapa de carpetas.

Paginas hijas con advertencia (marcadas 06-abr-2026):
- "Arquitectura UMCE.online" — HISTORICO: stack y fases superados
- "Interfaz PIAC → Generador Moodle" — DESCARTADO: contradice reglas irrompibles
- "Motor IA: Cron + LLM" — PARCIAL: idea central implementada, plantillas/creacion descartadas

Paginas hijas vigentes (sin cambios necesarios):
- "El problema del diseno lento" — diagnostico valido
- "10 problemas estructurales" — analisis institucional vigente
- "El problema de las videollamadas" — referencia para proyecto Zoom
- Orientaciones PIAC, Oferta Formativa, Formacion docente — contexto academico vigente

## Contradicciones detectadas y resueltas

En el repo:
1. **docs/VISION.md vs VISION.md raiz**: El de docs/ es una vision operativa anterior. Marcado como OBSOLETO. El de la raiz (01-Abr-2026) manda.
2. **43_VIRTUAL_UMCE_WEB/ESTADO_PROYECTO.md**: Describe el portal como "virtual.udfv.cloud". Carpeta marcada ARCHIVADO.
3. **CEREBRO proyecto #10 vs SPEC.md**: CEREBRO tiene resumen de alto nivel. SPEC.md tiene el detalle real. Si hay discrepancia, SPEC.md manda.
4. **CURSO-VIRTUAL-SPEC.md (2128 lineas)**: Fue el spec de diseno para Fases 3-5. Ya se ejecuto. No es fuente de verdad para el estado actual.

En Notion:
5. **"Arquitectura UMCE.online"**: Proponia Next.js + Vercel. Se usa Express + VPS. Marcado HISTORICO.
6. **"Interfaz PIAC → Generador Moodle"**: Proponia reemplazar PIAC Word con formulario + crear aulas Moodle automaticamente. Anti-patrones #4 y #5. Marcado DESCARTADO.
7. **"Motor IA: Cron + LLM"**: La idea central se implemento. Las plantillas de creacion en Moodle se descartaron. Marcado PARCIAL.
8. **Tabla de fases en pagina indice**: Decia todo PENDIENTE cuando Fases 1-5.5 estan completadas. Corregido.
9. **Estado en pagina indice**: Decia "En planificacion" y "siguiente paso: SDPA". Actualizado a "En desarrollo activo" con estrategia abril-junio.
