/**
 * Turnkey Demo Data Seeder for Payrole HR & Payroll System
 * Pre-populates Firebase Firestore with realistic GCC sample data for client presentations.
 * Target Tenant: "Al Hilal Enterprises LLC (Dubai)"
 */

import { doc, setDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createAuthUser } from '../config/firebaseSecondary';
import { FIREBASE_COLLECTIONS } from '../config/firebaseCollections';
import { Role } from '../types/user';

export const DEMO_COMPANY_ID = 'COMP-ALHILAL-DUBAI';
export const DEMO_COMPANY_NAME = 'Al Hilal Enterprises LLC (Dubai)';

export interface DemoCredential {
  role: string;
  name: string;
  email: string;
  passwordHint: string;
  description: string;
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    role: 'Super Admin',
    name: 'Platform Administrator',
    email: 'super.admin@payrole.app',
    passwordHint: 'SuperAdmin@123',
    description: 'Create & manage multiple tenant companies, view global statistics.',
  },
  {
    role: 'Company Admin',
    name: 'Tariq Al-Mansoori',
    email: 'admin@alhilal.ae',
    passwordHint: 'DemoAdmin@123',
    description: 'Full administrative control over Al Hilal Enterprises LLC.',
  },
  {
    role: 'HR Manager',
    name: 'Fatima Al-Zahra',
    email: 'hr@alhilal.ae',
    passwordHint: 'HRManager@123',
    description: 'Employee onboarding, attendance validation, payroll run, WPS export.',
  },
  {
    role: 'Employee',
    name: 'Rashid Khan',
    email: 'employee@alhilal.ae',
    passwordHint: 'EmpUser@123',
    description: 'Employee portal: view payslips, attendance, leave balance.',
  },
];

export const seedDemoData = async (): Promise<boolean> => {
  try {
    // 1. Seed Tenant Company
    const companyRef = doc(db, 'companies', DEMO_COMPANY_ID);
    await setDoc(companyRef, {
      companyId: DEMO_COMPANY_ID,
      name: DEMO_COMPANY_NAME,
      email: 'info@alhilal.ae',
      country: 'UAE',
      currency: 'AED',
      registrationNumber: 'TRN-100293847',
      taxId: 'TAX-UAE-9912',
      industry: 'Information Technology & Trade',
      employeeCount: 5,
      status: 'active',
      adminEmail: 'admin@alhilal.ae',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Seed Users — create REAL Firebase Auth accounts (via the secondary
    // app so the currently signed-in Super Admin session isn't disturbed),
    // then write /users/{realUid} so login actually works end-to-end.
    const users = [
      {
        email: 'super.admin@payrole.app',
        password: 'SuperAdmin@123',
        displayName: 'Platform Administrator',
        role: Role.SUPER_ADMIN,
        companyId: 'SYSTEM',
        status: 'active' as const,
      },
      {
        email: 'admin@alhilal.ae',
        password: 'DemoAdmin@123',
        displayName: 'Tariq Al-Mansoori',
        role: Role.COMPANY_ADMIN,
        companyId: DEMO_COMPANY_ID,
        status: 'active' as const,
      },
      {
        email: 'hr@alhilal.ae',
        password: 'HRManager@123',
        displayName: 'Fatima Al-Zahra',
        role: Role.HR_MANAGER,
        companyId: DEMO_COMPANY_ID,
        status: 'active' as const,
      },
      {
        email: 'employee@alhilal.ae',
        password: 'EmpUser@123',
        displayName: 'Rashid Khan',
        role: Role.EMPLOYEE,
        companyId: DEMO_COMPANY_ID,
        employeeId: 'EMP-ALH-001',
        status: 'active' as const,
      },
    ];

    const employeeUidByEmployeeId: Record<string, string> = {};

    for (const u of users) {
      const { password, ...profile } = u;
      const { uid } = await createAuthUser(u.email, password);

      if (profile.employeeId) {
        employeeUidByEmployeeId[profile.employeeId] = uid;
      }

      await setDoc(doc(db, FIREBASE_COLLECTIONS.users, uid), {
        ...profile,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Seed Sample Employees
    const sampleEmployees = [
      {
        employeeId: 'EMP-ALH-001',
        userId: employeeUidByEmployeeId['EMP-ALH-001'] ?? 'demo_employee_uid',
        companyId: DEMO_COMPANY_ID,
        personal: {
          firstName: 'Rashid',
          lastName: 'Khan',
          fullName: 'Rashid Khan',
          dateOfBirth: '1992-05-14',
          gender: 'male',
          nationality: 'Pakistan',
          maritalStatus: 'married',
          dependents: 2,
        },
        employment: {
          department: 'Software Engineering',
          designation: 'Senior Full Stack Developer',
          grade: 'Senior L4',
          costCenter: 'CC-TECH-01',
          officeId: 'OFFICE-DXB-HQ',
          contractType: 'unlimited',
          startDate: '2023-01-15',
        },
        payroll: {
          basicSalary: 12000,
          hra: { amount: 5000, percentage: 41.6 },
          transportation: 1500,
          mobile: 300,
          utilities: 200,
          overtimeRate: 75,
          currency: 'AED',
        },
        banking: {
          bankName: 'Emirates NBD',
          branch: 'Downtown Dubai',
          iban: 'AE030330000000123456789',
          swiftCode: 'EBILAEADXXX',
          accountNumber: '123456789',
        },
        compliance: {
          emiratesId: '784-1992-1234567-1',
          passportNumber: 'N9876543',
          visaStatus: 'Residence Visa - Valid',
          labourCardNumber: '73948291048',
        },
        status: 'active',
      },
      {
        employeeId: 'EMP-ALH-002',
        userId: 'emp_uid_002',
        companyId: DEMO_COMPANY_ID,
        personal: {
          firstName: 'Ayesha',
          lastName: 'Siddiqui',
          fullName: 'Ayesha Siddiqui',
          dateOfBirth: '1994-09-22',
          gender: 'female',
          nationality: 'India',
          maritalStatus: 'single',
          dependents: 0,
        },
        employment: {
          department: 'Human Resources',
          designation: 'HR Specialist',
          grade: 'L3',
          costCenter: 'CC-HR-01',
          officeId: 'OFFICE-DXB-HQ',
          contractType: 'unlimited',
          startDate: '2023-06-01',
        },
        payroll: {
          basicSalary: 9500,
          hra: { amount: 3500, percentage: 36.8 },
          transportation: 1200,
          mobile: 250,
          utilities: 150,
          overtimeRate: 60,
          currency: 'AED',
        },
        banking: {
          bankName: 'Mashreq Bank',
          branch: 'Business Bay',
          iban: 'AE520310000000987654321',
          swiftCode: 'BOAEAEADXXX',
          accountNumber: '987654321',
        },
        compliance: {
          emiratesId: '784-1994-9876543-2',
          passportNumber: 'P1234567',
          visaStatus: 'Residence Visa - Valid',
          labourCardNumber: '84920193847',
        },
        status: 'active',
      },
      {
        employeeId: 'EMP-ALH-003',
        userId: 'emp_uid_003',
        companyId: DEMO_COMPANY_ID,
        personal: {
          firstName: 'Salem',
          lastName: 'Al-Hashemi',
          fullName: 'Salem Al-Hashemi',
          dateOfBirth: '1988-12-10',
          gender: 'male',
          nationality: 'UAE',
          maritalStatus: 'married',
          dependents: 3,
        },
        employment: {
          department: 'Finance & Operations',
          designation: 'Finance Manager',
          grade: 'Lead L5',
          costCenter: 'CC-FIN-01',
          officeId: 'OFFICE-DXB-HQ',
          contractType: 'unlimited',
          startDate: '2022-03-10',
        },
        payroll: {
          basicSalary: 18000,
          hra: { amount: 7000, percentage: 38.8 },
          transportation: 2500,
          mobile: 500,
          utilities: 300,
          overtimeRate: 110,
          currency: 'AED',
        },
        banking: {
          bankName: 'Abu Dhabi Commercial Bank (ADCB)',
          branch: 'Sheikh Zayed Road',
          iban: 'AE150030000000456789123',
          swiftCode: 'ADCBAB22XXX',
          accountNumber: '456789123',
        },
        compliance: {
          emiratesId: '784-1988-5554443-3',
          passportNumber: 'UAE009988',
          visaStatus: 'UAE National',
          labourCardNumber: '99201928374',
        },
        status: 'active',
      },
      {
        employeeId: 'EMP-ALH-004',
        userId: 'emp_uid_004',
        companyId: DEMO_COMPANY_ID,
        personal: {
          firstName: 'Mohammed',
          lastName: 'Al Farsi',
          fullName: 'Mohammed Al Farsi',
          dateOfBirth: '1996-02-18',
          gender: 'male',
          nationality: 'UAE',
          maritalStatus: 'single',
          dependents: 0,
        },
        employment: {
          department: 'Sales & Business Development',
          designation: 'Sales Executive',
          grade: 'L2',
          costCenter: 'CC-SALES-01',
          officeId: 'OFFICE-DXB-HQ',
          contractType: 'limited',
          startDate: '2024-02-01',
        },
        payroll: {
          basicSalary: 7000,
          hra: { amount: 2500, percentage: 35.7 },
          transportation: 1000,
          mobile: 200,
          utilities: 100,
          overtimeRate: 45,
          currency: 'AED',
        },
        banking: {
          bankName: 'Dubai Islamic Bank',
          branch: 'Al Barsha',
          iban: 'AE070240000000112233445',
          swiftCode: 'DUIBAEADXXX',
          accountNumber: '112233445',
        },
        compliance: {
          emiratesId: '784-1996-2233445-4',
          passportNumber: 'UAE778899',
          visaStatus: 'UAE National',
          labourCardNumber: '55667788990',
        },
        status: 'active',
      },
      {
        employeeId: 'EMP-ALH-005',
        userId: 'emp_uid_005',
        companyId: DEMO_COMPANY_ID,
        personal: {
          firstName: 'Priya',
          lastName: 'Nair',
          fullName: 'Priya Nair',
          dateOfBirth: '1998-07-30',
          gender: 'female',
          nationality: 'India',
          maritalStatus: 'single',
          dependents: 0,
        },
        employment: {
          department: 'Administration',
          designation: 'Admin Assistant',
          grade: 'L1',
          costCenter: 'CC-ADMIN-01',
          officeId: 'OFFICE-DXB-HQ',
          contractType: 'unlimited',
          startDate: '2024-08-12',
        },
        payroll: {
          basicSalary: 5500,
          hra: { amount: 2000, percentage: 36.4 },
          transportation: 800,
          mobile: 150,
          utilities: 100,
          overtimeRate: 35,
          currency: 'AED',
        },
        banking: {
          bankName: 'Emirates NBD',
          branch: 'Deira',
          iban: 'AE090330000000998877665',
          swiftCode: 'EBILAEADXXX',
          accountNumber: '998877665',
        },
        compliance: {
          emiratesId: '784-1998-9988776-5',
          passportNumber: 'IND445566',
          visaStatus: 'Residence Visa - Valid',
          labourCardNumber: '11223344556',
        },
        status: 'active',
      },
    ];

    // Prefer a real office the user has already created (e.g. via Offices ->
    // Add Office -> "Use My Current Location") over the fixed Dubai demo
    // office, so seeded employees can actually check in from the tester's
    // real location. Falls back to the fixed demo office if none exist yet.
    const existingOfficesSnap = await getDocs(
      query(collection(db, FIREBASE_COLLECTIONS.offices), where('companyId', '==', DEMO_COMPANY_ID))
    );
    const realOffice = existingOfficesSnap.docs.find((d) => d.id !== 'OFFICE-DXB-HQ');
    const targetOfficeId = realOffice?.id ?? 'OFFICE-DXB-HQ';

    for (const emp of sampleEmployees) {
      emp.employment.officeId = targetOfficeId;
      await setDoc(doc(db, FIREBASE_COLLECTIONS.employees, emp.employeeId), {
        ...emp,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Seed a real leave balance per employee so Leave Management works
      // immediately instead of relying on fabricated in-memory defaults.
      await setDoc(doc(db, FIREBASE_COLLECTIONS.leaveBalances, emp.employeeId), {
        employeeId: emp.employeeId,
        annualAccrued: 30,
        annualUsed: 0,
        sickAccrued: 15,
        sickUsed: 0,
        emergencyAccrued: 5,
        emergencyUsed: 0,
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Seed Sample Office
    await setDoc(doc(db, FIREBASE_COLLECTIONS.offices, 'OFFICE-DXB-HQ'), {
      officeId: 'OFFICE-DXB-HQ',
      name: 'Dubai Head Office (Business Bay)',
      address: 'Bay Square, Building 04, Office 602, Business Bay, Dubai',
      latitude: 25.1855,
      longitude: 55.2798,
      radius: 100,
      type: 'head_office',
      workingHours: { start: '09:00', end: '18:00' },
      createdAt: serverTimestamp(),
    });

    // 5. Seed attendance history — the last 6 working days (today stays open
    // for a live check-in demo) plus the two full prior months (May & June)
    // so HR/Employee attendance views have real history to browse back
    // through, not just "today". UAE work week: Fri/Sat are weekends.
    const dayPatterns: Array<{ checkIn: string; checkOut: string }> = [
      { checkIn: '08:55', checkOut: '18:05' }, // full day
      { checkIn: '09:10', checkOut: '18:00' }, // full day
      { checkIn: '09:00', checkOut: '13:00' }, // half day
      { checkIn: '09:45', checkOut: '18:10' }, // late arrival
      { checkIn: '08:50', checkOut: '17:55' }, // full day
    ];

    const attendanceWrites: Promise<void>[] = [];

    const seedAttendanceForDays = (days: Date[]) => {
      days.forEach((day) => {
        const dow = day.getDay();
        if (dow === 5 || dow === 6) return; // skip Fri/Sat weekend

        sampleEmployees.forEach((emp, empIndex) => {
          const dayIndex = Math.floor(day.getTime() / (1000 * 60 * 60 * 24));

          // One employee is absent roughly once a week — skip the record so
          // Team Attendance naturally shows them as "Absent" that day.
          if ((dayIndex + empIndex) % 7 === 0) return;

          const pattern = dayPatterns[(dayIndex + empIndex) % dayPatterns.length];
          const [inH, inM] = pattern.checkIn.split(':').map(Number);
          const [outH, outM] = pattern.checkOut.split(':').map(Number);

          const checkIn = new Date(day);
          checkIn.setHours(inH, inM, 0, 0);
          const checkOut = new Date(day);
          checkOut.setHours(outH, outM, 0, 0);

          const workHours = Math.max(0, (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
          const status = workHours < 5 ? 'half_day' : inM > 30 && inH === 9 ? 'late' : 'present';

          const recordId = `${emp.employeeId}_${day.toISOString().slice(0, 10)}`;
          attendanceWrites.push(
            setDoc(doc(db, FIREBASE_COLLECTIONS.attendanceRecords, recordId), {
              recordId,
              employeeId: emp.employeeId,
              companyId: DEMO_COMPANY_ID,
              officeId: emp.employment.officeId,
              date: Timestamp.fromDate(day),
              status,
              checkIn: Timestamp.fromDate(checkIn),
              checkOut: Timestamp.fromDate(checkOut),
              workHours,
              isManualEntry: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          );
        });
      });
    };

    // Last 6 working days (recent, always relative to "today")
    const recentDays: Date[] = [];
    for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
      const day = new Date();
      day.setDate(day.getDate() - dayOffset);
      day.setHours(0, 0, 0, 0);
      recentDays.push(day);
    }
    seedAttendanceForDays(recentDays);

    // Full calendar months — helper to build every day in a given month
    const daysInMonth = (year: number, month: number /* 1-12 */): Date[] => {
      const result: Date[] = [];
      const daysCount = new Date(year, month, 0).getDate();
      for (let d = 1; d <= daysCount; d++) {
        const day = new Date(year, month - 1, d);
        day.setHours(0, 0, 0, 0);
        if (day.getTime() < Date.now()) result.push(day);
      }
      return result;
    };

    seedAttendanceForDays(daysInMonth(2026, 5)); // May 2026
    seedAttendanceForDays(daysInMonth(2026, 6)); // June 2026

    await Promise.all(attendanceWrites);

    return true;
  } catch (error) {
    console.error('Failed to seed demo data:', error);
    return false;
  }
};
