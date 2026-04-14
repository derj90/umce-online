# Calculadora SCT-Chile v3: Propuesta consolidada de tres modos coexistentes

**Version**: 3.1  
**Fecha**: 13 de abril de 2026  
**Autor**: David Reyes Jofre, Coordinador UDFV, Universidad Metropolitana de Ciencias de la Educacion  
**Proyecto**: UMCE.online -- Momento 1 (Definicion de creditos y horas)  
**Estado**: Propuesta definitiva para desarrollo (post-auditoria de coherencia)  
**Documentos base**: concepto-calculadora-sct-v2.md, impacto-rediseno-calculadora-sct.md, propuesta-mockups-calculadora-sct-v2.md, knowledge-base-virtualizacion.md  

---

## 1. Resumen ejecutivo

La Calculadora SCT actual (v1) cumple una funcion unica: verificar la coherencia entre horas ingresadas manualmente y creditos SCT declarados para una sola actividad curricular. Este documento propone una version 3 con tres modos que coexisten en la misma herramienta, cada uno orientado a un caso de uso distinto y a un nivel de profundidad diferente.

Los tres modos comparten una formula canonica unica: **SCT = ceil( HT / 27 )**, donde HT son las horas totales cronologicas de trabajo estudiantil. Lo que varia entre modos es como se calcula HT. Todos los modos producen el mismo informe de salida con dos bloques (resultado PAC y anexo metodologico), y todos emiten el triple obligatorio de horas (H_sinc, H_asinc, H_aut) cuya suma es HT.

Los tres modos no se excluyen: un coordinador puede usar el Modo A para una verificacion rapida de un curso ya definido, el Modo B para visualizar la carga agregada de un semestre completo, o el Modo C para construir la estructura crediticia de un programa nuevo desde las competencias del perfil de egreso. La interfaz ofrece los tres como opciones de entrada al wizard, con navegacion libre entre ellos.

La propuesta preserva intactas todas las restricciones institucionales (formula SCT, redondeo ceil, formato UGCI, constante de 27 horas por credito) y extiende las capacidades sin romper lo que ya funciona.

---

## 2. Diagnostico: por que tres modos

La v1 cubre un solo escenario: verificar la coherencia entre horas y creditos de una sola AC. Deja descubiertas tres situaciones: (1) no hay vista semestral agregada, el coordinador verifica manualmente la carga total y los desbalances se detectan tarde; (2) para programas nuevos sin cohortes previas no existe procedimiento formalizado de estimacion, aunque el Manual SCT-Chile (CRUCH, 2015, FAQ 5) reconoce la posibilidad sin operacionalizarla; y (3) las horas se ingresan sin relacion con el nivel cognitivo exigido al estudiante. Los tres modos responden a estas carencias en orden creciente de profundidad.

---

## 3. Formula canonica y variantes por modo

La formula de creditos es una sola en todo el sistema:

> **SCT = ceil( HT / 27 )**

donde HT representa las horas totales cronologicas de trabajo estudiantil para la actividad curricular. Lo que varia entre modos es el procedimiento para calcular HT:

- **Modo A** (caso particular: carga semanal uniforme): `HT = (HS + HAs + HAut) x NS`
- **Modo B** (agregacion semestral): `HT = Sigma HT_i` para cada AC_i del semestre
- **Modo C** (estimacion fundamentada): `HT = f(nivel cognitivo predominante, perfil estudiante, modalidad AC, duracion)`; las modalidades de trabajo distribuyen HT proporcionalmente, no lo determinan (ver seccion 4.3.2)

**Equivalencia con formato UGCI.** Las variables del triple obligatorio se mapean al formato bipartito de las resoluciones exentas:

- HP (horas presenciales UGCI) = H_sinc
- HA (horas autonomas UGCI) = H_asinc + H_aut

El desglose tripartito (sincronico / asincronico / autonomo) es una extension UDFV del formato bipartito UGCI (HP / HA). La extension no contradice el formato oficial: lo refina internamente para uso del diseno instruccional, y se colapsa al formato bipartito para efectos de resoluciones exentas y PAC.

**Regla de consistencia.** Todo modo, sin excepcion, debe emitir el triple de horas (H_sinc, H_asinc, H_aut) cuya suma es igual a HT. Este triple alimenta tanto el formato UGCI bipartito (HP = H_sinc; HA = H_asinc + H_aut) como el formato extendido tripartito. La restriccion garantiza que los informes de salida sean identicos en estructura independientemente del modo utilizado.

---

## 4. Los tres modos

### 4.1. Modo A -- "Calcular un curso" (la v1 mejorada)

**Proposito.** Verificacion rapida de una sola actividad curricular. Es la calculadora actual con tres mejoras incrementales.

**Usuarios.** Coordinador con prisa, UGCI validando un PAC puntual, disenador instruccional verificando un dato.

**Tiempo estimado.** 3 a 5 minutos.

**Campos de entrada** (se preservan de la v1): nombre del curso, codigo, programa, semestre, perfil de estudiantes (pregrado/postgrado/ed. continua), formato (semestral 18 sem / modulo 8 sem / bloque 5 sem / CUECH Subete 16 sem 2 SCT fijos), horas semanales (HS, HAs, HAut), semanas (NS), SCT declarados, actividades concurrentes.

**Mejora 1 -- Selector de tipo de actividad.** El coordinador selecciona el tipo predominante entre cinco opciones (expositiva, taller, seminario, proyecto, mixto) que pre-llena las horas sugeridas como punto de partida editable. Los valores iniciales se calibran con el Wake Forest Workload Estimator 2.0 y el catalogo de 37 e-actividades UMCE. Cada tipo tiene un perfil Laurillard dominante que determina la distribucion sugerida: "proyecto" pre-llena mayor autonomia (produccion), "seminario" mayor sincronismo (discusion).

**Mejora 2 -- Doble formato de output.** Dos tablas: formato UGCI bipartito (HP + HA) para resoluciones exentas, y formato extendido tripartito (sync + async + auto) para diseno instruccional. Intercambiables: HP = sincronicas, HA = asincronicas + autonomas. Fundamentado en EADTU (2018) y UNESCO-IESALC (2020).

**Mejora 3 -- Informe imprimible unificado.** Todos los modos producen un informe con la misma estructura de dos bloques (vease seccion 7).

**Calculo.** `HT = (HS + HAs + HAut) x NS`, luego `SCT = ceil(HT / 27)`. El triple de horas se obtiene directamente de los inputs: H_sinc = HS x NS, H_asinc = HAs x NS, H_aut = HAut x NS.

---

### 4.2. Modo B -- "Calcular un semestre" (vista agregada)

**Proposito.** Verificar la carga total del estudiante en un semestre completo, agregando multiples actividades curriculares.

**Usuarios.** Coordinador de programa disenando o revisando un plan de estudios, UGCI verificando balance semestral.

**Tiempo estimado.** 10 a 15 minutos para 4 a 5 actividades curriculares.

**Flujo.** El coordinador selecciona un semestre e ingresa las ACs como filas de tabla. Cada fila es el formulario compacto del Modo A: nombre, tipo de actividad (5 opciones, pre-llena horas), HS/HAs/HAut editables, semanas, SCT calculados (readonly). El perfil de estudiantes se ingresa una vez para todo el semestre.

**Calculo.** Cada AC se calcula con la formula del Modo A. El HT del semestre es la suma de los HT individuales: `HT_semestre = Sigma HT_i`. El triple de horas se agrega por columna: H_sinc_total = Sigma H_sinc_i, etc.

**Salida.** Tabla completa por AC con totales, carga semanal agregada, semaforos (verde menos de 10 hrs/semana, amarillo 10-12, rojo mas de 12; umbrales ajustados por perfil), e informe imprimible con estructura de dos bloques (seccion 7). Cada fila es expandible al formulario completo del Modo A para mayor detalle.

---

### 4.3. Modo C -- "Estimar desde competencias" (el modo fundamentado)

**Proposito.** Construir la estructura crediticia de un programa o actividad curricular nueva a partir del nivel de complejidad cognitiva de sus resultados de aprendizaje, sin requerir datos historicos de cohortes previas.

**Usuarios.** Coordinador disenando un programa nuevo, equipo de rediseno curricular, UGCI en proceso de validacion de propuestas nuevas.

**Tiempo estimado.** 15 a 25 minutos para un programa completo.

**Este es el aporte teorico original de la propuesta.** Mientras los Modos A y B trabajan con horas ingresadas manualmente, el Modo C estima las horas a partir de la naturaleza cognitiva de lo que se pide al estudiante. La relacion entre nivel cognitivo y carga de trabajo es el supuesto central, respaldado empiricamente por el estudio CTAWC (Boring y Blackman, 2021) que confirma que actividades formuladas en niveles superiores de Bloom requieren significativamente mas tiempo que actividades en niveles inferiores.

#### 4.3.1. Entrada por actividad curricular

Para cada AC, el coordinador proporciona:

1. **Nombre de la AC.** Texto libre.
2. **Modalidad.** Virtual o semipresencial. Condiciona los ratios de distribucion sincronico/asincronico/autonomo.
3. **Area disciplinar del programa.** Ciencias, humanidades, educacion, artes, tecnologia. Se usa como perfil de distribucion por defecto cuando no se marcan modalidades de trabajo (vease regla de fallback en 4.3.2).
4. **Checkboxes de modalidades de trabajo.** El coordinador marca las modalidades de trabajo que caracterizan la AC. Las opciones se formulan a nivel meso curricular (van den Akker, 2003), no como actividades concretas de aula:
   - **Estudio individual** (lectura, video, contenido, material de referencia)
   - **Produccion escrita** (ensayos, informes, reportes, reflexiones)
   - **Practica aplicada** (laboratorio, ejercicios, simulacion, casos)
   - **Trabajo colaborativo** (discusion, debate, trabajo grupal, co-evaluacion)
   - **Produccion integrada** (proyecto, investigacion, portafolio, diseno)

   Puede marcar mas de una. Cada modalidad marcada despliega un slider de nivel cognitivo y un campo de proporcion (vease paso 1 del motor de calculo).

   **Regla operativa para la frontera M1-M3.** Si la pregunta que plantea un campo se puede responder leyendo el descriptor de la AC en el plan de estudios, pertenece a M1 (esta calculadora). Si requiere abrir el syllabus o planificar clases, pertenece a M3 (el Planificador Curricular). Las cinco modalidades de trabajo se formulan deliberadamente al nivel del descriptor de la AC, no de la sesion de clase.

5. **Slider de nivel cognitivo por modalidad.** Cada checkbox activado despliega un slider de 4 niveles con etiquetas Bloom agrupadas, que son la lingua franca del diseno curricular en Chile (PAC, resoluciones, guias UGCI). Internamente, cada nivel se mapea a un nivel DOK de Webb para el calculo temporal:

   - **Nivel 1 -- Recordar / Comprender** (DOK 1: recuperacion). Verbos ejemplo: listar, definir, identificar, explicar, clasificar, resumir. Tooltip: "El estudiante reproduce o reformula informacion."
   - **Nivel 2 -- Aplicar** (DOK 2: habilidades y conceptos). Verbos ejemplo: resolver, demostrar, implementar, utilizar. Tooltip: "El estudiante usa conocimiento en situaciones tipicas."
   - **Nivel 3 -- Analizar / Evaluar** (DOK 3: pensamiento estrategico). Verbos ejemplo: comparar, diferenciar, argumentar, justificar, criticar. Tooltip: "El estudiante descompone, relaciona o emite juicio fundamentado."
   - **Nivel 4 -- Crear** (DOK 4: pensamiento extendido). Verbos ejemplo: disenar, producir, formular, investigar, componer. Tooltip: "El estudiante genera un producto original."

   Tooltip general del slider: "Seleccione el nivel mas alto que el estudiante debe alcanzar en esta modalidad de trabajo."

   Los niveles vienen pre-sugeridos segun la modalidad: estudio individual default nivel 1-2, produccion escrita default nivel 2-3, practica aplicada default nivel 2-3, trabajo colaborativo default nivel 2-3, produccion integrada default nivel 3-4. El coordinador puede ajustar libremente.

**Alertas de coherencia nivel-modalidad.** El sistema emite un warning cuando la combinacion de nivel cognitivo y modalidades de trabajo es contradictoria o improbable. Casos especificos:
- Nivel 4 (Crear) con solo 'Estudio individual' marcado: alerta 'El nivel Crear tipicamente requiere produccion integrada o produccion escrita. ¿Desea agregar una modalidad de produccion?'
- Nivel 1 (Recordar/Comprender) con solo 'Produccion integrada' marcado: alerta 'Un proyecto o investigacion tipicamente implica niveles de Analizar o Crear. ¿Desea ajustar el nivel cognitivo?'
- Solo una modalidad marcada con nivel >=3: alerta suave 'Las actividades curriculares de nivel avanzado suelen combinar mas de una modalidad de trabajo.'

Estas alertas son orientativas, no bloqueantes. El coordinador puede descartarlas si su caso lo justifica.

#### 4.3.2. Motor de calculo (invisible para el usuario)

El sistema procesa cada AC en cuatro pasos internos. La logica central es un modelo proporcional: el nivel cognitivo predominante determina las horas totales (HT), y las modalidades de trabajo distribuyen ese presupuesto proporcionalmente. Las modalidades no suman horas independientes.

**Paso 1 -- Estimacion de HT (horas totales).** El motor estima las horas totales (HT) de la AC a partir del **nivel cognitivo predominante** (el mas alto entre los seleccionados en las modalidades marcadas), el perfil de estudiante (pregrado/postgrado/ed. continua), la modalidad de la AC (virtual/semipresencial) y la duracion en semanas. Esta es la estimacion base. La tabla de horas se calibra con datos del Rice University Course Workload Estimator (Barre y Esarey, 2016-2020), conocido tambien como Wake Forest Workload Estimator, ajustada por un multiplicador de complejidad derivado de la Depth of Knowledge de Webb (1997, 2002). DOK incorpora una dimension temporal implicita que lo hace especialmente apto para este proposito: DOK 4 (pensamiento extendido) presupone trabajo sostenido durante semanas, no minutos. Este ajuste se cruza con la dimension del conocimiento de Anderson y Krathwohl (2001) -- factual, conceptual, procedimental, metacognitivo -- para discriminar con mayor precision. La Hess Cognitive Rigor Matrix (2009), que formaliza el cruce Bloom x DOK en una matriz de 24 celdas, es el precedente directo de esta operacion.

**Tabla de horas base por nivel cognitivo (corazon del Modo C).**

La siguiente tabla convierte el nivel cognitivo predominante de una AC en un rango de horas por SCT. Es el parametro central que alimenta la estimacion de HT en el Paso 1.

| Nivel | Verbos Bloom | Horas por SCT (rango) | Multiplicador Wake Forest | Justificacion |
|-------|-------------|----------------------|--------------------------|---------------|
| 1. Recordar / Comprender | identificar, describir, explicar, clasificar, resumir | 27 h | 1.00x | Procesamiento reproductivo. El estudiante lee, mira y reformula. La carga por hora es la del estandar SCT base |
| 2. Aplicar | resolver, demostrar, implementar, utilizar, calcular | 27-30 h | 1.00-1.11x | Requiere practica y transferencia a situaciones tipicas. El tiempo adicional proviene de ejercitacion repetida |
| 3. Analizar / Evaluar | comparar, argumentar, juzgar, diferenciar, criticar | 30-35 h | 1.11-1.30x | Requiere pensamiento estrategico, iteracion y produccion argumentativa. La lectura pasa de survey a engage (3-5x mas lenta segun Wake Forest) |
| 4. Crear | disenar, proponer, construir, investigar, componer | 33-40 h | 1.22-1.48x | Requiere produccion extendida, revision multiple y sintesis original. Combina lectura profunda + escritura investigativa + iteracion |

**Origen y honestidad epistemologica de estos rangos:**

1. *No son datos empiricos validados con estudiantes chilenos.* Son heuristicas propuestas, construidas triangulando tres fuentes: (a) los datos de tasas de lectura y escritura del Wake Forest Workload Estimator, (b) la relacion empirica nivel-tiempo del estudio CTAWC (Boring y Blackman, 2021), y (c) la dimension temporal implicita en los niveles DOK de Webb (DOK 4 presupone semanas; DOK 1 presupone minutos).

2. *El ancla es 1 SCT = 27 horas.* Esto es una definicion normativa (Res. Exenta 002140), no una estimacion. Por lo tanto, el rango no puede ser menor a 27 h/SCT: un credito siempre equivale a 27 horas de trabajo estudiantil esperado. Lo que varia es cuanto trabajo efectivo cabe en esas horas segun la complejidad cognitiva. Para niveles superiores, la misma tarea requiere mas tiempo, lo que significa que 1 SCT de trabajo en nivel 4 puede equivaler a hasta 40 horas reales si la AC demanda creacion extendida.

3. *El rango de variacion (1x a 1.48x) se deriva del Wake Forest Workload Estimator.* Los datos del `server.R` muestran que la tasa de lectura varia de 67 paginas/hora (texto facil, lectura superficial, formato paperback) a 5 paginas/hora (texto denso con conceptos nuevos, lectura profunda, formato textbook): un ratio de 13:1. La tasa de escritura varia de 0.75 horas/pagina (reflexion narrativa, sin borradores) a 10 horas/pagina (investigacion con borradores extensivos): un ratio similar. Sin embargo, una AC real no es 100% lectura ni 100% escritura al nivel mas extremo. Los multiplicadores de la tabla aplican estos ratios ponderados por la mezcla tipica de actividades en cada nivel cognitivo, no en su valor extremo.

4. *El estudio CTAWC confirma la direccion pero no provee coeficientes transferibles.* Boring y Blackman (2021) encontraron que actividades en niveles taxonomicos superiores correlacionan significativamente con mayor tiempo de trabajo estudiantil. Los rangos de la tabla son consistentes con esa evidencia sin pretender replicar sus magnitudes exactas (el contexto era universidades norteamericanas presenciales).

5. *Estos rangos deben calibrarse progresivamente.* A medida que se acumulen datos de carga real en las plataformas UMCE (logs Moodle, encuestas estudiantiles), los multiplicadores se ajustaran con evidencia local. Hasta entonces, son el mejor punto de partida disponible.

**Uso en el motor.** El nivel cognitivo predominante de la AC (el mas alto entre los seleccionados en los sliders de modalidades) determina la fila de la tabla. El multiplicador se aplica sobre la base de 27 h/SCT para estimar HT: `HT_estimado = SCT_propuesto x horas_base_nivel`. Si no hay SCT propuesto, el motor usa la carga semanal viable segun perfil (vease Paso 4) para derivar las semanas y luego los SCT.

**Cambio clave: las modalidades de trabajo NO determinan las horas totales, las DISTRIBUYEN.** Las horas totales provienen del nivel cognitivo predominante y el perfil de estudiante. Los checkboxes de modalidades son el mecanismo de distribucion proporcional de ese presupuesto total, no una fuente de horas adicionales.

**Paso 2 -- Distribucion proporcional de HT por modalidad de trabajo.** Los checkboxes de modalidades de trabajo **no suman horas independientes**: distribuyen proporcionalmente el presupuesto total de HT estimado en el paso 1. El coordinador marca las modalidades presentes en la AC y opcionalmente ajusta las proporciones entre ellas (default: distribucion equitativa entre las marcadas). Las proporciones deben sumar 100%. Por ejemplo, si se marcan tres modalidades: estudio individual 30%, produccion integrada 50%, trabajo colaborativo 20%. Las horas por modalidad se calculan como: `horas_modalidad_i = HT x proporcion_i`. La suma de todas las horas por modalidad es identica a HT (propiedad algebraica de la distribucion proporcional).

El precedente directo de esta logica es el ABC Learning Design de UCL (Young y Perovic, 2016), que usa la misma mecanica de distribucion proporcional del tiempo de aprendizaje entre tipos de actividad Laurillard. La diferencia es que en el ABC el academico trabaja con tarjetas fisicas; aqui el sistema calcula las horas resultantes automaticamente.

**Fallback por area disciplinar.** Si el coordinador no marca ninguna modalidad de trabajo, el sistema asume una distribucion generica basada en el area disciplinar del programa, sin generar error ni bloqueo:

| Area disciplinar | Estudio individual | Produccion escrita | Practica aplicada | Trabajo colaborativo | Produccion integrada |
|-----------------|--------------------|--------------------|-------------------|---------------------|---------------------|
| Ciencias | 20% | 10% | 40% | 10% | 20% |
| Humanidades | 40% | 30% | 5% | 15% | 10% |
| Educacion | 25% | 20% | 15% | 20% | 20% |
| Artes | 15% | 10% | 30% | 15% | 30% |
| Tecnologia | 15% | 10% | 35% | 10% | 30% |

Estos defaults son editables y se presentan con un aviso: "Distribucion sugerida para el area. Ajuste las proporciones segun la naturaleza especifica de la AC."

**Paso 3 -- Distribucion sincronico/asincronico/autonomo.** Los ratios sync/async/auto se aplican a cada modalidad segun su naturaleza (estudio individual tiende a ser mayoritariamente autonomo, trabajo colaborativo requiere mayor sincronismo). Cada modalidad de trabajo se mapea a un perfil Laurillard dominante, y cada perfil tiene ratios de distribucion temporal. El triple obligatorio (H_sinc, H_asinc, H_aut) se calcula como suma ponderada de los triples parciales de cada modalidad. La tabla de ratios es unica en todo el documento:

| Tipo Laurillard | Sincronico | Asincronico | Autonomo | Logica |
|----------------|------------|-------------|----------|--------|
| Adquisicion | 50% | 20% | 30% | Clase expositiva + lectura autonoma |
| Investigacion | 20% | 35% | 45% | Trabajo autonomo de busqueda + tutoria |
| Practica | 40% | 30% | 30% | Ejercitacion guiada + practica independiente |
| Produccion | 15% | 30% | 55% | Creacion individual/grupal de artefactos |
| Discusion | 35% | 45% | 20% | Debates sincronicos + foros asincronicos |
| Colaboracion | 30% | 50% | 20% | Trabajo grupal asincrono + sesiones coordinacion |

El mapeo de modalidades de trabajo a tipos Laurillard dominantes es:

| Modalidad de trabajo | Tipo Laurillard dominante |
|---------------------|--------------------------|
| Estudio individual | Adquisicion |
| Produccion escrita | Produccion |
| Practica aplicada | Practica |
| Trabajo colaborativo | Discusion + Colaboracion (promedio) |
| Produccion integrada | Produccion + Investigacion (promedio) |

Estos ratios son heuristicas de diseno, no datos empiricos validados. Se documentan transparentemente como tales. Los ratios se ajustan por perfil de estudiante: postgrado incrementa asincronismo y autonomia; pregrado incrementa sincronismo. Estas diferencias se fundamentan en el marco heutagogico para educacion de adultos y en el modelo virtual UMCE que define la flexibilidad como pilar (Garrido, 2024; DIDOC, 2025).

El resultado de este paso es el triple obligatorio (H_sinc, H_asinc, H_aut) cuya suma es HT. El sistema verifica que H_aut se encuentre en el rango 25-40% de HT (restriccion institucional Doc. N. 004-2020); si el resultado cae fuera del rango, emite una advertencia al coordinador sin bloquear el calculo.

**Paso 4 -- Creditos y duracion.** `SCT = ceil(HT / 27)`. La duracion en semanas se propone a partir de la carga semanal viable segun perfil de estudiante (pregrado: hasta 12 hrs/semana por AC; postgrado: hasta 10 hrs/semana; educacion continua: hasta 8 hrs/semana), ajustable por el usuario.

#### 4.3.3. Comportamiento con SCT fijo (CUECH Subete y formatos equivalentes)

Cuando se selecciona un formato con SCT predeterminado (actualmente CUECH Subete; aplicable a cualquier otro formato futuro con creditos fijos), el Modo C invierte su logica:

- **SCT queda fijo en 2** (54 horas totales). El sistema no estima creditos: los toma como dato.
- **El motor distribuye las 54 horas** entre las modalidades de trabajo seleccionadas, usando los niveles cognitivos marcados para ponderar la distribucion proporcional. Las modalidades con nivel cognitivo mas alto reciben mayor proporcion del presupuesto horario.
- **El boton de accion cambia** de "Estimar SCT" a "Distribuir horas".
- **Banner visible permanente**: "SCT fijo: 2 creditos (54 h). El sistema sugerira como distribuir las horas segun el perfil cognitivo seleccionado."
- **Los pasos 3 y 4 del motor de calculo se preservan**: la distribucion sync/async/auto y la generacion del triple obligatorio operan igual, solo que parten de HT = 54 en vez de un HT estimado.

Esta inversion preserva la restriccion institucional (CUECH Subete no se recalcula) y al mismo tiempo aprovecha la logica del Modo C para fundamentar la distribucion interna de la carga. El mismo comportamiento aplica automaticamente a cualquier otro formato que defina SCT fijos en el futuro.

#### 4.3.4. Vista de programa

El coordinador puede agregar multiples ACs y asignarlas a semestres. El sistema genera:

- Carga por semestre con semaforos de sostenibilidad.
- Balance de complejidad cognitiva por semestre (evitar concentrar toda la complejidad alta en un periodo).
- Informe unificado con estructura de dos bloques (seccion 7).
- "Sobre presupuestario" para cada AC: un paquete de datos que alimenta el Planificador Curricular (M3) con horas por modalidad, nivel cognitivo dominante, perfil Laurillard dominante y tolerancia de +-10%.

---

## 5. Fundamentacion teorica

Cada decision de diseno se sustenta en marcos especificos. El desarrollo completo se encuentra en `concepto-calculadora-sct-v2.md`; aqui se sintetiza la cadena de razonamiento.

| Decision de diseno | Marco teorico | Funcion en el sistema |
|-------------------|---------------|----------------------|
| Formula canonica unica SCT = ceil(HT/27) con variantes de calculo de HT por modo | Manual SCT-Chile (CRUCH, 2015); Res. Exenta 002140 (UMCE, 2011) | Garantiza que los tres modos produzcan resultados comparables y un triple (H_sinc, H_asinc, H_aut) consistente |
| Pedir modalidades de trabajo a nivel meso, no actividades concretas de aula | van den Akker (2003), nivel meso curricular | Mantiene la frontera M1-M3: la calculadora opera con descriptores del plan de estudios, no con el syllabus ni la planificacion de clases |
| Distribuir HT proporcionalmente entre modalidades en vez de sumar horas independientes | ABC Learning Design (Young y Perovic, 2016); Laurillard (2012) | Evita solapamiento de horas: los checkboxes distribuyen un presupuesto, no crean horas nuevas |
| Presentar al usuario clasificacion en verbos de Bloom agrupados en 4 niveles | Anderson y Krathwohl (2001), taxonomia revisada | Bloom es la lingua franca del diseno curricular en Chile (PAC, resoluciones, guias UGCI). Los 6 niveles originales se agrupan en 4 para simplificar la interfaz sin perder discriminacion |
| Mapear niveles Bloom a DOK como motor interno de calculo | Webb (1997, 2002), Depth of Knowledge | DOK incorpora dimension temporal implicita: DOK 4 presupone trabajo sostenido en semanas, no minutos |
| Cruzar DOK con dimension del conocimiento | Anderson y Krathwohl (2001), 4 tipos de conocimiento | La matriz 4x4 discrimina con mayor precision: "aplicar procedimiento" demanda tiempos distintos que "aplicar concepto" |
| Precedente del cruce Bloom x DOK | Hess (2009), Cognitive Rigor Matrix | El motor adapta la CRM al dominio temporal: cada celda se asocia a un rango de horas |
| Clasificar tipos de aprendizaje como puente M1-M3 | Laurillard (2012), 6 tipos de aprendizaje | En M1 describe el perfil abstracto; en M3 clasifica e-actividades concretas |
| Calibrar horas base por tipo de actividad | Barre y Esarey (2016-2020), Wake Forest Workload Estimator | Tiempos empiricos derivados de revision de literatura, ajustados por nivel DOK y tipo de conocimiento |
| Justificar que nivel cognitivo predice carga | Boring y Blackman (2021), CTAWC | Unico estudio publicado que valida empiricamente la relacion nivel taxonomico-tiempo. Provee la justificacion empirica del supuesto central del Modo C |
| Distribuir horas en sync/async/auto | EADTU (2018), UNESCO-IESALC (2020) | Fundamentan la triparticion; los ratios especificos por tipo Laurillard son heuristicas de diseno transparentes, no datos empiricos |
| Estimar carga sin datos historicos | Manual SCT-Chile (CRUCH, 2015), FAQ 5, p. 109 | Autoriza estimacion prospectiva desde "experiencia institucional" y "estrategia pedagogica". El Modo C operacionaliza esa alternativa |
| Defaults por area disciplinar cuando no se marcan modalidades | Practica institucional UMCE; perfiles CINE/ISCED por campo de estudio | Evita bloqueo del sistema y provee un punto de partida razonable para coordinadores menos familiarizados con la herramienta |

---

## 6. Restricciones institucionales (aplican a los tres modos)

Invariantes del sistema que ningun modo altera:

| Restriccion | Valor | Fuente |
|------------|-------|--------|
| Equivalencia credito | 1 SCT = 27 hrs cronologicas | Res. Exenta 002140 (UMCE, 2011) |
| Formula canonica | `SCT = ceil( HT / 27 )` | Manual SCT-Chile, CRUCH |
| Calculo de HT | Varia por modo (vease seccion 3) | Diseno del sistema |
| Triple obligatorio | Todo modo emite (H_sinc, H_asinc, H_aut) con H_sinc + H_asinc + H_aut = HT | Regla de consistencia interna |
| Redondeo | ceil (al entero superior) | Criterio operativo UGCI |
| CUECH Subete | 2 SCT fijos (54 h), 16 semanas; Modo C distribuye horas en vez de estimar SCT | Restriccion externa, no se recalcula |
| Trabajo autonomo | 25-40% de la carga total | Doc. N. 004-2020, Dir. Docencia |
| Doble formato salida | UGCI bipartito (HP/HA) + extendido tripartito (sync/async/auto) | HP = H_sinc; HA = H_asinc + H_aut |

**Perfiles de estudiante** (valores por defecto ajustables): pregrado hasta 45 hrs/semana, 5-7 ACs concurrentes, mayor sincronismo; postgrado 10-15 hrs/semana, 2-4 ACs, mayor autonomia; educacion continua 5-8 hrs/semana, generalmente 1 AC.

---

## 7. Informe imprimible unificado

Todos los modos producen un informe con la misma estructura de dos bloques. Esto garantiza que el producto final sea comparable y adjuntable al PAC independientemente de como se haya calculado.

### Bloque 1 -- Resultado PAC (identico en los tres modos)

Este bloque contiene los datos que van al PAC y a la resolucion exenta. Su estructura es la misma independientemente del modo utilizado para calcular.

| Campo | Descripcion | Calculo |
|-------|-------------|---------|
| Curso | Nombre de la AC | Input del usuario |
| Programa | Nombre del programa al que pertenece | Input del usuario |
| SCT | Creditos calculados | `ceil(HT / 27)` |
| HT | Horas totales cronologicas | Segun modo (A, B o C) |
| HS/sem | Horas sincronicas por semana | Modo A/B: input directo. Modo C: `H_sinc / NS` |
| HAs/sem | Horas asincronicas por semana | Modo A/B: input directo. Modo C: `H_asinc / NS` |
| HAut/sem | Horas autonomas por semana | Modo A/B: input directo. Modo C: `H_aut / NS` |
| NS | Semanas | Input del usuario (o derivado del formato) |
| HP (UGCI) | Horas presenciales formato bipartito | `= HS/sem x NS` (equivale a H_sinc total) |
| HA (UGCI) | Horas autonomas formato bipartito | `= (HAs/sem + HAut/sem) x NS` (equivale a H_asinc + H_aut total) |

**Verificacion automatica.** El informe verifica que `HP + HA = HT` y que `H_aut` este en el rango 25-40% de HT (Doc. N. 004-2020). Si alguna condicion no se cumple, el informe incluye una advertencia visible pero no bloquea la exportacion.

### Bloque 2 -- Anexo metodologico (varia por modo)

El Bloque 2 documenta como se llego al resultado. Su contenido depende del modo utilizado.

**Modo A -- Inputs directos:**
- Tipo de actividad seleccionado (expositiva, taller, seminario, proyecto, mixto)
- Horas semanales ingresadas: HS, HAs, HAut
- Formato seleccionado (semestral / modulo / bloque / CUECH Subete)
- Perfil de estudiante

**Modo B -- Tabla de ACs con subtotales:**
- Tabla con una fila por AC del semestre: nombre, tipo, HS/HAs/HAut, NS, SCT, HT
- Fila de totales: SCT_semestre, HT_semestre, carga semanal agregada
- Semaforos de carga: verde (menos de 10 hrs/semana), amarillo (10-12), rojo (mas de 12)

**Modo C -- Tabla de modalidades con conversion a formato semanal:**
- Tabla de modalidades de trabajo marcadas: modalidad, proporcion (%), nivel cognitivo, horas estimadas
- Nivel cognitivo predominante y multiplicador aplicado
- Area disciplinar del programa
- Conversion automatica a formato semanal:
  - `HS/sem = H_sinc / NS`
  - `HAs/sem = H_asinc / NS`
  - `HAut/sem = H_aut / NS`

El Modo C traduce automaticamente sus resultados al formato semanal dividiendo las horas totales por tipo entre el numero de semanas y clasificando por tipo segun el mapeo Laurillard (estudio individual se asigna a horas autonomas, trabajo colaborativo a horas sincronicas, etc.). Esta traduccion es editable por el coordinador antes de exportar, porque el mapeo por defecto es una heuristica que puede no reflejar la realidad pedagogica de una AC particular.

**Pie del informe (comun a los tres modos):**
- Formula utilizada: `SCT = ceil(HT / 27)` con `1 SCT = 27 h` (Res. Exenta 002140)
- Modo de calculo indicado (A, B o C)
- Fecha de generacion
- Aviso: "Las estimaciones son un punto de partida para la decision del comite curricular"

---

## 8. Coherencia vertical M1-M3: el sobre presupuestario

Los Modos B y C producen un "sobre presupuestario" por cada AC: horas totales y distribucion (el triple H_sinc / H_asinc / H_aut), creditos SCT, perfil Laurillard dominante (Modo C), nivel cognitivo dominante (Modo C), y tolerancia de +-10%. El Planificador (M3) despliega el sobre en e-actividades concretas del catalogo de 37 actividades. El disenador instruccional elige actividades libremente pero respeta el presupuesto total; si necesita excederlo, documenta la justificacion. La relacion es bidireccional: M3 retroalimenta M1 cuando la planificacion revela que las estimaciones necesitan ajuste. Implementacion tecnica: localStorage (JSON serializado), sin backend adicional.

---

## 9. Limitaciones y honestidad epistemologica

Esta seccion no es un descargo de responsabilidad: es una delimitacion explicita de lo que el sistema puede y no puede afirmar.

1. **Los ratios sync/async/auto son heuristicas.** La distribucion temporal por tipo Laurillard se basa en la naturaleza intrinseca de cada tipo de aprendizaje, no en mediciones empiricas de tiempo. Son transparentes, editables y sujetos a calibracion progresiva con datos institucionales.

2. **Los rangos de horas por nivel x tipo son estimaciones calibradas.** Usan el Wake Forest Workload Estimator como base, pero no han sido validados en contexto chileno ni con muestras de la UMCE. El estudio CTAWC confirma la direccion de la relacion (mayor nivel = mayor tiempo), pero no provee coeficientes directamente transferibles al contexto latinoamericano.

3. **La clasificacion automatica de verbos tiene limitaciones.** Es un match de string contra una tabla de verbos clasificados por nivel Bloom. Verbos compuestos, ambiguos, o formulados en estilo no estandar pueden clasificarse incorrectamente. Por eso el sistema permite al coordinador corregir la clasificacion sugerida. La traduccion Bloom-DOK no es biunivoca: un mismo verbo puede corresponder a diferentes niveles DOK segun contexto.

4. **El sistema sugiere, no prescribe.** La decision final es del comite curricular. Las estimaciones del Modo C son un punto de partida fundamentado, no un veredicto. El coordinador puede ajustar cualquier valor.

5. **El Modo C es propuesta teorica original sin validacion empirica propia.** La relacion entre nivel cognitivo y horas de trabajo estudiantil no ha sido validada con datos de estudiantes chilenos. El vacio en la literatura es genuino: a abril de 2026, no se ha publicado un modelo que conecte formalmente el nivel taxonomico de una competencia con el tiempo que un estudiante necesita para alcanzarla. Esta propuesta es un primer intento.

6. **Los perfiles de estudiante son tipificaciones.** Un "estudiante de postgrado" de la UMCE puede tener 5 horas semanales disponibles o 30, segun su situacion laboral y personal. Los parametros reflejan el caso modal, no la variabilidad real.

7. **El sistema no reemplaza la Etapa 1 de la Guia UGCI.** Para programas existentes con cohortes previas, la encuesta a estudiantes y docentes sigue siendo el metodo preferente. El Modo C cubre el caso que la guia no cubre: programas nuevos sin datos historicos. A medida que las cohortes se acumulen, los datos de encuesta deben reemplazar progresivamente las estimaciones.

8. **Los defaults por area disciplinar son aproximaciones institucionales.** La distribucion generica de modalidades de trabajo por area (ciencias, humanidades, educacion, artes, tecnologia) refleja tendencias gruesas, no la realidad de cada programa. Existen para evitar bloqueos del sistema, no como verdades disciplinares.

9. **El modelo proporcional asume independencia entre modalidades.** La distribucion proporcional del ABC Learning Design trata las modalidades como particiones del tiempo total. En la practica, algunas modalidades se solapan (un proyecto puede incluir estudio individual y trabajo colaborativo). El modelo simplifica esta complejidad a favor de la operabilidad; el coordinador puede ajustar proporciones para reflejar la realidad de su AC.

---

## 10. Consideraciones tecnicas

**Stack.** Se preserva irrompible: HTML + vanilla JS + Tailwind CDN. Sin React, sin frameworks de estado, sin dependencias npm nuevas. Todo client-side. Datos de referencia (verbos Bloom, matriz DOK, tablas Laurillard, defaults por area disciplinar) como constantes JS o archivos JSON en `/shared/`.

**Arquitectura.** Los tres modos se presentan como tabs o radio cards al inicio del wizard. Cada modo tiene su flujo de pasos pero comparten componentes de visualizacion: `renderDonut()`, `renderSemaforo()`, `renderWeeklyBars()` se preservan con ajustes minimos. El informe de dos bloques (seccion 7) se genera por `renderReport()`, compartido por los tres modos, que recibe el triple (H_sinc, H_asinc, H_aut) y los metadatos del modo para construir el Bloque 2.

**Persistencia.** localStorage para programas en progreso y para el sobre presupuestario que consume M3. Exportacion JSON para compartir entre usuarios. Sin backend.

**Migracion.** La v1 se convierte en el Modo A. Las funciones existentes (`bindInputs()`, `updatePreview()`, `runCalc()`, `updatePresentation()`, `runVerification()`) se preservan como base. Los Modos B y C se construyen como modulos adicionales que reutilizan logica y componentes visuales.

---

## 11. Comparativa de modos

| Dimension | Modo A | Modo B | Modo C |
|-----------|--------|--------|--------|
| Alcance | 1 actividad curricular | 1 semestre (varias ACs) | Programa completo |
| Calculo de HT | (HS + HAs + HAut) x NS | Sigma HT_i de cada AC | Estimado desde nivel cognitivo, distribuido proporcionalmente |
| Entrada de horas | Manual (con tipo de actividad opcional como sugerencia) | Manual por fila (con sugerencias) | Inferida desde nivel cognitivo y modalidades de trabajo |
| Taxonomia visible | No | No | Bloom 4 niveles (interfaz) + DOK (interno) |
| Modalidades de trabajo | No | No | 5 modalidades meso + proporciones |
| Vista semestre | No | Si, con semaforos | Si, con semaforos + balance cognitivo |
| Sobre presupuestario | No | Si | Si (con perfil Laurillard) |
| CUECH Subete | SCT fijo, calcula horas | SCT fijo, calcula horas | SCT fijo, distribuye horas (logica invertida) |
| Tiempo requerido | 3-5 minutos | 10-15 minutos | 15-25 minutos |
| Fundamentacion teorica | Formula SCT basica | Formula SCT + carga agregada | Bloom + DOK + Laurillard + ABC Learning Design + Wake Forest |
| Para quien | Coordinador con prisa | Coordinador verificando semestre | Coordinador disenando programa nuevo |
| Informe de salida | 2 bloques (inputs directos) | 2 bloques (tabla ACs) | 2 bloques (modalidades + conversion semanal editable) |

---

## 12. Conexion institucional

La propuesta de la UGCI (Miguel Angel Pardo, 08-abr-2026) de incorporar tablas de especificacion por evaluacion sumativa vinculadas a niveles competenciales (SSIC, Doc. N. 09) converge con la direccion del Modo C. Ambas propuestas comparten el supuesto de que el nivel de la competencia determina la estructura de la evaluacion y la carga asociada. La diferencia es de alcance: el SSIC opera ex-post (verificando logro de competencias en cohortes existentes); el Modo C opera ex-ante (estimando carga antes de que la cohorte exista). Son instrumentos complementarios.

---

## 13. Referencias bibliograficas

Anderson, L. W. y Krathwohl, D. R. (Eds.). (2001). *A taxonomy for learning, teaching, and assessing: A revision of Bloom's taxonomy of educational objectives*. Longman.

Barre, E. y Esarey, J. (2016-2020). *Rice University Course Workload Estimator*. Center for Teaching Excellence, Rice University. https://cte.rice.edu/workload

Boring, A. y Blackman, K. (2021). Using a course time and workload calculator for curriculum design. *International Journal for Academic Development*, 26(3), 310-322.

Consejo de Rectores de las Universidades Chilenas [CRUCH]. (2015). *Manual para la implementacion del Sistema de Creditos Academicos Transferibles SCT-Chile* (3.a ed.). CRUCH.

European Association of Distance Teaching Universities [EADTU]. (2018). *Quality assurance and recognition in online, open, flexible and technology-enhanced education*. EADTU.

Garrido, M. (2024). *Modelo de formacion virtual UMCE*. Universidad Metropolitana de Ciencias de la Educacion.

Hess, K. K. (2009). *Cognitive Rigor Matrix*. National Center for the Improvement of Educational Assessment.

Laurillard, D. (2012). *Teaching as a design science: Building pedagogical patterns for learning and technology*. Routledge.

UNESCO-IESALC. (2020). *Hacia el acceso universal a la educacion superior: tendencias internacionales*. UNESCO.

Universidad Metropolitana de Ciencias de la Educacion [UMCE]. (2011). *Resolucion Exenta N. 002140*: Fija el valor del credito SCT en 27 horas cronologicas. UMCE.

Universidad Metropolitana de Ciencias de la Educacion [UMCE], Direccion de Docencia. (2020). *Doc. N. 004-2020*: Orientaciones para la elaboracion de PAC en modalidad virtual. UMCE.

Universidad Metropolitana de Ciencias de la Educacion [UMCE], Direccion de Docencia. (2025). *Orientaciones para el diseno de programas virtuales*. UMCE.

Unidad de Gestion Curricular Institucional [UGCI]. (2026). *Guia de Calculo SCT-Chile UMCE* (borrador). UMCE.

van den Akker, J. (2003). Curriculum perspectives: An introduction. En J. van den Akker, W. Kuiper y U. Hameyer (Eds.), *Curriculum landscapes and trends* (pp. 1-10). Kluwer.

Webb, N. L. (1997). *Criteria for alignment of expectations and assessments in mathematics and science education* (Research Monograph No. 6). NISE, University of Wisconsin-Madison.

Webb, N. L. (2002). Depth-of-knowledge levels for four content areas. Documento inedito. Wisconsin Center for Education Research.

Young, C. y Perovic, N. (2016). Rapid and creative course design: As easy as ABC? *Procedia - Social and Behavioral Sciences*, 228, 390-395.

---

*Documento consolidado v3.1 (post-auditoria de coherencia). Los tres modos coexisten: ninguno reemplaza ni descarta a los otros. El Modo A es la puerta de entrada rapida; el Modo B agrega la vision semestral que faltaba; el Modo C es el aporte teorico original. La decision de cual usar la toma el coordinador segun su necesidad concreta. La formula es una sola (SCT = ceil(HT/27)); lo que varia es como se calcula HT.*
