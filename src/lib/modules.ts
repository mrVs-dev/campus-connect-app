
export const APP_MODULES = [
  'Dashboard',
  'Students',
  'Users',
  'Assessments',
  'Fees',
  'Invoicing',
  'Inventory',
  'Admissions',
  'Enrollment',
  'Status History',
  'Settings',
] as const;

export type AppModule = (typeof APP_MODULES)[number];
