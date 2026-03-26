# Notas de sesion: Revision del CURSO-VIRTUAL-SPEC.md

**Fecha**: 25-mar-2026
**Participantes**: David (coordinador UDFV) + Claude (Cowork)
**Resultado**: CURSO-VIRTUAL-SPEC.md v2 completo (1063 lineas, 19 secciones)

Este documento resume las decisiones tomadas, el razonamiento detras de cada seccion del spec, y lo que queda pendiente para Claude Code. Leerlo ANTES de empezar a codificar.

---

## Que se hizo en esta sesion

Se reviso el spec original (258 lineas) del curso virtual contra:
1. **Quality Matters Higher Ed Rubric 7a edicion** (44 estandares, 22 esenciales)
2. **Benchmark de plataformas modernas** (Coursera, edX, Canvas)
3. **Codebase existente** (server.js, curso-virtual.html, SPEC.md, schema)
4. **Viabilidad tecnica** (APIs Moodle, permisos, datos disponibles)

El resultado es un spec v2 con 19 secciones que cubre: experiencia del estudiante, experiencia del DI, arquitectura tecnica, accesibilidad, chatbot contextual, notificaciones push, cache, identidad, errores, edge cases, y mapeo a fases del SPEC.md.

---

## Decisiones de David validadas en esta sesion

### 1. Resolucion de identidad (estudiante → Moodle)
- **Decision**: se resuelve por email @umce.cl (es el mismo en ambos sistemas)
- **Estrategia**: `core_user_get_users_by_field(field=email)` + cache en tabla `user_moodle_mapping`
- **Pendiente para Claude Code**: verificar empiricamente que los tokens REST tienen permisos para esta llamada y para completion/grades en las 5 plataformas. Probar con email de David como caso de prueba.
- **NO especular sobre permisos** — probarlo directo con `moodleCall`.

### 2. Chatbot contextual
- **Decision**: David quiere chatbot dentro del curso virtual con contexto del curso
- **Estrategia**: reutilizar `claude-proxy-container` + `/api/chat/message` existentes. Agregar parametro `linkId` para inyectar datos del curso al system prompt.
- **Interfaz**: FAB flotante, panel con quick actions ("Proximas entregas", "Grabaciones", "Contactar docente"), fullscreen en mobile
- **Fase**: chatbot generico en Fase 3-A (solo incluir shared/chatbot.js), chatbot contextual en Fase 5-B

### 3. Push notifications
- **Decision**: usar infraestructura Firebase + `device_tokens` + `sendPushNotification` que ya existe
- **Estrategia**: tabla `notifications` nueva, cron de Fase 4 genera filas, push se dispara con `sendPushNotification`, web usa polling
- **Fase**: schema en Fase 4, UI badge+dropdown en Fase 5-B

### 4. Portal publico / marketing
- **Decision**: David quiere mejorar umce.online (portal publico) y en el futuro generar landing pages publicas de programas/cursos usando datos del PIAC
- **Estrategia**: primero construir Fase 3 del curso virtual (genera los datos), despues crear landing pages publicas que se alimenten de esos datos
- **No bloquea Fase 3** — es trabajo posterior

### 5. Referencia visual induccion2026.udfv.cloud
- **Decision**: usar como modelo de UX para el curso virtual
- **Pendiente**: Claude Code debe acceder al sitio (requiere autenticacion con RUT de David: 17382457-2) y extraer patrones de UX antes de disenar
- **Nota**: Cowork no pudo acceder por restriccion de red

---

## Brechas criticas encontradas (resueltas en el spec v2)

### QM — estandares esenciales que faltaban:
- **1.1**: conocimientos previos, presentacion docente rica, foro presentacion estudiantes
- **2.2-2.4**: objetivos por semana/modulo, conexion visible objetivo→actividad→evaluacion
- **3.2**: rubrica inline (no solo link a Moodle)
- **3.5**: politica integridad academica (nuevo en 7a ed)
- **4.3, 4.5**: atribucion de materiales, distincion obligatorio/complementario
- **5.4-5.5**: tiempos de respuesta docente, requisitos participacion
- **6.4**: privacidad de herramientas tecnologicas
- **7.2-7.4**: servicios institucionales (biblioteca, accesibilidad, bienestar)
- **8.1-8.6**: accesibilidad COMPLETA — no se mencionaba en el spec original

### Tecnicas:
- **Ninguna API de datos personalizados implementada**: completion, grades, calendar, submissions, recordings — todas faltan en server.js
- **HTML actual usa emojis como iconos** (contrario al spec) y es scroll vertical plano (no sidebar)
- **Sin estrategia de cache** — consultar 5+ APIs Moodle en tiempo real no escala
- **Sin mapeo identidad** — ya resuelto (ver decision #1)
- **Sin tabla para config del DI** — spec define `curso_virtual_config` + `institutional_defaults`

### Experiencia del DI:
- **No existia UI de configuracion** del curso virtual (distinta del panel PIAC de analisis)
- **17 campos configurables** definidos, 4 obligatorios con defaults institucionales
- **Flujo publicar/despublicar** para controlar cuando los estudiantes ven el curso virtual

---

## Lo que NO debe hacer Claude Code

(Extraido de CLAUDE.md + anti-patrones reales del proyecto)

1. **NO empezar a codificar sin leer el SPEC.md** para saber en que fase esta el proyecto
2. **NO leer todo el codebase al inicio** — solo lo que SPEC indica para la fase actual
3. **NO crear archivos de plan/estado fuera de SPEC.md** — ya existe CURSO-VIRTUAL-SPEC.md, no duplicar
4. **NO ejecutar loops autonomos** — proponer que se va a hacer, David valida, luego ejecutar
5. **NO usar Next.js, React, TypeScript** — el stack es Express + vanilla JS + Tailwind CDN
6. **NO crear formulario que reemplace el PIAC** — se lee desde Drive
7. **NO hacer que la IA cree/modifique en Moodle** — solo lectura
8. **NO especular sobre permisos de APIs Moodle** — probarlos directamente

---

## Mapeo: que construir en cada fase

### Fase 3 (siguiente a implementar):
- Layout sidebar + area principal (reescribir curso-virtual.html)
- Iconos SVG (Lucide) reemplazando emojis
- Seccion Inicio completa (bienvenida, objetivos, "como funciona", soporte)
- Nucleos con contenido Moodle (desde API existente)
- Barra superior con recursos compartidos
- Chatbot generico (incluir shared/chatbot.js)
- Schema `curso_virtual_config` + `institutional_defaults`
- Toggle visado DI + UI configuracion + preview + publicar
- Fallback para cursos sin PIAC
- Accesibilidad base desde el inicio
- **SIN datos personalizados** (sin completion, sin notas) — eso es Fase 5

### Fase 4 (cron):
- Tablas cache (completions, grades, submissions, calendar, recordings)
- Tabla notifications
- Cron frecuente + nocturno + horario
- Push notifications via sendPushNotification existente

### Fase 5 (experiencia personalizada):
- Resolucion identidad (user_moodle_mapping + verificar permisos)
- Barras de progresion, notas inline, evaluaciones completas
- Grabaciones individuales, calendario inline
- Badge + dropdown notificaciones
- Chatbot contextual (system prompt con datos del curso)
- Busqueda intra-curso, export .ics, audit accesibilidad

---

## Archivos clave que Claude Code debe conocer

| Archivo | Que es | Cuando leerlo |
|---------|--------|---------------|
| `CLAUDE.md` | Reglas irrompibles del proyecto | Se carga solo, siempre |
| `SPEC.md` | Fases de desarrollo con estado | Inicio de cada sesion |
| `CURSO-VIRTUAL-SPEC.md` | Spec completo del curso virtual (este doc es la referencia) | Antes de tocar curso-virtual |
| `src/server.js` lineas 2893-3021 | API /api/curso-virtual existente | Al implementar Fase 3 |
| `src/public/curso-virtual.html` | HTML actual (se reescribe en Fase 3) | Al implementar Fase 3 |
| `src/server.js` lineas 1202-1399 | Chatbot API existente | Al implementar chatbot contextual |
| `src/server.js` lineas 622-743 | Push notifications existentes | Al implementar notificaciones |
| `src/schema-piac.sql` | Schema actual de tablas PIAC | Al crear nuevas tablas |

---

## Paginas de Notion que Claude Code DEBE leer antes de codificar

El proyecto tiene contexto estrategico en Notion que no esta en el repo. Claude Code debe leer estas paginas via MCP de Notion antes de empezar la Fase 3:

| Pagina | ID Notion | Que contiene | Por que importa |
|--------|-----------|--------------|-----------------|
| Proyecto UMCE.online — Ecosistema Academico Virtual | 32e0778552798118ab7dcf2563971f21 | Pagina indice del proyecto, vision general | Contexto del ecosistema completo |
| Diseno de curso virtual Moodle UMCE | 183077855279807a9106e8f0a6b0c12a | Elementos basales de un curso online UMCE | Define que debe tener un curso — validar contra el spec |
| Investigacion competitiva: Posicionamiento digital | 32e07785527981fca8ccfbc506a52a56 | Benchmark de marketing educacion virtual | Alimenta la estrategia de landing pages publicas |
| Arquitectura UMCE.online | 32e07785527981b48f90e52a5db26506 | Vision del sistema completo, diagramas | Validar que el curso virtual encaja en la arquitectura |
| Motor IA: Cron + LLM | 32e077855279818ea757d4449a7c4760 | Diseño del motor IA que corre sobre PIAC+Moodle | Contexto para Fase 4 (cron) |

**Especialmente criticas antes de Fase 3**: la pagina "Diseno de curso virtual Moodle UMCE" puede tener definiciones que complementen o contradigan el CURSO-VIRTUAL-SPEC.md. Claude Code debe leerla y reconciliar cualquier diferencia ANTES de empezar a codificar.

**Nota**: en la sesion de Cowork, Notion MCP dio timeout al intentar leer estas paginas. Claude Code debe intentar de nuevo — si Notion falla, preguntar a David.

---

## Pendientes para Claude Code

1. **induccion2026.udfv.cloud**: acceder con RUT 17382457-2, revisar patrones de UX, y documentar cuales aplican al curso virtual antes de diseñar. Esto deberia ser el paso 1 de Fase 3-A.

2. **Notion**: leer las 5 paginas listadas arriba, especialmente "Diseno de curso virtual Moodle UMCE" y "Investigacion competitiva". Reconciliar con CURSO-VIRTUAL-SPEC.md.

3. **Portal publico / marketing**: David quiere mejorar umce.online y en el futuro crear landing pages publicas de programas usando datos del PIAC. La pagina de Notion "Investigacion competitiva" tiene el benchmark. Esto se construye DESPUES de Fase 3, usando los mismos datos.

4. **Verificar APIs Moodle**: probar empiricamente completion, grades, user lookup con los tokens existentes en las 5 plataformas.

---

## Documentos institucionales de calidad docente (contexto para Claude Code)

David compartio 5 documentos institucionales sobre competencias digitales docentes y formacion academica. Son relevantes porque definen el marco de calidad al que responde el curso virtual: los docentes que disenan y ensanan en estos cursos virtuales estan siendo formados y certificados bajo estos estandares. Claude Code debe conocer este contexto.

Los documentos estan copiados en `docs/contexto-institucional/` dentro de este repo.

### Documentos y su relevancia para el curso virtual

| Documento | Que contiene | Conexion con el curso virtual |
|-----------|--------------|-------------------------------|
| `Certificacion-competencias-digitales-docentes.pdf` | Sistema de certificacion TIC en 3 niveles (Inicial 27h, Intermedio 54h, Avanzado 81h). Marco TPACK. 3 dominios × 4 ambitos × 3 niveles. Proyecto UMC21992. Implementacion gradual 2025-2027. | Define las competencias que los docentes/DI deben tener para disenar cursos virtuales de calidad. El dominio "Plataformas, recursos y ciudadania digital" incluye el ambito "Entornos Virtuales de Aprendizaje" — esto es exactamente lo que el curso virtual implementa. |
| `Ruta-Formativa-IA.docx` | 12 cursos en 3 niveles para competencias en IA (40h + 44h + 48h = 132h total). Desde alfabetizacion hasta liderazgo e investigacion. | Estos cursos de la ruta formativa podrian ser contenido que se imparte a traves del propio curso virtual en el futuro. Ademas, el Curso 10 "Innovacion pedagogica y Diseno Instruccional con IA" es directamente relevante para los DI que usan la plataforma. |
| `Propuesta-Ruta-Formativa-IA.docx` | Justificacion de la ruta formativa. Alineacion con MINEDUC y TPACK. Sugerencias operacionales: modelo hibrido, certificacion progresiva, comunidades de practica, evaluacion continua. | Las sugerencias operacionales (modelo hibrido, progresion certificada, comunidades de practica) aplican directamente al diseno UX del curso virtual — por ejemplo, la barra de progresion, los badges, el foro de presentacion. |
| `Marco-Competencias-TIC-UMCE.docx` | Detalle del primer nivel de certificacion (Inicial). | Complementa la tabla del PDF con mas detalle sobre indicadores del nivel inicial. |
| `Sistema-Desarrollo-Academico-SDPA.docx` | SDPA con 6 lineas de desarrollo, 4 programas. Linea 3.6 "Integracion Pedagogica de TIC" es la que aloja la formacion virtual. Incluye programas de induccion, actualizacion, innovacion, y mentoria. | El curso virtual es una herramienta del SDPA — especificamente de la linea 3.6 y del programa de actualizacion. Los cursos de formacion docente de la UDFV eventualmente se impartiran a traves de esta plataforma. El SDPA da respaldo institucional a los estandares de calidad que el spec busca cumplir. |

### Conexiones clave para el desarrollo

1. **El curso virtual ES la herramienta del ambito "Entornos Virtuales de Aprendizaje"** del Marco de Competencias TIC. Lo que se construye debe ser lo suficientemente bueno como para ser el estandar que los docentes aprenden a usar en su certificacion.

2. **Doble rol: herramienta Y contenido**. El curso virtual sirve tanto para impartir cursos regulares de pregrado/postgrado como para los propios cursos de formacion docente de la UDFV (Ruta Formativa IA, certificacion TIC). Esto refuerza la importancia de que la UX sea excelente.

3. **Los defaults institucionales del spec (`institutional_defaults`)** deben reflejar los estandares del Marco de Competencias TIC. Por ejemplo, los campos obligatorios del DI (objetivos del curso, informacion del docente, politica de integridad) son coherentes con lo que la certificacion TIC exige al docente certificado a nivel Intermedio.

4. **La seccion "Soporte institucional" del curso virtual** (QM Standard 7) debe incluir enlaces al SDPA y sus programas, ya que son servicios reales de la UMCE para estudiantes y docentes.

5. **Accesibilidad y ciudadania digital** — el dominio 3 del Marco ("Plataformas, recursos y ciudadania digital") incluye "Etica, seguridad y bienestar digital", lo que refuerza la necesidad de la seccion de privacidad (QM 6.4) y accesibilidad (QM Standard 8) del spec.

### Idea validada por David: Insignias y progreso SDPA en la plataforma

David propuso que el sistema muestre el progreso del docente/academico en el SDPA — insignias por cursos de capacitacion completados, progreso hacia la certificacion TIC (Inicial/Intermedio/Avanzado), badges por cursos de la Ruta Formativa IA, etc.

**YA INCORPORADO AL SPEC**: Sistema completo de reconocimiento academico e insignias incorporado a CURSO-VIRTUAL-SPEC.md:
- Nueva seccion "Reconocimiento academico e insignias" con 3 categorias: curso (automaticas), trayectoria (cross-curso), y manuales (admin/DI)
- 10 insignias de curso/trayectoria para estudiantes + 4 insignias SDPA para docentes + 4 insignias manuales = 18 badge_definitions semilla
- Schema SQL: `badge_definitions` (catalogo) + `user_badges` (otorgadas) + `mv_progreso_sdpa` (vista materializada)
- 8 endpoints nuevos: CRUD badges, progreso SDPA, verificacion publica, export PDF, estadisticas admin
- Vista "Mis logros" disenada para estudiantes y docentes, con seccion "Mi desarrollo academico" que muestra progreso certificacion TIC y Ruta IA
- Reglas de otorgamiento automatico con triggers desde cache_completions/grades/submissions
- Verificacion publica via `umce.online/badge/{hash}`
- Mini-badges inline en sidebar y secciones del curso

**Fases**: schema + datos semilla en Fase 3; otorgamiento automatico + inline badges en Fase 5-B; pagina "Mis logros" + SDPA + export + verificacion publica en Fase 5-C.

**ACTUALIZADO — Modularizacion y microcredenciales**: David pidio que se cubriera la modularizacion de la oferta formativa, que estaba documentada en Notion. Se leyo la pagina "Analisis: Problemas, Practicas Identificadas y Soluciones Propuestas" (Notion, marzo 2026) que define la hoja de ruta institucional de modularizacion en 3 fases (2026: certificacion por modulo; 2027-28: microcredenciales apilables; 2029+: RAP + movilidad). Esto se incorporo al spec como:

- **Arquitectura de 4 niveles**: Logro (nivel 1) → Modulo completado (nivel 2) → Microcredencial (nivel 3) → Grado (nivel 4, informativo)
- Nuevo schema SQL: `microcredencial_definitions` (catalogo), `microcredencial_requisitos` (reglas de composicion: que modulos componen cada microcredencial), `user_microcredenciales` (otorgadas), `v_progreso_microcredenciales` (vista de progreso)
- Nueva categoria de badge: 'modulo' (la unidad basica de modularizacion — asignatura aprobada)
- Logica de otorgamiento automatico: cuando se otorga un badge de modulo, se verifica si el estudiante ya cumple los requisitos de alguna microcredencial
- Ejemplo concreto con MEIGLIP: 4 modulos obligatorios = Diplomado en Educacion Intercultural (salida intermedia)
- Vista "Mi trayectoria" para estudiantes de postgrado: diagrama de itinerario + progreso hacia grado
- 9 endpoints nuevos para microcredenciales (user + admin + verificacion publica)
- Mapeo features→fases actualizado

**Fuente Notion**: pagina ID `32e0778552798188bb3bed8b6a7b72dd` — Claude Code puede leerla para contexto adicional sobre problemas identificados (P1-P10) y practicas ya implementadas.

**ACTUALIZADO — Open Badges 3.0**: David valido que las insignias y microcredenciales se emitan en formato Open Badges 3.0 (W3C Verifiable Credentials). Esto hace las credenciales portables a LinkedIn, Europass, wallets digitales, etc.

Stack tecnico: 5 paquetes npm del MIT Digital Credentials Consortium (`@digitalcredentials/vc`, `@digitalcredentials/open-badges-context`, `@digitalcredentials/signing-service`, `@digitalcredentials/sign-and-verify-core`, `@digitalcredentials/keypair`). Todos MIT license, Node.js.

**IMPORTANTE para Claude Code**: CLAUDE.md dice "Solo 3 dependencias: express, firebase-admin, multer". Los paquetes @digitalcredentials/* son dependencias adicionales necesarias para Open Badges 3.0. David debe aprobar esta excepcion a la regla de CLAUDE.md antes de instalarlas. Propuesta: actualizar CLAUDE.md a "3 dependencias core + @digitalcredentials/* para credenciales verificables". Confirmar con David.

Detalle tecnico en CURSO-VIRTUAL-SPEC.md seccion "Formato de emision: Open Badges 3.0" — incluye ejemplo JSON-LD completo, flujo de emision, gestion de claves Ed25519, y columnas SQL adicionales (credential_json, badge_image_url).

### Idea validada por David: Validacion de fuentes bibliograficas para acreditacion

David pidio que la seccion bibliografica del curso virtual permita validar las fuentes, especialmente para fines de acreditacion y calidad.

**Que deberia hacer el sistema**:
- Cada recurso bibliografico que el DI ingresa tiene metadatos: anio de publicacion, tipo de fuente (libro, articulo, recurso web, norma), DOI o URL, acceso (abierto/licenciado), idioma
- Chequeos automaticos: deteccion de links rotos (cron periodico), alerta si recurso tiene mas de 5 anios, verificacion de DOI via API de CrossRef
- Dashboard de calidad bibliografica por curso: "X% fuentes ultimos 5 anios", "Y enlaces activos de Z totales", "N fuentes con DOI verificado" — esto sirve directamente como evidencia para acreditacion CNA y cumple QM Standard 4 (Instructional Materials)
- Alerta al DI cuando un enlace se rompe o un recurso queda desactualizado

**YA INCORPORADO AL SPEC**: Esta idea fue desarrollada completamente e incorporada a CURSO-VIRTUAL-SPEC.md:
- Seccion 4 expandida con vista estudiante + sistema de validacion + dashboard de calidad
- Schema SQL `curso_virtual_bibliografia` con metadatos, campo `vigente` calculado (GENERATED ALWAYS), toggle `es_clasico`
- Vista materializada `mv_calidad_bibliografica` para dashboard de acreditacion
- 7 endpoints nuevos (CRUD bibliografia + dashboard calidad + export CSV)
- Pestana "Bibliografia" en flujo de configuracion del DI
- Mapeo features→fases actualizado

**Fases**: schema + vista estudiante + pestana DI en Fase 3; cron validacion URLs/DOI en Fase 4; dashboards en Fase 5+.

**Conexion QM**: Standard 4.1, 4.3, 4.4, 4.5. Evidencia directa para acreditacion CNA.

### Lo que NO hacer con estos documentos

- **NO son requisitos funcionales directos** — son contexto institucional que informa decisiones de diseno
- **NO crear un modulo de certificacion TIC** dentro del curso virtual — eso es otro sistema
- **NO exponer estos documentos a los estudiantes** — son documentos internos de la UDFV/UDA

---

## Sesion 26-mar-2026: Asistente de solicitud de correo institucional

### Contexto del dolor

**Fuentes consultadas**:
- Notion: "Clasificacion de Solicitudes UDFV (Correo Institucional)" — db 548d331d
- Notion: Categoria "Acceso / credenciales a plataforma" — page 2cc73edd
- Notion: Categoria "Solicitud de acceso / habilitacion de usuario nuevo en programa" — page 695c4458
- Notion: "Formulario de Contacto Chatbot UMCE" — page 1ee07785
- Notion: "Analisis: Problemas, Practicas y Soluciones" — page 32e07785
- Google Drive: "Estrategia Integral para la Virtualizacion Institucional (Mesa 2)" — doc 1DimRhk...
- Google Drive: "FAQ Moodle UMCE Estudiantes" — doc 1ArCzfj...

**Problema triple identificado**:

1. **El estudiante no sabe que hacer**: Llega a la UMCE, necesita correo @umce.cl, no sabe a quien escribir ni que datos dar. El FAQ actual solo dice "contacta soporte tecnico". No hay autoservicio ni guia paso a paso.

2. **El equipo UDFV recibe solicitudes desestructuradas**: Llegan correos tipo "no puedo entrar" sin RUT, sin nombre de programa, sin especificar si es correo, Moodle, o Ucampus. Requiere 2-3 intercambios de email para clasificar y resolver.

3. **No hay trazabilidad**: No se sabe cuantas solicitudes hay en cola, cuanto demoran, ni si se resolvieron. La base de Notion clasifica tipos pero no trackea tickets individuales.

**Dato critico**: El correo @umce.cl es prerequisito para acceder a Moodle via Microsoft OAuth (Opcion B en FAQ). Sin correo → sin plataforma virtual → sin acceso a clases. Es un bloqueador critico para estudiantes nuevos.

**Contexto institucional**: Mesa 2 UMCE diagnostico "credenciales multiples para distintos sistemas" como brecha critica. La solucion deberia apuntar a simplificar, no a agregar otro sistema.

### Diseno del asistente: "Solicitud de Correo Institucional UMCE"

#### Principio de diseno

NO es un chatbot conversacional — es un **flujo guiado tipo wizard** integrado en umce.online que:
1. Diagnostica si el problema es realmente de correo o de otra credencial
2. Recopila datos estructurados en un solo paso (evita el ping-pong por email)
3. Genera un ticket trackeable
4. Conecta con el equipo correcto segun el tipo de solicitud

#### Tipos de solicitud que cubre

Derivado del analisis de las categorias Notion:

| Tipo | Descripcion | Responsable | Auto-resolvible? |
|------|------------|-------------|-----------------|
| `correo_nuevo` | Estudiante nuevo que nunca recibio su @umce.cl | DTI / Soporte | NO — requiere creacion manual |
| `correo_recuperacion` | Tiene correo pero olvido contrasena | DTI / Microsoft | SI — redirigir a reset Microsoft |
| `correo_bloqueado` | Correo existe pero esta bloqueado/deshabilitado | DTI | NO — requiere verificacion |
| `moodle_acceso` | No puede entrar a Moodle (no es problema de correo) | UDFV Soporte | PARCIAL — FAQ + escalamiento |
| `ucampus_acceso` | No puede entrar a Ucampus | Registro Curricular | NO — derivar |
| `habilitacion_masiva` | Coordinacion pide habilitar cohorte completa | UDFV Gestion | NO — requiere listado |

#### Flujo del wizard (6 pasos)

```
PASO 1: Identificacion
  ¿Quien eres?
  → Estudiante / Docente / Funcionario / Coordinacion academica
  (Si coordinacion → flujo masivo separado)

PASO 2: Diagnostico
  ¿Cual es tu problema?
  → "No tengo correo @umce.cl" → correo_nuevo
  → "Olvide mi contrasena del correo" → correo_recuperacion (auto-resolvible)
  → "Mi correo esta bloqueado" → correo_bloqueado
  → "No puedo entrar a Moodle/Evirtual" → moodle_acceso
  → "No puedo entrar a Ucampus" → ucampus_acceso
  → "Otro problema" → consulta_general

PASO 3a: Auto-resolucion (si aplica)
  Para correo_recuperacion:
    "Puedes recuperar tu contrasena directamente en:"
    → Link a https://passwordreset.microsoftonline.com/
    → Instrucciones paso a paso con capturas
    → "¿Pudiste resolverlo?" → SI (fin) / NO (escalar a ticket)

  Para moodle_acceso:
    → Verificar: "¿Estas usando tu RUT con guion y sin puntos?"
    → "¿Intentaste la Opcion B con correo institucional?"
    → Si ya intento todo → escalar a ticket

PASO 3b: Recopilacion de datos (si requiere ticket)
  Formulario estructurado segun tipo:

  correo_nuevo:
    - Nombre completo
    - RUT (validado con digito verificador)
    - Programa de estudios (select desde lista de programas activos)
    - Cohorte de ingreso (anio)
    - Numero de matricula (si lo tiene)
    - Correo personal alternativo (para responder)

  correo_bloqueado:
    - Nombre completo
    - RUT
    - Correo @umce.cl (el que tiene bloqueado)
    - Programa
    - Desde cuando esta bloqueado
    - Ultimo mensaje de error (texto o screenshot)

  habilitacion_masiva:
    - Nombre del solicitante
    - Programa
    - Tipo: estudiantes / docentes
    - Cantidad
    - Listado (upload CSV o pegar nombres+RUT)
    - Fecha limite de habilitacion

PASO 4: Confirmacion
  Resumen de datos ingresados
  "¿Todo correcto?" → Editar / Confirmar

PASO 5: Ticket generado
  "Tu solicitud #UMCE-2026-0042 fue registrada"
  → Tiempo estimado de respuesta segun tipo
  → Correo de confirmacion al email alternativo
  → Codigo QR/link para consultar estado

PASO 6: Seguimiento
  Pagina publica de estado del ticket:
  → Recibido → En proceso → Resuelto
  → Notificacion por email cuando cambia estado
```

#### Schema SQL propuesto

```sql
-- Tipos enumerados
CREATE TYPE tipo_solicitud_acceso AS ENUM (
  'correo_nuevo', 'correo_recuperacion', 'correo_bloqueado',
  'moodle_acceso', 'ucampus_acceso', 'habilitacion_masiva',
  'consulta_general'
);

CREATE TYPE estado_solicitud AS ENUM (
  'recibido', 'en_proceso', 'esperando_info',
  'derivado', 'resuelto', 'cerrado'
);

CREATE TYPE rol_solicitante AS ENUM (
  'estudiante', 'docente', 'funcionario', 'coordinacion'
);

-- Tabla principal de solicitudes
CREATE TABLE solicitudes_acceso (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL, -- 'UMCE-2026-0042'
  tipo tipo_solicitud_acceso NOT NULL,
  estado estado_solicitud NOT NULL DEFAULT 'recibido',
  rol_solicitante rol_solicitante NOT NULL,

  -- Datos del solicitante
  nombre_completo TEXT NOT NULL,
  rut TEXT NOT NULL, -- validado con digito verificador
  email_alternativo TEXT, -- para comunicacion si no tiene @umce.cl
  email_umce TEXT, -- si ya tiene uno
  telefono TEXT,

  -- Contexto academico
  programa_id INTEGER, -- FK a programs si existe
  programa_nombre TEXT, -- texto libre como fallback
  cohorte INTEGER,
  numero_matricula TEXT,

  -- Detalles del problema
  descripcion TEXT,
  mensaje_error TEXT,
  screenshot_url TEXT,

  -- Para habilitacion masiva
  cantidad_usuarios INTEGER,
  listado_csv_url TEXT,
  fecha_limite DATE,

  -- Trazabilidad
  responsable_asignado TEXT,
  area_responsable TEXT, -- 'DTI', 'UDFV Soporte', 'Registro Curricular'
  notas_internas TEXT,
  auto_resuelto BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Indice para busqueda rapida por codigo
CREATE INDEX idx_solicitudes_codigo ON solicitudes_acceso(codigo);
CREATE INDEX idx_solicitudes_rut ON solicitudes_acceso(rut);
CREATE INDEX idx_solicitudes_estado ON solicitudes_acceso(estado);

-- Historial de cambios de estado
CREATE TABLE solicitudes_acceso_historial (
  id SERIAL PRIMARY KEY,
  solicitud_id INTEGER NOT NULL REFERENCES solicitudes_acceso(id),
  estado_anterior estado_solicitud,
  estado_nuevo estado_solicitud NOT NULL,
  nota TEXT,
  actor TEXT, -- quien hizo el cambio
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vista para dashboard de gestion UDFV
CREATE VIEW v_solicitudes_pendientes AS
SELECT
  s.codigo, s.tipo, s.estado, s.rol_solicitante,
  s.nombre_completo, s.programa_nombre, s.area_responsable,
  s.created_at,
  EXTRACT(EPOCH FROM (now() - s.created_at)) / 3600 AS horas_en_espera,
  (SELECT COUNT(*) FROM solicitudes_acceso_historial h WHERE h.solicitud_id = s.id) AS cambios_estado
FROM solicitudes_acceso s
WHERE s.estado NOT IN ('resuelto', 'cerrado')
ORDER BY
  CASE s.tipo
    WHEN 'habilitacion_masiva' THEN 1
    WHEN 'correo_nuevo' THEN 2
    WHEN 'correo_bloqueado' THEN 3
    ELSE 4
  END,
  s.created_at ASC;

-- Vista para metricas
CREATE VIEW v_metricas_solicitudes AS
SELECT
  tipo,
  COUNT(*) FILTER (WHERE estado NOT IN ('resuelto','cerrado')) AS pendientes,
  COUNT(*) FILTER (WHERE estado = 'resuelto') AS resueltas_total,
  COUNT(*) FILTER (WHERE auto_resuelto) AS auto_resueltas,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
    FILTER (WHERE resolved_at IS NOT NULL) AS horas_promedio_resolucion,
  AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 3600)
    FILTER (WHERE first_response_at IS NOT NULL) AS horas_promedio_primera_respuesta
FROM solicitudes_acceso
GROUP BY tipo;
```

#### Endpoints API

```
-- Publicos (sin auth, con rate limiting)
POST   /api/solicitudes-acceso          → Crear solicitud (wizard)
GET    /api/solicitudes-acceso/:codigo   → Consultar estado (por codigo)
GET    /api/programas-activos            → Lista para select del formulario

-- Protegidos (auth @umce.cl, rol admin/editor)
GET    /api/admin/solicitudes            → Lista paginada con filtros
PATCH  /api/admin/solicitudes/:id/estado → Cambiar estado + nota
GET    /api/admin/solicitudes/metricas   → Dashboard de metricas
GET    /api/admin/solicitudes/export     → Export CSV para reporte
```

#### Paginas HTML

```
public/solicitar-acceso.html      → Wizard publico (6 pasos)
public/consultar-solicitud.html   → Estado de ticket por codigo
public/admin/solicitudes.html     → Dashboard de gestion (protegido)
```

#### Integracion con chatbot existente

El chatbot de virtual.umce.cl ya existe y usa la FAQ de Moodle como base de conocimiento. El asistente de correo se integra asi:

1. **Deteccion de intencion**: Si el chatbot detecta frases como "no tengo correo", "no puedo entrar", "usuario invalido" → ofrece link al wizard
2. **No duplicar**: El chatbot NO intenta resolver el problema conversacionalmente — solo diagnostica y redirige al wizard estructurado
3. **Retroalimentacion**: Los tickets resueltos alimentan nuevas entradas del FAQ ("¿Sabes que puedes recuperar tu contrasena en...?")

#### Validacion de RUT (funcion utilitaria)

```javascript
// Validacion de RUT chileno con digito verificador
function validarRut(rut) {
  // Limpiar: quitar puntos, espacios
  const clean = rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
  // Formato esperado: 12345678-K o 12345678-9
  const match = clean.match(/^(\d{7,8})-?([\dK])$/);
  if (!match) return { valid: false, error: 'Formato invalido. Usa: 12345678-9' };

  const cuerpo = match[1];
  const dvIngresado = match[2];

  // Calcular digito verificador
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = suma % 11;
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : String(11 - resto);

  if (dvIngresado !== dvCalculado) {
    return { valid: false, error: 'Digito verificador incorrecto' };
  }

  return { valid: true, rut: `${cuerpo}-${dvCalculado}` };
}
```

#### Notificaciones

- **Al solicitante**: Email al correo alternativo cuando se crea el ticket y cuando cambia de estado
- **Al equipo UDFV**: Notificacion push (si device_tokens existe en schema portal) o email a udfv@umce.cl
- **Escalamiento automatico**: Si un ticket lleva >48h en "recibido" sin primera respuesta → alerta al admin

#### Metricas para acreditacion

Este sistema genera evidencia medible para CNA:
- Tiempo promedio de respuesta a solicitudes de acceso
- Tasa de auto-resolucion (indicador de calidad del autoservicio)
- Volumen de solicitudes por tipo y programa (identifica problemas sistemicos)
- % de solicitudes resueltas en <24h, <48h, >48h

#### Coherencia con stack

- Express + vanilla JS + Tailwind CDN ✓
- Sin dependencias nuevas (solo usa las 3 existentes) ✓
- Schema en Supabase portal (extender, no crear nuevo) ✓
- HTML pages en public/ con shared components ✓
- Validacion de RUT es vanilla JS, sin libreria externa ✓

#### Fase de implementacion sugerida

Esto NO es parte del curso virtual — es un servicio institucional de umce.online. Deberia tener su propio spec o ser una seccion de SPEC.md del proyecto principal. Sugerencia:
- **Fase 1**: Wizard publico + creacion de tickets + pagina de estado (2-3 dias)
- **Fase 2**: Dashboard admin + metricas (1-2 dias)
- **Fase 3**: Integracion con chatbot + notificaciones push (1 dia)
- **Fase 4**: Automatizacion de derivacion + escalamiento (1 dia)

### Instrucciones para Claude Code

Cuando implementes el asistente de solicitud de correo:

1. **Leer**: SESSION-NOTES-CURSO-VIRTUAL.md seccion "Asistente de solicitud de correo institucional"
2. **Schema**: Crear tablas `solicitudes_acceso` + `solicitudes_acceso_historial` en schema portal (Supabase)
3. **Endpoints**: Implementar en server.js usando helpers existentes (supabaseQuery, supabaseInsert, etc.)
4. **Wizard**: public/solicitar-acceso.html — flujo de 6 pasos, vanilla JS, Tailwind CDN
5. **Admin**: public/admin/solicitudes.html — dashboard protegido con auth existente
6. **NO agregar dependencias** — todo se hace con express + las 3 dependencias existentes
7. **Validacion de RUT**: Funcion utilitaria incluida en el diseno (copiar)
8. **Rate limiting**: El endpoint POST /api/solicitudes-acceso es publico, necesita proteccion
9. **Generacion de codigo**: Formato UMCE-{anio}-{secuencial 4 digitos}

### Conexion con Notion

La base "Clasificacion de Solicitudes UDFV" (548d331d) ya tiene la estructura de categorias que alimenta el diagnostico del wizard. Futuro: sincronizar tickets con esa base via Notion API para que el equipo gestione desde donde ya trabaja.
