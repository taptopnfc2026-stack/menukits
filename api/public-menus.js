/**
 * Public Menus API — No authentication required.
 *
 * GET /api/public-menus?slug=xxx   — Get public menu by slug
 * GET /api/public-menus?ids=id1,id2 — Get multiple public menus by IDs
 * GET /api/public-menus            — List all public menus
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
    const ids = url.searchParams.get('ids');

    // Single menu by slug
    if (slug) {
      const result = await supabaseQuery('menus', {
        method: 'GET',
        query: { select: '*', slug: `eq.${slug}`, is_public: 'eq.true', limit: '1' },
      });
      if (!result.ok) {
        console.error('[PublicMenus] By-slug failed:', result.status, result.error);
        return json(res, 502, { error: 'Database error' });
      }
      const row = Array.isArray(result.data) ? result.data[0] : null;
      if (!row) return json(res, 404, { error: 'Menu not found' });
      return json(res, 200, row);
    }

    // Multiple menus by IDs
    if (ids) {
      const idList = ids.split(',').map((s) => s.trim()).filter(Boolean);
      if (idList.length === 0) return json(res, 200, []);

      const orFilter = idList.map((id) => `id.eq.${id}`).join(',');

      const result = await supabaseQuery('menus', {
        method: 'GET',
        query: { select: '*', or: `(${orFilter})`, is_public: 'eq.true' },
      });
      if (!result.ok) {
        console.error('[PublicMenus] By-ids failed:', result.status, result.error);
        return json(res, 502, { error: 'Database error' });
      }
      return json(res, 200, result.data || []);
    }

    // List all public menus
    const result = await supabaseQuery('menus', {
      method: 'GET',
      query: { select: '*', is_public: 'eq.true', order: 'updated_at.desc' },
    });
    if (!result.ok) {
      console.error('[PublicMenus] List-all failed:', result.status, result.error);
      return json(res, 502, { error: 'Database error' });
    }
    return json(res, 200, result.data || []);
  } catch (e) {
    console.error('[PublicMenus] Unhandled error:', e?.message || e);
    return json(res, 500, { error: 'Internal server error' });
  }
}
