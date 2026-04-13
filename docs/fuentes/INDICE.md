# Fuentes Documentales — umce.online/virtualizacion

Documentos originales citados en las páginas de virtualización. Centralizados el 13-Abr-2026.

## ugci/ — Cálculo SCT-Chile (UGCI / Miguel Ángel Pardo)
- **V1_Guia_Calculo_SCT_Chile_UMCE.docx** — Guía oficial UGCI para cálculo de créditos SCT-Chile en UMCE. Fórmula institucional, 4 etapas, 7 pasos, encuestas. Fuente primaria de `/virtualizacion/sct`.
- **ACTA COMISIÓN MIGUEL PARDO.pdf** — Acta de la comisión SCT liderada por Pardo (dic 2023).
- **52 [Para Compartir] Competencias x nivel con y sin desagregaciones 20250715.xlsx** — Competencias por nivel con y sin desagregaciones (jul 2025).
- **EJEMPLO DE FORMATO ANTERIOR DE Programa AC rellenado.pdf** — Formato anterior de Programa de Actividad Curricular rellenado como ejemplo.

## marco-evaluativo/ — Marco Evaluativo Virtual (Paloma Sepúlveda Parrini, 2024)
- **07_Marco Evaluativo Virtual (1). Paloma Sepúlveda.pdf** — Marco completo: 6 dimensiones, 77 indicadores. Proyecto UMC20992. Fuente primaria de `/virtualizacion/qa` y `/virtualizacion/rubrica`.
- **08_Rúbrica Marco Evaluativo, post pilotaje.xlsx** — Instrumento aplicado post-pilotaje con resultados de 5 cursos.
- **Producto 1_Revisión Bibliográfica del Marco Evaluativo-vf (1).pdf** — Revisión bibliográfica que fundamenta el marco.
- **Informe Producto 1 - Paloma Sepúlveda.docx** — Primer informe de avance del proyecto.
- **Informe I_Diseño e Implementación del Marco Evaluativo de Cursos Virtuales.pdf** — Informe formal fase I.
- **Informe II_Diseño e Implementación del Marco Evaluativo de Cursos Virtuales.pdf** — Informe formal fase II.

## cna/ — Comisión Nacional de Acreditación
- **Criterios de Formación Virtual para Ues.pdf** — Criterios CNA para acreditación de programas virtuales universitarios.
- **ORIENTACIONES PARA UNIVERSIDADES-2.pdf** — Orientaciones complementarias CNA.

## estandares-calidad/ — Estándares internacionales de calidad
- **OSCQR_version_4.0_Accessible_PDF_09.26.2021_YX.pdf** — SUNY Online Course Quality Review (OSCQR) v4.0. Base del sistema QA junto con Sepúlveda.
- **StandardsfromtheQMHigherEducationRubric.pdf** — Quality Matters Higher Education Rubric. Referencia comparativa (no adoptada, usada como contraste).

## institucional-umce/ — Documentos institucionales UMCE
- **Sistema-Desarrollo-Academico-SDPA.docx** — Sistema de Desarrollo Profesional Académico completo.
- **Marco-Competencias-TIC-UMCE.docx** — Marco de competencias TIC docentes UMCE.
- **Certificacion-competencias-digitales-docentes.pdf** — Programa de certificación digital.
- **Propuesta-Ruta-Formativa-IA.docx** — Propuesta ruta formativa en IA.
- **Ruta-Formativa-IA.docx** — Versión resumida de la ruta IA.

## virtualizacion-plan/ — Planificación institucional
- **VIRTUALIZACIÓN 26-27 OK.pdf** — Plan institucional de virtualización 2026-2027.
- **202504-Proceso-de-Virtualizacion-de-Programas-Academicos.pdf** — Proceso formal de virtualización de programas (abr 2025).
- **BIBLIOGRAFÍA COMPARADA Modelo Online de Postgrado_rev24012024.pdf** — Bibliografía comparada para modelo online de postgrado (revisión ene 2024).

---

## Documentos generados (en docs/ raíz)
Estos no son fuentes externas, sino análisis y compilaciones propias del proyecto:
- `bibliografia-virtualizacion.md` — Bibliografía APA consolidada (~60 refs)
- `knowledge-base-virtualizacion.md` — Base de conocimiento para asistente IA
- `anticipacion-feedback-ugci.md` — Simulación pre-review UGCI
- `analisis-ssic-umce.md` — Análisis SSIC
- `estado-sct-modularizacion-abril2026.md` — Estado SCT para Dir. Docencia
- `investigacion-microcredenciales-ob3-abril2026.md` — Investigación microcredenciales

## workload-estimator/ — Wake Forest / Rice University (fuente técnica del cálculo de tiempos)
- **source.zip** — Código fuente original del "Enhanced Course Workload Estimator" (Barre, Brown & Esarey, Wake Forest / Rice University, 2016–2020). App R Shiny.
- **ui.R** — Interfaz del estimador original (extraído de source.zip para consulta rápida).
- **server.R** — Lógica de cálculo del estimador original: fórmulas de lectura, escritura, exámenes, multimedia. Base directa de los tiempos estimados en `/virtualizacion/sct` y el planificador.

**Nota:** En las páginas se citan tanto "Penn State HIA Estimator" como "Wake Forest Workload Estimator" (Rice & Artus, 2016). Son herramientas distintas pero complementarias. Penn State no tiene documento local descargado; se referencia como herramienta web.
