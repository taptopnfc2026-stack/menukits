/**
 * Public Restaurant API — No auth required.
 *
 * GET /api/public-restaurant?slug=xxx  — Get restaurant + menus by custom slug
 */

import { supabaseQuery } from './_supabase.js';

export const config = { runtime: 'nodejs' };

function json(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(status).end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const slug = url.searchParams.get('slug');

    if (!slug) return json(res, 400, { error: 'Missing slug parameter' });

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1,}$/i.test(slug)) {
      return json(res, 400, { error: 'Invalid slug format' });
    }

    // Fetch restaurant by slug
    const restResult = await supabaseQuery('restaurants', {
      method: 'GET',
      query: { select: 'id,name,slug,address,phone,website,user_id', slug: `eq.${encodeURIComponent(slug)}`, limit: '1' },
    });

    if (!restResult.ok) {
      console.error('[PublicRestaurant] Fetch restaurant failed:', restResult.status, restResult.error);
      return json(res, 502, { error: 'Database error' });
    }

    const restaurant = Array.isArray(restResult.data) ? restResult.data[0] : null;
    if (!restaurant) return json(res, 404, { error: 'Restaurant not found' });

    // Fetch public menus for this restaurant
    const menuResult = await supabaseQuery('menus', {
      method: 'GET',
      query: {
        select: '*',
        user_id: `eq.${restaurant.user_id}`,
        is_public: 'eq.true',
        order: 'updated_at.desc',
      },
    });

    if (!menuResult.ok) {
      console.error('[PublicRestaurant] Fetch menus failed:', menuResult.status, menuResult.error);
      return json(res, 200, {
        restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug, address: restaurant.address || '', phone: restaurant.phone || '' },
        menus: [],
      });
    }

    return json(res, 200, {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address || '',
        phone: restaurant.phone || '',
      },
      menus: menuResult.data || [],
    });
  } catch (e) {
    console.error('[PublicRestaurant] Unhandled error:', e?.message || e);
    return json(res, 500, { error: 'Internal server error' });
  }
}
