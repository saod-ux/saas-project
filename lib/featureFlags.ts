export const flags = {
  revenueDashboard: true,
  inventoryAlerts: true,
  quickActions: true,
  orderManagement: true,
} as const;

export type FeatureFlag = keyof typeof flags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return flags[flag];
}


