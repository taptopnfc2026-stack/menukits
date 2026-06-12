import { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Eye,
  Edit3,
  Archive,
  Trash2,
  Globe,
  Calendar,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { adminStore, type AdminMenu } from '@/lib/admin-store';

const statusStyles: Record<AdminMenu['status'], string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  archived: 'bg-slate-200 text-slate-500 border-slate-300',
};

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<AdminMenu[]>(() => adminStore.getMenus());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminMenu['status'] | 'all'>('all');

  const filtered = useMemo(() => {
    let list = menus;
    if (statusFilter !== 'all') list = list.filter((m) => m.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) => m.name.toLowerCase().includes(q) || m.language.toLowerCase().includes(q),
      );
    }
    return list;
  }, [menus, query, statusFilter]);

  const persist = (next: AdminMenu[]) => {
    setMenus(next);
    adminStore.saveMenus(next);
  };

  const handleArchive = (id: string) => {
    persist(
      menus.map((m) => (m.id === id ? { ...m, status: 'archived' as const } : m)),
    );
    adminStore.pushActivity({
      type: 'menu.update',
      message: `Archived menu "${menus.find((m) => m.id === id)?.name}"`,
      actor: 'Admin',
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this menu permanently?')) return;
    const name = menus.find((m) => m.id === id)?.name;
    persist(menus.filter((m) => m.id !== id));
    adminStore.pushActivity({
      type: 'menu.update',
      message: `Deleted menu "${name}"`,
      actor: 'Admin',
    });
  };

  const handleNew = () => {
    const name = prompt('Menu name?')?.trim();
    if (!name) return;
    const newMenu: AdminMenu = {
      id: `m${Date.now()}`,
      name,
      language: 'English',
      itemCount: 0,
      status: 'draft',
      views: 0,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    persist([newMenu, ...menus]);
    adminStore.pushActivity({
      type: 'menu.create',
      message: `Created menu "${name}"`,
      actor: 'Admin',
    });
  };

  const stats = {
    total: menus.length,
    active: menus.filter((m) => m.status === 'active').length,
    draft: menus.filter((m) => m.status === 'draft').length,
    archived: menus.filter((m) => m.status === 'archived').length,
  };

  return (
    <div className="admin-themed mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Menus</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, edit, and publish restaurant menus.
          </p>
        </div>
        <Button
          onClick={handleNew}
          className="admin-bg-accent gap-2 text-white shadow-lg"
          style={{ boxShadow: '0 4px 14px var(--admin-accent-ring)' }}
        >
          <Plus className="h-4 w-4" />
          New Menu
        </Button>
      </div>

      {/* Stats strip */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Active', value: stats.active, color: 'text-emerald-400' },
          { label: 'Draft', value: stats.draft, color: 'text-amber-400' },
          { label: 'Archived', value: stats.archived, color: 'text-slate-500' },
        ].map((s) => (
          <div
            key={s.label}
            className="admin-themed rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <p className="text-[11px] font-medium text-slate-400">{s.label}</p>
            <p className={cn('mt-0.5 text-xl font-bold', s.color || 'text-slate-900')}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-themed mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search menus…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full border-slate-300 bg-white pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {(['all', 'active', 'draft', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'admin-themed rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                statusFilter === s
                  ? 'admin-bg-accent-soft admin-text-accent'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-themed overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <UtensilsCrossed className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    No menus found.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="admin-themed border-b border-slate-200/60 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{m.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <Globe className="h-3 w-3 text-slate-400" />
                        {m.language}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{m.itemCount}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {m.views.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('border text-[10px]', statusStyles[m.status])}>
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {m.updatedAt}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn title="View" icon={Eye} />
                        <ActionBtn title="Edit" icon={Edit3} />
                        <ActionBtn
                          title="Archive"
                          icon={Archive}
                          onClick={() => handleArchive(m.id)}
                        />
                        <ActionBtn
                          title="Delete"
                          icon={Trash2}
                          danger
                          onClick={() => handleDelete(m.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  title,
  danger,
  onClick,
}: {
  icon: typeof Eye;
  title: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'admin-themed flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        danger
          ? 'text-slate-400 hover:bg-red-500/10 hover:text-red-400'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
