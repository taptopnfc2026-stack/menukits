import { useState, useMemo } from 'react';
import {
  Users as UsersIcon,
  Search,
  UserPlus,
  Mail,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { adminStore, type AdminUser } from '@/lib/admin-store';

const roleStyles: Record<AdminUser['role'], string> = {
  owner: 'admin-bg-accent-soft admin-text-accent',
  admin: 'bg-blue-500/10 text-blue-400',
  editor: 'bg-violet-500/10 text-violet-400',
  viewer: 'bg-slate-200 text-slate-500',
};

const statusIcon = {
  active: CheckCircle2,
  invited: Clock,
  suspended: XCircle,
};

const statusColor = {
  active: 'text-emerald-400',
  invited: 'text-amber-400',
  suspended: 'text-red-400',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(() => adminStore.getUsers());
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, query]);

  const persist = (next: AdminUser[]) => {
    setUsers(next);
    adminStore.saveUsers(next);
  };

  const handleInvite = () => {
    const email = prompt('Email address to invite?')?.trim();
    if (!email) return;
    const name = email.split('@')[0];
    const newUser: AdminUser = {
      id: `u${Date.now()}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      role: 'viewer',
      status: 'invited',
      lastActive: 'Never',
    };
    persist([newUser, ...users]);
    adminStore.pushActivity({
      type: 'user.invite',
      message: `Invited ${email} as Viewer`,
      actor: 'Admin',
    });
  };

  const handleSuspend = (id: string) => {
    if (!confirm('Suspend this user?')) return;
    const u = users.find((x) => x.id === id);
    persist(users.map((x) => (x.id === id ? { ...x, status: 'suspended' as const } : x)));
    adminStore.pushActivity({
      type: 'user.invite',
      message: `Suspended user ${u?.email}`,
      actor: 'Admin',
    });
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    invited: users.filter((u) => u.status === 'invited').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  };

  return (
    <div className="admin-themed mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Members</h1>
          <p className="mt-1 text-sm text-slate-500">
            Invite teammates and assign roles.
          </p>
        </div>
        <Button
          onClick={handleInvite}
          className="admin-bg-accent gap-2 text-white"
          style={{ boxShadow: '0 4px 14px var(--admin-accent-ring)' }}
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Active', value: stats.active, color: 'text-emerald-400' },
          { label: 'Invited', value: stats.invited, color: 'text-amber-400' },
          { label: 'Suspended', value: stats.suspended, color: 'text-red-400' },
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

      <div className="admin-themed mb-4 rounded-lg border border-slate-200 bg-white p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email, role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full border-slate-300 bg-white pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="admin-themed overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    <UsersIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const StatusIcon = statusIcon[u.status];
                  return (
                    <tr
                      key={u.id}
                      className="admin-themed border-b border-slate-200/60 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="admin-bg-accent-soft flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-slate-900">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{u.name}</p>
                            <p className="flex items-center gap-1 text-xs text-slate-400">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            'border-0 text-[10px] font-medium capitalize',
                            roleStyles[u.role],
                          )}
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-xs font-medium',
                            statusColor[u.status],
                          )}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.lastActive}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {u.status !== 'suspended' && (
                            <button
                              onClick={() => handleSuspend(u.id)}
                              className="admin-themed rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                            >
                              Suspend
                            </button>
                          )}
                          <button className="admin-themed flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
