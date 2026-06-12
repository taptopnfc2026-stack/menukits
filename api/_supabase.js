/**
 * Supabase REST API wrapper for Vercel Serverless Functions.
 * Uses only Node.js built-in fetch — zero npm dependencies.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vogadmkyyuvamjfvcdeo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_0GvqWFGHxRdpTcyq2QtZrw_TMljIuxP';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

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
 * Query Supabase REST API (PostgREST)
 * @param {string} table - table name
 * @param {object} opts - { method, body, query, token }
 */
export async function supabaseQuery(table, opts = {}) {
  const { method = 'GET', body, query, token } = opts;
  let url;
  try {
    url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  } catch (e) {
    throw new Error(`Invalid SUPABASE_URL: ${SUPABASE_URL}`);
  }

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      url.searchParams.set(k, v);
    });
  }

  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': method === 'GET' ? undefined : 'return=representation',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  // Remove undefined headers
  Object.keys(headers).forEach(k => headers[k] === undefined && delete headers[k]);

  const fetchOpts = { method, headers };
  if (body && method !== 'GET') {
    fetchOpts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url.toString(), fetchOpts);
  } catch (e) {
    throw new Error(`Supabase fetch failed for ${method} ${table}: ${e.message}`);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase error ${res.status} on ${method} ${table}: ${errText}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Verify a Supabase access token and return the user.
 */
export async function verifySupabaseToken(token) {
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
