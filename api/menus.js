/**
 * Menus CRUD API — Vercel Serverless Function
 *
 * GET    /api/menus          — List user's menus
 * POST   /api/menus          — Create a new menu
 * GET    /api/menus/:id      — Get one menu
 * PUT    /api/menus/:id      — Update a menu
 * DELETE /api/menus/:id      — Delete a menu
 */

import { supabaseQuery, verifySupabaseToken } from './_supabase.js';

// ─── Helpers ──────────────────────────────────────────────
function json(res, status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(res, status, message) {
  return json(res, status, { error: message });
}

async function getUser(req) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  return await verifySupabaseToken(token);
}

// ─── Route dispatcher ─────────────────────────────────────
export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\/menus\/?/, '');
    const method = req.method;

    // POST /api/menus → create
    if (!path && method === 'POST') return handleCreate(req);
    // GET /api/menus → list
    if (!path && method === 'GET') return handleList(req);

    // Routes with :id param
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 1) {
      const id = parts[0];
      if (method === 'GET' && parts.length === 1) return handleGet(req, id);
      if (method === 'PUT' && parts.length === 1) return handleUpdate(req, id);
      if (method === 'DELETE' && parts.length === 1) return handleDelete(req, id);
    }

    return err(405, 'Method not allowed');
  } catch (e) {
    console.error('Menus API error:', e);
    return err(500, 'Internal server error');
  }
}

// ─── List menus ───────────────────────────────────────────
async function handleList(req) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const rows = await supabaseQuery('menus', {
    method: 'GET',
    query: { select: '*', order: 'updated_at.desc' },
    token: user?.access_token,
  });

  return json(200, rows || []);
}

// ─── Create menu ──────────────────────────────────────────
async function handleCreate(req) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  if (!body) return err(400, 'Invalid body');

  // Generate slug from title
  const slug = (body.title || 'menu')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);

  const row = await supabaseQuery('menus', {
    method: 'POST',
    body: {
      user_id: user.id,
      name: body.title || 'New Menu',
      slug,
      is_public: body.isVisible || false,
      language: body.language || 'en',
      data: body,           // Store full menu object (sections, dishes, translations, etc.)
      settings: {},
    },
    token: user?.access_token,
  });

  return json(201, Array.isArray(row) ? row[0] : row);
}

// ─── Get single menu ──────────────────────────────────────
async function handleGet(req, id) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const rows = await supabaseQuery('menus', {
    method: 'GET',
    query: {
      select: '*',
      id: `eq.${id}`,
      limit: '1',
    },
    token: user?.access_token,
  });

  const row = (Array.isArray(rows) ? rows[0] : null);
  if (!row) return err(404, 'Menu not found');

  return json(200, row);
}

// ─── Update menu ──────────────────────────────────────────
async function handleUpdate(req, id) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  if (!body) return err(400, 'Invalid body');

  const rows = await supabaseQuery('menus', {
    method: 'PUT',
    query: { id: `eq.${id}` },
    body: {
      name: body.title,
      is_public: body.isVisible !== false,
      data: body,         // Full replacement of menu data
    },
    token: user?.access_token,
  });

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return err(404, 'Menu not found');
  return json(200, row);
}

// ─── Delete menu ──────────────────────────────────────────
async function handleDelete(req, id) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const res = await supabaseQuery('menus', {
    method: 'DELETE',
    query: { id: `eq.${id}` },
    token: user?.access_token,
  });

  return json(200, { success: true });
}
