/**
 * Attendance Use Cases
 * Business logic for daily attendance recording
 * Implements BRD Section 4.5: Attendance Tracking System
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
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
import { calculateDistance } from './officeUseCases';

/**
 * Validate check-in/check-out against office geofence
 */
export const validateCheckInLocation = async (
  officeId: string,
  latitude: number,
  longitude: number
): Promise<AttendanceValidationResult> => {
  try {
    const officeDoc = await getDoc(doc(db, 'offices', officeId));
    
    if (!officeDoc.exists()) {
      return {
        isValid: false,
        canCheckIn: false,
        canCheckOut: false,
        message: 'Office not found',
        withinGeofence: false,
      };
    }

    const office = officeDoc.data();
    const distance = calculateDistance(
      { latitude, longitude },
      { latitude: office.latitude, longitude: office.longitude }
    );

    const radius = office.radius || 100; // Default 100m
    const withinGeofence = distance <= radius;

    return {
      isValid: withinGeofence,
      canCheckIn: withinGeofence,
      canCheckOut: withinGeofence,
      message: withinGeofence
        ? 'Within office geofence'
        : `Outside office geofence (${Math.round(distance)}m from office, ${radius}m required)`,
      distance,
      officeRadius: radius,
      withinGeofence,
    };
  } catch (error) {
    console.error('Error validating check-in location:', error);
    throw error;
  }
};

/**
 * Create attendance record
 */
export const createAttendanceRecord = async (
  data: AttendanceInput,
  createdBy: string
): Promise<string> => {
  try {
    const attendanceData = {
      ...data,
      date: Timestamp.fromDate(data.date),
      checkIn: data.checkIn ? Timestamp.fromDate(data.checkIn) : null,
      checkOut: data.checkOut ? Timestamp.fromDate(data.checkOut) : null,
      isManualEntry: data.isManualEntry || false,
      manualEntryBy: data.isManualEntry ? createdBy : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Calculate work hours if both check-in and check-out exist
    if (data.checkIn && data.checkOut) {
      const workHours = (data.checkOut.getTime() - data.checkIn.getTime()) / (1000 * 60 * 60);
      Object.assign(attendanceData, { workHours: Math.max(0, workHours) });
    }

    const docRef = await addDoc(collection(db, 'attendance_records'), attendanceData);
    
    // Update document with its own ID
    await updateDoc(docRef, { recordId: docRef.id });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating attendance record:', error);
    throw error;
  }
};

/**
 * Employee check-in
 */
export const checkIn = async (request: CheckInOutRequest): Promise<string> => {
  try {
    // Validate location
    const validation = await validateCheckInLocation(
      request.officeId,
      request.location.latitude,
      request.location.longitude
    );

    if (!validation.withinGeofence) {
      throw new Error(validation.message);
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingQuery = query(
      collection(db, 'attendance_records'),
      where('employeeId', '==', request.employeeId),
      where('date', '==', Timestamp.fromDate(today))
    );
    
    const existingDocs = await getDocs(existingQuery);
    
    if (!existingDocs.empty) {
      const existing = existingDocs.docs[0];
      const existingData = existing.data();
      
      if (existingData.checkIn) {
        throw new Error('Already checked in today');
      }
      
      // Update existing record with check-in
      await updateDoc(doc(db, 'attendance_records', existing.id), {
        checkIn: Timestamp.fromDate(request.timestamp),
        checkInLocation: request.location,
        status: 'present',
        updatedAt: Timestamp.now(),
      });
      
      return existing.id;
    }

    // Get employee's company ID
    const employeeDoc = await getDoc(doc(db, 'employees', request.employeeId));
    if (!employeeDoc.exists()) {
      throw new Error('Employee not found');
    }

    // Create new attendance record
    const attendanceInput: AttendanceInput = {
      employeeId: request.employeeId,
      companyId: employeeDoc.data().companyId,
      officeId: request.officeId,
      date: today,
      status: 'present',
      checkIn: request.timestamp,
      checkInLocation: request.location,
      isManualEntry: false,
    };

    return await createAttendanceRecord(attendanceInput, request.employeeId);
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
};

/**
 * Employee check-out
 */
export const checkOut = async (request: CheckInOutRequest): Promise<void> => {
  try {
    // Validate location
    const validation = await validateCheckInLocation(
      request.officeId,
      request.location.latitude,
      request.location.longitude
    );

    if (!validation.withinGeofence) {
      throw new Error(validation.message);
    }

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('employeeId', '==', request.employeeId),
      where('date', '==', Timestamp.fromDate(today))
    );
    
    const attendanceDocs = await getDocs(attendanceQuery);
    
    if (attendanceDocs.empty) {
      throw new Error('No check-in record found for today');
    }
    
    const attendanceDoc = attendanceDocs.docs[0];
    const attendanceData = attendanceDoc.data();
    
    if (!attendanceData.checkIn) {
      throw new Error('Must check in before checking out');
    }
    
    if (attendanceData.checkOut) {
      throw new Error('Already checked out today');
    }

    // Calculate work hours
    const checkInTime = attendanceData.checkIn.toDate();
    const workHours = (request.timestamp.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    await updateDoc(doc(db, 'attendance_records', attendanceDoc.id), {
      checkOut: Timestamp.fromDate(request.timestamp),
      checkOutLocation: request.location,
      workHours: Math.max(0, workHours),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
};

/**
 * Employee manual time entry — for when GPS check-in isn't used (e.g. remote
 * work, forgot to check in). Creates or updates that day's attendance
 * record directly from typed-in times, no geofence check.
 */
export const submitManualAttendance = async (
  employeeId: string,
  companyId: string,
  officeId: string,
  date: Date,
  checkInTime: string, // "HH:MM"
  checkOutTime: string, // "HH:MM", optional
  notes: string,
  submittedBy: string
): Promise<string> => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  const [inH, inM] = checkInTime.split(':').map(Number);
  const checkIn = new Date(day);
  checkIn.setHours(inH, inM, 0, 0);

  let checkOut: Date | undefined;
  let workHours: number | undefined;
  if (checkOutTime) {
    const [outH, outM] = checkOutTime.split(':').map(Number);
    checkOut = new Date(day);
    checkOut.setHours(outH, outM, 0, 0);
    workHours = Math.max(0, (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
  }

  const status: AttendanceStatus = workHours !== undefined && workHours < 5 ? 'half_day' : 'present';

  const existingQuery = query(
    collection(db, 'attendance_records'),
    where('employeeId', '==', employeeId),
    where('date', '==', Timestamp.fromDate(day))
  );
  const existingDocs = await getDocs(existingQuery);

  if (!existingDocs.empty) {
    const recordId = existingDocs.docs[0].id;
    await updateDoc(doc(db, 'attendance_records', recordId), {
      checkIn: Timestamp.fromDate(checkIn),
      checkOut: checkOut ? Timestamp.fromDate(checkOut) : null,
      workHours: workHours ?? null,
      status,
      notes: notes || null,
      isManualEntry: true,
      manualEntryBy: submittedBy,
      updatedAt: Timestamp.now(),
    });
    return recordId;
  }

  return createAttendanceRecord(
    {
      employeeId,
      companyId,
      officeId,
      date: day,
      status,
      checkIn,
      checkOut,
      notes: notes || undefined,
      isManualEntry: true,
      manualEntryBy: submittedBy,
    },
    submittedBy
  );
};

/**
 * Get attendance record by ID
 */
export const getAttendanceRecord = async (recordId: string): Promise<AttendanceRecord | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'attendance_records', recordId));
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      date: data.date.toDate(),
      checkIn: data.checkIn?.toDate(),
      checkOut: data.checkOut?.toDate(),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as AttendanceRecord;
  } catch (error) {
    console.error('Error getting attendance record:', error);
    throw error;
  }
};

/**
 * Get employee attendance records
 */
export const getEmployeeAttendance = async (
  filter: AttendanceFilter
): Promise<AttendanceRecord[]> => {
  try {
    const constraints: QueryConstraint[] = [];

    if (filter.employeeId) {
      constraints.push(where('employeeId', '==', filter.employeeId));
    }
    
    if (filter.companyId) {
      constraints.push(where('companyId', '==', filter.companyId));
    }
    
    if (filter.officeId) {
      constraints.push(where('officeId', '==', filter.officeId));
    }
    
    if (filter.status) {
      constraints.push(where('status', '==', filter.status));
    }
    
    if (filter.dateFrom) {
      constraints.push(where('date', '>=', Timestamp.fromDate(filter.dateFrom)));
    }
    
    if (filter.dateTo) {
      constraints.push(where('date', '<=', Timestamp.fromDate(filter.dateTo)));
    }

    constraints.push(orderBy('date', 'desc'));

    const q = query(collection(db, 'attendance_records'), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        date: data.date.toDate(),
        checkIn: data.checkIn?.toDate(),
        checkOut: data.checkOut?.toDate(),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as AttendanceRecord;
    });
  } catch (error) {
    console.error('Error getting employee attendance:', error);
    throw error;
  }
};

/**
 * Delete today's attendance record for an employee, if one exists — lets
 * HR reset a mistaken/test check-in so the employee can check in again.
 */
export const deleteTodayAttendance = async (employeeId: string): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'attendance_records'),
    where('employeeId', '==', employeeId),
    where('date', '==', Timestamp.fromDate(today))
  );

  const querySnapshot = await getDocs(q);
  await Promise.all(querySnapshot.docs.map((d) => deleteDoc(d.ref)));
};

/**
 * Get today's attendance record for employee
 */
export const getTodayAttendance = async (employeeId: string): Promise<AttendanceRecord | null> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'attendance_records'),
      where('employeeId', '==', employeeId),
      where('date', '==', Timestamp.fromDate(today))
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const data = querySnapshot.docs[0].data();
    return {
      ...data,
      date: data.date.toDate(),
      checkIn: data.checkIn?.toDate(),
      checkOut: data.checkOut?.toDate(),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as AttendanceRecord;
  } catch (error) {
    console.error('Error getting today attendance:', error);
    throw error;
  }
};

/**
 * Get monthly attendance summary
 */
export const getMonthlyAttendanceSummary = async (
  employeeId: string,
  month: string // YYYY-MM format
): Promise<AttendanceSummary> => {
  try {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    const records = await getEmployeeAttendance({
      employeeId,
      dateFrom: startDate,
      dateTo: endDate,
    });

    const summary: AttendanceSummary = {
      employeeId,
      month,
      totalDays: records.length,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      leaveDays: 0,
      weekendDays: 0,
      holidayDays: 0,
      wfhDays: 0,
      totalWorkHours: 0,
      totalOvertimeHours: 0,
      totalLateMinutes: 0,
    };

    records.forEach(record => {
      switch (record.status) {
        case 'present':
          summary.presentDays++;
          break;
        case 'absent':
          summary.absentDays++;
          break;
        case 'late':
          summary.lateDays++;
          summary.totalLateMinutes += record.lateMinutes || 0;
          break;
        case 'half_day':
          summary.halfDays++;
          break;
        case 'on_leave':
          summary.leaveDays++;
          break;
        case 'weekend':
          summary.weekendDays++;
          break;
        case 'holiday':
          summary.holidayDays++;
          break;
        case 'work_from_home':
          summary.wfhDays++;
          break;
      }

      summary.totalWorkHours += record.workHours || 0;
      summary.totalOvertimeHours += record.overtimeHours || 0;
    });

    return summary;
  } catch (error) {
    console.error('Error getting monthly attendance summary:', error);
    throw error;
  }
};

/**
 * Get daily attendance stats for office/company
 */
export const getDailyAttendanceStats = async (
  companyId: string,
  date: Date,
  officeId?: string
): Promise<DailyAttendanceStats> => {
  try {
    const filter: AttendanceFilter = {
      companyId,
      dateFrom: date,
      dateTo: date,
    };
    
    if (officeId) {
      filter.officeId = officeId;
    }

    const records = await getEmployeeAttendance(filter);
    
    // Get total employees for company/office
    let totalEmployeesQuery = query(
      collection(db, 'employees'),
      where('companyId', '==', companyId),
      where('status', '==', 'active')
    );
    
    if (officeId) {
      totalEmployeesQuery = query(
        collection(db, 'employee_office_assignments'),
        where('officeId', '==', officeId),
        where('isPrimary', '==', true),
        where('status', '==', 'active')
      );
    }
    
    const totalEmployees = (await getDocs(totalEmployeesQuery)).size;

    const stats: DailyAttendanceStats = {
      date,
      totalEmployees,
      present: 0,
      absent: 0,
      late: 0,
      onLeave: 0,
      wfh: 0,
      notCheckedIn: 0,
    };

    records.forEach(record => {
      switch (record.status) {
        case 'present':
          stats.present++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'late':
          stats.late++;
          break;
        case 'on_leave':
          stats.onLeave++;
          break;
        case 'work_from_home':
          stats.wfh++;
          break;
      }
    });

    stats.notCheckedIn = totalEmployees - records.length;

    return stats;
  } catch (error) {
    console.error('Error getting daily attendance stats:', error);
    throw error;
  }
};

/**
 * Update attendance record
 */
export const updateAttendanceRecord = async (
  recordId: string,
  updates: Partial<AttendanceInput>,
  updatedBy: string
): Promise<void> => {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }
    
    if (updates.checkIn) {
      updateData.checkIn = Timestamp.fromDate(updates.checkIn);
    }
    
    if (updates.checkOut) {
      updateData.checkOut = Timestamp.fromDate(updates.checkOut);
    }

    // Recalculate work hours if times changed
    if (updates.checkIn || updates.checkOut) {
      const record = await getAttendanceRecord(recordId);
      if (record) {
        const checkIn = updates.checkIn || record.checkIn;
        const checkOut = updates.checkOut || record.checkOut;
        
        if (checkIn && checkOut) {
          const workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          updateData.workHours = Math.max(0, workHours);
        }
      }
    }

    await updateDoc(doc(db, 'attendance_records', recordId), updateData);
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
};

/**
 * Bulk mark attendance (for holidays, weekends, etc.)
 */
export const bulkMarkAttendance = async (
  employeeIds: string[],
  date: Date,
  status: AttendanceStatus,
  companyId: string,
  officeId: string,
  createdBy: string,
  notes?: string
): Promise<number> => {
  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const employeeId of employeeIds) {
      // Check if record already exists
      const existingQuery = query(
        collection(db, 'attendance_records'),
        where('employeeId', '==', employeeId),
        where('date', '==', Timestamp.fromDate(date))
      );
      
      const existing = await getDocs(existingQuery);
      
      if (existing.empty) {
        const docRef = doc(collection(db, 'attendance_records'));
        batch.set(docRef, {
          recordId: docRef.id,
          employeeId,
          companyId,
          officeId,
          date: Timestamp.fromDate(date),
          status,
          notes,
          isManualEntry: true,
          manualEntryBy: createdBy,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    return count;
  } catch (error) {
    console.error('Error bulk marking attendance:', error);
    throw error;
  }
};
