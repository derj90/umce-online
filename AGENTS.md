# Instrucciones para agentes IA (Antigravity, Cursor, Claude Code, etc.)

Este repo soporta **7 pilares UDFV simultáneos**, varios en **producción con usuarios reales**. Modificar archivos fuera del scope del trabajo actual puede romper trabajo terminado.

## Antes de escribir una sola línea, leer en orden

1. **`CLAUDE.md`** — reglas irrompibles del repo (stack, auth, DB, Moodle, scopes por sub-proyecto)
2. **Scope del sub-proyecto en el que estás trabajando**. Identificar primero en qué estás:
   - **Plan Formativo VcM** → `VCM-WORK-SCOPE.md` (lista blanca/negra de archivos, endpoints permitidos, reglas arquitectónicas). OBLIGATORIO.
   - Otros pilares: ver sección "Scopes por sub-proyecto" en `CLAUDE.md`.
3. **`SPEC.md`** — solo si tu tarea está listada como fase ahí.

## Estado vivo del proyecto (fuera del repo)

- Documentación canónica VcM: `~/udfv-hub/projects/plan-formativo-vcm/ESTADO.md`
- Documentación canónica UMCE.online general: `~/udfv-hub/projects/umce-online/` (si existe) o `VISION.md` del repo
- Design System UDFV: `~/Documents/37_DESIGN/knowledge/` (referencia de solo lectura)
- CEREBRO estratégico: `~/Documents/00_CEREBRO/ESTADO-ACTUAL.md`

## Workspaces adicionales (abrir como multi-root o en paralelo)

Antigravity / IDE debe tener visibilidad sobre estos paths para no trabajar a ciegas:

1. **`~/Documents/umce-online/`** — workspace principal (código)
2. **`~/Documents/37_DESIGN/knowledge/`** — Design System UDFV obligatorio para cualquier cambio visual (SOLO LECTURA, no modificar desde este repo)
3. **`~/udfv-hub/projects/plan-formativo-vcm/`** — documentación viva del proyecto VcM (solo lectura desde el IDE; se edita desde Claude Code fuera del IDE)

Si el IDE no soporta multi-root, al menos mantener abiertos los docs obligatorios de 37_DESIGN para consulta (listados en `VCM-WORK-SCOPE.md`).

## Reglas universales (extracto — el completo está en CLAUDE.md)

- NO cambiar stack (Express + vanilla JS + Tailwind CDN). NO introducir Next.js, React, TypeScript.
- NO reinventar auth — Google OAuth @umce.cl + HMAC sesión ya existe.
- NO crear schema DB nuevo — extender `portal` en Supabase self-hosted.
- NUNCA modificar cursos Moodle reales sin confirmación explícita de David.
- Proponer antes de ejecutar cuando el cambio toca ≥3 archivos o archivos compartidos.

## Si encuentras ambigüedad

Preguntar a David ANTES de asumir. Es un repo multi-pilar — una suposición incorrecta puede romper producción de otro pilar.
