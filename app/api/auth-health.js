/**
 * Auth Health Check — diagnostics for KV/Redis connection status.
 */
import { kvHealth } from './_kv.js';

export const config = { runtime: 'nodejs' };

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const health = kvHealth();
  return res.status(200).json({
    ok: true,
    storage: health.storage,
    hasRedisConfig: health.hasRedisConfig,
    reachable: health.reachable,
    baseUrl: health.baseUrl,
    timestamp: new Date().toISOString(),
  });
}
