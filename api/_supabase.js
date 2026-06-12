/**
 * Supabase REST API wrapper for Vercel Serverless Functions.
 * Uses only Node.js built-in fetch — zero npm dependencies.
 *
 * IMPORTANT: SUPABASE_ANON_KEY must be a valid JWT (eyJ... format),
 * NOT a Stripe publishable key (sb_publishable_...).
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vogadmkyyuvamjfvcdeo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const config = { runtime: 'nodejs' };

/**
 * Call Supabase Auth API (signup, signin, etc.)
 */
export async function supabaseAuth(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * Call Supabase Auth Admin API (create user, etc.) — requires service_role key
 */
export async function supabaseAuthAdmin(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * Query Supabase REST API (PostgREST).
 * Returns { ok: true, data } on success or { ok: false, status, error } on failure.
 * Never throws — callers must check .ok.
 *
 * @param {string} table - table name
 * @param {object} opts - { method, body, query, token, useServiceRole }
 */
export async function supabaseQuery(table, opts = {}) {
  const { method = 'GET', body, query, token, useServiceRole = false } = opts;

  // Validate URL
  let url;
  try {
    url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  } catch (e) {
    return { ok: false, error: `Invalid SUPABASE_URL: ${e.message}` };
  }

  // Build query params
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      url.searchParams.set(k, v);
    });
  }

  // Build headers — when useServiceRole is true (server-side after auth), 
  // use service_role key to bypass RLS
  const isServiceMode = useServiceRole && !!SUPABASE_SERVICE_KEY;
  const effectiveKey = isServiceMode ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;

  const headers = {
    'apikey': effectiveKey,
    'Content-Type': 'application/json',
  };
  if (method !== 'GET') {
    headers['Prefer'] = 'return=representation';
  }
  if (isServiceMode) {
    headers['Authorization'] = `Bearer ${SUPABASE_SERVICE_KEY}`;
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (effectiveKey) {
    headers['Authorization'] = `Bearer ${effectiveKey}`;
  }

  // Build fetch options
  const fetchOpts = { method, headers };
  if (body && method !== 'GET') {
    fetchOpts.body = JSON.stringify(body);
  }

  // Execute request
  let res;
  try {
    res = await fetch(url.toString(), fetchOpts);
  } catch (e) {
    return { ok: false, error: `Network error: ${e.message}` };
  }

  // Handle HTTP errors gracefully
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { ok: false, status: res.status, error: errText || `HTTP ${res.status}` };
  }

  // Parse response
  const text = await res.text();
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: true, data: text };
  }
}

/**
 * Verify a Supabase access token and return the user object or null.
 */
export async function verifySupabaseToken(token) {
  if (!SUPABASE_ANON_KEY) {
    console.error('[supabase] SUPABASE_ANON_KEY is not set');
    return null;
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
