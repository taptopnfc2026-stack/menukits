/**
 * Public Restaurant API — No auth required.
 * Used by customer-facing menu hub (QR scan → mobile view).
 *
 * GET /api/public-restaurant?slug=la-petite-cafe  — Get restaurant + menus by custom slug
 */

import { supabaseQuery } from './_supabase.js';

export const config = { runtime: 'nodejs' };

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export default async function handler(req) {
  try {
    if (req.method !== 'GET') return json(405, { error: 'Method not allowed' });

    const url = new URL(req.url || '/', 'http://localhost');
    const slug = url.searchParams.get('slug');

    if (!slug) return json(400, { error: 'Missing slug parameter' });

    // Sanitize: only allow alphanumeric + hyphens
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1,}$/i.test(slug)) {
      return json(400, { error: 'Invalid slug format' });
    }

    // Fetch restaurant by slug
    const restResult = await supabaseQuery('restaurants', {
      method: 'GET',
      query: {
        select: '*',
        slug: `eq.${encodeURIComponent(slug)}`,
        limit: '1',
      },
    });

    if (!restResult.ok) {
      console.error('[PublicRestaurant] Fetch restaurant failed:', restResult.status, restResult.error);
      return json(502, { error: 'Database error' });
    }

    const restaurant = Array.isArray(restResult.data) ? restResult.data[0] : null;
    if (!restaurant) return json(404, { error: 'Restaurant not found' });

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
      // Still return restaurant even if menus fail
      return json(200, { restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug, address: restaurant.address || '', phone: restaurant.phone || '', cover_image_url: restaurant.cover_image_url || null }, menus: [] });
    }

    return json(200, {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        cover_image_url: restaurant.cover_image_url || null,
      },
      menus: menuResult.data || [],
    });
  } catch (e) {
    console.error('[PublicRestaurant] Unhandled error:', e?.message || e);
    return json(500, { error: 'Internal server error' });
  }
}
