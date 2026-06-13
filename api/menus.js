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
  if (!token) {
    console.log('[Menus] No Authorization header found');
    return null;
  }
  console.log('[Menus] Verifying token...');
  const user = await verifySupabaseToken(token);
  if (!user) {
    console.log('[Menus] Token verification returned null (invalid or expired)');
  }
  return user;
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
    const queryId = url.searchParams.get('id');
    const parts = path.split('/').filter(Boolean);
    const analyticsMode = parts[0] === 'analytics' || url.searchParams.get('action') === 'analytics';

    if (analyticsMode) {
      if (method === 'GET') return handleAnalyticsSummary(req, res, url);
      if (method === 'POST') return handleAnalyticsTrack(req, res);
      return err(res, 405, 'Method not allowed');
    }

    if (!path && method === 'POST') return handleCreate(req, res);
    if (!path && method === 'GET') return handleList(req, res);
    if (!path && queryId) {
      if (method === 'GET') return handleGet(req, res, queryId);
      if (method === 'PUT') return handleUpdate(req, res, queryId);
      if (method === 'DELETE') return handleDelete(req, res, queryId);
    }

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
    query: { select: 'id,name,slug,language,is_public,settings,created_at,updated_at', user_id: `eq.${user.id}`, order: 'updated_at.desc' },
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
  if (!user) return err(res, 401, 'Unauthorized — please log in again');

  const body = await readBody(req);
  if (!body) return err(res, 400, 'Invalid request body');

  console.log(`[Menus] Creating menu for user`, user?.id);

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
      settings: typeof body === 'object' ? body : {},
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
    query: { select: 'id,name,slug,language,is_public,settings,created_at,updated_at', id: `eq.${id}`, user_id: `eq.${user.id}`, limit: '1' },
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
  if (!user) return err(res, 401, 'Unauthorized — please log in again');

  const body = await readBody(req);
  if (!body) return err(res, 400, 'Invalid request body');

  console.log(`[Menus] Updating menu ${id} for user`, user?.id);

  const incomingSettings = typeof body === 'object' ? body : {};
  let nextSettings = incomingSettings;

  if (!nextSettings.analytics) {
    const existingResult = await supabaseQuery('menus', {
      method: 'GET',
      query: { select: 'settings', id: `eq.${id}`, user_id: `eq.${user.id}`, limit: '1' },
      useServiceRole: true,
    });
    if (existingResult.ok) {
      const existingRow = Array.isArray(existingResult.data) ? existingResult.data[0] : null;
      const existingAnalytics = getSettings(existingRow).analytics;
      if (existingAnalytics) {
        nextSettings = { ...nextSettings, analytics: existingAnalytics };
      }
    }
  }

  const result = await supabaseQuery('menus', {
    method: 'PATCH',
    query: { id: `eq.${id}`, user_id: `eq.${user.id}` },
    body: {
      name: body.title || 'Untitled Menu',
      is_public: body.isVisible !== false,
      settings: nextSettings,
    },
    useServiceRole: true,
  });

  if (!result.ok) {
    console.error('[Menus] Update failed:', result.status, result.error);
    if (result.status === 404 || (Array.isArray(result.data) && result.data.length === 0)) {
      return err(res, 404, 'Menu not found');
    }
    return err(res, 502, `Update failed: ${result.error || 'Unknown database error'}`);
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
    query: { id: `eq.${id}`, user_id: `eq.${user.id}` },
    useServiceRole: true,
  });

  if (!result.ok) {
    console.error('[Menus] Delete failed:', result.status, result.error);
    return err(res, 502, `Failed to delete menu: ${result.error}`);
  }

  return json(res, 200, { success: true });
}

function isoDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatDay(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

function emptyAnalytics() {
  return {
    totals: {
      views: 0,
      durationSeconds: 0,
      durationSamples: 0,
    },
    byDay: {},
    devices: {
      mobile: 0,
      tablet: 0,
      desktop: 0,
      unknown: 0,
    },
    dishes: {},
    sections: {},
  };
}

function normalizeAnalytics(value) {
  const base = emptyAnalytics();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base;
  return {
    totals: { ...base.totals, ...(value.totals || {}) },
    byDay: { ...base.byDay, ...(value.byDay || {}) },
    devices: { ...base.devices, ...(value.devices || {}) },
    dishes: { ...base.dishes, ...(value.dishes || {}) },
    sections: { ...base.sections, ...(value.sections || {}) },
  };
}

function getSettings(row) {
  return row && row.settings && typeof row.settings === 'object' && !Array.isArray(row.settings)
    ? row.settings
    : {};
}

function asNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function detectDevice(req, provided) {
  if (provided === 'mobile' || provided === 'tablet' || provided === 'desktop') return provided;
  const ua = String(req.headers?.['user-agent'] || '').toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobile|iphone|android/.test(ua)) return 'mobile';
  if (ua) return 'desktop';
  return 'unknown';
}

function increment(map, key, amount = 1) {
  map[key] = asNumber(map[key]) + amount;
}

async function handleAnalyticsTrack(req, res) {
  const body = await readBody(req) || {};
  const menuId = typeof body.menuId === 'string' ? body.menuId : '';
  const event = typeof body.event === 'string' ? body.event : 'menu_view';
  if (!menuId) return err(res, 400, 'Missing menuId');

  const menuResult = await supabaseQuery('menus', {
    method: 'GET',
    query: {
      select: 'id,name,settings,is_public',
      id: `eq.${menuId}`,
      limit: '1',
    },
    useServiceRole: true,
  });

  if (!menuResult.ok) {
    console.error('[Analytics] Menu lookup failed:', menuResult.status, menuResult.error);
    return err(res, 502, 'Database error');
  }

  const row = Array.isArray(menuResult.data) ? menuResult.data[0] : null;
  if (!row || row.is_public === false) return err(res, 404, 'Menu not found');

  const settings = getSettings(row);
  const analytics = normalizeAnalytics(settings.analytics);
  const day = isoDay();

  if (event === 'menu_view') {
    analytics.totals.views = asNumber(analytics.totals.views) + 1;
    increment(analytics.byDay, day, 1);
    increment(analytics.devices, detectDevice(req, body.device), 1);
  } else if (event === 'dish_view') {
    const dishId = typeof body.dishId === 'string' ? body.dishId : '';
    if (dishId) {
      const existing = analytics.dishes[dishId] || {};
      analytics.dishes[dishId] = {
        name: typeof body.dishName === 'string' ? body.dishName.slice(0, 160) : existing.name || 'Dish',
        section: typeof body.sectionName === 'string' ? body.sectionName.slice(0, 120) : existing.section || '',
        views: asNumber(existing.views) + 1,
      };
    }
  } else if (event === 'section_view') {
    const sectionId = typeof body.sectionId === 'string' ? body.sectionId : '';
    if (sectionId) {
      const existing = analytics.sections[sectionId] || {};
      analytics.sections[sectionId] = {
        name: typeof body.sectionName === 'string' ? body.sectionName.slice(0, 120) : existing.name || 'Section',
        views: asNumber(existing.views) + 1,
      };
    }
  } else if (event === 'session_duration') {
    const seconds = Math.max(0, Math.min(60 * 30, asNumber(body.seconds)));
    if (seconds > 0) {
      analytics.totals.durationSeconds = asNumber(analytics.totals.durationSeconds) + seconds;
      analytics.totals.durationSamples = asNumber(analytics.totals.durationSamples) + 1;
    }
  }

  const updateResult = await supabaseQuery('menus', {
    method: 'PATCH',
    query: { id: `eq.${menuId}` },
    body: {
      settings: {
        ...settings,
        analytics,
      },
    },
    useServiceRole: true,
  });

  if (!updateResult.ok) {
    console.error('[Analytics] Update failed:', updateResult.status, updateResult.error);
    return err(res, 502, 'Failed to save analytics');
  }

  return json(res, 200, { ok: true });
}

async function handleAnalyticsSummary(req, res, url) {
  const user = await getUser(req);
  if (!user) return err(res, 401, 'Unauthorized');

  const days = Math.max(1, Math.min(90, parseInt(url.searchParams.get('days') || '7', 10) || 7));

  const menuResult = await supabaseQuery('menus', {
    method: 'GET',
    query: {
      select: 'id,name,is_public,settings,created_at,updated_at',
      user_id: `eq.${user.id}`,
      order: 'updated_at.desc',
    },
    useServiceRole: true,
  });

  if (!menuResult.ok) {
    console.error('[Analytics] Summary menus failed:', menuResult.status, menuResult.error);
    return err(res, 502, 'Database error');
  }

  const rows = Array.isArray(menuResult.data) ? menuResult.data : [];
  const dateKeys = Array.from({ length: days }, (_, index) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1 - index));
    return isoDay(d);
  });
  const byDay = dateKeys.map((date) => ({ date, label: formatDay(new Date(date + 'T00:00:00Z')), views: 0 }));
  const devices = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
  const dishMap = new Map();
  const sectionMap = new Map();
  const perMenu = [];
  let totalViews = 0;
  let todayViews = 0;
  let periodViews = 0;
  let durationSeconds = 0;
  let durationSamples = 0;
  const today = isoDay();

  for (const row of rows) {
    const settings = getSettings(row);
    const analytics = normalizeAnalytics(settings.analytics);
    const menuViews = asNumber(analytics.totals.views);
    totalViews += menuViews;
    todayViews += asNumber(analytics.byDay[today]);
    durationSeconds += asNumber(analytics.totals.durationSeconds);
    durationSamples += asNumber(analytics.totals.durationSamples);

    let menuPeriodViews = 0;
    byDay.forEach((bucket) => {
      const views = asNumber(analytics.byDay[bucket.date]);
      bucket.views += views;
      menuPeriodViews += views;
    });
    periodViews += menuPeriodViews;

    Object.keys(devices).forEach((key) => {
      devices[key] += asNumber(analytics.devices[key]);
    });

    Object.entries(analytics.dishes || {}).forEach(([id, dish]) => {
      const current = dishMap.get(id) || { id, name: dish.name || 'Dish', section: dish.section || '', views: 0 };
      current.views += asNumber(dish.views);
      dishMap.set(id, current);
    });

    Object.entries(analytics.sections || {}).forEach(([id, section]) => {
      const current = sectionMap.get(id) || { id, name: section.name || 'Section', views: 0 };
      current.views += asNumber(section.views);
      sectionMap.set(id, current);
    });

    const sections = Array.isArray(settings.sections) ? settings.sections : [];
    const dishCount = sections.reduce((sum, section) => sum + (Array.isArray(section.dishes) ? section.dishes.length : 0), 0);
    perMenu.push({
      id: row.id,
      title: settings.title || row.name || 'Untitled menu',
      isVisible: row.is_public !== false,
      dishCount,
      totalViews: menuViews,
      periodViews: menuPeriodViews,
    });
  }

  const deviceTotal = Object.values(devices).reduce((sum, value) => sum + value, 0);
  const mobilePct = deviceTotal ? Math.round((devices.mobile / deviceTotal) * 100) : 0;
  const tabletPct = deviceTotal ? Math.round((devices.tablet / deviceTotal) * 100) : 0;
  const desktopPct = deviceTotal ? Math.round((devices.desktop / deviceTotal) * 100) : 0;
  const deviceBreakdown = {
    mobile: mobilePct,
    tablet: tabletPct,
    desktop: desktopPct,
    unknown: deviceTotal ? Math.max(0, 100 - mobilePct - tabletPct - desktopPct) : 0,
  };

  const topDishes = Array.from(dishMap.values()).sort((a, b) => b.views - a.views).slice(0, 5);
  const sectionTotal = Array.from(sectionMap.values()).reduce((sum, section) => sum + section.views, 0);
  const popularSections = Array.from(sectionMap.values())
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map((section) => ({
      ...section,
      percentage: sectionTotal ? Math.round((section.views / sectionTotal) * 100) : 0,
    }));

  return json(res, 200, {
    rangeDays: days,
    totalViews,
    todayViews,
    periodViews,
    avgTimeSeconds: durationSamples ? Math.round(durationSeconds / durationSamples) : 0,
    viewsByDay: byDay,
    deviceBreakdown,
    topDishes,
    popularSections,
    menus: perMenu,
    hasData: totalViews > 0 || topDishes.length > 0 || popularSections.length > 0,
  });
}
