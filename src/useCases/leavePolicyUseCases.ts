/**
 * Leave Policy & Shift Management Use Cases
 * Handles GCC Company Leave Policy creation and Roster Shift Schedules
 * per BRD Section 4.6 & Checklist Tasks 13.2.18, 13.2.20
 */

export interface LeavePolicy {
  policyId: string;
  policyName: string;
  type: 'annual' | 'sick' | 'casual' | 'maternity';
  yearlyEntitlementDays: number;
  accrualFrequency: 'monthly' | 'quarterly' | 'yearly';
  carryForwardAllowed: boolean;
  maxCarryForwardDays: number;
  probationMonthsBeforeEligible: number;
}

export interface ShiftSchedule {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakDurationMinutes: number;
  assignedOffice: string;
  activeEmployeesCount: number;
}

export const INITIAL_LEAVE_POLICIES: LeavePolicy[] = [
  {
    policyId: 'POL-ANNUAL-UAE',
    policyName: 'Standard UAE Annual Leave Policy',
    type: 'annual',
    yearlyEntitlementDays: 30,
    accrualFrequency: 'monthly',
    carryForwardAllowed: true,
    maxCarryForwardDays: 10,
    probationMonthsBeforeEligible: 6,
  },
  {
    policyId: 'POL-SICK-MOHRE',
    policyName: 'Statutory MOHRE Sick Leave Policy',
    type: 'sick',
    yearlyEntitlementDays: 90,
    accrualFrequency: 'yearly',
    carryForwardAllowed: false,
    maxCarryForwardDays: 0,
    probationMonthsBeforeEligible: 3,
  },
];

export const INITIAL_SHIFTS: ShiftSchedule[] = [
  {
    shiftId: 'SHIFT-MORNING',
    shiftName: 'General Corporate Shift',
    startTime: '09:00',
    endTime: '18:00',
    breakDurationMinutes: 60,
    assignedOffice: 'Dubai Head Office (Business Bay)',
    activeEmployeesCount: 4,
  },
  {
    shiftId: 'SHIFT-OPERATIONS',
    shiftName: 'Site Operations & Logistics Shift',
    startTime: '08:00',
    endTime: '17:00',
    breakDurationMinutes: 60,
    assignedOffice: 'Jebel Ali Logistics Center',
    activeEmployeesCount: 1,
  },
];
