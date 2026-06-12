/**
 * Vercel Serverless Function — AI Connection Test
 *
 * Tests API keys for Mistral, Azure OpenAI, and DeepL.
 * Each test sends a minimal "ping" request to verify the key works.
 *
 * Endpoint: POST /api/ai-test
 */
export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, apiKey, endpoint, deployment, type } = req.body || {};

  // Allow fallback to Vercel env vars
  const key = apiKey || (
    provider === 'mistral' ? process.env.MISTRAL_API_KEY :
    provider === 'azure' ? process.env.AZURE_API_KEY :
    provider === 'deepl' ? process.env.DEEPL_API_KEY :
    provider === 'openai' ? process.env.OPENAI_API_KEY :
    ''
  );

  if (!key) {
    return res.status(400).json({ ok: false, message: `No API key provided for ${provider}. Set it in Settings or as a Vercel env var.` });
  }

  try {
    let testResult;

    switch (provider) {
      case 'mistral':
        testResult = await testMistral(key);
        break;
      case 'azure':
        testResult = await testAzure(key, endpoint || process.env.AZURE_ENDPOINT || '', deployment || process.env.AZURE_DEPLOYMENT || '');
        break;
      case 'openai':
        testResult = await testOpenAI(key);
        break;
      case 'deepl':
        testResult = await testDeepL(key, type || 'free');
        break;
      default:
        return res.status(400).json({ ok: false, message: `Unknown provider: ${provider}` });
    }

    return res.status(200).json(testResult);
  } catch (error) {
    return res.status(200).json({ ok: false, message: `Connection failed: ${error.message}` });
  }
}

async function testMistral(apiKey) {
  const response = await fetch('https://api.mistral.ai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10000),
  });
  if (response.ok) {
    const data = await response.json();
    return { ok: true, message: `Connected! ${data.data?.length || '?'} models available` };
  }
  const err = await response.text();
  return { ok: false, message: `Mistral error (${response.status}): ${err.substring(0, 200)}` };
}

async function testAzure(apiKey, endpoint, deployment) {
  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment || 'gpt-4o'}/chat/completions?api-version=2024-10-21`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Say "ok"' }],
      max_tokens: 5,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (response.ok) {
    return { ok: true, message: 'Azure OpenAI connected successfully' };
  }
  const err = await response.text();
  return { ok: false, message: `Azure error (${response.status}): ${err.substring(0, 200)}` };
}

async function testOpenAI(apiKey) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10000),
  });
  if (response.ok) {
    const data = await response.json();
    return { ok: true, message: `Connected! ${data.data?.length || '?'} models available` };
  }
  const err = await response.text();
  return { ok: false, message: `OpenAI error (${response.status}): ${err.substring(0, 200)}` };
}

async function testDeepL(apiKey, type) {
  const baseUrl = type === 'pro' ? 'https://api.deepl.com' : 'https://api-free.deepl.com';
  const response = await fetch(`${baseUrl}/v2/usage`, {
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
    signal: AbortSignal.timeout(10000),
  });
  if (response.ok) {
    const data = await response.json();
    return { ok: true, message: `Connected! Characters used: ${data.character_count || '?'}/${data.character_limit || '?'}` };
  }
  const err = await response.text();
  return { ok: false, message: `DeepL error (${response.status}): ${err.substring(0, 200)}` };
}
