/**
 * Lightweight in-browser store for admin data.
 * Backed by localStorage so the demo state persists across reloads.
 * Replace with a real API when ready.
 */

export interface AdminMenu {
  id: string;
  name: string;
  language: string;
  itemCount: number;
  status: 'active' | 'draft' | 'archived';
  views: number;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  lastActive: string;
}

export interface ApiKeyEntry {
  id: string;
  name: string;
  provider: string;
  prefix: string;          // visible part of the key, e.g. "sk-•••••••aB3x"
  createdAt: string;
  lastUsed?: string;
}

export interface CustomApiConnection {
  id: string;
  name: string;
  baseUrl: string;
  authHeader: string;      // e.g. "Authorization"
  authValue: string;       // e.g. "Bearer sk-…"
  customHeaders: Record<string, string>;
  model: string;
  enabled: boolean;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  type: 'login' | 'menu.create' | 'menu.update' | 'menu.publish' | 'api.test' | 'settings.update' | 'user.invite';
  message: string;
  actor: string;
  at: string;             // ISO
}

const KEYS = {
  menus: 'menukits_admin_menus',
  users: 'menukits_admin_users',
  apiKeys: 'menukits_admin_api_keys',
  connections: 'menukits_admin_custom_apis',
  activity: 'menukits_admin_activity',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota etc */ }
}

// --- Seed data (only written on first load) ---
const seedMenus: AdminMenu[] = [
  { id: 'm1', name: 'Trattoria Romana', language: 'Italian', itemCount: 42, status: 'active', views: 1284, updatedAt: '2026-05-30' },
  { id: 'm2', name: 'Sakura Sushi', language: 'Japanese', itemCount: 28, status: 'active', views: 932, updatedAt: '2026-06-01' },
  { id: 'm3', name: 'Le Bistro', language: 'French', itemCount: 35, status: 'draft', views: 0, updatedAt: '2026-06-04' },
  { id: 'm4', name: 'Taco Loco', language: 'Spanish', itemCount: 19, status: 'active', views: 612, updatedAt: '2026-05-28' },
  { id: 'm5', name: 'Old Sichuan', language: 'Chinese', itemCount: 56, status: 'archived', views: 2341, updatedAt: '2026-04-12' },
];

const seedUsers: AdminUser[] = [
  { id: 'u1', name: 'Alex Chen', email: 'alex@menukits.eu', role: 'owner', status: 'active', lastActive: '2 min ago' },
  { id: 'u2', name: 'Maria Rossi', email: 'maria@trattoria.eu', role: 'admin', status: 'active', lastActive: '1 hour ago' },
  { id: 'u3', name: 'Lukas Weber', email: 'lukas@bistro.de', role: 'editor', status: 'active', lastActive: '3 hours ago' },
  { id: 'u4', name: 'Sofia Park', email: 'sofia@sakura.jp', role: 'editor', status: 'invited', lastActive: 'Never' },
  { id: 'u5', name: 'Diego Hernández', email: 'diego@taco.mx', role: 'viewer', status: 'active', lastActive: 'yesterday' },
  { id: 'u6', name: 'Aisha Khan', email: 'aisha@oldsichuan.cn', role: 'admin', status: 'suspended', lastActive: '3 days ago' },
];

const seedActivity: ActivityEntry[] = [
  { id: 'a1', type: 'menu.publish', message: 'Published menu "Trattoria Romana"', actor: 'Alex Chen', at: '2026-06-08T09:32:00Z' },
  { id: 'a2', type: 'user.invite', message: 'Invited sofia@sakura.jp as Editor', actor: 'Alex Chen', at: '2026-06-08T09:15:00Z' },
  { id: 'a3', type: 'api.test', message: 'Tested Mistral Vision — OK (1.4s)', actor: 'system', at: '2026-06-08T08:50:00Z' },
  { id: 'a4', type: 'menu.update', message: 'Updated prices on "Sakura Sushi"', actor: 'Maria Rossi', at: '2026-06-08T08:14:00Z' },
  { id: 'a5', type: 'settings.update', message: 'Changed default recognition provider to Mistral', actor: 'Alex Chen', at: '2026-06-07T22:01:00Z' },
  { id: 'a6', type: 'login', message: 'New login from Chrome on macOS', actor: 'Lukas Weber', at: '2026-06-07T18:45:00Z' },
];

// --- Public API ---
export const adminStore = {
  // menus
  getMenus(): AdminMenu[] {
    let items = read<AdminMenu[] | null>(KEYS.menus, null);
    if (!items) {
      write(KEYS.menus, seedMenus);
      items = seedMenus;
    }
    return items;
  },
  saveMenus(menus: AdminMenu[]) {
    write(KEYS.menus, menus);
  },

  // users
  getUsers(): AdminUser[] {
    let items = read<AdminUser[] | null>(KEYS.users, null);
    if (!items) {
      write(KEYS.users, seedUsers);
      items = seedUsers;
    }
    return items;
  },
  saveUsers(users: AdminUser[]) {
    write(KEYS.users, users);
  },

  // api keys
  getApiKeys(): ApiKeyEntry[] {
    const items = read<ApiKeyEntry[]>(KEYS.apiKeys, []);
    return items;
  },
  saveApiKeys(keys: ApiKeyEntry[]) {
    write(KEYS.apiKeys, keys);
  },

  // custom api connections
  getConnections(): CustomApiConnection[] {
    const items = read<CustomApiConnection[]>(KEYS.connections, []);
    return items;
  },
  saveConnections(conns: CustomApiConnection[]) {
    write(KEYS.connections, conns);
  },

  // activity
  getActivity(): ActivityEntry[] {
    let items = read<ActivityEntry[] | null>(KEYS.activity, null);
    if (!items) {
      write(KEYS.activity, seedActivity);
      items = seedActivity;
    }
    return items;
  },
  pushActivity(entry: Omit<ActivityEntry, 'id' | 'at'>) {
    const all = this.getActivity();
    const next: ActivityEntry = {
      ...entry,
      id: `a${Date.now()}`,
      at: new Date().toISOString(),
    };
    write(KEYS.activity, [next, ...all].slice(0, 50));
  },
};
