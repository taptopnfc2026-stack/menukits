/**
 * AI Provider settings — persisted in localStorage
 * API keys are stored locally; the serverless function also checks
 * Vercel environment variables as a fallback for production use.
 */

export type RecognitionProvider = 'mistral' | 'azure' | 'openai';
export type TranslationProvider = 'mistral' | 'azure' | 'deepl' | 'openai';

export interface MistralConfig {
  apiKey: string;
  recognitionModel: string;  // default: pixtral-large-latest
  translationModel: string;   // default: mistral-large-latest
}

export interface AzureConfig {
  apiKey: string;
  endpoint: string;                    // e.g. https://my-resource.openai.azure.com
  recognitionDeployment: string;       // e.g. gpt-4o
  translationDeployment: string;       // e.g. gpt-4o
  apiVersion: string;                  // e.g. 2024-10-21
}

export interface DeepLConfig {
  apiKey: string;
  type: 'free' | 'pro';  // free = api-free.deepl.com, pro = api.deepl.com
}

export interface OpenAIConfig {
  apiKey: string;
  recognitionModel: string;  // default: gpt-4o
  translationModel: string;   // default: gpt-4o-mini
}

export interface AISettings {
  recognitionProvider: RecognitionProvider;
  translationProvider: TranslationProvider;
  mistral: MistralConfig;
  azure: AzureConfig;
  deepl: DeepLConfig;
  openai: OpenAIConfig;
}

// ---- Defaults ----
export const DEFAULT_AI_SETTINGS: AISettings = {
  recognitionProvider: 'mistral',
  translationProvider: 'mistral',
  mistral: {
    apiKey: '',
    recognitionModel: 'pixtral-large-latest',
    translationModel: 'mistral-large-latest',
  },
  azure: {
    apiKey: '',
    endpoint: '',
    recognitionDeployment: 'gpt-4o',
    translationDeployment: 'gpt-4o',
    apiVersion: '2024-10-21',
  },
  deepl: {
    apiKey: '',
    type: 'free',
  },
  openai: {
    apiKey: '',
    recognitionModel: 'gpt-4o',
    translationModel: 'gpt-4o-mini',
  },
};

// ---- localStorage helpers ----
const STORAGE_KEY = 'menukits_ai_settings';

/**
 * Get the root domain for cross-subdomain cookie sharing.
 * admin.menukits.eu → .menukits.eu
 * menukits.eu → .menukits.eu (can set on root domain too)
 * Returns null for localhost / dev environments.
 */
function getRootDomain(): string | null {
  const hostname = window.location.hostname;
  // Skip for local dev
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
  // Handle Vercel preview URLs (no subdomain sharing needed)
  if (hostname.endsWith('.vercel.app')) return null;
  const parts = hostname.split('.');
  if (parts.length < 2) return null;
  // Always use .root domain so cookie is visible across all subdomains + root
  return '.' + parts.slice(parts.length - 2).join('.');
}

export function loadAISettings(): AISettings {
  const merge = (parsed: Record<string, any>): AISettings => ({
    ...DEFAULT_AI_SETTINGS,
    ...parsed,
    mistral: { ...DEFAULT_AI_SETTINGS.mistral, ...(parsed.mistral || {}) },
    azure: { ...DEFAULT_AI_SETTINGS.azure, ...(parsed.azure || {}) },
    deepl: { ...DEFAULT_AI_SETTINGS.deepl, ...(parsed.deepl || {}) },
    openai: { ...DEFAULT_AI_SETTINGS.openai, ...(parsed.openai || {}) },
  });

  // 1. Try localStorage first
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Sync from localStorage to cross-domain cookie (auto-heal after deploy)
      syncToCookie(raw);
      return merge(parsed);
    }
  } catch { /* ignore */ }

  // 2. Fallback: try cross-domain cookie (set by admin subdomain)
  try {
    const cookieRaw = readCookie(STORAGE_KEY);
    if (cookieRaw) {
      const parsed = JSON.parse(decodeURIComponent(cookieRaw));
      // Also save to localStorage for faster access next time
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch { /* ignore */ }
      return merge(parsed);
    }
  } catch { /* ignore */ }

  return DEFAULT_AI_SETTINGS;
}

/** Sync localStorage data to the cross-domain cookie (for subdomain sharing) */
function syncToCookie(json: string): void {
  const rootDomain = getRootDomain();
  if (!rootDomain) return;
  // Only write cookie if it differs from current cookie (avoid unnecessary writes)
  const existing = readCookie(STORAGE_KEY);
  if (existing === encodeURIComponent(json)) return;
  setCookie(STORAGE_KEY, encodeURIComponent(json), {
    domain: rootDomain,
    maxAge: 365 * 24 * 60 * 60,
    secure: true,
    sameSite: 'Lax',
    path: '/',
  });
}

export function saveAISettings(settings: AISettings): void {
  const json = JSON.stringify(settings);

  // Always save to localStorage
  localStorage.setItem(STORAGE_KEY, json);

  // Also save to cross-domain cookie so subdomains can read it
  const rootDomain = getRootDomain();
  if (rootDomain) {
    setCookie(STORAGE_KEY, encodeURIComponent(json), {
      domain: rootDomain,
      maxAge: 365 * 24 * 60 * 60, // 1 year
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });
  }
}

// ---- Cookie helpers ----
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(
  name: string,
  value: string,
  opts: { domain: string; maxAge: number; secure: boolean; sameSite: string; path: string },
): void {
  let cookie = `${name}=${value}; max-age=${opts.maxAge}; path=${opts.path}`;
  if (opts.domain) cookie += `; domain=${opts.domain}`;
  if (opts.secure) cookie += '; secure';
  if (opts.sameSite) cookie += `; samesite=${opts.sameSite}`;
  document.cookie = cookie;
}

/** Check if the current recognition provider has a valid API key configured */
export function hasRecognitionKey(settings: AISettings): boolean {
  const provider = settings.recognitionProvider;
  if (provider === 'mistral') {
    return settings.mistral.apiKey.trim().length > 0;
  }
  if (provider === 'azure') {
    return settings.azure.apiKey.trim().length > 0 && settings.azure.endpoint.trim().length > 0;
  }
  if (provider === 'openai') {
    return settings.openai.apiKey.trim().length > 0;
  }
  return false;
}

/** Check if the current translation provider has a valid API key configured */
export function hasTranslationKey(settings: AISettings): boolean {
  const provider = settings.translationProvider;
  if (provider === 'mistral') {
    return settings.mistral.apiKey.trim().length > 0;
  }
  if (provider === 'azure') {
    return settings.azure.apiKey.trim().length > 0 && settings.azure.endpoint.trim().length > 0;
  }
  if (provider === 'deepl') {
    return settings.deepl.apiKey.trim().length > 0;
  }
  if (provider === 'openai') {
    return settings.openai.apiKey.trim().length > 0;
  }
  return false;
}

/** Provider display metadata */
export const PROVIDER_INFO: Record<string, { name: string; icon: string; description: string; badge?: string }> = {
  mistral: {
    name: 'Mistral AI',
    icon: '🇫🇷',
    description: 'EU-native, GDPR-compliant. Pixtral Large for vision, Mistral Large for translation.',
    badge: 'Recommended',
  },
  azure: {
    name: 'Azure OpenAI',
    icon: '☁️',
    description: 'Microsoft Azure-hosted GPT-4V/GPT-4o. EU data residency available.',
  },
  deepl: {
    name: 'DeepL',
    icon: '🇩🇪',
    description: 'German-engineered, specialized translation API. Best-in-class translation quality.',
    badge: 'Translation only',
  },
  openai: {
    name: 'OpenAI',
    icon: '🤖',
    description: 'Native OpenAI API with GPT-4o vision for recognition and GPT-4o-mini for translation.',
    badge: 'Native',
  },
};
