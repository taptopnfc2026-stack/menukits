import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import { adminStore } from '@/lib/admin-store';

// Hand-rolled SVG bar chart (no chart lib) so it picks up theme CSS variables
const dailyViews = [
  { day: 'Mon', views: 312 },
  { day: 'Tue', views: 458 },
  { day: 'Wed', views: 287 },
  { day: 'Thu', views: 521 },
  { day: 'Fri', views: 689 },
  { day: 'Sat', views: 842 },
  { day: 'Sun', views: 754 },
];

const topLanguages = [
  { code: 'English', count: 4821, pct: 38 },
  { code: 'Italian', count: 2103, pct: 17 },
  { code: 'French', count: 1742, pct: 14 },
  { code: 'Spanish', count: 1391, pct: 11 },
  { code: 'German', count: 1184, pct: 9 },
  { code: 'Other', count: 1500, pct: 11 },
];

const devices = [
  { name: 'Mobile', icon: Smartphone, value: '68%', color: 'text-emerald-400' },
  { name: 'Desktop', icon: Monitor, value: '24%', color: 'text-blue-400' },
  { name: 'Tablet', icon: Tablet, value: '8%', color: 'text-amber-400' },
];

export default function AdminAnalyticsPage() {
  const menus = adminStore.getMenus();
  const totalViews = menus.reduce((s, m) => s + m.views, 0);
  const maxViews = Math.max(...dailyViews.map((d) => d.views));

  return (
    <div className="admin-themed mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visitor and engagement insights across all your menus.
        </p>
      </div>

      {/* Top metrics */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Views"
          value={totalViews.toLocaleString()}
          sub="+12.4% vs last week"
          icon={Eye}
        />
        <MetricCard
          label="Unique Visitors"
          value="3,247"
          sub="+8.1% vs last week"
          icon={Users}
        />
        <MetricCard
          label="Avg. Session"
          value="2m 41s"
          sub="+0:14 vs last week"
          icon={TrendingUp}
        />
        <MetricCard
          label="Languages Served"
          value={topLanguages.length}
          sub="Across all menus"
          icon={Globe}
        />
      </div>

      {/* Daily views bar chart */}
      <div className="admin-themed mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Views This Week</h2>
            <p className="text-xs text-slate-400">Daily menu page views (last 7 days)</p>
          </div>
          <span className="admin-bg-accent-soft admin-text-accent rounded-full px-2.5 py-1 text-[11px] font-medium">
            Total: {dailyViews.reduce((s, d) => s + d.views, 0).toLocaleString()}
          </span>
        </div>
        <div className="flex h-48 items-end gap-3">
          {dailyViews.map((d) => {
            const heightPct = (d.views / maxViews) * 100;
            return (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-medium text-slate-500">{d.views}</span>
                <div className="relative w-full flex-1 overflow-hidden rounded-md bg-slate-100">
                  <div
                    className="admin-themed absolute bottom-0 left-0 right-0 rounded-t-md"
                    style={{
                      height: `${heightPct}%`,
                      background:
                        'linear-gradient(180deg, var(--admin-accent) 0%, var(--admin-accent-ring) 100%)',
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-400">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Languages */}
        <div className="admin-themed rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Top Languages</h2>
          <ul className="space-y-3">
            {topLanguages.map((l) => (
              <li key={l.code}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{l.code}</span>
                  <span className="text-slate-400">
                    {l.count.toLocaleString()} ({l.pct}%)
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full admin-themed"
                    style={{
                      width: `${l.pct * 2}%`,
                      background: 'var(--admin-accent)',
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Devices */}
        <div className="admin-themed rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Devices</h2>
          <div className="space-y-3">
            {devices.map((d) => (
              <div
                key={d.name}
                className="admin-themed flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                    <d.icon className="h-4 w-4 text-slate-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{d.name}</span>
                </div>
                <span className={`text-lg font-bold ${d.color}`}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: typeof BarChart3;
}) {
  return (
    <div className="admin-themed rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-emerald-400">{sub}</p>
    </div>
  );
}
