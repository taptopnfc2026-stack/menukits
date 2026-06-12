/**
 * Auth — User Login API (JWT-based)
 *
 * POST /api/auth-login  Body: { username, password }
 * GET  /api/auth-login?token=<JWT>  - verifies JWT, no KV needed
 */
import { kvGet } from './_kv.js';
import { deriveSalt, hashPassword, createToken, verifyToken } from './_auth.js';

export const config = { runtime: 'nodejs' };

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function normalizeUsername(input) {
  return String(input || '').trim().toLowerCase();
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return handleValidate(req, res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return handleLogin(req, res);
}

async function handleLogin(req, res) {
  const body = await readJsonBody(req);
  const username = normalizeUsername(body.username);
  const password = body.password;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const salt = deriveSalt(username);
    const candidateHash = hashPassword(password, salt);

    const raw = await kvGet(`user:${username}`);

    if (!raw) {
      return res.status(401).json({
        error: 'Account not found. Please register first.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    const user = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (user.passwordHash && user.passwordHash !== candidateHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = createToken({
      sub: user.id,
      username,
      displayName: user.displayName || username,
    });

    return res.status(200).json({
      ok: true,
      user: { id: user.id, username, displayName: user.displayName || username },
      token,
    });
  } catch (err) {
    console.error('[auth-login] error:', err);
    return res.status(500).json({ error: 'Login failed', detail: err.message });
  }
}

async function handleValidate(req, res) {
  const rawToken = String(req.query?.token || '');

  if (!rawToken) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    const payload = verifyToken(rawToken);
    if (!payload) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    return res.status(200).json({
      ok: true,
      user: {
        id: payload.sub,
        username: payload.username,
        displayName: payload.displayName,
      },
    });
  } catch (err) {
    console.error('[auth-login] validate error:', err);
    return res.status(500).json({ error: 'Session validation failed', detail: err.message });
  }
}
