> **Nota (13-abr-2026):** Este documento corresponde a la propuesta v2, que fue revisada críticamente y evolucionó a la propuesta v3 consolidada. La v3 incorpora tres modos coexistentes (A: curso individual, B: semestre, C: estimación desde competencias) y resuelve los problemas de scope creep, ratios sin fundamentar, y contradicciones identificados en la auditoría. Ver: `propuesta-calculadora-sct-v3-consolidada.md`.

# Propuesta de Mockups/UI -- Calculadora SCT v2
## Rediseno del flujo: de validacion de curso individual a planificacion de programa completo

**Fecha**: 13 de abril de 2026
**Autor**: UDFV -- Sesion de rediseno con modelo Claude Opus 4.6
**Archivo HTML actual**: `/src/public/virtualizacion-sct.html`
**Estado**: PROPUESTA -- No modificar HTML hasta validacion de David

---

## 1. Analisis del flujo actual (v1)

La calculadora actual tiene **4 etapas** en un wizard secuencial (`step1` a `step4`), con barra de progreso de 4 dots:

### Etapa 1 -- "Tu curso" (Estimacion de carga)
**Que hace**: El usuario ingresa los datos de UNA actividad curricular individual.

**Campos actuales**:
- Nombre del curso (texto libre)
- Codigo (opcional), Programa/carrera, Semestre/periodo
- Perfil de estudiantes (radio cards: Pregrado / Postgrado / Ed. Continua)
- Formato (radio cards: Semestral 18sem / Modulo 8sem / Bloque breve 5sem / CUECH Subete)
- Actividades concurrentes (numero, para estimar carga agregada)
- Horas semanales: HS sincronicas, HAs asincronicas, HAut autonomo (inputs numericos)
- Semanas (NS)
- Creditos SCT declarados (para comparacion)
- Panel de orientacion dinamica (amarillo)
- Preview en tiempo real: horas totales, hrs/semana, SCT calculados, coherencia

**Interacciones**: Seleccion de perfil y formato auto-ajustan semanas. Cambios en horas recalculan en tiempo real. Panel de fundamentacion expandible.

### Etapa 2 -- "Calculo SCT"
**Que hace**: Muestra el resultado del calculo con detalle visual.

**Componentes**: Resultado grande (SCT), paso a paso de la formula, grafico donut (distribucion sync/async/auto), barra de carga semanal con semaforo.

### Etapa 3 -- "Presentacion"
**Que hace**: Genera un informe formal imprimible.

**Componentes**: Encabezado institucional UMCE, datos del curso, resultado destacado, tabla de trazabilidad (dato de entrada -> procedimiento -> resultado -> valor final), marco normativo, boton imprimir/PDF.

### Etapa 4 -- "Verificacion"
**Que hace**: Verifica consistencia en 3 niveles.

**Componentes**: Semaforo global, verificaciones por nivel (distribucion de horas, proporcion autonomo 25-40%, sostenibilidad semanal), recomendaciones, enlace al Planificador Curricular.

### Limitaciones del flujo actual
1. Opera a nivel de **una sola actividad curricular** -- no hay vision de programa
2. Las horas se ingresan manualmente sin referencia a competencias ni complejidad cognitiva
3. No hay relacion entre los verbos de los resultados de aprendizaje y la estimacion de carga
4. No existe matriz de tributacion competencias-actividades curriculares
5. La distribucion sync/async/auto es manual, sin inferencia pedagogica
6. No hay vista de malla completa ni balance de carga por semestre

---

## 2. Flujo propuesto (v2) -- 4 etapas redefinidas

El nuevo flujo mantiene la estructura de wizard de 4 pasos pero cambia radicalmente el alcance: de verificar UNA actividad curricular a **planificar un programa completo** con estimacion de carga basada en complejidad cognitiva.

---

### ETAPA 1 -- Configuracion del programa

**Proposito**: Definir el marco estructural del programa academico antes de entrar en detalle.

#### Campos/componentes de UI

| Componente | Tipo | Descripcion |
|------------|------|-------------|
| Nombre del programa | Text input | Ej: "Magister en Educacion Mencion Gestion" |
| Codigo programa | Text input (opcional) | Ej: "MEG-2026" |
| Tipo de programa | Radio cards (3) | Pregrado / Postgrado / Educacion Continua |
| Modalidad | Radio cards (2) | Virtual / Semipresencial |
| Estructura temporal | Radio cards (3) | Semestral (18 sem) / Modular (8 sem) / Mixto |
| Numero de semestres | Number input | Min 1, max 12 |
| Duracion por periodo | Number input (auto-fill) | Semanas por semestre/modulo (auto-ajusta segun estructura) |
| Creditos totales del programa | Number input | Ej: 60 SCT para un magister |
| Actividades concurrentes max | Number input | Cuantas ACs cursa el estudiante en paralelo (por semestre/modulo) |

#### Interacciones del usuario
- Seleccionar tipo de programa ajusta valores por defecto de modalidad, estructura y creditos
- Seleccionar estructura temporal auto-ajusta duracion por periodo
- Tipo "Postgrado" pre-selecciona "Virtual" y muestra nota sobre profesionales en ejercicio
- Tipo "Pregrado" muestra advertencia del limite 30% virtualidad (Ordinario MINEDUC)

#### Calculo del sistema en tiempo real
- Creditos por semestre = total / numero de semestres
- Estimacion de actividades por semestre basada en creditos/semestre
- Alerta si creditos/semestre > 30 SCT (sobrecarga probable)
- Panel informativo con datos de experiencia UMCE segun tipo seleccionado

#### Wireframe textual

```
+------------------------------------------------------------------+
| ETAPA 1 -- CONFIGURACION DEL PROGRAMA               [1]--[2]--[3]--[4] |
+------------------------------------------------------------------+
|                                                                  |
|  Nombre del programa: [________________________]                 |
|  Codigo (opcional):   [________]                                 |
|                                                                  |
|  Tipo de programa:                                               |
|  +------------------+ +------------------+ +------------------+  |
|  | (o) Pregrado     | | ( ) Postgrado    | | ( ) Ed. Continua |  |
|  | Tiempo completo, | | Profesionales en | | Participantes    |  |
|  | mayor acomp.     | | ejercicio        | | diversos         |  |
|  +------------------+ +------------------+ +------------------+  |
|                                                                  |
|  Modalidad:                                                      |
|  +---------------------+ +---------------------+                |
|  | (o) Virtual         | | ( ) Semipresencial   |                |
|  +---------------------+ +---------------------+                |
|                                                                  |
|  Estructura temporal:                                            |
|  +------------------+ +------------------+ +------------------+  |
|  | (o) Semestral    | | ( ) Modular      | | ( ) Mixto        |  |
|  | 18 semanas       | | 8 semanas        | | Combina ambos    |  |
|  +------------------+ +------------------+ +------------------+  |
|                                                                  |
|  +----------+ +----------+ +----------+                         |
|  | Semestres| | Sem/per  | | SCT total|                         |
|  | [  4   ] | | [  18  ] | | [  60  ] |                         |
|  +----------+ +----------+ +----------+                         |
|                                                                  |
|  Actividades concurrentes max: [ 3 ] por semestre               |
|                                                                  |
|  +------------------------------------------------------+       |
|  | RESUMEN PRELIMINAR                                    |       |
|  | 15 SCT/semestre | ~5 ACs/semestre | 405 hrs/semestre  |       |
|  +------------------------------------------------------+       |
|                                                                  |
|                                     [ Siguiente: Competencias -> ] |
+------------------------------------------------------------------+
```

---

### ETAPA 2 -- Competencias y estructura

**Proposito**: Definir las competencias del perfil de egreso, las actividades curriculares, la matriz de tributacion, y la asignacion temporal.

#### Campos/componentes de UI

| Componente | Tipo | Descripcion |
|------------|------|-------------|
| Competencias del perfil de egreso | Lista dinamica de textareas | Cada competencia con ID auto (C1, C2...) y texto libre. Boton "+Agregar competencia" |
| Actividades curriculares (ACs) | Lista dinamica con campos | Nombre, codigo (opc.), verbo principal del resultado de aprendizaje (texto libre que se clasifica automaticamente) |
| Matriz de tributacion | Tabla interactiva checkbox | Filas = ACs, Columnas = Competencias. Click para marcar tributacion |
| Asignacion a semestres | Drag-and-drop o select | Cada AC se asigna a un semestre (1..N) |

#### Subcomponentes

**Panel de competencias** (mitad izquierda o seccion superior):
- Input de texto para cada competencia
- Boton de eliminar por competencia
- Maximo sugerido: 8-12 competencias
- Deteccion de verbos en el texto (resaltado visual)

**Panel de actividades curriculares** (seccion central):
- Formulario por AC: nombre + resultado de aprendizaje principal (con verbo)
- Al escribir el verbo, el sistema muestra en tiempo real:
  - Nivel Bloom inferido (con color: recordar=gris, comprender=azul, aplicar=verde, analizar=amarillo, evaluar=naranja, crear=rojo)
  - DOK inferido (1-4)
  - Tipo Laurillard dominante (acquisition/inquiry/practice/production/discussion/collaboration)
- Boton "+Agregar actividad curricular"

**Matriz de tributacion** (seccion inferior):
- Tabla con checkboxes: AC(fila) x Competencia(columna)
- Indicador visual: competencias sin tributacion = rojo; ACs que no tributan = advertencia
- Conteo de ACs por competencia (footer de columna)

**Asignacion a semestres** (panel lateral o seccion final):
- Select desplegable por cada AC: "Semestre 1" / "Semestre 2" / etc.
- Contador de SCT estimados por semestre (actualizado en tiempo real en Etapa 3)
- Alerta si un semestre queda vacio o con demasiadas ACs

#### Interacciones del usuario
- Escribir competencias en texto libre
- Agregar/eliminar ACs dinamicamente
- Marcar checkboxes en la matriz de tributacion
- Arrastrar o seleccionar semestre para cada AC
- Al escribir el resultado de aprendizaje, el clasificador de verbos opera en tiempo real

#### Calculo del sistema en tiempo real
- Clasificacion automatica de verbos (diccionario Bloom expandido con Churches 2008)
- Inferencia de nivel DOK basada en el verbo + contexto (Webb 2002)
- Sugerencia de tipo Laurillard dominante segun verbo y tipo de actividad
- Validacion de cobertura: toda competencia debe tener al menos 1 AC tributando
- Balance de complejidad por semestre (preview)

#### Wireframe textual

```
+------------------------------------------------------------------+
| ETAPA 2 -- COMPETENCIAS Y ESTRUCTURA                [1]--[2]--[3]--[4] |
+------------------------------------------------------------------+
|                                                                  |
|  COMPETENCIAS DEL PERFIL DE EGRESO                               |
|  +--------------------------------------------------------------+|
|  | C1: [Disenar procesos de ensenanza-aprendizaje integrando...] ||
|  | C2: [Evaluar criticamente evidencia de investigacion educ...] ||
|  | C3: [Gestionar proyectos de innovacion pedagogica con...    ] ||
|  |                              [+ Agregar competencia]          ||
|  +--------------------------------------------------------------+|
|                                                                  |
|  ACTIVIDADES CURRICULARES                                        |
|  +--------------------------------------------------------------+|
|  | AC1: Metodologia Cualitativa                                  ||
|  |   Resultado: "Analizar datos cualitativos usando..."          ||
|  |   [Bloom: ANALIZAR ||||    ] [DOK: 3] [Laurillard: Inquiry]  ||
|  |   Semestre: [v Sem 1]                                         ||
|  |--------------------------------------------------------------||
|  | AC2: Gestion Educativa                                        ||
|  |   Resultado: "Disenar un plan de mejora institucional..."     ||
|  |   [Bloom: CREAR   ||||||  ] [DOK: 4] [Laurillard: Production]||
|  |   Semestre: [v Sem 1]                                         ||
|  |--------------------------------------------------------------||
|  | AC3: Seminario de Investigacion                               ||
|  |   Resultado: "Evaluar marcos teoricos para..."                ||
|  |   [Bloom: EVALUAR |||||   ] [DOK: 3] [Laurillard: Inquiry]   ||
|  |   Semestre: [v Sem 2]                                         ||
|  |                              [+ Agregar AC]                   ||
|  +--------------------------------------------------------------+|
|                                                                  |
|  MATRIZ DE TRIBUTACION                                           |
|  +------------------+------+------+------+                       |
|  |                  |  C1  |  C2  |  C3  |                       |
|  +------------------+------+------+------+                       |
|  | AC1 Met.Cual.    | [x]  | [x]  | [ ]  |                      |
|  | AC2 Gest.Educ.   | [x]  | [ ]  | [x]  |                      |
|  | AC3 Sem.Invest.  | [ ]  | [x]  | [x]  |                      |
|  +------------------+------+------+------+                       |
|  | Tributaciones:   |  2   |  2   |  2   |                       |
|  +------------------+------+------+------+                       |
|                                                                  |
|                         [<- Volver]  [Siguiente: Estimacion -> ] |
+------------------------------------------------------------------+
```

---

### ETAPA 3 -- Estimacion (el sistema calcula)

**Proposito**: Mostrar las estimaciones de carga por AC con la clasificacion cognitiva visible, y permitir al usuario ajustar lo que no le parezca razonable.

#### Campos/componentes de UI

| Componente | Tipo | Descripcion |
|------------|------|-------------|
| Tabla de clasificacion de verbos | Tabla readonly + tooltips | Verbo -> nivel Bloom -> color. Expandible para ver la tabla completa de Bloom |
| Panel por AC | Card expandible | Nombre, nivel DOK, tipo Laurillard, horas estimadas, SCT |
| Distribucion sync/async/auto | Barras horizontales editables | Por cada AC: horas sync, async, auto. Slider o input |
| SCT por AC | Badge numerico | Calculado = horas totales x semanas / 27 |
| Totales por semestre | Fila resumen | Suma de SCT, suma de horas, alertas de sobrecarga |
| Boton de ajuste | Editable inline | El usuario puede modificar horas si la estimacion no es razonable |

#### Subcomponentes

**Panel de referencia Bloom** (colapsable, parte superior):
- Tabla de 6 niveles con verbos ejemplares
- Resaltado del nivel detectado por cada AC
- Fuente: Anderson & Krathwohl (2001), Churches (2008)

**Card por actividad curricular** (lista principal):
Cada card muestra:
```
[Nombre AC] -- Semestre N
Verbo: "analizar" -> Bloom: ANALIZAR (nivel 4/6) | DOK: 3/4 | Laurillard: Inquiry
Horas estimadas/semana:
  Sincronicas:  [==1.5===] hrs  (slider editable)
  Asincronicas: [===2.0===] hrs (slider editable)
  Autonomas:    [=1.5=]    hrs  (slider editable)
Total semanal: 5.0 hrs | Total semestre: 90 hrs | SCT: 4
```

**Panel de fundamentacion** (expandible por AC):
- Explica por que se asignaron esas horas: "Actividades de nivel Inquiry (Laurillard) requieren mayor proporcion de trabajo asincrono para investigacion..."
- Referencias: Laurillard (2012), Young & Perovic (2015), Boring & Blackman (2021)

**Resumen por semestre** (tabla fija inferior):
- Columnas: Semestre | ACs | SCT total | Hrs sync/sem | Hrs async/sem | Hrs auto/sem | Hrs total/sem | Semaforo
- Alerta si SCT > 30/semestre o hrs > 45/semana

#### Interacciones del usuario
- Expandir/colapsar cards de AC para ver detalle
- Ajustar sliders de horas sync/async/auto por AC
- Ver tooltip de fundamentacion por cada estimacion
- Expandir tabla de Bloom de referencia
- Override manual: si el usuario cambia una hora, se marca como "ajuste manual" (icono de lapiz)

#### Calculo del sistema en tiempo real
- Horas base por AC segun reglas:
  - DOK 1-2 (recall/skill): ratio sync:async:auto = 40:30:30
  - DOK 3 (strategic): ratio = 30:35:35
  - DOK 4 (extended): ratio = 20:30:50
- Ajuste por tipo Laurillard:
  - Acquisition/Practice: mas sincronico
  - Inquiry/Production: mas autonomo
  - Discussion/Collaboration: mas asincrono
- SCT por AC = (sync + async + auto) x semanas / 27
- Totales por semestre (suma de todas las ACs del semestre)
- Carga semanal agregada por semestre
- Semaforos de sostenibilidad (verde <10 hrs/sem, amarillo 10-12, rojo >12)

#### Wireframe textual

```
+------------------------------------------------------------------+
| ETAPA 3 -- ESTIMACION                               [1]--[2]--[3]--[4] |
+------------------------------------------------------------------+
|                                                                  |
|  [v] REFERENCIA: Taxonomia de Bloom revisada                     |
|  +--------------------------------------------------------------+|
|  | Recordar | Comprender | Aplicar | Analizar | Evaluar | Crear ||
|  |  listar  |  explicar  | aplicar | comparar | juzgar  | disenar||
|  |  definir  |  clasificar| resolver| diferenciar| argumentar| crear||
|  +--------------------------------------------------------------+|
|                                                                  |
|  SEMESTRE 1 (3 ACs, 12 SCT estimados)                           |
|  +--------------------------------------------------------------+|
|  | AC1: Metodologia Cualitativa                         Sem 1    ||
|  | Bloom: ANALIZAR [||||  ] DOK: 3  Laurillard: Inquiry          ||
|  |                                                               ||
|  |  Sync:  [====1.5====|          ] hrs/sem                      ||
|  |  Async: [======2.0======|      ] hrs/sem                      ||
|  |  Auto:  [=====1.5=====|        ] hrs/sem                      ||
|  |                                                               ||
|  |  Total: 5.0 hrs/sem | 90 hrs | 4 SCT                         ||
|  |  [v Fundamentacion: DOK 3 sugiere ratio 30:35:35...]          ||
|  +--------------------------------------------------------------+|
|  |                                                               ||
|  | AC2: Gestion Educativa                               Sem 1    ||
|  | Bloom: CREAR [||||||] DOK: 4  Laurillard: Production          ||
|  |                                                               ||
|  |  Sync:  [==1.0==|              ] hrs/sem                      ||
|  |  Async: [======2.0======|      ] hrs/sem                      ||
|  |  Auto:  [=========3.0=========|] hrs/sem                      ||
|  |                                                               ||
|  |  Total: 6.0 hrs/sem | 108 hrs | 4 SCT                        ||
|  +--------------------------------------------------------------+|
|                                                                  |
|  RESUMEN POR SEMESTRE                                            |
|  +--------+----+-----+------+-------+------+--------+---------+ |
|  | Sem    | ACs| SCT | Sync | Async | Auto | Total  | Estado  | |
|  +--------+----+-----+------+-------+------+--------+---------+ |
|  | Sem 1  |  3 |  12 | 4.0  |  6.0  | 6.0  | 16.0   | (!)AMB  | |
|  | Sem 2  |  3 |  12 | 3.5  |  5.5  | 5.0  | 14.0   | (!)AMB  | |
|  | Sem 3  |  2 |   8 | 3.0  |  4.0  | 3.0  | 10.0   | OK VER  | |
|  | Sem 4  |  2 |   8 | 2.0  |  3.0  | 5.0  |  10.0  | OK VER  | |
|  +--------+----+-----+------+-------+------+--------+---------+ |
|  | TOTAL  | 10 |  40 |                               |         | |
|  +--------+----+-----+------+-------+------+--------+---------+ |
|                                                                  |
|                         [<- Volver]  [Siguiente: Validacion ->]  |
+------------------------------------------------------------------+
```

---

### ETAPA 4 -- Vista de programa y validacion

**Proposito**: Presentar la malla completa, validar la carga agregada, mostrar el balance de complejidad cognitiva, y generar el informe imprimible con doble formato.

#### Campos/componentes de UI

| Componente | Tipo | Descripcion |
|------------|------|-------------|
| Malla completa por semestre | Grid visual | ACs como cards dentro de columnas por semestre, con SCT y color por complejidad |
| Carga semanal por semestre | Barras horizontales con semaforo | Hrs sync + async + auto, con indicador verde/amarillo/rojo |
| Balance de complejidad cognitiva | Grafico de barras apiladas | Por semestre: proporcion de ACs por nivel Bloom (colores) |
| Formato UGCI (HP/HA) | Tabla formal | Horas presenciales + Horas autonomas (formato resolucion exenta) |
| Formato extendido (sync/async/auto) | Tabla formal | Distribucion tripartita para diseno instruccional |
| Boton generar informe | Boton primario | Genera PDF/impresion con ambos formatos |
| Semaforo global | Card con icono | Estado general del programa: coherente / alertas / problemas |

#### Subcomponentes

**Malla visual** (seccion superior):
- Grid de columnas: una por semestre
- Dentro de cada columna: cards de ACs
- Cada card muestra: nombre, SCT, nivel Bloom (color), tipo Laurillard (icono)
- Altura de card proporcional a SCT
- Total SCT por semestre en footer de columna

**Grafico de carga semanal** (seccion media):
- Una barra por semestre
- Segmentos de color: azul (sync), morado (async), verde (auto)
- Lineas de referencia: 10 hrs (recomendado), 12 hrs (alerta)
- Si concurrentes > 1: muestra carga multiplicada

**Balance de complejidad** (seccion media-inferior):
- Barras apiladas por semestre
- Colores por nivel Bloom: gris(1), azul(2), verde(3), amarillo(4), naranja(5), rojo(6)
- Ideal: distribucion equilibrada, no concentrar todos los "crear" en un semestre
- Alertas: semestre con >50% de ACs en DOK 4 o nivel Bloom 5-6

**Doble formato de horas** (seccion inferior):

*Formato UGCI (para resolucion exenta)*:
```
+-----------------------+------+------+------+
| Actividad Curricular  |  HP  |  HA  | SCT  |
+-----------------------+------+------+------+
| Metodologia Cual.     |  27  |  63  |   4  |
| Gestion Educativa     |  18  |  90  |   4  |
| ...                   | ...  | ...  | ...  |
+-----------------------+------+------+------+
```
Donde HP = horas presenciales (sincronicas) y HA = horas de trabajo autonomo (async + auto).

*Formato extendido (para diseno instruccional)*:
```
+-----------------------+------+-------+------+-------+------+
| Actividad Curricular  | Sync | Async | Auto | Total | SCT  |
+-----------------------+------+-------+------+-------+------+
| Metodologia Cual.     |  27  |   36  |  27  |   90  |   4  |
| Gestion Educativa     |  18  |   36  |  54  |  108  |   4  |
| ...                   | ...  |  ...  | ...  |  ...  | ...  |
+-----------------------+------+-------+------+-------+------+
```

#### Interacciones del usuario
- Hover sobre cards de la malla: muestra tooltip con detalle
- Click en semestre: expande detalle de todas las ACs
- Toggle entre formato UGCI y extendido
- Boton "Generar informe" abre vista de impresion o descarga PDF
- Boton "Nuevo programa" reinicia el wizard
- Enlace a Planificador Curricular para siguiente paso

#### Calculo del sistema en tiempo real
- Validacion de carga agregada: suma de horas semanales de todas las ACs del semestre, multiplicada por concurrentes
- Balance de complejidad: distribucion de niveles Bloom/DOK por semestre
- Deteccion de semestres desbalanceados (toda la complejidad alta en un semestre)
- Deteccion de competencias sin cobertura suficiente a traves de la malla
- Generacion del informe con datos de trazabilidad (formula, fuentes, ajustes manuales)

#### Wireframe textual

```
+------------------------------------------------------------------+
| ETAPA 4 -- VISTA DE PROGRAMA Y VALIDACION            [1]--[2]--[3]--[4] |
+------------------------------------------------------------------+
|                                                                  |
|  SEMAFORO GLOBAL                                                 |
|  +--------------------------------------------------------------+|
|  |  [OK]  Programa coherente -- 2 alertas menores               ||
|  |  40 SCT | 4 semestres | 10 ACs | Carga sostenible            ||
|  +--------------------------------------------------------------+|
|                                                                  |
|  MALLA POR SEMESTRE                                              |
|  +-------------+ +-------------+ +-------------+ +-------------+|
|  | SEMESTRE 1  | | SEMESTRE 2  | | SEMESTRE 3  | | SEMESTRE 4  ||
|  | 12 SCT      | | 12 SCT      | | 8 SCT       | | 8 SCT       ||
|  |             | |             | |             | |             ||
|  | [Met.Cual.] | | [Sem.Inv. ] | | [Practica ] | | [Tesis    ] ||
|  | 4 SCT       | | 4 SCT       | | 4 SCT       | | 4 SCT       ||
|  | ANALIZAR    | | EVALUAR     | | APLICAR     | | CREAR       ||
|  |             | |             | |             | |             ||
|  | [Gest.Ed. ] | | [Politica ] | | [Taller   ] | | [Portafolio]||
|  | 4 SCT       | | 4 SCT       | | 4 SCT       | | 4 SCT       ||
|  | CREAR       | | ANALIZAR    | | CREAR       | |             ||
|  |             | |             | |             | |             ||
|  | [Fundament] | | [Curriculo] | |             | |             ||
|  | 4 SCT       | | 4 SCT       | |             | |             ||
|  | COMPRENDER  | | EVALUAR     | |             | |             ||
|  +-------------+ +-------------+ +-------------+ +-------------+|
|                                                                  |
|  CARGA SEMANAL POR SEMESTRE                                      |
|  Sem 1: [====SYNC====|===ASYNC===|===AUTO===] 16 hrs  (!) AMBER |
|  Sem 2: [===SYNC===|===ASYNC===|==AUTO==]     14 hrs  (!) AMBER |
|  Sem 3: [==SYNC==|==ASYNC==|===AUTO===]       10 hrs      GREEN |
|  Sem 4: [=SYNC=|=ASYNC=|=====AUTO=====]      10 hrs      GREEN  |
|         0    2    4    6    8   10   12   14   16                 |
|                                    |         |                   |
|                                  recom.    alerta                |
|                                                                  |
|  BALANCE DE COMPLEJIDAD COGNITIVA                                |
|  Sem 1: [COMP][....ANAL....][......CREAR......]    Medio-Alto    |
|  Sem 2: [.....ANAL.....][.....EVAL.....][EVAL]     Alto          |
|  Sem 3: [......APLIC......][......CREAR......]     Medio         |
|  Sem 4: [..............CREAR..............]        Muy alto       |
|         Bloom 1-2      Bloom 3-4       Bloom 5-6                 |
|                                                                  |
|  FORMATO DE HORAS                                                |
|  [Tab: UGCI (HP/HA)] [Tab: Extendido (sync/async/auto)]         |
|  +-------------------+------+------+------+                      |
|  | AC                |  HP  |  HA  | SCT  |                      |
|  +-------------------+------+------+------+                      |
|  | Met. Cualitativa  |  27  |  63  |   4  |                      |
|  | Gestion Educativa |  18  |  90  |   4  |                      |
|  | ...               | ...  | ...  | ...  |                      |
|  +-------------------+------+------+------+                      |
|  | TOTAL PROGRAMA    | 200  | 880  |  40  |                      |
|  +-------------------+------+------+------+                      |
|                                                                  |
|  [ Imprimir informe ]  [ Nuevo programa ]  [ -> Planificador ]  |
+------------------------------------------------------------------+
```

---

## 3. Diferencias clave v1 vs v2

| Aspecto | v1 (actual) | v2 (propuesto) |
|---------|-------------|----------------|
| Alcance | 1 actividad curricular | Programa completo |
| Entrada de horas | Manual (usuario estima) | Inferida por complejidad cognitiva + ajustable |
| Taxonomia | No visible | Bloom + DOK + Laurillard visibles |
| Competencias | No existen | Perfil de egreso + matriz tributacion |
| Vista programa | No existe | Malla + carga por semestre + balance |
| Formato de salida | Solo sync/async/auto | Doble: UGCI (HP/HA) + extendido |
| Fundamentacion | Paneles expandibles por campo | Integrada en la inferencia del sistema |
| Semaforos | Solo carga semanal individual | Carga + complejidad + cobertura competencias |

---

## 4. Consideraciones tecnicas

### Stack (se mantiene irrompible)
- HTML + vanilla JS + Tailwind CDN
- NO React, NO frameworks de estado
- Datos en memoria del navegador (no requiere backend para el calculo)
- Exportacion a PDF via window.print() con @media print

### Diccionario de verbos Bloom
- JSON embebido en el HTML o cargado desde `/shared/bloom-verbs.json`
- ~200 verbos clasificados por nivel (1-6) en espanol
- Fuentes: Anderson & Krathwohl (2001), Churches (2008)
- Incluye verbos digitales (Churches): colaborar, publicar, bloguear, programar, etc.

### Reglas de inferencia DOK
- DOK 1 (recall): verbos de nivel Bloom 1 (recordar)
- DOK 2 (skill/concept): verbos de nivel Bloom 2-3 (comprender, aplicar)
- DOK 3 (strategic thinking): verbos de nivel Bloom 4-5 (analizar, evaluar)
- DOK 4 (extended thinking): verbos de nivel Bloom 6 (crear) + contexto de proyecto/investigacion

### Mapeo Laurillard
- Acquisition: verbos de Bloom 1-2 (recordar, comprender)
- Inquiry: verbos de Bloom 4 (analizar) + contexto de investigacion
- Practice: verbos de Bloom 3 (aplicar) + contexto de ejercitacion
- Production: verbos de Bloom 6 (crear, disenar)
- Discussion: verbos de Bloom 4-5 + contexto de debate/argumentacion
- Collaboration: cualquier nivel + contexto de trabajo grupal

### Ratios de distribucion sync/async/auto (valores por defecto)
| Tipo Laurillard | Sync | Async | Auto | Fundamentacion |
|----------------|------|-------|------|----------------|
| Acquisition | 50% | 20% | 30% | Clases magistrales + lectura autonoma |
| Inquiry | 20% | 35% | 45% | Investigacion requiere mas autonomia |
| Practice | 40% | 30% | 30% | Ejercitacion guiada + practica autonoma |
| Production | 15% | 30% | 55% | Creacion demanda trabajo autonomo extenso |
| Discussion | 35% | 45% | 20% | Debates sincronicos + foros asincronicos |
| Collaboration | 30% | 50% | 20% | Trabajo grupal asincrono + sesiones sync |

### Persistencia
- localStorage para guardar programas en progreso
- Exportacion JSON para compartir entre usuarios
- Sin backend -- todo client-side

---

## 5. Migracion de la v1

La v1 NO se elimina. Se mantiene como **modo simple** (calculo de una AC individual) accesible desde un enlace "Calcular una sola actividad curricular" en la nueva Etapa 1. Esto permite:

1. Usuarios que solo necesitan verificar 1 AC siguen teniendo acceso rapido
2. La v2 es el flujo principal para planificacion de programa
3. Codigo JS de la v1 (formula, semaforos, donut) se reutiliza en la v2

---

## 6. Fuentes del rediseno

- Anderson, L. W., & Krathwohl, D. R. (2001). Taxonomia revisada de Bloom.
- Webb, N. L. (2002). Depth-of-Knowledge levels.
- Marzano, R. J., & Kendall, J. S. (2007). Nueva taxonomia de objetivos educativos.
- Churches, A. (2008). Bloom's digital taxonomy.
- Biggs, J., & Tang, C. (2011). Alineamiento constructivo.
- Laurillard, D. (2012). Seis tipos de aprendizaje.
- Fink, L. D. (2013). Aprendizaje significativo.
- Young, C., & Perovic, N. (2015). ABC Learning Design.
- Boring, R. L., & Blackman, H. S. (2021). Analisis cognitivo de tareas.
- Kyndt, E., et al. (2011). Percepcion de carga y complejidad.
- Wagenaar, R. (2019). ECTS y carga de trabajo (Tuning).
- Vuorikari, R., et al. (2022). DigComp 2.2.
- UNESCO (2018). Marco TIC para docentes v3.
- CRUCH (2015). Manual SCT-Chile, 3.a ed.
- Guia de Calculo SCT-Chile UMCE (UGCI).

---

*Propuesta generada para umce-online -- Rediseno Calculadora SCT v2*
*No modificar HTML hasta validacion de David*
