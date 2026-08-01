/**
 * Employee Store - Zustand State Management
 * Manages employee data state across the application
 */

import { create } from 'zustand';
import type { Employee, EmployeeInput, EmployeeFilter } from '../../types/employee';
import {
  createEmployee,
  getEmployeeById,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
  getActiveEmployeesCount,
  getEmployeesByDepartment,
  getEmployeesByOffice,
  getEmployeeByUserId,
} from '../../useCases/employeeUseCases';

interface EmployeeState {
  // State
  employees: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  error: string | null;
  filters: EmployeeFilter;
  searchTerm: string;
  activeCount: number;

  // Actions
  fetchEmployees: (companyId: string, filters?: EmployeeFilter) => Promise<void>;
  fetchEmployeeById: (employeeId: string) => Promise<void>;
  fetchEmployeeByUserId: (userId: string) => Promise<void>;
  createNewEmployee: (
    companyId: string,
    userId: string,
    employeeData: EmployeeInput,
    createdBy: string
  ) => Promise<string>;
  updateEmployeeData: (
    employeeId: string,
    updates: Partial<EmployeeInput>,
    updatedBy: string
  ) => Promise<void>;
  removeEmployee: (employeeId: string, deletedBy: string) => Promise<void>;
  searchEmployeesList: (companyId: string, searchTerm: string) => Promise<void>;
  fetchActiveCount: (companyId: string) => Promise<void>;
  fetchByDepartment: (companyId: string, department: string) => Promise<void>;
  fetchByOffice: (companyId: string, officeId: string) => Promise<void>;
  setFilters: (filters: EmployeeFilter) => void;
  setSearchTerm: (searchTerm: string) => void;
  setSelectedEmployee: (employee: Employee | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  employees: [],
  selectedEmployee: null,
  loading: false,
  error: null,
  filters: {},
  searchTerm: '',
  activeCount: 0,
};

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  ...initialState,

  fetchEmployees: async (companyId: string, filters?: EmployeeFilter) => {
    set({ loading: true, error: null });
    try {
      const employees = await getEmployees(companyId, filters);
      set({ employees, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch employees',
        loading: false,
      });
    }
  },

  fetchEmployeeById: async (employeeId: string) => {
    set({ loading: true, error: null });
    try {
      const employee = await getEmployeeById(employeeId);
      set({ selectedEmployee: employee, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch employee',
        loading: false,
      });
    }
  },

  fetchEmployeeByUserId: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const employee = await getEmployeeByUserId(userId);
      set({ selectedEmployee: employee, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch employee',
        loading: false,
      });
    }
  },

  createNewEmployee: async (
    companyId: string,
    userId: string,
    employeeData: EmployeeInput,
    createdBy: string
  ): Promise<string> => {
    set({ loading: true, error: null });
    try {
      const employeeId = await createEmployee(companyId, userId, employeeData, createdBy);
      
      // Refresh employees list
      const { filters } = get();
      await get().fetchEmployees(companyId, filters);
      
      set({ loading: false });
      return employeeId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create employee',
        loading: false,
      });
      throw error;
    }
  },

  updateEmployeeData: async (
    employeeId: string,
    updates: Partial<EmployeeInput>,
    updatedBy: string
  ) => {
    set({ loading: true, error: null });
    try {
      await updateEmployee(employeeId, updates, updatedBy);
      
      // Update selected employee if it's the one being updated
      const { selectedEmployee } = get();
      if (selectedEmployee && selectedEmployee.employeeId === employeeId) {
        await get().fetchEmployeeById(employeeId);
      }
      
      // Refresh employees list
      const employees = get().employees;
      if (employees.length > 0) {
        const companyId = employees[0].companyId;
        const { filters } = get();
        await get().fetchEmployees(companyId, filters);
      }
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update employee',
        loading: false,
      });
      throw error;
    }
  },

  removeEmployee: async (employeeId: string, deletedBy: string) => {
    set({ loading: true, error: null });
    try {
      await deleteEmployee(employeeId, deletedBy);
      
      // Clear selected employee if it's the one being deleted
      const { selectedEmployee } = get();
      if (selectedEmployee && selectedEmployee.employeeId === employeeId) {
        set({ selectedEmployee: null });
      }
      
      // Refresh employees list
      const employees = get().employees;
      if (employees.length > 0) {
        const companyId = employees[0].companyId;
        const { filters } = get();
        await get().fetchEmployees(companyId, filters);
      }
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete employee',
        loading: false,
      });
      throw error;
    }
  },

  searchEmployeesList: async (companyId: string, searchTerm: string) => {
    set({ loading: true, error: null, searchTerm });
    try {
      if (!searchTerm.trim()) {
        // If search term is empty, fetch all employees with current filters
        const { filters } = get();
        await get().fetchEmployees(companyId, filters);
      } else {
        const employees = await searchEmployees(companyId, searchTerm);
        set({ employees, loading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search employees',
        loading: false,
      });
    }
  },

  fetchActiveCount: async (companyId: string) => {
    try {
      const activeCount = await getActiveEmployeesCount(companyId);
      set({ activeCount });
    } catch (error) {
      console.error('Failed to fetch active employee count:', error);
    }
  },

  fetchByDepartment: async (companyId: string, department: string) => {
    set({ loading: true, error: null });
    try {
      const employees = await getEmployeesByDepartment(companyId, department);
      set({ employees, filters: { department }, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch employees by department',
        loading: false,
      });
    }
  },

  fetchByOffice: async (companyId: string, officeId: string) => {
    set({ loading: true, error: null });
    try {
      const employees = await getEmployeesByOffice(companyId, officeId);
      set({ employees, filters: { officeId }, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch employees by office',
        loading: false,
      });
    }
  },

  setFilters: (filters: EmployeeFilter) => {
    set({ filters });
  },

  setSearchTerm: (searchTerm: string) => {
    set({ searchTerm });
  },

  setSelectedEmployee: (employee: Employee | null) => {
    set({ selectedEmployee: employee });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
