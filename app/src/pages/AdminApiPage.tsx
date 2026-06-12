import { useState } from 'react';
import {
  Plug,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  Key,
  Send,
  Power,
  Edit3,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { adminStore, type CustomApiConnection } from '@/lib/admin-store';

const PRESET_TEMPLATES = [
  {
    name: 'OpenAI-compatible',
    baseUrl: 'https://api.openai.com/v1',
    authHeader: 'Authorization',
    authValuePrefix: 'Bearer ',
    modelPlaceholder: 'gpt-4o-mini',
  },
  {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    authHeader: 'x-api-key',
    authValuePrefix: '',
    modelPlaceholder: 'claude-3-5-sonnet-20241022',
  },
  {
    name: 'Ollama (local)',
    baseUrl: 'http://localhost:11434/v1',
    authHeader: 'Authorization',
    authValuePrefix: 'Bearer ',
    modelPlaceholder: 'llama3.2-vision',
  },
  {
    name: 'Azure OpenAI',
    baseUrl: 'https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT',
    authHeader: 'api-key',
    authValuePrefix: '',
    modelPlaceholder: 'gpt-4o',
  },
];

export default function AdminApiPage() {
  const [connections, setConnections] = useState<CustomApiConnection[]>(
    () => adminStore.getConnections(),
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CustomApiConnection | null>(null);

  // form state
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [authHeader, setAuthHeader] = useState('Authorization');
  const [authValue, setAuthValue] = useState('');
  const [headersRaw, setHeadersRaw] = useState(''); // JSON text
  const [model, setModel] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const resetForm = () => {
    setName('');
    setBaseUrl('');
    setAuthHeader('Authorization');
    setAuthValue('');
    setHeadersRaw('');
    setModel('');
    setEnabled(true);
    setEditing(null);
    setTestResult(null);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c: CustomApiConnection) => {
    setEditing(c);
    setName(c.name);
    setBaseUrl(c.baseUrl);
    setAuthHeader(c.authHeader);
    setAuthValue(c.authValue);
    setHeadersRaw(JSON.stringify(c.customHeaders || {}, null, 2));
    setModel(c.model);
    setEnabled(c.enabled);
    setShowForm(true);
    setTestResult(null);
  };

  const applyTemplate = (t: (typeof PRESET_TEMPLATES)[number]) => {
    setName(t.name);
    setBaseUrl(t.baseUrl);
    setAuthHeader(t.authHeader);
    setAuthValue(t.authValuePrefix);
    setModel(t.modelPlaceholder);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    // Simulated connection test — the real proxy endpoint is /api/ai-test
    try {
      const res = await fetch('/api/ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          authHeader,
          authValue,
          model,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.ok ?? true)) {
        setTestResult({ ok: true, msg: `Connected (${data.latency ?? '~'}ms)` });
      } else {
        setTestResult({ ok: false, msg: data.error || `Failed (HTTP ${res.status})` });
      }
    } catch (err) {
      setTestResult({ ok: false, msg: (err as Error).message || 'Network error' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !baseUrl.trim() || !model.trim()) {
      alert('Please fill in name, base URL, and model.');
      return;
    }

    let customHeaders: Record<string, string> = {};
    if (headersRaw.trim()) {
      try {
        customHeaders = JSON.parse(headersRaw);
      } catch {
        alert('Custom headers must be valid JSON.');
        return;
      }
    }

    const entry: CustomApiConnection = {
      id: editing?.id ?? `c${Date.now()}`,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      authHeader: authHeader.trim() || 'Authorization',
      authValue: authValue.trim(),
      customHeaders,
      model: model.trim(),
      enabled,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };

    const next = editing
      ? connections.map((c) => (c.id === entry.id ? entry : c))
      : [entry, ...connections];
    setConnections(next);
    adminStore.saveConnections(next);
    adminStore.pushActivity({
      type: 'api.test',
      message: editing
        ? `Updated custom API "${entry.name}"`
        : `Added custom API "${entry.name}"`,
      actor: 'Admin',
    });
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this API connection?')) return;
    const c = connections.find((x) => x.id === id);
    const next = connections.filter((x) => x.id !== id);
    setConnections(next);
    adminStore.saveConnections(next);
    adminStore.pushActivity({
      type: 'api.test',
      message: `Removed custom API "${c?.name}"`,
      actor: 'Admin',
    });
  };

  const handleToggle = (id: string) => {
    const next = connections.map((c) =>
      c.id === id ? { ...c, enabled: !c.enabled } : c,
    );
    setConnections(next);
    adminStore.saveConnections(next);
  };

  return (
    <div className="admin-themed mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">API Connections</h1>
          <p className="mt-1 text-sm text-slate-500">
            Plug in your own AI provider — any OpenAI-compatible, Anthropic, Azure, or
            self-hosted endpoint.
          </p>
        </div>
        <Button
          onClick={openNew}
          className="admin-bg-accent gap-2 text-white"
          style={{ boxShadow: '0 4px 14px var(--admin-accent-ring)' }}
        >
          <Plus className="h-4 w-4" />
          New Connection
        </Button>
      </div>

      {/* Templates row */}
      <div className="mb-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Quick start with template
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESET_TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                applyTemplate(t);
                setShowForm(true);
              }}
              className="admin-themed group flex flex-col items-start gap-1 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <Plug className="admin-text-accent h-3.5 w-3.5" />
              <span className="text-xs font-semibold text-slate-900">{t.name}</span>
              <span className="truncate text-[10px] text-slate-400">{t.baseUrl}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {connections.length === 0 ? (
        <div className="admin-themed rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-16 text-center">
          <div className="admin-bg-accent-soft mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <Plug className="admin-text-accent h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-900">No API connections yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            Add a custom endpoint to use any AI provider — your own keys, your own models,
            full control.
          </p>
          <Button
            onClick={openNew}
            variant="outline"
            className="admin-themed mt-4 gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add your first connection
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {connections.map((c) => (
            <div
              key={c.id}
              className="admin-themed rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {c.name}
                    </h3>
                    <Badge
                      className={cn(
                        'border-0 text-[10px]',
                        c.enabled
                          ? 'admin-bg-accent-soft admin-text-accent'
                          : 'bg-slate-200 text-slate-500',
                      )}
                    >
                      {c.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {c.baseUrl}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      {c.authHeader}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Code2 className="h-3 w-3" />
                      {c.model}
                    </span>
                  </div>
                  {Object.keys(c.customHeaders || {}).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(c.customHeaders).map(([k, v]) => (
                        <span
                          key={k}
                          className="admin-themed rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
                        >
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={c.enabled}
                    onCheckedChange={() => handleToggle(c.id)}
                  />
                  <button
                    onClick={() => openEdit(c)}
                    className="admin-themed flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="admin-themed flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          />
          <div className="admin-themed fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                {editing ? 'Edit API Connection' : 'New API Connection'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <Field label="Display Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My OpenAI"
                  className="border-slate-300 bg-white text-slate-900"
                />
              </Field>

              <Field label="Base URL">
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="border-slate-300 bg-white font-mono text-xs text-slate-900"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Auth Header">
                  <Input
                    value={authHeader}
                    onChange={(e) => setAuthHeader(e.target.value)}
                    placeholder="Authorization"
                    className="border-slate-300 bg-white font-mono text-xs text-slate-900"
                  />
                </Field>
                <Field label="Auth Value">
                  <Input
                    value={authValue}
                    onChange={(e) => setAuthValue(e.target.value)}
                    placeholder="Bearer sk-…"
                    type="password"
                    className="border-slate-300 bg-white font-mono text-xs text-slate-900"
                  />
                </Field>
              </div>

              <Field label="Model">
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="border-slate-300 bg-white font-mono text-xs text-slate-900"
                />
              </Field>

              <Field label="Custom Headers (JSON object)">
                <Textarea
                  value={headersRaw}
                  onChange={(e) => setHeadersRaw(e.target.value)}
                  placeholder={`{\n  "X-Org-Id": "abc123"\n}`}
                  className="min-h-[80px] border-slate-300 bg-white font-mono text-xs text-slate-900"
                />
              </Field>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <Label className="text-sm text-slate-900">Enabled</Label>
                  <p className="text-[11px] text-slate-400">
                    Allow MenuKits to send requests to this endpoint.
                  </p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>

              {/* Test result */}
              {testResult && (
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                    testResult.ok
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-red-500/30 bg-red-500/10 text-red-400',
                  )}
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {testResult.msg}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-6 py-4">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !baseUrl}
                className="admin-themed gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                {testing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Test Connection
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="admin-bg-accent text-white"
                >
                  {editing ? 'Save Changes' : 'Create Connection'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 text-xs font-medium text-slate-500">{label}</Label>
      {children}
    </div>
  );
}
