/**
 * Public Menus API — No authentication required.
 * Used by customer-facing pages (preview, QR scan).
 *
 * GET /api/public-menus?slug=xxx   — Get public menu by slug
 * GET /api/public-menus?ids=id1,id2 — Get multiple public menus by IDs
 * GET /api/public-menus            — List all public menus
 */

import { supabaseQuery } from './_supabase.js';

function json(res, status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Allow public access from any origin
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export default async function handler(req) {
  try {
    if (req.method !== 'GET') {
      return json(405, { error: 'Method not allowed' });
    }

    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const ids = url.searchParams.get('ids');

    // Single menu by slug (for QR code links)
    if (slug) {
      const rows = await supabaseQuery('menus', {
        method: 'GET',
        query: {
          select: '*',
          slug: `eq.${slug}`,
          is_public: 'eq.true',
          limit: '1',
        },
        token: process.env.SUPABASE_ANON_KEY,
      });
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) return json(404, { error: 'Menu not found' });
      return json(200, row);
    }

    // Multiple menus by comma-separated IDs
    if (ids) {
      const idList = ids.split(',').map((s) => s.trim()).filter(Boolean);
      if (idList.length === 0) return json(200, []);

      // Build OR filter for multiple IDs
      const orFilter = idList.map((id) => `id.eq.${id}`).join(',');

      const rows = await supabaseQuery('menus', {
        method: 'GET',
        query: {
          select: '*',
          or: `(${orFilter})`,
          is_public: 'eq.true',
        },
        token: process.env.SUPABASE_ANON_KEY,
      });
      return json(200, rows || []);
    }

    // List all public menus (for menu hub)
    const rows = await supabaseQuery('menus', {
      method: 'GET',
      query: {
        select: '*',
        is_public: 'eq.true',
        order: 'updated_at.desc',
      },
      token: process.env.SUPABASE_ANON_KEY,
    });
    return json(200, rows || []);
  } catch (e) {
    console.error('Public Menus API error:', e);
    return json(500, { error: 'Internal server error' });
  }
}
