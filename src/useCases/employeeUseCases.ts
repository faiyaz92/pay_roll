/**
 * Employee Use Cases (Business Logic Layer)
 * Clean Architecture - Use Cases Layer
 * Implements employee CRUD operations per Technical-Doc-v1.md Section 3
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  Employee,
  EmployeeInput,
  EmployeeFilter,
  EmployeeHistory,
  EmployeeDocument,
} from '../types/employee';

/**
 * Generate unique employee ID
 */
export const generateEmployeeId = (): string => {
  return `EMP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

/**
 * Create new employee
 * @param companyId - Company ID
 * @param userId - User ID from Firebase Auth
 * @param employeeData - Employee input data
 * @param createdBy - User ID of creator (HR/Admin)
 * @returns Employee ID
 */
export const createEmployee = async (
  companyId: string,
  userId: string,
  employeeData: EmployeeInput,
  createdBy: string
): Promise<string> => {
  const employeeId = generateEmployeeId();

  const employee: Omit<Employee, 'createdAt' | 'updatedAt'> = {
    employeeId,
    userId,
    companyId,
    personal: employeeData.personal,
    employment: employeeData.employment,
    payroll: employeeData.payroll,
    banking: employeeData.banking,
    compliance: employeeData.compliance,
    gratuity: {
      eligibilityYears: employeeData.gratuity?.eligibilityYears || 1,
      startDate: employeeData.gratuity?.startDate || employeeData.employment.startDate,
      status: employeeData.gratuity?.status || 'eligible',
    },
    status: employeeData.status || 'active',
    createdBy,
  };

  await setDoc(doc(db, 'employees', employeeId), {
    ...employee,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return employeeId;
};

/**
 * Get employee by ID
 * @param employeeId - Employee ID
 * @returns Employee or null
 */
export const getEmployeeById = async (employeeId: string): Promise<Employee | null> => {
  const employeeDoc = await getDoc(doc(db, 'employees', employeeId));

  if (!employeeDoc.exists()) {
    return null;
  }

  return employeeDoc.data() as Employee;
};

/**
 * Get employee by user ID
 * @param userId - Firebase Auth user ID
 * @returns Employee or null
 */
export const getEmployeeByUserId = async (userId: string): Promise<Employee | null> => {
  const q = query(collection(db, 'employees'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  return querySnapshot.docs[0].data() as Employee;
};

/**
 * Get all employees for a company with optional filters
 * @param companyId - Company ID
 * @param filters - Optional filter criteria
 * @returns Array of employees
 */
export const getEmployees = async (
  companyId: string,
  filters?: EmployeeFilter
): Promise<Employee[]> => {
  let q = query(collection(db, 'employees'), where('companyId', '==', companyId));

  // Apply filters
  if (filters) {
    if (filters.department) {
      q = query(q, where('employment.department', '==', filters.department));
    }
    if (filters.designation) {
      q = query(q, where('employment.designation', '==', filters.designation));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.officeId) {
      q = query(q, where('employment.officeId', '==', filters.officeId));
    }
  }

  // Order by full name
  q = query(q, orderBy('personal.fullName', 'asc'));

  const querySnapshot = await getDocs(q);
  const employees: Employee[] = [];

  querySnapshot.forEach((doc) => {
    employees.push(doc.data() as Employee);
  });

  return employees;
};

export const getEmployeesByCompany = getEmployees;

/**
 * Update employee
 * @param employeeId - Employee ID
 * @param updates - Partial employee data to update
 * @param updatedBy - User ID of updater
 * @param logHistory - Whether to log the change in employee_history
 */
export const updateEmployee = async (
  employeeId: string,
  updates: Partial<EmployeeInput>,
  updatedBy: string,
  logHistory: boolean = true
): Promise<void> => {
  const employeeRef = doc(db, 'employees', employeeId);

  // Get current data for history logging
  let oldData: Employee | null = null;
  if (logHistory) {
    oldData = await getEmployeeById(employeeId);
  }

  // Update employee
  await updateDoc(employeeRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  // Log history if requested
  if (logHistory && oldData) {
    await logEmployeeHistory(
      employeeId,
      'salary_change', // You can make this dynamic based on what was updated
      oldData,
      { ...oldData, ...updates },
      updatedBy,
      new Date()
    );
  }
};

/**
 * Delete employee (soft delete by setting status to terminated)
 * @param employeeId - Employee ID
 * @param deletedBy - User ID of deleter
 */
export const deleteEmployee = async (employeeId: string, deletedBy: string): Promise<void> => {
  await updateEmployee(
    employeeId,
    { status: 'terminated' },
    deletedBy,
    true
  );
};

/**
 * Hard delete employee (permanent deletion)
 * Use with caution - only for data cleanup
 * @param employeeId - Employee ID
 */
export const hardDeleteEmployee = async (employeeId: string): Promise<void> => {
  await deleteDoc(doc(db, 'employees', employeeId));
};

/**
 * Log employee history
 * @param employeeId - Employee ID
 * @param changeType - Type of change
 * @param oldValue - Old value object
 * @param newValue - New value object
 * @param changedBy - User ID of changer
 * @param effectiveDate - Effective date of change
 */
export const logEmployeeHistory = async (
  employeeId: string,
  changeType: 'promotion' | 'transfer' | 'salary_change',
  oldValue: Record<string, any>,
  newValue: Record<string, any>,
  changedBy: string,
  effectiveDate: Date
): Promise<void> => {
  const historyId = `${employeeId}_${Date.now()}`;

  const history: Omit<EmployeeHistory, 'changedAt'> = {
    employeeId,
    changeType,
    oldValue,
    newValue,
    changedBy,
    effectiveDate,
  };

  await setDoc(doc(db, 'employee_history', historyId), {
    ...history,
    changedAt: serverTimestamp(),
  });
};

/**
 * Get employee history
 * @param employeeId - Employee ID
 * @returns Array of employee history records
 */
export const getEmployeeHistory = async (employeeId: string): Promise<EmployeeHistory[]> => {
  const q = query(
    collection(db, 'employee_history'),
    where('employeeId', '==', employeeId),
    orderBy('changedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const history: EmployeeHistory[] = [];

  querySnapshot.forEach((doc) => {
    history.push(doc.data() as EmployeeHistory);
  });

  return history;
};

/**
 * Search employees by name or ID
 * @param companyId - Company ID
 * @param searchTerm - Search term
 * @returns Array of employees
 */
export const searchEmployees = async (
  companyId: string,
  searchTerm: string
): Promise<Employee[]> => {
  const allEmployees = await getEmployees(companyId);

  const lowerSearchTerm = searchTerm.toLowerCase();

  return allEmployees.filter((employee) => {
    const fullName = employee.personal.fullName.toLowerCase();
    const employeeId = employee.employeeId.toLowerCase();
    const department = employee.employment.department.toLowerCase();
    const designation = employee.employment.designation.toLowerCase();

    return (
      fullName.includes(lowerSearchTerm) ||
      employeeId.includes(lowerSearchTerm) ||
      department.includes(lowerSearchTerm) ||
      designation.includes(lowerSearchTerm)
    );
  });
};

/**
 * Get active employees count
 * @param companyId - Company ID
 * @returns Number of active employees
 */
export const getActiveEmployeesCount = async (companyId: string): Promise<number> => {
  const q = query(
    collection(db, 'employees'),
    where('companyId', '==', companyId),
    where('status', '==', 'active')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

/**
 * Get employees by department
 * @param companyId - Company ID
 * @param department - Department name
 * @returns Array of employees
 */
export const getEmployeesByDepartment = async (
  companyId: string,
  department: string
): Promise<Employee[]> => {
  return getEmployees(companyId, { department });
};

/**
 * Get employees by office
 * @param companyId - Company ID
 * @param officeId - Office ID
 * @returns Array of employees
 */
export const getEmployeesByOffice = async (
  companyId: string,
  officeId: string
): Promise<Employee[]> => {
  return getEmployees(companyId, { officeId });
};
