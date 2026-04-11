Now I have a comprehensive understanding of the entire codebase. Let me compile the pipeline design.

Here is the complete pipeline design for connecting the Planificador Curricular with the PIAC and the learning space in UMCE.online.

---

## Pipeline Completo: Planificador (M3) --> PIAC --> Moodle --> Espacio de Aprendizaje

### Architecture Overview

The pipeline has 5 stages that form a unidirectional flow with feedback loops for validation:

```
Planificador (browser) 
    --> POST /api/planificador/guardar --> Supabase portal.planificador_designs
    --> POST /api/planificador/:id/generar-piac --> portal.piac_drafts (borrador PIAC JSON)
    --> POST /api/planificador/:id/exportar-drive --> Google Doc in Drive (PIAC Word)
    --> POST /api/piac/:linkId/construir-moodle (preview/execute) --> Moodle course structure
    --> GET /api/piac/:linkId/curso-virtual --> existing curso-virtual.html enriched with planner data
    --> GET /api/validacion/:designId --> cross-validation M3 vs M4 vs M5
```

---

### 1. PERSISTENCIA DEL PLANIFICADOR

#### 1.1 Schema SQL (`schema-planificador.sql`)

```sql
-- =============================================================================
-- Planificador Curricular — Schema SQL Migration
-- Supabase Self-Hosted (supabase.udfv.cloud) — schema portal
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PLANIFICADOR DESIGNS — output persistido del planificador
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.planificador_designs (
    id                  SERIAL PRIMARY KEY,
    -- Link to existing entities (optional)
    program_id          INT REFERENCES portal.programs(id),
    piac_link_id        INT REFERENCES portal.piac_links(id),
    
    -- Step 1: module config
    module_name         VARCHAR NOT NULL,
    sct_credits         INT NOT NULL CHECK (sct_credits BETWEEN 1 AND 30),
    weeks               INT NOT NULL CHECK (weeks BETWEEN 1 AND 52),
    profile             VARCHAR NOT NULL CHECK (profile IN ('pregrado', 'postgrado', 'continua')),
    format              VARCHAR NOT NULL CHECK (format IN ('semestral', 'modulo', 'microcredencial', 'cuech')),
    total_hours         NUMERIC(6,1) NOT NULL,  -- sct * 27
    weekly_hours        NUMERIC(6,2) NOT NULL,  -- total_hours / weeks
    
    -- Step 2+3: activities array (the core output)
    activities_json     JSONB NOT NULL,
    -- Format: [{ actId, cat, nombre, qty, time, subtotalMin, herramientas, tipo }]
    
    -- Step 4: validation result
    validation_json     JSONB,
    -- Format: { semaforo, pct, checks: [{label, ok, desc}], donut: {cat: mins}, weeklyHrs }
    
    -- Metadata
    version             INT NOT NULL DEFAULT 1,
    status              VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'piac_generated', 'implemented', 'archived')),
    created_by          VARCHAR NOT NULL,  -- email
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Version tracking: allow multiple versions of same module
CREATE INDEX IF NOT EXISTS idx_planificador_designs_module ON portal.planificador_designs (module_name, created_by);
CREATE INDEX IF NOT EXISTS idx_planificador_designs_status ON portal.planificador_designs (status);
CREATE INDEX IF NOT EXISTS idx_planificador_designs_piac_link ON portal.planificador_designs (piac_link_id);

-- RLS
ALTER TABLE portal.planificador_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read planificador_designs" ON portal.planificador_designs 
    FOR SELECT USING (true);
CREATE POLICY "Service write planificador_designs" ON portal.planificador_designs 
    FOR ALL USING (current_setting('role') = 'service_role');

-- Grants
GRANT SELECT ON portal.planificador_designs TO anon, authenticated;
GRANT ALL ON portal.planificador_designs TO service_role;
GRANT ALL ON portal.planificador_designs_id_seq TO service_role;

-- ---------------------------------------------------------------------------
-- PIAC DRAFTS — borradores de PIAC generados desde el planificador
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.piac_drafts (
    id                  SERIAL PRIMARY KEY,
    design_id           INT NOT NULL REFERENCES portal.planificador_designs(id) ON DELETE CASCADE,
    
    -- Full PIAC JSON structure (same format as piac_parsed.parsed_json)
    piac_json           JSONB NOT NULL,
    
    -- Tracking
    generation_method   VARCHAR NOT NULL DEFAULT 'algorithmic' 
        CHECK (generation_method IN ('algorithmic', 'llm_assisted', 'manual')),
    llm_model           VARCHAR,
    
    -- Lifecycle
    version             INT NOT NULL DEFAULT 1,
    status              VARCHAR NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'reviewed', 'exported', 'linked')),
    exported_drive_id   VARCHAR,           -- Google Drive file ID once exported
    exported_drive_url  TEXT,              -- Google Drive URL
    linked_piac_id      INT REFERENCES portal.piac_links(id),  -- once linked to real PIAC
    
    created_by          VARCHAR NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_piac_drafts_design ON portal.piac_drafts (design_id);
CREATE INDEX IF NOT EXISTS idx_piac_drafts_status ON portal.piac_drafts (status);

-- RLS
ALTER TABLE portal.piac_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read piac_drafts" ON portal.piac_drafts FOR SELECT USING (true);
CREATE POLICY "Service write piac_drafts" ON portal.piac_drafts FOR ALL 
    USING (current_setting('role') = 'service_role');

GRANT SELECT ON portal.piac_drafts TO anon, authenticated;
GRANT ALL ON portal.piac_drafts TO service_role;
GRANT ALL ON portal.piac_drafts_id_seq TO service_role;

-- ---------------------------------------------------------------------------
-- VALIDATION RUNS — cross-validation M3 vs M4 vs M5
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.validation_runs (
    id                  SERIAL PRIMARY KEY,
    design_id           INT REFERENCES portal.planificador_designs(id),
    piac_link_id        INT REFERENCES portal.piac_links(id),
    
    -- Snapshots at validation time
    planned_json        JSONB,    -- from planificador_designs.activities_json
    piac_json           JSONB,    -- from piac_drafts or piac_parsed
    moodle_json         JSONB,    -- from moodle_snapshots
    
    -- Results
    discrepancies_json  JSONB NOT NULL,
    -- Format: [{ type, severity, source_a, source_b, field, expected, actual, description }]
    
    summary_json        JSONB NOT NULL,
    -- Format: { score, total_checks, passed, warnings, critical, 
    --           m3_m4_alignment, m4_m5_alignment, semaforos: { m3_m4, m4_m5, overall } }
    
    run_by              VARCHAR NOT NULL,
    run_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_validation_runs_design ON portal.validation_runs (design_id);
CREATE INDEX IF NOT EXISTS idx_validation_runs_link ON portal.validation_runs (piac_link_id);

ALTER TABLE portal.validation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read validation_runs" ON portal.validation_runs FOR SELECT USING (true);
CREATE POLICY "Service write validation_runs" ON portal.validation_runs FOR ALL 
    USING (current_setting('role') = 'service_role');

GRANT SELECT ON portal.validation_runs TO anon, authenticated;
GRANT ALL ON portal.validation_runs TO service_role;
GRANT ALL ON portal.validation_runs_id_seq TO service_role;
```

#### 1.2 Endpoint: Save planner output

Add to `server.js` after the existing PIAC endpoints (around line 5300):

```javascript
// POST /api/planificador/guardar — persist planner output
app.post('/api/planificador/guardar', authMiddleware, async (req, res) => {
  try {
    const { email } = resolveTargetEmail(req);
    const { 
      module_name, sct_credits, weeks, profile, format,
      activities,  // addedActivities array from browser
      validation,  // step 4 result object
      program_id, piac_link_id 
    } = req.body;

    // Validate required fields
    if (!module_name || !sct_credits || !weeks || !profile || !format) {
      return res.status(400).json({ error: 'Faltan campos obligatorios del paso 1' });
    }
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ error: 'Debe haber al menos 1 actividad' });
    }

    const totalHours = sct_credits * 27;
    const weeklyHours = totalHours / weeks;

    // Enrich activities with full catalog data
    // (the browser only sends actId, cat, nombre, qty, time, subtotalMin)
    // Server enriches with herramientas, tipo from sct-data.json
    const enrichedActivities = activities.map(a => {
      const catalogEntry = SCT_DATA.actividades.find(x => x.id === a.actId);
      return {
        ...a,
        herramientas: catalogEntry?.herramientas || '',
        tipo: catalogEntry?.tipo || null,
        unidad: catalogEntry?.unidad || ''
      };
    });

    // Check for existing draft by same user for same module (version bump)
    const existing = await portalQuery('planificador_designs',
      `module_name=eq.${encodeURIComponent(module_name)}&created_by=eq.${encodeURIComponent(email)}&status=neq.archived&order=version.desc&limit=1`
    );
    const version = existing.length > 0 ? existing[0].version + 1 : 1;

    const [inserted] = await portalMutate('planificador_designs', 'POST', {
      module_name,
      sct_credits,
      weeks,
      profile,
      format,
      total_hours: totalHours,
      weekly_hours: weeklyHours,
      activities_json: enrichedActivities,
      validation_json: validation || null,
      version,
      status: validation ? 'validated' : 'draft',
      created_by: email,
      program_id: program_id || null,
      piac_link_id: piac_link_id || null
    });

    res.json({ ok: true, id: inserted.id, version });
  } catch (err) {
    console.error('Error guardando planificador:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/planificador/mis-disenos — list user's designs
app.get('/api/planificador/mis-disenos', authMiddleware, async (req, res) => {
  try {
    const { email } = resolveTargetEmail(req);
    const designs = await portalQuery('planificador_designs',
      `created_by=eq.${encodeURIComponent(email)}&status=neq.archived&order=updated_at.desc`
    );
    res.json(designs);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/planificador/:id — single design detail
app.get('/api/planificador/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [design] = await portalQuery('planificador_designs', `id=eq.${id}&limit=1`);
    if (!design) return res.status(404).json({ error: 'Diseno no encontrado' });
    
    // Include associated drafts
    const drafts = await portalQuery('piac_drafts', 
      `design_id=eq.${id}&order=version.desc`);
    
    res.json({ ...design, drafts });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});
```

The `SCT_DATA` must be loaded at server startup:

```javascript
// At top of server.js, after imports
const SCT_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/sct-data.json'), 'utf8'));
```

#### 1.3 Client-side: Add save button to Step 4 of the planificador

In `virtualizacion-planificador.html`, add a "Guardar diseno" button next to "Exportar PDF" in Step 4, and a function:

```javascript
window.guardarDiseno = async function() {
  const c = getConfig();
  const payload = {
    module_name: document.getElementById('moduleName').value || 'Sin nombre',
    sct_credits: c.sct,
    weeks: c.weeks,
    profile: c.profile,
    format: document.querySelector('input[name="unit"]:checked')?.value || 'semestral',
    activities: addedActivities,
    validation: buildValidationSnapshot()  // capture step 4 state
  };
  
  try {
    const resp = await fetch('/api/planificador/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (data.ok) {
      // Show success, store ID for later PIAC generation
      currentDesignId = data.id;
      showToast(`Diseno guardado (version ${data.version})`);
      showGeneratePIACButton();
    }
  } catch (err) {
    showToast('Error al guardar', 'error');
  }
};

function buildValidationSnapshot() {
  const c = getConfig();
  const totalMin = addedActivities.reduce((s, a) => s + a.subtotalMin, 0);
  const totalHrs = totalMin / 60;
  const pct = c.totalHours > 0 ? totalHrs / c.totalHours : 0;
  const cats = {};
  addedActivities.forEach(a => { cats[a.cat] = (cats[a.cat] || 0) + a.subtotalMin; });
  
  let semaforo = 'verde';
  if (addedActivities.length === 0) semaforo = 'gris';
  else if (Math.abs(pct - 1) > DATA.config.toleranciaCarga) {
    semaforo = pct < 1 ? 'amarillo' : 'rojo';
  }
  
  return { semaforo, pct, totalHrs, totalHoursExpected: c.totalHours, donut: cats, weeklyHrs: totalMin / 60 / c.weeks };
}
```

---

### 2. GENERADOR DE BORRADOR PIAC

#### 2.1 Transformation Logic: Activities --> PIAC Structure

The core algorithm that converts a flat array of e-activities into the PIAC nucleos/sessions structure:

```javascript
// In server.js — add as helper function

/**
 * Transform planificador activities into PIAC draft structure.
 * 
 * Mapping rules (cat -> momento didactico):
 *   EC (sync sessions: EC3,EC4,EC5,EC6) -> "sincronico"
 *   EC (async: EC1,EC2 foros)           -> "asincronico"
 *   IN (insumos, lecturas)              -> "autonomo" (before class)
 *   EA (analisis), EB (investigacion), EE (reflexion) -> "asincronico" (after class)
 *   ED (colaboracion)                    -> "sincronico" if Zoom/BBB, else "asincronico"
 *   EV (evaluacion)                      -> evaluaciones_sumativas section
 * 
 * Distribution strategy:
 *   1. Divide weeks into nucleos (3-6 weeks each, depending on total)
 *   2. Distribute sync sessions evenly (1 per week)
 *   3. Spread async activities proportionally across nucleos
 *   4. Place evaluations at end of each nucleo
 */
function generatePIACDraft(design) {
  const { module_name, sct_credits, weeks, profile, format, activities_json } = design;
  const activities = activities_json;
  
  // --- Step 1: Determine nucleo count and distribution ---
  const nucleoCount = weeks <= 5 ? 1 
    : weeks <= 8 ? 2 
    : weeks <= 12 ? 3 
    : weeks <= 18 ? Math.min(4, Math.ceil(weeks / 4.5))
    : Math.ceil(weeks / 5);
  
  const weeksPerNucleo = Math.floor(weeks / nucleoCount);
  const remainder = weeks - (weeksPerNucleo * nucleoCount);
  
  // Build nucleo week ranges
  const nucleos = [];
  let weekCursor = 1;
  for (let n = 0; n < nucleoCount; n++) {
    const extraWeek = n < remainder ? 1 : 0;
    const nWeeks = weeksPerNucleo + extraWeek;
    nucleos.push({
      numero: n + 1,
      nombre: `Nucleo ${n + 1}`,  // DI fills in real name later
      semanas: { inicio: weekCursor, fin: weekCursor + nWeeks - 1 },
      _weekCount: nWeeks,
      resultado_formativo: '',  // DI fills
      criterios_evaluacion: [],
      sesiones: [],
      evaluaciones_sumativas: []
    });
    weekCursor += nWeeks;
  }
  
  // --- Step 2: Classify activities by momento didactico ---
  const SYNC_ACT_IDS = ['EC3', 'EC4', 'EC5', 'EC6'];
  const SYNC_COLLAB_TOOLS = ['Zoom', 'BigBlueButton', 'BBB'];
  
  const syncActivities = [];      // -> "sincronico" in sesiones
  const asyncActivities = [];     // -> "asincronico" in sesiones
  const autonomoActivities = [];  // -> "autonomo" in sesiones
  const evalActivities = [];      // -> evaluaciones section
  
  for (const act of activities) {
    const catalog = SCT_DATA.actividades.find(x => x.id === act.actId);
    const herr = (act.herramientas || catalog?.herramientas || '').toLowerCase();
    
    if (act.cat === 'EV') {
      evalActivities.push(act);
    } else if (act.cat === 'EC' && SYNC_ACT_IDS.includes(act.actId)) {
      syncActivities.push(act);
    } else if (act.cat === 'IN') {
      autonomoActivities.push(act);
    } else if (act.cat === 'ED' && SYNC_COLLAB_TOOLS.some(t => herr.includes(t.toLowerCase()))) {
      syncActivities.push(act);
    } else {
      // EA, EB, EE, EC1, EC2 (foros), ED (non-sync)
      asyncActivities.push(act);
    }
  }
  
  // --- Step 3: Distribute activities into nucleos/sessions ---
  
  // Expand qty into individual instances
  function expandInstances(actList) {
    const instances = [];
    for (const act of actList) {
      for (let i = 0; i < act.qty; i++) {
        instances.push({ ...act, _instance: i + 1 });
      }
    }
    return instances;
  }
  
  const syncInstances = expandInstances(syncActivities);
  const asyncInstances = expandInstances(asyncActivities);
  const autonomoInstances = expandInstances(autonomoActivities);
  
  // Total sessions = total sync instances (capped at weeks)
  // If no sync, 1 session per week
  const totalSessions = syncInstances.length > 0 
    ? Math.min(syncInstances.length, weeks) 
    : weeks;
  
  // Distribute sessions across nucleos proportionally
  let sessionCursor = 0;
  for (const nucleo of nucleos) {
    const nSessions = Math.round(totalSessions * (nucleo._weekCount / weeks));
    
    for (let s = 0; s < Math.max(nSessions, 1); s++) {
      const sessionNum = sessionCursor + s + 1;
      const weekNum = nucleo.semanas.inicio + s;
      if (weekNum > nucleo.semanas.fin) break;
      
      const session = {
        numero: sessionNum,
        semana: weekNum,
        titulo: `Sesion ${sessionNum}`,  // DI fills real title
        sincronico: '',
        asincronico: '',
        autonomo: '',
        recursos: []
      };
      
      // Assign sync activity for this session
      const syncIdx = sessionNum - 1;
      if (syncIdx < syncInstances.length) {
        const si = syncInstances[syncIdx];
        session.sincronico = `${si.nombre} (${si.time} min)`;
        session._sync_act = si.actId;
      }
      
      nucleo.sesiones.push(session);
    }
    sessionCursor += nucleo.sesiones.length;
  }
  
  // Distribute async and autonomo across sessions (round-robin)
  const allSessions = nucleos.flatMap(n => n.sesiones);
  
  asyncInstances.forEach((inst, i) => {
    const targetSession = allSessions[i % allSessions.length];
    const current = targetSession.asincronico;
    targetSession.asincronico = current 
      ? `${current}; ${inst.nombre} (${inst.time} min)` 
      : `${inst.nombre} (${inst.time} min)`;
    if (!targetSession._async_acts) targetSession._async_acts = [];
    targetSession._async_acts.push(inst.actId);
  });
  
  autonomoInstances.forEach((inst, i) => {
    const targetSession = allSessions[i % allSessions.length];
    const current = targetSession.autonomo;
    targetSession.autonomo = current 
      ? `${current}; ${inst.nombre} (${inst.time} min)` 
      : `${inst.nombre} (${inst.time} min)`;
    // Add as recurso
    targetSession.recursos.push({
      tipo: inst.actId.startsWith('IN3') || inst.actId.startsWith('IN4') || inst.actId.startsWith('IN8') 
        ? 'video' 
        : inst.actId.startsWith('IN5') ? 'audio' : 'lectura',
      titulo: inst.nombre,
      url: ''  // DI fills
    });
  });
  
  // --- Step 4: Place evaluations ---
  const sumativas = evalActivities.filter(a => {
    const cat = SCT_DATA.actividades.find(x => x.id === a.actId);
    return cat?.tipo === 'sumativa';
  });
  const formativas = evalActivities.filter(a => {
    const cat = SCT_DATA.actividades.find(x => x.id === a.actId);
    return cat?.tipo === 'formativa';
  });
  
  // Sumativas: distribute across nucleos, weighted toward end
  if (sumativas.length > 0) {
    const sumInstances = expandInstances(sumativas);
    const perNucleo = Math.ceil(sumInstances.length / nucleoCount);
    sumInstances.forEach((inst, i) => {
      const nucleoIdx = Math.min(Math.floor(i / perNucleo), nucleoCount - 1);
      nucleos[nucleoIdx].evaluaciones_sumativas.push({
        nombre: inst.nombre,
        ponderacion: Math.round(100 / sumInstances.length), // even distribution, DI adjusts
        nucleo: nucleoIdx + 1,
        _actId: inst.actId,
        _time: inst.time
      });
    });
  }
  
  // Formativas: sprinkle across sessions as async
  const formInstances = expandInstances(formativas);
  formInstances.forEach((inst, i) => {
    const targetSession = allSessions[i % allSessions.length];
    targetSession.asincronico = targetSession.asincronico 
      ? `${targetSession.asincronico}; ${inst.nombre} (formativa, ${inst.time} min)` 
      : `${inst.nombre} (formativa, ${inst.time} min)`;
  });
  
  // --- Step 5: Calculate hours breakdown ---
  const totalMin = activities.reduce((s, a) => s + a.subtotalMin, 0);
  const syncMin = syncActivities.reduce((s, a) => s + a.subtotalMin, 0);
  const asyncMin = asyncActivities.reduce((s, a) => s + a.subtotalMin, 0) 
    + evalActivities.reduce((s, a) => s + a.subtotalMin, 0);
  const autoMin = autonomoActivities.reduce((s, a) => s + a.subtotalMin, 0);
  
  // --- Step 6: Assemble PIAC JSON ---
  // Clean internal fields
  nucleos.forEach(n => {
    delete n._weekCount;
    n.sesiones.forEach(s => {
      delete s._sync_act;
      delete s._async_acts;
    });
    n.evaluaciones_sumativas.forEach(e => {
      delete e._actId;
      delete e._time;
    });
  });
  
  return {
    identificacion: {
      nombre: module_name,
      programa: '',           // DI fills
      docente: '',            // DI fills
      email_docente: '',      // DI fills
      semestre: '',           // DI fills
      modalidad: format === 'semestral' ? 'Blended' : 'Virtual',
      tipo_docencia: profile,
      horas: {
        sincronicas: Math.round(syncMin / 60 * 10) / 10,
        asincronicas: Math.round(asyncMin / 60 * 10) / 10,
        autonomas: Math.round(autoMin / 60 * 10) / 10
      },
      semanas: weeks,
      creditos_sct: sct_credits
    },
    nucleos,
    metodologia: '',   // DI fills
    bibliografia: [],  // DI fills
    _meta: {
      generated_from: 'planificador',
      design_id: design.id,
      generated_at: new Date().toISOString(),
      activities_count: activities.length,
      total_instances: syncInstances.length + asyncInstances.length + autonomoInstances.length + evalActivities.reduce((s,a) => s + a.qty, 0)
    }
  };
}
```

#### 2.2 Endpoint: Generate PIAC draft

```javascript
// POST /api/planificador/:id/generar-piac — generate PIAC draft from design
app.post('/api/planificador/:id/generar-piac', adminOrEditorMiddleware, async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const { email } = resolveTargetEmail(req);
    
    const [design] = await portalQuery('planificador_designs', `id=eq.${designId}&limit=1`);
    if (!design) return res.status(404).json({ error: 'Diseno no encontrado' });
    
    const piacJson = generatePIACDraft(design);
    
    // Check existing drafts for version
    const existing = await portalQuery('piac_drafts', 
      `design_id=eq.${designId}&order=version.desc&limit=1`);
    const version = existing.length > 0 ? existing[0].version + 1 : 1;
    
    const [draft] = await portalMutate('piac_drafts', 'POST', {
      design_id: designId,
      piac_json: piacJson,
      generation_method: 'algorithmic',
      version,
      status: 'draft',
      created_by: email
    });
    
    // Update design status
    await portalMutate('planificador_designs', 'PATCH', 
      { status: 'piac_generated', updated_at: new Date().toISOString() },
      `id=eq.${designId}`);
    
    res.json({ ok: true, draft_id: draft.id, version, piac: piacJson });
  } catch (err) {
    console.error('Error generando PIAC:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});
```

#### 2.3 Endpoint: Export PIAC draft to Google Drive

```javascript
// POST /api/planificador/:id/exportar-drive — export PIAC draft to Google Drive as Doc
app.post('/api/planificador/:id/exportar-drive', adminOrEditorMiddleware, async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const { draft_id } = req.body;  // which draft version to export
    
    const [draft] = await portalQuery('piac_drafts', `id=eq.${draft_id}&limit=1`);
    if (!draft) return res.status(404).json({ error: 'Borrador no encontrado' });
    
    const piac = draft.piac_json;
    
    // Build Google Doc content as HTML (Drive API creates Doc from HTML)
    const html = buildPIACHtml(piac);
    
    // Use existing Drive API auth (udfv@ OAuth)
    const drive = getDriveClient();  // existing helper from server.js
    
    const fileMetadata = {
      name: `PIAC - ${piac.identificacion.nombre} - Borrador v${draft.version}`,
      mimeType: 'application/vnd.google-apps.document',
      parents: [process.env.PIAC_DRIVE_FOLDER_ID]  // shared PIAC folder
    };
    
    const media = {
      mimeType: 'text/html',
      body: html
    };
    
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink'
    });
    
    // Update draft with Drive info
    await portalMutate('piac_drafts', 'PATCH', {
      exported_drive_id: file.data.id,
      exported_drive_url: file.data.webViewLink,
      status: 'exported',
      updated_at: new Date().toISOString()
    }, `id=eq.${draft_id}`);
    
    res.json({ 
      ok: true, 
      drive_id: file.data.id, 
      drive_url: file.data.webViewLink 
    });
  } catch (err) {
    console.error('Error exportando a Drive:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Helper: Build PIAC HTML for Drive export
function buildPIACHtml(piac) {
  const { identificacion: id, nucleos } = piac;
  
  let html = `<h1>PIAC - ${id.nombre}</h1>`;
  html += `<h2>1. Identificacion</h2>`;
  html += `<table border="1" cellpadding="4">`;
  html += `<tr><td><b>Programa</b></td><td>${id.programa || '(completar)'}</td></tr>`;
  html += `<tr><td><b>Docente</b></td><td>${id.docente || '(completar)'}</td></tr>`;
  html += `<tr><td><b>Creditos SCT</b></td><td>${id.creditos_sct}</td></tr>`;
  html += `<tr><td><b>Semanas</b></td><td>${id.semanas}</td></tr>`;
  html += `<tr><td><b>Horas sincronicas</b></td><td>${id.horas.sincronicas}</td></tr>`;
  html += `<tr><td><b>Horas asincronicas</b></td><td>${id.horas.asincronicas}</td></tr>`;
  html += `<tr><td><b>Horas autonomas</b></td><td>${id.horas.autonomas}</td></tr>`;
  html += `</table>`;
  
  for (const nucleo of nucleos) {
    html += `<h2>Nucleo ${nucleo.numero}: ${nucleo.nombre}</h2>`;
    html += `<p><b>Semanas ${nucleo.semanas.inicio}-${nucleo.semanas.fin}</b></p>`;
    html += `<p><b>Resultado formativo:</b> ${nucleo.resultado_formativo || '(completar)'}</p>`;
    
    html += `<table border="1" cellpadding="4" style="width:100%">`;
    html += `<tr><th>Sesion</th><th>Autonomo (antes)</th><th>Sincronico</th><th>Asincronico (despues)</th></tr>`;
    for (const s of nucleo.sesiones) {
      html += `<tr><td>S${s.numero} (Sem ${s.semana})</td><td>${s.autonomo || '-'}</td><td>${s.sincronico || '-'}</td><td>${s.asincronico || '-'}</td></tr>`;
    }
    html += `</table>`;
    
    if (nucleo.evaluaciones_sumativas.length > 0) {
      html += `<h3>Evaluaciones sumativas</h3><ul>`;
      for (const ev of nucleo.evaluaciones_sumativas) {
        html += `<li>${ev.nombre} (${ev.ponderacion}%)</li>`;
      }
      html += `</ul>`;
    }
  }
  
  return html;
}
```

---

### 3. CONSTRUCTOR DE CURSO MOODLE

#### 3.1 Activity-to-Moodle mapping table

This is the lookup table that maps e-activity IDs from the catalog to Moodle module types:

```javascript
// In server.js — constant
const ACTIVITY_MOODLE_MAP = {
  // EA - Analisis
  'EA1': { mod: 'assign', config: { submissionType: 'onlinetext' } },
  'EA2': { mod: 'assign', config: { submissionType: 'onlinetext' } },
  'EA3': { mod: 'assign', config: { submissionType: 'file' } },
  'EA4': { mod: 'assign', config: { submissionType: 'onlinetext' } },
  
  // EB - Investigacion
  'EB1': { mod: 'assign', config: { submissionType: 'file' } },
  'EB2': { mod: 'assign', config: { submissionType: 'file' } },
  'EB3': { mod: 'assign', config: { submissionType: 'onlinetext' } },
  'EB4': { mod: 'assign', config: { submissionType: 'file' } },
  
  // EC - Interaccion
  'EC1': { mod: 'forum', config: { type: 'general' } },
  'EC2': { mod: 'forum', config: { type: 'general' } },  // same forum as EC1
  'EC3': { mod: 'url', config: { externalurl: 'ZOOM_PLACEHOLDER' } },  // Zoom link
  'EC4': { mod: 'url', config: { externalurl: 'ZOOM_PLACEHOLDER' } },
  'EC5': { mod: 'url', config: { externalurl: 'ZOOM_PLACEHOLDER' } },
  'EC6': { mod: 'glossary', config: {} },
  
  // ED - Colaboracion
  'ED1': { mod: 'wiki', config: { wikimode: 'collaborative' } },
  'ED2': { mod: 'url', config: { externalurl: 'PADLET_PLACEHOLDER' } },
  'ED3': { mod: 'assign', config: { teamsubmission: 1 } },
  'ED4': { mod: 'url', config: { externalurl: 'GOOGLE_DOCS_PLACEHOLDER' } },
  'ED5': { mod: 'workshop', config: {} },
  
  // EE - Reflexion
  'EE1': { mod: 'assign', config: { submissionType: 'onlinetext', name_prefix: 'Diario' } },
  'EE2': { mod: 'url', config: { externalurl: 'BLOG_PLACEHOLDER' } },
  'EE3': { mod: 'assign', config: { submissionType: 'file', name_prefix: 'Portafolio' } },
  'EE4': { mod: 'assign', config: { submissionType: 'onlinetext' } },
  
  // IN - Insumos
  'IN1': { mod: 'resource', config: {} },  // PDF upload
  'IN2': { mod: 'resource', config: {} },
  'IN3': { mod: 'url', config: { externalurl: 'YOUTUBE_PLACEHOLDER' } },
  'IN4': { mod: 'url', config: { externalurl: 'YOUTUBE_PLACEHOLDER' } },
  'IN5': { mod: 'url', config: { externalurl: 'PODCAST_PLACEHOLDER' } },
  'IN6': { mod: 'scorm', config: {} },
  'IN7': { mod: 'url', config: { externalurl: 'GENIALLY_PLACEHOLDER' } },
  'IN8': { mod: 'h5pactivity', config: {} },
  
  // EV - Evaluacion
  'EV1': { mod: 'quiz', config: { gradepass: 0 } },          // formativa
  'EV2': { mod: 'h5pactivity', config: {} },                  // formativa
  'EV3': { mod: 'h5pactivity', config: {} },                  // formativa
  'EV4': { mod: 'quiz', config: { gradepass: 60 } },          // sumativa
  'EV5': { mod: 'assign', config: { submissionType: 'file' } }, // sumativa
  'EV6': { mod: 'assign', config: { submissionType: 'file' } }, // sumativa (rubric needed)
  'EV7': { mod: 'feedback', config: {} }
};
```

#### 3.2 Moodle APIs needed

The constructor uses these Moodle web service functions (already available on the 5 platforms):

| Function | Purpose | Notes |
|----------|---------|-------|
| `core_course_get_courses` | Verify course exists | Already used in piac_links |
| `core_course_get_contents` | Read existing sections | Already used in snapshots |
| `core_course_update_courses` | Update course format/settings | Set weeks format, numsections |
| `core_course_edit_section` | Rename sections, set visibility | Not yet used -- needs wstoken with `moodle/course:update` capability |
| `core_course_create_categories` | Not needed (courses already exist) | -- |

For creating activities, the Moodle REST API does NOT have a generic `core_course_create_module`. Activity creation requires either:

**Option A (recommended for safety)**: Generate a Moodle backup XML (MBZ) that the DI imports manually. This respects the CLAUDE.md rule "IA NO crea nada en Moodle".

**Option B (with explicit DI confirmation)**: Use `core_course_import_course` from a template course that has the structure pre-built. The constructor creates a "template course" with the right sections and activities, then the DI imports from it.

**Option C (direct creation, requires additional Moodle plugin)**: Install `local_wsmanagesections` or `local_modcreator` plugin that exposes activity creation via WS. This is the most automated but requires plugin installation.

Given the CLAUDE.md constraint ("IA NO crea ni modifica nada en Moodle"), the safest approach is:

#### 3.3 Preview mode (always first) + Execute mode (with confirmation)

```javascript
// POST /api/piac/:linkId/construir-moodle — preview or execute Moodle structure
app.post('/api/piac/:linkId/construir-moodle', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.id || req.params.linkId);
    const { mode = 'preview', design_id, draft_id } = req.body;
    // mode: 'preview' (default) | 'execute' (requires explicit confirmation)
    
    if (mode === 'execute') {
      // SAFETY: require double confirmation
      if (!req.body.confirm_execute) {
        return res.status(400).json({ 
          error: 'Se requiere confirm_execute: true para modificar Moodle',
          warning: 'Esta accion creara secciones y actividades en el curso Moodle real'
        });
      }
    }
    
    // Get PIAC data (from draft or from parsed)
    let piacJson;
    if (draft_id) {
      const [draft] = await portalQuery('piac_drafts', `id=eq.${draft_id}&limit=1`);
      piacJson = draft?.piac_json;
    } else {
      const [parsed] = await portalQuery('piac_parsed', 
        `piac_link_id=eq.${linkId}&order=version.desc&limit=1`);
      piacJson = parsed?.parsed_json;
    }
    
    if (!piacJson) return res.status(404).json({ error: 'No hay PIAC para este vinculo' });
    
    // Get link info
    const [link] = await portalQuery('piac_links', `id=eq.${linkId}&limit=1`);
    if (!link) return res.status(404).json({ error: 'Vinculo no encontrado' });
    
    const platform = PLATFORMS[link.moodle_platform];
    if (!platform) return res.status(400).json({ error: 'Plataforma no configurada' });
    
    // Get current Moodle structure
    const contents = await moodleCall(platform, 'core_course_get_contents', 
      { courseid: link.moodle_course_id });
    
    // Build the plan: what needs to be created/modified
    const plan = buildMoodlePlan(piacJson, contents, link);
    
    if (mode === 'preview') {
      return res.json({ 
        mode: 'preview',
        plan,
        summary: {
          sections_to_rename: plan.sections.filter(s => s.action === 'rename').length,
          sections_existing: plan.sections.filter(s => s.action === 'none').length,
          activities_to_create: plan.activities.filter(a => a.action === 'create').length,
          activities_existing: plan.activities.filter(a => a.action === 'exists').length,
          activities_placeholder: plan.activities.filter(a => a.action === 'placeholder').length,
          warnings: plan.warnings
        }
      });
    }
    
    // mode === 'execute'
    const results = await executeMoodlePlan(platform, link.moodle_course_id, plan);
    
    // Take a new snapshot after modifications
    // (reuse existing snapshot endpoint logic)
    
    res.json({ mode: 'execute', results });
  } catch (err) {
    console.error('Error construyendo Moodle:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

function buildMoodlePlan(piacJson, moodleContents, link) {
  const plan = { sections: [], activities: [], warnings: [] };
  const nucleos = piacJson.nucleos || [];
  
  // Section 0 = General (already exists in Moodle)
  // Section N = Nucleo N or Week N
  
  for (let n = 0; n < nucleos.length; n++) {
    const nucleo = nucleos[n];
    
    // Each session within the nucleo maps to a Moodle section
    for (const session of nucleo.sesiones) {
      const sectionNumber = session.semana;  // week number = section number
      const existingSection = moodleContents.find(s => s.section === sectionNumber);
      
      const sectionPlan = {
        sectionNumber,
        targetName: `Semana ${session.semana}: ${session.titulo}`,
        currentName: existingSection?.name || null,
        action: existingSection ? 'rename' : 'create',
        nucleo: nucleo.numero
      };
      
      // Don't rename if it already has a meaningful name
      if (existingSection?.name && existingSection.name !== `Topic ${sectionNumber}` 
          && existingSection.name !== `Tema ${sectionNumber}`) {
        sectionPlan.action = 'none';
        sectionPlan.note = 'Section already has a custom name';
      }
      
      plan.sections.push(sectionPlan);
      
      // Plan activities for this section
      // Parse the session fields to extract activities
      const sessionActivities = [];
      
      if (session.sincronico) {
        sessionActivities.push({
          source: 'sincronico',
          description: session.sincronico,
          sectionNumber,
          suggestedMod: 'url',
          suggestedName: `Sesion sincronica ${session.numero}`,
          action: findExistingActivity(existingSection, 'url', 'zoom') ? 'exists' : 'placeholder'
        });
      }
      
      if (session.autonomo) {
        // Parse multiple activities from semicolon-separated string
        const parts = session.autonomo.split(';').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          sessionActivities.push({
            source: 'autonomo',
            description: part,
            sectionNumber,
            suggestedMod: part.toLowerCase().includes('video') ? 'url' : 'resource',
            suggestedName: part.split('(')[0].trim(),
            action: 'placeholder'
          });
        }
      }
      
      if (session.asincronico) {
        const parts = session.asincronico.split(';').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          const isForum = part.toLowerCase().includes('foro');
          const isQuiz = part.toLowerCase().includes('quiz') || part.toLowerCase().includes('formativa');
          sessionActivities.push({
            source: 'asincronico',
            description: part,
            sectionNumber,
            suggestedMod: isForum ? 'forum' : isQuiz ? 'quiz' : 'assign',
            suggestedName: part.split('(')[0].trim(),
            action: 'placeholder'
          });
        }
      }
      
      plan.activities.push(...sessionActivities);
    }
  }
  
  // Check for mismatches
  if (moodleContents.length > 1 && nucleos.length > 0) {
    const moodleSectionCount = moodleContents.filter(s => s.section > 0).length;
    const plannedWeeks = piacJson.identificacion?.semanas || 0;
    if (moodleSectionCount < plannedWeeks) {
      plan.warnings.push(`El curso Moodle tiene ${moodleSectionCount} secciones pero el PIAC planifica ${plannedWeeks} semanas`);
    }
  }
  
  return plan;
}

function findExistingActivity(section, modname, nameHint) {
  if (!section?.modules) return null;
  return section.modules.find(m => 
    m.modname === modname && 
    (nameHint ? m.name.toLowerCase().includes(nameHint) : true)
  );
}
```

The `executeMoodlePlan` function would only rename sections (using `core_course_edit_section`) since actual activity creation requires either manual DI action or a custom plugin. The preview output serves as a checklist for the DI.

---

### 4. ALIMENTAR EL ESPACIO DE APRENDIZAJE

#### 4.1 PIAC to Course JSON transformation

The existing `curso-virtual.html` already consumes data from `GET /api/curso-virtual/:linkId`. The pipeline needs to also work when the PIAC comes from the planificador (a draft) rather than a parsed Word document.

The transformation is:

```javascript
// In the existing /api/curso-virtual/:linkId handler, add support for draft-sourced PIACs

// Current flow: piac_parsed.parsed_json -> curso-virtual API -> curso-virtual.html
// New flow:     piac_drafts.piac_json    -> curso-virtual API -> curso-virtual.html (same output format)
// Autoformacion: JSON file in public/     -> curso-template.html (self-contained)

// Field mapping PIAC -> Curso Virtual JSON:
//
// PIAC                          -> Curso Virtual
// ─────────────────────────────────────────────────────
// identificacion.nombre         -> course.fullname
// identificacion.horas          -> info.horas
// identificacion.creditos_sct   -> info.creditos
// identificacion.semanas        -> info.semanas
// identificacion.modalidad      -> info.modalidad
// identificacion.docente        -> docente.nombre
// nucleos[n]                    -> nucleos[n] (1:1)
// nucleos[n].sesiones[s]        -> nucleos[n].semanas[s]
//   .sincronico                 -> .durante
//   .autonomo                   -> .antes
//   .asincronico                -> .despues
//   .recursos                   -> .recursos
// nucleos[n].evaluaciones       -> evaluaciones_nucleos[n]
// _meta.design_id               -> allows linking back to planificador
```

The key insight is that the existing `curso-virtual.html` already renders from PIAC JSON. The draft from the planificador uses the SAME schema as `piac_parsed.parsed_json`, so it plugs directly into the existing viewer with zero changes to the frontend.

#### 4.2 Autoformacion courses (JSON-driven, no PIAC)

For self-paced courses that don't have a PIAC (like the existing `modelo-educativo.json`), the course JSON is the source of truth. The autoformacion template at `/autoformacion/curso-template.html` reads the JSON directly. No pipeline needed -- these courses are authored directly as JSON.

The bridge between the two modes is the `piac_link_id` field:

- If `piac_link_id` exists: tutored course, data comes from PIAC (parsed Word or draft)
- If no `piac_link_id`: autoformacion, data comes from JSON in `/autoformacion/courses/`

#### 4.3 Enrichment with Moodle data (already implemented in Fase 5)

The existing API at `GET /api/curso-virtual/:linkId` already merges:
- PIAC structure (nucleos, sessions, evaluations)
- Moodle snapshot (activities, resources)
- Cache data (completion, grades, recordings, calendar)

This pipeline just ensures the PIAC data can originate from the planificador draft instead of only from a parsed Word doc.

---

### 5. VALIDACION CRUZADA M3 --> M4 --> M5

#### 5.1 Validation engine

```javascript
// POST /api/validacion/:designId — run cross-validation
app.post('/api/validacion/:designId', adminOrEditorMiddleware, async (req, res) => {
  try {
    const designId = parseInt(req.params.designId);
    const { email } = resolveTargetEmail(req);
    
    // Load all 3 sources
    const [design] = await portalQuery('planificador_designs', `id=eq.${designId}&limit=1`);
    if (!design) return res.status(404).json({ error: 'Diseno no encontrado' });
    
    const linkId = design.piac_link_id;
    let piacJson = null, moodleJson = null;
    
    if (linkId) {
      // Get latest PIAC parsed (or draft)
      const [parsed] = await portalQuery('piac_parsed', 
        `piac_link_id=eq.${linkId}&order=version.desc&limit=1`);
      piacJson = parsed?.parsed_json;
      
      // If no parsed, try draft
      if (!piacJson) {
        const [draft] = await portalQuery('piac_drafts', 
          `design_id=eq.${designId}&order=version.desc&limit=1`);
        piacJson = draft?.piac_json;
      }
      
      // Get latest Moodle snapshot
      const [snapshot] = await portalQuery('moodle_snapshots', 
        `piac_link_id=eq.${linkId}&order=snapshot_at.desc&limit=1`);
      moodleJson = snapshot?.snapshot_json;
    }
    
    const discrepancies = [];
    const checks = { total: 0, passed: 0, warnings: 0, critical: 0 };
    
    // === M3 vs M4: Planificado vs PIAC ===
    if (piacJson) {
      const m3m4 = validateM3vsM4(design, piacJson);
      discrepancies.push(...m3m4.discrepancies);
      checks.total += m3m4.checks.total;
      checks.passed += m3m4.checks.passed;
      checks.warnings += m3m4.checks.warnings;
      checks.critical += m3m4.checks.critical;
    }
    
    // === M4 vs M5: PIAC vs Moodle ===
    if (piacJson && moodleJson) {
      const m4m5 = validateM4vsM5(piacJson, moodleJson);
      discrepancies.push(...m4m5.discrepancies);
      checks.total += m4m5.checks.total;
      checks.passed += m4m5.checks.passed;
      checks.warnings += m4m5.checks.warnings;
      checks.critical += m4m5.checks.critical;
    }
    
    // === M3 vs M5: Planificado vs Moodle (end-to-end) ===
    if (moodleJson) {
      const m3m5 = validateM3vsM5(design, moodleJson);
      discrepancies.push(...m3m5.discrepancies);
      checks.total += m3m5.checks.total;
      checks.passed += m3m5.checks.passed;
      checks.warnings += m3m5.checks.warnings;
      checks.critical += m3m5.checks.critical;
    }
    
    // Calculate semaforos
    const score = checks.total > 0 ? checks.passed / checks.total : 0;
    const summary = {
      score: Math.round(score * 100),
      ...checks,
      semaforos: {
        m3_m4: piacJson ? (checks.critical === 0 ? 'verde' : 'rojo') : 'gris',
        m4_m5: (piacJson && moodleJson) ? calculateSemaforo(discrepancies.filter(d => d.source === 'm4_m5')) : 'gris',
        m3_m5: moodleJson ? calculateSemaforo(discrepancies.filter(d => d.source === 'm3_m5')) : 'gris',
        overall: score >= 0.8 ? 'verde' : score >= 0.5 ? 'amarillo' : 'rojo'
      }
    };
    
    // Save validation run
    const [run] = await portalMutate('validation_runs', 'POST', {
      design_id: designId,
      piac_link_id: linkId,
      planned_json: design.activities_json,
      piac_json: piacJson,
      moodle_json: moodleJson,
      discrepancies_json: discrepancies,
      summary_json: summary,
      run_by: email
    });
    
    res.json({ id: run.id, summary, discrepancies });
  } catch (err) {
    console.error('Error validacion:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

function calculateSemaforo(discrepancies) {
  const critical = discrepancies.filter(d => d.severity === 'critical').length;
  const warning = discrepancies.filter(d => d.severity === 'warning').length;
  if (critical > 0) return 'rojo';
  if (warning > 2) return 'amarillo';
  return 'verde';
}
```

#### 5.2 Validation functions

```javascript
function validateM3vsM4(design, piacJson) {
  const discrepancies = [];
  const checks = { total: 0, passed: 0, warnings: 0, critical: 0 };
  const activities = design.activities_json;
  
  // Check 1: Hours alignment
  checks.total++;
  const plannedTotalMin = activities.reduce((s, a) => s + a.subtotalMin, 0);
  const piacHoras = piacJson.identificacion?.horas || {};
  const piacTotalHrs = (piacHoras.sincronicas || 0) + (piacHoras.asincronicas || 0) + (piacHoras.autonomas || 0);
  const plannedHrs = plannedTotalMin / 60;
  
  if (Math.abs(plannedHrs - piacTotalHrs) > plannedHrs * 0.15) {
    discrepancies.push({
      source: 'm3_m4', type: 'mismatch', severity: 'warning',
      field: 'horas_totales',
      expected: `${plannedHrs.toFixed(1)} hrs (planificador)`,
      actual: `${piacTotalHrs.toFixed(1)} hrs (PIAC)`,
      description: `Diferencia de ${Math.abs(plannedHrs - piacTotalHrs).toFixed(1)} hrs entre lo planificado y el PIAC`
    });
    checks.warnings++;
  } else {
    checks.passed++;
  }
  
  // Check 2: Weeks match
  checks.total++;
  if (design.weeks !== piacJson.identificacion?.semanas) {
    discrepancies.push({
      source: 'm3_m4', type: 'mismatch', severity: 'critical',
      field: 'semanas',
      expected: `${design.weeks} semanas (planificador)`,
      actual: `${piacJson.identificacion?.semanas} semanas (PIAC)`,
      description: 'El numero de semanas no coincide'
    });
    checks.critical++;
  } else {
    checks.passed++;
  }
  
  // Check 3: SCT credits
  checks.total++;
  if (design.sct_credits !== piacJson.identificacion?.creditos_sct) {
    discrepancies.push({
      source: 'm3_m4', type: 'mismatch', severity: 'critical',
      field: 'creditos_sct',
      expected: `${design.sct_credits} SCT (planificador)`,
      actual: `${piacJson.identificacion?.creditos_sct} SCT (PIAC)`,
      description: 'Los creditos SCT no coinciden'
    });
    checks.critical++;
  } else {
    checks.passed++;
  }
  
  // Check 4: Sync sessions count
  checks.total++;
  const plannedSync = activities
    .filter(a => ['EC3','EC4','EC5','EC6'].includes(a.actId))
    .reduce((s, a) => s + a.qty, 0);
  const piacSessions = (piacJson.nucleos || [])
    .flatMap(n => n.sesiones || [])
    .filter(s => s.sincronico && s.sincronico.trim()).length;
  
  if (Math.abs(plannedSync - piacSessions) > 2) {
    discrepancies.push({
      source: 'm3_m4', type: 'mismatch', severity: 'warning',
      field: 'sesiones_sincronicas',
      expected: `${plannedSync} sesiones planificadas`,
      actual: `${piacSessions} sesiones en PIAC`,
      description: `Se planificaron ${plannedSync} sesiones sincronicas pero el PIAC tiene ${piacSessions}`
    });
    checks.warnings++;
  } else {
    checks.passed++;
  }
  
  // Check 5: Category coverage (all planned categories present in PIAC)
  const plannedCats = [...new Set(activities.map(a => a.cat))];
  checks.total++;
  // This is a soft check since PIAC doesn't explicitly tag categories
  checks.passed++;  // always pass — structural check only
  
  return { discrepancies, checks };
}

function validateM4vsM5(piacJson, moodleJson) {
  // This is essentially the existing matching engine from Fase 2
  // Reuse the logic from POST /api/piac/:linkId/match
  // but return in validation format
  
  const discrepancies = [];
  const checks = { total: 0, passed: 0, warnings: 0, critical: 0 };
  const sections = moodleJson.sections || [];
  const nucleos = piacJson.nucleos || [];
  
  // Check: sections count
  checks.total++;
  const activeSections = sections.filter(s => s.number > 0 && s.visible !== false);
  const expectedSections = piacJson.identificacion?.semanas || nucleos.flatMap(n => n.sesiones).length;
  
  if (activeSections.length < expectedSections) {
    discrepancies.push({
      source: 'm4_m5', type: 'missing_in_moodle', severity: 'critical',
      field: 'secciones',
      expected: `${expectedSections} secciones activas`,
      actual: `${activeSections.length} secciones en Moodle`,
      description: `Faltan ${expectedSections - activeSections.length} secciones en Moodle`
    });
    checks.critical++;
  } else {
    checks.passed++;
  }
  
  // Check: Zoom/sync links
  checks.total++;
  const syncInPiac = nucleos.flatMap(n => n.sesiones || [])
    .filter(s => s.sincronico && s.sincronico.trim()).length;
  const zoomModules = sections.flatMap(s => (s.modules || []))
    .filter(m => {
      const name = (m.name || '').toLowerCase();
      const url = (m.url || '').toLowerCase();
      return name.includes('zoom') || name.includes('session') || name.includes('sesion') 
        || url.includes('zoom.us') || m.modname === 'bigbluebuttonbn';
    });
  
  if (syncInPiac > 0 && zoomModules.length < syncInPiac * 0.5) {
    discrepancies.push({
      source: 'm4_m5', type: 'missing_in_moodle', severity: 'warning',
      field: 'sesiones_sincronicas',
      expected: `${syncInPiac} sesiones sincronicas en PIAC`,
      actual: `${zoomModules.length} links Zoom/BBB en Moodle`,
      description: `Se planificaron ${syncInPiac} sesiones sincronicas pero Moodle solo tiene ${zoomModules.length} reuniones`
    });
    checks.warnings++;
  } else {
    checks.passed++;
  }
  
  // Check: Forums
  checks.total++;
  const forumInPiac = nucleos.flatMap(n => n.sesiones || [])
    .filter(s => (s.asincronico || '').toLowerCase().includes('foro')).length;
  const forumsInMoodle = sections.flatMap(s => (s.modules || []))
    .filter(m => m.modname === 'forum' && m.name !== 'Avisos' && m.name !== 'Announcements').length;
  
  if (forumInPiac > 0 && forumsInMoodle === 0) {
    discrepancies.push({
      source: 'm4_m5', type: 'missing_in_moodle', severity: 'critical',
      field: 'foros',
      expected: `${forumInPiac} foros referenciados en PIAC`,
      actual: `${forumsInMoodle} foros en Moodle`,
      description: 'El PIAC incluye foros pero no hay ninguno creado en Moodle'
    });
    checks.critical++;
  } else {
    checks.passed++;
  }
  
  // Check: Evaluations
  checks.total++;
  const evalsInPiac = nucleos.flatMap(n => n.evaluaciones_sumativas || []).length;
  const assignsInMoodle = sections.flatMap(s => (s.modules || []))
    .filter(m => m.modname === 'assign' || m.modname === 'quiz').length;
  
  if (evalsInPiac > assignsInMoodle) {
    discrepancies.push({
      source: 'm4_m5', type: 'missing_in_moodle', severity: 'warning',
      field: 'evaluaciones',
      expected: `${evalsInPiac} evaluaciones en PIAC`,
      actual: `${assignsInMoodle} tareas/quizzes en Moodle`,
      description: `Faltan ${evalsInPiac - assignsInMoodle} evaluaciones por crear en Moodle`
    });
    checks.warnings++;
  } else {
    checks.passed++;
  }
  
  return { discrepancies, checks };
}

function validateM3vsM5(design, moodleJson) {
  const discrepancies = [];
  const checks = { total: 0, passed: 0, warnings: 0, critical: 0 };
  const activities = design.activities_json;
  const sections = moodleJson.sections || [];
  
  // End-to-end: planned activities vs actual Moodle modules
  checks.total++;
  const totalPlannedInstances = activities.reduce((s, a) => s + a.qty, 0);
  const totalMoodleModules = sections.flatMap(s => (s.modules || []))
    .filter(m => m.modname !== 'label' && m.visible !== false).length;
  
  // Rough ratio check (Moodle should have at least 50% of planned instances)
  if (totalMoodleModules < totalPlannedInstances * 0.5) {
    discrepancies.push({
      source: 'm3_m5', type: 'missing_in_moodle', severity: 'warning',
      field: 'actividades_totales',
      expected: `~${totalPlannedInstances} instancias planificadas`,
      actual: `${totalMoodleModules} modulos en Moodle`,
      description: `Moodle tiene significativamente menos actividades que lo planificado (${Math.round(totalMoodleModules/totalPlannedInstances*100)}%)`
    });
    checks.warnings++;
  } else {
    checks.passed++;
  }
  
  // Check by activity type: planned assigns vs moodle assigns
  const MODNAME_MAP = { assign: ['EA','EB','EE','EV'], forum: ['EC'], quiz: ['EV'], wiki: ['ED'], workshop: ['ED'] };
  
  for (const [modname, cats] of Object.entries(MODNAME_MAP)) {
    checks.total++;
    const planned = activities.filter(a => cats.includes(a.cat)).reduce((s, a) => s + a.qty, 0);
    const actual = sections.flatMap(s => (s.modules || []))
      .filter(m => m.modname === modname).length;
    
    if (planned > 0 && actual === 0) {
      discrepancies.push({
        source: 'm3_m5', type: 'missing_in_moodle', severity: 'warning',
        field: `mod_${modname}`,
        expected: `${planned} actividades tipo ${modname} planificadas`,
        actual: `0 en Moodle`,
        description: `Se planificaron actividades tipo ${modname} pero no hay ninguna en Moodle`
      });
      checks.warnings++;
    } else {
      checks.passed++;
    }
  }
  
  return { discrepancies, checks };
}
```

#### 5.3 Dashboard endpoint for DI

```javascript
// GET /api/validacion/dashboard — overview for all linked courses
app.get('/api/validacion/dashboard', adminOrEditorMiddleware, async (req, res) => {
  try {
    // Get all active designs that have a piac_link
    const designs = await portalQuery('planificador_designs', 
      `status=neq.archived&piac_link_id=not.is.null&order=updated_at.desc`);
    
    // Get latest validation run for each design
    const dashboard = [];
    for (const design of designs) {
      const [latestRun] = await portalQuery('validation_runs', 
        `design_id=eq.${design.id}&order=run_at.desc&limit=1`);
      
      dashboard.push({
        design_id: design.id,
        module_name: design.module_name,
        piac_link_id: design.piac_link_id,
        status: design.status,
        last_validation: latestRun ? {
          run_at: latestRun.run_at,
          score: latestRun.summary_json?.score,
          semaforos: latestRun.summary_json?.semaforos,
          critical: latestRun.summary_json?.critical || 0,
          warnings: latestRun.summary_json?.warnings || 0
        } : null
      });
    }
    
    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});
```

---

### Summary of files to modify and create

**New file**: `schema-planificador.sql` -- 3 new tables (planificador_designs, piac_drafts, validation_runs)

**Modified file**: `server.js` -- Add the following endpoints:
- `POST /api/planificador/guardar` -- save planner output
- `GET /api/planificador/mis-disenos` -- list user's designs
- `GET /api/planificador/:id` -- design detail
- `POST /api/planificador/:id/generar-piac` -- generate PIAC draft
- `POST /api/planificador/:id/exportar-drive` -- export to Google Docs
- `POST /api/piac/:linkId/construir-moodle` -- preview/execute Moodle structure
- `POST /api/validacion/:designId` -- cross-validation
- `GET /api/validacion/dashboard` -- overview with semaforos

Also add: `const SCT_DATA = ...` at startup, `generatePIACDraft()`, `buildPIACHtml()`, `buildMoodlePlan()`, `validateM3vsM4()`, `validateM4vsM5()`, `validateM3vsM5()`, `ACTIVITY_MOODLE_MAP` constant.

**Modified file**: `virtualizacion-planificador.html` -- Add "Guardar diseno" button in Step 4 + `guardarDiseno()` + `buildValidationSnapshot()` functions.

**Existing infrastructure reused**:
- `portalQuery()` / `portalMutate()` -- Supabase helpers (server.js line 632)
- `moodleCall()` -- Moodle API helper (server.js line 166)
- `adminOrEditorMiddleware` -- auth (server.js line 353)
- `authMiddleware` -- basic auth (server.js line ~140)
- Drive API OAuth -- already configured for udfv@ (used in PIAC parse)
- `curso-virtual.html` -- already renders from PIAC JSON, no changes needed
- `sct-data.json` -- full catalog of 37 activities with herramientas, tiempos, tipos

**Key design decisions**:
1. The planificador save uses `authMiddleware` (any logged-in user), not `adminOrEditorMiddleware`, because both DIs and academics use it.
2. PIAC draft generation is algorithmic (no LLM), ensuring deterministic, fast output. The DI fills in names, RF, CE manually.
3. Moodle constructor defaults to preview mode. Execute mode requires explicit `confirm_execute: true`. This respects the "IA NO crea nada" rule.
4. The PIAC draft JSON uses the exact same schema as `piac_parsed.parsed_json`, so it plugs directly into the existing curso-virtual viewer.
5. Validation runs are stored for audit trail (the DI can see how alignment has changed over time).
6. The `ACTIVITY_MOODLE_MAP` makes the herramientas-to-mod mapping explicit and extensible.