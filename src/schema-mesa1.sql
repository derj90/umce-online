-- =============================================================================
-- Mesa 1 - Instrumento de Validacion QA (Indicadores) — Schema SQL
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- Created:  2026-04-16
-- Descripcion: Instrumento de validacion por pares de los 75 indicadores QA
--   de virtualizacion UMCE. Cada evaluador (docente @umce.cl) valora cada
--   indicador en pertinencia y claridad (escala 1-5), con sugerencias libres.
--   El proceso cierra cuando el evaluador confirma el envio (confirmado_at).
-- IDEMPOTENTE: puede re-ejecutarse sin errores.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PASO 1: TABLAS
-- ---------------------------------------------------------------------------

-- Evaluadores registrados en el proceso Mesa 1
CREATE TABLE IF NOT EXISTS portal.mesa1_evaluadores (
    id                  SERIAL PRIMARY KEY,
    email               TEXT NOT NULL UNIQUE,          -- @umce.cl del evaluador
    nombre              TEXT NOT NULL,                 -- nombre completo
    programa            TEXT NOT NULL,                 -- programa/unidad academica
    programa_otro       TEXT,                          -- si programa = 'otro', especifica cual
    rol                 TEXT NOT NULL,                 -- 'docente', 'di', 'coordinador', 'otro'
    confirmado_at       TIMESTAMPTZ,                   -- NULL = en progreso, fecha = enviado
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE portal.mesa1_evaluadores IS
    'Evaluadores participantes en Mesa 1 de validacion del instrumento QA UMCE 2026.';
COMMENT ON COLUMN portal.mesa1_evaluadores.confirmado_at IS
    'NULL mientras el evaluador esta en progreso. Se setea al confirmar el envio final.';
COMMENT ON COLUMN portal.mesa1_evaluadores.rol IS
    'Rol del evaluador: docente, di (disenador instruccional), coordinador, otro.';

-- Respuestas: una por evaluador por indicador (upsert)
CREATE TABLE IF NOT EXISTS portal.mesa1_respuestas (
    id                  SERIAL PRIMARY KEY,
    evaluador_email     TEXT NOT NULL REFERENCES portal.mesa1_evaluadores(email) ON DELETE CASCADE,
    indicador_id        VARCHAR(10) NOT NULL,          -- "QA-01" a "QA-75"
    pertinencia         SMALLINT CHECK (pertinencia BETWEEN 1 AND 5),
    claridad            SMALLINT CHECK (claridad BETWEEN 1 AND 5),
    sugerencia          TEXT,
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(evaluador_email, indicador_id)
);

COMMENT ON TABLE portal.mesa1_respuestas IS
    'Respuestas individuales por evaluador y por indicador QA. Una fila por par (evaluador, indicador).';
COMMENT ON COLUMN portal.mesa1_respuestas.indicador_id IS
    'Identificador del indicador: "QA-01" a "QA-75". Corresponde a la columna id del instrumento.';
COMMENT ON COLUMN portal.mesa1_respuestas.pertinencia IS
    'Valoracion de pertinencia del indicador: 1 (nada pertinente) a 5 (muy pertinente).';
COMMENT ON COLUMN portal.mesa1_respuestas.claridad IS
    'Valoracion de claridad de la redaccion: 1 (nada claro) a 5 (muy claro).';

-- ---------------------------------------------------------------------------
-- PASO 2: INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_mesa1_resp_email      ON portal.mesa1_respuestas(evaluador_email);
CREATE INDEX IF NOT EXISTS idx_mesa1_resp_indicador  ON portal.mesa1_respuestas(indicador_id);
CREATE INDEX IF NOT EXISTS idx_mesa1_eval_confirmado ON portal.mesa1_evaluadores(confirmado_at)
    WHERE confirmado_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- PASO 3: VIEWS
-- ---------------------------------------------------------------------------

-- Vista de progreso por evaluador (cuantos indicadores ha respondido)
CREATE OR REPLACE VIEW portal.v_mesa1_progreso AS
SELECT
    e.email,
    e.nombre,
    e.programa,
    e.rol,
    e.confirmado_at,
    COUNT(r.id)                                           AS total_respondidos,
    COUNT(r.id) FILTER (WHERE r.pertinencia IS NOT NULL
                          AND r.claridad    IS NOT NULL) AS total_completos,
    ROUND(COUNT(r.id)::numeric / 75 * 100, 1)            AS porcentaje_avance,
    e.created_at
FROM portal.mesa1_evaluadores e
LEFT JOIN portal.mesa1_respuestas r ON r.evaluador_email = e.email
GROUP BY e.email, e.nombre, e.programa, e.rol, e.confirmado_at, e.created_at;

COMMENT ON VIEW portal.v_mesa1_progreso IS
    'Progreso de cada evaluador: cuantos indicadores ha respondido sobre 75.';

-- Vista de resultados agregados por indicador
CREATE OR REPLACE VIEW portal.v_mesa1_resultados AS
SELECT
    r.indicador_id,
    COUNT(r.id)                        AS n_respuestas,
    ROUND(AVG(r.pertinencia)::numeric, 2) AS avg_pertinencia,
    ROUND(AVG(r.claridad)::numeric, 2)    AS avg_claridad,
    ROUND(STDDEV(r.pertinencia)::numeric, 2) AS std_pertinencia,
    ROUND(STDDEV(r.claridad)::numeric, 2)    AS std_claridad,
    COUNT(r.id) FILTER (WHERE r.sugerencia IS NOT NULL
                          AND r.sugerencia <> '') AS n_con_sugerencia
FROM portal.mesa1_respuestas r
JOIN portal.mesa1_evaluadores e ON e.email = r.evaluador_email
WHERE e.confirmado_at IS NOT NULL          -- solo contar respuestas de enviados
GROUP BY r.indicador_id
ORDER BY r.indicador_id;

COMMENT ON VIEW portal.v_mesa1_resultados IS
    'Promedios de pertinencia y claridad por indicador, solo de evaluadores que confirmaron envio.';

-- ---------------------------------------------------------------------------
-- PASO 4: ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE portal.mesa1_evaluadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal.mesa1_respuestas  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- mesa1_evaluadores: solo service_role puede leer/escribir
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'portal'
          AND tablename  = 'mesa1_evaluadores'
          AND policyname = 'Service all mesa1_evaluadores'
    ) THEN
        CREATE POLICY "Service all mesa1_evaluadores"
            ON portal.mesa1_evaluadores
            FOR ALL
            USING (current_setting('role') = 'service_role');
    END IF;

    -- mesa1_respuestas: solo service_role puede leer/escribir
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'portal'
          AND tablename  = 'mesa1_respuestas'
          AND policyname = 'Service all mesa1_respuestas'
    ) THEN
        CREATE POLICY "Service all mesa1_respuestas"
            ON portal.mesa1_respuestas
            FOR ALL
            USING (current_setting('role') = 'service_role');
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PASO 5: GRANTS
-- ---------------------------------------------------------------------------

-- Evaluadores: solo service_role (datos sensibles, no exponer via anon)
GRANT ALL ON portal.mesa1_evaluadores          TO service_role;
GRANT ALL ON portal.mesa1_evaluadores_id_seq   TO service_role;

-- Respuestas: solo service_role
GRANT ALL ON portal.mesa1_respuestas           TO service_role;
GRANT ALL ON portal.mesa1_respuestas_id_seq    TO service_role;

-- Vistas: accesibles via service_role (el servidor las consulta directamente)
GRANT SELECT ON portal.v_mesa1_progreso    TO service_role;
GRANT SELECT ON portal.v_mesa1_resultados  TO service_role;
