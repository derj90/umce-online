I now have comprehensive knowledge of the spec, codebase, and design system. Let me produce the complete UX design document.

---

# Experiencia Unificada del Espacio de Aprendizaje UMCE.online

## Arquitectura de componentes: un shell, cinco configuraciones

El principio fundamental es que existe UN SOLO componente `CourseShell` que renderiza la experiencia de aprendizaje. No hay 5 templates distintos. Hay un shell con un objeto de configuracion `courseType` que activa/desactiva componentes. Esto se implementa con atributos `data-course-type` en el HTML y clases condicionales en Tailwind.

```js
// Configuracion por tipo de curso (se inyecta desde server.js)
const COURSE_CONFIGS = {
  tutoreado:     { sidebar: true,  topbar: true,  sequence: 'full',    nav: 'free',   sync: true,  grades: true,  badges: true,  xapi: false },
  autoformacion: { sidebar: false, topbar: false, sequence: 'content', nav: 'linear', sync: false, grades: false, badges: false, xapi: true  },
  diplomado:     { sidebar: true,  topbar: true,  sequence: 'full',    nav: 'free',   sync: true,  grades: true,  badges: true,  xapi: false },
  taller:        { sidebar: true,  topbar: true,  sequence: 'prep',    nav: 'free',   sync: true,  grades: false, badges: false, xapi: false },
  induccion:     { sidebar: false, topbar: false, sequence: 'linear',  nav: 'linear', sync: false, grades: false, badges: false, xapi: true  },
};
```

---

## 1. Componentes activos por tipo de curso

```
+---------------------------+-------------+--------------+----------+---------+-----------+
| COMPONENTE                | TUTOREADO   | AUTOFORMAC.  | DIPLOMADO| TALLER  | INDUCCION |
+---------------------------+-------------+--------------+----------+---------+-----------+
| SIDEBAR                                                                                  |
+---------------------------+-------------+--------------+----------+---------+-----------+
| Panel lateral fijo        | SI          | NO           | SI       | SI      | NO        |
| Secciones en sidebar      | Inicio,     | --           | Inicio,  | Inicio, | --        |
|                           | N1..Nn,     |              | Mod1..Mn,| Sesion  |           |
|                           | Evaluac,    |              | Evaluac, | 1..Sn,  |           |
|                           | Biblio,     |              | Badges,  | Evalua, |           |
|                           | Info        |              | Biblio,  | Info    |           |
|                           |             |              | Info     |         |           |
| Barra progreso por item   | SI (%)      | --           | SI (%)   | SI (check)| --      |
| Navegacion movil          | Hamburguesa | Stepper      | Hamb.    | Hamb.   | Stepper   |
|                           |             | inferior     |          |         | inferior  |
+---------------------------+-------------+--------------+----------+---------+-----------+
| HEADER / HERO                                                                            |
+---------------------------+-------------+--------------+----------+---------+-----------+
| Banner curso              | SI (breve)  | SI (hero     | SI       | SI      | SI (hero  |
|                           |             | completo)    |          | (evento)| fullwidth)|
| Docente (foto+bio)        | SI          | NO           | SI       | SI      | NO        |
| Video bienvenida          | Opcional    | NO           | Opcional | NO      | NO        |
| Progreso general          | SI (barra)  | SI (steps)   | SI(barra)| SI(%)   | SI(steps) |
| Fecha/calendario          | SI          | NO           | SI       | SI(feat)| NO        |
| Programa asociado         | SI          | NO           | SI       | Opc.    | NO        |
+---------------------------+-------------+--------------+----------+---------+-----------+
| NAVEGACION                                                                               |
+---------------------------+-------------+--------------+----------+---------+-----------+
| Tipo                      | Libre       | Lineal       | Libre    | Libre   | Lineal    |
|                           | (sidebar)   | (prev/next)  | (sidebar)| (sidebar)| (prev/next)|
| Breadcrumb                | SI          | NO           | SI       | SI      | NO        |
| Busqueda Cmd+K            | SI          | NO           | SI       | NO      | NO        |
| Bottom bar mobile         | Tab bar     | Prev/Next    | Tab bar  | Tab bar | Prev/Next |
+---------------------------+-------------+--------------+----------+---------+-----------+
| SECCION INICIO                                                                           |
+---------------------------+-------------+--------------+----------+---------+-----------+
| Bienvenida docente        | SI          | NO           | SI       | SI      | NO        |
| "Que vas a lograr" (RF)   | SI          | SI(desc)     | SI       | SI      | SI(desc)  |
| "Como funciona" (metodo)  | SI          | NO           | SI       | SI      | SI(instruc)|
| Herramientas              | SI          | NO           | SI       | SI      | NO        |
| Comunicacion/soporte      | SI          | Boton ayuda  | SI       | SI      | Bot ayuda |
| Foro presentacion         | SI          | NO           | SI       | Opc.    | NO        |
| Mapa de nucleos (roadmap) | SI          | SI(modulos)  | SI       | NO      | SI        |
| Dashboard proximas activ. | SI          | NO           | SI       | SI      | NO        |
+---------------------------+-------------+--------------+----------+---------+-----------+
| MODULOS / NUCLEOS                                                                        |
+---------------------------+-------------+--------------+----------+---------+-----------+
| Nombre                    | Nucleo N    | Modulo N     | Modulo N | Sesion N| Paso N    |
| Resultado Formativo (RF)  | SI          | SI(simplif)  | SI       | SI      | NO        |
| Criterios Evaluacion (CE) | SI          | NO           | SI       | NO      | NO        |
| Semanas (temporalidad)    | SI          | NO           | SI       | Fechas  | NO        |
| Secuencia 3 momentos      | SI (full)   | NO (slide+q) | SI(full) | Prep/Live/Refl| NO  |
| Contenido (lecturas, etc) | SI          | Slides JSON  | SI       | SI      | Slides/vid|
| Foro                      | SI          | NO           | SI       | Opc.    | NO        |
| Evaluacion por nucleo     | SI          | Quiz inline  | SI       | Opc.    | Quiz final|
| Tiempo estimado           | SI          | SI           | SI       | SI      | SI        |
| Bloqueo secuencial        | NO (libre)  | SI           | Configur.| NO      | SI        |
+---------------------------+-------------+--------------+----------+---------+-----------+
| EVALUACIONES                                                                             |
+---------------------------+-------------+--------------+----------+---------+-----------+
| Seccion dedicada          | SI          | NO           | SI       | Opc.    | NO        |
| Tabla con ponderaciones   | SI          | NO           | SI       | SI(simp)| NO        |
| Rubricas inline           | SI          | NO           | SI       | NO      | NO        |
| Nota/feedback inline      | SI          | NO           | SI       | NO      | NO        |
| Quiz aleatorio            | NO          | SI (inline)  | NO       | NO      | SI(inline)|
| Integridad academica      | SI          | NO           | SI       | NO      | NO        |
| Autoevaluacion            | Opc.        | NO           | Opc.     | SI      | NO        |
+---------------------------+-------------+--------------+----------+---------+-----------+
| PROGRESO                                                                                 |
+---------------------------+-------------+--------------+----------+---------+-----------+
| Que mide                  | Moodle      | xAPI local   | Moodle   | Moodle  | xAPI local|
|                           | completion  | statements   | complet. | complet.| statements|
| Barra por nucleo          | SI (sidebar)| NO           | SI       | SI      | NO        |
| Barra general             | SI          | SI (steps)   | SI       | SI      | SI(steps) |
| % numerico                | SI          | NO           | SI       | SI      | NO        |
| Steps indicator           | NO          | SI           | NO       | NO      | SI        |
| Proximas actividades      | SI (3 prox) | NO           | SI       | SI      | NO        |
| Nota parcial/promedio     | SI          | NO           | SI       | NO      | NO        |
+---------------------------+-------------+--------------+----------+---------+-----------+
| COMUNICACION                                                                             |
+---------------------------+-------------+--------------+----------+---------+-----------+
| Foro discusion            | SI          | NO           | SI       | Opc.    | NO        |
| Chat (chatbot contextual) | SI          | SI(generico) | SI       | SI      | NO        |
| Zoom (sincronica)         | SI          | NO           | SI       | SI(dest)| NO        |
| Grabaciones               | SI          | NO           | SI       | SI      | NO        |
| Email docente             | SI          | NO           | SI       | SI      | NO        |
| Notificaciones            | SI          | NO           | SI       | SI      | NO        |
+---------------------------+-------------+--------------+----------+---------+-----------+
| CERTIFICACION                                                                            |
+---------------------------+-------------+--------------+----------+---------+-----------+
| Badges nivel 1 (nucleo)   | SI          | NO           | SI       | NO      | NO        |
| Badge nivel 2 (modulo)    | SI          | NO           | SI       | NO      | NO        |
| Microcredencial (nivel 3) | NO          | NO           | SI       | NO      | NO        |
| Certificado PDF           | NO          | SI (constanc)| SI       | SI(asist)| SI       |
| Ruta formativa visible    | NO          | NO           | SI       | NO      | NO        |
| xAPI statements           | NO          | SI           | NO       | NO      | SI        |
+---------------------------+-------------+--------------+----------+---------+-----------+
| BARRA SUPERIOR (TOPBAR)                                                                  |
+---------------------------+-------------+--------------+----------+---------+-----------+
| Entrar a clase (Zoom)     | SI          | NO           | SI       | SI(dest)| NO        |
| Grabaciones               | SI          | NO           | SI       | SI      | NO        |
| Calendario                | SI          | NO           | SI       | SI      | NO        |
| Tareas pendientes         | SI          | NO           | SI       | Opc.    | NO        |
| Ayuda                     | SI          | SI           | SI       | SI      | SI        |
| Notificaciones            | SI          | NO           | SI       | SI      | NO        |
+---------------------------+-------------+--------------+----------+---------+-----------+
```

Leyenda: SI = activo, NO = oculto, Opc. = configurable por DI, (dest) = destacado/prominente

---

## 2. Wireframes por tipo de curso

### 2A. TUTOREADO -- Desktop (1280px+)

```
+===========================================================================+
| [< Mis cursos]            UMCE Online           [Cmd+K] [Bell 3] [Avatar]|
+===========================================================================+
| [Entrar a clase]  [Grabaciones]  [Calendario]  [Tareas pend.]  [Ayuda]   |
+===========================================================================+
|              |                                                             |
|  SIDEBAR     |  CONTENIDO PRINCIPAL                                       |
|  w=260px     |                                                             |
|              |  +-------------------------------------------------------+ |
|  [Inicio]    |  | NUCLEO 2 — Seminario Bibliografico              [En curso]|
|              |  | RF: "Evaluar fuentes academicas pertinentes"            | |
|  N1 [=====]  |  | CE: [ver 3 criterios v]                                | |
|  N2 [===..]  |  | Progreso: [============........] 62% (5/8)             | |
|  N3 [.....]  |  | Tiempo estimado: ~12 horas | Semanas 3-4               | |
|  N4 [.....]  |  +-------------------------------------------------------+ |
|              |                                                             |
|  ----------  |  SEMANA 3 — "Literature search strategies"                  |
|  Evaluac.    |  Objetivo: "Identificar fuentes relevantes"                 |
|  Biblio.     |  Tiempo: ~4 horas                                           |
|  Info curso  |                                                             |
|              |  +-- ANTES DE CLASE (autonomo) ~1.5h ----+                  |
|              |  | [BookOpen] Lectura: Porter (2019)      |  [===] 45 min  |
|              |  |           Obligatorio                  |  Completado    |
|              |  |           -> RF: "Identificar fuentes" |                 |
|              |  |                                        |                 |
|              |  | [ExternalLink] Video: Search tips      |  [...] 20 min  |
|              |  |           Complementario                |  Pendiente     |
|              |  +----------------------------------------+                  |
|              |                                                             |
|              |  +-- CLASE SINCRONICA --------+                              |
|              |  | [Video] Mar 18:30           |  [Entrar a Zoom]           |
|              |  | [PlayCircle] Grabacion S3   |  [Ver]                     |
|              |  +----------------------------+                              |
|              |                                                             |
|              |  +-- DESPUES DE CLASE (asincronico) ~1.5h -+                 |
|              |  | [MessageCircle] Foro sesion 3            |  [Participar] |
|              |  |   Expectativa: 1 aporte + 1 respuesta    |  Pendiente   |
|              |  +------------------------------------------+               |
|              |                                                             |
|              |  +-- EVALUACION (semana 3) ---+                              |
|              |  | [ClipboardCheck] Essay 1    |  vence Vie 27/03           |
|              |  |   Peso: 15% | CE: "Selec..." |  [Entregar]              |
|              |  |   Nota: -- | [ver rubrica v]  |                          |
|              |  +----------------------------+                              |
|              |                                                             |
+===========================================================================+
| Footer UMCE | Contacto | Accesibilidad | v1.0                [Chatbot FAB]|
+===========================================================================+
```

### 2A. TUTOREADO -- Mobile (375px)

```
+-----------------------------+
| [=] UMCE Online    [B3] [Av]|
+-----------------------------+
| Nucleo 2 — Sem. Bibliograf. |
| [============........] 62%  |
+-----------------------------+
|                              |
| SEMANA 3                     |
| "Literature search"         |
| ~4 horas                    |
|                              |
| -- ANTES DE CLASE --         |
|                              |
| +---------------------------+|
| | [BookOpen]                ||
| | Lectura: Porter (2019)   ||
| | Obligatorio | 45 min     ||
| | [Completado]             ||
| +---------------------------+|
|                              |
| +---------------------------+|
| | [ExtLink]                 ||
| | Video: Search tips        ||
| | Complementario | 20 min  ||
| | [Pendiente]              ||
| +---------------------------+|
|                              |
| -- CLASE SINCRONICA --       |
|                              |
| +---------------------------+|
| | [Video] Mar 18:30        ||
| |        [Entrar a Zoom]   ||
| | [Play] Grab. S3  [Ver]   ||
| +---------------------------+|
|                              |
| -- DESPUES DE CLASE --       |
|                              |
| +---------------------------+|
| | [Msg] Foro sesion 3      ||
| | 1 aporte + 1 respuesta   ||
| |        [Participar]      ||
| +---------------------------+|
|                              |
+-----------------------------+
| [Inicio][Nucleo][Eval][Mas] |
+-----------------------------+
     BOTTOM TAB BAR (fija)
```

### 2B. AUTOFORMACION -- Desktop (1280px+)

```
+===========================================================================+
| [< Catalogo]             UMCE Online                            [Avatar]  |
+===========================================================================+
|                                                                            |
|  +----------------------------------------------------------------------+ |
|  |  SUSTENTABILIDAD EN UNIVERSIDADES DEL ESTADO                         | |
|  |  Curso autoformativo | 3 modulos | ~6 horas                         | |
|  |                                                                      | |
|  |  Progreso: [1]----[2]----[3]----[Certificado]                        | |
|  |             Done   Current Locked                                    | |
|  +----------------------------------------------------------------------+ |
|                                                                            |
|  +------ MODULO 2: Limites Planetarios -------+   +-------- INFO -------+ |
|  |                                             |   |                     | |
|  | [Slide 3 de 12]                             |   | Tiempo: ~2 horas   | |
|  |                                             |   | Progreso: 3/12     | |
|  | +----------------------------------------+ |   |                     | |
|  | |                                        | |   | Temas:             | |
|  | |     CONTENIDO SLIDE                     | |   | * Cambio climatico | |
|  | |     (texto + imagen + interactivo)     | |   | * Biodiversidad    | |
|  | |                                        | |   | * Economia circ.   | |
|  | |                                        | |   |                     | |
|  | +----------------------------------------+ |   | [Widget DUA]       | |
|  |                                             |   | [Aa] [Contrast]    | |
|  | [< Anterior]          3/12          [Sig >] |   | [Font] [Spacing]   | |
|  +---------------------------------------------+   +--------------------+ |
|                                                                            |
|  +--- AL FINAL DEL MODULO ---+                                             |
|  | Quiz aleatorio (5 preg.)  |                                             |
|  | Aprueba con 60%           |                                             |
|  | Intentos ilimitados       |                                             |
|  +----------------------------+                                            |
|                                                                            |
+===========================================================================+
| Footer UMCE | Ayuda: udfv@umce.cl                                         |
+===========================================================================+
```

### 2B. AUTOFORMACION -- Mobile (375px)

```
+-----------------------------+
| [<]  Mod.2: Limites Planet. |
+-----------------------------+
| [1]--[2]--[3]--[Cert]      |
|       ^current              |
+-----------------------------+
|                              |
| +---------------------------+|
| |                           ||
| |    CONTENIDO SLIDE        ||
| |    (fullwidth, 70vh)      ||
| |                           ||
| |                           ||
| +---------------------------+|
|                              |
|  Slide 3 de 12              |
|                              |
+-----------------------------+
| [< Anterior]     [Sig. >]  |
+-----------------------------+
   STICKY BOTTOM NAV (fija)
```

### 2C. DIPLOMADO -- Desktop (1280px+)

```
+===========================================================================+
| [< Mi ruta]              UMCE Online           [Cmd+K] [Bell 2] [Avatar] |
+===========================================================================+
| [Entrar a clase]  [Grabaciones]  [Calendario]  [Tareas]  [Ayuda]         |
+===========================================================================+
|              |                                                             |
|  SIDEBAR     |  CONTENIDO PRINCIPAL                                       |
|  w=260px     |                                                             |
|              |  DIPLOMADO EN EDUCACION INTERCULTURAL                       |
|  [Inicio]    |  Progreso global: [==========..........] 50%               |
|              |  4 de 8 modulos completados | 24 de 48 SCT                  |
|  Mod 1 [===] |                                                             |
|    badge [*] |  +-- RUTA FORMATIVA ----------------------------------+    |
|  Mod 2 [===] |  |                                                     |    |
|    badge [*] |  |  [M1]---[M2]---[M3]---[M4]---[MICROCRED]           |    |
|  Mod 3 [==.] |  |   ok     ok    75%   locked     50%                |    |
|  Mod 4 [...] |  |                                                     |    |
|              |  |  [M5]---[M6]---[M7]---[M8]---[GRADO]               |    |
|  ----------  |  |  locked  ...   ...    ...      25%                  |    |
|  [Badges]    |  +----------------------------------------------------+    |
|  Evaluac.    |                                                             |
|  Biblio.     |  +-- MODULO 3: Curriculo e Interculturalidad --------+     |
|  Info curso  |  | RF: "Disenar propuestas curriculares..."           |     |
|              |  | CE: [ver criterios v]                              |     |
|              |  | [==============........] 75% | 6 SCT | Sem 5-8    |     |
|              |  |                                                    |     |
|              |  | SEMANA 5 — Antes/Durante/Despues                   |     |
|              |  | (misma estructura que tutoreado)                   |     |
|              |  |                                                    |     |
|              |  | +- MICROCREDENCIAL PROXIMA -----------------------+|     |
|              |  | | "Diplomado Fundamentos Educ. Intercultural"     ||     |
|              |  | | Te falta 1 modulo: Mod 3 al 75%                 ||     |
|              |  | | [============================........] 75%       ||     |
|              |  | +--------------------------------------------------+     |
|              |  +----------------------------------------------------+     |
|              |                                                             |
+===========================================================================+
```

### 2D. TALLER PRACTICO -- Desktop (1280px+)

```
+===========================================================================+
| [< Mis cursos]            UMCE Online           [Bell 1] [Avatar]        |
+===========================================================================+
| [ENTRAR A SESION ZOOM]      [Grabaciones]   [Tareas]   [Ayuda]           |
+===========================================================================+
|              |                                                             |
|  SIDEBAR     |  CONTENIDO PRINCIPAL                                       |
|  w=220px     |                                                             |
|              |  TRAMPOLÍN 2.0 — Taller de Facilitacion Virtual             |
|  [Inicio]    |  Facilitadora: Natalia V. | 4 sesiones | ~8 horas          |
|              |  Progreso: [===========.........] 50% (2/4 sesiones)        |
|  S1 [ok]     |                                                             |
|  S2 [ok]     |  +-- PROXIMA SESION ----- DESTACADO ------+                |
|  S3 [>>]     |  | SESION 3: "Diseno de actividades"       |                |
|  S4 [..]     |  | Mie 9 Abril, 15:00-17:00                |                |
|              |  |                                          |                |
|  ----------  |  | [ENTRAR A ZOOM]  (boton grande, primary) |                |
|  Evalua.     |  +------------------------------------------+                |
|  Info        |                                                             |
|              |  +-- PREPARACION (antes de la sesion) ~30min --+             |
|              |  | [BookOpen] Leer: Guia de facilitacion cap 3 | 30 min     |
|              |  +--------------------------------------------+              |
|              |                                                             |
|              |  +-- SESION EN VIVO (sincronica) 2h -----------+             |
|              |  | [Video] Mie 15:00 | [Entrar]                |             |
|              |  | Actividades:                                 |             |
|              |  |   - Analisis de caso (breakout rooms)       |             |
|              |  |   - Diseno colaborativo (Jamboard)          |             |
|              |  | [PlayCircle] Grabacion sesion 3 (post)      |             |
|              |  +---------------------------------------------+             |
|              |                                                             |
|              |  +-- REFLEXION (despues de la sesion) ~30min --+             |
|              |  | [BookText] Diario reflexivo sesion 3         | [Escribir] |
|              |  +---------------------------------------------+             |
|              |                                                             |
+===========================================================================+
```

### 2D. TALLER PRACTICO -- Mobile (375px)

```
+-----------------------------+
| [=] Trampolín 2.0    [B] [A]|
+-----------------------------+
| PROXIMA SESION               |
| Sesion 3: Diseno activid.   |
| Mie 9 Abril, 15:00          |
| [=== ENTRAR A ZOOM ===]     |
+-----------------------------+
|                              |
| -- PREPARACION --            |
| +---------------------------+|
| | Leer: Guia cap 3         ||
| | 30 min | Pendiente        ||
| +---------------------------+|
|                              |
| -- SESION EN VIVO --         |
| +---------------------------+|
| | Mie 15:00-17:00           ||
| | Breakout + Jamboard       ||
| +---------------------------+|
|                              |
| -- REFLEXION --              |
| +---------------------------+|
| | Diario reflexivo S3       ||
| |        [Escribir]         ||
| +---------------------------+|
|                              |
+-----------------------------+
| [Inicio][Sesion][Eval][Mas] |
+-----------------------------+
```

### 2E. INDUCCION -- Desktop (1280px+)

```
+===========================================================================+
| [< UMCE Online]         Induccion UMCE 2026                     [Avatar] |
+===========================================================================+
|                                                                            |
|  +----------------------------------------------------------------------+ |
|  |  INDUCCION A LA PLATAFORMA VIRTUAL UMCE                              | |
|  |  Bienvenido/a a tu experiencia virtual en la UMCE                    | |
|  |                                                                      | |
|  |  [1]--------[2]--------[3]--------[4]--------[Listo!]                | |
|  |  Conoce     Plataformas  Tu primer   Zoom y      Completado         | |
|  |  la UMCE    virtuales    curso       grabaciones                     | |
|  |  (done)     (current)   (locked)    (locked)                         | |
|  +----------------------------------------------------------------------+ |
|                                                                            |
|  +------ PASO 2: Plataformas virtuales --------+                           |
|  |                                              |                          |
|  | +------------------------------------------+ |  Progreso: 2/6 slides    |
|  | |                                          | |  Tiempo: ~15 min         |
|  | |    CONTENIDO                              | |                          |
|  | |    (slide interactiva, fullwidth)         | |                          |
|  | |    Video embed / texto / imagen           | |                          |
|  | |    Interaccion H5P / xAPI                 | |                          |
|  | |                                          | |                          |
|  | +------------------------------------------+ |                          |
|  |                                              |                          |
|  | [< Anterior]     Slide 2/6     [Siguiente >] |                          |
|  +----------------------------------------------+                          |
|                                                                            |
|  +--- AL FINAL DE TODOS LOS PASOS ---+                                     |
|  | Quiz de verificacion (5 preguntas) |                                     |
|  | Aprobar para obtener constancia    |                                     |
|  +------------------------------------+                                    |
|                                                                            |
+===========================================================================+
| UMCE | Ayuda: udfv@umce.cl                                                |
+===========================================================================+
```

### 2E. INDUCCION -- Mobile (375px)

```
+-----------------------------+
| [<] Induccion UMCE          |
+-----------------------------+
| [1]--[2]--[3]--[4]--[ok]   |
|       ^                     |
| Paso 2: Plataformas virt.   |
+-----------------------------+
|                              |
| +---------------------------+|
| |                           ||
| |    CONTENIDO SLIDE        ||
| |    (fullwidth, 75vh)      ||
| |                           ||
| |                           ||
| +---------------------------+|
|                              |
|  2 de 6                     |
|                              |
+-----------------------------+
| [< Anterior]     [Sig. >]  |
+-----------------------------+
```

---

## 3. Sistema de estados visuales

7 estados que se aplican uniformemente a actividades, nucleos, modulos y pasos en todos los tipos de curso.

### Tokens CSS (variables custom + clases Tailwind)

```css
/* =============================================
   UMCE.online — Estado Visual System
   7 estados x 3 propiedades (bg, border, text)
   + iconos + labels accesibles
   ============================================= */

:root {
  /* ------ LOCKED ------ */
  --state-locked-bg:        #F1F5F9;   /* slate-100 */
  --state-locked-border:    #CBD5E1;   /* slate-300 */
  --state-locked-text:      #94A3B8;   /* slate-400 */
  --state-locked-icon:      'Lock';    /* Lucide */

  /* ------ AVAILABLE ------ */
  --state-available-bg:     #FFFFFF;   /* white */
  --state-available-border: #E2E8F0;  /* slate-200 */
  --state-available-text:   #334155;   /* slate-700 */
  --state-available-icon:   'Circle'; /* Lucide (empty circle) */

  /* ------ IN PROGRESS ------ */
  --state-progress-bg:      #EEF2FF;   /* indigo-50 */
  --state-progress-border:  #818CF8;   /* indigo-400 */
  --state-progress-text:    #4338CA;   /* indigo-700 */
  --state-progress-icon:    'Loader'; /* Lucide (animated optional) */

  /* ------ COMPLETED ------ */
  --state-completed-bg:     #F0FDF4;   /* green-50 */
  --state-completed-border: #22C55E;   /* green-500 */
  --state-completed-text:   #15803D;   /* green-700 */
  --state-completed-icon:   'CheckCircle2'; /* Lucide */

  /* ------ FAILED / REPROBADO ------ */
  --state-failed-bg:        #FEF2F2;   /* red-50 */
  --state-failed-border:    #EF4444;   /* red-500 */
  --state-failed-text:      #B91C1C;   /* red-700 */
  --state-failed-icon:      'XCircle'; /* Lucide */

  /* ------ NEEDS ATTENTION ------ */
  --state-attention-bg:     #FFFBEB;   /* amber-50 */
  --state-attention-border: #F59E0B;   /* amber-500 */
  --state-attention-text:   #92400E;   /* amber-800 */
  --state-attention-icon:   'AlertTriangle'; /* Lucide */

  /* ------ NEW ------ */
  --state-new-bg:           #F5F3FF;   /* violet-50 */
  --state-new-border:       #8B5CF6;   /* violet-500 */
  --state-new-text:         #6D28D9;   /* violet-700 */
  --state-new-icon:         'Sparkles'; /* Lucide */
}

/* Tailwind utility classes for each state */

/* .state-locked */
.state-locked {
  background-color: var(--state-locked-bg);
  border-color: var(--state-locked-border);
  color: var(--state-locked-text);
  opacity: 0.7;
  pointer-events: none;
  cursor: not-allowed;
}

/* .state-available */
.state-available {
  background-color: var(--state-available-bg);
  border-color: var(--state-available-border);
  color: var(--state-available-text);
}

/* .state-progress */
.state-progress {
  background-color: var(--state-progress-bg);
  border-left: 3px solid var(--state-progress-border);
  color: var(--state-progress-text);
}

/* .state-completed */
.state-completed {
  background-color: var(--state-completed-bg);
  border-color: var(--state-completed-border);
  color: var(--state-completed-text);
}

/* .state-failed */
.state-failed {
  background-color: var(--state-failed-bg);
  border-left: 3px solid var(--state-failed-border);
  color: var(--state-failed-text);
}

/* .state-attention */
.state-attention {
  background-color: var(--state-attention-bg);
  border-left: 3px solid var(--state-attention-border);
  color: var(--state-attention-text);
  animation: pulse-subtle 3s ease-in-out infinite;
}

/* .state-new */
.state-new {
  background-color: var(--state-new-bg);
  border-color: var(--state-new-border);
  color: var(--state-new-text);
  position: relative;
}
.state-new::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background-color: var(--state-new-border);
  border-radius: 50%;
}

@keyframes pulse-subtle {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
  50%      { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15); }
}
```

### Aplicacion por tipo de curso

```
+--------------+----------+-----------+----------+-----------+----------+----------+---------+
| TIPO CURSO   | LOCKED   | AVAILABLE | PROGRESS | COMPLETED | FAILED   | ATTENTION| NEW     |
+--------------+----------+-----------+----------+-----------+----------+----------+---------+
| Tutoreado    | Nucleo   | Nucleo    | Nucleo   | Nucleo    | Evalua-  | Tarea    | Graba-  |
|              | futuro,  | visible,  | con      | al 100%,  | cion     | < 48h,   | cion    |
|              | activid. | sin       | avance   | activid.  | nota     | foro sin | nueva,  |
|              | oculta   | iniciar   | parcial  | hecha     | < 4.0    | particip.| nota    |
|              |          |           |          |           |          |          | nueva   |
+--------------+----------+-----------+----------+-----------+----------+----------+---------+
| Autoformac.  | Modulo   | Modulo    | Slide    | Modulo    | Quiz     | --       | --      |
|              | siguiente| actual    | en curso | quiz ok   | no       |          |         |
|              | (si seq) |           |          |           | aprobado |          |         |
+--------------+----------+-----------+----------+-----------+----------+----------+---------+
| Diplomado    | Modulo   | Modulo    | Modulo   | Modulo    | Evalua.  | Tarea    | Badge   |
|              | sin      | disponib. | parcial  | aprobado, | reprobada| proxima, | nueva,  |
|              | prereq.  |           |          | badge     |          | prereq.  | micro-  |
|              |          |           |          | otorgado  |          | faltante | cred.   |
+--------------+----------+-----------+----------+-----------+----------+----------+---------+
| Taller       | Sesion   | Sesion    | Sesion   | Sesion    | --       | Sesion   | --      |
|              | futura   | proxima   | actual   | terminada |          | hoy      |         |
+--------------+----------+-----------+----------+-----------+----------+----------+---------+
| Induccion    | Paso     | Paso      | Paso     | Paso      | Quiz     | --       | --      |
|              | futuro   | actual    | abierto  | terminado | no pasado|          |         |
+--------------+----------+-----------+----------+-----------+----------+----------+---------+
```

### Accesibilidad de estados (triple codificacion)

Cada estado comunica via 3 canales simultaneos (nunca solo color):

```
Estado        | Color          | Icono          | Texto accesible
--------------+----------------+----------------+-------------------------
locked        | Gris slate     | Lock           | "Disponible pronto"
available     | Blanco/neutral | Circle (vacio) | "Disponible"
progress      | Indigo borde   | Loader         | "En progreso (X%)"
completed     | Verde fondo    | CheckCircle2   | "Completado"
failed        | Rojo borde     | XCircle        | "No aprobado"
attention     | Amber borde    | AlertTriangle  | "Requiere atencion"
new           | Violet + dot   | Sparkles       | "Nuevo"
```

Cada card de actividad renderiza asi:

```html
<!-- Ejemplo: actividad en progreso -->
<article class="activity-card state-progress border rounded-lg p-4"
         role="listitem"
         aria-label="Lectura: Porter 2019 - En progreso, 45 minutos estimados">
  <div class="flex items-center gap-3">
    <svg aria-hidden="true" class="w-5 h-5"><!-- Loader icon --></svg>
    <span class="sr-only">En progreso</span>
    <span class="state-label text-xs font-medium px-2 py-0.5 rounded-full
                 bg-indigo-100 text-indigo-700">En progreso</span>
  </div>
  <!-- ... contenido ... -->
</article>
```

---

## 4. Transiciones entre tipos dentro de un programa

### Caso real: Diplomado con modulos mixtos

Un diplomado puede contener modulos tutoreados + modulos de autoformacion. Ejemplo:

```
DIPLOMADO EN IA PARA LA EDUCACION
  Modulo 1: "Fundamentos de IA" .......... [autoformacion] (slides + quiz)
  Modulo 2: "IA Generativa en el aula" ... [tutoreado] (docente + Zoom + foros)
  Modulo 3: "Etica de la IA" ............. [autoformacion] (slides + quiz)
  Modulo 4: "Proyecto integrador" ........ [taller] (sesiones + entrega)
```

### Reglas de transicion UI

**Principio**: el shell del diplomado (sidebar, topbar, header) se mantiene estable. Lo que cambia es el contenido interior del modulo.

```
+===========================================================================+
| DIPLOMADO SHELL (persiste)                                                |
| - Sidebar con Mod1..Mod4 siempre visible                                 |
| - Progreso global del diplomado siempre visible                          |
| - Ruta formativa con nodos siempre visible                               |
| - Topbar con herramientas (Zoom solo cuando modulo actual lo requiere)   |
+===========================================================================+
|                                                                            |
|  INTERIOR DEL MODULO (cambia segun tipo)                                  |
|                                                                            |
|  Si modulo.type === 'autoformacion':                                      |
|    - Renderiza slides + stepper                                           |
|    - Oculta: foro, Zoom, grabaciones, calendario                         |
|    - Muestra: slides, quiz inline, widget DUA                            |
|    - Navegacion: prev/next dentro del modulo                             |
|    - Progreso: steps (slide N de M)                                      |
|                                                                            |
|  Si modulo.type === 'tutoreado':                                          |
|    - Renderiza secuencia antes/durante/despues                            |
|    - Muestra: foro, Zoom, grabaciones, calendario                        |
|    - Oculta: stepper de slides                                           |
|    - Navegacion: libre dentro del modulo                                 |
|    - Progreso: barra porcentual                                          |
|                                                                            |
|  Si modulo.type === 'taller':                                             |
|    - Renderiza prep/sesion/reflexion                                      |
|    - Zoom prominente, pocas lecturas                                     |
|    - Progreso: sesiones completadas                                      |
|                                                                            |
+===========================================================================+
```

### Indicador visual de tipo de modulo

En el sidebar y en la ruta formativa, cada modulo tiene un badge que indica su tipo:

```
SIDEBAR                          RUTA FORMATIVA
+----------------------------+   
| Mod 1 [slides] [===]      |   [M1:slides]---[M2:live]---[M3:slides]---[M4:taller]
| Mod 2 [live]   [==.]      |     100%          62%         0%            locked
| Mod 3 [slides] [....]     |
| Mod 4 [hands]  [....]     |
+----------------------------+

Iconos de tipo:
  [slides]  = Layers        → autoformacion
  [live]    = Users          → tutoreado (con docente)
  [hands]   = Wrench         → taller practico
```

### Transicion animada al cambiar de modulo

Cuando el estudiante navega de un modulo autoformacion a uno tutoreado, la transicion es:

1. El contenido principal hace fade-out (200ms)
2. Si el nuevo modulo necesita topbar (tutoreado/taller), la topbar desliza hacia abajo (300ms, ease-out)
3. Si el modulo anterior tenia topbar y el nuevo no, la topbar desliza hacia arriba
4. El nuevo contenido hace fade-in (200ms)
5. Total: 500ms, imperceptible pero suave

```css
.module-content-enter {
  animation: fadeIn 200ms ease-out;
}
.module-content-exit {
  animation: fadeOut 200ms ease-in;
}
.topbar-slide-down {
  animation: slideDown 300ms ease-out;
}
.topbar-slide-up {
  animation: slideUp 300ms ease-in;
}

@keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
@keyframes slideUp   { from { transform: translateY(0); }    to { transform: translateY(-100%); } }
```

### Datos del shell durante transicion

```js
// Al navegar entre modulos de un diplomado:
function renderModule(moduleConfig) {
  const shell = document.querySelector('.diplomado-shell');
  
  // Topbar: mostrar/ocultar items segun tipo
  shell.querySelector('[data-topbar-zoom]').classList.toggle('hidden', !moduleConfig.sync);
  shell.querySelector('[data-topbar-recordings]').classList.toggle('hidden', !moduleConfig.sync);
  shell.querySelector('[data-topbar-calendar]').classList.toggle('hidden', !moduleConfig.sync);
  shell.querySelector('[data-topbar-tasks]').classList.toggle('hidden', !moduleConfig.grades);
  
  // Sidebar: actualizar item activo, mantener todos visibles
  document.querySelectorAll('.sidebar-module').forEach(el => {
    el.classList.toggle('active', el.dataset.moduleId === moduleConfig.id);
  });
  
  // Interior: renderizar segun tipo
  const content = shell.querySelector('.module-content');
  content.classList.add('module-content-exit');
  setTimeout(() => {
    content.innerHTML = renderModuleContent(moduleConfig);
    content.classList.remove('module-content-exit');
    content.classList.add('module-content-enter');
  }, 200);
}
```

---

## 5. Secuencia didactica adaptada por tipo

### 5A. TUTOREADO: 3 momentos completos

```
+===========================================================================+
|                        SEMANA N — [Titulo]                                |
|  Objetivo: "texto"  |  Tiempo total: ~Xh  |  Fecha: Lun 7 - Dom 13 Abr  |
+===========================================================================+
|                                                                            |
|  +-- ANTES DE CLASE (trabajo autonomo) ---- icono: BookOpen ---- ~Xh ---+ |
|  |  Proposito para el estudiante:                                        | |
|  |  "Prepara lo necesario para aprovechar al maximo la clase"            | |
|  |                                                                       | |
|  |  [BookOpen]  Lectura obligatoria    | 45 min | Obligatorio | RF 2.1   | |
|  |  [ExtLink]   Video complementario   | 20 min | Complementario         | |
|  |  [Gamepad]   Actividad interactiva  | 15 min | Obligatorio | RF 2.2   | |
|  |                                                                       | |
|  |  Total autonomo: ~1.5h                                                | |
|  +-----------------------------------------------------------------------+ |
|                                                                            |
|  +-- CLASE SINCRONICA ---- icono: Video ---- fecha/hora ----------------+ |
|  |  [Video] Martes 18:30   [ENTRAR A ZOOM]                              | |
|  |                                                                       | |
|  |  Temas de la sesion:                                                  | |
|  |    - Discusion de la lectura                                          | |
|  |    - Presentacion de marco teorico                                    | |
|  |    - Actividad grupal                                                 | |
|  |                                                                       | |
|  |  [PlayCircle] Grabacion sesion N  [Ver] (post-clase)                  | |
|  +-----------------------------------------------------------------------+ |
|                                                                            |
|  +-- DESPUES DE CLASE (trabajo asincronico) ---- icono: Edit ---- ~Xh --+ |
|  |  Proposito: "Profundiza, reflexiona y aplica"                         | |
|  |                                                                       | |
|  |  [MessageCircle] Foro semana N          | Participar | 1 aporte +1   | |
|  |  [ClipboardCheck] Tarea evaluada        | vence Vie  | 15% nota      | |
|  |  [BookText]       Diario reflexivo      | opcional   |               | |
|  |                                                                       | |
|  |  Total asincronico: ~1.5h                                             | |
|  +-----------------------------------------------------------------------+ |
|                                                                            |
|  TIEMPO SEMANAL TOTAL: ~Xh (autonomo X + sincronica X + asincronico X)   |
+===========================================================================+
```

### 5B. AUTOFORMACION: contenido + quiz (sin momentos)

```
+===========================================================================+
|                     MODULO N — [Titulo]                                    |
|  Temas: [pill1] [pill2] [pill3]  |  Tiempo: ~Xh  |  Slides: N            |
+===========================================================================+
|                                                                            |
|  +-- CONTENIDO (slides secuenciales) ---- icono: Layers ---------------+ |
|  |                                                                       | |
|  |  +---------------------------------------------------------------+   | |
|  |  |                                                               |   | |
|  |  |              SLIDE ACTUAL (fullwidth)                         |   | |
|  |  |              - texto enriquecido                              |   | |
|  |  |              - imagen/video embed                             |   | |
|  |  |              - interaccion (drag & drop, reveal, etc.)        |   | |
|  |  |                                                               |   | |
|  |  +---------------------------------------------------------------+   | |
|  |                                                                       | |
|  |  [< Anterior]     Slide 5 de 12     [Siguiente >]                    | |
|  |                                                                       | |
|  |  Progreso modulo: [==========........] 42%                            | |
|  +-----------------------------------------------------------------------+ |
|                                                                            |
|  +-- QUIZ (al final del modulo) ---- icono: HelpCircle ----------------+ |
|  |  "Verifica tu comprension"                                           | |
|  |  5 preguntas aleatorias del banco                                    | |
|  |  Aprueba con 60% | Intentos ilimitados                              | |
|  |                                                                       | |
|  |  [Iniciar quiz]                                                       | |
|  |  (o si ya resuelto: Resultado: 80% | [Reintentar])                   | |
|  +-----------------------------------------------------------------------+ |
|                                                                            |
|  SIN momentos. SIN calendario. SIN docente. SIN foro.                     |
|  Ritmo 100% del estudiante.                                               |
+===========================================================================+
```

### 5C. TALLER: preparacion + sesion en vivo + reflexion

```
+===========================================================================+
|                   SESION N — [Titulo]                                      |
|  Facilitador/a: [nombre]  |  Fecha: [dia hora]  |  Duracion: ~Xh         |
+===========================================================================+
|                                                                            |
|  +-- PREPARACION (antes de la sesion) ---- icono: BookOpen ---- ~30m ---+ |
|  |  "Llega preparado/a para participar activamente"                      | |
|  |                                                                       | |
|  |  [BookOpen] Material de lectura breve     | 20 min | Obligatorio     | |
|  |  [ExtLink]  Video introductorio           | 10 min | Opcional         | |
|  |                                                                       | |
|  |  NOTA: Sin evaluacion previa, solo preparacion contextual             | |
|  +-----------------------------------------------------------------------+ |
|                                                                            |
|  +-- SESION EN VIVO ---- icono: Video ---- PROMINENTE -----------------+ |
|  |                                                                       | |
|  |  +---------------------------------------------------------------+   | |
|  |  |  [Video] Miercoles 15:00 - 17:00                              |   | |
|  |  |                                                                |   | |
|  |  |  [==== ENTRAR A LA SESION ZOOM ====]  (boton grande)          |   | |
|  |  |                                                                |   | |
|  |  +---------------------------------------------------------------+   | |
|  |                                                                       | |
|  |  Agenda de la sesion:                                                 | |
|  |    1. Bienvenida y check-in (10 min)                                  | |
|  |    2. Actividad practica: [descripcion] (60 min)                      | |
|  |    3. Plenaria y cierre (20 min)                                      | |
|  |                                                                       | |
|  |  [PlayCircle] Grabacion (disponible despues de la sesion)             | |
|  +-----------------------------------------------------------------------+ |
|                                                                            |
|  +-- REFLEXION (despues de la sesion) ---- icono: BookText ---- ~30m ---+|
|  |  "Consolida lo aprendido en la sesion"                                | |
|  |                                                                       | |
|  |  [BookText] Diario reflexivo                         | [Escribir]     | |
|  |    Prompt: "Describe como aplicarias lo visto hoy en tu docencia"     | |
|  |                                                                       | |
|  |  [MessageCircle] Foro post-sesion (opcional)         | [Participar]   | |
|  +-----------------------------------------------------------------------+ |
|                                                                            |
|  ENFASIS: la sesion en vivo es el componente central.                     |
|  Preparacion y reflexion son breves, funcionales al taller.               |
+===========================================================================+
```

### 5D. INDUCCION: lineal sin momentos

```
+===========================================================================+
|                PASO N de M — [Titulo del paso]                             |
|  Tiempo estimado: ~X min                                                  |
+===========================================================================+
|                                                                            |
|  +-- CONTENIDO UNICO (sin sub-momentos) ---- icono segun tipo ---------+ |
|  |                                                                       | |
|  |  El contenido es una secuencia lineal de slides/videos/textos.        | |
|  |  No hay "antes/durante/despues". Es contenido puro, secuencial.       | |
|  |                                                                       | |
|  |  Tipos de contenido posibles por slide:                               | |
|  |    - Texto informativo con imagen                                     | |
|  |    - Video corto (< 3 min)                                           | |
|  |    - Interactivo xAPI (click para explorar, arrastrar, etc.)          | |
|  |    - Pregunta de verificacion inline (no evaluada, solo feedback)     | |
|  |                                                                       | |
|  |  +---------------------------------------------------------------+   | |
|  |  |                                                               |   | |
|  |  |              CONTENIDO ACTUAL                                 |   | |
|  |  |                                                               |   | |
|  |  +---------------------------------------------------------------+   | |
|  |                                                                       | |
|  |  [< Anterior]              [Siguiente >]                              | |
|  |                                                                       | |
|  +-----------------------------------------------------------------------+ |
|                                                                            |
|  AL COMPLETAR TODOS LOS PASOS:                                           |
|  +-----------------------------------------------------------------------+ |
|  | Quiz de verificacion final                                            | |
|  | Aprobar = constancia de induccion completada (PDF descargable)        | |
|  | xAPI statement: completed / passed                                    | |
|  +-----------------------------------------------------------------------+ |
|                                                                            |
|  SIN sidebar. SIN topbar. SIN calendario. SIN docente.                    |
|  Experiencia minimalista, enfocada, rapida.                               |
+===========================================================================+
```

### Tabla resumen de secuencias

```
+---------------+--------------------+--------------------+-------------------+
| TIPO          | MOMENTO 1          | MOMENTO 2          | MOMENTO 3         |
+---------------+--------------------+--------------------+-------------------+
| Tutoreado     | ANTES DE CLASE     | CLASE SINCRONICA   | DESPUES DE CLASE  |
|               | (autonomo)         | (Zoom en vivo)     | (asincronico)     |
|               | Lecturas, videos,  | Docente facilita,  | Foros, tareas,    |
|               | material previo    | discusion, activid.| reflexion, entrega|
|               | ~1-2h              | 1.5-2h             | ~1-2h             |
+---------------+--------------------+--------------------+-------------------+
| Autoformacion | CONTENIDO          | QUIZ               | --                |
|               | Slides secuenciales| Verificacion final | No hay tercer     |
|               | + interactivos     | aleatorio, inline  | momento            |
|               | Ritmo propio       | 60% para aprobar   |                   |
+---------------+--------------------+--------------------+-------------------+
| Diplomado     | (Hereda del tipo de cada modulo individual)                  |
|               | Modulo autoform. = contenido+quiz                            |
|               | Modulo tutoreado = antes/durante/despues                      |
|               | Modulo taller = prep/sesion/reflexion                         |
+---------------+--------------------+--------------------+-------------------+
| Taller        | PREPARACION        | SESION EN VIVO     | REFLEXION         |
|               | Material breve,    | Zoom prominente,   | Diario reflexivo, |
|               | contextual         | hands-on, breakout | foro opcional      |
|               | ~30min             | 1.5-2h             | ~30min            |
+---------------+--------------------+--------------------+-------------------+
| Induccion     | CONTENIDO LINEAL (sin momentos separados)                    |
|               | Paso 1 -> Paso 2 -> ... -> Paso N -> Quiz -> Constancia     |
|               | Todo secuencial, sin separacion temporal                      |
+---------------+--------------------+--------------------+-------------------+
```

---

## 6. Principio de senalizacion pedagogica

Para cada tipo de curso se define que informacion pedagogica se hace visible al estudiante y como.

### 6A. TUTOREADO: senalizacion completa (QM full)

```
+-- INFORMACION PEDAGOGICA VISIBLE AL ESTUDIANTE ---------------------------+
|                                                                            |
| NIVEL CURSO:                                                               |
|   [SI] Resultado Formativo general ("Al completar seras capaz de...")     |
|   [SI] Programa al que pertenece + creditos SCT totales                   |
|   [SI] Metodologia ("antes/durante/despues" explicado en Inicio)          |
|   [SI] Carga horaria semanal estimada (SCT: X horas/semana)              |
|   [SI] Conocimientos previos requeridos                                    |
|   [SI] Herramientas tecnologicas necesarias                               |
|   [SI] Politicas del curso (asistencia, entregas, integridad)             |
|                                                                            |
| NIVEL NUCLEO:                                                              |
|   [SI] Resultado Formativo del nucleo (objetivo medible)                  |
|   [SI] Criterios de Evaluacion asociados (expandible)                     |
|   [SI] Semanas que abarca + tiempo estimado total                         |
|   [SI] Conexion RF-CE-Actividades (cada actividad marca que RF trabaja)   |
|                                                                            |
| NIVEL ACTIVIDAD:                                                           |
|   [SI] Etiqueta [Obligatorio] / [Complementario]                         |
|   [SI] Tiempo estimado en minutos                                         |
|   [SI] Objetivo de aprendizaje que trabaja (tag o texto breve)            |
|   [SI] Tipo de actividad (icono + texto: lectura, foro, tarea...)        |
|   [SI] Fecha limite (si aplica) con alerta visual < 48h                   |
|   [SI] Estado de completitud (icono + texto + color)                      |
|                                                                            |
| NIVEL EVALUACION:                                                          |
|   [SI] Tabla completa: nombre, tipo (F/S), peso, nucleo, fecha, estado    |
|   [SI] Rubrica resumida inline por evaluacion                             |
|   [SI] CE que evalua cada evaluacion                                      |
|   [SI] Feedback del docente (cuando disponible)                           |
|   [SI] Promedio parcial ponderado                                         |
|   [SI] Proxima evaluacion con countdown                                   |
|                                                                            |
| VISUALIZACION:                                                             |
|   Header del nucleo muestra RF + CE como bloque expandible.               |
|   Cada actividad tiene tooltip con "Trabaja: [RF texto]".                 |
|   Tabla de evaluaciones es seccion dedicada en sidebar.                   |
+----------------------------------------------------------------------------+
```

### 6B. AUTOFORMACION: senalizacion minima

```
+-- INFORMACION PEDAGOGICA VISIBLE AL ESTUDIANTE ---------------------------+
|                                                                            |
| NIVEL CURSO:                                                               |
|   [SI] Descripcion general del curso ("Que aprenderas")                   |
|   [SI] Temas principales (topic pills)                                    |
|   [SI] Duracion total estimada                                            |
|   [NO] RF formales — reemplazado por descripcion amigable                 |
|   [NO] CE, SCT, PIAC — no aplica                                         |
|   [NO] Conocimientos previos — no tiene prerrequisitos                    |
|   [NO] Programa asociado — curso independiente                            |
|                                                                            |
| NIVEL MODULO:                                                              |
|   [SI] Titulo descriptivo del modulo                                      |
|   [SI] Numero de slides + tiempo estimado                                 |
|   [SI] Temas del modulo (pills/tags)                                      |
|   [NO] RF, CE — no se muestra lenguaje curricular formal                  |
|                                                                            |
| NIVEL ACTIVIDAD (slide):                                                   |
|   [SI] Posicion en secuencia (slide N de M)                               |
|   [SI] Progreso visual (barra o steps)                                    |
|   [NO] Tiempo por slide — solo total del modulo                           |
|   [NO] Obligatorio/complementario — todo es obligatorio por defecto       |
|                                                                            |
| NIVEL EVALUACION:                                                          |
|   [SI] "Verifica tu comprension" (quiz al final)                         |
|   [SI] Numero de preguntas + umbral de aprobacion                         |
|   [SI] Intentos restantes/ilimitados                                      |
|   [SI] Resultado (aprobado/no aprobado, sin nota numerica)                |
|   [NO] Ponderaciones, rubricas, feedback detallado                        |
|                                                                            |
| VISUALIZACION:                                                             |
|   Tono informal, no academico. "Modulo" en vez de "Nucleo".              |
|   Sin tablas de evaluaciones. Quiz es parte del flujo, no seccion aparte. |
|   Progreso como steps (no porcentaje).                                    |
+----------------------------------------------------------------------------+
```

### 6C. DIPLOMADO: senalizacion completa + trayectoria

```
+-- INFORMACION PEDAGOGICA VISIBLE AL ESTUDIANTE ---------------------------+
|                                                                            |
| TODO LO DEL TUTOREADO (RF, CE, SCT, rubricas, ponderaciones)              |
|                                                                            |
| ADICIONAL — NIVEL PROGRAMA:                                                |
|   [SI] Ruta formativa visual (modulos como nodos conectados)              |
|   [SI] SCT acumulados / SCT totales del programa                         |
|   [SI] Microcredenciales alcanzables + requisitos                         |
|   [SI] Progreso hacia grado ("X de Y modulos completados")               |
|   [SI] Badges obtenidos + proximos a obtener                             |
|   [SI] Prerrequisitos entre modulos (si mod 3 requiere mod 1+2)          |
|                                                                            |
| ADICIONAL — NIVEL MODULO:                                                  |
|   [SI] Creditos SCT del modulo                                            |
|   [SI] Tipo de modulo (autoformacion/tutoreado/taller) con icono          |
|   [SI] Estado del badge de modulo (obtenido/en progreso/pendiente)        |
|   [SI] Contribucion a microcredenciales ("Este modulo suma para X")       |
|                                                                            |
| VISUALIZACION:                                                             |
|   La ruta formativa es el hero visual del diplomado.                      |
|   Sidebar muestra badges mini junto a cada modulo completado.             |
|   Banner de microcredencial aparece cuando falta 1 modulo para lograrla.  |
|   Panel "Mi trayectoria" accesible desde avatar.                          |
+----------------------------------------------------------------------------+
```

### 6D. TALLER: senalizacion practica

```
+-- INFORMACION PEDAGOGICA VISIBLE AL ESTUDIANTE ---------------------------+
|                                                                            |
| NIVEL CURSO:                                                               |
|   [SI] Descripcion del taller y objetivos (lenguaje practico)             |
|   [SI] Competencias a desarrollar (no RF formales)                        |
|   [SI] Numero de sesiones + fechas + duracion                             |
|   [SI] Facilitador/a (foto, bio breve)                                    |
|   [SI] Herramientas necesarias (Zoom, Jamboard, etc.)                     |
|   [NO] SCT, creditos — no aplica para talleres cortos                     |
|   [NO] CE formales — se usan "objetivos de la sesion" informales          |
|                                                                            |
| NIVEL SESION:                                                              |
|   [SI] Titulo + fecha + hora + duracion                                   |
|   [SI] Objetivo de la sesion (1 linea, lenguaje practico)                 |
|   [SI] Agenda de la sesion (que se va a hacer)                            |
|   [SI] Material de preparacion + tiempo estimado                          |
|   [NO] RF, CE — se reemplazan por "Objetivo de la sesion"                |
|                                                                            |
| NIVEL EVALUACION:                                                          |
|   [SI] Si hay evaluacion: criterios claros + fecha                        |
|   [SI] Autoevaluacion o reflexion (cuando aplique)                        |
|   [NO] Rubricas complejas — los talleres evaluan participacion            |
|   [NO] Ponderaciones — generalmente es aprobado/no aprobado              |
|                                                                            |
| VISUALIZACION:                                                             |
|   Sesion proxima siempre prominente (card destacada arriba).              |
|   Zoom es el boton mas grande de la interfaz.                             |
|   Calendario con las fechas de las sesiones es mas importante que sidebar.|
|   Tono energico, orientado a la accion.                                   |
+----------------------------------------------------------------------------+
```

### 6E. INDUCCION: senalizacion minima, orientada a completar

```
+-- INFORMACION PEDAGOGICA VISIBLE AL ESTUDIANTE ---------------------------+
|                                                                            |
| NIVEL CURSO:                                                               |
|   [SI] "Que vas a conocer" (descripcion breve, 2-3 lineas)               |
|   [SI] Numero de pasos + tiempo total estimado                            |
|   [SI] "Al completar obtendras tu constancia de induccion"               |
|   [NO] RF, CE, SCT, PIAC — no aplica                                     |
|   [NO] Docente, herramientas, politicas — no hay                          |
|                                                                            |
| NIVEL PASO:                                                                |
|   [SI] Titulo del paso                                                    |
|   [SI] Posicion en secuencia (paso N de M, visualizado como stepper)      |
|   [SI] Indicacion si el paso esta completado / actual / bloqueado         |
|   [NO] Tiempo por paso, objetivos, etiquetas                             |
|                                                                            |
| NIVEL EVALUACION:                                                          |
|   [SI] "Verifica lo aprendido" (quiz final)                              |
|   [SI] Requisito para constancia                                         |
|   [NO] Nota numerica, rubricas, feedback detallado                        |
|                                                                            |
| VISUALIZACION:                                                             |
|   Stepper horizontal es la unica senalizacion de progreso necesaria.      |
|   No hay sidebar, no hay secciones multiples.                             |
|   El estudiante solo necesita avanzar paso a paso hasta el final.         |
|   Constancia PDF al completar es la unica recompensa visible.            |
+----------------------------------------------------------------------------+
```

### Tabla resumen: que senales se muestran por tipo

```
+----------------------------+--------+----------+----------+--------+----------+
| SENAL PEDAGOGICA           | TUTOR. | AUTOFORM.| DIPLOM.  | TALLER | INDUCC.  |
+----------------------------+--------+----------+----------+--------+----------+
| Resultado Formativo (RF)   |  SI    |  NO      |  SI      |  NO    |  NO      |
| Criterios Evaluacion (CE)  |  SI    |  NO      |  SI      |  NO    |  NO      |
| Creditos SCT               |  SI    |  NO      |  SI      |  NO    |  NO      |
| Tiempo estimado (actividad)|  SI    |  parcial |  SI      |  SI    |  NO      |
| Tiempo estimado (nucleo)   |  SI    |  SI      |  SI      |  SI    |  SI(tot) |
| Etiqueta oblig/complem.    |  SI    |  NO      |  SI      |  SI    |  NO      |
| Ponderaciones evaluativas  |  SI    |  NO      |  SI      |  NO    |  NO      |
| Rubricas                   |  SI    |  NO      |  SI      |  NO    |  NO      |
| Fecha limite               |  SI    |  NO      |  SI      |  SI    |  NO      |
| Objetivo semanal           |  SI    |  NO      |  SI      |  SI    |  NO      |
| Ruta formativa visual      |  NO    |  NO      |  SI      |  NO    |  NO      |
| Microcredenciales          |  NO    |  NO      |  SI      |  NO    |  NO      |
| Badges                     |  SI    |  NO      |  SI      |  NO    |  NO      |
| Conocimientos previos      |  SI    |  NO      |  SI      |  NO    |  NO      |
| Politicas del curso        |  SI    |  NO      |  SI      |  NO    |  NO      |
| Agenda sesion (que se hara)|  NO    |  NO      |  NO      |  SI    |  NO      |
| Temas como pills/tags      |  NO    |  SI      |  NO      |  NO    |  NO      |
| Stepper horizontal         |  NO    |  SI      |  NO      |  NO    |  SI      |
+----------------------------+--------+----------+----------+--------+----------+
```

---

## Implementacion: data-attribute driven

Todo este sistema se implementa con un unico archivo HTML (`curso-virtual.html`) que recibe `data-course-type` y configura la UI:

```html
<body data-course-type="tutoreado">
  <!-- Shell comun -->
  <header class="topbar" data-visible="tutoreado,diplomado,taller">...</header>
  <aside class="sidebar" data-visible="tutoreado,diplomado,taller">...</aside>
  <main class="content">
    <!-- Renderizado por JS segun tipo -->
  </main>
  <nav class="bottom-bar-mobile" data-variant="tabs|stepper">...</nav>
</body>
```

```js
// En el JS que carga curso-virtual.html:
const courseType = courseData.course_type || 'tutoreado'; // default
document.body.dataset.courseType = courseType;

// CSS lo hace visible/oculto:
// [data-course-type="autoformacion"] .sidebar { display: none; }
// [data-course-type="autoformacion"] .topbar { display: none; }
// [data-course-type="induccion"] .sidebar { display: none; }
```

```css
/* Visibilidad por tipo de curso */
[data-course-type="autoformacion"] [data-visible]:not([data-visible*="autoformacion"]),
[data-course-type="induccion"] [data-visible]:not([data-visible*="induccion"]),
[data-course-type="taller"] [data-visible]:not([data-visible*="taller"]),
[data-course-type="tutoreado"] [data-visible]:not([data-visible*="tutoreado"]),
[data-course-type="diplomado"] [data-visible]:not([data-visible*="diplomado"]) {
  display: none !important;
}

/* Navegacion por tipo */
[data-course-type="autoformacion"] .bottom-bar-mobile { /* stepper prev/next */ }
[data-course-type="induccion"] .bottom-bar-mobile { /* stepper prev/next */ }
[data-course-type="tutoreado"] .bottom-bar-mobile { /* tab bar 4 items */ }
[data-course-type="diplomado"] .bottom-bar-mobile { /* tab bar 4 items */ }
[data-course-type="taller"] .bottom-bar-mobile { /* tab bar 4 items */ }
```

---

## Resumen de decisiones clave

1. **Un shell, no cinco templates**. El tipo de curso es un atributo de configuracion, no un fork del codigo. Menos superficie de mantenimiento.

2. **Sidebar solo para cursos con navegacion libre** (tutoreado, diplomado, taller). Autoformacion e induccion usan stepper lineal sin sidebar, lo que reduce la carga cognitiva para cursos simples.

3. **Los 7 estados son universales**: se aplican a nucleos, modulos, pasos, actividades y evaluaciones. Mismos tokens CSS, mismos iconos, mismas reglas de accesibilidad.

4. **La secuencia antes/durante/despues se adapta, no se fuerza**. Autoformacion e induccion no tienen momentos artificiales. Talleres renombran los momentos (preparacion/sesion/reflexion). Solo tutoreado y diplomado usan los 3 momentos completos del PIAC.

5. **Diplomados son el caso compuesto**: el shell del diplomado persiste mientras el interior de cada modulo cambia segun su tipo. La transicion es suave (fade+slide, 500ms).

6. **La senalizacion pedagogica es proporcional a la complejidad del curso**. Un tutoreado muestra RF, CE, SCT, rubricas, ponderaciones. Una induccion solo muestra un stepper y "paso N de M". Esto respeta el principio de carga cognitiva minima.

7. **Todo se implementa con Express + vanilla JS + Tailwind**. Sin React, sin TypeScript. CSS custom properties para los estados. `data-course-type` como selector principal. Compatible al 100% con el stack existente en `/Users/coordinacion/Documents/umce-online/src/`.