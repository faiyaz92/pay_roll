/**
 * Attendance Analytics Use Cases
 * Business logic for attendance reporting and compliance metrics
 */

import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { AttendanceRecord } from '@/types/attendance';

/**
 * Attendance Compliance Thresholds per GCC standards
 */
export const COMPLIANCE_THRESHOLDS = {
  minAttendanceRate: 80, // 80% minimum attendance rate
  maxAbsentDays: 5,      // Maximum absent days per month
  maxLateDays: 3,        // Maximum late days per month
  standardWorkHours: 8,  // Standard hours per day
  standardWorkDaysPerMonth: 26, // GCC standard
} as const;

/**
 * Department Analytics
 */
export interface DepartmentAttendanceAnalytics {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  avgAttendanceRate: number;
  avgWorkHours: number;
  complianceRate: number;
}

/**
 * Monthly Trend Data Point
 */
export interface MonthlyTrendPoint {
  date: string; // YYYY-MM-DD
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  attendanceRate: number;
}

/**
 * Compliance Report
 */
export interface ComplianceReport {
  totalEmployees: number;
  compliantEmployees: number;
  nonCompliantEmployees: number;
  complianceRate: number;
  violations: {
    lowAttendanceRate: number;
    excessiveAbsences: number;
    excessiveLate: number;
  };
}

/**
 * Employee Attendance Analytics
 */
export interface EmployeeAttendanceAnalytics {
  employeeId: string;
  employeeName: string;
  attendanceRate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  avgWorkHours: number;
  isCompliant: boolean;
  violations: string[];
}

/**
 * Get department attendance analytics
 */
export const getDepartmentAnalytics = async (
  companyId: string,
  date: Date
): Promise<DepartmentAttendanceAnalytics[]> => {
  try {
    // Get all employees grouped by department
    const employeesQuery = query(
      collection(db, 'employees'),
      where('companyId', '==', companyId),
      where('status', '==', 'active')
    );
    const employeesSnapshot = await getDocs(employeesQuery);
    
    // Group by department
    const departmentMap = new Map<string, any>();
    employeesSnapshot.docs.forEach(doc => {
      const employee = doc.data();
      const deptId = employee.department || 'unassigned';
      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, {
          departmentId: deptId,
          departmentName: employee.department || 'Unassigned',
          employees: [],
        });
      }
      departmentMap.get(deptId).employees.push(doc.id);
    });

    // Get today's attendance for all employees
    const todayStart = new Date(date);
    todayStart.setHours(0, 0, 0, 0);
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('companyId', '==', companyId),
      where('date', '==', Timestamp.fromDate(todayStart))
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    // Build analytics for each department
    const analytics: DepartmentAttendanceAnalytics[] = [];
    
    for (const [deptId, dept] of departmentMap) {
      const deptEmployees = dept.employees;
      const deptAttendance = attendanceSnapshot.docs.filter(doc =>
        deptEmployees.includes(doc.data().employeeId)
      );

      const present = deptAttendance.filter(doc => doc.data().status === 'present').length;
      const absent = deptAttendance.filter(doc => doc.data().status === 'absent').length;
      const late = deptAttendance.filter(doc => doc.data().status === 'late').length;

      // Calculate average metrics (simplified - should aggregate from monthly data)
      const avgAttendanceRate = deptEmployees.length > 0
        ? (present / deptEmployees.length) * 100
        : 0;

      analytics.push({
        departmentId: deptId,
        departmentName: dept.departmentName,
        totalEmployees: deptEmployees.length,
        presentToday: present,
        absentToday: absent,
        lateToday: late,
        avgAttendanceRate,
        avgWorkHours: 8, // Placeholder - should calculate from actual data
        complianceRate: avgAttendanceRate >= COMPLIANCE_THRESHOLDS.minAttendanceRate ? 100 : 0,
      });
    }

    return analytics.sort((a, b) => b.totalEmployees - a.totalEmployees);
  } catch (error) {
    console.error('Error getting department analytics:', error);
    throw error;
  }
};

/**
 * Get monthly attendance trend
 */
export const getMonthlyTrend = async (
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<MonthlyTrendPoint[]> => {
  try {
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('companyId', '==', companyId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    const snapshot = await getDocs(attendanceQuery);

    // Group by date
    const dateMap = new Map<string, AttendanceRecord[]>();
    snapshot.docs.forEach(doc => {
      const record = doc.data() as AttendanceRecord;
      const dateKey = record.date.toDate().toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push({
        ...record,
        date: record.date.toDate(),
        checkIn: record.checkIn?.toDate(),
        checkOut: record.checkOut?.toDate(),
      } as AttendanceRecord);
    });

    // Calculate metrics for each date
    const trendData: MonthlyTrendPoint[] = [];
    for (const [dateKey, records] of dateMap) {
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const onLeave = records.filter(r => r.status === 'on_leave').length;
      
      const total = records.length;
      const attendanceRate = total > 0 ? (present / total) * 100 : 0;

      trendData.push({
        date: dateKey,
        present,
        absent,
        late,
        onLeave,
        attendanceRate,
      });
    }

    return trendData.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting monthly trend:', error);
    throw error;
  }
};

/**
 * Get compliance report
 */
export const getComplianceReport = async (
  companyId: string,
  month: string // YYYY-MM format
): Promise<ComplianceReport> => {
  try {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    // Get all employees
    const employeesQuery = query(
      collection(db, 'employees'),
      where('companyId', '==', companyId),
      where('status', '==', 'active')
    );
    const employeesSnapshot = await getDocs(employeesQuery);
    const totalEmployees = employeesSnapshot.size;

    // Get attendance records for the month
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('companyId', '==', companyId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);

    // Analyze each employee
    const employeeMap = new Map<string, {
      present: number;
      absent: number;
      late: number;
      total: number;
    }>();

    attendanceSnapshot.docs.forEach(doc => {
      const record = doc.data();
      const empId = record.employeeId;
      
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, { present: 0, absent: 0, late: 0, total: 0 });
      }
      
      const stats = employeeMap.get(empId)!;
      stats.total++;
      
      if (record.status === 'present') stats.present++;
      if (record.status === 'absent') stats.absent++;
      if (record.status === 'late') stats.late++;
    });

    // Check compliance
    let compliantCount = 0;
    let lowAttendanceCount = 0;
    let excessiveAbsencesCount = 0;
    let excessiveLateCount = 0;

    for (const [empId, stats] of employeeMap) {
      const attendanceRate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
      const isCompliant = 
        attendanceRate >= COMPLIANCE_THRESHOLDS.minAttendanceRate &&
        stats.absent <= COMPLIANCE_THRESHOLDS.maxAbsentDays &&
        stats.late <= COMPLIANCE_THRESHOLDS.maxLateDays;

      if (isCompliant) {
        compliantCount++;
      } else {
        if (attendanceRate < COMPLIANCE_THRESHOLDS.minAttendanceRate) lowAttendanceCount++;
        if (stats.absent > COMPLIANCE_THRESHOLDS.maxAbsentDays) excessiveAbsencesCount++;
        if (stats.late > COMPLIANCE_THRESHOLDS.maxLateDays) excessiveLateCount++;
      }
    }

    const complianceRate = totalEmployees > 0
      ? (compliantCount / totalEmployees) * 100
      : 100;

    return {
      totalEmployees,
      compliantEmployees: compliantCount,
      nonCompliantEmployees: totalEmployees - compliantCount,
      complianceRate,
      violations: {
        lowAttendanceRate: lowAttendanceCount,
        excessiveAbsences: excessiveAbsencesCount,
        excessiveLate: excessiveLateCount,
      },
    };
  } catch (error) {
    console.error('Error getting compliance report:', error);
    throw error;
  }
};

/**
 * Get employee attendance analytics
 */
export const getEmployeeAnalytics = async (
  companyId: string,
  month: string // YYYY-MM format
): Promise<EmployeeAttendanceAnalytics[]> => {
  try {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    // Get all employees
    const employeesQuery = query(
      collection(db, 'employees'),
      where('companyId', '==', companyId),
      where('status', '==', 'active')
    );
    const employeesSnapshot = await getDocs(employeesQuery);

    // Get attendance records
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('companyId', '==', companyId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);

    // Build analytics for each employee
    const analytics: EmployeeAttendanceAnalytics[] = [];

    employeesSnapshot.docs.forEach(empDoc => {
      const employee = empDoc.data();
      const empRecords = attendanceSnapshot.docs.filter(
        doc => doc.data().employeeId === empDoc.id
      );

      const totalDays = empRecords.length;
      const presentDays = empRecords.filter(doc => doc.data().status === 'present').length;
      const absentDays = empRecords.filter(doc => doc.data().status === 'absent').length;
      const lateDays = empRecords.filter(doc => doc.data().status === 'late').length;

      const totalWorkHours = empRecords.reduce((sum, doc) => {
        const workHours = doc.data().workHours || 0;
        return sum + workHours;
      }, 0);
      const avgWorkHours = totalDays > 0 ? totalWorkHours / totalDays : 0;

      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Check violations
      const violations: string[] = [];
      if (attendanceRate < COMPLIANCE_THRESHOLDS.minAttendanceRate) {
        violations.push(`Low attendance rate: ${attendanceRate.toFixed(1)}%`);
      }
      if (absentDays > COMPLIANCE_THRESHOLDS.maxAbsentDays) {
        violations.push(`Excessive absences: ${absentDays} days`);
      }
      if (lateDays > COMPLIANCE_THRESHOLDS.maxLateDays) {
        violations.push(`Excessive late arrivals: ${lateDays} days`);
      }

      analytics.push({
        employeeId: empDoc.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        attendanceRate,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        avgWorkHours,
        isCompliant: violations.length === 0,
        violations,
      });
    });

    // Sort by attendance rate (lowest first to highlight issues)
    return analytics.sort((a, b) => a.attendanceRate - b.attendanceRate);
  } catch (error) {
    console.error('Error getting employee analytics:', error);
    throw error;
  }
};
