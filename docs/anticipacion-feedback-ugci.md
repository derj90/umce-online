# Anticipación de feedback UGCI — Páginas de virtualización
**Fecha análisis**: 7 de abril de 2026  
**Rol adoptado**: Equipo UGCI (Miguel Ángel Pardo, Anaysa Comesaña, Scarlette Hidalgo, Cristóbal Toro)  
**Páginas analizadas**:
- `/virtualizacion` — landing del proceso
- `/virtualizacion/fundamentos` — marco pedagógico y normativo
- `/virtualizacion/sct` — calculadora SCT (4 pasos)
- `/virtualizacion/planificador` — planificador curricular (4 pasos)

---

## Criterios de severidad

- **ALTA**: UGCI casi con certeza pedirá cambio. Afecta atribuciones, roles o proceso formal.
- **MEDIA**: Probable que lo observen. No es incorrecto, pero UGCI usaría otra terminología o énfasis.
- **BAJA**: Podrían notarlo si revisan en detalle. Inconsistencia menor o ambigüedad.

---

## PÁGINA 1 — `/virtualizacion`

### [ALTA] El "Informe de Cálculo SCT" está firmado por UDFV, pero la Guía SCT es de UGCI

En la Calculadora SCT (Etapa 3, presentación formal), el documento imprimible dice:
> "Unidad de Desarrollo y Formación Virtual — UMCE"

como unidad emisora. Sin embargo, la Guía de cálculo SCT es un documento de UGCI. Un informe que se adjunta a un PAC o Resolución Exenta debería validarse con sello de UGCI o al menos aclarar que es un insumo preparado por UDFV *en base a* la Guía UGCI, no un documento oficial de UGCI. La UGCI puede objetar que esto crea una confusión sobre quién valida.

### [ALTA] El Momento 1 dice "Actores: Coordinador programa, UGCI" — pero la calculadora la usa UDFV también

En la tarjeta del Momento 1 en `/virtualizacion`:
> "**Actores:** Coordinador programa, UGCI"

La calculadora misma dice en su hero: "Para quién: Coordinador de programa, UGCI". Sin embargo, el planificador dice: "Para quién: Diseñador instruccional (UDFV), Académico". La UGCI puede observar que en el Momento 1, el actor principal debería ser el **académico o coordinador de programa**, con UGCI en rol revisor/validador, no como co-usuario de la herramienta. Poner UGCI como usuario activo de una calculadora web podría malinterpretarse.

### [ALTA] El flujo en `/virtualizacion/fundamentos` (Módulo 6) dice "UGCI co-diseña" — eso no es el rol de UGCI

En el Paso 4 del flujo completo:
> "Académico + DI + **UGCI** co-diseñan usando la Planificador Curricular."

La UGCI **no co-diseña** los cursos. La UGCI **valida y aprueba** el PAC. El co-diseño curricular es entre el académico y el DI de UDFV. Esta atribución puede ser observada fuertemente: pone a la UGCI en un rol operativo (usar el planificador) que no le corresponde. Su rol en el Momento 2 es aprobar el PAC resultante, no participar en el diseño detallado.

### [MEDIA] La página atribuye la "Política de Virtualización" a las Mesas, sin mencionar que debe pasar por UGCI

Al pie de `/virtualizacion`:
> "Por mandato rectoral, tres mesas de trabajo producen la **Política de Virtualización Institucional** de la UMCE."

La UGCI puede observar que una política curricular de este tipo requiere aprobación por parte del Consejo Académico u otros órganos formales, no solo producción por las Mesas. Presentarla como "ya producida" por las Mesas puede parecer que se omite el proceso formal de aprobación donde UGCI tiene voz.

### [MEDIA] El "Momento 2 — Diseñar el PAC" lo protagoniza el Académico, pero la UGCI querría mayor protagonismo

> "**Actores:** Académico, UGCI"

El orden importa para UGCI. En el proceso institucional, la unidad académica **propone** el PAC, pero la UGCI tiene un rol más activo en definir su estructura (plantilla, contenidos mínimos, criterios). El listado sugiere que el académico lidera y la UGCI acompaña, cuando desde UGCI su rol es normativo y aprobador.

### [BAJA] La mención de "resolución exenta" sin número específico en el Momento 1

> "Se validan los créditos SCT y la distribución de horas con criterio técnico, **antes de la resolución exenta**."

La UGCI puede observar que no se aclara de qué tipo de resolución se habla (apertura de carrera, modificación de malla, apertura de asignatura virtual). Hay distintas resoluciones exentas en el proceso y podría prestarse a confusión.

### [BAJA] "DIDOC + VRA aprueban" — el flujo en /fundamentos menciona a VRA, pero UGCI dependiente de Dirección de Docencia

En el Paso 3 del flujo:
> "DIDOC + VRA aprueban. Consejo Universitario emite Resolución Exenta."

La UGCI puede querer que aparezca explícitamente el paso por UGCI antes de que DIDOC apruebe. La UGCI revisa la coherencia curricular *antes* de que el expediente suba a DIDOC para aprobación formal. Omitirla en ese paso puede interpretarse como que UGCI no tiene rol en la cadena de aprobación.

---

## PÁGINA 2 — `/virtualizacion/fundamentos`

### [ALTA] Módulo 2 — "La decisión ya está tomada" y "Plan por fases" no han sido aprobados por UGCI

> "La UMCE ya aprobó el rediseño curricular basado en competencias con SCT declarados (Resoluciones Exentas 2019). **Lo que falta es definir cómo se implementa operativamente en virtualidad.**"

Y el Plan por fases con fechas 2026-2027-2029. La UGCI puede objetar fuertemente que:
1. Las Resoluciones de 2019 aprobaron el **rediseño de programas de pregrado**, no una política de virtualización como tal.
2. El "Plan por fases" con fechas concretas (Fase 2 en 2027-28, Fase 3 en 2029+) no ha sido aprobado institucionalmente por ningún órgano. Se presenta como un plan UMCE cuando es una propuesta de Mesa 1.
3. Términos como "Microcredenciales como salidas intermedias" son propuestas aún en discusión, no política aprobada.

### [ALTA] Módulo 7 — La Guía SCT de Miguel Ángel no aparece citada como documento UGCI

En el Marco Normativo, se cita:
> "Guía Práctica SCT Chile (2007) — CRUCH  
> Manual de Implementación SCT-Chile, 2ª edición (2013) — CRUCH"

Pero en la Calculadora SCT sí aparece "Guía de cálculo SCT de la UGCI". Esta guía institucional específica (el documento que Miguel Ángel preparó y que es la base técnica de la calculadora) no aparece en el Marco Normativo de Fundamentos. La UGCI puede observar que su propio documento de referencia está omitido en la sección normativa, mientras que sí aparece en la calculadora.

### [ALTA] El rol de UGCI en "¿Quiénes participan?" es impreciso

En la descripción del rol UGCI:
> "Verifica coherencia curricular: que los créditos, competencias y módulos sean consistentes con el plan de estudios."

La UGCI puede preferir una formulación más precisa: ellos **aprueban** el PAC, no solo "verifican". El verbo "verificar" suena técnico-administrativo, cuando la atribución de UGCI incluye aprobar, rechazar o pedir modificaciones. Además, el SSIC (seguimiento a implementación curricular) es función central de UGCI y no aparece mencionado.

### [MEDIA] "Tablas de especificación por evaluación sumativa" y "nivel competencial" no aparecen — pero son el lenguaje de UGCI

La UGCI habla de evaluaciones con base en tablas de especificación vinculadas a resultados de aprendizaje por nivel de competencia. Las páginas no usan este lenguaje en ningún momento. Las "e-actividades de evaluación" del planificador son solo "cuestionarios, rúbricas, evaluaciones sumativas, autoevaluación". La UGCI puede pedir que el diseño instruccional explicite cómo las actividades evaluativas se alinean con los **niveles de logro de competencias** del PAC aprobado.

### [MEDIA] El Módulo 3 (Ucampus) asume que la UMCE adoptará modularización — UGCI no lo ha decidido

> "**La decisión ya está tomada**"

El título de la subsección sobre modularización dice esto en el Módulo 2. Pero la modularización implica cambios en los planes de estudio, acreditación, reglamentos. La UGCI puede objetar que presentar esto como "decisión tomada" cuando aún no hay política aprobada es impreciso y genera expectativas institucionales que no corresponde generar desde una herramienta UDFV.

### [MEDIA] Las Resoluciones Exentas 2019 citadas son de rediseño curricular, no de virtualización

> "Res. Exentas N° 100062 y 100241: aprueban rediseño curricular basado en competencias con SCT declarados."

La UGCI puede señalar que estas resoluciones aprobaron el modelo curricular por competencias para los programas de **pregrado regular**, no una política de virtualización. Usarlas como base normativa para virtualización puede ser cuestionado.

### [BAJA] El glosario define PIAC / PAC brevemente, pero invierte el orden conceptual

En el glosario:
> "PIAC / PAC — Plan Instruccional de Actividad Curricular / Programa de Actividad Curricular."

UGCI puede preferir que PAC aparezca primero (es el documento formal que les compete) y que la definición de PAC no se reduzca a una línea al mismo nivel que PIAC, dado que el PAC es el documento institucional central en su gestión.

### [BAJA] "Heutagogía" en el glosario como "marco para postgrado" — puede ser visto como excesivamente avanzado para política institucional

La UGCI puede no reconocer "heutagogía" como término del marco institucional UMCE. Si no aparece en ningún documento aprobado, incluirlo en el glosario de fundamentos puede generar preguntas.

---

## PÁGINA 3 — `/virtualizacion/sct`

### [ALTA] El criterio de redondeo ("entero superior") dice que fue "consensuado por la UGCI" — pero ¿fue formal?

En el paso a paso del cálculo y en el pie del informe formal:
> "Redondeo al entero superior (Math.ceil) adoptado como criterio operativo **consensuado**."
> y: "Redondeo al entero superior (Math.ceil), adoptado como criterio operativo **consensuado**."

En el pie formal:
> "**Criterio de redondeo:** Entero superior (Math.ceil), adoptado como criterio operativo consensuado."

Si este criterio no tiene un respaldo formal escrito (acta, circular, o al menos un correo de Miguel Ángel), la UGCI puede objetar que se está atribuyendo un "consenso" que no está documentado. Puede pedir o bien citar el documento donde se consensuó, o eliminar la atribución.

### [ALTA] El "Informe de Cálculo SCT" (Etapa 3) firma como "UDFV" pero se adjuntará a un PAC que aprueba UGCI

El informe imprimible dice:
> "Unidad de Desarrollo y Formación Virtual — UMCE  
> Calculadora SCT UMCE v1.0 — Producto de Mesa 1, Mesas de Virtualización 2026."

UGCI puede observar que un informe que se adjunta a un PAC (para sustentar la asignación de créditos) debería tener validación de UGCI o al menos no presentarse con sello UDFV como si fuera el documento técnico definitivo. La UGCI es quien aprueba los créditos, no la UDFV.

### [ALTA] La calculadora incluye un formato "Microcredencial" como tipo de curso — las microcredenciales no están reguladas ni aprobadas en la UMCE

> "**Microcredencial** — 5 semanas, certificación específica"

La propia página de fundamentos advierte: "Las microcredenciales no están reguladas en Chile a la fecha". Incluirlo como un formato oficial en una calculadora que produce un "Informe SCT" para adjuntar a PAC/Resolución puede ser observado fuertemente. UGCI no tiene proceso ni plantilla de PAC para microcredenciales.

### [MEDIA] La "Encuesta docente simplificada" dentro de la calculadora no refleja los instrumentos del Manual SCT-Chile

La calculadora tiene una "encuesta docente simplificada" con tipos de actividades y horas. El Manual SCT-Chile prescribe tres fuentes: encuesta a estudiantes, encuesta a académicos y encuesta a profesionales del campo. La "encuesta docente" de la calculadora es solo el segundo instrumento, pero se presenta como el mecanismo de validación. UGCI puede señalar que el instrumento real requeriría las tres fuentes.

### [MEDIA] El label "HP sincrónicas" puede ser incorrecto según la Guía UGCI

La calculadora usa "HP = Horas presenciales o sincrónicas". Dependiendo de la Guía de Miguel Ángel, HP puede tener una definición específica que incluya o excluya ciertas actividades. Si la Guía define HP como "horas pedagógicas" en un sentido más amplio (incluyendo actividades asincrónicas programadas), el label "sincrónicas" podría estar reduciendo el concepto.

### [BAJA] La Etapa 4 (verificación) llama "consistencia" a lo que en el Manual SCT se llama "validación"

El Manual SCT-Chile habla de "validación" de la carga. La calculadora usa "verificación de consistencia". UGCI puede preferir el término oficial del Manual.

---

## PÁGINA 4 — `/virtualizacion/planificador`

### [ALTA] El planificador "produce un PIAC" — pero el PIAC es un documento institucional con plantilla propia de UGCI

> "Produce: PIAC con e-actividades semana a semana"

La UGCI puede observar que el PIAC tiene una estructura formal (plantilla institucional, campos obligatorios: resultados de aprendizaje, sistema de evaluación, bibliografía, etc.). El planificador produce una distribución de horas por e-actividad, que es un **insumo** del PIAC, no el PIAC en sí. Llamar "PIAC" al output del planificador puede generar confusión sobre qué documento se entrega a la UGCI.

### [ALTA] El Momento 3 dice "Después de aprobar el PAC en UGCI" — pero ¿el planificador lo usa alguien antes también?

El hero del planificador:
> "Momento 3 del flujo — **Después de aprobar el PAC en UGCI**"

Sin embargo, en el flujo de fundamentos (Paso 2) se dice que el Planificador Curricular se usa para "estimar la carga" en la fase de factibilidad (antes de que UGCI apruebe el PAC). Esto es una inconsistencia: el planificador se anuncia como herramienta del Momento 3 (post-aprobación), pero en el flujo se usa también en el Momento 1/2. La UGCI puede pedir que se aclare en qué momento exacto entra el planificador.

### [ALTA] El planificador valida contra "3 pilares del modelo virtual UMCE" — esto no es un estándar UGCI aprobado

El resultado del planificador (paso 4) verifica:
> "que el diseño cumpla con los **3 pilares del modelo virtual UMCE** (interacción, colaboración, flexibilidad)"

Los 3 pilares son del modelo pedagógico UDFV (citado como DIDOC/UDFV 2025). No son un estándar aprobado por UGCI. Presentarlo como criterio de validación del PIAC puede llevar a que la UGCI objete que el criterio no está en los documentos formales que ellos administran (el PAC, los resultados de aprendizaje).

### [MEDIA] El planificador no vincula actividades con resultados de aprendizaje del PAC

El planificador pide: nombre del módulo, créditos SCT, semanas, tipo de estudiantes, formato, y luego seleccionar e-actividades por categoría. En ningún momento vincula las actividades con los **resultados de aprendizaje** declarados en el PAC. La UGCI puede señalar que un diseño instruccional coherente con el PAC debería mostrar qué resultado de aprendizaje justifica cada e-actividad, especialmente las evaluativas.

### [MEDIA] El planificador no pide datos del PAC aprobado como input

Para ser coherente con el flujo (Momento 3 = post-aprobación PAC), el planificador debería pedirle al usuario que ingrese los datos del PAC aprobado (resultados de aprendizaje, al menos). Sin ese input, no hay forma de verificar que el diseño es coherente con lo que la UGCI aprobó.

### [BAJA] El planificador produce un "export PDF" sin membrete institucional formal

El PDF exportado no tiene un encabezado con datos del programa, resolución exenta, ni firma docente/DI. UGCI puede señalar que el documento carece de los campos mínimos para ser un insumo formal del expediente curricular.

---

## Resumen ejecutivo de observaciones

| # | Observación | Página | Severidad |
|---|-------------|--------|-----------|
| 1 | "Informe SCT" firmado por UDFV, no por UGCI | SCT + flujo | ALTA |
| 2 | UGCI aparece como "co-diseñadora" del PIAC — no es su rol | Fundamentos M6 | ALTA |
| 3 | Plan por fases (2026-2029) presentado como política aprobada | Fundamentos M2 | ALTA |
| 4 | Criterio de redondeo "consensuado" sin respaldo documental citado | SCT | ALTA |
| 5 | Microcredencial como formato de calculadora (no regulado) | SCT | ALTA |
| 6 | El planificador "produce el PIAC" — en realidad produce un insumo del PIAC | Planificador | ALTA |
| 7 | Guía SCT de UGCI no citada en Marco Normativo de Fundamentos | Fundamentos M7 | ALTA |
| 8 | Validación del planificador por "3 pilares UDFV" en vez de resultados de aprendizaje del PAC | Planificador | ALTA |
| 9 | Política de Virtualización presentada como "ya producida" sin proceso de aprobación | Landing | MEDIA |
| 10 | Terminología de competencias ausente (tablas de especificación, nivel competencial) | Todas | MEDIA |
| 11 | Planificador no vincula actividades con resultados de aprendizaje del PAC | Planificador | MEDIA |
| 12 | Planificador no tiene PAC aprobado como input | Planificador | MEDIA |
| 13 | Resoluciones 2019 citadas como base para virtualización (son de rediseño curricular) | Fundamentos M7 | MEDIA |
| 14 | SSIC (seguimiento implementación curricular) no aparece en ninguna página | Todas | MEDIA |
| 15 | Rol UGCI descrito como "verifica" en vez de "aprueba" | Fundamentos M6 | MEDIA |
| 16 | HP label como "sincrónicas" puede no coincidir con definición Guía UGCI | SCT | MEDIA |
| 17 | PDF exportado sin campos formales del expediente curricular | Planificador | BAJA |
| 18 | Glosario define PAC/PIAC en orden inverso con insuficiente detalle de PAC | Fundamentos | BAJA |
| 19 | "Heutagogía" en glosario sin respaldo en documento institucional | Fundamentos | BAJA |
| 20 | UGCI omitida del paso de aprobación en cadena DIDOC-VRA | Fundamentos M6 | BAJA |

---

## Lo que probablemente va a decir Miguel Ángel en concreto

1. **"La calculadora no puede emitir documentos con sello UDFV para adjuntar a un PAC. Ese es un documento que pasa por nuestra unidad."** — Observación sobre el Informe Cálculo SCT (Etapa 3 de /sct).

2. **"El PIAC tiene una estructura institucional. Lo que produce el planificador es un insumo, no el PIAC propiamente tal."** — Distinción que UGCI va a hacer con precisión.

3. **"Las microcredenciales no existen como proceso en la UMCE. No deberíamos incluirlas como un formato validable."** — Puede pedir que se retire esa opción hasta que haya política aprobada.

4. **"El Plan por fases que aparece acá (Fase 2 - 2027, Fase 3 - 2029) no está aprobado. Es una propuesta de trabajo, no un compromiso institucional."** — Probable que pida cambiar el lenguaje a "propuesta" o eliminar las fechas.

5. **"¿Dónde está la Guía que nosotros usamos como base? No aparece citada en la parte normativa."** — Notará la omisión de su propio documento en el marco normativo de Fundamentos.

---

*Análisis elaborado con base en lectura de las 4 páginas HTML y el rol/función de la UGCI (aprobación PAC, gestión SCT, coherencia curricular, SSIC). No refleja opinión del equipo UGCI — es una anticipación de perspectiva para preparar respuestas.*
