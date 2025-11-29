# Payrole HR Management System - Technical Documentation v1.0

**Version:** 1.0  
**Date:** November 29, 2025  
**Author:** Payrole Development Team  
**Status:** Draft - Technical Design for GCC Payroll System

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & User Management](#2-authentication--user-management)
3. [Employee Master Data Management](#3-employee-master-data-management)
4. [Office Management](#4-office-management)
5. [Mobile App & Geo-fencing](#5-mobile-app--geo-fencing)
6. [Attendance Tracking System](#6-attendance-tracking-system)
7. [Leave Management System](#7-leave-management-system)
8. [Payroll Calculation Engine](#8-payroll-calculation-engine)
9. [WPS File Generation](#9-wps-file-generation)
10. [Salary Slip & Document Management](#10-salary-slip--document-management)
11. [Reporting & Analytics](#11-reporting--analytics)
12. [Localization & Internationalization](#12-localization--internationalization)
13. [UI/UX Implementation](#13-uiux-implementation)
14. [Non-Functional Requirements Implementation](#14-non-functional-requirements-implementation)
15. [Compliance Implementation](#15-compliance-implementation)
16. [Database Collection Management](#16-database-collection-management)
17. [Version History & Next Steps](#17-version-history--next-steps)

---

## 1. Architecture Overview

**BRD Reference:** Read BRD Sections 1, 2, and 3 to understand the business objectives, solution scope, and user personas that drive this technical architecture.

**Purpose:** This section outlines the overall system architecture, technology stack, and integration points for the Payrole GCC payroll system.

**Technical Implementation:**
- **Architecture Pattern:** Clean Architecture with layered separation (Entities/Domain, Use Cases/Application, Interface Adapters, Frameworks & Drivers)
- **State Management:** Zustand for lightweight, testable state management with feature-based stores
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Firebase (Auth, Firestore, Cloud Functions, Storage)
- **Mobile:** React Native for iOS/Android with GPS integration
- **Deployment:** Vercel for web, Firebase Hosting for mobile builds
- **Key Libraries:** react-i18next for localization, react-query for data fetching, react-hook-form for forms

**IMPORTANT NOTE:** All development tasks must strictly follow Clean Architecture principles. Business logic must be separated from UI concerns, with use cases handling application logic independently of frameworks. State management through Zustand stores should be feature-based and testable in isolation.

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 1 (Architecture Collections) for system-wide collections like `/system_config`, `/user_preferences`

**AI Instruction:** When implementing architecture decisions, always cross-reference BRD-v1.md Sections 1-3 for business requirements and Database-Info-v1.md Section 1 for data structure requirements.

---

## 2. Authentication & User Management

**BRD Reference:** Read BRD Section 4.1 to understand role-based access control, Firebase Auth integration, and user onboarding workflows.

**Purpose:** Implement secure authentication with role-based routing and user management.

**Technical Implementation:**
- Firebase Auth for login/logout with email/password
- Custom claims for roles (company_admin, hr_manager, employee)
- Protected routes using React Router with role guards
- User profile management with Firestore integration
- Password reset and multi-factor authentication setup

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 2 (User Management Collections) for `/users`, `/user_sessions`, `/user_roles`

**AI Instruction:** When implementing authentication features, always cross-reference BRD-v1.md Section 4.1 for business requirements and Database-Info-v1.md Section 2 for user data structures.

---

## 3. Employee Master Data Management

**BRD Reference:** Read BRD Section 4.2 to understand the comprehensive GCC payroll fields required for employee profiles.

**Purpose:** Build CRUD operations for employee master data with GCC-specific fields.

**Technical Implementation:**
- Employee profile forms with validation using react-hook-form
- Tabbed interface for Personal, Payroll, Banking, Employment sections
- Bulk import/export functionality with CSV processing
- Data validation for GCC compliance (Emirates ID, IBAN, etc.)
- Search and filtering capabilities

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 3 (Employee Collections) for `/employees`, `/employee_documents`, `/employee_history`

**AI Instruction:** When implementing employee data management, always cross-reference BRD-v1.md Section 4.2 for business requirements and Database-Info-v1.md Section 3 for employee data structures.

---

## 4. Office Management

**BRD Reference:** Read BRD Section 4.3 to understand multi-office support with GPS coordinates and geo-fencing requirements.

**Purpose:** Implement office location management with GPS integration.

**Technical Implementation:**
- Google Maps integration for coordinate selection
- Office CRUD with radius settings
- Employee assignment to offices
- Office hierarchy management (head office, branches)
- GPS validation logic for attendance

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 4 (Office Collections) for `/offices`, `/office_hierarchy`, `/employee_office_assignments`

**AI Instruction:** When implementing office management, always cross-reference BRD-v1.md Section 4.3 for business requirements and Database-Info-v1.md Section 4 for office data structures.

---

## 5. Mobile App & Geo-fencing

**BRD Reference:** Read BRD Section 4.4 to understand mobile attendance requirements and geo-fencing validation.

**Purpose:** Develop native mobile apps with GPS-based attendance marking.

**Technical Implementation:**
- React Native app with Expo
- Device GPS API integration
- Background location tracking
- Offline data storage with sync
- Push notifications via Firebase Cloud Messaging
- Location spoofing detection algorithms

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 5 (Mobile Collections) for `/mobile_sessions`, `/location_logs`, `/device_tokens`

**AI Instruction:** When implementing mobile features, always cross-reference BRD-v1.md Section 4.4 for business requirements and Database-Info-v1.md Section 5 for mobile data structures.

---

## 6. Attendance Tracking System

**BRD Reference:** Read BRD Section 4.5 to understand comprehensive attendance tracking with GCC compliance and overtime calculations.

**Purpose:** Build real-time attendance management with analytics.

**Technical Implementation:**
- Real-time attendance dashboard
- Calendar views with status indicators
- Bulk operations and CSV import/export
- Overtime calculation engine
- GPS validation integration
- Attendance regularization workflows

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 6 (Attendance Collections) for `/attendance_records`, `/attendance_history`, `/overtime_logs`

**AI Instruction:** When implementing attendance tracking, always cross-reference BRD-v1.md Section 4.5 for business requirements and Database-Info-v1.md Section 6 for attendance data structures.

---

## 7. Leave Management System

**BRD Reference:** Read BRD Section 4.6 to understand complex leave policies, balance tracking, and lapse processing.

**Purpose:** Implement automated leave management with GCC compliance.

**Technical Implementation:**
- Leave request workflows with approval chains
- Balance calculation and forecasting
- Quarterly accrual automation
- Year-end lapse processing
- Leave encashment calculations
- Advance leave support

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 7 (Leave Collections) for `/leave_requests`, `/leave_balances`, `/leave_policies`, `/leave_history`

**AI Instruction:** When implementing leave management, always cross-reference BRD-v1.md Section 4.6 for business requirements and Database-Info-v1.md Section 7 for leave data structures.

---

## 8. Payroll Calculation Engine

**BRD Reference:** Read BRD Section 4.7 to understand monthly payroll processing with GCC tax calculations and gratuity accrual.

**Purpose:** Build automated payroll calculation with preview and adjustments.

**Technical Implementation:**
- Monthly payroll cycle wizard
- Tax calculation engine (UAE/Saudi brackets)
- Gratuity accrual formulas
- Payroll preview with adjustments
- Arrears and pay revisions
- Provident fund calculations

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 8 (Payroll Collections) for `/payroll_cycles`, `/payroll_components`, `/tax_calculations`, `/gratuity_records`

**AI Instruction:** When implementing payroll calculations, always cross-reference BRD-v1.md Section 4.7 for business requirements and Database-Info-v1.md Section 8 for payroll data structures.

---

## 9. WPS File Generation

**BRD Reference:** Read BRD Section 4.8 to understand multi-country WPS compliance and file generation requirements.

**Purpose:** Generate country-specific WPS files with validation.

**Technical Implementation:**
- Country selection logic
- WPS format generators (UAE SIF 2.0, Saudi MOL, etc.)
- Pre-generation validation
- File export and submission tracking
- Amendment workflows

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 9 (WPS Collections) for `/wps_batches`, `/wps_submissions`, `/wps_amendments`

**AI Instruction:** When implementing WPS file generation, always cross-reference BRD-v1.md Section 4.8 for business requirements and Database-Info-v1.md Section 9 for WPS data structures.

---

## 10. Salary Slip & Document Management

**BRD Reference:** Read BRD Section 4.9 to understand salary slip generation and document storage requirements.

**Purpose:** Auto-generate and manage salary slips with document attachments.

**Technical Implementation:**
- PDF generation using libraries like jsPDF or Puppeteer
- Document upload to Firebase Storage
- Salary slip templates with localization
- Bulk email distribution
- Document versioning

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 10 (Document Collections) for `/salary_slips`, `/employee_documents`, `/document_metadata`

**AI Instruction:** When implementing document management, always cross-reference BRD-v1.md Section 4.9 for business requirements and Database-Info-v1.md Section 10 for document data structures.

---

## 11. Reporting & Analytics

**BRD Reference:** Read BRD Section 4.11 to understand comprehensive reporting requirements and audit logging.

**Purpose:** Build reporting dashboard with export capabilities.

**Technical Implementation:**
- Custom report builder with filters
- Real-time dashboards with charts
- Export to Excel/PDF/CSV
- Audit log viewer
- Scheduled report distribution

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 11 (Reporting Collections) for `/reports`, `/audit_logs`, `/analytics_data`

**AI Instruction:** When implementing reporting features, always cross-reference BRD-v1.md Section 4.11 for business requirements and Database-Info-v1.md Section 11 for reporting data structures.

---

## 12. Localization & Internationalization

**BRD Reference:** Read BRD Section 4.12 to understand RTL and bilingual requirements for all screens.

**Purpose:** Implement full RTL support and English/Arabic localization.

**Technical Implementation:**
- react-i18next integration
- RTL CSS with postcss-rtl
- Language toggle in header
- Date/currency formatting
- Translation key management
- Mobile app localization

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 12 (Localization Collections) for `/translations`, `/user_language_preferences`

**AI Instruction:** When implementing localization features, always cross-reference BRD-v1.md Section 4.12 for business requirements and Database-Info-v1.md Section 12 for localization data structures.

---

## 13. UI/UX Implementation

**BRD Reference:** Read BRD Section 5 to understand the 32 screens inventory and RTL requirements for all screens.

**Purpose:** Implement responsive UI with RTL support across all screens.

**Technical Implementation:**
- Component library with RTL variants
- Responsive design with Tailwind
- Form validation and error handling
- Loading states and error boundaries
- Accessibility compliance

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 13 (UI Collections) for `/ui_preferences`, `/screen_configs`

**AI Instruction:** When implementing UI/UX features, always cross-reference BRD-v1.md Section 5 for business requirements and Database-Info-v1.md Section 13 for UI data structures.

---

## 14. Non-Functional Requirements Implementation

**BRD Reference:** Read BRD Section 6 to understand performance, security, scalability, and localization requirements.

**Purpose:** Ensure system meets all non-functional requirements.

**Technical Implementation:**
- Performance optimization (lazy loading, caching)
- Security measures (Firestore rules, input validation)
- Scalability (pagination, indexing)
- Error handling and logging
- Testing strategies

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 14 (System Collections) for `/system_logs`, `/performance_metrics`

**AI Instruction:** When implementing non-functional requirements, always cross-reference BRD-v1.md Section 6 for business requirements and Database-Info-v1.md Section 14 for system data structures.

---

## 15. Compliance Implementation

**BRD Reference:** Read BRD Section 7 to understand GCC compliance requirements and regional considerations.

**Purpose:** Implement compliance features for GCC labor laws.

**Technical Implementation:**
- Country-specific validation rules
- Compliance reporting
- Audit trails for regulatory requirements
- Data retention policies

**Database Dependencies:** 
- Depends on Database-Info-v1.md Section 15 (Compliance Collections) for `/compliance_logs`, `/regulatory_reports`

**AI Instruction:** When implementing compliance features, always cross-reference BRD-v1.md Section 7 for business requirements and Database-Info-v1.md Section 15 for compliance data structures.

---

## 16. Database Collection Management

**Overview:** The system uses 15+ Firestore collections organized by functional areas. Each collection follows consistent naming and structure patterns.

**Collection Relationships:**
- **Hierarchical:** `/companies` → `/users` → `/employees` → `/attendance_records`
- **Transactional:** `/payroll_cycles` links to `/attendance_records`, `/leave_balances`, `/employee`
- **Reference:** All collections reference `/audit_logs` for change tracking
- **Localization:** `/translations` referenced by all UI components

**Management Strategy:**
- Use subcollections for related data (e.g., `/employees/{id}/documents`)
- Implement compound queries with composite indexes
- Cache frequently accessed data with Redis/memory
- Backup strategy: Daily exports to Cloud Storage

**Cross-References:**
- Technical-Doc-v1.md Section X depends on Database-Info-v1.md Section X for schema details
- BRD Section 4.X drives Technical-Doc-v1.md Section X requirements

---

## 17. Version History & Next Steps

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-11-29 | Initial technical design with section-wise BRD and database references |

**Next Steps:**
1. Create Database-Info-v1.md with detailed collection schemas
2. Implement authentication system (Tech Section 2)
3. Build employee management (Tech Section 3)
4. Develop attendance tracking (Tech Section 6)
5. Integrate localization (Tech Section 12)

---
**Related Documents:** BRD-v1.md, Database-Info-v1.md, Checklist-v1.md, Guidelines.md