> **Nota (13-abr-2026):** Este documento corresponde a la propuesta v2, que fue revisada críticamente y evolucionó a la propuesta v3 consolidada. La v3 incorpora tres modos coexistentes (A: curso individual, B: semestre, C: estimación desde competencias) y resuelve los problemas de scope creep, ratios sin fundamentar, y contradicciones identificados en la auditoría. Ver: `propuesta-calculadora-sct-v3-consolidada.md`.

# Analisis de Impacto: Rediseno Calculadora SCT

> **Fecha**: 13 de abril de 2026
> **Contexto**: La calculadora SCT (Momento 1) pasa de VALIDAR creditos ya asignados a CONSTRUIR la estructura crediticia desde competencias
> **Alcance**: Archivos afectados en umce-online, logica JS, textos UI, dependencias, flujo de datos M1-M3, impacto en documentacion
> **Documento fuente del rediseno**: Pipeline de Diseno Curricular MOCA (`~/Documents/00_CEREBRO/proyectos/pipeline-diseno-curricular-moca.md`)

---

## 1. Archivos que requieren modificacion

### 1.1 Archivos con cambios MAYORES (reescritura significativa)

| Archivo | Path | Que cambia | Por que |
|---------|------|-----------|---------|
| **Calculadora SCT** | `src/public/virtualizacion-sct.html` | Reescritura casi total: nueva UI de inputs (competencias, ACs, tributacion), nuevo procesamiento (Bloom/DOK + Laurillard), nuevo output (malla crediticia). ~1,520 lineas actuales. | El paradigma cambia de "ingresa HS/HAs/HAut y valida" a "ingresa competencias y construye la estructura crediticia" |
| **Knowledge base** | `docs/knowledge-base-virtualizacion.md` | Seccion 2.d (formula SCT) necesita explicar el nuevo flujo compositivo desde competencias. Seccion 2.h (3 perfiles) necesita reflejar logica diferenciada (no solo umbrales). Agregar secciones para Bloom/DOK, Laurillard, tributacion | La KB es fuente de verdad para el asistente IA y debe reflejar el nuevo modelo |
| **Estado SCT** | `docs/estado-sct-modularizacion-abril2026.md` | Secciones 2 (formula), 4 (flujo 5 momentos), 5.1 (calculadora SCT), 8 (problema de fondo) necesitan actualizacion para reflejar que M1 ya no es solo verificacion sino construccion | Documento enviado a Domingo Pavez; la proxima version debe reflejar el rediseno |

### 1.2 Archivos con cambios MODERADOS (actualizacion de textos y referencias)

| Archivo | Path | Que cambia | Por que |
|---------|------|-----------|---------|
| **Landing virtualizacion** | `src/public/virtualizacion.html` | Textos de la card M1 (lineas 241-248), descripcion de la Calculadora SCT en seccion herramientas (lineas 322-344), aclaracion SCT vs Planificador (lineas 468-481) | La landing describe M1 como "validar" y la calculadora como "verificar coherencia"; ambos cambian a "construir estructura crediticia" |
| **Fundamentos** | `src/public/virtualizacion-fundamentos.html` | Seccion sobre M1, explicacion de la formula, referencias a la calculadora como instrumento de verificacion | Coherencia: los fundamentos deben explicar el nuevo flujo compositivo desde competencias |
| **Planificador** | `src/public/virtualizacion-planificador.html` | Paso 1 del wizard (recibe SCT como dato de entrada). Debe recibir el "sobre presupuestario" de M1 en vez de un numero suelto | M3 consume el output de M1; si M1 cambia radicalmente, el input de M3 tambien cambia |
| **Bibliografia** | `docs/bibliografia-virtualizacion.md` | Agregar referencias: Anderson & Krathwohl (2001) taxonomia revisada, Webb (2002) DOK, Laurillard (2012) tipos de aprendizaje, Biggs (2003) alineamiento constructivo | Nuevas bases teoricas del motor interno |
| **QA preventivo** | `src/public/virtualizacion-qa.html` | Linea 342: referencia a "coherencia con creditos SCT declarados" necesita ajustarse a "coherencia con sobre presupuestario de M1" | El QA verifica contra el output de M1 |
| **Asistente IA** | `src/public/virtualizacion-asistente.html` | System prompt o contexto del chatbot necesita reflejar el nuevo flujo de M1 | El asistente responde preguntas sobre el proceso; debe conocer el nuevo M1 |
| **Memoria del proyecto** | `~/.claude/projects/-Users-coordinacion/memory/project_calculadora_sct.md` | Actualizar estado: ya no "NECESITA REDISENO COMPLETO" sino "EN REDISENO" con direccion definida | Memoria para sesiones futuras |
| **SPEC.md** | `SPEC.md` | Agregar nueva fase o sub-fase para el rediseno de la calculadora SCT | Registro formal del trabajo |

### 1.3 Archivos con cambios MENORES (ajustes puntuales)

| Archivo | Path | Que cambia | Por que |
|---------|------|-----------|---------|
| **Demo curso** | `src/public/demo-curso.html` | Meta description menciona "3 SCT, 81 hrs" — podria necesitar actualizacion si el demo se regenera con el nuevo flujo | Coherencia |
| **Sitemap** | `src/public/sitemap.xml` | Actualizar `lastmod` de `/virtualizacion/sct` | SEO |
| **Guiones audio** | `docs/guiones-audio-virtualizacion.md` | El guion del narrador de la calculadora describe el flujo actual (verificar horas) | El audio narrator referencia el flujo viejo |
| **Audio** | `src/public/audio/calculadora-sct.mp3` | Regenerar audio una vez actualizado el guion | Coherencia audio-texto |

---

## 2. Textos en la UI que cambian

### 2.1 Cambios en `virtualizacion-sct.html`

#### Hero (lineas 126-158)

| Elemento | Texto actual | Texto propuesto | Linea |
|----------|-------------|----------------|-------|
| `<title>` | `Calculadora SCT — Carga Estudiantil Virtual \| UMCE` | `Calculadora SCT — Estructura Crediticia Virtual \| UMCE` | 6 |
| `<meta description>` | `Calcula y valida los creditos SCT de tu curso virtual` | `Construye la estructura crediticia de tu curso virtual desde las competencias` | 7 |
| Subtitulo hero | `Momento 1 del flujo — Antes de la resolucion exenta` | Sin cambio (sigue siendo M1) | 138 |
| `<h1>` | `Calculadora SCT` | `Calculadora SCT` (sin cambio, el nombre se mantiene) | 139 |
| **Descripcion hero** | `Verifica que los creditos y las horas de tu curso sean coherentes, siguiendo la Guia de la UGCI. Necesitas una estimacion de las horas semanales de tu curso y los creditos declarados (o estimados).` | `Construye la estructura crediticia de tu curso desde las competencias del perfil de egreso. La herramienta analiza los verbos de desempeno, estima la carga cognitiva y genera la distribucion de horas y creditos SCT.` | 140 |
| Badge usuario | `Coordinador de programa, UGCI` | `Coordinador de programa, UGCI, Disenador Instruccional` (se agrega DI porque ahora es herramienta de construccion) | 144 |
| Badge output | `Produce: Ficha de validacion SCT para el PAC` | `Produce: Malla crediticia + sobre presupuestario para M3` | 148 |
| Texto inferior | `Si ya tienes los creditos aprobados y necesitas disenar actividades semana a semana, usa el Planificador Curricular.` | `Una vez construida la estructura crediticia, el sobre presupuestario alimenta directamente el Planificador Curricular (M3).` | 151 |

#### Progress Bar / Steps (lineas 167-185)

| Elemento | Texto actual | Texto propuesto | Linea |
|----------|-------------|----------------|-------|
| Step 1 label | `Tu curso` | `Programa y competencias` | 179 |
| Step 2 label | `Calculo SCT` | `Analisis cognitivo` | 180 |
| Step 3 label | `Presentacion` | `Malla crediticia` | 181 |
| Step 4 label | `Verificacion` | `Validacion y sobre` | 182 |

#### Etapa 1 — Explain box (lineas 260-285)

| Elemento | Texto actual | Texto propuesto |
|----------|-------------|----------------|
| Titulo explain | `Que vamos a hacer?` | `Que vamos a construir?` |
| Texto explain | `Vamos a verificar que las horas de trabajo de tu curso sean coherentes con los creditos SCT declarados` | `Vamos a construir la estructura crediticia de tu actividad curricular desde las competencias del perfil de egreso. El sistema analiza los verbos de desempeno, determina el nivel cognitivo y estima las horas necesarias para cada tipo de actividad.` |
| Contexto metodologico | Explica HS, HAs, HAut como inputs directos | Explica: se ingresa tipo de programa, competencias con ACs, tributacion al perfil. El sistema analiza verbos (Bloom como interfaz) y aplica DOK + dimension del conocimiento internamente para estimar horas via Laurillard |

#### Etapa 1 — Inputs (lineas 287-428)

La seccion completa de inputs cambia radicalmente:

**INPUTS ACTUALES (se eliminan o se mueven):**
- Nombre del curso (SE PRESERVA)
- Codigo, Programa, Semestre (SE PRESERVAN)
- Perfil de estudiantes: pregrado/postgrado/continua (SE PRESERVA pero con logica diferenciada)
- Formato: semestral/modulo/bloque/CUECH (SE PRESERVA)
- Actividades concurrentes (SE PRESERVA)
- HS sincronicas (hrs/sem) — **SE ELIMINA como input directo**
- HAs asincronicas (hrs/sem) — **SE ELIMINA como input directo**
- HAut autonomo (hrs/sem) — **SE ELIMINA como input directo**
- Semanas (NS) — SE PRESERVA
- Creditos SCT declarados — **CAMBIA: ya no es comparacion, es output**

**INPUTS NUEVOS (se agregan):**
- Tipo de programa: pregrado / postgrado / educacion continua (unificar con perfil existente)
- Modalidad: presencial / hibrido / e-learning / blended
- Competencias del perfil de egreso (textarea o lista editable):
  - Cada competencia con sus Aprendizajes de Curso (ACs)
  - Cada AC con verbo de desempeno visible
- Matriz de tributacion: que competencia tributa a que dimension del perfil
- Estructura semestral: numero de nucleos/unidades, semanas por nucleo

#### Etapa 2 — Calculo (lineas 484-620)

**ACTUAL:** Muestra formula `SCT = ((HS + HAs + HAut) x NS) / 27`, donut de distribucion, semaforo.

**NUEVO:** Reemplazar por:
- Tabla de analisis por AC: verbo detectado, nivel Bloom (interfaz visible), DOK interno, dimension conocimiento, tipo Laurillard asignado, horas estimadas por tipo (sincronicas, asincronicas, autonomas)
- Suma acumulada por nucleo
- La formula final sigue siendo `SCT = ceil(total_horas / 27)` pero las horas se derivan del analisis, no se ingresan directamente
- Donut SE PRESERVA (muestra distribucion HS/HAs/HAut resultante)
- Semaforo SE PRESERVA (verifica carga semanal)

#### Etapa 3 — Presentacion (lineas 623-710)

**ACTUAL:** Informe imprimible con datos del curso, resultado SCT, tabla de trazabilidad, marco normativo.

**NUEVO:**
- SE PRESERVA el formato imprimible
- SE PRESERVA el marco normativo
- La tabla de trazabilidad cambia: en vez de "HS = dato declarado", muestra "AC 1.1 → verbo 'analizar' → Bloom nivel 4 → DOK 3 → Laurillard 'discursivo' → 2h sincronica + 1h asincronica"
- Agregar **doble formato de salida**: formato UGCI (HP/HA compatible con la guia) + formato extendido (HS/HAs/HAut con justificacion pedagogica)
- Agregar **balance semestral**: visualizacion de carga por nucleo/semana

#### Etapa 4 — Verificacion (lineas 713-763)

**ACTUAL:** 3 checks duros (carga semanal, carga maxima, proporcion autonomo) + 1 orientacion por perfil.

**NUEVO:**
- SE PRESERVAN los 3 checks duros
- SE PRESERVA la orientacion por perfil (pero con logica diferenciada, no solo umbrales)
- AGREGAR: verificacion de coherencia entre nivel cognitivo (DOK) y distribucion de horas
- AGREGAR: verificacion de balance entre nucleos (no debe haber un nucleo con 80% de la carga)
- AGREGAR: generacion del "sobre presupuestario" para M3

### 2.2 Cambios en `virtualizacion.html` (landing)

| Elemento | Texto actual | Texto propuesto | Linea |
|----------|-------------|----------------|-------|
| M1 card titulo | `Definir creditos y horas` | `Construir estructura crediticia` | 243 |
| M1 card descripcion | `Se validan los creditos SCT y la distribucion de horas con criterio tecnico, antes de la resolucion exenta.` | `Se construye la estructura de creditos y horas desde las competencias del perfil de egreso, con analisis del nivel cognitivo de cada AC.` | 244 |
| Calculadora card | `Verifica que los creditos y las horas de tu curso sean coherentes antes de presentar la resolucion exenta a la UGCI.` | `Construye la estructura crediticia de tu curso desde las competencias. Analiza verbos de desempeno, estima carga cognitiva y genera la malla de creditos para la resolucion exenta.` | 333 |
| Calculadora badge output | `Produce: Ficha de validacion SCT para adjuntar al PAC` | `Produce: Malla crediticia + sobre presupuestario para el PIAC` | 336 |
| Aclaracion SCT vs Planificador - lado izq | `Se usa antes de disenar el curso. Responde: "Las horas declaradas en la resolucion son coherentes con los creditos?"` | `Se usa antes de disenar el curso. Responde: "Cuantos creditos necesita este curso segun sus competencias y ACs?" Construye la estructura desde cero.` | 474 |

---

## 3. Logica JS que cambia

### 3.1 Funciones que se ELIMINAN o se reescriben completamente

| Funcion | Lineas | Que hace hoy | Que le pasa |
|---------|--------|-------------|------------|
| `bindInputs()` | 928-963 | Escucha cambios en HS, HAs, HAut, NS, sctDeclarados, perfil, formato | **REESCRIBIR**: Escucha cambios en competencias, ACs, verbos, perfil, formato, semanas. Los campos HS/HAs/HAut dejan de ser inputs del usuario |
| `updatePreview()` | 969-1007 | Calcula `total = (hs + has + haut) * ns`, `sct = ceil(total/27)`, actualiza stats cards | **REESCRIBIR**: El preview ahora muestra resultado del analisis de verbos/DOK/Laurillard, no inputs directos |
| `updateOrientacionPanel()` | 1009-1071 | Genera orientacion textual basada en perfil + formato + actividades concurrentes + HS | **REESCRIBIR**: La orientacion ahora se basa en el analisis cognitivo, no en HS directas |
| `updateLiveVerdict()` | 1073-1130 | Compara SCT calculados vs declarados, verifica carga semanal | **REESCRIBIR**: Ya no compara calculados vs declarados (el "declarado" es el output, no input). Verifica coherencia interna del analisis |
| `runCalc()` | 1135-1181 | `total = (hs+has+haut)*ns; sct = ceil(total/27)` + renderiza donut, semaforo, barras | **REESCRIBIR**: El calculo ahora parte de ACs analizadas, no de horas directas. Donut y semaforo se preservan como visualizaciones pero alimentados por datos distintos |
| `updatePresentation()` | 1282-1318 | Genera tabla de trazabilidad con HS/HAs/HAut como "dato declarado" | **REESCRIBIR**: La trazabilidad ahora muestra AC → verbo → Bloom → DOK → Laurillard → horas |
| `runVerification()` | 1323-1443 | 3 checks duros + 1 orientacion | **EXTENDER**: Agregar checks de coherencia DOK-horas y balance entre nucleos |

### 3.2 Funciones que se PRESERVAN (con ajustes menores de parametros)

| Funcion | Lineas | Que hace | Ajuste necesario |
|---------|--------|---------|-----------------|
| `renderDonut()` | 1183-1227 | Dibuja SVG donut con 3 segmentos (HS/HAs/HAut) | Preservar. Los datos vienen de otro lugar pero la visualizacion es la misma |
| `renderSemaforo()` | 1229-1258 | Semaforo verde/amarillo/rojo segun carga semanal | Preservar sin cambios. Umbrales (10/12 hrs) se mantienen |
| `renderWeeklyBars()` | 1260-1277 | Barras de carga por semana | Preservar, pero ahora las barras pueden variar por semana (diferente carga por nucleo) |
| `goToStep()` | 1448-1483 | Navegacion del wizard | Preservar con ajustes minimos (labels nuevos) |
| `resetCalc()` | 1488-1512 | Reset de formulario | Reescribir para limpiar los nuevos campos |

### 3.3 Logica NUEVA que se agrega

| Funcion nueva | Proposito |
|---------------|----------|
| `analyzeVerbs(competencias)` | Recibe lista de ACs con sus verbos. Clasifica cada verbo en nivel Bloom (1-6). Bloom es la interfaz visible para el usuario |
| `mapDOK(bloomLevel, knowledgeDimension)` | Mapea nivel Bloom + dimension del conocimiento (factual/conceptual/procedimental/metacognitivo) a nivel DOK (1-4). DOK es el motor interno |
| `mapLaurillard(dokLevel, modality)` | Asigna tipo de aprendizaje Laurillard (adquisicion, investigacion, discusion, practica, colaboracion, produccion) segun DOK y modalidad |
| `estimateHours(laurillardType, profile, format)` | Estima horas por tipo (sincronico/asincronico/autonomo) segun tipo Laurillard, perfil de estudiante y formato. Usa tablas de referencia (Penn State, Wake Forest, etc.) |
| `buildCreditStructure(nucleos)` | Agrega horas por nucleo, calcula SCT por nucleo y totales, genera malla crediticia |
| `generateEnvelope(structure)` | Genera el "sobre presupuestario" para M3: JSON con horas por tipo, por nucleo, con tolerancia +-10% |
| `renderCompetencyInput()` | UI para ingresar competencias con ACs editables |
| `renderAnalysisTable()` | Tabla de analisis AC por AC con todos los pasos (verbo → Bloom → DOK → Laurillard → horas) |
| `renderCreditMatrix()` | Malla crediticia visual: nucleos x semanas x tipo de hora |

### 3.4 Datos de referencia nuevos (tablas/constantes)

```javascript
// Tabla de verbos → nivel Bloom (interfaz visible)
var BLOOM_VERBS = {
  1: ['recordar', 'listar', 'definir', 'nombrar', 'identificar', ...],
  2: ['explicar', 'describir', 'interpretar', 'clasificar', ...],
  3: ['aplicar', 'usar', 'ejecutar', 'implementar', ...],
  4: ['analizar', 'comparar', 'diferenciar', 'organizar', ...],
  5: ['evaluar', 'juzgar', 'criticar', 'justificar', ...],
  6: ['crear', 'disenar', 'producir', 'formular', ...]
};

// Tabla DOK x dimension conocimiento (motor interno)
var DOK_MATRIX = {
  // [bloomLevel][knowledgeDimension] → DOK level
  // factual=1, conceptual=2, procedimental=3, metacognitivo=4
};

// Tabla Laurillard → distribucion de horas por tipo
var LAURILLARD_HOURS = {
  adquisicion:   { sync: 0.2, async: 0.3, auto: 0.5 },
  investigacion: { sync: 0.1, async: 0.4, auto: 0.5 },
  discusion:     { sync: 0.6, async: 0.3, auto: 0.1 },
  practica:      { sync: 0.3, async: 0.4, auto: 0.3 },
  colaboracion:  { sync: 0.4, async: 0.4, auto: 0.2 },
  produccion:    { sync: 0.1, async: 0.3, auto: 0.6 }
};

// Ajustes por perfil (no solo umbrales)
var PROFILE_ADJUSTMENTS = {
  pregrado:  { syncMultiplier: 1.2, asyncMultiplier: 0.9, autoMultiplier: 0.9 },
  postgrado: { syncMultiplier: 0.8, asyncMultiplier: 1.1, autoMultiplier: 1.1 },
  continua:  { syncMultiplier: 0.6, asyncMultiplier: 1.2, autoMultiplier: 1.2 }
};
```

---

## 4. Nuevas dependencias

### 4.1 La pregunta clave: puede seguir siendo 100% client-side?

**Respuesta: SI, puede seguir siendo client-side, CON CONDICIONES.**

El analisis de verbos y la clasificacion taxonomica NO requieren IA generativa. Son operaciones de lookup en tablas predefinidas:

- **Analisis de verbos → Bloom**: es un match de string contra una tabla de ~100 verbos clasificados por nivel. Client-side trivial.
- **Bloom × dimension → DOK**: es una tabla de 6×4 = 24 celdas. Client-side trivial.
- **DOK → Laurillard**: es una tabla de ~20 reglas. Client-side trivial.
- **Laurillard → horas**: multiplicacion por constantes. Client-side trivial.

**PERO** hay un escenario donde se necesitaria servidor/IA:

| Escenario | Client-side suficiente? | Requiere servidor? |
|-----------|------------------------|-------------------|
| Verbos exactos de la tabla (match directo) | Si | No |
| Verbos sinonimos o no estandar ("el estudiante sera capaz de...") | Parcial (fuzzy match) | IA mejora significativamente |
| Analisis de coherencia entre ACs y perfil de egreso | No (requiere comprension semantica) | Si |
| Sugerencias de mejora de redaccion de ACs | No | Si |

**Recomendacion**: Implementar en 2 capas:
1. **Capa base (client-side)**: lookup de verbos, calculo DOK, estimacion Laurillard, generacion de malla. Funciona offline, sin dependencias.
2. **Capa enriquecida (opcional, servidor)**: analisis semantico de verbos no estandar, sugerencias de mejora, validacion de coherencia. Usa `claude-proxy-container` existente en VPS (linea 1202 de server.js).

### 4.2 Dependencias tecnicas

| Dependencia | Tipo | Estado | Detalle |
|-------------|------|--------|---------|
| Tabla de verbos Bloom (ES) | JSON client-side | **NUEVA** | ~100 verbos en espanol clasificados por nivel 1-6. Crear archivo `sct-bloom-verbs.json` en `src/public/` |
| Tabla DOK × dimension | JSON client-side | **NUEVA** | Matriz 6×4 → nivel DOK. Crear constante en JS inline o archivo separado |
| Tabla Laurillard → horas | JSON client-side | **NUEVA** | 6 tipos × 3 distribuciones. Constante JS |
| `claude-proxy-container` | Servidor (existente) | Existente, puerto 3099 | Solo si se implementa capa enriquecida |
| `sct-data.json` | JSON client-side | Existente | Catalogo de 37 e-actividades. SE PRESERVA para M3 |

### 4.3 NO se necesita

- No se necesita base de datos nueva (la calculadora sigue siendo stateless)
- No se necesitan endpoints nuevos en server.js (a menos que se implemente la capa enriquecida)
- No se necesitan dependencias npm nuevas
- No se necesita cambiar el Dockerfile ni el deploy

---

## 5. Impacto en otros momentos

### 5.1 Impacto en virtualizacion.html (landing) — MODERADO

Cambios textuales en 4 ubicaciones especificas (detallados en seccion 2.2):
- Card del Momento 1 (lineas 241-248)
- Card de la Calculadora en seccion herramientas (lineas 322-344)
- Aclaracion SCT vs Planificador (lineas 468-481)
- NO cambia la estructura de los 5 momentos ni la grilla visual

### 5.2 Impacto en el Planificador (M3) — SIGNIFICATIVO

El planificador (`virtualizacion-planificador.html`) actualmente pide en su Paso 1:
- SCT del curso (numero)
- Semanas
- Perfil de estudiante

Con el rediseno, el Paso 1 del planificador debe:
- **Recibir el "sobre presupuestario"** de M1: no solo el numero de SCT, sino la distribucion de horas por tipo (HS/HAs/HAut), por nucleo, y el tipo Laurillard dominante de cada nucleo
- **Verificar tolerancia +-10%**: las e-actividades seleccionadas en M3 deben sumar dentro del +-10% de las horas estimadas por M1
- **Laurillard como puente**: M1 clasifica el tipo de aprendizaje dominante por nucleo; M3 selecciona e-actividades coherentes con ese tipo

**El catalogo de 37 e-actividades se mantiene en M3.** Lo que cambia es que cada e-actividad ya tiene un tipo Laurillard asignado (esto ya existe parcialmente en `sct-data.json`), y el planificador puede priorizarlas segun la clasificacion que viene de M1.

### 5.3 Impacto en QA (M4) — MENOR

El sistema QA (`virtualizacion-qa.html`, linea 342) referencia "coherencia con creditos SCT declarados". Esto se ajusta a "coherencia con sobre presupuestario de M1", pero la logica es la misma: verificar que lo implementado sea coherente con lo planificado.

### 5.4 Impacto en server.js — NINGUNO (si se mantiene client-side)

Si la calculadora sigue siendo client-side, server.js no se toca. Si se implementa la capa enriquecida, se agrega un endpoint simple:

```javascript
// POST /api/virtualizacion/analyze-verbs (futuro, opcional)
// Body: { verbs: ["analizar", "disenar", "evaluar"] }
// Response: { classifications: [{verb: "analizar", bloom: 4, confidence: 0.95}] }
```

### 5.5 Impacto en Fundamentos (referencia) — MODERADO

`virtualizacion-fundamentos.html` explica el SCT, la formula, los 3 perfiles. Necesita:
- Agregar seccion sobre Bloom como interfaz / DOK como motor
- Explicar Laurillard y su rol de puente M1→M3
- Actualizar la explicacion de M1 (de "verificar" a "construir")

### 5.6 Impacto en asistente IA — MODERADO

`virtualizacion-asistente.html` usa knowledge base como system prompt. Al actualizar la KB, el asistente automaticamente responde con el nuevo modelo. Pero hay que verificar que la KB cubra:
- FAQ: "que pasa si mi verbo no esta en la tabla?"
- FAQ: "puedo ingresar horas directamente como antes?"
- FAQ: "que es el sobre presupuestario?"

---

## 6. Impacto en docs/

### 6.1 Documentos que se ACTUALIZAN

| Documento | Path | Cambio |
|-----------|------|--------|
| `knowledge-base-virtualizacion.md` | `docs/knowledge-base-virtualizacion.md` | Agregar secciones 2.o (Bloom/DOK), 2.p (Laurillard), 2.q (sobre presupuestario). Actualizar 2.d (formula), 2.h (perfiles) |
| `estado-sct-modularizacion-abril2026.md` | `docs/estado-sct-modularizacion-abril2026.md` | Actualizar secciones 4, 5.1, 8 para reflejar nuevo paradigma constructivo |
| `bibliografia-virtualizacion.md` | `docs/bibliografia-virtualizacion.md` | Agregar 4+ referencias nuevas (Anderson & Krathwohl, Webb, Laurillard, Biggs) |
| `guiones-audio-virtualizacion.md` | `docs/guiones-audio-virtualizacion.md` | Reescribir guion del narrador de la calculadora |

### 6.2 Documentos que se CREAN

| Documento | Path propuesto | Contenido |
|-----------|---------------|-----------|
| **Este documento** | `docs/impacto-rediseno-calculadora-sct.md` | Analisis de impacto (este archivo) |
| **Tablas de referencia** | `docs/tablas-bloom-dok-laurillard.md` | Documentacion de las tablas usadas por el motor interno: verbos Bloom en espanol, matriz DOK, mapeo Laurillard, distribucion de horas. Para referencia humana y validacion UGCI |

### 6.3 Documentos que NO cambian

- `ARQUITECTURA-UMCE-ONLINE.md` — arquitectura general no cambia
- `VISION.md` — vision del proyecto no cambia
- `investigacion-microcredenciales-ob3-abril2026.md` — otro alcance
- `analisis-ssic-umce.md` — otro alcance
- `mesa2-aporte-udfv.md` — otra mesa

---

## 7. Flujo de datos M1 → M3

### 7.1 Situacion actual (sin conexion)

```
M1 (calculadora SCT)              M3 (planificador)
   Usuario ingresa HS/HAs/HAut       Usuario ingresa SCT manualmente
   → calcula SCT                     → selecciona e-actividades
   → genera PDF                      → verifica carga
   
   SIN CONEXION TECNICA ENTRE AMBOS
```

El usuario ve un numero en M1, lo memoriza, y lo escribe a mano en M3. No hay verificacion cruzada.

### 7.2 Situacion propuesta (con "sobre presupuestario")

```
M1 (calculadora SCT)                          M3 (planificador)
  Usuario ingresa competencias + ACs          Recibe "sobre presupuestario"
  → analiza verbos (Bloom/DOK)                → carga horas por nucleo
  → estima horas (Laurillard)                 → sugiere e-actividades por tipo Laurillard
  → genera malla crediticia                   → verifica tolerancia +-10%
  → produce "sobre presupuestario"            → alerta si se excede o queda corto
          |                                          ^
          v                                          |
     localStorage / URL params / JSON export --------+
```

### 7.3 Implementacion tecnica del paso M1 → M3

**Opcion A: localStorage (recomendada para MVP)**
```javascript
// En M1, al generar el sobre:
var sobre = {
  version: 1,
  timestamp: Date.now(),
  courseName: 'Metodologia Cualitativa',
  sctTotal: 4,
  semanas: 18,
  perfil: 'postgrado',
  formato: 'semestral',
  nucleos: [
    {
      numero: 1,
      nombre: 'Fundamentos epistemologicos',
      semanas: [1, 5],
      laurillardDominante: 'adquisicion',
      horas: { sync: 7.5, async: 10, auto: 12.5 },
      sct: 1.1
    },
    // ...
  ],
  totales: { sync: 27, async: 36, auto: 18, total: 81 },
  tolerancia: 0.10  // +-10%
};
localStorage.setItem('sct_sobre_presupuestario', JSON.stringify(sobre));
```

```javascript
// En M3, al iniciar:
var sobre = JSON.parse(localStorage.getItem('sct_sobre_presupuestario'));
if (sobre) {
  // Pre-llenar SCT, semanas, perfil
  // Mostrar presupuesto por nucleo
  // Activar verificacion de tolerancia
}
```

**Opcion B: URL params (para compartir entre usuarios)**
```
/virtualizacion/planificador?sobre=base64encodedJSON
```

**Opcion C: Exportar/importar JSON (mas robusto)**
- M1 genera un archivo `.json` descargable
- M3 tiene boton "Cargar sobre presupuestario" que importa el archivo
- Ventaja: funciona entre dispositivos, se puede adjuntar al PAC

**Recomendacion**: Implementar las 3 opciones en orden:
1. localStorage (inmediato, sin friccion)
2. URL params (para links directos)
3. JSON export/import (para documentacion formal)

---

## 8. Riesgos

### 8.1 Riesgos CRITICOS (requieren mitigacion antes de implementar)

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| **UGCI no valida las tablas DOK/Laurillard** — la UGCI usa la formula HP/HA simple y puede no reconocer el framework DOK/Laurillard como base del calculo | Alta | Alto | Presentar las tablas a Miguel Angel Pardo ANTES de implementar. El output final debe ser compatible con formato UGCI (HP/HA), con el analisis DOK/Laurillard como justificacion interna |
| **Verbos en espanol ambiguos** — muchos ACs en la UMCE usan verbos no estandar ("sera capaz de", "manejara", "comprendera") que no mapean directamente a Bloom | Alta | Medio | Implementar fuzzy matching + opcion manual de clasificacion. La tabla debe incluir variantes coloquiales. Opcion "clasificar manualmente" siempre disponible |
| **Doble formato confunde al usuario** — presentar formato UGCI (HP/HA) + formato extendido (HS/HAs/HAut) simultaneamente puede confundir a coordinadores no tecnicos | Media | Medio | Formato UGCI como default (pestana principal). Formato extendido como seccion expandible "Ver detalle para DI". El informe imprimible usa formato UGCI |

### 8.2 Riesgos MODERADOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| **Perdida del modo simple** — coordinadores que solo quieren verificar "3 SCT con 4.5 hrs/semana" pierden acceso a una herramienta rapida | Media | Medio | Mantener un "modo rapido" que permita ingresar horas directamente (como hoy) con un switch "Ya tengo las horas estimadas". La ruta completa desde competencias es la principal, pero no la unica |
| **Complejidad excesiva del wizard** — pasar de 4 pasos a potencialmente 6+ puede desanimar al usuario | Media | Medio | Mantener en 4 pasos, pero con contenido mas rico en cada paso. Step 1 = programa + competencias. Step 2 = analisis + horas. Step 3 = malla. Step 4 = validacion + sobre |
| **Inconsistencia entre M1 nuevo y M3 viejo** — si M1 se redisena pero M3 no se actualiza para recibir el sobre, hay un gap funcional | Alta | Medio | Implementar M1 nuevo + adaptacion minima de M3 (recibir sobre via localStorage) en la misma iteracion. No deployar M1 nuevo sin que M3 pueda consumirlo |
| **Tablas de horas no calibradas** — las estimaciones Laurillard → horas son teoricas y no validadas con datos UMCE reales | Media | Medio | Usar rangos (min-max) en vez de valores fijos. Calibrar iterativamente con datos de la Planilla Master (interna) y feedback de DIs |

### 8.3 Riesgos MENORES

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| Audio narrator desactualizado | Alta | Bajo | Regenerar audio despues del rediseno. Desactivar temporalmente durante la transicion |
| Links rotos desde otros documentos | Baja | Bajo | La URL `/virtualizacion/sct` no cambia. Solo cambia el contenido |
| Performance client-side | Baja | Bajo | Las operaciones son lookup en tablas pequenas (<1KB). No hay riesgo de performance |

### 8.4 Validaciones necesarias con UGCI ANTES de implementar

1. **Las tablas de verbos Bloom en espanol** — usar la misma tabla que aparece en la Guia UGCI o en los PAC existentes de la UMCE
2. **El formato de salida HP/HA** — verificar que el output sea directamente usable en las resoluciones exentas
3. **El concepto de "sobre presupuestario"** — que la UGCI acepte que M1 produce un documento tecnico que M3 consume, no solo un numero de SCT
4. **La tolerancia +-10%** — verificar que este margen sea aceptable para la UGCI como criterio de coherencia entre M1 y M3
5. **El uso de DOK como motor interno** — puede que la UGCI solo quiera Bloom. Si es asi, DOK se mantiene como logica interna invisible y Bloom queda como unica capa visible

---

## 9. Resumen ejecutivo de cambios

### Lo que CAMBIA

- **Paradigma**: de verificacion (input: horas → output: SCT validos o no) a construccion (input: competencias → output: malla crediticia)
- **Inputs principales**: de HS/HAs/HAut a competencias + ACs + verbos + tributacion
- **Motor de calculo**: de formula directa a pipeline Bloom → DOK → Laurillard → horas → SCT
- **Output**: de "ficha de validacion" a "sobre presupuestario" consumible por M3
- **Etapa 1 del wizard**: de "ingresa tus horas" a "ingresa tus competencias"
- **Etapa 2**: de "aplicamos la formula" a "analizamos nivel cognitivo y estimamos horas"
- **Etapa 3**: de "informe simple" a "malla crediticia doble formato"
- **Etapa 4**: de "3 checks" a "checks + sobre presupuestario"
- **Perfiles**: de umbrales de alerta a logica diferenciada (multiplicadores por tipo Laurillard)

### Lo que se PRESERVA

- CUECH Subete (2 SCT, 16 semanas) como formato disponible
- Redondeo ceil (criterio UGCI)
- Proporcion autonomo 25-40% como check
- Informe imprimible (formato actualizado pero funcionalidad preservada)
- Semaforos de carga semanal (umbrales 10/12 hrs)
- Compatibilidad formato UGCI (HP/HA) como output principal
- Nombre "Calculadora SCT" (no cambia el branding)
- URL `/virtualizacion/sct` (no cambia la ruta)
- Stack client-side (no requiere backend para funcionalidad base)
- Catalogo de 37 e-actividades (se mantiene en M3)

### Estimacion de esfuerzo

| Componente | Estimacion |
|-----------|-----------|
| Rediseno UI (HTML/CSS) de `virtualizacion-sct.html` | 1 sesion larga |
| Reescritura logica JS (motor Bloom/DOK/Laurillard) | 1 sesion larga |
| Tablas de verbos Bloom en espanol | 1 sesion corta (investigacion + compilacion) |
| Actualizacion de textos en landing + fundamentos | 1 sesion corta |
| Adaptacion minima de planificador (recibir sobre) | 1 sesion corta |
| Actualizacion de docs (KB, estado, bibliografia) | 1 sesion corta |
| **Total estimado** | 4-5 sesiones de trabajo |

---

*Documento de trabajo interno. No requiere validacion UGCI por si mismo; lo que requiere validacion son las tablas y el formato de salida que se usaran en la implementacion.*
