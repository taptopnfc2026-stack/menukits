/**
 * Supabase Auth registration API.
 *
 * Creates a confirmed email/password user with the service role key so the app
 * does not depend on Supabase email delivery during first account creation.
 */
import { SUPABASE_URL } from './_supabase.js';

export const config = { runtime: 'nodejs' };

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeEmail(input) {
  return String(input || '').trim().toLowerCase();
}

function validateEmail(email) {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
  return null;
}

function validatePassword(password) {
  if (!password) return 'Password is required';
  if (String(password).length < 6) return 'Password must be at least 6 characters';
  return null;
}

function getSupabaseError(payload, fallback) {
  return payload?.msg || payload?.message || payload?.error_description || payload?.error || fallback;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server auth is not configured' });
  }

  const body = await readJsonBody(req);
  const email = normalizeEmail(body.email);
  const password = body.password;
  const displayName = String(body.displayName || email.split('@')[0] || 'User').trim();

  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ error: emailErr, field: 'email' });

  const passwordErr = validatePassword(password);
  if (passwordErr) return res.status(400).json({ error: passwordErr, field: 'password' });

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          email_verified: true,
        },
      }),
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = getSupabaseError(payload, 'Registration failed');
      const alreadyRegistered = /already|registered|exists/i.test(message);
      return res.status(alreadyRegistered ? 409 : response.status).json({
        error: alreadyRegistered ? 'This email is already registered. Please sign in instead.' : message,
        code: alreadyRegistered ? 'EMAIL_ALREADY_REGISTERED' : payload?.error_code,
      });
    }

    return res.status(201).json({
      ok: true,
      user: {
        id: payload.id,
        email: payload.email,
        displayName,
      },
    });
  } catch (err) {
    console.error('[auth-register] error:', err);
    return res.status(500).json({
      error: 'Registration failed',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
