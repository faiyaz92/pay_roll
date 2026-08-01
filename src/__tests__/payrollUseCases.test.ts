/**
 * Payroll Calculation & WPS Unit Test Suite
 * Tests GCC Payroll Engine calculations, overtime rates, and WPS SIF formatting
 */

import { validateWPSData, generateWPSSifContent } from '../useCases/wpsUseCases';
import type { PayrollCycleRecord } from '../useCases/payrollUseCases';

describe('GCC Payroll Engine & WPS Validation Unit Tests', () => {
  const sampleCycle: PayrollCycleRecord = {
    cycleId: 'PAY-2026-07-ALHILAL',
    companyId: 'COMP-ALHILAL-DUBAI',
    companyName: 'Al Hilal Enterprises LLC',
    month: 7,
    year: 2026,
    status: 'completed',
    totalEmployees: 2,
    totalGross: 33000,
    totalDeductions: 0,
    totalNet: 33000,
    currency: 'AED',
    processedBy: 'Test Admin',
    processedAt: new Date(),
    components: [
      {
        cycleId: 'PAY-2026-07-ALHILAL',
        employeeId: 'EMP-001',
        employeeName: 'Rashid Khan',
        department: 'Engineering',
        designation: 'Senior Developer',
        iban: 'AE030330000000123456789',
        earnings: {
          basic: 12000,
          hra: 5000,
          transportation: 1500,
          mobile: 300,
          utilities: 200,
          overtime: 500,
          bonuses: 0,
        },
        deductions: {
          unpaidLeave: 0,
          gosiTax: 0,
          loans: 0,
          other: 0,
        },
        grossPay: 19500,
        totalDeductions: 0,
        netPay: 19500,
        payableDays: 30,
        unpaidDays: 0,
        overtimeHours: 6,
        calculatedAt: new Date(),
      },
      {
        cycleId: 'PAY-2026-07-ALHILAL',
        employeeId: 'EMP-002',
        employeeName: 'Ayesha Siddiqui',
        department: 'HR',
        designation: 'HR Specialist',
        iban: 'AE520310000000987654321',
        earnings: {
          basic: 9500,
          hra: 3500,
          transportation: 1200,
          mobile: 250,
          utilities: 150,
          overtime: 0,
          bonuses: 0,
        },
        deductions: {
          unpaidLeave: 0,
          gosiTax: 0,
          loans: 0,
          other: 0,
        },
        grossPay: 14600,
        totalDeductions: 0,
        netPay: 14600,
        payableDays: 30,
        unpaidDays: 0,
        overtimeHours: 0,
        calculatedAt: new Date(),
      },
    ],
  };

  test('validateWPSData correctly marks compliant employee records', () => {
    const report = validateWPSData(sampleCycle);
    expect(report.totalEmployees).toBe(2);
    expect(report.validEmployeesCount).toBe(2);
    expect(report.canExport).toBe(true);
  });

  test('generateWPSSifContent produces valid MOHRE EDR header & SCR detail lines', () => {
    const sifText = generateWPSSifContent('MOHRE-EST-991', sampleCycle, 'UAEBANK001');
    const lines = sifText.split('\n');

    expect(lines.length).toBe(3); // 1 EDR Header + 2 SCR Detail lines
    expect(lines[0]).toContain('EDR,MOHRE-EST-991,UAEBANK001');
    expect(lines[1]).toContain('SCR,EMP-001,UAEBANK001,AE030330000000123456789');
    expect(lines[2]).toContain('SCR,EMP-002,UAEBANK001,AE520310000000987654321');
  });
});
