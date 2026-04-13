# SCT en Cursos Virtuales y Modularización — Estado de avance

> **Fecha:** 13 de abril de 2026
> **Contexto:** Solicitud del Director de Docencia Domingo Pavez González sobre avances en definiciones de SCT para cursos virtuales y modularización
> **Elabora:** David Reyes Jofré, Coordinador UDFV

---

## 1. Resumen ejecutivo

La UDFV ha estado desarrollando un conjunto de herramientas digitales para apoyar el diseño de cursos virtuales con criterio SCT. Estas herramientas están disponibles como versiones de trabajo en [umce.online/virtualizacion](https://umce.online/virtualizacion) y se han ido construyendo en diálogo con la UGCI, que elabora paralelamente la Guía de Cálculo SCT-Chile UMCE. La Mesa 1 de Virtualización (Modelo Instruccional, Calidad y Aprendizaje) ha funcionado como espacio de discusión y validación de estos avances, con aportes de académicos de distintas unidades.

El trabajo está en desarrollo. Lo que existe hoy son prototipos funcionales que permiten calcular créditos, planificar la distribución de horas en actividades concretas y evaluar la calidad de un curso virtual. Lo que falta es la validación institucional formal: una mesa de trabajo UGCI-UDFV, presentación a consejeros y articulación con DAC y DIPOS para la estructura de programas híbridos y e-learning.

---

## 2. Marco normativo vigente

| Documento | Año | Contenido clave |
|-----------|-----|----------------|
| CRUCH — Manual SCT-Chile, 2.ª ed. | 2013 | Métodos top-down/bottom-up, instrumentos de encuesta, rango 24-31 hrs/crédito |
| UMCE — Resolución Exenta N° 002140 | 2011 | Fija 1 crédito SCT = 27 horas cronológicas de trabajo estudiantil |
| UMCE — Resolución Exenta N° 100062 | Ene 2019 | Aprueba rediseño curricular basado en competencias, modularizado, con SCT |
| UMCE — Resolución Exenta N° 100241 | Mar 2019 | Complementa y ratifica la modularización como decisión institucional |
| MINEDUC — Ordinario N° 06/13.191 | 2024 | Límite máximo del 30% de virtualización en pregrado |
| CNA — Criterios programas a distancia | 2017 | Diario Oficial N° 41.925 — coherencia SCT, diseño instruccional documentado |

### Fórmula institucional UMCE

```
SCT = (HS + HAs + HAut) × NS / 27
```

- HS = Horas sincrónicas por semana (sesiones en tiempo real)
- HAs = Horas asincrónicas por semana (actividades con interacción, no en tiempo real)
- HAut = Horas de trabajo autónomo por semana (trabajo individual sin mediación)
- NS = Número de semanas del curso o módulo
- 27 = Horas cronológicas por crédito (Res. Exenta N° 002140)

Derivación: 45 horas/semana × 18 semanas = 810 horas semestrales ÷ 30 créditos = 27 horas por crédito.

La distinción entre horas asincrónicas y autónomas no es terminológica: tiene implicancias para el diseño instruccional (las asincrónicas requieren diseño de interacción y moderación docente) y para el presupuesto (según la normativa institucional, las horas de trabajo autónomo, al ser propias del estudiante, no contemplan ser remuneradas). La regla operativa es que las horas autónomas representen aproximadamente un tercio de la carga total.

---

## 3. Coordinación con UGCI

La UGCI es la unidad responsable de la consistencia curricular del cálculo SCT. La UDFV se ha coordinado con ella desde marzo de 2026 para que las herramientas digitales de diseño instruccional sean coherentes con los criterios de la Guía de Cálculo que la UGCI está elaborando.

### Cronología de interacciones

| Fecha | Evento |
|-------|--------|
| 26-mar-2026 | Sesión Mesa 1: Miguel Ángel Pardo (UGCI) presenta el enfoque SCT-Chile y se compromete a compartir la Guía de Cálculo |
| 06-abr-2026 | Miguel Ángel comparte la **Guía de Cálculo SCT-Chile UMCE** (borrador, Google Doc) con David |
| 07-abr-2026 | David responde mostrando las herramientas en umce.online/virtualizacion, construidas tomando como base la Guía |
| 08-abr-2026 | Miguel Ángel califica el avance como "gigantesco", propone **mesa de trabajo UGCI-UDFV**, plantea incorporar tablas de especificación por evaluación sumativa vinculadas a niveles competenciales (SSIC) |
| 09-abr-2026 | Osvaldo Molina (Secretario Académico DEC, integrante Mesa 1) prueba la calculadora y el planificador, informa que "constituyen un aporte significativo para la elaboración de los programas" |
| 13-abr-2026 | Reunión de Equipo de Virtualización: se acuerda reunión con DAC, UGCI y DIPOS para estructura de programas |
| 13-abr-2026 | Director de Docencia Domingo Pavez solicita informe de avances en SCT y modularización |

### Rol de la UGCI en el flujo

La UGCI produce la Guía de Cálculo SCT-Chile UMCE, que es el instrumento de referencia para estimar la carga de trabajo estudiantil. Revisa la consistencia metodológica del cálculo propuesto por las unidades académicas y aprueba el PAC (Programa de Actividad Curricular), que fija oficialmente los créditos, las horas y los resultados de aprendizaje. El diseño instruccional posterior (cómo se distribuyen esas horas en actividades concretas dentro de Moodle) es responsabilidad de la UDFV. El criterio operativo de redondeo es ceil: si el resultado del cálculo es 4.2, se declaran 5 créditos.

### Personas UGCI involucradas

- Miguel Ángel Pardo Benavidez — interlocutor principal Mesa 1
- Anaysa Comesaña Fernández — equipo UGCI
- Scarlette Hidalgo, Cristóbal Toro — equipo UGCI

### Documento base UGCI

**Doc. N° 004-2020**, Dirección de Docencia (agosto 2020): orientaciones para PAC virtuales. Define la estructura del cálculo SCT con distribución en horas sincrónicas, asincrónicas y autónomas sobre 17 semanas concentradas.

---

## 4. Flujo institucional: los 5 Momentos

El proceso de diseñar un curso virtual desde la definición de créditos hasta su operación en plataforma se puede organizar en 5 momentos secuenciales. Esta secuencia no es un estándar aprobado todavía, sino una propuesta de trabajo que la UDFV ha ido construyendo para ordenar la conversación con la UGCI y con los académicos.

```
M1 → M2 → M3 → M4 → M5
```

**Momento 1 — Definir créditos y horas (SCT).** La unidad académica estima la carga de trabajo estudiantil usando la fórmula institucional y la Guía UGCI. La UDFV ha desarrollado una calculadora web que digitaliza este paso: el usuario ingresa los tres tipos de horas —sincrónicas (sesiones en tiempo real), asincrónicas (actividades con interacción sin coincidencia horaria) y autónomas (trabajo individual sin mediación docente)— junto con el número de semanas, y obtiene los créditos con verificación de consistencia. Este prototipo está disponible en umce.online/virtualizacion pero aún no ha sido validado formalmente por la UGCI como instrumento oficial.

**Momento 2 — Diseñar y aprobar el PAC.** El académico propone el PAC y la UGCI lo aprueba mediante Resolución Exenta. Este momento es enteramente responsabilidad de la UGCI y las unidades académicas. La UDFV no interviene aquí.

**Momento 3 — Diseñar el PIAC.** Una vez aprobado el PAC, el diseñador instruccional de la UDFV trabaja con el docente para traducir los créditos en un plan instruccional concreto: qué actividades va a realizar el estudiante, cuánto tiempo le tomará cada una, qué es sincrónico y qué es asincrónico, qué se evalúa y cómo. La UDFV ha desarrollado un planificador web que guía este proceso en 4 pasos, con un catálogo de 37 e-actividades y tiempos referenciales basados en fuentes internacionales. El planificador está en versión de trabajo y se ha ido ajustando con retroalimentación de integrantes de la Mesa 1.

**Momento 4 — Implementar en LMS y evaluar calidad.** El curso se monta en Moodle y se evalúa contra un marco de calidad. La UDFV trabaja con el Marco Evaluativo de Sepúlveda Parrini (2024), un instrumento de 77 indicadores en 6 dimensiones desarrollado en el proyecto UMC20992, que toma como base internacional el OSCQR (Online Learning Course Design Review Scorecard, SUNY) y agrega dos dimensiones propias: perspectiva de género y equidad (D5) y corresponsabilidad social y cuidados digitales (D6). Existe un prototipo de sistema QA web y una rúbrica de evaluación, ambos en desarrollo.

**Momento 5 — Monitorear y retroalimentar.** Un sistema de monitoreo automatizado revisa periódicamente los cursos activos en Moodle para detectar problemas de estructura, actividad o configuración. La UDFV tiene un prototipo de auditor nocturno con 18 reglas de verificación que se ejecuta desde el VPS institucional. Está en fase de calibración. Los datos de este momento retroalimentan el diseño del siguiente periodo.

---

## 5. Herramientas digitales en desarrollo

La UDFV ha estado construyendo un conjunto de herramientas web para apoyar cada momento del flujo. Todas están disponibles como versiones de trabajo en umce.online/virtualizacion. Ninguna tiene aún validación institucional formal.

### 5.1 Calculadora SCT

Toma como base la Guía de Cálculo SCT-Chile de la UGCI (borrador abril 2026) y la fórmula fijada por la Resolución Exenta N° 002140. El usuario ingresa por separado los tres tipos de horas de trabajo estudiantil: horas sincrónicas (sesiones en tiempo real con coincidencia horaria docente-estudiante), horas asincrónicas (actividades estructuradas con interacción y moderación docente, pero sin coincidencia horaria) y horas de trabajo autónomo (lectura, estudio, reflexión individual sin mediación docente). La calculadora aplica la fórmula, verifica que la carga semanal total esté dentro del rango sostenible (máximo 12 horas por semana por módulo) y aplica el criterio de redondeo ceil que usa la UGCI.

El desglose en tres tipos permite identificar dos proporciones clave: la proporción de trabajo autónomo (la regla operativa es que represente aproximadamente un tercio de la carga total, ya que estas horas no contemplan remuneración docente según la normativa institucional) y la proporción de actividad sincrónica según el perfil de estudiante (pregrado requiere mayor presencia sincrónica; postgrado y educación continua admiten mayor asincronismo y autonomía). También permite seleccionar entre 4 tipos de unidad curricular (semestral de 18 semanas, módulo de 8, microcredencial de 5, CUECH Súbete de 16) para que el usuario vea cómo cambian los créditos según la duración.

La herramienta integra el contexto metodológico directamente en el flujo de uso: explica qué es el método compositivo, por qué se distinguen los tres tipos de horas, y cómo estimar la carga usando fuentes internacionales calibradas (Penn State HIA Estimator, Wake Forest Workload Estimator 2.0, Massey University). Las fundamentaciones académicas aparecen junto a cada decisión de diseño (perfil de estudiante, estimación de horas) en vez de estar en una sección separada, de modo que el usuario accede a la justificación en el momento en que la necesita. Incluye una bibliografía con 10 referencias que respaldan las decisiones de la calculadora. Funciona enteramente en el navegador, sin guardar datos en servidor.

### 5.2 Planificador de diseño instruccional

Un asistente de 4 pasos que parte de los créditos SCT calculados y ayuda a distribuir las horas en actividades concretas:

- **Paso 1:** El usuario define los SCT, las semanas y el perfil de estudiante (pregrado, postgrado o educación continua). Esto establece el presupuesto total de horas y las reglas de balance síncrono/asíncrono.
- **Paso 2:** El usuario selecciona actividades de un catálogo de 37 e-actividades organizadas en 7 categorías (análisis, investigación, interacción, colaboración, reflexión, insumos, evaluación). Cada actividad tiene un rango de tiempo referencial basado en fuentes internacionales calibradas (Penn State, Wake Forest, FAU, FGCU, Massey University) y en la experiencia de la UDFV.
- **Paso 3:** El usuario revisa la distribución resultante: cuántas horas van a contenido pasivo, cuántas a actividades colaborativas, cuántas son sincrónicas y cuántas asincrónicas. Un gráfico muestra el balance visual.
- **Paso 4:** El planificador ejecuta 6 verificaciones automáticas basadas en los principios del modelo virtual UMCE: que haya al menos una actividad de interacción (EC), al menos una de colaboración (ED), que el contenido pasivo no supere el 60% de la carga, que haya evaluación formativa, y que el balance síncrono/asíncrono esté dentro del rango definido para el perfil de estudiante. Este balance se verifica contra las tres categorías de horas (sincrónicas, asincrónicas y autónomas), no solo contra dos, lo que permite detectar si el diseño sobrecarga la sincronía o, al contrario, si la autonomía supera el tercio recomendado.

Los rangos de sincronía se diferencian por perfil: pregrado requiere al menos 15% de actividad sincrónica, postgrado permite hasta 50%, y educación continua permite hasta 30% (máxima flexibilidad para profesionales en ejercicio).

El planificador no genera automáticamente el curso en Moodle. Su salida es un plan de distribución de horas que el diseñador instruccional puede usar como base para el PIAC.

### 5.3 Fundamentos pedagógicos y normativos

Un documento de referencia organizado en 8 módulos que reúne el marco teórico, normativo y operativo detrás de las herramientas. Incluye el marco SCT-Chile y su aplicación en la UMCE (Módulo 1), la modularización y sus fases (Módulo 2), los 3 pilares pedagógicos del modelo virtual — interacción, colaboración y flexibilidad (Módulos 3 a 5), el catálogo de e-actividades con sus fuentes (Módulo 6), el flujo institucional de los 5 momentos (Módulo 7) y la genealogía del marco de calidad OSCQR → Sepúlveda Parrini → Mesa 1 (Módulo 8). Está pensado como documento de consulta para los integrantes de la Mesa 1 y para los equipos de diseño instruccional. Es un documento vivo que se actualiza a medida que avanzan las discusiones.

### 5.4 Sistema de aseguramiento de calidad (QA)

Presenta el Marco Evaluativo de Sepúlveda Parrini (2024), construido como parte del proyecto de investigación UMC20992. El instrumento tiene 77 indicadores organizados en 6 dimensiones: Diseño instruccional, Interacción y comunicación, Diseño de evaluación del aprendizaje, Competencias para la docencia virtual, Perspectiva de género y equidad, y Corresponsabilidad social y cuidados digitales. Las primeras 4 dimensiones se basan en el OSCQR (SUNY, 50 estándares, licencia CC BY 4.0). Las dimensiones D5 y D6 son aportes originales de la investigación UMCE y no tienen equivalente en el instrumento internacional.

La página web muestra las dimensiones, su genealogía y un prototipo de simulación de evaluación. Está en desarrollo: la evaluación real de cursos aún no se realiza a través de este sistema, sino mediante la rúbrica (ver 5.5).

### 5.5 Rúbrica de evaluación QA

Un dashboard que muestra los resultados del pilotaje realizado entre noviembre y diciembre de 2024 sobre 5 cursos de postgrado y prosecución. Permite visualizar los puntajes por dimensión y por curso. Este pilotaje fue el primer ejercicio de aplicación del Marco Evaluativo y sirvió para calibrar los indicadores y ajustar la escala Likert (0-4). La rúbrica web está en desarrollo y todavía no se usa como herramienta de evaluación regular.

---

## 6. Modularización: estado y hoja de ruta

La UMCE ya tomó la decisión institucional de modularizar (Resoluciones Exentas 100062 y 100241, 2019). Lo que está en discusión no es si se modulariza, sino cómo se implementa operativamente, en particular para los programas virtuales y e-learning.

### Qué se entiende por módulo

Según las Orientaciones de Modularización v3 (UGCI+UDFV), un módulo equivale a una asignatura o actividad curricular. Cada módulo es certificable de forma independiente, tiene créditos SCT específicos y tributa al perfil de egreso. Miguel Ángel Pardo (sesión Mesa 1, 26-mar-2026) precisó que la modularización curricular implica un itinerario formativo secuencial — un módulo tras otro —, no múltiples actividades curriculares simultáneas por semestre. En la fase de transición actual, cada actividad curricular virtualizada puede funcionar como un "módulo" con certificación propia.

### Tabla SCT-Horas-Duración

| Créditos SCT | Horas totales | Duración típica |
|-------------|---------------|-----------------|
| 1 SCT | 27 horas | ~3 semanas |
| 2 SCT | 54 horas | 5-6 semanas |
| 3 SCT | 81 horas | 8 semanas |
| 4 SCT | 108 horas | 10-11 semanas |

Carga semanal sostenible: ~10 horas/semana por módulo (máximo 12).

### Fases de implementación propuestas

| Fase | Período | Descripción |
|------|---------|-------------|
| Fase 1 | 2026 | La estructura semestral se mantiene. Cada actividad curricular completada puede generar certificación propia. Las herramientas de la UDFV están diseñadas para operar en este escenario. |
| Fase 2 | 2027-2028 | Módulos de 8 semanas apilables, microcredenciales como salidas intermedias, electivos compartidos entre programas. |
| Fase 3 | 2029+ | Movilidad interna UMCE, movilidad interinstitucional CUECH (Programa Súbete), Reconocimiento de Aprendizajes Previos (RAP). |

Las fases 2 y 3 son proyecciones a mediano plazo. La calculadora ya permite simular los 4 tipos de unidad curricular (semestral, módulo de 8 semanas, microcredencial de 5, CUECH Súbete de 16) para que los equipos académicos puedan anticipar cómo cambiaría la distribución de créditos en cada escenario.

---

## 7. Presiones externas

### CUECH

El Consorcio de Universidades del Estado ha solicitado datos sobre programas de magíster e-learning e híbridos: cuántos SCT tienen, cómo están implementados y si están acreditados. La UMCE tiene más de 1.370 estudiantes en movilidad virtual a través del Programa Súbete. Contar con herramientas que documenten el criterio SCT de los cursos virtuales permitiría responder a este tipo de solicitudes con mayor precisión.

### CNA — Acreditación institucional y de programas

Las próximas acreditaciones de los programas de Gestión de Política Educacional y Educación Física requerirán documentar cómo se alinean los cursos virtuales con los estándares institucionales. La CNA exige coherencia entre créditos declarados y carga real (Criterio 2) y evidencia de innovación docente (Criterio 4).

### MINEDUC — Límite de virtualización

El Ordinario N° 06/13.191 (2024) fija un máximo del 30% de virtualización en pregrado. Las herramientas en desarrollo permiten documentar cómo se mide y distribuye ese porcentaje con criterio SCT, lo que podría ser útil al momento de justificar ante el MINEDUC la proporción de virtualización de cada programa.

---

## 8. Problema de fondo

En la práctica actual de la UMCE, las horas de los cursos virtuales se definen frecuentemente reproduciendo la distribución presencial: si una asignatura tiene 3 horas de cátedra y 2 de ayudantía presencial, se replica esa misma estructura en Moodle sin preguntarse cuánto tiempo real le toma al estudiante realizar cada actividad en modalidad virtual. Esto genera dos problemas concretos:

El primero es la **incoherencia entre créditos declarados y carga real**. Un curso puede declarar 4 SCT (108 horas de trabajo estudiantil) pero tener actividades que suman 60 horas o, peor aún, que suman 150. Ninguna de las dos situaciones es aceptable para la CNA ni para los estudiantes, pero sin un instrumento de estimación no hay forma de detectarlo antes de que el curso esté operando.

El segundo es la **ausencia de criterio pedagógico en la distribución de horas**. Que un curso tenga el número correcto de horas no garantiza que esas horas estén bien distribuidas. Un curso 100% asincrónico basado en lecturas y cuestionarios puede sumar 108 horas pero no cumplir con los principios de interacción, colaboración y flexibilidad que el modelo virtual necesita para funcionar. La estimación de carga y el diseño pedagógico son problemas distintos que se resuelven en momentos distintos, pero ambos necesitan instrumentos.

Las herramientas que la UDFV está desarrollando intentan abordar ambos problemas: la calculadora para la estimación de carga (Momento 1), el planificador para la distribución pedagógica (Momento 3), y el marco QA para verificar que lo implementado sea coherente con lo planificado (Momentos 4 y 5).

---

## 9. Pendientes y próximos pasos

| Acción | Responsable | Estado |
|--------|-------------|--------|
| Mesa de trabajo UGCI-UDFV (propuesta por Miguel Ángel Pardo, 08-abr) | David + Miguel Ángel | Por agendar |
| Reunión DAC + UGCI + DIPOS para estructura de programas híbridos/e-learning | Equipo Virtualización | Acordada 13-abr, por agendar |
| Retomar documento detenido 2025 sobre formulación de programas según modalidad | Mesa 1 + UGCI | Por retomar |
| Validación de herramientas con académicos de los programas | UDFV + Mesa 1 | En curso (Osvaldo Molina ya probó calculadora y planificador) |
| Presentación de avances a consejeros universitarios | Coordinadores de 3 mesas | Prevista para fines de abril |
| Respuesta a solicitud del Director de Docencia | David (UDFV) | Este documento |

---

## 10. Resumen de herramientas

| Herramienta | Momento | Desarrolla | Valida | Estado |
|-------------|---------|-----------|--------|--------|
| Calculadora SCT | M1 | UDFV | UGCI (pendiente) | Prototipo funcional |
| Planificador instruccional | M3 | UDFV | Mesa 1 (en curso) | Prototipo funcional |
| Fundamentos pedagógicos | Referencia | UDFV | Mesa 1 (en curso) | Documento de trabajo |
| Sistema QA (77 indicadores) | M4 | UDFV + Sepúlveda Parrini (2024) | Mesa 1 (pendiente) | En desarrollo |
| Rúbrica de evaluación | M4 | UDFV | Pilotaje 2024 completado | En desarrollo |
| Auditor nocturno | M5 | UDFV | — | En calibración |

Todas las herramientas están disponibles en [umce.online/virtualizacion](https://umce.online/virtualizacion).

---

*Documento de referencia interna. Elaborado con base en la Guía SCT UGCI (borrador abr-2026), Manual SCT-Chile (CRUCH, 2013), resoluciones exentas UMCE, actas de Mesa 1, y correspondencia institucional UGCI-UDFV.*
