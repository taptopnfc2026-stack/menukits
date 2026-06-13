type MenuRow = {
  id?: string;
  name?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
  settings?: unknown;
  data?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function pickPayload(row: MenuRow): Record<string, unknown> {
  if (isObject(row.settings) && Array.isArray(row.settings.sections)) return row.settings;
  if (isObject(row.data) && Array.isArray(row.data.sections)) return row.data;
  if (isObject(row.settings)) return row.settings;
  if (isObject(row.data)) return row.data;
  return {};
}

/** Transform Supabase menu rows into the frontend Menu shape. */
export function dbRowToMenu(row: MenuRow): Menu {
  const payload = pickPayload(row);
  const createdAt = row.created_at || (typeof payload.createdAt === 'string' ? payload.createdAt : '');
  const updatedAt = row.updated_at || (typeof payload.updatedAt === 'string' ? payload.updatedAt : createdAt);
  const title = typeof payload.title === 'string' && payload.title.trim()
    ? payload.title
    : row.name || 'Untitled';

  return {
    ...payload,
    id: row.id || (typeof payload.id === 'string' ? payload.id : ''),
    title,
    sections: Array.isArray(payload.sections) ? payload.sections : [],
    isVisible: row.is_public ?? (typeof payload.isVisible === 'boolean' ? payload.isVisible : true),
    createdAt,
    updatedAt,
  } as Menu;
}
import type { Menu } from '../types';
