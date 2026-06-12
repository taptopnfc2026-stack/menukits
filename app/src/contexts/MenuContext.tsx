import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { mockMenus } from '@/data/mockData';
import { supabase, getSession } from '@/lib/supabase';
import type { Menu } from '@/types';

interface MenuContextType {
  menus: Menu[];
  setMenus: React.Dispatch<React.SetStateAction<Menu[]>>;
  getMenuById: (id: string) => Menu | undefined;
  updateMenu: (id: string, updater: (menu: Menu) => Menu) => void;
  isLoading: boolean;
  saveToCloud: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | null>(null);

// LocalStorage fallback key (for offline / degraded mode)
const STORAGE_KEY = 'menukits-menus';

function loadFromStorage(): Menu[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(menus: Menu[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(menus));
  } catch {}
}

/** Transform DB row → frontend Menu shape */
function dbRowToMenu(row: any): Menu {
  // If row.data has the full menu object, prefer it
  if (row?.data && typeof row.data === 'object') {
    return {
      ...row.data,
      id: row.id,
      title: row.data.title || row.name || '',
      isVisible: row.is_public ?? true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  // Fallback: construct from flat columns
  return {
    id: row.id,
    title: row.name || 'Untitled',
    sections: [],
    isVisible: row.is_public ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  // Authenticated users start with empty state; only fall back to localStorage for offline mode
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);
  const hasLoadedFromCloud = useRef(false);

  // ─── Load menus from cloud on mount ────────────────
  useEffect(() => {
    async function loadMenus() {
      try {
        const session = await getSession();
        if (!session?.access_token) {
          // Not logged in — try localStorage fallback for demo/offline
          const cached = loadFromStorage();
          if (cached && cached.length > 0) {
            setMenus(cached);
          }
          setIsLoading(false);
          return;
        }

        // Logged-in user — always fetch from cloud, never show stale local data
        const res = await fetch('/api/menus', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        
        hasLoadedFromCloud.current = true;

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const mapped = rows.map(dbRowToMenu);
            setMenus(mapped);
            saveToStorage(mapped); // keep localStorage as cache
          } else {
            // New user — genuinely empty
            setMenus([]);
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
          }
        } else {
          // API error — for logged-in users, show empty rather than stale cache
          console.warn('Failed to load menus from cloud:', res.status);
          setMenus([]);
        }
      } catch (e) {
        // Network error — for logged-in users, show empty rather than stale cache
        console.warn('Network error loading menus:', e);
        setMenus([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenus();
  }, []);

  // ─── Auto-save to cloud on every change ───────────
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // skip on initial load from cloud
    }

    // Always update localStorage as fast cache
    saveToStorage(menus);

    // Debounced cloud save — returns ID remaps for newly created menus
    const timer = setTimeout(async () => {
      const remaps = await saveMenusToCloud(menus);
      if (remaps && Object.keys(remaps).length > 0) {
        setMenus((prev) =>
          prev.map((m) => (remaps[m.id] ? { ...m, id: remaps[m.id] } : m))
        );
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [menus]);

  const getMenuById = useCallback((id: string) => menus.find((m) => m.id === id), [menus]);

  const updateMenu = useCallback(
    (id: string, updater: (menu: Menu) => Menu) => {
      setMenus((prev) =>
        prev.map((m) => (m.id === id ? updater(m) : m))
      );
    },
    []
  );

  /** Explicit save trigger for critical operations */
  const saveToCloud = useCallback(async () => {
    const remaps = await saveMenusToCloud(menus);
    if (remaps && Object.keys(remaps).length > 0) {
      setMenus((prev) =>
        prev.map((m) => (remaps[m.id] ? { ...m, id: remaps[m.id] } : m))
      );
    }
  }, [menus]);

  return (
    <MenuContext.Provider value={{ menus, setMenus, getMenuById, updateMenu, isLoading, saveToCloud }}>
      {children}
    </MenuContext.Provider>
  );
}

// ─── Cloud sync helper ─────────────────────────────────

/** Save all menus to cloud. Returns a map of oldId → newId for freshly created menus. */
async function saveMenusToCloud(menus: Menu[]): Promise<Record<string, string> | null> {
  try {
    const session = await getSession();
    if (!session?.access_token) return null;

    const remaps: Record<string, string> = {};

    for (const menu of menus) {
      // Try UPDATE first; if menu doesn't exist yet (404), CREATE it
      let res = await fetch(`/api/menus/${menu.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(menu),
      });

      // If PUT returned 404 (menu not in DB yet), create it via POST
      if (res.status === 404) {
        res = await fetch('/api/menus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(menu),
        });

        // If POST succeeded, update local ID to match DB-generated ID
        if (res.ok) {
          try {
            const created = await res.json();
            if (created?.id && created.id !== menu.id) {
              remaps[menu.id] = created.id;
              console.log('Menu created in cloud, ID updated:', menu.id, '→', created.id);
            }
          } catch {}
        }
      }

      if (!res.ok) {
        console.warn('Failed to sync menu', menu.id, res.status);
      }
    }

    return Object.keys(remaps).length > 0 ? remaps : null;
  } catch (e) {
    console.warn('Cloud sync failed:', e);
    return null;
  }
}

export function useMenuContext() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenuContext must be used within MenuProvider');
  return ctx;
}
