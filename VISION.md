# UMCE.online — Vision Estrategica

**Fecha**: 01-Abr-2026
**Autor**: David Reyes (UDFV)
**Contexto**: Sesion de reconceptualizacion del proyecto

---

## Tesis

UMCE.online es la vitrina digital de la UMCE y la demostracion tangible de las capacidades del equipo UDFV. Todo lo que la UDFV desarrolla converge aqui. Es la puerta de entrada a la UMCE en la web.

Hoy existen capacidades tecnicas demostradas (prototipos, schemas, pruebas de concepto), pero ninguna esta terminada ni presentable como producto. El objetivo es armar algo coherente y mostrable.

---

## Estrategia de avance (01-Abr-2026)

**Primer hit**: Curso de autoformacion Sustentabilidad ("Avanzando hacia un nuevo paradigma de transformacion cultural en sustentabilidad en Universidades del Estado"). Es inter-institucional, visible para otras universidades, genera precedente. Patron: induccion2026.udfv.cloud evolucionado.

**Secuencia**:
1. Abril: Sustentabilidad → primer curso terminado
2. Mayo: Modelo Educativo UDA → segundo curso
3. Mayo: VcM → tercer curso
4. En paralelo: invitar Pablo Rojas + David Reyes (Ciencias) a ver dashboard, definir colaboracion analytics
5. Junio: UMCE.online tiene 3 cursos vivos + analytics en desarrollo = vitrina real

**Principio**: si necesitas explicar por que es impresionante, no es impresionante todavia. El curso debe ser experienciable de punta a punta sin que David este al lado.

---

## 7 Pilares

### Pilar 1: Virtualizacion Academica

Sistema que permite crear programas de AC adecuados siguiendo estandares internacionales. Nace de las Mesas de Virtualizacion.

**Componentes:**
- **Orientaciones y fundamentos**: pagina publica que explica como funciona y por que. Base institucional, estandares, proceso
- **Proceso ADDIE**: especialmente la fase de Analisis — determinar creditos SCT apropiados, calidad de ensenanza, requisitos
- **Modulo de autoformacion**: curso para que docentes aprendan a usar el sistema
- **Sistema de creacion de programas**: herramienta robusta para armar programas completos
- **Fase de Diseno Instruccional**: definicion de recursos/actividades a partir del analisis. Automatizacion de estandares de calidad para cursos (tipos de foros, videos, tareas, etc.)

**Lo que existe:** Calculadora SCT en `/sct`, PIAC reader + matching engine, investigacion Fase 0 de sistema-autoria-cursos. Mesas de Virtualizacion activas (4 productos comprometidos mayo 2026).

### Pilar 2: Curso Virtual — Capa de Presentacion

Moodle pasa a ser backend. UMCE.online es la experiencia del estudiante y del docente.

**Componentes:**
- Pagina de presentacion atractiva del curso
- Llama al curso virtual montado en Moodle
- Se potencia con capacidades de diseno, xAPI, RLS, objetos de aprendizaje
- Metricas sobre ensenanza, aprendizaje, autonomia, dedicacion, comunicacion
- Evaluacion de calidad de los entornos virtuales de aprendizaje

**Lo que existe:** `/curso-virtual/:id` funcional pero sin impacto visual suficiente. Cuando se muestra, no genera impacto. Necesita un salto de diseno significativo.

**Referente de lo que queremos:** que el curso virtual demuestre que lo que hacemos en Moodle se potencia con esta capa.

### Pilar 3: Learning Analytics

Demostrar que la UMCE esta desarrollando capacidades propias en analitica del aprendizaje.

**Componentes:**
- Dashboard docente (metricas por curso)
- Motor analitico: procesamiento logs Moodle → indicadores (intensidad, regularidad, procrastinacion, visibilidad)
- Marco teorico 3 niveles: descriptivo → analitico → interpretativo-critico (doc Rojas-Reyes)
- Relacion con FONDEF/EOL: UMCE no espera que otros resuelvan esto, lo esta construyendo

**Lo que existe:** dashboard.udfv.cloud v4.1.1 operativo. Documento "Propuesta de extraccion de datos y analisis" de Pablo Rojas y David Reyes (Ciencias) — marco metodologico solido con discretizacion temporal 10min, metricas activas/pasivas, indicadores avanzados. Validacion tecnica (85% readiness en evirtual, curso 338). Relacion con FONDEF ID25I10459 ($237M).

**Personas interesadas:** Pablo Rojas (Ciencias), David Reyes (Ciencias) — quieren trabajar esta linea.

### Pilar 4: Cursos de Autoformacion

Cursos al estilo induccion2026.udfv.cloud — landing de inscripcion + formulario + curso optimizado.

**3 cursos urgentes (en carpeta):**

1. **Sustentabilidad**: "Avanzando hacia un nuevo paradigma de transformacion cultural en sustentabilidad en Universidades del Estado"
   - Contexto en Notion: https://www.notion.so/Sustentabilidad-32507785527980b6884ae52ae79d3b4f
   - Version mejorada y de autoformacion, con pagina de inscripcion

2. **Modelo Educativo**: "Programa de Induccion al Modelo Educativo UMCE v 2026" (UDA)

3. **Vinculacion con el Medio**: "Vinculacion con el Medio: Fundamentos para una Universidad Publica Transformadora" (VcM)

**Patron para cada curso:** Pagina de llegada que invite a inscribirse → Formulario de inscripcion → Curso interno optimizado al estilo induccion2026.

**Lo que existe:** induccion2026.udfv.cloud como ejemplo funcional. Sistema de autoria en Fase 0. Plantillas xAPI.

### Pilar 5: Modularizacion y Rutas Formativas

Panel dedicado a programas de postgrado y educacion continua. Permite generar rutas formativas con salidas intermedias.

**Componentes:**
- Panel de programas de postgrado y EC
- Rutas formativas posibles de optar
- Salidas intermedias
- Insignias que certifiquen conocimientos (Open Badges, compartibles)
- Investigacion sobre como lo hacen otras universidades

**Principio:** Open source, Open Badges. La UMCE mantiene el espiritu por uso de recursos libres. Agencias como Acreditta solo se aprovechan — no es negocio conveniente.

**Lo que existe:** Schema OB 3.0 + Ed25519 listos (sin deploy). Schema microcredenciales (sin datos reales). Necesita investigacion de benchmarking.

### Pilar 6: Aseguramiento de Calidad Academica

Panel en umce.online para tracking y certificacion de calidad docente.

**Componentes:**
- SDPA docente (tracking formacion academica)
- Marco Competencias TIC (3 dominios x 12 ambitos x 3 niveles)
- Ruta Formativa institucional
- Evaluacion de calidad de EVA (liga con Pilar 3)

**Lo que existe:** SDPA deployado (175 docentes, 255 actividades). Marco TIC en SQL. Ruta en `/formacion-docente/plan`. Reunion UDFV-UDA 12-mar como base.

**Contexto institucional:** https://www.notion.so/2026-03-12-Reuni-n-UDFV-UDA-321077855279805b9fe6f1ff42d5880f

### Pilar 7: App UMCE Online

Evolucion natural del proyecto cuando los pilares 1-6 esten maduros. La idea es tener todo esto como aplicacion movil.

---

## Proyectos relacionados que alimentan esta vision

| Proyecto | Que aporta | Estado |
|----------|-----------|--------|
| Mesas de Virtualizacion | Gobernanza institucional, 4 productos mayo 2026 | Activo |
| Sistema de Autoria de Cursos | Contenido interactivo HTML/JS, SCORM/xAPI | Fase 0 |
| Calculadora SCT / Virtualizacion | Herramienta de planificacion curricular | Funcional, pendiente rewrite fundamentos |
| Induccion 2026 | Primer caso real SCORM custom, patron de cursos | En desarrollo |
| Dashboard docente | Learning analytics operativo | v4.1.1 en produccion |
| FONDEF/EOL | ML + analytics, UMCE como sujeto de investigacion | Activo externamente |
| ZoomHostAgent | Grabaciones automaticas | v3 completo |
| Acompana UMCE | Datos acompanamiento estudiantil | Fase 6 pendiente |

---

## Principios

1. **UMCE.online es la vitrina** — todo converge aqui
2. **Moodle es backend** — la experiencia es en umce.online
3. **IA observa, no crea** — relaciona, presenta, alerta
4. **Open source primero** — Open Badges, sin vendors propietarios
5. **Nada esta terminado** — hay capacidades, no productos
6. **Stack Express + vanilla JS** — consistente, sin frameworks pesados
