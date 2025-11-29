# Payrole HR Management System - Database Information v1.0

**Version:** 1.0
**Date:** November 29, 2025
**Author:** Payrole Development Team
**Status:** Draft - Firestore Collection Schemas

## Table of Contents
1. [Architecture Collections](#1-architecture-collections)
2. [User Management Collections](#2-user-management-collections)
3. [Employee Collections](#3-employee-collections)
4. [Office Collections](#4-office-collections)
5. [Mobile Collections](#5-mobile-collections)
6. [Attendance Collections](#6-attendance-collections)
7. [Leave Collections](#7-leave-collections)
8. [Payroll Collections](#8-payroll-collections)
9. [WPS Collections](#9-wps-collections)
10. [Document Collections](#10-document-collections)
11. [Reporting Collections](#11-reporting-collections)
12. [Localization Collections](#12-localization-collections)
13. [UI Collections](#13-ui-collections)
14. [System Collections](#14-system-collections)
15. [Compliance Collections](#15-compliance-collections)
16. [Collection Relationships & Management](#16-collection-relationships--management)
17. [Version History](#17-version-history)

---

## 1. Architecture Collections

**Related BRD:** Sections 1-3  
**Related Tech Doc:** Section 1  
**AI Instruction:** When working with architecture collections data, always cross-reference BRD-v1.md Sections 1-3 for business context and Technical-Doc-v1.md Section 1 for implementation details.  

### /system_config
- **Purpose:** System-wide configuration settings
- **Schema:**
  ```json
  {
    "companyId": "string",
    "defaultCurrency": "AED",
    "workingHoursPerDay": 8,
    "workingDaysPerWeek": 5,
    "timezone": "Asia/Dubai",
    "gccCountry": "UAE",
    "features": {
      "mobileApp": true,
      "geoFencing": true,
      "localization": true
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

### /user_preferences
- **Purpose:** User-specific preferences and settings
- **Schema:**
  ```json
  {
    "userId": "string",
    "language": "en|ar",
    "theme": "light|dark",
    "dateFormat": "DD/MM/YYYY",
    "currencyFormat": "AED",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "dashboardLayout": "object",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

---

## 2. User Management Collections

**Related BRD:** Section 4.1  
**Related Tech Doc:** Section 2  
**AI Instruction:** When working with user management collections data, always cross-reference BRD-v1.md Section 4.1 for business context and Technical-Doc-v1.md Section 2 for implementation details.  

### /users
- **Purpose:** Firebase Auth user profiles with role information
- **Schema:**
  ```json
  {
    "uid": "string",
    "email": "string",
    "displayName": "string",
    "role": "company_admin|hr_manager|employee",
    "employeeId": "string (optional)",
    "companyId": "string",
    "status": "active|inactive|suspended",
    "lastLogin": "timestamp",
    "createdBy": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

### /user_sessions
- **Purpose:** Track user login sessions for security
- **Schema:**
  ```json
  {
    "userId": "string",
    "sessionId": "string",
    "ipAddress": "string",
    "userAgent": "string",
    "loginTime": "timestamp",
    "logoutTime": "timestamp",
    "deviceType": "web|mobile"
  }
  ```

### /user_roles
- **Purpose:** Role definitions and permissions
- **Schema:**
  ```json
  {
    "roleId": "string",
    "name": "company_admin|hr_manager|employee",
    "permissions": ["array of permission strings"],
    "description": "string",
    "createdAt": "timestamp"
  }
  ```

---

## 3. Employee Collections

**Related BRD:** Section 4.2  
**Related Tech Doc:** Section 3  
**AI Instruction:** When working with employee collections data, always cross-reference BRD-v1.md Section 4.2 for business context and Technical-Doc-v1.md Section 3 for implementation details.  

### /employees
- **Purpose:** Complete employee master data
- **Schema:**
  ```json
  {
    "employeeId": "string",
    "userId": "string",
    "companyId": "string",
    "personal": {
      "firstName": "string",
      "lastName": "string",
      "fullName": "string",
      "dateOfBirth": "date",
      "gender": "male|female",
      "nationality": "string",
      "maritalStatus": "single|married|divorced",
      "dependents": "number"
    },
    "employment": {
      "department": "string",
      "designation": "string",
      "grade": "string",
      "costCenter": "string",
      "officeId": "string",
      "contractType": "limited|unlimited",
      "startDate": "date",
      "probationEndDate": "date",
      "managerId": "string"
    },
    "payroll": {
      "basicSalary": "number",
      "hra": {"amount": "number", "percentage": "number"},
      "transportation": "number",
      "mobile": "number",
      "utilities": "number",
      "otherAllowances": [{"name": "string", "amount": "number"}],
      "overtimeRate": "number",
      "currency": "AED"
    },
    "banking": {
      "bankName": "string",
      "branch": "string",
      "iban": "string",
      "swiftCode": "string",
      "accountNumber": "string",
      "routingCode": "string"
    },
    "compliance": {
      "emiratesId": "string",
      "passportNumber": "string",
      "passportExpiry": "date",
      "visaStatus": "string",
      "labourCardNumber": "string",
      "gosiNumber": "string"
    },
    "gratuity": {
      "eligibilityYears": 1,
      "startDate": "date",
      "status": "eligible|not_eligible"
    },
    "status": "active|inactive|terminated",
    "createdBy": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

### /employee_documents
- **Purpose:** Employee document storage references
- **Schema:**
  ```json
  {
    "employeeId": "string",
    "documentType": "passport|visa|contract|certificate",
    "fileName": "string",
    "fileUrl": "string",
    "uploadedBy": "string",
    "uploadedAt": "timestamp",
    "expiryDate": "date",
    "status": "valid|expired"
  }
  ```

### /employee_history
- **Purpose:** Employment history and changes
- **Schema:**
  ```json
  {
    "employeeId": "string",
    "changeType": "promotion|transfer|salary_change",
    "oldValue": "object",
    "newValue": "object",
    "changedBy": "string",
    "changedAt": "timestamp",
    "effectiveDate": "date"
  }
  ```

---

## 4. Office Collections

**Related BRD:** Section 4.3  
**Related Tech Doc:** Section 4  
**AI Instruction:** When working with office collections data, always cross-reference BRD-v1.md Section 4.3 for business context and Technical-Doc-v1.md Section 4 for implementation details.  

### /offices
- **Purpose:** Office location management
- **Schema:**
  ```json
  {
    "officeId": "string",
    "name": "string",
    "address": "string",
    "latitude": "number",
    "longitude": "number",
    "radius": 100,
    "type": "head_office|branch|remote",
    "parentOfficeId": "string",
    "workingHours": {
      "start": "09:00",
      "end": "18:00"
    },
    "createdBy": "string",
    "createdAt": "timestamp"
  }
  ```

### /office_hierarchy
- **Purpose:** Office organizational structure
- **Schema:**
  ```json
  {
    "officeId": "string",
    "parentId": "string",
    "level": "number",
    "path": "string"
  }
  ```

### /employee_office_assignments
- **Purpose:** Employee to office assignments
- **Schema:**
  ```json
  {
    "employeeId": "string",
    "officeId": "string",
    "assignedDate": "date",
    "assignedBy": "string",
    "isPrimary": true
  }
  ```

---

## 5. Mobile Collections

**Related BRD:** Section 4.4  
**Related Tech Doc:** Section 5  
**AI Instruction:** When working with mobile collections data, always cross-reference BRD-v1.md Section 4.4 for business context and Technical-Doc-v1.md Section 5 for implementation details.  

### /mobile_sessions
- **Purpose:** Mobile app session tracking
- **Schema:**
  ```json
  {
    "userId": "string",
    "deviceId": "string",
    "platform": "ios|android",
    "appVersion": "string",
    "loginTime": "timestamp",
    "logoutTime": "timestamp"
  }
  ```

### /location_logs
- **Purpose:** GPS location tracking for attendance
- **Schema:**
  ```json
  {
    "userId": "string",
    "latitude": "number",
    "longitude": "number",
    "accuracy": "number",
    "timestamp": "timestamp",
    "activity": "check_in|check_out|location_update"
  }
  ```

### /device_tokens
- **Purpose:** Push notification tokens
- **Schema:**
  ```json
  {
    "userId": "string",
    "deviceId": "string",
    "token": "string",
    "platform": "ios|android",
    "lastUpdated": "timestamp"
  }
  ```

---

## 6. Attendance Collections

**Related BRD:** Section 4.5  
**Related Tech Doc:** Section 6  
**AI Instruction:** When working with attendance collections data, always cross-reference BRD-v1.md Section 4.5 for business context and Technical-Doc-v1.md Section 6 for implementation details.  

### /attendance_records
- **Purpose:** Daily attendance records
- **Schema:**
  ```json
  {
    "attendanceId": "string",
    "employeeId": "string",
    "date": "date",
    "status": "present|absent|half_day|leave|holiday",
    "checkInTime": "timestamp",
    "checkOutTime": "timestamp",
    "totalHours": "number",
    "overtimeHours": "number",
    "breakHours": "number",
    "latitude": "number",
    "longitude": "number",
    "accuracy": "number",
    "isValidated": true,
    "approvedBy": "string",
    "notes": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

### /attendance_history
- **Purpose:** Historical attendance changes
- **Schema:**
  ```json
  {
    "attendanceId": "string",
    "changeType": "created|updated|approved",
    "oldData": "object",
    "newData": "object",
    "changedBy": "string",
    "changedAt": "timestamp"
  }
  ```

### /overtime_logs
- **Purpose:** Overtime tracking and approvals
- **Schema:**
  ```json
  {
    "employeeId": "string",
    "date": "date",
    "hours": "number",
    "rate": "number",
    "type": "regular|weekend|public_holiday",
    "status": "pending|approved|rejected",
    "approvedBy": "string",
    "approvedAt": "timestamp"
  }
  ```

---

## 7. Leave Collections

**Related BRD:** Section 4.6  
**Related Tech Doc:** Section 7  
**AI Instruction:** When working with leave collections data, always cross-reference BRD-v1.md Section 4.6 for business context and Technical-Doc-v1.md Section 7 for implementation details.  

### /leave_requests
- **Purpose:** Leave request submissions and approvals
- **Schema:**
  ```json
  {
    "leaveId": "string",
    "employeeId": "string",
    "type": "annual|sick|casual|maternity|paternity",
    "startDate": "date",
    "endDate": "date",
    "totalDays": "number",
    "reason": "string",
    "status": "pending|approved|rejected|cancelled",
    "approvedBy": "string",
    "approvedAt": "timestamp",
    "balanceImpact": "number",
    "isPaid": true,
    "attachments": ["array of file URLs"]
  }
  ```

### /leave_balances
- **Purpose:** Employee leave balances tracking
- **Schema:**
  ```json
  {
    "employeeId": "string",
    "type": "annual|sick|casual",
    "openingBalance": "number",
    "accrued": "number",
    "used": "number",
    "carriedForward": "number",
    "currentBalance": "number",
    "lastAccrualDate": "date",
    "expiryDate": "date",
    "updatedAt": "timestamp"
  }
  ```

### /leave_policies
- **Purpose:** Company leave policies
- **Schema:**
  ```json
  {
    "policyId": "string",
    "name": "string",
    "type": "annual|sick|casual",
    "yearlyEntitlement": "number",
    "accrualFrequency": "monthly|quarterly|yearly",
    "carryForwardAllowed": true,
    "maxCarryForward": "number",
    "expiryMonths": "number",
    "createdBy": "string",
    "createdAt": "timestamp"
  }
  ```

### /leave_history
- **Purpose:** Leave balance transaction history
- **Schema:**
  ```json
  {
    "employeeId": "string",
    "type": "annual|sick|casual",
    "transactionType": "accrual|usage|adjustment|lapse",
    "amount": "number",
    "balanceBefore": "number",
    "balanceAfter": "number",
    "referenceId": "string",
    "reason": "string",
    "createdAt": "timestamp"
  }
  ```

---

## 8. Payroll Collections

**Related BRD:** Section 4.7  
**Related Tech Doc:** Section 8  
**AI Instruction:** When working with payroll collections data, always cross-reference BRD-v1.md Section 4.7 for business context and Technical-Doc-v1.md Section 8 for implementation details.  

### /payroll_cycles
- **Purpose:** Monthly payroll processing cycles
- **Schema:**
  ```json
  {
    "cycleId": "string",
    "companyId": "string",
    "month": "number",
    "year": "number",
    "status": "draft|processing|locked|completed",
    "processedBy": "string",
    "processedAt": "timestamp",
    "totalEmployees": "number",
    "totalGross": "number",
    "totalDeductions": "number",
    "totalNet": "number",
    "currency": "AED"
  }
  ```

### /payroll_components
- **Purpose:** Individual employee payroll calculations
- **Schema:**
  ```json
  {
    "cycleId": "string",
    "employeeId": "string",
    "earnings": {
      "basic": "number",
      "hra": "number",
      "transportation": "number",
      "overtime": "number",
      "allowances": "number",
      "bonuses": "number"
    },
    "deductions": {
      "gosi": "number",
      "tax": "number",
      "loan": "number",
      "unpaidLeave": "number"
    },
    "gratuityAccrual": "number",
    "grossPay": "number",
    "totalDeductions": "number",
    "netPay": "number",
    "payableDays": "number",
    "calculatedAt": "timestamp"
  }
  ```

### /tax_calculations
- **Purpose:** Tax calculation details
- **Schema:**
  ```json
  {
    "employeeId": "string",
    "cycleId": "string",
    "annualIncome": "number",
    "taxBracket": "string",
    "taxAmount": "number",
    "zakatAmount": "number",
    "exemptions": "number",
    "calculatedAt": "timestamp"
  }
  ```

### /gratuity_records
- **Purpose:** Gratuity accrual and calculations
- **Schema:**
  ```json
  {
    "employeeId": "string",
    "cycleId": "string",
    "tenureYears": "number",
    "basicSalary": "number",
    "accrualAmount": "number",
    "totalAccrued": "number",
    "eligibilityDate": "date",
    "calculatedAt": "timestamp"
  }
  ```

---

## 9. WPS Collections

**Related BRD:** Section 4.8  
**Related Tech Doc:** Section 9  
**AI Instruction:** When working with WPS collections data, always cross-reference BRD-v1.md Section 4.8 for business context and Technical-Doc-v1.md Section 9 for implementation details.  

### /wps_batches
- **Purpose:** WPS file generation batches
- **Schema:**
  ```json
  {
    "batchId": "string",
    "cycleId": "string",
    "country": "UAE|Saudi|Kuwait|Bahrain|Qatar|Oman",
    "format": "SIF|MOL|PACI|LMRA|MME|MOM",
    "status": "draft|ready|submitted|approved|rejected",
    "totalEmployees": "number",
    "totalAmount": "number",
    "fileUrl": "string",
    "submittedBy": "string",
    "submittedAt": "timestamp",
    "approvedAt": "timestamp"
  }
  ```

### /wps_submissions
- **Purpose:** WPS submission tracking
- **Schema:**
  ```json
  {
    "batchId": "string",
    "submissionId": "string",
    "status": "pending|submitted|accepted|rejected",
    "referenceNumber": "string",
    "submittedAt": "timestamp",
    "response": "object"
  }
  ```

### /wps_amendments
- **Purpose:** WPS amendment requests
- **Schema:**
  ```json
  {
    "batchId": "string",
    "amendmentId": "string",
    "reason": "string",
    "changes": "object",
    "status": "pending|approved|rejected",
    "requestedBy": "string",
    "requestedAt": "timestamp"
  }
  ```

---

## 10. Document Collections

**Related BRD:** Section 4.9  
**Related Tech Doc:** Section 10  
**AI Instruction:** When working with document collections data, always cross-reference BRD-v1.md Section 4.9 for business context and Technical-Doc-v1.md Section 10 for implementation details.  

### /salary_slips
- **Purpose:** Generated salary slip records
- **Schema:**
  ```json
  {
    "slipId": "string",
    "employeeId": "string",
    "cycleId": "string",
    "fileUrl": "string",
    "fileName": "string",
    "generatedAt": "timestamp",
    "checksum": "string",
    "status": "generated|emailed|downloaded"
  }
  ```

### /employee_documents (duplicate from section 3)
- **Purpose:** Employee document storage references
- **Schema:** (See Section 3)

### /document_metadata
- **Purpose:** Document management metadata
- **Schema:**
  ```json
  {
    "documentId": "string",
    "type": "salary_slip|contract|certificate",
    "entityId": "string",
    "entityType": "employee|company",
    "fileSize": "number",
    "mimeType": "string",
    "uploadedBy": "string",
    "uploadedAt": "timestamp",
    "expiryDate": "date"
  }
  ```

---

## 11. Reporting Collections

**Related BRD:** Section 4.11  
**Related Tech Doc:** Section 11  
**AI Instruction:** When working with reporting collections data, always cross-reference BRD-v1.md Section 4.11 for business context and Technical-Doc-v1.md Section 11 for implementation details.  

### /reports
- **Purpose:** Saved report configurations
- **Schema:**
  ```json
  {
    "reportId": "string",
    "name": "string",
    "type": "attendance|payroll|leave",
    "filters": "object",
    "schedule": "object",
    "createdBy": "string",
    "createdAt": "timestamp",
    "lastRun": "timestamp"
  }
  ```

### /audit_logs
- **Purpose:** System audit trail
- **Schema:**
  ```json
  {
    "logId": "string",
    "userId": "string",
    "action": "create|update|delete|login",
    "entityType": "employee|attendance|payroll",
    "entityId": "string",
    "oldData": "object",
    "newData": "object",
    "ipAddress": "string",
    "timestamp": "timestamp",
    "metadata": "object"
  }
  ```

### /analytics_data
- **Purpose:** Pre-computed analytics data
- **Schema:**
  ```json
  {
    "dataId": "string",
    "type": "attendance_summary|payroll_trends",
    "period": "monthly|quarterly",
    "data": "object",
    "computedAt": "timestamp"
  }
  ```

---

## 12. Localization Collections

**Related BRD:** Section 4.12  
**Related Tech Doc:** Section 12  
**AI Instruction:** When working with localization collections data, always cross-reference BRD-v1.md Section 4.12 for business context and Technical-Doc-v1.md Section 12 for implementation details.  

### /translations
- **Purpose:** UI translation strings
- **Schema:**
  ```json
  {
    "key": "string",
    "en": "string",
    "ar": "string",
    "context": "string",
    "lastUpdated": "timestamp",
    "updatedBy": "string"
  }
  ```

### /user_language_preferences
- **Purpose:** User language settings
- **Schema:**
  ```json
  {
    "userId": "string",
    "preferredLanguage": "en|ar",
    "fallbackLanguage": "en",
    "rtlEnabled": true,
    "dateFormat": "DD/MM/YYYY|MM/DD/YYYY",
    "numberFormat": "arabic|western",
    "setAt": "timestamp"
  }
  ```

---

## 13. UI Collections

**Related BRD:** Section 5  
**Related Tech Doc:** Section 13  
**AI Instruction:** When working with UI collections data, always cross-reference BRD-v1.md Section 5 for business context and Technical-Doc-v1.md Section 13 for implementation details.  

### /ui_preferences
- **Purpose:** UI customization settings
- **Schema:**
  ```json
  {
    "userId": "string",
    "theme": "light|dark|auto",
    "sidebarCollapsed": false,
    "tablePageSize": 25,
    "dashboardWidgets": ["array"],
    "customViews": "object"
  }
  ```

### /screen_configs
- **Purpose:** Screen-specific configurations
- **Schema:**
  ```json
  {
    "screenId": "string",
    "userId": "string",
    "layout": "object",
    "filters": "object",
    "columns": ["array"],
    "lastUsed": "timestamp"
  }
  ```

---

## 14. System Collections

**Related BRD:** Section 6  
**Related Tech Doc:** Section 14  
**AI Instruction:** When working with system collections data, always cross-reference BRD-v1.md Section 6 for business context and Technical-Doc-v1.md Section 14 for implementation details.  

### /system_logs
- **Purpose:** Application logs and errors
- **Schema:**
  ```json
  {
    "logId": "string",
    "level": "info|warn|error",
    "message": "string",
    "userId": "string",
    "timestamp": "timestamp",
    "metadata": "object",
    "stackTrace": "string"
  }
  ```

### /performance_metrics
- **Purpose:** System performance monitoring
- **Schema:**
  ```json
  {
    "metricId": "string",
    "type": "response_time|throughput|error_rate",
    "value": "number",
    "timestamp": "timestamp",
    "endpoint": "string",
    "userId": "string"
  }
  ```

---

## 15. Compliance Collections

**Related BRD:** Section 7  
**Related Tech Doc:** Section 15  
**AI Instruction:** When working with compliance collections data, always cross-reference BRD-v1.md Section 7 for business context and Technical-Doc-v1.md Section 15 for implementation details.  

### /compliance_logs
- **Purpose:** Compliance-related activities
- **Schema:**
  ```json
  {
    "logId": "string",
    "complianceType": "WPS|GDPR|GCC_labor",
    "action": "validation|submission|audit",
    "status": "passed|failed|warning",
    "details": "object",
    "userId": "string",
    "timestamp": "timestamp"
  }
  ```

### /regulatory_reports
- **Purpose:** Regulatory reporting data
- **Schema:**
  ```json
  {
    "reportId": "string",
    "type": "WPS_summary|GCC_compliance",
    "period": "monthly|quarterly",
    "data": "object",
    "generatedAt": "timestamp",
    "submittedAt": "timestamp"
  }
  ```

---

## 16. Collection Relationships & Management

### Hierarchical Structure
```
/companies/{companyId}
├── /users (by companyId)
├── /employees (by companyId)
├── /offices (by companyId)
├── /payroll_cycles/{cycleId}
│   └── /payroll_components (by cycleId)
├── /wps_batches (by companyId)
└── /audit_logs (by companyId)
```

### Cross-References
- **Employee-centric:** `/employees` references `/users`, `/offices`, `/leave_balances`
- **Transactional:** `/payroll_cycles` links to `/attendance_records`, `/leave_requests`
- **Reference:** All collections reference `/audit_logs` for change tracking
- **Localization:** `/translations` referenced by all UI components

### Indexing Strategy
- Compound indexes on frequently queried fields (employeeId + date, status + createdAt)
- Single-field indexes on filterable columns
- Geospatial indexes for location-based queries

### Security Rules
- Row-level security based on user role and company membership
- Field-level access control for sensitive data
- Audit logging for all data modifications

---

## 17. Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-11-29 | Initial database schema for GCC payroll system |

---
**Related Documents:** BRD-v1.md, Technical-Doc-v1.md, Checklist-v1.md