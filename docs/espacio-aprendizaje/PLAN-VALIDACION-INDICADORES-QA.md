# Plan: Validacion de Indicadores QA — Fundamentacion y Proceso

*Creado: 16-Abr-2026 — Sesion 63*
*Contexto: Post-reunion Marisol Hernandez (DIPOS, 14-abr-2026)*

## Estado al cerrar esta sesion

### Lo que ya se hizo hoy (sesion 63, commit 113088c)

1. **QA de 3 a 5 fases** — HTML, docs, server.js actualizados y en produccion
   - Preventivo, Recepcion docente, Implementacion, Seguimiento, QA Posterior
   - Grid 5 tarjetas responsive en virtualizacion-qa.html
   - FAQ reescrito con argumento ADDIE+SNA+CNA
   - Schemas SQL conceptuales para qa_recepcion y qa_posterior
   - Coherencia verificada: grep "QA de Operacion" = 0 en todo el repo

2. **Planificador: certeza instruccional** (check #7)
   - Chips de semana para evaluaciones sumativas (EV4/EV5/EV6)
   - Barras semanales con banderin ambar
   - Fundamentacion en Paso 4

3. **Pauta grupo focal** — docs/instrumentos/pauta-grupo-focal-carga-online.md
   - 6 ejes, 2 grupos, protocolo analisis tematico

4. **Insumo indicadores cruzado** — docs/espacio-aprendizaje/insumo-indicadores-cruzado.md
   - OSCQR 50 estandares extraidos del PDF (6 categorias, RSI marcado)
   - OLC 2025 50 objetivos extraidos del PDF en espanol (3 secciones: Esencial, Avanzado, Entrega)
   - Quality Matters 42 estandares extraidos del PDF (8 categorias, 22 esenciales marcados)
   - Sepulveda 77 indicadores del JSON (6 dimensiones, 19 subdimensiones)
   - Tabla resumen comparativa 4 fuentes

### Lo que falta hacer (plan aprobado por David)

**El backend QA NO EXISTE.** 0 endpoints, 0 tablas SQL. Antes de implementar:

#### Entregable 1: Documento de contexto — COMPLETADO
**Archivo:** `docs/espacio-aprendizaje/contexto-marcos-calidad.md`

Explica a Mesa 1 (no tecnico):
- Que es OSCQR, por que se eligio (open source, CC BY 4.0)
- Que es OLC 2025, por que se incorporo (reemplaza OSCQR como instrumento oficial OLC, agrega entrega docente)
- Que es Quality Matters, por que es referencia pero no se adopto (propietario)
- Que es el Marco Evaluativo Sepulveda, como se construyo, pilotaje 2024
- Sello distintivo UMCE: D5 genero, D6 corresponsabilidad, D3.4 sesion sincrona (desde politicas institucionales)
- Como prioriza cada marco (RSI vs Esencial/Avanzado vs 3pts vs alta/media/baja)
- Por que cruzar cuatro marcos: trazabilidad internacional + pertinencia local

#### Entregable 2: Cruce tematico y propuesta consolidada — COMPLETADO
**Archivo:** `docs/espacio-aprendizaje/indicadores-cruce-tematico.xlsx`

4 hojas:
- Cruce Tematico: 219 indicadores de 4 fuentes en 18 temas, todos en espanol
- Propuesta Consolidada: 71 indicadores candidatos (QA-01 a QA-71) con fuentes trazables
- Resumen por Tema: consenso X/4 fuentes por tema
- Leyenda: codigos, colores, criterios

#### Entregable 3: Instrumento de validacion
**Archivo por crear:** `docs/instrumentos/instrumento-validacion-indicadores-qa.md`

Formulario para que Mesa 1 evalue cada indicador:
- Likert 1-5: pertinencia para cursos virtuales UMCE
- Likert 1-5: claridad de la formulacion
- Campo abierto: sugerencia de modificacion
- Datos del evaluador (nombre, rol, programa)

Despues de firme el .md, decidir si se implementa como pagina en umce.online (auth Google @umce.cl) o como Google Forms.

### Secuencia

1. ~~Contexto (.md)~~ HECHO → 2. ~~Cruce tematico (.xlsx)~~ HECHO → 3. Instrumento (.md) → 4. Formulario (web o forms) → 5. Circulacion Mesa 1 → 6. Analisis resultados → 7. Set definitivo → 8. Especificacion tecnica fases QA → 9. Schema SQL → 10. Implementacion endpoints

### Decisiones ya tomadas

- Formulario recepcion docente: dentro de umce.online con auth Google @umce.cl
- Segunda firma: DI marca resuelto, curso abre (sin segunda confirmacion docente)
- Checks de recepcion: PENDIENTE — depende del set definitivo de indicadores

### Problemas tecnicos detectados en el doc actual (04-qa-ciclo-retroalimentacion.md)

- Tipos UUID en schemas de Recepcion y Posterior (debe ser INT, coherente con piac_links SERIAL)
- Conteo de endpoints inconsistente (8 vs 11 vs 15)
- Funcion getRetroalimentacion() no lee qa_posterior
- Vista qa_curso_resumen no incluye fases 2 y 5
- Linea 1 del doc es artefacto ("Tengo suficiente contexto...")

### Triada IA configurada

| IA | Rol | Tarea en este proyecto |
|---|---|---|
| Claude Code (Opus 4.6) | Estratega | Analisis cruzado, redaccion documentos, implementacion codigo |
| Kilo Code (v7.2.10) | Operador | Extraccion PDFs (hecho), busqueda referencias, verificacion deploy |
| Gemini | Copiloto | Tab completion durante edicion |

Doc triada: ~/Documents/00_CEREBRO/operaciones/triada-ia-antigravity.md
