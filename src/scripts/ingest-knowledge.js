#!/usr/bin/env node
/**
 * Ingest local knowledge documents into Supabase document_chunks.
 * Reads .md files from scripts/knowledge/ and inserts them as chunks.
 *
 * Usage: SUPABASE_SERVICE_KEY=xxx node scripts/ingest-knowledge.js
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supabase.udfv.cloud';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_KEY required');
  process.exit(1);
}

function chunkText(text, sourceId, fileName) {
  const chunks = [];
  // Split by headings
  const sections = text.split(/^## /m);

  for (let i = 0; i < sections.length; i++) {
    let section = i === 0 ? sections[i] : '## ' + sections[i];

    // Further split if section is too long
    while (section.length > CHUNK_SIZE) {
      const cutPoint = section.lastIndexOf('\n', CHUNK_SIZE);
      const cut = cutPoint > CHUNK_SIZE / 3 ? cutPoint : CHUNK_SIZE;
      chunks.push({
        content: section.substring(0, cut).trim(),
        metadata: { source: 'knowledge-doc', source_id: sourceId, file: fileName, chunk_index: chunks.length },
      });
      section = section.substring(cut).trim();
    }
    if (section.trim().length > 20) {
      chunks.push({
        content: section.trim(),
        metadata: { source: 'knowledge-doc', source_id: sourceId, file: fileName, chunk_index: chunks.length },
      });
    }
  }
  return chunks;
}

async function deleteOldKnowledgeChunks() {
  await fetch(
    `${SUPABASE_URL}/rest/v1/document_chunks?metadata->>source=eq.knowledge-doc`,
    {
      method: 'DELETE',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    }
  );
}

async function insertChunks(chunks) {
  for (let i = 0; i < chunks.length; i += 50) {
    const batch = chunks.slice(i, i + 50);
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
    if (!res.ok) console.warn(`Insert error: ${await res.text()}`);
  }
}

async function main() {
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} knowledge documents`);

  // Delete old knowledge chunks
  await deleteOldKnowledgeChunks();
  console.log('Deleted old knowledge-doc chunks');

  let totalChunks = 0;
  const allChunks = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf8');
    const sourceId = `knowledge-${file.replace('.md', '')}`;
    const chunks = chunkText(content, sourceId, file);
    allChunks.push(...chunks);
    totalChunks += chunks.length;
    console.log(`  ${file}: ${chunks.length} chunks`);
  }

  await insertChunks(allChunks);
  console.log(`\nInserted ${totalChunks} knowledge chunks`);
}

main().catch(err => { console.error(err); process.exit(1); });
