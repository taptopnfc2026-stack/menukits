/**
 * Debug/test endpoint — minimal, no dependencies.
 */
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).end(JSON.stringify({
    ok: true,
    time: new Date().toISOString(),
    envTest: {
      hasUrl: !!process.env.SUPABASE_URL,
      urlPrefix: (process.env.SUPABASE_URL || '').slice(0, 30),
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      anonKeyPrefix: (process.env.SUPABASE_ANON_KEY || '').slice(0, 20),
      anonKeyIsJwt: (process.env.SUPABASE_ANON_KEY || '').startsWith('eyJ'),
    },
  }));
}
