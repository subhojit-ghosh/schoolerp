export const NAV_GROUPS = {
  CORE: "core",
  ACADEMICS: "academics",
  OPERATIONS: "operations",
  FINANCE: "finance",
  COMMUNICATION: "communication",
  ADMIN: "admin",
} as const;

export type NavGroup = (typeof NAV_GROUPS)[keyof typeof NAV_GROUPS];

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  [NAV_GROUPS.CORE]: "Core",
  [NAV_GROUPS.ACADEMICS]: "Academics",
  [NAV_GROUPS.OPERATIONS]: "Operations",
  [NAV_GROUPS.FINANCE]: "Finance",
  [NAV_GROUPS.COMMUNICATION]: "Communication",
  [NAV_GROUPS.ADMIN]: "Administration",
};

export const NAV_GROUP_ORDER: readonly NavGroup[] = [
  NAV_GROUPS.CORE,
  NAV_GROUPS.ACADEMICS,
  NAV_GROUPS.OPERATIONS,
  NAV_GROUPS.FINANCE,
  NAV_GROUPS.COMMUNICATION,
  NAV_GROUPS.ADMIN,
];
