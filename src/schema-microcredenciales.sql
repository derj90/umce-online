-- =============================================================================
-- Microcredenciales — Credenciales apilables por modulos completados
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- Created: 2026-03-26
-- Descripcion: Tablas para el sistema de microcredenciales (Nivel 3 del esquema
--   de credenciales apilables). Una microcredencial se otorga automaticamente
--   cuando el estudiante acumula el conjunto definido de modulos (badges nivel 2).
--   Referencia: CURSO-VIRTUAL-SPEC.md lineas 1072-1210
-- =============================================================================

-- ---------------------------------------------------------------------------
-- MICROCREDENCIAL_DEFINITIONS — catalogo de microcredenciales disponibles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.microcredencial_definitions (
    id                  SERIAL PRIMARY KEY,
    slug                TEXT NOT NULL UNIQUE,        -- 'diplomado_educ_intercultural', 'cert_ia_nivel_1'
    nombre              TEXT NOT NULL,               -- "Diplomado en Educacion Intercultural"
    descripcion         TEXT NOT NULL,
    tipo                TEXT NOT NULL CHECK (tipo IN ('diplomado', 'postitulo', 'certificacion', 'itinerario')),
    programa_origen     TEXT,                        -- programa de postgrado de origen: 'MEIGLIP', 'MGEPES', etc.
    total_sct           INTEGER,                     -- creditos SCT totales de la microcredencial
    total_horas         INTEGER,                     -- horas cronologicas totales
    icono               TEXT NOT NULL,               -- icono Lucide (ej: 'award', 'book-open', 'graduation-cap')
    color               TEXT DEFAULT '#2563eb',
    activo              BOOLEAN DEFAULT true,
    -- Reglas para electivos: {"minimo_electivos": 2} = completar al menos 2 requisitos con obligatorio=false
    reglas_electivos    JSONB DEFAULT '{"minimo_electivos": 0}',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- MICROCREDENCIAL_REQUISITOS — composicion de cada microcredencial
-- Relaciona que badges de nivel 2 (modulo/sdpa) componen cada microcredencial
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.microcredencial_requisitos (
    id                      SERIAL PRIMARY KEY,
    microcredencial_id      INTEGER NOT NULL REFERENCES portal.microcredencial_definitions(id) ON DELETE CASCADE,
    badge_definition_id     INTEGER NOT NULL REFERENCES portal.badge_definitions(id),
    -- El badge debe ser de categoria 'modulo' (nivel 2 del esquema de credenciales)
    obligatorio             BOOLEAN DEFAULT true,    -- true = obligatorio, false = electivo
    orden                   INTEGER DEFAULT 0,       -- orden sugerido de completacion
    UNIQUE(microcredencial_id, badge_definition_id)
);

-- ---------------------------------------------------------------------------
-- USER_MICROCREDENCIALES — microcredenciales otorgadas a estudiantes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.user_microcredenciales (
    id                      SERIAL PRIMARY KEY,
    user_email              TEXT NOT NULL,
    microcredencial_id      INTEGER NOT NULL REFERENCES portal.microcredencial_definitions(id),
    granted_at              TIMESTAMPTZ DEFAULT now(),
    granted_by              TEXT DEFAULT 'system',   -- 'system' si automatico, email admin si manual
    verificacion_hash       TEXT NOT NULL,           -- hash unico para verificacion publica en umce.online/badge/{hash}
    -- Snapshot de los modulos que la componen al momento del otorgamiento
    modulos_completados     JSONB NOT NULL,          -- [{badge_id, badge_slug, granted_at, calificacion}]
    total_sct_acumulados    INTEGER,
    total_horas_acumuladas  INTEGER,
    nota                    TEXT,                    -- nota o comentario del otorgamiento (opcional)
    -- Open Badges 3.0 / W3C Verifiable Credential
    credential_json         JSONB,                   -- VC firmado con Ed25519
    credential_image_url    TEXT,                     -- SVG/PNG con JSON-LD embebido (baked badge)
    UNIQUE(user_email, microcredencial_id)
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_umc_user ON portal.user_microcredenciales (user_email);
CREATE INDEX IF NOT EXISTS idx_umc_hash ON portal.user_microcredenciales (verificacion_hash);
CREATE INDEX IF NOT EXISTS idx_umc_microcredencial ON portal.user_microcredenciales (microcredencial_id);
CREATE INDEX IF NOT EXISTS idx_mcdef_activo ON portal.microcredencial_definitions (activo);
CREATE INDEX IF NOT EXISTS idx_mcdef_programa ON portal.microcredencial_definitions (programa_origen);
CREATE INDEX IF NOT EXISTS idx_mcrq_microcredencial ON portal.microcredencial_requisitos (microcredencial_id);
CREATE INDEX IF NOT EXISTS idx_mcrq_badge ON portal.microcredencial_requisitos (badge_definition_id);

-- ---------------------------------------------------------------------------
-- VISTA: progreso del estudiante hacia cada microcredencial disponible
-- Muestra cuantos modulos lleva completados y si es elegible para el otorgamiento
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW portal.v_progreso_microcredenciales AS
SELECT
    ub.user_email,
    md.id AS microcredencial_id,
    md.slug,
    md.nombre,
    md.tipo,
    md.programa_origen,
    COUNT(mr.id) AS total_requisitos,
    COUNT(mr.id) FILTER (WHERE mr.obligatorio) AS requisitos_obligatorios,
    COUNT(ub2.id) AS modulos_completados,
    COUNT(ub2.id) FILTER (WHERE mr.obligatorio) AS obligatorios_completados,
    ROUND(100.0 * COUNT(ub2.id) / NULLIF(COUNT(mr.id), 0), 1) AS pct_avance,
    -- Verificar si cumple todos los obligatorios + minimo electivos requeridos
    CASE
        WHEN COUNT(ub2.id) FILTER (WHERE mr.obligatorio) = COUNT(mr.id) FILTER (WHERE mr.obligatorio)
             AND COUNT(ub2.id) FILTER (WHERE NOT mr.obligatorio) >= COALESCE((md.reglas_electivos->>'minimo_electivos')::int, 0)
        THEN true
        ELSE false
    END AS elegible_para_otorgamiento
FROM (SELECT DISTINCT user_email FROM portal.user_badges) ub
CROSS JOIN portal.microcredencial_definitions md
JOIN portal.microcredencial_requisitos mr ON mr.microcredencial_id = md.id
LEFT JOIN portal.user_badges ub2
    ON ub2.user_email = ub.user_email
    AND ub2.badge_definition_id = mr.badge_definition_id
WHERE md.activo = true
GROUP BY ub.user_email, md.id, md.slug, md.nombre, md.tipo, md.programa_origen, md.reglas_electivos;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE portal.microcredencial_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read microcredencial_definitions" ON portal.microcredencial_definitions FOR SELECT USING (true);
CREATE POLICY "Service write microcredencial_definitions" ON portal.microcredencial_definitions FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.microcredencial_requisitos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read microcredencial_requisitos" ON portal.microcredencial_requisitos FOR SELECT USING (true);
CREATE POLICY "Service write microcredencial_requisitos" ON portal.microcredencial_requisitos FOR ALL USING (current_setting('role') = 'service_role');

ALTER TABLE portal.user_microcredenciales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read user_microcredenciales" ON portal.user_microcredenciales FOR SELECT USING (true);
CREATE POLICY "Service write user_microcredenciales" ON portal.user_microcredenciales FOR ALL USING (current_setting('role') = 'service_role');

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
GRANT SELECT ON portal.microcredencial_definitions TO anon, authenticated;
GRANT ALL ON portal.microcredencial_definitions TO service_role;
GRANT ALL ON portal.microcredencial_definitions_id_seq TO service_role;

GRANT SELECT ON portal.microcredencial_requisitos TO anon, authenticated;
GRANT ALL ON portal.microcredencial_requisitos TO service_role;
GRANT ALL ON portal.microcredencial_requisitos_id_seq TO service_role;

GRANT SELECT ON portal.user_microcredenciales TO anon, authenticated;
GRANT ALL ON portal.user_microcredenciales TO service_role;
GRANT ALL ON portal.user_microcredenciales_id_seq TO service_role;

GRANT SELECT ON portal.v_progreso_microcredenciales TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- DATOS SEMILLA — MEIGLIP (Magister en Educacion Intercultural)
-- Ref: CURSO-VIRTUAL-SPEC.md lineas 1175-1190
-- ---------------------------------------------------------------------------

-- Microcredencial: Diplomado en Fundamentos de Educacion Intercultural
-- Se otorga al completar los 4 modulos obligatorios del primer ano del MEIGLIP
INSERT INTO portal.microcredencial_definitions
    (slug, nombre, descripcion, tipo, programa_origen, total_sct, total_horas, icono, color, activo, reglas_electivos)
VALUES (
    'diplomado_fundamentos_educ_intercultural',
    'Diplomado en Fundamentos de Educacion Intercultural',
    'Credencial intermedia del Magister en Educacion Intercultural con Gestion Local de Pueblos Indigenas (MEIGLIP). Se otorga al completar los cuatro modulos fundamentales del primer ano del programa (24 SCT / 648 horas cronologicas).',
    'diplomado',
    'MEIGLIP',
    24,
    648,
    'globe',
    '#0033A1',
    true,
    '{"minimo_electivos": 0}'
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- REQUISITOS MEIGLIP — PENDIENTE
-- Los 4 badges de modulo del MEIGLIP aun no existen en portal.badge_definitions.
-- Los badges de nivel 2 (modulo completado) se crean al configurar cada programa
-- especifico. Cuando esten disponibles, ejecutar el bloque siguiente:
--
-- INSERT INTO portal.microcredencial_requisitos (microcredencial_id, badge_definition_id, obligatorio, orden)
-- SELECT
--     (SELECT id FROM portal.microcredencial_definitions WHERE slug = 'diplomado_fundamentos_educ_intercultural'),
--     bd.id,
--     true,
--     bd.display_order
-- FROM portal.badge_definitions bd
-- WHERE bd.badge_type = 'modulo'
--   AND bd.criteria LIKE '%MEIGLIP%'
--   AND bd.active = true
-- ORDER BY bd.display_order;
--
-- Modulos esperados (semestre 1 y 2 del MEIGLIP):
--   1. Fundamentos de Educacion Intercultural (6 SCT)
--   2. Metodologia de Investigacion I (6 SCT)
--   3. Taller Transdisciplinario I (6 SCT)
--   4. Curriculo e Interculturalidad (6 SCT)
-- ---------------------------------------------------------------------------
