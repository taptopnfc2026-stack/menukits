/**
 * Menus CRUD API — Vercel Serverless Function
 *
 * GET    /api/menus          — List user's menus
 * POST   /api/menus          — Create a new menu
 * GET    /api/menus/:id      — Get one menu
 * PUT    /api/menus/:id      — Update a menu
 * DELETE /api/menus/:id      — Delete a menu
 *
 * IMPORTANT: Vercel Node.js runtime uses plain object headers (NOT Headers instance).
 * Always use req.headers['authorization'] instead of req.headers.get().
 */

import { supabaseQuery, verifySupabaseToken } from './_supabase.js';

// ─── Helpers ──────────────────────────────────────
function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(status, message) {
  return json(status, { error: message });
}

/** Vercel Node.js runtime: req.headers is a plain object, NOT a Web Headers instance */
function getAuthHeader(req) {
  return (req.headers?.['authorization'] || req.headers?.['Authorization'] || '').replace(/^Bearer\s+/, '');
}

async function getUser(req) {
  const token = getAuthHeader(req);
  if (!token) return null;
  return await verifySupabaseToken(token);
}

// ─── Route dispatcher ─────────────────────────────
export default async function handler(req) {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
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
    console.error('[Menus] Unhandled error:', e?.message || e);
    return err(500, 'Internal server error');
  }
}

// ─── List menus ───────────────────────────────────
async function handleList(req) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const result = await supabaseQuery('menus', {
    method: 'GET',
    query: { select: '*', order: 'updated_at.desc' },
    token: getAuthHeader(req) || undefined,
  });

  if (!result.ok) {
    console.error('[Menus] List failed:', result.status, result.error);
    return err(502, `Database error: ${result.error}`);
  }

  return json(200, result.data || []);
}

// ─── Create menu ──────────────────────────────────
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

  const result = await supabaseQuery('menus', {
    method: 'POST',
    body: {
      user_id: user.id,
      name: body.title || 'New Menu',
      slug,
      is_public: body.isVisible || false,
      language: body.language || 'en',
      data: body,
      settings: {},
    },
    token: getAuthHeader(req),
  });

  if (!result.ok) {
    console.error('[Menus] Create failed:', result.status, result.error);
    return err(502, `Failed to create menu: ${result.error}`);
  }

  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  return json(201, row);
}

// ─── Get single menu ──────────────────────────────
async function handleGet(req, id) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const result = await supabaseQuery('menus', {
    method: 'GET',
    query: { select: '*', id: `eq.${id}`, limit: '1' },
    token: getAuthHeader(req) || undefined,
  });

  if (!result.ok) {
    console.error('[Menus] Get failed:', result.status, result.error);
    return err(502, `Database error: ${result.error}`);
  }

  const row = Array.isArray(result.data) ? result.data[0] : null;
  if (!row) return err(404, 'Menu not found');

  return json(200, row);
}

// ─── Update menu ──────────────────────────────────
async function handleUpdate(req, id) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  if (!body) return err(400, 'Invalid body');

  const result = await supabaseQuery('menus', {
    method: 'PUT',
    query: { id: `eq.${id}` },
    body: {
      name: body.title,
      is_public: body.isVisible !== false,
      data: body,
    },
    token: getAuthHeader(req),
  });

  if (!result.ok) {
    // If row not found (empty array from PUT), return 404 so caller can retry as POST
    if (result.status === 404 || (Array.isArray(result.data) && result.data.length === 0)) {
      return err(404, 'Menu not found');
    }
    console.error('[Menus] Update failed:', result.status, result.error);
    return err(502, `Failed to update menu: ${result.error}`);
  }

  const row = Array.isArray(result.data) ? result.data[0] : null;
  if (!row) return err(404, 'Menu not found');
  return json(200, row);
}

// ─── Delete menu ──────────────────────────────────
async function handleDelete(req, id) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const result = await supabaseQuery('menus', {
    method: 'DELETE',
    query: { id: `eq.${id}` },
    token: getAuthHeader(req),
  });

  if (!result.ok) {
    console.error('[Menus] Delete failed:', result.status, result.error);
    return err(502, `Failed to delete menu: ${result.error}`);
  }

  return json(200, { success: true });
}
