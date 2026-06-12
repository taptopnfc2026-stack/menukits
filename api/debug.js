/**
 * Debug/test endpoint — minimal, no dependencies.
 * If this returns 500/FUNCTION_INVOCATION_FAILED,
 * the issue is in Vercel infrastructure, not our code.
 */
export default async function handler(req) {
  return new Response(JSON.stringify({
    ok: true,
    time: new Date().toISOString(),
    envTest: {
      hasUrl: !!process.env.SUPABASE_URL,
      urlPrefix: (process.env.SUPABASE_URL || '').slice(0, 30),
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      anonKeyPrefix: (process.env.SUPABASE_ANON_KEY || '').slice(0, 20),
      anonKeyIsJwt: (process.env.SUPABASE_ANON_KEY || '').startsWith('eyJ'),
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
