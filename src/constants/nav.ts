export const NAV_GROUPS = {
  ACADEMICS: "academics",
  FINANCE: "finance",
  ADMIN: "admin",
} as const;

export type NavGroup = (typeof NAV_GROUPS)[keyof typeof NAV_GROUPS];

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  [NAV_GROUPS.ACADEMICS]: "Academics",
  [NAV_GROUPS.FINANCE]: "Finance",
  [NAV_GROUPS.ADMIN]: "Administration",
};

export const NAV_GROUP_ORDER: readonly NavGroup[] = [
  NAV_GROUPS.ACADEMICS,
  NAV_GROUPS.FINANCE,
  NAV_GROUPS.ADMIN,
];
