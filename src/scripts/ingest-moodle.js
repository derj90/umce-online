#!/usr/bin/env node
/**
 * Ingest Moodle Course Data → Supabase document_chunks
 *
 * Fetches course structure from 5 Moodle platforms and inserts
 * text chunks into Supabase for RAG search by the assistant.
 *
 * Usage:
 *   node scripts/ingest-moodle.js                  # all platforms
 *   node scripts/ingest-moodle.js virtual           # single platform
 *   node scripts/ingest-moodle.js --dry-run         # preview without inserting
 *
 * Designed to run via cron on the VPS (daily).
 */

const fs = require('fs');
const path = require('path');

// Load .env
try {
  const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  });
} catch { /* .env optional */ }

const PLATFORMS = {
  virtual: {
    url: 'https://virtual.umce.cl',
    token: process.env.MOODLE_VIRTUAL_TOKEN || '10b0ea3a46c69cc60fae492adb19f629',
    nombre: 'Virtual',
    uso: 'Cursos regulares pregrado',
    skipSSL: false,
  },
  evirtual: {
    url: 'https://evirtual.umce.cl',
    token: process.env.MOODLE_EVIRTUAL_TOKEN || 'dd88f11c1060da27e538bc06c258c8b8',
    nombre: 'eVirtual',
    uso: 'Formación continua y extensión',
    skipSSL: false,
    useByField: true,
  },
  practica: {
    url: 'https://evirtual-practica.umce.cl',
    token: process.env.MOODLE_PRACTICA_TOKEN || '366b5a834e5df83eea8568ce1bae3128',
    nombre: 'Práctica',
    uso: 'Prácticas profesionales',
    skipSSL: true,
  },
  pregrado: {
    url: 'https://evirtual-pregrado.umce.cl',
    token: process.env.MOODLE_PREGRADO_TOKEN || '3a2d94fc296693d925772bb74894d9f2',
    nombre: 'Pregrado',
    uso: 'Apoyo asignaturas pregrado',
    skipSSL: false,
  },
  postgrado: {
    url: 'https://evirtual-postgrado.umce.cl',
    token: process.env.MOODLE_POSTGRADO_TOKEN || '38969fd7e3d3fd417ee58f0241e98d4a',
    nombre: 'Postgrado',
    uso: 'Programas de postgrado (Moodle 3.8)',
    skipSSL: false,
  },
};

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supabase.udfv.cloud';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SOURCE_ID = 'moodle-ingest-v1';
const CHUNK_MAX_LENGTH = 1200;
const DRY_RUN = process.argv.includes('--dry-run');
const TARGET_PLATFORM = process.argv.find(a => PLATFORMS[a]);

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // for practica SSL
}

// ==========================================
// Moodle API helpers
// ==========================================
async function moodleCall(platform, wsfunction, params = {}) {
  const cfg = PLATFORMS[platform];
  const urlParams = new URLSearchParams({
    wstoken: cfg.token,
    wsfunction,
    moodlewsrestformat: 'json',
    ...params,
  });
  try {
    const res = await fetch(`${cfg.url}/webservice/rest/server.php?${urlParams}`, {
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    if (data && data.exception) {
      console.warn(`  [${platform}] ${wsfunction}: ${data.message}`);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`  [${platform}] ${wsfunction} error: ${err.message}`);
    return null;
  }
}

async function getCourses(platform) {
  const cfg = PLATFORMS[platform];
  if (cfg.useByField) {
    const result = await moodleCall(platform, 'core_course_get_courses_by_field');
    return result?.courses || [];
  }
  return await moodleCall(platform, 'core_course_get_courses') || [];
}

async function getCourseContents(platform, courseId) {
  return await moodleCall(platform, 'core_course_get_contents', { courseid: courseId }) || [];
}

async function getEnrolledCount(platform, courseId) {
  const users = await moodleCall(platform, 'core_enrol_get_enrolled_users', { courseid: courseId });
  if (!Array.isArray(users)) return { students: 0, teachers: 0 };
  let students = 0, teachers = 0;
  for (const u of users) {
    const roles = (u.roles || []).map(r => r.roleid);
    if (roles.some(r => [1, 2, 3, 4].includes(r))) teachers++;
    else students++;
  }
  return { students, teachers };
}

// ==========================================
// Text generation
// ==========================================
function courseToText(platform, course, sections, enrolled) {
  const cfg = PLATFORMS[platform];
  const lines = [];

  lines.push(`# Curso: ${course.fullname}`);
  lines.push(`Plataforma: ${cfg.nombre} (${cfg.url})`);
  lines.push(`Nombre corto: ${course.shortname || 'N/A'}`);
  if (course.categoryname) lines.push(`Categoría: ${course.categoryname}`);
  lines.push(`Inscritos: ${enrolled.students} estudiantes, ${enrolled.teachers} docentes`);
  lines.push(`URL: ${cfg.url}/course/view.php?id=${course.id}`);
  lines.push('');

  if (course.summary) {
    const cleanSummary = course.summary
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanSummary.length > 10) {
      lines.push(`Descripción: ${cleanSummary.substring(0, 500)}`);
      lines.push('');
    }
  }

  if (sections && sections.length > 0) {
    lines.push('## Estructura del curso');
    for (const section of sections) {
      const sectionName = section.name || `Sección ${section.section}`;
      const modules = section.modules || [];
      if (modules.length === 0 && !section.summary) continue;

      lines.push(`\n### ${sectionName}`);
      if (section.summary) {
        const cleanSum = section.summary.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (cleanSum.length > 10) lines.push(cleanSum.substring(0, 300));
      }

      const byType = {};
      for (const mod of modules) {
        const type = mod.modname || 'otro';
        if (!byType[type]) byType[type] = [];
        byType[type].push(mod.name || 'Sin nombre');
      }

      for (const [type, names] of Object.entries(byType)) {
        const typeLabel = {
          assign: 'Tareas', quiz: 'Cuestionarios', forum: 'Foros',
          resource: 'Recursos', url: 'Enlaces', page: 'Páginas',
          label: 'Etiquetas', folder: 'Carpetas', book: 'Libros',
          workshop: 'Talleres', glossary: 'Glosarios', wiki: 'Wikis',
          choice: 'Consultas', feedback: 'Encuestas', lesson: 'Lecciones',
          data: 'Bases de datos', scorm: 'SCORM', h5pactivity: 'H5P',
          attendance: 'Asistencia', bigbluebuttonbn: 'BigBlueButton',
          jitsi: 'Jitsi', zoom: 'Zoom',
        }[type] || type;
        lines.push(`- ${typeLabel}: ${names.join(', ')}`);
      }
    }
  }

  return lines.join('\n');
}

function chunkText(text, courseId, platform) {
  // Split by section headers or by max length
  const chunks = [];
  const paragraphs = text.split(/\n### /);

  for (let i = 0; i < paragraphs.length; i++) {
    let paragraph = i === 0 ? paragraphs[i] : '### ' + paragraphs[i];

    // If paragraph is too long, split further
    while (paragraph.length > CHUNK_MAX_LENGTH) {
      const cutPoint = paragraph.lastIndexOf('\n', CHUNK_MAX_LENGTH);
      const cut = cutPoint > CHUNK_MAX_LENGTH / 2 ? cutPoint : CHUNK_MAX_LENGTH;
      chunks.push(paragraph.substring(0, cut));
      paragraph = paragraph.substring(cut).trim();
    }
    if (paragraph.trim()) chunks.push(paragraph.trim());
  }

  return chunks.map((content, idx) => ({
    content,
    metadata: {
      source: 'moodle-course',
      source_id: `${platform}-course-${courseId}`,
      platform,
      course_id: courseId,
      chunk_index: idx,
    },
  }));
}

// ==========================================
// Supabase operations
// ==========================================
async function deleteOldChunks(platform) {
  if (DRY_RUN) return;
  try {
    // Delete chunks from this platform's courses
    await fetch(
      `${SUPABASE_URL}/rest/v1/document_chunks?metadata->>source=eq.moodle-course&metadata->>platform=eq.${platform}`,
      {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
  } catch (err) {
    console.warn(`  Error deleting old chunks for ${platform}: ${err.message}`);
  }
}

async function insertChunks(chunks) {
  if (DRY_RUN || chunks.length === 0) return;
  // Insert in batches of 100
  for (let i = 0; i < chunks.length; i += 100) {
    const batch = chunks.slice(i, i + 100);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/document_chunks`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        const err = await res.text();
        console.warn(`  Insert error batch ${i}: ${err.substring(0, 200)}`);
      }
    } catch (err) {
      console.warn(`  Insert error batch ${i}: ${err.message}`);
    }
  }
}

// ==========================================
// Main
// ==========================================
async function ingestPlatform(platform) {
  const cfg = PLATFORMS[platform];
  console.log(`\n=== ${cfg.nombre} (${cfg.url}) ===`);

  const courses = await getCourses(platform);
  if (!courses.length) {
    console.log('  Sin cursos, saltando.');
    return { courses: 0, chunks: 0 };
  }

  // Filter: skip site course (id=1) and courses with no content
  const validCourses = courses.filter(c => c.id !== 1 && c.fullname);
  console.log(`  ${validCourses.length} cursos válidos`);

  // Delete old chunks for this platform
  await deleteOldChunks(platform);

  let totalChunks = 0;
  const allChunks = [];

  for (let i = 0; i < validCourses.length; i++) {
    const course = validCourses[i];
    if (i % 50 === 0 && i > 0) console.log(`  Procesando ${i}/${validCourses.length}...`);

    // Get course structure (rate-limited: 1 call per course)
    const sections = await getCourseContents(platform, course.id);

    // Get enrollment count (only for courses with content)
    const hasContent = sections && sections.some(s => (s.modules || []).length > 0);
    let enrolled = { students: 0, teachers: 0 };
    if (hasContent) {
      enrolled = await getEnrolledCount(platform, course.id);
    }

    // Generate text and chunks
    const text = courseToText(platform, course, sections, enrolled);
    const chunks = chunkText(text, course.id, platform);
    totalChunks += chunks.length;
    allChunks.push(...chunks);

    // Small delay to avoid overwhelming Moodle API
    if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));
  }

  // Insert all chunks
  if (!DRY_RUN) {
    console.log(`  Insertando ${allChunks.length} chunks...`);
    await insertChunks(allChunks);
  }

  console.log(`  ${cfg.nombre}: ${validCourses.length} cursos → ${totalChunks} chunks${DRY_RUN ? ' (dry-run)' : ''}`);
  return { courses: validCourses.length, chunks: totalChunks };
}

async function main() {
  console.log(`Moodle Ingestion ${DRY_RUN ? '(DRY RUN)' : ''} — ${new Date().toISOString()}`);

  if (!SUPABASE_KEY && !DRY_RUN) {
    console.error('SUPABASE_SERVICE_KEY not set. Use --dry-run to preview.');
    process.exit(1);
  }

  const platforms = TARGET_PLATFORM ? [TARGET_PLATFORM] : Object.keys(PLATFORMS);
  let totalCourses = 0, totalChunks = 0;

  for (const platform of platforms) {
    const result = await ingestPlatform(platform);
    totalCourses += result.courses;
    totalChunks += result.chunks;
  }

  console.log(`\n=== TOTAL: ${totalCourses} cursos → ${totalChunks} chunks ===`);

  // Save profile summary to assistant_course_profiles (future use)
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
