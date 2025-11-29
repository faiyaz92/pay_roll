# Payrole HR Management System - Business Requirements Document (BRD)

**Version:** 1.1  
**Date:** November 29, 2025  
**Author:** Payrole Development Team  
**Status:** Draft - GCC Payroll Expansion with RTL & Bilingual Support

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Business Objectives](#2-business-objectives)
3. [Solution Scope & Personas](#3-solution-scope--personas)
4. [Functional Requirements](#4-functional-requirements)
5. [Screen & UX Inventory](#5-screen--ux-inventory)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Compliance & Regional Considerations](#7-compliance--regional-considerations)
8. [Dependencies & Risks](#8-dependencies--risks)
9. [Acceptance Criteria & KPIs](#9-acceptance-criteria--kpis)
10. [Version History & Next Steps](#10-version-history--next-steps)

---

## 1. Executive Summary
Version 1.1 expands Payrole from an authentication-only foundation into a comprehensive GCC-compliant payroll platform with mobile attendance capabilities and full RTL (Right-to-Left) bilingual support (English/Arabic). The release introduces multi-role onboarding (Company Admin, HR, Employee), employee master data management with allowance structures, GPS-enabled daily attendance capture with geo-fencing, multi-office support, leave policy automation, monthly payroll calculation linked to attendance, gratuity tracking, salary slip generation, and Wage Protection System (WPS) file export with pre-disbursement review.

**Key Features:**
- **RTL & Bilingual UI**: All screens support Right-to-Left layout and bilingual text (English/Arabic) from the start, ensuring seamless user experience across GCC markets.
- **Mobile App**: Native mobile application for employees to mark attendance with GPS validation
- **Geo-fencing**: 100m radius validation for office-based attendance marking
- **Multi-office Support**: Companies can manage multiple office locations with coordinates
- **GCC Compliance**: Full compliance with UAE/Saudi labor laws and WPS requirements
- **Multi-region Ready**: Architecture supports easy adaptation for other GCC countries

**Related Technical Documentation:** Technical-Doc-v1.md Section 1  
**Related Database Information:** Database-Info-v1.md Section 1  
**Related Checklist:** Checklist-v1.md All Tasks

## 2. Business Objectives
- Enable Company Admins to self-manage HR staff via Firebase-authenticated accounts and configure multiple office locations with GPS coordinates.
- Provide HR with a streamlined workflow to add employees (login credentials + payroll metadata + office assignment) with minimal duplication.
- Automate attendance, leave, and payroll calculations with GPS-validated mobile check-ins to minimize compliance risk and manual spreadsheets.
- Support GCC-specific payroll components (basic salary, HRA, transportation, mobile, other allowances, deductions, gratuity accrual) and banking data required for WPS uploads.
- Guarantee WPS files pass UAE/Saudi compliance validation without fines by enforcing required fields and review workflows.
- Offer transparent salary slip storage plus audit-ready logs for regulators and finance auditors.
- Provide employees with mobile app access for self-service attendance marking, leave requests, and salary slip access.
- Ensure geo-fencing compliance where employees must be within 100m of assigned office for valid attendance marking.

**Related Technical Documentation:** Technical-Doc-v1.md Section 1  
**Related Database Information:** Database-Info-v1.md Section 1

## 3. Solution Scope & Personas
### 3.1 Roles & Capabilities
| Role | Description | Key Capabilities |
|------|-------------|------------------|
| Company Admin | Owner/finance lead | Create HR accounts, manage company-wide policies, approve payroll & WPS batches |
| HR Manager | Payroll & HR operations | Manage employees, attendance, leave, payroll cycles, salary slips |
| Employee | Staff member | View profile, attendance history, leave balance, salary slips |

**Role Rules:** Company Admin and HR share functional scope, but only Company Admin can invite additional HR accounts (via Firebase Auth). Employees do not have creation privileges.

### 3.2 In/Out of Scope (v1)
**In scope:** Employee onboarding, multi-office management, GPS-enabled attendance with geo-fencing, mobile app for employees, leave policy automation, payroll calculation, gratuity tracking, WPS compliance, salary slips, policy management, auditing.  
**Out of scope:** Performance reviews, training, recruitment, expense management, advanced biometrics (planned for future releases).

**Related Technical Documentation:** Technical-Doc-v1.md Section 1  
**Related Database Information:** Database-Info-v1.md Section 1

## 4. Functional Requirements
### 4.1 Role & Account Management
- **FR-1.1:** Company Admin can create HR users by supplying name, email, temporary password → stored in Firebase Auth + `/users` collection with `role = 'hr_manager'`.
- **FR-1.2:** HR can invite employees by entering email/password + payroll metadata; system creates Firebase Auth login (role: `employee`) and Firestore employee profile in one step.
- **FR-1.3:** Login flow uses existing Firebase Auth in Login.tsx; roles retrieved from Firestore to direct routing (unchanged from v1 but extended to new roles).

**Related Technical Documentation:** Technical-Doc-v1.md Section 2  
**Related Database Information:** Database-Info-v1.md Section 2

### 4.2 Employee Master Data (GCC Payroll Fields)
- **FR-1.4:** Employee profile stores complete identity, job, and payroll information including: personal details (name, date of birth, gender, nationality, marital status, dependents), employment details (department, designation, grade/level, cost center, work location, contract type, start date, probation dates, visa status, passport expiry, Emirates ID), and payroll components (basic salary, HRA, transportation, mobile, utilities, other allowances, overtime rate), deductions (GOSI, loans, fines, unpaid leaves), and gratuity eligibility with configurable years-of-service threshold.
- **FR-1.5:** Banking data: bank name, branch, IBAN, Swift Code, account number, bank routing code to satisfy WPS schema and enable direct bank transfers.
- **FR-1.6:** Employment info: contract type (limited/unlimited), start date, probation dates, visa status, passport expiry, Emirates ID, assigned office location, emergency contact details, and previous employment history.
- **FR-1.7:** Tax and compliance data: Tax ID, Social Security Number (GOSI), work permit details, and compliance documentation storage.

**Related Technical Documentation:** Technical-Doc-v1.md Section 3  
**Related Database Information:** Database-Info-v1.md Section 3

### 4.3 Office Management
- **FR-1.7:** Company Admin/HR can create, edit, and delete office locations with GPS coordinates (latitude/longitude), office name, address, and radius settings (default 100m).
- **FR-1.8:** Office hierarchy: Support for head office, branch offices, and remote work locations with different attendance rules.
- **FR-1.9:** Office-based policies: Different leave policies, working hours, and holidays can be configured per office location.
- **FR-1.10:** Employee office assignment: Each employee is assigned to a primary office for attendance validation and reporting.

**Related Technical Documentation:** Technical-Doc-v1.md Section 4  
**Related Database Information:** Database-Info-v1.md Section 4

### 4.4 Mobile App & Geo-fencing
- **FR-1.11:** Native mobile application (iOS/Android) for employees to mark attendance with GPS location validation.
- **FR-1.12:** Geo-fencing validation: Employees must be within 100m radius of assigned office coordinates for valid check-in/check-out.
- **FR-1.13:** Mobile check-in/out: Morning check-in and evening check-out with automatic timestamp capture and GPS coordinates logging.
- **FR-1.14:** Offline capability: Mobile app stores attendance data locally and syncs when network is available.
- **FR-1.15:** Location spoofing prevention: GPS validation with accuracy checks and timestamp verification to prevent fake attendance.
- **FR-1.16:** Mobile notifications: Push notifications for check-in reminders, check-out reminders, and attendance status updates.

**Related Technical Documentation:** Technical-Doc-v1.md Section 5  
**Related Database Information:** Database-Info-v1.md Section 5

### 4.5 Attendance Tracking
- **FR-1.17:** HR can record daily attendance per employee with comprehensive statuses: Present, Absent, Half Day, On Leave, Remote Work, Holiday, Sick Leave, Maternity Leave, Emergency Leave, Late Arrival, Early Departure, and Overtime.
- **FR-1.18:** Detailed time tracking: Clock-in/out timestamps, break times, total working hours, overtime hours (regular/weekend/public holiday), late minutes, early departure minutes, and shift compliance (GCC standard 8-9 hours/day).
- **FR-1.19:** Attendance history views: HR can view current month, previous months, and custom date ranges for each employee with daily breakdown, weekly summaries, and monthly totals.
- **FR-1.20:** Attendance analytics: Present days, absent days, half days, late arrivals, early departures, overtime hours, leave utilization, and working hour compliance percentages per employee and department.
- **FR-1.21:** GCC compliance features: Working hour validation (48 hours/week maximum), overtime calculation (1.25x for regular, 1.5x for Friday/weekend, 2x for public holidays), Ramadan shift adjustments, and public holiday tracking.
- **FR-1.22:** Bulk operations: Bulk attendance marking for holidays/public events, bulk adjustments for company-wide policies, and CSV import/export for attendance data migration.
- **FR-1.23:** Attendance notifications: Automated alerts for consecutive absences, excessive late arrivals, overtime thresholds, and leave balance warnings integrated with payroll impact.
- **FR-1.24:** GPS attendance validation: Web interface shows GPS coordinates, accuracy, and validation status for mobile check-ins.
- **FR-1.25:** Comp-off (compensatory off) management: Employees can earn comp-off for working on holidays/weekends with automatic tracking, approval workflow, and utilization against leave balances.
- **FR-1.26:** Attendance regularization: Employees can request attendance corrections with reason and approval workflow for missed punches or incorrect entries.
- **FR-1.27:** Shift management: Multiple shifts per day, shift rotation schedules, shift assignments, and shift-wise attendance tracking with compliance validation.

**Related Technical Documentation:** Technical-Doc-v1.md Section 6  
**Related Database Information:** Database-Info-v1.md Section 6

### 4.6 Leave & Policy Automation
- **FR-1.25:** Leave types: PL/EL (earned/privilege), SL (sick), CL (casual), maternity, paternity, adoption, bereavement, marriage, Hajj, emergency, half-day leave, leave without pay (LWP), and comp-off (compensatory off) with balances per employee including opening balance, accrued, used, and carried forward amounts.
- **FR-1.26:** Quarterly accrual automation: On HR action, system checks if quarter changed and applies company policy entitlements to each employee with automatic balance updates and notification triggers.
- **FR-1.27:** Leave deductions: On approval, system reduces respective leave balance; if insufficient, converts remainder to unpaid leave impacting payroll with detailed transaction logging and LWP tracking.
- **FR-1.28:** HR can define default yearly entitlement per leave type and override per employee with balance recalculation and policy inheritance rules.
- **FR-1.29:** Advance leave support: Employees can request leave before accrual (negative balances allowed up to configurable limits) with automatic payroll deductions for unpaid portion and advance recovery tracking.
- **FR-1.30:** Leave balance history: Complete audit trail of all balance changes (accruals, usage, adjustments, transfers, expirations, lapses) with timestamps, reasons, and approval references.
- **FR-1.31:** Leave balance adjustments: HR can manually adjust leave balances with dual approval workflow and audit logging for corrections or policy changes.
- **FR-1.32:** Leave balance forecasting: System calculates future balance projections based on accrual rates, planned usage, and expiry rules with visual forecasting charts.
- **FR-1.33:** Leave balance transfers: HR can transfer balances between leave types (e.g., unused sick leave to annual leave) with approval workflow and business rule validation.
- **FR-1.34:** Leave balance expiration: Automatic expiry of annual leave balances after configurable periods (GCC standard: unused leave expires after 2 years) with notifications and grace period handling.
- **FR-1.35:** Leave balance alerts: Automated notifications for low balances, upcoming expirations, negative balance warnings, and policy compliance alerts.
- **FR-1.36:** Leave lapse configuration: HR can configure which leave types carry forward (EL/PL, SL) vs lapse at year-end (CL, special leaves) with configurable lapse periods and carry-forward limits.
- **FR-1.37:** Year-end leave lapse processing: Single button for HR to lapse all non-carry-forward leave balances at year-end with bulk processing, notifications to employees, and audit logging.
- **FR-1.38:** Leave lapse notifications: Automatic notifications to employees 30 days before lapse date and confirmation notifications when leaves are lapsed with detailed breakdown.
- **FR-1.39:** Leave lapse reporting: Detailed reports showing lapsed leave amounts per employee, total lapsed days, financial impact analysis, and compliance tracking.
- **FR-1.40:** Leave encashment: Employees can request encashment of unused leave balances (up to limits) with tax implications and payroll integration.
- **FR-1.41:** Leave approval workflows: Multi-level approval process with configurable approvers, escalation rules, and approval delegation during absences.

**Related Technical Documentation:** Technical-Doc-v1.md Section 7  
**Related Database Information:** Database-Info-v1.md Section 7

### 4.7 Payroll Calculation Engine
- **FR-1.40:** Monthly payroll cycle reads attendance to calculate payable days, unpaid leave deductions, overtime (regular/weekend/holiday rates), bonuses, other payables, and GCC-compliant deductions including GOSI contributions, income tax calculations, and Zakat processing.
- **FR-1.41:** Tax calculation engine: Automatic calculation of income tax based on UAE/Saudi tax brackets, Zakat calculation for Saudi employees, and tax exemptions processing with annual tax optimization.
- **FR-1.42:** Payroll preview allows HR to adjust bonuses/allowances per employee before lock-in with cost impact analysis and budget validation.
- **FR-1.43:** Salary components align to GCC breakdown: Basic (>=60% of total), allowances (HRA, transport, utilities, mobile, LTA, medical, special), deductions (GOSI/social security, income tax, Zakat, loans, fines, unpaid leaves, late penalties, professional tax), employer contributions, and statutory benefits.
- **FR-1.44:** Gratuity accrual based on tenure and configurable formula (default UAE: 21 days basic salary per year for first 5 years, 30 days beyond; Saudi: 15 days per year). System tracks eligibility, projections, and payable amount at exit with full audit trail.
- **FR-1.45:** Arrears and pay revisions: Support for retroactive pay adjustments, annual increments, promotions, and arrears calculations with automatic payroll regeneration.
- **FR-1.46:** Provident fund and savings schemes: Optional PF contributions, employee voluntary savings, and employer matching programs with regulatory compliance.

**Related Technical Documentation:** Technical-Doc-v1.md Section 8  
**Related Database Information:** Database-Info-v1.md Section 8

### 4.8 WPS (Wage Protection System) File Generation
- **FR-1.47:** System generates country-specific WPS files based on selected GCC country (UAE, Saudi Arabia, Kuwait, Bahrain, Qatar, Oman) with validation for mandatory fields and format compliance for each country's labor ministry requirements.
- **FR-1.48:** Country selection: HR can select target country during payroll cycle to generate appropriate WPS format (UAE: MOHRE SIF 2.0, Saudi: MOL format, Kuwait: PACI format, Bahrain: LMRA format, Qatar: MME format, Oman: MOM format).
- **FR-1.49:** Multi-country compliance validation: Automatic validation against each country's specific WPS format specifications, mandatory field requirements, and regulatory compliance rules.
- **FR-1.50:** Pre-generation preview summarizes totals and flags missing data with country-specific compliance warnings and data completeness checks.
- **FR-1.51:** HR can add last-minute adjustments (bonuses, allowances, reimbursements) before locking WPS batch with approval workflow.
- **FR-1.52:** Post-generation, WPS batch stored with status (Draft, Ready, Submitted, Approved, Rejected) and audit log with submission tracking and amendment support.
- **FR-1.53:** WPS amendment process: Support for correcting submitted WPS files with amendment workflows and regulatory compliance tracking per country.
- **FR-1.54:** Bank integration: Direct API integration with GCC banks for WPS file submission and status tracking with automated reconciliation.
- **FR-1.55:** Country-specific validation: Automatic validation against each country's labor ministry WPS format specifications, mandatory field checks, and format compliance verification before submission.

**Related Technical Documentation:** Technical-Doc-v1.md Section 9  
**Related Database Information:** Database-Info-v1.md Section 9

### 4.9 Salary Slip & Document Management
- **FR-1.37:** Salary slips auto-generated per employee with breakdown (earnings/deductions, attendance summary, leave usage, overtime details) and accessible to employees via portal.
- **FR-1.38:** HR can upload attachments (bonus letters) stored in Storage bucket `payrole-storage/payroll-documents` referencing slip.

**Related Technical Documentation:** Technical-Doc-v1.md Section 10  
**Related Database Information:** Database-Info-v1.md Section 10

### 4.11 Reporting & Auditing
- **FR-1.46:** Daily Attendance Report: Real-time view of today's attendance with clock-in/out times, late arrivals, and absent employees.
- **FR-1.47:** Monthly Attendance Summary: Present days, absent days, half days, late arrivals, overtime hours, and leave utilization per employee.
- **FR-1.48:** Attendance Analytics Dashboard: Department-wise attendance compliance, trends over time, and GCC compliance metrics (working hours, overtime limits).
- **FR-1.49:** Leave Balance Statement: Comprehensive report showing opening balance, accrued, used, carried forward, and current balance for each leave type per employee.
- **FR-1.50:** Leave Balance History Report: Detailed transaction history of all leave balance changes with dates, amounts, and reasons.
- **FR-1.51:** Leave Utilization Report: Analysis of leave usage patterns, average balances, and forecasting reports.
- **FR-1.52:** Negative Leave Balance Report: Employees with negative balances, advance leave usage, and unpaid leave impact on payroll.
- **FR-1.53:** Leave Expiry Report: Upcoming leave expirations and employees affected by balance expiry rules.
- **FR-1.54:** Leave Lapse Report: Year-end lapse processing summary showing lapsed leave amounts, affected employees, and total days lapsed per leave type.
- **FR-1.55:** Payroll variance report comparing previous month totals and highlighting significant changes.
- **FR-1.56:** Overtime Report: Detailed breakdown of regular overtime, weekend overtime, and public holiday overtime with cost impact.
- **FR-1.57:** Audit log for critical actions (user creation, payroll lock, WPS export, attendance modifications, leave adjustments, leave lapse processing) referencing `/audit_logs`.
- **FR-1.58:** Custom report builder: Drag-and-drop interface for creating custom reports with advanced filters, calculated fields, and scheduling options.
- **FR-1.59:** Advanced analytics dashboard: Interactive charts, trend analysis, predictive analytics, and benchmarking against industry standards.
- **FR-1.60:** MIS reports: Management Information System reports for executive decision-making with automated distribution and archival.
- **FR-1.61:** Data export capabilities: Export all reports to Excel, PDF, CSV formats with custom formatting and branding options.

**Related Technical Documentation:** Technical-Doc-v1.md Section 11  
**Related Database Information:** Database-Info-v1.md Section 11

### 4.12 Localization & Internationalization
- **FR-1.62:** All screens must support Right-to-Left (RTL) layout for Arabic language users, with automatic layout flipping based on selected language.
- **FR-1.63:** Bilingual support: Every screen displays text in both English and Arabic, with language toggle available in user settings and header.
- **FR-1.64:** Language persistence: User's language preference (English/Arabic) is stored in user profile and persists across sessions.
- **FR-1.65:** RTL-compliant components: All UI components (forms, tables, navigation, modals) must render correctly in RTL mode without layout breaks.
- **FR-1.66:** Arabic text support: Full Unicode support for Arabic characters, including proper text direction, ligatures, and diacritics.
- **FR-1.67:** Date and number formatting: Automatic formatting based on selected language (Gregorian/Islamic calendar options, Arabic numerals vs Western numerals).
- **FR-1.68:** Currency display: Support for AED/SAR with proper Arabic formatting and RTL alignment.
- **FR-1.69:** Mobile app localization: Native mobile apps must support RTL layout and Arabic text on iOS and Android platforms.
- **FR-1.70:** Translation management: Centralized translation keys for all UI text, with support for adding additional languages in future releases.
- **FR-1.71:** RTL testing: All screens must be tested in both LTR and RTL modes to ensure proper layout and functionality.

**Related Technical Documentation:** Technical-Doc-v1.md Section 12  
**Related Database Information:** Database-Info-v1.md Section 12

## 5. Screen & UX Inventory
**Note:** All screens listed below must support RTL (Right-to-Left) layout for Arabic users and display bilingual text (English/Arabic) with language toggle functionality. Every screen is affected by localization requirements.

| Screen / Flow | Description | Primary Role |
|---------------|-------------|--------------|
| 1. Login & Authentication | Firebase Auth login with role-based routing, password reset, and multi-factor authentication setup. | All Users |
| 2. Company Setup Wizard | Initial company onboarding: company details, bank information, WPS identifiers, default policies, and compliance settings. | Company Admin |
| 3. Dashboard 1.0 | KPI cards: attendance compliance rate, today's attendance summary, pending leave approvals, monthly overtime costs, payroll processing status, WPS submission alerts, and GCC compliance warnings. | Admin/HR |
| 4. HR Management | List of HR users, "Invite HR" modal to create Firebase auth user, role permissions management. | Company Admin |
| 5. Office Management | Create, edit, delete office locations with GPS coordinates, radius settings, address details, and office hierarchy management. | Admin/HR |
| 6. Employee Directory | Searchable table, bulk actions, import, quick stats, department and office filtering. | HR/Admin |
| 7. Employee Profile | Tabs: Personal, Payroll, Banking, Leave, Documents, Gratuity timeline, Employment history. | HR |
| 8. Bulk Import/Export Center | Import employees, attendance data, payroll adjustments; export reports, WPS files, employee data. | HR/Admin |
| 9. Attendance Management | Comprehensive attendance system with calendar view, daily/weekly/monthly reports, employee-wise history, bulk operations, and GCC compliance tracking. Includes time tracking, overtime calculation, and attendance analytics dashboard. | HR |
| 9a. Daily Attendance View | Real-time attendance marking with clock-in/out times, status updates, and today's summary for all employees. | HR |
| 9b. Attendance History | Employee-specific attendance history with date range filters, monthly summaries, and detailed time tracking. | HR |
| 9c. Attendance Reports | Department-wise analytics, compliance metrics, overtime reports, and attendance trends with export capabilities. | HR/Admin |
| 10. Leave Management | Pending approvals, leave balances card, policy assignment panel, leave calendar view, balance adjustments, advance leave tracking, and year-end lapse processing. | HR |
| 10a. Leave Request Form | Employee self-service interface for submitting leave requests with calendar integration and balance checking. | Employee |
| 10b. Leave Balance Management | Detailed balance view with history, adjustments, transfers, forecasting, and lapse configuration for each employee. | HR |
| 10c. Leave Balance Reports | Comprehensive balance statements, history reports, utilization analysis, expiry tracking, and lapse reports. | HR/Admin |
| 10d. Year-End Leave Lapse | Single-button interface for processing year-end leave lapse with preview, confirmation, bulk notifications, and audit logging. | HR/Admin |
| 11. Leave Policy Builder | Configure defaults per grade/employee, schedule quarterly accrual, special leave policies. | HR/Admin |
| 12. Holiday Calendar Management | Manage public holidays, company holidays, and regional calendar configurations. | Admin/HR |
| 13. Shift Management | Define work shifts, schedules, and shift assignments for employees. | HR/Admin |
| 14. Overtime Approval Workflow | Review and approve overtime requests with cost impact calculations. | HR/Admin |
| 15. Payroll Cycle Wizard | Steps: Select month → Review attendance impact → Adjust earnings/deductions → Lock cycle → Generate salary slips. | HR |
| 16. Payroll History Viewer | View past payroll cycles, adjustments, and historical salary data with comparison tools. | HR/Admin |
| 17. Gratuity Calculator | Calculate gratuity projections, view accrual history, and manage gratuity payments. | HR/Admin |
| 18. WPS Preview & Export | Validations list, adjustment fields, generate SIF file, download logs, submission tracking. | HR/Admin |
| 18a. Country Selection for WPS | Select target GCC country (UAE, Saudi Arabia, Kuwait, Bahrain, Qatar, Oman) for WPS generation with country-specific validation rules and format selection. | HR/Admin |
| 19. Bank Integration Setup | Configure bank connections, routing codes, and WPS submission credentials. | Admin |
| 20. Salary Slip Center | Grid of slips with filters, download button, "Regenerate" action, bulk email distribution. | HR/Employee |
| 21. Document Management | Upload and manage employee documents, contracts, certificates, and compliance documents. | HR/Admin |
| 22. Report Builder | Create custom reports with filters, scheduling, and automated distribution. | HR/Admin |
| 23. Audit Log Viewer | Detailed audit trail viewer with filtering, search, and export capabilities. | Admin |
| 24. Notification Center | System alerts, approval notifications, compliance warnings, and user communications. | All Users |
| 25. Employee Portal | Employee self-service: personal attendance history, monthly attendance summary, leave balance with utilization, salary slip downloads, overtime tracking, and profile management. | Employee |
| 26. Mobile App - Home | Dashboard with today's attendance status, quick check-in/out button, recent notifications, and leave balance summary. | Employee |
| 26a. Mobile Check-in/Out | GPS-validated attendance marking with location verification, timestamp capture, and office radius validation. | Employee |
| 26b. Mobile Attendance History | Employee's personal attendance records with date filters, working hours summary, and overtime tracking. | Employee |
| 26c. Mobile Leave Requests | Submit leave requests, view approval status, check leave balances, and leave calendar with balance forecasting. | Employee |
| 26d. Mobile Leave Balance | Detailed view of all leave types with current balances, accrued amounts, used amounts, and expiry dates. | Employee |
| 26e. Mobile Salary Slips | Download and view salary slips, earnings breakdown, and payment history. | Employee |
| 26f. Mobile Expense Claims | Submit expense claims with receipt upload, approval workflow, and reimbursement tracking. | Employee |
| 26g. Mobile Travel Requests | Submit travel requests, view approvals, and track travel expenses. | Employee |
| 26h. Mobile Document Upload | Upload personal documents, certificates, and compliance documents. | Employee |
| 26i. Mobile Company Announcements | View company news, policies, and important communications. | Employee |
| 26j. Mobile Team Calendar | View team leave calendar, holidays, and company events. | Employee |
| 29. Employee Exit Management | Notice period tracking, exit interviews, clearance checklist, and final settlement calculation. | HR/Admin |
| 30. Tax Management | Income tax calculation, tax exemptions, tax optimization, and annual tax reporting. | HR/Admin |
| 31. Provident Fund Management | PF contributions, employee savings, employer matching, and regulatory compliance. | HR/Admin |
| 32. Performance Management | Employee performance tracking, appraisal cycles, and compensation planning. | HR/Admin |

**Related Technical Documentation:** Technical-Doc-v1.md Section 13  
**Related Database Information:** Database-Info-v1.md Section 13

## 6. Non-Functional Requirements
- **Performance:** Payroll preview for up to 1,000 employees completes < 5s; WPS generation < 3s; report generation < 10s.
- **Security:** Firebase Auth + Firestore rules enforcing least privilege. Admin-only Cloud Function for creating HR/employee Auth accounts. Two-factor authentication, IP restrictions, session management, password policies, and data encryption at rest and in transit.
- **Scalability:** Support for 10,000+ employees with horizontal scaling, database optimization, and caching strategies.
- **Auditability:** All payroll state changes stored with user/time metadata, immutable audit logs, and compliance reporting.
- **Availability:** 99.9% uptime with automated backups, disaster recovery, and business continuity planning.
- **Localization & Internationalization:**
  - Full RTL (Right-to-Left) support for all screens and components
  - Bilingual UI (English/Arabic) with seamless language switching
  - Proper Arabic text rendering with Unicode support and diacritics
  - RTL-compliant form layouts, tables, navigation, and modals
  - Regional date formats (Gregorian/Islamic calendar options)
  - Currency formatting in AED/SAR with Arabic numerals
  - Mobile app RTL support on iOS and Android platforms
  - Centralized translation management system for easy maintenance
  - Language preference persistence across user sessions
  - RTL layout testing for all UI components

**Related Technical Documentation:** Technical-Doc-v1.md Section 14  
**Related Database Information:** Database-Info-v1.md Section 14

## 7. Compliance & Regional Considerations
- **GCC WPS Compliance:** Multi-country WPS file generation supporting all GCC countries with country-specific formats and validation rules.
- **UAE WPS:** MOHRE-approved SIF format 2.0; requires Employer Bank Routing Number, Employee Labour Card/ID, IBAN, salary period start/end with mandatory MOHRE compliance validation.
- **Saudi Arabia WPS:** MOL-approved format with employee Iqama numbers, border numbers, and Saudi-specific validation rules including GOSI integration.
- **Kuwait WPS:** PACI-approved format with Kuwaiti labor law compliance and Civil ID validation requirements.
- **Bahrain WPS:** LMRA-approved format with Bahrain labor market requirements and visa validation.
- **Qatar WPS:** MME-approved format with Qatari labor law compliance and work permit validation.
- **Oman WPS:** MOM-approved format with Omani labor ministry requirements and residency visa validation.
- GCC Attendance Standards: Maximum 48 working hours/week, overtime rates (1.25x regular, 1.5x Friday/weekend, 2x public holidays), Ramadan working hour adjustments, and public holiday compliance.
- GCC Leave Standards: Minimum 30 days annual leave, 90 days sick leave, maternity leave entitlements, and leave balance accounting requirements.
- Leave Balance Accounting: Full audit trail of accruals, usage, adjustments, expiry, and lapse with compliance reporting.
- Leave Lapse Rules: GCC standard practice where casual leave (CL) lapses annually while earned leave (EL/PL) and sick leave (SL) carry forward.
- Advance Leave Policies: Configurable limits for negative balances and unpaid leave conversion rules.
- Leave Expiry Rules: GCC standard of 2 years for unused annual leave expiry with proper notifications.
- Year-End Processing: Standardized leave lapse procedures with employee notifications and audit requirements.
- Geo-fencing Compliance: 100m radius validation for office-based attendance, GPS accuracy requirements, and location spoofing prevention.
- Mobile App Standards: Offline capability, data synchronization, push notifications, and cross-platform compatibility (iOS/Android).
- Gratuity: Configurable threshold (default 1 year) + formula per labour law.
- Leave accrual: Align with GCC labour minimums (30 days annual, 90 sick days with paid/unpaid buckets, etc.).
- Working Hour Compliance: System must track and validate adherence to GCC labour laws regarding maximum working hours, rest periods, and overtime limits.
- Multi-region Architecture: Database schema and business logic designed for easy adaptation to other GCC countries with minimal code changes.
- Data Privacy & GDPR Compliance: Employee data protection, consent management, data retention policies, and right to access/modify personal data.
- Employment Lifecycle Management: Notice periods, termination procedures, exit interviews, experience letters, and reference letter generation.
- Business Rule Engine: Configurable workflows, approval hierarchies, escalation rules, and automated business process management.
- Integration Capabilities: APIs for ERP systems, bank integrations, government portals (MOL, GOSI, PACI, LMRA, MME, MOM), and third-party HR tools.
- Country-Specific WPS Compliance: All WPS files must pass respective country's labor ministry validation standards, including mandatory field requirements, format specifications, and submission protocols to avoid penalties and ensure regulatory compliance.

**Related Technical Documentation:** Technical-Doc-v1.md Section 15  
**Related Database Information:** Database-Info-v1.md Section 15

## 8. Dependencies & Risks
- **Firebase Admin SDK:** Needed (Cloud Function) to create HR/employee Auth users securely.
- **Mobile Development:** React Native or Flutter for cross-platform mobile app development.
- **GPS/Geolocation APIs:** Device location services integration for geo-fencing validation.
- **Push Notification Services:** Firebase Cloud Messaging (FCM) for mobile notifications.
- **Offline Data Sync:** Local storage and synchronization mechanisms for offline attendance marking.
- **Bank master data:** Need store codes for UAE (Central Bank), optional integration later.
- **Compliance updates:** Labour law changes require configuration, so policy engine must be data-driven.
- **Data accuracy:** Attendance errors cascade into payroll; require validations and review workflows.
- **Location spoofing:** GPS validation must prevent fake attendance through location mocking detection.

**Related Technical Documentation:** Technical-Doc-v1.md Section 16  
**Related Database Information:** Database-Info-v1.md Section 16

## 9. Acceptance Criteria & KPIs
- 100% of employees can be onboarded with required payroll & banking fields and office assignments.
- GPS attendance validation works within 100m radius with 99.9% accuracy and prevents location spoofing.
- Mobile app check-in/out completes within 3 seconds with GPS validation and offline sync capability.
- Multi-office support allows employees to be assigned to different offices with location-based attendance rules.
- Leave balance accounting tracks opening balance, accrued, used, carried forward, and current balance with 100% accuracy.
- Advance leave requests are processed with automatic unpaid leave conversion and payroll impact calculation.
- Leave balance adjustments require dual approval and are fully auditable with transaction history.
- Leave balance forecasting predicts future balances based on accrual rates and usage patterns.
- Leave balance expiry notifications are sent 30 days in advance with automatic balance adjustments.
- Year-end leave lapse processing completes within 5 minutes for 1,000 employees with full audit trail.
- Leave lapse notifications are sent to all affected employees with detailed breakdown of lapsed amounts.
- Leave lapse configuration allows flexible setup of carry-forward vs lapse rules per leave type.
- Attendance tracking captures all GCC-required time elements (clock-in/out, breaks, overtime) with 99.9% accuracy.
- HR can view attendance history for any employee across any date range within 2 seconds.
- Daily attendance reports show real-time status for all employees with compliance indicators.
- Overtime calculations follow GCC standards (1.25x regular, 1.5x weekend, 2x public holiday) with automatic payroll integration.
- Attendance and leave flows produce accurate payable days, validated by QA test cases.
- WPS file passes synthetic validation (no missing fields, correct totals) and country-specific compliance checks for all GCC countries.
- Salary slip accessible to employee within 30 seconds of payroll lock.
- Audit log entries generated for user creation, payroll lock, WPS export, attendance modifications, leave balance adjustments, and leave lapse processing.
- Mobile app supports offline attendance marking with automatic sync when network is available.
- All screens render correctly in RTL mode with proper Arabic text alignment and layout.
- Language switching works seamlessly across all screens without page refresh.
- Arabic text displays properly with correct character shaping and diacritics.
- Date and currency formatting adapts correctly based on selected language.
- RTL layout does not break any UI components, forms, or interactive elements.

**Related Technical Documentation:** Technical-Doc-v1.md Section 17  
**Related Database Information:** Database-Info-v1.md Section 17

## 10. Version History & Next Steps
| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-11-29 | GCC payroll scope definition, attendance, leave, payroll, WPS, gratuity |
| 1.1 | 2025-11-29 | Added RTL and bilingual (English/Arabic) support for all screens |

**Next Steps:**
1. Finalize Technical design (Technical-Doc-v1.md) including i18n implementation.
2. Update Database schema (Database-Info-v1.md) for language preferences.
3. Break down tasks (Checklist-v1.md) with localization tasks.
4. Implement Firebase Admin-enabled onboarding flows.
5. Build attendance → payroll → WPS feature chain with RTL support.

**Related Technical Documentation:** Technical-Doc-v1.md Section 1  
**Related Database Information:** Database-Info-v1.md Section 1

---
**Related Documents:** Technical-Doc-v1.md, Checklist-v1.md, Database-Info-v1.md, Guidelines.md.