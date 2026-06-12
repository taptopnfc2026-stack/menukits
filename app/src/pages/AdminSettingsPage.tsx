import { useState } from 'react';
import {
  Palette,
  Globe,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { ADMIN_THEMES, type ThemeId } from '@/lib/admin-theme';
import { adminStore } from '@/lib/admin-store';

export default function AdminSettingsPage() {
  const { themeId, customAccent, setTheme } = useAdminTheme();

  // Preferences
  const [emailNotif, setEmailNotif] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Europe/London');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    adminStore.pushActivity({
      type: 'settings.update',
      message: 'Updated admin preferences',
      actor: 'Admin',
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const data = {
      menus: adminStore.getMenus(),
      users: adminStore.getUsers(),
      apiKeys: adminStore.getApiKeys(),
      connections: adminStore.getConnections(),
      activity: adminStore.getActivity(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menukits-admin-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (!confirm('Reset all admin data to defaults? This cannot be undone.')) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith('menukits_admin_'))
      .forEach((k) => localStorage.removeItem(k));
    location.reload();
  };

  const themes: ThemeId[] = [
    'midnight-indigo',
    'ocean-teal',
    'emerald',
    'sunset-orange',
    'rose-pink',
    'royal-purple',
  ];

  return (
    <div className="admin-themed mx-auto max-w-3xl px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Customize the admin panel, theme, and notifications.
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="admin-bg-accent text-white"
        >
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {/* Theme */}
      <Section icon={Palette} title="Theme">
        <p className="mb-3 text-xs text-slate-500">
          Pick a preset or define your own accent color. Changes apply instantly.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {themes.map((id) => {
            const t = ADMIN_THEMES[id];
            const active = themeId === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={cn(
                  'admin-themed flex flex-col items-center gap-2 rounded-lg border p-3 transition-all',
                  active
                    ? 'border-slate-300 bg-slate-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <span
                  className="h-9 w-9 rounded-full border-2 border-slate-200 shadow-inner"
                  style={{ backgroundColor: t.accent }}
                />
                <span className="text-[10px] font-medium text-slate-600">
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom */}
        <div className="admin-themed mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <Label className="mb-2 text-xs text-slate-500">Custom Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customAccent}
              onChange={(e) => setTheme('custom', e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-transparent"
            />
            <Input
              type="text"
              value={customAccent}
              onChange={(e) => setTheme('custom', e.target.value)}
              className="h-9 flex-1 border-slate-300 bg-white font-mono text-xs text-slate-900"
            />
            <span
              className="h-7 w-7 rounded-md border border-slate-300"
              style={{ backgroundColor: customAccent }}
            />
          </div>
        </div>
      </Section>

      {/* Preferences */}
      <Section icon={Globe} title="Preferences">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 text-xs text-slate-500">Language</Label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="admin-themed h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          <div>
            <Label className="mb-1.5 text-xs text-slate-500">Timezone</Label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="admin-themed h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
            >
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Berlin">Europe/Berlin</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Asia/Shanghai">Asia/Shanghai</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <Toggle
          label="Email notifications"
          description="Receive updates about menu changes, new users, and errors."
          checked={emailNotif}
          onChange={setEmailNotif}
        />
        <Toggle
          label="Weekly digest"
          description="Get a Monday-morning summary of activity and metrics."
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
        />
      </Section>

      {/* Privacy */}
      <Section icon={Shield} title="Privacy & Analytics">
        <Toggle
          label="Anonymous usage analytics"
          description="Help improve MenuKits by sharing anonymous feature usage."
          checked={analyticsOptIn}
          onChange={setAnalyticsOptIn}
        />
        <Toggle
          label="Automatic daily backup"
          description="Export all admin data to a secure backup location."
          checked={autoBackup}
          onChange={setAutoBackup}
        />
      </Section>

      {/* Data */}
      <Section icon={Database} title="Data Management">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="admin-themed gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export All Data
          </Button>
          <Button
            variant="outline"
            className="admin-themed gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Import Data
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="admin-themed gap-2 border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Defaults
          </Button>
        </div>
      </Section>

      {saved && (
        <div className="admin-themed fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400 shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          Settings saved
        </div>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Palette;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-themed rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="admin-bg-accent-soft flex h-7 w-7 items-center justify-center rounded-md">
          <Icon className="admin-text-accent h-3.5 w-3.5" />
        </div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="admin-themed flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="pr-4">
        <Label className="text-sm text-slate-900">{label}</Label>
        <p className="text-[11px] text-slate-400">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
