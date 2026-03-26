const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const mammoth = require('mammoth');
const { google } = require('googleapis');

// Load .env manually (no dotenv dependency needed)
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  });
} catch (e) { /* .env optional if vars set externally */ }

const app = express();
app.use(express.json({ limit: '100kb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Simple in-memory rate limiter for API routes
const rateLimitMap = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now - entry.start > windowMs) {
      rateLimitMap.set(key, { start: now, count: 1 });
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({ error: 'Demasiadas peticiones. Intenta en unos minutos.' });
    }
    next();
  };
}
// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.start > 600000) rateLimitMap.delete(key);
  }
}, 300000);

// Rate limit auth routes (10 per minute) and API routes (60 per minute)
app.use('/auth', rateLimit(60000, 10));
app.use('/api', rateLimit(60000, 60));

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'https://umce.online';
const COOKIE_NAME = 'umce_session';

// One-time tokens for mobile app OAuth flow (token -> {name, email, remember, created})
const appAuthTokens = new Map();

// --- Cookie helpers ---
function parseCookies(req) {
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const [key, ...val] = c.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(val.join('='));
  });
  return cookies;
}

function setSessionCookie(res, token, maxAge) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge || 24 * 60 * 60}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}

// --- Moodle platforms config ---
const PLATFORMS = [
  {
    id: 'evirtual',
    name: 'eVirtual',
    description: 'Formación continua y diplomados',
    url: process.env.MOODLE_EVIRTUAL_URL,
    token: process.env.MOODLE_EVIRTUAL_TOKEN,
    color: '#0033A1'
  },
  {
    id: 'practica',
    name: 'Práctica',
    description: 'Experimentación pedagógica',
    url: process.env.MOODLE_PRACTICA_URL,
    token: process.env.MOODLE_PRACTICA_TOKEN,
    color: '#E9511D'
  },
  {
    id: 'virtual',
    name: 'Virtual',
    description: 'Apoyo a la docencia presencial',
    url: process.env.MOODLE_VIRTUAL_URL,
    token: process.env.MOODLE_VIRTUAL_TOKEN,
    color: '#003F6E'
  },
  {
    id: 'pregrado',
    name: 'Pregrado',
    description: 'Carreras de pregrado',
    url: process.env.MOODLE_PREGRADO_URL,
    token: process.env.MOODLE_PREGRADO_TOKEN,
    color: '#127C29'
  },
  {
    id: 'postgrado',
    name: 'Postgrado',
    description: 'Magíster y diplomados de postgrado',
    url: process.env.MOODLE_POSTGRADO_URL,
    token: process.env.MOODLE_POSTGRADO_TOKEN,
    color: '#90120D'
  }
];

// --- Session token helpers ---
function createToken(username, email, maxAgeSec) {
  const ttl = maxAgeSec || 24 * 60 * 60;
  const payload = `${username}|${email}|${Date.now()}|${ttl}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}|${hmac}`).toString('base64');
}

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 5) return null;
    const [username, email, timestamp, ttl, hmac] = parts;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(`${username}|${email}|${timestamp}|${ttl}`).digest('hex');
    if (hmac !== expected) return null;
    if (Date.now() - parseInt(timestamp) > parseInt(ttl) * 1000) return null;
    return { username, email };
  } catch { return null; }
}

// --- Moodle API helper ---
async function moodleCall(platform, wsfunction, params = {}) {
  const url = new URL('/webservice/rest/server.php', platform.url);
  const body = new URLSearchParams({
    wstoken: platform.token,
    wsfunction,
    moodlewsrestformat: 'json',
    ...params
  });

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(10000)
  });

  const data = await res.json();
  if (data.exception) throw new Error(`${platform.id}: ${data.message}`);
  return data;
}

// --- Validate credentials against Moodle login/token.php ---
async function validateMoodleLogin(platform, username, password) {
  const url = new URL('/login/token.php', platform.url);
  const body = new URLSearchParams({
    username,
    password,
    service: 'moodle_mobile_app'
  });

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(10000)
  });

  const data = await res.json();
  // Success returns { token: "xxx" }, failure returns { error: "...", errorcode: "..." }
  return !data.error && data.token;
}

// --- Find user by username in a platform ---
async function findUserByUsername(platform, username) {
  const users = await moodleCall(platform, 'core_user_get_users', {
    'criteria[0][key]': 'username',
    'criteria[0][value]': username
  });
  return users.users && users.users.length > 0 ? users.users[0] : null;
}

// --- Get enrolled courses for a user ---
async function getUserCourses(platform, userId) {
  return moodleCall(platform, 'core_enrol_get_users_courses', { userid: userId });
}

// --- Filter and enrich courses (2026 only, active) ---
const YEAR_2026_START = new Date('2026-01-01T00:00:00Z').getTime() / 1000;
const YEAR_2027_START = new Date('2027-01-01T00:00:00Z').getTime() / 1000;

function enrichCourse(c, platform) {
  return {
    id: c.id,
    fullname: c.fullname,
    shortname: c.shortname,
    format: c.format || null,
    summary: (c.summary || '').replace(/<[^>]*>/g, '').substring(0, 200),
    startdate: c.startdate ? new Date(c.startdate * 1000).toISOString().split('T')[0] : null,
    enddate: c.enddate && c.enddate > 0 ? new Date(c.enddate * 1000).toISOString().split('T')[0] : null,
    year: c.startdate ? new Date(c.startdate * 1000).getFullYear() : null,
    progress: c.progress != null ? Math.round(c.progress) : null,
    courseImage: c.courseimage || (c.overviewfiles && c.overviewfiles[0] ? c.overviewfiles[0].fileurl.replace('/webservice/pluginfile.php/', '/pluginfile.php/') : null),
    courseUrl: `${platform.url}/course/view.php?id=${c.id}`,
    platform: { id: platform.id, name: platform.name, color: platform.color, url: platform.url }
  };
}

// --- Detect singleactivity URL courses that redirect to another platform ---
async function resolveRedirects(courses, sourcePlatform) {
  const redirectCourses = courses.filter(c => c.format === 'singleactivity');
  if (redirectCourses.length === 0) return courses;

  await Promise.all(redirectCourses.map(async (course) => {
    try {
      const contents = await moodleCall(sourcePlatform, 'core_course_get_contents', { courseid: course.id });
      // Find URL module in first section
      const firstSection = contents && contents[0];
      if (!firstSection || !firstSection.modules) return;
      const urlMod = firstSection.modules.find(m => m.modname === 'url' && m.contents && m.contents[0]);
      if (!urlMod) return;
      const targetUrl = urlMod.contents[0].fileurl;
      if (!targetUrl) return;
      // Check if target URL matches another platform
      const targetPlatform = PLATFORMS.find(p => p.url && targetUrl.startsWith(p.url) && p.id !== sourcePlatform.id);
      if (targetPlatform) {
        course.courseUrl = targetUrl;
        course.platform = { id: targetPlatform.id, name: targetPlatform.name, color: targetPlatform.color, url: targetPlatform.url };
      }
    } catch (e) {
      // Silently ignore — keep original platform
    }
  }));
  return courses;
}

function isActive2026(c) {
  const start = c.startdate || 0;
  const end = c.enddate || 0;
  if (start >= YEAR_2027_START) return false;
  if (end > 0 && end < YEAR_2026_START) return false;
  return true;
}

function filterAndEnrich(courses, platform) {
  return courses.filter(c => c.visible && isActive2026(c)).map(c => enrichCourse(c, platform));
}

function filterHistorical(courses, platform) {
  return courses.filter(c => c.visible && !isActive2026(c)).map(c => enrichCourse(c, platform));
}

// --- Helper: find user by email ---
async function findUserByEmail(platform, email) {
  const users = await moodleCall(platform, 'core_user_get_users', {
    'criteria[0][key]': 'email',
    'criteria[0][value]': email
  });
  return users.users && users.users.length > 0 ? users.users[0] : null;
}

// --- Helper: query all platforms for a user ---
async function queryAllPlatforms(email, filterFn) {
  return Promise.all(
    PLATFORMS.map(async (platform) => {
      try {
        const user = await findUserByEmail(platform, email);
        if (!user) return { platform: platform.id, platformName: platform.name, platformColor: platform.color, courses: [], found: false };

        const courses = await getUserCourses(platform, user.id);
        const filtered = filterFn(courses, platform);
        // Detect singleactivity URL courses redirecting to another platform
        await resolveRedirects(filtered, platform);

        return {
          platform: platform.id,
          platformName: platform.name,
          platformColor: platform.color,
          userName: user.fullname,
          courses: filtered,
          found: true
        };
      } catch (err) {
        return { platform: platform.id, platformName: platform.name, platformColor: platform.color, error: err.message, courses: [], found: false };
      }
    })
  );
}

// --- Validate email ---
function validateEmail(email) {
  if (!email || !email.includes('@')) return 'Se requiere un email válido';
  if (!email.toLowerCase().endsWith('@umce.cl')) return 'Solo se permiten correos @umce.cl';
  return null;
}

// --- Auth middleware ---
function authMiddleware(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Sesión expirada' });

  req.userEmail = user.email;
  req.userName = user.username;
  next();
}

// --- Admin config ---
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'david.reyes_j@umce.cl,udfv@umce.cl').split(',').map(e => e.trim().toLowerCase());
const EDITOR_EMAILS = (process.env.EDITOR_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

function isAdmin(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase());
}

function isEditor(email) {
  return EDITOR_EMAILS.includes((email || '').toLowerCase());
}

function getUserRole(email) {
  const e = (email || '').toLowerCase();
  if (ADMIN_EMAILS.includes(e)) return 'admin';
  if (EDITOR_EMAILS.includes(e)) return 'editor';
  return null;
}

// Middleware: admin or editor
function adminOrEditorMiddleware(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Sesión expirada' });
  const role = getUserRole(user.email);
  if (!role) return res.status(403).json({ error: 'No autorizado' });
  req.userEmail = user.email;
  req.userName = user.username;
  req.userRole = role;
  next();
}

// Helper: resolve target email (admin can override with ?email= param)
function resolveTargetEmail(req) {
  const ownEmail = req.userEmail;
  const targetEmail = req.query.email;
  if (targetEmail && isAdmin(ownEmail)) {
    const err = validateEmail(targetEmail);
    if (err) return { email: ownEmail, impersonating: false };
    return { email: targetEmail.toLowerCase(), impersonating: true };
  }
  return { email: ownEmail, impersonating: false };
}

// --- Admin API: check if current user is admin ---
app.get('/api/admin/check', authMiddleware, (req, res) => {
  res.json({ isAdmin: isAdmin(req.userEmail) });
});

// --- Google OAuth routes ---
app.get('/auth/login', (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.status(500).send('Google OAuth no configurado');

  const remember = req.query.remember === '1';
  const fromApp = req.query.from_app === '1';
  const state = JSON.stringify({ nonce: crypto.randomBytes(16).toString('hex'), remember, fromApp });
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${BASE_URL}/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
    hd: 'umce.cl'
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/auth/callback', async (req, res) => {
  const { code, error, state: stateParam } = req.query;
  if (error || !code) return res.redirect('/mis-cursos?error=auth_denied');

  let remember = false;
  try { remember = JSON.parse(stateParam).remember === true; } catch {}

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/auth/callback`,
        grant_type: 'authorization_code'
      }).toString()
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userInfo = await userRes.json();

    const email = (userInfo.email || '').toLowerCase();
    if (!email.endsWith('@umce.cl')) {
      return res.redirect('/mis-cursos?error=domain');
    }

    const name = userInfo.name || email.split('@')[0];
    const maxAge = remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

    // Mobile app flow: redirect to custom URL scheme with one-time token
    let fromApp = false;
    try { fromApp = JSON.parse(stateParam).fromApp === true; } catch {}

    if (fromApp) {
      const appToken = crypto.randomBytes(32).toString('hex');
      appAuthTokens.set(appToken, { name, email, maxAge, created: Date.now() });
      // Clean up expired tokens (older than 2 minutes)
      for (const [k, v] of appAuthTokens) {
        if (Date.now() - v.created > 120000) appAuthTokens.delete(k);
      }
      return res.redirect(`cl.umce.virtual://auth-complete?token=${appToken}`);
    }

    const token = createToken(name, email, maxAge);
    setSessionCookie(res, token, maxAge);
    res.redirect('/mis-cursos');

  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.redirect('/mis-cursos?error=auth_failed');
  }
});

// Mobile app: exchange one-time token for session cookie
app.get('/auth/app-session', (req, res) => {
  const appToken = req.query.token;
  if (!appToken) return res.redirect('/mis-cursos?error=missing_token');

  const data = appAuthTokens.get(appToken);
  if (!data) return res.redirect('/mis-cursos?error=invalid_token');

  // One-time use: delete immediately
  appAuthTokens.delete(appToken);

  // Check expiry (2 minutes max)
  if (Date.now() - data.created > 120000) {
    return res.redirect('/mis-cursos?error=token_expired');
  }

  const token = createToken(data.name, data.email, data.maxAge);
  setSessionCookie(res, token, data.maxAge);
  res.redirect('/mis-cursos');
});

app.get('/auth/logout', (req, res) => {
  clearSessionCookie(res);
  res.redirect('/');
});

app.get('/auth/me', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Sesión expirada' });

  res.json({ email: user.email, name: user.username });
});

// --- Static files ---
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0, etag: false }));

// --- Uploads config ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = path.basename(file.originalname, ext).toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      cb(null, `${Date.now()}-${name}${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido'));
  }
});

// --- API: Active 2026 courses (authenticated) ---
app.get('/api/mis-cursos', authMiddleware, async (req, res) => {
  const { email, impersonating } = resolveTargetEmail(req);

  const platforms = await queryAllPlatforms(email, filterAndEnrich);
  const totalCourses = platforms.reduce((sum, r) => sum + r.courses.length, 0);
  const userName = platforms.find(r => r.userName)?.userName || (impersonating ? email.split('@')[0] : req.userName);

  res.json({ email, userName, totalCourses, platforms, impersonating });
});

// --- API: Historical courses (authenticated) ---
app.get('/api/historial', authMiddleware, async (req, res) => {
  const { email } = resolveTargetEmail(req);

  const platforms = await queryAllPlatforms(email, filterHistorical);
  const allHistorical = platforms.flatMap(p => p.courses);
  const years = [...new Set(allHistorical.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);

  res.json({ totalCourses: allHistorical.length, years, platforms });
});

// --- Supabase UCampus config ---
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supabase.udfv.cloud';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Helper: query Supabase REST API (ucampus schema)
async function supabaseQuery(table, params = '') {
  if (!SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY no configurado');
  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Accept-Profile': 'ucampus',
      'Accept': 'application/json'
    },
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${table}: ${res.status} ${text}`);
  }
  return res.json();
}

// Helper: query Supabase REST API (portal schema)
async function portalQuery(table, params = '') {
  if (!SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY no configurado');
  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Accept-Profile': 'portal',
      'Accept': 'application/json'
    },
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Portal ${table}: ${res.status} ${text}`);
  }
  return res.json();
}

async function portalMutate(table, method, body, params = '') {
  if (!SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY no configurado');
  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Profile': 'portal',
      'Accept-Profile': 'portal',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: body != null ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Portal mutate ${table}: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// === Moodle Identity Resolution ===
// Resolve umce email → Moodle userid, with caching in user_moodle_mapping
async function resolveMoodleUserId(email, platformId) {
  if (!email) return null;
  // Check cache first
  const cached = await portalQuery('user_moodle_mapping',
    `umce_email=eq.${encodeURIComponent(email)}&moodle_platform=eq.${platformId}&limit=1`);
  if (cached.length > 0) return cached[0].moodle_userid;

  // Call Moodle API
  const platform = PLATFORMS.find(p => p.id === platformId);
  if (!platform || !platform.url || !platform.token) return null;
  try {
    const users = await moodleCall(platform, 'core_user_get_users_by_field', {
      field: 'email', 'values[0]': email
    });
    if (!users || users.length === 0) return null;
    const user = users[0];
    // Cache it
    await portalMutate('user_moodle_mapping', 'POST', {
      umce_email: email, moodle_platform: platformId,
      moodle_userid: user.id, moodle_username: user.username
    }).catch(() => {}); // ignore duplicate conflict
    return user.id;
  } catch (err) {
    console.error(`Identity resolve error [${platformId}/${email}]:`, err.message);
    return null;
  }
}

// Fetch completion data for a user in a course
async function fetchCompletion(platformId, courseId, userId) {
  const platform = PLATFORMS.find(p => p.id === platformId);
  if (!platform) return null;
  try {
    const data = await moodleCall(platform, 'core_completion_get_activities_completion_status', {
      courseid: courseId, userid: userId
    });
    return (data.statuses || []).reduce((acc, s) => {
      acc[s.cmid] = { state: s.state, tracking: s.tracking, timecompleted: s.timecompleted };
      return acc;
    }, {});
  } catch { return null; }
}

// Fetch grades for a user in a course
async function fetchGrades(platformId, courseId, userId) {
  const platform = PLATFORMS.find(p => p.id === platformId);
  if (!platform) return null;
  try {
    const data = await moodleCall(platform, 'gradereport_user_get_grade_items', {
      courseid: courseId, userid: userId
    });
    const grades = data.usergrades?.[0]?.gradeitems || [];
    return grades.map(g => ({
      id: g.id, itemname: g.itemname, itemtype: g.itemtype, itemmodule: g.itemmodule,
      cmid: g.cmid, graderaw: g.graderaw, gradeformatted: g.gradeformatted,
      feedback: (g.feedback || '').replace(/<[^>]*>/g, '').substring(0, 300),
      grademin: g.grademin, grademax: g.grademax, percentageformatted: g.percentageformatted
    }));
  } catch { return null; }
}

// Fetch cached recordings for a course
async function fetchCachedRecordings(platformId, courseId) {
  const cached = await portalQuery('cache_recordings',
    `moodle_platform=eq.${platformId}&moodle_course_id=eq.${courseId}&limit=1`);
  return cached[0]?.recordings_json || null;
}

// Fetch cached calendar for a course
async function fetchCachedCalendar(platformId, courseId) {
  const cached = await portalQuery('cache_calendar',
    `moodle_platform=eq.${platformId}&moodle_course_id=eq.${courseId}&limit=1`);
  return cached[0]?.events_json || null;
}

// === Firebase Admin / Push Notifications ===
// Requires: FIREBASE_SERVICE_ACCOUNT_JSON (stringified JSON) or FIREBASE_SERVICE_ACCOUNT_PATH (file path)

let _firebaseApp = null;
let _firebaseMessaging = null;

function getFirebaseMessaging() {
  if (_firebaseMessaging) return _firebaseMessaging;

  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON contiene JSON inválido');
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
    } catch (e) {
      throw new Error(`No se pudo leer FIREBASE_SERVICE_ACCOUNT_PATH: ${e.message}`);
    }
  } else {
    throw new Error('Firebase no configurado (falta FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_SERVICE_ACCOUNT_PATH)');
  }

  // Lazy require — firebase-admin is an optional dependency
  const admin = require('firebase-admin');
  if (!_firebaseApp) {
    _firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  _firebaseMessaging = admin.messaging(_firebaseApp);
  return _firebaseMessaging;
}

// Helper: upsert a device token into portal.device_tokens
// PostgREST UPSERT: POST with Prefer: resolution=merge-duplicates + on_conflict param
async function upsertDeviceToken(token, platform, userEmail) {
  if (!SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY no configurado');
  const url = `${SUPABASE_URL}/rest/v1/device_tokens?on_conflict=token`;
  const body = { token, platform, updated_at: new Date().toISOString() };
  if (userEmail) body.user_email = userEmail;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Profile': 'portal',
      'Accept-Profile': 'portal',
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upsert device_tokens: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// Helper: remove a list of stale tokens from DB
async function removeStaleTokens(tokens) {
  if (!tokens.length || !SUPABASE_SERVICE_KEY) return;
  try {
    const url = `${SUPABASE_URL}/rest/v1/device_tokens?token=in.(${tokens.map(t => `"${t.replace(/"/g, '')}""`).join(',')})`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Profile': 'portal',
        'Accept-Profile': 'portal'
      },
      signal: AbortSignal.timeout(10000)
    });
  } catch (e) {
    console.error('removeStaleTokens error:', e.message);
  }
}

// Main push send helper — call this from anywhere in server.js
async function sendPushNotification({ title, body, data = {} }) {
  try {
    const messaging = getFirebaseMessaging();
    const rows = await portalQuery('device_tokens', 'select=token');
    if (!rows || rows.length === 0) return { sent: 0, failed: 0, cleaned: 0 };

    const tokens = rows.map(r => r.token);
    const message = {
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      tokens
    };

    const response = await messaging.sendEachForMulticast(message);
    const staleTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error && r.error.code;
        // Remove tokens that are definitely invalid/unregistered
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          staleTokens.push(tokens[i]);
        }
      }
    });

    if (staleTokens.length) await removeStaleTokens(staleTokens);

    const sent = response.successCount;
    const failed = response.failureCount - staleTokens.length;
    console.log(`Push notification sent: ${sent} ok, ${failed} failed, ${staleTokens.length} cleaned`);
    return { sent, failed, cleaned: staleTokens.length };
  } catch (err) {
    // Non-fatal — log but don't throw (caller should not break on push failure)
    console.error('sendPushNotification error:', err.message);
    return { sent: 0, failed: 0, cleaned: 0, error: err.message };
  }
}

// Helper: format UCampus horario from horarios rows
function formatHorario(horarios) {
  if (!horarios || horarios.length === 0) return null;
  const dayNames = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };
  // Deduplicate by dia+hora to avoid repeated entries from sync
  const seen = new Set();
  return horarios
    .sort((a, b) => a.dia - b.dia)
    .filter(h => {
      const key = `${h.dia}-${h.hora_fin || h.raw_data?.hora_fin}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(h => {
      const day = dayNames[h.dia] || `D${h.dia}`;
      const inicio = h.hora_inicio || h.raw_data?.hora_ini;
      const fin = h.hora_fin || h.raw_data?.hora_fin;
      if (inicio && fin) return `${day} ${inicio}-${fin}`;
      if (h.bloque) return `${day} B${h.bloque}`;
      return day;
    })
    .join(' · ');
}

// --- API: UCampus data (authenticated) ---
app.get('/api/ucampus', authMiddleware, async (req, res) => {
  if (!SUPABASE_SERVICE_KEY) {
    return res.json({ found: false, error: 'UCampus no configurado' });
  }

  const { email } = resolveTargetEmail(req);

  try {
    // Step 1: Find persona by email
    const personas = await supabaseQuery('personas', `email=eq.${encodeURIComponent(email)}&limit=1`);
    if (!personas || personas.length === 0) {
      return res.json({ found: false });
    }

    const persona = personas[0];
    const rut = persona.rut;
    const nombre = persona.nombres ? `${persona.nombres} ${persona.apellido1 || ''} ${persona.apellido2 || ''}`.trim() : null;

    // Step 2: Query docente and estudiante data in parallel
    const periodo = '2026.1';
    const [dictados, inscritos] = await Promise.all([
      supabaseQuery('cursos_dictados', `rut=eq.${encodeURIComponent(rut)}&periodo=eq.${periodo}`).catch(() => []),
      supabaseQuery('cursos_inscritos', `rut=eq.${encodeURIComponent(rut)}&periodo=eq.${periodo}`).catch(() => [])
    ]);

    // Step 3: Gather unique curso IDs and ramo codes for batch lookups
    // Fields like codigo, nombre, seccion are inside raw_data, not top-level
    const cursoIds = [...new Set([
      ...dictados.map(d => d.id_curso).filter(Boolean),
      ...inscritos.map(i => i.id_curso).filter(Boolean)
    ])];
    const ramoCodes = [...new Set([
      ...dictados.map(d => d.raw_data?.codigo).filter(Boolean),
      ...inscritos.map(i => i.raw_data?.codigo).filter(Boolean)
    ])];

    // Step 4: Batch fetch ramos, cursos, horarios, inscritos count
    const [ramos, cursos, horarios, carrAlumnos, allInscritos] = await Promise.all([
      ramoCodes.length > 0
        ? supabaseQuery('ramos', `codigo=in.(${ramoCodes.map(c => `"${c}"`).join(',')})`)
        : [],
      cursoIds.length > 0
        ? supabaseQuery('cursos', `id_curso=in.(${cursoIds.join(',')})`)
        : [],
      dictados.length > 0
        ? supabaseQuery('horarios', `id_curso=in.(${dictados.map(d => d.id_curso).filter(Boolean).join(',')})`)
        : [],
      inscritos.length > 0
        ? supabaseQuery('carreras_alumnos', `rut=eq.${encodeURIComponent(rut)}`).catch(() => [])
        : [],
      // Count real inscritos per course for docente view
      dictados.length > 0
        ? supabaseQuery('cursos_inscritos', `id_curso=in.(${dictados.map(d => d.id_curso).filter(Boolean).join(',')})&select=id_curso,rut`)
            .catch(() => [])
        : []
    ]);

    // Index lookups
    const ramoMap = {};
    ramos.forEach(r => { ramoMap[r.codigo] = r; });
    const cursoMap = {};
    cursos.forEach(c => { cursoMap[c.id_curso] = c; });
    const horarioMap = {};
    horarios.forEach(h => {
      if (!horarioMap[h.id_curso]) horarioMap[h.id_curso] = [];
      horarioMap[h.id_curso].push(h);
    });
    // Count real inscritos per course
    const inscritosCountMap = {};
    allInscritos.forEach(i => {
      inscritosCountMap[i.id_curso] = (inscritosCountMap[i.id_curso] || 0) + 1;
    });

    // Step 5: Get carrera name
    let carreraNombre = null;
    if (carrAlumnos.length > 0) {
      try {
        const ca = carrAlumnos[0];
        // Use raw_data.nombre directly if available, otherwise look up carreras table
        if (ca.raw_data?.nombre) {
          carreraNombre = ca.raw_data.nombre;
        } else {
          const carreras = await supabaseQuery('carreras', `id_carrera=eq.${encodeURIComponent(ca.id_carrera)}&limit=1`);
          if (carreras.length > 0) carreraNombre = carreras[0].nombre;
        }
      } catch {}
    }

    // Step 6: Build response — fields are in raw_data, not top-level columns
    const asDocente = {
      total: dictados.length,
      totalEstudiantes: Object.values(inscritosCountMap).reduce((s, n) => s + n, 0),
      secciones: dictados.map(d => {
        const rd = d.raw_data || {};
        const codigo = rd.codigo || '';
        const ramo = ramoMap[codigo] || {};
        const curso = cursoMap[d.id_curso] || {};
        const crd = curso.raw_data || {};
        const realInscritos = inscritosCountMap[d.id_curso] || 0;
        return {
          idCurso: d.id_curso,
          codigoRamo: codigo,
          nombreRamo: ramo.nombre || rd.nombre || '',
          seccion: rd.seccion || curso.seccion || null,
          inscritos: realInscritos,
          cupos: curso.cupos || parseInt(crd.cupo) || null,
          rol: d.rol || rd.cargo || 'Docente',
          horario: formatHorario(horarioMap[d.id_curso]),
          departamento: crd.departamento || null,
          modalidad: crd.modalidad || null,
          creditos: { ud: parseInt(rd.ud) || null, sct: parseInt(rd.sct) || null },
          ucampusUrl: `https://ucampus.umce.cl`
        };
      })
    };

    const asEstudiante = {
      total: inscritos.length,
      carrera: carreraNombre,
      ramos: inscritos.map(i => {
        const rd = i.raw_data || {};
        const codigo = rd.codigo || '';
        const ramo = ramoMap[codigo] || {};
        return {
          codigoRamo: codigo,
          nombreRamo: ramo.nombre || rd.nombre || '',
          seccion: rd.seccion || null,
          notaFinal: rd.nota_final != null ? parseFloat(rd.nota_final) : null,
          estado: rd.estado_texto || i.estado || null,
          ucampusUrl: `https://ucampus.umce.cl`
        };
      })
    };

    res.json({
      found: true,
      rut,
      nombre,
      periodo: 'Primer Semestre 2026',
      asDocente: asDocente.total > 0 ? asDocente : null,
      asEstudiante: asEstudiante.total > 0 ? asEstudiante : null
    });

  } catch (err) {
    console.error('UCampus API error:', err.message);
    res.json({ found: false, error: err.message });
  }
});

// --- API: UCampus section detail — student list (authenticated, admin only) ---
app.get('/api/ucampus/seccion/:idCurso', authMiddleware, async (req, res) => {
  if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'UCampus no configurado' });

  const { email } = resolveTargetEmail(req);
  const idCurso = parseInt(req.params.idCurso);
  if (isNaN(idCurso)) return res.status(400).json({ error: 'ID de curso inválido' });

  try {
    // Verify the requesting user (or impersonated user) is a docente of this section
    const persona = await supabaseQuery('personas', `email=eq.${encodeURIComponent(email)}&limit=1`);
    if (!persona || persona.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const rut = persona[0].rut;
    const isDocente = await supabaseQuery('cursos_dictados', `rut=eq.${encodeURIComponent(rut)}&id_curso=eq.${idCurso}&limit=1`);

    // Allow admin or docente of this section
    if (!isAdmin(req.userEmail) && (!isDocente || isDocente.length === 0)) {
      return res.status(403).json({ error: 'No autorizado para ver esta sección' });
    }

    // Get course info
    const cursoArr = await supabaseQuery('cursos', `id_curso=eq.${idCurso}&limit=1`);
    const curso = cursoArr[0] || {};
    const crd = curso.raw_data || {};

    // Get all inscritos for this section
    const estudiantesRaw = await supabaseQuery('cursos_inscritos', `id_curso=eq.${idCurso}&select=rut,estado,nota_final,raw_data`);

    // Batch fetch persona data for all student RUTs
    const studentRuts = [...new Set(estudiantesRaw.map(e => e.rut).filter(Boolean))];
    let personasMap = {};
    if (studentRuts.length > 0) {
      // PostgREST has URL length limits, batch in groups of 50
      for (let i = 0; i < studentRuts.length; i += 50) {
        const batch = studentRuts.slice(i, i + 50);
        const personas = await supabaseQuery('personas', `rut=in.(${batch.join(',')})&select=rut,nombres,apellido1,apellido2,email`);
        personas.forEach(p => { personasMap[p.rut] = p; });
      }
    }

    // Build student list
    const estudiantes = estudiantesRaw.map(e => {
      const p = personasMap[e.rut] || {};
      const rd = e.raw_data || {};
      return {
        rut: e.rut,
        nombre: p.nombres ? `${p.nombres} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim() : null,
        email: p.email || null,
        estado: rd.estado_final || e.estado || 'Inscrito',
        notaFinal: rd.nota_final && parseFloat(rd.nota_final) > 0 ? parseFloat(rd.nota_final) : null
      };
    }).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

    res.json({
      idCurso,
      codigoRamo: crd.codigo || '',
      nombreRamo: crd.nombre || '',
      seccion: crd.seccion || curso.seccion || null,
      departamento: crd.departamento || null,
      modalidad: crd.modalidad || null,
      cupos: curso.cupos || parseInt(crd.cupo) || null,
      totalInscritos: estudiantes.length,
      estudiantes
    });

  } catch (err) {
    console.error('UCampus seccion error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// === Portal Catalog API ===

// Sanitize PostgREST filter values — only allow alphanumeric, hyphens, underscores
function sanitizeFilter(val) {
  if (!val) return '';
  return String(val).replace(/[^a-zA-Z0-9_\-]/g, '');
}
// Sanitize free-text search — strip PostgREST operators
function sanitizeSearch(val) {
  if (!val) return '';
  return String(val).replace(/[()&|,=*!<>]/g, '').substring(0, 100);
}

// GET /api/catalog/programs
app.get('/api/catalog/programs', async (req, res) => {
  try {
    const { type, featured, search, status, limit = '20', offset = '0' } = req.query;
    let params = [];
    const sStatus = sanitizeFilter(status);
    const sType = sanitizeFilter(type);
    const sSearch = sanitizeSearch(search);
    if (sStatus) {
      params.push(`status=eq.${sStatus}`);
    } else {
      params.push('status=neq.inactive');
    }
    if (sType) params.push(`type=eq.${sType}`);
    if (featured === 'true') params.push('featured=eq.true');
    if (sSearch) params.push(`or=(title.ilike.*${sSearch}*,description.ilike.*${sSearch}*)`);
    params.push('order=featured.desc,created_at.desc');
    params.push(`limit=${Math.min(parseInt(limit) || 20, 50)}`);
    params.push(`offset=${parseInt(offset) || 0}`);
    const data = await portalQuery('programs', params.join('&'));
    res.json(data);
  } catch (err) {
    console.error('Catalog programs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/catalog/programs/:slug
app.get('/api/catalog/programs/:slug', async (req, res) => {
  try {
    const programs = await portalQuery('programs', `slug=eq.${encodeURIComponent(req.params.slug)}&limit=1`);
    if (!programs.length) return res.status(404).json({ error: 'Programa no encontrado' });
    const program = programs[0];

    const [courses, teamLinks, testimonials] = await Promise.all([
      portalQuery('courses', `program_id=eq.${program.id}&order=created_at.asc`),
      portalQuery('program_team', `program_id=eq.${program.id}`),
      portalQuery('testimonials', `program_id=eq.${program.id}`)
    ]);

    let team = [];
    if (teamLinks.length) {
      const memberIds = teamLinks.map(t => t.member_id);
      team = await portalQuery('team_members', `id=in.(${memberIds.join(',')})`);
      team = team.map(m => {
        const link = teamLinks.find(t => t.member_id === m.id);
        return { ...m, role_in_program: link?.role_in_program };
      });
    }

    res.json({ ...program, courses, team, testimonials });
  } catch (err) {
    console.error('Program detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/catalog/courses
app.get('/api/catalog/courses', async (req, res) => {
  try {
    const { category, status, program_id, level, search, limit = '20', offset = '0' } = req.query;
    let params = [];
    const sCategory = sanitizeFilter(category);
    const sStatus = sanitizeFilter(status);
    const sLevel = sanitizeFilter(level);
    const sSearch = sanitizeSearch(search);
    params.push('enrollment_status=neq.hidden');
    if (sStatus) params.push(`enrollment_status=eq.${sStatus}`);
    if (sCategory) params.push(`category=eq.${sCategory}`);
    if (program_id) params.push(`program_id=eq.${parseInt(program_id)}`);
    if (sLevel) params.push(`level=eq.${sLevel}`);
    if (sSearch) params.push(`or=(title.ilike.*${sSearch}*,description.ilike.*${sSearch}*)`);
    params.push('order=created_at.desc');
    params.push(`limit=${Math.min(parseInt(limit) || 20, 50)}`);
    params.push(`offset=${parseInt(offset) || 0}`);
    const data = await portalQuery('courses', params.join('&'));
    res.json(data);
  } catch (err) {
    console.error('Catalog courses error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/catalog/courses/:slug
app.get('/api/catalog/courses/:slug', async (req, res) => {
  try {
    const courses = await portalQuery('courses', `slug=eq.${encodeURIComponent(req.params.slug)}&limit=1`);
    if (!courses.length) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(courses[0]);
  } catch (err) {
    console.error('Course detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/catalog/search?q=...
app.get('/api/catalog/search', async (req, res) => {
  try {
    const q = sanitizeSearch(req.query.q);
    if (!q) return res.json({ programs: [], courses: [] });
    const searchParam = `or=(title.ilike.*${q}*,description.ilike.*${q}*)&limit=10`;
    const [programs, courses] = await Promise.all([
      portalQuery('programs', `${searchParam}&status=neq.inactive`),
      portalQuery('courses', `${searchParam}&enrollment_status=neq.hidden`)
    ]);
    res.json({ programs, courses });
  } catch (err) {
    console.error('Catalog search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/catalog/programs/:slug/piac — datos PIAC públicos para landing page
app.get('/api/catalog/programs/:slug/piac', async (req, res) => {
  try {
    const programs = await portalQuery('programs', `slug=eq.${encodeURIComponent(req.params.slug)}&limit=1`);
    if (!programs.length) return res.status(404).json({ error: 'Programa no encontrado' });
    const program = programs[0];

    // Buscar piac_links asociados al programa
    const links = await portalQuery('piac_links', `program_id=eq.${program.id}&status=eq.active&order=created_at.desc`);
    if (!links.length) return res.json({ program_id: program.id, has_piac: false });

    // Obtener datos parseados de cada PIAC vinculado
    const piacData = [];
    for (const link of links) {
      const parsed = await portalQuery('piac_parsed', `piac_link_id=eq.${link.id}&order=parsed_at.desc&limit=1`);
      if (parsed.length && parsed[0].parsed_json) {
        const p = parsed[0].parsed_json;
        piacData.push({
          link_id: link.id,
          course_name: link.course_name,
          moodle_platform: link.moodle_platform,
          identificacion: p.identificacion || null,
          nucleos: (p.nucleos || []).map(n => ({
            numero: n.numero,
            nombre: n.nombre,
            semanas: n.semanas,
            resultado_formativo: n.resultado_formativo,
            criterios_evaluacion: n.criterios_evaluacion || [],
            temas: n.temas || []
          })),
          evaluaciones_sumativas: p.evaluaciones_sumativas || [],
          metodologia: p.metodologia || null,
          bibliografia: p.bibliografia || []
        });
      }
    }

    res.json({
      program_id: program.id,
      has_piac: piacData.length > 0,
      courses: piacData
    });
  } catch (err) {
    console.error('Program PIAC public error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/induccion/launch — auto-matricula en virtual.umce.cl y redirige a induccion2026
app.get('/api/induccion/launch', authMiddleware, async (req, res) => {
  try {
    const email = req.userEmail;
    if (!email) return res.status(401).json({ error: 'No autenticado' });

    const virtualPlatform = PLATFORMS.find(p => p.id === 'virtual');

    // 1. Buscar usuario en virtual.umce.cl por email
    const users = await moodleCall(virtualPlatform, 'core_user_get_users_by_field', {
      field: 'email', values: [email]
    });

    let moodleUserId = null;
    if (users && users.length > 0) {
      moodleUserId = users[0].id;

      // 2. Verificar si ya está matriculado
      try {
        const enrolled = await moodleCall(virtualPlatform, 'core_enrol_get_enrolled_users', {
          courseid: 252
        });
        const isEnrolled = enrolled.some(u => u.id === moodleUserId);

        if (!isEnrolled) {
          // 3. Auto-matricular
          await moodleCall(virtualPlatform, 'enrol_manual_enrol_users', {
            enrolments: [{ roleid: 5, userid: moodleUserId, courseid: 252 }]
          });
          console.log(`[Induccion] Auto-enrolled ${email} (userId ${moodleUserId}) in course 252`);
        }
      } catch (enrollErr) {
        // Si falla la verificación, intentar matricular directamente
        try {
          await moodleCall(virtualPlatform, 'enrol_manual_enrol_users', {
            enrolments: [{ roleid: 5, userid: moodleUserId, courseid: 252 }]
          });
        } catch (e) {
          console.log(`[Induccion] Enrol attempt for ${email}: ${e.message}`);
        }
      }
    }

    // 4. Redirigir a induccion2026 con RUT (username de Moodle) + nombre
    // Username puede ser RUT o email — si es email, buscar RUT en idnumber
    let rut = '';
    let nombre = '';
    if (users && users.length) {
      const u = users[0];
      nombre = u.fullname || '';
      if (u.username && !u.username.includes('@')) {
        rut = u.username;
      } else if (u.idnumber && !u.idnumber.includes('@')) {
        rut = u.idnumber;
      } else {
        rut = email;
      }
    }
    const redirectUrl = `https://induccion2026.udfv.cloud?rut=${encodeURIComponent(rut)}&nombre=${encodeURIComponent(nombre)}&email=${encodeURIComponent(email)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('[Induccion] Launch error:', err.message);
    // Fallback: redirigir sin matrícula
    res.redirect(`https://induccion2026.udfv.cloud?email=${encodeURIComponent(req.userEmail || '')}`);
  }
});

// GET /api/news
app.get('/api/news', async (req, res) => {
  try {
    const { category, featured, limit = '10', offset = '0' } = req.query;
    let params = [];
    params.push('status=neq.hidden');
    if (category) params.push(`category=eq.${category}`);
    if (featured === 'true') params.push('featured=eq.true');
    params.push('order=published_at.desc');
    params.push(`limit=${parseInt(limit)}`);
    params.push(`offset=${parseInt(offset)}`);
    let data = await portalQuery('news', params.join('&'));
    // Filter out test/fake content that should not appear in production
    data = data.filter(item => {
      const title = (item.title || '').toLowerCase();
      const body = (item.body || item.content || item.excerpt || '').toLowerCase();
      if (title.includes('[prueba]') || title.includes('[test]')) return false;
      if (body.includes('noticia ficticia') || body.includes('noticia de prueba')) return false;
      if (title.includes('ji') && title.trim().length <= 20) return false; // catches "empezamos el año ji"
      return true;
    });
    res.json(data);
  } catch (err) {
    console.error('News error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/:slug
app.get('/api/news/:slug', async (req, res) => {
  try {
    const items = await portalQuery('news', `slug=eq.${encodeURIComponent(req.params.slug)}&limit=1`);
    if (!items.length) return res.status(404).json({ error: 'Noticia no encontrada' });
    res.json(items[0]);
  } catch (err) {
    console.error('News detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resources
app.get('/api/resources', async (req, res) => {
  try {
    const { type, category } = req.query;
    let params = [];
    if (type) params.push(`type=eq.${type}`);
    if (category) params.push(`category=eq.${category}`);
    params.push('order=display_order.asc,created_at.desc');
    const data = await portalQuery('resources', params.join('&'));
    res.json(data);
  } catch (err) {
    console.error('Resources error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team
app.get('/api/team', async (req, res) => {
  try {
    const data = await portalQuery('team_members', 'order=display_order.asc');
    res.json(data);
  } catch (err) {
    console.error('Team error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/testimonials
app.get('/api/testimonials', async (req, res) => {
  try {
    const { program_id } = req.query;
    let params = [];
    if (program_id) params.push(`program_id=eq.${program_id}`);
    params.push('order=created_at.desc');
    const data = await portalQuery('testimonials', params.join('&'));
    res.json(data);
  } catch (err) {
    console.error('Testimonials error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// BADGES + MICROCREDENCIALES API — Insignias y credenciales apilables
// Open Badges 3.0 (W3C Verifiable Credentials) con firma Ed25519
// ============================================================================

// Helper: generate verificacion hash for badges/microcredenciales
function generateVerificacionHash() {
  return crypto.randomBytes(16).toString('hex');
}

// --- Open Badges 3.0: keypair Ed25519 ---
// Keys stored in .env: BADGE_PRIVATE_KEY (base64), BADGE_PUBLIC_KEY (base64)
// Generated once with: node -e "const kp=require('crypto').generateKeyPairSync('ed25519'); console.log('BADGE_PRIVATE_KEY='+kp.privateKey.export({type:'pkcs8',format:'der'}).toString('base64')); console.log('BADGE_PUBLIC_KEY='+kp.publicKey.export({type:'spki',format:'der'}).toString('base64'))"
const BADGE_PRIVATE_KEY_B64 = process.env.BADGE_PRIVATE_KEY || '';
const BADGE_PUBLIC_KEY_B64 = process.env.BADGE_PUBLIC_KEY || '';

// .well-known endpoint: public key for credential verification
app.get('/.well-known/keys/issuer-key-1', (req, res) => {
  if (!BADGE_PUBLIC_KEY_B64) {
    return res.status(503).json({ error: 'Badge signing keys not configured' });
  }
  res.json({
    id: 'https://umce.online/.well-known/keys/issuer-key-1',
    type: 'Ed25519VerificationKey2020',
    controller: 'https://umce.online',
    publicKeyMultibase: 'z' + Buffer.from(BADGE_PUBLIC_KEY_B64, 'base64').toString('base64url')
  });
});

// DID document for umce.online issuer
app.get('/.well-known/did.json', (req, res) => {
  res.json({
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
    id: 'did:web:umce.online',
    verificationMethod: [{
      id: 'did:web:umce.online#issuer-key-1',
      type: 'Ed25519VerificationKey2020',
      controller: 'did:web:umce.online',
      publicKeyMultibase: BADGE_PUBLIC_KEY_B64 ? 'z' + Buffer.from(BADGE_PUBLIC_KEY_B64, 'base64').toString('base64url') : ''
    }],
    assertionMethod: ['did:web:umce.online#issuer-key-1']
  });
});

// --- Badges: catalogo y consulta ---

// GET /api/badges/definitions — catálogo público de badges disponibles
app.get('/api/badges/definitions', async (req, res) => {
  try {
    const params = 'active=eq.true&order=display_order.asc';
    const defs = await portalQuery('badge_definitions', params);
    res.json(defs);
  } catch (err) {
    console.error('Badge definitions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/badges — badges del usuario logueado
app.get('/api/user/badges', authMiddleware, async (req, res) => {
  try {
    const { email } = resolveTargetEmail(req);
    const badges = await portalQuery('user_badges', `user_email=eq.${encodeURIComponent(email)}&order=granted_at.desc,earned_at.desc`);
    res.json(badges);
  } catch (err) {
    console.error('User badges error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/badges/user/:email — (compatibilidad) badges de un usuario
app.get('/api/badges/user/:email', authMiddleware, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const badges = await portalQuery('user_badges', `user_email=eq.${encodeURIComponent(email)}&order=granted_at.desc,earned_at.desc`);
    res.json(badges);
  } catch (err) {
    console.error('User badges error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/piac/:linkId/badges — badges del usuario en un curso especifico
app.get('/api/piac/:linkId/badges', authMiddleware, async (req, res) => {
  try {
    const { email } = resolveTargetEmail(req);
    const linkId = parseInt(req.params.linkId);
    if (!linkId) return res.status(400).json({ error: 'linkId invalido' });
    const badges = await portalQuery('user_badges',
      `user_email=eq.${encodeURIComponent(email)}&piac_link_id=eq.${linkId}&order=granted_at.desc,earned_at.desc`);
    res.json(badges);
  } catch (err) {
    console.error('PIAC badges error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/badges/sdpa — progreso SDPA del docente logueado
app.get('/api/user/badges/sdpa', authMiddleware, async (req, res) => {
  try {
    const { email } = resolveTargetEmail(req);
    const progreso = await portalQuery('mv_progreso_sdpa', `user_email=eq.${encodeURIComponent(email)}`);
    // Also fetch the individual SDPA badges for detail
    const badges = await portalQuery('user_badges',
      `user_email=eq.${encodeURIComponent(email)}&programa_sdpa=not.is.null&order=granted_at.desc,earned_at.desc`);
    res.json({ progreso, badges });
  } catch (err) {
    console.error('SDPA progress error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/trayectoria — vista completa: badges + microcredenciales + progreso
app.get('/api/user/trayectoria', authMiddleware, async (req, res) => {
  try {
    const { email } = resolveTargetEmail(req);
    const enc = encodeURIComponent(email);
    const [badges, microcredenciales, progresoMicro, progresoSdpa] = await Promise.all([
      portalQuery('user_badges', `user_email=eq.${enc}&order=granted_at.desc,earned_at.desc`),
      portalQuery('user_microcredenciales', `user_email=eq.${enc}&order=granted_at.desc`),
      portalQuery('v_progreso_microcredenciales', `user_email=eq.${enc}`),
      portalQuery('mv_progreso_sdpa', `user_email=eq.${enc}`)
    ]);
    res.json({ badges, microcredenciales, progreso_microcredenciales: progresoMicro, progreso_sdpa: progresoSdpa });
  } catch (err) {
    console.error('Trayectoria error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/badges/export — export de logros (JSON, PDF en futuro)
app.get('/api/user/badges/export', authMiddleware, async (req, res) => {
  try {
    const { email } = resolveTargetEmail(req);
    const enc = encodeURIComponent(email);
    const [badges, microcredenciales, progresoSdpa] = await Promise.all([
      portalQuery('user_badges', `user_email=eq.${enc}&order=granted_at.desc,earned_at.desc`),
      portalQuery('user_microcredenciales', `user_email=eq.${enc}&order=granted_at.desc`),
      portalQuery('mv_progreso_sdpa', `user_email=eq.${enc}`)
    ]);
    // v1: JSON export (PDF generation in future iteration)
    res.json({
      user_email: email,
      exported_at: new Date().toISOString(),
      total_badges: badges.length,
      total_microcredenciales: microcredenciales.length,
      badges,
      microcredenciales,
      progreso_sdpa: progresoSdpa
    });
  } catch (err) {
    console.error('Export badges error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Badges: verificacion publica (sin auth) ---

// GET /api/badge/:hash — verificacion publica de insignia
app.get('/api/badge/:hash', async (req, res) => {
  try {
    const hash = req.params.hash;
    if (!hash || hash.length < 8) return res.status(400).json({ error: 'Hash invalido' });
    const results = await portalQuery('user_badges', `verificacion_hash=eq.${encodeURIComponent(hash)}`);
    if (!results.length) return res.status(404).json({ error: 'Insignia no encontrada' });
    const badge = results[0];
    // Enrich with definition data
    if (badge.badge_definition_id) {
      const defs = await portalQuery('badge_definitions', `id=eq.${badge.badge_definition_id}`);
      if (defs.length) badge.definition = defs[0];
    }
    res.json({ verified: true, badge });
  } catch (err) {
    console.error('Badge verify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/microcredencial/:hash — verificacion publica de microcredencial
app.get('/api/microcredencial/:hash', async (req, res) => {
  try {
    const hash = req.params.hash;
    if (!hash || hash.length < 8) return res.status(400).json({ error: 'Hash invalido' });
    const results = await portalQuery('user_microcredenciales', `verificacion_hash=eq.${encodeURIComponent(hash)}`);
    if (!results.length) return res.status(404).json({ error: 'Microcredencial no encontrada' });
    const mc = results[0];
    // Enrich with definition data
    const defs = await portalQuery('microcredencial_definitions', `id=eq.${mc.microcredencial_id}`);
    if (defs.length) mc.definition = defs[0];
    res.json({ verified: true, microcredencial: mc });
  } catch (err) {
    console.error('Microcredencial verify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Badges: admin ---

// POST /api/admin/badges/grant — otorgar badge (admin/editor)
app.post('/api/admin/badges/grant', adminOrEditorMiddleware, async (req, res) => {
  try {
    const { user_email, badge_definition_id, badge_type, badge_level, title, description,
            piac_link_id, nucleo_numero, moodle_course_id, moodle_platform,
            horas_cronologicas, programa_sdpa, nota, course_id, program_id, metadata } = req.body;
    if (!user_email) return res.status(400).json({ error: 'user_email es requerido' });
    // Require either badge_definition_id (new flow) or badge_type+title (legacy flow)
    if (!badge_definition_id && (!badge_type || !title)) {
      return res.status(400).json({ error: 'badge_definition_id o (badge_type + title) son requeridos' });
    }

    const badgeData = {
      user_email,
      badge_definition_id: badge_definition_id || null,
      badge_type: badge_type || 'manual',
      badge_level: badge_level || null,
      title: title || '',
      description: description || '',
      piac_link_id: piac_link_id || null,
      nucleo_numero: nucleo_numero || null,
      moodle_course_id: moodle_course_id || null,
      moodle_platform: moodle_platform || null,
      horas_cronologicas: horas_cronologicas || null,
      programa_sdpa: programa_sdpa || null,
      nota: nota || null,
      granted_by: req.userEmail,
      granted_at: new Date().toISOString(),
      verified_by: req.userEmail,
      verificacion_hash: generateVerificacionHash(),
      course_id: course_id || null,
      program_id: program_id || null,
      metadata: metadata || {}
    };

    // If badge_definition_id given, fill title/description/badge_type from definition
    if (badge_definition_id && !title) {
      const defs = await portalQuery('badge_definitions', `id=eq.${badge_definition_id}`);
      if (defs.length) {
        badgeData.title = defs[0].title;
        badgeData.description = defs[0].description || '';
        badgeData.badge_type = defs[0].badge_type;
        badgeData.badge_level = defs[0].badge_level || badgeData.badge_level;
        badgeData.icon_name = defs[0].icon_name;
        badgeData.color = defs[0].color;
      }
    }

    const badge = await portalMutate('user_badges', 'POST', badgeData);
    res.json(badge);
  } catch (err) {
    console.error('Grant badge error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/badges/award — (compatibilidad) alias de /api/admin/badges/grant
app.post('/api/badges/award', adminOrEditorMiddleware, async (req, res) => {
  try {
    const { user_email, badge_type, badge_level, title, description, course_id, program_id, moodle_course_id, moodle_platform, metadata } = req.body;
    if (!user_email || !badge_type || !title) {
      return res.status(400).json({ error: 'user_email, badge_type y title son requeridos' });
    }
    const badge = await portalMutate('user_badges', 'POST', {
      user_email, badge_type, badge_level: badge_level || null,
      title, description: description || '',
      course_id: course_id || null, program_id: program_id || null,
      moodle_course_id: moodle_course_id || null, moodle_platform: moodle_platform || null,
      verified_by: req.userEmail, granted_by: req.userEmail,
      granted_at: new Date().toISOString(),
      verificacion_hash: generateVerificacionHash(),
      metadata: metadata || {}
    });
    res.json(badge);
  } catch (err) {
    console.error('Award badge error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/badges/revoke/:id — revocar badge
app.post('/api/admin/badges/revoke/:id', adminOrEditorMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID invalido' });
    await portalMutate('user_badges', 'DELETE', null, `id=eq.${id}`);
    res.json({ success: true, revoked_id: id });
  } catch (err) {
    console.error('Revoke badge error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/badges/stats — estadisticas de insignias
app.get('/api/admin/badges/stats', adminOrEditorMiddleware, async (req, res) => {
  try {
    const allBadges = await portalQuery('user_badges', 'order=granted_at.desc,earned_at.desc');
    const definitions = await portalQuery('badge_definitions', 'active=eq.true&order=display_order.asc');
    // Group by badge_type
    const byType = {};
    for (const b of allBadges) {
      const key = b.badge_type || 'unknown';
      if (!byType[key]) byType[key] = { count: 0, users: new Set() };
      byType[key].count++;
      byType[key].users.add(b.user_email);
    }
    const stats = Object.entries(byType).map(([type, data]) => ({
      badge_type: type, total_awarded: data.count, unique_users: data.users.size
    }));
    res.json({ total_badges: allBadges.length, by_type: stats, definitions_count: definitions.length });
  } catch (err) {
    console.error('Badge stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Microcredenciales: usuario ---

// GET /api/user/microcredenciales — microcredenciales del usuario + progreso
app.get('/api/user/microcredenciales', authMiddleware, async (req, res) => {
  try {
    const { email } = resolveTargetEmail(req);
    const enc = encodeURIComponent(email);
    const [earned, progreso] = await Promise.all([
      portalQuery('user_microcredenciales', `user_email=eq.${enc}&order=granted_at.desc`),
      portalQuery('v_progreso_microcredenciales', `user_email=eq.${enc}`)
    ]);
    res.json({ earned, progreso });
  } catch (err) {
    console.error('User microcredenciales error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/microcredenciales/:id — detalle de una microcredencial
app.get('/api/user/microcredenciales/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID invalido' });
    const defs = await portalQuery('microcredencial_definitions', `id=eq.${id}`);
    if (!defs.length) return res.status(404).json({ error: 'Microcredencial no encontrada' });
    const requisitos = await portalQuery('microcredencial_requisitos', `microcredencial_id=eq.${id}&order=orden.asc`);
    // Enrich requisitos with badge definition names
    const badgeIds = requisitos.map(r => r.badge_definition_id).filter(Boolean);
    let badgeDefs = [];
    if (badgeIds.length) {
      badgeDefs = await portalQuery('badge_definitions', `id=in.(${badgeIds.join(',')})`);
    }
    const badgeMap = Object.fromEntries(badgeDefs.map(d => [d.id, d]));
    const enrichedRequisitos = requisitos.map(r => ({
      ...r,
      badge_definition: badgeMap[r.badge_definition_id] || null
    }));
    // User's progress toward this microcredencial
    const { email } = resolveTargetEmail(req);
    const progreso = await portalQuery('v_progreso_microcredenciales',
      `user_email=eq.${encodeURIComponent(email)}&microcredencial_id=eq.${id}`);
    res.json({ definition: defs[0], requisitos: enrichedRequisitos, progreso: progreso[0] || null });
  } catch (err) {
    console.error('Microcredencial detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Microcredenciales: admin ---

// GET /api/admin/microcredenciales — lista definiciones
app.get('/api/admin/microcredenciales', adminOrEditorMiddleware, async (req, res) => {
  try {
    const defs = await portalQuery('microcredencial_definitions', 'order=created_at.desc');
    res.json(defs);
  } catch (err) {
    console.error('Admin microcredenciales list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/microcredenciales — crear nueva microcredencial con requisitos
app.post('/api/admin/microcredenciales', adminOrEditorMiddleware, async (req, res) => {
  try {
    const { slug, nombre, descripcion, tipo, programa_origen, total_sct, total_horas, icono, color, reglas_electivos, requisitos } = req.body;
    if (!slug || !nombre || !descripcion || !tipo || !icono) {
      return res.status(400).json({ error: 'slug, nombre, descripcion, tipo e icono son requeridos' });
    }
    // Create definition
    const [def] = await portalMutate('microcredencial_definitions', 'POST', {
      slug, nombre, descripcion, tipo,
      programa_origen: programa_origen || null,
      total_sct: total_sct || null,
      total_horas: total_horas || null,
      icono, color: color || '#2563eb',
      reglas_electivos: reglas_electivos || { minimo_electivos: 0 },
      activo: true
    });
    // Create requisitos if provided
    if (requisitos && Array.isArray(requisitos) && requisitos.length > 0) {
      const reqData = requisitos.map((r, i) => ({
        microcredencial_id: def.id,
        badge_definition_id: r.badge_definition_id,
        obligatorio: r.obligatorio !== false,
        orden: r.orden || i
      }));
      await portalMutate('microcredencial_requisitos', 'POST', reqData);
    }
    res.json(def);
  } catch (err) {
    console.error('Create microcredencial error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/microcredenciales/:id — editar microcredencial
app.put('/api/admin/microcredenciales/:id', adminOrEditorMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID invalido' });
    const { nombre, descripcion, tipo, programa_origen, total_sct, total_horas, icono, color, activo, reglas_electivos } = req.body;
    const updateData = { updated_at: new Date().toISOString() };
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (programa_origen !== undefined) updateData.programa_origen = programa_origen;
    if (total_sct !== undefined) updateData.total_sct = total_sct;
    if (total_horas !== undefined) updateData.total_horas = total_horas;
    if (icono !== undefined) updateData.icono = icono;
    if (color !== undefined) updateData.color = color;
    if (activo !== undefined) updateData.activo = activo;
    if (reglas_electivos !== undefined) updateData.reglas_electivos = reglas_electivos;
    const result = await portalMutate('microcredencial_definitions', 'PATCH', updateData, `id=eq.${id}`);
    res.json(result[0] || { id, ...updateData });
  } catch (err) {
    console.error('Update microcredencial error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/microcredenciales/:id/stats — estadisticas de una microcredencial
app.get('/api/admin/microcredenciales/:id/stats', adminOrEditorMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID invalido' });
    const [earned, progreso] = await Promise.all([
      portalQuery('user_microcredenciales', `microcredencial_id=eq.${id}`),
      portalQuery('v_progreso_microcredenciales', `microcredencial_id=eq.${id}`)
    ]);
    const enProgreso = progreso.filter(p => !p.elegible_para_otorgamiento && p.modulos_completados > 0);
    res.json({
      microcredencial_id: id,
      total_otorgadas: earned.length,
      en_progreso: enProgreso.length,
      users_earned: earned.map(e => ({ user_email: e.user_email, granted_at: e.granted_at })),
      users_en_progreso: enProgreso.map(p => ({ user_email: p.user_email, pct_avance: p.pct_avance }))
    });
  } catch (err) {
    console.error('Microcredencial stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// === Chatbot API ===

const CLAUDE_PROXY_URL = 'http://claude-proxy-container:3099/chat';
// Fallback: try Docker gateway IP if container name doesn't resolve
const CLAUDE_PROXY_FALLBACK = 'http://172.18.0.1:3099/chat';
const CHAT_RATE_LIMIT = 20; // messages per hour

// System prompt with portal context — built on startup
let chatSystemPrompt = '';
async function buildChatSystemPrompt() {
  try {
    const [programs, courses, team] = await Promise.all([
      portalQuery('programs', 'status=neq.inactive'),
      portalQuery('courses', 'select=title,category,duration_hours,moodle_platform,level'),
      portalQuery('team_members', 'order=display_order.asc&select=name,role,subunit')
    ]);
    chatSystemPrompt = `Eres el Asistente Virtual de la UMCE (Universidad Metropolitana de Ciencias de la Educación), específicamente de la Unidad de Docencia y Formación Virtual (UDFV).

Tu rol es ayudar a docentes y estudiantes con información sobre la oferta formativa virtual, plataformas Moodle y servicios de la UDFV.

INFORMACIÓN DEL CATÁLOGO:

Programas disponibles:
${programs.map(p => `- ${p.title} (${p.type}, ${p.duration_hours || '?'}h, nivel: ${p.level || 'todos'})`).join('\n')}

Cursos disponibles:
${courses.map(c => `- ${c.title} (${c.category}, ${c.duration_hours || '?'}h, plataforma: ${c.moodle_platform})`).join('\n')}

Equipo UDFV:
${team.map(t => `- ${t.name}: ${t.role} (${t.subunit})`).join('\n')}

PLATAFORMAS MOODLE UMCE:
- eVirtual (evirtual.umce.cl) — Formación continua y extensión
- Práctica (evirtual-practica.umce.cl) — Prácticas profesionales
- Virtual (virtual.umce.cl) — Docencia regular
- Pregrado (evirtual-pregrado.umce.cl) — Carreras de pregrado
- Postgrado (evirtual-postgrado.umce.cl) — Programas de postgrado

SERVICIOS:
- Dashboard Docente (dashboard.udfv.cloud) — métricas de actividad
- Asistente Telegram (@asistente_udfv_bot) — soporte 24/7
- Learning Record Store (LRS) — tracking xAPI
- Asesoría en diseño instruccional
- Soporte técnico: udfv@umce.cl

INSTRUCCIONES:
- Responde en español chileno, de forma amable y profesional
- Sé conciso (máximo 3-4 párrafos)
- Si mencionas un curso, indica la plataforma donde se encuentra
- Si no sabes algo, sugiere contactar a udfv@umce.cl
- NO uses herramientas ni ejecutes código — solo responde con texto
- Para inscripciones, dirige a la plataforma Moodle correspondiente
- El sitio web es umce.online`;
    console.log('Chat system prompt built:', chatSystemPrompt.length, 'chars');
  } catch (err) {
    console.error('Failed to build chat prompt:', err.message);
    chatSystemPrompt = 'Eres el asistente virtual de la UDFV-UMCE. Ayuda con consultas sobre cursos y plataformas. Contacto: udfv@umce.cl';
  }
}
// Build prompt after server starts (DB may not be ready immediately)
setTimeout(buildChatSystemPrompt, 3000);

// Rate limiting per session
const chatRateLimits = new Map();
function checkRateLimit(sessionToken) {
  const now = Date.now();
  const hourAgo = now - 3600000;
  let timestamps = chatRateLimits.get(sessionToken) || [];
  timestamps = timestamps.filter(t => t > hourAgo);
  if (timestamps.length >= CHAT_RATE_LIMIT) return false;
  timestamps.push(now);
  chatRateLimits.set(sessionToken, timestamps);
  return true;
}

// POST /api/chat/session — create or recover session
app.post('/api/chat/session', async (req, res) => {
  try {
    const { session_token, user_email } = req.body;

    if (session_token) {
      const sessions = await portalQuery('chat_sessions', `session_token=eq.${encodeURIComponent(session_token)}&limit=1`);
      if (sessions.length) {
        const messages = await portalQuery('chat_messages', `session_id=eq.${sessions[0].id}&order=created_at.asc`);
        return res.json({ session_token: sessions[0].session_token, session_id: sessions[0].id, messages });
      }
    }

    // Create new session
    const newToken = crypto.randomBytes(16).toString('hex');
    const created = await portalMutate('chat_sessions', 'POST', {
      session_token: newToken,
      user_email: user_email || null
    });
    const sess = Array.isArray(created) ? created[0] : created;
    res.json({ session_token: sess.session_token, session_id: sess.id, messages: [] });
  } catch (err) {
    console.error('Chat session error:', err.message);
    res.status(500).json({ error: 'Error creando sesión' });
  }
});

// POST /api/chat/message — send message, get response
app.post('/api/chat/message', async (req, res) => {
  try {
    const { session_token, message } = req.body;
    if (!session_token || !message || message.length > 2000) {
      return res.status(400).json({ error: 'Mensaje inválido' });
    }

    // Verify session
    const sessions = await portalQuery('chat_sessions', `session_token=eq.${encodeURIComponent(session_token)}&limit=1`);
    if (!sessions.length) return res.status(404).json({ error: 'Sesión no encontrada' });
    const session = sessions[0];

    // Rate limit
    if (!checkRateLimit(session_token)) {
      return res.status(429).json({ error: 'Has alcanzado el límite de mensajes. Intenta en una hora.' });
    }

    // Save user message
    await portalMutate('chat_messages', 'POST', {
      session_id: session.id,
      role: 'user',
      content: message
    });

    // Get recent conversation history for context
    const recentMessages = await portalQuery('chat_messages',
      `session_id=eq.${session.id}&order=created_at.desc&limit=6`
    );
    const history = recentMessages.reverse().map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');

    const fullPrompt = history ? `Conversación previa:\n${history}\n\nUsuario: ${message}` : message;

    // Build system prompt — extend with course context if linkId provided
    let systemPrompt = chatSystemPrompt;
    const contextLinkId = req.body.context_link_id;
    if (contextLinkId) {
      try {
        const ctxLinks = await portalQuery('piac_links', `id=eq.${parseInt(contextLinkId)}&status=eq.active&limit=1`);
        if (ctxLinks.length > 0) {
          const ctxLink = ctxLinks[0];
          const [ctxParsed, ctxConfig] = await Promise.all([
            portalQuery('piac_parsed', `piac_link_id=eq.${ctxLink.id}&order=parsed_at.desc&limit=1`),
            portalQuery('curso_virtual_config', `piac_link_id=eq.${ctxLink.id}&limit=1`)
          ]);
          const piac = ctxParsed[0]?.parsed_json;
          const cfg = ctxConfig[0] || {};
          if (piac) {
            const courseCtx = [
              `\n\n--- CONTEXTO DEL CURSO (${piac.identificacion?.nombre || ctxLink.course_name}) ---`,
              `Programa: ${piac.identificacion?.programa || 'No especificado'}`,
              `Docente: ${piac.identificacion?.docente || 'No especificado'} (${piac.identificacion?.email_docente || ''})`,
              `Modalidad: ${piac.identificacion?.modalidad || 'Virtual'}, ${piac.identificacion?.semanas || '?'} semanas, ${piac.identificacion?.creditos_sct || '?'} SCT`,
              `Horario atencion: ${cfg.docente_horario_atencion || 'Consultar por email'}`,
            ];
            if (piac.nucleos) {
              courseCtx.push('Nucleos:');
              piac.nucleos.forEach(n => {
                courseCtx.push(`  N${n.numero} (Sem ${n.semanas?.inicio}-${n.semanas?.fin}): ${n.nombre} — RF: ${(n.resultado_formativo || '').substring(0, 100)}`);
              });
            }
            if (piac.evaluaciones_sumativas) {
              courseCtx.push('Evaluaciones: ' + piac.evaluaciones_sumativas.map(e => `${e.nombre} (${e.ponderacion || '?'}%)`).join(', '));
            }
            courseCtx.push('Responde como asistente de ESTE curso especifico. Si te preguntan sobre fechas, evaluaciones, contenido o docente, usa la informacion de arriba.');
            systemPrompt = chatSystemPrompt + courseCtx.join('\n');
          }
        }
      } catch (ctxErr) {
        console.error('Chat context error:', ctxErr.message);
      }
    }

    // Call Claude proxy
    let proxyUrl = CLAUDE_PROXY_URL;
    let response;
    try {
      const proxyRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, system_prompt: systemPrompt }),
        signal: AbortSignal.timeout(55000)
      });
      response = await proxyRes.json();
    } catch (e) {
      // Fallback to gateway IP
      proxyUrl = CLAUDE_PROXY_FALLBACK;
      const proxyRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, system_prompt: systemPrompt }),
        signal: AbortSignal.timeout(55000)
      });
      response = await proxyRes.json();
    }

    if (response.error) {
      console.error('Claude proxy error:', response.error);
      throw new Error(response.error);
    }

    const assistantMessage = response.response || 'Lo siento, no pude generar una respuesta.';

    // Save assistant message
    await portalMutate('chat_messages', 'POST', {
      session_id: session.id,
      role: 'assistant',
      content: assistantMessage
    });

    // Update message count
    await portalMutate('chat_sessions', 'PATCH', { message_count: session.message_count + 2 },
      `session_token=eq.${encodeURIComponent(session_token)}`);

    res.json({ response: assistantMessage });
  } catch (err) {
    console.error('Chat message error:', err.message);
    res.status(500).json({ error: 'Error generando respuesta. Intenta de nuevo.' });
  }
});

// GET /api/chat/history
app.get('/api/chat/history', async (req, res) => {
  try {
    const { session_token } = req.query;
    if (!session_token) return res.status(400).json({ error: 'Token requerido' });

    const sessions = await portalQuery('chat_sessions', `session_token=eq.${encodeURIComponent(session_token)}&limit=1`);
    if (!sessions.length) return res.status(404).json({ error: 'Sesión no encontrada' });

    const messages = await portalQuery('chat_messages', `session_id=eq.${sessions[0].id}&order=created_at.asc`);
    res.json(messages);
  } catch (err) {
    console.error('Chat history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Slugify helper (used by admin assistant + admin CRUD)
function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 100);
}

// --- File upload endpoint (admin/editor) ---
app.post('/api/admin/upload', adminOrEditorMiddleware, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const msg = err instanceof multer.MulterError
        ? (err.code === 'LIMIT_FILE_SIZE' ? 'Archivo demasiado grande (máx 10 MB)' : err.message)
        : err.message;
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const fileUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(req.file.originalname);
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      isImage
    });
  });
});

// === Admin Assistant API ===

// Admin system prompt — built dynamically with current content + schemas
let adminSystemPrompt = '';
async function buildAdminSystemPrompt() {
  try {
    const [programs, courses, news, team, resources] = await Promise.all([
      portalQuery('programs', 'select=id,title,type,status,slug'),
      portalQuery('courses', 'select=id,title,category,enrollment_status,slug,program_id,level,duration_hours'),
      portalQuery('news', 'select=id,title,category,status,slug,published_at'),
      portalQuery('team_members', 'select=id,name,role,subunit,slug&order=display_order.asc'),
      portalQuery('resources', 'select=id,title,type,category,slug')
    ]);

    adminSystemPrompt = `Eres el asistente de administración del portal UMCE Virtual (umce.online).
Tu rol es ayudar a admins y editores a gestionar el contenido del portal usando lenguaje natural.

CONTENIDO ACTUAL:

Programas (${programs.length}):
${programs.map(p => `- [id:${p.id}] ${p.title} (tipo: ${p.type}, estado: ${p.status})`).join('\n')}

Cursos (${courses.length}):
${courses.map(c => `- [id:${c.id}] ${c.title} (categoría: ${c.category || '-'}, estado: ${c.enrollment_status}, programa: ${c.program_id || 'sin programa'}, nivel: ${c.level || '-'}, ${c.duration_hours || '?'}h)`).join('\n')}

Noticias (${news.length}):
${news.map(n => `- [id:${n.id}] ${n.title} (categoría: ${n.category || '-'}, estado: ${n.status || 'published'}, fecha: ${n.published_at ? n.published_at.split('T')[0] : '-'})`).join('\n')}

Equipo (${team.length}):
${team.map(t => `- [id:${t.id}] ${t.name} — ${t.role} (${t.subunit || '-'})`).join('\n')}

Recursos (${resources.length}):
${resources.map(r => `- [id:${r.id}] ${r.title} (tipo: ${r.type || '-'}, categoría: ${r.category || '-'})`).join('\n')}

SCHEMAS DE ENTIDADES (campos válidos para crear/actualizar):

programs: { title*, type* (diplomado|magister|prosecucion|curso_abierto|ruta_formativa|postitulo|certificacion), description, objectives (JSON array), curriculum (JSON array), duration_hours, modality, moodle_url, stats (JSON), tags (array), level, featured (bool), status (active|inactive), image_url, source }
courses: { title*, program_id, category, duration_hours, description, moodle_course_id, moodle_platform, enrollment_status (active|upcoming|closed), start_date, end_date, tags (array), level, source, image_url }
news: { title*, excerpt, content, category, image_url, source, source_url, published_at, featured (bool), status (published|hidden) }
team_members: { name*, role, subunit, bio, email, photo_url, display_order }
resources: { title*, type, category, url, embed_code, thumbnail_url, description, display_order }

(* = campo obligatorio)

FORMATO DE ACCIÓN:
Cuando el usuario pida crear, actualizar o eliminar contenido, responde con texto explicativo Y un bloque de acción así:

:::action
{"action": "create|update|delete", "table": "programs|courses|news|team_members|resources", "id": null_o_id, "data": {campos}}
:::

REGLAS:
- Solo UN bloque :::action por mensaje
- Si falta información necesaria, pídela antes de proponer la acción
- NO inventes campos que no existen en los schemas
- Para update, incluye solo los campos que cambian + el id
- Para delete, incluye table e id
- Para create, genera un slug automáticamente a partir del título
- Responde en español chileno (tú/usted, NO voseo argentino como "revivé/mirá"). Tono amable y profesional
- Si el usuario pregunta sobre contenido existente, responde con la información del listado
- Si piden estadísticas, calcula a partir de los datos disponibles
- Nunca propongas acciones que no correspondan al rol del usuario
- Si el usuario comparte un enlace de YouTube, usa la metadata proporcionada (título, embed URL, thumbnail) para proponer acciones relevantes. Por ejemplo, crear un recurso con embed_code del video o agregar el video a una noticia usando image_url para el thumbnail y source_url para el enlace
- Para embed de YouTube usa: <iframe width="560" height="315" src="EMBED_URL" frameborder="0" allowfullscreen></iframe>
- Si el usuario comparte un video sin contexto adicional, pregunta qué quiere hacer: crear recurso, agregar a noticia, etc.`;

    console.log('Admin system prompt built:', adminSystemPrompt.length, 'chars');
  } catch (err) {
    console.error('Failed to build admin prompt:', err.message);
    adminSystemPrompt = 'Eres el asistente de administración del portal UMCE Virtual. Ayuda a gestionar programas, cursos y noticias.';
  }
}
// Build admin prompt after server starts
setTimeout(buildAdminSystemPrompt, 4000);

// Parse :::action block from Claude response
function parseActionBlock(text) {
  const match = text.match(/:::action\s*\n?([\s\S]*?)\n?:::/);
  if (!match) return { text: text.trim(), action: null };
  const cleanText = text.replace(/:::action\s*\n?[\s\S]*?\n?:::/, '').trim();
  try {
    const action = JSON.parse(match[1].trim());
    return { text: cleanText, action };
  } catch {
    return { text: text.trim(), action: null };
  }
}

// Admin assistant chat sessions (in-memory, keyed by email)
const adminChatSessions = new Map();

// GET /api/admin/role — returns user role + pending count
app.get('/api/admin/role', authMiddleware, async (req, res) => {
  const role = getUserRole(req.userEmail);
  let pendingCount = 0;
  if (role === 'admin') {
    try {
      const pending = await portalQuery('admin_actions', 'status=eq.pending_approval&select=id');
      pendingCount = pending.length;
    } catch {}
  }
  res.json({ role, pendingCount });
});

// POST /api/admin/assistant/session — create or recover admin chat session
app.post('/api/admin/assistant/session', adminOrEditorMiddleware, async (req, res) => {
  const email = req.userEmail;
  if (!adminChatSessions.has(email)) {
    adminChatSessions.set(email, { messages: [], createdAt: new Date() });
  }
  const session = adminChatSessions.get(email);
  res.json({ messages: session.messages, role: req.userRole });
});

// Extract YouTube video IDs from text
function extractYouTubeIds(text) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:[&?][\w=.-]*)?/gi;
  const ids = [];
  let match;
  while ((match = regex.exec(text)) !== null) ids.push(match[1]);
  return [...new Set(ids)];
}

// Fetch YouTube video metadata via oEmbed (no API key needed)
async function fetchYouTubeMetadata(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      videoId,
      title: data.title,
      author: data.author_name,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  } catch { return null; }
}

// POST /api/admin/assistant/message — send message to Claude, parse action
app.post('/api/admin/assistant/message', adminOrEditorMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message || message.length > 3000) return res.status(400).json({ error: 'Mensaje inválido' });

  const email = req.userEmail;
  if (!adminChatSessions.has(email)) {
    adminChatSessions.set(email, { messages: [], createdAt: new Date() });
  }
  const session = adminChatSessions.get(email);

  // Detect and fetch YouTube metadata
  const ytIds = extractYouTubeIds(message);
  let ytContext = '';
  if (ytIds.length > 0) {
    const metaResults = await Promise.all(ytIds.map(fetchYouTubeMetadata));
    const metas = metaResults.filter(Boolean);
    if (metas.length > 0) {
      ytContext = '\n\nVIDEOS DETECTADOS EN EL MENSAJE:\n' +
        metas.map(m => `- YouTube: "${m.title}" por ${m.author}\n  URL: ${m.watchUrl}\n  Embed: ${m.embedUrl}\n  Thumbnail: ${m.thumbnail}`).join('\n');
    }
  }

  // Add user message
  session.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

  // Rebuild admin prompt to have fresh data
  await buildAdminSystemPrompt();

  // Build conversation context (last 10 messages)
  const recent = session.messages.slice(-10);
  const history = recent.map(m => `${m.role === 'user' ? 'Admin' : 'Asistente'}: ${m.content}`).join('\n');
  const roleContext = `El usuario actual es ${req.userName} (${email}) con rol: ${req.userRole}.`;
  const fullPrompt = `${roleContext}\n\nConversación:\n${history}\n\nAdmin: ${message}${ytContext}`;

  try {
    // Call Claude proxy
    let proxyUrl = CLAUDE_PROXY_URL;
    let response;
    try {
      const proxyRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, system_prompt: adminSystemPrompt }),
        signal: AbortSignal.timeout(55000)
      });
      response = await proxyRes.json();
    } catch {
      proxyUrl = CLAUDE_PROXY_FALLBACK;
      const proxyRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, system_prompt: adminSystemPrompt }),
        signal: AbortSignal.timeout(55000)
      });
      response = await proxyRes.json();
    }

    if (response.error) throw new Error(response.error);
    const rawResponse = response.response || 'No pude generar una respuesta.';

    // Parse action block
    const { text, action } = parseActionBlock(rawResponse);

    // Store assistant message (text only, action stored separately)
    session.messages.push({
      role: 'assistant',
      content: text,
      action: action || undefined,
      timestamp: new Date().toISOString()
    });

    res.json({ text, action });
  } catch (err) {
    console.error('Admin assistant error:', err.message);
    res.status(500).json({ error: 'Error generando respuesta. Intenta de nuevo.' });
  }
});

// POST /api/admin/assistant/execute — execute a confirmed action
app.post('/api/admin/assistant/execute', adminOrEditorMiddleware, async (req, res) => {
  const { action: actionType, table, id, data } = req.body;
  if (!actionType || !table) return res.status(400).json({ error: 'Acción inválida' });

  const allowedTables = ['programs', 'courses', 'news', 'team_members', 'resources'];
  if (!allowedTables.includes(table)) return res.status(400).json({ error: 'Tabla no permitida' });

  const role = req.userRole;
  const email = req.userEmail;

  try {
    let result;
    let logStatus = 'executed';

    if (actionType === 'create') {
      if (!data || !data.title) return res.status(400).json({ error: 'Datos insuficientes: título requerido' });
      if (!data.slug) data.slug = slugify(data.title);
      if (table === 'news' && !data.published_at) data.published_at = new Date().toISOString();
      if (table === 'news' && !data.status) data.status = 'published';
      result = await portalMutate(table, 'POST', data);
      result = Array.isArray(result) ? result[0] : result;

    } else if (actionType === 'update') {
      if (!id) return res.status(400).json({ error: 'ID requerido para actualizar' });
      result = await portalMutate(table, 'PATCH', data, `id=eq.${id}`);
      result = Array.isArray(result) && result.length ? result[0] : result;

    } else if (actionType === 'delete') {
      if (!id) return res.status(400).json({ error: 'ID requerido para eliminar' });

      // Editor: soft-delete (set status to hidden + create pending approval)
      if (role === 'editor') {
        // Get current data before hiding
        const current = await portalQuery(table, `id=eq.${id}&limit=1`);
        const before = current.length ? current[0] : null;

        // Soft-delete: set status/enrollment_status to hidden
        const statusField = table === 'courses' ? 'enrollment_status' : 'status';
        if (table === 'news' || table === 'courses') {
          await portalMutate(table, 'PATCH', { [statusField]: 'hidden' }, `id=eq.${id}`);
        } else {
          // For tables without status field, we still track it
          await portalMutate(table, 'PATCH', { slug: before?.slug ? before.slug + '-hidden' : 'hidden' }, `id=eq.${id}`);
        }

        // Create pending approval
        await portalMutate('admin_actions', 'POST', {
          user_email: email,
          user_role: role,
          action_type: 'delete',
          target_table: table,
          target_id: id,
          data_before: before,
          status: 'pending_approval'
        });

        logStatus = 'pending_approval';
        result = { hidden: true, pending: true, message: 'Contenido ocultado. Un admin debe aprobar la eliminación.' };

      } else {
        // Admin: hard delete
        const current = await portalQuery(table, `id=eq.${id}&limit=1`);
        await portalMutate(table, 'DELETE', null, `id=eq.${id}`);
        result = { deleted: true };

        // Log the action
        await portalMutate('admin_actions', 'POST', {
          user_email: email,
          user_role: role,
          action_type: 'delete',
          target_table: table,
          target_id: id,
          data_before: current.length ? current[0] : null,
          status: 'executed'
        });
      }

    } else {
      return res.status(400).json({ error: 'Tipo de acción no válido' });
    }

    // Log create/update actions
    if (actionType !== 'delete') {
      await portalMutate('admin_actions', 'POST', {
        user_email: email,
        user_role: role,
        action_type: actionType,
        target_table: table,
        target_id: result?.id || id || null,
        data_after: data,
        status: logStatus
      });
    }

    // Rebuild admin prompt after mutation
    await buildAdminSystemPrompt();
    // Also rebuild chat prompt so public chatbot stays current
    await buildChatSystemPrompt();

    res.json({ success: true, result });
  } catch (err) {
    console.error('Admin execute error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/assistant/history — conversation history
app.get('/api/admin/assistant/history', adminOrEditorMiddleware, (req, res) => {
  const session = adminChatSessions.get(req.userEmail);
  res.json(session ? session.messages : []);
});

// GET /api/admin/assistant/pending — list pending approvals (admin only)
app.get('/api/admin/assistant/pending', adminOrEditorMiddleware, async (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  try {
    const pending = await portalQuery('admin_actions', 'status=eq.pending_approval&order=created_at.desc');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/assistant/review — approve or reject pending action (admin only)
app.post('/api/admin/assistant/review', adminOrEditorMiddleware, async (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  const { actionId, decision } = req.body; // decision: 'approve' or 'reject'
  if (!actionId || !['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ error: 'actionId y decision (approve|reject) requeridos' });
  }

  try {
    const actions = await portalQuery('admin_actions', `id=eq.${actionId}&status=eq.pending_approval&limit=1`);
    if (!actions.length) return res.status(404).json({ error: 'Acción pendiente no encontrada' });
    const action = actions[0];

    if (decision === 'approve') {
      // Execute the hard delete
      await portalMutate(action.target_table, 'DELETE', null, `id=eq.${action.target_id}`);
      await portalMutate('admin_actions', 'PATCH', {
        status: 'approved',
        reviewed_by: req.userEmail,
        reviewed_at: new Date().toISOString()
      }, `id=eq.${actionId}`);
      // Rebuild prompts
      await buildAdminSystemPrompt();
      await buildChatSystemPrompt();
      res.json({ success: true, message: 'Eliminación aprobada y ejecutada.' });
    } else {
      // Reject: restore original status
      const before = action.data_before;
      if (before) {
        const statusField = action.target_table === 'courses' ? 'enrollment_status' : 'status';
        const restoreData = {};
        if (before[statusField]) restoreData[statusField] = before[statusField];
        if (before.slug && before.slug !== (before.slug || '').replace('-hidden', '')) restoreData.slug = before.slug;
        if (Object.keys(restoreData).length) {
          await portalMutate(action.target_table, 'PATCH', restoreData, `id=eq.${action.target_id}`);
        }
      }
      await portalMutate('admin_actions', 'PATCH', {
        status: 'rejected',
        reviewed_by: req.userEmail,
        reviewed_at: new Date().toISOString()
      }, `id=eq.${actionId}`);
      res.json({ success: true, message: 'Eliminación rechazada. Contenido restaurado.' });
    }
  } catch (err) {
    console.error('Admin review error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// === Admin CRUD API ===

function adminMiddleware(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Sesión expirada' });
  if (!isAdmin(user.email)) return res.status(403).json({ error: 'No autorizado' });
  req.userEmail = user.email;
  req.userName = user.username;
  next();
}

// --- Programs CRUD ---
app.post('/api/admin/programs', adminMiddleware, async (req, res) => {
  try {
    const data = req.body;
    if (!data.title) return res.status(400).json({ error: 'Título requerido' });
    if (!data.slug) data.slug = slugify(data.title);
    const result = await portalMutate('programs', 'POST', data);
    res.status(201).json(Array.isArray(result) ? result[0] : result);
  } catch (err) {
    console.error('Admin create program:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/programs/:id', adminMiddleware, async (req, res) => {
  try {
    const result = await portalMutate('programs', 'PATCH', req.body, `id=eq.${req.params.id}`);
    if (!result.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result[0]);
  } catch (err) {
    console.error('Admin update program:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/programs/:id', adminMiddleware, async (req, res) => {
  try {
    await portalMutate('programs', 'DELETE', null, `id=eq.${req.params.id}`);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Admin delete program:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Courses CRUD ---
app.post('/api/admin/courses', adminMiddleware, async (req, res) => {
  try {
    const data = req.body;
    if (!data.title) return res.status(400).json({ error: 'Título requerido' });
    if (!data.slug) data.slug = slugify(data.title);
    const result = await portalMutate('courses', 'POST', data);
    res.status(201).json(Array.isArray(result) ? result[0] : result);
  } catch (err) {
    console.error('Admin create course:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/courses/:id', adminMiddleware, async (req, res) => {
  try {
    const result = await portalMutate('courses', 'PATCH', req.body, `id=eq.${req.params.id}`);
    if (!result.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result[0]);
  } catch (err) {
    console.error('Admin update course:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/courses/:id', adminMiddleware, async (req, res) => {
  try {
    await portalMutate('courses', 'DELETE', null, `id=eq.${req.params.id}`);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Admin delete course:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- News CRUD ---
app.post('/api/admin/news', adminMiddleware, async (req, res) => {
  try {
    const data = req.body;
    if (!data.title) return res.status(400).json({ error: 'Título requerido' });
    if (!data.slug) data.slug = slugify(data.title);
    if (!data.published_at) data.published_at = new Date().toISOString();
    const result = await portalMutate('news', 'POST', data);
    const created = Array.isArray(result) ? result[0] : result;
    // Fire-and-forget push notification — does not block the response
    sendPushNotification({
      title: data.title,
      body: data.summary || 'Nueva noticia en UMCE Virtual',
      data: { type: 'news', slug: data.slug || '' }
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('Admin create news:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/news/:id', adminMiddleware, async (req, res) => {
  try {
    const result = await portalMutate('news', 'PATCH', req.body, `id=eq.${req.params.id}`);
    if (!result.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result[0]);
  } catch (err) {
    console.error('Admin update news:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/news/:id', adminMiddleware, async (req, res) => {
  try {
    await portalMutate('news', 'DELETE', null, `id=eq.${req.params.id}`);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Admin delete news:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Trigger manual sync ---
app.post('/api/admin/sync/trigger', adminMiddleware, async (req, res) => {
  const { type } = req.body; // 'news' or 'moodle'
  if (!['news', 'moodle'].includes(type)) {
    return res.status(400).json({ error: 'Tipo debe ser "news" o "moodle"' });
  }
  // Log the trigger (actual sync runs on VPS via cron/scripts)
  try {
    await portalMutate('sync_log', 'POST', {
      source: type === 'news' ? 'sync_umce' : 'sync_moodle',
      sync_type: 'manual_trigger',
      status: 'triggered',
      triggered_by: req.userEmail
    });
    res.json({ status: 'triggered', type, message: 'Sync registrado. Los scripts VPS ejecutarán la sincronización.' });
  } catch (err) {
    console.error('Sync trigger error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Rebuild chat system prompt (admin) ---
app.post('/api/admin/chat/rebuild-prompt', adminMiddleware, async (req, res) => {
  try {
    await buildChatSystemPrompt();
    res.json({ status: 'ok', length: chatSystemPrompt.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === PIAC System — Fase 2: Lector PIAC + Lector Moodle + Matching ===

// --- Google Drive API setup (udfv@ OAuth) ---
let driveClient = null;
function getDriveClient() {
  if (driveClient) return driveClient;
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  driveClient = google.drive({ version: 'v3', auth: oauth2 });
  return driveClient;
}

// Helper: extract Google Drive file ID from various URL formats
function extractDriveFileId(url) {
  if (!url) return null;
  // https://drive.google.com/file/d/FILE_ID/view
  let m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // https://drive.google.com/open?id=FILE_ID
  m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // https://docs.google.com/document/d/FILE_ID/
  m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // Raw file ID (no URL)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(url)) return url;
  return null;
}

// Helper: download .docx from Drive and extract text with mammoth
async function downloadAndExtractPiac(driveFileId) {
  const drive = getDriveClient();
  if (!drive) throw new Error('Google Drive no configurado (falta GOOGLE_DRIVE_REFRESH_TOKEN)');

  // Get file metadata to verify it exists and is a docx
  const meta = await drive.files.get({ fileId: driveFileId, fields: 'id,name,mimeType,size' });
  const file = meta.data;

  let buffer;
  if (file.mimeType === 'application/vnd.google-apps.document') {
    // Google Doc — export as docx
    const res = await drive.files.export({ fileId: driveFileId, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }, { responseType: 'arraybuffer' });
    buffer = Buffer.from(res.data);
  } else {
    // Regular .docx — download directly
    const res = await drive.files.get({ fileId: driveFileId, alt: 'media' }, { responseType: 'arraybuffer' });
    buffer = Buffer.from(res.data);
  }

  // Extract text with mammoth
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value, fileName: file.name, mimeType: file.mimeType };
}

// Helper: call claude-proxy-container for LLM tasks
async function callClaudeProxy(prompt, systemPrompt) {
  let proxyUrl = CLAUDE_PROXY_URL;
  let response;
  try {
    const proxyRes = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system_prompt: systemPrompt }),
      // No timeout — PIAC parsing can take several minutes
    });
    response = await proxyRes.json();
  } catch (e) {
    proxyUrl = CLAUDE_PROXY_FALLBACK;
    const proxyRes = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system_prompt: systemPrompt }),
      // No timeout
    });
    response = await proxyRes.json();
  }
  if (response.error) throw new Error(`Claude proxy: ${response.error}`);
  return response.response || '';
}

// System prompt for PIAC parsing
const PIAC_PARSE_SYSTEM_PROMPT = `Eres un experto en diseño instruccional de la UMCE (Universidad Metropolitana de Ciencias de la Educación).
Tu tarea es extraer la estructura COMPLETA de un PIAC (Plan Instruccional de Actividad Curricular) desde texto plano y devolver JSON estructurado.

IMPORTANTE: El documento puede contener las "Orientaciones UGCI" (plantilla institucional) al inicio. IGNORA toda la sección de orientaciones/definiciones/alcance y enfócate SOLO en el contenido del PIAC del curso específico, que típicamente empieza con la identificación de la actividad curricular (nombre real del curso, docente, programa).

ESTRUCTURA QUE DEBES EXTRAER:
1. Identificación: nombre del curso, programa, docente, semestre, modalidad, horas, créditos SCT
2. Núcleos de Aprendizaje (1 a N): ejes temáticos. Cada uno tiene RF, CE, temas, repertorio
3. Sesiones individuales: cada sesión tiene número, título, y puede tener actividad sincrónica, asincrónica y autónoma
4. Evaluaciones sumativas con ponderaciones
5. Metodología y bibliografía

REGLAS:
- Devuelve SOLO JSON válido, sin texto adicional, sin markdown, sin backticks
- Si un campo no está presente en el texto, usa null
- Los porcentajes de ponderación son números (ej: 30 para 30%)
- Normaliza nombres de núcleos eliminando "Núcleo 1:", "Unidad 1:", etc. del inicio
- Las semanas son números enteros
- Extrae TODAS las sesiones que encuentres (session 1, session 2, etc.)
- Para cada sesión extrae el título/tema de la actividad sincrónica
- Si el RF o CE están vacíos en el documento, usa null (no inventes)
- Busca videos de YouTube (URLs) y agrégalos como recursos de la sesión

SCHEMA JSON REQUERIDO:
{
  "identificacion": {
    "nombre": "string",
    "programa": "string",
    "docente": "string",
    "email_docente": "string|null",
    "semestre": "string",
    "modalidad": "virtual|semipresencial|null",
    "tipo_docencia": "string|null",
    "horas": { "sincronicas": "number|null", "asincronicas": "number|null", "autonomas": "number|null" },
    "semanas": "number|null",
    "creditos_sct": "number|null"
  },
  "nucleos": [{
    "numero": "number",
    "nombre": "string",
    "semanas": { "inicio": "number|null", "fin": "number|null" },
    "resultado_formativo": "string|null",
    "criterios_evaluacion": ["string"],
    "temas": ["string"],
    "repertorio_evaluativo": ["string"],
    "sesiones": [{
      "numero": "number",
      "titulo": "string",
      "sincronico": "string|null (descripción breve de la actividad sincrónica)",
      "asincronico": "string|null (descripción breve de la actividad asincrónica)",
      "autonomo": "string|null (descripción breve del trabajo autónomo)",
      "recursos": [{ "tipo": "video|lectura|documento|link", "titulo": "string", "url": "string|null" }]
    }]
  }],
  "evaluaciones_sumativas": [{ "nombre": "string", "ponderacion": "number|null", "nucleo": "number|null" }],
  "metodologia": "string|null",
  "bibliografia": [{ "referencia": "string", "url": "string|null" }]
}`;

// Helper: parse LLM response as JSON (handles markdown fences)
function parseLlmJson(text) {
  let cleaned = text.trim();
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

// Helper: take Moodle course snapshot
async function takeMoodleSnapshot(platform, courseId) {
  const platformObj = PLATFORMS.find(p => p.id === platform);
  if (!platformObj) throw new Error(`Plataforma "${platform}" no encontrada`);
  if (!platformObj.url || !platformObj.token) throw new Error(`Plataforma "${platform}" no configurada`);

  // Fetch course contents (sections + modules)
  const contents = await moodleCall(platformObj, 'core_course_get_contents', { courseid: courseId });

  // Fetch additional module details in parallel
  const [assigns, forums, urls, resources] = await Promise.all([
    moodleCall(platformObj, 'mod_assign_get_assignments', { 'courseids[0]': courseId }).then(r => r.courses?.[0]?.assignments || []).catch(() => []),
    moodleCall(platformObj, 'mod_forum_get_forums_by_courses', { 'courseids[0]': courseId }).catch(() => []),
    moodleCall(platformObj, 'mod_url_get_urls_by_courses', { 'courseids[0]': courseId }).then(r => r.urls || []).catch(() => []),
    moodleCall(platformObj, 'mod_resource_get_resources_by_courses', { 'courseids[0]': courseId }).then(r => r.resources || []).catch(() => [])
  ]);

  // Index extra data by cmid for enrichment
  const assignMap = {};
  assigns.forEach(a => { assignMap[a.cmid] = a; });
  const forumMap = {};
  (Array.isArray(forums) ? forums : []).forEach(f => { forumMap[f.cmid] = f; });
  const urlMap = {};
  urls.forEach(u => { urlMap[u.coursemodule] = u; });
  const resourceMap = {};
  resources.forEach(r => { resourceMap[r.coursemodule] = r; });

  // Build normalized snapshot
  let totalActivities = 0;
  const sections = (contents || []).map(section => {
    const modules = (section.modules || []).map(mod => {
      totalActivities++;
      const base = {
        id: mod.id,
        modname: mod.modname,
        name: mod.name,
        visible: mod.visible === 1,
        uservisible: mod.uservisible !== false,
        url: mod.url || null,
        description: (mod.description || '').replace(/<[^>]*>/g, '').substring(0, 500) || null
      };

      // Enrich with module-specific data
      if (mod.modname === 'assign' && assignMap[mod.id]) {
        const a = assignMap[mod.id];
        base.dates = {
          allowsubmissionsfromdate: a.allowsubmissionsfromdate || null,
          duedate: a.duedate || null,
          cutoffdate: a.cutoffdate || null
        };
        base.grade = a.grade || null;
      } else if (mod.modname === 'forum' && forumMap[mod.id]) {
        const f = forumMap[mod.id];
        base.forumType = f.type || null;
        base.numdiscussions = f.numdiscussions || 0;
      } else if (mod.modname === 'url' && urlMap[mod.id]) {
        const u = urlMap[mod.id];
        base.externalurl = u.externalurl || null;
      } else if (mod.modname === 'resource' && resourceMap[mod.id]) {
        const r = resourceMap[mod.id];
        base.contents = (r.contentfiles || []).map(f => ({
          filename: f.filename,
          filesize: f.filesize,
          fileurl: f.fileurl,
          mimetype: f.mimetype
        }));
      }

      // Generic contents from core_course_get_contents
      if (!base.contents && mod.contents && mod.contents.length > 0) {
        base.contents = mod.contents.map(c => ({
          filename: c.filename,
          filesize: c.filesize,
          fileurl: c.fileurl,
          mimetype: c.mimetype
        }));
      }

      return base;
    });

    return {
      id: section.id,
      number: section.section,
      name: section.name || `Sección ${section.section}`,
      visible: section.visible === 1,
      summary: (section.summary || '').replace(/<[^>]*>/g, '').substring(0, 300) || null,
      modules
    };
  });

  return {
    course: { id: courseId, platform, platformName: platformObj.name },
    sections,
    sectionsCount: sections.length,
    activitiesCount: totalActivities,
    snapshotAt: new Date().toISOString()
  };
}

// --- PIAC Matching Engine (deterministic, no LLM) ---

function runMatching(piacJson, snapshotJson) {
  const nucleos = piacJson.nucleos || [];
  const sections = snapshotJson.sections || [];
  const allSections = sections;
  const allModules = sections.flatMap(s => (s.modules || []).map(m => ({ ...m, sectionNumber: s.number, sectionName: s.name })));

  // Classify sections by role
  const supportPatterns = /synchronous|sesion.?es? sincr|grabacion|uso exclusivo|presentaci|general/i;
  const contentPatterns = /core|nucleo|núcleo|unidad|module|tema|bloque/i;

  function classifySection(s) {
    if (s.number === 0) return 'general';
    const name = s.name || '';
    if (supportPatterns.test(name)) return 'support';
    if (contentPatterns.test(name)) return 'content';
    return 'unknown';
  }

  const sectionRoles = {};
  allSections.forEach(s => { sectionRoles[s.id] = classifySection(s); });

  // Smart section matching: by name/number, skipping support sections
  function findBestSection(nucleo) {
    const nucleoNum = nucleo.numero;
    const nucleoName = (nucleo.nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Try matching by number in section name (e.g., "Learning Core 1" → nucleo 1)
    for (const s of allSections) {
      if (sectionRoles[s.id] === 'general') continue;
      const sName = (s.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const sNum = sName.match(/(\d+)/);
      if (sNum && parseInt(sNum[1]) === nucleoNum && contentPatterns.test(s.name)) return s;
    }
    // Try name similarity
    for (const s of allSections) {
      if (sectionRoles[s.id] !== 'content' && sectionRoles[s.id] !== 'unknown') continue;
      const sName = (s.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (nucleoName.length > 5 && (sName.includes(nucleoName.substring(0, 12)) || nucleoName.includes(sName.substring(0, 12)))) return s;
    }
    return null;
  }

  // Collect all forums across all sections (some courses put forums in utility sections)
  const allForums = allModules.filter(m => m.modname === 'forum');
  const allAssigns = allModules.filter(m => m.modname === 'assign');
  const allQuizzes = allModules.filter(m => m.modname === 'quiz');

  const matches = [];
  const allDiscrepancies = [];
  const matchedSectionIds = new Set();
  const matchedModuleIds = new Set();

  nucleos.forEach((nucleo) => {
    const section = findBestSection(nucleo);
    if (section) matchedSectionIds.add(section.id);

    const nucleoMatch = {
      nucleo: { numero: nucleo.numero, nombre: nucleo.nombre, rf: nucleo.resultado_formativo },
      section: section ? { number: section.number, name: section.name, visible: section.visible } : null,
      sectionMatched: !!section,
      elements: []
    };

    if (!section) {
      allDiscrepancies.push({
        type: 'missing_in_moodle',
        severity: 'critical',
        piac_element: `Núcleo ${nucleo.numero}: ${nucleo.nombre}`,
        moodle_element: null,
        description: `No hay sección en Moodle correspondiente al Núcleo ${nucleo.numero}`
      });
      matches.push(nucleoMatch);
      return;
    }

    // Section visibility check
    if (!section.visible) {
      allDiscrepancies.push({
        type: 'mismatch',
        severity: 'critical',
        piac_element: `Núcleo ${nucleo.numero}: ${nucleo.nombre}`,
        moodle_element: `Sección ${section.number}: ${section.name}`,
        description: `Sección ${section.number} "${section.name}" está oculta en Moodle`
      });
    }

    const modules = section.modules || [];
    const weekStart = nucleo.semanas?.inicio;
    const weekEnd = nucleo.semanas?.fin;

    // --- Match PIAC sessions to Moodle books/content by name ---
    const contentMods = modules.filter(m => ['book', 'page', 'resource', 'url', 'scorm', 'h5pactivity', 'lesson'].includes(m.modname));
    const piacSesiones = nucleo.sesiones || [];

    if (piacSesiones.length > 0 && contentMods.length > 0) {
      // Try to match each PIAC session to a Moodle module by name
      piacSesiones.forEach(sesion => {
        const sesionTitle = (sesion.titulo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const sesionNum = sesion.numero;

        // Find Moodle module by session number or title similarity
        let bestMatch = null;
        for (const mod of contentMods) {
          const modName = (mod.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          // Match by session number: "Session 3: ..." matches sesion.numero=3
          const modNum = modName.match(/session\s*(\d+)/i);
          if (modNum && parseInt(modNum[1]) === sesionNum) { bestMatch = mod; break; }
          // Match by title keywords (at least 12 chars overlap)
          if (sesionTitle.length > 12 && modName.includes(sesionTitle.substring(0, 15))) { bestMatch = mod; break; }
          if (modName.length > 12 && sesionTitle.includes(modName.substring(modName.indexOf(':') + 1).trim().substring(0, 15))) { bestMatch = mod; break; }
        }

        nucleoMatch.elements.push({
          piac: { type: 'sesion', name: `Sesión ${sesionNum}: ${sesion.titulo}`, sincronico: sesion.sincronico, asincronico: sesion.asincronico, recursos: sesion.recursos },
          moodle: bestMatch ? { id: bestMatch.id, name: bestMatch.name, modname: bestMatch.modname, visible: bestMatch.visible } : null,
          matched: !!bestMatch
        });

        if (bestMatch) {
          matchedModuleIds.add(bestMatch.id);
        } else {
          allDiscrepancies.push({
            type: 'missing_in_moodle',
            severity: 'warning',
            piac_element: `Sesión ${sesionNum}: "${sesion.titulo}" — Núcleo ${nucleo.numero}`,
            moodle_element: null,
            description: `Sesión del PIAC sin contenido correspondiente en Moodle`
          });
        }
      });

      // Mark remaining content mods as matched (part of the section content)
      contentMods.filter(m => !matchedModuleIds.has(m.id)).forEach(m => {
        nucleoMatch.elements.push({
          piac: { type: 'contenido_extra', name: m.name },
          moodle: { id: m.id, name: m.name, modname: m.modname, visible: m.visible },
          matched: true
        });
        matchedModuleIds.add(m.id);
      });
    } else if (contentMods.length > 0) {
      // No PIAC sessions extracted — count content as bulk match
      nucleoMatch.elements.push({
        piac: { type: 'contenido', name: `${contentMods.length} recurso(s) de contenido` },
        moodle: contentMods.map(m => ({ id: m.id, name: m.name, modname: m.modname, visible: m.visible })),
        matched: true
      });
      contentMods.forEach(m => matchedModuleIds.add(m.id));
    } else if (section.visible) {
      allDiscrepancies.push({
        type: 'missing_in_moodle',
        severity: 'warning',
        piac_element: `Núcleo ${nucleo.numero}: ${nucleo.nombre}`,
        moodle_element: `Sección ${section.number}: ${section.name}`,
        description: `Sección visible pero sin contenido (0 recursos)`
      });
    }

    // --- Match forums by session number range ---
    // Forums named "Forum session N" where N falls within nucleo weeks
    if (weekStart && weekEnd) {
      const nucleoForums = allForums.filter(f => {
        const m = f.name.match(/(?:session|sesión|sesion)\s*(\d+)/i);
        if (!m) return false;
        const sessionNum = parseInt(m[1]);
        return sessionNum >= weekStart && sessionNum <= weekEnd;
      });
      if (nucleoForums.length > 0) {
        nucleoMatch.elements.push({
          piac: { type: 'foros', name: `${nucleoForums.length} foro(s) de sesiones ${weekStart}-${weekEnd}` },
          moodle: nucleoForums.map(f => ({ id: f.id, name: f.name, modname: 'forum', visible: f.visible, sectionName: f.sectionName })),
          matched: true
        });
        nucleoForums.forEach(f => matchedModuleIds.add(f.id));
      }
    }

    // --- Match assigns (evaluaciones) in the section ---
    const sectionAssigns = modules.filter(m => m.modname === 'assign');
    sectionAssigns.forEach(a => {
      nucleoMatch.elements.push({
        piac: { type: 'evaluacion', name: a.name },
        moodle: { id: a.id, name: a.name, modname: 'assign', visible: a.visible },
        matched: true
      });
      matchedModuleIds.add(a.id);
    });

    // --- LTI (Zoom/external tools) in the section ---
    const ltiMods = modules.filter(m => m.modname === 'lti');
    ltiMods.forEach(m => {
      nucleoMatch.elements.push({
        piac: { type: 'herramienta', name: m.name },
        moodle: { id: m.id, name: m.name, modname: 'lti', visible: m.visible },
        matched: true
      });
      matchedModuleIds.add(m.id);
    });

    // --- Data activities (grabaciones, etc.) ---
    const dataMods = modules.filter(m => m.modname === 'data');
    dataMods.forEach(m => {
      nucleoMatch.elements.push({
        piac: { type: 'base_datos', name: m.name },
        moodle: { id: m.id, name: m.name, modname: 'data', visible: m.visible },
        matched: true
      });
      matchedModuleIds.add(m.id);
    });

    // --- Quizzes in the section ---
    const sectionQuizzes = modules.filter(m => m.modname === 'quiz');
    sectionQuizzes.forEach(q => {
      nucleoMatch.elements.push({
        piac: { type: 'evaluacion', name: q.name },
        moodle: { id: q.id, name: q.name, modname: 'quiz', visible: q.visible },
        matched: true
      });
      matchedModuleIds.add(q.id);
    });

    matches.push(nucleoMatch);
  });

  // --- Evaluaciones sumativas: check across whole course ---
  const evals = piacJson.evaluaciones_sumativas || [];
  evals.forEach(ev => {
    const evName = (ev.nombre || '').toLowerCase();

    // Try to find matching activity anywhere in course
    let found = null;
    if (evName.includes('foro') || evName.includes('discusi') || evName.includes('participaci')) {
      const unmatched = allForums.filter(f => !matchedModuleIds.has(f.id));
      if (unmatched.length > 0) {
        found = { type: 'forums', items: unmatched, count: unmatched.length };
        unmatched.forEach(f => matchedModuleIds.add(f.id));
      }
    } else if (evName.includes('prueba') || evName.includes('quiz') || evName.includes('examen') || evName.includes('test')) {
      const match = allQuizzes.find(q => !matchedModuleIds.has(q.id));
      if (match) { found = { type: 'quiz', item: match }; matchedModuleIds.add(match.id); }
    } else if (evName.includes('tarea') || evName.includes('trabajo') || evName.includes('ensayo') || evName.includes('producción') || evName.includes('escrit')) {
      const match = allAssigns.find(a => !matchedModuleIds.has(a.id));
      if (match) { found = { type: 'assign', item: match }; matchedModuleIds.add(match.id); }
    }

    if (!found) {
      // Not a critical issue — evaluaciones often use Moodle's gradebook or folders, not dedicated activities
      allDiscrepancies.push({
        type: 'missing_in_moodle',
        severity: 'warning',
        piac_element: `Evaluación: "${ev.nombre}" (${ev.ponderacion || '?'}%)`,
        moodle_element: null,
        description: `Evaluación "${ev.nombre}" del PIAC sin actividad evaluativa dedicada en Moodle`
      });
    }
  });

  // --- Support sections: mark modules as recognized (not discrepancies) ---
  allSections.filter(s => sectionRoles[s.id] === 'support' || sectionRoles[s.id] === 'general').forEach(s => {
    (s.modules || []).forEach(m => matchedModuleIds.add(m.id));
  });

  // --- Truly unmatched modules (in content sections, not recognized by anything) ---
  allSections.filter(s => matchedSectionIds.has(s.id)).forEach(s => {
    (s.modules || []).filter(m => !matchedModuleIds.has(m.id) && m.modname !== 'label').forEach(mod => {
      allDiscrepancies.push({
        type: 'missing_in_piac',
        severity: 'info',
        piac_element: null,
        moodle_element: `${mod.modname}: "${mod.name}" (Sección ${s.number})`,
        description: `Elemento en Moodle no reconocido en PIAC`
      });
    });
  });

  // --- Unmatched content sections (not support, not matched to nucleos) ---
  allSections.filter(s => s.number > 0 && !matchedSectionIds.has(s.id) && sectionRoles[s.id] !== 'support' && sectionRoles[s.id] !== 'general').forEach(s => {
    if (s.modules && s.modules.length > 0) {
      allDiscrepancies.push({
        type: 'missing_in_piac',
        severity: 'info',
        piac_element: null,
        moodle_element: `Sección ${s.number}: "${s.name}" (${s.modules.length} elementos)`,
        description: `Sección de contenido en Moodle sin núcleo correspondiente en PIAC`
      });
    }
  });

  // Build summary
  const totalPiacElements = nucleos.length + evals.length + nucleos.reduce((s, n) => s + (n.repertorio_evaluativo || []).length, 0);
  const totalMoodleActivities = allSections.reduce((sum, s) => sum + (s.modules || []).length, 0);
  const matchedCount = matches.reduce((sum, m) => sum + m.elements.filter(e => e.matched).length, 0);
  const criticalCount = allDiscrepancies.filter(d => d.severity === 'critical').length;
  const warningCount = allDiscrepancies.filter(d => d.severity === 'warning').length;
  const infoCount = allDiscrepancies.filter(d => d.severity === 'info').length;

  const summary = {
    nucleos_piac: nucleos.length,
    sections_moodle: allSections.filter(s => s.number > 0).length,
    nucleos_matched: matches.filter(m => m.sectionMatched).length,
    total_piac_elements: totalPiacElements,
    total_moodle_activities: totalMoodleActivities,
    matched_elements: matchedCount,
    discrepancies: { critical: criticalCount, warning: warningCount, info: infoCount, total: allDiscrepancies.length }
  };

  return { matches, discrepancies: allDiscrepancies, summary };
}

// --- PIAC API Endpoints ---

// POST /api/piac/link — DI vincula PIAC Drive + curso Moodle
app.post('/api/piac/link', adminOrEditorMiddleware, async (req, res) => {
  try {
    const { moodle_platform, moodle_course_id, drive_url, program_id } = req.body;
    if (!moodle_platform || !moodle_course_id || !drive_url) {
      return res.status(400).json({ error: 'moodle_platform, moodle_course_id y drive_url son requeridos' });
    }

    const platformObj = PLATFORMS.find(p => p.id === moodle_platform);
    if (!platformObj) return res.status(400).json({ error: `Plataforma "${moodle_platform}" no existe` });

    // Verify course exists in Moodle
    let courseName = null;
    try {
      const courses = await moodleCall(platformObj, 'core_course_get_courses', { 'options[ids][0]': moodle_course_id });
      if (!courses || courses.length === 0) return res.status(404).json({ error: `Curso ID ${moodle_course_id} no encontrado en ${moodle_platform}` });
      courseName = courses[0].fullname;
    } catch (e) {
      return res.status(400).json({ error: `Error verificando curso en Moodle: ${e.message}` });
    }

    // Extract Drive file ID
    const driveFileId = extractDriveFileId(drive_url);

    // Check for duplicate
    const existing = await portalQuery('piac_links', `moodle_platform=eq.${encodeURIComponent(moodle_platform)}&moodle_course_id=eq.${moodle_course_id}&status=eq.active`);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe un vínculo activo para este curso', existing: existing[0] });
    }

    const link = await portalMutate('piac_links', 'POST', {
      program_id: program_id || null,
      moodle_course_id: parseInt(moodle_course_id),
      moodle_platform,
      drive_file_id: driveFileId,
      drive_url,
      course_name: courseName,
      linked_by: req.userEmail
    });

    res.json({ created: true, link: link[0] || link });
  } catch (err) {
    console.error('PIAC link error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/piac/links — list all active links with latest analysis status
app.get('/api/piac/links', adminOrEditorMiddleware, async (req, res) => {
  try {
    const links = await portalQuery('piac_links', 'status=eq.active&order=created_at.desc');

    // Enrich with latest matching summary for each link
    const enriched = await Promise.all(links.map(async (link) => {
      try {
        const matchings = await portalQuery('matching_results', `piac_link_id=eq.${link.id}&order=created_at.desc&limit=1`);
        const latestParsed = await portalQuery('piac_parsed', `piac_link_id=eq.${link.id}&order=parsed_at.desc&limit=1`);
        return {
          ...link,
          last_analysis: matchings[0] ? { summary: matchings[0].summary_json, date: matchings[0].created_at } : null,
          last_parsed: latestParsed[0] ? { date: latestParsed[0].parsed_at, version: latestParsed[0].version } : null
        };
      } catch {
        return { ...link, last_analysis: null, last_parsed: null };
      }
    }));

    res.json(enriched);
  } catch (err) {
    console.error('PIAC links list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/piac/link/:id — full detail with parsed, snapshot, matching, discrepancies
app.get('/api/piac/link/:id', adminOrEditorMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const links = await portalQuery('piac_links', `id=eq.${id}`);
    if (links.length === 0) return res.status(404).json({ error: 'Vínculo no encontrado' });
    const link = links[0];

    const [parsed, snapshots, matchings] = await Promise.all([
      portalQuery('piac_parsed', `piac_link_id=eq.${id}&order=parsed_at.desc&limit=1`),
      portalQuery('moodle_snapshots', `piac_link_id=eq.${id}&order=snapshot_at.desc&limit=1`),
      portalQuery('matching_results', `piac_link_id=eq.${id}&order=created_at.desc&limit=1`)
    ]);

    let discrepancies = [];
    if (matchings.length > 0) {
      discrepancies = await portalQuery('discrepancies', `matching_id=eq.${matchings[0].id}&order=severity.asc,created_at.desc`);
    }

    res.json({
      link,
      parsed: parsed[0] || null,
      snapshot: snapshots[0] || null,
      matching: matchings[0] || null,
      discrepancies
    });
  } catch (err) {
    console.error('PIAC link detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/piac/link/:id — soft delete (archive)
app.delete('/api/piac/link/:id', adminOrEditorMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.userEmail)) return res.status(403).json({ error: 'Solo admin puede eliminar vínculos' });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    await portalMutate('piac_links', 'PATCH', { status: 'archived', updated_at: new Date().toISOString() }, `id=eq.${id}`);
    res.json({ archived: true });
  } catch (err) {
    console.error('PIAC link delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/piac/:linkId/parse — download PIAC from Drive, extract text, parse with LLM
app.post('/api/piac/:linkId/parse', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) return res.status(400).json({ error: 'ID inválido' });

    const links = await portalQuery('piac_links', `id=eq.${linkId}&status=eq.active`);
    if (links.length === 0) return res.status(404).json({ error: 'Vínculo no encontrado' });
    const link = links[0];

    if (!link.drive_file_id) return res.status(400).json({ error: 'No hay file ID de Drive — verifica el link' });

    // Step 1: Download and extract text
    console.log(`PIAC parse: downloading ${link.drive_file_id}...`);
    const { text, fileName } = await downloadAndExtractPiac(link.drive_file_id);
    if (!text || text.trim().length < 100) {
      return res.status(400).json({ error: 'El documento está vacío o tiene muy poco contenido' });
    }
    console.log(`PIAC parse: extracted ${text.length} chars from "${fileName}"`);

    // Step 2: Parse with LLM
    const llmResponse = await callClaudeProxy(
      `Extrae la estructura de este PIAC y devuelve el JSON:\n\n${text}`,
      PIAC_PARSE_SYSTEM_PROMPT
    );

    const parsedJson = parseLlmJson(llmResponse);

    // Step 3: Determine version
    const prevVersions = await portalQuery('piac_parsed', `piac_link_id=eq.${linkId}&order=version.desc&limit=1`);
    const nextVersion = prevVersions.length > 0 ? prevVersions[0].version + 1 : 1;

    // Step 4: Save
    const saved = await portalMutate('piac_parsed', 'POST', {
      piac_link_id: linkId,
      version: nextVersion,
      raw_text: text.substring(0, 100000),
      parsed_json: parsedJson,
      llm_model: 'claude-proxy',
      tokens_used: Math.round(text.length / 4)
    });

    // Update link timestamp
    await portalMutate('piac_links', 'PATCH', { updated_at: new Date().toISOString() }, `id=eq.${linkId}`);

    res.json({ parsed: true, version: nextVersion, data: saved[0] || saved });
  } catch (err) {
    console.error('PIAC parse error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/piac/:linkId/snapshot — take Moodle course snapshot
app.post('/api/piac/:linkId/snapshot', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) return res.status(400).json({ error: 'ID inválido' });

    const links = await portalQuery('piac_links', `id=eq.${linkId}&status=eq.active`);
    if (links.length === 0) return res.status(404).json({ error: 'Vínculo no encontrado' });
    const link = links[0];

    console.log(`Moodle snapshot: ${link.moodle_platform} course ${link.moodle_course_id}...`);
    const snapshot = await takeMoodleSnapshot(link.moodle_platform, link.moodle_course_id);

    const saved = await portalMutate('moodle_snapshots', 'POST', {
      piac_link_id: linkId,
      sections_count: snapshot.sectionsCount,
      activities_count: snapshot.activitiesCount,
      snapshot_json: snapshot
    });

    res.json({ snapshot: true, data: saved[0] || saved });
  } catch (err) {
    console.error('Moodle snapshot error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/piac/:linkId/match — run matching engine on latest parsed + snapshot
app.post('/api/piac/:linkId/match', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) return res.status(400).json({ error: 'ID inválido' });

    const [parsedArr, snapshotArr] = await Promise.all([
      portalQuery('piac_parsed', `piac_link_id=eq.${linkId}&order=parsed_at.desc&limit=1`),
      portalQuery('moodle_snapshots', `piac_link_id=eq.${linkId}&order=snapshot_at.desc&limit=1`)
    ]);

    if (parsedArr.length === 0) return res.status(400).json({ error: 'No hay PIAC parseado — ejecuta /parse primero' });
    if (snapshotArr.length === 0) return res.status(400).json({ error: 'No hay snapshot Moodle — ejecuta /snapshot primero' });

    const parsed = parsedArr[0];
    const snapshot = snapshotArr[0];

    console.log(`Matching: link ${linkId}, PIAC v${parsed.version}, snapshot ${snapshot.id}...`);
    const result = runMatching(parsed.parsed_json, snapshot.snapshot_json);

    // Save matching result
    const savedMatching = await portalMutate('matching_results', 'POST', {
      piac_link_id: linkId,
      piac_parsed_id: parsed.id,
      moodle_snapshot_id: snapshot.id,
      matches_json: result.matches,
      summary_json: result.summary
    });
    const matchingId = (savedMatching[0] || savedMatching).id;

    // Save individual discrepancies
    if (result.discrepancies.length > 0) {
      await portalMutate('discrepancies', 'POST',
        result.discrepancies.map(d => ({ matching_id: matchingId, ...d }))
      );
    }

    res.json({ matched: true, summary: result.summary, matchingId, discrepancies: result.discrepancies.length });
  } catch (err) {
    console.error('Matching error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/piac/:linkId/analyze — full pipeline: parse + snapshot + match
app.post('/api/piac/:linkId/analyze', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) return res.status(400).json({ error: 'ID inválido' });

    const links = await portalQuery('piac_links', `id=eq.${linkId}&status=eq.active`);
    if (links.length === 0) return res.status(404).json({ error: 'Vínculo no encontrado' });
    const link = links[0];

    const steps = { parse: null, snapshot: null, match: null };

    // Step 1: Parse PIAC
    if (link.drive_file_id) {
      try {
        const { text, fileName } = await downloadAndExtractPiac(link.drive_file_id);
        if (text && text.trim().length >= 100) {
          const llmResponse = await callClaudeProxy(
            `Extrae la estructura de este PIAC y devuelve el JSON:\n\n${text}`,
            PIAC_PARSE_SYSTEM_PROMPT
          );
          const parsedJson = parseLlmJson(llmResponse);
          const prevVersions = await portalQuery('piac_parsed', `piac_link_id=eq.${linkId}&order=version.desc&limit=1`);
          const nextVersion = prevVersions.length > 0 ? prevVersions[0].version + 1 : 1;
          await portalMutate('piac_parsed', 'POST', {
            piac_link_id: linkId, version: nextVersion, raw_text: text.substring(0, 100000),
            parsed_json: parsedJson, llm_model: 'claude-proxy', tokens_used: Math.round(text.length / 4)
          });
          steps.parse = { ok: true, version: nextVersion, fileName };
        } else {
          steps.parse = { ok: false, error: 'Documento vacío' };
        }
      } catch (e) {
        steps.parse = { ok: false, error: e.message };
      }
    } else {
      steps.parse = { ok: false, error: 'No hay file ID de Drive' };
    }

    // Step 2: Moodle snapshot
    try {
      const snapshot = await takeMoodleSnapshot(link.moodle_platform, link.moodle_course_id);
      await portalMutate('moodle_snapshots', 'POST', {
        piac_link_id: linkId, sections_count: snapshot.sectionsCount,
        activities_count: snapshot.activitiesCount, snapshot_json: snapshot
      });
      steps.snapshot = { ok: true, sections: snapshot.sectionsCount, activities: snapshot.activitiesCount };
    } catch (e) {
      steps.snapshot = { ok: false, error: e.message };
    }

    // Step 3: Match (only if both parse and snapshot succeeded)
    if (steps.parse?.ok && steps.snapshot?.ok) {
      try {
        const [parsedArr, snapshotArr] = await Promise.all([
          portalQuery('piac_parsed', `piac_link_id=eq.${linkId}&order=parsed_at.desc&limit=1`),
          portalQuery('moodle_snapshots', `piac_link_id=eq.${linkId}&order=snapshot_at.desc&limit=1`)
        ]);
        const result = runMatching(parsedArr[0].parsed_json, snapshotArr[0].snapshot_json);
        const savedMatching = await portalMutate('matching_results', 'POST', {
          piac_link_id: linkId, piac_parsed_id: parsedArr[0].id,
          moodle_snapshot_id: snapshotArr[0].id, matches_json: result.matches, summary_json: result.summary
        });
        const matchingId = (savedMatching[0] || savedMatching).id;
        if (result.discrepancies.length > 0) {
          await portalMutate('discrepancies', 'POST', result.discrepancies.map(d => ({ matching_id: matchingId, ...d })));
        }
        steps.match = { ok: true, summary: result.summary, discrepancies: result.discrepancies.length };
      } catch (e) {
        steps.match = { ok: false, error: e.message };
      }
    } else {
      steps.match = { ok: false, error: 'Parse o snapshot fallaron — no se puede hacer matching' };
    }

    await portalMutate('piac_links', 'PATCH', { updated_at: new Date().toISOString() }, `id=eq.${linkId}`);
    res.json({ analyzed: true, steps });
  } catch (err) {
    console.error('Full analyze error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/piac/discrepancy/:id/resolve — mark discrepancy as resolved
app.post('/api/piac/discrepancy/:id/resolve', adminOrEditorMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    await portalMutate('discrepancies', 'PATCH', {
      resolved: true, resolved_by: req.userEmail, resolved_at: new Date().toISOString()
    }, `id=eq.${id}`);
    res.json({ resolved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Curso Virtual (authenticated, read-only) ---
app.get('/api/curso-virtual/:linkId', authMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) return res.status(400).json({ error: 'ID inválido' });

    const links = await portalQuery('piac_links', `id=eq.${linkId}&status=eq.active`);
    if (links.length === 0) return res.status(404).json({ error: 'Curso no encontrado' });
    const link = links[0];

    const [parsedArr, snapshotArr, matchingArr, configArr, defaultsArr] = await Promise.all([
      portalQuery('piac_parsed', `piac_link_id=eq.${linkId}&order=parsed_at.desc&limit=1`),
      portalQuery('moodle_snapshots', `piac_link_id=eq.${linkId}&order=snapshot_at.desc&limit=1`),
      portalQuery('matching_results', `piac_link_id=eq.${linkId}&order=created_at.desc&limit=1`),
      portalQuery('curso_virtual_config', `piac_link_id=eq.${linkId}`),
      portalQuery('institutional_defaults')
    ]);

    const config = configArr[0] || null;
    const isAdminOrEditor = getUserRole(req.userEmail);

    // If not published and user is not admin/editor, show fallback
    if (!isAdminOrEditor && (!config || !config.publicado)) {
      return res.json({
        fallback: true,
        curso: { nombre: link.course_name },
        moodle: {
          platform: link.moodle_platform,
          platformName: (PLATFORMS.find(p => p.id === link.moodle_platform))?.name || link.moodle_platform,
          courseId: link.moodle_course_id,
          courseUrl: `${(PLATFORMS.find(p => p.id === link.moodle_platform))?.url || ''}/course/view.php?id=${link.moodle_course_id}`
        }
      });
    }

    const piac = parsedArr[0]?.parsed_json || null;
    const snapshot = snapshotArr[0]?.snapshot_json || null;
    if (!piac || !snapshot) return res.status(404).json({ error: 'Curso sin análisis — contacta al DI' });

    // Resolve config with institutional defaults
    const defaultMap = {};
    defaultsArr.forEach(d => { defaultMap[d.key] = d.value; });
    const resolvedConfig = config ? {
      docente_foto_url: config.docente_foto_url || null,
      docente_bio: config.docente_bio || null,
      docente_video_bienvenida: config.docente_video_bienvenida || null,
      docente_mensaje_bienvenida: config.docente_mensaje_bienvenida || null,
      docente_horario_atencion: config.docente_horario_atencion || defaultMap.docente_horario_atencion || 'Consultar por email',
      docente_tiempos_respuesta: config.docente_tiempos_respuesta || JSON.parse(defaultMap.docente_tiempos_respuesta || '{}'),
      descripcion_motivacional: config.descripcion_motivacional || null,
      conocimientos_previos: config.conocimientos_previos || defaultMap.conocimientos_previos || 'Sin requisitos previos específicos',
      competencias_digitales: config.competencias_digitales || defaultMap.competencias_digitales || '',
      politicas_curso: config.politicas_curso || defaultMap.politicas_curso || '',
      politica_integridad: config.politica_integridad || defaultMap.politica_integridad || '',
      actividades_config: config.actividades_config || {},
      objetivos_semanales: config.objetivos_semanales || {},
      publicado: config.publicado || false
    } : null;

    // Build the merged "curso virtual" view
    const nucleos = piac.nucleos || [];
    const sections = snapshot.sections || [];
    const allModules = sections.flatMap(s => (s.modules || []).map(m => ({ ...m, sectionNumber: s.number, sectionName: s.name })));

    // Find support elements (shared across nucleos)
    const supportPatterns = /synchronous|sesion.?es? sincr|grabacion|uso exclusivo|presentaci|general/i;
    const contentPatterns = /core|nucleo|núcleo|unidad|module|tema|bloque/i;

    // Visado: check if DI marked an activity as hidden
    const actConfig = resolvedConfig?.actividades_config || {};
    function isVisadoVisible(moduleId) {
      const cfg = actConfig[String(moduleId)];
      return !cfg || cfg.visible !== false;
    }

    // Shared resources from S0 and support sections — filtered by DI visado
    const sharedResources = [];
    sections.filter(s => s.number === 0 || supportPatterns.test(s.name || '')).forEach(s => {
      (s.modules || []).forEach(m => {
        if (m.visible !== false && m.modname !== 'label' && isVisadoVisible(m.id)) {
          sharedResources.push({ id: m.id, name: m.name, modname: m.modname, url: m.url, description: m.description, sectionName: s.name });
        }
      });
    });

    // Match sections to nucleos (same logic as matching engine)
    function findSection(nucleo) {
      for (const s of sections) {
        const sName = (s.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const sNum = sName.match(/(\d+)/);
        if (sNum && parseInt(sNum[1]) === nucleo.numero && contentPatterns.test(s.name)) return s;
      }
      return null;
    }

    // Helper: extract session number from activity name (handles accents, typos)
    function extractSessionNum(name) {
      const normalized = (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const match = normalized.match(/sess?ion\s*(\d+)/i);
      return match ? parseInt(match[1]) : null;
    }

    // All forums indexed by session number
    const forumsBySession = {};
    allModules.filter(m => m.modname === 'forum').forEach(f => {
      const num = extractSessionNum(f.name);
      if (num) forumsBySession[num] = f;
    });

    // All books indexed by session number
    const booksBySession = {};
    allModules.filter(m => m.modname === 'book').forEach(b => {
      const num = extractSessionNum(b.name);
      if (num) booksBySession[num] = b;
    });

    // Build merged nucleos
    const mergedNucleos = nucleos.map(nucleo => {
      const section = findSection(nucleo);
      const modules = section ? (section.modules || []) : [];
      const weekStart = nucleo.semanas?.inicio;
      const weekEnd = nucleo.semanas?.fin;

      // Content NOT indexed by session (pages, resources, urls, scorm — NOT books)
      const contenidoGeneral = modules.filter(m => ['page', 'resource', 'url', 'scorm', 'h5pactivity', 'lesson'].includes(m.modname) && m.visible !== false && isVisadoVisible(m.id)).map(m => ({
        id: m.id, name: m.name, modname: m.modname, url: m.url, description: m.description
      }));

      // Books and forums per session/week
      const porSemana = {};
      if (weekStart && weekEnd) {
        for (let w = weekStart; w <= weekEnd; w++) {
          const weekData = { book: null, forum: null };
          if (booksBySession[w] && isVisadoVisible(booksBySession[w].id)) {
            const b = booksBySession[w];
            weekData.book = { id: b.id, name: b.name, modname: 'book', url: b.url, description: b.description };
          }
          if (forumsBySession[w] && isVisadoVisible(forumsBySession[w].id)) {
            const f = forumsBySession[w];
            weekData.forum = { id: f.id, name: f.name, url: f.url, session: w };
          }
          porSemana[w] = weekData;
        }
      }

      // Evaluaciones from this section — filtered by DI visado
      const evaluaciones = modules.filter(m => ['assign', 'quiz'].includes(m.modname) && isVisadoVisible(m.id)).map(m => ({
        id: m.id, name: m.name, modname: m.modname, url: m.url, dates: m.dates
      }));

      // Backward compat: flat contenido array (general + all books)
      const allBooks = Object.values(porSemana).filter(w => w.book).map(w => w.book);
      const contenido = [...contenidoGeneral, ...allBooks];
      // Backward compat: flat foros array
      const foros = Object.values(porSemana).filter(w => w.forum).map(w => w.forum);

      return {
        numero: nucleo.numero,
        nombre: nucleo.nombre,
        semanas: nucleo.semanas,
        resultado_formativo: nucleo.resultado_formativo,
        criterios_evaluacion: nucleo.criterios_evaluacion,
        temas: nucleo.temas,
        visible: section ? section.visible : false,
        porSemana,
        contenido,
        foros,
        evaluaciones,
        totalElementos: contenido.length + foros.length + evaluaciones.length
      };
    });

    const platformObj = PLATFORMS.find(p => p.id === link.moodle_platform);

    res.json({
      curso: {
        nombre: piac.identificacion?.nombre || link.course_name,
        programa: piac.identificacion?.programa,
        docente: piac.identificacion?.docente,
        email_docente: piac.identificacion?.email_docente,
        modalidad: piac.identificacion?.modalidad,
        semanas: piac.identificacion?.semanas,
        creditos_sct: piac.identificacion?.creditos_sct,
        horas: piac.identificacion?.horas,
        metodologia: piac.metodologia,
        bibliografia: piac.bibliografia
      },
      nucleos: mergedNucleos,
      recursos_compartidos: sharedResources,
      evaluaciones_sumativas: piac.evaluaciones_sumativas || [],
      moodle: {
        platform: link.moodle_platform,
        platformName: platformObj?.name || link.moodle_platform,
        courseId: link.moodle_course_id,
        courseUrl: `${platformObj?.url || ''}/course/view.php?id=${link.moodle_course_id}`
      },
      config: resolvedConfig,
      // Personalized data (async, non-blocking)
      personal: await (async () => {
        try {
          const moodleUserId = await resolveMoodleUserId(req.userEmail, link.moodle_platform);
          if (!moodleUserId) return { resolved: false };

          const [completion, grades, recordings, calendar] = await Promise.all([
            fetchCompletion(link.moodle_platform, link.moodle_course_id, moodleUserId),
            fetchGrades(link.moodle_platform, link.moodle_course_id, moodleUserId),
            fetchCachedRecordings(link.moodle_platform, link.moodle_course_id),
            fetchCachedCalendar(link.moodle_platform, link.moodle_course_id)
          ]);

          return { resolved: true, moodleUserId, completion, grades, recordings, calendar };
        } catch (err) {
          console.error('Personal data error:', err.message);
          return { resolved: false, error: err.message };
        }
      })()
    });
  } catch (err) {
    console.error('Curso virtual API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST refresh personal data (throttled)
const refreshThrottle = new Map();
app.post('/api/curso-virtual/:linkId/refresh', authMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    const key = `${req.userEmail}:${linkId}`;
    const lastRefresh = refreshThrottle.get(key) || 0;
    if (Date.now() - lastRefresh < 5 * 60 * 1000) {
      return res.status(429).json({ error: 'Espera 5 minutos entre actualizaciones' });
    }
    refreshThrottle.set(key, Date.now());

    const links = await portalQuery('piac_links', `id=eq.${linkId}&status=eq.active`);
    if (links.length === 0) return res.status(404).json({ error: 'Curso no encontrado' });
    const link = links[0];

    const moodleUserId = await resolveMoodleUserId(req.userEmail, link.moodle_platform);
    if (!moodleUserId) return res.json({ refreshed: false, reason: 'Usuario no encontrado en Moodle' });

    const [completion, grades] = await Promise.all([
      fetchCompletion(link.moodle_platform, link.moodle_course_id, moodleUserId),
      fetchGrades(link.moodle_platform, link.moodle_course_id, moodleUserId)
    ]);

    res.json({ refreshed: true, completion: !!completion, grades: !!grades });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET book chapters with HTML content (for inline rendering)
app.get('/api/curso-virtual/book/:platform/:cmid', authMiddleware, async (req, res) => {
  try {
    const platformId = req.params.platform;
    const cmid = parseInt(req.params.cmid);
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return res.status(400).json({ error: 'Plataforma no encontrada' });

    // Get the book's chapters via core_course_get_contents (we need the file URLs)
    // First find which course this book belongs to by checking piac_links
    // Actually, we can get book content directly from the module
    const contents = await moodleCall(platform, 'core_course_get_contents', {
      courseid: 0, // We need the courseid - let's get it from the URL params
    }).catch(() => null);

    // Better approach: use the pluginfile URLs directly
    // The frontend knows the book URL, so we proxy the chapter content
    // Let's use mod_book_get_books_by_courses isn't ideal without courseid
    // Instead, fetch the module info and its files

    // Get all courses the token has access to that contain this cmid
    // Simpler: the frontend passes courseId too
    const courseId = parseInt(req.query.courseId);
    if (!courseId) return res.status(400).json({ error: 'courseId requerido' });

    const courseContents = await moodleCall(platform, 'core_course_get_contents', { courseid: courseId });
    let bookModule = null;
    for (const section of courseContents) {
      for (const mod of (section.modules || [])) {
        if (mod.id === cmid && mod.modname === 'book') {
          bookModule = mod;
          break;
        }
      }
      if (bookModule) break;
    }
    if (!bookModule) return res.status(404).json({ error: 'Book no encontrado' });

    // Fetch each chapter's HTML content
    const chapters = [];
    for (const content of (bookModule.contents || [])) {
      if (content.filename && content.filename.endsWith('.html') && content.fileurl) {
        const chapterUrl = content.fileurl + (content.fileurl.includes('?') ? '&' : '?') + `token=${platform.token}`;
        try {
          const chRes = await fetch(chapterUrl, { signal: AbortSignal.timeout(8000) });
          if (chRes.ok) {
            let html = await chRes.text();
            // Sanitize: remove script tags but keep iframes (YouTube, Genially, Padlet, Canva)
            html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
            // Fix relative URLs to absolute
            html = html.replace(/src="\/pluginfile/g, `src="${platform.url}/pluginfile`);
            // Extract chapter number from filepath
            const chapterMatch = content.filepath?.match(/\/(\d+)\//);
            const chapterNum = chapterMatch ? parseInt(chapterMatch[1]) : chapters.length + 1;
            chapters.push({
              id: chapterNum,
              title: content.content || `Capitulo ${chapters.length + 1}`,
              html,
              filename: content.filename
            });
          }
        } catch (e) {
          console.error(`Book chapter fetch error: ${e.message}`);
        }
      }
    }

    res.json({
      book: { cmid, name: bookModule.name, description: bookModule.description },
      chapters
    });
  } catch (err) {
    console.error('Book API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- API: Curso Virtual Config (Fase 3) ---

// GET config for a piac link
app.get('/api/piac/:linkId/config', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) return res.status(400).json({ error: 'ID inválido' });

    const configs = await portalQuery('curso_virtual_config', `piac_link_id=eq.${linkId}`);
    if (configs.length === 0) {
      // Return empty config with defaults
      const defaults = await portalQuery('institutional_defaults');
      const defaultMap = {};
      defaults.forEach(d => { defaultMap[d.key] = d.value; });
      return res.json({ config: null, defaults: defaultMap, exists: false });
    }
    res.json({ config: configs[0], exists: true });
  } catch (err) {
    console.error('Config GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT (create or update) config for a piac link
app.put('/api/piac/:linkId/config', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) return res.status(400).json({ error: 'ID inválido' });

    // Verify piac_link exists
    const links = await portalQuery('piac_links', `id=eq.${linkId}&status=eq.active`);
    if (links.length === 0) return res.status(404).json({ error: 'Vínculo PIAC no encontrado' });

    const existing = await portalQuery('curso_virtual_config', `piac_link_id=eq.${linkId}`);
    const payload = { ...req.body, updated_at: new Date().toISOString(), updated_by: req.userEmail };
    delete payload.id;
    delete payload.piac_link_id;
    delete payload.created_at;
    delete payload.publicado;
    delete payload.publicado_at;
    delete payload.publicado_por;

    let result;
    if (existing.length === 0) {
      result = await portalMutate('curso_virtual_config', 'POST', { piac_link_id: linkId, ...payload });
    } else {
      result = await portalMutate('curso_virtual_config', 'PATCH', payload, `piac_link_id=eq.${linkId}`);
    }
    res.json(result[0] || result);
  } catch (err) {
    console.error('Config PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST publish curso virtual
app.post('/api/piac/:linkId/config/publish', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) return res.status(400).json({ error: 'ID inválido' });

    // Verify analysis exists before publishing
    const [parsedArr, snapshotArr] = await Promise.all([
      portalQuery('piac_parsed', `piac_link_id=eq.${linkId}&order=parsed_at.desc&limit=1`),
      portalQuery('moodle_snapshots', `piac_link_id=eq.${linkId}&order=snapshot_at.desc&limit=1`)
    ]);
    if (parsedArr.length === 0 || snapshotArr.length === 0) {
      return res.status(400).json({ error: 'No se puede publicar sin análisis PIAC+Moodle completo' });
    }

    // Ensure config exists
    const existing = await portalQuery('curso_virtual_config', `piac_link_id=eq.${linkId}`);
    const now = new Date().toISOString();
    if (existing.length === 0) {
      await portalMutate('curso_virtual_config', 'POST', {
        piac_link_id: linkId, publicado: true, publicado_at: now, publicado_por: req.userEmail
      });
    } else {
      await portalMutate('curso_virtual_config', 'PATCH', {
        publicado: true, publicado_at: now, publicado_por: req.userEmail, updated_at: now, updated_by: req.userEmail
      }, `piac_link_id=eq.${linkId}`);
    }
    res.json({ publicado: true });
  } catch (err) {
    console.error('Publish error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST unpublish curso virtual
app.post('/api/piac/:linkId/config/unpublish', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) return res.status(400).json({ error: 'ID inválido' });

    const existing = await portalQuery('curso_virtual_config', `piac_link_id=eq.${linkId}`);
    if (existing.length === 0) return res.status(404).json({ error: 'No hay configuración para este curso' });

    await portalMutate('curso_virtual_config', 'PATCH', {
      publicado: false, updated_at: new Date().toISOString(), updated_by: req.userEmail
    }, `piac_link_id=eq.${linkId}`);
    res.json({ publicado: false });
  } catch (err) {
    console.error('Unpublish error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET preview (same as curso-virtual but ignores publicado flag — for DI)
app.get('/api/piac/:linkId/preview', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) return res.status(400).json({ error: 'ID inválido' });

    // Reuse curso-virtual logic but skip publicado check
    const fakeReq = { ...req, params: { linkId: String(linkId) } };
    // Forward to the existing handler by calling it directly
    req.params.linkId = String(linkId);
    req._isPreview = true;

    // Fetch all data
    const links = await portalQuery('piac_links', `id=eq.${linkId}&status=eq.active`);
    if (links.length === 0) return res.status(404).json({ error: 'Curso no encontrado' });
    const link = links[0];

    const [parsedArr, snapshotArr, configArr, defaults] = await Promise.all([
      portalQuery('piac_parsed', `piac_link_id=eq.${linkId}&order=parsed_at.desc&limit=1`),
      portalQuery('moodle_snapshots', `piac_link_id=eq.${linkId}&order=snapshot_at.desc&limit=1`),
      portalQuery('curso_virtual_config', `piac_link_id=eq.${linkId}`),
      portalQuery('institutional_defaults')
    ]);

    const piac = parsedArr[0]?.parsed_json || null;
    const snapshot = snapshotArr[0]?.snapshot_json || null;
    if (!piac || !snapshot) return res.status(404).json({ error: 'Curso sin análisis — ejecuta Analizar primero' });

    const config = configArr[0] || {};
    const defaultMap = {};
    defaults.forEach(d => { defaultMap[d.key] = d.value; });

    // Resolve config with defaults
    const resolvedConfig = {
      docente_foto_url: config.docente_foto_url || null,
      docente_bio: config.docente_bio || null,
      docente_video_bienvenida: config.docente_video_bienvenida || null,
      docente_mensaje_bienvenida: config.docente_mensaje_bienvenida || null,
      docente_horario_atencion: config.docente_horario_atencion || defaultMap.docente_horario_atencion || 'Consultar por email',
      docente_tiempos_respuesta: config.docente_tiempos_respuesta || JSON.parse(defaultMap.docente_tiempos_respuesta || '{"email":"48h hábiles","foro":"48h hábiles","tareas":"7 días hábiles"}'),
      descripcion_motivacional: config.descripcion_motivacional || null,
      conocimientos_previos: config.conocimientos_previos || defaultMap.conocimientos_previos || 'Sin requisitos previos específicos',
      competencias_digitales: config.competencias_digitales || defaultMap.competencias_digitales || '',
      politicas_curso: config.politicas_curso || defaultMap.politicas_curso || '',
      politica_integridad: config.politica_integridad || defaultMap.politica_integridad || '',
      requisitos_participacion: config.requisitos_participacion || null,
      foro_presentacion_cmid: config.foro_presentacion_cmid || null,
      foro_consultas_cmid: config.foro_consultas_cmid || null,
      actividades_config: config.actividades_config || {},
      objetivos_semanales: config.objetivos_semanales || {},
      publicado: config.publicado || false
    };

    res.json({ config: resolvedConfig, defaults: defaultMap });
  } catch (err) {
    console.error('Preview config error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET/PUT institutional defaults (admin only)
app.get('/api/institutional-defaults', adminOrEditorMiddleware, async (req, res) => {
  try {
    const defaults = await portalQuery('institutional_defaults', 'order=key.asc');
    res.json(defaults);
  } catch (err) {
    console.error('Defaults GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/institutional-defaults/:key', adminOrEditorMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.userEmail)) return res.status(403).json({ error: 'Solo admin puede editar defaults' });
    const key = req.params.key;
    const { value } = req.body;
    if (!value) return res.status(400).json({ error: 'Value requerido' });

    const existing = await portalQuery('institutional_defaults', `key=eq.${encodeURIComponent(key)}`);
    if (existing.length === 0) {
      await portalMutate('institutional_defaults', 'POST', { key, value, updated_at: new Date().toISOString(), updated_by: req.userEmail });
    } else {
      await portalMutate('institutional_defaults', 'PATCH', { value, updated_at: new Date().toISOString(), updated_by: req.userEmail }, `key=eq.${encodeURIComponent(key)}`);
    }
    res.json({ key, value, updated: true });
  } catch (err) {
    console.error('Defaults PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- API: Notifications (Fase 4) ---

// GET notifications for current user (or admin can query any email)
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const email = isAdmin(req.userEmail) && req.query.email ? req.query.email : req.userEmail;
    const unreadOnly = req.query.unread === 'true' ? '&read=eq.false' : '';
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await portalQuery('notifications', `umce_email=eq.${encodeURIComponent(email)}${unreadOnly}&order=created_at.desc&limit=${limit}`);
    const unreadCount = (await portalQuery('notifications', `umce_email=eq.${encodeURIComponent(email)}&read=eq.false&select=id`)).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Notifications GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT mark notification as read
app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await portalMutate('notifications', 'PATCH', { read: true }, `id=eq.${req.params.id}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT mark all as read for current user
app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await portalMutate('notifications', 'PATCH', { read: true }, `umce_email=eq.${encodeURIComponent(req.userEmail)}&read=eq.false`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET notifications for a specific piac link (DI view)
app.get('/api/piac/:linkId/notifications', adminOrEditorMiddleware, async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await portalQuery('notifications', `piac_link_id=eq.${linkId}&order=created_at.desc&limit=${limit}`);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Cron Engine (Fase 4) ---

async function cronCreateNotification(email, linkId, type, title, body, dataJson) {
  // Avoid duplicates: check if same type+link exists in last 24h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const existing = await portalQuery('notifications',
    `umce_email=eq.${encodeURIComponent(email)}&piac_link_id=eq.${linkId}&type=eq.${type}&created_at=gte.${cutoff}&limit=1`);
  if (existing.length > 0) return null;

  const result = await portalMutate('notifications', 'POST', {
    umce_email: email, piac_link_id: linkId, type, title, body, data_json: dataJson || {}
  });
  return result[0] || result;
}

async function cronRefreshRecordings(link, platform) {
  try {
    // Find mod_data activity in the course (recordings database)
    const contents = await moodleCall(platform, 'core_course_get_contents', { courseid: link.moodle_course_id });
    let dataActivityId = null;
    for (const section of contents) {
      for (const mod of (section.modules || [])) {
        if (mod.modname === 'data') { dataActivityId = mod.instance; break; }
      }
      if (dataActivityId) break;
    }
    if (!dataActivityId) return null;

    const entries = await moodleCall(platform, 'mod_data_get_entries', { databaseid: dataActivityId });
    const recordings = (entries.entries || []).map(entry => {
      const fields = {};
      (entry.contents || []).forEach(c => { fields[c.fieldid] = c.content; });
      return { id: entry.id, fields, timecreated: entry.timecreated };
    });

    // Upsert into cache
    await portalMutate('cache_recordings', 'POST', {
      moodle_platform: link.moodle_platform,
      moodle_course_id: link.moodle_course_id,
      recordings_json: recordings,
      fetched_at: new Date().toISOString()
    }, 'on_conflict=moodle_platform,moodle_course_id');

    return recordings.length;
  } catch (err) {
    console.error(`Cron recordings error [${link.moodle_platform}/${link.moodle_course_id}]:`, err.message);
    return null;
  }
}

async function cronRefreshCalendar(link, platform) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const future = now + 90 * 24 * 60 * 60; // 90 days ahead
    const events = await moodleCall(platform, 'core_calendar_get_calendar_events', {
      'events[courseids][0]': link.moodle_course_id,
      'options[timestart]': now,
      'options[timeend]': future
    });

    const eventList = (events.events || []).map(e => ({
      id: e.id, name: e.name, description: (e.description || '').replace(/<[^>]*>/g, '').substring(0, 200),
      timestart: e.timestart, timeduration: e.timeduration,
      eventtype: e.eventtype, modulename: e.modulename
    }));

    await portalMutate('cache_calendar', 'POST', {
      moodle_platform: link.moodle_platform,
      moodle_course_id: link.moodle_course_id,
      events_json: eventList,
      fetched_at: new Date().toISOString()
    }, 'on_conflict=moodle_platform,moodle_course_id');

    return eventList.length;
  } catch (err) {
    console.error(`Cron calendar error [${link.moodle_platform}/${link.moodle_course_id}]:`, err.message);
    return null;
  }
}

async function cronRefreshSnapshot(link, platform) {
  try {
    // Get current snapshot
    const oldSnapshots = await portalQuery('moodle_snapshots', `piac_link_id=eq.${link.id}&order=snapshot_at.desc&limit=1`);
    const oldSnapshot = oldSnapshots[0]?.snapshot_json;
    const oldActivitiesCount = oldSnapshots[0]?.activities_count || 0;

    // Fresh snapshot from Moodle
    const contents = await moodleCall(platform, 'core_course_get_contents', { courseid: link.moodle_course_id });
    let activitiesCount = 0;
    const sections = contents.map(s => {
      const modules = (s.modules || []).map(m => {
        activitiesCount++;
        return {
          id: m.id, modname: m.modname, name: m.name, visible: m.visible !== 0,
          url: m.url, description: (m.description || '').substring(0, 500),
          modplural: m.modplural, dates: { added: m.added },
          contents: (m.contents || []).map(c => ({ filename: c.filename, fileurl: c.fileurl }))
        };
      });
      return { id: s.id, number: s.section, name: s.name, visible: s.visible !== 0, modules };
    });

    const newSnapshot = {
      course: { id: link.moodle_course_id, platform: link.moodle_platform },
      sections, sectionsCount: sections.length, activitiesCount
    };

    // Save new snapshot
    await portalMutate('moodle_snapshots', 'POST', {
      piac_link_id: link.id, sections_count: sections.length,
      activities_count: activitiesCount, snapshot_json: newSnapshot
    });

    // Detect changes and generate alerts
    if (oldSnapshot) {
      const oldSections = oldSnapshot.sections || [];
      const changes = [];

      // Check for visibility changes
      sections.forEach(newS => {
        const oldS = oldSections.find(o => o.number === newS.number);
        if (oldS && oldS.visible && !newS.visible) {
          changes.push(`Sección "${newS.name}" fue ocultada`);
        }
        if (oldS && !oldS.visible && newS.visible) {
          changes.push(`Sección "${newS.name}" fue habilitada`);
        }
      });

      // Check for activity count changes
      if (activitiesCount !== oldActivitiesCount) {
        const diff = activitiesCount - oldActivitiesCount;
        changes.push(`${Math.abs(diff)} actividad${Math.abs(diff) > 1 ? 'es' : ''} ${diff > 0 ? 'agregada' + (Math.abs(diff) > 1 ? 's' : '') : 'eliminada' + (Math.abs(diff) > 1 ? 's' : '')}`);
      }

      // Notify editors about changes
      if (changes.length > 0) {
        const editors = [...(process.env.EDITOR_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean), ...ADMIN_EMAILS];
        for (const editor of editors) {
          await cronCreateNotification(editor, link.id, 'structure_change',
            `Cambios en ${link.course_name || 'Curso ' + link.moodle_course_id}`,
            changes.join('. '),
            { changes, platform: link.moodle_platform, courseId: link.moodle_course_id }
          );
        }
      }

      return { changes: changes.length, activitiesDiff: activitiesCount - oldActivitiesCount };
    }
    return { changes: 0, firstSnapshot: true };
  } catch (err) {
    console.error(`Cron snapshot error [${link.moodle_platform}/${link.moodle_course_id}]:`, err.message);
    return null;
  }
}

// Main cron tick — runs for all active published courses
async function cronTick() {
  try {
    // Get all active piac_links with published config
    const links = await portalQuery('piac_links', 'status=eq.active');
    if (links.length === 0) return;

    const configs = await portalQuery('curso_virtual_config', 'publicado=eq.true');
    const publishedLinkIds = new Set(configs.map(c => c.piac_link_id));

    for (const link of links) {
      if (!publishedLinkIds.has(link.id)) continue;

      const platform = PLATFORMS.find(p => p.id === link.moodle_platform);
      if (!platform || !platform.url || !platform.token) continue;

      console.log(`[Cron] Processing ${link.moodle_platform}/${link.moodle_course_id}`);

      // Stagger calls to avoid overwhelming Moodle
      await cronRefreshRecordings(link, platform);
      await new Promise(r => setTimeout(r, 1000));

      await cronRefreshCalendar(link, platform);
      await new Promise(r => setTimeout(r, 1000));

      await cronRefreshSnapshot(link, platform);
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`[Cron] Tick complete — processed ${links.filter(l => publishedLinkIds.has(l.id)).length} courses`);
  } catch (err) {
    console.error('[Cron] Tick error:', err.message);
  }
}

// Schedule: run every 6 hours
const CRON_INTERVAL = 6 * 60 * 60 * 1000;
let cronTimer = null;

function startCron() {
  console.log(`[Cron] Started — interval: ${CRON_INTERVAL / 1000 / 60} min`);
  // First run after 30s (let server warm up)
  setTimeout(() => {
    cronTick();
    cronTimer = setInterval(cronTick, CRON_INTERVAL);
  }, 30000);
}

// Manual trigger for admin
app.post('/api/admin/cron/run', adminOrEditorMiddleware, async (req, res) => {
  if (!isAdmin(req.userEmail)) return res.status(403).json({ error: 'Solo admin' });
  try {
    cronTick(); // fire and forget
    res.json({ ok: true, message: 'Cron triggered — check server logs' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Health check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platforms: PLATFORMS.map(p => ({ id: p.id, name: p.name, url: p.url })),
    timestamp: new Date().toISOString()
  });
});

// === Page Routes ===
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/catalogo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'catalogo.html')));
app.get('/competencias', (req, res) => res.sendFile(path.join(__dirname, 'public', 'competencias.html')));
app.get('/servicios', (req, res) => res.sendFile(path.join(__dirname, 'public', 'servicios.html')));
app.get('/noticias', (req, res) => res.sendFile(path.join(__dirname, 'public', 'noticias.html')));
app.get('/mis-cursos', (req, res) => res.sendFile(path.join(__dirname, 'public', 'mis-cursos.html')));
app.get('/ayuda', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ayuda.html')));
app.get('/privacidad', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacidad.html')));

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/piac', (req, res) => res.sendFile(path.join(__dirname, 'public', 'piac.html')));
app.get('/curso-virtual/:linkId', (req, res) => res.sendFile(path.join(__dirname, 'public', 'curso-virtual.html')));

// Dynamic slug-based pages
app.get('/programa/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'programa.html')));
app.get('/curso/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'curso.html')));
app.get('/noticia/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'noticia.html')));

// Backward compatibility redirects
app.get('/mis-cursos.html', (req, res) => res.redirect(301, '/mis-cursos'));
app.get('/ayuda.html', (req, res) => res.redirect(301, '/ayuda'));
app.get('/privacidad.html', (req, res) => res.redirect(301, '/privacidad'));
app.get('/index.html', (req, res) => res.redirect(301, '/'));

// === Push Notification Endpoints ===

// POST /api/push/register — no auth required; app registers on first launch
app.post('/api/push/register', async (req, res) => {
  try {
    const { token, platform, email } = req.body;
    if (!token || typeof token !== 'string' || token.length > 4096) {
      return res.status(400).json({ error: 'Token inválido o faltante' });
    }
    if (!platform || !['android', 'ios', 'web'].includes(platform)) {
      return res.status(400).json({ error: 'Platform debe ser android, ios o web' });
    }

    // If the request comes with a session cookie, use that email
    const cookies = parseCookies(req);
    const sessionToken = cookies[COOKIE_NAME];
    let resolvedEmail = null;
    if (sessionToken) {
      const user = verifyToken(sessionToken);
      if (user) resolvedEmail = user.email;
    }
    // Body email as fallback (anonymous install providing email)
    if (!resolvedEmail && email && typeof email === 'string' && email.includes('@')) {
      resolvedEmail = email.toLowerCase();
    }

    await upsertDeviceToken(token, platform, resolvedEmail);
    res.json({ registered: true });
  } catch (err) {
    console.error('Push register error:', err.message);
    res.status(500).json({ error: 'Error registrando dispositivo' });
  }
});

// POST /api/admin/push/send — admin only; manual push blast
app.post('/api/admin/push/send', adminMiddleware, async (req, res) => {
  try {
    const { title, body, data } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title y body son requeridos' });
    const result = await sendPushNotification({ title, body, data: data || {} });
    res.json(result);
  } catch (err) {
    console.error('Admin push send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 404 catch-all (must be last)
app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Global error handler — prevent stack trace leaks
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`umce.online running on port ${PORT}`);
  console.log(`Platforms configured: ${PLATFORMS.map(p => p.id).join(', ')}`);
  startCron();
});
