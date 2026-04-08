# ARQUITECTURA UMCE.ONLINE -- Documento Maestro

**Version**: 1.0
**Fecha**: 2026-04-07
**Consolidado de**: 9 documentos del espacio de aprendizaje + auditoria de bugs + server.js (~6400 lineas)
**Proposito**: Referencia tecnica unica del sistema UMCE.online para el equipo UDFV

---

# PARTE I -- ARQUITECTURA DEL SISTEMA

## 1. Las 5 Capas

### Capa 1 -- Registro Academico (RA)

Fuente de verdad institucional. Matriculas, mallas curriculares, docentes asignados, notas oficiales y calendario academico viven en UCampus (sistema fuera del control UDFV). El VPS sincroniza datos 2 veces al dia a Supabase Self-Hosted (schema `ucampus`, 17 tablas: `personas`, `cursos_dictados`, `cursos_inscritos`, `ramos`, `carreras_alumnos`, `horarios`, entre otras). EdX/EOL (cursos.umce.cl) existe pero no tiene integracion con UMCE.online.

### Capa 2 -- Motor de Contenido (MC)

Fuente de verdad del curso. Las 5 instancias Moodle (evirtual, practica, virtual, pregrado, postgrado) contienen actividades, recursos, foros, evaluaciones, calificaciones, completion y grabaciones. Google Drive alberga los documentos PIAC (.docx) compartidos entre david.reyes_j@ y udfv@. Cada plataforma tiene su token REST de lectura en `.env`. Regla irrompible: la IA nunca crea ni modifica nada en Moodle ni en Drive.

### Capa 3 -- Inteligencia Curricular (IC)

Procesamiento y cruce de datos. Server Express (server.js, puerto 3000, VPS 82.29.61.165) con Supabase Self-Hosted (supabase.udfv.cloud, schema `portal`). Contiene las tablas de procesamiento (`piac_links`, `piac_parsed`, `moodle_snapshots`, `matching_results`, `discrepancies`), configuracion DI (`curso_virtual_config`, `curso_virtual_bibliografia`, `recursos_adicionales`, `institutional_defaults`), cache (`cache_recordings`, `cache_calendar`, `cache_completions`*, `cache_grades`*, `cache_submissions`*) y mapeo (`user_moodle_mapping`). Las tablas marcadas con * tienen schema definido pero cron pendiente.

### Capa 4 -- Experiencia del Estudiante (EE)

Presentacion. Lo que ve el estudiante, docente y DI en UMCE.online. Incluye Curso Virtual (`/curso-virtual/:linkId`), Panel PIAC (`/piac`), Planificador (`/virtualizacion/planificador`), Calculadora SCT (`/virtualizacion/sct`), Sistema QA (`/virtualizacion/qa`), Mis Cursos (`/mis-cursos`), Landing publica (`/api/curso-landing/:linkId`), Demo (`/demo`), Formacion Docente (`/formacion-docente`).

### Capa 5 -- Observatorio de Calidad (OC)

Analisis transversal. QA Preventivo (8 checks sobre planificacion antes de implementar), QA de Implementacion (77 indicadores D1-D6 cruzando PIAC vs Moodle), QA Operacional / Auditor Nocturno (salud, coherencia pedagogica, riesgo, MOCA -- conceptual), Dashboard Docente (dashboard.udfv.cloud v4.1.1), Ralph LRS (lrs.udfv.cloud, xAPI), Moodle Monitor (cron 30min, Notion DB + alertas Telegram, 1876 cursos).

---

## 2. Diagrama de Capas

```
                    CAPA 1 -- REGISTRO ACADEMICO (RA)
                    ================================
                    [ UCampus ]         [ EdX/EOL ]
                         |                  (sin integracion)
                         | sync 2x/dia
                         v
                    [ Supabase schema ucampus ]
                         |
                         | lectura
                         v
          +--------------+------------------------------------------+
          |                                                         |
          |        CAPA 3 -- INTELIGENCIA CURRICULAR (IC)            |
          |        =========================================        |
          |                                                         |
CAPA 2    |   [ PIAC Parser ]  [ Matching Engine ]  [ Config DI ]   |
=======   |        ^                  ^                    |        |
          |        |                  |                    |        |
[ Google  |---->  parse            match              publicar      |
  Drive ] |   (mammoth+LLM)    (deterministico)          |        |
          |        |                  |                    v        |
[ Moodle  |---->  snapshot         discrepancias    curso_virtual   |
  x5    ] |   (REST API)              |              _config       |
          |        |                  v                    |        |
          |        v            [ Supabase schema portal ]          |
          |   [ Cache cron ]                                        |
          |   recordings, calendar, completion*, grades*             |
          |                                                         |
          +---------+-------------------------------------------+---+
                    |                                           |
                    | JSON consolidado                          | alertas
                    v                                           v
          CAPA 4 -- EXPERIENCIA (EE)              CAPA 5 -- OBSERVATORIO
          =========================                DE CALIDAD (OC)
          [ Curso Virtual ]  [ Panel PIAC ]        ====================
          [ Planificador  ]  [ Mis Cursos ]        [ QA Preventivo   ]
          [ Landing       ]  [ Demo       ]        [ QA Implementac. ]
                                                   [ Auditor PA.xx   ]
                                                   [ Dashboard       ]
                                                   [ Ralph LRS       ]

FLUJO DE LECTURA/ESCRITURA:
  UCampus ──lectura──> Supabase ucampus ──lectura──> IC (server.js)
  Google Drive ──lectura──> IC (PIAC Parser, mammoth + LLM)
  Moodle x5 ──lectura──> IC (snapshot, completion, grades, recordings, foros)
  Moodle x5 <──escritura── IC (SOLO: mod_forum_add_discussion_post)
  IC (Supabase portal) ──lectura──> EE (endpoints JSON)
  IC (Supabase portal) ──lectura──> OC (QA engine, auditor)
  EE (Panel PIAC) ──escritura──> IC (config, bibliografia, recursos, publicacion)
  EE (Curso Virtual) ──escritura──> IC (refresh personal, responder foro)

LEYENDA:  ────>  Lectura    <---->  Bidireccional    [*] Schema definido, cron pendiente
```

---

## 3. 17 Flujos de Datos

| # | Nombre | Trigger | Frecuencia | Estado |
|---|--------|---------|------------|--------|
| 1 | **Sync UCampus** | Cron VPS | 2x/dia | Implementado |
| 2 | **Parse PIAC** | DI manual ("Comparar" o "Solo leer PIAC") | Bajo demanda | Implementado |
| 3 | **Snapshot Moodle** | DI manual ("Comparar" o "Solo leer Moodle") | Bajo demanda | Implementado |
| 4 | **Matching** | DI manual (parte de "Comparar") | Bajo demanda | Implementado |
| 5 | **Visado DI** | DI manual (panel config, pestana Contenido) | Bajo demanda | Implementado |
| 6 | **Publicacion** | DI manual (toggle en panel) | Bajo demanda | Implementado |
| 7 | **Refresh Personal** | Estudiante abre curso / boton "Actualizar" (throttle 5 min) | Por request | Implementado (live, no cache) |
| 8 | **Cache Recordings** | Cron VPS (recording_pipeline.py) | Cada 6h (objetivo) | Parcialmente implementado |
| 9 | **Cache Calendar** | Cron VPS | Cada 6h (objetivo) | Parcialmente implementado |
| 10 | **Cache Completion** | Cron VPS | Cada 15 min (horario) / 1h (resto) | Schema definido, cron pendiente |
| 11 | **Cache Grades** | Cron VPS | Cada 1h | Schema definido, cron pendiente |
| 12 | **Cache Submissions** | Cron VPS | Cada 30 min | Schema definido, cron pendiente |
| 13 | **QA Preventivo** | DI manual (planificador) | Bajo demanda | Definido, endpoint pendiente |
| 14 | **QA Implementacion** | DI manual o cron semanal | Bajo demanda / semanal | Definido, endpoint pendiente |
| 15 | **QA Operacional** | Cron nocturno | Diario nocturno | Conceptual |
| 16 | **Consolidacion Curso** | Estudiante abre `GET /api/curso-virtual/:linkId` | Por request | Implementado |
| 17 | **xAPI Statement** | Accion del estudiante | Tiempo real (futuro) | No implementado |

---

## 4. Reglas de Sincronizacion (6 mas importantes)

### Regla 1: Moodle es fuente de verdad del contenido, pero el DI controla la visibilidad en UMCE.online

```
Escenario: Moodle tiene "Quiz Sesion 5" (visible=true), pero el DI marco
actividades_config[cmid].visible=false en curso_virtual_config.

Resultado:
  - En UMCE.online: la actividad NO se muestra al estudiante
  - En Moodle directo: la actividad SI es visible
  - El filtro isVisadoVisible() en el endpoint curso-virtual excluye la actividad
```

### Regla 2: El snapshot es intencional -- el DI decide cuando incorporar cambios de Moodle

```
Escenario: El docente agrego 2 actividades nuevas en Moodle ayer.
El DI no ha re-snapshotteado.

Resultado:
  - UMCE.online muestra las actividades del snapshot viejo
  - Las nuevas actividades NO aparecen hasta que el DI ejecute "Solo leer Moodle"
  - Esto es by design: evita que cambios no revisados aparezcan sin visado
```

### Regla 3: UCampus gana para datos institucionales, PIAC para diseno curricular

```
Escenario: UCampus dice docente="Maria Gonzalez", PIAC dice docente="Juan Perez"

Resultado:
  - Para permisos: UCampus (Maria tiene acceso de docente)
  - Para info visible al estudiante: curso_virtual_config (lo que el DI configuro)
  - Si DI no actualizo la config: el PIAC muestra dato viejo
```

### Regla 4: Datos personales en tiempo real cuando es posible, cache cuando existe

```
Escenario: cache_completions tiene datos de hace 2 horas. Moodle API timeout.

Resultado:
  - Se muestra cache viejo con indicador "Actualizado hace 2h"
  - Se lanza refresh asincrono en background
  - Si cache no existe: curso sin datos de progresion + "Cargando..."
  - NUNCA bloquear acceso al contenido por un timeout
```

### Regla 5: Config del DI prevalece sobre defaults institucionales

```
Implementacion:
  resolvedConfig = {
    ...institutionalDefaults,    // base: textos institucionales
    ...cursoVirtualConfig        // override: lo que el DI configuro
  }

Campos con default institucional:
  - politica_integridad, politicas_curso, competencias_digitales
  - docente_horario_atencion, docente_tiempos_respuesta
```

### Regla 6: La IA nunca crea ni modifica nada

No escribe en Moodle, no edita el PIAC en Drive, no cambia configuraciones sin intervencion humana. Solo observa, parsea, compara, presenta y alerta.

---

# PARTE II -- EXPERIENCIA DEL USUARIO

## 5. Shell Unificado

Un solo componente `CourseShell` renderiza la experiencia de aprendizaje. No hay 5 templates distintos. Hay un shell con un objeto `courseType` que activa/desactiva componentes. Se implementa con `data-course-type` en HTML y clases condicionales.

```js
const COURSE_CONFIGS = {
  tutoreado:     { sidebar: true,  topbar: true,  sequence: 'full',    nav: 'free',   sync: true,  grades: true,  badges: true,  xapi: false },
  autoformacion: { sidebar: false, topbar: false, sequence: 'content', nav: 'linear', sync: false, grades: false, badges: false, xapi: true  },
  diplomado:     { sidebar: true,  topbar: true,  sequence: 'full',    nav: 'free',   sync: true,  grades: true,  badges: true,  xapi: false },
  taller:        { sidebar: true,  topbar: true,  sequence: 'prep',    nav: 'free',   sync: true,  grades: false, badges: false, xapi: false },
  induccion:     { sidebar: false, topbar: false, sequence: 'linear',  nav: 'linear', sync: false, grades: false, badges: false, xapi: true  },
};
```

5 paletas de color por CSS custom properties (activadas por `data-course-type`):

| Tipo | Color primario | Accent | Semantica |
|------|---------------|--------|-----------|
| tutoreado | indigo-500 (#6366f1) | violeta-700 (#7c3aed) | Profundidad + confianza |
| autoformacion | indigo-500 (#6366f1) | teal (#14b8a6) | Base / default |
| diplomado | teal-500 (#14b8a6) | amber-600 (#d97706) | Institucional + distincion |
| taller | orange-500 (#f97316) | rojo-600 (#dc2626) | Energia + accion |
| induccion | botanical-500 (#4f9647) | amarillo-600 (#ca8a04) | Bienvenida + optimismo |

---

## 6. Componentes Activos por Tipo de Curso

| Componente | Tutoreado | Autoformacion | Diplomado | Taller | Induccion |
|------------|-----------|---------------|-----------|--------|-----------|
| Sidebar lateral | SI | NO | SI | SI | NO |
| Topbar (Zoom, Grab, Cal) | SI | NO | SI | SI | NO |
| Navegacion | Libre (sidebar) | Lineal (prev/next) | Libre | Libre | Lineal |
| Breadcrumb | SI | NO | SI | SI | NO |
| Busqueda Cmd+K | SI | NO | SI | NO | NO |
| Bienvenida docente | SI | NO | SI | SI | NO |
| Foro presentacion | SI | NO | SI | Opcional | NO |
| Mapa nucleos (roadmap) | SI | SI (modulos) | SI | NO | SI |
| Secuencia 3 momentos | SI (full) | NO (slide+quiz) | SI | Prep/Live/Refl | NO |
| Evaluacion dedicada | SI | NO (quiz inline) | SI | Opcional | NO (quiz final) |
| Tabla ponderaciones | SI | NO | SI | SI (simplif) | NO |
| Rubricas inline | SI | NO | SI | NO | NO |
| Nota/feedback inline | SI | NO | SI | NO | NO |
| Progreso Moodle completion | SI | NO (xAPI) | SI | SI | NO (xAPI) |
| Barra progreso por nucleo | SI | NO | SI | SI | NO |
| Steps indicator | NO | SI | NO | NO | SI |
| Foro discusion | SI | NO | SI | Opcional | NO |
| Chat (chatbot) | SI | SI (generico) | SI | SI | NO |
| Zoom (sincronica) | SI | NO | SI | SI (destacado) | NO |
| Grabaciones | SI | NO | SI | SI | NO |
| Badges nivel 1/2 | SI | NO | SI | NO | NO |
| Microcredencial | NO | NO | SI | NO | NO |
| Certificado PDF | NO | SI (constancia) | SI | SI (asistencia) | SI |
| xAPI statements | NO | SI | NO | NO | SI |
| Bottom bar mobile | Tab bar | Prev/Next | Tab bar | Tab bar | Prev/Next |

---

## 7. Roles -- Que Ve y Puede Hacer Cada Actor

| Accion | Estudiante | Docente (@umce.cl) | DI (editor) | Admin |
|--------|-----------|-------------------|-------------|-------|
| Ver curso virtual publicado | SI | SI | SI | SI |
| Ver curso no publicado | NO (fallback Moodle) | NO (*) | SI | SI |
| Ver datos completion propios | SI | SI | SI | SI |
| Ver datos completion de otros | NO | NO (*) | NO | SI (via ?email=) |
| Ver notas propias inline | SI | SI | SI | SI |
| Ver lista inscritos de su seccion | NO | SI | NO | SI |
| Editar config curso (bienvenida, politicas) | NO | NO (*) | SI | SI |
| Ocultar/mostrar actividades | NO | NO (*) | SI | SI |
| Agregar recursos adicionales | NO | NO (*) | SI | SI |
| Publicar / despublicar | NO | NO | SI | SI |
| Ejecutar analisis PIAC-Moodle | NO | NO | SI | SI |
| Resolver discrepancias | NO | NO | SI | SI |
| Crear/revocar badges | NO | NO | SI | SI |
| Acceder al Panel PIAC | NO | NO | SI | SI |
| Impersonar otro usuario (?email=) | NO | NO | NO | SI |
| Ver alertas QA del curso | NO | NO (*) | SI | SI |
| Responder foro desde UMCE.online | SI | SI | SI | SI |

(*) = previsto en el SPEC, pendiente de implementacion. El docente actualmente no tiene endpoints de escritura propios. Implementacion progresiva: Fase A (vista enriquecida), Fase B (edicion basica), Fase C (sync bidireccional Moodle).

---

## 8. Senalizacion Pedagogica por Tipo de Curso

| Informacion | Tutoreado | Autoformacion | Diplomado | Taller | Induccion |
|-------------|-----------|---------------|-----------|--------|-----------|
| Resultado Formativo (RF) | SI | SI (simplificado) | SI | SI | NO |
| Criterios Evaluacion (CE) | SI | NO | SI | NO | NO |
| Semanas / temporalidad | SI | NO | SI | Fechas evento | NO |
| Tiempo estimado por actividad | SI | SI | SI | SI | SI |
| Etiqueta obligatorio/complementario | SI (*) | NO | SI (*) | NO | NO |
| Objetivo de aprendizaje por actividad | SI (*) | NO | SI (*) | NO | NO |
| Progreso % numerico | SI | NO | SI | SI | NO |
| Proximas actividades | SI (3 prox) | NO | SI | SI | NO |
| Nota parcial/promedio | SI | NO | SI | NO | NO |
| Bloqueo secuencial | NO (libre) | SI | Configurable | NO | SI |
| Politica integridad academica | SI | NO | SI | NO | NO |

(*) = Disenado en SPEC, pendiente de implementacion en la pestana Contenido del panel config.

---

# PARTE III -- FLUJOS OPERATIVOS

## 9. Flujo M1 a M5 -- Ciclo Completo

```
M1 CALCULADORA SCT ──> M2 PIAC/UGCI ──> M3 PLANIFICADOR ──> M4 IMPLEMENTACION ──> M5 QA RUBRICA
         |                                      |                    |                    |
         v                                      v                    v                    v
   [sct_plans]                           [design_plans]        [piac_links +         [qa_evaluations]
   [sct_plan_activities]                 [design_plan_weeks]    matching_results +    [qa_scores]
                                         [design_plan_items]    discrepancies +      [qa_cross_validations]
                                                                curso_virtual_config]
         |_____________________________________________|__________________________|
                                                       |
                                              [virtualization_flows]
                                              (registro central M1-M5)
                                                       |
                                              RETROALIMENTACION M5 -> M1:
                                              qa_evaluations.recommendations --> sct_plans (siguiente ciclo)
```

**Herramientas por momento:**

| Momento | Herramienta | URL |
|---------|-------------|-----|
| M1 | Calculadora SCT | `/virtualizacion/sct` |
| M2 | PIAC en Google Drive | Documento Word, externo |
| M3 | Planificador Curricular | `/virtualizacion/planificador` |
| M4 | Panel PIAC (analisis + config) | `/piac` |
| M5 | Rubrica QA | `/virtualizacion/qa` |

**Conexion M1->M3:** FK `design_plans.sct_plan_id`. Cuando el DI termina M1 y clickea "Ir al Planificador", se pasa `?sctPlanId=123`. El planificador pre-configura creditos, semanas, perfil, horas budget.

**Conexion M3->M4:** FK `design_plans.piac_link_id`. El matching engine consulta `design_plans` via `piac_link_id` para comparar actividades planificadas vs encontradas en Moodle.

**Conexion M4->M5:** FK `qa_evaluations.piac_link_id` + `moodle_snapshot_id` + `design_plan_id`. El QA evalua 77 indicadores contra snapshot + discrepancies + design plan.

**Conexion M5->M1:** `virtualization_flows.feedback_json` almacena retroalimentacion. Al crear nuevo `sct_plans` para el mismo programa, el sistema muestra: "Ciclo anterior: [issues]. Recomendaciones: [lista]."

---

## 10. Pipeline Planificador -> PIAC -> Moodle

### Ruta A: Desde el Planificador (flujo ideal, endpoints pendientes)

```
1. DI usa el Planificador (/virtualizacion/planificador)
   -> Configura modulo, SCT, semanas, perfil, formato
   -> Agrega actividades (categorias IN, EC, EA, EB, EE, ED, EV)
   -> Valida carga horaria (semaforo verde/amarillo/rojo)
   -> "Guardar diseno" -> POST /api/planificador/guardar -> planificador_designs

2. DI genera borrador PIAC
   -> POST /api/planificador/:id/generar-piac -> piac_drafts (status='draft')
   -> Algoritmo transforma actividades en nucleos/sesiones (deterministico)

3. DI exporta borrador a Drive
   -> POST /api/planificador/:id/exportar-drive -> Google Doc en carpeta compartida

4. DI completa el Word en Drive (edicion fuera del sistema)

5. DI crea vinculo PIAC-Moodle
   -> POST /api/piac/link con drive_url + moodle_course_id

6. DI ejecuta analisis
   -> POST /api/piac/:linkId/analyze (parse + snapshot + match)

7. DI configura el curso virtual (6 pestanas)
   -> PUT /api/piac/:linkId/config

8. DI hace preview -> GET /api/piac/:linkId/preview

9. DI publica -> POST /api/piac/:linkId/config/publish
```

### Ruta B: Desde PIAC existente (flujo actual, ya funciona)

```
1. DI tiene PIAC en Drive (pre-existente)
2. POST /api/piac/link (vincular)
3. POST /api/piac/:linkId/analyze (analizar)
4. PUT /api/piac/:linkId/config (configurar 6 pestanas)
5. GET /api/piac/:linkId/preview (preview)
6. POST /api/piac/:linkId/config/publish (publicar)
```

### Las 6 pestanas del panel de configuracion

| # | Pestana | Campos |
|---|---------|--------|
| 1 | Bienvenida | Foto docente (URL), Video bienvenida (YouTube), Bio, Mensaje, Descripcion motivacional, Horario atencion, Conocimientos previos |
| 2 | Politicas | Politicas curso, Integridad academica, Requisitos foros, Competencias digitales, Tiempos respuesta (email/foro/tareas) |
| 3 | Contenido | Lista actividades por seccion con toggle visible/oculto |
| 4 | Objetivos semanales | Campo texto libre por semana (generado desde PIAC) |
| 5 | Foros | Foro presentacion (cmid), Foro consultas generales (cmid) |
| 6 | Bibliografia | CRUD: titulo, autores, anio, tipo, clasificacion, acceso, nucleo, URL, DOI, toggle "es clasico" |

---

## 11. Flujo del DI -- Crear, Configurar, Publicar, Actualizar

### Crear y analizar un vinculo

1. Acceder a `/piac` (requiere auth @umce.cl + rol admin/editor)
2. "Nuevo vinculo" -> plataforma Moodle (select 5 opciones), ID curso, URL PIAC Drive
3. `POST /api/piac/link` -> extrae `drive_file_id`, persiste en `piac_links`
4. "Comparar PIAC con Moodle" -> `POST /api/piac/:linkId/analyze`
   - Parse PIAC: Drive API -> mammoth -> Claude LLM -> JSON -> `piac_parsed`
   - Snapshot Moodle: `core_course_get_contents` + 4 APIs -> `moodle_snapshots`
   - Matching: deterministico -> `matching_results` + `discrepancies`
   - Tiempo: 10-30 seg, barra de progreso 3 pasos
5. Ver resultados en 4 pestanas: Planificacion, Comparacion, Problemas, Datos
6. Resolver discrepancias inline -> `POST /api/piac/discrepancy/:id/resolve`

### Actualizar un curso publicado

| Escenario | Accion DI | Endpoint |
|-----------|-----------|----------|
| PIAC cambio en Drive | "Comparar" o "Solo leer PIAC" | `POST /analyze` o `/parse` |
| Docente agrego actividades en Moodle | "Solo leer Moodle" + "Comparar" | `POST /snapshot` + `/analyze` |
| Actualizar textos/fotos/politicas | Editar en pestanas y "Guardar" | `PUT /config` |
| Retirar temporalmente | Toggle "Publicado" apagar | `POST /config/unpublish` |

### Versionamiento

- Cada parse crea nueva version en `piac_parsed` (campo `version` incremental)
- Cada snapshot crea nuevo registro en `moodle_snapshots`
- `GET /api/piac/link/:id` siempre devuelve el mas reciente
- Versiones anteriores permanecen para auditoria

---

## 12. QA como Ciclo -- Preventivo, Implementacion, Operacion, Retroalimentacion

### QA Preventivo (entre M3 y M4)

8 verificaciones automaticas desde el JSON del planificador:

| Check | Indicador | Umbral |
|-------|-----------|--------|
| QA.P1 | Contenido pasivo <=60% del total | <=60% |
| QA.P2 | Al menos 1 actividad de aprendizaje colaborativo | >=1 |
| QA.P3 | Al menos 1 evaluacion formativa | >=1 |
| QA.P4 | Al menos 1 evaluacion sumativa | >=1 |
| QA.P5 | Balance sincrono/asincrono (ninguno >70%) | 10-70% |
| QA.P6 | Carga semanal consistente con SCT | +/-20% |
| QA.P7 | Mecanismo de retroalimentacion | >=1 assign/quiz/workshop |
| QA.P8 | Multimodalidad de recursos (>=3 tipos) | >=3 |

Semaforo: verde (>=7/8), amarillo (>=5/8), rojo (<5/8).

### QA de Implementacion (M4)

77 indicadores D1-D6. Tres grupos:

**Grupo A -- 100% automatizable (API Moodle):**
- QA.I1: Nucleos PIAC implementados en Moodle (ratio >=80%)
- QA.I2: Tareas con fecha de entrega (duedate > 0)
- QA.I3: Foros con instrucciones (intro > 100 chars)
- QA.I4: Gradebook visible (showgrades=1)
- QA.I5: Al menos 70% secciones con contenido
- QA.I6: Videos YouTube con subtitulos (cc_load_policy=1)
- QA.I7: Tareas con rubrica (advancedgrading)

**Grupo B -- Parcialmente automatizable (heuristica):**
- Videos con .vtt, estructura progresiva, coherencia de nombres

**Grupo C -- Solo evaluable manualmente:**
- QA.I8: Lenguaje incluyente (D5)
- QA.I9: Alt text en imagenes (D2)
- QA.I10: Ejemplos con corresponsabilidad (D6)

### QA Operacional (M5)

Datos de operacion del semestre cruzan: cache_completions, cache_grades, Auditor PA.xx, Ralph LRS (xAPI).

| Dato | Umbral amarillo | Umbral rojo |
|------|-----------------|-------------|
| Completion promedio | 40-70% | <40% |
| Docente sin acceso | 7-14 dias | >14 dias |
| Participacion foros | 30-60% inscritos | <30% |
| Tiempo retroalimentacion | 7-14 dias | >14 dias |
| Reprobados | 25-40% | >40% |

### Retroalimentacion M5->M1

4 retroalimentaciones clave al cierre de semestre:
- RF.01: Carga real vs planificada (xAPI durations vs SCT)
- RF.02: Recursos ignorados (completion <30%)
- RF.03: Abandono en sesiones sincronicas largas (patron de salida min 70-80)
- RF.04: Dimension de calidad que mas alerto (D1-D6 con mas fallos)

---

# PARTE IV -- PROBLEMAS CONOCIDOS Y SOLUCIONES

## 13. Bugs Activos

| # | Severidad | Archivo | Descripcion | Solucion propuesta |
|---|-----------|---------|-------------|-------------------|
| 1 | CRITICA | `public/piac.html` | `PLATFORM_URLS` definida en linea 621 pero solo accesible dentro del scope de `loadLinks()`. Otras funciones (lineas 766, 772, 1526, 1690) la referencian fuera de scope, causando `undefined` cuando se navega a un detalle sin haber cargado la lista | Mover `PLATFORM_URLS` al scope global del script, fuera de cualquier funcion |
| 2 | CRITICA | `public/curso-virtual.html:512` | `submitModalForumReply` se define como `async function` dentro de un bloque que puede no ejecutarse si el DOM no tiene el contenedor de foros. El `onclick` inline en linea 425 referencia la funcion, causando `ReferenceError` si el bloque de foros no se renderizo | Mover la funcion al scope global o usar event delegation en lugar de onclick inline |
| 3 | ALTA | `public/piac.html` | Pestana "Foros" del panel config muestra contenido vacio: los campos `foro_presentacion_cmid` y `foro_consultas_cmid` requieren que el DI sepa el cmid exacto del foro en Moodle | Poblar automaticamente desde `moodle_snapshots` detectando foros por nombre o tipo |
| 4 | ALTA | `public/piac.html` | Alertas del curso (`GET /api/piac/:linkId/notifications`) no cargan en el panel de detalle del vinculo | Verificar que el endpoint responde y que el contenedor HTML existe cuando se llama |
| 5 | ALTA | `public/curso-virtual.html` | Zoom sin LTI: el boton "Entrar a clase" requiere integracion LTI que no esta implementada; si LTI no responde se muestra "Enlace no disponible" | Implementar fallback a URL directa de Zoom desde cache_calendar o config del DI |
| 6 | ALTA | `server.js` (matching engine) | Matching PIAC-Moodle es fragil por nombre: cruza actividades por coincidencia de strings en nombres de nucleos/sesiones, no por ID estable. Cambiar el nombre de una seccion en Moodle rompe el matching | Agregar campo `matching_key` o usar numero de seccion como referencia estable |
| 7 | MEDIA | `public/shared/shared.css` + multiples HTML | CSP bloqueaba Google Fonts, p5.js canvas, Ralph LRS. Headers `Content-Security-Policy` en server.js no incluian estos origenes | **YA ARREGLADO** -- CSP actualizado con `fonts.googleapis.com`, `cdn.jsdelivr.net`, `lrs.udfv.cloud` |
| 8 | MEDIA | `public/formacion-docente.html` y otros | Animaciones `fade-up` (via `data-animate="fade-up"` + IntersectionObserver en `shared.js`) no se activan: el contenido queda invisible (opacity: 0, translateY) si el observer no detecta la entrada | Verificar que `shared.js` inicializa el observer correctamente; agregar fallback CSS `[data-animate].no-js { opacity: 1; transform: none; }` |

---

## 14. Gaps de Implementacion

Disenado en documentos 01-09 pero no implementado en server.js, priorizado por impacto:

| # | Gap | Prioridad | Esfuerzo |
|---|-----|-----------|----------|
| 1 | `POST /api/planificador/guardar` (persistir diseno) | Alta | 1 dia |
| 2 | `POST /api/planificador/:id/generar-piac` (borrador PIAC) | Alta | 2 dias |
| 3 | `POST /api/planificador/:id/exportar-drive` (exportar a Drive) | Alta | 1 dia |
| 4 | `POST /api/qa/preventivo` (8 checks) | Alta | 1 dia |
| 5 | `POST /api/qa/:linkId/implementacion` (77 indicadores) | Alta | 2-3 dias |
| 6 | Cron `cache_completions` | Alta | 1 dia |
| 7 | Cron `cache_grades` | Alta | 1 dia |
| 8 | Cron `cache_submissions` | Media | 0.5 dia |
| 9 | Vista docente enriquecida (Fase A): deteccion rol, lista alumnos, completion agregado | Alta | 2-3 dias |
| 10 | Middleware `docenteOwnerMiddleware` + `PATCH /docente/config` (Fase B) | Media | 1-2 dias |
| 11 | Validacion cruzada M3<->M4<->M5 (`validation_runs`) | Media | 2 dias |
| 12 | Campos adicionales pestana Contenido: tiempo estimado, obligatorio/complementario, objetivo | Media | 1 dia |
| 13 | Snapshot automatico para cursos publicados (cron diario) | Media | 1 dia |
| 14 | Importar bibliografia desde `piac_parsed.bibliografia[]` automaticamente | Baja | 0.5 dia |
| 15 | xAPI desde curso virtual al LRS | Baja | 2-3 dias |
| 16 | Panel UI para editar `institutional_defaults` | Baja | 1 dia |
| 17 | Notificacion push al publicar (Firebase) | Baja | 0.5 dia |
| 18 | Verificacion URLs bibliografia (cron semanal HEAD + CrossRef) | Baja | 1 dia |

---

## 15. Deuda Tecnica

| # | Problema | Donde | Impacto |
|---|----------|-------|---------|
| 1 | **Matching por nombre** | `server.js` matching engine | Fragil: renombrar seccion rompe el cruce. Necesita matching por numero de seccion o campo estable |
| 2 | **Completion/grades en tiempo real** | `GET /api/curso-virtual/:linkId` | Cada request de estudiante llama Moodle live. Con 30 estudiantes simultaneos = 30 calls a Moodle. Necesita cache con TTL |
| 3 | **No hay cron para cache_completions/grades/submissions** | VPS cron | Tablas definidas en schema-fase4.sql, jamas llenadas. El endpoint vive de calls live |
| 4 | **PLATFORM_URLS duplicada/scope roto** | `public/piac.html` | La constante de URLs de plataformas se define dentro de una funcion y se usa fuera |
| 5 | **server.js monolitico (~6400 lineas)** | `src/server.js` | Todo en un archivo: auth, PIAC, curso-virtual, badges, chat, admin, UCampus, autoformacion. Sin modularizacion |
| 6 | **No hay tests automatizados** | Todo el proyecto | Zero tests. Cambios se verifican manualmente |
| 7 | **Rol docente no existe en el servidor** | `getUserRole()` en server.js | Un docente autenticado devuelve `null`. La tabla `cursos_dictados` permite verificar, pero no hay middleware reutilizable |
| 8 | **No hay validacion de inscripcion** | `GET /api/curso-virtual/:linkId` | Cualquier @umce.cl autenticado accede a cualquier curso publicado. No se verifica inscripcion en UCampus |
| 9 | **Matching UCampus ramo <-> Moodle curso inexistente** | `piac_links` | No hay campo `ucampus_codigo_ramo` para vincular. Matching requiere heuristica por nombre |
| 10 | **Fallback de foro reply** | `public/curso-virtual.html` | `submitModalForumReply` puede lanzar ReferenceError si el contenedor de foros no se renderizo |

---

## 16. Riesgos Arquitectonicos

| # | Riesgo | Probabilidad | Impacto | Mitigacion |
|---|--------|-------------|---------|------------|
| 1 | **Lectura Moodle en vivo sin cache** — Con 100+ estudiantes simultaneos, cada uno dispara 4-5 calls a Moodle. Las instancias Moodle (especialmente postgrado en Moodle 3.8) pueden degradarse | Alta | Alto | Implementar cron de cache (flujos 10-12) y servir desde Supabase con TTL |
| 2 | **Snapshot desactualizado** — Si el DI no re-snapshottea, UMCE.online muestra datos viejos indefinidamente. El docente puede haber cambiado fechas, agregado actividades | Alta | Medio | Cron diario de snapshot automatico para cursos publicados |
| 3 | **server.js monolitico** — Un bug en el endpoint de chat puede tumbar el endpoint de curso-virtual. Un deploy parcial es imposible | Media | Alto | Modularizar en archivos separados (auth.js, piac.js, curso-virtual.js, etc.) importados por server.js |
| 4 | **Sin tests** — Cualquier cambio puede romper endpoints existentes sin deteccion | Alta | Alto | Agregar tests de integracion para los endpoints criticos (curso-virtual, piac/analyze, piac/config) |
| 5 | **Token Moodle unico por plataforma** — Si el token admin se revoca o expira, toda la plataforma pierde acceso a datos Moodle | Baja | Critico | Monitoreo de health de tokens + alerta automatica si un call falla con error de token |
| 6 | **LLM dependency para parse PIAC** — Si el proxy Claude no responde, no se puede analizar ningun PIAC | Media | Medio | Implementar retry con backoff + fallback a modelo local (no implementado) |
| 7 | **Supabase Self-Hosted single point of failure** — Si el VPS cae, todo el sistema pierde datos (schema portal + ucampus) | Baja | Critico | Backups automaticos de PostgreSQL (verificar que estan activos en Dokploy) |

---

# PARTE V -- MEJORAS PROPUESTAS

## 17. Mejoras Priorizadas por Impacto

| # | Mejora | Impacto | Esfuerzo | Dependencias | Estado |
|---|--------|---------|----------|--------------|--------|
| 1 | Implementar crons cache_completions + cache_grades | Alto | 2 dias | schema-fase4.sql (existe) | Pendiente |
| 2 | Fix PLATFORM_URLS scope en piac.html | Alto | 0.5 h | Ninguna | Pendiente |
| 3 | Fix submitModalForumReply ReferenceError | Alto | 0.5 h | Ninguna | Pendiente |
| 4 | Snapshot automatico diario para cursos publicados | Alto | 1 dia | Ninguna | Pendiente |
| 5 | Panel progreso estudiante (`GET /api/curso-virtual/:linkId/progreso`) | Alto | 1-2 dias | Cache completion | Pendiente |
| 6 | Endpoint QA Preventivo (8 checks planificador) | Alto | 1 dia | Ninguna | Definido |
| 7 | Persistir planificador (`POST /api/planificador/guardar`) | Alto | 1 dia | Ninguna | Definido |
| 8 | Vista docente enriquecida (Fase A) | Alto | 2-3 dias | `cursos_dictados` sync | Definido |
| 9 | Fix fade-up animations (fallback CSS) | Medio | 0.5 h | Ninguna | Pendiente |
| 10 | Fix alertas panel PIAC | Medio | 0.5 dia | Verificar endpoint | Pendiente |
| 11 | Fix pestana Foros (auto-poblar cmid) | Medio | 0.5 dia | moodle_snapshots | Pendiente |
| 12 | Endpoint QA Implementacion (77 indicadores) | Medio | 2-3 dias | Snapshot Moodle | Definido |
| 13 | Middleware docenteOwnerMiddleware (Fase B) | Medio | 1-2 dias | Fase A | Definido |
| 14 | Campo ucampus_codigo_ramo en piac_links | Medio | 1 dia | Ninguna | Pendiente |
| 15 | Generar borrador PIAC desde planificador | Medio | 2 dias | Persistir planificador | Definido |
| 16 | Modularizar server.js | Medio | 2-3 dias | Ninguna, mejora DX | Pendiente |
| 17 | Importar bibliografia desde PIAC automaticamente | Bajo | 0.5 dia | Ninguna | Pendiente |
| 18 | xAPI desde curso virtual al LRS | Bajo | 2-3 dias | Ralph LRS (existe) | Pendiente |
| 19 | Verificacion URLs bibliografia (cron) | Bajo | 1 dia | Ninguna | Pendiente |
| 20 | Open Badges automaticos por completion | Bajo | 1 dia | Cache completion + OB 3.0 (existe) | Pendiente |

---

## 18. Roadmap Sugerido

### Fase 1 -- Estabilizacion (1-2 semanas)

- Fix bugs criticos: PLATFORM_URLS scope (#2), submitModalForumReply (#3), fade-up (#9)
- Fix bugs altos: alertas panel (#10), pestana Foros auto-poblar (#11)
- Implementar crons cache_completions + cache_grades (#1)
- Snapshot automatico diario para cursos publicados (#4)

### Fase 2 -- Flujo Completo M1-M5 (2-3 semanas)

- Persistir planificador (#7)
- Endpoint QA Preventivo (#6)
- Generar borrador PIAC desde planificador (#15)
- Endpoint QA Implementacion (#12)
- Panel progreso estudiante (#5)
- Campo ucampus_codigo_ramo (#14)

### Fase 3 -- Vista Docente + Calidad (2-3 semanas)

- Vista docente enriquecida Fase A (#8)
- Middleware docenteOwnerMiddleware Fase B (#13)
- Importar bibliografia automaticamente (#17)
- Verificacion URLs bibliografia (#19)
- Open Badges automaticos (#20)

### Fase 4 -- Escala y Analitica (3-4 semanas)

- Modularizar server.js (#16)
- xAPI desde curso virtual al LRS (#18)
- QA Operacional / Auditor Nocturno
- Edicion docente avanzada Fase C (sync bidireccional Moodle)
- Tests de integracion para endpoints criticos

---

# PARTE VI -- GLOSARIO Y REFERENCIA

## 19. Glosario

| Termino | Significado |
|---------|-------------|
| **PIAC** | Plan Integral de Actividades Curriculares -- documento Word en Google Drive que describe el diseno del curso |
| **Snapshot** | Foto en el tiempo de la estructura de un curso en Moodle (secciones, actividades, foros, fechas). Se almacena en `moodle_snapshots` |
| **Parse** | Leer el PIAC de Drive, convertirlo a texto con mammoth, extraer JSON estructurado con LLM (Claude proxy) |
| **Matching** | Cruce deterministico entre PIAC parseado y snapshot Moodle para detectar correspondencias y discrepancias |
| **Visado DI** | Configuracion de visibilidad por actividad que el DI controla en UMCE.online (independiente de Moodle). Campo `actividades_config[cmid].visible` |
| **Discrepancia** | Diferencia detectada entre PIAC y Moodle. Severidades: critica / advertencia / info |
| **Refresh Personal** | Llamada en tiempo real a Moodle para completion + grades del estudiante que abre el curso |
| **Cache** | Tablas en Supabase que almacenan datos de Moodle (llenadas por cron) para evitar calls en tiempo real |
| **TTL** | Time To Live -- tiempo maximo que un dato en cache se considera fresco |
| **Link (piac_link)** | Registro que vincula un PIAC de Drive con un curso de Moodle. Entidad central del sistema |
| **Config** | Configuracion del curso virtual editada por el DI: bienvenida, politicas, visibilidad, foros, bibliografia |
| **Consolidacion** | Proceso que une 12 fuentes de datos en un solo JSON para renderizar el curso (endpoint `GET /api/curso-virtual/:linkId`) |
| **Publicado** | Flag en `curso_virtual_config`. Si true: estudiantes acceden. Si false: ven fallback con link a Moodle |
| **Momento (M1-M5)** | Etapas del flujo de virtualizacion: M1=SCT, M2=PIAC/UGCI, M3=Planificador, M4=Implementacion, M5=QA |
| **Nucleo** | Unidad tematica del PIAC. Contiene sesiones, resultado formativo, criterios de evaluacion, temas |
| **SCT** | Sistema de Creditos Transferibles. 1 SCT = 27 horas de trabajo del estudiante |
| **DI** | Disenador Instruccional. Rol editor en UMCE.online. Configura cursos, ejecuta analisis, publica |
| **Shell** | Componente unico de renderizacion del curso. 5 configuraciones por `data-course-type` |
| **D1-D6** | 6 dimensiones del Marco Evaluativo QA: D1=Interaccion, D2=Accesibilidad, D3=Coherencia didactica, D4=Docencia virtual, D5=Genero, D6=Corresponsabilidad |
| **Auditor PA.xx** | Sistema automatico nocturno de auditoria academica. 20 reglas (PA.01-PA.20) que verifican salud de cursos |
| **Semaforo** | Indicador de estado QA: verde (cumple), amarillo (cumple parcial), rojo (no cumple) |

---

## 20. Inventario de Endpoints

### Auth (4 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/auth/login` | -- | Inicia flujo OAuth Google @umce.cl |
| GET | `/auth/callback` | -- | Callback OAuth, crea cookie `umce_session` |
| GET | `/auth/me` | Cookie | Datos del usuario autenticado |
| GET | `/auth/logout` | -- | Destruye sesion |

### UCampus (2 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/ucampus` | Auth | Perfil academico (asDocente + asEstudiante) |
| GET | `/api/ucampus/seccion/:idCurso` | Auth+Admin | Lista estudiantes de una seccion |

### Catalogo Publico (6 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/catalog/programs` | -- | Listar programas |
| GET | `/api/catalog/programs/:slug` | -- | Detalle programa |
| GET | `/api/catalog/programs/:slug/piac` | -- | PIACs de un programa |
| GET | `/api/catalog/courses` | -- | Listar cursos |
| GET | `/api/catalog/courses/:slug` | -- | Detalle curso |
| GET | `/api/catalog/search` | -- | Busqueda |

### PIAC / Analisis (17 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/piac/link` | Editor | Vincular PIAC Drive + curso Moodle |
| GET | `/api/piac/links` | Editor | Listar vinculos activos |
| GET | `/api/piac/link/:id` | Editor | Detalle de un vinculo |
| DELETE | `/api/piac/link/:id` | Editor | Eliminar vinculo |
| POST | `/api/piac/:linkId/parse` | Editor | Parsear PIAC con LLM (async, retorna jobId) |
| GET | `/api/piac/job/:jobId` | Editor | Estado del job de parseo |
| POST | `/api/piac/:linkId/snapshot` | Editor | Tomar snapshot de Moodle |
| POST | `/api/piac/:linkId/match` | Editor | Ejecutar matching engine |
| POST | `/api/piac/:linkId/analyze` | Editor | Analisis completo (parse + snapshot + match) |
| POST | `/api/piac/discrepancy/:id/resolve` | Editor | Resolver discrepancia |
| POST | `/api/piac/discrepancy/:id/unresolve` | Editor | Desmarcar resolucion |
| GET | `/api/piac/:linkId/config` | Editor | Leer config DI del curso |
| PUT | `/api/piac/:linkId/config` | Editor | Actualizar config DI |
| POST | `/api/piac/:linkId/config/publish` | Editor | Publicar curso |
| POST | `/api/piac/:linkId/config/unpublish` | Editor | Despublicar curso |
| GET | `/api/piac/:linkId/preview` | Editor | Preview (ignora flag publicado) |
| GET | `/api/piac/:linkId/notifications` | Editor | Alertas del vinculo |

### Bibliografia (5 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/piac/:linkId/bibliografia` | Publico | Leer bibliografia |
| POST | `/api/piac/:linkId/bibliografia` | Editor | Agregar entrada |
| PUT | `/api/piac/bibliografia/:id` | Editor | Actualizar entrada |
| DELETE | `/api/piac/bibliografia/:id` | Editor | Eliminar entrada |
| GET | `/api/piac/:linkId/bibliografia/calidad` | Editor | Analisis LLM de calidad |

### Recursos Adicionales (5 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/piac/:linkId/recursos` | Editor | Listar recursos |
| POST | `/api/piac/:linkId/recursos` | Editor | Agregar recurso (URL) |
| POST | `/api/piac/:linkId/recursos/upload` | Editor | Subir archivo (multer) |
| PUT | `/api/piac/recursos/:id` | Editor | Actualizar recurso |
| DELETE | `/api/piac/recursos/:id` | Editor | Eliminar recurso |

### Curso Virtual (6 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/curso-virtual/:linkId` | Auth | Vista completa con datos personales (12 fuentes) |
| POST | `/api/curso-virtual/:linkId/refresh` | Auth | Refrescar datos personales (throttle 5min) |
| GET | `/api/curso-virtual/book/:platform/:cmid` | Auth | Capitulos de book con HTML |
| GET | `/api/curso-virtual/page/:platform/:cmid` | Auth | Contenido de page con HTML |
| GET | `/api/curso-virtual/forum/:platform/:forumId` | Auth | Discusiones de un foro |
| POST | `/api/curso-virtual/forum/:platform/:forumId/reply` | Auth | Responder en foro |

### Badges / Credenciales (14 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/badges/definitions` | -- | Definiciones de badges |
| GET | `/api/user/badges` | Auth | Badges del usuario |
| GET | `/api/badges/user/:email` | Auth | Badges por email |
| GET | `/api/piac/:linkId/badges` | Auth | Badges de un curso |
| GET | `/api/user/badges/sdpa` | Auth | Badges SDPA |
| GET | `/api/user/trayectoria` | Auth | Trayectoria formativa |
| GET | `/api/user/badges/export` | Auth | Exportar badges |
| GET | `/api/badge/:hash` | -- | Badge por hash |
| GET | `/api/microcredencial/:hash` | -- | Microcredencial por hash |
| POST | `/api/admin/badges/grant` | Editor | Otorgar badge (legacy) |
| POST | `/api/badges/award` | Editor | Otorgar badge |
| POST | `/api/admin/badges/revoke/:id` | Editor | Revocar badge |
| GET | `/api/admin/badges/stats` | Editor | Estadisticas badges |
| POST | `/api/badges/issue` | Admin | Emitir badge OB 3.0 |

### Microcredenciales (4 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/user/microcredenciales` | Auth | Mis microcredenciales |
| GET | `/api/user/microcredenciales/:id` | Auth | Detalle microcredencial |
| GET | `/api/admin/microcredenciales` | Editor | Admin: listar |
| POST | `/api/admin/microcredenciales` | Editor | Admin: crear |

### SDPA / Formacion Docente (6 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/docente/sdpa/resumen` | Auth | Resumen SDPA del docente |
| GET | `/api/docente/sdpa/actividades` | Auth | Actividades SDPA |
| GET | `/api/marco-tic` | -- | Marco TIC completo |
| GET | `/api/sdpa/certificaciones` | -- | Certificaciones disponibles |
| GET | `/api/sdpa/estadisticas` | -- | Estadisticas SDPA |
| GET | `/api/admin/sdpa/docentes` | Editor | Admin: docentes SDPA |

### Chat (3 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/chat/session` | -- | Crear sesion de chat |
| POST | `/api/chat/message` | -- | Enviar mensaje |
| GET | `/api/chat/history` | -- | Historial |

### Notificaciones (3 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/notifications` | Auth | Notificaciones del usuario |
| PUT | `/api/notifications/:id/read` | Auth | Marcar como leida |
| PUT | `/api/notifications/read-all` | Auth | Marcar todas como leidas |

### Autoformacion (4 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/autoformacion/enroll` | -- | Inscribir |
| PATCH | `/api/autoformacion/progress` | -- | Actualizar progreso |
| POST | `/api/autoformacion/complete` | -- | Completar |
| GET | `/api/autoformacion/status` | -- | Estado |

### Institucional Defaults (2 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/institutional-defaults` | Editor | Leer defaults |
| PUT | `/api/institutional-defaults/:key` | Editor | Actualizar default |

### Otros (6 endpoints)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/mis-cursos` | Auth | Cursos del usuario |
| GET | `/api/historial` | Auth | Historial academico |
| GET | `/api/news` | -- | Noticias |
| GET | `/api/team` | -- | Equipo |
| GET | `/api/health` | -- | Health check |
| POST | `/api/push/register` | -- | Registrar device token FCM |

**Total: 87 endpoints implementados** (sin contar rutas de archivos estaticos ni redirects).

---

## 21. Inventario de Tablas Supabase (schema portal)

### Tablas Core Portal (11)

| Tabla | Descripcion |
|-------|-------------|
| `portal.programs` | Programas academicos (maestrias, diplomados, etc.) |
| `portal.courses` | Cursos del catalogo |
| `portal.team_members` | Equipo UDFV |
| `portal.program_team` | Relacion programa-equipo |
| `portal.testimonials` | Testimonios |
| `portal.news` | Noticias |
| `portal.resources` | Recursos publicos |
| `portal.chat_sessions` | Sesiones de chatbot |
| `portal.chat_messages` | Mensajes de chatbot |
| `portal.sync_log` | Log de sincronizacion |
| `portal.admin_actions` | Acciones de admin |

### Tablas PIAC / Curso Virtual (11)

| Tabla | Descripcion |
|-------|-------------|
| `portal.piac_links` | Vinculo PIAC Drive <-> curso Moodle (entidad central) |
| `portal.piac_parsed` | JSON parseado del PIAC (multiples versiones) |
| `portal.moodle_snapshots` | Snapshot de estructura Moodle (multiples versiones) |
| `portal.matching_results` | Resultado del cruce PIAC vs Moodle |
| `portal.discrepancies` | Discrepancias detectadas (con estado de resolucion) |
| `portal.curso_virtual_config` | Config DI: foto, bio, politicas, visado, publicado |
| `portal.institutional_defaults` | Textos por defecto institucionales |
| `portal.recursos_adicionales` | Recursos extra agregados por DI |
| `portal.curso_virtual_bibliografia` | Bibliografia enriquecida y clasificada |
| `portal.user_moodle_mapping` | Cache email UMCE <-> userId Moodle (por plataforma) |
| `portal.notifications` | Notificaciones |

### Tablas Cache (5, schema definido en schema-fase4.sql)

| Tabla | Descripcion | Estado cron |
|-------|-------------|-------------|
| `portal.cache_recordings` | Grabaciones desde mod_data Moodle | Parcialmente implementado |
| `portal.cache_calendar` | Calendario de eventos | Parcialmente implementado |
| `portal.cache_completions` | Completion por usuario/curso | Cron pendiente |
| `portal.cache_grades` | Calificaciones | Cron pendiente |
| `portal.cache_submissions` | Entregas de tareas | Cron pendiente |

### Tablas Badges / Credenciales (5)

| Tabla | Descripcion |
|-------|-------------|
| `portal.badge_definitions` | Definiciones de badges |
| `portal.user_badges` | Badges otorgados a usuarios |
| `portal.microcredencial_definitions` | Definiciones de microcredenciales |
| `portal.microcredencial_requisitos` | Requisitos por microcredencial |
| `portal.user_microcredenciales` | Microcredenciales otorgadas |

### Tablas SDPA / Formacion Docente (7)

| Tabla | Descripcion |
|-------|-------------|
| `portal.tic_dominios` | Dominios del Marco TIC |
| `portal.tic_ambitos` | Ambitos TIC |
| `portal.tic_descriptores` | Descriptores TIC |
| `portal.actividades_sdpa` | Actividades del SDPA |
| `portal.certificaciones_sdpa` | Certificaciones disponibles |
| `portal.progreso_certificaciones` | Progreso de certificacion por docente |
| `portal.evidencias_sdpa` | Evidencias subidas |

### Tabla Autoformacion (1)

| Tabla | Descripcion |
|-------|-------------|
| `portal.autoformacion_enrollments` | Inscripciones y progreso autoformacion |

### Tablas M1-M5 (definidas en docs, aun no aplicadas en Supabase)

| Tabla | Descripcion |
|-------|-------------|
| `portal.sct_plans` | Resultado persistido de Calculadora SCT (M1) |
| `portal.sct_plan_activities` | Actividades del plan SCT |
| `portal.design_plans` | Planificacion curricular persistida (M3) |
| `portal.design_plan_items` | Cada actividad individual del plan |
| `portal.design_plan_weeks` | Carga semanal planificada |
| `portal.qa_evaluations` | Evaluacion QA de un curso (M5) |
| `portal.qa_scores` | Detalle por indicador (77 filas por evaluacion) |
| `portal.qa_cross_validations` | Comparacion M3 vs M4 vs M5 |
| `portal.virtualization_flows` | Registro central que une M1-M5 |
| `portal.planificador_designs` | Output persistido del planificador |
| `portal.piac_drafts` | Borradores PIAC generados desde planificador |
| `portal.validation_runs` | Cross-validation M3 vs M4 vs M5 |
| `portal.qa_implementation_results` | Resultado QA de implementacion |

### Schema UCampus (17 tablas, sync 2x/dia)

| Tabla | Descripcion |
|-------|-------------|
| `ucampus.personas` | RUT, email, nombres |
| `ucampus.cursos_dictados` | Cursos que dicta el docente |
| `ucampus.cursos_inscritos` | Cursos del estudiante |
| `ucampus.ramos` | Catalogo de ramos |
| `ucampus.cursos` | Secciones con cupos, modalidad |
| `ucampus.horarios` | Horarios por seccion |
| `ucampus.carreras_alumnos` | Carrera del estudiante |
| `ucampus.carreras` | Nombres de carreras |
| + 9 tablas adicionales de estructura academica | |

**Total: ~53 tablas en schema portal + 17 en schema ucampus = ~70 tablas.**

---

*Documento generado 2026-04-07. Fuentes: docs/espacio-aprendizaje/01-09, server.js (~6400 lineas), 11 archivos schema-*.sql, auditoria de bugs.*
