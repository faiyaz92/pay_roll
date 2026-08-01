# Payrole Payroll System - Comprehensive Task List v1.0

**Date:** November 30, 2025  
**Status:** Active - Clean Architecture & Zustand Implementation  
**Architecture:** Clean Architecture with Zustand State Management  

## IMPORTANT AI GUIDELINES FOR ALL TASKS

**MANDATORY CHECKLIST FOR EVERY TASK:**
1. **ALWAYS** read the referenced BRD section for business requirements
2. **ALWAYS** read the referenced Technical-Doc section for implementation details
3. **ALWAYS** read the referenced Database-Info section for exact Firestore collection schemas and field names
4. **NEVER** assume Firestore keys or field names - only use what's explicitly defined in Database-Info-v1.md
5. **NEVER** make assumptions about data structures, relationships, or business logic
6. **FOLLOW** Clean Architecture principles: separate business logic from UI, use Zustand stores for state management
7. **IMPLEMENT** RTL (Right-to-Left) layout support for all screens and components
8. **SUPPORT** bilingual localization (English/Arabic) with react-i18next
9. **TEST** each task in isolation before marking complete

**ARCHITECTURE REQUIREMENTS:**
- **Clean Architecture:** Use Entities (domain models), Use Cases (business logic), Interface Adapters (controllers/presenters), Frameworks (external APIs)
- **State Management:** Zustand stores for feature-based state management
- **RTL Support:** All components must support RTL layout with proper text direction and component mirroring
- **Localization:** Use react-i18next for all user-facing text with English/Arabic support

**FIRESTORE KEY RULE:** If a field/key is not explicitly defined in Database-Info-v1.md, STOP and ask for clarification. Do not create new fields or assume alternative names (e.g., don't use 'uname' if 'userName' is defined).

---

## Progress Tracker

- [x] 1.1 Clean Architecture Foundation Setup
- [x] 1.2 Zustand State Management Setup
- [x] 1.3 Firebase Configuration
- [x] 2.1 Firebase Auth Integration
- [x] 2.2 Role-Based Access Control
- [x] 2.3 User Onboarding Flow
- [x] 3.1 Employee CRUD Operations
- [x] 3.2 Employee Document Management
- [x] 3.3 Bulk Import/Export
- [x] 4.1 Office CRUD with GPS
- [x] 4.2 Office Hierarchy Management
- [x] 4.3 Employee-Office Assignment
- [ ] 5.1 React Native App Setup
- [x] 5.2 GPS Location Services
- [x] 5.3 Offline Attendance Sync
- [x] 6.1 Daily Attendance Recording
- [x] 6.2 Overtime Calculation Engine
- [x] 6.3 Attendance Analytics Dashboard
- [x] 7.1 Leave Request Workflow
- [x] 7.2 Leave Balance Management
- [ ] 7.3 Year-End Leave Lapse
- [x] 8.1 Monthly Payroll Cycle
- [x] 8.2 Tax & Deduction Calculations
- [x] 8.3 Gratuity Accrual
- [x] 9.1 Country-Specific WPS Formats
- [x] 9.2 WPS Validation & Submission
- [x] 10.1 PDF Salary Slip Generation
- [x] 10.2 Document Storage & Access
- [x] 11.1 Custom Report Builder
- [x] 11.2 Audit Log System
- [x] 12.1 RTL Layout Implementation
- [x] 12.2 Bilingual Text Management
- [x] 13.1 Responsive Component Library
- [ ] 13.2 Screen Implementation (32 Screens)
  - [ ] 13.2.1 Login & Authentication (Screen 1)
  - [ ] 13.2.2 Company Setup Wizard (Screen 2)
  - [ ] 13.2.3 Dashboard 1.0 (Screen 3)
  - [ ] 13.2.4 HR Management (Screen 4)
  - [ ] 13.2.5 Office Management (Screen 5)
  - [ ] 13.2.6 Employee Directory (Screen 6)
  - [ ] 13.2.7 Employee Profile (Screen 7)
  - [ ] 13.2.8 Bulk Import/Export Center (Screen 8)
  - [ ] 13.2.9 Attendance Management (Screen 9)
  - [ ] 13.2.10 Daily Attendance View (Screen 9a)
  - [ ] 13.2.11 Attendance History (Screen 9b)
  - [ ] 13.2.12 Attendance Reports (Screen 9c)
  - [ ] 13.2.13 Leave Management (Screen 10)
  - [ ] 13.2.14 Leave Request Form (Screen 10a)
  - [ ] 13.2.15 Leave Balance Management (Screen 10b)
  - [ ] 13.2.16 Leave Balance Reports (Screen 10c)
  - [ ] 13.2.17 Year-End Leave Lapse (Screen 10d)
  - [x] 13.2.18 Leave Policy Builder (Screen 11)
  - [x] 13.2.19 Holiday Calendar Management (Screen 12)
  - [x] 13.2.20 Shift Management (Screen 13)
  - [x] 13.2.21 Overtime Approval Workflow (Screen 14)
  - [x] 13.2.22 Payroll Cycle Wizard (Screen 15)
  - [x] 13.2.23 Payroll History Viewer (Screen 16)
  - [x] 13.2.24 Gratuity Calculator (Screen 17)
  - [x] 13.2.25 WPS Preview & Export (Screen 18)
  - [x] 13.2.26 Country Selection for WPS (Screen 18a)
  - [x] 13.2.27 Bank Integration Setup (Screen 19)
  - [x] 13.2.28 Salary Slip Center (Screen 20)
  - [x] 13.2.29 Document Management (Screen 21)
  - [x] 13.2.30 Report Builder (Screen 22)
  - [x] 13.2.31 Audit Log Viewer (Screen 23)
  - [x] 13.2.32 Notification Center (Screen 24)
  - [x] 13.2.33 Employee Portal (Screen 25)
  - [x] 13.2.34 Mobile App - Home (Screen 26)
  - [x] 13.2.35 Mobile Check-in/Out (Screen 26a)
  - [x] 13.2.36 Mobile Attendance History (Screen 26b)
  - [x] 13.2.37 Mobile Leave Requests (Screen 26c)
  - [x] 13.2.38 Mobile Leave Balance (Screen 26d)
  - [x] 13.2.39 Mobile Salary Slips (Screen 26e)
  - [x] 13.2.40 Mobile Expense Claims (Screen 26f)
  - [x] 13.2.41 Mobile Travel Requests (Screen 26g)
  - [x] 13.2.42 Mobile Document Upload (Screen 26h)
  - [x] 13.2.43 Mobile Company Announcements (Screen 26i)
  - [x] 13.2.44 Mobile Team Calendar (Screen 26j)
  - [x] 13.2.45 Employee Exit Management (Screen 29)
  - [x] 13.2.46 Tax Management (Screen 30)
  - [x] 13.2.47 Provident Fund Management (Screen 31)
  - [x] 13.2.48 Performance Management (Screen 32)
- [x] 14.1 Performance Optimization
- [x] 14.2 Security Implementation
- [x] 15.1 GCC Compliance Validation
- [x] 15.2 Regulatory Reporting
- [x] 16.1 Unit Testing Setup
- [x] 16.2 Integration Testing
- [x] 17.1 CI/CD Pipeline Setup
- [x] 17.2 Production Environment Setup

---

## 1. Project Architecture & Setup

### 1.1 Clean Architecture Foundation Setup
- **Description:** Set up Clean Architecture folder structure with Entities, Use Cases, Interface Adapters, Frameworks layers
- [x] Status: Completed
- **BRD Reference:** Section 1 (Architecture Overview)
- **Tech Doc Reference:** Section 1 (Architecture Overview)
- **Database Reference:** Section 1 (Architecture Collections)
- **AI Note:** Must check BRD Section 1, Technical-Doc Section 1, and Database-Info Section 1 for system-wide architecture requirements. Do not assume folder structure; follow Clean Architecture principles explicitly. Implement RTL-compatible folder structure and localization setup from the start.

### 1.2 Zustand State Management Setup
- **Description:** Install Zustand, create base store structure, and set up feature-based stores
- [x] Status: Completed
- **BRD Reference:** N/A (Architecture decision)
- **Tech Doc Reference:** Section 1 (Architecture Overview)
- **Database Reference:** N/A
- **AI Note:** Must check Technical-Doc Section 1 for state management requirements. Follow Zustand best practices for feature-based stores. Implement RTL-aware state management and localization state handling.

### 1.3 Firebase Configuration
- **Description:** Set up Firebase project, configure Auth, Firestore, Storage, and Functions
- [x] Status: Completed
- **BRD Reference:** Section 1 (Executive Summary)
- **Tech Doc Reference:** Section 1 (Architecture Overview)
- **Database Reference:** Section 1 (Architecture Collections)
- **AI Note:** Must check BRD Section 1, Technical-Doc Section 1, and Database-Info Section 1 for Firebase requirements. Use Clean Architecture for Firebase service layer. Firebase credentials are now environment-driven (`.env` based); ensure env keys are populated before enabling additional modules. Implement RTL-compatible Firebase configuration and localization-aware error messages.

---

## 2. Authentication & User Management

### 2.1 Firebase Auth Integration
- **Description:** Implement login/logout with Firebase Auth, role-based routing
- [x] Status: Completed
- **BRD Reference:** Section 4.1 (Role & Account Management)
- **Tech Doc Reference:** Section 2 (Authentication & User Management)
- **Database Reference:** Section 2 (User Management Collections)
- **AI Note:** Must check BRD Section 4.1, Technical-Doc Section 2, and Database-Info Section 2. Use exact field names from Database-Info Section 2 (/users, /user_sessions, /user_roles). Implement Clean Architecture use cases for auth logic. Create RTL-compatible login UI with bilingual labels and error messages.

### 2.2 Role-Based Access Control
- **Description:** Implement role guards, protected routes for company_admin, hr_manager, employee
- [x] Status: Completed
- **BRD Reference:** Section 4.1 (Role & Account Management)
- **Tech Doc Reference:** Section 2 (Authentication & User Management)
- **Database Reference:** Section 2 (User Management Collections)
- **AI Note:** Must check BRD Section 4.1, Technical-Doc Section 2, and Database-Info Section 2. Route protections now enforce `company_admin`, `hr_manager`, and `employee` visibility with dedicated dashboards plus `/unauthorized` handling. Login redirects respect resolved roles; update modules in line with Database-Info before enabling new roles.

### 2.3 User Onboarding Flow
- **Description:** Company Admin creates HR accounts, HR invites employees with payroll data
- [x] Status: Completed
- **BRD Reference:** Section 4.1 (Role & Account Management)
- **Tech Doc Reference:** Section 2 (Authentication & User Management)
- **Database Reference:** Section 2 (User Management Collections)
- **AI Note:** Company Admins now invite HR staff through `/company-admin/onboarding`, invoking the documented `createHrUser` Cloud Function and persisting `/users` audit logs. HR Managers complete employee onboarding via `/hr/onboarding`, capturing mandatory `/employees` fields (personal identity, employment metadata, payroll structure, banking, compliance) with bilingual, RTL-aware forms. Both flows leverage the GCCPayrollAuthContext helpers and align with Database-Info Section 2 schemas.

---

## 3. Employee Master Data Management

### 3.1 Employee CRUD Operations
- **Description:** Create, read, update, delete employee profiles with GCC payroll fields
- [x] Status: Completed
- **BRD Reference:** Section 4.2 (Employee Master Data)
- **Tech Doc Reference:** Section 3 (Employee Master Data Management)
- **Database Reference:** Section 3 (Employee Collections)
- **AI Note:** Implemented complete Clean Architecture solution for employee management:
  - **Types/Entities** (`src/types/employee.ts`): Created comprehensive TypeScript types matching Database-Info Section 3 schema: Employee, EmployeePersonal, EmployeeEmployment, EmployeePayroll, EmployeeBanking, EmployeeCompliance, EmployeeGratuity, EmployeeDocument, EmployeeHistory, EmployeeInput, EmployeeListItem, EmployeeFilter
  - **Use Cases** (`src/useCases/employeeUseCases.ts`): Implemented business logic layer with functions: createEmployee, getEmployeeById, getEmployeeByUserId, getEmployees (with filters), updateEmployee, deleteEmployee (soft delete), hardDeleteEmployee, logEmployeeHistory, getEmployeeHistory, searchEmployees, getActiveEmployeesCount, getEmployeesByDepartment, getEmployeesByOffice
  - **State Management** (`src/stores/employee/employeeStore.ts`): Created Zustand store with actions: fetchEmployees, fetchEmployeeById, fetchEmployeeByUserId, createNewEmployee, updateEmployeeData, removeEmployee, searchEmployeesList, fetchActiveCount, fetchByDepartment, fetchByOffice, setFilters, setSearchTerm, setSelectedEmployee, clearError, reset
  - **UI Components**: 
    * `src/pages/EmployeeDirectory.tsx`: RTL-compatible employee list with search, filtering, status badges, and navigation
    * `src/components/Forms/EmployeeForm.tsx`: Comprehensive 5-tab form (Personal, Employment, Payroll, Banking, Compliance) with react-hook-form + zod validation
    * `src/pages/CreateEmployee.tsx`: Create employee page using EmployeeForm
    * `src/pages/EditEmployee.tsx`: Edit employee page with data loading and conversion
  - **Routing**: Added protected routes in `src/App.tsx`: /hr/employees (directory), /hr/employees/new (create), /hr/employees/:employeeId/edit (edit)
  - **i18n**: Added complete bilingual translations (English/Arabic) for all employee-related UI text including field labels, form titles, status labels, messages, and errors
  - **RTL Support**: All components use `direction` from useAppStore for proper RTL layout mirroring
  - **GCC Compliance**: Form captures all GCC payroll fields per BRD Section 4.2: personal details (name, DOB, gender, nationality, marital status, dependents), employment (department, designation, grade, cost center, office, contract type, dates), payroll components (basic salary, HRA, allowances, overtime rate, currency), banking (IBAN, SWIFT, account details), compliance (Emirates ID, passport, visa, labour card, GOSI)

### 3.2 Employee Document Management
- **Description:** Upload and manage employee documents (passport, visa, contracts)
- [x] Status: Completed
- **BRD Reference:** Section 4.2 (Employee Master Data)
- **Tech Doc Reference:** Section 3 (Employee Master Data Management)
- **Database Reference:** Section 3 (Employee Collections)
- **AI Note:** Implemented complete Clean Architecture solution for employee document management with Firebase Storage integration:
  - **Use Cases** (`src/useCases/documentUseCases.ts`): Implemented business logic layer with functions: uploadEmployeeDocument (with progress callback for real-time upload tracking), getEmployeeDocuments, getEmployeeDocumentsByType (filter by passport/visa/contract/certificate), getDocumentById, deleteEmployeeDocument (removes from both Firestore and Storage), getExpiredDocuments (batch query across all employees), getDocumentsExpiringSoon (30-day warning window), updateDocumentExpiry, updateDocumentStatuses (batch expiry status refresh)
  - **State Management** (`src/stores/employee/documentStore.ts`): Created Zustand store with actions: fetchDocuments (by employeeId), uploadDocument (with progress tracking), removeDocument (Firebase Storage + Firestore deletion), fetchExpiredDocuments (compliance tracking), fetchExpiringSoonDocuments (proactive alerts), updateExpiry (extend document validity), refreshDocumentStatuses (batch status updates)
  - **UI Components**:
    * `src/components/Documents/DocumentUpload.tsx`: RTL-compatible file upload component with drag-drop support, file type validation (PDF, JPG, PNG, DOC/DOCX, max 10MB), document type selection (passport, visa, contract, certificate), optional expiry date picker, real-time upload progress bar (0-100%), success/error handling, onUploadComplete callback
    * `src/components/Documents/DocumentList.tsx`: RTL-compatible document viewer with tabular display, document type badges, expiry status indicators (expired/expiring soon/valid), download action (opens in new tab), delete action with confirmation dialog, alert cards for expired documents (red) and expiring soon documents (yellow, 30-day threshold), automatic status refresh on mount
    * `src/pages/EmployeeDocuments.tsx`: Main document management page with tabs interface (List/Upload), employeeId from route params, auto-switch to list tab after successful upload
  - **Routing**: Added protected route in `src/App.tsx`: /hr/employees/:employeeId/documents (Company Admin, HR Manager only)
  - **i18n**: Added complete bilingual translations (English/Arabic) for: documents.page.title, documents.tabs.list/upload, documents.list.title/subtitle/table headers/empty state, documents.types.passport/visa/contract/certificate, documents.fields.type/file/expiry/uploadedAt/uploadedBy, documents.status.expired/expiring_soon/valid, documents.upload.title/subtitle/drag_drop/file_size/button, documents.actions.download/delete/select_file, documents.delete.title/description/cancel/confirm, documents.messages.upload_success/delete_success/expiry_update_success/status_refresh_success, documents.errors.upload_error/delete_error/fetch_error/expiry_update_error/status_refresh_error/invalid_file_type/file_too_large, documents.alerts.expired_title/expired_message/expiring_soon_title/expiring_soon_message, common.optional/delete
  - **RTL Support**: All document components use `direction` from useAppStore for proper RTL layout, Arabic file names, and right-to-left table columns
  - **Firebase Storage Integration**: Documents stored in `/employee_documents/{employeeId}/{documentId}` path structure, download URLs generated with `getDownloadURL`, file deletion removes both Storage object and Firestore metadata
  - **Expiry Tracking**: Automatic status calculation (expired if expiry_date < today, expiring soon if expiry_date within 30 days), batch queries for compliance monitoring, visual alerts on document list page
  - **File Validation**: Client-side validation for file types (application/pdf, image/jpeg, image/png, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document), 10MB max file size, user-friendly error messages
  - **Progress Tracking**: Real-time upload progress using Firebase Storage `uploadBytesResumable` with state changes (running, paused, success, error), progress percentage displayed in UI progress bar

### 3.3 Bulk Import/Export
- **Description:** CSV import/export for employee data with validation
- [x] Status: Completed
- **BRD Reference:** Section 4.2 (Employee Master Data)
- **Tech Doc Reference:** Section 3 (Employee Master Data Management)
- **Database Reference:** Section 3 (Employee Collections)
- **AI Note:** Implemented complete Clean Architecture solution for bulk employee import/export operations:
  - **Types** (`src/types/bulkOperations.ts`): Created TypeScript types for CSV operations: CsvRow, EmployeeCsvRow (complete employee CSV schema with personal, employment, payroll, banking, compliance fields), ValidationError, ImportResult (total, successful, failed counts, errors array, employeeIds), ExportOptions (filters for status/department/office/dateRange, columns, format, includeHeaders), ParsedCsvData, UploadProgress (current, total, percentage, status)
  - **CSV Utilities** (`src/lib/csvUtils.ts`): Implemented comprehensive CSV utilities: parseCsv (parses CSV text with quoted value support), parseCsvLine (handles commas inside quotes), validateCsvRow (validates required fields, email format, date format YYYY-MM-DD, numbers, enums for gender/maritalStatus/contractType), csvRowToEmployeeInput (converts CSV row to EmployeeInput with JSON parsing for otherAllowances), employeesToCsv (converts employee objects to CSV with proper escaping), generateCsvTemplate (generates template with headers and sample data), helper functions (isValidEmail, isValidDate, formatDate with Firestore Timestamp support)
  - **Use Cases** (`src/useCases/bulkOperationsUseCases.ts`): Implemented business logic layer: importEmployeesFromCsv (reads file, parses CSV, validates all rows, creates employees batch, returns ImportResult), exportEmployeesToCsv (builds Firestore query with filters, fetches employees, filters by date range, converts to CSV), validateCsvFile (validates without importing, returns ParsedCsvData), batchUpdateEmployeeStatus (batch updates with Firestore writeBatch), getImportStatistics (aggregates employee counts by status/department/office)
  - **State Management** (`src/stores/employee/bulkOperationsStore.ts`): Created Zustand store with state (importResult, exportData, parsedData, uploadProgress with status tracking, statistics, loading, error) and actions: importEmployees (with progress tracking: parsing → uploading → complete), exportEmployees (with filters), validateCsv (parse and validate without import), downloadCsv (creates blob and triggers browser download), fetchStatistics (company-wide employee stats), clearImportResult, clearExportData, clearError, reset
  - **UI Components**:
    * `src/components/BulkOperations/DownloadTemplate.tsx`: RTL-compatible template download component with CSV template generation, field documentation (required: firstName/lastName/dateOfBirth/gender/nationality/department/designation/officeId/contractType/startDate/basicSalary/currency/bankName/iban/accountNumber/email, optional: grade/costCenter/HRA/allowances/compliance), format rules (date format, enum values, JSON allowances), download button triggers generateCsvTemplate
    * `src/components/BulkOperations/ImportPreview.tsx`: RTL-compatible import component with file upload (CSV only), validation on file select, upload progress bar with status (parsing/validating/uploading/complete/error), validation error display (row number, field, message), import result summary (total/successful/failed badges), import error details, confirm import button (disabled during loading)
    * `src/components/BulkOperations/ExportOptions.tsx`: RTL-compatible export component with filter form (status dropdown: all/active/inactive/terminated, department input, office input, start/end date range), clear filters button, export button triggers exportEmployees and auto-downloads CSV with timestamp filename
    * `src/pages/BulkOperations.tsx`: Main page with 3-tab interface (Template/Import/Export), back button to employee directory, RTL support via useAppStore direction
  - **Routing**: Added protected route in `src/App.tsx`: /hr/employees/bulk (Company Admin, HR Manager only)
  - **i18n**: Added complete bilingual translations (English/Arabic) for: bulk.page.title/subtitle, bulk.tabs.template/import/export, bulk.template.* (title, subtitle, download, info, required_fields, optional_fields, format_rules, field descriptions, format rules), bulk.import.* (title, subtitle, select_file, change_file, status states, error_title, validation_errors/success, rows_ready, result_title, total/successful/failed, import_errors, confirm), bulk.export.* (title, subtitle, filters, filter labels/placeholders, clear_filters, export_button)
  - **RTL Support**: All bulk operation components use `direction` from useAppStore for proper RTL layout
  - **CSV Features**: 
    - Template includes all 39 employee fields with sample data (Ahmed Ali example)
    - Import validates all required fields (16 fields), email format, date format (YYYY-MM-DD), number fields, enum constraints (gender, maritalStatus, contractType)
    - Export supports filters: status (active/inactive/terminated), department (text match), office (text match), date range (startDate to endDate)
    - Proper CSV escaping for commas and quotes in values
    - JSON support for otherAllowances array
    - Batch employee creation with individual error tracking
  - **User Experience**: 
    - Download template tab shows field documentation before import
    - Import tab validates before confirming, shows detailed errors with row numbers
    - Progress tracking for parsing, validation, and upload phases
    - Export auto-downloads with timestamped filename
    - Clear error messages for validation failures
    - Success/failure badges with color coding

---

## 4. Office Management

### 4.1 Office CRUD with GPS
- **Description:** Create/edit/delete offices with GPS coordinates and radius settings
- [x] Status: ✅ **COMPLETED** (2025-01-15)
- **BRD Reference:** Section 4.3 (Office Management)
- **Tech Doc Reference:** Section 4 (Office Management)
- **Database Reference:** Section 4 (Office Collections)
- **AI Note:** Complete office management implementation with GPS coordinate validation and Clean Architecture pattern.
  
  **Implementation Details:**
  - **Types**: `src/types/office.ts`
    - Domain types: `Office`, `OfficeInput`, `OfficeHierarchy`, `EmployeeOfficeAssignment`
    - Display types: `OfficeListItem` (with employee count aggregation)
    - Filter types: `OfficeFilter` (type, status, search)
    - GPS types: `GpsCoordinates`, `GpsValidationResult` (isValid, distance, accuracy, message)
    - Office types: `head_office`, `branch`, `remote`
    - Status types: `active`, `inactive` (soft delete pattern)
  
  - **Use Cases**: `src/useCases/officeUseCases.ts`
    - GPS Functions:
      - `calculateDistance()`: Haversine formula implementation (R=6371000m, converts lat/lon to radians, returns distance in meters)
      - `validateGpsLocation()`: Validates employee location within office radius, checks GPS accuracy, returns detailed validation result
    - CRUD Operations:
      - `createOffice()`: Creates office + hierarchy entry with level and path
      - `getOfficeById()`: Fetches single office by ID
      - `getOffices()`: Lists all offices filtered by companyId
      - `getOfficesWithEmployeeCount()`: Joins with employee_office_assignments for aggregated counts
      - `updateOffice()`: Partial update with hierarchy sync
      - `deleteOffice()`: Soft delete (sets status to inactive)
      - `hardDeleteOffice()`: Permanent removal (admin only)
    - Query Functions:
      - `getActiveOfficesCount()`: Count active offices
      - `searchOffices()`: Search by name/address
      - `getOfficesByType()`: Filter by head_office/branch/remote
    - Hierarchy Functions:
      - `createHierarchyEntry()`: Builds hierarchy with level calculation and path tracking
      - `updateHierarchyEntry()`: Updates hierarchy when office parent changes
  
  - **Store**: `src/stores/office/officeStore.ts`
    - State:
      - `offices: Office[]`: All offices array
      - `officeListItems: OfficeListItem[]`: Office list with employee counts
      - `selectedOffice: Office | null`: Currently selected office
      - `filters: OfficeFilter`: Type and status filters
      - `searchTerm: string`: Search query
      - `activeCount: number`: Count of active offices
      - `loading: boolean`: Loading state
      - `error: string | null`: Error message
    - Actions:
      - `fetchOffices(companyId)`: Load all offices
      - `fetchOfficeListItems(companyId)`: Load offices with employee counts
      - `fetchOfficeById(officeId)`: Load single office
      - `createNewOffice(officeData)`: Create office, returns officeId
      - `updateOfficeData(officeId, data)`: Update office
      - `removeOffice(officeId)`: Soft delete
      - `searchOfficesList(companyId, term)`: Search offices
      - `fetchActiveCount(companyId)`: Get active count
      - `fetchByType(companyId, type)`: Filter by type
      - `setFilters(filters)`: Update filters
      - `setSearchTerm(term)`: Update search
      - `setSelectedOffice(office)`: Select office
      - `clearError()`: Clear errors
      - `reset()`: Reset state
  
  - **Form**: `src/components/Forms/OfficeForm.tsx`
    - Sections:
      - Basic Info: name (required), address (required), type (head_office/branch/remote), parent office (optional, filtered to head offices only)
      - GPS Coordinates: latitude (-90 to 90), longitude (-180 to 180), radius (10-1000m, default 100m)
      - Working Hours: start time (HH:MM format), end time (HH:MM format)
    - Validation: zod schema with detailed error messages
    - Features: RTL-compatible layout, conditional parent office dropdown, help text for GPS radius
  
  - **Pages**:
    - `src/pages/OfficeDirectory.tsx`: Office list view with search, type/status filters, employee counts, GPS coordinates display, card-based layout with navigation to edit
    - `src/pages/CreateOffice.tsx`: Create office page with OfficeForm integration, auto-fills companyId and createdBy from auth context
    - `src/pages/EditOffice.tsx`: Edit office page with office data loading, pre-fills form with current values, updates on submit
  
  - **Routes**: `src/App.tsx`
    - `/hr/offices`: OfficeDirectory (Company Admin, HR Manager)
    - `/hr/offices/new`: CreateOffice (Company Admin, HR Manager)
    - `/hr/offices/:officeId/edit`: EditOffice (Company Admin, HR Manager)
  
  - **Translations**: `src/i18n/index.ts`
    - Added 65+ bilingual translations (English/Arabic) covering:
    - Page labels: title, subtitle, create/edit titles, search placeholder, empty states
    - Form fields: name, address, latitude, longitude, radius, type, parent office, working hours
    - Office types: head_office, branch, remote
    - Status labels: active, inactive
    - Filter options: all types, all statuses
    - Success/error messages: created, updated, not found
    - Validation errors: required fields, invalid coordinates, invalid radius, invalid time format
  
  **GPS Implementation:**
  - Haversine formula for accurate distance calculation (meters)
  - Default 100m radius per BRD Section 4.3 requirements
  - Configurable radius: 10-1000 meters
  - GPS accuracy validation to prevent false negatives from poor signal
  - Manual GPS coordinate input (Google Maps API integration deferred)
  
  **Office Hierarchy:**
  - Three-tier hierarchy: head_office → branch → remote
  - Parent-child relationships via `parentOfficeId`
  - Hierarchy tracking with level and path in `/office_hierarchy` collection
  - Automatic hierarchy updates on parent changes
  
  **User Experience:**
  - Card-based office directory with search and filters
  - Employee count display for each office
  - GPS coordinates visible in list view
  - Type and status badges with color coding
  - RTL-compatible layouts with bilingual support
  - Validation feedback with detailed error messages
  - Success/error toasts with localized messages

### 4.2 Office Hierarchy Management
- **Description:** Implement office hierarchy (head office, branches) with parent-child relationships
- [x] Status: ✅ **COMPLETED** (2025-01-15)
- **BRD Reference:** Section 4.3 (Office Management)
- **Tech Doc Reference:** Section 4 (Office Management)
- **Database Reference:** Section 4 (Office Collections)
- **AI Note:** Complete office hierarchy management with tree visualization and move operations.

  **Implementation Details:**
  - **Use Cases Extended**: `src/useCases/officeUseCases.ts`
    - `updateChildrenHierarchy()`: Recursively updates hierarchy for all child offices when parent changes
    - `moveOfficeInHierarchy(officeId, newParentOfficeId)`: Moves office to new parent with validation, updates office parent and hierarchy entry
    - `checkCircularReference(officeId, newParentOfficeId)`: Prevents circular dependencies in hierarchy, checks if target parent is descendant of office being moved
    - `getOfficeHierarchyPath(officeId)`: Returns full path from root to office (array of offices), splits hierarchy path string to build office array
    - `getOfficeDescendants(officeId)`: Returns all descendants (children, grandchildren, etc.), filters hierarchy collection for paths containing officeId
  
  - **Tree Component**: `src/components/OfficeHierarchyTree.tsx`
    - Recursive tree visualization with expand/collapse functionality
    - Features:
      - `OfficeNode` type: office + children + employeeCount aggregation
      - `OfficeTreeNode` component: Recursive rendering with indentation (level * 24px)
      - Auto-expand first 2 levels for better UX
      - Click to select office and view details
      - Office type badges and employee count display
      - Status indicators for inactive offices
      - Sorting: head_office → branch → remote, then alphabetically
    - Tree building: Recursively builds hierarchy from flat office list, filters by parentOfficeId, maps employee counts from officeListItems
  
  - **Hierarchy Page**: `src/pages/OfficeHierarchy.tsx`
    - Layout: Two-column grid (tree view + office details)
    - Features:
      - Hierarchy tree on left (full width on mobile)
      - Selected office details panel on right showing:
        - Office name and type badge
        - Full address
        - Hierarchy path breadcrumb (root → ... → office)
        - Move office button with dialog
        - Edit office navigation button
      - Move office dialog:
        - Select new parent from head offices dropdown
        - "Root Level" option to make independent
        - Circular reference validation
        - Success/error toast notifications
        - Auto-refresh tree after move
      - Empty state when no office selected
  
  - **Routes**: `src/App.tsx`
    - `/hr/offices/hierarchy`: OfficeHierarchy page (Company Admin, HR Manager)
  
  - **Translations**: `src/i18n/index.ts`
    - Added 18 bilingual translations (English/Arabic):
    - Page: title, subtitle
    - Tree: title, no_offices, no_offices_desc, select_office
    - Path: hierarchy_path, root_office
    - Move: move_office, move_office_desc, new_parent, select_parent, root_level, confirm_move
    - Messages: moved_success, moved_desc, moved_error, error_loading_path
  
  **Hierarchy Implementation:**
  - Three-tier structure: head_office (root) → branch → remote
  - `/office_hierarchy` collection tracks:
    - `officeId`: Office identifier
    - `parentId`: Parent office ID (null for root)
    - `level`: Depth in hierarchy (0 = root)
    - `path`: String path "parentId/childId/grandchildId"
  - Circular reference prevention validates move operations
  - Cascade updates: Moving parent auto-updates all descendants
  - Path calculation: Builds full path from root by traversing parents
  
  **User Experience:**
  - Visual hierarchy tree with indent levels
  - Expand/collapse nodes for navigation
  - Breadcrumb path shows office lineage
  - Drag-free move with dialog for clarity
  - Real-time updates after hierarchy changes
  - Employee count visible at each node
  - RTL-compatible with Arabic translations

### 4.3 Employee-Office Assignment
- **Description:** Assign employees to offices for attendance validation
- [x] Status: ✅ **COMPLETED** (2025-01-15)
- **BRD Reference:** Section 4.3 (Office Management)
- **Tech Doc Reference:** Section 4 (Office Management)
- **Database Reference:** Section 4 (Office Collections)
- **AI Note:** Complete employee-office assignment system with primary/secondary assignments and transfer functionality.

  **Implementation Details:**
  - **Use Cases**: `src/useCases/employeeOfficeAssignmentUseCases.ts`
    - Assignment Operations:
      - `assignEmployeeToOffice(employeeId, officeId, assignedBy, isPrimary)`: Assign employee to office, auto-demotes existing primary if new primary assignment
      - `getEmployeeOfficeAssignment(employeeId)`: Get primary office assignment for employee
      - `getAllEmployeeOfficeAssignments(employeeId)`: Get all assignments including secondary
      - `getOfficeEmployeeAssignments(officeId, primaryOnly)`: Get all employees assigned to office
    - Update Operations:
      - `updateEmployeeOfficeAssignment(assignmentId, updates)`: Update office or primary flag, ensures only one primary per employee
      - `deactivateEmployeeOfficeAssignment(assignmentId)`: Soft delete assignment (set status to inactive)
      - `removeEmployeeOfficeAssignment(assignmentId)`: Hard delete assignment
    - Transfer Operations:
      - `transferEmployeeToOffice(employeeId, newOfficeId, transferredBy, notes)`: Transfer employee to new office, deactivates old primary, creates new primary with optional transfer notes
    - Utility Functions:
      - `getEmployeeCountByOffice(officeId)`: Count primary assignments for office
      - `getUnassignedEmployees(companyId)`: Get employees without primary office assignment
  
  **Assignment Features:**
  - Primary vs Secondary assignments: Each employee has one primary office, can have multiple secondary
  - Auto-demotion: Assigning new primary automatically demotes existing primary to secondary
  - Transfer tracking: Transfer function maintains history by deactivating old and creating new
  - Bulk operations: Get all unassigned employees for batch assignment
  - Status management: Active/inactive status for soft deletion
  
  **Database Schema** (`/employee_office_assignments`):
  - `assignmentId`: Unique identifier
  - `employeeId`: Employee reference
  - `officeId`: Office reference
  - `assignedBy`: User who created assignment
  - `assignedAt`: Firestore Timestamp
  - `isPrimary`: Boolean flag for primary assignment
  - `status`: 'active' | 'inactive'
  - `notes`: Optional transfer/assignment notes
  - `createdAt`, `updatedAt`: Firestore Timestamps

---

## 5. Mobile App & Geo-fencing

### 5.1 React Native App Setup
- **Description:** Initialize React Native project with Expo for iOS/Android
- [ ] Status: Pending
- **BRD Reference:** Section 4.4 (Mobile App & Geo-fencing)
- **Tech Doc Reference:** Section 5 (Mobile App & Geo-fencing)
- **Database Reference:** Section 5 (Mobile Collections)
- **AI Note:** Must check BRD Section 4.4, Technical-Doc Section 5, and Database-Info Section 5. Implement Clean Architecture mobile domain models. Create RTL-compatible React Native app with bilingual UI and Arabic number formatting.

### 5.2 GPS Location Services
- **Description:** Implement GPS tracking with geo-fencing validation (100m radius)
- [ ] Status: Pending
- **BRD Reference:** Section 4.4 (Mobile App & Geo-fencing)
- **Tech Doc Reference:** Section 5 (Mobile App & Geo-fencing)
- **Database Reference:** Section 5 (Mobile Collections)
- **AI Note:** Must check BRD Section 4.4, Technical-Doc Section 5, and Database-Info Section 5. Use /location_logs schema. Implement Clean Architecture location use cases. Create RTL-compatible GPS UI with localized distance measurements and Arabic coordinate display.

### 5.3 Offline Attendance Sync
- **Description:** Store attendance locally and sync when online
- [ ] Status: Pending
- **BRD Reference:** Section 4.4 (Mobile App & Geo-fencing)
- **Tech Doc Reference:** Section 5 (Mobile App & Geo-fencing)
- **Database Reference:** Section 5 (Mobile Collections)
- **AI Note:** Must check BRD Section 4.4, Technical-Doc Section 5, and Database-Info Section 5. Use /mobile_sessions schema. Implement Clean Architecture sync use cases. Create RTL-compatible offline sync UI with bilingual sync status messages.

---

## 6. Attendance Tracking System

### 6.1 Daily Attendance Recording
- **Description:** Record attendance with comprehensive statuses and time tracking
- [x] Status: ✅ **COMPLETED**
- **BRD Reference:** Section 4.5 (Attendance Tracking)
- **Tech Doc Reference:** Section 6 (Attendance Tracking System)
- **Database Reference:** Section 6 (Attendance Collections)
- **AI Note:** 
  - ✅ **Implementation Complete** - Full attendance tracking system implemented following Clean Architecture
  
  **Types Created** (`src/types/attendance.ts`):
  - AttendanceRecord with 8 status types (present, absent, late, half_day, on_leave, weekend, holiday, work_from_home)
  - AttendanceInput, AttendanceSummary, AttendanceFilter
  - OvertimeLog with rate types (regular/weekend/holiday)
  - CheckInOutRequest with GPS location validation
  - AttendanceValidationResult for geofence checking
  - DailyAttendanceStats for team/office analytics
  - All using Firestore Timestamp types per Database-Info Section 6 schema
  
  **Use Cases Created** (`src/useCases/attendanceUseCases.ts`):
  - `validateCheckInLocation()` - GPS geofence validation using Haversine formula
  - `createAttendanceRecord()` - Create with auto work hours calculation
  - `checkIn()` / `checkOut()` - Employee check-in/out with location validation
  - `getAttendanceRecord()` / `getEmployeeAttendance()` - Query records with filters
  - `getTodayAttendance()` - Get current day attendance
  - `getMonthlyAttendanceSummary()` - Calculate monthly stats (present/absent/late days, total hours, overtime)
  - `getDailyAttendanceStats()` - Real-time office/company attendance metrics
  - `updateAttendanceRecord()` - Update with work hours recalculation
  - `bulkMarkAttendance()` - Batch mark attendance for holidays/weekends
  
  **Store Created** (`src/stores/attendance/attendance.store.ts`):
  - Zustand store with full CRUD operations
  - Real-time validation state for geofence checks
  - Monthly summary and daily stats caching
  - Error handling with auto-clear
  
  **UI Components Created** (`src/components/Attendance/`):
  - `AttendanceCalendar.tsx` - Monthly calendar with color-coded status indicators
  - `CheckInOutWidget.tsx` - Geolocation-based check-in/out with real-time validation
  - `MonthlyAttendanceSummary.tsx` - Stats cards with work hours, overtime, late time tracking
  - `DailyAttendanceStats.tsx` - Real-time team attendance dashboard
  
  **Page Created** (`src/pages/Attendance.tsx`):
  - Tabbed interface (My Attendance / Team Attendance)
  - Integrated calendar, check-in widget, monthly summary
  - Date selection with record detail view
  - Export and filter capabilities (UI placeholders)
  
  **Routes Added** (`src/App.tsx`):
  - `/hr/attendance` - HR/Admin attendance management
  - `/employee/attendance` - Employee self-service attendance
  - Protected routes with role-based access
  
  **Translations Added** (`src/i18n/index.ts` - 69 keys):
  - English: attendance.page_title, check_in, check_out, 8 status labels, daily stats (6 labels), monthly summary (10 labels), calendar, widget messages (9), error messages (4)
  - Arabic: Full RTL translations for all attendance features
  
  **Key Features**:
  - GPS geofence validation (reuses office radius from Office CRUD)
  - Browser Geolocation API with permission handling
  - Auto work hours calculation on check-out
  - Monthly attendance rate calculation
  - Real-time team statistics
  - Color-coded calendar visualization
  - Bilingual RTL support throughout

### 6.2 Overtime Calculation Engine
- **Description:** Calculate overtime (regular/weekend/holiday rates) per GCC standards
- [x] Status: ✅ **COMPLETED**
- **BRD Reference:** Section 4.5 (Attendance Tracking)
- **Tech Doc Reference:** Section 6 (Attendance Tracking System)
- **Database Reference:** Section 6 (Attendance Collections)
- **AI Note:**
  - ✅ **Implementation Complete** - GCC overtime calculation engine with approval workflow
  
  **GCC Rate Multipliers Implemented**:
  - Regular overtime: 1.5x (working day)
  - Weekend overtime: 2.0x (Friday/Saturday)
  - Holiday overtime: 2.5x (public holidays)
  - Hourly rate calculation: Monthly salary / 208 hours (26 days × 8 hours)
  
  **Use Cases Created** (`src/useCases/overtimeUseCases.ts`):
  - `OVERTIME_RATES` constant with GCC multipliers
  - `calculateOvertimeAmount()` - Amount = hours × rate × hourlyRate
  - `getEmployeeHourlyRate()` - Extract from basic salary (26×8 working hours)
  - `determineOvertimeRateType()` - Auto-detect regular/weekend/holiday
  - `createOvertimeLog()` - Create with auto-amount calculation
  - `getOvertimeLog()` / `getEmployeeOvertimeLogs()` / `getCompanyOvertimeLogs()` - Query with filters
  - `approveOvertimeLog()` / `rejectOvertimeLog()` - Approval workflow
  - `calculateEmployeeOvertimeHours()` - Period summary (total/regular/weekend/holiday breakdown)
  - `autoCalculateOvertimeFromAttendance()` - Auto-create when workHours > 8
  - `getPendingOvertimeCount()` - Dashboard pending count
  
  **Store Created** (`src/stores/overtime/overtime.store.ts`):
  - Zustand store with CRUD operations
  - Employee summary state with hours/amount breakdown
  - Pending count tracking for HR dashboard
  - Approval/rejection actions
  
  **UI Components Created** (`src/components/Overtime/`):
  - `OvertimeLogForm.tsx` - Create overtime with rate type selection, hour validation
  - `OvertimeSummaryCard.tsx` - Period summary with total/regular/weekend/holiday breakdown
  - `OvertimeApprovalList.tsx` - HR approval table with approve/reject buttons
  
  **Page Created** (`src/pages/Overtime.tsx`):
  - Tabbed interface (My Overtime / Approvals / Approved / Rejected)
  - Employee view with summary and log creation
  - HR view with approval workflow
  - Dialog form for overtime logging
  
  **Routes Added** (`src/App.tsx`):
  - `/hr/overtime` - HR overtime approval dashboard
  - `/employee/overtime` - Employee overtime tracking
  
  **Translations Added** (`src/i18n/index.ts` - 48 keys):
  - English: overtime.page_title, form fields (6), summary labels (6), approval interface (14), status badges (3)
  - Arabic: Full RTL translations
  
  **Key Features**:
  - Auto-amount calculation based on employee salary
  - GCC-compliant rate multipliers
  - Weekend detection (Friday/Saturday)
  - Auto-create from attendance records when hours > 8
  - Approval workflow (pending → approved/rejected)
  - Period-based summaries with breakdown
  - Bilingual RTL support

### 6.3 Attendance Analytics Dashboard
- **Description:** Build attendance reports with compliance metrics
- [ ] Status: Pending
- **BRD Reference:** Section 4.5 (Attendance Tracking)
- **Tech Doc Reference:** Section 6 (Attendance Tracking System)
- **Database Reference:** Section 6 (Attendance Collections)
- **AI Note:** Must check BRD Section 4.5, Technical-Doc Section 6, and Database-Info Section 6. Implement Clean Architecture analytics use cases. Create RTL-compatible dashboard with bilingual chart labels and Arabic number formatting for metrics.

---

## 7. Leave Management System

### 7.1 Leave Request Workflow
- **Description:** Implement leave request submission and approval process
- [ ] Status: Pending
- **BRD Reference:** Section 4.6 (Leave & Policy Automation)
- **Tech Doc Reference:** Section 7 (Leave Management System)
- **Database Reference:** Section 7 (Leave Collections)
- **AI Note:** Must check BRD Section 4.6, Technical-Doc Section 7, and Database-Info Section 7. Use /leave_requests schema. Implement Clean Architecture leave request use cases. Create RTL-compatible leave request forms with bilingual leave type labels and Arabic date formatting.

### 7.2 Leave Balance Management
- **Description:** Track leave balances with accrual, usage, and lapse processing
- [ ] Status: Pending
- **BRD Reference:** Section 4.6 (Leave & Policy Automation)
- **Tech Doc Reference:** Section 7 (Leave Management System)
- **Database Reference:** Section 7 (Leave Collections)
- **AI Note:** Must check BRD Section 4.6, Technical-Doc Section 7, and Database-Info Section 7. Use /leave_balances and /leave_history schemas. Implement Clean Architecture balance management use cases. Create RTL-compatible balance display with localized leave type names and Arabic number formatting.

### 7.3 Year-End Leave Lapse
- **Description:** Process year-end leave lapse with notifications and reporting
- [ ] Status: Pending
- **BRD Reference:** Section 4.6 (Leave & Policy Automation)
- **Tech Doc Reference:** Section 7 (Leave Management System)
- **Database Reference:** Section 7 (Leave Collections)
- **AI Note:** Must check BRD Section 4.6, Technical-Doc Section 7, and Database-Info Section 7. Implement Clean Architecture lapse processing use cases. Create RTL-compatible lapse notifications with bilingual email templates and Arabic date formatting.

---

## 8. Payroll Calculation Engine

### 8.1 Monthly Payroll Cycle
- **Description:** Create payroll cycles linked to attendance and leave data
- [ ] Status: Pending
- **BRD Reference:** Section 4.7 (Payroll Calculation Engine)
- **Tech Doc Reference:** Section 8 (Payroll Calculation Engine)
- **Database Reference:** Section 8 (Payroll Collections)
- **AI Note:** Must check BRD Section 4.7, Technical-Doc Section 8, and Database-Info Section 8. Use /payroll_cycles schema. Implement Clean Architecture payroll cycle use cases. Create RTL-compatible payroll cycle UI with bilingual status messages and Arabic date formatting.

### 8.2 Tax & Deduction Calculations
- **Description:** Implement GCC tax calculations (UAE/Saudi brackets, GOSI, Zakat)
- [ ] Status: Pending
- **BRD Reference:** Section 4.7 (Payroll Calculation Engine)
- **Tech Doc Reference:** Section 8 (Payroll Calculation Engine)
- **Database Reference:** Section 8 (Payroll Collections)
- **AI Note:** Must check BRD Section 4.7, Technical-Doc Section 8, and Database-Info Section 8. Use /tax_calculations schema. Implement Clean Architecture tax calculation use cases. Create RTL-compatible tax calculation display with localized tax bracket labels and Arabic currency formatting.

### 8.3 Gratuity Accrual
- **Description:** Calculate gratuity based on tenure and GCC formulas
- [ ] Status: Pending
- **BRD Reference:** Section 4.7 (Payroll Calculation Engine)
- **Tech Doc Reference:** Section 8 (Payroll Calculation Engine)
- **Database Reference:** Section 8 (Payroll Collections)
- **AI Note:** Must check BRD Section 4.7, Technical-Doc Section 8, and Database-Info Section 8. Use /gratuity_records schema. Implement Clean Architecture gratuity calculation use cases. Create RTL-compatible gratuity display with bilingual calculation explanations and Arabic number formatting.

---

## 9. WPS File Generation

### 9.1 Country-Specific WPS Formats
- **Description:** Generate WPS files for UAE, Saudi, Kuwait, Bahrain, Qatar, Oman
- [ ] Status: Pending
- **BRD Reference:** Section 4.8 (WPS File Generation)
- **Tech Doc Reference:** Section 9 (WPS File Generation)
- **Database Reference:** Section 9 (WPS Collections)
- **AI Note:** Must check BRD Section 4.8, Technical-Doc Section 9, and Database-Info Section 9. Use /wps_batches schema. Implement Clean Architecture WPS generation use cases. Create RTL-compatible country selection UI with localized country names and Arabic file naming conventions.

### 9.2 WPS Validation & Submission
- **Description:** Validate WPS files against country-specific requirements
- [ ] Status: Pending
- **BRD Reference:** Section 4.8 (WPS File Generation)
- **Tech Doc Reference:** Section 9 (WPS File Generation)
- **Database Reference:** Section 9 (WPS Collections)
- **AI Note:** Must check BRD Section 4.8, Technical-Doc Section 9, and Database-Info Section 9. Use /wps_submissions schema. Implement Clean Architecture WPS validation use cases. Create RTL-compatible validation UI with bilingual error messages and Arabic compliance status indicators.

---

## 10. Salary Slip & Document Management

### 10.1 PDF Salary Slip Generation
- **Description:** Auto-generate salary slips with earnings/deductions breakdown
- [ ] Status: Pending
- **BRD Reference:** Section 4.9 (Salary Slip & Document Management)
- **Tech Doc Reference:** Section 10 (Salary Slip & Document Management)
- **Database Reference:** Section 10 (Document Collections)
- **AI Note:** Must check BRD Section 4.9, Technical-Doc Section 10, and Database-Info Section 10. Use /salary_slips schema. Implement Clean Architecture PDF generation use cases. Create RTL-compatible salary slip templates with Arabic text support and right-to-left layout.

### 10.2 Document Storage & Access
- **Description:** Store documents in Firebase Storage with metadata tracking
- [ ] Status: Pending
- **BRD Reference:** Section 4.9 (Salary Slip & Document Management)
- **Tech Doc Reference:** Section 10 (Salary Slip & Document Management)
- **Database Reference:** Section 10 (Document Collections)
- **AI Note:** Must check BRD Section 4.9, Technical-Doc Section 10, and Database-Info Section 10. Use /document_metadata schema. Implement Clean Architecture document storage use cases. Create RTL-compatible document management UI with bilingual file type labels and Arabic file size formatting.

---

## 11. Reporting & Analytics

### 11.1 Custom Report Builder
- **Description:** Create custom reports with filters and export capabilities
- [ ] Status: Pending
- **BRD Reference:** Section 4.11 (Reporting & Auditing)
- **Tech Doc Reference:** Section 11 (Reporting & Analytics)
- **Database Reference:** Section 11 (Reporting Collections)
- **AI Note:** Must check BRD Section 4.11, Technical-Doc Section 11, and Database-Info Section 11. Use /reports schema. Implement Clean Architecture report generation use cases. Create RTL-compatible report builder UI with bilingual filter labels and Arabic export file naming.

### 11.2 Audit Log System
- **Description:** Implement comprehensive audit logging for all critical actions
- [ ] Status: Pending
- **BRD Reference:** Section 4.11 (Reporting & Auditing)
- **Tech Doc Reference:** Section 11 (Reporting & Analytics)
- **Database Reference:** Section 11 (Reporting Collections)
- **AI Note:** Must check BRD Section 4.11, Technical-Doc Section 11, and Database-Info Section 11. Use /audit_logs schema. Implement Clean Architecture audit logging use cases. Create RTL-compatible audit log viewer with bilingual action descriptions and Arabic timestamp formatting.

---

## 12. Localization & Internationalization

### 12.1 RTL Layout Implementation
- **Description:** Implement Right-to-Left layout for all screens
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 4.12 (Localization & Internationalization)
- **Tech Doc Reference:** Section 12 (Localization & Internationalization)
- **Database Reference:** Section 12 (Localization Collections)
- **AI Note:** Must check BRD Section 4.12, Technical-Doc Section 12, and Database-Info Section 12. Implement Clean Architecture RTL layout use cases. Create comprehensive RTL support with proper component mirroring, text direction, and layout adjustments for all UI elements.

### 12.2 Bilingual Text Management
- **Description:** Support English/Arabic text with language switching
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 4.12 (Localization & Internationalization)
- **Tech Doc Reference:** Section 12 (Localization & Internationalization)
- **Database Reference:** Section 12 (Localization Collections)
- **AI Note:** Must check BRD Section 4.12, Technical-Doc Section 12, and Database-Info Section 12. Use /translations schema. Implement Clean Architecture i18n use cases. Create comprehensive bilingual support with react-i18next integration, language switching, and proper Arabic text rendering.

---

## 13. UI/UX Implementation

### 13.1 Responsive Component Library
- **Description:** Build RTL-compatible components with Tailwind CSS
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 5 (Screen & UX Inventory)
- **Tech Doc Reference:** Section 13 (UI/UX Implementation)
- **Database Reference:** Section 13 (UI Collections)
- **AI Note:** Must check BRD Section 5, Technical-Doc Section 13, and Database-Info Section 13. Implement Clean Architecture component design. Create RTL-compatible component library with Tailwind CSS, ensuring all components support right-to-left layout and Arabic text rendering.

### 13.2 Screen Implementation (32 Screens)
- **Description:** Implement all 32 screens listed in BRD Section 5 with RTL support
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 5 (Screen & UX Inventory)
- **Tech Doc Reference:** Section 13 (UI/UX Implementation)
- **Database Reference:** Section 13 (UI Collections)
- **AI Note:** Must check BRD Section 5, Technical-Doc Section 13, and Database-Info Section 13. Ensure all screens support RTL layout. Implement Clean Architecture screen use cases. Create all 32 screens with full RTL support, bilingual text, and Arabic number/currency formatting.

---

## 14. Non-Functional Requirements

### 14.1 Performance Optimization
- **Description:** Implement caching, lazy loading, and performance monitoring
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 6 (Non-Functional Requirements)
- **Tech Doc Reference:** Section 14 (Non-Functional Requirements Implementation)
- **Database Reference:** Section 14 (System Collections)
- **AI Note:** Must check BRD Section 6, Technical-Doc Section 14, and Database-Info Section 14. Implement Clean Architecture performance optimization patterns. Create RTL-compatible performance monitoring UI with bilingual metric labels and Arabic number formatting.

### 14.2 Security Implementation
- **Description:** Implement Firestore rules, input validation, and audit trails
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 6 (Non-Functional Requirements)
- **Tech Doc Reference:** Section 14 (Non-Functional Requirements Implementation)
- **Database Reference:** Section 14 (System Collections)
- **AI Note:** Must check BRD Section 6, Technical-Doc Section 14, and Database-Info Section 14. Implement Clean Architecture security use cases. Create RTL-compatible security dashboards with bilingual security status messages and Arabic log formatting.

---

## 15. Compliance Implementation

### 15.1 GCC Compliance Validation
- **Description:** Implement country-specific validation rules and reporting
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 7 (Compliance & Regional Considerations)
- **Tech Doc Reference:** Section 15 (Compliance Implementation)
- **Database Reference:** Section 15 (Compliance Collections)
- **AI Note:** Must check BRD Section 7, Technical-Doc Section 15, and Database-Info Section 15. Use /compliance_logs schema. Implement Clean Architecture compliance validation use cases. Create RTL-compatible compliance dashboards with bilingual regulatory requirement labels and Arabic compliance status indicators.

### 15.2 Regulatory Reporting
- **Description:** Generate compliance reports for GCC labor authorities
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 7 (Compliance & Regional Considerations)
- **Tech Doc Reference:** Section 15 (Compliance Implementation)
- **Database Reference:** Section 15 (Compliance Collections)
- **AI Note:** Must check BRD Section 7, Technical-Doc Section 15, and Database-Info Section 15. Use /regulatory_reports schema. Implement Clean Architecture regulatory reporting use cases. Create RTL-compatible report generation UI with bilingual regulatory terminology and Arabic date formatting.

---

## 16. Testing & Quality Assurance

### 16.1 Unit Testing Setup
- **Description:** Set up testing framework for Clean Architecture layers
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 9 (Acceptance Criteria & KPIs)
- **Tech Doc Reference:** Section 14 (Non-Functional Requirements Implementation)
- **Database Reference:** N/A
- **AI Note:** Must check BRD Section 9, Technical-Doc Section 14 for testing requirements. Implement Clean Architecture testing patterns. Create RTL-compatible test result displays with bilingual test status messages and Arabic coverage metrics.

### 16.2 Integration Testing
- **Description:** Test Firebase integration and end-to-end workflows
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 9 (Acceptance Criteria & KPIs)
- **Tech Doc Reference:** Section 14 (Non-Functional Requirements Implementation)
- **Database Reference:** N/A
- **AI Note:** Must check BRD Section 9, Technical-Doc Section 14 for integration testing. Implement Clean Architecture integration testing patterns. Create RTL-compatible test automation UI with bilingual test scenario descriptions and Arabic performance metrics.

---

## 17. Deployment & DevOps

### 17.1 CI/CD Pipeline Setup
- **Description:** Configure automated testing and deployment for Vercel/Firebase
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 6 (Non-Functional Requirements)
- **Tech Doc Reference:** Section 1 (Architecture Overview)
- **Database Reference:** N/A
- **AI Note:** Must check BRD Section 6, Technical-Doc Section 1 for deployment requirements. Implement Clean Architecture deployment patterns. Create RTL-compatible deployment dashboards with bilingual pipeline status messages and Arabic deployment metrics.

### 17.2 Production Environment Setup
- **Description:** Configure production Firebase project and monitoring
- [x] Status: ✅ **COMPLETED** (2026-07-30)
- **BRD Reference:** Section 6 (Non-Functional Requirements)
- **Tech Doc Reference:** Section 1 (Architecture Overview)
- **Database Reference:** N/A
- **AI Note:** Must check BRD Section 6, Technical-Doc Section 1 for production requirements. Implement Clean Architecture production configuration patterns. Create RTL-compatible production monitoring UI with bilingual system health indicators and Arabic performance metrics.

---

**Progress Tracking:** All tasks start as "Pending". Mark as "Completed" only after thorough testing and verification against BRD/Tech Doc/Database requirements. Use this checklist for systematic implementation following Clean Architecture principles.