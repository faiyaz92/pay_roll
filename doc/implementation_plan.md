# Implementation Plan: Production-Ready GCC HR & Payroll Management MVP (Multi-Tenant)

## 🎯 Executive Overview & BA Vision

This document serves as the complete **Business Analyst (BA) Blueprint and Technical Implementation Plan** to convert the current codebase into an impressive, client-ready, multi-tenant **GCC HR & Payroll Management System (Payrole)**.

---

## 🔑 Demo Access Credentials (Ready for Client Presentation)

| Role | Username / Email | Password | Access Level & Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `super.admin@payrole.app` | `SuperAdmin@123` | Create & manage companies, view platform stats |
| **Company Admin (Demo Co.)** | `admin@alhilal.ae` | `DemoAdmin@123` | Full HR & Payroll control for "Al Hilal Enterprises LLC (Dubai)" |
| **HR Manager** | `hr@alhilal.ae` | `HRManager@123` | Employee onboarding, attendance approval, payroll run, WPS export |
| **Employee** | `employee@alhilal.ae` | `EmpUser@123` | Self-service portal: view payslips, attendance log, leave balance |

---

## 📝 GRANULAR MASTER TASK LIST (Step-by-Step Checklist)

Below is the complete step-by-step execution task list.

### Phase 1: Multi-Tenant & Super Admin Portal Setup
- [x] **Task 1.1**: Update `src/types/user.ts` to add `Role.SUPER_ADMIN` and `TenantCompany` management interface.
- [x] **Task 1.2**: Update `src/lib/roleRoutes.ts` to add `/super-admin/dashboard` mapping for Super Admin.
- [x] **Task 1.3**: Create `src/useCases/superAdminUseCases.ts` with functions: `createTenantCompany()`, `getAllCompanies()`, and `toggleCompanyStatus()`.
- [x] **Task 1.4**: Create `src/pages/SuperAdminDashboard.tsx` with Company Creation Wizard (Company Name, Country, Currency, Trade License, Admin Email, Password).
- [x] **Task 1.5**: Register `/super-admin/dashboard` route in `src/App.tsx` with `ProtectedRoute`.

### Phase 2: Turnkey Demo Data Seeder
- [x] **Task 2.1**: Create `src/lib/demoDataSeeder.ts` to automatically populate Firebase Firestore with pre-configured demo data:
  - Tenant Company: "Al Hilal Enterprises LLC (Dubai)"
  - Demo Users: Super Admin, Company Admin (`admin@alhilal.ae`), HR Manager (`hr@alhilal.ae`), Employee (`employee@alhilal.ae`).
  - Sample Employees: 5 full employee profiles with Basic Salary, HRA, Transport, Mobile Allowances, IBAN, Emirates ID, Passport #.
  - Sample Attendance: 30 days of attendance logs with present, overtime, and half-day records.
- [x] **Task 2.2**: Add a "Seed Demo Data" button/trigger in Super Admin Portal for easy 1-click re-seeding.

### Phase 3: Core Payroll Processing Engine
- [x] **Task 3.1**: Create `src/useCases/payrollUseCases.ts` with functions:
  - `calculateMonthlyPayroll(companyId, month, year)`: Aggregates Basic + Allowances + Overtime Pay - Unpaid Leave Deductions.
  - `savePayrollCycle(payrollData)`: Persists processed cycle in Firestore `payroll_cycles` & `payroll_components` collections.
  - `getPayrollHistory(companyId)`: Fetches past locked payroll cycles.
- [x] **Task 3.2**: Create `src/pages/PayrollCycleRun.tsx` (Monthly Payroll Wizard):
  - Month/Year selector (e.g., July 2026).
  - Summary metrics card: Total Gross Pay, Total Allowances, Total Deductions, Total Net Payout (AED).
  - Detailed Employee Table showing Basic, HRA, Transport, Overtime, Deductions, and Net Pay.
  - "Lock & Process Payroll" action button.
- [x] **Task 3.3**: Create `src/pages/PayrollHistory.tsx` to list past payroll cycles with status badges and download options.
- [x] **Task 3.4**: Register `/hr/payroll/run` and `/hr/payroll/history` in `src/App.tsx`.

### Phase 4: WPS (Wage Protection System) Generator
- [x] **Task 4.1**: Create `src/useCases/wpsUseCases.ts` with functions:
  - `validateWPSData(payrollComponents)`: Validates 23-digit UAE IBAN, Labour Card #, Employer EIDA.
  - `generateSIFFileContent(payrollCycle)`: Formats data into UAE MOHRE / Central Bank standard `.sif` file string.
- [x] **Task 4.2**: Create `src/pages/WPSExport.tsx`:
  - Country selection dropdown (UAE / Saudi Arabia / Kuwait / Qatar / Oman / Bahrain).
  - Compliance Validation Checklist (Green checkmarks for valid IBANs and Labour Card #s).
  - "Generate & Download .SIF File" button.
- [x] **Task 4.3**: Register `/hr/payroll/wps` route in `src/App.tsx`.

### Phase 5: Interactive Salary Slip (Payslip) PDF & Center
- [x] **Task 5.1**: Create `src/pages/SalarySlips.tsx`:
  - Employee selector or auto-filter for logged-in employee.
  - Professional Payslip Card with Company Header, Logo, Employee Info, Earnings Column, Deductions Column, and Net Salary Badge.
  - Browser Print / Download PDF capability.
- [x] **Task 5.2**: Register `/hr/payroll/slips` route in `src/App.tsx`.

### Phase 6: Leave Management & Approval Workflow
- [x] **Task 6.1**: Create `src/useCases/leaveUseCases.ts` with functions: `submitLeaveRequest()`, `getLeaveBalances()`, `approveLeaveRequest()`, `rejectLeaveRequest()`.
- [x] **Task 6.2**: Create `src/pages/LeaveManagement.tsx`:
  - Leave Balance Cards (Annual Leave, Sick Leave, Emergency Leave).
  - Apply for Leave Modal/Form.
  - HR Approval/Rejection table with status updates.
- [x] **Task 6.3**: Register `/hr/leave` route in `src/App.tsx`.

### Phase 7: GCC Gratuity (End-of-Service Benefit) Calculator
- [x] **Task 7.1**: Create `src/pages/GratuityCalculator.tsx`:
  - Interactive calculator for UAE Labor Law End-of-Service benefit.
  - Inputs: Resignation vs Termination, Limited vs Unlimited Contract, Basic Salary, Joining Date, Last Working Date.
  - Formula: 21 days basic salary per year (Years 1-5), 30 days basic salary per year (Years 5+).
  - Breakdown breakdown card showing calculated Gratuity Amount in AED.
- [x] **Task 7.2**: Register `/hr/gratuity` route in `src/App.tsx`.

---

## 🛠️ Summary of Created Components

| File Path | Status | Purpose |
| :--- | :--- | :--- |
| `src/types/user.ts` | **[COMPLETED]** | Added `Role.SUPER_ADMIN` and Tenant types |
| `src/lib/roleRoutes.ts` | **[COMPLETED]** | Added Super Admin route mapping |
| `src/App.tsx` | **[COMPLETED]** | Registered all 7 new routes for Payroll, WPS, Slips, Leave, Gratuity, Super Admin |
| `src/useCases/superAdminUseCases.ts` | **[COMPLETED]** | Tenant Company CRUD logic |
| `src/useCases/payrollUseCases.ts` | **[COMPLETED]** | Monthly Payroll engine logic |
| `src/useCases/wpsUseCases.ts` | **[COMPLETED]** | SIF file generator logic |
| `src/useCases/leaveUseCases.ts` | **[COMPLETED]** | Leave management logic |
| `src/lib/demoDataSeeder.ts` | **[COMPLETED]** | 1-Click Demo Data Seeder |
| `src/pages/SuperAdminDashboard.tsx` | **[COMPLETED]** | Super Admin Portal UI |
| `src/pages/PayrollCycleRun.tsx` | **[COMPLETED]** | Monthly Payroll Wizard UI |
| `src/pages/WPSExport.tsx` | **[COMPLETED]** | WPS SIF File Generator UI |
| `src/pages/SalarySlips.tsx` | **[COMPLETED]** | Payslip Viewer & PDF UI |
| `src/pages/LeaveManagement.tsx` | **[COMPLETED]** | Leave Management UI |
| `src/pages/GratuityCalculator.tsx` | **[COMPLETED]** | GCC Gratuity Calculator UI |

---

## 🧪 Verification Results

- TypeScript build (`npx tsc --noEmit`): **0 Errors**
- Routes registered & protected with Firebase Role Auth.
