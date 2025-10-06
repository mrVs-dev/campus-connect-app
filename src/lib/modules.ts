
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

// This becomes the single source of truth for the default permission structure.
// Any new role added to the system will use this as a base.
export const initialPermissions = {
  Dashboard: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: false, Read: true, Update: false, Delete: false },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
    'Office Manager': { Create: false, Read: false, Update: false, Delete: false },
  },
  Students: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read: true, Update: true, Delete: false },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: true, Update: false, Delete: false },
    'Office Manager': { Create: true, Read: true, Update: true, Delete: false },
  },
  Users: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: false, Read: false, Update: false, Delete: false },
    'Head of Department': { Create: false, Read: false, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
    'Office Manager': { Create: false, Read: false, Update: false, Delete: false },
  },
  Assessments: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: false, Read: true, Update: false, Delete: false },
    'Head of Department': { Create: true, Read: true, Update: true, Delete: true },
    Teacher: { Create: true, Read: true, Update: true, Delete: false },
    'Office Manager': { Create: false, Read: false, Update: false, Delete: false },
  },
   Fees: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read: true, Update: true, Delete: true },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
    'Office Manager': { Create: true, Read: true, Update: true, Delete: true },
  },
  Invoicing: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read: true, Update: true, Delete: true },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
    'Office Manager': { Create: true, Read: true, Update: true, Delete: true },
  },
  Inventory: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read: true, Update: true, Delete: false },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
    'Office Manager': { Create: false, Read: false, Update: false, Delete: false },
  },
  Admissions: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read:true, Update: true, Delete: false },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: true, Update: false, Delete: false },
    'Office Manager': { Create: false, Read: true, Update: false, Delete: false },
  },
  Enrollment: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read: true, Update: true, Delete: true },
    'Head of Department': { Create: false, Read: false, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
    'Office Manager': { Create: false, Read: false, Update: false, Delete: false },
  },
  'Status History': {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: false, Read: true, Update: false, Delete: false },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
    'Office Manager': { Create: false, Read: false, Update: false, Delete: false },
  },
  Settings: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: false, Read: false, Update: false, Delete: false },
    'Head of Department': { Create: false, Read: false, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
    'Office Manager': { Create: false, Read: false, Update: false, Delete: false },
  },
};
