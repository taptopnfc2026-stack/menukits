import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRightLeft,
  Key,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Server,
  Cpu,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Activity as ActivityIcon,
  Eye,
  Globe,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  loadAISettings,
  hasRecognitionKey,
  hasTranslationKey,
  PROVIDER_INFO,
} from '@/types/ai-settings';
import { adminStore } from '@/lib/admin-store';

export default function AdminDashboard() {
  const settings = loadAISettings();
  const recogReady = hasRecognitionKey(settings);
  const transReady = hasTranslationKey(settings);
  const totalReady = [recogReady, transReady].filter(Boolean).length;
  const menus = adminStore.getMenus();
  const users = adminStore.getUsers();
  const activity = adminStore.getActivity().slice(0, 5);

  const totalViews = menus.reduce((sum, m) => sum + m.views, 0);
  const activeMenus = menus.filter((m) => m.status === 'active').length;

  const stats = [
    {
      label: 'Total Menus',
      value: menus.length,
      sub: `${activeMenus} active`,
      icon: UtensilsCrossed,
      accent: true,
    },
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      sub: 'All time',
      icon: Eye,
      accent: false,
    },
    {
      label: 'Team Members',
      value: users.length,
      sub: `${users.filter((u) => u.status === 'active').length} active`,
      icon: Users,
      accent: false,
    },
    {
      label: 'Services Ready',
      value: `${totalReady}/2`,
      sub: totalReady === 2 ? 'All online' : 'Setup needed',
      icon: Server,
      accent: totalReady === 2,
    },
  ];

  const services = [
    {
      name: 'Menu Recognition',
      icon: Cpu,
      provider: PROVIDER_INFO[settings.recognitionProvider],
      configured: recogReady,
      detail: recogReady
        ? settings.recognitionProvider === 'mistral'
          ? settings.mistral.recognitionModel
          : settings.azure.recognitionDeployment
        : 'Not configured',
    },
    {
      name: 'Menu Translation',
      icon: ArrowRightLeft,
      provider: PROVIDER_INFO[settings.translationProvider],
      configured: transReady,
      detail: transReady
        ? settings.translationProvider === 'deepl'
          ? `DeepL (${settings.deepl.type})`
          : settings.translationProvider
        : 'Not configured',
    },
  ];

  return (
    <div className="admin-themed mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor your AI services, manage menus, and control team access.
          </p>
        </div>
        <Badge className="admin-bg-accent-soft admin-text-accent border-0 px-2.5 py-1 text-[11px] font-medium">
          <Zap className="mr-1 h-3 w-3" />
          Live
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="admin-themed group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
              <div
                className={
                  stat.accent
                    ? 'admin-bg-accent-soft flex h-9 w-9 items-center justify-center rounded-lg'
                    : 'flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100'
                }
              >
                <stat.icon
                  className={`h-4 w-4 ${stat.accent ? 'admin-text-accent' : 'text-slate-400'}`}
                />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Service Status + Activity */}
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {/* Services */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Service Status
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.name}
                className="admin-themed rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <service.icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{service.name}</h3>
                    <p className="text-xs text-slate-400">{service.detail}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl leading-none">{service.provider.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {service.provider.name}
                      </p>
                      {service.provider.badge && (
                        <span className="admin-text-accent text-[11px]">
                          {service.provider.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  {service.configured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                      <XCircle className="h-3 w-3" />
                      Setup needed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Recent Activity
            </h2>
            <Link
              to="/admin/activity"
              className="admin-text-accent text-xs font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="admin-themed rounded-xl border border-slate-200 bg-white p-3">
            <ul className="space-y-2.5">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-2.5">
                  <div className="admin-bg-accent-soft mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    <ActivityIcon className="admin-text-accent h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-700">
                      {a.message}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {a.actor} · {new Date(a.at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
          <TrendingUp className="h-4 w-4" />
          Quick Actions
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/admin/api" icon={Globe} title="Custom API" subtitle="Add your own endpoint" />
          <QuickAction to="/admin/providers" icon={Key} title="AI Providers" subtitle="Mistral, Azure, DeepL" />
          <QuickAction to="/admin/menus" icon={UtensilsCrossed} title="Manage Menus" subtitle="View, edit, publish" />
          <QuickAction to="/admin/users" icon={Users} title="Team Members" subtitle="Roles & permissions" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  subtitle,
}: {
  to: string;
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      className="admin-themed group flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 transition-all hover:border-slate-300 hover:bg-slate-100"
    >
      <div className="admin-bg-accent-soft flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-105">
        <Icon className="admin-text-accent h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700">{title}</p>
        <p className="truncate text-[11px] text-slate-400">{subtitle}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
    </Link>
  );
}
