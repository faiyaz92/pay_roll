/**
 * CSV Utilities
 * Utilities for parsing, validating, and converting CSV data
 */

import type { EmployeeCsvRow, ValidationError, ParsedCsvData } from '@/types/bulkOperations';
import type { EmployeeInput } from '@/types/employee';

/**
 * Parse CSV text into structured data
 */
export function parseCsv(csvText: string): ParsedCsvData {
  const lines = csvText.trim().split('\n');
  const errors: ValidationError[] = [];
  
  if (lines.length < 2) {
    errors.push({
      row: 0,
      field: 'file',
      value: null,
      message: 'CSV file must contain at least a header row and one data row',
    });
    return { headers: [], rows: [], errors };
  }
  
  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Parse data rows
  const rows: EmployeeCsvRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = parseCsvLine(line);
    
    if (values.length !== headers.length) {
      errors.push({
        row: i + 1,
        field: 'row',
        value: line,
        message: `Row has ${values.length} columns but expected ${headers.length}`,
      });
      continue;
    }
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    rows.push(row as EmployeeCsvRow);
  }
  
  return { headers, rows, errors };
}

/**
 * Parse a single CSV line handling quoted values with commas
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  values.push(currentValue.trim());
  return values;
}

/**
 * Validate CSV row data
 */
export function validateCsvRow(row: EmployeeCsvRow, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Required fields validation
  const requiredFields = [
    'firstName', 'lastName', 'dateOfBirth', 'gender', 'nationality',
    'department', 'designation', 'officeId', 'contractType', 'startDate',
    'basicSalary', 'currency', 'bankName', 'iban', 'accountNumber', 'email'
  ];
  
  requiredFields.forEach(field => {
    if (!row[field as keyof EmployeeCsvRow]) {
      errors.push({
        row: rowNumber,
        field,
        value: row[field as keyof EmployeeCsvRow],
        message: `${field} is required`,
      });
    }
  });
  
  // Email validation
  if (row.email && !isValidEmail(row.email)) {
    errors.push({
      row: rowNumber,
      field: 'email',
      value: row.email,
      message: 'Invalid email format',
    });
  }
  
  // Date validation
  const dateFields = ['dateOfBirth', 'startDate', 'probationEndDate', 'passportExpiry'];
  dateFields.forEach(field => {
    const value = row[field as keyof EmployeeCsvRow] as string;
    if (value && !isValidDate(value)) {
      errors.push({
        row: rowNumber,
        field,
        value,
        message: `${field} must be in YYYY-MM-DD format`,
      });
    }
  });
  
  // Number validation
  const numberFields = ['basicSalary', 'hraAmount', 'hraPercentage', 'transportation', 'mobile', 'utilities', 'overtimeRate', 'dependents'];
  numberFields.forEach(field => {
    const value = row[field as keyof EmployeeCsvRow];
    if (value !== undefined && value !== null && value !== '' && isNaN(Number(value))) {
      errors.push({
        row: rowNumber,
        field,
        value,
        message: `${field} must be a valid number`,
      });
    }
  });
  
  // Enum validation
  if (row.gender && !['male', 'female'].includes(row.gender)) {
    errors.push({
      row: rowNumber,
      field: 'gender',
      value: row.gender,
      message: 'gender must be either "male" or "female"',
    });
  }
  
  if (row.maritalStatus && !['single', 'married', 'divorced'].includes(row.maritalStatus)) {
    errors.push({
      row: rowNumber,
      field: 'maritalStatus',
      value: row.maritalStatus,
      message: 'maritalStatus must be "single", "married", or "divorced"',
    });
  }
  
  if (row.contractType && !['limited', 'unlimited'].includes(row.contractType)) {
    errors.push({
      row: rowNumber,
      field: 'contractType',
      value: row.contractType,
      message: 'contractType must be "limited" or "unlimited"',
    });
  }
  
  return errors;
}

/**
 * Convert CSV row to EmployeeInput
 */
/**
 * Convert CSV row to EmployeeInput type
 */
export function csvRowToEmployeeInput(row: EmployeeCsvRow, companyId: string): EmployeeInput {
  // Parse other allowances JSON if present
  let otherAllowances: Array<{ name: string; amount: number }> = [];
  if (row.otherAllowancesJson) {
    try {
      otherAllowances = JSON.parse(row.otherAllowancesJson);
    } catch {
      otherAllowances = [];
    }
  }
  
  return {
    personal: {
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: `${row.firstName} ${row.lastName}`,
      dateOfBirth: new Date(row.dateOfBirth),
      gender: row.gender,
      nationality: row.nationality,
      maritalStatus: row.maritalStatus || 'single',
      dependents: Number(row.dependents) || 0,
    },
    employment: {
      department: row.department,
      designation: row.designation,
      grade: row.grade || '',
      costCenter: row.costCenter || '',
      officeId: row.officeId,
      contractType: row.contractType,
      startDate: new Date(row.startDate),
      probationEndDate: row.probationEndDate ? new Date(row.probationEndDate) : undefined,
      managerId: row.managerId || '',
    },
    payroll: {
      basicSalary: Number(row.basicSalary),
      hra: {
        amount: Number(row.hraAmount) || 0,
        percentage: Number(row.hraPercentage) || 0,
      },
      transportation: Number(row.transportation) || 0,
      mobile: Number(row.mobile) || 0,
      utilities: Number(row.utilities) || 0,
      otherAllowances,
      overtimeRate: Number(row.overtimeRate) || 0,
      currency: row.currency,
    },
    banking: {
      bankName: row.bankName,
      branch: row.branch || '',
      iban: row.iban,
      swiftCode: row.swiftCode || '',
      accountNumber: row.accountNumber,
      routingCode: row.routingCode || '',
    },
    compliance: {
      emiratesId: row.emiratesId || '',
      passportNumber: row.passportNumber || '',
      passportExpiry: row.passportExpiry ? new Date(row.passportExpiry) : undefined,
      visaStatus: row.visaStatus || '',
      labourCardNumber: row.labourCardNumber || '',
      gosiNumber: row.gosiNumber || '',
    },
    email: row.email,
    phoneNumber: row.phoneNumber || '',
    status: 'active',
  };
}

/**
 * Convert employee data to CSV format
 */
export function employeesToCsv(employees: any[]): string {
  if (employees.length === 0) return '';
  
  const headers = [
    'firstName', 'lastName', 'dateOfBirth', 'gender', 'nationality', 'maritalStatus', 'dependents',
    'department', 'designation', 'grade', 'costCenter', 'officeId', 'contractType', 'startDate', 'probationEndDate', 'managerId',
    'basicSalary', 'hraAmount', 'hraPercentage', 'transportation', 'mobile', 'utilities', 'otherAllowancesJson', 'overtimeRate', 'currency',
    'bankName', 'branch', 'iban', 'swiftCode', 'accountNumber', 'routingCode',
    'emiratesId', 'passportNumber', 'passportExpiry', 'visaStatus', 'labourCardNumber', 'gosiNumber',
    'email', 'phoneNumber'
  ];
  
  const rows = employees.map(emp => {
    const row: any = {};
    
    // Personal
    row.firstName = emp.personal?.firstName || '';
    row.lastName = emp.personal?.lastName || '';
    row.dateOfBirth = emp.personal?.dateOfBirth ? formatDate(emp.personal.dateOfBirth) : '';
    row.gender = emp.personal?.gender || '';
    row.nationality = emp.personal?.nationality || '';
    row.maritalStatus = emp.personal?.maritalStatus || '';
    row.dependents = emp.personal?.dependents || 0;
    
    // Employment
    row.department = emp.employment?.department || '';
    row.designation = emp.employment?.designation || '';
    row.grade = emp.employment?.grade || '';
    row.costCenter = emp.employment?.costCenter || '';
    row.officeId = emp.employment?.officeId || '';
    row.contractType = emp.employment?.contractType || '';
    row.startDate = emp.employment?.startDate ? formatDate(emp.employment.startDate) : '';
    row.probationEndDate = emp.employment?.probationEndDate ? formatDate(emp.employment.probationEndDate) : '';
    row.managerId = emp.employment?.managerId || '';
    
    // Payroll
    row.basicSalary = emp.payroll?.basicSalary || 0;
    row.hraAmount = emp.payroll?.hra?.amount || 0;
    row.hraPercentage = emp.payroll?.hra?.percentage || 0;
    row.transportation = emp.payroll?.transportation || 0;
    row.mobile = emp.payroll?.mobile || 0;
    row.utilities = emp.payroll?.utilities || 0;
    row.otherAllowancesJson = emp.payroll?.otherAllowances ? JSON.stringify(emp.payroll.otherAllowances) : '';
    row.overtimeRate = emp.payroll?.overtimeRate || 0;
    row.currency = emp.payroll?.currency || '';
    
    // Banking
    row.bankName = emp.banking?.bankName || '';
    row.branch = emp.banking?.branch || '';
    row.iban = emp.banking?.iban || '';
    row.swiftCode = emp.banking?.swiftCode || '';
    row.accountNumber = emp.banking?.accountNumber || '';
    row.routingCode = emp.banking?.routingCode || '';
    
    // Compliance
    row.emiratesId = emp.compliance?.emiratesId || '';
    row.passportNumber = emp.compliance?.passportNumber || '';
    row.passportExpiry = emp.compliance?.passportExpiry ? formatDate(emp.compliance.passportExpiry) : '';
    row.visaStatus = emp.compliance?.visaStatus || '';
    row.labourCardNumber = emp.compliance?.labourCardNumber || '';
    row.gosiNumber = emp.compliance?.gosiNumber || '';
    
    // User
    row.email = emp.email || '';
    row.phoneNumber = emp.phoneNumber || '';
    
    return row;
  });
  
  const csvLines = [headers.join(',')];
  
  rows.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  });
  
  return csvLines.join('\n');
}

/**
 * Generate CSV template with sample data
 */
export function generateCsvTemplate(): string {
  const headers = [
    'firstName', 'lastName', 'dateOfBirth', 'gender', 'nationality', 'maritalStatus', 'dependents',
    'department', 'designation', 'grade', 'costCenter', 'officeId', 'contractType', 'startDate', 'probationEndDate', 'managerId',
    'basicSalary', 'hraAmount', 'hraPercentage', 'transportation', 'mobile', 'utilities', 'otherAllowancesJson', 'overtimeRate', 'currency',
    'bankName', 'branch', 'iban', 'swiftCode', 'accountNumber', 'routingCode',
    'emiratesId', 'passportNumber', 'passportExpiry', 'visaStatus', 'labourCardNumber', 'gosiNumber',
    'email', 'phoneNumber'
  ];
  
  const sampleRow = [
    'Ahmed', 'Ali', '1990-01-15', 'male', 'UAE', 'married', '2',
    'IT', 'Software Engineer', 'Senior', 'IT-001', 'office-001', 'unlimited', '2024-01-01', '2024-04-01', '',
    '15000', '3000', '20', '1500', '500', '300', '[{"name":"Housing","amount":2000}]', '50', 'AED',
    'Emirates NBD', 'Dubai Main', 'AE070331234567890123456', 'EBILAEAD', '1234567890', '',
    '784-1990-1234567-8', 'P12345678', '2030-12-31', 'Valid', 'LC123456', 'GOSI123456',
    'ahmed.ali@example.com', '+971501234567'
  ];
  
  return [headers.join(','), sampleRow.join(',')].join('\n');
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function formatDate(date: Date | any): string {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  if (date?.toDate && typeof date.toDate === 'function') {
    return date.toDate().toISOString().split('T')[0];
  }
  return '';
}
