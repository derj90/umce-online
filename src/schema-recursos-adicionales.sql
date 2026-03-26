-- =============================================================================
-- Recursos Adicionales — Schema SQL Migration
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- Created: 2026-03-26
-- Recursos que el DI/docente agrega directamente al curso virtual
-- sin pasar por Moodle (URLs, embeds, archivos)
-- =============================================================================

CREATE TABLE IF NOT EXISTS portal.recursos_adicionales (
    id                  SERIAL PRIMARY KEY,
    piac_link_id        INT NOT NULL REFERENCES portal.piac_links(id) ON DELETE CASCADE,

    -- Contenido
    titulo              TEXT NOT NULL,
    tipo                TEXT NOT NULL DEFAULT 'url',  -- url, embed, archivo
    url                 TEXT,                          -- URL o embed src
    archivo_path        TEXT,                          -- ruta relativa en /uploads
    descripcion         TEXT,
    icono               TEXT DEFAULT 'url',            -- modname-style icon key

    -- Ubicacion en el curso virtual
    virtual_section     INT DEFAULT 0,                 -- seccion destino en organizador
    orden               INT DEFAULT 0,                 -- posicion dentro de la seccion
    visible             BOOLEAN DEFAULT true,

    -- Metadata
    created_by          TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ra_piac_link ON portal.recursos_adicionales (piac_link_id);
CREATE INDEX IF NOT EXISTS idx_ra_visible ON portal.recursos_adicionales (piac_link_id, visible) WHERE visible = true;

-- RLS
ALTER TABLE portal.recursos_adicionales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read recursos_adicionales" ON portal.recursos_adicionales FOR SELECT USING (true);
CREATE POLICY "Service write recursos_adicionales" ON portal.recursos_adicionales FOR ALL USING (current_setting('role') = 'service_role');

-- Grants
GRANT SELECT ON portal.recursos_adicionales TO anon, authenticated;
GRANT ALL ON portal.recursos_adicionales TO service_role;
GRANT ALL ON portal.recursos_adicionales_id_seq TO service_role;
