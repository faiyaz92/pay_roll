/**
 * Overtime Calculation Use Cases
 * Business logic for GCC overtime calculation
 * Implements BRD Section 4.5: Overtime rates (1.5x regular, 2.0x weekend, 2.5x holiday)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { OvertimeLog, OvertimeInput } from '@/types/attendance';

/**
 * GCC Overtime Rate Multipliers per BRD Section 4.5
 */
export const OVERTIME_RATES = {
  regular: 1.5,    // Regular working day overtime
  weekend: 2.0,    // Weekend overtime
  holiday: 2.5,    // Public holiday overtime
} as const;

/**
 * Calculate overtime amount
 */
const calculateOvertimeAmount = (
  hours: number,
  rateType: 'regular' | 'weekend' | 'holiday',
  hourlyRate: number
): number => {
  const multiplier = OVERTIME_RATES[rateType];
  return hours * multiplier * hourlyRate;
};

/**
 * Get employee's hourly rate from basic salary
 */
const getEmployeeHourlyRate = async (employeeId: string): Promise<number> => {
  try {
    const employeeDoc = await getDoc(doc(db, 'employees', employeeId));
    
    if (!employeeDoc.exists()) {
      throw new Error('Employee not found');
    }

    const employee = employeeDoc.data();
    const basicSalary = employee.basicSalary || 0;
    
    // GCC standard: 26 working days per month, 8 hours per day
    // Hourly rate = Monthly Salary / (26 * 8)
    const workingHoursPerMonth = 26 * 8; // 208 hours
    const hourlyRate = basicSalary / workingHoursPerMonth;
    
    return hourlyRate;
  } catch (error) {
    console.error('Error getting employee hourly rate:', error);
    throw error;
  }
};

/**
 * Determine overtime rate type based on date
 */
export const determineOvertimeRateType = (date: Date): 'regular' | 'weekend' | 'holiday' => {
  const dayOfWeek = date.getDay();
  
  // Check if weekend (Friday/Saturday in GCC)
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return 'weekend';
  }
  
  // TODO: Check against public holidays calendar
  // For now, return regular
  return 'regular';
};

/**
 * Create overtime log
 */
export const createOvertimeLog = async (
  data: OvertimeInput,
  createdBy: string
): Promise<string> => {
  try {
    // Get employee's hourly rate
    const hourlyRate = await getEmployeeHourlyRate(data.employeeId);
    
    // Calculate overtime amount
    const amount = calculateOvertimeAmount(data.hours, data.rateType, hourlyRate);
    const rate = OVERTIME_RATES[data.rateType];

    const overtimeData = {
      ...data,
      date: Timestamp.fromDate(data.date),
      rate,
      amount,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'overtime_logs'), overtimeData);
    
    // Update document with its own ID
    await updateDoc(docRef, { overtimeId: docRef.id });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating overtime log:', error);
    throw error;
  }
};

/**
 * Get overtime log by ID
 */
export const getOvertimeLog = async (overtimeId: string): Promise<OvertimeLog | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'overtime_logs', overtimeId));
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      date: data.date.toDate(),
      approvalDate: data.approvalDate?.toDate(),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as OvertimeLog;
  } catch (error) {
    console.error('Error getting overtime log:', error);
    throw error;
  }
};

/**
 * Get employee overtime logs
 */
export const getEmployeeOvertimeLogs = async (
  employeeId: string,
  startDate?: Date,
  endDate?: Date,
  status?: 'pending' | 'approved' | 'rejected'
): Promise<OvertimeLog[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('employeeId', '==', employeeId),
    ];

    if (startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(endDate)));
    }
    
    if (status) {
      constraints.push(where('status', '==', status));
    }

    constraints.push(orderBy('date', 'desc'));

    const q = query(collection(db, 'overtime_logs'), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        date: data.date.toDate(),
        approvalDate: data.approvalDate?.toDate(),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as OvertimeLog;
    });
  } catch (error) {
    console.error('Error getting employee overtime logs:', error);
    throw error;
  }
};

/**
 * Get company overtime logs (for approval)
 */
export const getCompanyOvertimeLogs = async (
  companyId: string,
  status?: 'pending' | 'approved' | 'rejected',
  startDate?: Date,
  endDate?: Date
): Promise<OvertimeLog[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId),
    ];

    if (status) {
      constraints.push(where('status', '==', status));
    }
    
    if (startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(endDate)));
    }

    constraints.push(orderBy('date', 'desc'));

    const q = query(collection(db, 'overtime_logs'), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        date: data.date.toDate(),
        approvalDate: data.approvalDate?.toDate(),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as OvertimeLog;
    });
  } catch (error) {
    console.error('Error getting company overtime logs:', error);
    throw error;
  }
};

/**
 * Approve overtime log
 */
export const approveOvertimeLog = async (
  overtimeId: string,
  approvedBy: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'overtime_logs', overtimeId), {
      status: 'approved',
      approvedBy,
      approvalDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error approving overtime log:', error);
    throw error;
  }
};

/**
 * Reject overtime log
 */
export const rejectOvertimeLog = async (
  overtimeId: string,
  rejectedBy: string,
  notes?: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'overtime_logs', overtimeId), {
      status: 'rejected',
      approvedBy: rejectedBy,
      approvalDate: Timestamp.now(),
      notes,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error rejecting overtime log:', error);
    throw error;
  }
};

/**
 * Calculate total overtime hours for employee in period
 */
export const calculateEmployeeOvertimeHours = async (
  employeeId: string,
  startDate: Date,
  endDate: Date,
  statusFilter: 'all' | 'approved' = 'approved'
): Promise<{
  totalHours: number;
  totalAmount: number;
  regularHours: number;
  weekendHours: number;
  holidayHours: number;
}> => {
  try {
    const status = statusFilter === 'all' ? undefined : 'approved';
    const logs = await getEmployeeOvertimeLogs(employeeId, startDate, endDate, status);

    const summary = {
      totalHours: 0,
      totalAmount: 0,
      regularHours: 0,
      weekendHours: 0,
      holidayHours: 0,
    };

    logs.forEach(log => {
      summary.totalHours += log.hours;
      summary.totalAmount += log.amount;
      
      switch (log.rateType) {
        case 'regular':
          summary.regularHours += log.hours;
          break;
        case 'weekend':
          summary.weekendHours += log.hours;
          break;
        case 'holiday':
          summary.holidayHours += log.hours;
          break;
      }
    });

    return summary;
  } catch (error) {
    console.error('Error calculating employee overtime hours:', error);
    throw error;
  }
};

/**
 * Auto-calculate overtime from attendance records
 * Checks if daily work hours exceed standard 8 hours
 */
export const autoCalculateOvertimeFromAttendance = async (
  employeeId: string,
  companyId: string,
  attendanceRecordId: string
): Promise<string | null> => {
  try {
    // Get attendance record
    const attendanceDoc = await getDoc(doc(db, 'attendance_records', attendanceRecordId));
    
    if (!attendanceDoc.exists()) {
      throw new Error('Attendance record not found');
    }

    const attendance = attendanceDoc.data();
    const workHours = attendance.workHours || 0;
    
    // Standard working hours per GCC
    const standardHours = 8;
    
    if (workHours <= standardHours) {
      return null; // No overtime
    }

    const overtimeHours = workHours - standardHours;
    const date = attendance.date.toDate();
    const rateType = determineOvertimeRateType(date);

    // Create overtime log
    const overtimeInput: OvertimeInput = {
      employeeId,
      companyId,
      date,
      hours: overtimeHours,
      rateType,
      notes: `Auto-calculated from attendance record ${attendanceRecordId}`,
    };

    const overtimeId = await createOvertimeLog(overtimeInput, 'system');
    
    // Update attendance record with overtime reference
    await updateDoc(doc(db, 'attendance_records', attendanceRecordId), {
      overtimeHours,
      updatedAt: Timestamp.now(),
    });

    return overtimeId;
  } catch (error) {
    console.error('Error auto-calculating overtime:', error);
    throw error;
  }
};

/**
 * Get pending overtime approvals count
 */
export const getPendingOvertimeCount = async (companyId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'overtime_logs'),
      where('companyId', '==', companyId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting pending overtime count:', error);
    throw error;
  }
};
