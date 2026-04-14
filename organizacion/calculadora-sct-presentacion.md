# Calculadora SCT UMCE — documento de presentación

**Versión**: demo en producción (https://umce.online/virtualizacion/sct)
**Fecha**: 14-abr-2026
**Audiencia**: Mesa 1 Virtualización UMCE, UGCI, coordinadores de programa
**Autor**: David Reyes (UDFV)

Este documento explica **qué hace la herramienta, cómo se usa y qué parte
del modelo tiene respaldo formal**. Está escrito con honestidad declarada:
lo que está sustentado se cita, lo que es decisión de diseño se marca como
tal, y lo que falta se enumera sin disfrazarlo de funcionalidad.

---

## 1. Qué es

Una aplicación web de diseño curricular que ayuda a un coordinador de
programa a **distribuir la carga del estudiante** entre sus asignaturas
o actividades curriculares (AC) y ver el resultado en **SCT-Chile** antes
de implementar el programa en un LMS.

Resuelve una pregunta concreta: *¿cómo queda la carga semanal del
estudiante cuando se superponen todas las AC que tiene en curso?*

Es el **Momento 1** del flujo `/virtualizacion` (horas y créditos); no
reemplaza el PAC ni el PIAC, que vienen después.

---

## 2. Cómo funciona — flujo del usuario

### 2.1 Wizard de creación de programa (4 pasos)

1. **Perfil** — pregrado / postgrado / educación continua. Define defaults
   de duración, gradiente, modalidad y umbrales de alerta.
2. **Datos básicos** — nombre, código, duración en semestres o semanas.
3. **Carga semanal de referencia** — valor nominal de horas/semana que
   servirá como orientación de diseño (no genera alertas).
4. **Revisión** — resumen antes de confirmar.

### 2.2 Vista de programa (overview)

Tres componentes en pantalla:

- **Gantt de AC** — barras horizontales, una por AC, a lo largo de las
  semanas del programa. Cada barra muestra h/sem y SCT calculado. Junto
  al nombre se muestra el desglose **HS / HAs / HAut** (sincrónicas /
  asincrónicas / autónomas) por semana.
- **Gráfico de carga semanal** — barras apiladas: total en gris como
  referencia, carga sincrónica en color (verde / amarillo / rojo) sobre
  el umbral sincrónico del perfil. Línea roja punteada marca el tope.
- **Panel de alertas** — lista las semanas en exceso o acercándose al
  tope sincrónico.

### 2.3 Drawer de edición de AC

Se abre al hacer click en una barra o en "+ Nueva AC":

- **Metadatos** — nombre, formato (semestral / modular / CUECH / mixto),
  semana de inicio, duración.
- **Composición por tipo de Laurillard** — 6 sliders (adquisición,
  indagación, práctica, producción, discusión, colaboración) en h/sem.
- **Modalidad temporal** — 3 inputs % (sync + async + auto = 100).
- **Lectura viva** — SCT emergente, carga simulada en las semanas que
  ocupa, clasificación (verde / amarilla / roja por tope sincrónico),
  recomendación contextual por fase del programa.
- **Aplicar recomendación** — autocompleta los sliders con el gradiente
  sugerido según fase × perfil.

### 2.4 Interacciones vivas

- Arrastrar una barra en el Gantt **recalcula alertas y gráfico en vivo**.
- Redimensionar (handle derecho) ajusta la duración.
- Editar sliders en el drawer recalcula SCT, horas totales y clasificación.
- Cambiar % de modalidad redistribuye HS/HAs/HAut sin tocar el total.

---

## 3. Fórmula y métricas

### 3.1 SCT por AC

```
horas_totales = (suma de 6 tipos Laurillard en h/sem) × duración en semanas
SCT = ⌈horas_totales / 27⌉
```

El divisor 27 viene de CRUCH (1 SCT = 27 horas cronológicas reales).

### 3.2 Carga semanal total (referencia)

```
carga_total(semana w) = Σ h/sem de todas las AC activas en w
```

Se compara visualmente contra la carga de referencia del perfil
(13 / 11 / 8 h/sem según pregrado / postgrado / edu continua).

### 3.3 Carga sincrónica semanal (alerta)

```
carga_sync(semana w) = Σ (h/sem × % modalidad sync) de AC activas en w
```

Se compara contra dos umbrales:

- **Amarillo** (acercándose al tope): 9 / 8 / 6 h/sem
- **Rojo** (exceso): 13 / 11 / 8 h/sem

---

## 4. Sustento — qué está respaldado y qué es decisión de diseño

### 4.1 Sustentado por normativa o literatura

| Elemento | Fuente |
|---|---|
| Fórmula `SCT = ⌈horas_totales / 27⌉` | CRUCH, *Manual para la implementación del SCT-Chile* (2013). 1 crédito = 27 horas reales de trabajo del estudiante. |
| Adopción del SCT en UMCE | UMCE Resolución Exenta N° 002140 (2011). |
| Modularización de programas | UMCE Resoluciones Exentas N° 100062 y N° 100241 (2019). |
| Formato CUECH (2 SCT, 16 semanas, 54 horas) | Consorcio de Universidades del Estado de Chile, estándar oficial. |
| 6 tipos de actividad (adquisición, indagación, práctica, producción, discusión, colaboración) | Laurillard, D. (2012). *Teaching as a Design Science*. Routledge. Marco adoptado como taxonomía pedagógica. |
| Distinción sincrónica / asincrónica / autónoma como dimensiones ortogonales a los 6 tipos | Martin, Polly & Ritzhaupt (2020). *Bichronous Online Learning*. EDUCAUSE Review. |
| Alertar por exceso sincrónico antes que por carga total | Martin et al. (2020) y literatura sobre fatiga en aprendizaje sincrónico; heurística confirmada con práctica chilena (la carga total CRUCH nominal frecuentemente se supera sin problema si la fracción sincrónica se mantiene acotada). |
| Fases del programa (arranque / construcción / consolidación / cierre) y gradientes por fase | Salmon, G. (2013). *E-tivities: The Key to Active Online Learning* (2ª ed). Andamiaje progresivo. |
| Autonomía creciente en postgrado vs andamiaje fuerte en pregrado | Knowles, *Andragogy in Action* (1984); Hase & Kenyon, *From Andragogy to Heutagogy* (2000). |

### 4.2 Decisiones de diseño sin respaldo documental directo

Estas son **convenciones operativas** elegidas por UDFV para que la
herramienta tenga valores por defecto utilizables. **No están en CRUCH
ni en la normativa UMCE**; pueden (y probablemente deben) calibrarse con
UGCI antes de adoptarlas como estándar institucional.

| Decisión | Valor actual | Justificación (débil) |
|---|---|---|
| Carga semanal nominal pregrado | 13 h/sem | Coherente con 45 h/sem de dedicación académica total × ~30% virtualizable, pero no está en ninguna resolución UMCE. |
| Carga semanal nominal postgrado | 11 h/sem | Valor CRUCH nominal referido para régimen estándar; tomado del Manual 2013 como referencia conceptual, no como prescripción semanal. |
| Carga semanal nominal educación continua | 8 h/sem | Convención propia; refleja programas cortos de dedicación parcial. |
| Umbral amarillo sincrónico | 9 / 8 / 6 h/sem | Aproximadamente 70% del tope rojo. Heurística. |
| Umbral rojo sincrónico | 13 / 11 / 8 h/sem | Copia del valor nominal total. **Aquí hay una asunción fuerte**: que la suma de sesiones sincrónicas paralelas no debería superar el nominal total. No está validado con datos de bienestar estudiantil. |
| Modalidad default por perfil | pregrado 30/30/40 · postgrado 20/30/50 · edu continua 20/40/40 | Estimación basada en práctica UDFV; no hay estudio que lo sustente. |
| Gradiente por fase × tipo (matriz 4×6) | ver `GRADIENT` en el código | Proporciones diseñadas a ojo buscando coherencia narrativa; cada columna suma el total nominal, pero los valores individuales no vienen de ningún estudio. |
| Fases como porcentaje del programa (0-20% arranque, 20-50% construcción, 50-80% consolidación, 80-100% cierre) | fijo | Convención propia; discutible por programa. |
| Umbral "24h" para el alerta de solapamiento | — | **No implementado**; mockups 4 y 5 lo mencionan con un default de 4 semanas de ventana móvil, pero la calculadora actual evalúa semana a semana. |

### 4.3 Claramente declarado como "modelo teórico propio"

- Las **bandas interpretativas** por tipo × perfil × nivel (ensayo / paper
  / tesis, etc.) son **etiquetas narrativas** que ayudan al coordinador a
  entender qué "producto sostenido" genera un rango de horas. No son
  requisitos institucionales.
- La idea de **alertar sobre carga sincrónica y no sobre carga total** es
  una decisión de diseño del equipo UDFV, fundamentada en literatura de
  aprendizaje bichrónico pero **no respaldada por una política UMCE
  explícita**. Si Mesa 1 o UGCI no la valida, habría que cambiarla.

---

## 5. Qué falta

### 5.1 Sustentación pendiente

- [ ] **Validar los 13/11/8 h/sem nominales con UGCI**. Hoy están en el
      código sin respaldo institucional; si UMCE quiere otros valores,
      se cambian en un archivo de configuración.
- [ ] **Calibrar los umbrales sincrónicos** con un estudio o criterio
      UDFV explícito. Actualmente coinciden con el nominal total por
      decisión conservadora, no por evidencia.
- [ ] **Justificar los % de modalidad default** o dejarlos en blanco y
      que cada coordinador los elija sin sugerencia inicial.
- [ ] **Documentar el gradiente recomendado** con referencia bibliográfica
      celda por celda (hoy es una matriz diseñada a ojo).

### 5.2 Funcionalidad pendiente

- [ ] **Configuración institucional** (mockup 5): panel UGCI para editar
      defaults globales (perfiles, bandas, plantillas, CUECH, bitácora
      auditable). No implementado; la config vive hoy en el código fuente.
- [ ] **Configuración por programa** (mockup 4): permitir override local
      de umbrales, excepciones de semanas (inducción, receso, evaluación),
      plantillas narrativas específicas. Parcialmente implementado
      (solo duración y carga de referencia se pueden sobrescribir).
- [ ] **Bitácora de cambios auditables**.
- [ ] **Exportar / importar** configuración de programa (JSON).
- [ ] **Persistencia en servidor** (hoy usa localStorage; los datos se
      pierden si el usuario cambia de dispositivo o limpia el navegador).
- [ ] **Integración con PIAC / PAC** — esta calculadora resuelve solo el
      Momento 1; los siguientes momentos del ciclo están pendientes.
- [ ] **Validación con datos reales**: correr la herramienta sobre un
      programa existente (ej: MEMAT Intercultural) y contrastar con la
      resolución oficial.

### 5.3 Limitaciones conocidas

- La **ventana móvil** (promedio de carga en ventana de 4 semanas) no
  existe; las alertas son por semana individual. Esto puede generar
  falsos positivos si una semana pico es compensada por semanas bajas.
- **No distingue estudiantes** — asume que todos los inscritos llevan la
  carga completa. Un estudiante rezagado con menos AC activas verá una
  carga real menor que la mostrada.
- **No considera evaluaciones asíncronas de alto costo** (lectura extensa,
  examen final) como eventos específicos; todo entra en el total semanal.
- **No hay migración de datos** entre versiones (`STORAGE_KEY = umce_sct_v2`);
  si se cambia el modelo, los programas guardados localmente no se
  convierten automáticamente.

---

## 6. Qué está listo para mostrar

- Fórmula SCT funcionando y validable contra resoluciones reales
  (ej: MEMAT 5–8 SCT por asignatura coincide con el cálculo actual).
- Gantt interactivo con drag & resize, preview en vivo.
- Alertas sincrónicas por semana con clasificación verde/amarillo/rojo.
- Modalidad temporal por AC (HS/HAs/HAut) visible tanto en el Gantt
  como en el drawer.
- CUECH como formato nativo con valores bloqueados correctamente.
- Fundamento teórico accesible desde la misma herramienta (sección
  colapsable "Mostrar" al final de la página).

---

## 7. Qué **no** conviene presentar como producto terminado

- Los umbrales numéricos (13/11/8, 9/8/6) — decir explícitamente que
  **son provisionales** y requieren validación UGCI.
- Las plantillas narrativas de recomendación por fase — son propuestas
  de UDFV, no posición institucional.
- Las bandas interpretativas (ensayo / paper / tesis) — son ayudas
  visuales, no criterios oficiales de evaluación.
- La matriz de gradiente completa — es un punto de partida, no una
  prescripción.

---

## 8. Referencias

- CRUCH (2003). *Declaración de Valparaíso*.
- CRUCH (2013). *Manual para la implementación del SCT-Chile*.
- Hase, S. & Kenyon, C. (2000). *From Andragogy to Heutagogy*. ultiBASE.
- Knowles, M. (1984). *Andragogy in Action*. Jossey-Bass.
- Laurillard, D. (2012). *Teaching as a Design Science*. Routledge.
- Martin, F., Polly, D. & Ritzhaupt, A. (2020). *Bichronous Online
  Learning: Blending Asynchronous and Synchronous Online Learning*.
  EDUCAUSE Review.
- Nieuwoudt, J. (2020). *Investigating synchronous and asynchronous
  class attendance as predictors of academic success*. AJET.
- Rice, M. & Artus, J. (2016). *Time Estimation for Online Course
  Assignments*.
- Salmon, G. (2013). *E-tivities: The Key to Active Online Learning*
  (2ª ed). Routledge.
- UMCE (2011). Resolución Exenta N° 002140 — Adopción del SCT.
- UMCE (2019). Resoluciones Exentas N° 100062 y N° 100241 —
  Modularización.

---

**Cómo leer este documento**: las secciones 2 y 3 describen lo que la
herramienta hace hoy. La sección 4 es el chequeo de honestidad: qué se
puede defender y qué es convención. La sección 5 es la lista de trabajo
pendiente antes de que esto deje de ser una demo y se vuelva herramienta
institucional.
