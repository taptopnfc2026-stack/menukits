/**
 * Vercel Serverless Function — 菜单识别 & 翻译 API 代理
 *
 * 支持多 AI 提供商：
 *   - Mistral AI  (Pixtral Large vision + Mistral Large translation)
 *   - Azure OpenAI (GPT-4V/4o vision + translation)
 *   - DeepL        (translation only, no vision)
 *
 * GDPR 合规方案：
 *   - API Keys 优先从 Vercel 环境变量读取
 *   - 客户端可传入 apiKey（用于 UI 配置的场景）
 *   - 部署在 EU 边缘节点
 *
 * 端点：POST /api/menu-recognize
 * 请求体新增字段（可选）：
 *   - provider: 'mistral' | 'azure' | 'deepl' (overrides default)
 *   - task: 'recognize' | 'translate'
 *   - apiKey: 用户通过 Settings 页面配置的 key
 */
import { kvGet } from './_kv.js';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

/**
 * Load AI settings from KV (server-side store).
 * Falls back to env vars if KV is not configured.
 */
async function loadServerSettings() {
  try {
    const raw = await kvGet('settings:ai');
    if (raw) {
      try { return JSON.parse(raw); } catch { return raw; }
    }
  } catch (e) {
    console.warn('[AI Proxy] KV load failed, using env vars fallback:', e.message);
  }
  return null;
}

/**
 * Resolve API key for a given provider.
 * Priority: KV (admin settings) > request body (client-sent) > env vars
 */
async function resolveApiKey(provider, body) {
  const settings = await loadServerSettings();

  if (settings) {
    // Map provider to settings field
    if (provider === 'mistral') return settings.mistral?.apiKey || '';
    if (provider === 'azure') return settings.azure?.apiKey || '';
    if (provider === 'openai') return settings.openai?.apiKey || '';
    if (provider === 'deepl') return settings.deepl?.apiKey || '';
  }

  // Fallback: client-provided key (backward compat) or env var
  return body.apiKey || '';
}

/**
 * Resolve provider-specific config from KV settings.
 */
async function resolveProviderConfig(provider, task, body) {
  const settings = await loadServerSettings();
  const config = {};

  if (settings) {
    if (provider === 'mistral') {
      config.model = task === 'translate'
        ? (settings.mistral?.translationModel || body.model)
        : (settings.mistral?.recognitionModel || body.model);
    } else if (provider === 'azure') {
      config.endpoint = settings.azure?.endpoint || body.endpoint;
      config.recognitionDeployment = settings.azure?.recognitionDeployment || body.recognitionDeployment;
      config.translationDeployment = settings.azure?.translationDeployment || body.translationDeployment;
      config.apiVersion = settings.azure?.apiVersion || body.apiVersion;
    } else if (provider === 'openai') {
      config.model = task === 'translate'
        ? (settings.openai?.translationModel || body.model)
        : (settings.openai?.recognitionModel || body.model);
    } else if (provider === 'deepl') {
      config.deeplType = settings.deepl?.type || body.deeplType;
    }
  }
  return config;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const body = req.body || {};
  const task = body.task || 'recognize';
  let provider = body.provider || resolveDefaultProvider(task);

  // Debug: log request info
  console.log(`[AI Proxy] Received: task=${task}, provider=${provider}, model=${body.model}, hasMessages=${!!body.messages}, bodySize=${JSON.stringify(body).length}`);

  // Load API key from server-side KV (primary) with fallback chain
  let serverApiKey = await resolveApiKey(provider, body);
  let envApiKey = getEnvApiKey(provider);
  let effectiveKey = serverApiKey || envApiKey;

  // --- AUTO-FALLBACK: if requested provider has no key, find one that does ---
  const defaultModels = {
    openai: task === 'translate' ? 'gpt-4o-mini' : 'gpt-4o',
    mistral: task === 'translate' ? 'mistral-large-latest' : 'pixtral-large-latest',
    azure: 'gpt-4o',
    deepl: '',
  };

  let needsModelOverride = false;
  if (!effectiveKey) {
    const fallbackProviders = task === 'translate'
      ? ['openai', 'mistral', 'azure', 'deepl']
      : ['openai', 'mistral', 'azure'];
    for (const fb of fallbackProviders) {
      if (fb === provider) continue;
      const fbKey = await resolveApiKey(fb, body) || getEnvApiKey(fb);
      if (fbKey) {
        console.log(`[AI Proxy] Auto-fallback: ${provider} → ${fb} (key found)`);
        provider = fb;
        effectiveKey = fbKey;
        needsModelOverride = true;
        break;
      }
    }
  }

  if (!effectiveKey) {
    return res.status(502).json({
      error: 'No AI provider configured',
      detail: `No API key found for ${provider}. Set OPENAI_API_KEY or MISTRAL_API_KEY in Vercel env vars, or save settings in admin panel.`,
      provider,
    });
  }

  // Merge body with server-side config (override model on fallback)
  const serverConfig = await resolveProviderConfig(provider, task, body);
  if (needsModelOverride) {
    serverConfig.model = defaultModels[provider] || 'gpt-4o';
    console.log(`[AI Proxy] Overridden model to ${serverConfig.model} for provider ${provider}`);
  }
  const enrichedBody = { ...body, ...serverConfig };

  console.log(`[AI Proxy] Task: ${task}, Provider: ${provider}, KeySource: ${serverApiKey ? 'KV' : envApiKey ? 'env' : 'client'}`);

  try {
    let result;
    switch (provider) {
      case 'mistral':
        result = await callMistral(task, enrichedBody, effectiveKey);
        break;
      case 'azure':
        result = await callAzureOpenAI(task, enrichedBody, effectiveKey);
        break;
      case 'openai':
        result = await callOpenAI(task, enrichedBody, effectiveKey);
        break;
      case 'deepl':
        result = await callDeepL(enrichedBody, effectiveKey);
        break;
      default:
        result = await callMoonshot(body);
        break;
    }

    return res.status(200).json(result);
  } catch (error) {
    const errMsg = error.message || String(error);
    console.error(`[AI Proxy] ${provider} error:`, errMsg);
    // Return detailed error for debugging (502 = upstream failure)
    return res.status(502).json({
      error: `${provider} request failed`,
      detail: errMsg.substring(0, 500),
      provider,
    });
  }
}

function getEnvApiKey(provider) {
  const map = { mistral: 'MISTRAL_API_KEY', azure: 'AZURE_API_KEY', openai: 'OPENAI_API_KEY', deepl: 'DEEPL_API_KEY' };
  return process.env[map[provider]] || '';
}

// ---- Provider implementations ----

async function callMistral(task, body, clientApiKey) {
  const apiKey = clientApiKey || process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('Mistral API key not configured');

  if (task === 'translate') {
    const { text, sourceLang, targetLang } = body;
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || 'mistral-large-latest',
        messages: [
          { role: 'system', content: `You are a professional translator. Translate the following text from ${sourceLang || 'auto'} to ${targetLang || 'English'}. Only output the translated text, no explanations.` },
          { role: 'user', content: text },
        ],
        max_tokens: 2048,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(55000),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Mistral error (${response.status}): ${err.substring(0, 300)}`);
    }

    const data = await response.json();
    return {
      translation: data.choices?.[0]?.message?.content || '',
      provider: 'mistral',
      usage: data.usage,
    };
  }

  // Recognize (vision)
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: body.model || 'pixtral-large-latest',
      messages: body.messages,
      max_tokens: body.max_tokens || 16384,
      temperature: body.temperature ?? 0.1,
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mistral error (${response.status}): ${err.substring(0, 300)}`);
  }

  const data = await response.json();
  return { ...data, provider: 'mistral' };
}

async function callAzureOpenAI(task, body, clientApiKey) {
  const apiKey = clientApiKey || process.env.AZURE_API_KEY;
  const endpoint = body.endpoint || process.env.AZURE_ENDPOINT;
  const deployment = task === 'translate'
    ? (body.translationDeployment || process.env.AZURE_TRANSLATION_DEPLOYMENT || 'gpt-4o')
    : (body.recognitionDeployment || process.env.AZURE_RECOGNITION_DEPLOYMENT || 'gpt-4o');
  const apiVersion = body.apiVersion || process.env.AZURE_API_VERSION || '2024-10-21';

  if (!apiKey) throw new Error('Azure API key not configured');
  if (!endpoint) throw new Error('Azure endpoint not configured');

  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  let messages;
  if (task === 'translate') {
    messages = [
      { role: 'system', content: `You are a professional translator. Translate the following text from ${body.sourceLang || 'auto'} to ${body.targetLang || 'English'}. Only output the translated text, no explanations.` },
      { role: 'user', content: body.text },
    ];
  } else {
    messages = body.messages;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages,
      max_tokens: body.max_tokens || 16384,
      temperature: body.temperature ?? 0.1,
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Azure error (${response.status}): ${err.substring(0, 300)}`);
  }

  const data = await response.json();

  if (task === 'translate') {
    return {
      translation: data.choices?.[0]?.message?.content || '',
      provider: 'azure',
      usage: data.usage,
    };
  }

  return { ...data, provider: 'azure' };
}

async function callOpenAI(task, body, clientApiKey) {
  const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const model = task === 'translate'
    ? (body.model || 'gpt-4o-mini')
    : (body.model || 'gpt-4o');

  let messages;
  if (task === 'translate') {
    messages = [
      { role: 'system', content: `You are a professional translator. Translate the following text from ${body.sourceLang || 'auto'} to ${body.targetLang || 'English'}. Only output the translated text, no explanations.` },
      { role: 'user', content: body.text },
    ];
  } else {
    messages = body.messages;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: body.max_tokens || 16384,
      temperature: body.temperature ?? 0.1,
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error (${response.status}): ${err.substring(0, 300)}`);
  }

  const data = await response.json();

  if (task === 'translate') {
    return {
      translation: data.choices?.[0]?.message?.content || '',
      provider: 'openai',
      usage: data.usage,
    };
  }

  return { ...data, provider: 'openai' };
}

async function callDeepL(body, clientApiKey) {
  const apiKey = clientApiKey || process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error('DeepL API key not configured');

  const type = body.deeplType || 'free';
  const baseUrl = type === 'pro' ? 'https://api.deepl.com' : 'https://api-free.deepl.com';

  // DeepL target_lang codes
  const langMap = {
    'en': 'EN-US', 'es': 'ES', 'fr': 'FR', 'de': 'DE', 'it': 'IT',
    'pt': 'PT-PT', 'nl': 'NL', 'pl': 'PL', 'ru': 'RU', 'ja': 'JA',
    'zh': 'ZH', 'ko': 'KO', 'cs': 'CS', 'sv': 'SV', 'da': 'DA',
    'fi': 'FI', 'el': 'EL', 'hu': 'HU', 'ro': 'RO', 'bg': 'BG',
  };

  const targetLang = langMap[body.targetLang?.toLowerCase()] || 'EN-US';
  const sourceLang = body.sourceLang ? (langMap[body.sourceLang.toLowerCase()] || null) : null;

  const requestBody = {
    text: Array.isArray(body.text) ? body.text : [body.text || ''],
    target_lang: targetLang,
    ...(sourceLang && { source_lang: sourceLang }),
  };

  const response = await fetch(`${baseUrl}/v2/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `DeepL-Auth-Key ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepL error (${response.status}): ${err.substring(0, 300)}`);
  }

  const data = await response.json();
  return {
    translation: data.translations?.[0]?.text || '',
    provider: 'deepl',
    detectedSourceLang: data.translations?.[0]?.detected_source_language,
  };
}

// Backward compatibility: original Moonshot fallback
async function callMoonshot(body) {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) throw new Error('Moonshot API key not configured');

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(55000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Moonshot error (${response.status}): ${err.substring(0, 300)}`);
  }

  const data = await response.json();
  return { ...data, provider: 'moonshot' };
}

function resolveDefaultProvider(task) {
  // Try Mistral first (EU-native, recommended), then Azure, then OpenAI, then Moonshot fallback
  if (process.env.MISTRAL_API_KEY) return 'mistral';
  if (process.env.AZURE_API_KEY) return 'azure';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.MOONSHOT_API_KEY) return 'moonshot';
  return 'mistral'; // default to mistral
}
