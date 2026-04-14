# Mapa de Conexiones: Seccion Virtualizacion - UMCE.online

**Fecha**: 13 de abril de 2026
**Proposito**: Mapeo completo de archivos, enlaces, textos y dependencias de la calculadora SCT dentro del ecosistema de virtualizacion. Base para planificar cambios del rediseno v3.

---

## 1. Inventario completo de archivos

### 1.1 Paginas HTML de virtualizacion (src/public/)

| # | Archivo | Ruta URL | Que es | Momento |
|---|---------|----------|--------|---------|
| 1 | `virtualizacion.html` | `/virtualizacion` | Landing principal - 5 momentos + catalogo de herramientas | Todos |
| 2 | `virtualizacion-sct.html` | `/virtualizacion/sct` | Calculadora SCT - wizard 4 pasos | M1 |
| 3 | `virtualizacion-planificador.html` | `/virtualizacion/planificador` | Planificador Curricular - wizard 4 pasos | M3 |
| 4 | `virtualizacion-fundamentos.html` | `/virtualizacion/fundamentos` | Documento de fundamentos pedagogicos - 7+ modulos con sidebar | Referencia |
| 5 | `virtualizacion-qa.html` | `/virtualizacion/qa` | Sistema QA - evaluacion IA de cursos Moodle | M4-M5 |
| 6 | `virtualizacion-rubrica.html` | `/virtualizacion/rubrica` | Dashboard de resultados historicos QA (5 cursos 2024) | Referencia |
| 7 | `virtualizacion-asistente.html` | `/virtualizacion/asistente` | Chatbot IA especializado en virtualizacion | Cualquiera |

### 1.2 Paginas externas que referencian virtualizacion

| Archivo | Referencias a virtualizacion |
|---------|------------------------------|
| `formacion.html` | Enlace a `/virtualizacion` en seccion de marco institucional + breadcrumb |
| `demo-curso.html` | 3 enlaces: `/virtualizacion`, `/virtualizacion/qa`, `/virtualizacion/planificador`. Menciona "3 SCT, 81 hrs" en meta description |
| `piac.html` | Muestra `creditos_sct` en ficha de curso. Usa SCT como dato de lectura |
| `curso-virtual.html` | Muestra `creditos_sct` en info de curso |
| `verificar-credencial.html` | Breadcrumb enlaza a `/virtualizacion` |
| `mis-cursos.html` | Muestra badge SCT por curso |

### 1.3 Componentes compartidos

| Archivo | Rol | Referencias |
|---------|-----|-------------|
| `shared/nav.html` | Navegacion global | Enlace "Virtualizacion" a `/virtualizacion` en desktop y mobile menu |
| `shared/shared.js` | Logica global | Routing del chatbot: si path empieza con `/virtualizacion`, redirige a `/virtualizacion/asistente`. Detecta modo inline en `/virtualizacion/asistente` |

### 1.4 Server (server.js)

7 rutas explicitas (lineas 6457-6463):
```
/virtualizacion             -> virtualizacion.html
/virtualizacion/planificador -> virtualizacion-planificador.html
/virtualizacion/fundamentos  -> virtualizacion-fundamentos.html
/virtualizacion/rubrica      -> virtualizacion-rubrica.html
/virtualizacion/qa           -> virtualizacion-qa.html
/virtualizacion/sct          -> virtualizacion-sct.html
/virtualizacion/asistente    -> virtualizacion-asistente.html
```

System prompt de virtualizacion (funcion `buildVirtualizacionPrompt()`, linea 2384):
- Menciona "Calculadora SCT (/virtualizacion/sct)" como herramienta
- Describe M1 como "Definir creditos y horas -- validar SCT con criterio tecnico"
- Lista las 6 herramientas con sus rutas
- Explica "1 credito SCT = 27 horas de trabajo real"

---

## 2. Mapa de conexiones ASCII

```
                                    NAVEGACION GLOBAL
                                   (shared/nav.html)
                                         |
                                         v
 formacion.html ----> [ VIRTUALIZACION LANDING ] <---- demo-curso.html
 verificar-credencial      virtualizacion.html         shared/shared.js (chatbot routing)
                           |
                           | Herramientas (6 cards)
          +----------------+----------------+----------------+----------------+
          |                |                |                |                |
          v                v                v                v                v
   [CALCULADORA SCT]  [PLANIFICADOR]  [SISTEMA QA]  [RUBRICA QA]  [FUNDAMENTOS]
   virtualizacion-     virtualizacion-  virtualizacion-  virtualizacion-  virtualizacion-
   sct.html            planificador.html qa.html          rubrica.html     fundamentos.html
   (Momento 1)         (Momento 3)      (Momentos 4-5)   (Referencia)     (Referencia)
          |                |                |                |                |
          +-------+--------+                |                |                |
                  |                         |                |                |
                  v                         v                v                v
          [ASISTENTE IA]  <--- sidebar con links a TODAS las herramientas
          virtualizacion-asistente.html
          (Cualquier momento)
```

### 2.1 Flujo de enlaces entre herramientas

```
Calculadora SCT --------> Planificador (3 enlaces)
(M1)                      "usa el Planificador Curricular"
                          "El Planificador Curricular guia ese proceso"
                          Card footer "Ir al Planificador"

Calculadora SCT --------> Fundamentos (1 enlace)
                          Card footer "Fundamentos y marco"

Planificador ------------> Calculadora SCT (2 enlaces)
(M3)                       Hero: "usa primero la Calculadora SCT"
                           Footer: "Ver Calculadora SCT (M1)"

Planificador ------------> QA (1 enlace footer)
Planificador ------------> Fundamentos (1 enlace footer)
Planificador ------------> Landing (1 enlace footer)

Fundamentos -------------> Planificador (2 enlaces)
                           Sidebar CTA + footer CTA
                           (NO enlaza directamente a Calculadora SCT)

QA ----------------------> Rubrica (2 enlaces)
QA ----------------------> Fundamentos (1 enlace)
QA ----------------------> Planificador (1 enlace)
                           (NO enlaza directamente a Calculadora SCT)

Rubrica -----------------> QA (1 enlace)
Rubrica -----------------> Fundamentos (1 enlace)
Rubrica -----------------> Landing (1 enlace)
                           (NO enlaza directamente a Calculadora SCT)

Asistente ---------------> TODAS (sidebar: SCT, Planificador, QA, Rubrica, Fundamentos)

Landing -----------------> TODAS (catalogo de herramientas + aclaracion SCT vs Planificador)
```

---

## 3. Textos que mencionan la Calculadora SCT, Momento 1, creditos y horas

### 3.1 virtualizacion.html (Landing)

| Ubicacion | Texto | Lineas aprox |
|-----------|-------|-------------|
| Stat block | "27 horas de trabajo real por credito SCT" | 183-185 |
| Momento 1 card | "Definir creditos y horas -- Se validan los creditos SCT y la distribucion de horas con criterio tecnico, antes de la resolucion exenta." | 241-248 |
| Herramienta card | "Calculadora SCT -- Momento 1 -- Verifica que los creditos y las horas de tu curso sean coherentes antes de presentar la resolucion exenta a la UGCI." | 322-344 |
| Produce | "Ficha de validacion SCT para adjuntar al PAC" | 336 |
| Aclaracion | "Calculadora SCT -> Momento 1: Se usa ANTES de disenar el curso. Responde: Las horas declaradas en la resolucion son coherentes con los creditos?" | 468-481 |
| Contraste | "Planificador Curricular -> Momento 3: Se usa DESPUES de que la UGCI aprobo los creditos." | 476-479 |

### 3.2 virtualizacion-sct.html (Calculadora)

| Ubicacion | Texto | Lineas aprox |
|-----------|-------|-------------|
| Title | "Calculadora SCT -- Carga Estudiantil Virtual" | 6 |
| Meta desc | "Calcula y valida los creditos SCT de tu curso virtual" | 7 |
| Breadcrumb | Inicio / Virtualizacion / Calculadora SCT | 129-134 |
| Subtitulo | "Momento 1 del flujo -- Antes de la resolucion exenta" | 138 |
| H1 | "Calculadora SCT" | 139 |
| Descripcion hero | "Verifica que los creditos y las horas de tu curso sean coherentes, siguiendo la Guia de la UGCI" | 140 |
| Badge output | "Produce: Ficha de validacion SCT para el PAC" | 148 |
| CTA planificador | "Si ya tienes los creditos aprobados, usa el Planificador Curricular" | 151 |
| Stat badge | "27 horas por credito SCT" | 154-156 |
| Steps | "Tu curso / Calculo SCT / Presentacion / Verificacion" | 179-183 |
| Explain box | "Vamos a verificar que las horas de trabajo de tu curso sean coherentes con los creditos SCT declarados" | 262-264 |
| Formula | "SCT = (HS + HAs + HAut) x NS / 27" | 284 |
| Imprimible footer | "Herramienta: Calculadora SCT UMCE v1.0" | 690 |

### 3.3 virtualizacion-planificador.html

| Ubicacion | Texto | Lineas aprox |
|-----------|-------|-------------|
| Subtitulo hero | "Momento 3 del flujo -- Despues de aprobar el PAC en UGCI" | 83 |
| Link a SCT | "Si aun no tienes los creditos validados, usa primero la Calculadora SCT." | 96 |
| Input SCT | Paso 1 pide creditos SCT como numero de entrada directa | 140-143 |
| Explain box | "1 credito equivale a 27 horas de trabajo real del estudiante" | 127 |
| Footer card | "Retroalimentacion al ciclo (M1) -- Ver Calculadora SCT (M1)" | 494-496 |

### 3.4 virtualizacion-fundamentos.html

| Ubicacion | Texto | Lineas aprox |
|-----------|-------|-------------|
| Modulo 1 | "Que es un credito SCT?" - explicacion completa con formula, Bolonia, CRUCH | 77-143 |
| Referencia | "Guia de Calculo SCT-Chile para uso institucional (UGCI, 2026) -- fundamenta la calculadora SCT de esta plataforma" | 141 |
| Sidebar | NO enlaza directamente a la Calculadora SCT; solo enlaza al Planificador | 67 |
| Modulo 5 | "Calculo en virtualidad" - refiere el flujo como verificacion | 60 |

### 3.5 virtualizacion-asistente.html

| Ubicacion | Texto | Lineas aprox |
|-----------|-------|-------------|
| Sidebar | Link "Calculadora SCT" -> /virtualizacion/sct | 313-318 |

### 3.6 server.js (System prompt del asistente)

| Ubicacion | Texto | Lineas aprox |
|-----------|-------|-------------|
| Prompt | "Calculadora SCT (/virtualizacion/sct): distribuye horas de trabajo por credito y actividad." | 2427 |
| Prompt | "Definir creditos y horas -- validar SCT con criterio tecnico antes de la resolucion exenta" | 2393 |
| Prompt | "1 credito SCT = 27 horas de trabajo real del estudiante" | 2410 |
| Prompt | "Primer paso: validar los creditos SCT de cada asignatura con el equipo UDFV" | 2446 |

---

## 4. Componentes de navegacion entre paginas

### 4.1 Breadcrumbs

Todas las subpaginas usan el mismo patron de breadcrumb:
```
Inicio / Virtualizacion / [Nombre pagina]
```
- El enlace a "Virtualizacion" siempre apunta a `/virtualizacion`
- NO hay navegacion lateral entre subpaginas desde el breadcrumb

### 4.2 Sidebar compartido

**NO existe** un sidebar compartido entre las paginas de virtualizacion. Cada pagina tiene su propia implementacion:

| Pagina | Tipo de sidebar |
|--------|----------------|
| Landing | Sin sidebar (grid de cards) |
| Calculadora SCT | Sin sidebar (wizard lineal con progress dots) |
| Planificador | Sin sidebar (wizard lineal con progress dots) |
| Fundamentos | Sidebar propio con anclas internas (#que-es, #modularizacion, etc.) + CTA "Ir al planificador" |
| QA | Sidebar propio con secciones del sistema QA |
| Rubrica | Sin sidebar (scroll largo) |
| Asistente | Sidebar propio con links a TODAS las herramientas |

### 4.3 Footer navigation (cards "Siguiente paso")

Cada herramienta tiene cards de navegacion al final que sugieren el proximo paso:

| Pagina | Cards de cierre enlazan a |
|--------|--------------------------|
| Calculadora SCT | Planificador, Fundamentos |
| Planificador | QA, Calculadora SCT (ciclo), Fundamentos, Landing |
| QA | Rubrica, Fundamentos, Planificador |
| Rubrica | QA, Fundamentos, Landing |
| Fundamentos | Planificador (sidebar + CTA final) |

### 4.4 Menu navegacion global (nav.html)

Solo un enlace: "Virtualizacion" -> `/virtualizacion`. No despliega submenu con las herramientas.

---

## 5. Conexion M1 (Calculadora) -> M3 (Planificador)

### Estado actual

La conexion entre M1 y M3 es **solo textual y de navegacion**. No hay transferencia de datos:

- La Calculadora produce una "Ficha de validacion SCT" imprimible (PDF/print)
- El Planificador pide manualmente los creditos SCT como input numerico (campo `sctCredits`, valor default 3)
- NO hay paso automatico de datos entre ambas herramientas
- NO hay localStorage, sessionStorage ni query params compartidos

### Con el rediseno v3

Segun `propuesta-calculadora-sct-v3-consolidada.md`, la Calculadora producira un "sobre presupuestario" que alimentaria directamente al Planificador:
- El "sobre" contiene: creditos, horas totales, triple de horas (H_sinc, H_asinc, H_aut), semanas, perfil
- El Planificador deberia recibirlo como input pre-llenado, no como numero suelto

---

## 6. Cambios requeridos por el rediseno v3

### 6.1 Cambios MAYORES

| Archivo | Que debe cambiar | Impacto |
|---------|-----------------|---------|
| `virtualizacion-sct.html` | Reescritura casi total. Nuevos inputs (competencias, tipo AC, tributacion), nuevo procesamiento (Bloom/DOK + Laurillard), 3 modos coexistentes (A: curso, B: semestre, C: desde competencias), nuevo output (malla crediticia + sobre presupuestario). ~1,520 lineas actuales. | CRITICO |
| `docs/knowledge-base-virtualizacion.md` | Seccion formula SCT, 3 perfiles, agregar secciones Bloom/DOK, Laurillard | ALTO |

### 6.2 Cambios MODERADOS (textos y descripciones)

| Archivo | Que debe cambiar | Detalle |
|---------|-----------------|---------|
| `virtualizacion.html` | **Card M1** (lineas 241-248): cambiar "Se validan los creditos SCT" por "Se construye la estructura crediticia". **Card Calculadora** (lineas 322-344): cambiar "Verifica que los creditos y las horas sean coherentes" por texto v3. **Aclaracion** (lineas 468-481): actualizar paradigma de "verificar" a "construir". **Badge output**: de "Ficha de validacion SCT para el PAC" a "Malla crediticia + sobre presupuestario para M3" | Textos UI |
| `virtualizacion-planificador.html` | **Hero** (linea 96): actualizar texto de referencia a SCT. **Paso 1**: debe recibir "sobre presupuestario" de M1 en vez de numero suelto. **Footer** (linea 496): actualizar texto de referencia al ciclo. | Flujo de datos |
| `virtualizacion-fundamentos.html` | **Modulo 1** y **Modulo 5**: actualizar explicacion de como M1 funciona (de verificacion a construccion). **Sidebar**: agregar enlace directo a la Calculadora SCT. **Referencia a Guia UGCI**: actualizar para reflejar el nuevo flujo. | Textos |
| `virtualizacion-qa.html` | Referencia a "coherencia con creditos SCT declarados" (linea 342 aprox) debe cambiar a "coherencia con sobre presupuestario de M1" | Texto puntual |
| `virtualizacion-asistente.html` | El sidebar ya enlaza correctamente. El contexto del chatbot lo actualiza server.js. | Minimo |
| `server.js` | **System prompt de virtualizacion** (funcion `buildVirtualizacionPrompt()`, lineas 2384-2491): actualizar descripcion de M1 y de la Calculadora. Cambiar "validar SCT" por "construir estructura crediticia". Actualizar descripcion de herramientas. | Prompt IA |

### 6.3 Cambios MENORES

| Archivo | Que debe cambiar |
|---------|-----------------|
| `demo-curso.html` | Meta description "3 SCT, 81 hrs" si el demo se regenera con nuevo flujo |
| Audio `calculadora-sct.mp3` | Regenerar una vez actualizado el guion |
| `docs/guiones-audio-virtualizacion.md` | Actualizar guion del narrador SCT |
| `docs/estado-sct-modularizacion-abril2026.md` | Actualizar secciones 2, 4, 5.1, 8 |
| `docs/bibliografia-virtualizacion.md` | Agregar Anderson & Krathwohl, Webb, Laurillard, Biggs |

### 6.4 Cambios de NAVEGACION

| Cambio | Detalle |
|--------|---------|
| Fundamentos sidebar | Agregar enlace directo a Calculadora SCT (actualmente solo enlaza al Planificador) |
| Landing M1 card | Considerar agregar boton directo "Usar Calculadora SCT" ademas de la card de herramientas |
| Transferencia de datos M1->M3 | Implementar mecanismo (localStorage, query params, o API) para pasar el "sobre presupuestario" de la Calculadora al Planificador |
| Nav global | Considerar submenu desplegable bajo "Virtualizacion" con las 6 herramientas |

---

## 7. Resumen: Mapa de impacto del rediseno v3

```
                     IMPACTO DEL REDISENO V3
                     =======================

  [CRITICO - Reescritura]
  virtualizacion-sct.html .............. 3 modos, nuevo wizard, nuevo output

  [ALTO - Textos + logica]
  virtualizacion.html .................. 4 bloques de texto a actualizar
  virtualizacion-planificador.html ..... Input M1 cambia, textos hero/footer
  virtualizacion-fundamentos.html ...... Modulos 1 y 5, sidebar, referencias
  server.js (prompt IA) ................ Descripcion M1 + herramientas
  knowledge-base-virtualizacion.md ..... Formula, perfiles, teorias nuevas

  [MEDIO - Textos puntuales]
  virtualizacion-qa.html ............... 1 referencia a "creditos declarados"
  virtualizacion-asistente.html ........ Contexto sidebar (ya OK, prompt via server.js)
  docs/estado-sct-modularizacion.md .... 4 secciones
  docs/bibliografia-virtualizacion.md .. Agregar 4 referencias

  [BAJO - Ajustes menores]
  demo-curso.html ...................... Meta description si demo se regenera
  guiones-audio-virtualizacion.md ...... Guion narrador SCT
  audio/calculadora-sct.mp3 ............ Regenerar audio
  virtualizacion-rubrica.html .......... Sin cambios (no referencia M1 directamente)
  shared/nav.html ...................... Sin cambios (enlace generico OK)
  shared/shared.js ..................... Sin cambios (routing chatbot OK)
```

---

## 8. Hallazgos notables

1. **No hay sidebar compartido**: Cada pagina implementa su propia navegacion lateral. Si se quisiera un sidebar comun de "momentos" o "herramientas", habria que crearlo como componente shared.

2. **Fundamentos no enlaza a la Calculadora**: El sidebar de fundamentos solo tiene CTA al Planificador. Deberia tener tambien un enlace directo a la Calculadora (especialmente desde el Modulo 1 sobre SCT).

3. **No hay transferencia de datos M1->M3**: La conexion entre Calculadora y Planificador es puramente de navegacion (links). El "sobre presupuestario" de v3 requerira un mecanismo tecnico de transferencia.

4. **El prompt IA en server.js esta hardcodeado**: La funcion `buildVirtualizacionPrompt()` construye el prompt sin dependencia de BD. Cualquier cambio en la descripcion de M1 requiere cambio directo en el codigo del server.

5. **demo-curso.html tiene 3 enlaces a virtualizacion**: Es la pagina externa con mas referencias al ecosistema de virtualizacion (enlaza a landing, QA y planificador, pero NO a la calculadora SCT directamente).

6. **La Rubrica QA es la pagina mas aislada**: No referencia la Calculadora SCT ni el Planificador en sus textos. Solo enlaza a QA, Fundamentos y Landing.

7. **El chatbot routing en shared.js redirige todo /virtualizacion/* al asistente**: Cuando un usuario hace clic en el icono de chat desde cualquier pagina de virtualizacion, se redirige a `/virtualizacion/asistente`.
