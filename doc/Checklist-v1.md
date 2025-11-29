# Payrole HR Management System - Implementation Checklist

**Version:** 1.0  
**Date:** November 29, 2025  
**Author:** Payrole Development Team  
**Status:** Planned - GCC Payroll Expansion

## Table of Contents
1. [User & Role Management](#1-user--role-management)
2. [Employee Master Data](#2-employee-master-data)
3. [Attendance Module](#3-attendance-module)
4. [Leave Management & Policies](#4-leave-management--policies)
5. [Payroll & Gratuity Engine](#5-payroll--gratuity-engine)
6. [WPS & Salary Slips](#6-wps--salary-slips)
7. [Testing & Compliance QA](#7-testing--compliance-qa)
8. [Deployment & Change Management](#8-deployment--change-management)
9. [Version History](#9-version-history)

Legend: ☐ Not Started | ☐⚙ In Progress | ☑ Done

---

## 1. User & Role Management
**Related BRD:** BRD-v1 Section 4.1  
**Related Technical Doc:** Technical-Doc-v1 Section 2  
**Priority:** High

| Task ID | Task | Status | Notes |
|---------|------|--------|-------|
| 1.1 | Design Cloud Function `createHrUser` (Admin SDK) | ☐ | Callable + security rules |
| 1.2 | Build Admin UI to invite HR users | ☐ | Modal form + validation |
| 1.3 | Implement `createEmployeeUser` callable for onboarding | ☐ | Returns login instructions |
| 1.4 | Update AuthContext to map new roles & claims | ☐ | Ensure routing guards |
| 1.5 | Audit logging for user creation actions | ☐ | Write entries to `/auditLogs` |

## 2. Employee Master Data
**Related BRD:** Section 4.2  
**Related Technical Doc:** Section 3  
**Related Database Info:** Section 3

| Task ID | Task | Status | Notes |
| 2.1 | Create Employee Directory screen with filters | ☐ | Table + stats |
| 2.2 | Build multi-step Employee form (personal → payroll → banking) | ☐ | Reusable components |
| 2.3 | Integrate Firebase Auth creation within onboarding flow | ☐ | Use callable function |
| 2.4 | Store full payroll breakdown (basic, HRA, allowances, deductions) | ☐ | Data validation for percentages |
| 2.5 | Capture banking + WPS fields with validation (IBAN, bank code) | ☐ | Mask sensitive data in UI |
| 2.6 | Implement duplication/import (CSV) utility (optional) | ☐ | Stretch goal |

## 3. Attendance Module
**Related BRD:** Section 4.3  
**Related Technical Doc:** Section 4

| Task ID | Task | Status | Notes |
| 3.1 | Create attendance calendar/table view | ☐ | Day cards + filters |
| 3.2 | Build attendance editor modal (status, times, notes) | ☐ | Support half-day |
| 3.3 | Implement bulk CSV import | ☐ | Validate duplicates |
| 3.4 | Write Firestore hooks (`useAttendance`) | ☐ | Query by month |
| 3.5 | Add holiday/calendar settings | ☐ | Stored in company settings |

## 4. Leave Management & Policies
**Related BRD:** Section 4.4  
**Related Technical Doc:** Section 5

| Task ID | Task | Status | Notes |
| 4.1 | Create leave policy builder UI | ☐ | Define entitlements, frequency |
| 4.2 | Implement leave request workflow (submit, approve, reject) | ☐ | Status transitions |
| 4.3 | Build quarterly accrual callable + scheduler | ☐ | Cloud Function |
| 4.4 | Auto-deduct leave balances & convert to unpaid when insufficient | ☐ | Payroll integration |
| 4.5 | Dashboard cards for leave balances & pending approvals | ☐ | Summary widgets |

## 5. Payroll & Gratuity Engine
**Related BRD:** Sections 4.5-4.6  
**Related Technical Doc:** Section 6  
**Database Info:** Section 6

| Task ID | Task | Status | Notes |
| 5.1 | Design payroll cycle wizard UI | ☐ | Stepper with review screens |
| 5.2 | Build `generatePayrollDraft` Cloud Function | ☐ | Aggregates attendance & leaves |
| 5.3 | Implement manual adjustments table (bonus, deductions) | ☐ | Inline editing |
| 5.4 | Calculate gratuity accrual per cycle | ☐ | Configurable formula |
| 5.5 | "Lock payroll" function to persist final figures & trigger slips | ☐ | Audit log |
| 5.6 | Attendance-payroll validation errors (missing data) | ☐ | Pre-lock check list |

## 6. WPS & Salary Slips
**Related BRD:** Sections 4.6-4.7  
**Related Technical Doc:** Sections 7-8

| Task ID | Task | Status | Notes |
| 6.1 | Company settings screen for WPS credentials | ☐ | Validate routing/bank codes |
| 6.2 | Build WPS preview screen with validation summary | ☐ | Show missing bank info |
| 6.3 | Implement `generateWpsBatch` Cloud Function (SIF file) | ☐ | Store file in Storage |
| 6.4 | Integrate manual adjustments from WPS preview | ☐ | Linked to payroll adjustments |
| 6.5 | Generate salary slip PDFs per employee | ☐ | Template + Storage upload |
| 6.6 | Employee self-service portal (view slips, attendance summary) | ☐ | Role-based route |

## 7. Testing & Compliance QA
**Related BRD:** Section 9  
**Technical Doc:** Sections 2-8

| Task ID | Task | Status | Notes |
| 7.1 | Unit tests for Auth creation functions | ☐ | Mock Admin SDK |
| 7.2 | Integration tests: Employee onboarding → payroll | ☐ | Cypress/Playwright |
| 7.3 | Attendance → payroll reconciliation test cases | ☐ | Edge cases (half-days) |
| 7.4 | Leave accrual simulation tests | ☐ | Quarter boundary |
| 7.5 | WPS file validation against sample regulator tool | ☐ | UAE SIF 2.0 |
| 7.6 | Salary slip rendering snapshot tests | ☐ | PDF diff |

## 8. Deployment & Change Management
| Task ID | Task | Status | Notes |
| 8.1 | Update Firestore security rules for new collections | ☐ | Role-based restrictions |
| 8.2 | Configure Firebase indexes (attendance, leaves, payroll) | ☐ | Deploy via rules/indexes file |
| 8.3 | Deploy Cloud Functions suite | ☐ | Ensure env vars set |
| 8.4 | Update documentation (Guidelines, README) | ☐ | Link new modules |
| 8.5 | Training materials for HR/Admin users | ☐ | Video or PDF |

## 9. Version History
| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2025-11-29 | GCC payroll checklist created |

---
**Next Actions:** Prioritize Section 1-3 tasks to unlock downstream payroll work. Update statuses as implementation progresses.