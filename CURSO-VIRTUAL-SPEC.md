# Spec: Curso Virtual — Experiencia del estudiante

**Estado**: BORRADOR v2 — revision QM + benchmarks modernos
**Fecha**: 25-mar-2026
**Referencia**: Quality Matters Higher Ed Rubric 7a ed (44 estandares, 22 esenciales) + benchmark Coursera/edX/Canvas
**Principio rector**: el estudiante debe poder navegar su curso completo sin entrar a Moodle, con una experiencia comparable a Coursera pero con la estructura pedagogica del PIAC

---

## Que es

La vista que reemplaza la experiencia Moodle para el estudiante de postgrado/prosecucion. Mezcla dos fuentes:
- **PIAC** (estructura pedagogica): nucleos, RF, CE, temas, evaluaciones, bibliografia
- **Moodle API** (contenido real): actividades, recursos, foros, grabaciones, calificaciones, completitud

El estudiante nunca necesita entrar a Moodle directamente — todo lo que necesita esta aqui. Los clicks en actividades abren Moodle en una nueva pestana para ejecutar (entregar tarea, participar en foro, etc).

---

## Principios de diseno

1. **Mobile-first**: se disena primero para telefono, se escala a desktop (no al reves)
2. **Progresion visible**: el estudiante siempre sabe donde esta, que sigue, y cuanto le falta
3. **Alineacion transparente**: cada actividad muestra que objetivo trabaja y como se evalua
4. **Accesibilidad nativa**: WCAG 2.1 AA desde el primer commit, no como paso final
5. **Carga cognitiva minima**: mostrar solo lo relevante al momento, con profundidad bajo demanda
6. **Tiempo como recurso**: toda actividad comunica tiempo estimado de dedicacion

---

## Layout general

```
+------------------------------------------------------------------+
|  [< Mis cursos]           UMCE Virtual        [Buscar] [Perfil]  |
+------------------------------------------------------------------+
|                                                                    |
|  BARRA SUPERIOR PERMANENTE                                        |
|  [Entrar a clase]  [Grabaciones]  [Calendario]  [Tareas]  [Ayuda]|
|                                                                    |
+------------------------------------------------------------------+
|           |                                                        |
|  SIDEBAR  |  CONTENIDO PRINCIPAL                                  |
|           |                                                        |
|  Inicio   |  (cambia segun seccion seleccionada)                  |
|  N1 [===] |                                                        |
|  N2 [==.] |                                                        |
|  N3 [....] |                                                        |
|  Evalua.  |                                                        |
|  Biblio.  |                                                        |
|  Info     |                                                        |
|           |                                                        |
+------------------------------------------------------------------+
```

### Zonas:

1. **Top bar**: navegacion global (volver a mis cursos, busqueda intra-curso, perfil)
2. **Barra superior permanente**: accesos directos a elementos transversales del curso
3. **Sidebar izquierdo**: indice del curso con progresion visual por nucleo
4. **Area principal**: contenido de la seccion seleccionada

### Responsividad (mobile-first):
- **Mobile (< 768px)**: sidebar se convierte en menu hamburguesa deslizable; barra superior se colapsa a iconos con tooltip; contenido principal ocupa 100% ancho; acciones principales accesibles con pulgar (bottom bar en mobile)
- **Tablet (768-1024px)**: sidebar colapsable a iconos; barra superior completa
- **Desktop (> 1024px)**: layout completo como diagrama

### Busqueda intra-curso:
- Busca en: nombres de actividades, contenido de nucleos, evaluaciones, bibliografia
- Resultados agrupados por seccion con highlight del termino
- Accesible desde top bar con Ctrl+K / Cmd+K

---

## Secciones del sidebar

### 1. Inicio (landing del curso)
**Proposito**: responder "que es este curso, como funciona, y que necesito saber" (QM Estandar 1)
**Estandares QM cubiertos**: 1.1 (esencial), 1.2, 6.1 (esencial)

Contenido:

**Bloque de bienvenida:**
- Nombre del curso + programa al que pertenece
- Presentacion del/la docente: foto, nombre, breve bio profesional (~3 lineas), mensaje de bienvenida personalizado
- Video de bienvenida (si disponible) — embed inline, no link externo
- Foro de presentacion: link al foro donde estudiantes se presentan (Moodle) con indicador "Ya te presentaste" / "Presentate aqui"

**Bloque "Que vas a lograr":**
- Resultados de aprendizaje generales del curso (del PIAC), escritos desde la perspectiva del estudiante: "Al completar este curso, seras capaz de..."
- Mapa visual de nucleos con conexion entre ellos (diagrama simple tipo roadmap)

**Bloque "Como funciona este curso":**
- Modalidad + carga horaria semanal + duracion total
- Estructura semanal tipica: "Antes de clase (autonomo) → Clase sincronica → Despues de clase (asincronico)"
- Herramientas que usaras: lista con nombre, icono, y para que se usa cada una (Zoom, Moodle, UCampus) — cumple QM 6.1
- Conocimientos previos requeridos (del PIAC o configurados por DI) — cumple QM 1.1 esencial
- Competencias digitales esperadas: "necesitas saber usar [herramientas], tener conexion estable, navegador actualizado"

**Bloque "Comunicacion y soporte":**
- Email docente + tiempo de respuesta esperado (ej: "responde emails en 24-48h habiles")
- Foro de consultas generales (link a Moodle)
- Horario de atencion (si configurado)
- Soporte tecnico: udfv@umce.cl

Fuentes de datos:
- PIAC: identificacion, RF general, metodologia, conocimientos previos
- Manual/DI: foto docente, video bienvenida, bio, mensaje bienvenida, horario atencion, tiempos de respuesta
- Moodle API: foro de presentacion (mod_forum), foro de consultas

---

### 2. Nucleo N (uno por cada nucleo del PIAC)
**Proposito**: la experiencia semanal del estudiante con alineacion visible objetivo-actividad-evaluacion
**Estandares QM cubiertos**: 2.1-2.3 (esenciales), 2.4, 3.3, 4.1 (esencial), 4.2, 4.5, 5.1-5.2 (esenciales)

**Header del nucleo:**
- Nombre del nucleo + rango de semanas
- Resultado Formativo escrito como objetivo medible desde la perspectiva del estudiante
- Criterios de Evaluacion asociados (lista breve, expandible)
- Barra de progresion: X de Y actividades completadas (%)
- Tiempo estimado total del nucleo: "~Z horas de dedicacion"
- Estado: en curso / completado / disponible / bloqueado
- Badge de logro: indicador visual cuando el nucleo se completa al 100%

**Contenido por semana:**
```
Semana 3 — "Bibliographic seminar II"
Objetivo de la semana: "Identificar y evaluar fuentes academicas relevantes"
Tiempo estimado: ~4 horas

├── Antes de la clase (autonomo) — ~1.5h
│   ├── [Obligatorio] Lectura: [nombre] — 45 min
│   │   └── Trabaja objetivo: "Identificar fuentes..."
│   └── [Complementario] Video: [nombre] — 20 min
│
├── Clase sincronica — Mar 18:30 [Entrar a Zoom]
│   └── Grabacion sesion 3 [Ver] (aparece despues de la clase)
│
├── Despues de la clase (asincronico) — ~1.5h
│   └── Foro: Forum session 3 [Participar]
│       └── Expectativa: "al menos 1 aporte + 1 respuesta a companero"
│
└── Evaluacion (si aplica esta semana)
    └── Tarea: [nombre] — vence Vie 27/03 [Entregar]
        ├── Peso: 15% de nota final
        ├── Criterios: [ver rubrica resumida ▼]
        └── Evalua CE: "Seleccionar bibliografia pertinente..."
```

**Cada actividad muestra:**
- Icono SVG por tipo (no emojis)
- Nombre descriptivo
- Etiqueta [Obligatorio] / [Complementario] — cumple QM 4.5
- Tiempo estimado de dedicacion
- Estado de completitud (check verde / pendiente / no disponible)
- Fecha limite (si aplica) con alerta visual si < 48h
- Objetivo de aprendizaje que trabaja (texto breve o tag) — cumple QM 2.4
- Click abre en Moodle en nueva pestana

**Feedback inline (si hay nota disponible):**
- Cuando una actividad evaluada tiene calificacion, se muestra inline:
  "Nota: 5.8 — Feedback: [ver comentario del docente ▼]"
- Esto evita que el estudiante tenga que ir a otra seccion para ver sus resultados

Fuentes de datos:
- PIAC: nucleos, temas, RF, CE, repertorio evaluativo, conexion CE-actividad
- Moodle API: core_course_get_contents, core_completion_get_activities_completion_status, mod_assign (fechas, rubrica), mod_forum (participacion), gradereport_user_get_grade_items (notas inline)
- Moodle mod_data: grabaciones por sesion (fecha + link YouTube)
- LTI: link de Zoom (uno por curso, compartido)
- DI/config: tiempos estimados, etiquetas obligatorio/complementario, objetivos por semana

---

### 3. Evaluaciones
**Proposito**: transparencia evaluativa completa — el estudiante sabe que se le pide, como, cuando y con que criterios
**Estandares QM cubiertos**: 3.1-3.2 (esenciales), 3.3, 3.4, 3.5

**Vista de resumen:**
- Tabla de evaluaciones con: nombre, tipo (formativa/sumativa), ponderacion, nucleo asociado, fecha entrega, estado (pendiente/entregado/calificado)
- Barra visual de avance evaluativo: "3 de 7 evaluaciones completadas"
- Promedio parcial ponderado / nota final (si disponible)
- Indicador de proxima evaluacion con countdown

**Vista detallada por evaluacion (expandible):**
- Descripcion de la tarea
- Rubrica resumida inline (no solo link): criterios principales con niveles de logro
- Link a rubrica completa en Moodle
- CE que evalua (del PIAC) — cumple alineacion QM 3.1
- Calificacion obtenida + feedback del docente (si disponible)
- Estado de entrega: no entregado / entregado / calificado / atrasado

**Politica de integridad academica (QM 3.5 — nuevo en 7a ed):**
- Texto visible (no escondido): politica institucional UMCE sobre integridad academica
- Que se considera plagio, como citar correctamente
- Consecuencias
- Configurable por DI (texto institucional por defecto)

**Tipos de evaluacion visibles (QM 3.3):**
- Etiquetas que distinguen: diagnostica, formativa, sumativa, autoevaluacion, evaluacion por pares
- El estudiante entiende el proposito de cada tipo

Fuentes de datos:
- PIAC: evaluaciones_sumativas, CE asociados
- Moodle API: mod_assign_get_assignments (fechas, rubrica, descripcion), gradereport_user_get_grade_items (notas), mod_assign_get_submissions (estado entrega)
- Manual/DI: ponderaciones, politica integridad academica, tipos de evaluacion
- Institucional: politica de integridad academica UMCE (texto default)

---

### 4. Bibliografia y validacion de fuentes
**Proposito**: referencias del curso organizadas, accesibles y validadas para aseguramiento de calidad y acreditacion (QM Estandar 4)
**Estandares QM cubiertos**: 4.1, 4.3, 4.4, 4.5

#### Vista estudiante
- Lista de referencias bibliograficas del PIAC, con formato APA
- Links directos a PDFs/URLs cuando disponibles
- Agrupadas por nucleo
- Etiqueta [Obligatoria] / [Complementaria] por referencia
- Indicacion de tipo: libro, articulo, video, sitio web, norma/ley
- Atribucion clara: autor, ano, fuente — cumple QM 4.3
- Indicador visual de accesibilidad: icono verde "acceso abierto", azul "biblioteca UMCE", gris "acceso restringido"
- Link roto detectado → se oculta el link y se muestra "Referencia disponible en biblioteca" como fallback

#### Sistema de validacion de fuentes (vista DI + acreditacion)

Cada recurso bibliografico tiene metadatos de calidad que el DI puede completar y que el sistema valida automaticamente:

**Metadatos por referencia:**
- `titulo`, `autores`, `anio_publicacion` — obligatorios
- `tipo_fuente` — enum: libro, capitulo_libro, articulo_revista, articulo_conferencia, tesis, sitio_web, video, norma_ley, recurso_educativo_abierto, otro
- `url` — link directo al recurso (si existe)
- `doi` — Digital Object Identifier (si aplica)
- `issn_isbn` — para libros/revistas
- `acceso` — enum: abierto, biblioteca_umce, suscripcion, restringido
- `idioma` — es, en, pt, otro
- `nucleo_asociado` — a que nucleo del PIAC corresponde
- `clasificacion` — enum: obligatoria, complementaria
- `vigente` — boolean, calculado: anio_publicacion >= anio_actual - 5 (o marcado manualmente por DI para clasicos)
- `url_status` — enum: activo, roto, no_verificado, sin_url — actualizado por cron
- `doi_verificado` — boolean, verificado via CrossRef API
- `ultima_verificacion` — timestamp del ultimo chequeo automatico

**Chequeos automaticos (cron):**
- Verificacion de URLs: HEAD request a cada url, marcar como `roto` si 404/timeout despues de 3 reintentos
- Verificacion DOI: consulta a `https://api.crossref.org/works/{doi}` — valida existencia y extrae metadatos
- Frecuencia: semanal (no necesita ser mas frecuente)
- Alerta al DI cuando: link se rompe, o recurso supera 5 anios sin estar marcado como clasico

**Dashboard de calidad bibliografica (vista DI/admin — evidencia para acreditacion):**

Por curso:
- Total de referencias: N obligatorias, M complementarias
- Vigencia: "X% de las fuentes son de los ultimos 5 anios" (objetivo: >= 70%)
- Accesibilidad: "X% acceso abierto, Y% biblioteca UMCE, Z% restringido"
- Estado de links: "X activos, Y rotos, Z sin verificar"
- DOI verificados: "X de Y referencias con DOI tienen DOI valido"
- Diversidad de tipos: distribucion por tipo_fuente (grafico simple)
- Idiomas: distribucion por idioma
- Cobertura por nucleo: "Nucleo 1: N refs, Nucleo 2: M refs..." (detecta nucleos sin bibliografia)
- Alerta si un nucleo tiene 0 referencias obligatorias

Agregado institucional (vista admin — para informes de acreditacion):
- Mismas metricas pero consolidadas por programa, por semestre
- Exportable como tabla (CSV) para inclusion en informes CNA
- Comparativa entre cursos del mismo programa

**Conexion con acreditacion CNA:**
Este dashboard genera evidencia directa para los criterios de acreditacion relacionados con recursos de aprendizaje. En vez de que cada docente reporte manualmente, el sistema genera los datos automaticamente a partir de lo que ya esta configurado en el PIAC y el curso virtual.

Fuentes de datos:
- PIAC: bibliografia (con campo de nucleo asociado si disponible) — fuente primaria
- DI/config: clasificacion obligatoria/complementaria, links directos, metadatos adicionales
- CrossRef API: verificacion de DOI
- Cron HTTP: verificacion de URLs

---

### 5. Informacion del curso
**Proposito**: soporte integral al estudiante — tecnico, academico, institucional
**Estandares QM cubiertos**: 7.1, 7.2 (muy importante), 7.3, 7.4, 5.4, 6.4

**Bloque "Tu docente":**
- Datos de contacto (email, horario atencion)
- Tiempos de respuesta esperados: "emails en 24-48h, foros en 48h, tareas calificadas en 7 dias" — cumple QM 5.4
- Enlace al foro de consultas

**Bloque "Politicas del curso":**
- Asistencia y participacion esperada — cumple QM 5.5
- Politica de entregas tardias (late policy)
- Netiqueta para foros y comunicacion
- Integridad academica (referencia cruzada con seccion Evaluaciones)

**Bloque "Soporte tecnico" (QM 7.1):**
- UDFV: udfv@umce.cl — soporte de plataformas virtuales
- Guia rapida: "problemas con Zoom", "no puedo ver mi curso", "olvidé mi clave"
- Enlace a base de conocimiento / FAQ

**Bloque "Servicios institucionales" (QM 7.2-7.4):**
- Biblioteca UMCE: enlace al catalogo y bases de datos
- Servicios de accesibilidad: como solicitar acomodaciones, contacto DAE — cumple QM 7.2
- Bienestar estudiantil: enlace a servicios de apoyo psicologico/social
- Orientacion academica / DAE
- UCampus: enlace directo (horarios, notas oficiales)

**Bloque "Herramientas y privacidad" (QM 6.4):**
- Lista de herramientas tecnologicas usadas en el curso
- Para cada una: nombre, proposito, y enlace a politica de privacidad
- Ejemplo: "Zoom — clases sincronicas — [politica de privacidad]"

**Bloque "Acceso directo":**
- Link directo al curso en Moodle
- Link a UCampus

Fuentes de datos:
- PIAC: email_docente
- Manual/DI: horario atencion, politicas, tiempos de respuesta
- Institucional: links a biblioteca, DAE, bienestar, accesibilidad (configurables globalmente)
- Sistema: links a UCampus, Moodle, ayuda, politicas de privacidad

---

## Barra superior permanente

Elementos transversales que el estudiante usa frecuentemente, siempre visibles:

| Elemento | Icono | Que hace | Fuente |
|----------|-------|----------|--------|
| Entrar a clase | Video | Abre LTI Zoom en nueva pestana | Moodle LTI (S1) |
| Grabaciones | Play | Lista de grabaciones del curso con fecha y link | Moodle mod_data (S1) |
| Calendario | Calendar | Vista de calendario inline con fechas clave | Moodle calendar API + PIAC |
| Tareas | Clipboard | Lista de tareas pendientes con fechas | Moodle mod_assign |
| Ayuda | HelpCircle | Panel de ayuda rapida + contacto soporte | Sistema |

### Calendario (vista inline, no link externo):
- Muestra el mes actual con marcadores en fechas con actividad
- Tipos de evento: clase sincronica, entrega de tarea, foro cierra, evaluacion
- Click en fecha muestra detalle
- Exportable a Google Calendar / iCal (.ics)
- Fuente: core_calendar_get_calendar_events + fechas del PIAC

### Panel de notificaciones (badge en top bar):
- Alerta de tareas proximas (< 48h)
- Nueva grabacion disponible
- Nueva calificacion publicada
- Nuevo mensaje en foro
- Fuente: polling periodico a Moodle APIs (completion, grades, forum)

---

## Progresion y estados

### Por nucleo:
- **Completado**: todas las actividades obligatorias del nucleo completadas + badge visual de logro
- **En curso**: al menos 1 actividad completada, nucleo visible — sidebar muestra barra parcial
- **Disponible**: nucleo visible pero sin actividad completada — sidebar muestra barra vacia
- **Bloqueado**: seccion oculta en Moodle — muestra nombre + "Disponible pronto" + fecha estimada

### Por actividad:
- Check verde: completada en Moodle
- Circulo vacio: pendiente
- Candado: no disponible aun
- Reloj naranja: tiene fecha limite proxima (< 48h)
- Estrella: calificada con nota disponible

### Barra general del curso:
- "X de Y actividades completadas" + barra de progreso visual
- Visible en sidebar junto a cada nucleo
- En seccion Inicio: barra general del curso completo

### Dashboard de progresion (en seccion Inicio):
- Grafico simple: nucleos como etapas, coloreados segun avance
- "Vas en el nucleo 2 de 4 — 45% del curso completado"
- Proximas 3 actividades pendientes con fechas

Fuente: `core_completion_get_activities_completion_status` (Moodle API)

---

## Reconocimiento academico e insignias

**Proposito**: hacer visible el progreso y los logros del usuario (estudiante o docente) como reconocimiento formal, motivacion intrinseca, y evidencia para acreditacion/portafolio. Ademas, soportar el modelo de **modularizacion curricular y microcredenciales** definido institucionalmente.
**Estandares QM cubiertos**: 3.1 (actividades promueven logro de objetivos), 1.2 (proposito del curso claro)
**Conexion institucional**: SDPA (linea 3.6), Certificacion de Competencias TIC, Ruta Formativa IA, Modularizacion Curricular UDFV-UGCI

### Contexto: Modularizacion de la oferta formativa

Segun el analisis institucional (Notion: "Problemas, Practicas Identificadas y Soluciones Propuestas", marzo 2026), la UMCE tiene una hoja de ruta de modularizacion en 3 fases:

**Fase 1 (2026)** — Consolidacion sin disrupcion:
- Cada asignatura completada genera una **constancia verificable** (certificacion intermedia por modulo)
- 1 SCT = 27 horas; 1 semana = 10 hrs trabajo estudiantil
- Estandarizacion PAC/PIAC en todos los programas

**Fase 2 (2027-2028)** — Modularizacion con salidas intermedias:
- Modulos de 8 semanas, apilables hacia grado completo (referencia: UOC Espana)
- **Microcredenciales** como salidas intermedias: un conjunto de modulos equivale a un diplomado reconocido por la DEC
- Itinerarios formativos en Educacion Continua: cursos → diplomado → postitulo (trayectoria progresiva)
- Electivos compartidos entre programas afines

**Fase 3 (2029+)** — Ecosistema articulado:
- Reconocimiento de aprendizajes previos (RAP) institucional
- Movilidad interna entre programas mediante modulos equivalentes
- Interoperabilidad entre postgrado, prosecuciones y educacion continua

**Implicancia para el sistema de badges**: las insignias NO son solo gamificacion — son la **capa de representacion digital** de la modularizacion. Cada modulo completado = insignia verificable. Un conjunto de insignias de modulo = microcredencial. Un conjunto de microcredenciales = diplomado/postitulo. El sistema de badges de UMCE Online es el registro digital de esta trayectoria.

### Arquitectura de credenciales apilables

El sistema de insignias se organiza en 4 niveles jerarquicos, donde cada nivel se construye acumulando el anterior:

```
Nivel 4: GRADO / TITULO
  └── Nivel 3: MICROCREDENCIAL (diplomado, postitulo, certificacion)
        └── Nivel 2: MODULO completado (asignatura / curso)
              └── Nivel 1: LOGRO dentro de un modulo (nucleo, evaluacion, participacion)
```

**Nivel 1 — Logros granulares** (ya especificados arriba como "insignias de curso"):
- Nucleo completado, entrega puntual, participacion activa, nota destacada
- Se otorgan automaticamente desde datos de Moodle
- Son motivacionales y de feedback inmediato

**Nivel 2 — Modulo completado** (constancia verificable):
- Se otorga cuando el estudiante completa una asignatura/curso al 100% con calificacion aprobatoria
- Incluye: nombre del modulo, programa al que pertenece, horas/SCT, fecha, calificacion
- Es la "unidad basica" de la modularizacion — equivale a la certificacion intermedia de Fase 1 (2026)
- Verificable publicamente via `umce.online/badge/{hash}`
- Exportable como constancia PDF individual

**Nivel 3 — Microcredencial** (salida intermedia):
- Se otorga automaticamente cuando el estudiante acumula un conjunto definido de modulos
- Ejemplo: completar 4 modulos especificos del MEIGLIP = Diplomado en Educacion Intercultural (salida intermedia)
- Ejemplo: completar 4 cursos Nivel 1 Ruta IA = Certificacion "Iniciacion en IA Educativa"
- Definida por el admin/UGCI en una tabla de reglas de composicion
- Verificable publicamente, con detalle de los modulos que la componen
- Exportable como certificado PDF con firma digital institucional

**Nivel 4 — Grado completo** (informativo):
- No se otorga desde UMCE Online (eso es Ucampus/Registro Curricular)
- Pero el sistema muestra el progreso hacia el grado: "Has completado 8 de 12 modulos del Magister"
- Conecta con el dashboard de trayectoria estudiantil (solucion propuesta para P8 en Notion)

### Tipos de insignias

El sistema maneja 3 categorias de insignias, con reglas de otorgamiento distintas:

**1. Insignias de curso (estudiante)**
Se otorgan automaticamente al cumplir condiciones dentro de un curso virtual.

| Insignia | Condicion de otorgamiento | Icono |
|----------|--------------------------|-------|
| Nucleo completado | 100% actividades obligatorias del nucleo completadas en Moodle | Escudo con numero de nucleo |
| Curso completado | Todos los nucleos completados | Estrella dorada |
| Participacion activa | >= 80% de participacion en foros del curso | Burbuja de dialogo |
| Entrega puntual | Todas las evaluaciones entregadas antes de fecha limite | Reloj con check |
| Primera evaluacion | Primera evaluacion calificada en el curso | Lapiz |
| Nota destacada | Promedio final >= 6.0 (o umbral configurable por programa) | Medalla |

**2. Insignias de trayectoria (estudiante o docente)**
Se otorgan al completar hitos que cruzan multiples cursos.

| Insignia | Condicion | Aplica a |
|----------|-----------|----------|
| Primer curso virtual completado | Completar 1 curso al 100% | Estudiante |
| Semestre completo | Todos los cursos del semestre completados | Estudiante |
| Explorador | Haber accedido a cursos en 2+ plataformas Moodle distintas | Estudiante |
| Formador en progreso | Completar 1 curso de la Ruta Formativa IA o Certificacion TIC | Docente |
| Nivel Inicial TIC certificado | Completar requisitos del Nivel Inicial (27h + evidencia) | Docente |
| Nivel Intermedio TIC certificado | Completar requisitos del Nivel Intermedio (54h + portafolio) | Docente |
| Nivel Avanzado TIC certificado | Completar requisitos del Nivel Avanzado (81h + mentoria) | Docente |
| Ruta IA Nivel 1 | Completar los 4 cursos del Nivel Iniciacion IA (40h) | Docente |
| Ruta IA Nivel 2 | Completar los 4 cursos del Nivel Aplicacion IA (44h) | Docente |
| Ruta IA Nivel 3 | Completar los 4 cursos del Nivel Integracion IA (48h) | Docente |

**3. Insignias manuales (admin/DI)**
Otorgadas manualmente por un DI o admin para reconocimientos especiales.

| Insignia | Ejemplo de uso |
|----------|---------------|
| Mencion especial | Trabajo destacado en un curso |
| Mentor | Docente que participo como mentor en el SDPA |
| Innovador | Proyecto de innovacion educativa completado |
| Colaborador UDFV | Participacion en actividades de la UDFV |

### Vista "Mis logros" (perfil del usuario)

Accesible desde el menu de usuario (avatar en top bar) → "Mis logros".

**Para estudiantes:**
- Grid de insignias obtenidas con fecha de obtencion
- Insignias agrupadas por: curso actual, cursos anteriores, trayectoria
- Insignias pendientes proximas ("Te falta 1 nucleo para completar el curso")
- Barra de progreso hacia la proxima insignia de trayectoria
- Estadisticas: total de cursos completados, insignias obtenidas, promedio general

**Para docentes/academicos:**
- Todo lo anterior (si imparten cursos como estudiantes de capacitacion)
- Seccion "Mi desarrollo academico" (conecta con SDPA):
  - Progreso hacia certificacion TIC: nivel actual + horas acumuladas + horas faltantes
  - Progreso en Ruta Formativa IA: cursos completados por nivel
  - Cronograma institucional: "Nivel Inicial 2025, Nivel Intermedio 2026, Nivel Avanzado 2027"
  - Lista de cursos de capacitacion completados con fechas y horas cronologicas
- Seccion "Insignias otorgadas a mis estudiantes" (cursos que imparte):
  - Cuantos estudiantes completaron, cuantos obtuvieron nota destacada, etc.

**Exportabilidad:**
- Cada insignia tiene un detalle expandible: nombre, descripcion, criterios, fecha, curso, emisor
- Boton "Exportar mis logros" → genera PDF con lista de insignias + detalle (para portafolio)
- Para docentes: export incluye horas SDPA acumuladas (evidencia para certificacion TIC)
- Cada insignia puede tener un enlace unico verificable (tipo credencial digital): `umce.online/badge/{hash}` — cualquier persona con el enlace puede verificar la autenticidad

### Reglas de otorgamiento automatico

El sistema evalua reglas cuando ocurren eventos:

**Triggers:**
- Cuando se actualiza `cache_completions` (cron) → evalua insignias de nucleo y curso
- Cuando se actualiza `cache_grades` (cron) → evalua insignias de nota destacada
- Cuando se actualiza `cache_submissions` (cron) → evalua insignia de entrega puntual
- Cuando un admin marca un curso de capacitacion como completado → evalua insignias SDPA

**Logica:**
```
on_completion_update(user, course):
  for each nucleo in course:
    if all obligatory activities completed:
      grant_badge('nucleo_completado', user, course, nucleo)
  if all nucleos completed:
    grant_badge('curso_completado', user, course)
    check_trayectoria_badges(user)

on_grade_update(user, course):
  if promedio >= threshold:
    grant_badge('nota_destacada', user, course)

grant_badge(type, user, ...):
  if badge already exists for this user+type+course: skip
  insert into user_badges
  insert into notifications (para que el usuario vea la insignia nueva)
  if push_enabled: send push notification "Obtuviste una nueva insignia"
```

### Insignia en el curso virtual (inline)

Las insignias no solo viven en "Mis logros" — tambien aparecen en contexto:

- **Sidebar del curso**: al lado del nombre del nucleo completado aparece mini-badge
- **Seccion Inicio**: si el curso esta completado, banner con insignia de curso completado
- **Seccion Evaluaciones**: si todas entregadas a tiempo, badge de entrega puntual visible
- **Toast/notificacion**: cuando se otorga una insignia, aparece toast animado con la insignia

### Formato de emision: Open Badges 3.0

**Decision**: las insignias y microcredenciales se emiten en formato **Open Badges 3.0** (1EdTech, mayo 2024), que son **W3C Verifiable Credentials**. Esto hace que las credenciales de UMCE sean portables, verificables por terceros, e interoperables con LinkedIn, Europass, wallets digitales y cualquier plataforma compatible.

**Stack tecnico (Node.js, MIT license — compatible con Express):**
- `@digitalcredentials/open-badges-context` — JSON-LD context para OBv3
- `@digitalcredentials/vc` — emision y verificacion de Verifiable Credentials
- `@digitalcredentials/signing-service` — servicio de firma digital
- `@digitalcredentials/sign-and-verify-core` — firma con Ed25519
- `@digitalcredentials/keypair` — gestion de par de claves criptograficas

**Son 5 paquetes npm del MIT Digital Credentials Consortium. No se agrega ninguna dependencia pesada** — son libraries ligeras que se usan server-side al momento de emitir/verificar.

**Formato de una insignia emitida (JSON-LD simplificado):**
```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
  ],
  "id": "https://umce.online/badge/abc123hash",
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "issuer": {
    "id": "https://umce.online",
    "type": ["Profile"],
    "name": "Universidad Metropolitana de Ciencias de la Educacion",
    "url": "https://umce.online",
    "image": "https://umce.online/img/umce-logo.png"
  },
  "issuanceDate": "2026-07-15T10:00:00Z",
  "credentialSubject": {
    "id": "did:email:estudiante@umce.cl",
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://umce.online/achievements/modulo-fundamentos-educ-intercultural",
      "type": ["Achievement"],
      "name": "Modulo: Fundamentos de Educacion Intercultural",
      "description": "Completaste el modulo con calificacion aprobatoria (6 SCT, 162 hrs)",
      "criteria": {
        "narrative": "Completar todas las actividades obligatorias del modulo con calificacion >= 4.0"
      },
      "image": "https://umce.online/badges/img/modulo-completado.svg",
      "tag": ["educacion-intercultural", "meiglip", "postgrado"]
    }
  },
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-rdfc-2022",
    "verificationMethod": "https://umce.online/.well-known/keys/issuer-key-1",
    "proofPurpose": "assertionMethod"
  }
}
```

**Flujo de emision:**
1. Se otorga badge/microcredencial (logica existente: `grant_badge()`)
2. Se genera el JSON-LD con datos del usuario, achievement y criterios
3. Se firma con Ed25519 usando `@digitalcredentials/sign-and-verify-core`
4. Se almacena el JSON firmado en `user_badges.credential_json` (nueva columna JSONB)
5. Se genera imagen SVG/PNG con el JSON embebido (segun spec OB 3.0)
6. El endpoint `/api/badge/:hash` devuelve el JSON-LD verificable (para maquinas) o la vista HTML (para humanos)

**Verificacion:**
- `GET /api/badge/:hash` con `Accept: application/json` → devuelve el JSON-LD firmado
- `GET /api/badge/:hash` con `Accept: text/html` → devuelve pagina HTML bonita con detalle de la insignia
- Cualquier tercero puede verificar la firma criptografica contra la clave publica de UMCE Online
- Clave publica publicada en `https://umce.online/.well-known/keys/issuer-key-1`

**Gestion de claves:**
- Par de claves Ed25519 generado una vez, almacenado en `.env` del servidor (BADGE_PRIVATE_KEY, BADGE_PUBLIC_KEY)
- Clave publica expuesta en endpoint publico `.well-known`
- Rotacion de claves: cuando se rota, las insignias antiguas siguen siendo verificables contra la clave vieja (se publica historial)

**Impacto en schema existente:**
```sql
-- Agregar columna para el Verifiable Credential firmado
ALTER TABLE user_badges ADD COLUMN credential_json JSONB;
ALTER TABLE user_badges ADD COLUMN badge_image_url TEXT; -- SVG/PNG con JSON embebido

ALTER TABLE user_microcredenciales ADD COLUMN credential_json JSONB;
ALTER TABLE user_microcredenciales ADD COLUMN credential_image_url TEXT;
```

**Portabilidad para el usuario:**
- Boton "Agregar a LinkedIn" en cada insignia (LinkedIn acepta OB 3.0)
- Boton "Descargar" → descarga SVG/PNG con credencial embebida
- Boton "Copiar enlace verificable" → copia `umce.online/badge/{hash}`
- Export completo: "Descargar todas mis credenciales" → ZIP con JSONs + imagenes
- Futuro: compatible con wallets digitales (DCC Learner Credential Wallet del MIT)

### Conexion con Moodle badges

Moodle tiene su propio sistema de badges. Para no duplicar:
- Las insignias de UMCE Online son COMPLEMENTARIAS a las de Moodle, no las reemplazan
- Si Moodle otorga un badge, el sistema NO lo importa automaticamente (son sistemas distintos)
- Los criterios de UMCE Online se basan en datos de Moodle pero la insignia vive en UMCE Online
- Razon: las insignias de UMCE Online cruzan multiples plataformas Moodle y cursos, cosa que Moodle no puede hacer
- Las insignias de UMCE Online son W3C Verifiable Credentials (OB 3.0); las de Moodle no — esto les da valor agregado real

---

## Accesibilidad (QM Estandar 8 — transversal)

**Principio**: la accesibilidad no es un paso final, es una restriccion de diseno desde el inicio.
**Estandar objetivo**: WCAG 2.1 nivel AA

### 8.1 — Alternativas a contenido auditivo (esencial):
- Todas las grabaciones de clase deben tener subtitulos (auto-generados por YouTube como minimo)
- Si hay podcast o audio, debe existir transcripcion
- El spec debe validar que los links de YouTube tengan CC disponible

### 8.2 — Alternativas a contenido visual (muy importante):
- Toda imagen tiene alt text descriptivo
- Iconos SVG tienen aria-label
- Graficos de progresion tienen texto alternativo ("45% completado, 5 de 11 actividades")

### 8.3 — Texto de enlaces descriptivo:
- Nunca "click aqui" — siempre "[Ver grabacion sesion 3]", "[Participar en foro semana 2]"
- Nombres de archivo descriptivos al descargar

### 8.4 — Estructura semantica:
- Jerarquia de headings correcta (h1 > h2 > h3, sin saltos)
- Landmarks ARIA: nav, main, aside, footer
- Tablas con headers y scope
- Listas semanticas para contenido de nucleos

### 8.5 — Diseno visual accesible:
- Contraste minimo 4.5:1 para texto, 3:1 para elementos grandes
- Color NO es el unico indicador de estado (siempre icono + texto + color)
- Tipografia minima 16px base, interlineado 1.5
- Espaciado suficiente entre elementos interactivos (minimo 44x44px touch targets)

### 8.6 — Navegacion por teclado:
- Todo el curso navegable con Tab, Enter, Escape, flechas
- Focus visible en todo momento (outline, no solo color)
- Sin trampas de teclado
- Skip links al contenido principal
- Orden de tabulacion logico

### Validacion:
- Test con lector de pantalla (VoiceOver/NVDA) antes de cada release
- Audit automatico con axe-core en CI/CD
- Checklist de accesibilidad en cada PR que toque UI

---

## Datos que necesita el DI configurar (panel PIAC)

Campos adicionales que el panel PIAC deberia permitir editar:

| Campo | Obligatorio | Default | QM |
|-------|-------------|---------|-----|
| Foto docente (URL) | No | Avatar con iniciales | 1.1 |
| Bio profesional docente (~3 lineas) | No | Solo nombre | 1.1 |
| Video de bienvenida (URL YouTube/Vimeo) | No | No se muestra | 1.1 |
| Mensaje de bienvenida (texto) | No | Texto generico | 1.1 |
| Descripcion motivacional del curso | No | Se usa metodologia del PIAC | 1.1 |
| Conocimientos previos requeridos | Si | "Sin requisitos previos" | 1.1 esencial |
| Competencias digitales esperadas | No | Texto generico | 1.1 |
| Horario atencion docente | No | "Consultar por email" | 5.4 |
| Tiempos de respuesta (email, foro, tareas) | Si | "48h habiles" | 5.4 |
| Politicas del curso (asistencia, late, netiqueta) | Si | Texto institucional UMCE | 1.2 |
| Politica integridad academica | Si | Texto institucional UMCE | 3.5 |
| Tiempo estimado por actividad (minutos) | No | No se muestra | Moderno |
| Etiqueta obligatorio/complementario por recurso | No | Todo obligatorio | 4.5 |
| Objetivos por semana (texto breve) | No | Solo RF del nucleo | 2.2 |
| Requisitos de participacion en foros | No | No se muestra | 5.5 |
| Foro de presentacion (id Moodle) | No | No se muestra | 1.1 |
| Foro de consultas generales (id Moodle) | No | No se muestra | 5.3 |

Los campos marcados "Si" en Obligatorio tienen un default institucional que se usa si el DI no configura nada (el curso nunca queda sin esa informacion).

Estos campos se guardan en `piac_links` (columnas nuevas) o en una tabla `curso_virtual_config`.

---

## Iconografia (SVG, no emojis)

| Tipo | Icono SVG (Lucide) | Color | Rol ARIA |
|------|-----------|-------|----------|
| book/page/lesson | BookOpen | Blue 500 | "Lectura" |
| resource/file | Paperclip | Slate 500 | "Recurso descargable" |
| url/link | ExternalLink | Slate 500 | "Enlace externo" |
| forum | MessageCircle | Green 500 | "Foro de discusion" |
| assign | ClipboardCheck | Orange 500 | "Tarea evaluada" |
| quiz | HelpCircle | Orange 500 | "Evaluacion" |
| lti/zoom | Video | Purple 500 | "Clase sincronica" |
| data/grabaciones | PlayCircle | Pink 500 | "Grabacion de clase" |
| folder | Folder | Slate 400 | "Carpeta de recursos" |
| scorm/h5p | Gamepad | Blue 500 | "Actividad interactiva" |
| diary | BookText | Teal 500 | "Diario reflexivo" |
| obligatorio | CircleDot | — | "Actividad obligatoria" |
| complementario | Circle | — | "Actividad complementaria" |
| calificado | Star | Amber 500 | "Actividad calificada" |

Nota: cada icono siempre va acompanado de texto. El color nunca es el unico diferenciador.

---

## Que NO es el curso virtual

- NO duplica contenido de Moodle (es un visor + organizador)
- NO permite entregar tareas ni participar en foros (redirige a Moodle)
- NO reemplaza UCampus para notas oficiales
- NO genera elementos automaticamente
- NO requiere que el docente cambie su flujo de trabajo
- NO almacena datos academicos propios (todo viene de Moodle + PIAC)

---

## APIs de Moodle necesarias (adicionales a las ya usadas)

| Funcion | Para que | Seccion |
|---------|----------|---------|
| `core_completion_get_activities_completion_status` | Progresion por actividad | Nucleos, Sidebar |
| `gradereport_user_get_grade_items` | Calificaciones + feedback inline | Evaluaciones, Nucleos |
| `mod_data_get_entries` | Grabaciones individuales (fecha + YouTube) | Barra superior, Nucleos |
| `core_calendar_get_calendar_events` | Calendario inline | Barra superior |
| `mod_assign_get_submissions` | Estado de entregas del estudiante | Evaluaciones |
| `mod_assign_get_assignments` | Descripcion + rubrica de tareas | Evaluaciones, Nucleos |
| `mod_forum_get_forums_by_courses` | Identificar foro presentacion + consultas | Inicio |
| `core_course_get_contents` | Contenido completo del curso | Nucleos |

---

## Chatbot contextual del curso (QM 7.1 + diferenciador moderno)

**Contexto**: el portal ya tiene un chatbot Claude funcional en todas las paginas (`shared/chatbot.js` + `claude-proxy-container`). Su system prompt actual incluye catalogo de programas, cursos, equipo UDFV y plataformas. Pero es generico — no sabe nada del curso especifico que el estudiante esta mirando.

### Proposito en el curso virtual:
El chatbot dentro del curso virtual se convierte en un **asistente de curso** — puede responder preguntas sobre el curso especifico: fechas, evaluaciones, contenido, politicas. Esto cubre QM 7.1 (soporte tecnico accesible) y va mas alla como diferenciador moderno (24/7, contextual, inmediato).

### Como se ve en la interfaz:

**Desktop**: boton FAB flotante (esquina inferior derecha) igual que hoy, pero al abrirlo el panel incluye un badge "Asistente de [nombre del curso]" que indica que sabe del curso.

**Mobile**: el FAB se mantiene pero se desplaza sobre el contenido. Al abrirlo ocupa pantalla completa (fullscreen overlay) con boton de cerrar arriba.

**Dentro del panel de chat:**
```
+------------------------------------+
| Asistente — Semantics I            |
| __________________________________ |
|                                    |
| [quick actions]                    |
| [Proximas entregas] [Grabaciones]  |
| [Contactar docente] [Horario]      |
|                                    |
| Estudiante: cuando vence la tarea  |
| del nucleo 2?                      |
|                                    |
| Asistente: La tarea "Literature    |
| Review" del Nucleo 2 vence el      |
| viernes 27/03 a las 23:59.         |
| Puedes entregarla aqui: [link]     |
|                                    |
| __________________________________ |
| [Escribe tu pregunta...     ] [>]  |
+------------------------------------+
```

**Quick actions contextuales** (botones rapidos sobre el input):
- "Proximas entregas" → lista de tareas pendientes con fechas
- "Grabaciones" → ultima grabacion disponible
- "Contactar docente" → email + horario atencion
- "Como se evalua este curso" → resumen de evaluaciones con ponderaciones

### Contexto inyectado al system prompt:
Cuando el chatbot se abre en el curso virtual, el system prompt se extiende con:
- Nombre del curso, programa, docente, email docente
- Nucleos con RF y semanas
- Evaluaciones con fechas y ponderaciones
- Politicas del curso (si configuradas)
- Proximas actividades con fechas
- Horario de atencion del docente

Esto NO requiere un segundo LLM ni cambio de backend — se usa el mismo `claude-proxy-container`. Solo se amplia el system prompt con datos del curso (ya disponibles en la API `/api/curso-virtual/:linkId`).

### Endpoint:
- Reutilizar `/api/chat/message` pero con un parametro adicional: `context: { linkId: 123 }`
- Si viene `linkId`, el backend obtiene datos del curso y los agrega al system prompt
- La sesion de chat se vincula al curso: `chat_sessions.context_link_id` (columna nueva, nullable)
- Rate limit por sesion se mantiene (20 msgs/hora)

### Accesibilidad del chatbot:
- Focus trap cuando el panel esta abierto
- Aria-live region para mensajes nuevos (screen reader anuncia respuestas)
- Escape cierra el panel
- Navegable por teclado completo

### Fase de implementacion: Fase 5-B (junto con experiencia personalizada)
Requiere datos del curso disponibles. No bloquea Fase 3 — en Fase 3 se muestra el chatbot generico (sin contexto de curso).

---

## Notificaciones push (infraestructura existente)

**Contexto**: el codebase ya tiene Firebase Admin + tabla `device_tokens` + funcion `sendPushNotification` funcional. Hay endpoints para registrar tokens y enviar pushes. Esto se usa para la app Capacitor (mobile).

### Eventos que disparan notificacion:

| Evento | Canal | Prioridad | Fase |
|--------|-------|-----------|------|
| Tarea vence en < 48h | Push + badge web | Alta | Fase 5-B |
| Tarea vence en < 24h (recordatorio) | Push | Alta | Fase 5-B |
| Nueva grabacion de clase disponible | Push + badge web | Media | Fase 5-B |
| Calificacion publicada | Push + badge web | Media | Fase 5-B |
| Nuevo mensaje en foro del curso | Badge web | Baja | Fase 5-C |
| Curso virtual publicado (primera vez) | Push | Media | Fase 3-B |

### Como se ve en la interfaz:

**Badge en top bar**: numero rojo sobre icono de campana (nuevo en barra superior). Click abre dropdown con lista de notificaciones recientes.

```
+------------------------------------------------------------------+
|  [< Mis cursos]      UMCE Virtual      [Buscar] [🔔 3] [Perfil] |
+------------------------------------------------------------------+
                                              |
                                    +---------v----------+
                                    | Notificaciones     |
                                    | __________________ |
                                    | 🔴 Tarea "Essay"   |
                                    |    vence manana     |
                                    |    hace 2 horas     |
                                    | __________________ |
                                    | Grabacion sesion 4  |
                                    |    disponible       |
                                    |    hace 5 horas     |
                                    | __________________ |
                                    | Nota publicada:     |
                                    |    Forum 3 — 6.2    |
                                    |    hace 1 dia       |
                                    | __________________ |
                                    | [Ver todas]         |
                                    +--------------------+
```

**Push nativo (mobile)**: usa `sendPushNotification` existente. El tap en la notificacion abre la app en el curso virtual correspondiente (deep link: `/curso-virtual/:linkId`).

**Web badge**: para el browser, no se requiere push nativo — se usa polling del frontend contra una tabla de notificaciones en Supabase.

### Schema:
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  umce_email TEXT NOT NULL,
  piac_link_id INTEGER REFERENCES piac_links(id),
  type TEXT NOT NULL, -- 'deadline_48h', 'deadline_24h', 'recording', 'grade', 'forum_post', 'course_published'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data_json JSONB, -- {linkId, activityId, moodleUrl, etc.}
  read BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_email_read ON notifications(umce_email, read) WHERE read = false;
CREATE INDEX idx_notif_link ON notifications(piac_link_id);
```

### Flujo:
1. Cron (Fase 4) detecta cambio: nueva grabacion, nueva nota, deadline proxima
2. Inserta fila en `notifications`
3. Si el estudiante tiene `device_token`: fire-and-forget `sendPushNotification`
4. Frontend del curso virtual hace polling de `notifications` (cada 60s) para badge
5. Click en notificacion: marca `read=true`, navega a seccion relevante

### Fase de implementacion:
- Schema + endpoints basicos: Fase 4 (junto con cron)
- UI badge + dropdown: Fase 5-B
- Push mobile: Fase 5-B (usa infra existente)
- Notificaciones de foro: Fase 5-C (menor prioridad)

---

## Referencia visual: induccion2026.udfv.cloud

El SPEC.md Fase 3.7 referencia induccion2026.udfv.cloud como modelo de experiencia para el curso virtual. Esta pagina es un curso de induccion diseñado por la UDFV.

**TODO**: Claude Code no tiene acceso de red a este dominio. Al iniciar Fase 3, David debe:
1. Abrir induccion2026.udfv.cloud en el navegador
2. Compartir capturas o describir los patrones de UX que quiere replicar
3. Indicar que elementos del diseño aplican al curso virtual de postgrado

Patrones relevantes a extraer:
- Layout general (sidebar? scroll vertical? tabs?)
- Como presenta modulos/nucleos
- Progresion visual
- Iconografia y paleta de colores
- Interacciones (expandir/colapsar, tooltips, etc.)
- Responsive mobile

---

## Mapeo QM completo

Referencia rapida de como el spec cubre cada estandar esencial de QM 7a ed:

| QM | Estandar | Donde se cubre | Estado |
|----|----------|----------------|--------|
| 1.1 | Conocimientos previos + presentaciones | Inicio: conocimientos previos, bio docente, foro presentacion | Cubierto |
| 2.1 | Objetivos medibles (curso) | Inicio: "Que vas a lograr" | Cubierto |
| 2.2 | Objetivos medibles (modulo) | Nucleos: RF por nucleo + objetivo por semana | Cubierto |
| 2.3 | Objetivos claros desde perspectiva estudiante | Todos escritos como "seras capaz de..." | Cubierto |
| 3.1 | Evaluacion alineada a objetivos | Evaluaciones: CE asociado por evaluacion | Cubierto |
| 3.2 | Criterios descriptivos / rubricas | Evaluaciones: rubrica inline + criterios | Cubierto |
| 4.1 | Materiales alineados a objetivos | Nucleos: cada material con objetivo que trabaja | Cubierto |
| 5.1 | Actividades promueven objetivos | Nucleos: estructura Antes/Durante/Despues | Cubierto |
| 5.2 | Actividades interactivas | Nucleos: foros, clase sincronica, trabajo colaborativo | Cubierto |
| 6.1 | Tecnologia apoya objetivos | Inicio: lista de herramientas con proposito | Cubierto |
| 8.1 | Alternativas a audio | Accesibilidad: subtitulos en grabaciones | Cubierto |
| 8.2 | Alternativas a visual | Accesibilidad: alt text, aria-labels | Cubierto |

---

## Resolucion de identidad: estudiante UMCE → usuario Moodle

**Contexto**: para mostrar progresion y notas personalizadas, necesitamos el `userid` del estudiante en cada plataforma Moodle. El email @umce.cl es el mismo en UMCE Online y en Moodle.

### Estrategia: busqueda por email + cache
- Usar `core_user_get_users_by_field` con field=email, value=email@umce.cl
- En primer acceso: resolver userid y cachearlo en tabla `user_moodle_mapping`
- Accesos siguientes: leer de la tabla (sin llamada a Moodle)

```sql
CREATE TABLE user_moodle_mapping (
  id SERIAL PRIMARY KEY,
  umce_email TEXT NOT NULL,
  moodle_platform TEXT NOT NULL,
  moodle_userid INTEGER NOT NULL,
  moodle_username TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(umce_email, moodle_platform)
);
```

### Verificacion tecnica (resolver en Claude Code al iniciar Fase 5):
Antes de implementar, Claude Code debe verificar empiricamente contra las APIs Moodle reales:
1. Que `core_user_get_users_by_field(field=email)` funciona con los tokens REST actuales
2. Que los tokens tienen los permisos necesarios para completion y grades:
   - `moodle/user:viewdetails` — buscar usuario por email
   - `moodle/grade:viewall` o equivalente — para notas
   - `mod_assign:view` — para estado de entregas
3. Si algun permiso falta, documentar cual y en que plataforma para que David lo habilite en Moodle
4. Probar con el email de David como caso de prueba en las 5 plataformas

Esto no se especula — se prueba directo con `moodleCall` cuando corresponda.

---

## Estrategia de cache y sincronizacion

**Problema**: el spec necesita datos de 5+ APIs Moodle por cada carga de pagina. Llamar a Moodle en tiempo real por cada estudiante no escala (Moodle no es rapido, y multiples plataformas multiplican la latencia).

### Modelo propuesto: cache en Supabase + refresh por cron

**Datos que se cachean (cambian con frecuencia):**

| Dato | Tabla cache | Refresh | TTL |
|------|-------------|---------|-----|
| Completion por actividad | `cache_completions` | Cron cada 15 min (horario clase) / cada 1h (resto) | 15-60 min |
| Calificaciones | `cache_grades` | Cron cada 1h | 1h |
| Estado entregas | `cache_submissions` | Cron cada 30 min | 30 min |
| Eventos calendario | `cache_calendar` | Cron cada 6h | 6h |
| Grabaciones (mod_data) | `cache_recordings` | Cron cada 6h | 6h |

**Datos que NO se cachean (ya estan en snapshots):**
- Estructura del curso (secciones, modulos) → `moodle_snapshots`
- Estructura PIAC → `piac_parsed`
- Matching → `matching_results`

### Schema de cache:
```sql
CREATE TABLE cache_completions (
  id SERIAL PRIMARY KEY,
  moodle_platform TEXT NOT NULL,
  moodle_course_id INTEGER NOT NULL,
  moodle_userid INTEGER NOT NULL,
  completions_json JSONB NOT NULL, -- {activityId: {state, timecompleted}}
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(moodle_platform, moodle_course_id, moodle_userid)
);

CREATE TABLE cache_grades (
  id SERIAL PRIMARY KEY,
  moodle_platform TEXT NOT NULL,
  moodle_course_id INTEGER NOT NULL,
  moodle_userid INTEGER NOT NULL,
  grades_json JSONB NOT NULL, -- [{itemname, grade, feedback, gradedate}]
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(moodle_platform, moodle_course_id, moodle_userid)
);

CREATE TABLE cache_submissions (
  id SERIAL PRIMARY KEY,
  moodle_platform TEXT NOT NULL,
  moodle_course_id INTEGER NOT NULL,
  moodle_userid INTEGER NOT NULL,
  submissions_json JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(moodle_platform, moodle_course_id, moodle_userid)
);

CREATE TABLE cache_calendar (
  id SERIAL PRIMARY KEY,
  moodle_platform TEXT NOT NULL,
  moodle_course_id INTEGER NOT NULL,
  events_json JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(moodle_platform, moodle_course_id)
);

CREATE TABLE cache_recordings (
  id SERIAL PRIMARY KEY,
  moodle_platform TEXT NOT NULL,
  moodle_course_id INTEGER NOT NULL,
  recordings_json JSONB NOT NULL, -- [{date, youtube_url, title}]
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(moodle_platform, moodle_course_id)
);
```

### Schema: user_badges (reconocimiento academico)

```sql
-- Definiciones de insignias (catalogo)
CREATE TABLE badge_definitions (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,           -- 'nucleo_completado', 'curso_completado', 'nivel_inicial_tic', etc.
  categoria TEXT NOT NULL CHECK (categoria IN ('curso', 'modulo', 'trayectoria', 'manual', 'sdpa')),
  -- 'curso' = logros dentro de un curso (nivel 1)
  -- 'modulo' = asignatura/curso completado (nivel 2, unidad basica de modularizacion)
  -- 'trayectoria' = hitos cross-curso (nivel 1-2)
  -- 'sdpa' = desarrollo profesional docente
  -- 'manual' = otorgadas por admin/DI
  nombre TEXT NOT NULL,                -- "Nucleo completado"
  descripcion TEXT NOT NULL,           -- "Completaste todas las actividades obligatorias del nucleo"
  icono TEXT NOT NULL,                 -- nombre de icono Lucide: 'shield-check', 'star', 'medal', etc.
  color TEXT DEFAULT '#2563eb',        -- color primario del badge (hex)
  activo BOOLEAN DEFAULT true,
  -- Para badges automaticos: condiciones en JSON
  regla_auto JSONB,                    -- null = manual. Ejemplo: {"type": "nucleo_100", "threshold": 1.0}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insignias otorgadas a usuarios
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,            -- email @umce.cl del usuario
  badge_definition_id INTEGER NOT NULL REFERENCES badge_definitions(id),

  -- Contexto del otorgamiento
  piac_link_id INTEGER REFERENCES piac_links(id),  -- null para badges de trayectoria/manual
  nucleo_numero INTEGER,               -- null si no aplica
  moodle_platform TEXT,                -- plataforma donde se logro
  moodle_course_id INTEGER,            -- curso donde se logro

  -- Metadata
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by TEXT,                     -- 'system' para automaticos, email del admin para manuales
  nota TEXT,                           -- nota opcional del DI/admin ("Trabajo destacado en...")
  verificacion_hash TEXT NOT NULL,     -- hash unico para verificacion publica: umce.online/badge/{hash}

  -- SDPA (solo para badges de docente)
  horas_cronologicas NUMERIC(5,1),    -- horas que suma esta insignia para certificacion TIC
  programa_sdpa TEXT,                  -- 'ruta_ia_nivel_1', 'certificacion_tic_inicial', etc.

  UNIQUE(user_email, badge_definition_id, piac_link_id, nucleo_numero)
);

-- Indices
CREATE INDEX idx_ub_user ON user_badges(user_email);
CREATE INDEX idx_ub_badge ON user_badges(badge_definition_id);
CREATE INDEX idx_ub_piac ON user_badges(piac_link_id) WHERE piac_link_id IS NOT NULL;
CREATE INDEX idx_ub_hash ON user_badges(verificacion_hash);
CREATE INDEX idx_ub_sdpa ON user_badges(programa_sdpa) WHERE programa_sdpa IS NOT NULL;

-- Progreso SDPA por docente (vista materializada)
CREATE MATERIALIZED VIEW mv_progreso_sdpa AS
SELECT
  ub.user_email,
  ub.programa_sdpa,
  COUNT(*) AS badges_obtenidos,
  SUM(ub.horas_cronologicas) AS horas_acumuladas,
  CASE
    WHEN ub.programa_sdpa LIKE 'certificacion_tic%' THEN
      CASE
        WHEN SUM(ub.horas_cronologicas) >= 81 THEN 'avanzado'
        WHEN SUM(ub.horas_cronologicas) >= 54 THEN 'intermedio'
        WHEN SUM(ub.horas_cronologicas) >= 27 THEN 'inicial'
        ELSE 'en_progreso'
      END
    WHEN ub.programa_sdpa LIKE 'ruta_ia%' THEN
      CASE
        WHEN COUNT(*) >= 12 THEN 'completa'
        WHEN COUNT(*) >= 8 THEN 'nivel_3'
        WHEN COUNT(*) >= 4 THEN 'nivel_2'
        ELSE 'nivel_1'
      END
    ELSE 'en_progreso'
  END AS nivel_alcanzado,
  MAX(ub.granted_at) AS ultimo_logro
FROM user_badges ub
WHERE ub.programa_sdpa IS NOT NULL
GROUP BY ub.user_email, ub.programa_sdpa;

CREATE UNIQUE INDEX idx_mv_sdpa ON mv_progreso_sdpa(user_email, programa_sdpa);
```

### Schema: microcredenciales (credenciales apilables)

```sql
-- Definicion de microcredenciales (que modulos componen cada credencial)
CREATE TABLE microcredencial_definitions (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,           -- 'diplomado_educ_intercultural', 'cert_ia_nivel_1', etc.
  nombre TEXT NOT NULL,                -- "Diplomado en Educacion Intercultural"
  descripcion TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('diplomado', 'postitulo', 'certificacion', 'itinerario')),
  programa_origen TEXT,                -- programa de postgrado de origen (si aplica): 'MEIGLIP', 'MGEPES', etc.
  total_sct INTEGER,                   -- creditos SCT totales de la microcredencial
  total_horas INTEGER,                 -- horas cronologicas totales
  icono TEXT NOT NULL,                 -- icono Lucide
  color TEXT DEFAULT '#2563eb',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reglas de composicion: que modulos (badges de nivel 2) componen cada microcredencial
CREATE TABLE microcredencial_requisitos (
  id SERIAL PRIMARY KEY,
  microcredencial_id INTEGER NOT NULL REFERENCES microcredencial_definitions(id) ON DELETE CASCADE,
  badge_definition_id INTEGER NOT NULL REFERENCES badge_definitions(id),
  -- El badge debe ser de categoria 'modulo' o 'sdpa'
  obligatorio BOOLEAN DEFAULT true,    -- true = obligatorio, false = electivo
  orden INTEGER DEFAULT 0,             -- orden sugerido de completacion
  UNIQUE(microcredencial_id, badge_definition_id)
);

-- Reglas para electivos: "completar al menos N de los electivos disponibles"
-- Se almacena en microcredencial_definitions como JSONB
ALTER TABLE microcredencial_definitions
  ADD COLUMN reglas_electivos JSONB DEFAULT '{"minimo_electivos": 0}';
  -- Ejemplo: {"minimo_electivos": 2} = completar al menos 2 de los requisitos marcados como obligatorio=false

-- Microcredenciales otorgadas a usuarios
CREATE TABLE user_microcredenciales (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  microcredencial_id INTEGER NOT NULL REFERENCES microcredencial_definitions(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by TEXT DEFAULT 'system',    -- 'system' si automatico, email admin si manual
  verificacion_hash TEXT NOT NULL,     -- hash unico para verificacion publica
  -- Snapshot de los modulos que la componen al momento de otorgamiento
  modulos_completados JSONB NOT NULL,  -- [{badge_id, badge_slug, granted_at, calificacion}]
  total_sct_acumulados INTEGER,
  total_horas_acumuladas INTEGER,
  UNIQUE(user_email, microcredencial_id)
);

CREATE INDEX idx_umc_user ON user_microcredenciales(user_email);
CREATE INDEX idx_umc_hash ON user_microcredenciales(verificacion_hash);

-- Vista: progreso del estudiante hacia cada microcredencial disponible
CREATE OR REPLACE VIEW v_progreso_microcredenciales AS
SELECT
  ub.user_email,
  md.id AS microcredencial_id,
  md.slug,
  md.nombre,
  md.tipo,
  md.programa_origen,
  COUNT(mr.id) AS total_requisitos,
  COUNT(mr.id) FILTER (WHERE mr.obligatorio) AS requisitos_obligatorios,
  COUNT(ub2.id) AS modulos_completados,
  COUNT(ub2.id) FILTER (WHERE mr.obligatorio) AS obligatorios_completados,
  ROUND(100.0 * COUNT(ub2.id) / NULLIF(COUNT(mr.id), 0), 1) AS pct_avance,
  -- Verificar si cumple todos los obligatorios + minimo electivos
  CASE
    WHEN COUNT(ub2.id) FILTER (WHERE mr.obligatorio) = COUNT(mr.id) FILTER (WHERE mr.obligatorio)
         AND COUNT(ub2.id) FILTER (WHERE NOT mr.obligatorio) >= COALESCE((md.reglas_electivos->>'minimo_electivos')::int, 0)
    THEN true
    ELSE false
  END AS elegible_para_otorgamiento
FROM (SELECT DISTINCT user_email FROM user_badges) ub
CROSS JOIN microcredencial_definitions md
JOIN microcredencial_requisitos mr ON mr.microcredencial_id = md.id
LEFT JOIN user_badges ub2 ON ub2.user_email = ub.user_email
  AND ub2.badge_definition_id = mr.badge_definition_id
WHERE md.activo = true
GROUP BY ub.user_email, md.id, md.slug, md.nombre, md.tipo, md.programa_origen, md.reglas_electivos;
```

### Logica de otorgamiento de microcredenciales:
```
on_badge_granted(user, badge):
  -- Cuando se otorga un badge de nivel 2 (modulo completado), verificar microcredenciales
  if badge.categoria in ('modulo', 'curso', 'sdpa'):
    for each microcredencial that includes this badge:
      check v_progreso_microcredenciales(user, microcredencial)
      if elegible_para_otorgamiento AND not already_granted:
        grant_microcredencial(user, microcredencial)
        notify user "Obtuviste una microcredencial: {nombre}"

grant_microcredencial(user, microcredencial):
  -- Snapshot de modulos al momento de otorgamiento
  modulos = get_user_badges_for_microcredencial(user, microcredencial)
  insert into user_microcredenciales(user, microcredencial, modulos_completados=modulos)
  insert into notifications
```

### Ejemplo concreto de itinerario:
```
Estudiante cursa Magister en Educacion Intercultural (MEIGLIP):

Semestre 1:
  ✅ Modulo: Fundamentos de Educacion Intercultural (6 SCT) → Badge nivel 2
  ✅ Modulo: Metodologia de Investigacion I (6 SCT) → Badge nivel 2
  ✅ Modulo: Taller Transdisciplinario I (6 SCT) → Badge nivel 2

Semestre 2:
  ✅ Modulo: Curriculo e Interculturalidad (6 SCT) → Badge nivel 2
  → Al completar estos 4 modulos obligatorios:
    🏆 MICROCREDENCIAL: "Diplomado en Fundamentos de Educacion Intercultural" (24 SCT)
    → Otorgada automaticamente, verificable en umce.online/badge/{hash}
    → El estudiante puede usar esta credencial aunque no termine el magister

Semestre 3-4:
  ... continua hacia grado completo ...
  → Barra de progreso: "6 de 10 modulos completados — 60% del Magister"
```

### Vista "Mi trayectoria" (extension de "Mis logros"):
Para estudiantes de postgrado, la vista de logros incluye una seccion adicional:

**Trayectoria modular:**
- Diagrama visual del itinerario: modulos como nodos conectados, coloreados por estado (completado/en curso/pendiente)
- Microcredenciales como "checkpoints" intermedios en el diagrama
- "Has completado 4 de 10 modulos — 24 de 60 SCT acumulados"
- Proxima microcredencial alcanzable: "Te falta 1 modulo para el Diplomado en..."
- Horas de trabajo estudiantil acumuladas (calculadas desde SCT: N × 27 hrs)

**Para Educacion Continua (itinerarios DEC):**
- Mismo concepto pero con cursos sueltos que se apilan hacia diplomado/postitulo
- "Has completado 2 de 5 cursos del itinerario → cuando completes 3, obtienes Diplomado en..."
- Permite que un estudiante que tomo cursos DEC vea que esta cerca de una credencial mayor

### Endpoints de reconocimiento academico:
```
-- Insignias (nivel 1-2)
GET    /api/user/badges                    → insignias del usuario logueado
GET    /api/user/badges/sdpa               → progreso SDPA del docente logueado
GET    /api/badge/:hash                    → verificacion publica de insignia (sin auth)
GET    /api/piac/:linkId/badges            → insignias del usuario en un curso especifico
GET    /api/admin/badges/stats             → estadisticas de insignias por curso/programa (admin)
POST   /api/admin/badges/grant             → otorgar insignia manual (admin/DI)
POST   /api/admin/badges/revoke/:id        → revocar insignia (admin)
GET    /api/user/badges/export             → export PDF con logros del usuario

-- Microcredenciales (nivel 3)
GET    /api/user/microcredenciales              → microcredenciales del usuario + progreso hacia las pendientes
GET    /api/user/microcredenciales/:id          → detalle de una microcredencial (modulos que la componen, estado)
GET    /api/microcredencial/:hash               → verificacion publica de microcredencial (sin auth)
GET    /api/user/trayectoria                    → vista completa: badges + microcredenciales + progreso grado
GET    /api/user/trayectoria/export             → export PDF trayectoria completa (para portafolio/acreditacion)
GET    /api/admin/microcredenciales             → lista definiciones de microcredenciales (admin)
POST   /api/admin/microcredenciales             → crear nueva microcredencial con requisitos (admin)
PUT    /api/admin/microcredenciales/:id         → editar microcredencial (admin)
GET    /api/admin/microcredenciales/:id/stats   → cuantos estudiantes la han obtenido, cuantos en progreso
```

### Datos semilla (badge_definitions iniciales):
```sql
INSERT INTO badge_definitions (slug, categoria, nombre, descripcion, icono, color, regla_auto) VALUES
  ('nucleo_completado', 'curso', 'Nucleo completado', 'Completaste todas las actividades obligatorias de este nucleo', 'shield-check', '#16a34a', '{"type": "nucleo_100"}'),
  ('curso_completado', 'curso', 'Curso completado', 'Completaste todos los nucleos del curso', 'star', '#eab308', '{"type": "curso_100"}'),
  ('participacion_activa', 'curso', 'Participacion activa', 'Participaste en al menos el 80% de los foros del curso', 'message-circle', '#8b5cf6', '{"type": "foro_80"}'),
  ('entrega_puntual', 'curso', 'Entrega puntual', 'Entregaste todas las evaluaciones antes de la fecha limite', 'clock', '#06b6d4', '{"type": "entregas_a_tiempo"}'),
  ('primera_evaluacion', 'curso', 'Primera evaluacion', 'Recibiste tu primera calificacion en este curso', 'pencil', '#f97316', '{"type": "primera_nota"}'),
  ('nota_destacada', 'curso', 'Nota destacada', 'Obtuviste un promedio igual o superior al umbral de excelencia', 'medal', '#dc2626', '{"type": "promedio_sobre_umbral", "threshold": 6.0}'),
  ('modulo_completado', 'modulo', 'Modulo completado', 'Completaste esta asignatura/modulo con calificacion aprobatoria', 'badge-check', '#0d9488', '{"type": "modulo_aprobado"}'),
  -- NOTA: 'modulo_completado' es la unidad basica de la modularizacion. Se crea una instancia por cada
  -- asignatura/curso aprobado. Es el building block para microcredenciales (nivel 3).
  -- Se otorga cuando: curso_completado=true AND calificacion >= nota_minima_aprobacion del programa.
  ('primer_curso_completado', 'trayectoria', 'Primer curso virtual', 'Completaste tu primer curso en UMCE Online', 'rocket', '#2563eb', '{"type": "total_cursos_completados", "threshold": 1}'),
  ('semestre_completo', 'trayectoria', 'Semestre completo', 'Completaste todos los cursos del semestre', 'calendar-check', '#059669', '{"type": "semestre_100"}'),
  ('explorador', 'trayectoria', 'Explorador', 'Accediste a cursos en 2 o mas plataformas Moodle', 'compass', '#7c3aed', '{"type": "plataformas_distintas", "threshold": 2}'),
  ('nivel_inicial_tic', 'sdpa', 'Nivel Inicial TIC', 'Certificaste el Nivel Inicial de Competencia Digital Docente (27h)', 'award', '#16a34a', null),
  ('nivel_intermedio_tic', 'sdpa', 'Nivel Intermedio TIC', 'Certificaste el Nivel Intermedio de Competencia Digital Docente (54h)', 'award', '#eab308', null),
  ('nivel_avanzado_tic', 'sdpa', 'Nivel Avanzado TIC', 'Certificaste el Nivel Avanzado de Competencia Digital Docente (81h)', 'award', '#dc2626', null),
  ('ruta_ia_nivel_1', 'sdpa', 'Ruta IA - Iniciacion', 'Completaste los 4 cursos del Nivel 1 de la Ruta Formativa IA (40h)', 'brain', '#06b6d4', null),
  ('ruta_ia_nivel_2', 'sdpa', 'Ruta IA - Aplicacion', 'Completaste los 4 cursos del Nivel 2 de la Ruta Formativa IA (44h)', 'brain', '#8b5cf6', null),
  ('ruta_ia_nivel_3', 'sdpa', 'Ruta IA - Integracion', 'Completaste los 4 cursos del Nivel 3 de la Ruta Formativa IA (48h)', 'brain', '#dc2626', null),
  ('mencion_especial', 'manual', 'Mencion especial', 'Reconocimiento por trabajo destacado', 'sparkles', '#f59e0b', null),
  ('mentor_sdpa', 'manual', 'Mentor', 'Participaste como mentor en el Sistema de Desarrollo Profesional Academico', 'users', '#0891b2', null),
  ('innovador', 'manual', 'Innovador', 'Completaste un proyecto de innovacion educativa', 'lightbulb', '#84cc16', null),
  ('colaborador_udfv', 'manual', 'Colaborador UDFV', 'Participaste activamente en actividades de la UDFV', 'heart-handshake', '#ec4899', null);
```

### Flujo de lectura (estudiante abre curso):
1. Leer `moodle_snapshots` + `piac_parsed` + `matching_results` (estructura, ya cacheado)
2. Resolver `moodle_userid` del estudiante (tabla mapping o API)
3. Leer `cache_completions` + `cache_grades` + `cache_submissions` de Supabase
4. Si cache expirado (fetched_at > TTL): devolver cache viejo + trigger refresh asincrono
5. Merge todo y devolver JSON al frontend

### Flujo de escritura (cron):
- Cron frecuente (Fase 4 del SPEC.md): recorre cursos activos con piac_links
- Por cada curso + estudiante matriculado: llama a Moodle APIs y upsert en tablas cache
- Horario intenso (17-22h): refresh cada 15 min (horario de clases sincronicas)
- Resto del dia: refresh cada 1h
- Nocturno: refresh completo de todos los cursos

### Refresh bajo demanda:
- Boton "Actualizar" visible al estudiante (con throttle: maximo 1 refresh cada 5 min)
- Endpoint: `POST /api/curso-virtual/:linkId/refresh` (authMiddleware)

---

## Schema: curso_virtual_config

Tabla para almacenar la configuracion que el DI hace del curso virtual (campos de la seccion "Datos que necesita el DI").

```sql
CREATE TABLE curso_virtual_config (
  id SERIAL PRIMARY KEY,
  piac_link_id INTEGER NOT NULL REFERENCES piac_links(id) ON DELETE CASCADE,

  -- Docente (QM 1.1)
  docente_foto_url TEXT,
  docente_bio TEXT,
  docente_video_bienvenida TEXT,
  docente_mensaje_bienvenida TEXT,
  docente_horario_atencion TEXT DEFAULT 'Consultar por email',
  docente_tiempos_respuesta JSONB DEFAULT '{"email": "48h hábiles", "foro": "48h hábiles", "tareas": "7 días hábiles"}',

  -- Curso (QM 1.1, 1.2)
  descripcion_motivacional TEXT,
  conocimientos_previos TEXT DEFAULT 'Sin requisitos previos específicos',
  competencias_digitales TEXT DEFAULT 'Manejo básico de navegador web, correo electrónico y videoconferencia (Zoom)',

  -- Politicas (QM 1.2, 3.5, 5.5)
  politicas_curso TEXT, -- asistencia, late policy, netiqueta (default: texto institucional)
  politica_integridad TEXT, -- default: texto institucional UMCE
  requisitos_participacion TEXT, -- expectativas de foros, etc.

  -- Foros vinculados (QM 1.1, 5.3)
  foro_presentacion_cmid INTEGER, -- cmid del foro de presentacion en Moodle
  foro_consultas_cmid INTEGER, -- cmid del foro de consultas generales

  -- Configuracion por actividad (se guarda como JSONB, indexado por cmid de Moodle)
  actividades_config JSONB DEFAULT '{}',
  -- Formato: { "cmid_123": { "tiempo_estimado_min": 45, "obligatorio": true, "objetivo_semana": "texto..." }, ... }

  -- Objetivos por semana (JSONB, indexado por numero de semana)
  objetivos_semanales JSONB DEFAULT '{}',
  -- Formato: { "3": "Identificar y evaluar fuentes académicas relevantes", "4": "..." }

  -- Estado
  publicado BOOLEAN DEFAULT false, -- true cuando el DI considera listo para estudiantes
  publicado_at TIMESTAMPTZ,
  publicado_por TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT,

  UNIQUE(piac_link_id)
);

-- Textos institucionales default (se usan cuando el DI no configura)
CREATE TABLE institutional_defaults (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE, -- 'politica_integridad', 'politicas_curso', 'competencias_digitales', etc.
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

-- Indices
CREATE INDEX idx_cvc_piac_link ON curso_virtual_config(piac_link_id);
CREATE INDEX idx_cvc_publicado ON curso_virtual_config(publicado) WHERE publicado = true;
```

### Schema: curso_virtual_bibliografia

Tabla para almacenar las referencias bibliograficas con metadatos de calidad y validacion automatica.

```sql
CREATE TYPE tipo_fuente AS ENUM (
  'libro', 'capitulo_libro', 'articulo_revista', 'articulo_conferencia',
  'tesis', 'sitio_web', 'video', 'norma_ley', 'recurso_educativo_abierto', 'otro'
);

CREATE TYPE acceso_fuente AS ENUM ('abierto', 'biblioteca_umce', 'suscripcion', 'restringido');
CREATE TYPE url_status AS ENUM ('activo', 'roto', 'no_verificado', 'sin_url');

CREATE TABLE curso_virtual_bibliografia (
  id SERIAL PRIMARY KEY,
  piac_link_id INTEGER NOT NULL REFERENCES piac_links(id) ON DELETE CASCADE,

  -- Datos bibliograficos (obligatorios)
  titulo TEXT NOT NULL,
  autores TEXT NOT NULL,          -- formato APA: "Apellido, N., Apellido, N."
  anio_publicacion INTEGER NOT NULL,

  -- Clasificacion
  tipo tipo_fuente NOT NULL DEFAULT 'otro',
  clasificacion TEXT NOT NULL DEFAULT 'complementaria' CHECK (clasificacion IN ('obligatoria', 'complementaria')),
  nucleo_asociado INTEGER,        -- numero de nucleo del PIAC (1, 2, 3...)
  idioma TEXT DEFAULT 'es',       -- codigo ISO 639-1

  -- Identificadores y acceso
  url TEXT,                        -- link directo al recurso
  doi TEXT,                        -- Digital Object Identifier
  issn_isbn TEXT,                  -- ISSN o ISBN
  acceso acceso_fuente DEFAULT 'restringido',

  -- Validacion automatica
  url_status url_status DEFAULT 'no_verificado',
  url_last_check TIMESTAMPTZ,
  url_fail_count INTEGER DEFAULT 0,   -- reintentos fallidos consecutivos
  doi_verificado BOOLEAN DEFAULT false,
  doi_metadata JSONB,                  -- metadatos de CrossRef (titulo confirmado, journal, etc.)
  doi_last_check TIMESTAMPTZ,

  -- Vigencia
  es_clasico BOOLEAN DEFAULT false,    -- marcado por DI: no caduca (ej: Piaget, Vygotsky)
  vigente BOOLEAN GENERATED ALWAYS AS (
    es_clasico OR (anio_publicacion >= EXTRACT(YEAR FROM now())::int - 5)
  ) STORED,

  -- Fuente del dato
  origen TEXT DEFAULT 'piac' CHECK (origen IN ('piac', 'di_manual', 'importado')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

-- Indices
CREATE INDEX idx_bib_piac_link ON curso_virtual_bibliografia(piac_link_id);
CREATE INDEX idx_bib_nucleo ON curso_virtual_bibliografia(piac_link_id, nucleo_asociado);
CREATE INDEX idx_bib_url_status ON curso_virtual_bibliografia(url_status) WHERE url_status = 'roto';
CREATE INDEX idx_bib_vigente ON curso_virtual_bibliografia(vigente) WHERE vigente = false;

-- Vista materializada para dashboard de calidad (se refresca con cron semanal)
CREATE MATERIALIZED VIEW mv_calidad_bibliografica AS
SELECT
  pl.id AS piac_link_id,
  pl.moodle_platform,
  pl.moodle_course_id,
  COUNT(*) AS total_refs,
  COUNT(*) FILTER (WHERE b.clasificacion = 'obligatoria') AS refs_obligatorias,
  COUNT(*) FILTER (WHERE b.clasificacion = 'complementaria') AS refs_complementarias,
  ROUND(100.0 * COUNT(*) FILTER (WHERE b.vigente) / NULLIF(COUNT(*), 0), 1) AS pct_vigentes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE b.acceso = 'abierto') / NULLIF(COUNT(*), 0), 1) AS pct_acceso_abierto,
  COUNT(*) FILTER (WHERE b.url_status = 'activo') AS urls_activas,
  COUNT(*) FILTER (WHERE b.url_status = 'roto') AS urls_rotas,
  COUNT(*) FILTER (WHERE b.doi_verificado) AS dois_verificados,
  COUNT(DISTINCT b.nucleo_asociado) AS nucleos_con_refs,
  jsonb_object_agg(
    COALESCE(b.tipo::text, 'otro'),
    COUNT(*) FILTER (WHERE b.tipo IS NOT NULL)
  ) FILTER (WHERE b.tipo IS NOT NULL) AS distribucion_tipos,
  now() AS refreshed_at
FROM piac_links pl
LEFT JOIN curso_virtual_bibliografia b ON b.piac_link_id = pl.id
GROUP BY pl.id, pl.moodle_platform, pl.moodle_course_id;

CREATE UNIQUE INDEX idx_mv_calidad_piac ON mv_calidad_bibliografica(piac_link_id);
-- Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_calidad_bibliografica;
```

### Logica de defaults:
Cuando el frontend pide datos del curso virtual:
1. Leer `curso_virtual_config` para el `piac_link_id`
2. Si un campo es NULL → leer de `institutional_defaults` por key
3. Si tampoco existe default institucional → usar el hardcoded del codigo (ultimo recurso)
4. El campo `publicado` controla si los estudiantes ven el curso virtual o no

---

## Flujo del DI para configurar el curso virtual

El DI necesita una UI para configurar la experiencia que vera el estudiante. Esto es DISTINTO del panel PIAC actual (que es para analisis de discrepancias).

### Donde vive:
- Nueva seccion en `piac.html` o pagina separada `piac-config.html`
- Accesible desde el detalle de un vinculo PIAC: boton "Configurar curso virtual"
- Protegido por `adminOrEditorMiddleware`

### Flujo:
```
DI abre panel PIAC
  → Ve lista de vinculos PIAC-Moodle
  → Click en un vinculo
  → Ve analisis (discrepancias, matching) [ya existe]
  → Click "Configurar curso virtual" [nuevo]
  → Se abre editor con:
      1. Pestaña "Bienvenida": foto docente, bio, video, mensaje, conocimientos previos
      2. Pestaña "Politicas": asistencia, integridad, participacion, tiempos respuesta
      3. Pestaña "Contenido": lista de actividades por nucleo con toggles
         - Obligatorio/complementario
         - Tiempo estimado (minutos)
         - Objetivo de aprendizaje asociado
      4. Pestaña "Objetivos semanales": texto libre por semana
      6. Pestaña "Bibliografia": lista de referencias con metadatos
         - Se pre-carga desde PIAC (origen='piac')
         - DI puede agregar/editar/eliminar referencias
         - Por cada una: titulo, autores, anio, tipo, URL, DOI, acceso, nucleo, clasificacion
         - Toggle "es clasico" para fuentes que no caducan
         - Indicadores de estado: vigencia (verde/rojo), URL (activo/roto), DOI (verificado/pendiente)
         - Resumen visual: "12 refs, 83% vigentes, 2 links rotos" — el DI ve problemas al instante
      5. Pestaña "Foros": seleccionar foro de presentacion y foro de consultas
  → Boton "Preview" → abre vista estudiante en nueva pestana (con datos del DI actual)
  → Boton "Publicar" → activa publicado=true, visible para estudiantes
  → Boton "Despublicar" → desactiva, estudiantes ven fallback
```

### Endpoints nuevos:
```
GET    /api/piac/:linkId/config          → lee curso_virtual_config
PUT    /api/piac/:linkId/config          → actualiza campos (partial update, merge JSONB)
POST   /api/piac/:linkId/config/publish  → publicado=true
POST   /api/piac/:linkId/config/unpublish → publicado=false
GET    /api/piac/:linkId/preview         → mismo que curso-virtual pero ignora publicado
GET    /api/institutional-defaults       → lista defaults editables (solo admin)
PUT    /api/institutional-defaults/:key  → actualiza un default (solo admin)
GET    /api/piac/:linkId/bibliografia          → lista referencias con metadatos y estado validacion
POST   /api/piac/:linkId/bibliografia          → agrega referencia (DI)
PUT    /api/piac/:linkId/bibliografia/:id      → edita referencia (DI)
DELETE /api/piac/:linkId/bibliografia/:id      → elimina referencia (DI)
GET    /api/piac/:linkId/bibliografia/calidad  → dashboard calidad del curso (desde mv_calidad_bibliografica)
GET    /api/admin/calidad-bibliografica        → dashboard agregado institucional (admin, para acreditacion)
GET    /api/admin/calidad-bibliografica/export → export CSV para informes CNA
```

### Rol del docente:
- En esta fase, el docente NO tiene acceso directo al panel de configuracion
- El DI configura en coordinacion con el docente (reunion, email, etc.)
- Fase futura: se puede agregar rol "docente" con acceso limitado a su propio curso

---

## Estados de error y fallbacks

### Curso sin PIAC vinculado:
- El estudiante ve el curso en "mis-cursos" (viene de Moodle API, no depende de PIAC)
- Al hacer click: muestra una vista simplificada con link directo a Moodle
- Mensaje: "Este curso aun no tiene vista virtual disponible. Puedes acceder directamente en Moodle."
- Boton: "Abrir en Moodle" (link al curso)

### PIAC vinculado pero no publicado (publicado=false):
- Mismo fallback que sin PIAC: vista simplificada + link a Moodle
- El DI ve un badge "No publicado" en el panel

### PIAC vinculado y publicado pero sin analisis (parsed/snapshot faltante):
- Error: "El curso virtual esta en preparacion. Contacta a tu docente o a udfv@umce.cl"
- Esto no deberia pasar si el flujo de publicacion valida que exista analisis

### Moodle API no responde (timeout/error):
- **Datos estructurales** (contenido del curso): se sirven desde snapshot cacheado, nunca fallan
- **Datos dinamicos** (completion, grades): se sirven desde cache de Supabase
  - Si cache existe pero expirado: mostrar datos del cache con indicador "Actualizado hace X min"
  - Si cache no existe: mostrar seccion sin datos de progresion, con mensaje "Cargando tu progresion..."
  - Retry asincrono en background
- **Zoom link**: si LTI no responde, mostrar "Enlace de clase no disponible — contacta a tu docente"

### Estudiante no encontrado en Moodle (mapeo falla):
- Mostrar curso virtual completo (estructura, contenido, evaluaciones)
- Ocultar datos personalizados (progresion, notas) con mensaje: "No pudimos vincular tu cuenta con Moodle. Contacta a udfv@umce.cl"
- No bloquear el acceso al contenido

### Seccion de Moodle sin correspondencia en PIAC:
- El matching ya detecta esto como discrepancia
- Para el estudiante: se muestra como seccion "Recursos adicionales" al final, sin estructura de nucleo
- No se ignora — el contenido del docente siempre se muestra

### Multiples plataformas Moodle:
- Un curso siempre esta en UNA plataforma (definido en `piac_links.moodle_platform`)
- Un estudiante puede tener cursos en distintas plataformas
- `mis-cursos.html` ya maneja esto (queryAllPlatforms)
- El curso virtual muestra la plataforma de origen en la top bar (ya existe)

### Error de permisos (token REST sin capability):
- Log en servidor con detalle de la capability faltante
- Para el estudiante: degradar gracefully (ej: si no puede leer grades, no mostrar notas, pero mostrar todo lo demas)
- Para el admin: alerta en panel con "Plataforma X: falta permiso Y"

---

## Edge cases adicionales

### Curso con nucleos reordenados en Moodle:
- El matching asume seccion N = nucleo N. Si el docente reordena secciones, el matching falla
- Solucion actual: el DI puede re-analizar y el matching intenta por nombre (ya existe en findSection)
- Solucion futura: permitir mapeo manual seccion↔nucleo en config del DI

### Actividades ocultas en Moodle (visible=false):
- No se muestran al estudiante en el curso virtual
- Se muestran al DI en el panel con indicador "Oculta en Moodle"
- Si el PIAC dice que deberia estar visible → discrepancia critica

### Curso con 0 actividades en una semana:
- La semana se muestra igualmente con el objetivo semanal (si configurado)
- Mensaje: "Esta semana no tiene actividades asignadas" (puede ser semana de receso, evaluacion, etc.)

### Estudiante matriculado en Moodle pero no en UMCE Online:
- No deberia pasar si ambos usan @umce.cl
- Pero si pasa: el estudiante puede loguearse en UMCE Online, ver mis-cursos, y acceder al curso virtual
- La matricula en Moodle es la fuente de verdad para "este estudiante esta en este curso"

### Cambio de docente a mitad de semestre:
- El PIAC sigue teniendo al docente original
- El DI puede actualizar la info en curso_virtual_config (foto, bio, email)
- El re-parse del PIAC no sobreescribe la config del DI

### Horario de verano / zona horaria:
- Todas las fechas se muestran en zona horaria de Chile (America/Santiago)
- Las fechas de Moodle vienen en timestamp UNIX (UTC) → convertir al mostrar
- El calendario .ics incluye timezone info

---

## Mapeo features → fases del SPEC.md

Referencia cruzada de que features del curso virtual se construyen en que fase:

| Feature | Fase SPEC.md | Dependencia |
|---------|-------------|-------------|
| Layout sidebar + barra superior | Fase 3 (3.4) | HTML existente se reescribe |
| Seccion Inicio (bienvenida, objetivos) | Fase 3 (3.4) | piac_parsed ya existe |
| Nucleos con contenido Moodle | Fase 3 (3.4) | API curso-virtual ya existe |
| Visibilidad por visado DI | Fase 3 (3.1, 3.2, 3.3) | Toggle en UI del DI |
| Click → Moodle | Fase 3 (3.5) | Ya existe en HTML actual |
| Temporalidad configurable | Fase 3 (3.6) | curso_virtual_config |
| Barra superior (Zoom, recursos) | Fase 3 (3.4) | Shared resources ya existen en API |
| --- | --- | --- |
| Progresion (completion bars) | Fase 5 (5.1) | Requiere: mapeo identidad + completion API + cache |
| Grabaciones individuales (mod_data) | Fase 5 (5.2) | mod_data_get_entries |
| Notas y feedback inline | Fase 5 (5.5) | Requiere: mapeo identidad + grades API + cache |
| Calendario inline | Fase 5 (5.3) | calendar API + cache |
| Evaluaciones con rubricas | Fase 5 (5.4) | mod_assign_get_assignments |
| --- | --- | --- |
| Cron de refresh cache | Fase 4 (4.1, 4.2) | Tablas cache + cron engine |
| Notificaciones (fechas, notas) | Fase 4 (4.6) | Cache + push/email |
| Alertas al DI (completion tracking deshabilitado, etc.) | Fase 4 (4.4) | Validacion de capabilities |
| --- | --- | --- |
| Busqueda intra-curso | Fase 5+ | Datos ya indexados en Supabase |
| Export calendario .ics | Fase 5+ | calendar cache |
| Configuracion DI (panel config) | Fase 3 (3.4) + Fase 5 | curso_virtual_config + UI |
| Textos institucionales (admin) | Fase 5+ | institutional_defaults |
| Bibliografia: schema + vista estudiante | Fase 3 (3.4) | piac_parsed + curso_virtual_bibliografia |
| Bibliografia: metadatos DI (pestana config) | Fase 3-B | curso_virtual_bibliografia |
| Bibliografia: cron validacion URLs/DOI | Fase 4 (4.2) | cron + CrossRef API |
| Bibliografia: dashboard calidad por curso | Fase 5+ | mv_calidad_bibliografica |
| Bibliografia: dashboard agregado institucional (acreditacion) | Fase 5+ | vista admin + export CSV |
| Badges: schema + definiciones semilla | Fase 3 (3.4) | badge_definitions + user_badges + microcredencial_definitions |
| Badges: setup OB 3.0 (keypair Ed25519 + .well-known) | Fase 3 (3.4) | @digitalcredentials/* npm packages |
| Badges: otorgamiento automatico (curso) | Fase 5-B | Requiere cache_completions + cache_grades |
| Badges: mini-badge inline en sidebar/curso | Fase 5-B | user_badges + frontend |
| Badges: vista "Mis logros" (estudiante) | Fase 5-C | user_badges + nueva pagina |
| Badges: seccion SDPA docente + progreso TIC/IA | Fase 5-C | mv_progreso_sdpa |
| Badges: insignias manuales (admin/DI) | Fase 5-C | endpoint POST grant |
| Badges: export PDF de logros | Fase 5+ | user_badges + generador PDF |
| Badges: verificacion publica (link unico) | Fase 5+ | endpoint /badge/:hash |
| Microcredenciales: schema + definiciones | Fase 3 (3.4) | microcredencial_definitions + requisitos |
| Microcredenciales: otorgamiento automatico | Fase 5-C | Requiere badges modulo + reglas composicion |
| Microcredenciales: vista "Mi trayectoria" (estudiante postgrado) | Fase 5-C | v_progreso_microcredenciales |
| Microcredenciales: itinerarios DEC (cursos → diplomado) | Fase 5+ | misma logica, datos DEC |
| Microcredenciales: admin panel (crear/editar credenciales) | Fase 5+ | endpoints admin |
| Microcredenciales: verificacion publica + export PDF | Fase 5+ | endpoint /microcredencial/:hash |
| Progreso hacia grado (barra informativa) | Fase 5+ | datos desde badges modulo vs total programa |
| Accesibilidad audit | Transversal | Desde Fase 3, validar en cada PR |
| Mobile-first responsive | Transversal | Desde Fase 3, disenar mobile-first |
| --- | --- | --- |
| Chatbot generico (sin contexto curso) | Fase 3-A | Ya existe, solo incluir en HTML |
| Chatbot contextual (con datos del curso) | Fase 5-B | Requiere datos del curso + system prompt extendido |
| Quick actions del chatbot | Fase 5-B | Requiere cache de datos del curso |
| Schema notifications | Fase 4 (4.6) | Tabla + indices |
| Cron genera notificaciones | Fase 4 (4.6) | Cache + cron engine |
| Badge + dropdown notificaciones (web) | Fase 5-B | Tabla notifications + polling |
| Push notifications (mobile) | Fase 5-B | Firebase + device_tokens (ya existe) |

**Nota importante**: la Fase 3 del SPEC.md entrega un curso virtual funcional pero SIN datos personalizados del estudiante (sin progresion, sin notas). Es un "visor inteligente" del curso. Los datos personalizados llegan en Fase 5, que depende de Fase 4 (cron/cache). El spec del curso virtual describe el producto FINAL (Fase 5 completada).

---

## Orden de implementacion propuesto

### Fase 3-A — Estructura y bienvenida (MVP visor)
1. Revisar induccion2026.udfv.cloud con David como referencia visual (capturas/descripcion)
2. Reescribir `curso-virtual.html` con layout sidebar + area principal (mobile-first)
3. Reemplazar emojis por iconos SVG (Lucide)
4. Seccion Inicio (datos de piac_parsed + defaults institucionales)
5. Nucleos con contenido (desde API existente, sin completion)
6. Estructura semantica HTML + accesibilidad base
7. Barra superior con recursos compartidos (ya existe en API)
8. Incluir chatbot generico (shared/chatbot.js — ya funcional, solo incluir en HTML)
9. Schema `curso_virtual_config` + `institutional_defaults` + `curso_virtual_bibliografia` + `badge_definitions` + `user_badges`
10. Endpoints config basicos (GET/PUT)
11. Datos semilla de badge_definitions (INSERT inicial)

### Fase 3-B — Visado y configuracion DI
9. Toggle de visado en panel DI
10. UI de configuracion del curso virtual (pestanas)
11. Preview del curso virtual para DI
12. Flujo publicar/despublicar
13. Fallback para cursos sin PIAC o no publicados

### Fase 5-A — Identidad y cache
14. Tabla `user_moodle_mapping` + resolucion por email
15. Tablas de cache (completions, grades, submissions, calendar, recordings)
16. Verificar permisos de tokens REST en las 5 plataformas
17. Endpoints de lectura con cache (completion, grades)

### Fase 5-B — Experiencia personalizada
18. Barras de progresion por nucleo (completion)
19. Feedback inline (notas por actividad)
20. Seccion Evaluaciones completa (rubricas, estados, notas)
21. Grabaciones por sesion (mod_data entries)
22. Calendario visual inline
23. Badge + dropdown de notificaciones en top bar
24. Push notifications mobile (usa sendPushNotification existente)
25. Chatbot contextual: system prompt extendido con datos del curso + quick actions
26. Boton "Actualizar" para refresh de datos
27. Otorgamiento automatico de insignias de curso (nucleo_completado, curso_completado, nota_destacada, etc.)
28. Mini-badges inline en sidebar y secciones del curso

### Fase 5-C — Pulido y reconocimiento
29. Busqueda intra-curso
30. Export calendario .ics
31. Notificaciones de foro (menor prioridad)
32. Audit accesibilidad completo (axe-core + lector pantalla)
33. Politicas y textos institucionales editables por admin
34. Manejo de errores y degradacion graceful
35. Pagina "Mis logros" (vista estudiante: grid de insignias, progreso, estadisticas)
36. Seccion "Mi desarrollo academico" para docentes (progreso SDPA, certificacion TIC, ruta IA)
37. Panel admin: otorgar/revocar insignias manuales
38. Export PDF de logros del usuario (para portafolio/acreditacion)
39. Verificacion publica de insignias (umce.online/badge/{hash})
40. Dashboard de calidad bibliografica por curso (DI)
41. Dashboard bibliografico agregado institucional + export CSV (admin, CNA)

Cada sub-fase es desplegable e iterable. Se puede hacer demo al final de cada una.
