/**
 * Menus CRUD API — Vercel Serverless Function
 *
 * GET    /api/menus          — List user's menus
 * POST   /api/menus          — Create a new menu
 * GET    /api/menus/:id      — Get one menu
 * PUT    /api/menus/:id      — Update a menu
 * DELETE /api/menus/:id      — Delete a menu
 *
 * Uses traditional Node.js (req, res) format for Vercel compatibility.
 */

import { supabaseQuery, verifySupabaseToken } from './_supabase.js';

export const config = { runtime: 'nodejs' };

// ─── Helpers ──────────────────────────────────────
function json(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).end(JSON.stringify(data));
}

function err(res, status, message) {
  return json(res, status, { error: message });
}

/** Get Bearer token from Authorization header */
function getAuthHeader(req) {
  const h = req.headers?.authorization || req.headers?.['Authorization'] || '';
  return h.replace(/^Bearer\s+/, '');
}

async function getUser(req) {
  const token = getAuthHeader(req);
  if (!token) return null;
  return await verifySupabaseToken(token);
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return null;
}

// ─── Route dispatcher ─────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = url.pathname.replace(/^\/api\/menus\/?/, '');
    const method = req.method;

    if (!path && method === 'POST') return handleCreate(req, res);
    if (!path && method === 'GET') return handleList(req, res);

    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 1) {
      const id = parts[0];
      if (method === 'GET' && parts.length === 1) return handleGet(req, res, id);
      if (method === 'PUT' && parts.length === 1) return handleUpdate(req, res, id);
      if (method === 'DELETE' && parts.length === 1) return handleDelete(req, res, id);
    }

    return err(res, 405, 'Method not allowed');
  } catch (e) {
    console.error('[Menus] Unhandled error:', e?.message || e);
    return err(res, 500, 'Internal server error');
  }
}

// ─── List menus ───────────────────────────────────
async function handleList(req, res) {
  const user = await getUser(req);
  if (!user) return err(res, 401, 'Unauthorized');

  const result = await supabaseQuery('menus', {
    method: 'GET',
    query: { select: '*', order: 'updated_at.desc' },
    useServiceRole: true,
  });

  if (!result.ok) {
    console.error('[Menus] List failed:', result.status, result.error);
    return err(res, 502, `Database error: ${result.error}`);
  }

  return json(res, 200, result.data || []);
}

// ─── Create menu ──────────────────────────────────
async function handleCreate(req, res) {
  const user = await getUser(req);
  if (!user) return err(res, 401, 'Unauthorized');

  const body = await readBody(req);
  if (!body) return err(res, 400, 'Invalid body');

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
    useServiceRole: true,
  });

  if (!result.ok) {
    console.error('[Menus] Create failed:', result.status, result.error);
    return err(res, 502, `Failed to create menu: ${result.error}`);
  }

  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  return json(res, 201, row);
}

// ─── Get single menu ──────────────────────────────
async function handleGet(req, res, id) {
  const user = await getUser(req);
  if (!user) return err(res, 401, 'Unauthorized');

  const result = await supabaseQuery('menus', {
    method: 'GET',
    query: { select: '*', id: `eq.${id}`, limit: '1' },
    useServiceRole: true,
  });

  if (!result.ok) {
    console.error('[Menus] Get failed:', result.status, result.error);
    return err(res, 502, `Database error: ${result.error}`);
  }

  const row = Array.isArray(result.data) ? result.data[0] : null;
  if (!row) return err(res, 404, 'Menu not found');
  return json(res, 200, row);
}

// ─── Update menu ──────────────────────────────────
async function handleUpdate(req, res, id) {
  const user = await getUser(req);
  if (!user) return err(res, 401, 'Unauthorized');

  const body = await readBody(req);
  if (!body) return err(res, 400, 'Invalid body');

  const result = await supabaseQuery('menus', {
    method: 'PUT',
    query: { id: `eq.${id}` },
    body: {
      name: body.title,
      is_public: body.isVisible !== false,
      data: body,
    },
    useServiceRole: true,
  });

  if (!result.ok) {
    if (result.status === 404 || (Array.isArray(result.data) && result.data.length === 0)) {
      return err(res, 404, 'Menu not found');
    }
    console.error('[Menus] Update failed:', result.status, result.error);
    return err(res, 502, `Failed to update menu: ${result.error}`);
  }

  const row = Array.isArray(result.data) ? result.data[0] : null;
  if (!row) return err(res, 404, 'Menu not found');
  return json(res, 200, row);
}

// ─── Delete menu ──────────────────────────────────
async function handleDelete(req, res, id) {
  const user = await getUser(req);
  if (!user) return err(res, 401, 'Unauthorized');

  const result = await supabaseQuery('menus', {
    method: 'DELETE',
    query: { id: `eq.${id}` },
    useServiceRole: true,
  });

  if (!result.ok) {
    console.error('[Menus] Delete failed:', result.status, result.error);
    return err(res, 502, `Failed to delete menu: ${result.error}`);
  }

  return json(res, 200, { success: true });
}
