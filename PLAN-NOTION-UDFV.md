# Plan de reorganización Notion — UDFV Hub
## Actualización: 6 abril 2026 (v3 — lectura completa)

---

## 1. QUÉ ES LA UDFV — Visión completa

La UDFV es la unidad que sostiene toda la educación virtual de la UMCE. Gestiona 18 programas activos con un equipo de 7-8 personas. Su trabajo tiene tres ejes:

### Eje 1: Programas virtuales (el core operativo)
Diseño instruccional, acompañamiento docente, tutorías, QA de cursos, soporte técnico, evaluación. Esto es lo que hace el equipo todos los días.

### Eje 2: Formación TIC institucional
Capacitaciones para académicos UMCE en competencias digitales, IA educativa, Moodle. Liderado por Salomé.

### Eje 3: Gestión estratégica y desarrollo
Política de virtualización, acreditación, modularización, automatización. Liderado por David.

---

## 2. MAPA COMPLETO DE PROGRAMAS VIRTUALES

Fuente: Página "Oferta Formativa UMCE" + BD "🎯 Proyectos" + "Solicitud continuidad" + "Actualización unidad"

### 2.1 MAGÍSTERES con UDFV activa (9 programas)

| Sigla | Programa | Modalidad | Cohortes UDFV | Estado | DI | Coordinador |
|---|---|---|---|---|---|---|
| MEDESP | Mg. Educación Especial | Virtual | 2024, 2025, 2026 | Soporte activo | — | Ximena Acuña |
| MPED | Mg. Política Educacional | Virtual | 2024, 2025, 2026 | Terminado + soporte | Rodrigo Z. | Claudio Almonacid |
| MGEPES | Mg. Gestión Pedagógica Ed. Superior | Virtual/Semipresencial | 2024, 2025, 2026 | En progreso | — | — |
| MGCEA | Mg. Currículum/Evaluación/Gestión Educ. | Virtual | Activo | Vinculado | — | — |
| MEDFIS | Mg. Ed. Física, Salud y Deportes | Virtual/Semipresencial | Activo | Vinculado | — | — |
| MDIEB | Mg. Didácticas Integradas Ed. Básica | Virtual/Semipresencial | 2025, 2026 | En progreso | — | — |
| MCAMCOH | Mg. Ciencias Aplicadas al Movimiento | Semipresencial | 2025, 2026 | Vinculado | — | — |
| MLING | Mg. Lingüística Aplicada Inglés | Virtual | 2024, 2025 | Terminado + soporte | — | — |
| MEIGLIP | Mg. Educación Intercultural | B-learning | 2026 (1ª cohorte) | En progreso | Rodrigo Z. | Ma. Soledad Rodríguez |

**Nota:** 4 magísteres adicionales son presenciales sin relación UDFV (Artes Visuales, Entomología, Filosofía, Didácticas Cs. Naturales).

### 2.2 PROSECUCIONES (3 programas)

| Programa | Modalidad | Cohortes UDFV | Estado | DI |
|---|---|---|---|---|
| Artes Escénicas (danza/teatro) | Virtual | Activo | Soporte continuo | — |
| Educación Básica (PROBASICA) | Virtual | 2024, 2025, 2026 | Activo, múltiples cohortes | Sergio Pérez (externo) |
| Física y Química (PROCIENCIAS) | Virtual | 2026 (nueva) | En ejecución, todo V1 | Judith Reyes + Celeste Soto (externas) |

### 2.3 FORMACIÓN CONTINUA Y EDUCACIÓN CONTINUA

| Proyecto | Tipo | Estado |
|---|---|---|
| Curso Formación para la Tutoría Virtual | UDFV propio | Activo |
| Formación en TIC e IA para funcionarios | UDFV propio | Activo |
| I Jornada Competencias Digitales | Evento | Realizado 2024 |
| Sistematización formación TIC 2023-2025 | Análisis | Completado |
| Curso Educación Sexual | UDFV propio | Activo |
| Curso Decolonización | UDFV propio | Activo |
| 15+ diplomados DEC | Educación Continua | Varios (oferta amplia, ejecución baja) |
| 2 postítulos (LSCh, Inglés Ed. Básica) | Educación Continua | Activos |

### 2.4 RESUMEN CUANTITATIVO

| Categoría | Total | Con UDFV activa |
|---|---|---|
| Magísteres virtuales/semipresenciales | 9 | 9 |
| Magísteres presenciales | 4 | 0 |
| Prosecuciones | 3 | 3 |
| Proyectos formación UDFV | 6 | 6 |
| Diplomados/postítulos DEC | 17+ | 0 (indirecto) |
| **TOTAL** | **39+** | **18** |

---

## 3. SISTEMA RELACIONAL QUE YA EXISTE EN NOTION

### 3.1 BD "🎯 Proyectos" (ID: 1a0927a437224885846985d0308c9dad)
**Esta es la base de datos operativa real.** Contiene todos los programas y tiene relaciones con 4 BDs más:

```
🎯 Proyectos (25+ registros)
  ├── → Cursos virtuales (collection://814da2a2) — cada curso con enlace Moodle, DI, docente, estado QA
  ├── → Tareas (collection://2afad82d) — gestión de tareas por proyecto
  ├── → Registro de tutoras/es (collection://912cfea2) — tutorías por curso y proyecto
  └── → Reporte de incidencias y apoyo (collection://f6f35d55) — incidencias técnicas
```

Propiedades clave: Tipo (Prosecución/Magíster/Pregrado/etc.), Estado, Cohortes, Inicio Ejecución, Asignación.
Vistas existentes: Todos, Por hacer, En progreso, Terminado, Magister, Ismael, 2025, Asignados a mí, + 5 gráficos.

### 3.2 BD "Proyectos UDFV 2026" (ID: a8aac618278d408a9dc6fd497ef848a2) — DENTRO del Hub
BD plana y simplificada sin relaciones. Campos: Proyecto, Estado, Tipo, Prioridad, Área, Fase, Path local.
**Diagnóstico: duplicado inferior de 🎯 Proyectos. Debería eliminarse o reemplazarse por una vista de 🎯 Proyectos.**

### 3.3 Otras BDs encontradas
- BD acciones equipo (7982e3df) — tracking de acciones del equipo
- BD Recordatorios UDFV — en el Hub
- BD Reunión / BD Bitácora Coordinación — en sección Reuniones
- BD Documentos Institucionales — en sección Documentación
- Base de datos cursos virtual/evirtual/practica (27f07785527980b7) — BDs de cursos sincronizadas con Moodle
- Reporte de incidencias y apoyo técnico (e4e4737c) — BD relacionada

---

## 4. PÁGINAS DE CONTENIDO CLAVE

### 4.1 Documentos estratégicos
| Página | Contenido | Ubicación actual |
|---|---|---|
| Solicitud continuidad | Justificación completa de la UDFV 2026, equipo, categorías de proyectos, riesgos | 📝 Documentación |
| Análisis Problemas | 10 problemas identificados, soluciones por fase, referencia internacional | 📁 Proyectos |
| Oferta Formativa UMCE | Catálogo completo de 41+ programas con relación UDFV | 📝 Documentación |
| Plan Operativo UDFV | — | 📝 Documentación |
| Solicitud Renovación | — | 📝 Documentación |
| Actualización unidad | Datos cuantitativos, diagnóstico TIC, preguntas estratégicas | 📝 Documentación |

### 4.2 Documentos de proceso (DI, PIAC, protocolos)
| Página | Contenido |
|---|---|
| Orientaciones PIAC | Guía para elaborar PIACs |
| Instructivo de Diseño Instruccional | Proceso completo de DI |
| 📋 Guía DI Externos | Procedimientos para DI contratados externamente |
| 🔧 Guía de Estandarización de Proyectos | Estado de DI por actividad curricular |
| Protocolo grabaciones | Procedimiento de grabación de sesiones sincrónicas |
| MOCA — Modelo de Configuración Adaptativa | Instrumento de diagnóstico para cursos online |

### 4.3 Documentos de formación
| Página | Contenido |
|---|---|
| Marco de Competencias TIC Docentes UMCE 2025 | 3 dominios, 12 competencias, 3 niveles |
| Competencias Digitales SDPA | — |
| Ruta Formativa IA | Plan de formación en IA para la UDFV |
| Propuesta Competencia Digital | Para acreditación |
| Sistematización TIC | Brechas y plan de capacitación |

### 4.4 Páginas por programa (fuera de la BD 🎯 Proyectos)
Existen páginas separadas en el Hub que duplican o complementan lo que está en 🎯 Proyectos:
- Prosecución Ed Básica (2a1077855279800b)
- Prosecución Ciencias (33407785527980af)
- Prosecución Física Química (2a107785527980178)
- MEIGLIP (b653180cae6047d4)

---

## 5. PROBLEMAS IDENTIFICADOS EN EL NOTION ACTUAL

### P1. Duplicación de sistemas de proyectos
La BD "🎯 Proyectos" tiene todo el sistema relacional (cursos, tareas, tutores, incidencias), pero existe una BD plana "Proyectos UDFV 2026" en el Hub que no conecta con nada.

### P2. El Hub no refleja la operación real
El Hub está organizado por tipo de contenido (Cursos y Programas, Proyectos, Documentación, Reuniones, Técnico) en vez de estar organizado alrededor de los 18 programas virtuales que son el core del trabajo.

### P3. Mezcla de alcances
📁 Proyectos mezcla trabajo del equipo (prosecuciones, magísteres) con proyectos técnicos de David (UMCE.online, chatbots, MCP, dashboards).

### P4. BD 🎯 Proyectos está fuera del Hub
La BD más importante de la unidad vive suelta en el workspace, no integrada al Hub que se supone es la puerta de entrada del equipo.

### P5. Páginas de programas duplicadas
Existen páginas de prosecuciones/magísteres tanto como registros dentro de 🎯 Proyectos como páginas sueltas en el Hub (sección Cursos y Programas).

---

## 6. PROPUESTA DE REORGANIZACIÓN

### Principio: El Hub se organiza alrededor de los programas virtuales, con 🎯 Proyectos como corazón operativo.

```
🏠 UDFV Hub (landing limpia)
│
├── 📊 Panel operativo (vista embebida de 🎯 Proyectos, filtrada "En progreso")
│
├── 🎯 Proyectos ← LA BD RELACIONAL (mover al Hub como pieza central)
│   │   Vistas: En progreso | Por programa | Por persona | Magísteres | Prosecuciones
│   │
│   ├── [cada proyecto es un registro con sus relaciones]
│   │   → Cursos virtuales (BD)
│   │   → Tareas (BD)
│   │   → Registro de tutoras/es (BD)
│   │   → Reporte de incidencias (BD)
│   │
│   └── Complementos por programa (páginas existentes):
│       ├── Prosecución Ed Básica (info complementaria)
│       ├── Prosecución Ciencias (info complementaria)
│       └── MEIGLIP (info complementaria)
│
├── 📚 Documentación operativa
│   ├── Orientaciones PIAC
│   ├── Instructivo de Diseño Instruccional
│   ├── Guía DI Externos
│   ├── Guía de Estandarización
│   ├── Protocolo grabaciones
│   ├── MOCA
│   └── Tutorial ingreso
│
├── 🧑‍🏫 Formación TIC
│   ├── Marco Competencias TIC Docentes
│   ├── Ruta Formativa IA
│   ├── Competencias Digitales SDPA
│   ├── Sistematización TIC
│   └── Propuesta Competencia Digital
│
├── 📊 Estrategia e institucional
│   ├── Oferta Formativa UMCE (catálogo completo)
│   ├── Solicitud continuidad 2026
│   ├── Solicitud Renovación
│   ├── Análisis Problemas
│   ├── Actualización unidad
│   ├── Marco de Evaluación de Programas Virtuales
│   └── Plan Operativo UDFV
│
├── 📅 Reuniones
│   ├── BD Bitácora Coordinación
│   ├── BD Reuniones
│   └── [actas por reunión]
│
├── 👥 Equipo UDFV
│   └── Bios, roles, funciones
│
├── BD acciones equipo
├── BD Recordatorios UDFV
│
└── 🗄️ Archivo Histórico
    └── Todo lo legacy + BD Proyectos UDFV 2026 (reemplazada)
```

### Acciones concretas:

1. **Mover BD 🎯 Proyectos al Hub** como pieza central (o crear vista embebida)
2. **Archivar BD Proyectos UDFV 2026** — es un duplicado inferior
3. **Reestructurar secciones** del Hub: separar Documentación operativa / Formación TIC / Estrategia
4. **Separar proyectos de David** — 🧩 Personal o sección aparte con: UMCE.online, Acompaña UMCE, ÑamkuBot, MCP, dashboards, Plataforma EDUCAR, Huawei ICT
5. **Consolidar páginas de programas** — las páginas sueltas de prosecuciones deberían ser subpáginas de su registro en 🎯 Proyectos, no duplicados en otra sección

---

## 7. EQUIPO UDFV (actualizado)

| Persona | Rol | Área | Nota |
|---|---|---|---|
| David Reyes | Coordinador | Dirección y Gestión | También desarrollo técnico |
| Salomé Cubillos | Especialista Formación TIC + Tutorías | Formación TIC | Lidera tutores |
| Patricia Toro | Diseñadora Instruccional | Diseño Tecnopedagógico | — |
| Rodrigo Zamorano | Diseñador Instruccional | Diseño Tecnopedagógico | DI de MEIGLIP y PROCIENCIAS |
| Ismael Hidalgo | Analista Metodológico | Gestión de Recursos | Evaluación de experiencias |
| Carlos Pérez | Encargado salas tecnológicas | Gestión de Recursos | Infraestructura y equipamiento |
| 4 ayudantes | Tutores virtuales técnicos | Formación TIC | Estudiantes |
| Sergio Pérez | DI externo | — | Solo PROBASICA, no es equipo permanente |
| Vacante | Diseñador/a Multimedia | Diseño Tecnopedagógico | — |

---

## 8. VÍNCULOS INSTITUCIONALES

| Dirección | Colaboración |
|---|---|
| DIDOC | Formación docente, acompañamiento pedagógico |
| DIPOS | Diseño instruccional, acreditación, programas virtuales |
| DEC | Programas híbridos, diplomados, materiales digitales |
| DAE | Tutorías, orientación estudiantil |
| DAC | Evidencias, indicadores, control calidad |
| VRA | Innovación, automatización, estrategia |
| Dir. Prácticas | Plataforma prácticas, portafolios, seguimiento FID |

---

## 9. PENDIENTE PARA EJECUTAR

### Requiere validación de David:
- [ ] ¿Mover 🎯 Proyectos al Hub o usar vista embebida?
- [ ] ¿Archivar BD Proyectos UDFV 2026?
- [ ] ¿Dónde quedan los proyectos técnicos de David? ¿Sección aparte en Hub o espacio personal?
- [ ] ¿Las páginas sueltas de programas (Prosecución Ed Básica, etc.) se convierten en subpáginas de 🎯 Proyectos?
- [ ] ¿Sección "Estrategia e institucional" está bien como nombre?

### Requiere conexión a plataformas (Claude Code):
- [ ] Verificar qué cursos existen en las 5 Moodle vs. lo que dice Notion
- [ ] Verificar esquema Supabase actual
- [ ] Verificar PIACs en Google Drive

### Para sesión siguiente:
- [ ] Ejecutar movimientos de páginas según estructura aprobada
- [ ] Reescribir landing page del Hub
- [ ] Crear vistas filtradas de 🎯 Proyectos para el Hub
