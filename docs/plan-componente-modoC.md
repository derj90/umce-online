# COMPONENTE: Modo C -- Estimar desde competencias

**Documento**: Plan de desarrollo detallado  
**Version**: 1.0  
**Fecha**: 13 de abril de 2026  
**Dependencia**: propuesta-calculadora-sct-v3-consolidada.md (seccion 4.3)  
**Stack**: Vanilla JS + Tailwind CDN, client-side completo  

---

## Descripcion

El Modo C es el aporte teorico original de la Calculadora SCT v3. Estima las horas totales de trabajo estudiantil (HT) a partir del nivel cognitivo predominante de los resultados de aprendizaje, sin que el usuario ingrese horas manualmente. Las modalidades de trabajo distribuyen proporcionalmente ese presupuesto de HT; no lo crean.

A diferencia de los Modos A (horas manuales para 1 AC) y B (agregacion semestral de horas manuales), el Modo C infiere HT desde la naturaleza cognitiva de lo que se exige al estudiante, y permite operar a nivel de programa completo con vista multi-semestre.

---

## Uso -- Flujo paso a paso

1. **Configuracion inicial**: el coordinador define perfil de estudiantes, modalidad de la AC (virtual/semipresencial), formato (semestral/modular/bloque/CUECH) y area disciplinar.
2. **Agregar ACs**: se agregan actividades curriculares con nombre, formato y area disciplinar.
3. **Para cada AC -- marcar modalidades y ajustar niveles**: el coordinador marca checkboxes de modalidades de trabajo (1 a 5). Cada checkbox despliega un slider de nivel cognitivo de 4 posiciones. Se ajustan proporciones entre modalidades.
4. **El sistema estima y muestra resultados**: el motor calcula HT, distribuye por modalidad, aplica ratios sync/async/auto, emite el triple (H_sinc, H_asinc, H_aut) y calcula SCT.
5. **Asignar ACs a semestres**: el coordinador arrastra o selecciona ACs hacia semestres del programa.
6. **Vista de programa**: carga por semestre, semaforos, balance de complejidad cognitiva.
7. **Generar informe**: Bloque 1 (resultado PAC) + Bloque 2 (anexo metodologico con modalidades y conversion semanal).

---

## Sub-componentes detallados

### a) Panel de configuracion

Este panel se muestra una vez al entrar al Modo C. Los valores aplican a todas las ACs del programa salvo que se sobreescriban por AC.

| Campo | Tipo | Default | Validacion |
|-------|------|---------|------------|
| Nombre del programa | `<input type="text">` | vacio | Requerido, max 200 chars |
| Codigo del programa | `<input type="text">` | vacio | Opcional, max 20 chars |
| Perfil de estudiantes | Radio cards (3) | Pregrado | Requerido. Opciones: Pregrado / Postgrado / Ed. Continua |
| Modalidad general | Radio cards (2) | Virtual | Requerido. Opciones: Virtual / Semipresencial |
| Formato | Radio cards (4) | Semestral 18 sem | Requerido. Opciones: Semestral (18 sem) / Modulo (8 sem) / Bloque (5 sem) / CUECH Subete (16 sem, 2 SCT fijos) |
| Area disciplinar | Select (5) | Educacion | Opciones: Ciencias / Humanidades / Educacion / Artes / Tecnologia |
| Numero de semestres | `<input type="number">` | 2 | Min 1, Max 12 |

**Comportamiento:**
- Seleccionar "CUECH Subete" activa la logica invertida (ver sub-componente f).
- Seleccionar perfil ajusta los umbrales de semaforo de carga semanal.
- El area disciplinar provee los defaults de distribucion por modalidad cuando el coordinador no marca ninguna (fallback).

---

### b) Lista de ACs

**Como se agregan:** Boton "+ Agregar actividad curricular" al final de la lista. Se crea una fila colapsada con los campos minimos. Limite suave: 30 ACs (warning si se supera, no bloqueo).

**Como se eliminan:** Icono de papelera por fila con confirmacion ("Se eliminara esta AC y sus datos de modalidades. Continuar?").

**Datos por AC:**

| Campo | Tipo | Default | Validacion |
|-------|------|---------|------------|
| Nombre de la AC | `<input type="text">` | vacio | Requerido, max 150 chars |
| Codigo AC | `<input type="text">` | vacio | Opcional, max 15 chars |
| Modalidad AC | Radio (2) | Hereda config global | Virtual / Semipresencial. Sobreescribe el global si difiere |
| Area disciplinar AC | Select (5) | Hereda config global | Sobreescribe el global si difiere |
| Semanas (NS) | `<input type="number">` | Segun formato | Min 1, Max 36 |
| Semestre asignado | Select | Sin asignar | Opciones: 1..N segun config, + "Sin asignar" |

**Estructura visual:** Cada AC se muestra como una card colapsable. Colapsada muestra: nombre, SCT estimados, semestre asignado, indicador de complejidad (color). Expandida muestra: todos los campos + checkboxes de modalidades + sliders + resultados parciales.

**Ordenamiento:** Por orden de creacion. Se puede reordenar con drag-and-drop (opcional, no critico para v1).

---

### c) Checkboxes de modalidades de trabajo (por AC)

Las 5 modalidades disponibles, mostradas como checkboxes con label descriptivo:

| # | Modalidad | Subtexto descriptivo | Tipo Laurillard dominante |
|---|-----------|---------------------|--------------------------|
| 1 | Estudio individual | Lectura, video, contenido, material de referencia | Adquisicion |
| 2 | Produccion escrita | Ensayos, informes, reportes, reflexiones | Produccion |
| 3 | Practica aplicada | Laboratorio, ejercicios, simulacion, casos | Practica |
| 4 | Trabajo colaborativo | Discusion, debate, trabajo grupal, co-evaluacion | Discusion + Colaboracion (promedio) |
| 5 | Produccion integrada | Proyecto, investigacion, portafolio, diseno | Produccion + Investigacion (promedio) |

**Comportamiento al marcar un checkbox:**
1. Se despliega debajo del checkbox: un slider de nivel cognitivo (4 posiciones) y un campo de proporcion (%).
2. El slider se pre-llena con el nivel default de la modalidad (ver tabla en sub-componente d).
3. La proporcion se recalcula equitativamente entre las modalidades marcadas.

**Comportamiento al desmarcar un checkbox:**
1. Se colapsa el slider y el campo de proporcion.
2. Las proporciones de las modalidades restantes se redistribuyen equitativamente.
3. Los resultados se recalculan automaticamente.

**Proporciones (distribucion del presupuesto HT):**
- Default: equitativa entre las marcadas (ej: 3 marcadas = 33.3% cada una, redondeado).
- Ajuste manual: el coordinador edita los campos de proporcion. Cada campo es `<input type="number" min="5" max="95" step="5">`.
- Validacion en tiempo real: la suma debe ser exactamente 100%. Si no suma 100%, se muestra un badge rojo "Las proporciones deben sumar 100%" y el calculo se suspende.
- Boton "Redistribuir equitativamente" para resetear al default.

**Caso 0 modalidades marcadas (fallback):**
- Se usa la distribucion generica por area disciplinar (tabla en datos estaticos).
- Se muestra aviso: "Distribucion sugerida para el area [X]. Ajuste las proporciones segun la naturaleza especifica de la AC."
- Los 5 sliders se muestran en modo readonly con los valores del fallback.

---

### d) Slider de nivel cognitivo (por modalidad activada)

**Tipo de control:** `<input type="range" min="1" max="4" step="1">` con 4 posiciones discretas.

**Las 4 posiciones:**

| Posicion | Etiqueta visible | Verbos ejemplo (subtexto) | Tooltip | DOK interno (invisible) |
|----------|-----------------|--------------------------|---------|------------------------|
| 1 | Recordar / Comprender | listar, definir, identificar, explicar, clasificar, resumir | "El estudiante reproduce o reformula informacion." | DOK 1: recuperacion |
| 2 | Aplicar | resolver, demostrar, implementar, utilizar, calcular | "El estudiante usa conocimiento en situaciones tipicas." | DOK 2: habilidades y conceptos |
| 3 | Analizar / Evaluar | comparar, diferenciar, argumentar, justificar, criticar | "El estudiante descompone, relaciona o emite juicio fundamentado." | DOK 3: pensamiento estrategico |
| 4 | Crear | disenar, producir, formular, investigar, componer | "El estudiante genera un producto original." | DOK 4: pensamiento extendido |

**Defaults por modalidad:**

| Modalidad | Nivel default | Rango sugerido |
|-----------|--------------|----------------|
| Estudio individual | 1 | 1-2 |
| Produccion escrita | 2 | 2-3 |
| Practica aplicada | 2 | 2-3 |
| Trabajo colaborativo | 2 | 2-3 |
| Produccion integrada | 3 | 3-4 |

**Visualizacion:**
- El slider muestra las 4 posiciones como puntos en una linea horizontal.
- La posicion activa se destaca con color (azul UMCE).
- Los verbos ejemplo se muestran como texto gris debajo del slider.
- Tooltip general (icono `?` al lado del slider): "Seleccione el nivel mas alto que el estudiante debe alcanzar en esta modalidad de trabajo."

**Al cambiar el nivel:**
- Se recalcula inmediatamente el nivel cognitivo predominante de la AC (el max de todos los sliders).
- Se recalculan HT y la distribucion.
- Se evaluan alertas de coherencia nivel-modalidad.

---

### e) Motor de calculo

El motor es invisible para el usuario. Se ejecuta en tiempo real cada vez que cambia un input. El resultado se muestra en el panel de resultados de la AC.

#### Paso 1: Estimar HT desde nivel cognitivo predominante

**Determinar nivel predominante:**
```
nivel_predominante = max(nivel_slider_1, nivel_slider_2, ..., nivel_slider_n)
// donde n = numero de modalidades marcadas
```

Si ninguna modalidad esta marcada (fallback), se usa nivel 2 (Aplicar) como default conservador.

**Tabla de horas base por nivel (constante JS: `HOURS_BY_LEVEL` de SCTEngine):**

| Nivel | Horas por SCT (horasBase) | Rango completo |
|-------|---------------------------|----------------|
| 1 | 27 | 27 h |
| 2 | 28.5 | 27-30 h |
| 3 | 32.5 | 30-35 h |
| 4 | 36.5 | 33-40 h |

**Calculo de HT estimado (alineado con `SCTEngine.calculateFromCognitive`):**

El motor usa la carga semanal maxima del perfil (desde `PROFILE_PARAMS`) como ancla para evitar circularidad. No se aplican factores `AJUSTE_PERFIL` ni `AJUSTE_MODALIDAD` independientes — el perfil ya esta encapsulado en `PROFILE_PARAMS`.

```
// Parametros del perfil (desde PROFILE_PARAMS[perfil].maxHrsSemanaAC):
//   pregrado:    12 hrs/semana por AC
//   postgrado:   10 hrs/semana por AC
//   continua:     8 hrs/semana por AC

// Estimacion inicial: usar maxHrsSemanaAC del perfil * semanas
HT_inicial = PROFILE_PARAMS[perfil].maxHrsSemanaAC * NS
SCT_inicial = ceil(HT_inicial / 27)

// Refinar con horasBase del nivel cognitivo:
HT_estimado = SCT_inicial * HOURS_BY_LEVEL[nivel_predominante].horasBase

// Si la carga semanal resultante excede el maximo, ajustar SCT a la baja
carga_semanal = HT_estimado / NS
if (carga_semanal > PROFILE_PARAMS[perfil].maxHrsSemanaAC) {
  HT_estimado = PROFILE_PARAMS[perfil].maxHrsSemanaAC * NS
  SCT_estimado = ceil(HT_estimado / 27)
  HT_estimado = SCT_estimado * HOURS_BY_LEVEL[nivel_predominante].horasBase
}

// Calcular SCT final
SCT_estimado = ceil(HT_estimado / 27)
```

**Nota sobre la estimacion circular:** El HT depende del nivel cognitivo, no de un SCT declarado por el usuario. La carga semanal maxima del perfil es el ancla. El coordinador puede sobreescribir el resultado.

**Panel de resultado (visible al usuario):**
- HT estimado (numero grande)
- SCT estimado (numero destacado)
- Texto: "Basado en nivel cognitivo [X], perfil [Y], [Z] semanas"
- Boton "Ajustar manualmente" que permite sobreescribir HT (se marca como "ajustado manualmente" en el informe)

#### Paso 2: Distribuir HT proporcionalmente entre modalidades

```
// Para cada modalidad marcada i:
horas_modalidad[i] = HT_estimado * (proporcion[i] / 100)

// Verificacion algebraica (siempre verdadera si proporciones suman 100%):
// sum(horas_modalidad[i]) === HT_estimado
```

**Default equitativo:**
```
n_marcadas = checkboxes_activos.length
proporcion_default = Math.floor(100 / n_marcadas)
// Ajustar ultima modalidad para que sume exactamente 100
proporcion_ultima = 100 - (proporcion_default * (n_marcadas - 1))
```

**Ajuste manual:**
- El coordinador edita las proporciones directamente.
- Validacion: `sum(proporciones) === 100`. Si no, badge rojo + calculo suspendido.
- Granularidad: step de 5% (5, 10, 15, ..., 95).

**Tabla de resultado (visible al usuario):**

```
| Modalidad          | Proporcion | Nivel | Horas |
|--------------------|------------|-------|-------|
| Estudio individual |   30%      |  1    |  40.5 |
| Produccion escrita |   20%      |  2    |  27.0 |
| Practica aplicada  |   50%      |  3    |  67.5 |
| TOTAL              |  100%      |  --   | 135.0 |
```

#### Paso 3: Aplicar ratios sync/async/auto por modalidad

**Tabla de ratios por tipo Laurillard (constante JS: `LAURILLARD_RATIOS` de SCTEngine):**

| Tipo Laurillard | sync | async | auto | Logica |
|----------------|------|-------|------|--------|
| Adquisicion | 0.50 | 0.20 | 0.30 | Clase expositiva + lectura autonoma |
| Investigacion | 0.20 | 0.35 | 0.45 | Trabajo autonomo de busqueda + tutoria |
| Practica | 0.40 | 0.30 | 0.30 | Ejercitacion guiada + practica independiente |
| Produccion | 0.15 | 0.30 | 0.55 | Creacion individual/grupal de artefactos |
| Discusion | 0.35 | 0.45 | 0.20 | Debates sincronicos + foros asincronicos |
| Colaboracion | 0.30 | 0.50 | 0.20 | Trabajo grupal asincrono + sesiones coordinacion |

**Tabla de mapeo modalidad a tipo Laurillard (constante JS: `MODALITY_TO_LAURILLARD` de SCTEngine):**

| Modalidad de trabajo | Tipo(s) Laurillard | Calculo de ratios |
|---------------------|-------------------|-------------------|
| Estudio individual | Adquisicion | Ratios directos de Adquisicion |
| Produccion escrita | Produccion | Ratios directos de Produccion |
| Practica aplicada | Practica | Ratios directos de Practica |
| Trabajo colaborativo | Discusion + Colaboracion | Promedio de ratios Discusion y Colaboracion |
| Produccion integrada | Produccion + Investigacion | Promedio de ratios Produccion e Investigacion |

**Ratios resultantes por modalidad de trabajo (precomputados):**

| Modalidad | sync | async | auto |
|-----------|------|-------|------|
| Estudio individual | 0.50 | 0.20 | 0.30 |
| Produccion escrita | 0.15 | 0.30 | 0.55 |
| Practica aplicada | 0.40 | 0.30 | 0.30 |
| Trabajo colaborativo | 0.325 | 0.475 | 0.20 |
| Produccion integrada | 0.175 | 0.325 | 0.50 |

**Ajuste por perfil (aplicado sobre los ratios base):**

| Perfil | Ajuste sync | Ajuste async | Ajuste auto |
|--------|-------------|--------------|-------------|
| Pregrado | +5% | -2.5% | -2.5% | Mayor sincronismo |
| Postgrado | -5% | +2.5% | +2.5% | Mayor autonomia |
| Ed. Continua | -5% | +5% | 0% | Mayor asincronismo |

Los ajustes se aplican sumando/restando a los ratios base, y luego renormalizando para que sumen 1.0.

**Calculo del triple obligatorio:**

```
// Para cada modalidad marcada i:
H_sync_parcial[i]  = horas_modalidad[i] * ratio_sync_ajustado[modalidad_i]
H_async_parcial[i] = horas_modalidad[i] * ratio_async_ajustado[modalidad_i]
H_auto_parcial[i]  = horas_modalidad[i] * ratio_auto_ajustado[modalidad_i]

// Triple final = suma de parciales:
H_sinc  = sum(H_sync_parcial[i])
H_asinc = sum(H_async_parcial[i])
H_aut   = sum(H_auto_parcial[i])

// Verificacion:
// H_sinc + H_asinc + H_aut === HT_estimado (salvo errores de redondeo < 0.1)
```

#### Paso 4: Verificaciones

**4a. Autonomo 25-40% (restriccion institucional Doc. N. 004-2020):**
```
pct_aut = (H_aut / HT_estimado) * 100

if (pct_aut < 25) {
  alerta("Horas autonomas ({pct_aut}%) por debajo del minimo institucional (25%).
          Considere agregar modalidades con mayor componente autonomo.")
}
if (pct_aut > 40) {
  alerta("Horas autonomas ({pct_aut}%) por encima del maximo institucional (40%).
          Considere agregar modalidades con mayor componente sincronico.")
}
```
Formato: badge amarillo (warning), no bloqueante.

**4b. Semaforos de carga semanal:**
```
carga_semanal = HT_estimado / NS

// Umbrales por perfil:
umbrales = {
  pregrado:    { verde: 10, amarillo: 12 },  // < 10 verde, 10-12 amarillo, > 12 rojo
  postgrado:   { verde: 8,  amarillo: 10 },
  ed_continua: { verde: 6,  amarillo: 8  }
}
```

Semaforo: circulo de color (verde/amarillo/rojo) junto al HT estimado.

**4c. Alertas de coherencia nivel-modalidad (ver sub-componente h).**

---

### f) Comportamiento CUECH (logica invertida)

Cuando el formato seleccionado es "CUECH Subete" (o cualquier otro formato con SCT fijos):

**Cambios en la UI:**

1. **Banner permanente** (fijo en la parte superior de la card de AC):
   ```
   [i] SCT fijo: 2 creditos (54 h). El sistema sugerira como distribuir
       las horas segun el perfil cognitivo seleccionado.
   ```
   Estilo: `bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-800`

2. **Boton de accion cambia:**
   - Texto: "Distribuir horas" (en vez de "Estimar SCT")
   - El SCT se muestra como readonly: "2 SCT (fijo)"

3. **El campo HT se fija en 54** y es readonly.

**Cambios en el motor:**

```
// SCT y HT son constantes:
SCT = 2
HT = 54

// Paso 1 se OMITE (no se estima HT, ya es dato)

// Paso 2: la distribucion por modalidad usa HT = 54
// Las proporciones se ponderan por nivel cognitivo:
// modalidades con nivel mas alto reciben mayor proporcion
peso[i] = nivel_slider[i]  // 1, 2, 3 o 4
peso_total = sum(peso[i])
proporcion_ponderada[i] = (peso[i] / peso_total) * 100
horas_modalidad[i] = 54 * (proporcion_ponderada[i] / 100)

// El coordinador puede sobreescribir las proporciones ponderadas
// y volver al modo equitativo o manual.

// Pasos 3 y 4 se ejecutan igual (sync/async/auto + verificaciones)
```

**Nota:** El coordinador puede alternar entre ponderacion por nivel y distribucion equitativa con un toggle: "Ponderar por nivel cognitivo / Distribuir equitativamente".

---

### g) Vista de programa (multi-AC + semestres)

**Como se asignan ACs a semestres:**
- Cada AC tiene un campo `<select>` "Semestre" con opciones 1..N + "Sin asignar".
- Al seleccionar un semestre, la AC aparece en la columna correspondiente de la vista de programa.
- ACs sin asignar se muestran en una seccion "Sin asignar" al final.

**Estructura de la vista de programa:**

La vista se muestra como una seccion separada debajo de la lista de ACs (boton "Ver programa completo" para expandir/colapsar).

**Carga por semestre:**
```
// Para cada semestre s:
SCT_semestre[s]    = sum(SCT_estimado[ac]) for ac in semestre[s]
HT_semestre[s]     = sum(HT_estimado[ac]) for ac in semestre[s]
H_sinc_semestre[s] = sum(H_sinc[ac])      for ac in semestre[s]
H_asinc_semestre[s]= sum(H_asinc[ac])     for ac in semestre[s]
H_aut_semestre[s]  = sum(H_aut[ac])        for ac in semestre[s]
carga_semanal[s]   = HT_semestre[s] / NS_promedio[s]
```

**Semaforos agregados:** Se aplican los mismos umbrales de carga semanal del sub-componente e, Paso 4b, pero sobre la carga semanal del semestre completo:

```
// Umbrales de carga semanal TOTAL del semestre (todas las ACs):
umbrales_semestre = {
  pregrado:    { verde: 40, amarillo: 45 },  // hrs/semana total
  postgrado:   { verde: 12, amarillo: 15 },
  ed_continua: { verde: 6,  amarillo: 8  }
}
```

**Balance de complejidad cognitiva:**
- Para cada semestre, se calcula el nivel cognitivo promedio ponderado por SCT:
  ```
  nivel_promedio[s] = sum(nivel_predominante[ac] * SCT[ac]) / SCT_semestre[s]
  ```
- Se muestra como barra de color por semestre (1-2: azul claro, 2-3: azul medio, 3-4: azul oscuro).
- Alerta si un semestre concentra > 70% de las ACs de nivel 4: "El semestre [X] concentra la mayor parte de la complejidad alta. Considere redistribuir."

**Sobre presupuestario (por AC, para M3):**
Cada AC genera un objeto JSON que se guarda en localStorage para consumo del Planificador Curricular:
```json
{
  "ac_nombre": "Investigacion Educativa I",
  "ac_codigo": "IE-101",
  "sct": 4,
  "ht": 108,
  "h_sinc": 32.4,
  "h_asinc": 37.8,
  "h_aut": 37.8,
  "nivel_predominante": 3,
  "perfil_laurillard_dominante": "Investigacion",
  "modalidades": [
    { "nombre": "Estudio individual", "proporcion": 30, "nivel": 2, "horas": 32.4 },
    { "nombre": "Produccion integrada", "proporcion": 70, "nivel": 3, "horas": 75.6 }
  ],
  "tolerancia_pct": 10,
  "generado_por": "modoC",
  "fecha": "2026-04-13T15:30:00Z"
}
```

---

### h) Alertas de coherencia nivel-modalidad

El sistema evalua las alertas despues de cada cambio en los sliders o checkboxes.

**Combinaciones contradictorias:**

| Condicion | Mensaje | Severidad |
|-----------|---------|-----------|
| Nivel 4 (Crear) + solo "Estudio individual" marcado | "El nivel Crear tipicamente requiere produccion integrada o produccion escrita. Desea agregar una modalidad de produccion?" | Warning (amarillo) |
| Nivel 1 (Recordar/Comprender) + solo "Produccion integrada" marcado | "Un proyecto o investigacion tipicamente implica niveles de Analizar o Crear. Desea ajustar el nivel cognitivo?" | Warning (amarillo) |
| Solo 1 modalidad marcada + nivel >= 3 | "Las actividades curriculares de nivel avanzado suelen combinar mas de una modalidad de trabajo." | Info (azul claro) |
| Nivel 4 en "Estudio individual" | "El estudio individual rara vez demanda creacion original. Considere nivel 1-2 para esta modalidad." | Info (azul claro) |
| Nivel 1 en "Produccion integrada" | "Un proyecto tipicamente demanda al menos nivel de Aplicar. Considere ajustar." | Info (azul claro) |
| Todas las modalidades en nivel 1 + area = Tecnologia o Artes | "Los programas de [area] tipicamente incluyen componentes de practica o produccion en niveles superiores." | Info (azul claro) |

**Formato del warning:**
```html
<div class="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
  <svg class="w-5 h-5 mt-0.5 text-amber-500 shrink-0"><!-- icono warning --></svg>
  <div>
    <p class="font-medium">Alerta de coherencia</p>
    <p>[Mensaje de la alerta]</p>
  </div>
  <button class="ml-auto text-amber-400 hover:text-amber-600" onclick="dismissAlert(this)">
    <svg><!-- icono X --></svg>
  </button>
</div>
```

**Comportamiento:**
- Las alertas son orientativas, nunca bloqueantes.
- El coordinador puede descartarlas con el boton X.
- Las alertas descartadas no reaparecen para la misma AC salvo que se cambie la combinacion.
- Se almacenan en un array `dismissedAlerts` por AC para controlar la re-aparicion.

---

## Inputs -- Todos los campos con tipos, validacion y defaults

### Nivel programa (configuracion)

| Campo | Tipo JS | HTML | Default | Validacion | Requerido |
|-------|---------|------|---------|------------|-----------|
| nombre_programa | string | text input | "" | len > 0, len <= 200 | Si |
| codigo_programa | string | text input | "" | len <= 20 | No |
| perfil | enum | radio cards | "pregrado" | ["pregrado","postgrado","ed_continua"] | Si |
| modalidad_general | enum | radio cards | "virtual" | ["virtual","semipresencial"] | Si |
| formato | enum | radio cards | "semestral_18" | ["semestral_18","modulo_8","bloque_5","cuech_16"] | Si |
| area_disciplinar | enum | select | "educacion" | ["ciencias","humanidades","educacion","artes","tecnologia"] | Si |
| num_semestres | int | number input | 2 | min 1, max 12 | Si |

### Nivel AC (por actividad curricular)

| Campo | Tipo JS | HTML | Default | Validacion | Requerido |
|-------|---------|------|---------|------------|-----------|
| ac_nombre | string | text input | "" | len > 0, len <= 150 | Si |
| ac_codigo | string | text input | "" | len <= 15 | No |
| ac_modalidad | enum | radio | hereda global | ["virtual","semipresencial"] | Si |
| ac_area | enum | select | hereda global | 5 opciones | Si |
| ac_semanas | int | number input | segun formato | min 1, max 36 | Si |
| ac_semestre | int|null | select | null | 1..N o null | No |
| modalidades_marcadas | bool[5] | checkboxes | [false x5] | al menos 0 (fallback activo) | No |
| proporciones | int[5] | number inputs | equitativas | sum = 100, cada una 5..95, step 5 | Si (si hay marcadas) |
| niveles | int[5] | range sliders | por modalidad | 1..4 | Si (por marcada) |
| ht_manual_override | float|null | number input | null | > 0 si se usa | No |

---

## Outputs

### Por AC

| Output | Tipo | Calculo | Visible al usuario |
|--------|------|---------|-------------------|
| HT_estimado | float | Motor Paso 1 | Si (numero grande) |
| SCT_estimado | int | ceil(HT / 27) | Si (numero destacado) |
| H_sinc | float | Motor Paso 3 | Si (tabla + donut) |
| H_asinc | float | Motor Paso 3 | Si (tabla + donut) |
| H_aut | float | Motor Paso 3 | Si (tabla + donut) |
| HP_ugci | float | = H_sinc | Si (formato UGCI) |
| HA_ugci | float | = H_asinc + H_aut | Si (formato UGCI) |
| nivel_predominante | int (1-4) | max(niveles) | Si (badge de color) |
| horas_por_modalidad[] | float[] | Motor Paso 2 | Si (tabla de modalidades) |
| carga_semanal | float | HT / NS | Si (con semaforo) |
| pct_autonomo | float | H_aut / HT * 100 | Si (con semaforo 25-40%) |
| sobre_presupuestario | object | Todos los datos | No (localStorage, para M3) |
| alertas[] | string[] | Coherencia | Si (si aplican) |

### Por semestre (vista de programa)

| Output | Tipo | Calculo |
|--------|------|---------|
| SCT_semestre | int | sum(SCT por AC) |
| HT_semestre | float | sum(HT por AC) |
| H_sinc_semestre | float | sum(H_sinc por AC) |
| H_asinc_semestre | float | sum(H_asinc por AC) |
| H_aut_semestre | float | sum(H_aut por AC) |
| carga_semanal_semestre | float | HT_semestre / NS_promedio |
| nivel_promedio_ponderado | float | sum(nivel * SCT) / SCT_total |
| semaforo_carga | enum | verde/amarillo/rojo |
| alerta_concentracion | bool | > 70% ACs nivel 4 en 1 semestre |

### Datos para informe

| Bloque | Contenido |
|--------|-----------|
| Bloque 1 (PAC) | Nombre, programa, SCT, HT, HS/sem, HAs/sem, HAut/sem, NS, HP, HA |
| Bloque 2 (Metodologico) | Tabla de modalidades (modalidad, proporcion, nivel, horas), nivel predominante, multiplicador, area disciplinar, conversion a formato semanal |

---

## Datos estaticos necesarios (constantes JS)

### 1. HOURS_BY_LEVEL (4 entradas)

// NOTA: Estas constantes se definen en SCTEngine (plan-motor). No redefinir aqui.

```javascript
// Usar HOURS_BY_LEVEL de SCTEngine (plan-motor):
// var HOURS_BY_LEVEL = {
//   1: { label: 'Recordar / Comprender', dok: 1, horasMin: 27, horasMax: 27,  multMin: 1.00, multMax: 1.00, horasBase: 27 },
//   2: { label: 'Aplicar',              dok: 2, horasMin: 27, horasMax: 30,  multMin: 1.00, multMax: 1.11, horasBase: 28.5 },
//   3: { label: 'Analizar / Evaluar',   dok: 3, horasMin: 30, horasMax: 35,  multMin: 1.11, multMax: 1.30, horasBase: 32.5 },
//   4: { label: 'Crear',                dok: 4, horasMin: 33, horasMax: 40,  multMin: 1.22, multMax: 1.48, horasBase: 36.5 }
// };
// Acceso: HOURS_BY_LEVEL[nivel].horasBase
```

### 2. LAURILLARD_RATIOS (6 filas)

// NOTA: Estas constantes se definen en SCTEngine (plan-motor). No redefinir aqui.

```javascript
// Usar LAURILLARD_RATIOS de SCTEngine (plan-motor):
// var LAURILLARD_RATIOS = {
//   adquisicion:   { sync: 0.50, async: 0.20, auto: 0.30 },
//   investigacion: { sync: 0.20, async: 0.35, auto: 0.45 },
//   practica:      { sync: 0.40, async: 0.30, auto: 0.30 },
//   produccion:    { sync: 0.15, async: 0.30, auto: 0.55 },
//   discusion:     { sync: 0.35, async: 0.45, auto: 0.20 },
//   colaboracion:  { sync: 0.30, async: 0.50, auto: 0.20 }
// };
// Claves: sync / async / auto (NO sinc/asinc/aut)
```

### 3. MODALITY_TO_LAURILLARD (5 filas)

// NOTA: Estas constantes se definen en SCTEngine (plan-motor). No redefinir aqui.

```javascript
// Usar MODALITY_TO_LAURILLARD de SCTEngine (plan-motor):
// var MODALITY_TO_LAURILLARD = {
//   estudio_individual:   ['adquisicion'],
//   produccion_escrita:   ['produccion'],
//   practica_aplicada:    ['practica'],
//   trabajo_colaborativo: ['discusion', 'colaboracion'],
//   produccion_integrada: ['produccion', 'investigacion']
// };
// Para modalidades con 2 tipos: promediar ratios
```

### 4. MODALITY_DEFAULTS (5 filas)

// NOTA: Estas constantes se definen en SCTEngine (plan-motor). No redefinir aqui.

```javascript
// Usar MODALITY_DEFAULTS de SCTEngine (plan-motor):
// var MODALITY_DEFAULTS = {
//   estudio_individual:   { nivelMin: 1, nivelMax: 2, nivelDefault: 1 },
//   produccion_escrita:   { nivelMin: 2, nivelMax: 3, nivelDefault: 2 },
//   practica_aplicada:    { nivelMin: 2, nivelMax: 3, nivelDefault: 2 },
//   trabajo_colaborativo: { nivelMin: 2, nivelMax: 3, nivelDefault: 2 },
//   produccion_integrada: { nivelMin: 3, nivelMax: 4, nivelDefault: 3 }
// };
// Acceso: MODALITY_DEFAULTS[modalidad].nivelDefault
```

### 5. DISCIPLINE_DEFAULTS (5 x 5 tabla)

// NOTA: Estas constantes se definen en SCTEngine (plan-motor). No redefinir aqui.

```javascript
// Usar DISCIPLINE_DEFAULTS de SCTEngine (plan-motor):
// Proporciones en decimales (suman 1.0), NO en porcentajes enteros.
// var DISCIPLINE_DEFAULTS = {
//   ciencias:    { estudio_individual: 0.20, produccion_escrita: 0.10, practica_aplicada: 0.40, trabajo_colaborativo: 0.10, produccion_integrada: 0.20 },
//   humanidades: { estudio_individual: 0.40, produccion_escrita: 0.30, practica_aplicada: 0.05, trabajo_colaborativo: 0.15, produccion_integrada: 0.10 },
//   educacion:   { estudio_individual: 0.25, produccion_escrita: 0.20, practica_aplicada: 0.15, trabajo_colaborativo: 0.20, produccion_integrada: 0.20 },
//   artes:       { estudio_individual: 0.15, produccion_escrita: 0.10, practica_aplicada: 0.30, trabajo_colaborativo: 0.15, produccion_integrada: 0.30 },
//   tecnologia:  { estudio_individual: 0.15, produccion_escrita: 0.10, practica_aplicada: 0.35, trabajo_colaborativo: 0.10, produccion_integrada: 0.30 }
// };
```

### 6. BLOOM_TO_DOK (4 entradas)

// NOTA: Estas constantes se definen en SCTEngine (plan-motor). No redefinir aqui.

```javascript
// Usar BLOOM_TO_DOK de SCTEngine (plan-motor):
// var BLOOM_TO_DOK = {
//   1: 1,  // Recordar/Comprender → Recuperacion
//   2: 2,  // Aplicar → Habilidades y conceptos
//   3: 3,  // Analizar/Evaluar → Pensamiento estrategico
//   4: 4   // Crear → Pensamiento extendido
// };
```

### 7. VERB_EXAMPLES (4 entradas)

// NOTA: Estas constantes se definen en SCTEngine (plan-motor). No redefinir aqui.

```javascript
// Usar VERB_EXAMPLES de SCTEngine (plan-motor):
// var VERB_EXAMPLES = {
//   1: { label: 'Recordar / Comprender', verbos: [...], tooltip: '...' },
//   2: { label: 'Aplicar',              verbos: [...], tooltip: '...' },
//   3: { label: 'Analizar / Evaluar',   verbos: [...], tooltip: '...' },
//   4: { label: 'Crear',                verbos: [...], tooltip: '...' }
// };
// Acceso: VERB_EXAMPLES[nivel].verbos
```

### 8. Constantes adicionales

// NOTA: Estas constantes se definen en SCTEngine (plan-motor). No redefinir aqui.

```javascript
// SCT_HOURS, PROFILE_PARAMS, FORMATOS ya definidos en SCTEngine (plan-motor).
// Usar directamente desde SCTEngine. No redefinir en Modo C.

// AJUSTE_PERFIL y AJUSTE_MODALIDAD han sido eliminados: el perfil ya esta
// encapsulado en PROFILE_PARAMS (maxHrsSemanaAC, syncAdjust, etc.) y
// SCTEngine.calculateFromCognitive() no los usa como factores independientes.

// SCT_HORAS renombrado a SCT_HOURS (nombre canonico en plan-motor).
// CARGA_SEMANAL_MAX_POR_AC y UMBRALES_CARGA_AC estan en PROFILE_PARAMS de plan-motor.
// UMBRALES_CARGA_SEMESTRE referenciado desde PROFILE_PARAMS segun perfil.

// Constantes exclusivas de Modo C (no duplicadas en plan-motor):

var SEMANAS_POR_FORMATO = {
  semestral_18: 18,
  modulo_8:      8,
  bloque_5:      5,
  cuech_16:     16
};

var CUECH_SCT_FIJO = 2;
var CUECH_HT_FIJO = CUECH_SCT_FIJO * SCT_HOURS;  // 54

// Ajuste de ratios sync/async/auto por perfil (aplicado sobre LAURILLARD_RATIOS base)
var AJUSTE_PERFIL_RATIOS = {
  pregrado:    { sync: +0.05, async: -0.025, auto: -0.025 },
  postgrado:   { sync: -0.05, async: +0.025, auto: +0.025 },
  ed_continua: { sync: -0.05, async: +0.050, auto:  0.000 }
};

var RANGO_AUTONOMO = { min: 25, max: 40 };  // porcentaje
```

---

## Dependencias

| Dependencia | Descripcion | Compartida con |
|-------------|-------------|---------------|
| Formula canonica | `SCT = ceil(HT / 27)` | Modos A, B, C |
| renderDonut() | Grafico donut para distribucion sync/async/auto | Modos A, B |
| renderSemaforo() | Semaforo visual de carga | Modos A, B |
| renderWeeklyBars() | Barra de carga semanal | Modos A, B |
| renderReport() | Generador de informe de 2 bloques. Recibe triple + metadatos del modo | Modos A, B, C |
| localStorage | Persistencia de programa en progreso y sobre presupuestario | M3 (Planificador Curricular) |
| Componentes visuales Tailwind | Cards, badges, tooltips, radio cards, sliders | Modos A, B |

---

## Wireframes ASCII detallados

### c) Checkboxes de modalidades + proporciones

```
+------------------------------------------------------------------+
| MODALIDADES DE TRABAJO                          [? Ayuda]         |
|                                                                  |
| Marque las modalidades presentes en esta AC:                     |
|                                                                  |
| [x] Estudio individual                                          |
|     Lectura, video, contenido, material de referencia            |
|     +-- Nivel cognitivo: [*--+----+----+] Recordar/Comprender    |
|     |   listar, definir, identificar, explicar                   |
|     +-- Proporcion: [  30 ] %                                    |
|                                                                  |
| [ ] Produccion escrita                                           |
|     Ensayos, informes, reportes, reflexiones                     |
|                                                                  |
| [x] Practica aplicada                                            |
|     Laboratorio, ejercicios, simulacion, casos                   |
|     +-- Nivel cognitivo: [----+--*-+----+] Aplicar               |
|     |   resolver, demostrar, implementar, utilizar               |
|     +-- Proporcion: [  20 ] %                                    |
|                                                                  |
| [ ] Trabajo colaborativo                                         |
|     Discusion, debate, trabajo grupal, co-evaluacion             |
|                                                                  |
| [x] Produccion integrada                                         |
|     Proyecto, investigacion, portafolio, diseno                  |
|     +-- Nivel cognitivo: [----+----+--*-+] Analizar/Evaluar      |
|     |   comparar, diferenciar, argumentar, justificar            |
|     +-- Proporcion: [  50 ] %                                    |
|                                                                  |
| Suma: 100% [v]          [Redistribuir equitativamente]           |
|                                                                  |
| +--------------------------------------------------------------+ |
| | [!] Alerta de coherencia                                     | |
| | Las ACs de nivel avanzado suelen combinar mas de una         | |
| | modalidad de trabajo.                              [Cerrar X]| |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### d) Slider de nivel cognitivo (detalle ampliado)

```
+------------------------------------------------------------------+
| Nivel cognitivo                                            [?]    |
|                                                                  |
|   Recordar/       Aplicar      Analizar/        Crear            |
|   Comprender                   Evaluar                           |
|                                                                  |
|      (*)-----------(o)-----------(o)-----------(o)               |
|                                                                  |
|   listar, definir, identificar, explicar, clasificar, resumir    |
|                                                                  |
|   Tooltip: "El estudiante reproduce o reformula informacion."    |
+------------------------------------------------------------------+

Leyenda:
  (*) = posicion activa (circulo relleno, color azul UMCE)
  (o) = posicion disponible (circulo vacio, gris)
  Los verbos y tooltip cambian segun la posicion activa.
```

### e) Resultados del motor (panel por AC)

```
+------------------------------------------------------------------+
| RESULTADO ESTIMADO                                               |
|                                                                  |
|   +-------------+    +-------------+    +-----------------+     |
|   |    135 h     |    |    5 SCT    |    |  7.5 h/semana   |     |
|   | Horas totales|    |  Creditos   |    |  Carga semanal  |     |
|   +-------------+    +-------------+    +----[semaforo]----+     |
|                                                                  |
|   Basado en: Nivel 3 (Analizar/Evaluar), Pregrado, 18 semanas   |
|   Multiplicador: 1.20x                    [Ajustar manualmente] |
|                                                                  |
| +--------------------------------------------------------------+ |
| | DISTRIBUCION POR MODALIDAD                                   | |
| |                                                              | |
| | Modalidad             | %   | Nivel | Horas | Sinc|Asin|Aut | |
| |---------------------- |-----|-------|-------|-----|----|----|  |
| | Estudio individual    | 30% |   1   | 40.5  | 20.3|8.1 |12.2| |
| | Practica aplicada     | 20% |   2   | 27.0  | 10.8|8.1 |8.1 | |
| | Produccion integrada  | 50% |   3   | 67.5  | 11.8|21.9|33.8| |
| |---------------------- |-----|-------|-------|-----|----|----|  |
| | TOTAL                 |100% |   --  | 135.0 | 42.9|38.1|54.0| |
| +--------------------------------------------------------------+ |
|                                                                  |
| +--------------------------------------------------------------+ |
| | TRIPLE OBLIGATORIO           |  FORMATO UGCI                 | |
| |                              |                               | |
| |  [donut chart]               |  HP (presencial):   42.9 h   | |
| |   Sinc:  42.9 h (31.8%)     |  HA (autonomas):    92.1 h   | |
| |   Asinc: 38.1 h (28.2%)     |  Total:            135.0 h   | |
| |   Aut:   54.0 h (40.0%)     |                               | |
| |                              |  [!] Autonomo en limite sup. | |
| +--------------------------------------------------------------+ |
|                                                                  |
| +--------------------------------------------------------------+ |
| | FORMATO SEMANAL (editable antes de exportar)                 | |
| |                                                              | |
| |  HS/sem (sincronicas):  [ 2.4 ] h    (42.9 / 18)           | |
| |  HAs/sem (asincronicas):[ 2.1 ] h    (38.1 / 18)           | |
| |  HAut/sem (autonomas):  [ 3.0 ] h    (54.0 / 18)           | |
| |  Total semanal:           7.5 h                              | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### f) Modo CUECH (logica invertida)

```
+------------------------------------------------------------------+
| +--------------------------------------------------------------+ |
| | [i] SCT FIJO: 2 creditos (54 h)                             | |
| |     El sistema sugerira como distribuir las horas segun      | |
| |     el perfil cognitivo seleccionado.                        | |
| +--------------------------------------------------------------+ |
|                                                                  |
|   +-------------+    +-------------+                             |
|   |    54 h      |    |   2 SCT     |                            |
|   | Horas totales|    |   (fijo)    |                            |
|   |   (fijo)     |    |             |                            |
|   +-------------+    +-------------+                             |
|                                                                  |
|   Ponderacion: (*) Por nivel cognitivo  ( ) Equitativa           |
|                                                                  |
|   [Las modalidades y sliders se muestran igual que en modo       |
|    normal, pero las proporciones reflejan la ponderacion          |
|    por nivel cognitivo en vez de ser equitativas]                 |
|                                                                  |
|   [ Distribuir horas ]     (en vez de "Estimar SCT")             |
+------------------------------------------------------------------+
```

### g) Vista de programa (multi-semestre)

```
+------------------------------------------------------------------+
| VISTA DE PROGRAMA: [Nombre del programa]                         |
| Perfil: Postgrado | Modalidad: Virtual | 4 semestres             |
|                                                                  |
| +--------------------------------------------------------------+ |
| | SEMESTRE 1            12 SCT | 324 h | 18.0 h/sem [verde]   | |
| | Complejidad promedio: 2.3                                    | |
| |                                                              | |
| | +-----------+ +-----------+ +-----------+ +-----------+      | |
| | |Introd. Ed | |Psic. Ap.  | |Metodos I  | |Taller 1   |     | |
| | |3 SCT  Nv2 | |3 SCT  Nv2 | |3 SCT  Nv3 | |3 SCT  Nv2 |     | |
| | +-----------+ +-----------+ +-----------+ +-----------+      | |
| +--------------------------------------------------------------+ |
|                                                                  |
| +--------------------------------------------------------------+ |
| | SEMESTRE 2            15 SCT | 405 h | 22.5 h/sem [amarillo]| |
| | Complejidad promedio: 2.8                                    | |
| |                                                              | |
| | +-----------+ +-----------+ +-----------+ +-----------+      | |
| | |Curric. Di | |Invest. I  | |Practica 1 | |Seminario  |      | |
| | |4 SCT  Nv3 | |4 SCT  Nv3 | |4 SCT  Nv2 | |3 SCT  Nv3 |     | |
| | +-----------+ +-----------+ +-----------+ +-----------+      | |
| +--------------------------------------------------------------+ |
|                                                                  |
| +--------------------------------------------------------------+ |
| | SEMESTRE 3            15 SCT | 432 h | 24.0 h/sem [rojo]    | |
| | Complejidad promedio: 3.5                                    | |
| | [!] Carga semanal excede el umbral recomendado               | |
| | [!] Alta concentracion de complejidad nivel 4                 | |
| |                                                              | |
| | +-----------+ +-----------+ +-----------+ +-----------+      | |
| | |Invest. II | |Tesis I    | |Sem. Avanz.| |Practica 2 |      | |
| | |4 SCT  Nv4 | |5 SCT  Nv4 | |3 SCT  Nv3 | |3 SCT  Nv3 |     | |
| | +-----------+ +-----------+ +-----------+ +-----------+      | |
| +--------------------------------------------------------------+ |
|                                                                  |
| +--------------------------------------------------------------+ |
| | SIN ASIGNAR                                                  | |
| | +-----------+                                                | |
| | |Optativo 1 |                                                | |
| | |2 SCT  Nv2 |                                                | |
| | +-----------+                                                | |
| +--------------------------------------------------------------+ |
|                                                                  |
| +--------------------------------------------------------------+ |
| | RESUMEN DEL PROGRAMA                                         | |
| |                                                              | |
| | Total SCT: 44/60    ACs: 13/--    Semestres: 3 (+1 vacio)   | |
| |                                                              | |
| | Sem | SCT | HT    | h/sem | Sinc  | Asinc | Aut   | Nv avg | |
| | ----|-----|-------|-------|-------|-------|-------|--------| |
| |  1  |  12 |  324  | 18.0  | 103.1 | 115.6 | 105.3 |  2.3   | |
| |  2  |  15 |  405  | 22.5  | 121.5 | 145.8 | 137.7 |  2.8   | |
| |  3  |  15 |  432  | 24.0  | 103.7 | 138.2 | 190.1 |  3.5   | |
| | ----|-----|-------|-------|-------|-------|-------|--------| |
| | TOT |  42 | 1161  |  --   | 328.3 | 399.6 | 433.1 |  2.9   | |
| |                                                              | |
| | [Generar informe]           [Exportar JSON]                  | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## Estructura de archivos sugerida

```
public/
  virtualizacion-sct.html          # Pagina principal (ya existe, agregar tab Modo C)
  shared/
    sct-constants.js               # Todas las constantes JS de este documento
    sct-engine-modoC.js            # Motor de calculo del Modo C (Pasos 1-4)
    sct-ui-modoC.js                # Logica de UI: checkboxes, sliders, proporciones, alertas
    sct-programa.js                # Vista de programa multi-semestre
    sct-report.js                  # Generador de informe (compartido con A y B)
    sct-donut.js                   # renderDonut() (ya existe, reutilizar)
    sct-semaforo.js                # renderSemaforo() (ya existe, reutilizar)
```

---

## Notas de implementacion

1. **El motor se ejecuta en cada cambio de input.** Usar debounce de 150ms para evitar recalculos excesivos durante ajuste de sliders.

2. **localStorage key**: `sct_modoC_programa_{timestamp}`. Guardar auto-save cada 30 segundos si hay cambios. Maximo 5 programas almacenados (FIFO).

3. **El sobre presupuestario** se guarda en `sct_sobre_{ac_codigo}` para consumo de M3.

4. **Redondeo**: HT y horas parciales se redondean a 1 decimal para display. SCT siempre ceil a entero. Las verificaciones algebraicas (suma = HT) se hacen antes del redondeo de display.

5. **Accesibilidad del slider**: el `<input type="range">` con 4 posiciones se complementa con `aria-label`, `aria-valuetext` (nombre del nivel), y teclas de flecha para navegacion.

6. **Exportacion JSON**: boton que descarga el programa completo como JSON, incluyendo todos los sobres presupuestarios. Nombre del archivo: `{codigo_programa}_sct_modoC_{fecha}.json`.

7. **Importacion**: boton que carga un JSON previamente exportado y restaura el estado completo del programa.
