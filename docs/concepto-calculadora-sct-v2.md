> **Nota (13-abr-2026):** Este documento corresponde a la propuesta v2, que fue revisada críticamente y evolucionó a la propuesta v3 consolidada. La v3 incorpora tres modos coexistentes (A: curso individual, B: semestre, C: estimación desde competencias) y resuelve los problemas de scope creep, ratios sin fundamentar, y contradicciones identificados en la auditoría. Ver: `propuesta-calculadora-sct-v3-consolidada.md`.

# Hacia una estimacion prospectiva de la carga de trabajo estudiantil: rediseno conceptual de la Calculadora SCT-Chile para el ecosistema UMCE.online

**Version**: 1.0  
**Fecha**: 13 de abril de 2026  
**Autor**: David Reyes Jofre, Coordinador UDFV, Universidad Metropolitana de Ciencias de la Educacion  
**Proyecto**: UMCE.online — Momento 1 (Definicion de creditos y horas)  
**Estado**: Documento conceptual para desarrollo e investigacion

---

## 1. Resumen ejecutivo

La normativa chilena vigente establece que 1 credito SCT equivale a 27 horas cronologicas de trabajo estudiantil (Resolucion Exenta N. 002140, UMCE, 2011). El Manual SCT-Chile del CRUCH (2015) y la Guia de Calculo SCT-Chile UMCE de la UGCI definen un procedimiento de cuatro etapas para estimar esa carga, cuya primera etapa depende de encuestas a estudiantes y docentes que hayan cursado o dictado la actividad curricular. Este requisito hace inviable la aplicacion del procedimiento a programas nuevos, redisenos curriculares o actividades curriculares sin precedente, situaciones cada vez mas frecuentes en el contexto de la virtualizacion universitaria.

El presente documento propone un metodo prospectivo de estimacion de carga que opera sin datos historicos. La propuesta articula tres marcos teoricos complementarios: la Depth of Knowledge de Webb (1997, 2002) como eje de profundidad cognitiva, la taxonomia revisada de Anderson y Krathwohl (2001) como dimension del conocimiento, y los seis tipos de aprendizaje de Laurillard (2012) como clasificador de actividad. Estos marcos alimentan un motor de calculo calibrado con tiempos empíricos del Rice University Course Workload Estimator (Barre y Esarey, 2016-2020) y validado conceptualmente por el estudio CTAWC (Boring y Blackman, 2021), que confirma la relacion entre nivel taxonomico y carga cognitiva. El resultado es un sistema que construye la malla crediticia desde las competencias del perfil de egreso, manteniendo plena compatibilidad con la formula institucional UMCE y con los formatos UGCI.

El documento distingue con rigor entre evidencia empirica y propuesta heuristica. Los rangos de horas que el sistema produce son estimaciones fundamentadas, no estandares validados.

---

## 2. Diagnostico: el vacio normativo y academico

### 2.1. El problema

Los coordinadores de programas nuevos en la UMCE enfrentan una paradoja operativa: la normativa exige que los creditos SCT reflejen la carga real de trabajo estudiantil, pero el procedimiento oficial para estimar esa carga requiere datos que solo existen despues de que el programa ha sido implementado.

La Guia de Calculo SCT-Chile UMCE (UGCI, borrador 2026) establece cuatro etapas:

1. **Estimacion de la carga de trabajo** mediante encuestas a estudiantes y docentes (instrumentos en Anexo 2).
2. **Calculo SCT** mediante la formula institucional.
3. **Presentacion del valor** con registro del resultado exacto y redondeado.
4. **Verificacion de consistencia** a nivel de actividad, semestre, ano y trayectoria formativa.

La Etapa 1 presupone la existencia de cohortes previas. Para programas nuevos, la guia no ofrece un procedimiento alternativo.

### 2.2. Lo que dice la norma sobre la alternativa

El Manual SCT-Chile (CRUCH, 3.a ed., 2015) aborda este caso en su FAQ 5 (p. 109): para actividades curriculares sin datos historicos, es posible estimar la carga a partir de la "experiencia institucional" y la "estrategia pedagogica". Sin embargo, no formaliza ningun metodo para hacerlo. En la pagina 61, el Manual reconoce que "el tipo de resultado de aprendizaje determina" la proporcion entre horas presenciales y autonomas, pero no operacionaliza esa relacion.

### 2.3. Evidencia del vacio en la practica institucional

Tres fuentes documentales confirman que el vacio no es teorico sino operativo:

- **Resolucion Exenta 2025-00-1542** (Magister en Educacion Intercultural, UMCE): programa nuevo con horas declaradas por actividad curricular sin base documentada de estimacion. Las horas aparecen en la resolucion pero no se acompanan de la justificacion metodologica que la propia guia UGCI requiere.

- **Plan de Seguimiento SCT** (Excel UGCI): documento operativo de la UGCI con indicadores de seguimiento exclusivamente ex-post. Confirma que la UGCI no dispone de un instrumento prospectivo.

- **CNA, Criterios para programas a distancia** (Diario Oficial N. 41.925, 2017): exige "reglamentacion de carga academica" y "modelo instruccional" coherentes, pero no provee metodologia de diseno de carga para la modalidad virtual.

### 2.4. Revision de la literatura

Una busqueda sistematica en ERIC, Scopus, WoS, Dialnet y SciELO (2010-2026) no identifico ningun modelo validado que conecte formalmente el nivel cognitivo del resultado de aprendizaje con horas de trabajo estudiantil. Existen herramientas de estimacion de carga (Rice University Course Workload Estimator, Penn State HIA Estimator, Massey University Credit Calculator), pero todas operan a nivel de actividad concreta, no a nivel de competencia o resultado de aprendizaje. El vacio que este documento aborda es la conexion entre el nivel taxonomico de una competencia y el tiempo que un estudiante necesita para alcanzarla.

---

## 3. Marco teorico: taxonomias, frameworks y fundamentacion

La propuesta articula seis marcos teoricos en dos capas funcionales: una capa de clasificacion cognitiva (que determina la complejidad de lo que se pide al estudiante) y una capa de estimacion temporal (que traduce esa complejidad en horas).

### 3.1. Capa de clasificacion cognitiva

**Webb's Depth of Knowledge (DOK).** Webb (1997, 2002) propone cuatro niveles de profundidad cognitiva: (1) recuerdo y reproduccion, (2) aplicacion de habilidades y conceptos, (3) pensamiento estrategico, y (4) pensamiento extendido. A diferencia de la taxonomia de Bloom, DOK incorpora una dimension temporal implicita: DOK 4 presupone trabajo sostenido durante semanas, no minutos. Esta propiedad hace de DOK un eje natural para la estimacion de carga. En el sistema propuesto, DOK opera como motor de calculo interno.

**Dimension del conocimiento (Anderson y Krathwohl, 2001).** La taxonomia revisada de Bloom anade una segunda dimension al proceso cognitivo: el tipo de conocimiento involucrado (factual, conceptual, procedimental o metacognitivo). El cruce de DOK (4 niveles) con la dimension de conocimiento (4 tipos) genera una matriz 4x4 de 16 celdas que permite discriminar con mayor precision la complejidad de una competencia. Por ejemplo, "aplicar un procedimiento" (DOK 2, conocimiento procedimental) demanda tiempos distintos que "aplicar un concepto a un caso nuevo" (DOK 2, conocimiento conceptual).

**Taxonomia de Bloom revisada como interfaz.** La taxonomia de Bloom (Anderson y Krathwohl, 2001) es la lingua franca del diseno curricular en Chile: los PAC, las resoluciones exentas y las guias UGCI utilizan verbos de Bloom para formular resultados de aprendizaje. El sistema propuesto presenta al usuario la clasificacion en terminos de Bloom (recordar, comprender, aplicar, analizar, evaluar, crear) y traduce internamente esa clasificacion a la matriz DOK x dimension de conocimiento. El coordinador de programa trabaja con un vocabulario que ya conoce; el motor de calculo opera con una taxonomia de mayor poder discriminante.

### 3.2. Capa de estimacion temporal

**Tipos de aprendizaje de Laurillard (2012).** Diana Laurillard identifica seis tipos de aprendizaje: adquisicion (acquisition), investigacion (inquiry), practica (practice), produccion (production), discusion (discussion) y colaboracion (collaboration). Cada tipo implica actividades con demandas temporales distintas: producir un artefacto demanda mas horas que adquirir un contenido del mismo nivel cognitivo. En el sistema propuesto, Laurillard opera en dos niveles: como descriptor abstracto en M1 (el perfil de aprendizaje dominante de cada actividad curricular) y como clasificador de actividad concreta en M3 (el planificador instruccional). Esta doble funcion convierte a Laurillard en el puente de coherencia vertical entre momentos.

**Rice University Course Workload Estimator (Barre y Esarey, 2016-2020).** El estimador desarrollado por Elizabeth Barre en la Rice University provee tiempos base por tipo de actividad academica (paginas de lectura por hora, tiempo de escritura por tipo de ensayo, horas de preparacion por hora de clase). Estos tiempos fueron derivados de una revision de la literatura empirica sobre carga de trabajo estudiantil. En el sistema propuesto, los tiempos del estimador Rice calibran la capa inferior del motor de calculo de manera invisible para el usuario.

**CTAWC (Boring y Blackman, 2021).** El Course Time and Workload Calculator es, hasta donde la revision de literatura permitio determinar, el unico estudio publicado que valida empiricamente la relacion entre nivel de la taxonomia de Bloom y carga cognitiva medida en tiempo. El estudio confirma que actividades formuladas en niveles superiores de Bloom (analizar, evaluar, crear) requieren significativamente mas tiempo que actividades en niveles inferiores (recordar, comprender). Este hallazgo provee la justificacion empirica para el supuesto central del sistema: que el nivel taxonomico de una competencia predice, dentro de rangos, el tiempo que demanda alcanzarla.

### 3.3. Marcos complementarios

**EADTU (2018) y UNESCO-IESALC (2020).** La European Association of Distance Teaching Universities y UNESCO fundamentan la triparticion de horas en sincronicas, asincronicas y de trabajo autonomo para la educacion virtual, superando la biparticion tradicional (horas presenciales y horas autonomas) del sistema ECTS y del Manual SCT-Chile original.

**ABC Learning Design (Young y Perovic, UCL, 2016).** El metodo ABC constituye un precedente directo de diseno rapido de cursos basado en los tipos de aprendizaje de Laurillard. Demuestra que la clasificacion Laurillard es operacionalizable en talleres de diseno con academicos no especializados, lo que valida su uso como interfaz intermedia en el sistema propuesto.

**Manual SCT-Chile (CRUCH, 2015).** Establece la restriccion fundamental del sistema: 1 SCT = 27 horas cronologicas. El metodo compositivo (estimar horas primero, derivar creditos despues) es el que adopta el sistema propuesto. La formula institucional UMCE es: `SCT = ceil((HP + HA) x NS / 27)`.

---

## 4. Propuesta: arquitectura del sistema

### 4.1. Flujo general

El sistema opera en nueve pasos secuenciales, organizados en tres fases: entrada (pasos 1-3), procesamiento (pasos 4-8) y salida (paso 9).

### 4.2. Entrada: lo que ingresa el coordinador

El coordinador de programa proporciona:

1. **Tipo de programa**: pregrado, postgrado o educacion continua. Determina el perfil de estudiante y los parametros de carga viable.
2. **Modalidad**: virtual o semipresencial. Condiciona la distribucion sincronico/asincronico/autonomo.
3. **Competencias del perfil de egreso**: texto con los verbos que describen lo que el egresado sera capaz de hacer.
4. **Actividades curriculares del programa**: listado de asignaturas o modulos.
5. **Matriz de tributacion**: que actividad curricular tributa a que competencia del perfil de egreso.
6. **Estructura temporal**: semestral (para pregrado y postgrado) o modular (para educacion continua), con indicacion de cuantos periodos y que actividades van en cada uno.

El sistema no requiere datos de cohortes previas, encuestas a estudiantes ni datos historicos de ningun tipo.

### 4.3. Procesamiento: la logica del motor

**Paso 1 — Clasificacion Bloom (visible).** El sistema analiza los verbos de las competencias y los clasifica en los seis niveles de la taxonomia revisada de Bloom. Esta clasificacion se muestra al usuario para validacion. El coordinador puede corregir la clasificacion automatica.

**Paso 2 — Traduccion a DOK x dimension de conocimiento (interno).** Cada competencia clasificada en Bloom se traduce internamente a un par (nivel DOK, tipo de conocimiento). Esta traduccion no es arbitraria: sigue reglas de mapeo documentadas (por ejemplo, "analizar" con conocimiento procedimental se traduce a DOK 3). La matriz resultante tiene mayor poder discriminante que Bloom solo.

**Paso 3 — Perfil Laurillard dominante por actividad curricular.** Para cada actividad curricular, el sistema infiere que tipos de aprendizaje Laurillard son dominantes, a partir de las competencias a las que tributa y de su nivel DOK. Una actividad que tributa a competencias DOK 4 con conocimiento metacognitivo tendra un perfil dominante de produccion y colaboracion; una que tributa a competencias DOK 1 con conocimiento factual tendra un perfil dominante de adquisicion.

**Paso 4 — Estimacion de horas totales.** El motor cruza la posicion en la matriz DOK x conocimiento con el perfil Laurillard de cada actividad curricular para producir un rango de horas totales estimadas. La calibracion de estos rangos utiliza los tiempos del Rice University Course Workload Estimator como base, ajustados por:
- Nivel DOK (multiplicador de complejidad).
- Tipo de conocimiento (el conocimiento procedimental y metacognitivo requiere mas horas de practica que el factual).
- Tipo de programa (los parametros de carga semanal viable varian por perfil de estudiante).

**Paso 5 — Distribucion en tres tipos de horas.** Las horas totales se distribuyen en sincronicas, asincronicas y de trabajo autonomo. La proporcion base sigue las orientaciones del Doc. N. 004-2020 (Direccion de Docencia, UMCE), que establece que el trabajo autonomo debe representar aproximadamente un tercio de la carga total (25-40%). La distribucion se ajusta por modalidad (virtual admite mayor asincronismo que semipresencial) y por perfil Laurillard (un perfil dominante de discusion requiere mas horas sincronicas que uno de adquisicion).

**Paso 6 — Derivacion de semanas.** El sistema propone una duracion en semanas a partir de la carga semanal viable segun el perfil de estudiante y la carga total estimada. El usuario puede ajustar la duracion.

**Paso 7 — Calculo SCT.** Aplica la formula institucional: `SCT = ceil(horas_totales / 27)`. El redondeo ceil (al entero superior) es el criterio consensuado con la UGCI.

**Paso 8 — Verificacion de balance semestral.** El sistema verifica la carga horizontal: que la suma de horas semanales de todas las actividades curriculares concurrentes en un semestre no exceda los limites del perfil de estudiante. Genera alertas de sobrecarga o desbalance cuando detecta picos.

### 4.4. Salida: lo que produce el sistema

1. **Malla crediticia completa** con fundamento tecnico por actividad curricular.
2. **Distribucion de horas por actividad curricular** en formato UGCI (HP + HA) y en formato extendido (sincronicas + asincronicas + autonomas).
3. **Carga semanal por semestre** con semafaros (verde: sostenible; amarillo: en umbral; rojo: sobrecarga).
4. **Informe imprimible** de validacion SCT para adjuntar al PAC o a la resolucion exenta.

---

## 5. Perfiles de estudiante y parametros

El sistema distingue tres perfiles con parametros diferenciados:

### 5.1. Pregrado

- Disponibilidad estimada: ~45 horas semanales de dedicacion academica total.
- Semestres de 18 semanas.
- 5 a 7 actividades curriculares concurrentes.
- Mayor proporcion de sincronismo (el estudiante de pregrado requiere mayor estructura y presencia docente).
- Carga maxima por actividad curricular: ~12 horas semanales.

### 5.2. Postgrado

- Disponibilidad estimada: ~10-15 horas semanales (profesional trabajador).
- Semestres o modulos, segun estructura del programa.
- 2 a 4 actividades curriculares concurrentes.
- Mayor proporcion de asincronismo y autonomia (el estudiante de postgrado tiene mayor capacidad de autorregulacion).
- Carga maxima por actividad curricular: ~10 horas semanales.

### 5.3. Educacion continua

- Disponibilidad estimada: ~5-8 horas semanales.
- Formatos flexibles: modulos, talleres, seminarios, jornadas.
- Generalmente 1 actividad a la vez.
- La carga puede expresarse en horas directamente o en SCT segun requerimiento institucional.
- Formato DEC (Direccion de Educacion Continua) como salida documental.

Estos parametros son valores por defecto ajustables por el usuario. El sistema los utiliza como punto de partida, no como restriccion rigida.

---

## 6. Coherencia vertical M1-M3

### 6.1. El "sobre presupuestario"

El concepto central de la articulacion entre momentos es el sobre presupuestario: M1 produce, para cada actividad curricular, un conjunto de parametros que M3 debe respetar:

- Horas totales y su distribucion (sincronicas, asincronicas, autonomas).
- Nivel DOK dominante.
- Perfil Laurillard dominante.
- Creditos SCT.

M3 (el planificador instruccional, ya operativo en umce.online) despliega ese sobre en e-actividades concretas seleccionadas del catalogo de 37 actividades organizadas en 7 categorias. El disenador instruccional tiene libertad para elegir actividades, pero no para alterar el presupuesto total de horas ni el nivel de complejidad cognitiva sin justificacion documentada.

### 6.2. Tolerancia y bidireccionalidad

El sistema permite una tolerancia de +-10% entre las horas estimadas en M1 y las horas planificadas en M3. Si el disenador instruccional necesita exceder esa tolerancia, debe documentar la justificacion (por ejemplo, "la competencia requiere una practica de campo de 20 horas no prevista en la estimacion inicial").

La relacion es bidireccional: M3 puede retroalimentar M1. Si la planificacion instruccional revela sistematicamente que una competencia requiere mas horas de las estimadas, esa informacion actualiza los parametros del motor de calculo para futuras estimaciones. Este mecanismo de retroalimentacion es lo que permite que el sistema mejore con el uso, aun cuando parta sin datos historicos.

### 6.3. El puente Laurillard

Los seis tipos de aprendizaje de Laurillard operan como vocabulario compartido entre M1 y M3. En M1, Laurillard describe el perfil abstracto de la actividad curricular ("esta actividad es predominantemente de produccion y discusion"). En M3, Laurillard clasifica las e-actividades concretas ("foro de debate = discusion; informe escrito = produccion"). La coherencia entre ambos niveles es verificable: si M1 declara un perfil dominante de produccion, M3 debe asignar la mayor parte de las horas a actividades de tipo produccion.

---

## 7. Restricciones institucionales

El sistema preserva las siguientes restricciones que no son negociables:

1. **Formula SCT UMCE**: `SCT = ceil((HP + HA) x NS / 27)`. La unidad de medida es fija (Res. Exenta N. 002140).
2. **Redondeo ceil**: consensuado con la UGCI. Si el calculo produce 4.2 creditos, se declaran 5.
3. **CUECH Subete**: los cursos del Programa Subete tienen 2 SCT fijos y 16 semanas. El sistema los acepta como restriccion externa y no los recalcula.
4. **Proporcion de trabajo autonomo**: entre 25% y 40% de la carga total (Doc. N. 004-2020, Direccion de Docencia).
5. **Formato UGCI**: la salida del sistema debe ser compatible con los formatos de Horas Presenciales (HP) y Horas Autonomas (HA) que utiliza la UGCI en los PAC.
6. **Triparticion de horas**: la extension a tres tipos (sincronicas, asincronicas, autonomas) es una adaptacion UDFV para el contexto virtual. El sistema produce ambos formatos (UGCI bipartito y UDFV tripartito) para que el coordinador use el que corresponda segun el destinatario.

---

## 8. Conexion institucional

La propuesta UGCI de Miguel Angel Pardo (08-abr-2026) de incorporar tablas de especificacion por evaluacion sumativa vinculadas a niveles competenciales (SSIC) converge con la direccion de este rediseno. Ambas propuestas comparten el supuesto de que el nivel de la competencia debe determinar la estructura de la evaluacion y, por extension, la carga de trabajo asociada. La diferencia es de alcance: el SSIC opera ex-post (verificando el logro de competencias en cohortes existentes); la Calculadora SCT v2 opera ex-ante (estimando la carga antes de que la cohorte exista). Son instrumentos complementarios, no competidores.

---

## 9. Limitaciones y honestidad epistemologica

Este documento propone una heuristica, no un estandar validado. Es necesario explicitar las siguientes limitaciones:

1. **Los rangos de horas son estimaciones.** La relacion entre nivel DOK y tiempo de trabajo estudiantil no ha sido validada empiricamente con datos de estudiantes chilenos ni con muestras de la UMCE. El estudio CTAWC (Boring y Blackman, 2021) confirma la direccion de la relacion (mayor nivel taxonomico = mayor tiempo), pero no provee coeficientes transferibles directamente al contexto latinoamericano.

2. **La traduccion Bloom-DOK no es biunivoca.** Un mismo verbo de Bloom puede corresponder a diferentes niveles DOK segun el contexto. El sistema ofrece una traduccion por defecto que el usuario puede corregir, pero la ambiguedad es inherente al uso de verbos como indicadores de profundidad cognitiva.

3. **Los perfiles de estudiante son tipificaciones.** Un "estudiante de postgrado" de la UMCE puede ser un profesional con 20 anos de experiencia laboral y 5 horas semanales disponibles, o un licenciado recien egresado con 30 horas disponibles. Los parametros por defecto reflejan el caso modal, no la variabilidad real.

4. **La calibracion inicial es transferida.** Los tiempos del Rice University Course Workload Estimator fueron desarrollados en el contexto de universidades norteamericanas. Su aplicabilidad al contexto chileno es una hipotesis razonable pero no demostrada. El mecanismo de retroalimentacion M3-M1 esta disenado para que la calibracion se ajuste progresivamente con datos institucionales.

5. **El sistema no reemplaza la Etapa 1 de la Guia UGCI.** Para programas existentes con cohortes previas, la encuesta a estudiantes y docentes sigue siendo el metodo preferente. La Calculadora SCT v2 cubre el caso que la guia no cubre: programas nuevos sin datos historicos. A medida que las cohortes se acumulen, los datos de encuesta deben reemplazar progresivamente las estimaciones del sistema.

6. **El vacio en la literatura es genuino pero puede ser temporal.** La ausencia de un modelo validado que conecte nivel cognitivo con horas de trabajo estudiantil no significa que tal modelo sea imposible. Significa que, a abril de 2026, no se ha publicado uno. Esta propuesta es un primer intento que debera ser revisado a la luz de la investigacion futura.

---

## 10. Referencias bibliograficas

Anderson, L. W. y Krathwohl, D. R. (Eds.). (2001). *A taxonomy for learning, teaching, and assessing: A revision of Bloom's taxonomy of educational objectives* (edicion completa). Longman.

Barre, E. y Esarey, J. (2016-2020). *Rice University Course Workload Estimator*. Center for Teaching Excellence, Rice University. https://cte.rice.edu/workload

Boring, A. y Blackman, K. (2021). Using a course time and workload calculator for curriculum design. *International Journal for Academic Development*, 26(3), 310-322. https://doi.org/10.1080/1360144X.2021.1968354

Consejo de Rectores de las Universidades Chilenas [CRUCH]. (2015). *Manual para la implementacion del Sistema de Creditos Academicos Transferibles SCT-Chile* (3.a ed.). CRUCH.

Comision Nacional de Acreditacion [CNA]. (2017). Criterios de evaluacion para la acreditacion de programas de pregrado modalidad a distancia. *Diario Oficial de la Republica de Chile*, N. 41.925.

European Association of Distance Teaching Universities [EADTU]. (2018). *Quality assurance and recognition in online, open, flexible and technology-enhanced education*. EADTU.

European Commission. (2015). *ECTS Users' Guide*. Publications Office of the European Union. https://doi.org/10.2766/87192

Laurillard, D. (2012). *Teaching as a design science: Building pedagogical patterns for learning and technology*. Routledge.

UNESCO-IESALC. (2020). *Hacia el acceso universal a la educacion superior: tendencias internacionales*. UNESCO. https://www.iesalc.unesco.org

Universidad Metropolitana de Ciencias de la Educacion [UMCE]. (2011). *Resolucion Exenta N. 002140*: Fija el valor del credito SCT en 27 horas cronologicas. UMCE.

Universidad Metropolitana de Ciencias de la Educacion [UMCE]. (2019a). *Resolucion Exenta N. 100062*: Aprueba rediseno curricular basado en competencias, modularizado, con SCT. UMCE.

Universidad Metropolitana de Ciencias de la Educacion [UMCE]. (2019b). *Resolucion Exenta N. 100241*: Complementa y ratifica la modularizacion como decision institucional. UMCE.

Universidad Metropolitana de Ciencias de la Educacion [UMCE]. (2025). *Resolucion Exenta N. 2025-00-1542*: Plan de estudios del Magister en Educacion Intercultural. UMCE.

Universidad Metropolitana de Ciencias de la Educacion [UMCE], Direccion de Docencia. (2020). *Doc. N. 004-2020*: Orientaciones para la elaboracion de PAC en modalidad virtual. UMCE.

Unidad de Gestion Curricular Institucional [UGCI]. (2026). *Guia de Calculo SCT-Chile UMCE* (borrador). Universidad Metropolitana de Ciencias de la Educacion.

Unidad de Gestion Curricular Institucional [UGCI]. (2024). *Doc. N. 09: Sistema de Seguimiento a la Implementacion Curricular UMCE (SSIC)* (v. 2024). Universidad Metropolitana de Ciencias de la Educacion.

Webb, N. L. (1997). *Criteria for alignment of expectations and assessments in mathematics and science education* (Research Monograph No. 6). National Institute for Science Education, University of Wisconsin-Madison.

Webb, N. L. (2002). Depth-of-knowledge levels for four content areas. Documento inedito. Wisconsin Center for Education Research.

Young, C. y Perovic, N. (2016). Rapid and creative course design: As easy as ABC? *Procedia - Social and Behavioral Sciences*, 228, 390-395. https://doi.org/10.1016/j.sbspro.2016.07.058

---

*Documento de trabajo. Sujeto a revision tras validacion con UGCI y retroalimentacion de la Mesa 1 de Virtualizacion. Preparado como base para el desarrollo del Momento 1 del ecosistema UMCE.online y para una posible contribucion a la literatura sobre creditos academicos en educacion superior virtual.*
