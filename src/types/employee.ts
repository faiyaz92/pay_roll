/**
 * Employee Domain Entity Types
 * Based on Database-Info-v1.md Section 3 - Employee Collections
 * Supports GCC Payroll Requirements per BRD Section 4.2
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Personal Information
 */
export interface EmployeePersonal {
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  nationality: string;
  maritalStatus: 'single' | 'married' | 'divorced';
  dependents: number;
}

/**
 * Employment Information
 */
export interface EmployeeEmployment {
  department: string;
  designation: string;
  grade: string;
  costCenter: string;
  officeId: string;
  contractType: 'limited' | 'unlimited';
  startDate: Date;
  probationEndDate: Date;
  managerId?: string;
}

/**
 * Payroll Components
 */
export interface EmployeePayroll {
  basicSalary: number;
  hra: {
    amount: number;
    percentage: number;
  };
  transportation: number;
  mobile: number;
  utilities: number;
  otherAllowances: Array<{
    name: string;
    amount: number;
  }>;
  overtimeRate: number;
  currency: string; // Default: AED
}

/**
 * Banking Information
 */
export interface EmployeeBanking {
  bankName: string;
  branch: string;
  iban: string;
  swiftCode: string;
  accountNumber: string;
  routingCode: string;
}

/**
 * Compliance & Legal Documents
 */
export interface EmployeeCompliance {
  emiratesId: string;
  passportNumber: string;
  passportExpiry: Date;
  visaStatus: string;
  labourCardNumber: string;
  gosiNumber: string;
}

/**
 * Gratuity Information
 */
export interface EmployeeGratuity {
  eligibilityYears: number;
  startDate: Date;
  status: 'eligible' | 'not_eligible';
}

/**
 * Complete Employee Entity
 * Collection: /employees
 */
export interface Employee {
  employeeId: string;
  userId: string;
  companyId: string;
  personal: EmployeePersonal;
  employment: EmployeeEmployment;
  payroll: EmployeePayroll;
  banking: EmployeeBanking;
  compliance: EmployeeCompliance;
  gratuity: EmployeeGratuity;
  status: 'active' | 'inactive' | 'terminated';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Employee Document
 * Collection: /employee_documents
 */
export interface EmployeeDocument {
  employeeId: string;
  documentType: 'passport' | 'visa' | 'contract' | 'certificate';
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  expiryDate?: Date;
  status: 'valid' | 'expired';
}

/**
 * Employee History
 * Collection: /employee_history
 */
export interface EmployeeHistory {
  employeeId: string;
  changeType: 'promotion' | 'transfer' | 'salary_change';
  oldValue: Record<string, any>;
  newValue: Record<string, any>;
  changedBy: string;
  changedAt: Timestamp;
  effectiveDate: Date;
}

/**
 * Employee Create/Update Input (without auto-generated fields)
 */
export interface EmployeeInput {
  personal: EmployeePersonal;
  employment: EmployeeEmployment;
  payroll: EmployeePayroll;
  banking: EmployeeBanking;
  compliance: EmployeeCompliance;
  gratuity?: Partial<EmployeeGratuity>;
  status?: 'active' | 'inactive' | 'terminated';
}

/**
 * Employee List Item (for directory views)
 */
export interface EmployeeListItem {
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  status: 'active' | 'inactive' | 'terminated';
  startDate: Date;
}

/**
 * Employee Filter Criteria
 */
export interface EmployeeFilter {
  department?: string;
  designation?: string;
  status?: 'active' | 'inactive' | 'terminated';
  officeId?: string;
  searchTerm?: string;
}
