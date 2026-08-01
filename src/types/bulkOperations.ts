/**
 * Bulk Import/Export Types
 * Domain types for CSV import/export operations
 */

export interface CsvRow {
  [key: string]: string | number | boolean | null;
}

export interface EmployeeCsvRow {
  // Personal
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'male' | 'female';
  nationality: string;
  maritalStatus: 'single' | 'married' | 'divorced';
  dependents: number;
  
  // Employment
  department: string;
  designation: string;
  grade?: string;
  costCenter?: string;
  officeId: string;
  contractType: 'limited' | 'unlimited';
  startDate: string; // YYYY-MM-DD
  probationEndDate?: string; // YYYY-MM-DD
  managerId?: string;
  
  // Payroll
  basicSalary: number;
  hraAmount?: number;
  hraPercentage?: number;
  transportation?: number;
  mobile?: number;
  utilities?: number;
  otherAllowancesJson?: string; // JSON string of allowances array
  overtimeRate?: number;
  currency: string; // AED, SAR, etc.
  
  // Banking
  bankName: string;
  branch?: string;
  iban: string;
  swiftCode?: string;
  accountNumber: string;
  routingCode?: string;
  
  // Compliance
  emiratesId?: string;
  passportNumber?: string;
  passportExpiry?: string; // YYYY-MM-DD
  visaStatus?: string;
  labourCardNumber?: string;
  gosiNumber?: string;
  
  // User Account
  email: string;
  phoneNumber?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: ValidationError[];
  employeeIds: string[]; // Successfully created employee IDs
}

export interface ExportOptions {
  filters?: {
    status?: 'active' | 'inactive' | 'terminated';
    department?: string;
    officeId?: string;
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
  };
  columns?: string[]; // Specific columns to export (all if empty)
  format: 'csv' | 'xlsx'; // For future Excel support
  includeHeaders: boolean;
}

export interface ParsedCsvData {
  headers: string[];
  rows: EmployeeCsvRow[];
  errors: ValidationError[];
}

export interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'idle' | 'parsing' | 'validating' | 'uploading' | 'complete' | 'error';
}
