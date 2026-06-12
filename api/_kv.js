/**
 * Shared KV client — uses Upstash Redis REST API (no external deps needed).
 *
 * Key improvement: does a fast (<2s) pre-check to see if Redis is reachable.
 * If not, immediately switches to in-memory mode to avoid 15s timeouts on
 * every single request.
 *
 * To fix Redis on Vercel:
 *   1. Go to https://vercel.com/taptop/20260523131538/stores
 *   2. Check Upstash Redis status or create a new one
 *   3. Vercel auto-injects the REDIS_URL env var
 */

// In-process fallback
const memoryStore = new Map();

// Redis connection state
let redisReachable = null; // null = unknown
let lastRedisCheck = 0;
const REDIS_CHECK_COOLDOWN = 60_000;
const REDIS_FAST_TIMEOUT = 2000;
const REDIS_OP_TIMEOUT = 5000;

function getKvConfig() {
  const redisUrl = (process.env.REDIS_URL || '').trim() || (process.env.KV_URL || '').trim();
  const kvUrl = (process.env.KV_REST_API_URL || '').trim();
  let url = kvUrl || redisUrl;
  let token = (process.env.KV_REST_API_TOKEN || '').trim();

  if (!url) return { storage: 'memory' };

  if (url.startsWith('redis://') || url.startsWith('rediss://')) {
    try {
      const u = new URL(url);
      token = u.password || token;
      url = `https://${u.hostname}`;
    } catch {
      return { storage: 'memory' };
    }
  }

  const base = url.replace(/\/$/, '');
  if (!base || !token) return { storage: 'memory' };
  return { storage: 'redis', base, token };
}

async function ensureRedisReachable() {
  const cfg = getKvConfig();
  if (cfg.storage !== 'redis') return false;

  if (redisReachable !== null && Date.now() - lastRedisCheck < REDIS_CHECK_COOLDOWN) {
    return redisReachable;
  }

  try {
    const testKey = '__fast_check__';
    const res = await fetch(`${cfg.base}/set/${testKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'text/plain',
      },
      body: '1',
      signal: AbortSignal.timeout(REDIS_FAST_TIMEOUT),
    });
    redisReachable = res.ok;
  } catch {
    redisReachable = false;
  }

  lastRedisCheck = Date.now();
  console.log(`[KV] Redis reachable: ${redisReachable}`);
  return redisReachable;
}

async function redisOp(method, cfg, key, body) {
  try {
    const url = body
      ? `${cfg.base}/${method}/${encodeURIComponent(key)}`
      : `${cfg.base}/get/${encodeURIComponent(key)}`;

    const fetchOpts = {
      headers: { Authorization: `Bearer ${cfg.token}` },
      signal: AbortSignal.timeout(REDIS_OP_TIMEOUT),
    };

    if (body) {
      fetchOpts.method = 'POST';
      fetchOpts.headers['Content-Type'] = 'text/plain';
      fetchOpts.body = body;
    }

    const res = await fetch(url, fetchOpts);
    const text = await res.text();
    console.log(`[KV] ${method.toUpperCase()} ${key} -> ${res.status} ${text.slice(0, 100)}`);

    if (!res.ok) return null;

    let data = null;
    try { data = JSON.parse(text); } catch { /* not JSON */ }

    if (method === 'set') {
      return data?.result === 'OK' ? 'OK' : null;
    }
    return data?.result ?? null;
  } catch (e) {
    console.warn(`[KV] ${method.toUpperCase()} ${key} error:`, e.message);
    return null;
  }
}

export async function kvGet(key) {
  const cfg = getKvConfig();
  if (cfg.storage === 'memory') {
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  }

  const reachable = await ensureRedisReachable();
  if (!reachable) {
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  }

  const result = await redisOp('get', cfg, key);
  if (result !== null) return result;

  return memoryStore.has(key) ? memoryStore.get(key) : null;
}

export async function kvSet(key, value) {
  const cfg = getKvConfig();
  if (cfg.storage === 'memory') {
    memoryStore.set(key, value);
    return { ok: true, mode: 'memory' };
  }

  const reachable = await ensureRedisReachable();
  if (reachable) {
    const result = await redisOp('set', cfg, key, value);
    if (result !== null) {
      return { ok: true, mode: 'redis' };
    }
  }

  memoryStore.set(key, value);
  return { ok: true, mode: 'memory' };
}

export function kvHealth() {
  const cfg = getKvConfig();
  return {
    storage: cfg.storage,
    hasRedisConfig: cfg.storage === 'redis',
    reachable: redisReachable,
    baseUrl: cfg.storage === 'redis' ? cfg.base.replace(/^https?:\/\//, '') : null,
  };
}
