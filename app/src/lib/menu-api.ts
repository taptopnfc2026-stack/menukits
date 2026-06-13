import { isCloudMenuId } from './menu-sync.ts';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const PENDING_MENU_DELETES_KEY = 'menukits-pending-menu-deletes';

function getStorage() {
  return globalThis.localStorage;
}

export function getPendingMenuDeleteIds(): string[] {
  try {
    const raw = getStorage().getItem(PENDING_MENU_DELETES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isCloudMenuId) : [];
  } catch {
    return [];
  }
}

export function queuePendingMenuDelete(menuId: string) {
  if (!isCloudMenuId(menuId)) return;
  try {
    const ids = new Set(getPendingMenuDeleteIds());
    ids.add(menuId);
    getStorage().setItem(PENDING_MENU_DELETES_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* Pending deletes are a best-effort recovery path. */
  }
}

export function clearPendingMenuDelete(menuId: string) {
  try {
    const ids = getPendingMenuDeleteIds().filter((id) => id !== menuId);
    if (ids.length > 0) {
      getStorage().setItem(PENDING_MENU_DELETES_KEY, JSON.stringify(ids));
    } else {
      getStorage().removeItem(PENDING_MENU_DELETES_KEY);
    }
  } catch {
    /* ignore */
  }
}

export async function deleteMenuFromCloud(menuId: string, authToken: string | null | undefined, fetcher: FetchLike = fetch) {
  if (!isCloudMenuId(menuId)) return;
  if (!authToken) throw new Error('Missing auth token');

  const res = await fetcher(`/api/menus?id=${encodeURIComponent(menuId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (res.status === 404) return;

  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(message ? `Delete failed with HTTP ${res.status}: ${message}` : `Delete failed with HTTP ${res.status}`);
  }
}

export async function flushPendingMenuDeletes(authToken: string | null | undefined, fetcher: FetchLike = fetch) {
  const ids = getPendingMenuDeleteIds();
  if (!authToken || ids.length === 0) return [];

  const deletedIds: string[] = [];
  for (const id of ids) {
    try {
      await deleteMenuFromCloud(id, authToken, fetcher);
      clearPendingMenuDelete(id);
      deletedIds.push(id);
    } catch {
      queuePendingMenuDelete(id);
    }
  }

  return deletedIds;
}
