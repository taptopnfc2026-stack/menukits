import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  TrendingUp,
  Eye,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  ChevronLeft,
  ArrowUpRight,
  BarChart3,
  Zap,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { analyticsData, mockMenus } from '@/data/mockData';

const statCards = [
  { label: 'Total views', value: '1,258', icon: Eye, change: '+12%' },
  { label: 'Today', value: '47', icon: Zap, change: '+8%' },
  { label: 'This week', value: '312', icon: TrendingUp, change: '+23%' },
  { label: 'Avg. time on menu', value: '2m 34s', icon: Clock, change: '' },
];

export default function AnalyticsPage() {
  const menus = mockMenus;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your menu performance and visitor insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This month</option>
            <option>Last 3 months</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border border-gray-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                {stat.change && (
                  <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.change}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Views by day chart */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Views by day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-40 pt-2">
              {analyticsData.viewsByDay.map((day) => {
                const maxViews = Math.max(...analyticsData.viewsByDay.map((d) => d.views));
                const height = (day.views / maxViews) * 100;
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700">{day.views}</span>
                    <div className="w-full max-w-[36px] rounded-t-lg bg-[#5544e4]/20 overflow-hidden" style={{ height: `${Math.max(height, 10)}%` }}>
                      <div
                        className="w-full rounded-t-lg bg-[#5544e4] transition-all duration-500"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{day.date}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Device breakdown */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Device breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5544e4]/10">
                  <Smartphone className="h-5 w-5 text-[#5544e4]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Mobile</span>
                    <span className="text-sm font-semibold text-gray-900">{analyticsData.deviceBreakdown.mobile}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-[#5544e4]" style={{ width: `${analyticsData.deviceBreakdown.mobile}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <Tablet className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Tablet</span>
                    <span className="text-sm font-semibold text-gray-900">{analyticsData.deviceBreakdown.tablet}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${analyticsData.deviceBreakdown.tablet}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                  <Monitor className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Desktop</span>
                    <span className="text-sm font-semibold text-gray-900">{analyticsData.deviceBreakdown.desktop}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-gray-500" style={{ width: `${analyticsData.deviceBreakdown.desktop}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top dishes */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top dishes</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {analyticsData.topDishes.map((dish, i) => (
                <div key={dish.name} className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-800' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{dish.name}</p>
                    <p className="text-xs text-gray-400">{dish.section}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{dish.views}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular sections */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Popular sections</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {analyticsData.popularSections.map((section) => (
                <div key={section.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{section.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{section.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#5544e4] to-[#7c6ef0]"
                      style={{ width: `${section.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu-level analytics */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Per menu analytics</h2>
        <div className="space-y-3">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <BarChart3 className="h-5 w-5 text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{menu.title}</p>
                <p className="text-sm text-gray-500">
                  {menu.sections.reduce((acc, s) => acc + s.dishes.length, 0)} dishes ·{' '}
                  {menu.isVisible ? 'Active' : 'Archived'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {Math.floor(Math.random() * 500 + 100)}
                </span>
                <Link to={`/menu-preview/${menu.id}`}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
