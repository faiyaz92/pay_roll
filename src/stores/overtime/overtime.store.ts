/**
 * Overtime Store
 * Zustand store for overtime management
 */

import { create } from 'zustand';
import type { OvertimeLog, OvertimeInput } from '@/types/attendance';
import {
  createOvertimeLog,
  getOvertimeLog,
  getEmployeeOvertimeLogs,
  getCompanyOvertimeLogs,
  approveOvertimeLog,
  rejectOvertimeLog,
  calculateEmployeeOvertimeHours,
  autoCalculateOvertimeFromAttendance,
  getPendingOvertimeCount,
  OVERTIME_RATES,
} from '@/useCases/overtimeUseCases';

interface OvertimeSummary {
  totalHours: number;
  totalAmount: number;
  regularHours: number;
  weekendHours: number;
  holidayHours: number;
}

interface OvertimeStoreState {
  // State
  overtimeLogs: OvertimeLog[];
  currentLog: OvertimeLog | null;
  employeeSummary: OvertimeSummary | null;
  pendingCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  createLog: (data: OvertimeInput, createdBy: string) => Promise<string>;
  getLog: (overtimeId: string) => Promise<void>;
  getEmployeeLogs: (
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
    status?: 'pending' | 'approved' | 'rejected'
  ) => Promise<void>;
  getCompanyLogs: (
    companyId: string,
    status?: 'pending' | 'approved' | 'rejected',
    startDate?: Date,
    endDate?: Date
  ) => Promise<void>;
  approveLog: (overtimeId: string, approvedBy: string) => Promise<void>;
  rejectLog: (overtimeId: string, rejectedBy: string, notes?: string) => Promise<void>;
  getEmployeeSummary: (
    employeeId: string,
    startDate: Date,
    endDate: Date,
    statusFilter?: 'all' | 'approved'
  ) => Promise<void>;
  autoCalculateFromAttendance: (
    employeeId: string,
    companyId: string,
    attendanceRecordId: string
  ) => Promise<string | null>;
  getPendingCount: (companyId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  overtimeLogs: [],
  currentLog: null,
  employeeSummary: null,
  pendingCount: 0,
  loading: false,
  error: null,
};

export const useOvertimeStore = create<OvertimeStoreState>((set) => ({
  ...initialState,

  createLog: async (data: OvertimeInput, createdBy: string) => {
    set({ loading: true, error: null });
    try {
      const logId = await createOvertimeLog(data, createdBy);
      const log = await getOvertimeLog(logId);
      set({
        currentLog: log,
        loading: false,
      });
      return logId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getLog: async (overtimeId: string) => {
    set({ loading: true, error: null });
    try {
      const log = await getOvertimeLog(overtimeId);
      set({
        currentLog: log,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getEmployeeLogs: async (
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
    status?: 'pending' | 'approved' | 'rejected'
  ) => {
    set({ loading: true, error: null });
    try {
      const logs = await getEmployeeOvertimeLogs(employeeId, startDate, endDate, status);
      set({
        overtimeLogs: logs,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getCompanyLogs: async (
    companyId: string,
    status?: 'pending' | 'approved' | 'rejected',
    startDate?: Date,
    endDate?: Date
  ) => {
    set({ loading: true, error: null });
    try {
      const logs = await getCompanyOvertimeLogs(companyId, status, startDate, endDate);
      set({
        overtimeLogs: logs,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  approveLog: async (overtimeId: string, approvedBy: string) => {
    set({ loading: true, error: null });
    try {
      await approveOvertimeLog(overtimeId, approvedBy);
      const log = await getOvertimeLog(overtimeId);
      set({
        currentLog: log,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  rejectLog: async (overtimeId: string, rejectedBy: string, notes?: string) => {
    set({ loading: true, error: null });
    try {
      await rejectOvertimeLog(overtimeId, rejectedBy, notes);
      const log = await getOvertimeLog(overtimeId);
      set({
        currentLog: log,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getEmployeeSummary: async (
    employeeId: string,
    startDate: Date,
    endDate: Date,
    statusFilter: 'all' | 'approved' = 'approved'
  ) => {
    set({ loading: true, error: null });
    try {
      const summary = await calculateEmployeeOvertimeHours(
        employeeId,
        startDate,
        endDate,
        statusFilter
      );
      set({
        employeeSummary: summary,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  autoCalculateFromAttendance: async (
    employeeId: string,
    companyId: string,
    attendanceRecordId: string
  ) => {
    set({ loading: true, error: null });
    try {
      const overtimeId = await autoCalculateOvertimeFromAttendance(
        employeeId,
        companyId,
        attendanceRecordId
      );
      set({ loading: false });
      return overtimeId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getPendingCount: async (companyId: string) => {
    set({ loading: true, error: null });
    try {
      const count = await getPendingOvertimeCount(companyId);
      set({
        pendingCount: count,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));

// Export overtime rates for UI consumption
export { OVERTIME_RATES };
