/**
 * Attendance Types
 * Domain types for attendance tracking system
 * Matches Database-Info Section 6: Attendance Collections
 */

import type { Timestamp } from 'firebase/firestore';

// Attendance Status Types per BRD Section 4.5
export type AttendanceStatus = 
  | 'present'
  | 'absent'
  | 'late'
  | 'half_day'
  | 'on_leave'
  | 'weekend'
  | 'holiday'
  | 'work_from_home';

// Leave Types
export type LeaveType =
  | 'annual'
  | 'sick'
  | 'emergency'
  | 'unpaid'
  | 'maternity'
  | 'paternity';

/**
 * Attendance Record
 * Matches /attendance_records collection schema
 */
export interface AttendanceRecord {
  recordId: string;
  employeeId: string;
  companyId: string;
  officeId: string;
  date: Date; // YYYY-MM-DD format
  status: AttendanceStatus;
  checkIn?: Timestamp;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number; // in meters
  };
  checkOut?: Timestamp;
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  workHours?: number; // Calculated hours
  overtimeHours?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  leaveType?: LeaveType;
  leaveRequestId?: string;
  notes?: string;
  isManualEntry: boolean; // True if added by admin/HR
  manualEntryBy?: string; // User ID who created manual entry
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Attendance Input for creating records
 */
export interface AttendanceInput {
  employeeId: string;
  companyId: string;
  officeId: string;
  date: Date;
  status: AttendanceStatus;
  checkIn?: Date;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  checkOut?: Date;
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  leaveType?: LeaveType;
  leaveRequestId?: string;
  notes?: string;
  isManualEntry?: boolean;
  manualEntryBy?: string;
}

/**
 * Attendance Summary for reporting
 */
export interface AttendanceSummary {
  employeeId: string;
  month: string; // YYYY-MM format
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  weekendDays: number;
  holidayDays: number;
  wfhDays: number;
  totalWorkHours: number;
  totalOvertimeHours: number;
  totalLateMinutes: number;
}

/**
 * Overtime Log
 * Matches /overtime_logs collection schema
 */
export interface OvertimeLog {
  overtimeId: string;
  employeeId: string;
  companyId: string;
  date: Date;
  hours: number;
  rate: number; // Multiplier: 1.5 for regular, 2.0 for weekend, 2.5 for holiday
  rateType: 'regular' | 'weekend' | 'holiday';
  amount: number; // Calculated: hours * rate * hourlyRate
  approvedBy?: string;
  approvalDate?: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Overtime Input
 */
export interface OvertimeInput {
  employeeId: string;
  companyId: string;
  date: Date;
  hours: number;
  rateType: 'regular' | 'weekend' | 'holiday';
  notes?: string;
}

/**
 * Attendance Filter for queries
 */
export interface AttendanceFilter {
  employeeId?: string;
  companyId?: string;
  officeId?: string;
  status?: AttendanceStatus;
  dateFrom?: Date;
  dateTo?: Date;
  month?: string; // YYYY-MM format
}

/**
 * Check-in/Check-out Request
 */
export interface CheckInOutRequest {
  employeeId: string;
  officeId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: Date;
}

/**
 * Attendance Validation Result
 */
export interface AttendanceValidationResult {
  isValid: boolean;
  canCheckIn: boolean;
  canCheckOut: boolean;
  message: string;
  distance?: number; // Distance from office in meters
  officeRadius?: number; // Office allowed radius
  withinGeofence: boolean;
}

/**
 * Daily Attendance Stats
 */
export interface DailyAttendanceStats {
  date: Date;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  wfh: number;
  notCheckedIn: number;
}
