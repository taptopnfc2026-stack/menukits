import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Eye,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  ArrowUpRight,
  BarChart3,
  Zap,
  Loader2,
  AlertCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

type AnalyticsSummary = {
  rangeDays: number;
  totalViews: number;
  todayViews: number;
  periodViews: number;
  avgTimeSeconds: number;
  viewsByDay: { date: string; label: string; views: number }[];
  deviceBreakdown: { mobile: number; tablet: number; desktop: number; unknown: number };
  topDishes: { id: string; name: string; section: string; views: number }[];
  popularSections: { id: string; name: string; views: number; percentage: number }[];
  menus: { id: string; title: string; isVisible: boolean; dishCount: number; totalViews: number; periodViews: number }[];
  hasData: boolean;
};

const EMPTY_SUMMARY: AnalyticsSummary = {
  rangeDays: 7,
  totalViews: 0,
  todayViews: 0,
  periodViews: 0,
  avgTimeSeconds: 0,
  viewsByDay: [],
  deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0, unknown: 0 },
  topDishes: [],
  popularSections: [],
  menus: [],
  hasData: false,
};

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

function formatDuration(seconds: number) {
  if (!seconds) return '—';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

function percentChange(current: number, previous: number) {
  if (!previous && !current) return '';
  if (!previous) return '+100%';
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function splitPeriodForChange(days: { views: number }[]) {
  if (days.length < 2) return '';
  const midpoint = Math.floor(days.length / 2);
  const previous = days.slice(0, midpoint).reduce((sum, day) => sum + day.views, 0);
  const current = days.slice(midpoint).reduce((sum, day) => sum + day.views, 0);
  return percentChange(current, previous);
}

function EmptyBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-6 text-center">
      <UtensilsCrossed className="mb-3 h-8 w-8 text-gray-300" />
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [rangeDays, setRangeDays] = useState(7);
  const [summary, setSummary] = useState<AnalyticsSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !token) {
      setSummary(EMPTY_SUMMARY);
      setIsLoading(false);
      setError('Please log in to view analytics.');
      return;
    }

    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/menus?action=analytics&days=${rangeDays}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `Analytics request failed with HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setSummary({ ...EMPTY_SUMMARY, ...data });
      } catch (e) {
        if (!cancelled) {
          setSummary(EMPTY_SUMMARY);
          setError(e instanceof Error ? e.message : 'Could not load analytics.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, token, rangeDays]);

  const periodChange = useMemo(() => splitPeriodForChange(summary.viewsByDay), [summary.viewsByDay]);
  const maxViews = Math.max(1, ...summary.viewsByDay.map((day) => day.views));

  const statCards = [
    { label: 'Total views', value: formatNumber(summary.totalViews), icon: Eye, change: '' },
    { label: 'Today', value: formatNumber(summary.todayViews), icon: Zap, change: '' },
    { label: `Last ${summary.rangeDays || rangeDays} days`, value: formatNumber(summary.periodViews), icon: TrendingUp, change: periodChange },
    { label: 'Avg. time on menu', value: formatDuration(summary.avgTimeSeconds), icon: Clock, change: '' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real visitor data collected from your public menu links
          </p>
        </div>
        <select
          value={rangeDays}
          onChange={(event) => setRangeDays(Number(event.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600"
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#b98900]" />
            <p className="text-sm font-medium text-gray-500">Loading real analytics...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="border border-gray-100 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                    <stat.icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                    {stat.change && (
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.change.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                        <ArrowUpRight className="h-3 w-3" />
                        {stat.change}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!summary.hasData && (
            <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">No visitor data collected yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Share or scan your public QR/menu link. New visits will appear here as real data, without demo numbers.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Views by day</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.viewsByDay.length > 0 ? (
                  <div className="flex h-40 items-end justify-between gap-2 pt-2">
                    {summary.viewsByDay.map((day) => {
                      const height = day.views > 0 ? (day.views / maxViews) * 100 : 0;
                      return (
                        <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700">{day.views}</span>
                          <div className="h-full w-full max-w-[36px] overflow-hidden rounded-t-lg bg-[#fff8d8]">
                            <div
                              className="mt-auto w-full rounded-t-lg bg-[#151526] transition-all duration-500"
                              style={{ height: `${Math.max(height, day.views > 0 ? 8 : 0)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyBlock title="No daily views yet" description="Daily bars will appear after customers open your public menu." />
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Device breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-2">
                  <DeviceRow icon={Smartphone} label="Mobile" value={summary.deviceBreakdown.mobile} color="bg-[#151526]" bg="bg-[#fff8d8]" />
                  <DeviceRow icon={Tablet} label="Tablet" value={summary.deviceBreakdown.tablet} color="bg-blue-500" bg="bg-blue-100" />
                  <DeviceRow icon={Monitor} label="Desktop" value={summary.deviceBreakdown.desktop} color="bg-gray-500" bg="bg-gray-100" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Top dishes</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {summary.topDishes.length > 0 ? (
                  <div className="space-y-3">
                    {summary.topDishes.map((dish, i) => (
                      <RankRow key={dish.id} rank={i + 1} title={dish.name} subtitle={dish.section} value={dish.views} />
                    ))}
                  </div>
                ) : (
                  <EmptyBlock title="No dish clicks yet" description="Dish ranking appears after customers open dish details." />
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Popular sections</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {summary.popularSections.length > 0 ? (
                  <div className="space-y-3">
                    {summary.popularSections.map((section) => (
                      <div key={section.id}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{section.name}</span>
                          <span className="text-sm font-semibold text-gray-900">{section.percentage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#151526] to-[#8a6500]"
                            style={{ width: `${section.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBlock title="No section clicks yet" description="Section popularity appears after customers switch menu sections." />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Per menu analytics</h2>
            <div className="space-y-3">
              {summary.menus.length > 0 ? summary.menus.map((menu) => (
                <div key={menu.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <BarChart3 className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{menu.title}</p>
                    <p className="text-sm text-gray-500">
                      {menu.dishCount} dishes · {menu.isVisible ? 'Active' : 'Hidden'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {formatNumber(menu.totalViews)}
                    </span>
                    <Link to={`/r/${menu.id}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        <Eye className="h-3.5 w-3.5" />
                        Public view
                      </Button>
                    </Link>
                  </div>
                </div>
              )) : (
                <EmptyBlock title="No menus found" description="Create a menu first, then publish or scan it to collect analytics." />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DeviceRow({ icon: Icon, label, value, color, bg }: {
  icon: typeof Smartphone;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
        <Icon className="h-5 w-5 text-[#b98900]" />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-semibold text-gray-900">{value}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
        </div>
      </div>
    </div>
  );
}

function RankRow({ rank, title, subtitle, value }: { rank: number; title: string; subtitle: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        rank === 1 ? 'bg-yellow-100 text-yellow-800' :
        rank === 2 ? 'bg-gray-100 text-gray-600' :
        rank === 3 ? 'bg-orange-100 text-orange-800' :
        'bg-gray-50 text-gray-500'
      }`}>
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <span className="text-sm font-semibold text-gray-700">{formatNumber(value)}</span>
    </div>
  );
}
