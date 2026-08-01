/**
 * Wage Protection System (WPS) Use Cases
 * Handles GCC SIF (Standard Information Format) File Generation & Validation
 * per BRD Section 4.8 & Database-Info-v1.md Section 9
 */

import type { PayrollCycleRecord, PayrollComponentRecord } from './payrollUseCases';

export interface WPSValidationItem {
  employeeId: string;
  employeeName: string;
  iban: string;
  labourCardNumber: string;
  status: 'valid' | 'invalid';
  issues: string[];
}

export interface WPSValidationReport {
  totalEmployees: number;
  validEmployeesCount: number;
  invalidEmployeesCount: number;
  totalAmount: number;
  canExport: boolean;
  items: WPSValidationItem[];
}

/**
 * Validate WPS Payroll Data before SIF file export
 */
export const validateWPSData = (cycle: PayrollCycleRecord): WPSValidationReport => {
  const items: WPSValidationItem[] = cycle.components.map((comp) => {
    const issues: string[] = [];

    // IBAN check (UAE IBAN length = 23 characters)
    if (!comp.iban || comp.iban.trim().length < 15) {
      issues.push('Invalid or missing IBAN account number');
    }

    if (comp.netPay <= 0) {
      issues.push('Net pay must be greater than 0');
    }

    const labourCardNumber = '73948291048'; // Sample Labour Card

    return {
      employeeId: comp.employeeId,
      employeeName: comp.employeeName,
      iban: comp.iban || 'N/A',
      labourCardNumber,
      status: issues.length === 0 ? 'valid' : 'invalid',
      issues,
    };
  });

  const validCount = items.filter((i) => i.status === 'valid').length;

  return {
    totalEmployees: items.length,
    validEmployeesCount: validCount,
    invalidEmployeesCount: items.length - validCount,
    totalAmount: cycle.totalNet,
    canExport: validCount === items.length,
    items,
  };
};

/**
 * Generate UAE Central Bank / MOHRE SIF (Standard Information Format) File Content
 */
export const generateWPSSifContent = (
  companyEmployerId: string,
  cycle: PayrollCycleRecord,
  bankRoutingCode: string = 'UAEBANK001'
): string => {
  const creationDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const creationTime = new Date().toTimeString().slice(0, 5).replace(':', '');

  // Header Record (EDR - Employer Data Record)
  // Format: EDR, Employer ID, Bank Routing Code, Creation Date, Creation Time, File Reference, Salary Month/Year, Total Employees, Total Amount, Currency
  const headerRecord = `EDR,${companyEmployerId},${bankRoutingCode},${creationDate},${creationTime},PAY${cycle.year}${cycle.month},${cycle.month}${cycle.year},${cycle.totalEmployees},${cycle.totalNet.toFixed(2)},${cycle.currency}`;

  // Employee Detail Records (SCR - Salary Control Record)
  // Format: SCR, Employee ID, Bank Routing Code, IBAN, Start Date, End Date, Fixed Pay, Variable Pay, Unpaid Days
  const detailRecords = cycle.components.map((comp) => {
    const fixedPay = (comp.earnings.basic + comp.earnings.hra + comp.earnings.transportation).toFixed(2);
    const variablePay = (comp.earnings.overtime + comp.earnings.mobile + comp.earnings.utilities).toFixed(2);
    const startDate = `01${String(cycle.month).padStart(2, '0')}${cycle.year}`;
    const endDate = `30${String(cycle.month).padStart(2, '0')}${cycle.year}`;

    return `SCR,${comp.employeeId},${bankRoutingCode},${comp.iban},${startDate},${endDate},${fixedPay},${variablePay},${comp.unpaidDays}`;
  });

  return [headerRecord, ...detailRecords].join('\n');
};
