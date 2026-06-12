/**
 * Restaurants API — Authenticated CRUD.
 *
 * GET    /api/restaurants          — List user's restaurant(s)
 * PUT    /api/restaurants          — Update restaurant (name, slug)
 * POST   /api/restaurants          — Create new restaurant
 */

import { supabaseQuery, verifySupabaseToken } from './_supabase.js';

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(status, message) {
  return json(status, { error: message });
}

/** Get Authorization header value (Vercel Node.js runtime uses plain object, not Headers) */
function getAuthHeader(req) {
  return (req.headers?.['authorization'] || req.headers?.['Authorization'] || '').replace(/^Bearer\s+/, '');
}

async function getUser(req) {
  const token = getAuthHeader(req);
  if (!token) return null;
  return await verifySupabaseToken(token);
}

/** Extract Bearer token from request headers */
function getToken(req) {
  return getAuthHeader(req);
}

export default async function handler(req) {
  try {
    const method = req.method;

    // GET — list user's restaurants
    if (method === 'GET') return handleList(req);
    // PUT — update or create
    if (method === 'PUT') return handlePut(req);
    // POST — create new restaurant
    if (method === 'POST') return handlePost(req);

    return err(405, 'Method not allowed');
  } catch (e) {
    console.error('[Restaurants] Unhandled error:', e?.message || e);
    return err(500, 'Internal server error');
  }
}

// ─── GET: List ─────────────────────────────────────
async function handleList(req) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const result = await supabaseQuery('restaurants', {
    method: 'GET',
    query: {
      select: 'id,name,slug,address,phone,website,cover_image_url',
      order: 'created_at.asc',
    },
    token: getToken(req),
  });

  if (!result.ok) {
    console.error('[Restaurants] List failed:', result.status, result.error);
    return err(502, `Database error: ${result.error}`);
  }

  return json(200, result.data || []);
}

// ─── POST: Create ──────────────────────────────────
async function handlePost(req) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  if (!body) return err(400, 'Invalid body');

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
      cover_image_url: body.cover_image_url || null,
    },
    token: getToken(req),
  });

  if (!result.ok) {
    console.error('[Restaurants] Create failed:', result.status, result.error);
    return err(502, `Failed to create restaurant: ${result.error}`);
  }

  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  return json(201, row);
}

// ─── PUT: Update or create-if-not-exists ───────────
async function handlePut(req) {
  const user = await getUser(req);
  if (!user) return err(401, 'Unauthorized');

  const body = await req.json().catch(() => null);
  if (!body) return err(400, 'Invalid body');

  const updateData = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.slug !== undefined) {
    let s = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '');
    if (!s) return err(400, 'Invalid slug format');
    updateData.slug = s;
  }
  if (body.address !== undefined) updateData.address = body.address;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.website !== undefined) updateData.website = body.website;
  if (body.cover_image_url !== undefined) updateData.cover_image_url = body.cover_image_url;

  // Check slug uniqueness (use anon key for public check)
  if (updateData.slug) {
    const existing = await supabaseQuery('restaurants', {
      method: 'GET',
      query: { select: 'id', slug: `eq.${updateData.slug}`, limit: '1' },
    });
    if (existing.ok && Array.isArray(existing.data) && existing.data.length > 0 && existing.data[0].id !== body.id) {
      return err(409, 'This URL is already taken. Please choose another.');
    }
  }

  // Find existing restaurant for this user
  const existingResult = await supabaseQuery('restaurants', {
    method: 'GET',
    query: { select: '*', user_id: `eq.${user.id}`, limit: '1' },
    token: getToken(req),
  });

  if (existingResult.ok && Array.isArray(existingResult.data) && existingResult.data.length > 0) {
    // Update existing
    const result = await supabaseQuery('restaurants', {
      method: 'PUT',
      query: { id: `eq.${existingResult.data[0].id}` },
      body: updateData,
      token: getToken(req),
    });

    if (!result.ok) {
      console.error('[Restaurants] Update failed:', result.status, result.error);
      return err(502, `Update failed: ${result.error}`);
    }

    const row = Array.isArray(result.data) ? result.data[0] : null;
    if (!row) return err(500, 'Update failed');
    return json(200, row);
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
      token: getToken(req),
    });

    if (!result.ok) {
      console.error('[Restaurants] Create-in-put failed:', result.status, result.error);
      return err(502, `Create failed: ${result.error}`);
    }

    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    return json(201, row);
  }
}
