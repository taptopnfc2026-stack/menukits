/**
 * Restaurants API — Authenticated CRUD.
 *
 * GET    /api/restaurants          — List user's restaurant(s)
 * PUT    /api/restaurants          — Update restaurant (name, slug)
 * POST   /api/restaurants          — Create new restaurant
 */

import { supabaseQuery, verifySupabaseToken } from './_supabase.js';

function json(res, status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(status, message) {
  return json(status, { error: message });
}

async function getUser(req) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  return await verifySupabaseToken(token);
}

export default async function handler(req) {
  try {
    const method = req.method;

    // GET — list user's restaurants
    if (method === 'GET') {
      const user = await getUser(req);
      if (!user) return err(401, 'Unauthorized');

      const rows = await supabaseQuery('restaurants', {
        method: 'GET',
        query: {
          select: 'id,name,slug,address,phone,website,cover_image_url',
          order: 'created_at.asc',
        },
        token: user?.access_token,
      });

      return json(200, rows || []);
    }

    // PUT — update restaurant
    if (method === 'PUT') {
      const user = await getUser(req);
      if (!user) return err(401, 'Unauthorized');

      const body = await req.json().catch(() => null);
      if (!body) return err(400, 'Invalid body');

      // Build update payload with only allowed fields
      const updateData = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.slug !== undefined) {
        // Sanitize slug
        let s = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '');
        if (!s) return err(400, 'Invalid slug format');
        updateData.slug = s;
      }
      if (body.address !== undefined) updateData.address = body.address;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.website !== undefined) updateData.website = body.website;
      if (body.cover_image_url !== undefined) updateData.cover_image_url = body.cover_image_url;

      // Check slug uniqueness (if updating slug)
      if (updateData.slug) {
        const existing = await supabaseQuery('restaurants', {
          method: 'GET',
          query: {
            select: 'id',
            slug: `eq.${updateData.slug}`,
            limit: '1',
          },
          token: process.env.SUPABASE_ANON_KEY,
        });
        if (Array.isArray(existing) && existing.length > 0 && existing[0].id !== body.id) {
          return err(409, 'This URL is already taken. Please choose another.');
        }
      }

      // Find or create the restaurant
      const existingRest = await supabaseQuery('restaurants', {
        method: 'GET',
        query: {
          select: '*',
          user_id: `eq.${user.id}`,
          limit: '1',
        },
        token: user?.access_token,
      });

      if (Array.isArray(existingRest) && existingRest.length > 0) {
        // Update existing
        const rows = await supabaseQuery('restaurants', {
          method: 'PUT',
          query: { id: `eq.${existingRest[0].id}` },
          body: updateData,
          token: user?.access_token,
        });
        const row = Array.isArray(rows) ? rows[0] : null;
        if (!row) return err(500, 'Update failed');
        return json(200, row);
      } else {
        // Create new
        const row = await supabaseQuery('restaurants', {
          method: 'POST',
          body: {
            user_id: user.id,
            name: updateData.name || 'My Restaurant',
            slug: updateData.slug || `restaurant-${Date.now().toString(36)}`,
            ...updateData,
          },
          token: user?.access_token,
        });
        return json(201, Array.isArray(row) ? row[0] : row);
      }
    }

    // POST — create restaurant
    if (method === 'POST') {
      const user = await getUser(req);
      if (!user) return err(401, 'Unauthorized');

      const body = await req.json().catch(() => null);
      if (!body) return err(400, 'Invalid body');

      const name = body.name || 'My Restaurant';
      const slug = (body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) + '-' + Date.now().toString(36);

      const row = await supabaseQuery('restaurants', {
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
        token: user?.access_token,
      });

      return json(201, Array.isArray(row) ? row[0] : row);
    }

    return err(405, 'Method not allowed');
  } catch (e) {
    console.error('Restaurants API error:', e?.message || e);
    return err(500, e?.message || 'Internal server error');
  }
}
