/**
 * Public Menus API — No authentication required.
 * Used by customer-facing pages (preview, QR scan).
 *
 * GET /api/public-menus?slug=xxx   — Get public menu by slug
 * GET /api/public-menus?ids=id1,id2 — Get multiple public menus by IDs
 * GET /api/public-menus            — List all public menus
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

    const url = new URL(req.url || '/', 'http://localhost');
    const slug = url.searchParams.get('slug');
    const ids = url.searchParams.get('ids');

    // Single menu by slug (for QR code links)
    if (slug) {
      const result = await supabaseQuery('menus', {
        method: 'GET',
        query: {
          select: '*',
          slug: `eq.${slug}`,
          is_public: 'eq.true',
          limit: '1',
        },
      });
      if (!result.ok) {
        console.error('[PublicMenus] By-slug failed:', result.status, result.error);
        return json(502, { error: 'Database error' });
      }
      const row = Array.isArray(result.data) ? result.data[0] : null;
      if (!row) return json(404, { error: 'Menu not found' });
      return json(200, row);
    }

    // Multiple menus by comma-separated IDs
    if (ids) {
      const idList = ids.split(',').map((s) => s.trim()).filter(Boolean);
      if (idList.length === 0) return json(200, []);

      const orFilter = idList.map((id) => `id.eq.${id}`).join(',');

      const result = await supabaseQuery('menus', {
        method: 'GET',
        query: {
          select: '*',
          or: `(${orFilter})`,
          is_public: 'eq.true',
        },
      });
      if (!result.ok) {
        console.error('[PublicMenus] By-ids failed:', result.status, result.error);
        return json(502, { error: 'Database error' });
      }
      return json(200, result.data || []);
    }

    // List all public menus (for menu hub)
    const result = await supabaseQuery('menus', {
      method: 'GET',
      query: {
        select: '*',
        is_public: 'eq.true',
        order: 'updated_at.desc',
      },
    });
    if (!result.ok) {
      console.error('[PublicMenus] List-all failed:', result.status, result.error);
      return json(502, { error: 'Database error' });
    }
    return json(200, result.data || []);
  } catch (e) {
    console.error('[PublicMenus] Unhandled error:', e?.message || e);
    return json(500, { error: 'Internal server error' });
  }
}
