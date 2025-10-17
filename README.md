# Car Rental Management System - Technical Documentation

## Table of Contents
1. [Business Requirements Document (BRD)](#business-requirements-document-brd)
   - 1.1 [Executive Summary](#11-executive-summary)
   - 1.2 [Business Objectives](#12-business-objectives)
   - 1.3 [Key Features](#13-key-features)
   - 1.4 [User Roles & Permissions](#14-user-roles--permissions)
   - 1.5 [Technical Requirements](#15-technical-requirements)
2. [System Architecture](#system-architecture)
   - 2.1 [Technology Stack](#21-technology-stack)
   - 2.2 [Application Structure](#22-application-structure)
   - 2.3 [Data Flow Architecture](#23-data-flow-architecture)
3. [Screen Logic & User Interfaces](#screen-logic--user-interfaces)
   - 3.1 [Dashboard Page](#31-dashboard-page-dashboard)
   - 3.2 [Vehicles Page](#32-vehicles-page-vehicles)
   - 3.3 [Vehicle Details Page](#33-vehicle-details-page-vehiclesvehicleid)
   - 3.4 [Financial Page](#34-financial-page-financial)
   - 3.5 [Drivers Page](#35-drivers-page-drivers)
   - 3.6 [Assignments Page](#36-assignments-page-assignments)
   - 3.7 [Payments Page](#37-payments-page-payments)
   - 3.8 [Fuel Records Page](#38-fuel-records-page-fuel-records)
   - 3.9 [Authentication System](#39-authentication-system)
4. [Hooks Logic & Data Management](#hooks-logic--data-management)
   - 4.1 [Core Data Management Hook](#41-core-data-management-hook-usefirebasedata)
   - 4.2 [Individual Entity Hooks](#42-individual-entity-hooks)
   - 4.3 [Firestore Path Management](#43-firestore-path-management-usefirestorepaths)
   - 4.4 [Authentication Context](#44-authentication-context-authcontext)
5. [Financial Formulas & Calculations](#financial-formulas--calculations)
   - 5.1 [Data Sources & Field Documentation](#51-data-sources--field-documentation)
   - 5.1.4 [Expense Management Hierarchy](#514-expense-management-hierarchy)
   - 5.2 [Core Financial Calculations](#52-core-financial-calculations)
   - 5.3 [Bulk Payment System](#53-bulk-payment-system)
   - 5.4 [Financial Analytics Tab](#54-financial-analytics-tab)
6. [Cash In Hand Tracking System](#cash-in-hand-tracking-system)
   - 6.1 [Overview](#61-overview)
   - 6.2 [Cash Balance Updates](#62-cash-balance-updates)
   - 6.3 [Transaction Types & Cash Impact](#63-transaction-types--cash-impact)
   - 6.4 [Zero-Balance Accounting Flow](#64-zero-balance-accounting-flow)
   - 6.5 [Real-time Cash Balance Display](#65-real-time-cash-balance-display)
   - 6.6 [Cash Balance Storage Structure](#66-cash-balance-storage-structure)
   - 6.7 [Business Benefits](#67-business-benefits)
7. [Partner Management System](#partner-management-system)
   - 7.1 [Overview](#71-overview)
   - 7.2 [Partner Roles & Responsibilities](#72-partner-roles--responsibilities)
   - 7.3 [Partner Data Storage](#73-partner-data-storage)
   - 7.4 [Partner Authentication & Login](#74-partner-authentication--login)
   - 7.5 [Vehicle-Partner Linking](#75-vehicle-partner-linking)
   - 7.6 [Partner Management Interface](#76-partner-management-interface)
   - 7.6.1 [Partner Add Form Implementation](#761-partner-add-form-implementation)
   - 7.7 [Profit Sharing & Service Charges](#77-profit-sharing--service-charges)
   - 7.8 [Business Benefits](#78-business-benefits)
8. [Insurance Management System](#insurance-management-system)
   - 8.1 [Insurance Types & Categories](#81-insurance-types--categories)
   - 8.2 [Insurance Policy Rules](#82-insurance-policy-rules)
   - 8.3 [Insurance Expense Tracking](#83-insurance-expense-tracking)
   - 8.4 [Insurance Document Management](#84-insurance-document-management)
9. [Firestore Database Structure](#firestore-database-structure)
   - 9.1 [Root Structure](#91-root-structure)
   - 9.2 [Tenant Company Structure](#92-tenant-company-structure)
   - 9.3 [Document Schemas](#93-document-schemas)
10. [Technical Implementation Details](#technical-implementation-details)
    - 10.1 [Real-time Data Synchronization](#101-real-time-data-synchronization)
    - 10.2 [Financial Calculation Engine](#102-financial-calculation-engine)
    - 10.3 [Form Validation & Error Handling](#103-form-validation--error-handling)
    - 10.4 [File Upload & Storage](#104-file-upload--storage)
    - 10.5 [Export Functionality](#105-export-functionality)
    - 10.6 [Responsive Design](#106-responsive-design)
    - 10.7 [Performance Optimizations](#107-performance-optimizations)
11. [Development & Deployment](#development--deployment)
    - 11.1 [Local Development Setup](#111-local-development-setup)
    - 11.2 [Environment Configuration](#112-environment-configuration)
    - 11.3 [Testing Strategy](#113-testing-strategy)
    - 11.4 [Deployment Pipeline](#114-deployment-pipeline)
12. [Future Enhancements](#future-enhancements)
    - 12.1 [Planned Features](#121-planned-features)
    - 12.2 [Technical Improvements](#122-technical-improvements)
13. [Analysis Templates](#analysis-templates)
    - 13.1 [Component Data Source Tracing Template](#131-component-data-source-tracing-template)
    - 13.2 [Component UI/UX Analysis Template](#132-component-uiux-analysis-template)
    - 13.3 [Component Navigation Analysis Template](#133-component-navigation-analysis-template)
14. [Prepayment Calculator Alert System](#prepayment-calculator-alert-system)
    - 14.1 [Overview](#141-overview)
    - 14.2 [Prepayment Timing Alert](#142-prepayment-timing-alert)
    - 14.3 [Alert Logic](#143-alert-logic)

---

## 🚀 Latest Updates (October 2025)

### ✅ Fixed EMI Structure & Prepayment Logic
**Completely restructured loan prepayment calculations for accurate financial modeling:**

- **✅ Fresh Loan Restructuring**: Prepayments now create completely new loan schedules starting from EMI 1, ignoring all previous payment history
- **✅ Paid EMI Protection**: Already paid EMIs remain unchanged and unaffected by prepayments
- **✅ Accurate Tenure Calculations**: Only unpaid EMIs are considered for tenure reduction calculations
- **✅ Prepayment Timing Alert**: Warning message guides users to make prepayments before current month's EMI payment
- **✅ Data Integrity**: Maintains complete audit trail of all payment history while enabling proper loan restructuring

### ✅ Complete Cash In Hand Tracking System
**Implemented comprehensive real-time cash balance management across all business transactions:**

- **✅ Rent Collection**: Cash increases when drivers pay weekly rent
- **✅ All Expenses**: Cash decreases for fuel, maintenance, insurance, EMIs, prepayments
- **✅ Accounting Transactions**: GST payments, service charges, profit sharing
- **✅ Zero-Balance Accounting**: Perfect financial reconciliation with ₹0 ending balance
- **✅ Real-time Updates**: Instant cash balance synchronization across all users

### ✅ Enhanced Accounting Features
**Added complete accounting functionality in AccountsTab:**

- **Monthly Profit Calculations**: Earnings minus all expenses
- **GST Management**: 4% tax calculation and payment tracking
- **Service Charge Collection**: 10% service charge from drivers
- **Profit Sharing**: 50/50 split between owner and partner
- **Transaction History**: Complete audit trail of all financial movements

### ✅ Improved Transaction Tracking
**All financial transactions now properly update cash balances:**

- **Income Transactions**: Rent payments increase cash
- **Expense Transactions**: All approved expenses decrease cash
- **Accounting Adjustments**: GST, service charges, profit distributions
- **Real-time Synchronization**: Instant updates across the application

### ✅ Complete Partner Management System
**Implemented comprehensive partner registration and management functionality:**

- **✅ Partner Registration Form**: Complete partner onboarding with Firebase Auth integration
- **✅ Form Validation**: Zod schema validation with password confirmation and email uniqueness
- **✅ Password Security**: Password visibility toggle and secure authentication
- **✅ Partner-Vehicle Linking**: Automatic association of partner-owned vehicles
- **✅ Partnership Fields**: Added partnership tracking in vehicle forms (ownership percentage, payment amounts)
- **✅ Profit/Loss Sharing**: Automatic calculation of 50/50 profit sharing with idle vehicle EMI loss bearing
- **✅ Real-time Updates**: Live synchronization of partner data and financial calculations

### ✅ Enhanced Vehicle Management
**Added comprehensive vehicle ownership and partnership tracking:**

- **Previous Owner Information**: Name and mobile number fields for used vehicles
- **Partnership Integration**: Complete partnership workflow in vehicle forms
- **Financial Calculations**: Automatic percentage calculations based on financing type
- **Real-time Validation**: Instant form validation and error feedback
- **Type Safety**: Full TypeScript integration with proper interfaces

### ✅ Business Benefits
- **Perfect Financial Accountability**: Zero discrepancies in cash tracking
- **Real-time Cash Visibility**: Always know exact cash position
- **Automated Reconciliation**: No manual cash counting needed
- **Complete Audit Trail**: Full history of all cash movements

---

## Business Requirements Document (BRD)

### 1.1 Executive Summary
The Car Rental Management System is a comprehensive web-based application designed to manage fleet operations for car rental businesses. The system provides real-time financial tracking, vehicle management, driver assignments, and automated rent collection with advanced ROI calculations.

### 1.2 Business Objectives
- **Fleet Management**: Track vehicle status, maintenance, insurance, and financial performance
- **Revenue Optimization**: Real-time rent collection with automated payment tracking
- **Financial Transparency**: Complete ROI calculations with break-even analysis
- **Operational Efficiency**: Streamlined driver assignments and expense management
- **Risk Management**: Insurance tracking and maintenance scheduling

### 1.3 Key Features
- **Multi-tenant Architecture**: Support for multiple rental companies
- **Real-time Financial Dashboard**: Live KPI monitoring and fleet utilization
- **Advanced ROI Engine**: Complex financial projections and break-even analysis
- **Automated Rent Collection**: Weekly rent tracking with payment status management
- **Expense Categorization**: Hierarchical expense tracking (Fuel, Maintenance, Insurance, Penalties)
- **Loan Management**: EMI tracking with amortization schedules and prepayment calculations
- **Document Management**: Cloud storage integration for vehicle documents and receipts

### 1.4 User Roles & Permissions
- **Company Admin**: Full access to all features within their company
- **Partner**: Business partners who own and operate vehicles, with profit-sharing arrangements
- **Super Admin**: System-wide access for managing multiple companies

### 1.5 Technical Requirements
- **Frontend**: React 18 with TypeScript, Vite build system
- **UI Framework**: shadcn/ui with Tailwind CSS
- **Backend**: Firebase Firestore (NoSQL database)
- **Authentication**: Firebase Auth with role-based access
- **Real-time Updates**: Live data synchronization across all users
- **Export Functionality**: Excel report generation using ExcelJS
- **Responsive Design**: Mobile-first approach with adaptive layouts

---

## System Architecture

### 2.1 Technology Stack
```
Frontend Framework: React 18 + TypeScript
Build Tool: Vite
UI Library: shadcn/ui + Tailwind CSS
Backend: Firebase (Firestore + Auth)
State Management: React Context + Custom Hooks
Form Handling: React Hook Form + Zod Validation
Icons: Lucide React
Charts: Recharts (planned)
File Upload: Cloudinary
Export: ExcelJS
```

### 2.2 Application Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Dashboard widgets
│   ├── Forms/          # Data entry forms
│   ├── Layout/         # App layout components
│   └── Modals/         # Modal dialogs
├── contexts/           # React contexts
├── hooks/              # Custom hooks for data management
├── lib/                # Utility functions
├── pages/              # Main application pages
├── types/              # TypeScript type definitions
└── config/             # Configuration files
```

### 2.3 Data Flow Architecture
- **Real-time Synchronization**: All data changes propagate instantly via Firestore listeners
- **Optimistic Updates**: UI updates immediately, with rollback on errors
- **Hierarchical Filtering**: Multi-level data filtering (Transaction Type → Payment Type → Expense Type)
- **Financial Calculations**: Client-side ROI engine with real-time updates

---

## Screen Logic & User Interfaces

### 3.1 Dashboard Page (`/dashboard`)
**Purpose**: Real-time overview of fleet performance and financial metrics

**Key Components**:
- **Fleet Statistics Cards**:
  - Total Vehicles, Rented Vehicles, Available Vehicles, Maintenance Vehicles
  - Fleet Utilization Percentage: `(rentedVehicles / totalVehicles) × 100`

- **Financial Overview Cards**:
  - Monthly Revenue: Sum of all paid payments in current month
  - Revenue Growth: `((currentMonth - lastMonth) / lastMonth) × 100`
  - Monthly Expenses: Sum of approved expenses in current month
  - Net Profit: `monthlyRevenue - totalMonthlyExpenses`
  - Profit Margin: `(monthlyProfit / monthlyRevenue) × 100`

- **Expense Breakdown**:
  - Fuel Expenses, Maintenance Expenses, Insurance Expenses
  - Filtered by expense type and description patterns

- **Alerts Section**:
  - Expiring Insurance: Vehicles with insurance expiring within 30 days
  - Expired Insurance: Vehicles with insurance already expired
  - Pending Collections: Payments with status 'due' or 'overdue'

- **Recent Activities**:
  - Last 10 transactions (payments + expenses)
  - Sorted by date (newest first)
  - Shows amount, description, and vehicle association

**Real-time Updates**: All metrics update automatically when data changes in Firestore.

### 3.2 Vehicles Page (`/vehicles`)
**Purpose**: Complete vehicle fleet management with financial tracking

**Key Features**:
- **Vehicle List**: Grid layout with status badges and key metrics
- **Add Vehicle Form**: Comprehensive vehicle registration with loan details
- **Vehicle Details Page**: Deep-dive financial analysis per vehicle

**Vehicle Status Logic**:
```typescript
Status Determination:
- 'rented': Has active assignment with status === 'active'
- 'available': No active assignment, operational status available
- 'maintenance': Explicitly marked for maintenance
```

### 3.3 Vehicle Details Page (`/vehicles/:vehicleId`)
**Purpose**: Comprehensive financial analysis and management for individual vehicles

**Tab Structure**:
1. **Overview Tab**: Basic vehicle info, current assignment, financial summary
2. **Financial Tab**: Detailed ROI calculations, investment breakdown
3. **Analytics Tab**: Charts and trends (planned implementation)
4. **EMI Tab**: Loan amortization schedule with payment tracking
5. **Rent Tab**: Weekly rent collection interface
6. **Expenses Tab**: Expense management with categorization
7. **Payments Tab**: Complete transaction history with 3-level filtering
8. **Documents Tab**: File upload and management
9. **Assignments Tab**: Historical assignment records

**Financial Summary Cards**:
- **Current ROI**: `(totalReturn - totalInvestment) / totalInvestment × 100`
- **Monthly Profit**: `monthlyRent - monthlyExpenses`
- **Outstanding Loan**: Remaining loan balance
- **Next EMI Due**: Next unpaid installment date
- **Days Until EMI**: Days until next payment is due

### 3.4 Financial Page (`/financial`)
**Purpose**: Comprehensive company-level financial management with per-vehicle accounting, period-based analysis, and payment actions

**Key Features**:
- **Multi-tab Interface**: Overview, Financial Analytics, Expenses, Payment History, Accounts
- **Flexible Period Filtering**: Yearly, Quarterly, Monthly analysis with dynamic data updates
- **Partner Filtering**: Filter vehicles by ownership type (All, Partner, Company)
- **Real-time Cash Balance**: Company-wide cash in hand tracking
- **Per-Vehicle Accounting**: Individual vehicle financial cards with payment actions

**Period Selection Controls**:
- **Filter Type**: Dropdown selection (Monthly/Quarterly/Yearly)
- **Year Selection**: Always available for all filter types
- **Month Selection**: Available for Monthly and Quarterly filters
- **Quarter Selection**: Available for Quarterly filter
- **Vehicle Type Filter**: All Vehicles, Partner Vehicles, Company Vehicles

**Company Financial Data Structure**:
```typescript
companyFinancialData = {
  selectedYear: string,           // Selected year for analysis
  selectedMonth: string,          // Selected month (1-12)
  selectedQuarter: string,        // Selected quarter (Q1-Q4)
  filterType: 'yearly' | 'quarterly' | 'monthly',  // Current filter type
  partnerFilter: 'all' | 'partner' | 'company',    // Vehicle ownership filter
  periodLabel: string,            // Display label (e.g., "October 2025 (Monthly)")
  monthName: string,              // Full month name (e.g., "October")
  totalEarnings: number,          // Total earnings for period
  totalExpenses: number,          // Total expenses for period
  totalProfit: number,            // Net profit for period
  vehicleData: VehicleInfo[],     // Array of vehicle financial data
  payments: Payment[],            // Payment records for period
  expenses: Expense[]             // Expense records for period
}
```

#### FinancialAccountsTab Component
**Purpose**: Per-vehicle accounting interface with payment actions and period-based financial calculations

**Component Props**:
```typescript
interface FinancialAccountsTabProps {
  companyFinancialData: CompanyFinancialData;
  accountingTransactions: AccountingTransaction[];
  setAccountingTransactions: (transactions: AccountingTransaction[]) => void;
}
```

**Key Functionality**:

**Period-Based Data Calculation** (`getPeriodData` function):
- **Month Determination**: Based on `companyFinancialData.filterType`
  - Yearly: All 12 months (0-11)
  - Quarterly: 3 months based on selected quarter
  - Monthly: Single month based on `monthName` index
- **Vehicle Filtering**: Applied based on `partnerFilter` ('all', 'partner', 'company')
- **Cumulative Calculations**: Sums data across selected months for each vehicle

**Per-Vehicle Financial Calculations**:
```typescript
// Earnings: Sum of paid payments in period
vehicleEarnings = payments.filter(p =>
  p.vehicleId === vehicle.id &&
  p.status === 'paid' &&
  date >= monthStart && date <= monthEnd
).reduce((sum, p) => sum + p.amountPaid, 0)

// Expenses: Sum of approved expenses in period
vehicleExpenses = expenses.filter(e =>
  e.vehicleId === vehicle.id &&
  e.status === 'approved' &&
  date >= monthStart && date <= monthEnd
).reduce((sum, e) => sum + e.amount, 0)

// Profit: Earnings minus expenses
vehicleProfit = vehicleEarnings - vehicleExpenses

// GST Calculation (4% of profit for positive profit)
gstAmount = vehicleProfit > 0 ? vehicleProfit * 0.04 : 0

// Service Charge (10% for partner vehicles with positive profit)
serviceCharge = isPartnerVehicle && vehicleProfit > 0 ?
  vehicleProfit * serviceChargeRate : 0

// Partner Share (configurable % after GST and service charge)
remainingProfit = vehicleProfit - gstAmount - serviceCharge
partnerShare = isPartnerVehicle && remainingProfit > 0 ?
  remainingProfit * partnerSharePercentage : 0

// Owner Share (remaining profit for partner vehicles)
ownerShare = isPartnerVehicle && remainingProfit > 0 ?
  remainingProfit * (1 - partnerSharePercentage) : 0

// Owner Full Share (profit after GST for company vehicles)
ownerFullShare = !isPartnerVehicle && (vehicleProfit - gstAmount) > 0 ?
  vehicleProfit - gstAmount : 0
```

**Payment Actions**:

**GST Payment** (`handleGstPayment`):
- Records GST payment transaction in `accountingTransactions` collection
- Decreases vehicle cash balance by GST amount
- Updates company cash balance
- Updates local state for immediate UI feedback

**Service Charge Collection** (`handleServiceChargeCollection`):
- Records service charge collection (additional income)
- Increases vehicle cash balance by service charge amount
- Updates company cash balance
- Updates local state

**Partner Payment** (`handlePartnerPayment`):
- Records partner share payment
- Decreases vehicle cash balance by partner share amount
- Updates company cash balance
- Updates local state

**Owner Share Collection** (`handleOwnerShareCollection`):
- Records owner share collection from partner vehicles
- Decreases vehicle cash balance by owner share amount
- Updates company cash balance
- Updates local state

**Owner Withdrawal** (`handleOwnerWithdrawal`):
- Records full owner share withdrawal from company vehicles
- Decreases vehicle cash balance by full owner share amount
- Updates company cash balance
- Updates local state

**Period String Generation**:
```typescript
periodStr = filterType === 'yearly' ? `${year}` :
           filterType === 'quarterly' ? `${year}-${selectedQuarter}` :
           `${year}-${monthName}`
```

**Payment Status Tracking**:
- Checks `accountingTransactions` for completed payments
- Updates UI badges (Paid/Pending) based on transaction status
- Prevents duplicate payments for same period

**Cash Balance Management**:
- Loads initial cash balances from `cashInHand` collection
- Real-time updates via Firestore listeners
- Dual cash tracking: individual vehicles + company total
- Atomic updates using Firestore increment operations

**Data Display Structure**:
```typescript
periodData = vehicleData.map(vehicle => ({
  ...vehicle,
  earnings: cumulativeEarnings,
  expenses: cumulativeExpenses,
  profit: cumulativeProfit,
  gstAmount: cumulativeGst,
  serviceCharge: cumulativeServiceCharge,
  partnerShare: cumulativePartnerShare,
  ownerShare: cumulativeOwnerShare,
  ownerFullShare: cumulativeOwnerFullShare,
  gstPaid: boolean,
  serviceChargeCollected: boolean,
  partnerPaid: boolean,
  ownerShareCollected: boolean,
  ownerWithdrawn: boolean,
  periodStr: string
}))
```

**Period Totals Calculation**:
```typescript
periodTotals = {
  totalEarnings: periodData.reduce((sum, v) => sum + v.earnings, 0),
  totalExpenses: periodData.reduce((sum, v) => sum + v.expenses, 0),
  totalProfit: periodData.reduce((sum, v) => sum + v.profit, 0),
  totalGst: periodData.reduce((sum, v) => sum + v.gstAmount, 0),
  totalServiceCharge: periodData.reduce((sum, v) => sum + v.serviceCharge, 0),
  totalPartnerShare: periodData.reduce((sum, v) => sum + v.partnerShare, 0),
  totalOwnerShare: periodData.reduce((sum, v) => sum + v.ownerShare, 0),
  totalOwnerFullShare: periodData.reduce((sum, v) => sum + v.ownerFullShare, 0),
  vehicleCount: periodData.length
}
```

**UI Components**:
- **Period Summary Card**: Shows totals across all vehicles for selected period
- **Vehicle Accounting Cards**: Individual cards for each vehicle with financial data and action buttons
- **Payment Status Badges**: Visual indicators for completed/pending payments
- **Cash Balance Display**: Current cash in hand for each vehicle

**Real-time Updates**:
- Period filter changes immediately recalculate all data
- Payment actions instantly update cash balances and transaction history
- Partner filter changes dynamically update displayed vehicles
- All calculations respond to parent component data changes

### 3.5 Drivers Page (`/drivers`)
**Purpose**: Driver management and assignment tracking

**Key Features**:
- **Driver List**: Active/inactive status with assigned vehicles
- **Add Driver Form**: Complete driver profile with documents
- **Driver Details**: Assignment history and performance metrics

### 3.6 Assignments Page (`/assignments`)
**Purpose**: Rental agreement management

**Key Components**:
- **Active Assignments**: Currently running rental contracts
- **Assignment Details**: Weekly rent collection interface
- **Payment Tracking**: Automated due date calculations

### 3.7 Payments Page (`/payments`)
**Purpose**: Centralized payment tracking across all vehicles

**Advanced Filtering System**:
- **Level 1 - Transaction Type**: 'all' | 'paid' | 'received'
- **Level 2 - Payment Type**: 'all' | 'emi' | 'prepayment' | 'expenses' | 'rent'
- **Level 3 - Expense Type**: 'all' | 'maintenance' | 'insurance' | 'fuel' | 'penalties' | 'general'

### 3.8 Fuel Records Page (`/fuel-records`)
**Purpose**: Fuel expense tracking and efficiency monitoring

**Key Features**:
- **Fuel Entry Form**: Odometer reading, quantity, price per liter
- **Efficiency Calculations**: km/liter, cost per km
- **Historical Tracking**: Fuel consumption patterns

### 3.9 Authentication System
**Login Flow**:
1. Email/password authentication via Firebase Auth
2. User info retrieval from hierarchical Firestore structure:
   - Super Admin: `Easy2Solutions/companyDirectory/superAdmins/{userId}`
   - Company User: `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/users/{userId}`
   - Common User: `Easy2Solutions/companyDirectory/users/{userId}`
3. Role-based routing and feature access

---

## Hooks Logic & Data Management

### 4.1 Core Data Management Hook (`useFirebaseData`)

**Primary Functions**:
- **Real-time Data Fetching**: Firestore listeners for all collections
- **CRUD Operations**: Create, Read, Update, Delete for all entities
- **Financial Calculations**: Client-side ROI engine
- **Data Relationships**: Maintains referential integrity across collections

**Hook Structure**:
```typescript
export const useFirebaseData = () => {
  // Individual entity hooks
  const { drivers, loading: driversLoading, addDriver } = useDrivers();
  const { vehicles, loading: vehiclesLoading, addVehicle, updateVehicle } = useVehicles();
  const { assignments, loading: assignmentsLoading, addAssignment } = useAssignments();
  const { payments, loading: paymentsLoading, markPaymentCollected } = usePayments();
  const { expenses, loading: expensesLoading, addExpense, updateExpense } = useExpenses();

  // Combined loading state
  const loading = driversLoading || vehiclesLoading || ...;

  // Enhanced vehicle data with financial calculations
  const getVehicleFinancialData = (vehicleId: string): VehicleFinancialData | null => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return null;
    return calculateVehicleFinancials(vehicleId, vehicle, assignments, payments, expenses);
  };

  return {
    // Data arrays
    drivers, vehicles, assignments, payments, expenses,

    // Enhanced vehicles with financial data
    vehiclesWithFinancials: vehicles.map(vehicle => ({
      ...vehicle,
      financialData: calculateVehicleFinancials(vehicle.id, vehicle, assignments, payments, expenses)
    })),

    // Helper functions
    getVehicleFinancialData,

    // Action functions
    addDriver, addVehicle, updateVehicle, addAssignment, markPaymentCollected, addExpense, updateExpense,

    loading
  };
};
```

### 4.2 Individual Entity Hooks

#### `useDrivers()` Hook
```typescript
// Real-time driver data fetching
useEffect(() => {
  if (!userInfo?.companyId) return;

  const driversRef = collection(firestore, paths.getUsersPath());
  const unsubscribe = onSnapshot(driversRef, (snapshot) => {
    const driversData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Driver[];
    setDrivers(driversData);
    setLoading(false);
  });

  return () => unsubscribe();
}, [userInfo?.companyId]);
```

#### `useVehicles()` Hook
- Similar real-time fetching pattern
- Includes vehicle status calculation logic
- Handles complex vehicle data with loan details

#### `useAssignments()` Hook
- Active assignment tracking
- Weekly rent calculation logic
- Assignment status management

#### `usePayments()` Hook
- Payment status tracking ('due', 'paid', 'overdue')
- Automated due date calculations
- Payment collection workflow

#### `useExpenses()` Hook
- Hierarchical expense categorization
- Approval workflow management
- Expense type classification

### 4.3 Firestore Path Management (`useFirestorePaths`)

**Purpose**: Centralized path management for multi-tenant architecture

```typescript
export const useFirestorePaths = (companyId?: string) => {
  const basePath = 'Easy2Solutions/companyDirectory';

  return useMemo(() => ({
    // Company-specific paths
    getUsersPath: () => companyId ? `${basePath}/tenantCompanies/${companyId}/users` : '',
    getVehiclesPath: () => companyId ? `${basePath}/tenantCompanies/${companyId}/vehicles` : '',
    getAssignmentsPath: () => companyId ? `${basePath}/tenantCompanies/${companyId}/assignments` : '',
    getExpensesPath: () => companyId ? `${basePath}/tenantCompanies/${companyId}/expenses` : '',
    getPaymentsPath: () => companyId ? `${basePath}/tenantCompanies/${companyId}/payments` : '',

    // Additional collections
    getFuelRecordsPath: () => companyId ? `${basePath}/tenantCompanies/${companyId}/fuelRecords` : '',
    getFuelPricesPath: () => companyId ? `${basePath}/tenantCompanies/${companyId}/fuelPrices` : '',
    getMaintenanceRecordsPath: () => companyId ? `${basePath}/tenantCompanies/${companyId}/maintenanceRecords` : '',
    getInsuranceRecordsPath: () => companyId ? `${basePath}/tenantCompanies/${companyId}/insuranceRecords` : '',
  }), [companyId]);
};
```

### 4.4 Authentication Context (`AuthContext`)

**Key Features**:
- **Multi-level User Resolution**: Checks multiple Firestore paths for user data
- **Local Storage Caching**: Stores user info to reduce Firestore calls
- **Role-based Access**: Different permissions based on user role
- **Company Isolation**: Users can only access their company's data

---

## Financial Formulas & Calculations

### 5.1 Data Sources & Field Documentation

This section documents all visible data fields in the Analytics and Financial tabs, including their data sources, calculation formulas, and Firebase collection references.

#### Analytics Tab - Current Loan Status Card

**Prepayment (Principal)**
- **Data Source**: `expenseData.vehicleExpenses` (Firebase: `expenses` collection)
- **Filter Criteria**: `e.description.toLowerCase().includes('prepayment') || e.description.toLowerCase().includes('principal') || e.paymentType === 'prepayment' || e.type === 'prepayment'`
- **Calculation**: `Sum of approved expenses matching prepayment criteria`
- **Purpose**: Tracks principal payments made upfront to reduce loan balance

**Principal (EMI)**
- **Data Source**: Calculated from loan amortization simulation
- **Formula**: `principalPaidFromEMI = Σ(principalPayment)` where `principalPayment = min(emiPerMonth - interestPayment, remainingBalance)`
- **Variables**:
  - `remainingBalance = vehicle.loanDetails.totalLoan - prepayments` (initially)
  - `interestPayment = remainingBalance × monthlyRate`
  - `monthlyRate = loanDetails.interestRate / 100 / 12`
- **Purpose**: Cumulative principal portion of EMI payments made

**Total Principal Paid**
- **Formula**: `prepayments + principalPaidFromEMI`
- **Purpose**: Total principal reduction achieved through prepayments + EMI principal payments

**Interest (EMI)**
- **Data Source**: Calculated from loan amortization simulation
- **Formula**: `interestPaidTillDate = Σ(remainingBalance × monthlyRate)` for each EMI period
- **Purpose**: Cumulative interest portion paid through EMI payments

**Total Loan Paid Till Date (with interest)**
- **Formula**: `principalPaidFromEMI + interestPaidTillDate`
- **Purpose**: Total amount paid towards loan through EMI payments (principal + interest)

**Total EMI Paid Till Date**
- **Formula**: `principalPaidFromEMI + interestPaidTillDate` (same as above)
- **Purpose**: Total EMI payments made (equivalent to Total Loan Paid Till Date)

**Outstanding Loan Amount**
- **Data Source**: `financialData.outstandingLoan` (calculated in useFirebaseData hook)
- **Formula**: `outstandingLoan = totalLoan - totalEmiPaid - prepayments`
- **Purpose**: Remaining loan balance after all payments

#### Analytics Tab - Loan Projection Card

**Prepayment**
- **Same as Current Loan Status "Prepayment (Principal)"**
- **Purpose**: Shows prepayments in projection context

**Principal (EMI)**
- **Data Source**: Calculated from projection simulation for selected years
- **Formula**: `principalPaidFromEMI = Σ(principalPayment)` over projection period
- **Variables**: Same amortization logic as current status, but only for projection timeframe
- **Purpose**: Principal portion that will be paid through EMIs in the projection period

**Total Principal Paid**
- **Formula**: `prepayments + principalPaidFromEMI` (projection)
- **Purpose**: Total principal reduction after projection period

**Interest (EMI)**
- **Data Source**: Calculated from projection simulation
- **Formula**: `interestPaidInPeriod = Σ(remainingBalance × monthlyRate)` over projection period
- **Purpose**: Interest that will be paid through EMIs in the projection period

**Total Loan Paid After X Year(s) (with interest)**
- **Formula**: `prepayments + principalPaidFromEMI + interestPaidInPeriod`
- **Purpose**: Total amount paid towards loan after projection period (all components)

**Total EMI (X Year(s))**
- **Formula**: `principalPaidFromEMI + interestPaidInPeriod`
- **Purpose**: Total EMI payments that will be made in the projection period

**Outstanding After X Year(s)**
- **Formula**: `max(0, remainingBalance)` after projection simulation
- **Purpose**: Loan balance remaining after projection period

#### Financial Tab - Investment & Returns Card

**Initial investment**
- **Data Source**: `vehicle.initialInvestment || vehicle.initialCost` (Firebase: `vehicles` collection)
- **Purpose**: Original purchase price of the vehicle

**Prepayment**
- **Same as Analytics "Prepayment (Principal)"**
- **Purpose**: Principal payments made upfront

**Total expenses**
- **Data Source**: `expenseData.totalExpenses` (calculated in useFirebaseData hook)
- **Formula**: Sum of all approved vehicle expenses excluding prepayments
- **Purpose**: Total operational costs incurred

**Total investment**
- **Formula**: `initialInvestment + prepayments + totalExpenses`
- **Purpose**: Complete capital invested in the vehicle

**Total Earnings**
- **Data Source**: `financialData.totalEarnings` (calculated in useFirebaseData hook)
- **Formula**: Sum of all paid rent collections for the vehicle
- **Firebase Source**: `payments` collection, filtered by `vehicleId` and `status === 'paid'`
- **Purpose**: Total revenue generated from vehicle rental

**Current Vehicle Value**
- **Data Source**: `vehicle.residualValue` (Firebase: `vehicles` collection)
- **Fallback Calculation**: `initialInvestment × (1 - depreciationRate)^operationalYears`
- **Variables**:
  - `depreciationRate = vehicle.depreciationRate || 10` (% per year)
  - `operationalYears = max(1, currentYear - purchaseYear + 1)`
- **Purpose**: Current market value of the vehicle after depreciation

**Outstanding Loan**
- **Same as Analytics "Outstanding Loan Amount"**
- **Purpose**: Remaining loan balance

**Total Return**
- **Formula**: `currentVehicleValue + totalEarnings - outstandingLoan`
- **Purpose**: Net financial return from the investment

**Investment Status**
- **Data Source**: `financialData.isInvestmentCovered` (calculated in useFirebaseData)
- **Formula**: `totalReturn >= totalInvestment`
- **Display**: Badge showing "Investment Covered" when true
- **Purpose**: Indicates if the vehicle investment has been recovered

**ROI**
- **Formula**: `((totalReturn - totalInvestment) / totalInvestment) × 100`
- **Purpose**: Return on investment percentage

**Total Net Cash Flow**
- **Formula**: `totalEarnings - totalOperatingExpenses`
- **Purpose**: Net cash generated from operations

**Profit/Loss**
- **Formula**: `(totalReturn - totalInvestment)` with percentage
- **Percentage**: `(profitLoss / totalInvestment) × 100`
- **Purpose**: Net profit or loss from the vehicle investment

#### Financial Tab - Monthly Breakdown Card

**Monthly Earnings**
- **Data Source**: `firebasePayments` (Firebase: `payments` collection)
- **Filter**: `vehicleId === vehicleId && status === 'paid' && new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart && new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd`
- **Formula**: `Sum of amountPaid for matching payments`
- **Purpose**: Revenue earned in the selected month

**Monthly Expenses**
- **Data Source**: `expenseData.vehicleExpenses` (Firebase: `expenses` collection)
- **Filter**: `vehicleId === vehicleId && status === 'approved' && new Date(e.date || e.createdAt) >= monthStart && new Date(e.date || e.createdAt) <= monthEnd`
- **Formula**: `Sum of amount for matching expenses`
- **Purpose**: Operational costs incurred in the selected month

**Monthly EMI**
- **Data Source**: `vehicle.loanDetails.emiPerMonth` (Firebase: `vehicles.loanDetails`)
- **Purpose**: Monthly loan installment amount

**Net Operating Profit**
- **Formula**: `monthlyEarnings - monthlyExpenses`
- **Purpose**: Profit before EMI deduction

**After EMI Deduction**
- **Formula**: `netOperatingProfit - monthlyEMI` (if financed)
- **Purpose**: Profit after loan payment

**Yearly Profit (Est.)**
- **Formula**: `netOperatingProfit × 12`
- **Purpose**: Estimated annual profit based on monthly performance

#### Financial Tab - Historical Averages

**Monthly Earnings**
- **Data Source**: `financialData.isCurrentlyRented ? financialData.monthlyRent : 0`
- **Formula**: `(weeklyRent * 52) / 12` (calculated in useFirebaseData)
- **Purpose**: Average monthly revenue

**Monthly Expenses (Avg.)**
- **Data Source**: `financialData.monthlyExpenses` (calculated in useFirebaseData)
- **Formula**: `totalExpenses / operationalMonths`
- **Purpose**: Average monthly operational costs

**Monthly EMI**
- **Same as Monthly Breakdown "Monthly EMI"**
- **Purpose**: Monthly loan installment (same value)

**Net Operating Profit**
- **Formula**: `monthlyEarnings - monthlyExpenses` (using averages)
- **Purpose**: Average monthly profit before EMI

**After EMI Deduction**
- **Formula**: `netOperatingProfit - monthlyEMI` (using averages)
- **Purpose**: Average monthly profit after EMI

**Yearly Profit (Est.)**
- **Formula**: `netOperatingProfit × 12` (using averages)
- **Purpose**: Estimated annual profit from averages

#### Financial Tab - Performance Comparison

**Earnings Comparison**
- **Formula**: `currentMonthEarnings >= historicalAverage ? '↑ Above Avg' : '↓ Below Avg'`
- **Purpose**: Performance indicator vs historical average

**Expenses Comparison**
- **Formula**: `currentMonthExpenses <= historicalAverage ? '↓ Below Avg' : '↑ Above Avg'`
- **Purpose**: Cost efficiency indicator

**Profit Comparison**
- **Formula**: `currentMonthData.netOperatingProfit >= financialData.monthlyProfit ? '↑ Above Avg' : '↓ Below Avg'`
- **Purpose**: Profitability performance indicator

#### Financial Tab - Monthly Net Cash Flow

**Monthly Net Cash Flow**
- **Data Source**: `historicalMonthlyNetCashFlow` (calculated in useFirebaseData)
- **Formula**: `(totalEarnings - totalExpenses) / operationalMonths`
- **Purpose**: Average monthly cash flow from operations

#### Financial Tab - Loan Details

**Original Loan**
- **Data Source**: `vehicle.loanDetails.totalLoan` (Firebase: `vehicles.loanDetails`)
- **Purpose**: Total loan amount sanctioned

**Outstanding Balance**
- **Same as Analytics "Outstanding Loan Amount"**
- **Purpose**: Remaining loan balance

**EMIs Paid**
- **Data Source**: `vehicle.loanDetails.paidInstallments?.length` (count)
- **Amount**: `financialData.totalEmiPaid` (total amount paid)
- **Formula**: `paidInstallments.length + ' / ' + totalInstallments`
- **Purpose**: EMI payment progress

**Next EMI Due**
- **Data Source**: `financialData.nextEMIDue` (calculated in useFirebaseData)
- **Days Until**: `financialData.daysUntilEMI`
- **Purpose**: Next payment schedule information

#### Financial Tab - Prepayment Calculator

**Outstanding**
- **Same as Analytics "Outstanding Loan Amount"**
- **Purpose**: Current loan balance for prepayment calculation

**Prepayment Amount**
- **Data Source**: User input (`prepaymentAmount` state)
- **Purpose**: Amount user wants to prepay

**New Outstanding**
- **Formula**: `outstandingLoan - prepaymentAmount`
- **Purpose**: Loan balance after prepayment

**Tenure Reduction**
- **Formula**: `currentTenureMonths - newTenureMonths`
- **Calculation**: Recalculates EMI schedule with reduced principal
- **Purpose**: Months saved from loan tenure

**Interest Savings**
- **Formula**: `(originalTotalPayments - outstandingLoan) - (newTotalPayments - newOutstanding)`
- **Purpose**: Interest amount saved due to reduced tenure

#### Financial Tab - Total Returns Breakdown

**Current Car Value**
- **Data Source**: Calculated inline in component
- **Formula**: `initialValue × (1 - depreciationPerYear)^operationalYears`
- **Variables**:
  - `initialValue = vehicle.initialInvestment || vehicle.initialCost || 0`
  - `depreciationPerYear = (vehicle.depreciationRate ?? 10) / 100`
  - `operationalYears = max(1, currentYear - purchaseYear + 1)`
  - `purchaseYear = vehicle.year || currentYear`
- **Purpose**: Calculated depreciated value of the vehicle

**Total Earnings**
- **Same as Investment & Returns "Total Earnings"**
- **Purpose**: Revenue contribution to returns

**Outstanding Loan**
- **Same as Analytics "Outstanding Loan Amount"**
- **Purpose**: Liability deduction from returns

**Total Returns**
- **Same as Investment & Returns "Total Return"**
- **Purpose**: Net financial return

#### Financial Tab - Total Expenses Breakdown

**Fuel Expenses**
- **Data Source**: `expenseData.fuelExpenses` (calculated in useFirebaseData)
- **Filter**: `expenseType === 'fuel' || description.includes('fuel') || description.includes('petrol') || description.includes('diesel')`
- **Purpose**: Fuel costs incurred

**Maintenance**
- **Data Source**: `expenseData.maintenanceExpenses` (calculated in useFirebaseData)
- **Filter**: `expenseType === 'maintenance' || type === 'maintenance' || description.includes('maintenance') || description.includes('repair') || description.includes('service')`
- **Purpose**: Vehicle maintenance and repair costs

**Insurance**
- **Data Source**: `expenseData.insuranceExpenses` (calculated in useFirebaseData)
- **Filter**: `expenseType === 'insurance' || type === 'insurance' || description.includes('insurance')`
- **Purpose**: Insurance premium payments

**Penalties**
- **Data Source**: `expenseData.penaltyExpenses` (calculated in useFirebaseData)
- **Filter**: `expenseType === 'penalties' || type === 'penalties' || description.includes('penalty') || description.includes('fine')`
- **Purpose**: Traffic fines and penalties

**EMI Payments**
- **Data Source**: `expenseData.emiPayments` (calculated in useFirebaseData)
- **Filter**: `paymentType === 'emi' || type === 'emi' || description.includes('emi')`
- **Purpose**: Loan installment payments

**Other Expenses**
- **Formula**: `totalExpenses - (fuelExpenses + maintenanceExpenses + insuranceExpenses + penaltyExpenses + emiPayments)`
- **Purpose**: Miscellaneous expenses not categorized above

**Total Expenses**
- **Data Source**: `expenseData.totalExpenses`
- **Formula**: Sum of all approved vehicle expenses excluding prepayments
- **Purpose**: Complete operational cost tracking

#### 5.1.4 Expense Management Hierarchy

This section documents the hierarchical structure of expense categorization and recording in the system, showing how different types of expenses are organized and managed.

```
📊 Expense Recording System
├── 🎯 Transaction Type Level (paymentType)
│   ├── 💰 EMI Payments (paymentType: 'emi')
│   │   ├── 📝 Description-based identification
│   │   │   ├── "emi" in description
│   │   │   └── "installment" in description
│   │   └── 📊 Aggregation: emiPayments total
│   │
│   ├── 🔄 Prepayments (paymentType: 'prepayment')
│   │   ├── 📝 Description-based identification
│   │   │   ├── "prepayment" in description
│   │   │   └── "principal" in description
│   │   ├── 💰 Separate tracking (not included in operational expenses)
│   │   └── 📊 Aggregation: prepayments total
│   │
│   └── 🛠️ Operational Expenses (paymentType: 'expenses')
│       ├── ⛽ Fuel Expenses (expenseType: 'fuel')
│       │   ├── 📝 Identification methods
│       │   │   ├── expenseType === 'fuel'
│       │   │   ├── "fuel" in description
│       │   │   ├── "petrol" in description
│       │   │   └── "diesel" in description
│       │   └── 📊 Aggregation: fuelExpenses total
│       │
│       ├── 🔧 Maintenance Expenses (expenseType: 'maintenance')
│       │   ├── 📝 Identification methods
│       │   │   ├── expenseType === 'maintenance'
│       │   │   ├── type === 'maintenance' (legacy)
│       │   │   ├── expenseType === 'repair'
│       │   │   ├── expenseType === 'service'
│       │   │   ├── "maintenance" in description
│       │   │   ├── "repair" in description
│       │   │   └── "service" in description
│       │   └── 📊 Aggregation: maintenanceExpenses total
│       │
│       ├── 🛡️ Insurance Expenses (expenseType: 'insurance')
│       │   ├── 📝 Identification methods
│       │   │   ├── expenseType === 'insurance'
│       │   │   ├── type === 'insurance' (legacy)
│       │   │   └── "insurance" in description
│       │   └── 📊 Aggregation: insuranceExpenses total
│       │
│       ├── ⚠️ Penalty Expenses (expenseType: 'penalties')
│       │   ├── 📝 Identification methods
│       │   │   ├── expenseType === 'penalties'
│       │   │   ├── type === 'penalties' (legacy)
│       │   │   ├── expenseType === 'penalty'
│       │   │   ├── expenseType === 'fine'
│       │   │   ├── "penalty" in description
│       │   │   ├── "fine" in description
│       │   │   └── "late fee" in description
│       │   └── 📊 Aggregation: penaltyExpenses total
│       │
│       └── 📦 Other/General Expenses (expenseType: 'general')
│           ├── 📝 Fallback category for uncategorized expenses
│           ├── 📊 Calculation: totalExpenses - categorizedExpenses
│           └── 📊 Aggregation: otherExpenses total
│
├── 📈 Calculation Logic
│   ├── 💵 Total Operational Expenses
│   │   └── Excludes prepayments from total
│   ├── 📊 Monthly Average (12-month rolling)
│   │   └── Based on recent operational expenses
│   └── 📊 Expense Ratio
│       └── totalExpenses / totalEarnings × 100
│
└── 🔍 Data Sources & Processing
    ├── 🗃️ Firebase Collection: expenses
    ├── 🔄 Real-time updates via useExpenses hook
    ├── 📱 Components: ExpensesTab, FinancialTab, EMITab
    └── 📊 Export: Excel integration with category breakdowns
```

##### Key Hierarchical Insights:

**3-Level Categorization System**: Transaction Type → Payment Sub-Type → Expense Sub-Type

**Dual Classification Fields**:
- `paymentType`: High-level transaction classification ('emi', 'prepayment', 'expenses')
- `expenseType`: Detailed expense categorization within operational expenses

**Backward Compatibility**: Legacy `type` field still supported alongside new hierarchical fields

**Smart Categorization**: Multiple identification methods (exact field match + description keywords)

**Financial Impact**:
- EMI & Prepayments: Loan-related, separate from operational costs
- Operational Expenses: Day-to-day running costs, included in profitability calculations
- Prepayments excluded from total expense calculations for accurate operational metrics

**Aggregation Strategy**: Each category summed separately, with "Other" as catch-all for uncategorized expenses

This hierarchical structure allows for detailed expense tracking while maintaining flexibility for different types of financial transactions in the fleet rental business.

### 5.2 Core Financial Calculations

### 5.2 Advanced Financial Projections (`calculateProjection` Function)

#### Projection Parameters
```typescript
const calculateProjection = (
  years: number,
  assumedMonthlyRent?: number,
  increasedEMIAmount?: number,
  netCashFlowMode?: boolean
) => {
  const months = years * 12;

  // Fixed investment (doesn't grow over time)
  const fixedInvestment = (vehicle.initialInvestment || 0) + prepayments;

  // Current financial state
  const currentTotalEarnings = financialData.totalEarnings;
  const currentTotalOperatingExpenses = expenseData.totalExpenses;
  const currentOutstandingLoan = financialData.outstandingLoan;
  const currentTotalEmiPaid = financialData.totalEmiPaid;
```

#### Monthly Projection Simulation
```typescript
// Simulate each month
for (let month = 0; month < months; month++) {
  // Add monthly earnings and operating expenses
  projectedEarnings += monthlyEarnings;
  projectedOperatingExpenses += monthlyOperatingExpenses;

  // Process loan payments
  if (projectedOutstandingLoan > 0) {
    const monthlyInterest = projectedOutstandingLoan * monthlyInterestRate;
    const monthlyPrincipal = Math.min(monthlyEMI - monthlyInterest, projectedOutstandingLoan);
    projectedEmiPaid += monthlyInterest + monthlyPrincipal;
    projectedOutstandingLoan -= monthlyPrincipal;
  }

  // Apply yearly depreciation
  if ((month + 1) % 12 === 0) {
    projectedDepreciatedCarValue *= (1 - depreciationPerYear);
  }
}
```

#### Break-even Analysis
```typescript
// Find when cumulative total return >= cumulative total investment
let breakEvenMonths = 0;
while (breakEvenMonths < 120) { // Max 10 years
  // Monthly updates for earnings, expenses, EMI payments
  tempEarnings += monthlyEarnings;
  tempOperatingExpenses += monthlyOperatingExpenses;

  // Process loan payments
  if (tempOutstandingLoan > 0) {
    const interest = tempOutstandingLoan * monthlyInterestRate;
    const principal = Math.min(monthlyEMI - interest, tempOutstandingLoan);
    tempEmiPaid += interest + principal;
    tempOutstandingLoan -= principal;
  }

  // Check break-even condition
  const tempTotalReturn = tempEarnings + tempDepreciatedCarValue - tempOutstandingLoan;
  const tempProfitLoss = tempTotalReturn - fixedInvestment;

  if (tempProfitLoss >= 0) {
    breakEvenDate = new Date();
    breakEvenDate.setMonth(breakEvenDate.getMonth() + breakEvenMonths);
    break;
  }

  breakEvenMonths++;
}
```

### 5.3 Loan Management Calculations

#### EMI Calculation (Standard Formula)
```
EMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1]

Where:
- P = Principal loan amount
- r = Monthly interest rate (annual rate / 12)
- n = Number of installments
```

#### Prepayment Impact Calculation
```typescript
const handlePrepayment = () => {
  const amount = parseFloat(prepaymentAmount);
  const outstandingLoan = financialData.outstandingLoan;

  // Calculate new outstanding and tenure
  const monthlyRate = (vehicle.loanDetails?.interestRate || 8.5) / 12 / 100;
  const newOutstanding = outstandingLoan - amount;
  const emiPerMonth = vehicle.loanDetails?.emiPerMonth || 0;

  // Get current loan details
  const totalInstallments = vehicle.loanDetails?.totalInstallments || 0;
  const paidInstallments = vehicle.loanDetails?.paidInstallments?.length || 0;
  const remainingInstallments = totalInstallments - paidInstallments;

  // Calculate current remaining tenure (only for unpaid EMIs)
  let currentTenure = remainingInstallments;
  let tempOutstanding = outstandingLoan;

  // If there are still EMIs to pay, calculate exact remaining tenure
  if (remainingInstallments > 0) {
    currentTenure = 0;
    while (tempOutstanding > 0 && currentTenure < remainingInstallments) {
      const interest = tempOutstanding * monthlyRate;
      const principal = Math.min(emiPerMonth - interest, tempOutstanding);
      tempOutstanding -= principal;
      currentTenure++;
      if (principal <= 0 || tempOutstanding <= 0) break;
    }
  }

  // Calculate new tenure with reduced principal (only for remaining EMIs)
  let newTenure = 0;
  let tempOutstandingNew = newOutstanding;
  while (tempOutstandingNew > 0 && newTenure < remainingInstallments) {
    const interest = tempOutstandingNew * monthlyRate;
    const principal = Math.min(emiPerMonth - interest, tempOutstandingNew);
    tempOutstandingNew -= principal;
    newTenure++;
    if (principal <= 0 || tempOutstandingNew <= 0) break;
  }

  const tenureReduction = Math.max(0, currentTenure - newTenure);

  // Calculate interest savings correctly (only for remaining EMIs)
  const originalTotalPayments = currentTenure * emiPerMonth;
  const originalInterest = originalTotalPayments - outstandingLoan;

  const newTotalPayments = newTenure * emiPerMonth;
  const newInterest = newTotalPayments - newOutstanding;

  const interestSavings = Math.max(0, originalInterest - newInterest);
};
```

**Prepayment Formulas:**
```
Tenure Reduction = Current Remaining Tenure - New Remaining Tenure

Interest Savings = (Original Total Payments - Original Outstanding) - (New Total Payments - New Outstanding)

Where:
- Current Remaining Tenure = Months needed to pay off current outstanding loan (unpaid EMIs only)
- New Remaining Tenure = Months needed to pay off loan after prepayment (unpaid EMIs only)
- Original Total Payments = Current Tenure × EMI per Month
- New Total Payments = New Tenure × EMI per Month
```

#### Fresh Loan Restructuring After Prepayment
```typescript
const recalculateAmortizationSchedule = (
  currentSchedule: EMIScheduleItem[],
  newOutstanding: number,
  emiPerMonth: number,
  interestRate: number
) => {
  const monthlyRate = interestRate / 12 / 100;
  const newSchedule = [];
  let outstanding = newOutstanding;

  // Create a completely fresh loan schedule starting from EMI 1
  // Ignore all previous payment history - treat remaining balance as new loan
  let month = 1;

  // Set the due date for the first installment
  // Use the original EMI due date or current date + 1 month
  let firstDueDate: Date;
  if (vehicle.loanDetails?.emiDueDate) {
    firstDueDate = new Date();
    firstDueDate.setDate(vehicle.loanDetails.emiDueDate);
    // If the due date for this month has passed, set it to next month
    if (firstDueDate < new Date()) {
      firstDueDate.setMonth(firstDueDate.getMonth() + 1);
    }
  } else {
    firstDueDate = new Date();
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);
    firstDueDate.setDate(1);
  }

  // Generate new schedule starting from EMI 1 with fresh loan structure
  while (outstanding > 0 && month <= 360) { // Max 30 years
    const interest = outstanding * monthlyRate;
    const principal = Math.min(emiPerMonth - interest, outstanding);
    outstanding -= principal;

    const dueDate = new Date(firstDueDate);
    dueDate.setMonth(firstDueDate.getMonth() + (month - 1));

    newSchedule.push({
      month,
      interest: Math.round(interest * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      outstanding: Math.round(outstanding * 100) / 100,
      dueDate: dueDate.toISOString().split('T')[0],
      isPaid: false,
      paidAt: null,
    });

    month++;

    if (outstanding <= 0) break;
  }

  return newSchedule;
};
```

**Fresh Loan Restructuring Logic:**
```
Key Principles:
1. Prepayments create a completely fresh loan schedule starting from EMI 1
2. All previous payment history is ignored
3. Remaining balance becomes a brand new loan
4. Due dates restart from current date or original EMI due date
5. No modification of already paid EMI installments

Benefits:
- Accurate loan restructuring without corrupting payment history
- Proper amortization schedule for remaining balance
- Maintains integrity of paid EMI records
- Enables correct future payment tracking
```

### 5.4 Expense Categorization Logic

#### Hierarchical Expense Classification
```typescript
const getVehicleExpenseData = () => {
  const vehicleExpenses = expenses.filter(e => e.vehicleId === vehicleId && e.status === 'approved');

  // Fuel expenses - multiple detection methods
  const fuelExpenses = vehicleExpenses.filter(e =>
    (e.expenseType === 'fuel') ||
    e.description.toLowerCase().includes('fuel') ||
    e.description.toLowerCase().includes('petrol') ||
    e.description.toLowerCase().includes('diesel')
  ).reduce((sum, e) => sum + e.amount, 0);

  // Maintenance expenses
  const maintenanceExpenses = vehicleExpenses.filter(e =>
    (e.expenseType === 'maintenance') ||
    (e.type === 'maintenance') ||
    e.description.toLowerCase().includes('maintenance') ||
    e.description.toLowerCase().includes('repair') ||
    e.description.toLowerCase().includes('service')
  ).reduce((sum, e) => sum + e.amount, 0);

  // Insurance expenses
  const insuranceExpenses = vehicleExpenses.filter(e =>
    (e.expenseType === 'insurance') ||
    (e.type === 'insurance') ||
    e.description.toLowerCase().includes('insurance')
  ).reduce((sum, e) => sum + e.amount, 0);

  // Penalty expenses
  const penaltyExpenses = vehicleExpenses.filter(e =>
    (e.expenseType === 'penalties') ||
    (e.type === 'penalties') ||
    e.description.toLowerCase().includes('penalty') ||
    e.description.toLowerCase().includes('fine')
  ).reduce((sum, e) => sum + e.amount, 0);

  // EMI payments
  const emiPayments = vehicleExpenses.filter(e =>
    (e.paymentType === 'emi') ||
    (e.type === 'emi') ||
    e.description.toLowerCase().includes('emi')
  ).reduce((sum, e) => sum + e.amount, 0);

  // Prepayments (principal payments)
  const prepayments = vehicleExpenses.filter(e =>
    (e.paymentType === 'prepayment') ||
    (e.type === 'prepayment') ||
    e.description.toLowerCase().includes('prepayment') ||
    e.description.toLowerCase().includes('principal')
  ).reduce((sum, e) => sum + e.amount, 0);

  // Operating expenses (exclude prepayments)
  const operationalExpenses = vehicleExpenses.filter(e =>
    !(e.paymentType === 'prepayment' || e.type === 'prepayment' ||
      e.description.toLowerCase().includes('prepayment') ||
      e.description.toLowerCase().includes('principal'))
  );

  const totalExpenses = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Other expenses = Total categorized - explicitly categorized
  const categorizedExpenses = fuelExpenses + maintenanceExpenses + insuranceExpenses + penaltyExpenses + emiPayments;
  const otherExpenses = totalExpenses - categorizedExpenses;
};
```

### 5.5 Fuel Cost Calculation Formulas

#### Fuel Consumption & Cost Calculation
```typescript
const calculateFuelCost = (
  vehicleMileage: number,           // Vehicle mileage (km/l or km/kg)
  mileageUnit: 'kmpl' | 'kmkg',    // Mileage unit type
  distance: number,                // Distance traveled (km)
  fuelType: string                 // Type of fuel (Diesel, Petrol, CNG, Electric)
): number => {
  const fuelPrice = getFuelPrice(fuelType);
  if (!fuelPrice || !vehicleMileage || !distance) return 0;

  // Calculate fuel consumption
  let fuelConsumption = distance / vehicleMileage; // liters or kg consumed
  
  // Get price per unit based on fuel type and mileage unit
  let pricePerUnit = 0;
  if (mileageUnit === 'kmpl') {
    pricePerUnit = fuelPrice.pricePerLiter;
  } else if (mileageUnit === 'kmkg') {
    pricePerUnit = fuelPrice.pricePerKg || fuelPrice.pricePerLiter;
  }

  // Calculate total fuel cost
  return fuelConsumption * pricePerUnit;
};
```

**Fuel Cost Formulas:**
```
Fuel Consumption = Distance Traveled (km) / Vehicle Mileage (km/l or km/kg)

Fuel Cost = Fuel Consumption × Price per Unit

Where:
- For Petrol/Diesel: Price per Unit = Price per Liter
- For CNG: Price per Unit = Price per Kg
- For Electric: Price per Unit = Price per kWh
```

### 5.6 Investment Returns & ROI Calculation Formulas

#### Core Investment & Returns Calculations
```typescript
// TOTAL INVESTMENT = Initial Investment + Prepayment + (Recurring Expenses + EMI)
const totalInvestment = (vehicle.initialInvestment || vehicle.initialCost || 0) + 
                      prepayments + totalExpensesForDisplay;

// TOTAL RETURN = Current Car Value + Total Earnings - Outstanding Loan
const totalReturn = (vehicle.residualValue || currentDepreciatedCarValue) + 
                   totalEarnings - outstandingLoan;

// PROFIT/LOSS = Total Return - Total Investment
const profitLoss = totalReturn - totalInvestment;

// ROI = (Profit/Loss ÷ Total Investment) × 100
const roiPercentage = totalInvestment > 0 ?
  (profitLoss / totalInvestment) * 100 : 0;

// TOTAL NET CASH FLOW = Total Earnings - Total Operating Expenses
const totalNetCashFlow = totalEarnings - totalOperatingExpenses;
```

**Investment Returns Formulas:**
```
Total Investment = Initial Investment + Prepayments + Total Operating Expenses + Total EMI Paid

Total Return = Current Car Value + Total Earnings - Outstanding Loan

Profit/Loss = Total Return - Total Investment

ROI (%) = (Profit/Loss ÷ Total Investment) × 100

Net Cash Flow = Total Earnings - Total Operating Expenses

Where:
- Current Car Value = Initial Investment × (1 - depreciationRate)^operationalMonths
- Total Operating Expenses = Fuel + Maintenance + Insurance + Penalties (recurring costs)
- Total EMI Paid = Sum of all EMI payments made (interest + principal)
- Prepayments = Principal payments made upfront to reduce loan
```
```

### 5.5 Depreciation Calculations

#### Car Value Depreciation
```typescript
// Annual depreciation calculation
const depreciationRate = vehicle.depreciationRate || 10; // Default 10% annual
const depreciationPerYear = depreciationRate / 100;

// Current depreciated value
const operationalYears = Math.max(1, currentYear - purchaseYear + 1);
const currentDepreciatedCarValue = initialCarValue * Math.pow((1 - depreciationPerYear), operationalYears);

// Monthly depreciation for projections
const depreciationPerMonth = depreciationRate / 100 / 12;
const monthlyDepreciatedValue = initialCarValue * Math.pow((1 - depreciationPerMonth), operationalMonths);
```

---

## 📊 Complete Data Fields & Formulas Documentation

This section provides comprehensive documentation of ALL data fields, labels, and formulas used throughout the application, organized by page/component.

### Dashboard Page Data Fields

#### Key Metrics Cards
**Monthly Revenue**
- **Data Source**: `payments` collection (Firebase)
- **Filter**: `status === 'paid' && paidAt/collectionDate >= currentMonthStart && <= currentMonthEnd`
- **Formula**: `Sum of amountPaid for filtered payments`
- **Purpose**: Total rent collected in current month

**Monthly Profit**
- **Data Source**: Calculated from payments and expenses
- **Formula**: `monthlyRevenue - totalMonthlyExpenses`
- **Purpose**: Net profit for current month

**Fleet Utilization**
- **Data Source**: `vehicles` collection (Firebase)
- **Formula**: `(rentedVehicles / totalVehicles) × 100`
- **Variables**:
  - `rentedVehicles = vehicles.filter(v => v.status === 'rented').length`
  - `totalVehicles = vehicles.length`
- **Purpose**: Percentage of fleet currently rented

**Active Assignments**
- **Data Source**: `assignments` collection (Firebase)
- **Filter**: `status === 'active'`
- **Formula**: `Count of active assignments`
- **Purpose**: Number of currently active rental agreements

#### Fleet Status Overview
**Available Vehicles**
- **Data Source**: `vehicles` collection
- **Filter**: `status === 'available'`
- **Formula**: `Count of available vehicles`
- **Purpose**: Vehicles ready for rental

**Rented Vehicles**
- **Data Source**: `vehicles` collection
- **Filter**: `status === 'rented'`
- **Formula**: `Count of rented vehicles`
- **Purpose**: Vehicles currently in use

**Maintenance Vehicles**
- **Data Source**: `vehicles` collection
- **Filter**: `status === 'maintenance'`
- **Formula**: `Count of maintenance vehicles`
- **Purpose**: Vehicles undergoing repairs

#### Monthly Financial Breakdown
**Revenue**
- **Same as Monthly Revenue above**
- **Purpose**: Income from rentals

**Fuel Expenses**
- **Data Source**: `expenses` collection
- **Filter**: `status === 'approved' && createdAt >= currentMonth && (expenseType === 'fuel' || description.includes('fuel'))`
- **Formula**: `Sum of amount for filtered expenses`
- **Purpose**: Fuel costs incurred

**Maintenance Expenses**
- **Data Source**: `expenses` collection
- **Filter**: `status === 'approved' && createdAt >= currentMonth && (expenseType === 'maintenance' || type === 'maintenance')`
- **Formula**: `Sum of amount for filtered expenses`
- **Purpose**: Repair and maintenance costs

**Insurance Expenses**
- **Data Source**: `expenses` collection
- **Filter**: `status === 'approved' && createdAt >= currentMonth && (expenseType === 'insurance' || type === 'insurance')`
- **Formula**: `Sum of amount for filtered expenses`
- **Purpose**: Insurance premium payments

**Other Expenses**
- **Formula**: `totalMonthlyExpenses - (fuelExpenses + maintenanceExpenses + insuranceExpenses)`
- **Purpose**: Miscellaneous operational costs

**Net Profit**
- **Formula**: `monthlyRevenue - totalMonthlyExpenses`
- **Purpose**: Bottom-line profit figure

#### Recent Activities
**Payment Transactions**
- **Data Source**: `payments` collection
- **Filter**: `status === 'paid'`
- **Display**: `+amountPaid` with description "Rent collected from Driver"
- **Purpose**: Income transaction history

**Expense Transactions**
- **Data Source**: `expenses` collection
- **Filter**: `status === 'approved'`
- **Display**: `-amount` with expense description
- **Purpose**: Cost transaction history

### Vehicles Page Data Fields

#### Vehicle List Cards
**Initial Investment**
- **Data Source**: `vehicle.initialInvestment || vehicle.initialCost` (Firebase: `vehicles`)
- **Purpose**: Original purchase price

**Monthly Revenue**
- **Data Source**: Calculated from current assignment
- **Formula**: `(assignment.weeklyRent × 52) ÷ 12`
- **Purpose**: Expected monthly rental income

**Total Earnings**
- **Data Source**: `vehicle.financialData.totalEarnings`
- **Formula**: Sum of all paid payments for this vehicle
- **Purpose**: Lifetime revenue generated

**Outstanding Loan**
- **Data Source**: `vehicle.financialData.outstandingLoan`
- **Formula**: `totalLoan - totalEmiPaid - prepayments`
- **Purpose**: Remaining loan balance

### Assignments Page Data Fields

#### Summary Cards
**Total Monthly Revenue**
- **Data Source**: `assignments` collection
- **Filter**: `status === 'active'`
- **Formula**: `Sum of ((assignment.weeklyRent × 52) ÷ 12) for active assignments`
- **Purpose**: Combined monthly rental income

#### Assignment Cards
**Weekly Rent**
- **Data Source**: `assignment.weeklyRent` (Firebase: `assignments`)
- **Purpose**: Weekly rental amount

**Monthly Rent**
- **Data Source**: Calculated
- **Formula**: `(weeklyRent × 52) ÷ 12`
- **Purpose**: Monthly equivalent

**Total Earnings**
- **Data Source**: Calculated from payments
- **Formula**: `Sum of amountPaid for payments linked to this assignment`
- **Purpose**: Revenue generated by this assignment

### Payments Page Data Fields

#### Summary Cards
**Total Received**
- **Data Source**: `payments` collection
- **Filter**: `status === 'paid'`
- **Formula**: `Sum of amountPaid`
- **Purpose**: Total rent collected

**Total Paid**
- **Data Source**: `expenses` collection
- **Filter**: `status === 'approved'`
- **Formula**: `Sum of amount`
- **Purpose**: Total expenses incurred

**Pending Received**
- **Data Source**: `payments` collection
- **Filter**: `status === 'due' || status === 'overdue'`
- **Formula**: `Sum of amountPaid`
- **Purpose**: Outstanding receivables

**Net Cash Flow**
- **Formula**: `totalReceived - totalPaid`
- **Purpose**: Net financial position

#### Transaction List
**Transaction Amount**
- **Display**: `+amount` for received, `-amount` for paid
- **Purpose**: Individual transaction values

### Drivers Page Data Fields

#### Driver Cards
**Weekly Rent**
- **Data Source**: Calculated from active assignment
- **Formula**: `assignment.weeklyRent` for driver's current vehicle
- **Purpose**: Driver's weekly payment amount

### Fuel Records Page Data Fields

#### Summary Cards
**Total Fuel Cost**
- **Data Source**: `expenses` collection
- **Filter**: `expenseType === 'fuel' || description.includes('fuel')`
- **Formula**: `Sum of amount`
- **Purpose**: Total fuel expenditure

**This Month Cost**
- **Data Source**: `expenses` collection
- **Filter**: `expenseType === 'fuel' && createdAt >= currentMonth`
- **Formula**: `Sum of amount`
- **Purpose**: Current month fuel costs

**Average Cost per Record**
- **Formula**: `totalFuelCost ÷ numberOfFuelRecords`
- **Purpose**: Average fuel expense per transaction

#### Fuel Record Items
**Amount**
- **Data Source**: `expense.amount`
- **Display**: `₹amount` (can be negative for refunds)
- **Purpose**: Individual fuel transaction amounts

### Maintenance Records Page Data Fields

#### Summary Cards
**Total Maintenance Cost**
- **Data Source**: `expenses` collection
- **Filter**: `expenseType === 'maintenance' || type === 'maintenance'`
- **Formula**: `Sum of amount`
- **Purpose**: Total maintenance expenditure

**This Month Cost**
- **Data Source**: `expenses` collection
- **Filter**: `expenseType === 'maintenance' && createdAt >= currentMonth`
- **Formula**: `Sum of amount`
- **Purpose**: Current month maintenance costs

**Average Cost per Record**
- **Formula**: `totalMaintenanceCost ÷ numberOfMaintenanceRecords`
- **Purpose**: Average maintenance expense per transaction

#### Maintenance Record Items
**Amount**
- **Data Source**: `expense.amount`
- **Display**: `₹amount` (can be negative for refunds)
- **Purpose**: Individual maintenance transaction amounts

### Insurance Page Data Fields

#### Summary Cards
**Total Insurance Cost**
- **Data Source**: `expenses` collection
- **Filter**: `expenseType === 'insurance' || type === 'insurance'`
- **Formula**: `Sum of amount`
- **Purpose**: Total insurance expenditure

**This Month Cost**
- **Data Source**: `expenses` collection
- **Filter**: `expenseType === 'insurance' && createdAt >= currentMonth`
- **Formula**: `Sum of amount`
- **Purpose**: Current month insurance costs

**Average Cost per Record**
- **Formula**: `totalInsuranceCost ÷ numberOfInsuranceRecords`
- **Purpose**: Average insurance expense per transaction

#### Insurance Record Items
**Amount**
- **Data Source**: `expense.amount`
- **Display**: `₹amount` (can be negative for refunds)
- **Purpose**: Individual insurance transaction amounts

### Vehicle Details Page Data Fields

#### Overview Tab
**EMI Amount**
- **Data Source**: `vehicle.loanDetails.emiPerMonth`
- **Purpose**: Monthly loan installment

#### Expense Proration Preview
**Proration Amount**
- **Formula**: `totalAmount ÷ coverageMonths`
- **Purpose**: Monthly expense allocation

### Driver Details Page Data Fields

#### Analytics Cards
**Total Paid**
- **Data Source**: `payments` collection
- **Filter**: `driverId === driver.id && status === 'paid'`
- **Formula**: `Sum of amountPaid`
- **Purpose**: Total payments received from driver

**Total Due**
- **Data Source**: `payments` collection
- **Filter**: `driverId === driver.id && (status === 'due' || status === 'overdue')`
- **Formula**: `Sum of amountPaid`
- **Purpose**: Outstanding amounts from driver

**Next Due Amount**
- **Data Source**: Next pending payment
- **Formula**: `amountPaid` of next due payment
- **Purpose**: Upcoming payment amount

#### Assignment Cards
**Weekly Rent**
- **Data Source**: `assignment.weeklyRent`
- **Purpose**: Weekly rental rate

#### Payment History
**Payment Amount**
- **Data Source**: `payment.amountPaid`
- **Purpose**: Individual payment received

### Assignment Details Page Data Fields

#### Earnings Cards
**Total Paid**
- **Data Source**: `payments` collection
- **Filter**: Linked to this assignment
- **Formula**: `Sum of amountPaid`
- **Purpose**: Revenue from this assignment

**Total Due**
- **Data Source**: Pending payments for this assignment
- **Formula**: `Sum of amountPaid for due payments`
- **Purpose**: Outstanding receivables

**Projected Earnings**
- **Data Source**: Calculated based on remaining term
- **Formula**: `weeklyRent × remainingWeeks`
- **Purpose**: Expected future revenue

#### Assignment Details
**Daily Rent**
- **Data Source**: `assignment.dailyRent`
- **Purpose**: Daily rental rate

**Weekly Rent**
- **Data Source**: `assignment.weeklyRent`
- **Purpose**: Weekly rental rate

**Monthly Rent**
- **Formula**: `(weeklyRent × 52) ÷ 12`
- **Purpose**: Monthly equivalent

**Total Earnings**
- **Formula**: `Sum of all payments for this assignment`
- **Purpose**: Lifetime revenue

#### Weekly Breakdown
**Week Amount**
- **Data Source**: Calculated weekly earnings
- **Formula**: `weeklyRent × numberOfWeeksInPeriod`
- **Purpose**: Revenue for specific week

### Analytics Tab Data Fields

#### Current Performance Cards
**Monthly Rent**
- **Data Source**: `financialData.monthlyRent`
- **Formula**: `(currentAssignment.weeklyRent × 52) ÷ 12`
- **Purpose**: Current monthly rental income

**Average Monthly Profit**
- **Data Source**: `financialData.avgMonthlyProfit`
- **Formula**: `monthlyRent - monthlyExpenses`
- **Purpose**: Expected monthly profit

**Projected Yearly Profit**
- **Data Source**: `financialData.projectedYearlyProfit`
- **Formula**: `avgMonthlyProfit × 12`
- **Purpose**: Annual profit projection

#### Projection Breakdown Cards
**Initial Investment**
- **Data Source**: `vehicle.initialInvestment || vehicle.initialCost`
- **Purpose**: Original capital invested

**Prepayments**
- **Data Source**: `expenseData.prepayments`
- **Formula**: Sum of principal payments
- **Purpose**: Principal reductions made

**Projected Earnings**
- **Data Source**: Calculated projection
- **Formula**: `monthlyRent × 12 × years`
- **Purpose**: Future revenue projection

**Projected Depreciated Car Value**
- **Data Source**: Calculated projection
- **Formula**: `initialValue × (1 - depreciationRate)^years`
- **Purpose**: Future asset value

**Projected Operating Expenses**
- **Data Source**: Calculated projection
- **Formula**: `monthlyExpenses × 12 × years`
- **Purpose**: Future cost projection

**Fixed Investment**
- **Formula**: `initialInvestment + prepayments`
- **Purpose**: Non-growing capital investment

**Projected Total Return**
- **Formula**: `projectedEarnings + projectedDepreciatedCarValue - projectedOutstandingLoan`
- **Purpose**: Future total return

**Projected Net Cash Flow**
- **Formula**: `projectedEarnings - projectedOperatingExpenses`
- **Purpose**: Future cash flow

**Projected Profit/Loss**
- **Formula**: `projectedTotalReturn - fixedInvestment`
- **Purpose**: Future profitability

#### Loan Analysis Cards
**Average Payment per Transaction**
- **Formula**: `(totalEarnings - totalExpenses) ÷ numberOfPaidPayments`
- **Purpose**: Average revenue per payment

**Outstanding Loan**
- **Data Source**: `financialData.outstandingLoan`
- **Purpose**: Current loan balance

**Current EMI**
- **Data Source**: `vehicle.loanDetails.emiPerMonth`
- **Purpose**: Current monthly installment

**Increased EMI**
- **Data Source**: User input for scenario analysis
- **Purpose**: Hypothetical higher EMI

**Additional Monthly Payment**
- **Formula**: `increasedEMI - currentEMI`
- **Purpose**: Extra monthly cost

#### Partner Projection Cards
**Partner Earnings**
- **Data Source**: Calculated partner share
- **Formula**: `totalEarnings × partnerPercentage`
- **Purpose**: Partner's revenue share

**Owner Earnings**
- **Data Source**: Calculated owner share
- **Formula**: `totalEarnings × (1 - partnerPercentage)`
- **Purpose**: Owner's revenue share

**Total Earnings**
- **Formula**: `partnerEarnings + ownerEarnings`
- **Purpose**: Combined revenue

### 5.3 Bulk Payment System

The Bulk Payment System allows processing multiple vehicle payments simultaneously through the Financial Accounts Tab summary card. This feature maintains identical database impact as individual payments while providing efficiency for bulk operations.

#### Bulk Payment Types

**GST Bulk Payment**
- **Trigger**: "Pay GST" button in summary card
- **Eligibility**: Vehicles with `gstAmount > 0` and `gstPaid = false`
- **Calculation**: Same as individual GST payment (4% of profit)
- **Database Impact**: Updates `gstPaid: true`, creates transaction record, deducts from cash balance
- **Quarterly Breakdown**: Shows monthly GST amounts for Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)

**Service Charge Bulk Collection**
- **Trigger**: "Collect Service Charges" button in summary card
- **Eligibility**: Partner vehicles with `serviceCharge > 0` and `serviceChargeCollected = false`
- **Calculation**: Same as individual service charge (configurable rate, default 10% of profit)
- **Database Impact**: Updates `serviceChargeCollected: true`, creates transaction record, adds to cash balance
- **Quarterly Breakdown**: Shows monthly service charge amounts for each quarter

**Partner Share Bulk Payment**
- **Trigger**: "Pay Partner Shares" button in summary card
- **Eligibility**: Partner vehicles with `partnerShare > 0` and `partnerPaid = false`
- **Calculation**: Same as individual partner share (remaining profit after GST/service charges × partner percentage)
- **Database Impact**: Updates `partnerPaid: true`, creates transaction record, deducts from cash balance
- **Quarterly Breakdown**: Shows monthly partner share amounts for each quarter

**Owner Share Bulk Collection**
- **Trigger**: "Collect Owner Shares" button in summary card
- **Eligibility**: Partner vehicles with `ownerShare > 0` and `ownerShareCollected = false`
- **Calculation**: Same as individual owner share (remaining profit after GST/service charges × (1 - partner percentage))
- **Database Impact**: Updates `ownerShareCollected: true`, creates transaction record, adds to cash balance
- **Quarterly Breakdown**: Shows monthly owner share amounts for each quarter

#### Bulk Payment Dialog Features

**Vehicle Selection**
- **Interface**: Checkbox list of eligible vehicles
- **Default State**: All eligible vehicles pre-selected
- **Selection Control**: Users can deselect specific vehicles to exclude from bulk payment
- **Real-time Updates**: Selected total updates as checkboxes are toggled

**Quarterly Period Breakdown**
- **Monthly Details**: For quarterly periods, shows breakdown by month (3 months per quarter)
- **Month Calculation**: Each month calculates profit/GST/service charges independently
- **Visual Layout**: Monthly amounts displayed in a grid format within each vehicle item

**Payment Confirmation**
- **Summary Display**: Shows total amount and number of vehicles selected
- **Processing State**: Loading indicator during bulk payment processing
- **Success Feedback**: Toast notification with total amount and vehicle count
- **Error Handling**: Partial failure notification if some payments fail

#### Bulk Payment Data Flow

**Dialog Opening**
1. User clicks bulk payment button in summary card
2. System filters eligible vehicles based on payment type criteria
3. Dialog opens with pre-populated vehicle list and amounts
4. For quarterly periods, monthly breakdowns are calculated and displayed

**Payment Processing**
1. User reviews and optionally deselects vehicles
2. User clicks "Confirm Bulk Payment"
3. System processes each selected vehicle using existing individual payment functions
4. Each payment creates appropriate transaction records and updates cash balances
5. Sequential processing with 100ms delay between payments to prevent Firestore conflicts

**Database Updates**
- **Transaction Records**: Creates entries in `transactions` collection for each payment
- **Vehicle Financial Status**: Updates payment flags (`gstPaid`, `serviceChargeCollected`, etc.)
- **Cash Balance**: Updates vehicle cash balance based on payment type
- **Period Tracking**: Maintains period-specific payment status

#### Bulk Payment Formulas

**Quarterly Monthly GST Calculation**
```
For each month in quarter:
  monthEarnings = Σ(payments where paymentDate in month)
  monthExpenses = Σ(expenses where expenseDate in month)
  monthProfit = monthEarnings - monthExpenses
  monthGst = monthProfit > 0 ? monthProfit × 0.04 : 0
```

**Quarterly Monthly Service Charge Calculation**
```
For each month in quarter:
  monthEarnings = Σ(payments where paymentDate in month)
  monthExpenses = Σ(expenses where expenseDate in month)
  monthProfit = monthEarnings - monthExpenses
  serviceChargeRate = vehicle.serviceChargeRate || 0.10
  monthServiceCharge = (vehicle.ownershipType === 'partner' && monthProfit > 0) ?
    monthProfit × serviceChargeRate : 0
```

**Quarterly Monthly Partner Share Calculation**
```
For each month in quarter:
  monthEarnings = Σ(payments where paymentDate in month)
  monthExpenses = Σ(expenses where expenseDate in month)
  monthProfit = monthEarnings - monthExpenses
  gstAmount = monthProfit > 0 ? monthProfit × 0.04 : 0
  serviceCharge = (vehicle.ownershipType === 'partner' && monthProfit > 0) ?
    monthProfit × serviceChargeRate : 0
  remainingProfit = monthProfit - gstAmount - serviceCharge
  partnerPercentage = vehicle.partnerShare || 0.50
  monthPartnerShare = (vehicle.ownershipType === 'partner' && remainingProfit > 0) ?
    remainingProfit × partnerPercentage : 0
```

**Quarterly Monthly Owner Share Calculation**
```
For each month in quarter:
  monthEarnings = Σ(payments where paymentDate in month)
  monthExpenses = Σ(expenses where expenseDate in month)
  monthProfit = monthEarnings - monthExpenses
  gstAmount = monthProfit > 0 ? monthProfit × 0.04 : 0
  serviceCharge = (vehicle.ownershipType === 'partner' && monthProfit > 0) ?
    monthProfit × serviceChargeRate : 0
  remainingProfit = monthProfit - gstAmount - serviceCharge
  partnerPercentage = vehicle.partnerShare || 0.50
  monthOwnerShare = (vehicle.ownershipType === 'partner' && remainingProfit > 0) ?
    remainingProfit × (1 - partnerPercentage) : 0
```

#### Implementation Details

**Component Structure**
- **BulkPaymentDialog.tsx**: Reusable dialog component for all bulk payment types
- **FinancialAccountsTab.tsx**: Main component with bulk payment buttons and logic
- **State Management**: Local state for dialog control and selected items
- **Icon Integration**: Lucide icons for visual payment type indicators

**Error Handling**
- **Partial Failures**: Continues processing remaining payments if one fails
- **User Feedback**: Clear error messages for failed operations
- **Rollback**: No automatic rollback - failed payments need manual correction

**Performance Considerations**
- **Sequential Processing**: 100ms delay between payments to prevent Firestore rate limits
- **Batch Size**: No explicit limit, but large batches may take time to process
- **Real-time Updates**: Dialog shows processing state during bulk operations

### 5.4 Financial Analytics Tab

The Financial Analytics Tab provides comprehensive financial analysis and visualization of company performance across all vehicles. This tab displays key performance indicators, expense breakdowns, vehicle profitability analysis, and financial health metrics.

#### Analytics Tab - Financial Summary Cards

**Monthly Revenue**
- **Data Source**: `companyFinancialData.totalEarnings` (aggregated from all vehicle payments)
- **Display**: `₹{totalEarnings.toLocaleString()}`
- **Time Period**: Current selected month and year
- **Purpose**: Total earnings from all vehicle operations for the selected period

**Operating Expenses**
- **Data Source**: `companyFinancialData.totalExpenses` (aggregated from all vehicle expenses)
- **Display**: `₹{totalExpenses.toLocaleString()}`
- **Purpose**: Total operational costs across all vehicles for the selected period

**Net Profit**
- **Formula**: `totalProfit = totalEarnings - totalExpenses`
- **Display**: `₹{totalProfit.toLocaleString()}` with color coding (green for profit, red for loss)
- **Additional Metric**: `profitMargin = totalEarnings > 0 ? (totalProfit / totalEarnings) * 100 : 0`
- **Display Format**: `{profitMargin.toFixed(1)}% margin`
- **Purpose**: Overall profitability with percentage margin

**Profit per Vehicle**
- **Formula**: `profitPerVehicle = vehicleData.length > 0 ? totalProfit / vehicleData.length : 0`
- **Display**: `₹{profitPerVehicle.toLocaleString()}`
- **Purpose**: Average profitability per vehicle in the fleet

#### Analytics Tab - Expense Breakdown Card

**Expense Category Distribution**
- **Data Source**: Vehicle-level expense aggregation with estimated category breakdown
- **Purpose**: Visual representation of expense allocation across major categories

**Fuel Expenses**
- **Formula**: `fuelExpenses = Σ(vehicle.expenses × 0.3)` for all vehicles
- **Assumption**: Fuel represents 30% of total vehicle expenses
- **Display**: `₹{fuelExpenses.toLocaleString()}`
- **Visualization**: Progress bar showing percentage of total expenses

**Maintenance Expenses**
- **Formula**: `maintenanceExpenses = Σ(vehicle.expenses × 0.25)` for all vehicles
- **Assumption**: Maintenance represents 25% of total vehicle expenses
- **Display**: `₹{maintenanceExpenses.toLocaleString()}`
- **Visualization**: Progress bar showing percentage of total expenses

**Insurance Expenses**
- **Formula**: `insuranceExpenses = Σ(vehicle.expenses × 0.15)` for all vehicles
- **Assumption**: Insurance represents 15% of total vehicle expenses
- **Display**: `₹{insuranceExpenses.toLocaleString()}`
- **Visualization**: Progress bar showing percentage of total expenses

**Other Expenses**
- **Formula**: `otherExpenses = Σ(vehicle.expenses × 0.3)` for all vehicles
- **Assumption**: Other expenses represent 30% of total vehicle expenses
- **Display**: `₹{otherExpenses.toLocaleString()}`
- **Visualization**: Progress bar showing percentage of total expenses

**Category Percentage Calculation**
- **Formula**: `categoryPercentage = totalExpenses > 0 ? (categoryAmount / totalExpenses) × 100 : 0`
- **Purpose**: Relative weight of each expense category

#### Analytics Tab - Vehicle Performance Analysis

**Vehicle Profit Margin**
- **Formula**: `vehicleMargin = vehicle.earnings > 0 ? (vehicle.profit / vehicle.earnings) × 100 : 0`
- **Display**: `{vehicleMargin.toFixed(1)}%`
- **Purpose**: Individual vehicle profitability as percentage of earnings

**Vehicle Profitability Status**
- **Logic**: `vehicle.profit >= 0 ? 'Profitable' : 'Loss Making'`
- **Display**: Badge with appropriate color (green for profitable, red for loss making)
- **Purpose**: Quick visual indicator of vehicle financial health

**Vehicle Metrics Display**
- **Earnings**: `₹{vehicle.earnings.toLocaleString()}` (green)
- **Expenses**: `₹{vehicle.expenses.toLocaleString()}` (red)
- **Profit**: `₹{vehicle.profit.toLocaleString()}` (green/red based on value)
- **Purpose**: Detailed breakdown of each vehicle's financial performance

#### Analytics Tab - Profitability Analysis Card

**Overall Profit Margin Assessment**
- **Formula**: `profitMargin = totalEarnings > 0 ? (totalProfit / totalEarnings) × 100 : 0`
- **Thresholds**:
  - `≥ 20%`: Excellent profitability (green indicator)
  - `≥ 10%`: Good profitability (yellow indicator)
  - `< 10%`: Needs improvement (red indicator)
- **Visualization**: Progress bar scaled to margin percentage (max 50% width for 25% margin)

**Profit Distribution Metrics**
- **Profitable Vehicles**: `vehicleData.filter(v => v.profit > 0).length`
- **Loss Making Vehicles**: `vehicleData.filter(v => v.profit <= 0).length`
- **Total Vehicles**: `vehicleData.length`
- **Display Format**: `{profitableCount} / {totalVehicles}`

#### Analytics Tab - Expense Efficiency Card

**Expense Ratio**
- **Formula**: `expenseRatio = totalEarnings > 0 ? (totalExpenses / totalEarnings) × 100 : 0`
- **Display**: `{expenseRatio.toFixed(1)}%`
- **Threshold**: `≤ 70%` considered good expense control (green), above is high ratio (red)
- **Purpose**: Measures cost efficiency relative to revenue

**Expense Ratio Visualization**
- **Progress Bar Width**: `Math.min((totalExpenses / totalEarnings) × 100, 100)%`
- **Color Coding**: Green for good control (≤70%), red for high ratio (>70%)
- **Purpose**: Visual indicator of expense management effectiveness

**Top Expense Categories Summary**
- **Fuel**: `₹{expenseBreakdown.fuel.toLocaleString()}`
- **Maintenance**: `₹{expenseBreakdown.maintenance.toLocaleString()}`
- **Insurance**: `₹{expenseBreakdown.insurance.toLocaleString()}`
- **Purpose**: Quick reference for major expense categories

#### Analytics Tab - Data Sources & Calculations

**Primary Data Sources**
- `companyFinancialData.totalEarnings`: Aggregated payment data
- `companyFinancialData.totalExpenses`: Aggregated expense data
- `companyFinancialData.vehicleData[]`: Array of vehicle financial summaries
- `vehicle.earnings`: Individual vehicle earnings from payments
- `vehicle.expenses`: Individual vehicle expenses
- `vehicle.profit`: Individual vehicle profit (earnings - expenses)

**Calculation Dependencies**
- All calculations depend on current month/year filter selection
- Vehicle data is filtered by selected time period
- Expense breakdown uses estimated percentages (may need actual categorization in future)
- Profit calculations assume earnings minus expenses model

**Performance Considerations**
- Calculations performed client-side for real-time updates
- Data aggregation happens in `useFirebaseData` hook
- Visualizations update automatically when data changes
- No caching implemented - recalculates on each render

---

## Cash In Hand Tracking System

## Cash In Hand Tracking System

## Cash In Hand Tracking System

### 6.1 Overview
The Cash In Hand Tracking System provides real-time, comprehensive financial balance management across all business transactions. Every income and expense transaction automatically updates the cash balance, ensuring perfect accountability and zero-balance accounting.

### 6.2 Cash Balance Updates

#### Income Transactions (Cash Increases)
```typescript
// Rent Collection - Increases cash when drivers pay weekly rent
const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
await updateDoc(cashRef, {
  balance: increment(assignment.weeklyRent), // + Rent Amount
  updatedAt: new Date().toISOString()
});
```

#### Expense Transactions (Cash Decreases)
```typescript
// All approved expenses decrease cash balance
const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
await updateDoc(cashRef, {
  balance: increment(-expenseAmount), // - Expense Amount
  updatedAt: new Date().toISOString()
});
```

### 6.3 Transaction Types & Cash Impact

#### ✅ INCOME (Cash Increases)
- **Rent Collection**: `+ weeklyRent` - When drivers pay weekly rent
- **Service Charge Collection**: `+ serviceCharge` - 10% service charge collected as additional income

#### ❌ EXPENSES (Cash Decreases)
- **Fuel Expenses**: `- fuelAmount` - Fuel purchases and refills
- **Maintenance Expenses**: `- maintenanceAmount` - Vehicle repairs and servicing
- **Insurance Expenses**: `- insuranceAmount` - Insurance premium payments
- **EMI Payments**: `- emiAmount` - Monthly loan installment payments
- **Prepayments**: `- prepaymentAmount` - Principal loan prepayments
- **GST Payments**: `- gstAmount` - 4% government tax payments
- **Partner Share Payments**: `- partnerShare` - 50% profit paid to driver/partner
- **Owner Share Collection**: `- ownerShare` - 50% profit collected by owner

### 6.4 Zero-Balance Accounting Flow

```
Starting Cash: ₹X

1. + Rent Income          → Cash increases when drivers pay
2. + Service Charge       → Cash increases as 10% additional income
3. - Fuel Expenses        → Cash decreases for fuel purchases
4. - Maintenance          → Cash decreases for vehicle repairs
5. - Insurance            → Cash decreases for insurance premiums
6. - EMI Payments         → Cash decreases for loan installments
7. - GST Payments         → Cash decreases for government tax (4%)
8. - Partner Share        → Cash decreases for 50% profit to partner
9. - Owner Share          → Cash decreases when collecting 50% profit

Ending Cash: ₹0 (Perfect Accounting!)
```

### 6.5 Real-time Cash Balance Display

#### AccountsTab Component
- **Real-time Balance**: Shows current cash in hand for each vehicle
- **Transaction History**: Complete audit trail of all cash movements
- **Balance Verification**: Ensures all transactions balance to zero

#### Automatic Updates
- **Immediate Updates**: Cash balance updates instantly on any transaction
- **Multi-user Sync**: Real-time synchronization across all users
- **Error Prevention**: Transaction rollbacks if cash updates fail

### 6.6 Cash Balance Storage Structure

```json
// Firestore Document: cashInHand/{vehicleId}
{
  "balance": 15000,           // Current cash in hand amount
  "updatedAt": "2025-10-12T10:30:00Z",
  "vehicleId": "vehicle-123",
  "companyId": "company-456"
}
```

### 6.7 Business Benefits

#### Financial Transparency
- **Complete Visibility**: See exact cash position at any time
- **Transaction Audit**: Full history of all cash movements
- **Zero-Balance Assurance**: Perfect accounting with zero discrepancies

#### Operational Efficiency
- **Real-time Updates**: No manual cash reconciliation needed
- **Automated Tracking**: System handles all cash calculations
- **Error Prevention**: Prevents cash accounting mistakes

#### Business Intelligence
- **Cash Flow Analysis**: Understand cash movement patterns
- **Profit Tracking**: Real-time profit realization tracking
- **Financial Planning**: Accurate cash forecasting capabilities

---

## Partner Management System

### 7.1 Overview
The Partner Management System enables business partnerships where external partners own and operate vehicles while sharing profits with the company. Partners are treated as independent business owners with dedicated management interfaces and profit-sharing arrangements.

### 7.2 Partner Roles & Responsibilities

#### Partner User Role
- **Vehicle Ownership**: Partners own their vehicles and bear the financial responsibility
- **Profit Sharing**: 50/50 profit split with the company after all expenses
- **Service Charges**: Partners pay 10% service charge on their earnings as additional income for the company
- **Independent Operations**: Partners manage their own drivers and daily operations
- **Login Access**: Partners can login with email/password to access their account

#### Company Responsibilities
- **Platform Access**: Provide management system access to partners
- **Account Creation**: Create Firebase Auth accounts for partners during registration
- **Financial Tracking**: Monitor vehicle performance and profit calculations
- **Support Services**: Assist with vehicle assignments and financial reporting
- **Profit Distribution**: Ensure fair 50/50 profit sharing after service charges

### 7.3 Partner Data Storage

#### Partner User Document Structure
Partners are stored as users with `role: "partner"` in the company users collection:

```json
{
  "userId": "firebase-auth-uid",
  "companyId": "company-id",
  "role": "partner",
  "name": "Partner Name",
  "email": "partner@example.com",
  "userName": "partner_username",
  "mobileNumber": "+91XXXXXXXXXX",
  "address": "Full business address",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Storage Path**: `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/users/{firebaseAuthUid}`

### 7.4 Partner Authentication & Login

#### Account Creation Process
1. **Admin Registration**: Company admin creates partner account with email/password
2. **Firebase Auth Account**: System creates Firebase Authentication account for partner
3. **Firestore Storage**: Partner data stored using Firebase Auth UID as document ID
4. **Company Association**: Partner automatically associated with admin's company

#### Login Process
```typescript
// Partner logs in with email/password
await signInWithEmailAndPassword(auth, email, password);

// System fetches user info from company's users collection
// Path: tenantCompanies/{companyId}/users/{firebaseAuthUid}
// Role validation ensures partner gets correct access level
```

#### Authentication Flow
```
Partner Login
    ↓
Firebase Auth (email/password)
    ↓
fetchUserInfo() → Check company users collection
    ↓
Validate role: "partner"
    ↓
Load partner dashboard with company context
```

### 7.5 Vehicle-Partner Linking

#### Vehicle Assignment to Partners
Vehicles are linked to partners through the `assignedDriverId` field in the vehicle document:

```json
{
  "id": "vehicle-id",
  "vehicleName": "Partner's Toyota Innova",
  "assignedDriverId": "partner-user-id",
  "status": "rented",
  "companyId": "company-id"
}
```

#### Partner-Vehicle Relationship Logic
- **One-to-Many**: One partner can have multiple vehicles assigned
- **Assignment Tracking**: Vehicles are assigned to partners through the assignment system
- **Profit Attribution**: All profits from partner vehicles are attributed to the partner
- **Service Charge Collection**: 10% service charge collected from partner earnings

#### Partnership Percentage Calculation
The partnership percentage is automatically calculated based on the partner's financial contribution and the financing type:

**For Cash Purchases:**
```
Partnership Percentage = (Partner Payment Amount / Vehicle Cost) × 100
```
- **Example**: If vehicle costs ₹10,00,000 and partner pays ₹5,00,000, partnership = 50%

**For Loan Purchases:**
```
Partnership Percentage = (Partner Payment Amount / Down Payment) × 100
```
- **Example**: If down payment is ₹3,00,000 and partner pays ₹1,50,000, partnership = 50%

**Calculation Logic:**
```typescript
if (financingType === 'cash') {
  percentage = (partnerPayment / vehicleCost) * 100;
} else if (financingType === 'loan') {
  percentage = (partnerPayment / downPayment) * 100;
}
```

- **Auto-calculation**: Percentage is calculated automatically when partner payment amount is entered
- **Validation**: Maximum percentage capped at 100%
- **Precision**: Rounded to 2 decimal places for accuracy

### 7.6 Partner Management Interface

#### Partners Page (`/partners`)
**Features**:
- **Partner List**: Grid view of all active partners with contact information
- **Add Partner**: Form to register new business partners
- **Edit Partner**: Update partner information and status
- **Vehicle Tracking**: Display number of vehicles assigned to each partner
- **Status Management**: Activate/deactivate partner accounts

#### Partner Operations
- **CRUD Operations**: Full create, read, update, delete functionality
- **Real-time Updates**: Live synchronization of partner data
- **Validation**: Comprehensive form validation for partner registration
- **Audit Trail**: Track all partner-related changes

### 7.6.1 Partner Add Form Implementation

#### Form Schema & Validation
The partner registration form uses Zod schema validation for comprehensive data validation:

```typescript
const partnerSchema = z.object({
  name: z.string().min(2, 'Partner name is required'),
  email: z.string().email('Valid email is required'),
  userName: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  mobileNumber: z.string().min(10, 'Valid mobile number is required'),
  address: z.string().min(10, 'Complete address is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

#### Firebase Authentication Integration
**Account Creation Process**:
```typescript
// 1. Create Firebase Auth account
const userCredential = await createUserWithEmailAndPassword(auth, email, password);

// 2. Store partner data in Firestore
const partnerData = {
  userId: userCredential.user.uid,
  companyId: currentUserCompanyId,
  role: 'partner',
  name,
  email,
  userName,
  mobileNumber,
  address,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 3. Save to company users collection
await setDoc(doc(firestore, partnerUsersPath, userCredential.user.uid), partnerData);
```

#### Form Features
- **Password Visibility Toggle**: Eye icon to show/hide password input
- **Real-time Validation**: Instant feedback on form field errors
- **Duplicate Email Check**: Prevents registration with existing email addresses
- **Mobile Number Validation**: Ensures proper mobile number format
- **Address Validation**: Requires complete business address
- **Username Uniqueness**: Validates unique username across company

#### Security Implementation
- **Password Requirements**: Minimum 6 characters with confirmation
- **Email Verification**: Firebase Auth handles email validation
- **Role Assignment**: Automatic assignment of 'partner' role
- **Company Isolation**: Partners automatically associated with admin's company
- **Access Control**: Partners get limited access based on their role

#### User Experience Features
- **Loading States**: Form shows loading during account creation
- **Success Feedback**: Toast notifications for successful registration
- **Error Handling**: Comprehensive error messages for failed registrations
- **Form Reset**: Automatic form clearing after successful submission
- **Responsive Design**: Mobile-friendly form layout

### 7.7 Profit Sharing & Service Charges

#### Profit Calculation Flow for Partners
```
Partner Vehicle Earnings
        ↓
1. Rent Collection (+cash)
2. Service Charge (10% of earnings) → Company Income (+cash)
3. Operating Expenses (-cash)
        ↓
Net Profit = Earnings - Service Charge - Expenses
        ↓
50/50 Profit Sharing:
- Partner Share: Net Profit × 0.5
- Company Share: Net Profit × 0.5
```

#### Service Charge as Company Income
- **Collection**: 10% of partner earnings collected as service charge
- **Cash Impact**: Increases company cash balance (+service charge)
- **Accounting**: Treated as additional income, not an expense
- **Profit Sharing**: Calculated after service charge deduction

### 7.8 Business Benefits

#### Partnership Model
- **Risk Distribution**: Partners bear vehicle ownership costs and risks
- **Revenue Expansion**: Access to partner-owned vehicles increases fleet size
- **Profit Sharing**: Fair 50/50 split ensures mutual benefits
- **Service Income**: 10% service charge provides additional revenue stream

#### Operational Advantages
- **Fleet Expansion**: Rapid fleet growth without capital investment
- **Partner Motivation**: Profit-sharing incentivizes partner performance
- **Cost Efficiency**: Partners manage their own maintenance and operations
- **Scalability**: Easy to onboard new partners and expand operations

---

## Insurance Management System

### 8.1 Insurance Types & Categories

The system supports multiple insurance types that can be active simultaneously for a single vehicle:

#### Primary Insurance Types
- **Fix Insurance**: Fixed insurance coverage for vehicle protection
- **REGO**: Registration and government compliance insurance
- **Green Slip**: Compulsory third-party personal injury insurance
- **Pink Slip**: Vehicle ownership and title insurance

### 8.2 Insurance Policy Rules

#### Multi-Insurance Support
- **Multiple Types Allowed**: A vehicle can have up to 3 different insurance types active simultaneously
- **Same Period Coverage**: Different insurance types can cover the same time period (e.g., Jan 1 - Dec 31)
- **No Duplicate Types**: Cannot have two policies of the same type overlapping in time
- **Flexible Coverage**: Each insurance type maintains independent coverage periods

#### Example Valid Combinations
```
Vehicle XYZ can have:
✅ Fix Insurance (Jan 1 - Dec 31) + REGO (Jan 1 - Dec 31) + Green Slip (Jan 1 - Dec 31)
❌ Fix Insurance (Jan 1 - Dec 31) + Fix Insurance (Jun 1 - Dec 31) [Duplicate type]
```

### 8.3 Insurance Expense Tracking

#### Periodic Payments
- **Proration Support**: Insurance premiums can be prorated over policy coverage period
- **Monthly Recognition**: Expenses distributed evenly across coverage months
- **Advance Payments**: Support for upfront annual payments with monthly allocation

#### Expense Calculation
```typescript
// For prorated insurance payments
const monthlyExpense = totalPremium / coverageMonths;

// Example: ₹12,000 annual premium over 12 months = ₹1,000/month
const monthlyExpense = 12000 / 12; // = ₹1,000
```

### 8.4 Insurance Document Management

#### Required Documents
- **Policy Copy**: Original insurance policy document
- **RC Copy**: Registration certificate with insurance details
- **Previous Year Policy**: Historical policy for reference
- **Additional Documents**: Claim papers, amendments, etc.

#### Document Storage
- **Cloudinary Integration**: Secure cloud storage for all insurance documents
- **Organized Structure**: Documents categorized by insurance type and vehicle
- **Easy Retrieval**: Quick access for policy verification and claims

---

## Firestore Database Structure

### 9.1 Root Structure
```
Easy2Solutions/
├── companyDirectory/
│   ├── superAdmins/           # Super admin users
│   ├── users/                  # Common users (not company-specific)
│   ├── tenantCompanies/        # Multi-tenant company data
│   └── companyDirectory/       # Legacy path (deprecated)
```

### 9.2 Tenant Company Structure
```
tenantCompanies/{companyId}/
├── users/                      # Company users (admins, partners, drivers)
├── vehicles/                   # Fleet vehicles (company + partner owned)
├── assignments/                # Rental assignments (all vehicles)
├── expenses/                   # All expense records (all vehicles)
├── payments/                   # Payment records (all vehicles)
├── fuelRecords/                # Fuel expense tracking (all vehicles)
├── fuelPrices/                 # Fuel price management by type
├── maintenanceRecords/         # Maintenance history (all vehicles)
├── reports/                    # Generated reports
├── settings/                   # Company settings
├── auditLogs/                  # System audit logs
└── documents/                  # File storage references
```
```
tenantCompanies/{companyId}/
├── users/                      # Company users (admins, drivers)
├── vehicles/                   # Fleet vehicles
├── assignments/                # Rental assignments
├── expenses/                   # All expense records
├── payments/                   # Payment records
├── fuelRecords/                # Fuel expense tracking
├── fuelPrices/                 # Fuel price management by type
├── maintenanceRecords/         # Maintenance history
├── reports/                    # Generated reports
├── settings/                   # Company settings
├── auditLogs/                  # System audit logs
└── documents/                  # File storage references
```

### 9.3 Document Schemas

#### User Document
```json
{
  "userId": "firebase-auth-uid",
  "companyId": "company-id",
  "role": "company_admin|partner",
  "name": "User Name",
  "email": "user@example.com",
  "userName": "username",
  "mobileNumber": "+91XXXXXXXXXX",
  "address": "Full address",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "isActive": true,
  "drivingLicense": {
    "number": "DL123456",
    "expiry": "2025-12-31",
    "photoUrl": "cloudinary-url"
  },
  "assignedTaxis": ["vehicle-id-1", "vehicle-id-2"]
}
```

**Role Types**:
- `company_admin`: Full company access and management
- `partner`: Business partner with vehicle ownership and profit sharing

#### Vehicle Document
```json
{
  "id": "vehicle-id",
  "vehicleName": "Toyota Innova",
  "registrationNumber": "KA01AB1234",
  "make": "Toyota",
  "model": "Innova",
  "year": 2022,
  "condition": "used",
  "initialCost": 1500000,
  "residualValue": 1200000,
  "depreciationRate": 10,
  "initialInvestment": 1500000,
  "financingType": "loan",
  "odometer": 25000,
  "status": "rented",
  "financialStatus": "loan_active",
  "assignedDriverId": "partner-user-id",
  "loanDetails": {
    "totalLoan": 1200000,
    "outstandingLoan": 800000,
    "emiPerMonth": 25000,
    "interestRate": 8.5,
    "amortizationSchedule": [...]
  },
  "companyId": "company-id",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Partner Linking**: The `assignedDriverId` field links vehicles to partners when the vehicle is owned by a business partner.

#### Assignment Document
```json
{
  "id": "assignment-id",
  "vehicleId": "vehicle-id",
  "driverId": "driver-id",
  "startDate": "2024-01-01",
  "dailyRent": 1500,
  "weeklyRent": 10000,
  "collectionDay": 0,
  "status": "active",
  "securityDeposit": 50000,
  "companyId": "company-id"
}
```

#### Payment Document
```json
{
  "id": "payment-id",
  "assignmentId": "assignment-id",
  "vehicleId": "vehicle-id",
  "driverId": "driver-id",
  "weekStart": "2024-01-01",
  "amountDue": 10000,
  "amountPaid": 10000,
  "paidAt": "2024-01-08T10:00:00Z",
  "status": "paid",
  "type": "received",
  "paymentType": "rent",
  "companyId": "company-id"
}
```

#### Expense Document
```json
{
  "id": "expense-id",
  "vehicleId": "vehicle-id",
  "amount": 5000,
  "description": "Fuel refill - 50 liters",
  "billUrl": "cloudinary-url",
  "submittedBy": "driver-id",
  "status": "approved",
  "type": "paid",
  "paymentType": "expenses",
  "expenseType": "fuel",
  "companyId": "company-id",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Fuel Price Document
```json
{
  "fuelType": "diesel",
  "pricePerUnit": 95.50,
  "unit": "liter",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "updatedBy": "admin-user-id",
  "companyId": "company-id"
}
```

### 6.4 Security Rules
- **Company Isolation**: Users can only access documents where `companyId` matches their company
- **Role-based Access**: Company admins have full access within their company
- **Super Admin**: Can access all companies' data
- **Real-time Listeners**: Automatic data synchronization with security filtering

---

## Technical Implementation Details

### 10.1 Real-time Data Synchronization
- **Firestore Listeners**: All data changes propagate instantly via `onSnapshot`
- **Optimistic Updates**: UI updates immediately, with error handling for rollbacks
- **Connection Resilience**: Automatic reconnection and offline data queuing

### 10.2 Financial Calculation Engine
- **Client-side Processing**: All ROI calculations happen in the browser for real-time updates
- **Data Consistency**: Calculations use current Firestore data to ensure accuracy
- **Performance Optimization**: Memoized calculations to prevent unnecessary re-computations

### 10.3 Form Validation & Error Handling
- **Zod Schemas**: Type-safe form validation with detailed error messages
- **React Hook Form**: Efficient form state management with validation integration
- **User Feedback**: Toast notifications for all user actions with success/error states

### 10.4 File Upload & Storage
- **Cloudinary Integration**: Secure cloud storage for documents and images
- **File Type Validation**: Restricted to allowed file types with size limits
- **Progress Tracking**: Upload progress indicators for large files

### 10.5 Export Functionality
- **ExcelJS Integration**: Client-side Excel generation for reports
- **Data Formatting**: Proper currency formatting and date handling
- **Multiple Export Types**: Vehicle reports, financial summaries, payment histories

### 10.6 Responsive Design
- **Mobile-first Approach**: Optimized for mobile devices with progressive enhancement
- **Adaptive Layouts**: Grid systems that adjust to screen size
- **Touch-friendly UI**: Appropriate button sizes and spacing for mobile interaction

### 10.7 Performance Optimizations
- **Code Splitting**: Lazy loading of routes and heavy components
- **Memoization**: React.memo and useMemo for expensive calculations
- **Virtual Scrolling**: For large lists (planned implementation)
- **Image Optimization**: Responsive images with lazy loading

---

## Development & Deployment

### 11.1 Local Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 11.2 Environment Configuration
- **Firebase Config**: Separate config files for development and production
- **Environment Variables**: API keys and configuration stored securely
- **Build Optimization**: Tree shaking and minification for production bundles

### 11.3 Testing Strategy
- **Unit Tests**: Component and hook testing with React Testing Library
- **Integration Tests**: End-to-end user workflows
- **Financial Calculation Tests**: Comprehensive test coverage for ROI formulas

### 11.4 Deployment Pipeline
- **Vercel Integration**: Automatic deployments from main branch
- **Build Optimization**: Optimized bundles for fast loading
- **CDN Integration**: Global content delivery for static assets

---

## Future Enhancements

### 12.1 Planned Features
- **Advanced Analytics**: Charts and graphs for financial trends
- **Mobile App**: React Native companion app for drivers
- **GPS Integration**: Real-time vehicle tracking
- **Automated Insurance**: Integration with insurance providers
- **Maintenance Scheduling**: Predictive maintenance based on usage patterns

### 12.2 Technical Improvements
- **GraphQL Migration**: More efficient data fetching
- **Offline Support**: Service worker implementation
- **Real-time Notifications**: Push notifications for important events
- **Advanced Reporting**: Custom report builder
- **API Integration**: Third-party service integrations

---

*This documentation provides comprehensive technical reference for the Car Rental Management System. All formulas, calculations, and implementation details are current as of the latest development version.*
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7db70c1d-2d0c-4e82-b14b-ecdb216fca9f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Deep Data Source Tracing Analysis for InvestmentReturnsCard.tsx

### Overview
This section provides a comprehensive trace of every data field displayed in the InvestmentReturnsCard component, mapping each label and value back to its origin data source, including all intermediate calculations and transformations.

### Investment Breakdown Section

#### Initial Investment
**Label**: "Initial investment"
**Value**: `₹{(vehicle.initialInvestment || vehicle.initialCost)?.toLocaleString() || 'N/A'}`
**Data Source**: `vehicle.initialInvestment` or `vehicle.initialCost`
**Origin**: `vehicles` collection field (direct database value)
**Formula**: Direct field value from vehicle record

#### Prepayment
**Label**: "Prepayment"
**Value**: `₹{expenseData.prepayments.toLocaleString()}`
**Data Source**: `expenseData.prepayments`
**Origin**: `expenses` collection filtered by prepayment criteria
**Formula Chain**:
- `vehicleExpenses` = `expenses.filter(e => e.vehicleId === vehicleId && e.status === 'approved')`
- `prepayments` = `vehicleExpenses.filter(e => e.paymentType === 'prepayment' || e.type === 'prepayment' || e.description.toLowerCase().includes('prepayment') || e.description.toLowerCase().includes('principal')).reduce((sum, e) => sum + e.amount, 0)`

#### Total Expenses
**Label**: "Total expenses"
**Value**: `₹{expenseData.totalExpenses.toLocaleString()}`
**Data Source**: `expenseData.totalExpenses`
**Origin**: `expenses` collection filtered by vehicle and operational expenses
**Formula Chain**:
- `operationalExpenses` = `vehicleExpenses.filter(e => !(e.paymentType === 'prepayment' || e.type === 'prepayment' || e.description.toLowerCase().includes('prepayment') || e.description.toLowerCase().includes('principal')))`
- `totalExpenses` = `operationalExpenses.reduce((sum, e) => sum + e.amount, 0)`

#### Total Investment
**Label**: "Total investment"
**Value**: `₹{getTotalInvestment().toLocaleString()}`
**Data Source**: `getTotalInvestment()` function
**Origin**: Calculated from vehicle and expense data
**Formula**: `(vehicle.initialInvestment || vehicle.initialCost || 0) + expenseData.prepayments + expenseData.totalExpenses`

### Returns & Performance Section

#### Total Earnings
**Label**: "Total Earnings"
**Value**: `₹{financialData.totalEarnings.toLocaleString()}`
**Data Source**: `financialData.totalEarnings`
**Origin**: `payments` collection + `calculateVehicleFinancials` function
**Formula Chain**:
- `vehiclePayments` = `payments.filter(p => p.vehicleId === vehicleId && p.status === 'paid')`
- `totalEarnings` = `vehiclePayments.reduce((sum, p) => sum + p.amountPaid, 0) + (vehicle.previousData?.rentEarnings || 0)`

#### Current Vehicle Value
**Label**: "Current Vehicle Value"
**Value**: `₹{vehicle.residualValue?.toLocaleString() || 'N/A'}`
**Data Source**: `vehicle.residualValue`
**Origin**: `vehicles` collection field (manual entry or calculated)
**Formula**: Direct field value from vehicle record

#### Outstanding Loan
**Label**: "Outstanding Loan"
**Value**: `₹{financialData.outstandingLoan.toLocaleString()}`
**Data Source**: `financialData.outstandingLoan`
**Origin**: `calculateVehicleFinancials` function + amortization schedule
**Formula Chain**:
- `amortizationSchedule` = `vehicle.loanDetails?.amortizationSchedule || []`
- `unpaidSchedules` = `amortizationSchedule.filter(s => !s.isPaid)`
- `outstandingLoan` = `unpaidSchedules.reduce((sum, emi) => sum + (emi.principal || 0), 0)` OR fallback to `vehicle.loanDetails?.outstandingLoan`

#### Total Return
**Label**: "Total Return (Earnings + Current Car Value - Outstanding Loan)"
**Value**: `₹{financialData.totalReturn.toLocaleString()}`
**Data Source**: `financialData.totalReturn`
**Origin**: `calculateVehicleFinancials` function
**Formula**: `(vehicle.residualValue || currentDepreciatedCarValue) + totalEarnings - outstandingLoan`

#### Investment Status Badge
**Label**: "Investment Status"
**Value**: Badge "Investment Covered" (conditional display)
**Data Source**: `financialData.isInvestmentCovered`
**Origin**: `calculateVehicleFinancials` function
**Formula**: `profitLoss >= 0` where `profitLoss = totalReturn - totalInvestment`

#### ROI
**Label**: "ROI"
**Value**: `{financialData.roiPercentage >= 0 ? '+' : ''}{financialData.roiPercentage.toFixed(1)}%`
**Data Source**: `financialData.roiPercentage`
**Origin**: `calculateVehicleFinancials` function
**Formula**: `totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0`

#### Total Net Cash Flow
**Label**: "Total Net Cash Flow"
**Value**: `₹{(financialData.totalEarnings - financialData.totalExpenses).toLocaleString()}`
**Data Source**: `financialData.totalEarnings - financialData.totalExpenses`
**Origin**: `calculateVehicleFinancials` function
**Formula**: `totalEarnings - totalExpensesForDisplay` where `totalExpensesForDisplay = totalOperatingExpenses + totalEmiPaid`

### Profit/Loss Section

#### Profit/Loss
**Label**: "Profit/Loss"
**Value**: `₹{(financialData.totalReturn - financialData.totalInvestment).toLocaleString()} ({financialData.grossProfitLossPercentage.toFixed(1)}%)`
**Data Source**: `financialData.totalReturn - financialData.totalInvestment` and `financialData.grossProfitLossPercentage`
**Origin**: `calculateVehicleFinancials` function
**Formula Chain**:
- `profitLoss` = `totalReturn - totalInvestment`
- `grossProfitLossPercentage` = `totalInvestment > 0 ? Math.abs(profitLoss / totalInvestment) * 100 : 0`

## Deep Data Source Tracing Analysis for TotalReturnsBreakdownCard.tsx

### Overview
This section provides a comprehensive trace of every data field displayed in the TotalReturnsBreakdownCard component, mapping each label and value back to its origin data source, including all intermediate calculations and transformations.

### Current Car Value Calculation
**Label**: "Current Car Value:"
**Value**: `+₹{(() => { ... })()}`
**Data Source**: Complex inline calculation
**Origin**: `vehicles` collection + depreciation calculation
**Formula Chain**:
- `initialValue` = `vehicle.initialInvestment || vehicle.initialCost || 0`
- `depreciationRate` = `vehicle.depreciationRate ?? 10`
- `depreciationPerYear` = `depreciationRate / 100`
- `purchaseYear` = `vehicle.year || new Date().getFullYear()`
- `currentYear` = `new Date().getFullYear()`
- `operationalYears` = `Math.max(1, currentYear - purchaseYear + 1)`
- `depreciatedValue` = `initialValue * Math.pow((1 - depreciationPerYear), operationalYears)`
- Display: `Math.round(depreciatedValue).toLocaleString()`

### Total Earnings
**Label**: "Total Earnings:"
**Value**: `+₹{financialData.totalEarnings.toLocaleString()}`
**Data Source**: `financialData.totalEarnings`
**Origin**: Same as InvestmentReturnsCard total earnings
**Formula**: Same calculation as InvestmentReturnsCard

### Outstanding Loan
**Label**: "Outstanding Loan:"
**Value**: `-₹{financialData.outstandingLoan.toLocaleString()}`
**Data Source**: `financialData.outstandingLoan`
**Origin**: Same as InvestmentReturnsCard outstanding loan
**Formula**: Same calculation as InvestmentReturnsCard

### Total Returns
**Label**: "Total Returns:"
**Value**: `₹{financialData.totalReturn.toLocaleString()}`
**Data Source**: `financialData.totalReturn`
**Origin**: Same as InvestmentReturnsCard total return
**Formula**: Same calculation as InvestmentReturnsCard

### Data Source Summary for Investment Components
- **Primary Collections**: `vehicles`, `payments`, `expenses`
- **Calculated Props**: `financialData` (from `calculateVehicleFinancials`), `expenseData` (from `getVehicleExpenseData`)
- **Key Functions**: `calculateVehicleFinancials`, `getVehicleExpenseData`, `getTotalInvestment`
- **Depreciation Logic**: Manual calculation in component vs. `calculateVehicleFinancials`
- **Note**: TotalReturnsBreakdownCard uses its own depreciation calculation rather than `financialData.currentVehicleValue`

This analysis ensures complete traceability from every displayed value back to its fundamental data source, enabling accurate debugging and maintenance of the investment and returns components.

---

## Deep Data Source Tracing Analysis for AnalyticsTab.tsx

### Overview
The AnalyticsTab component is a comprehensive analytics dashboard that displays vehicle financial performance through multiple charts, cards, and projections. It receives vehicle data, financial calculations, and raw payment/expense records as props, then processes this data through multiple useMemo calculations to generate chart data and filtered views. The component supports time-based filtering (yearly/quarterly/monthly) and renders child components for detailed breakdowns.

### Component Props & Data Sources

#### Primary Props
**vehicle**: `any` - Complete vehicle document from Firestore
- **Origin**: `vehicles` collection document
- **Usage**: Vehicle metadata, ownership type, loan details, partnership info
- **Key Fields Used**: `ownershipType`, `partnerShare`, `serviceChargeRate`, `financingType`, `loanDetails`

**financialData**: `any` - Pre-calculated financial metrics from `calculateVehicleFinancials`
- **Origin**: `calculateVehicleFinancials()` function processing payments, expenses, and vehicle data
- **Usage**: ROI calculations, total earnings, outstanding loans, profit/loss metrics
- **Key Fields Used**: `totalEarnings`, `outstandingLoan`, `totalReturn`, `roiPercentage`

**expenseData**: `any` - Categorized expense totals from `getVehicleExpenseData`
- **Origin**: `expenses` collection filtered and categorized by vehicle
- **Usage**: Prepayment amounts, total operational expenses
- **Key Fields Used**: `prepayments`, `totalExpenses`

**firebasePayments**: `any[]` - Raw payment records array
- **Origin**: `payments` collection filtered by vehicleId and status='paid'
- **Usage**: Earnings calculations, time-filtered data aggregation
- **Formula Chain**: `firebasePayments.filter(p => p.vehicleId === vehicleId && p.status === 'paid')`

**vehicleId**: `string` - Current vehicle identifier
- **Origin**: URL parameter or parent component
- **Usage**: Filtering payments and expenses for current vehicle

**getTotalInvestment**: `() => number` - Function calculating total investment
- **Origin**: `(vehicle.initialInvestment || vehicle.initialCost || 0) + expenseData.prepayments + expenseData.totalExpenses`
- **Usage**: Investment amount display and ROI calculations

**calculateProjection**: Function for financial projections
- **Origin**: Complex projection algorithm using vehicle data and assumptions
- **Usage**: Multi-year financial projections with partner earnings

**vehicleExpenses**: `any[]` - Raw expense records array
- **Origin**: `expenses` collection filtered by vehicleId and status='approved'
- **Usage**: Time-filtered expense aggregation and categorization

### Internal State & Controls

#### Time Period Filtering State
**timePeriod**: `'yearly' | 'quarterly' | 'monthly'` (default: 'yearly')
- **Origin**: Component useState
- **Usage**: Controls data aggregation granularity for charts

**selectedYear**: `number` (default: current year)
- **Origin**: Component useState
- **Usage**: Year filter for all time-based calculations

**selectedQuarter**: `number` (default: 1)
- **Origin**: Component useState
- **Usage**: Quarter filter when timePeriod='quarterly'

**selectedMonth**: `number` (default: current month)
- **Origin**: Component useState
- **Usage**: Month filter when timePeriod='monthly'

**loanProjectionYear**: `number` (default: 1)
- **Origin**: Component useState
- **Usage**: Separate year control for loan projections

### Computed Data (useMemo Calculations)

#### earningsVsExpensesData
**Purpose**: Time-filtered earnings vs expenses chart data
**Data Source**: `firebasePayments`, `vehicleExpenses`, time period state
**Origin**: Real-time calculation from raw payment and expense records
**Formula Chain**:
- `filteredPayments` = `firebasePayments.filter(p => p.vehicleId === vehicleId && p.status === 'paid' && dateRangeMatch)`
- `filteredExpenses` = `vehicleExpenses.filter(e => dateRangeMatch)`
- `monthlyEarnings` = `filteredPayments.reduce((sum, p) => sum + p.amountPaid, 0)`
- `monthlyExpenses` = `filteredExpenses.reduce((sum, e) => sum + e.amount, 0)`
- `dataPoints` = `[{period, earnings: monthlyEarnings, expenses: monthlyExpenses, profit: monthlyEarnings - monthlyExpenses}]`

#### expenseBreakdownData
**Purpose**: Pie chart data showing expense categories
**Data Source**: `vehicleExpenses`, time period state
**Origin**: Categorized expense aggregation from raw records
**Formula Chain**:
- `filteredExpenses` = `vehicleExpenses.filter(e => dateRangeMatch)`
- `categoryTotals[category]` = `filteredExpenses.reduce((sum, e) => sum + e.amount, 0)` by category
- **Category Logic**: Complex categorization based on `expenseType`, `type`, `paymentType`, and description patterns
- `breakdown` = `Object.entries(categoryTotals).map(([name, value]) => ({name: displayName, value, color}))`

#### partnerProjectionData
**Purpose**: Multi-year projection data with partner earnings
**Data Source**: `calculateProjection`, `vehicle`, projection settings
**Origin**: Complex financial projection with partner profit sharing
**Formula Chain**:
- `projection` = `calculateProjection(year, assumedRent, increasedEMIAmt, netCashFlowMode)`
- `monthlyProfit` = `projection.monthlyEarnings - projection.monthlyOperatingExpenses`
- `gstAmount` = `monthlyProfit > 0 ? monthlyProfit * 0.04 : 0`
- `serviceCharge` = `isPartnerTaxi ? monthlyProfit * serviceChargeRate : 0`
- `partnerMonthlyShare` = `remainingProfitAfterDeductions * partnerSharePercentage`
- `ownerMonthlyShare` = `remainingProfitAfterDeductions * (1 - partnerSharePercentage)`

#### grossMarginData
**Purpose**: Gross margin utilization bar chart data
**Data Source**: `firebasePayments`, `vehicleExpenses`, time period state
**Origin**: Time-filtered earnings and expenses for margin calculation
**Formula Chain**:
- `filteredEarnings` = `firebasePayments.filter(p => dateRangeMatch).reduce((sum, p) => sum + p.amountPaid, 0)`
- `filteredExpenses` = `vehicleExpenses.filter(e => dateRangeMatch).reduce((sum, e) => sum + e.amount, 0)`
- `grossProfit` = `filteredEarnings - filteredExpenses`
- `chartData` = `[{name: 'Earnings', value: filteredEarnings}, {name: 'Expenses', value: filteredExpenses}, {name: 'Gross Profit', value: grossProfit}]`

### Rendered Components & Data Flow

#### InvestmentReturnsCard Component
**Props Passed**:
- `vehicle={vehicle}` - Complete vehicle data
- `financialData={financialData}` - Pre-calculated financial metrics
- `expenseData={expenseData}` - Categorized expense totals
- `getTotalInvestment={getTotalInvestment}` - Investment calculation function

#### TotalReturnsBreakdownCard Component
**Props Passed**:
- `vehicle={vehicle}` - Vehicle data for depreciation calculations
- `financialData={financialData}` - Financial metrics
- `firebasePayments={firebasePayments}` - Raw payment records

#### TotalExpensesBreakdownCard Component
**Props Passed**:
- `expenseData={expenseData}` - Categorized expense data

### Chart Components & Data Visualization

#### Earnings vs Expenses Bar Chart
**Data Source**: `earningsVsExpensesData`
**Display Fields**:
- **X-Axis**: `period` (Month names, Week numbers)
- **Bars**: `earnings`, `expenses`
- **Line**: `profit` (earnings - expenses)
- **Title**: Dynamic based on `timePeriod` and selected filters

#### Expense Breakdown Pie Chart
**Data Source**: `expenseBreakdownData`
**Display Fields**:
- **Slices**: `name` (category), `value` (amount), `color`
- **Categories**: fuel, maintenance, insurance, penalties, emi, prepayment, general
- **Sorting**: Descending by value

#### Gross Margin Utilization Bar Chart
**Data Source**: `grossMarginData`
**Display Fields**:
- **Bars**: Earnings (green), Expenses (red), Gross Profit (blue)
- **Values**: Time-filtered totals with currency formatting

### Partner Earnings Projection Chart (Conditional)
**Condition**: `vehicle?.ownershipType === 'partner'`
**Data Source**: `partnerProjectionData`
**Display Fields**:
- **X-Axis**: `year` (Year 1, Year 2, etc.)
- **Lines**: `partnerEarnings`, `ownerEarnings`
- **Calculations**: Partner share with GST and service charge deductions

### Loan Projection Cards (Conditional)
**Condition**: `vehicle?.financingType === 'loan' && vehicle?.loanDetails`
**Data Source**: `calculateProjection` function with loan-specific parameters
**Display Fields**:
- EMI schedule visualization
- Outstanding loan tracking
- Prepayment impact analysis

### UI Control Elements

#### Time Period Selector
**Label**: "Time Period"
**Options**: Yearly, Quarterly, Monthly
**State**: `timePeriod` → `setTimePeriod`
**Impact**: Controls all chart data filtering and aggregation

#### Year Selector
**Label**: "Year"
**Options**: Current year to 10 years back
**State**: `selectedYear` → `setSelectedYear`
**Impact**: Year filter for all time-based calculations

#### Quarter Selector (Conditional)
**Condition**: `timePeriod === 'quarterly'`
**Label**: "Quarter"
**Options**: Q1-Q4 with month ranges
**State**: `selectedQuarter` → `setSelectedQuarter`

#### Month Selector (Conditional)
**Condition**: `timePeriod === 'monthly'`
**Label**: "Month"
**Options**: Jan-Dec
**State**: `selectedMonth` → `setSelectedMonth`

### Data Source Summary for AnalyticsTab
- **Primary Collections**: `vehicles`, `payments`, `expenses`
- **Calculated Props**: `financialData` (from `calculateVehicleFinancials`), `expenseData` (from `getVehicleExpenseData`)
- **Raw Data Arrays**: `firebasePayments`, `vehicleExpenses`
- **State Dependencies**: `timePeriod`, `selectedYear`, `selectedQuarter`, `selectedMonth`
- **Computed Data**: `earningsVsExpensesData`, `expenseBreakdownData`, `partnerProjectionData`, `grossMarginData`
- **External Functions**: `getTotalInvestment`, `calculateProjection`
- **Child Components**: `InvestmentReturnsCard`, `TotalReturnsBreakdownCard`, `TotalExpensesBreakdownCard`
- **Conditional Rendering**: Partner earnings (ownershipType), Loan cards (financingType)
- **Time Filtering**: Dynamic aggregation based on selected time period (yearly/quarterly/monthly)

This analysis ensures complete traceability from every chart data point, card value, and UI control back to its fundamental database origin, enabling accurate debugging and maintenance of the analytics dashboard.

---

## Deep Data Source Tracing Analysis for FinancialAccountsTab.tsx

### Overview
The FinancialAccountsTab component is a comprehensive accounting interface that displays company-level financial summaries and per-vehicle accounting cards. It receives company financial data, accounting transactions, and vehicle information as props, then processes this data through complex period-based calculations to generate financial summaries, profit sharing breakdowns, and payment tracking. The component supports navigation to detailed expense views and handles bulk payment operations.

### Component Props & Data Sources

#### Primary Props
**companyFinancialData**: `any` - Complete company financial dataset with filtering and raw data
- **Origin**: Parent component calculations from `vehicles`, `payments`, `expenses` collections
- **Usage**: Period filtering, vehicle data, payment/expense records, filter settings
- **Key Fields Used**: `payments[]`, `expenses[]`, `vehicleData[]`, `filterType`, `selectedYear`, `selectedMonth`, `selectedQuarter`, `partnerFilter`

**accountingTransactions**: `AccountingTransaction[]` - Payment transaction history
- **Origin**: `accountingTransactions` collection filtered by companyId
- **Usage**: Tracking payment status for GST, service charges, partner payments, owner shares
- **Key Fields Used**: `vehicleId`, `type`, `month`, `status`

**setAccountingTransactions**: Function - State setter for accounting transactions
- **Origin**: Parent component state management
- **Usage**: Updating transaction records after payments

### Internal State & Data Sources

#### vehicleCashBalances State
**Type**: `Record<string, number>` - Cash balance for each vehicle
- **Origin**: `cashInHand` collection documents loaded via Firestore onSnapshot
- **Formula Chain**:
- `cashRef` = `doc(firestore, \`Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand\`, vehicle.id)`
- `balance` = `cashDoc.exists() ? cashDoc.data().balance || 0 : 0`
- **Usage**: Display current cash position for each vehicle

### Computed Data (Period-Based Calculations)

#### getPeriodData Function - Main Calculation Engine
**Purpose**: Calculate cumulative financial data for selected time period across all vehicles
**Data Source**: `companyFinancialData`, `accountingTransactions`
**Origin**: Real-time calculation from raw payment and expense records with period filtering

**Period Month Determination**:
```typescript
// Monthly filter
if (companyFinancialData.filterType === 'monthly') {
  months = [monthNameToIndex(companyFinancialData.selectedMonth)];
}
// Quarterly filter  
else if (companyFinancialData.filterType === 'quarterly') {
  const quarterMonths = {'Q1': [0,1,2], 'Q2': [3,4,5], 'Q3': [6,7,8], 'Q4': [9,10,11]};
  months = quarterMonths[companyFinancialData.selectedQuarter];
}
// Yearly filter
else if (companyFinancialData.filterType === 'yearly') {
  months = Array.from({length: 12}, (_, i) => i); // [0,1,2,...,11]
}
```

**Vehicle Filtering**:
```typescript
filteredVehicles = companyFinancialData.vehicleData.filter(vehicleInfo => {
  if (companyFinancialData.partnerFilter === 'all') return true;
  if (companyFinancialData.partnerFilter === 'partner') return vehicleInfo.vehicle.ownershipType === 'partner';
  if (companyFinancialData.partnerFilter === 'company') return vehicleInfo.vehicle.ownershipType !== 'partner';
  return true;
});
```

### Per-Vehicle Financial Calculations

#### Earnings Calculation
**Label**: "Earnings"
**Value**: `₹{vehicleInfo.earnings.toLocaleString()}`
**Data Source**: `vehicleInfo.earnings` (calculated in getPeriodData)
**Origin**: `payments` collection filtered by vehicle and period
**Formula Chain**:
- `monthPayments` = `companyFinancialData.payments.filter(p => p.vehicleId === vehicleInfo.vehicle.id && p.status === 'paid' && dateInMonthRange)`
- `monthEarnings` = `monthPayments.reduce((sum, p) => sum + p.amountPaid, 0)`
- `cumulativeEarnings` = `months.reduce((total, monthIndex) => total + monthEarnings[monthIndex], 0)`
- `displayValue` = `cumulativeEarnings.toLocaleString()`

#### Expenses Calculation
**Label**: "Expenses"
**Value**: `₹{vehicleInfo.expenses.toLocaleString()}`
**Data Source**: `vehicleInfo.expenses` (calculated in getPeriodData)
**Origin**: `expenses` collection filtered by vehicle and period
**Formula Chain**:
- `monthExpenses` = `companyFinancialData.expenses.filter(e => e.vehicleId === vehicleInfo.vehicle.id && e.status === 'approved' && dateInMonthRange)`
- `monthExpensesAmount` = `monthExpenses.reduce((sum, e) => sum + e.amount, 0)`
- `cumulativeExpenses` = `months.reduce((total, monthIndex) => total + monthExpensesAmount[monthIndex], 0)`
- `displayValue` = `cumulativeExpenses.toLocaleString()`

#### Profit Calculation
**Label**: "Profit (Earnings - Expenses)"
**Value**: `₹{vehicleInfo.profit.toLocaleString()}`
**Data Source**: `vehicleInfo.profit` (calculated in getPeriodData)
**Origin**: Derived from earnings and expenses calculations
**Formula Chain**:
- `cumulativeProfit` = `cumulativeEarnings - cumulativeExpenses`
- `displayValue` = `cumulativeProfit.toLocaleString()`
- **Styling**: `vehicleInfo.profit >= 0 ? 'text-green-600' : 'text-red-600'`

#### GST Amount Calculation
**Label**: "GST (4%)"
**Value**: `₹{vehicleInfo.gstAmount.toLocaleString()}`
**Data Source**: `vehicleInfo.gstAmount` (calculated in getPeriodData)
**Origin**: 4% tax calculation on positive profit
**Formula Chain**:
- `cumulativeGst` = `cumulativeProfit > 0 ? cumulativeProfit * 0.04 : 0`
- `displayValue` = `cumulativeGst.toLocaleString()`
- **Styling**: `text-orange-600`

#### Service Charge Calculation (Partner Vehicles Only)
**Label**: "Service Charge (10%)"
**Value**: `₹{vehicleInfo.serviceCharge.toLocaleString()}`
**Data Source**: `vehicleInfo.serviceCharge` (calculated in getPeriodData)
**Origin**: Service charge on partner vehicle profits
**Formula Chain**:
- `isPartnerTaxi` = `vehicleInfo.vehicle.ownershipType === 'partner'`
- `serviceChargeRate` = `vehicleInfo.vehicle.serviceChargeRate || 0.10`
- `cumulativeServiceCharge` = `isPartnerTaxi && cumulativeProfit > 0 ? cumulativeProfit * serviceChargeRate : 0`
- `displayValue` = `cumulativeServiceCharge.toLocaleString()`
- **Conditional Display**: Only shown when `vehicleInfo.serviceCharge > 0`
- **Styling**: `text-blue-600`

#### Partner Share Calculation (Partner Vehicles Only)
**Label**: "Partner Share (50%)"
**Value**: `₹{vehicleInfo.partnerShare.toLocaleString()}`
**Data Source**: `vehicleInfo.partnerShare` (calculated in getPeriodData)
**Origin**: Partner profit share after GST and service charge deductions
**Formula Chain**:
- `remainingProfitAfterDeductions` = `cumulativeProfit - cumulativeGst - cumulativeServiceCharge`
- `partnerSharePercentage` = `vehicleInfo.vehicle.partnerShare || 0.50`
- `cumulativePartnerShare` = `isPartnerTaxi && remainingProfitAfterDeductions > 0 ? remainingProfitAfterDeductions * partnerSharePercentage : 0`
- `displayValue` = `cumulativePartnerShare.toLocaleString()`
- **Conditional Display**: Only shown when `vehicleInfo.partnerShare > 0`
- **Styling**: `text-purple-600 font-bold`

#### Owner Share Calculation (Partner Vehicles)
**Label**: "Owner's Share (50%)"
**Value**: `₹{vehicleInfo.ownerShare.toLocaleString()}`
**Data Source**: `vehicleInfo.ownerShare` (calculated in getPeriodData)
**Origin**: Owner profit share after GST and service charge deductions
**Formula Chain**:
- `cumulativeOwnerShare` = `isPartnerTaxi && remainingProfitAfterDeductions > 0 ? remainingProfitAfterDeductions * (1 - partnerSharePercentage) : 0`
- `displayValue` = `cumulativeOwnerShare.toLocaleString()`
- **Conditional Display**: Only shown when `vehicleInfo.ownerShare > 0`
- **Styling**: `text-green-600 font-bold`

#### Owner Full Share Calculation (Company Vehicles)
**Label**: "Owner's Share (100%)"
**Value**: `₹{vehicleInfo.ownerFullShare.toLocaleString()}`
**Data Source**: `vehicleInfo.ownerFullShare` (calculated in getPeriodData)
**Origin**: Full owner share for company-owned vehicles after GST
**Formula Chain**:
- `cumulativeOwnerFullShare` = `!isPartnerTaxi && (cumulativeProfit - cumulativeGst) > 0 ? cumulativeProfit - cumulativeGst : 0`
- `displayValue` = `cumulativeOwnerFullShare.toLocaleString()`
- **Conditional Display**: Only shown when `vehicleInfo.ownerFullShare > 0`
- **Styling**: `text-green-600 font-bold`

### Cash Balance Display

#### Cash in Hand
**Label**: "Cash in Hand"
**Value**: `₹{(vehicleCashBalances[vehicleInfo.vehicle.id] || 0).toLocaleString()}`
**Data Source**: `vehicleCashBalances[vehicleInfo.vehicle.id]`
**Origin**: `cashInHand` collection document
**Formula Chain**:
- `cashRef` = `doc(firestore, \`Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand\`, vehicleInfo.vehicle.id)`
- `currentBalance` = `cashDoc.exists() ? cashDoc.data().balance || 0 : 0`
- `displayValue` = `currentBalance.toLocaleString()`
- **Styling**: `text-green-600 font-semibold`

### Payment Status Tracking

#### GST Payment Status
**Label**: "GST Payment"
**Value**: Badge showing "Paid" or "Pay GST" button
**Data Source**: `vehicleInfo.gstPaid` (calculated in getPeriodData)
**Origin**: `accountingTransactions` collection query
**Formula Chain**:
- `periodStr` = Generate period identifier (year/quarter/month format)
- `gstPaid` = `accountingTransactions.some(t => t.vehicleId === vehicleInfo.vehicle.id && t.type === 'gst_payment' && t.month === periodStr && t.status === 'completed')`
- **Display Logic**: Show green "Paid" badge if `gstPaid`, otherwise show payment button

#### Service Charge Collection Status
**Label**: "Service Charge"
**Value**: Badge showing "Collected" or "Collect" button
**Data Source**: `vehicleInfo.serviceChargeCollected` (calculated in getPeriodData)
**Origin**: `accountingTransactions` collection query
**Formula Chain**:
- `serviceChargeCollected` = `accountingTransactions.some(t => t.vehicleId === vehicleInfo.vehicle.id && t.type === 'service_charge' && t.month === periodStr && t.status === 'completed')`
- **Conditional Display**: Only shown for partner vehicles (`vehicleInfo.vehicle.ownershipType === 'partner'`)

#### Partner Payment Status
**Label**: "Partner Payment"
**Value**: Badge showing "Paid" or "Pay Partner" button
**Data Source**: `vehicleInfo.partnerPaid` (calculated in getPeriodData)
**Origin**: `accountingTransactions` collection query
**Formula Chain**:
- `partnerPaid` = `accountingTransactions.some(t => t.vehicleId === vehicleInfo.vehicle.id && t.type === 'partner_payment' && t.month === periodStr && t.status === 'completed')`
- **Conditional Display**: Only shown for partner vehicles

#### Owner Share Collection Status
**Label**: "Owner Share Collection"
**Value**: Badge showing "Collected" or "Collect" button
**Data Source**: `vehicleInfo.ownerShareCollected` (calculated in getPeriodData)
**Origin**: `accountingTransactions` collection query
**Formula Chain**:
- `ownerShareCollected` = `accountingTransactions.some(t => t.vehicleId === vehicleInfo.vehicle.id && t.type === 'owner_share' && t.month === periodStr && t.status === 'completed')`

### Company-Level Summary Cards

#### Total Earnings
**Label**: "Total Earnings"
**Value**: `₹{periodTotals.totalEarnings.toLocaleString()}`
**Data Source**: `periodTotals.totalEarnings` (calculated in getPeriodData)
**Origin**: Sum of all vehicle earnings in period
**Formula Chain**:
- `totalEarnings` = `periodData.reduce((sum, v) => sum + v.earnings, 0)`
- `displayValue` = `totalEarnings.toLocaleString()`

#### Total Expenses
**Label**: "Total Expenses"
**Value**: `₹{periodTotals.totalExpenses.toLocaleString()}`
**Data Source**: `periodTotals.totalExpenses` (calculated in getPeriodData)
**Origin**: Sum of all vehicle expenses in period
**Formula Chain**:
- `totalExpenses` = `periodData.reduce((sum, v) => sum + v.expenses, 0)`
- `displayValue` = `totalExpenses.toLocaleString()`

#### Total Profit
**Label**: "Total Profit"
**Value**: `₹{periodTotals.totalProfit.toLocaleString()}`
**Data Source**: `periodTotals.totalProfit` (calculated in getPeriodData)
**Origin**: Sum of all vehicle profits in period
**Formula Chain**:
- `totalProfit` = `periodData.reduce((sum, v) => sum + v.profit, 0)`
- `displayValue` = `totalProfit.toLocaleString()`

#### Total GST
**Label**: "Total GST"
**Value**: `₹{periodTotals.totalGst.toLocaleString()}`
**Data Source**: `periodTotals.totalGst` (calculated in getPeriodData)
**Origin**: Sum of all vehicle GST amounts in period
**Formula Chain**:
- `totalGst` = `periodData.reduce((sum, v) => sum + v.gstAmount, 0)`
- `displayValue` = `totalGst.toLocaleString()`

#### Total Service Charge
**Label**: "Total Service Charge"
**Value**: `₹{periodTotals.totalServiceCharge.toLocaleString()}`
**Data Source**: `periodTotals.totalServiceCharge` (calculated in getPeriodData)
**Origin**: Sum of all vehicle service charges in period
**Formula Chain**:
- `totalServiceCharge` = `periodData.reduce((sum, v) => sum + v.serviceCharge, 0)`
- `displayValue` = `totalServiceCharge.toLocaleString()`

#### Total Partner Share
**Label**: "Total Partner Share"
**Value**: `₹{periodTotals.totalPartnerShare.toLocaleString()}`
**Data Source**: `periodTotals.totalPartnerShare` (calculated in getPeriodData)
**Origin**: Sum of all vehicle partner shares in period
**Formula Chain**:
- `totalPartnerShare` = `periodData.reduce((sum, v) => sum + v.partnerShare, 0)`
- `displayValue` = `totalPartnerShare.toLocaleString()`

#### Total Owner Share
**Label**: "Total Owner Share"
**Value**: `₹{periodTotals.totalOwnerShare.toLocaleString()}`
**Data Source**: `periodTotals.totalOwnerShare` (calculated in getPeriodData)
**Origin**: Sum of all vehicle owner shares in period
**Formula Chain**:
- `totalOwnerShare` = `periodData.reduce((sum, v) => sum + v.ownerShare + v.ownerFullShare, 0)`
- `displayValue` = `totalOwnerShare.toLocaleString()`

### Navigation & Interactive Elements

#### View Expenses Breakup Link
**Trigger**: Click on "view breakup" text link in expenses section
**Event Handler**: `handleViewExpenses(vehicleId)`
**State Changes**: None (navigation)
**Side Effects**: URL navigation to vehicle payments tab with period filters
**UI Response**: Navigate to `/vehicles/${vehicleId}?tab=payments&period=${period}&year=${year}&month=${month}&quarter=${quarter}`

### Data Source Summary for FinancialAccountsTab
- **Primary Collections**: `vehicles`, `payments`, `expenses`, `accountingTransactions`, `cashInHand`, `companyCashInHand`
- **Calculated Props**: `companyFinancialData` (from parent component processing), `accountingTransactions` (from collection)
- **Key Functions**: `getPeriodData()` (main calculation engine), `handleViewExpenses()` (navigation), payment handlers (`handleGstPayment`, `handleServiceChargeCollection`, etc.)
- **State Dependencies**: `vehicleCashBalances` (loaded from Firestore), bulk payment dialog states
- **External Functions**: `navigate()` (React Router), Firestore operations (`addDoc`, `updateDoc`, `onSnapshot`)
- **Child Components**: `BulkPaymentDialog`
- **Conditional Rendering**: Partner vs company vehicle displays, payment status badges vs buttons, period-based calculations
- **Time Filtering**: Dynamic month selection based on `filterType` (yearly/quarterly/monthly)
- **Navigation**: URL parameter-based navigation to vehicle details payments tab with filter preservation

This analysis ensures complete traceability from every displayed financial value, payment status, and interactive element back to its fundamental database origin, enabling accurate debugging and maintenance of the accounting interface.

---

## Deep Data Source Tracing Analysis for AccountsTab.tsx

### Overview
The AccountsTab component is a comprehensive vehicle-level accounting interface that displays monthly financial summaries, period-based calculations, and payment tracking for individual vehicles. It receives vehicle data and vehicle ID as props, then loads payments, expenses, and accounting transactions from Firestore to generate detailed financial breakdowns, profit sharing calculations, and payment status tracking. The component supports flexible period filtering (monthly/quarterly/yearly) and handles both individual and cumulative payment operations.

### Component Props & Data Sources

#### Primary Props
**vehicle**: `any` - Complete vehicle document from Firestore
- **Origin**: `vehicles` collection document
- **Usage**: Vehicle metadata, ownership type, partnership settings, service charge rates
- **Key Fields Used**: `ownershipType`, `partnerShare`, `serviceChargeRate`, `registrationNumber`

**vehicleId**: `string` - Current vehicle identifier
- **Origin**: URL parameter or parent component
- **Usage**: Filtering payments, expenses, and accounting transactions for current vehicle

### Internal State & Data Sources

#### accountingTransactions State
**Type**: `AccountingTransaction[]` - Payment transaction history for current vehicle
- **Origin**: `accountingTransactions` collection filtered by vehicleId
- **Formula Chain**:
- `transactionsRef` = `collection(firestore, \`Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions\`)`
- `q` = `query(transactionsRef, where('vehicleId', '==', vehicleId), orderBy('createdAt', 'desc'))`
- `transactions` = Real-time snapshot listener data
- **Usage**: Tracking payment status for GST, service charges, partner payments, owner shares

#### cashInHand State
**Type**: `number` - Current cash balance for the vehicle
- **Origin**: `cashInHand` collection document
- **Formula Chain**:
- `cashRef` = `doc(firestore, \`Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand\`, vehicleId)`
- `currentBalance` = `cashDoc.exists() ? cashDoc.data().balance || 0 : 0`
- **Usage**: Display current cash position and update after payments

### Period Selection State
**selectedPeriod**: `'month' | 'quarter' | 'year'` - Current period filter type
**selectedYear**: `string` - Selected year for filtering
**selectedMonth**: `string` - Selected month (when period is 'month')
**selectedQuarter**: `string` - Selected quarter (when period is 'quarter')

### Computed Data (Period-Based Calculations)

#### monthlyData - Main Calculation Engine
**Purpose**: Calculate financial data for each month/period in the selected time range
**Data Source**: `payments`, `expenses`, `accountingTransactions`, period state
**Origin**: Real-time calculation from raw payment and expense records with period filtering

**Period Month Determination**:
```typescript
// Single month
if (selectedPeriod === 'month') {
  monthsToShow = [parseInt(selectedMonth) - 1];
}
// Quarter (3 months)
else if (selectedPeriod === 'quarter') {
  const quarter = parseInt(selectedQuarter);
  const startMonth = (quarter - 1) * 3;
  monthsToShow = [startMonth, startMonth + 1, startMonth + 2];
}
// Year (12 months)
else if (selectedPeriod === 'year') {
  monthsToShow = Array.from({ length: 12 }, (_, i) => i);
}
```

**Monthly Payment Filtering**:
```typescript
monthPayments = payments.filter(p =>
  p.vehicleId === vehicleId &&
  p.status === 'paid' &&
  new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
  new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
);
```

**Monthly Expense Filtering**:
```typescript
monthExpenses = expenses.filter(e =>
  e.vehicleId === vehicleId &&
  e.status === 'approved' &&
  new Date(e.createdAt) >= monthStart &&
  new Date(e.createdAt) <= monthEnd
);
```

### Per-Month Financial Calculations

#### Earnings Calculation
**Label**: "Earnings"
**Value**: `₹{earnings.toLocaleString()}`
**Data Source**: `monthData[].earnings` (calculated in monthlyData)
**Origin**: `payments` collection filtered by vehicle and month
**Formula Chain**:
- `monthPayments` = `payments.filter(p => p.vehicleId === vehicleId && p.status === 'paid' && dateInMonthRange)`
- `earnings` = `monthPayments.reduce((sum, p) => sum + p.amountPaid, 0)`
- `displayValue` = `earnings.toLocaleString()`

#### Total Expenses Calculation
**Label**: "Expenses"
**Value**: `₹{totalExpenses.toLocaleString()}`
**Data Source**: `monthData[].totalExpenses` (calculated in monthlyData)
**Origin**: `expenses` collection filtered by vehicle and month
**Formula Chain**:
- `monthExpenses` = `expenses.filter(e => e.vehicleId === vehicleId && e.status === 'approved' && dateInMonthRange)`
- `totalExpenses` = `monthExpenses.reduce((sum, e) => sum + e.amount, 0)`
- `displayValue` = `totalExpenses.toLocaleString()`

#### Profit Calculation
**Label**: "Profit"
**Value**: `₹{profit.toLocaleString()}`
**Data Source**: `monthData[].profit` (calculated in monthlyData)
**Origin**: Derived from earnings minus expenses
**Formula Chain**:
- `profit` = `earnings - totalExpenses`
- `displayValue` = `profit.toLocaleString()`
- **Styling**: `profit >= 0 ? 'text-green-600' : 'text-red-600'`

#### GST Amount Calculation
**Label**: "GST (4%)"
**Value**: `₹{gstAmount.toLocaleString()}`
**Data Source**: `monthData[].gstAmount` (calculated in monthlyData)
**Origin**: 4% tax calculation on positive profit
**Formula Chain**:
- `gstAmount` = `profit > 0 ? profit * 0.04 : 0`
- `displayValue` = `gstAmount.toLocaleString()`
- **Styling**: `text-orange-600`

#### Service Charge Calculation (Partner Vehicles Only)
**Label**: "Service Charge (10%)"
**Value**: `₹{serviceCharge.toLocaleString()}`
**Data Source**: `monthData[].serviceCharge` (calculated in monthlyData)
**Origin**: Service charge on partner vehicle profits
**Formula Chain**:
- `isPartnerTaxi` = `vehicle?.ownershipType === 'partner'`
- `serviceChargeRate` = `vehicle?.serviceChargeRate || 0.10`
- `serviceCharge` = `isPartnerTaxi && profit > 0 ? profit * serviceChargeRate : 0`
- `displayValue` = `serviceCharge.toLocaleString()`
- **Conditional Display**: Only shown when `serviceCharge > 0`
- **Styling**: `text-blue-600`

#### Partner Share Calculation (Partner Vehicles Only)
**Label**: "Partner Share (50%)"
**Value**: `₹{partnerShare.toLocaleString()}`
**Data Source**: `monthData[].partnerShare` (calculated in monthlyData)
**Origin**: Partner profit share after GST and service charge deductions
**Formula Chain**:
- `remainingProfitAfterDeductions` = `profit - gstAmount - serviceCharge`
- `partnerSharePercentage` = `vehicle?.partnerShare || 0.50`
- `partnerShare` = `isPartnerTaxi && remainingProfitAfterDeductions > 0 ? remainingProfitAfterDeductions * partnerSharePercentage : 0`
- `displayValue` = `partnerShare.toLocaleString()`
- **Conditional Display**: Only shown when `partnerShare > 0`
- **Styling**: `text-purple-600 font-bold`

#### Owner Share Calculation (Partner Vehicles)
**Label**: "Owner's Share (50%)"
**Value**: `₹{ownerShare.toLocaleString()}`
**Data Source**: `monthData[].ownerShare` (calculated in monthlyData)
**Origin**: Owner profit share after GST and service charge deductions
**Formula Chain**:
- `ownerSharePercentage` = `1 - partnerSharePercentage`
- `ownerShare` = `isPartnerTaxi && remainingProfitAfterDeductions > 0 ? remainingProfitAfterDeductions * ownerSharePercentage : 0`
- `displayValue` = `ownerShare.toLocaleString()`
- **Conditional Display**: Only shown when `ownerShare > 0`
- **Styling**: `text-green-600 font-bold`

#### Owner Full Share Calculation (Company Vehicles)
**Label**: "Owner's Share (100%)"
**Value**: `₹{ownerFullShare.toLocaleString()}`
**Data Source**: `monthData[].ownerFullShare` (calculated in monthlyData)
**Origin**: Full owner share for company-owned vehicles after GST
**Formula Chain**:
- `ownerFullShare` = `!isPartnerTaxi && (profit - gstAmount) > 0 ? profit - gstAmount : 0`
- `displayValue` = `ownerFullShare.toLocaleString()`
- **Conditional Display**: Only shown when `ownerFullShare > 0`
- **Styling**: `text-green-600 font-bold`

### Cash Balance Display

#### Cash in Hand
**Label**: "Cash in Hand"
**Value**: `₹{cashInHand.toLocaleString()}`
**Data Source**: `cashInHand` state
**Origin**: `cashInHand` collection document
**Formula Chain**:
- `cashRef` = `doc(firestore, \`Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand\`, vehicleId)`
- `currentBalance` = `cashDoc.exists() ? cashDoc.data().balance || 0 : 0`
- `displayValue` = `currentBalance.toLocaleString()`
- **Styling**: `text-green-600 font-semibold`

### Payment Status Tracking

#### GST Payment Status
**Label**: "GST Payment"
**Value**: Badge showing "Paid" or "Pay GST" button
**Data Source**: `monthData[].gstPaid` (calculated in monthlyData)
**Origin**: `accountingTransactions` collection query
**Formula Chain**:
- `monthStr` = `${year}-${String(month + 1).padStart(2, '0')}`
- `gstPaid` = `accountingTransactions.some(t => t.type === 'gst_payment' && t.month === monthStr && t.status === 'completed')`
- **Display Logic**: Show green "Paid" badge if `gstPaid`, otherwise show payment button

#### Service Charge Collection Status
**Label**: "Service Charge"
**Value**: Badge showing "Collected" or "Collect" button
**Data Source**: `monthData[].serviceChargeCollected` (calculated in monthlyData)
**Origin**: `accountingTransactions` collection query
**Formula Chain**:
- `serviceChargeCollected` = `accountingTransactions.some(t => t.type === 'service_charge' && t.month === monthStr && t.status === 'completed')`
- **Conditional Display**: Only shown for partner vehicles (`vehicle?.ownershipType === 'partner'`)

#### Partner Payment Status
**Label**: "Partner Payment"
**Value**: Badge showing "Paid" or "Pay Partner" button
**Data Source**: `monthData[].partnerPaid` (calculated in monthlyData)
**Origin**: `accountingTransactions` collection query
**Formula Chain**:
- `partnerPaid` = `accountingTransactions.some(t => t.type === 'partner_payment' && t.month === monthStr && t.status === 'completed')`
- **Conditional Display**: Only shown for partner vehicles

#### Owner Share Collection Status
**Label**: "Owner Share Collection"
**Value**: Badge showing "Collected" or "Collect" button
**Data Source**: `monthData[].ownerShareCollected` (calculated in monthlyData)
**Origin**: `accountingTransactions` collection query
**Formula Chain**:
- `ownerShareCollected` = `accountingTransactions.some(t => t.type === 'owner_share' && t.month === monthStr && t.status === 'completed')`

#### Owner Withdrawal Status
**Label**: "Owner Withdrawal"
**Value**: Badge showing "Withdrawn" or "Withdraw" button
**Data Source**: `monthData[].ownerWithdrawn` (calculated in monthlyData)
**Origin**: `accountingTransactions` collection query
**Formula Chain**:
- `ownerWithdrawn` = `accountingTransactions.some(t => t.type === 'owner_withdrawal' && t.month === monthStr && t.status === 'completed')`
- **Conditional Display**: Only shown for company vehicles

### Cumulative Data Calculations

#### cumulativeData - Period Summary Calculations
**Purpose**: Calculate total financial data across all months in selected period
**Data Source**: `monthlyData`, `vehicle`
**Origin**: Aggregation of monthly calculations

**Total Earnings**:
```typescript
totalEarnings = monthlyData.reduce((sum, m) => sum + m.earnings, 0)
```

**Total Expenses**:
```typescript
totalExpenses = monthlyData.reduce((sum, m) => sum + m.totalExpenses, 0)
```

**Total Profit**:
```typescript
totalProfit = totalEarnings - totalExpenses
```

**Total GST**:
```typescript
totalGst = totalProfit > 0 ? totalProfit * 0.04 : 0
```

**Total Service Charge**:
```typescript
isPartnerTaxi = vehicle?.ownershipType === 'partner'
serviceChargeRate = vehicle?.serviceChargeRate || 0.10
totalServiceCharge = isPartnerTaxi && totalProfit > 0 ? totalProfit * serviceChargeRate : 0
```

**Total Partner Share**:
```typescript
remainingProfitAfterDeductions = totalProfit - totalGst - totalServiceCharge
partnerSharePercentage = vehicle?.partnerShare || 0.50
totalPartnerShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
  remainingProfitAfterDeductions * partnerSharePercentage : 0
```

**Total Owner Share**:
```typescript
totalOwnerShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
  remainingProfitAfterDeductions * (1 - partnerSharePercentage) : 0
```

**Total Owner Withdrawal**:
```typescript
totalOwnerWithdrawal = !isPartnerTaxi && (totalProfit - totalGst) > 0 ?
  totalProfit - totalGst : 0
```

### Period Selection Controls

#### Period Type Selector
**Label**: "Period"
**Options**: Month, Quarter, Year
**State**: `selectedPeriod` → `setSelectedPeriod`
**Impact**: Controls data aggregation granularity and month range calculation

#### Year Selector
**Label**: "Year"
**Options**: Current year to 10 years back
**State**: `selectedYear` → `setSelectedYear`
**Impact**: Year filter for all time-based calculations

#### Month Selector (Conditional)
**Condition**: `selectedPeriod === 'month'`
**Label**: "Month"
**Options**: Jan-Dec (localized month names)
**State**: `selectedMonth` → `setSelectedMonth`

#### Quarter Selector (Conditional)
**Condition**: `selectedPeriod === 'quarter'`
**Label**: "Quarter"
**Options**: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
**State**: `selectedQuarter` → `setSelectedQuarter`

### Payment Action Handlers

#### Individual Payment Actions
**GST Payment**: `handleGstPayment(monthData)`
- Updates `cashInHand`: `cashInHand - monthData.gstAmount`
- Creates transaction record in `accountingTransactions` collection

**Service Charge Collection**: `handleServiceChargeCollection(monthData)`
- Updates `cashInHand`: `cashInHand + monthData.serviceCharge` (income)
- Creates transaction record in `accountingTransactions` collection

**Partner Payment**: `handlePartnerPayment(monthData)`
- Updates `cashInHand`: `cashInHand - monthData.partnerShare`
- Creates transaction record in `accountingTransactions` collection

**Owner Share Collection**: `handleOwnerShareCollection(monthData)`
- Updates `cashInHand`: `cashInHand - monthData.ownerShare`
- Creates transaction record in `accountingTransactions` collection

**Owner Withdrawal**: `handleOwnerWithdrawal(monthData)`
- Updates `cashInHand`: `cashInHand - monthData.ownerFullShare`
- Creates transaction record in `accountingTransactions` collection

#### Cumulative Payment Actions
**Cumulative GST Payment**: `handleCumulativeGstPayment()`
- Updates `cashInHand`: `cashInHand - cumulativeData.totalGst`
- Creates transaction record with period-based month string

**Cumulative Service Charge Collection**: `handleCumulativeServiceChargeCollection()`
- Updates `cashInHand`: `cashInHand + cumulativeData.totalServiceCharge` (income)
- Creates transaction record with period-based month string

**Cumulative Partner Payment**: `handleCumulativePartnerPayment()`
- Updates `cashInHand`: `cashInHand - cumulativeData.totalPartnerShare`
- Creates transaction record with period-based month string

**Cumulative Owner Share Collection**: `handleCumulativeOwnerShareCollection()`
- Updates `cashInHand`: `cashInHand - (cumulativeData.totalOwnerShare + cumulativeData.totalOwnerWithdrawal)`
- Creates transaction record with appropriate type based on ownership

### Data Source Summary for AccountsTab
- **Primary Collections**: `vehicles`, `payments`, `expenses`, `accountingTransactions`, `cashInHand`
- **Calculated Props**: `vehicle` (from parent), `vehicleId` (from URL/parent)
- **Key Functions**: `monthlyData` (main calculation engine), `cumulativeData` (period aggregation), payment handlers (`handleGstPayment`, `handleServiceChargeCollection`, etc.)
- **State Dependencies**: `accountingTransactions`, `cashInHand`, period selection states (`selectedPeriod`, `selectedYear`, `selectedMonth`, `selectedQuarter`)
- **External Functions**: Firestore operations (`addDoc`, `updateDoc`, `onSnapshot`), `toast()` notifications
- **Child Components**: None (pure data display component)
- **Conditional Rendering**: Partner vs company vehicle displays, payment status badges vs buttons, period-based calculations
- **Time Filtering**: Dynamic month range calculation based on `selectedPeriod` (month/quarter/year)
- **Real-time Updates**: Live synchronization via Firestore listeners for transactions and cash balance

This analysis ensures complete traceability from every displayed financial value, payment status, and interactive element back to its fundamental database origin, enabling accurate debugging and maintenance of the vehicle accounting interface.

### 13.1 Component Data Source Tracing Template

**Instructions for AI Assistant:**

When I provide context of a specific component file (e.g., AnalyticsTab.tsx, InvestmentReturnsCard.tsx, etc.) and reference this template, perform a **DEEP DATA SOURCE TRACING ANALYSIS** with the following requirements:

### **Analysis Scope:**
- Analyze **EVERY** data field displayed in the component
- Include **ALL** labels and their corresponding values
- Trace **EVERY** displayed value back to its fundamental database origin

### **Tracing Methodology:**
For each data field, show the complete chain:
```
Display Value (D) = Formula involving intermediate values
Intermediate Value (C) = Formula involving other values  
Intermediate Value (B) = Formula involving base values
Base Value (A) = Direct database field from collection/document
```

### **Required Information per Field:**
- **Label**: The display text shown to user
- **Value**: The actual displayed value with formatting
- **Data Source**: Which prop/state/variable provides the data
- **Origin**: Which Firebase collection and document field
- **Formula Chain**: Step-by-step calculation from database to display
- **Dependencies**: Any intermediate calculations or transformations

### **Output Format:**
```
## Deep Data Source Tracing Analysis for [ComponentName].tsx

### Overview
Brief description of the component and its data sources.

### [Section Name] (e.g., Investment Breakdown, Charts, Cards, etc.)

#### [Field Label]
**Label**: "[Exact label text]"
**Value**: `[Actual displayed value with formatting]`
**Data Source**: `[variableName.property]`
**Origin**: `[Firebase collection] field`
**Formula Chain**:
- `step1` = calculation involving database fields
- `step2` = transformation of step1
- `displayValue` = final formatting of step2

#### [Next Field Label]
... (continue for all fields)
```

### **Final Summary:**
```
### Data Source Summary for [ComponentName]
- **Primary Collections**: List all Firebase collections used
- **Calculated Props**: List key calculation functions
- **Key Functions**: List helper functions and transformations
- **State Dependencies**: List any component state that affects calculations
- **External Dependencies**: List any external data sources or APIs
```

### **Example Context to Provide:**
When asking for analysis, provide:
1. The component file content/attachment
2. Reference to this template section
3. Any specific areas of focus (optional)

**Template Reference:** Use this section as the instruction set for performing comprehensive data source tracing analysis on any React component.

---

## Deep Data Source Tracing Analysis for EMITab.tsx

### Overview
The EMITab component displays EMI payment schedule management and tracking for financed vehicles. It shows loan details, payment progress, upcoming payments, and provides quick actions for EMI management. The component receives vehicle loan data and financial calculations as props.

### EMI Payment Schedule Header

#### EMI Amount Per Month
**Label**: "EMI Payment Schedule" (header subtitle)
**Value**: `₹[emiPerMonth].toLocaleString() per month`
**Data Source**: `vehicle.loanDetails.emiPerMonth`
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails.emiPerMonth` field
**Formula Chain**:
- `baseValue` = vehicle.loanDetails.emiPerMonth (direct from Firebase)
- `formattedValue` = baseValue.toLocaleString() (Indian number formatting)
- `displayValue` = `₹${formattedValue} per month`

#### Annual Interest Rate
**Label**: "EMI Payment Schedule" (header subtitle)
**Value**: `[interestRate]% annual interest`
**Data Source**: `vehicle.loanDetails.interestRate`
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails.interestRate` field
**Formula Chain**:
- `baseValue` = vehicle.loanDetails.interestRate (direct from Firebase)
- `displayValue` = `${baseValue}% annual interest`

#### Paid Installments Count
**Label**: Payment progress badge
**Value**: `[paidCount] of [totalCount] paid`
**Data Source**: `vehicle.loanDetails.paidInstallments?.length`
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails.paidInstallments` array field
**Formula Chain**:
- `paidArray` = vehicle.loanDetails.paidInstallments (array of payment dates)
- `paidCount` = paidArray?.length || 0 (array length)
- `totalCount` = vehicle.loanDetails.totalInstallments || 0
- `displayValue` = `${paidCount} of ${totalCount} paid`

#### Outstanding Loan Amount
**Label**: "Outstanding: ₹[amount]"
**Value**: `₹[outstandingLoan].toLocaleString()`
**Data Source**: `financialData.outstandingLoan`
**Origin**: Calculated in `calculateVehicleFinancials()` function from `vehicles/{vehicleId}` collection
**Formula Chain**:
- `amortizationSchedule` = vehicle.loanDetails.amortizationSchedule (array from Firebase)
- `unpaidSchedules` = amortizationSchedule.filter(s => !s.isPaid)
- `outstandingLoan` = unpaidSchedules.reduce((sum, emi) => sum + (emi.principal || 0), 0)
- `fallbackValue` = vehicle.loanDetails?.outstandingLoan || 0 (if no schedule)
- `displayValue` = `₹${outstandingLoan.toLocaleString()}`
- **Note**: After prepayments, the amortization schedule is completely restructured as a fresh loan starting from EMI 1, ignoring all previous payment history

### EMI Summary Cards

#### EMIs Paid Count
**Label**: "EMIs Paid"
**Value**: `[count]` (large number display)
**Data Source**: `vehicle.loanDetails.paidInstallments?.length`
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails.paidInstallments` array field
**Formula Chain**:
- `paidArray` = vehicle.loanDetails.paidInstallments (array from Firebase)
- `displayValue` = paidArray?.length || 0

#### Days to Next EMI
**Label**: "Days to Next EMI"
**Value**: `[daysUntilEMI]` or "Overdue"
**Data Source**: `financialData.daysUntilEMI`
**Origin**: Calculated in `calculateVehicleFinancials()` function from `vehicles/{vehicleId}` collection
**Formula Chain**:
- `amortizationSchedule` = vehicle.loanDetails.amortizationSchedule
- `unpaidSchedules` = amortizationSchedule.filter(s => !s.isPaid)
- `nextEMIDue` = unpaidSchedules[0]?.dueDate (first unpaid EMI)
- `daysUntilEMI` = Math.ceil((new Date(nextEMIDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
- `displayValue` = daysUntilEMI >= 0 ? daysUntilEMI : 'Overdue'

#### Outstanding Amount (in Lakhs)
**Label**: "Outstanding"
**Value**: `₹[amount]L` (e.g., "₹2.5L")
**Data Source**: `financialData.outstandingLoan`
**Origin**: Calculated in `calculateVehicleFinancials()` function from `vehicles/{vehicleId}` collection
**Formula Chain**:
- `outstandingLoan` = calculated from unpaid EMI principals (see above)
- `lakhsValue` = Math.round(outstandingLoan / 100000).toFixed(1)
- `displayValue` = `₹${lakhsValue}L`

#### Completion Percentage
**Label**: "Completed"
**Value**: `[percentage]%`
**Data Source**: Calculated inline from loan details
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails.paidInstallments` and `loanDetails.totalInstallments` fields
**Formula Chain**:
- `paidCount` = vehicle.loanDetails.paidInstallments?.length || 0
- `totalCount` = vehicle.loanDetails.totalInstallments || 1
- `percentage` = ((paidCount / totalCount) * 100).toFixed(0)
- `displayValue` = `${percentage}%`

### EMI Schedule Grid

#### EMI Month Number
**Label**: "EMI [month]"
**Value**: `EMI [monthNumber]`
**Data Source**: `emi.month` (from amortization schedule array)
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails.amortizationSchedule[].month` field
**Formula Chain**:
- `baseValue` = emi.month (direct from Firebase array)
- `displayValue` = `EMI ${baseValue}`

#### EMI Due Date
**Label**: Due date display
**Value**: `[day] [month] [year]` (e.g., "15 Oct 25")
**Data Source**: `emi.dueDate`
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails.amortizationSchedule[].dueDate` field
**Formula Chain**:
- `dueDate` = emi.dueDate (ISO string from Firebase)
- `dateObject` = new Date(dueDate)
- `formattedDate` = dateObject.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
- `displayValue` = formattedDate

#### EMI Amount
**Label**: Monthly payment amount
**Value**: `₹[amount].toLocaleString()`
**Data Source**: `vehicle.loanDetails?.emiPerMonth`
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails.emiPerMonth` field
**Formula Chain**:
- `baseValue` = vehicle.loanDetails?.emiPerMonth || 0
- `formattedValue` = baseValue.toLocaleString()
- `displayValue` = `₹${formattedValue}`

#### Payment Status
**Label**: Status text below EMI amount
**Value**: Various status messages (e.g., "Paid 15 Oct", "3 days left", "5 days overdue")
**Data Source**: Multiple sources based on payment status and dates
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails.amortizationSchedule[]` fields
**Formula Chain**:
- `isPaid` = emi.isPaid (boolean from Firebase)
- `paidAt` = emi.paidAt (timestamp from Firebase)
- `dueDate` = emi.dueDate (string from Firebase)
- `daysDiff` = Math.ceil((new Date(dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
- `status` = isPaid ? `Paid ${new Date(paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                   : daysDiff < 0 ? `${Math.abs(daysDiff)} days overdue`
                   : daysDiff === 0 ? 'Due Today'
                   : `${daysDiff} days left`
- `displayValue` = status

#### Payment Action Button
**Label**: "Pay Now" button
**Visibility**: Appears when payment can be made (3 days before due date OR overdue)
**Logic**: `canPayNow = (dueDate <= threeDaysFromNow) || (daysDiff < 0)`
**Restrictions**:
- Cannot mark payment more than 3 days before due date
- Can mark payment starting 3 days before due date
- Can always mark overdue payments
- Shows "Available in X days" message when payment is too early

#### Payment Date (when paid)
**Label**: Part of status text
**Value**: `Paid [date]` format
**Data Source**: `emi.paidAt`
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails.amortizationSchedule[].paidAt` field
**Formula Chain**:
- `paidAt` = emi.paidAt (ISO timestamp from Firebase)
- `dateObject` = new Date(paidAt)
- `formattedDate` = dateObject.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
- `displayValue` = `Paid ${formattedDate}`

### Quick Actions Section

#### Payment History Summary (Toast)
**Label**: "Payment History Summary"
**Value**: Multi-line summary with counts and amounts
**Data Source**: Multiple loan detail fields
**Origin**: `vehicles/{vehicleId}` collection, `loanDetails` object fields
**Formula Chain**:
- `paidCount` = vehicle.loanDetails?.paidInstallments?.length || 0
- `totalCount` = vehicle.loanDetails?.totalInstallments || 0
- `completionPercentage` = totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(1) : '0'
- `outstandingAmount` = financialData.outstandingLoan.toLocaleString()
- `displayValue` = `EMIs Paid: ${paidCount} of ${totalCount}\nCompletion: ${completionPercentage}%\nRemaining: ${totalCount - paidCount} installments\nOutstanding: ₹${outstandingAmount}`

#### EMI Payment Timing Note
**Label**: Footer note in Quick Actions section
**Value**: "Note: EMI payments can be marked as paid starting 3 days before due date. Overdue payments can include penalty charges."
**Purpose**: Informs users about payment timing restrictions and penalty possibilities

### Data Source Summary for EMITab.tsx
- **Primary Collections**: `vehicles` collection (loan details and amortization schedule)
- **Calculated Props**: `financialData` (VehicleFinancialData interface from calculateVehicleFinancials function)
- **Key Functions**: `calculateVehicleFinancials()` (outstanding loan, days until EMI calculations)
- **Payment Restrictions**: EMI payments can only be marked as paid starting 3 days before due date; overdue payments can include penalty charges
- **Payment Logic**: `canPayNow = (dueDate <= threeDaysFromNow) || (daysDiff < 0)` - allows payment 3 days before due or when overdue
- **Prepayment Behavior**: Prepayments trigger complete loan restructuring where remaining balance becomes a fresh loan starting from EMI 1, ignoring all previous payment history
- **Schedule Integrity**: Paid EMI records remain unchanged; only future EMIs are recalculated as new loan structure

---

## Prepayment Calculator Alert System

### 14.1 Overview
The FinancialTab includes an alert system to guide users on optimal prepayment timing to avoid loan restructuring complications.

### 14.2 Prepayment Timing Alert
**Alert Type**: Warning Alert with AlertTriangle icon
**Location**: FinancialTab.tsx - Prepayment Calculator Card
**Trigger**: Always visible in prepayment calculator
**Message**: "Important: Make prepayments before paying the current month's EMI to avoid restructuring an already paid installment."

### 14.3 Alert Logic
**Alert Type**: Warning Alert with AlertTriangle icon
**Location**: FinancialTab.tsx - Prepayment Calculator Card
**Trigger**: Always visible in prepayment calculator
**Message**: "Important: Make prepayments before paying the current month's EMI to avoid restructuring an already paid installment."

### Alert Logic
```typescript
// Alert is always displayed in prepayment calculator
<Alert className="mb-4">
  <AlertTriangle className="h-4 w-4" />
  <AlertDescription className="text-sm">
    <strong>Important:</strong> Make prepayments before paying the current month's EMI to avoid restructuring an already paid installment.
  </AlertDescription>
</Alert>
```

**Purpose**: 
- Educates users about optimal prepayment timing
- Prevents accidental restructuring of paid EMIs
- Ensures loan calculations remain accurate
- Maintains data integrity of payment history
- **State Dependencies**: None (purely prop-driven component)
- **External Dependencies**: Date calculations using JavaScript Date API, toast notifications via useToast hook

**Template Reference:** Use this section as the instruction set for performing comprehensive data source tracing analysis on any React component.

---

### 13.2 Component UI/UX Analysis Template

**Instructions for AI Assistant:**

When I provide context of a specific component file (e.g., AnalyticsTab.tsx, Dashboard.tsx, etc.) and reference this template, perform a **COMPREHENSIVE UI/UX ANALYSIS** with the following requirements:

### **Analysis Scope:**
- Analyze **EVERY** visual element, layout structure, and interactive component
- Include **ALL** UI elements (cards, buttons, charts, forms, modals, etc.)
- Trace **ALL** user interactions (clicks, hovers, form submissions, navigation)
- Document **ALL** state changes, side effects, and data flow triggered by interactions
- Cover **ALL** styling, responsive behavior, and accessibility features

### **Tracing Methodology:**
For each UI element and interaction, show the complete chain:
```
User Action (Input) → Event Handler → State Update → Side Effects → UI Changes
Component Structure → Layout System → Styling Approach → Responsive Behavior
```

### **Required Information per Element:**

#### **Visual Elements:**
- **Element Type**: Button, Card, Chart, Form, etc.
- **Location**: Where it appears in the component hierarchy
- **Content**: What data/text it displays and how it's sourced
- **Styling**: CSS classes, Tailwind classes, inline styles
- **Purpose**: What it represents and why it exists

#### **Interactive Elements:**
- **Trigger**: Click, hover, submit, change, etc.
- **Event Handler**: Function/method called
- **State Changes**: What state variables are updated
- **Side Effects**: API calls, navigation, modal opens, toast messages
- **UI Response**: What changes visually after interaction
- **Validation**: Any input validation or error handling

#### **Layout & Design:**
- **Structure**: Grid/flexbox layout, component composition
- **Responsive**: How it adapts to different screen sizes
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Visual Hierarchy**: How elements are prioritized visually

### **Output Format:**
```
## Comprehensive UI/UX Analysis for [ComponentName].tsx

### Overview
Brief description of the component's purpose, main features, and overall design approach.

### [Section Name] (e.g., Header Section, Main Content, Sidebar, etc.)

#### [Element Name] (e.g., "Save Button", "Revenue Chart", "Filter Dropdown")
**Type**: `[Button/Card/Chart/etc.]`
**Location**: `[Path in component hierarchy]`
**Visual Design**:
- Layout: `[Grid/Flexbox positioning]`
- Styling: `[CSS classes and key styles]`
- Content: `[What it displays and data source]`
- Responsive: `[How it adapts to screen sizes]`

**Interactions**:
- **Primary Action**: `[Click/Hover/etc.]`
  - Handler: `[functionName]`
  - State Changes: `[what state updates]`
  - Side Effects: `[API calls, navigation, etc.]`
  - UI Response: `[visual changes after action]`

- **Secondary Actions**: `[Other interactions if any]`
  - [Same structure as primary]

**Accessibility**:
- ARIA Labels: `[aria-* attributes]`
- Keyboard Support: `[Enter/Space/Tab handling]`
- Screen Reader: `[alt text, role attributes]`

#### [Next Element]
... (continue for all elements)

### Layout & Responsive Analysis
**Overall Layout Structure**:
- Container: `[Main layout approach]`
- Grid/Flex System: `[How elements are arranged]`
- Breakpoints: `[Responsive behavior at different sizes]`

**Design System Usage**:
- Components: `[shadcn/ui components used]`
- Colors: `[Color scheme and variables]`
- Typography: `[Font sizes, weights, hierarchy]`
- Spacing: `[Margin/padding patterns]`

### State Management & Data Flow
**Component State**:
- Local State: `[useState variables and purposes]`
- Props: `[Received props and their usage]`
- Context: `[Any context providers/consumers]`

**Data Flow**:
- Input: `[How data enters the component]`
- Processing: `[Any transformations or calculations]`
- Output: `[How data affects UI and interactions]`

### User Experience Flow
**Primary User Journey**:
1. `[Step 1: User action and immediate response]`
2. `[Step 2: State updates and side effects]`
3. `[Step 3: Final UI state and feedback]`

**Edge Cases**:
- Loading States: `[How loading is handled]`
- Error States: `[Error messages and recovery]`
- Empty States: `[What shows when no data]`

### Performance Considerations
**Optimizations**:
- Memoization: `[React.memo, useMemo, useCallback usage]`
- Lazy Loading: `[Code splitting or lazy imports]`
- Virtual Scrolling: `[For large lists]`

**Potential Issues**:
- Re-renders: `[What might cause unnecessary re-renders]`
- Bundle Size: `[Heavy dependencies or large components]`
```

### **Final Summary:**
```
### UI/UX Analysis Summary for [ComponentName]
- **Primary Purpose**: Brief statement of component's main function
- **Key Interactions**: List of main user actions and their outcomes
- **Design Patterns**: Notable UI/UX patterns used
- **Accessibility Score**: Overall accessibility compliance level
- **Performance Notes**: Any performance considerations or optimizations needed
- **Improvement Suggestions**: Potential enhancements for better UX
```

### **Example Context to Provide:**
When asking for analysis, provide:
1. The component file content/attachment
2. Reference to this template section
3. Any specific areas of focus (optional)
4. Screenshots or design references if available

**Template Reference:** Use this section as the instruction set for performing comprehensive UI/UX analysis on any React component.

---

### 13.3 Component Navigation Analysis Template

**Instructions for AI Assistant:**

When I provide context of a specific component file (e.g., Dashboard.tsx, VehicleDetails.tsx, etc.) and reference this template, perform a **COMPREHENSIVE NAVIGATION ANALYSIS** with the following requirements:

### **Analysis Scope:**
- Analyze **ALL** navigation triggers (links, buttons, programmatic navigation)
- Document **ALL** routing logic and redirection patterns
- Trace **ALL** route parameters and dynamic segments
- Cover **ALL** navigation guards and conditional redirects
- Include **ALL** state management during navigation transitions
- Document **ALL** URL changes and history manipulation
- Analyze **ALL** breadcrumb navigation and back button behavior

### **Tracing Methodology:**
For each navigation element, show the complete flow:
```
User Action → Navigation Trigger → Route Resolution → State Transfer → URL Update → Component Mount
Navigation Guards → Authentication Checks → Permission Validation → Redirection Logic
```

### **Required Information per Navigation Element:**

#### **Navigation Triggers:**
- **Trigger Type**: Link, Button, Programmatic, Form submission, etc.
- **Trigger Location**: Where the navigation element appears in the UI
- **Trigger Action**: Click, submit, programmatic call, etc.
- **Navigation Method**: React Router navigate(), Link component, window.location, etc.

#### **Route Configuration:**
- **Target Route**: Destination path/URL pattern
- **Route Parameters**: Dynamic segments and query parameters
- **Route Guards**: Authentication, authorization, or custom guards
- **Default Redirects**: Fallback routes for unauthorized access

#### **State Management:**
- **State Transfer**: What data is passed between routes
- **URL State**: Query parameters, hash fragments, state objects
- **Session Storage**: Data persisted across navigation
- **Context Updates**: Global state changes during navigation

#### **User Experience:**
- **Loading States**: Navigation loading indicators
- **Error Handling**: Failed navigation scenarios
- **Back Button**: Browser back button behavior
- **Deep Linking**: Direct URL access handling

### **Output Format:**
```
## Comprehensive Navigation Analysis for [ComponentName].tsx

### Overview
Brief description of the component's navigation patterns, routing integration, and user flow management.

### [Section Name] (e.g., Header Navigation, Action Buttons, Form Submissions, etc.)

#### [Navigation Element Name] (e.g., "View Details Button", "Edit Link", "Save Form")
**Trigger Type**: `[Link/Button/Programmatic/etc.]`
**Location**: `[Where it appears in the component]`
**Target Route**: `[Destination path or route name]`

**Navigation Flow**:
- **Trigger Action**: `[Click/submit/programmatic call]`
  - Handler: `[functionName or inline handler]`
  - Method: `[navigate(), Link, window.location, etc.]`
  - Parameters: `[Route params, query params, state object]`

- **Route Resolution**:
  - Path: `[Actual URL pattern]`
  - Guards: `[Authentication/permission checks]`
  - Redirects: `[Conditional redirections]`

- **State Transfer**:
  - Props: `[Data passed via navigation state]`
  - URL Params: `[Dynamic route parameters]`
  - Query Strings: `[Additional query parameters]`
  - Context: `[Global state updates]`

**User Experience**:
- Loading: `[Loading indicators during navigation]`
- Errors: `[Error handling for failed navigation]`
- Back Navigation: `[Browser back button behavior]`

#### [Next Navigation Element]
... (continue for all navigation elements)

### Route Configuration Analysis
**Component Routes**:
- **Defined Routes**: `[Routes this component handles]`
- **Nested Routes**: `[Child routes and layouts]`
- **Index Routes**: `[Default child routes]`

**Navigation Patterns**:
- **Primary Flows**: `[Main user journeys through navigation]`
- **Secondary Flows**: `[Alternative navigation paths]`
- **Error Flows**: `[Navigation on errors or unauthorized access]`

### State Management During Navigation
**Data Persistence**:
- **Route State**: `[useLocation.state usage]`
- **URL State**: `[Query parameters and hash handling]`
- **Session State**: `[Data stored in session/localStorage]`
- **Context State**: `[Global context updates]`

**State Synchronization**:
- **Entry Sync**: `[State setup when entering route]`
- **Exit Sync**: `[State cleanup when leaving route]`
- **Cross-Route Sync**: `[State sharing between routes]`

### Authentication & Authorization
**Access Control**:
- **Public Routes**: `[Routes accessible without authentication]`
- **Protected Routes**: `[Routes requiring authentication]`
- **Role-Based Access**: `[Routes restricted by user roles]`
- **Permission Checks**: `[Specific permission validations]`

**Redirection Logic**:
- **Login Redirects**: `[Redirects for unauthenticated users]`
- **Unauthorized Redirects**: `[Redirects for insufficient permissions]`
- **Post-Login Redirects**: `[Return to intended destination after login]`

### Performance & Optimization
**Navigation Performance**:
- **Lazy Loading**: `[Route-based code splitting]`
- **Prefetching**: `[Data prefetching on navigation]`
- **Caching**: `[Route/component caching strategies]`

**Bundle Optimization**:
- **Route Splitting**: `[How routes are split into chunks]`
- **Shared Dependencies**: `[Common dependencies across routes]`
```

### **Final Summary:**
```
### Navigation Analysis Summary for [ComponentName]
- **Navigation Complexity**: Assessment of navigation intricacy (Simple/Moderate/Complex)
- **Route Coverage**: Percentage of component functionality involving navigation
- **State Management**: Quality of state transfer during navigation
- **User Experience**: Navigation intuitiveness and error handling
- **Performance Impact**: Navigation-related performance considerations
- **Security**: Authentication and authorization implementation quality
- **Improvement Suggestions**: Potential navigation enhancements or optimizations
```

### **Example Context to Provide:**
When asking for analysis, provide:
1. The component file content/attachment
2. Reference to this template section
3. Any specific navigation flows to focus on (optional)
4. Router configuration files if available (React Router setup)

**Template Reference:** Use this section as the instruction set for performing comprehensive navigation analysis on any React component.
