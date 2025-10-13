# Car Rental Management System - Technical Documentation

## Table of Contents
1. [Business Requirements Document (BRD)](#business-requirements-document-brd)
2. [System Architecture](#system-architecture)
3. [Screen Logic & User Interfaces](#screen-logic--user-interfaces)
4. [Hooks Logic & Data Management](#hooks-logic--data-management)
5. [Financial Formulas & Calculations](#financial-formulas--calculations)
6. [Cash In Hand Tracking System](#cash-in-hand-tracking-system)
7. [Partner Management System](#partner-management-system)
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

### 5.1 Core Financial Calculations

#### Total Investment Formula
```
Total Investment = Initial Investment + Prepayments + Total Operating Expenses + Total EMI Paid

Where:
- Initial Investment = Vehicle purchase price + registration + initial setup
- Prepayments = Principal payments made upfront to reduce loan
- Total Operating Expenses = Fuel + Maintenance + Insurance + Penalties (recurring costs)
- Total EMI Paid = Sum of all EMI payments made (interest + principal)
```

#### Total Return Formula
```
Total Return = Current Car Value + Total Earnings - Outstanding Loan

Where:
- Current Car Value = Initial Investment × (1 - depreciationRate)^operationalYears
- Total Earnings = Sum of all rent payments received
- Outstanding Loan = Remaining loan balance
```

#### ROI (Return on Investment) Formula
```
ROI = (Total Return - Total Investment) / Total Investment × 100

Where:
- Positive ROI = Profit (Total Return > Total Investment)
- Negative ROI = Loss (Total Return < Total Investment)
- Break-even = ROI = 0 (Total Return = Total Investment)
```

#### Monthly Profit Formula
```
Monthly Profit = Monthly Rent - Monthly Operating Expenses

Where:
- Monthly Rent = (Weekly Rent × 52) / 12
- Monthly Operating Expenses = Average monthly recurring expenses
```

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

#### Company Responsibilities
- **Platform Access**: Provide management system access to partners
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

**Storage Path**: `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/users`

### 8.4 Vehicle-Partner Linking

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

### 8.5 Partner Management Interface

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

### 8.6 Profit Sharing & Service Charges

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

### 8.7 Business Benefits

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
