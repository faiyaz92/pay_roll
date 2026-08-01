/**
 * Attendance Store
 * Zustand store for attendance state management
 */

import { create } from 'zustand';
import type {
  AttendanceRecord,
  AttendanceInput,
  AttendanceFilter,
  AttendanceSummary,
  CheckInOutRequest,
  AttendanceValidationResult,
  DailyAttendanceStats,
  AttendanceStatus,
} from '@/types/attendance';
import {
  createAttendanceRecord,
  getAttendanceRecord,
  getEmployeeAttendance,
  getTodayAttendance,
  getMonthlyAttendanceSummary,
  getDailyAttendanceStats,
  updateAttendanceRecord,
  checkIn,
  checkOut,
  validateCheckInLocation,
  bulkMarkAttendance,
} from '@/useCases/attendanceUseCases';

interface AttendanceStoreState {
  // State
  attendanceRecords: AttendanceRecord[];
  currentRecord: AttendanceRecord | null;
  todayRecord: AttendanceRecord | null;
  monthlySummary: AttendanceSummary | null;
  dailyStats: DailyAttendanceStats | null;
  validationResult: AttendanceValidationResult | null;
  loading: boolean;
  error: string | null;

  // Actions
  createRecord: (data: AttendanceInput, createdBy: string) => Promise<string>;
  getRecord: (recordId: string) => Promise<void>;
  getEmployeeRecords: (filter: AttendanceFilter) => Promise<void>;
  getTodayRecord: (employeeId: string) => Promise<void>;
  getMonthlySummary: (employeeId: string, month: string) => Promise<void>;
  getDailyStats: (companyId: string, date: Date, officeId?: string) => Promise<void>;
  updateRecord: (recordId: string, updates: Partial<AttendanceInput>, updatedBy: string) => Promise<void>;
  employeeCheckIn: (request: CheckInOutRequest) => Promise<string>;
  employeeCheckOut: (request: CheckInOutRequest) => Promise<void>;
  validateLocation: (officeId: string, latitude: number, longitude: number) => Promise<void>;
  bulkMark: (
    employeeIds: string[],
    date: Date,
    status: AttendanceStatus,
    companyId: string,
    officeId: string,
    createdBy: string,
    notes?: string
  ) => Promise<number>;
  clearError: () => void;
  clearValidation: () => void;
  reset: () => void;
}

const initialState = {
  attendanceRecords: [],
  currentRecord: null,
  todayRecord: null,
  monthlySummary: null,
  dailyStats: null,
  validationResult: null,
  loading: false,
  error: null,
};

export const useAttendanceStore = create<AttendanceStoreState>((set) => ({
  ...initialState,

  createRecord: async (data: AttendanceInput, createdBy: string) => {
    set({ loading: true, error: null });
    try {
      const recordId = await createAttendanceRecord(data, createdBy);
      const record = await getAttendanceRecord(recordId);
      set({
        currentRecord: record,
        loading: false,
      });
      return recordId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getRecord: async (recordId: string) => {
    set({ loading: true, error: null });
    try {
      const record = await getAttendanceRecord(recordId);
      set({
        currentRecord: record,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getEmployeeRecords: async (filter: AttendanceFilter) => {
    set({ loading: true, error: null });
    try {
      const records = await getEmployeeAttendance(filter);
      set({
        attendanceRecords: records,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getTodayRecord: async (employeeId: string) => {
    set({ loading: true, error: null });
    try {
      const record = await getTodayAttendance(employeeId);
      set({
        todayRecord: record,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getMonthlySummary: async (employeeId: string, month: string) => {
    set({ loading: true, error: null });
    try {
      const summary = await getMonthlyAttendanceSummary(employeeId, month);
      set({
        monthlySummary: summary,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getDailyStats: async (companyId: string, date: Date, officeId?: string) => {
    set({ loading: true, error: null });
    try {
      const stats = await getDailyAttendanceStats(companyId, date, officeId);
      set({
        dailyStats: stats,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateRecord: async (recordId: string, updates: Partial<AttendanceInput>, updatedBy: string) => {
    set({ loading: true, error: null });
    try {
      await updateAttendanceRecord(recordId, updates, updatedBy);
      const record = await getAttendanceRecord(recordId);
      set({
        currentRecord: record,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  employeeCheckIn: async (request: CheckInOutRequest) => {
    set({ loading: true, error: null });
    try {
      const recordId = await checkIn(request);
      const record = await getTodayAttendance(request.employeeId);
      set({
        todayRecord: record,
        loading: false,
      });
      return recordId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  employeeCheckOut: async (request: CheckInOutRequest) => {
    set({ loading: true, error: null });
    try {
      await checkOut(request);
      const record = await getTodayAttendance(request.employeeId);
      set({
        todayRecord: record,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  validateLocation: async (officeId: string, latitude: number, longitude: number) => {
    set({ loading: true, error: null });
    try {
      const result = await validateCheckInLocation(officeId, latitude, longitude);
      set({
        validationResult: result,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  bulkMark: async (
    employeeIds: string[],
    date: Date,
    status: AttendanceStatus,
    companyId: string,
    officeId: string,
    createdBy: string,
    notes?: string
  ) => {
    set({ loading: true, error: null });
    try {
      const count = await bulkMarkAttendance(
        employeeIds,
        date,
        status,
        companyId,
        officeId,
        createdBy,
        notes
      );
      set({ loading: false });
      return count;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  clearValidation: () => set({ validationResult: null }),

  reset: () => set(initialState),
}));
