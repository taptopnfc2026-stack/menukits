/**
 * Public Restaurant API — No auth required.
 * Used by customer-facing menu hub (QR scan → mobile view).
 *
 * GET /api/public-restaurant?slug=la-petite-cafe  — Get restaurant + menus by custom slug
 */

import { supabaseQuery } from './_supabase.js';

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

    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) return json(400, { error: 'Missing slug parameter' });

    // Sanitize: only allow alphanumeric + hyphens
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1,}$/i.test(slug)) {
      return json(400, { error: 'Invalid slug format' });
    }

    // Fetch restaurant by slug
    const restaurants = await supabaseQuery('restaurants', {
      method: 'GET',
      query: {
        select: '*',
        slug: `eq.${encodeURIComponent(slug)}`,
        limit: '1',
      },
      token: process.env.SUPABASE_ANON_KEY,
    });

    const restaurant = Array.isArray(restaurants) ? restaurants[0] : null;
    if (!restaurant) return json(404, { error: 'Restaurant not found' });

    // Fetch public menus for this restaurant
    const menus = await supabaseQuery('menus', {
      method: 'GET',
      query: {
        select: '*',
        user_id: `eq.${restaurant.user_id}`,
        is_public: 'eq.true',
        order: 'updated_at.desc',
      },
      token: process.env.SUPABASE_ANON_KEY,
    });

    return json(200, {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        cover_image_url: restaurant.cover_image_url || null,
      },
      menus: menus || [],
    });
  } catch (e) {
    console.error('Public Restaurant API error:', e);
    return json(500, { error: 'Internal server error' });
  }
}
