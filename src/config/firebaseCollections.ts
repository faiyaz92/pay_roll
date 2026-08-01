// Centralized Firestore collection names aligned with Database-Info-v1.md
// Sections referenced per collection to avoid accidental naming drift.

export const FIREBASE_COLLECTIONS = {
  // Section 1 - Architecture Collections
  systemConfig: 'system_config',
  userPreferences: 'user_preferences',

  // Section 2 - User Management
  users: 'users',
  userSessions: 'user_sessions',
  userRoles: 'user_roles',

  // Section 3 - Employee Master Data
  employees: 'employees',
  employeeDocuments: 'employee_documents',
  employeeHistory: 'employee_history',

  // Section 4 - Office Management
  offices: 'offices',
  officeHierarchy: 'office_hierarchy',
  employeeOfficeAssignments: 'employee_office_assignments',

  // Section 5 - Mobile & Geo-fencing
  mobileSessions: 'mobile_sessions',
  locationLogs: 'location_logs',
  deviceTokens: 'device_tokens',

  // Section 6 - Attendance Tracking
  attendanceRecords: 'attendance_records',
  attendanceHistory: 'attendance_history',
  overtimeLogs: 'overtime_logs',

  // Section 7 - Leave Management
  leaveRequests: 'leave_requests',
  leaveBalances: 'leave_balances',
  leavePolicies: 'leave_policies',
  leaveHistory: 'leave_history',

  // Section 8 - Payroll Calculation
  payrollCycles: 'payroll_cycles',
  payrollComponents: 'payroll_components',
  taxCalculations: 'tax_calculations',
  gratuityRecords: 'gratuity_records',

  // Section 9 - WPS File Generation
  wpsBatches: 'wps_batches',
  wpsSubmissions: 'wps_submissions',
  wpsAmendments: 'wps_amendments',

  // Section 10 - Salary Slip & Documents
  salarySlips: 'salary_slips',
  documentMetadata: 'document_metadata',

  // Section 11 - Reporting & Analytics
  reports: 'reports',
  auditLogs: 'audit_logs',

  // Section 12 - Localization & Internationalization
  translations: 'translations',

  // Section 14 & 15 - System / Compliance
  complianceLogs: 'compliance_logs',
  regulatoryReports: 'regulatory_reports'
} as const;

export type FirebaseCollectionKey = keyof typeof FIREBASE_COLLECTIONS;

export const getCollectionName = (key: FirebaseCollectionKey) => FIREBASE_COLLECTIONS[key];
