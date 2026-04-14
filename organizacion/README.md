# Organización — Calculadora SCT y pantalla Virtualización

Esta carpeta captura en limpio el pensamiento de diseño de la pantalla
`/virtualizacion` y la Calculadora SCT, **sin mezclar** con los documentos
previos en `docs/` que quedaron desalineados tras varias iteraciones.

## Flujo completo de la pantalla `/virtualizacion`

Son 5 momentos secuenciales:

1. **Definir horas y créditos** — análisis abstracto de carga estudiantil y SCT
2. **Diseñar el PAC** — Plan de Acción Curricular
3. **Diseñar el PIAC** — Plan de Implementación de Actividades Curriculares
4. **Implementar en LMS** — Moodle
5. **Monitorear y retroalimentar** — evaluación post-implementación

## Documentos

- [momento-1-horas-y-creditos.md](momento-1-horas-y-creditos.md) — propósito, ejes, parámetros y pendientes del M1
- [calculadora-sct-presentacion.md](calculadora-sct-presentacion.md) — presentación de la herramienta: qué hace, qué está sustentado, qué falta

## Reglas

- **Esta carpeta es el punto de verdad** del diseño conceptual.
- **No mezclar** con `docs/` (histórico desalineado, se mantiene como archivo).
- Cambios conceptuales se discuten aquí primero; el código en `src/` se actualiza después.
- Sin leer fuentes externas que puedan distorsionar la reflexión (ej: Guía V1 UMCE)
  hasta que el marco conceptual propio esté claro.
