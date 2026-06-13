type MenuIdentity = {
  id?: string;
};

export function isCloudMenuId(id: string | undefined): id is string {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function getDeletedCloudMenuIds(previousCloudIds: Iterable<string>, currentMenus: MenuIdentity[]): string[] {
  const currentCloudIds = new Set(
    currentMenus
      .map((menu) => menu.id)
      .filter(isCloudMenuId)
  );

  return Array.from(previousCloudIds).filter((id) => isCloudMenuId(id) && !currentCloudIds.has(id));
}
