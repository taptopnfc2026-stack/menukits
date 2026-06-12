/**
 * Server-side Settings API
 *
 * GET  /api/admin-settings          → Read current AI settings from KV
 * POST /api/admin-settings          → Save AI settings to KV (requires ADMIN_SECRET)
 *
 * The settings are stored server-side in Vercel KV / Upstash Redis.
 * Once the admin saves, ALL users on any domain automatically get the updated config.
 */
import { kvGet, kvSet } from './_kv.js';

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return handleGet(res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(res) {
  try {
    const raw = await kvGet('settings:ai');
    if (!raw) {
      return res.status(200).json({ settings: null, message: 'No settings stored yet' });
    }
    const settings = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.status(200).json({ settings });
  } catch (error) {
    console.error('[admin-settings] GET error:', error.message);
    return res.status(500).json({ error: 'Failed to read settings', detail: error.message });
  }
}

async function handlePost(req, res) {
  // Security: require admin secret
  const secret = req.headers['x-admin-secret'] || '';
  if (ADMIN_SECRET && secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid admin secret. Set ADMIN_SECRET in Vercel env vars.' });
  }

  const { settings } = req.body || {};
  if (!settings) {
    return res.status(400).json({ error: 'Missing settings in request body' });
  }

  try {
    const stored = JSON.stringify(settings);
    await kvSet('settings:ai', stored);
    console.log('[admin-settings] Settings saved to KV successfully');
    return res.status(200).json({ ok: true, message: 'Settings saved' });
  } catch (error) {
    console.error('[admin-settings] POST error:', error.message);
    return res.status(500).json({ error: 'Failed to save settings', detail: error.message });
  }
}
