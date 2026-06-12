import { useState } from 'react';
import {
  Activity as ActivityIcon,
  UserPlus,
  Edit3,
  Send,
  Settings as SettingsIcon,
  LogIn,
  Trash2,
} from 'lucide-react';
import { adminStore, type ActivityEntry } from '@/lib/admin-store';

const typeIcon: Record<ActivityEntry['type'], typeof Edit3> = {
  'login': LogIn,
  'menu.create': Edit3,
  'menu.update': Edit3,
  'menu.publish': Send,
  'api.test': Send,
  'settings.update': SettingsIcon,
  'user.invite': UserPlus,
};

const typeColor: Record<ActivityEntry['type'], string> = {
  login: 'text-blue-400 bg-blue-500/10',
  'menu.create': 'text-emerald-400 bg-emerald-500/10',
  'menu.update': 'text-amber-400 bg-amber-500/10',
  'menu.publish': 'text-violet-400 bg-violet-500/10',
  'api.test': 'text-cyan-400 bg-cyan-500/10',
  'settings.update': 'text-slate-500 bg-slate-200',
  'user.invite': 'text-pink-400 bg-pink-500/10',
};

export default function AdminActivityPage() {
  const [activity] = useState<ActivityEntry[]>(() => adminStore.getActivity());

  return (
    <div className="admin-themed mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity Log</h1>
        <p className="mt-1 text-sm text-slate-500">
          A history of all actions across the admin panel.
        </p>
      </div>

      <div className="admin-themed overflow-hidden rounded-xl border border-slate-200 bg-white">
        {activity.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <ActivityIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
            No activity yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200/60">
            {activity.map((a) => {
              const Icon = typeIcon[a.type] || ActivityIcon;
              return (
                <li
                  key={a.id}
                  className="admin-themed flex items-start gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeColor[a.type]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700">{a.message}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {a.actor} · {new Date(a.at).toLocaleString()}
                    </p>
                  </div>
                  <span className="admin-themed rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    {a.type}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
