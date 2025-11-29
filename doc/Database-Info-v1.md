# Payrole HR Management System - Database Information

**Version:** 1.0  
**Date:** November 29, 2025  
**Author:** Payrole Development Team  
**Purpose:** Comprehensive database schema, collections, and relationships documentation

## Table of Contents
1. [Firebase Project Structure](#1-firebase-project-structure)
2. [Users Collection](#2-users-collection)
3. [Employees Collection](#3-employees-collection)
4. [Payroll Collection](#4-payroll-collection)
5. [Attendance Collection](#5-attendance-collection)
6. [Leave Collection](#7-leave-collection)
7. [Departments Collection](#8-departments-collection)
8. [Collection Relationships](#9-collection-relationships)
9. [Query Patterns](#10-query-patterns)
10. [Data Migration Strategy](#11-data-migration-strategy)

## 1. Firebase Project Structure

**Firestore Database Structure:**
```
payrole-db/
├── users/                    # Authentication & user profiles
├── employees/               # Employee master data
├── payroll/                 # Payroll calculations & records
├── attendance/              # Daily attendance tracking
├── leave/                   # Leave requests & approvals
├── departments/             # Department/organization structure
├── notifications/           # System notifications
└── audit_logs/              # System audit trail
```

**Storage Buckets:**
```
payrole-storage/
├── employee-documents/      # Employee documents (contracts, IDs)
├── payroll-documents/       # Payslips, tax documents
└── company-assets/          # Company logos, policies
```

## 2. Users Collection

**Collection Path:** `/users/{userId}`  
**Related BRD:** BRD-v1.md Section 3.1, 5  
**Related Technical Doc:** Technical-Doc-v1.md Section 4.2  
**Related Checklist:** Checklist-v1.md Task 1.1

### Document Structure
```json
{
  "userId": "string (Firebase Auth UID)",
  "email": "string (required)",
  "displayName": "string (required)",
  "role": "admin | hr_manager | employee (required)",
  "departmentId": "string (reference to departments collection)",
  "employeeId": "string (reference to employees collection)",
  "isActive": "boolean (default: true)",
  "lastLogin": "timestamp",
  "createdAt": "timestamp (server timestamp)",
  "updatedAt": "timestamp (server timestamp)",
  "createdBy": "string (userId of creator)",
  "preferences": {
    "theme": "light | dark",
    "language": "en | es | fr",
    "notifications": "boolean"
  }
}
```

### Indexes Required
- `email` (unique)
- `role` (for role-based queries)
- `departmentId` (for department filtering)
- `isActive` (for active user queries)
- `lastLogin` (for user activity reports)

### Security Rules
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null &&
    (request.auth.uid == userId || userRole() == 'admin');
  allow create: if request.auth != null && userRole() == 'admin';
}
```

## 3. Employees Collection

**Collection Path:** `/employees/{employeeId}`  
**Related BRD:** BRD-v2.md Section 2.1  
**Related Technical Doc:** Technical-Doc-v2.md Section 3  
**Related Checklist:** Checklist-v2.md Task 2.1-2.5

### Document Structure
```json
{
  "employeeId": "string (auto-generated)",
  "userId": "string (reference to users collection)",
  "employeeCode": "string (unique, auto-generated: EMP001)",
  "personalInfo": {
    "firstName": "string (required)",
    "lastName": "string (required)",
    "dateOfBirth": "timestamp",
    "gender": "male | female | other",
    "maritalStatus": "single | married | divorced | widowed",
    "nationality": "string",
    "phone": "string",
    "emergencyContact": {
      "name": "string",
      "relationship": "string",
      "phone": "string"
    }
  },
  "employmentInfo": {
    "departmentId": "string (required)",
    "position": "string (required)",
    "employmentType": "full_time | part_time | contract | intern",
    "startDate": "timestamp (required)",
    "endDate": "timestamp (nullable)",
    "managerId": "string (reference to employees collection)",
    "workLocation": "string",
    "probationEndDate": "timestamp"
  },
  "compensation": {
    "basicSalary": "number (monthly)",
    "hourlyRate": "number",
    "currency": "string (default: 'USD')",
    "payFrequency": "monthly | bi_weekly | weekly",
    "benefits": {
      "healthInsurance": "boolean",
      "dentalInsurance": "boolean",
      "retirementPlan": "boolean",
      "paidTimeOff": "number (days per year)"
    }
  },
  "status": "active | inactive | terminated | on_leave",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "string",
  "documents": [
    {
      "type": "contract | id | certificate",
      "fileName": "string",
      "fileUrl": "string (Firebase Storage)",
      "uploadedAt": "timestamp"
    }
  ]
}
```

### Subcollections
- `/employees/{employeeId}/payroll_history` (historical payroll records)
- `/employees/{employeeId}/performance_reviews` (performance data)
- `/employees/{employeeId}/training_records` (training history)

## 4. Payroll Collection

**Collection Path:** `/payroll/{payrollId}`  
**Related BRD:** BRD-v3.md Section 1.1  
**Related Technical Doc:** Technical-Doc-v3.md Section 2  
**Related Checklist:** Checklist-v3.md Task 1.1-1.8

### Document Structure
```json
{
  "payrollId": "string (auto-generated)",
  "employeeId": "string (required)",
  "payPeriod": {
    "startDate": "timestamp (required)",
    "endDate": "timestamp (required)",
    "month": "number (1-12)",
    "year": "number"
  },
  "earnings": {
    "basicSalary": "number",
    "overtime": "number",
    "bonus": "number",
    "commission": "number",
    "allowances": {
      "housing": "number",
      "transport": "number",
      "meal": "number",
      "other": "number"
    }
  },
  "deductions": {
    "tax": "number",
    "socialSecurity": "number",
    "healthInsurance": "number",
    "retirement": "number",
    "loanRepayment": "number",
    "other": "number"
  },
  "grossPay": "number (calculated)",
  "netPay": "number (calculated)",
  "status": "draft | pending | approved | paid | cancelled",
  "paymentMethod": "bank_transfer | check | cash",
  "paymentDate": "timestamp",
  "processedBy": "string (userId)",
  "approvedBy": "string (userId)",
  "notes": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Indexes Required
- `employeeId + payPeriod.startDate` (compound index for employee payroll history)
- `status` (for filtering by status)
- `payPeriod.month + payPeriod.year` (for monthly reports)
- `paymentDate` (for payment tracking)

## 5. Attendance Collection

**Collection Path:** `/attendance/{attendanceId}`  
**Related BRD:** BRD-v2.md Section 3.2  
**Related Technical Doc:** Technical-Doc-v2.md Section 5  
**Related Checklist:** Checklist-v2.md Task 3.1-3.3

### Document Structure
```json
{
  "attendanceId": "string (auto-generated)",
  "employeeId": "string (required)",
  "date": "timestamp (required)",
  "checkIn": "timestamp",
  "checkOut": "timestamp",
  "breakStart": "timestamp",
  "breakEnd": "timestamp",
  "totalHours": "number (calculated)",
  "overtimeHours": "number (calculated)",
  "status": "present | absent | late | half_day | holiday",
  "location": "string (office location)",
  "notes": "string",
  "approvedBy": "string (userId)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Indexes Required
- `employeeId + date` (compound index for daily attendance)
- `date` (for date range queries)
- `status` (for attendance reports)

## 6. Leave Collection

**Collection Path:** `/leave/{leaveId}`  
**Related BRD:** BRD-v2.md Section 4.1  
**Related Technical Doc:** Technical-Doc-v2.md Section 6  
**Related Checklist:** Checklist-v2.md Task 4.1-4.4

### Document Structure
```json
{
  "leaveId": "string (auto-generated)",
  "employeeId": "string (required)",
  "leaveType": "annual | sick | maternity | paternity | emergency | unpaid",
  "startDate": "timestamp (required)",
  "endDate": "timestamp (required)",
  "totalDays": "number (calculated)",
  "reason": "string",
  "status": "pending | approved | rejected | cancelled",
  "approvedBy": "string (userId)",
  "approvedAt": "timestamp",
  "comments": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 7. Departments Collection

**Collection Path:** `/departments/{departmentId}`  
**Related BRD:** BRD-v2.md Section 2.2  
**Related Technical Doc:** Technical-Doc-v2.md Section 4  
**Related Checklist:** Checklist-v2.md Task 2.6

### Document Structure
```json
{
  "departmentId": "string (auto-generated)",
  "name": "string (required)",
  "code": "string (unique, required)",
  "description": "string",
  "headId": "string (reference to employees collection)",
  "parentDepartmentId": "string (for hierarchical structure)",
  "budget": "number",
  "employeeCount": "number (calculated)",
  "isActive": "boolean (default: true)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 8. Collection Relationships

### Entity Relationship Diagram
```
Users (1) ──── (1) Employees
   │                    │
   │                    │
   └── (1) ──── (M) Departments
               │
               ├── (1) ──── (M) Payroll
               ├── (1) ──── (M) Attendance
               └── (1) ──── (M) Leave
```

### Foreign Key Relationships
- `users.employeeId` → `employees.employeeId`
- `users.departmentId` → `departments.departmentId`
- `employees.userId` → `users.userId`
- `employees.departmentId` → `departments.departmentId`
- `employees.managerId` → `employees.employeeId`
- `payroll.employeeId` → `employees.employeeId`
- `attendance.employeeId` → `employees.employeeId`
- `leave.employeeId` → `employees.employeeId`
- `departments.headId` → `employees.employeeId`

## 9. Query Patterns

### Common Query Patterns

**Get Employee with Department:**
```javascript
const employeeQuery = query(
  collection(db, 'employees'),
  where('employeeId', '==', employeeId)
);

const employeeDoc = await getDocs(employeeQuery);
const departmentDoc = await getDoc(
  doc(db, 'departments', employeeDoc.docs[0].data().departmentId)
);
```

**Monthly Payroll Report:**
```javascript
const payrollQuery = query(
  collection(db, 'payroll'),
  where('payPeriod.month', '==', month),
  where('payPeriod.year', '==', year),
  where('status', '==', 'paid')
);
```

**Employee Attendance Summary:**
```javascript
const attendanceQuery = query(
  collection(db, 'attendance'),
  where('employeeId', '==', employeeId),
  where('date', '>=', startDate),
  where('date', '<=', endDate)
);
```

**Department Hierarchy:**
```javascript
const departmentQuery = query(
  collection(db, 'departments'),
  where('parentDepartmentId', '==', parentId)
);
```

## 10. Data Migration Strategy

### Version Migration Paths
- **v1.0 → v2.0:** Add employees, departments, attendance collections
- **v2.0 → v3.0:** Add payroll calculation fields and leave management
- **v3.0 → v4.0:** Add performance reviews and training records
- **v4.0 → v5.0:** Add advanced analytics and reporting collections

### Migration Scripts Location
- `/migrations/v1-to-v2.js`
- `/migrations/v2-to-v3.js`
- `/migrations/v3-to-v4.js`

### Backup Strategy
- Daily automated backups to Firebase Storage
- Point-in-time recovery capability
- Data validation before migration

## 11. Security Rules Summary

### Collection-Level Security
```javascript
// Users can read their own data and HR can read all
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if isOwner(userId) || isHR();
}

// Employees data - HR only
match /employees/{employeeId} {
  allow read, write: if isHR();
}

// Payroll - HR and Finance only
match /payroll/{payrollId} {
  allow read, write: if isHR() || isFinance();
}
```

---

**Related Documents:**
- BRD-v1.md (Authentication)
- BRD-v2.md (Employee Management)
- BRD-v3.md (Payroll System)
- Technical-Doc-v1.md (Firebase Integration)
- Checklist-v1.md (Current Tasks)

**Next Version:** Database-Info-v2.md (Employee Management Schema)