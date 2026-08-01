/**
 * Leave Use Cases (Business Logic Layer)
 * Implements leave request submission, leave balance calculations, and approvals
 * per BRD Section 4.6 & Database-Info-v1.md Section 7
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FIREBASE_COLLECTIONS } from '../config/firebaseCollections';

export interface LeaveBalance {
  employeeId: string;
  annualAccrued: number;
  annualUsed: number;
  annualRemaining: number;
  sickAccrued: number;
  sickUsed: number;
  sickRemaining: number;
  emergencyAccrued: number;
  emergencyUsed: number;
  emergencyRemaining: number;
}

export interface LeaveRequest {
  leaveId: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  type: 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  submittedAt: Date;
}

const LEAVE_TYPE_TO_BALANCE_FIELD: Record<LeaveRequest['type'], 'annualUsed' | 'sickUsed' | 'emergencyUsed' | null> = {
  annual: 'annualUsed',
  sick: 'sickUsed',
  casual: 'emergencyUsed',
  maternity: null,
  paternity: null,
};

const DEFAULT_BALANCE = {
  annualAccrued: 30,
  annualUsed: 0,
  sickAccrued: 15,
  sickUsed: 0,
  emergencyAccrued: 5,
  emergencyUsed: 0,
};

const toBalance = (employeeId: string, data: typeof DEFAULT_BALANCE): LeaveBalance => ({
  employeeId,
  annualAccrued: data.annualAccrued,
  annualUsed: data.annualUsed,
  annualRemaining: data.annualAccrued - data.annualUsed,
  sickAccrued: data.sickAccrued,
  sickUsed: data.sickUsed,
  sickRemaining: data.sickAccrued - data.sickUsed,
  emergencyAccrued: data.emergencyAccrued,
  emergencyUsed: data.emergencyUsed,
  emergencyRemaining: data.emergencyAccrued - data.emergencyUsed,
});

/**
 * Get Leave Balance for an Employee — self-healing: creates a default
 * balance document the first time an employee is looked up so future
 * approvals have a real, persisted record to decrement.
 */
export const getLeaveBalance = async (employeeId: string): Promise<LeaveBalance> => {
  const balanceRef = doc(db, FIREBASE_COLLECTIONS.leaveBalances, employeeId);
  const snap = await getDoc(balanceRef);

  if (snap.exists()) {
    const data = snap.data();
    return toBalance(employeeId, {
      annualAccrued: data.annualAccrued ?? DEFAULT_BALANCE.annualAccrued,
      annualUsed: data.annualUsed ?? 0,
      sickAccrued: data.sickAccrued ?? DEFAULT_BALANCE.sickAccrued,
      sickUsed: data.sickUsed ?? 0,
      emergencyAccrued: data.emergencyAccrued ?? DEFAULT_BALANCE.emergencyAccrued,
      emergencyUsed: data.emergencyUsed ?? 0,
    });
  }

  await setDoc(balanceRef, {
    employeeId,
    ...DEFAULT_BALANCE,
    updatedAt: serverTimestamp(),
  });

  return toBalance(employeeId, DEFAULT_BALANCE);
};

/**
 * Submit New Leave Request
 */
export const submitLeaveRequest = async (
  employeeId: string,
  employeeName: string,
  companyId: string,
  type: LeaveRequest['type'],
  startDate: string,
  endDate: string,
  totalDays: number,
  reason: string
): Promise<string> => {
  const leaveId = `LV-${Date.now().toString(36).toUpperCase()}`;
  const leaveRef = doc(db, FIREBASE_COLLECTIONS.leaveRequests, leaveId);

  const requestData = {
    leaveId,
    employeeId,
    employeeName,
    companyId,
    type,
    startDate,
    endDate,
    totalDays,
    reason,
    status: 'pending',
    submittedAt: serverTimestamp(),
  };

  await setDoc(leaveRef, requestData);
  return leaveId;
};

/**
 * Get Leave Requests for a Company, optionally scoped to a single employee
 * (used when the caller is an Employee viewing only their own requests).
 */
export const getLeaveRequests = async (
  companyId: string,
  employeeId?: string
): Promise<LeaveRequest[]> => {
  try {
    const constraints = [where('companyId', '==', companyId)];
    if (employeeId) {
      constraints.push(where('employeeId', '==', employeeId));
    }

    const q = query(collection(db, FIREBASE_COLLECTIONS.leaveRequests), ...constraints);
    const snap = await getDocs(q);
    const requests: LeaveRequest[] = [];

    snap.forEach((d) => {
      const data = d.data();
      requests.push({
        leaveId: data.leaveId,
        employeeId: data.employeeId,
        employeeName: data.employeeName || 'Employee',
        companyId: data.companyId,
        type: data.type || 'annual',
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays || 1,
        reason: data.reason || '',
        status: data.status || 'pending',
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt?.toDate(),
        submittedAt: data.submittedAt?.toDate() || new Date(),
      });
    });

    return requests.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  } catch (err) {
    console.warn('Error fetching leave requests:', err);
    return [];
  }
};

/**
 * Approve or Reject Leave Request. Approving decrements the employee's
 * leave balance for the request's type; rejecting makes no balance change
 * (nothing was ever deducted at submission time).
 */
export const updateLeaveStatus = async (
  leaveId: string,
  status: 'approved' | 'rejected',
  approvedBy: string
): Promise<void> => {
  const leaveRef = doc(db, FIREBASE_COLLECTIONS.leaveRequests, leaveId);

  if (status === 'approved') {
    const leaveSnap = await getDoc(leaveRef);
    if (!leaveSnap.exists()) {
      throw new Error('Leave request not found');
    }
    const leaveData = leaveSnap.data();
    const balanceField = LEAVE_TYPE_TO_BALANCE_FIELD[leaveData.type as LeaveRequest['type']];

    if (balanceField && leaveData.employeeId) {
      // Ensure a balance doc exists before incrementing it.
      await getLeaveBalance(leaveData.employeeId);
      await updateDoc(doc(db, FIREBASE_COLLECTIONS.leaveBalances, leaveData.employeeId), {
        [balanceField]: increment(leaveData.totalDays || 0),
        updatedAt: serverTimestamp(),
      });
    }
  }

  await updateDoc(leaveRef, {
    status,
    approvedBy,
    approvedAt: serverTimestamp(),
  });
};
