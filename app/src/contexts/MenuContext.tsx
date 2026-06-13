import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { mockMenus } from '@/data/mockData';
import { dbRowToMenu } from '@/lib/menu-row';
import { deleteMenuFromCloud, flushPendingMenuDeletes, getPendingMenuDeleteIds, queuePendingMenuDelete } from '@/lib/menu-api';
import { getDeletedCloudMenuIds, isCloudMenuId } from '@/lib/menu-sync';
import { useAuth } from '@/contexts/AuthContext';
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

function nextCloudIdSet(currentMenus: Menu[], previousCloudIds: Iterable<string>, deletedIds: string[], remaps: Record<string, string>) {
  const next = new Set(
    currentMenus
      .map((menu) => remaps[menu.id] || menu.id)
      .filter(isCloudMenuId)
  );
  const deleted = new Set(deletedIds);

  for (const id of previousCloudIds) {
    if (isCloudMenuId(id) && !next.has(id) && !deleted.has(id)) {
      next.add(id);
    }
  }

  return next;
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const { token: authToken, isLoading: isAuthLoading } = useAuth();
  // Authenticated users start with empty state; only fall back to localStorage for offline mode
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);
  const hasLoadedFromCloud = useRef(false);
  const skipNextAutoSave = useRef(false);
  const cloudMenuIds = useRef<Set<string>>(new Set());

  // ─── Load menus from cloud on mount ────────────────
  useEffect(() => {
    async function loadMenus() {
      if (isAuthLoading) return;
      try {
        if (!authToken) {
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
          headers: { Authorization: `Bearer ${authToken}` },
        });
        
        hasLoadedFromCloud.current = true;

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const flushedIds = await flushPendingMenuDeletes(authToken);
            const pendingIds = new Set(getPendingMenuDeleteIds());
            const hiddenIds = new Set([...flushedIds, ...pendingIds]);
            const visibleRows = rows.filter((row: { id?: string }) => !hiddenIds.has(row?.id || ''));
            const mapped = visibleRows.map(dbRowToMenu);
            cloudMenuIds.current = new Set(rows.map((row: { id?: string }) => row?.id).filter(isCloudMenuId));
            skipNextAutoSave.current = true;
            setMenus(mapped);
            saveToStorage(mapped); // keep localStorage as cache
          } else {
            // New user — genuinely empty
            cloudMenuIds.current = new Set();
            skipNextAutoSave.current = true;
            setMenus([]);
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
          }
        } else {
          // API error — for logged-in users, show empty rather than stale cache
          console.warn('Failed to load menus from cloud:', res.status);
          cloudMenuIds.current = new Set();
          skipNextAutoSave.current = true;
          setMenus([]);
        }
      } catch (e) {
        // Network error — for logged-in users, show empty rather than stale cache
        console.warn('Network error loading menus:', e);
        cloudMenuIds.current = new Set();
        skipNextAutoSave.current = true;
        setMenus([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenus();
  }, [authToken, isAuthLoading]);

  // ─── Auto-save to cloud on every change ───────────
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // skip on initial load from cloud
    }

    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }

    // Always update localStorage as fast cache
    saveToStorage(menus);

    if (!hasLoadedFromCloud.current) return;

    // Debounced cloud save — returns ID remaps for newly created menus
    const timer = setTimeout(async () => {
      const result = await saveMenusToCloud(menus, authToken, cloudMenuIds.current);
      if (!result) return;

      const remaps = result.remaps;
      cloudMenuIds.current = nextCloudIdSet(menus, cloudMenuIds.current, result.deletedIds, remaps);

      if (Object.keys(remaps).length > 0) {
        skipNextAutoSave.current = true;
        setMenus((prev) =>
          prev.map((m) => (remaps[m.id] ? { ...m, id: remaps[m.id] } : m))
        );
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [menus, authToken]);

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
    const result = await saveMenusToCloud(menus, authToken, cloudMenuIds.current);
    if (!result) return;

    const remaps = result.remaps;
    cloudMenuIds.current = nextCloudIdSet(menus, cloudMenuIds.current, result.deletedIds, remaps);

    if (Object.keys(remaps).length > 0) {
      skipNextAutoSave.current = true;
      setMenus((prev) =>
        prev.map((m) => (remaps[m.id] ? { ...m, id: remaps[m.id] } : m))
      );
    }
  }, [menus, authToken]);

  return (
    <MenuContext.Provider value={{ menus, setMenus, getMenuById, updateMenu, isLoading, saveToCloud }}>
      {children}
    </MenuContext.Provider>
  );
}

// ─── Cloud sync helper ─────────────────────────────────

type MenuSyncResult = {
  remaps: Record<string, string>;
  deletedIds: string[];
};

/** Save all menus to cloud and remove cloud menus that disappeared locally. */
async function saveMenusToCloud(menus: Menu[], authToken: string | null, previousCloudIds: Iterable<string> = []): Promise<MenuSyncResult | null> {
  try {
    if (!authToken) return null;

    const remaps: Record<string, string> = {};
    const deletedIds: string[] = [];

    for (const menuId of getDeletedCloudMenuIds(previousCloudIds, menus)) {
      try {
        await deleteMenuFromCloud(menuId, authToken);
        deletedIds.push(menuId);
      } catch (error) {
        queuePendingMenuDelete(menuId);
        console.error(`[Sync] Failed to delete removed menu ${menuId}:`, error);
      }
    }

    for (const menu of menus) {
      // Heuristic: numeric/timestamp IDs are local-only — go straight to POST
      const isLocalId = !isCloudMenuId(menu.id);

      let res: Response;
      if (!isLocalId) {
        // Try UPDATE for menus that likely exist in DB
        res = await fetch(`/api/menus?id=${encodeURIComponent(menu.id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(menu),
        });

        // If PUT succeeded, continue to next menu
        if (res.ok) continue;

        // Only fallback to POST on 404 (menu truly doesn't exist)
        // For other errors (405, 403, 500, etc.) skip to avoid creating duplicates
        if (res.status !== 404) {
          const errText = await res.text().catch(() => '');
          console.warn(`[Sync] Skipping menu ${menu.id} — PUT returned ${res.status}: ${errText}`);
          continue;
        }

        console.log(`[Sync] Menu ${menu.id} not found in DB (404), creating...`);
      }

      // CREATE new menu via POST (local-only IDs or 404 case only)
      res = await fetch('/api/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(menu),
      });

      if (res.ok) {
        try {
          const created = await res.json();
          if (created?.id && created.id !== menu.id) {
            remaps[menu.id] = created.id;
            console.log('[Sync] Menu created:', menu.id, '→', created.id);
          }
        } catch {}
      } else {
        const errText = await res.text().catch(() => '');
        console.error(`[Sync] Failed to save menu ${menu.id}:`, res.status, errText);
      }
    }

    return { remaps, deletedIds };
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
