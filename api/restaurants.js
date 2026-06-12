/**
 * Restaurants API — Authenticated CRUD.
 *
 * GET    /api/restaurants          — List user's restaurant(s)
 * PUT    /api/restaurants          — Update restaurant
 * POST   /api/restaurants          — Create new restaurant
 *
 * Uses traditional Node.js (req, res) format for Vercel compatibility.
 */

import { supabaseQuery, verifySupabaseToken } from './_supabase.js';

export const config = { runtime: 'nodejs' };

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') return handleList(req, res);
    if (req.method === 'PUT') return handlePut(req, res);
    if (req.method === 'POST') return handlePost(req, res);
    return err(res, 405, 'Method not allowed');
  } catch (e) {
    console.error('[Restaurants] Unhandled error:', e?.message || e);
    return err(res, 500, 'Internal server error');
  }
}

// ─── GET: List ─────────────────────────────────────
async function handleList(req, res) {
  const user = await getUser(req);
  if (!user) return err(res, 401, 'Unauthorized');

  const result = await supabaseQuery('restaurants', {
    method: 'GET',
    query: {
      select: 'id,name,slug,address,phone,website',
      user_id: `eq.${user.id}`,
      order: 'created_at.asc',
    },
    useServiceRole: true,
  });

  if (!result.ok) {
    console.error('[Restaurants] List failed:', result.status, result.error);
    return err(res, 502, `Database error: ${result.error}`);
  }

  return json(res, 200, result.data || []);
}

// ─── POST: Create ──────────────────────────────────
async function handlePost(req, res) {
  const user = await getUser(req);
  if (!user) return err(res, 401, 'Unauthorized');

  const body = await readBody(req);
  if (!body) return err(res, 400, 'Invalid body');

  const name = body.name || 'My Restaurant';
  const slug = (body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) + '-' + Date.now().toString(36);

  const result = await supabaseQuery('restaurants', {
    method: 'POST',
    body: {
      user_id: user.id,
      name,
      slug,
      address: body.address || '',
      phone: body.phone || '',
      website: body.website || '',
    },
    useServiceRole: true,
  });

  if (!result.ok) {
    console.error('[Restaurants] Create failed:', result.status, result.error);
    return err(res, 502, `Failed to create restaurant: ${result.error}`);
  }

  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  return json(res, 201, row);
}

// ─── PUT: Update or create-if-not-exists ───────────
async function handlePut(req, res) {
  const user = await getUser(req);
  if (!user) return err(res, 401, 'Unauthorized');

  const body = await readBody(req);
  if (!body) return err(res, 400, 'Invalid body');

  const updateData = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.slug !== undefined) {
    let s = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '');
    if (!s) return err(res, 400, 'Invalid slug format');
    updateData.slug = s;
  }
  if (body.address !== undefined) updateData.address = body.address;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.website !== undefined) updateData.website = body.website;

  // Check slug uniqueness
  if (updateData.slug) {
    const existing = await supabaseQuery('restaurants', {
      method: 'GET',
      query: { select: 'id', slug: `eq.${updateData.slug}`, limit: '1' },
      useServiceRole: true,
    });
    if (existing.ok && Array.isArray(existing.data) && existing.data.length > 0 && existing.data[0].id !== body.id) {
      return err(res, 409, 'This URL is already taken. Please choose another.');
    }
  }

  // Find existing restaurant for this user
  const existingResult = await supabaseQuery('restaurants', {
    method: 'GET',
    query: { select: 'id,name,slug,address,phone,website,user_id', user_id: `eq.${user.id}`, limit: '1' },
    useServiceRole: true,
  });

  if (existingResult.ok && Array.isArray(existingResult.data) && existingResult.data.length > 0) {
    // Update existing
    const result = await supabaseQuery('restaurants', {
      method: 'PUT',
      query: { id: `eq.${existingResult.data[0].id}` },
      body: updateData,
      useServiceRole: true,
    });

    if (!result.ok) {
      console.error('[Restaurants] Update failed:', result.status, result.error);
      return err(res, 502, `Update failed: ${result.error}`);
    }

    const row = Array.isArray(result.data) ? result.data[0] : null;
    if (!row) return err(res, 500, 'Update failed');
    return json(res, 200, row);
  } else {
    // Create new
    const result = await supabaseQuery('restaurants', {
      method: 'POST',
      body: {
        user_id: user.id,
        name: updateData.name || 'My Restaurant',
        slug: updateData.slug || `restaurant-${Date.now().toString(36)}`,
        ...updateData,
      },
      useServiceRole: true,
    });

    if (!result.ok) {
      console.error('[Restaurants] Create-in-put failed:', result.status, result.error);
      return err(res, 502, `Create failed: ${result.error}`);
    }

    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    return json(res, 201, row);
  }
}
