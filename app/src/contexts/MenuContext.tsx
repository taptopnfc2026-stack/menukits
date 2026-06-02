import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockMenus } from '@/data/mockData';
import type { Menu } from '@/types';

const STORAGE_KEY = 'menukits-menus';

interface MenuContextType {
  menus: Menu[];
  setMenus: React.Dispatch<React.SetStateAction<Menu[]>>;
  getMenuById: (id: string) => Menu | undefined;
  updateMenu: (id: string, updater: (menu: Menu) => Menu) => void;
}

const MenuContext = createContext<MenuContextType | null>(null);

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

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menus, setMenus] = useState<Menu[]>(() => loadFromStorage() || mockMenus);

  // Persist to localStorage on every change
  useEffect(() => {
    saveToStorage(menus);
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

  return (
    <MenuContext.Provider value={{ menus, setMenus, getMenuById, updateMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenuContext() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenuContext must be used within MenuProvider');
  return ctx;
}
