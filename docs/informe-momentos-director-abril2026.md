# umce.online — Estado de desarrollo por momento del proceso de virtualización

**Destinatario:** Dirección UDFV
**Autor:** David Reyes J. — Coordinación UDFV
**Fecha:** 14 de abril de 2026
**Sitio en producción:** https://umce.online/virtualizacion

---

## 1. Síntesis ejecutiva

**Nota sobre el rol actual de umce.online.** El sitio opera hoy como el **espacio donde se plasman los avances** del trabajo de virtualización: productos de la Mesa 1, herramientas piloto, fundamentación documentada. No es la nueva plataforma institucional de educación virtual, y la decisión sobre qué plataforma asumirá ese rol no está tomada. Dicho eso, la arquitectura de umce.online —construida sobre Express, Moodle API y Supabase, con integración a las cinco plataformas Moodle UMCE y al sistema de credenciales Open Badges 3.0— **podría razonablemente evolucionar hacia un espacio integrador** de los sistemas existentes si la institución así lo define. Por ahora, su función es hacer visible y navegable lo que la UDFV viene construyendo.

El sitio **umce.online** operativiza el proceso UMCE de virtualización curricular en **cinco momentos** articulados (M1 → M5). Cada momento tiene productos y herramientas públicas propias. A la fecha, **cuatro de los cinco momentos** cuentan con herramientas navegables en línea, y el quinto (monitoreo) está en fase de definición. Todo el desarrollo se enmarca en la Mesa 1 de Virtualización 2026 y los productos comprometidos para mayo ante consejeros.

Los cinco momentos corresponden a las cinco fases del modelo ADDIE aplicadas al contexto institucional UMCE, distinguiendo dos instancias de diseño que suelen confundirse: el **PAC** (Programa de Actividad Curricular — aprueba UGCI) y el **PIAC** (Plan Instruccional — construye UDFV con el docente).

---

## 2. Los cinco momentos y su desarrollo

| # | Momento | Pregunta que resuelve | Actores | Estado de desarrollo |
|---|---|---|---|---|
| **M1** | Definir créditos y horas | ¿Las horas declaradas son coherentes con los créditos SCT? | Coordinador de programa | **Operativo** |
| **M2** | Diseñar el PAC | ¿Qué resultados de aprendizaje y distribución macro tiene el curso? | UGCI + docente | **Contextualizado** (instrumento institucional vigente) |
| **M3** | Diseñar el PIAC | ¿Cómo distribuyo las horas en actividades semana a semana? | Diseñador instruccional + docente | **Operativo** |
| **M4** | Implementar en LMS y asegurar calidad | ¿El curso cumple el estándar de calidad antes de liberarse? | UDFV + docente | **Operativo** |
| **M5** | Monitorear y retroalimentar | ¿Lo planificado se cumplió con datos reales de uso? | UDFV + coordinación | **En diseño** |

---

## 3. Detalle por momento

### Momento 1 — Definir créditos y horas

**Herramienta:** Calculadora SCT.
**URL:** https://umce.online/virtualizacion/sct
**Pregunta que resuelve:** ¿Las horas declaradas en la resolución son coherentes con los créditos SCT? ¿La carga semanal que resulta es pedagógicamente viable?
**Producto comprometido Mesa 1:** sí.

**Cómo se usa.** Un coordinador de programa ingresa al wizard y avanza en cuatro pasos: (1) elige el **perfil** del programa — Pregrado, Postgrado o Educación Continua, cada uno con defaults propios de carga, gradiente, umbrales y bandas interpretativas; (2) ingresa los **datos** del programa (nombre, AC, semanas); (3) revisa y ajusta la **carga semanal de referencia**; y (4) **confirma**. A partir de ahí la herramienta genera el calendario del programa y despliega dos vistas: un **Gantt interactivo** con drag & resize para editar cada actividad curricular, y un **gráfico de carga semanal acumulada** con alertas por semana.

**Modelo de cálculo (bottom-up).** La calculadora no pide "cuántos SCT tiene el curso", sino que lo **construye** desde tres tipos de horas semanales:
- **HS** — horas sincrónicas (clase en vivo, Zoom, presencial).
- **HAs** — horas asincrónicas (lectura, video, foro diferido).
- **HAut** — horas de trabajo autónomo (estudio, producción propia).

Estas se multiplican por **NS** (número de semanas) y se comparan contra el rango oficial SCT Chile (un SCT = 27 h totales aproximadamente). Esto permite contrastar resoluciones reales — por ejemplo, MEMAT 5–8 SCT por asignatura — contra lo que el diseño efectivamente produce.

**Sistema de alertas.** Las alertas **no** se disparan por carga total, sino por **tope sincrónico semanal**. La decisión técnica — respaldada en literatura bichrónica (Martin, Polly & Ritzhaupt, 2020; Nieuwoudt, 2020) — es que el problema operativo no es la suma de horas, sino la acumulación de sesiones en vivo simultáneas en una misma semana. Cada semana recibe una clasificación visual verde/amarilla/roja según el umbral del perfil. La carga total (≈13 h/sem pregrado, ≈11 postgrado, ≈8 educación continua) opera como **referencia de diseño**, no como umbral de alerta.

**Honestidad epistémica integrada en la página.** La sección "Presentación de la herramienta" declara explícitamente qué está respaldado normativamente y qué es decisión de diseño UDFV todavía sin validación institucional:
- **Respaldado:** fórmula SCT (CRUCH 2003/2013), distinción de los tres tipos de horas, método compositivo bottom-up, formato CUECH.
- **Decisiones UDFV provisionales:** los umbrales 13/11/8 h/sem, las bandas interpretativas (ensayo/paper/tesis), las plantillas narrativas de recomendación y el criterio de alertar sobre sincrónico y no sobre total.
- **Pendiente:** validar umbrales con UGCI, calibrar con evidencia institucional, integración con PIAC/PAC, persistencia en servidor y validación contra un programa real (ej. MEMAT).

**Base teórica citada en la página.** CRUCH (2003, 2013); Knowles (1984); Hase & Kenyon (2000); Martin, Polly & Ritzhaupt (2020); Nieuwoudt (2020).

### Momento 2 — Diseñar el PAC
**Herramienta:** no aplica (instrumento institucional existente).
**URL de contextualización:** https://umce.online/virtualizacion/fundamentos
**Descripción:** El PAC es el documento que aprueba la UGCI. El sitio lo contextualiza explicando la diferencia con el PIAC y su rol en el flujo. No se propone reemplazar el instrumento vigente.

### Momento 3 — Diseñar el PIAC

**Herramienta:** Planificador Curricular.
**URL:** https://umce.online/virtualizacion/planificador
**Pregunta que resuelve:** una vez que la UGCI ya aprobó los créditos en el PAC, ¿cómo distribuyo esas horas en actividades concretas semana a semana respetando el modelo pedagógico virtual UMCE?
**Producto comprometido Mesa 1:** sí.

**Qué no es.** El planificador **no es una calculadora de horas genérica** ni reemplaza el documento PIAC. Produce un **insumo** — la base curricular (créditos, semanas, perfil y catálogo de e-actividades seleccionadas) — que el diseñador instruccional y el académico usan para redactar el PIAC definitivo en Word. La frontera con el Momento 1 es clara: el planificador se usa **después** de que los créditos ya fueron aprobados, no antes.

**Cómo se usa.** Wizard de cuatro pasos: (1) **Tu módulo** — perfil del estudiante, créditos, semanas; (2) **Actividades** — selección desde el catálogo de e-actividades; (3) **Revisar** — preview del diseño con la distribución por tipo; (4) **Resultado** — tablero con seis verificaciones automáticas, gráfico de carga por semana y gráfico de distribución por categoría pedagógica.

**Apoyo en el modelo pedagógico virtual UMCE.** El planificador valida el diseño contra **tres pilares** del modelo institucional:
- **Interacción (EC)** — *"Sin interacción no hay aprendizaje"* (Sangrà, 2020). Primer pilar. Foros, sesiones sincrónicas, tutorías, glosarios colaborativos. Todo curso virtual UMCE debe tener al menos una actividad de este tipo; sin ella, no es un curso sino un repositorio.
- **Colaboración (ED)** — segundo pilar. No es trabajo en grupo genérico: es co-construcción con interdependencia real (Pérez-Mateo & Guitert, 2013). Wikis, proyectos grupales, co-evaluación. La CNA valora explícitamente la evidencia de construcción colectiva en programas virtuales.
- **Reflexión (EE)** — tercer pilar. Diario reflexivo, blog, portafolio, ensayo reflexivo. Crítico en formación docente (identidad UMCE) y en postgrado con profesionales que conectan teoría y práctica.

**Catálogo de e-actividades (7 categorías).** Los tres pilares pedagógicos (EC/ED/EE) se complementan con cuatro dimensiones operativas del diseño: **Contenidos (IN)** — lecturas, videos, podcasts, SCORM que *alimentan* las actividades; **Evaluación (EV)** — formativa (H5P, autoevaluación, quizzes) y sumativa (productos de aprendizaje); y categorías adicionales para escenarios específicos. La tipología deriva de los cinco tipos de e-actividad de Guardia et al. (2004) y Salmon (2013), más IN y EV como dimensiones operativas. Los tiempos estimados provienen de referencias internacionales (FAU, Penn State, Massey) y de la experiencia acumulada en la UDFV UMCE.

**Seis verificaciones automáticas al cierre.** El planificador no aprueba ni rechaza: emite un semáforo de coherencia pedagógica:
1. **Interacción presente** (hay al menos una actividad EC).
2. **Colaboración presente** (hay al menos una actividad ED).
3. **Reflexión presente** (hay al menos una actividad EE).
4. **Evaluación formativa presente** (el curso aplica *evaluar para aprender* — Prats et al., 2020, y no solo evaluación sumativa final).
5. **Contenido pasivo acotado** — IN ≤ 60 % de la carga total (el modelo UMCE está centrado en la actividad del estudiante, no en el consumo).
6. **Coherencia sincrónica con el PAC** — la carga sincrónica diseñada se contrasta contra el porcentaje de sincronía declarado en el PAC, con tolerancia ±10 puntos. Si el PAC no declara explícitamente ese porcentaje, el planificador usa la heurística del perfil del estudiante como *fallback*.

**Bases teóricas visibles en la puerta de entrada.** Antes del wizard, la página expone el marco: link al modelo pedagógico virtual UMCE, las tres tarjetas de pilares, la tipología de e-actividades, TPACK y el principio *evaluar para aprender*. Al cierre, las fuentes se listan en un bloque colapsable (Sangrà, 2020; Guardia et al., 2004; Salmon, 2013; Pérez-Mateo & Guitert, 2013; Prats et al., 2020), de modo que el diseñador ve en qué se apoya cada verificación.

**Frontera con Moodle.** El planificador no crea el curso en el LMS. Termina en la exportación del insumo curricular; a partir de ahí continúa el Momento 4 (implementación en LMS) y luego el Momento 5 (monitoreo).

### Momento 4 — Implementar en LMS y asegurar calidad
**Herramientas:**
1. **Marco Evaluativo — Rúbrica QA** (resultados históricos)
   **URL:** https://umce.online/virtualizacion/rubrica
   **Descripción:** Dashboard con los resultados del pilotaje 2024 (5 cursos de postgrado y prosecución). Incluye radar de 6 dimensiones, tabla comparativa por curso, hallazgos clave y — desde hoy — la sección **"Los 77 indicadores, uno por uno"** con acordeón por dimensión, subdimensiones nombradas, jerarquía (alta/media/baja) y momento de evaluación para cada indicador. El instrumento es autoría de **Paloma Sepúlveda Parrini (2024)** en el marco del Proyecto de Fortalecimiento Institucional UMC20992.
2. **Sistema QA** (aplicación a cursos nuevos)
   **URL:** https://umce.online/virtualizacion/qa
   **Descripción:** Aplica los mismos 77 indicadores a un curso nuevo y genera un informe con áreas de mejora priorizadas. Fundamentación (OSCQR, Sepúlveda, pilotaje, Mesa 1) visible al usuario.
**Producto comprometido Mesa 1:** sí (Rúbrica QA).

### Momento 5 — Monitorear y retroalimentar
**Herramienta:** **en diseño.**
**Descripción:** Panel de indicadores institucionales que cruce datos reales de participación, carga y rendimiento con lo planificado en M1–M3, para retroalimentar el siguiente ciclo. Pendiente de definición técnica y de integración con las cinco plataformas Moodle UMCE. Producto comprometido Mesa 1 (tablero de indicadores) con horizonte mayo 2026.

---

## 4. Herramientas transversales

- **Landing del flujo:** https://umce.online/virtualizacion — explica los cinco momentos y recomienda cuál herramienta usar según la situación.
- **Fundamentos pedagógicos:** https://umce.online/virtualizacion/fundamentos — modelo pedagógico virtual UMCE, marco teórico de la rúbrica, conceptos clave (PAC/PIAC, SCT, microcredencial, CUECH Súbete).
- **Asistente IA:** https://umce.online/virtualizacion/asistente — consultas al corpus documental del proceso.
- **Verificación pública de credenciales:** https://umce.online/verificar-credencial — infraestructura Open Badges 3.0 (W3C Verifiable Credentials) instalada y operativa.

---

## 5. Fundamentos documentados

- **Marco Evaluativo:** *Sepúlveda Parrini, P. (2024). Marco Evaluativo de Cursos Virtuales UMCE. UDFV, UMCE. Proyecto UMC20992.*
- **Escala de medición del instrumento:** Likert 0–4 (no evaluable / nunca / algunas veces / la mayoría / siempre).
- **77 indicadores:** 29 de importancia alta, 31 media, 16 baja, 1 observación libre. Distribuidos en 6 dimensiones y 19 subdimensiones.
- **Estándares de referencia externos:** OSCQR (SUNY, open source), Quality Matters.
- **Aporte original UMCE:** dimensiones D5 (perspectiva de género y equidad) y D6 (corresponsabilidad social y cuidados digitales) — único instrumento nacional que las incorpora.

---

## 6. Próximos hitos (abril–mayo 2026)

1. **Presentación a consejeros** — fines de abril. Los cuatro productos Mesa 1 navegables en vivo: Calculadora SCT, Planificador Curricular, Rúbrica QA y Sistema QA.
2. **Tablero de indicadores (M5)** — propuesta técnica para mayo.
3. **Validación con bases** — coordinación con DAC, UGCI y DIPOS antes de consolidar.

---

*Documento generado a partir del código en producción del sitio umce.online y los documentos fuente en `docs/`. Cualquier URL de esta tabla puede visitarse directamente para validar el estado actual.*
