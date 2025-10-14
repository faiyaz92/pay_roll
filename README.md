# Car Rental Management System - Technical Documentation

## Table of Contents
1. [Business Requirements Document (BRD)](#business-requirements-document-brd)
2. [System Architecture](#system-architecture)
3. [Screen Logic & User Interfaces](#screen-logic--user-interfaces)
4. [Hooks Logic & Data Management](#hooks-logic--data-management)
5. [Financial Formulas & Calculations](#financial-formulas--calculations)
6. [Cash In Hand Tracking System](#cash-in-hand-tracking-system)
7. [Partner Management System](#partner-management-system)
   - [8.1 Overview](#81-overview)
   - [8.2 Partner Roles & Responsibilities](#82-partner-roles--responsibilities)
   - [8.3 Partner Data Storage](#83-partner-data-storage)
   - [8.4 Partner Authentication & Login](#84-partner-authentication--login)
   - [8.5 Vehicle-Partner Linking](#85-vehicle-partner-linking)
   - [8.6 Partner Management Interface](#86-partner-management-interface)
   - [8.6.1 Partner Add Form Implementation](#861-partner-add-form-implementation)
   - [8.7 Profit Sharing & Service Charges](#87-profit-sharing--service-charges)
   - [8.8 Business Benefits](#88-business-benefits)
8. [Firestore Database Structure](#firestore-database-structure)
9. [Technical Implementation Details](#technical-implementation-details)
10. [Development & Deployment](#development--deployment)
11. [Future Roadmap](#future-roadmap)

---

## 🚀 Latest Updates (October 2025)

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

### 3.4 Drivers Page (`/drivers`)
**Purpose**: Driver management and assignment tracking

**Key Features**:
- **Driver List**: Active/inactive status with assigned vehicles
- **Add Driver Form**: Complete driver profile with documents
- **Driver Details**: Assignment history and performance metrics

### 3.5 Assignments Page (`/assignments`)
**Purpose**: Rental agreement management

**Key Components**:
- **Active Assignments**: Currently running rental contracts
- **Assignment Details**: Weekly rent collection interface
- **Payment Tracking**: Automated due date calculations

### 3.6 Payments Page (`/payments`)
**Purpose**: Centralized payment tracking across all vehicles

**Advanced Filtering System**:
- **Level 1 - Transaction Type**: 'all' | 'paid' | 'received'
- **Level 2 - Payment Type**: 'all' | 'emi' | 'prepayment' | 'expenses' | 'rent'
- **Level 3 - Expense Type**: 'all' | 'maintenance' | 'insurance' | 'fuel' | 'penalties' | 'general'

### 3.7 Fuel Records Page (`/fuel-records`)
**Purpose**: Fuel expense tracking and efficiency monitoring

**Key Features**:
- **Fuel Entry Form**: Odometer reading, quantity, price per liter
- **Efficiency Calculations**: km/liter, cost per km
- **Historical Tracking**: Fuel consumption patterns

### 3.8 Authentication System
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

  // Calculate current remaining tenure with existing outstanding
  let currentTenure = 0;
  let tempOutstanding = outstandingLoan;
  while (tempOutstanding > 0 && currentTenure < 360) {
    const interest = tempOutstanding * monthlyRate;
    const principal = Math.min(emiPerMonth - interest, tempOutstanding);
    tempOutstanding -= principal;
    currentTenure++;
    if (principal <= 0 || tempOutstanding <= 0) break;
  }

  // Calculate new tenure with reduced principal
  let newTenure = 0;
  let tempOutstandingNew = newOutstanding;
  while (tempOutstandingNew > 0 && newTenure < 360) {
    const interest = tempOutstandingNew * monthlyRate;
    const principal = Math.min(emiPerMonth - interest, tempOutstandingNew);
    tempOutstandingNew -= principal;
    newTenure++;
    if (principal <= 0 || tempOutstandingNew <= 0) break;
  }

  const tenureReduction = Math.max(0, currentTenure - newTenure);

  // Calculate interest savings correctly
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
- Current Remaining Tenure = Months needed to pay off current outstanding loan
- New Remaining Tenure = Months needed to pay off loan after prepayment
- Original Total Payments = Current Tenure × EMI per Month
- New Total Payments = New Tenure × EMI per Month
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

---

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

### 8.1 Overview
The Partner Management System enables business partnerships where external partners own and operate vehicles while sharing profits with the company. Partners are treated as independent business owners with dedicated management interfaces and profit-sharing arrangements.

### 8.2 Partner Roles & Responsibilities

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

### 8.3 Partner Data Storage

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

### 8.4 Partner Authentication & Login

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

### 8.5 Vehicle-Partner Linking

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

### 8.6 Partner Management Interface

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

### 8.6.1 Partner Add Form Implementation

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

### 8.7 Profit Sharing & Service Charges

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

### 8.8 Business Benefits

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

### 9.1 Insurance Types & Categories

The system supports multiple insurance types that can be active simultaneously for a single vehicle:

#### Primary Insurance Types
- **Fix Insurance**: Fixed insurance coverage for vehicle protection
- **REGO**: Registration and government compliance insurance
- **Green Slip**: Compulsory third-party personal injury insurance
- **Pink Slip**: Vehicle ownership and title insurance

### 9.2 Insurance Policy Rules

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

### 9.3 Insurance Expense Tracking

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

### 9.4 Insurance Document Management

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
