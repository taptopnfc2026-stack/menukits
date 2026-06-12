import { useState } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { adminStore, type ApiKeyEntry } from '@/lib/admin-store';

const PRESET_PROVIDERS = ['Mistral', 'OpenAI', 'Anthropic', 'Azure', 'DeepL', 'Custom'];

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>(() => adminStore.getApiKeys());
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('Mistral');
  const [secret, setSecret] = useState('');
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleAdd = () => {
    if (!name.trim() || !secret.trim()) {
      alert('Please fill in name and key.');
      return;
    }
    const prefix = secret.slice(0, 4) + '•••••••' + secret.slice(-4);
    const newKey: ApiKeyEntry = {
      id: `k${Date.now()}`,
      name: name.trim(),
      provider,
      prefix,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const next = [newKey, ...keys];
    setKeys(next);
    adminStore.saveApiKeys(next);
    adminStore.pushActivity({
      type: 'settings.update',
      message: `Added API key for ${provider}: ${name}`,
      actor: 'Admin',
    });
    setShowAdd(false);
    setName('');
    setSecret('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this API key?')) return;
    const k = keys.find((x) => x.id === id);
    const next = keys.filter((x) => x.id !== id);
    setKeys(next);
    adminStore.saveApiKeys(next);
    adminStore.pushActivity({
      type: 'settings.update',
      message: `Removed API key "${k?.name}"`,
      actor: 'Admin',
    });
  };

  const handleCopy = async (prefix: string, id: string) => {
    // In a real app we'd copy the real key, not the masked version
    try {
      await navigator.clipboard.writeText(prefix);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="admin-themed mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">API Keys</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage keys for the AI providers used by MenuKits.
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="admin-bg-accent gap-2 text-white"
          style={{ boxShadow: '0 4px 14px var(--admin-accent-ring)' }}
        >
          <Plus className="h-4 w-4" />
          Add Key
        </Button>
      </div>

      {/* Security notice */}
      <div className="admin-themed mb-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div className="text-xs text-amber-200/90">
          <p className="font-medium text-amber-200">Keep your keys secret</p>
          <p className="mt-0.5 text-amber-200/70">
            Keys are stored in your browser only. For production, configure a backend
            proxy (e.g. Vercel environment variables) so keys never reach the client.
          </p>
        </div>
      </div>

      {keys.length === 0 ? (
        <div className="admin-themed rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-16 text-center">
          <div className="admin-bg-accent-soft mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <KeyRound className="admin-text-accent h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-900">No API keys yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            Add your first provider key to enable menu recognition and translation.
          </p>
        </div>
      ) : (
        <div className="admin-themed overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr
                    key={k.id}
                    className="admin-themed border-b border-slate-200/60 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{k.name}</td>
                    <td className="px-4 py-3">
                      <Badge className="admin-bg-accent-soft admin-text-accent border-0 text-[10px]">
                        {k.provider}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="admin-themed rounded border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                          {revealed === k.id ? k.prefix : k.prefix.replace(/•/g, '•')}
                        </code>
                        <button
                          onClick={() =>
                            setRevealed(revealed === k.id ? null : k.id)
                          }
                          className="admin-themed text-slate-400 hover:text-slate-700"
                          title={revealed === k.id ? 'Hide' : 'Reveal'}
                        >
                          {revealed === k.id ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(k.prefix, k.id)}
                          className="admin-themed text-slate-400 hover:text-slate-700"
                          title="Copy"
                        >
                          {copied === k.id ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {k.createdAt}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="admin-themed rounded-md p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <div className="admin-themed fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Add API Key</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 px-6 py-5">
              <div>
                <Label className="mb-1.5 text-xs text-slate-500">Display name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production Mistral"
                  className="border-slate-300 bg-white text-slate-900"
                />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-slate-500">Provider</Label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="admin-themed h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
                >
                  {PRESET_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-slate-500">API Key</Label>
                <Input
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="sk-…"
                  type="password"
                  className="border-slate-300 bg-white font-mono text-xs text-slate-900"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <Button
                variant="ghost"
                onClick={() => setShowAdd(false)}
                className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button onClick={handleAdd} className="admin-bg-accent text-white">
                Save Key
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
