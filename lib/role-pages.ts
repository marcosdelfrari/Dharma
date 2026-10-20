/**
 * Espelha dharma-api / apps/kunk role_pages helpers.
 */

export type RolePagesMap = Record<string, string[]>;

export function allowedPagesForRoles(
  rolePages: RolePagesMap | null | undefined,
  roles: string[] = [],
): string[] {
  if (!rolePages || typeof rolePages !== "object") return ["*"];
  const list = Array.isArray(roles) ? roles : [];
  const allowed = new Set<string>();
  let hasStar = false;
  for (const role of list) {
    const pages = rolePages[role];
    if (!pages || pages.includes("*")) {
      hasStar = true;
      break;
    }
    pages.forEach((p) => allowed.add(p));
  }
  if (hasStar || allowed.size === 0) return ["*"];
  return [...allowed];
}

type MenuSection = {
  id: string;
  label: string;
  adminOnly?: boolean;
  items: ReadonlyArray<{ id: string; label: string; path: string }>;
};

export function filterMenuSections(
  sections: MenuSection[],
  allowedPageIds: string[] | null | undefined,
): MenuSection[] {
  if (!allowedPageIds || allowedPageIds.includes("*")) return sections;
  const allow = new Set(allowedPageIds);
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.id || allow.has(item.id)),
    }))
    .filter((section) => section.items.length > 0);
}
