/**
 * Bulk Operations Use Cases
 * Business logic for CSV import/export of employee data
 */

import { db, auth } from '@/config/firebase';
import { collection, doc, addDoc, getDocs, query, where, Timestamp, writeBatch } from 'firebase/firestore';
import type { ImportResult, ExportOptions, ParsedCsvData, ValidationError } from '@/types/bulkOperations';
import type { EmployeeInput } from '@/types/employee';
import { parseCsv, validateCsvRow, csvRowToEmployeeInput, employeesToCsv } from '@/lib/csvUtils';
import { createEmployee } from './employeeUseCases';

/**
 * Import employees from CSV file
 */
export async function importEmployeesFromCsv(
  file: File,
  companyId: string
): Promise<ImportResult> {
  try {
    // Read file content
    const text = await file.text();
    
    // Parse CSV
    const { rows, errors: parseErrors } = parseCsv(text);
    
    // Validate all rows
    const validationErrors: ValidationError[] = [...parseErrors];
    rows.forEach((row, index) => {
      const rowErrors = validateCsvRow(row, index + 2); // +2 because index 0 is headers and we start at 1
      validationErrors.push(...rowErrors);
    });
    
    // Stop if there are validation errors
    if (validationErrors.length > 0) {
      return {
        total: rows.length,
        successful: 0,
        failed: rows.length,
        errors: validationErrors,
        employeeIds: [],
      };
    }
    
    // Convert rows to EmployeeInput and create employees
    const employeeIds: string[] = [];
    const importErrors: ValidationError[] = [];
    let successful = 0;
    
    for (let i = 0; i < rows.length; i++) {
      try {
        const employeeInput = csvRowToEmployeeInput(rows[i], companyId);
        const employeeId = await createEmployee(companyId, 'bulk-import', employeeInput, 'bulk-import');
        employeeIds.push(employeeId);
        successful++;
      } catch (error: any) {
        importErrors.push({
          row: i + 2,
          field: 'employee',
          value: rows[i].email,
          message: error.message || 'Failed to create employee',
        });
      }
    }
    
    return {
      total: rows.length,
      successful,
      failed: rows.length - successful,
      errors: importErrors,
      employeeIds,
    };
  } catch (error: any) {
    throw new Error(`Import failed: ${error.message}`);
  }
}

/**
 * Export employees to CSV
 */
export async function exportEmployeesToCsv(
  companyId: string,
  options: ExportOptions
): Promise<string> {
  try {
    // Build query
    let q = query(collection(db, 'employees'), where('companyId', '==', companyId));
    
    // Apply filters
    if (options.filters?.status) {
      q = query(q, where('status', '==', options.filters.status));
    }
    if (options.filters?.department) {
      q = query(q, where('employment.department', '==', options.filters.department));
    }
    if (options.filters?.officeId) {
      q = query(q, where('employment.officeId', '==', options.filters.officeId));
    }
    
    // Fetch employees
    const snapshot = await getDocs(q);
    const employees = snapshot.docs.map(doc => ({
      employeeId: doc.id,
      ...doc.data(),
    }));
    
    // Filter by date range if specified
    let filteredEmployees = employees;
    if (options.filters?.dateRange) {
      const { startDate, endDate } = options.filters.dateRange;
      filteredEmployees = employees.filter(emp => {
        const empStartDate = emp.employment?.startDate instanceof Date 
          ? emp.employment.startDate 
          : emp.employment?.startDate?.toDate?.() || new Date(emp.employment?.startDate);
        return empStartDate >= startDate && empStartDate <= endDate;
      });
    }
    
    // Convert to CSV
    const csv = employeesToCsv(filteredEmployees);
    
    return csv;
  } catch (error: any) {
    throw new Error(`Export failed: ${error.message}`);
  }
}

/**
 * Validate CSV file without importing
 */
export async function validateCsvFile(file: File): Promise<ParsedCsvData> {
  try {
    const text = await file.text();
    const { headers, rows, errors: parseErrors } = parseCsv(text);
    
    // Validate all rows
    const validationErrors: ValidationError[] = [...parseErrors];
    rows.forEach((row, index) => {
      const rowErrors = validateCsvRow(row, index + 2);
      validationErrors.push(...rowErrors);
    });
    
    return {
      headers,
      rows,
      errors: validationErrors,
    };
  } catch (error: any) {
    throw new Error(`Validation failed: ${error.message}`);
  }
}

/**
 * Batch update employee status
 */
export async function batchUpdateEmployeeStatus(
  employeeIds: string[],
  status: 'active' | 'inactive' | 'terminated'
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    employeeIds.forEach(employeeId => {
      const employeeRef = doc(db, 'employees', employeeId);
      batch.update(employeeRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    });
    
    await batch.commit();
  } catch (error: any) {
    throw new Error(`Batch update failed: ${error.message}`);
  }
}

/**
 * Get import statistics
 */
export async function getImportStatistics(companyId: string) {
  try {
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    
    const stats = {
      total: snapshot.size,
      active: 0,
      inactive: 0,
      terminated: 0,
      byDepartment: {} as Record<string, number>,
      byOffice: {} as Record<string, number>,
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Count by status
      if (data.status === 'active') stats.active++;
      else if (data.status === 'inactive') stats.inactive++;
      else if (data.status === 'terminated') stats.terminated++;
      
      // Count by department
      const dept = data.employment?.department || 'Unknown';
      stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
      
      // Count by office
      const office = data.employment?.officeId || 'Unknown';
      stats.byOffice[office] = (stats.byOffice[office] || 0) + 1;
    });
    
    return stats;
  } catch (error: any) {
    throw new Error(`Failed to get statistics: ${error.message}`);
  }
}
