import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Globe,
  Key,
  ArrowRightLeft,
  Info,
  ExternalLink,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  loadAISettings,
  saveAISettings,
  hasRecognitionKey,
  hasTranslationKey,
  PROVIDER_INFO,
  type AISettings,
  type RecognitionProvider,
  type TranslationProvider,
  DEFAULT_AI_SETTINGS,
} from '@/types/ai-settings';

// ---- Test connection helper ----
async function testConnection(
  provider: string,
  config: Record<string, string>
): Promise<{ ok: boolean; message: string }> {
  const isDev = import.meta.env.DEV;

  try {
    const response = await fetch(
      isDev ? '/api/ai-test' : '/api/ai-test',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, ...config }),
        signal: AbortSignal.timeout(15000),
      }
    );
    const data = await response.json();
    return { ok: response.ok && data.ok !== false, message: data.message || data.error || 'Unknown response' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Connection failed' };
  }
}

const ADMIN_SECRET_STORAGE_KEY = 'menukits_admin_secret';

function getAdminSecret(): string {
  try {
    return localStorage.getItem(ADMIN_SECRET_STORAGE_KEY) || '';
  } catch { return ''; }
}

function setAdminSecret(secret: string): void {
  try {
    localStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret);
  } catch { /* ignore */ }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AISettings>(loadAISettings);
  const [showMistralKey, setShowMistralKey] = useState(false);
  const [showAzureKey, setShowAzureKey] = useState(false);
  const [showDeepLKey, setShowDeepLKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [adminSecret, setAdminSecretState] = useState(getAdminSecret);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [saved, setSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  // Load settings from server on mount
  useEffect(() => {
    loadFromServer();
  }, []);

  // Auto-save with debounce (to localStorage + server)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToLocalAndServer(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
    return () => clearTimeout(timer);
  }, [settings]);

  async function loadFromServer() {
    setLoadStatus('loading');
    try {
      const res = await fetch('/api/admin-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
          saveAISettings(data.settings); // cache to localStorage
          setLoadStatus('loaded');
          return;
        }
      }
    } catch { /* ignore - will try localStorage */ }
    setLoadStatus('error');
  }

  async function saveToLocalAndServer(s: AISettings) {
    // Always save to localStorage first (fast, always works)
    saveAISettings(s);

    // Then push to server
    setSaveStatus('saving');
    const secret = getAdminSecret();
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (secret) headers['x-admin-secret'] = secret;

      const res = await fetch('/api/admin-settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ settings: s }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        const err = await res.json();
        if (res.status === 403) {
          setSaveStatus('error');
          console.warn('Server save rejected — ADMIN_SECRET may be required');
        } else {
          setSaveStatus('error');
          console.error('Server save failed:', err);
        }
      }
    } catch (e) {
      setSaveStatus('error');
      console.error('Server save error:', e);
    }
  }

  const updateSettings = useCallback((patch: Partial<AISettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateMistral = useCallback((patch: Partial<AISettings['mistral']>) => {
    setSettings((prev) => ({ ...prev, mistral: { ...prev.mistral, ...patch } }));
  }, []);

  const updateAzure = useCallback((patch: Partial<AISettings['azure']>) => {
    setSettings((prev) => ({ ...prev, azure: { ...prev.azure, ...patch } }));
  }, []);

  const updateDeepL = useCallback((patch: Partial<AISettings['deepl']>) => {
    setSettings((prev) => ({ ...prev, deepl: { ...prev.deepl, ...patch } }));
  }, []);

  const updateOpenAI = useCallback((patch: Partial<AISettings['openai']>) => {
    setSettings((prev) => ({ ...prev, openai: { ...prev.openai, ...patch } }));
  }, []);

  const handleTest = useCallback(async (provider: string) => {
    setTesting(provider);
    setTestResults((prev) => ({ ...prev, [provider]: { ok: false, message: 'Testing...' } }));

    let config: Record<string, string> = {};
    if (provider === 'mistral') {
      config = { apiKey: settings.mistral.apiKey };
    } else if (provider === 'azure') {
      config = {
        apiKey: settings.azure.apiKey,
        endpoint: settings.azure.endpoint,
        deployment: settings.azure.recognitionDeployment,
      };
    } else if (provider === 'deepl') {
      config = { apiKey: settings.deepl.apiKey, type: settings.deepl.type };
    } else if (provider === 'openai') {
      config = { apiKey: settings.openai.apiKey };
    }

    const result = await testConnection(provider, config);
    setTestResults((prev) => ({ ...prev, [provider]: result }));
    setTesting(null);
  }, [settings]);

  const isKeyConfigured = (provider: string): boolean => {
    if (provider === 'mistral') return settings.mistral.apiKey.trim().length > 0;
    if (provider === 'azure') return settings.azure.apiKey.trim().length > 0 && settings.azure.endpoint.trim().length > 0;
    if (provider === 'deepl') return settings.deepl.apiKey.trim().length > 0;
    if (provider === 'openai') return settings.openai.apiKey.trim().length > 0;
    return false;
  };

  const recogConfigured = hasRecognitionKey(settings);
  const transConfigured = hasTranslationKey(settings);

  // ---- Common Styles ----
  const selectedRing = 'ring-2 ring-[#5544e4] ring-offset-2';
  const providerCardBase = 'relative cursor-pointer rounded-xl border-2 p-5 transition-all hover:border-[#5544e4]/50 hover:shadow-sm';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5544e4]/10">
            <Settings className="h-5 w-5 text-[#5544e4]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Provider Settings</h1>
            <p className="text-sm text-gray-500">Configure AI API keys centrally — changes apply to all users immediately</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Settings saved
            </span>
          )}
          {loadStatus === 'loading' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading from server...
            </span>
          )}
          {loadStatus === 'loaded' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Synced from server
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Syncing to server...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved to server ✓
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              <XCircle className="h-3.5 w-3.5" />
              Server sync failed — check admin secret
            </span>
          )}
        </div>
        <div className="mt-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Open Admin Panel
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>
          <span className="ml-2 text-xs text-gray-400">A dedicated backend for full-screen provider management</span>
        </div>
      </div>

      <div className="space-y-8">
        {/* ================================================================ */}
        {/* SECTION 1: Recognition Provider */}
        {/* ================================================================ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#f5b800]" />
              <CardTitle className="text-lg">Menu Recognition</CardTitle>
            </div>
            <CardDescription>
              AI provider used to scan and digitize printed menu images into structured data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider selection cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              {(['mistral', 'azure', 'openai'] as RecognitionProvider[]).map((id) => {
                const info = PROVIDER_INFO[id];
                const selected = settings.recognitionProvider === id;
                const configured = id === 'mistral'
                  ? settings.mistral.apiKey.trim().length > 0
                  : id === 'azure'
                  ? settings.azure.apiKey.trim().length > 0 && settings.azure.endpoint.trim().length > 0
                  : settings.openai.apiKey.trim().length > 0;
                const testResult = testResults[id];

                return (
                  <div
                    key={id}
                    onClick={() => updateSettings({ recognitionProvider: id })}
                    className={`${providerCardBase} ${selected ? `border-[#5544e4] bg-[#5544e4]/[0.03] ${selectedRing}` : 'border-gray-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      {info.badge && (
                        <Badge variant="outline" className="bg-[#5544e4]/5 text-[#5544e4] border-[#5544e4]/20 text-[10px] px-1.5 py-0">
                          {info.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{info.name}</h3>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{info.description}</p>

                    {/* Status */}
                    <div className="mt-3 flex items-center gap-2">
                      {configured ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Key configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <XCircle className="h-3.5 w-3.5" /> No key set
                        </span>
                      )}
                      {testResult && (
                        <span className={`text-xs ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                          — {testResult.ok ? 'Connected ✓' : 'Failed ✗'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* SECTION 2: Translation Provider */}
        {/* ================================================================ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-[#5544e4]" />
              <CardTitle className="text-lg">Menu Translation</CardTitle>
            </div>
            <CardDescription>
              AI provider used to translate menu items into different languages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {(['mistral', 'azure', 'deepl', 'openai'] as TranslationProvider[]).map((id) => {
                const info = PROVIDER_INFO[id];
                const selected = settings.translationProvider === id;
                const configured = isKeyConfigured(id);
                const testResult = testResults[id];

                return (
                  <div
                    key={id}
                    onClick={() => updateSettings({ translationProvider: id })}
                    className={`${providerCardBase} ${selected ? `border-[#5544e4] bg-[#5544e4]/[0.03] ${selectedRing}` : 'border-gray-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      {info.badge && (
                        <Badge variant="outline" className="bg-[#5544e4]/5 text-[#5544e4] border-[#5544e4]/20 text-[10px] px-1.5 py-0">
                          {info.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{info.name}</h3>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{info.description}</p>

                    <div className="mt-3 flex items-center gap-2">
                      {configured ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Key configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <XCircle className="h-3.5 w-3.5" /> No key set
                        </span>
                      )}
                      {testResult && (
                        <span className={`text-xs ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                          — {testResult.ok ? 'Connected ✓' : 'Failed ✗'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* SECTION 3: API Key Configuration */}
        {/* ================================================================ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg">API Keys</CardTitle>
            </div>
            <CardDescription>
              Enter your API keys for each provider. Keys are saved to the server (Vercel KV) and apply to all users.
              {saveStatus === 'error' && (
                <span className="block mt-1 text-red-500 font-medium">
                  Set ADMIN_SECRET header below to enable server-side saving.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* ---- Mistral AI ---- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{PROVIDER_INFO.mistral.icon}</span>
                <h3 className="font-semibold text-gray-900">Mistral AI</h3>
                {PROVIDER_INFO.mistral.badge && (
                  <Badge variant="outline" className="bg-[#5544e4]/5 text-[#5544e4] border-[#5544e4]/20 text-[10px]">
                    {PROVIDER_INFO.mistral.badge}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="mistral-key">API Key</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="mistral-key"
                      type={showMistralKey ? 'text' : 'password'}
                      placeholder="e.g. xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={settings.mistral.apiKey}
                      onChange={(e) => updateMistral({ apiKey: e.target.value })}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMistralKey(!showMistralKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showMistralKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Get your key at{' '}
                    <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noopener noreferrer" className="text-[#5544e4] underline">
                      console.mistral.ai
                    </a>
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="mistral-recog-model">Recognition Model</Label>
                    <Input
                      id="mistral-recog-model"
                      value={settings.mistral.recognitionModel}
                      onChange={(e) => updateMistral({ recognitionModel: e.target.value })}
                      placeholder="pixtral-large-latest"
                      className="mt-1.5 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mistral-trans-model">Translation Model</Label>
                    <Input
                      id="mistral-trans-model"
                      value={settings.mistral.translationModel}
                      onChange={(e) => updateMistral({ translationModel: e.target.value })}
                      placeholder="mistral-large-latest"
                      className="mt-1.5 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTest('mistral')}
                disabled={!settings.mistral.apiKey.trim() || testing === 'mistral'}
                className="gap-2"
              >
                {testing === 'mistral' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Test Connection
              </Button>
              {testResults['mistral'] && (
                <span className={`ml-3 text-sm ${testResults['mistral'].ok ? 'text-green-600' : 'text-red-500'}`}>
                  {testResults['mistral'].message}
                </span>
              )}
            </div>

            {/* Divider */}
            <hr className="border-gray-100" />

            {/* ---- Azure OpenAI ---- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{PROVIDER_INFO.azure.icon}</span>
                <h3 className="font-semibold text-gray-900">Azure OpenAI</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="azure-key">API Key</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="azure-key"
                      type={showAzureKey ? 'text' : 'password'}
                      placeholder="e.g. xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={settings.azure.apiKey}
                      onChange={(e) => updateAzure({ apiKey: e.target.value })}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAzureKey(!showAzureKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showAzureKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="azure-endpoint">Endpoint URL</Label>
                  <Input
                    id="azure-endpoint"
                    type="url"
                    placeholder="https://my-resource.openai.azure.com"
                    value={settings.azure.endpoint}
                    onChange={(e) => updateAzure({ endpoint: e.target.value })}
                    className="mt-1.5 font-mono text-sm"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="azure-recog-deploy">Recognition Deployment</Label>
                    <Input
                      id="azure-recog-deploy"
                      value={settings.azure.recognitionDeployment}
                      onChange={(e) => updateAzure({ recognitionDeployment: e.target.value })}
                      placeholder="gpt-4o"
                      className="mt-1.5 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="azure-trans-deploy">Translation Deployment</Label>
                    <Input
                      id="azure-trans-deploy"
                      value={settings.azure.translationDeployment}
                      onChange={(e) => updateAzure({ translationDeployment: e.target.value })}
                      placeholder="gpt-4o"
                      className="mt-1.5 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="azure-api-version">API Version</Label>
                    <Input
                      id="azure-api-version"
                      value={settings.azure.apiVersion}
                      onChange={(e) => updateAzure({ apiVersion: e.target.value })}
                      placeholder="2024-10-21"
                      className="mt-1.5 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTest('azure')}
                disabled={!settings.azure.apiKey.trim() || !settings.azure.endpoint.trim() || testing === 'azure'}
                className="gap-2"
              >
                {testing === 'azure' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Test Connection
              </Button>
              {testResults['azure'] && (
                <span className={`ml-3 text-sm ${testResults['azure'].ok ? 'text-green-600' : 'text-red-500'}`}>
                  {testResults['azure'].message}
                </span>
              )}
            </div>

            {/* Divider */}
            <hr className="border-gray-100" />

            {/* ---- OpenAI ---- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{PROVIDER_INFO.openai.icon}</span>
                <h3 className="font-semibold text-gray-900">OpenAI</h3>
                {PROVIDER_INFO.openai.badge && (
                  <Badge variant="outline" className="bg-[#5544e4]/5 text-[#5544e4] border-[#5544e4]/20 text-[10px]">
                    {PROVIDER_INFO.openai.badge}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="openai-key">API Key</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="openai-key"
                      type={showOpenAIKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={settings.openai.apiKey}
                      onChange={(e) => updateOpenAI({ apiKey: e.target.value })}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Get your key at{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#5544e4] underline">
                      platform.openai.com
                    </a>
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="openai-recog-model">Recognition Model</Label>
                    <Input
                      id="openai-recog-model"
                      value={settings.openai.recognitionModel}
                      onChange={(e) => updateOpenAI({ recognitionModel: e.target.value })}
                      placeholder="gpt-4o"
                      className="mt-1.5 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-400">gpt-4o (vision) or gpt-4o-mini</p>
                  </div>
                  <div>
                    <Label htmlFor="openai-trans-model">Translation Model</Label>
                    <Input
                      id="openai-trans-model"
                      value={settings.openai.translationModel}
                      onChange={(e) => updateOpenAI({ translationModel: e.target.value })}
                      placeholder="gpt-4o-mini"
                      className="mt-1.5 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-400">gpt-4o-mini recommended for cost</p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTest('openai')}
                disabled={!settings.openai.apiKey.trim() || testing === 'openai'}
                className="gap-2"
              >
                {testing === 'openai' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Test Connection
              </Button>
              {testResults['openai'] && (
                <span className={`ml-3 text-sm ${testResults['openai'].ok ? 'text-green-600' : 'text-red-500'}`}>
                  {testResults['openai'].message}
                </span>
              )}
            </div>

            {/* Divider */}
            <hr className="border-gray-100" />

            {/* ---- DeepL ---- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{PROVIDER_INFO.deepl.icon}</span>
                <h3 className="font-semibold text-gray-900">DeepL</h3>
                {PROVIDER_INFO.deepl.badge && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                    {PROVIDER_INFO.deepl.badge}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="deepl-key">API Key</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="deepl-key"
                      type={showDeepLKey ? 'text' : 'password'}
                      placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
                      value={settings.deepl.apiKey}
                      onChange={(e) => updateDeepL({ apiKey: e.target.value })}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepLKey(!showDeepLKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showDeepLKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Get your key at{' '}
                    <a href="https://www.deepl.com/pro-api" target="_blank" rel="noopener noreferrer" className="text-[#5544e4] underline">
                      deepl.com/pro-api
                    </a>
                  </p>
                </div>

                <div>
                  <Label>Plan Type</Label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deepl-type"
                        value="free"
                        checked={settings.deepl.type === 'free'}
                        onChange={() => updateDeepL({ type: 'free' })}
                        className="h-4 w-4 text-[#5544e4] accent-[#5544e4]"
                      />
                      <span className="text-sm text-gray-700">Free (api-free.deepl.com)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deepl-type"
                        value="pro"
                        checked={settings.deepl.type === 'pro'}
                        onChange={() => updateDeepL({ type: 'pro' })}
                        className="h-4 w-4 text-[#5544e4] accent-[#5544e4]"
                      />
                      <span className="text-sm text-gray-700">Pro (api.deepl.com)</span>
                    </label>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTest('deepl')}
                disabled={!settings.deepl.apiKey.trim() || testing === 'deepl'}
                className="gap-2"
              >
                {testing === 'deepl' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Test Connection
              </Button>
              {testResults['deepl'] && (
                <span className={`ml-3 text-sm ${testResults['deepl'].ok ? 'text-green-600' : 'text-red-500'}`}>
                  {testResults['deepl'].message}
                </span>
              )}
            </div>

            {/* Divider */}
            <hr className="border-gray-100" />

            {/* ---- Server Sync (Admin Secret) ---- */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#5544e4]" />
                <h3 className="font-semibold text-gray-900">Server Sync</h3>
                <Badge variant="outline" className="bg-[#5544e4]/5 text-[#5544e4] border-[#5544e4]/20 text-[10px]">
                  Required
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                To save API keys to the server (so all users can translate), set a secret key both here and as <code className="bg-gray-100 px-1 rounded text-xs">ADMIN_SECRET</code> in Vercel env vars.
              </p>
              <div>
                <Label htmlFor="admin-secret">Admin Secret</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="admin-secret"
                    type={showAdminSecret ? 'text' : 'password'}
                    placeholder="e.g. my-secret-key-2024"
                    value={adminSecret}
                    onChange={(e) => {
                      setAdminSecretState(e.target.value);
                      setAdminSecret(e.target.value);
                    }}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminSecret(!showAdminSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showAdminSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Must match <code className="bg-gray-100 px-1 rounded text-xs">ADMIN_SECRET</code> in your Vercel environment variables.
                  Keys are saved server-side in Vercel KV.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* SECTION 4: Status Summary */}
        {/* ================================================================ */}
        <Card className="bg-gray-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-base">Status Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 border">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${recogConfigured ? 'bg-green-100' : 'bg-red-50'}`}>
                  {recogConfigured ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Recognition</p>
                  <p className="text-xs text-gray-500">
                    {recogConfigured
                      ? `${PROVIDER_INFO[settings.recognitionProvider].name} ready`
                      : `No key configured for ${PROVIDER_INFO[settings.recognitionProvider].name}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 border">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${transConfigured ? 'bg-green-100' : 'bg-red-50'}`}>
                  {transConfigured ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Translation</p>
                  <p className="text-xs text-gray-500">
                    {transConfigured
                      ? `${PROVIDER_INFO[settings.translationProvider].name} ready`
                      : `No key configured for ${PROVIDER_INFO[settings.translationProvider].name}`}
                  </p>
                </div>
              </div>
            </div>
            {(!recogConfigured || !transConfigured) && (
              <p className="mt-4 text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3 border border-amber-200">
                Demo mode will be used for any unconfigured service. Configure API keys above to enable AI-powered recognition and translation.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
