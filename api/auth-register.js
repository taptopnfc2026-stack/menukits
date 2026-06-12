/**
 * Auth — User Registration API (JWT-based, no external storage required)
 *
 * POST /api/auth-register
 * Body: { username, password, displayName? }
 */
import { kvGet, kvSet } from './_kv.js';
import { deriveSalt, hashPassword, generateUserId, createToken } from './_auth.js';

export const config = { runtime: 'nodejs' };

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

function validateUsername(username) {
  if (!username) return 'Username is required';
  if (username.length < 3 || username.length > 20) return 'Username must be 3-20 characters';
  if (!/^[a-z0-9_]+$/.test(username)) return 'Username may only contain lowercase letters, numbers, and underscores';
  return null;
}

function validatePassword(password) {
  if (!password) return 'Password is required';
  if (String(password).length < 6) return 'Password must be at least 6 characters';
  return null;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readJsonBody(req);
  const username = normalizeUsername(body.username);
  const password = body.password;
  const displayName = body.displayName;

  const usernameErr = validateUsername(username);
  if (usernameErr) return res.status(400).json({ error: usernameErr, field: 'username' });

  const passwordErr = validatePassword(password);
  if (passwordErr) return res.status(400).json({ error: passwordErr, field: 'password' });

  try {
    const existing = await kvGet(`user:${username}`);
    if (existing) {
      // Username exists — verify password for "register-as-login" flow
      const existingUser = typeof existing === 'string' ? JSON.parse(existing) : existing;
      const existingSalt = deriveSalt(username);
      const existingHash = hashPassword(password, existingSalt);

      if (existingUser.passwordHash && existingUser.passwordHash !== existingHash) {
        return res.status(409).json({ error: 'Username already taken', field: 'username' });
      }

      // Password matches — re-issue token (works as login across instances)
      const reToken = createToken({ sub: existingUser.id, username, displayName: existingUser.displayName || username });
      return res.status(200).json({
        ok: true,
        user: { id: existingUser.id, username, displayName: existingUser.displayName || username },
        token: reToken,
      });
    }

    const salt = deriveSalt(username);
    const passwordHash = hashPassword(password, salt);
    const id = generateUserId();
    const displayNameStr = (displayName && String(displayName).trim()) || username;

    const user = { id, username, displayName: displayNameStr, passwordHash, createdAt: new Date().toISOString() };

    await kvSet(`user:${username}`, JSON.stringify(user));

    const token = createToken({ sub: id, username, displayName: displayNameStr });

    return res.status(201).json({
      ok: true,
      user: { id, username, displayName: displayNameStr },
      token,
    });
  } catch (err) {
    console.error('[auth-register] error:', err);
    return res.status(500).json({ error: 'Registration failed', detail: err.message });
  }
}
