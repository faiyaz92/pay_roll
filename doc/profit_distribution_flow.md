# Profit Distribution Flow - Payment Calculations & Processing

## Overview
This document outlines the complete profit distribution flow and payment calculations for **Section 5 individual vehicle buttons** in `FinancialAccountsTab.tsx` (GST, Service Charge, Partner Payment, Owner Payment). All payments follow the same transaction pattern with different calculation formulas.

**IMPORTANT**: This flow specifically covers the individual payment buttons that appear on each vehicle card in Section 5. The bulk payment buttons at the top of the section follow similar logic but operate across multiple vehicles.

# Section 5: Individual Vehicle Payment Buttons - Complete Implementation Guide

### 5.1 Overview
Section 5 displays individual payment buttons for each vehicle card in `FinancialAccountsTab.tsx`. Each vehicle shows its financial breakdown and payment buttons based on calculated amounts for the selected period (monthly/quarterly/yearly). The calculations follow a strict sequence: **Gross Profit → GST Deduction → Service Charge Deduction → Net Profit → Partner/Owner Distribution**.

**Key Features:**
- **4 Payment Types**: GST, Service Charge, Partner Payment, Owner Payment
- **3 Period Types**: Monthly, Quarterly, Yearly with different logic for each
- **Dynamic Button States**: Enable/disable based on actually payable amounts
- **Status Badges**: Show payment completion status
- **User Role Restrictions**: Partner users see limited buttons
- **Unified Algorithm**: All payments follow the same calculation and processing pattern

### 5.2 Payment Types and Their Characteristics

| Payment Type | Firestore Type | When Shown | Amount Source | Description |
|-------------|----------------|------------|---------------|-------------|
| **GST Payment** | `'gst_payment'` | Always (non-partners) | `gstAmount` | 4% Government tax on profits |
| **Service Charge** | `'service_charge'` | Partner vehicles only | `serviceCharge` | Company fee on partner vehicles |
| **Partner Payment** | `'partner_payment'` | Partner vehicles only | `partnerShare` | Partner's share of profits |
| **Owner Payment** | `'owner_payment'` | Always (non-partners) | `ownerPayment` | Owner's payment (all vehicles) |

### 5.3 How getPeriodData() Impacts Section 5

The `getPeriodData()` method is **CRITICAL** for Section 5 button display because it:

1. **Determines Month Arrays**: Sets which months are included in calculations
   - Monthly: `[selectedMonthIndex]` (1 month)
   - Quarterly: `[0,1,2]` or `[3,4,5]` or `[6,7,8]` or `[9,10,11]` (3 months)
   - Yearly: `[0,1,2,3,4,5,6,7,8,9,10,11]` (12 months)

2. **Generates Period Strings**: Creates `periodStrings[]` used for transaction lookup
   - Monthly: `["2025-11"]`
   - Quarterly: `["2025-10", "2025-11", "2025-12"]`
   - Yearly: `["2025-01", "2025-02", ..., "2025-12"]`

3. **Calculates allMonthsHaveX Flags**: Determines if ALL months in period have positive amounts
   - `allMonthsHaveGst`: true if every month has profit > 0
   - `allMonthsHaveServiceCharge`: true if every month has service charge > 0
   - `allMonthsHavePartnerShare`: true if every month has partner share > 0
   - `allMonthsHaveOwnerPayment`: true if every month has owner payment > 0

4. **Computes Actually Payable Amounts**: Calculates remaining amounts after previous payments
   - `gstActuallyPayable = MAX(0, gstAmount - paidGstAmount)`
   - `serviceChargeActuallyPayable = MAX(0, serviceCharge - paidServiceChargeAmount)`
   - `partnerShareActuallyPayable = MAX(0, partnerShare - paidPartnerAmount)`
   - `ownerActuallyPayable = MAX(0, ownerPayment - paidOwnerAmount)`

### 5.4 Button Display Logic - Thumb Rules

#### Thumb Rule 1: Button Display Logic by Period Type

**For MONTHLY View (`companyFinancialData.filterType === 'monthly'`):**
**Uses `getLatestTransactionStatus()` function for individual month status:**

```javascript
const monthStr = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
const latestStatus = getLatestTransactionStatus(accountingTransactions, vehicleId, paymentType, monthStr);
```

| Condition | Button State | Logic |
|-----------|-------------|--------|
| `calculatedAmount <= 0` | **No Button** | Amount = 0, nothing to pay |
| `latestStatus === null` | **Enabled Button** | No transaction exists, show payment button |
| `latestStatus === 'completed'` | **"Paid" Badge** | Latest transaction completed |
| `latestStatus === 'reversed'` | **Enabled Button** | Can re-pay after reversal |

**For QUARTERLY/YEARLY View (`companyFinancialData.filterType === 'quarterly'` or `'yearly'`):**
**Uses "all months have amount" + payment status check:**

```javascript
// Only show "Paid" badge if ALL months have positive amounts AND payment is completed
const showBadge = allMonthsHaveAmount && paymentStatus;
const showButton = actuallyPayable > 0;
```

| Condition | Button State | Logic |
|-----------|-------------|--------|
| `actuallyPayable > 0` | **Enabled Button** | Amount due, can pay |
| `actuallyPayable <= 0` AND `allMonthsHaveAmount = true` AND `paymentStatus = true` | **"Paid" Badge** | All months payable and paid |
| `actuallyPayable <= 0` AND `allMonthsHaveAmount = false` | **Disabled Button** | Some months have 0 amount |

#### Thumb Rule 2: When Buttons Are ENABLED

**Buttons are ENABLED when:**
1. `actuallyPayable > 0` (amount still due)
2. For monthly: `latestStatus === null` OR `latestStatus === 'reversed'`
3. For quarterly/yearly: Always enabled if `actuallyPayable > 0`

**Example Scenarios:**
- **Fresh vehicle, no payments**: `actuallyPayable = calculatedAmount > 0` → **ENABLED**
- **Partial payment made**: `actuallyPayable = remainingAmount > 0` → **ENABLED**
- **Fully paid**: `actuallyPayable = 0` → **DISABLED**
- **Monthly paid, want to re-pay**: `latestStatus = 'completed'` → **DISABLED** (shows badge)
- **Monthly reversed, want to re-pay**: `latestStatus = 'reversed'` → **ENABLED**

#### Thumb Rule 3: When Status BADGES Are Shown

**"Paid" badges are shown when:**
1. **Monthly View**: `latestStatus === 'completed'`
2. **Quarterly/Yearly View**: `allMonthsHaveAmount = true` AND `paymentStatus = true`

**Why this logic?**
- Monthly: Simple - check if this specific month is paid
- Quarterly/Yearly: Complex - only show "Paid" if EVERY month in the period has positive amounts AND the period is marked as paid

**Example:**
- **Quarterly Q4, all 3 months profitable, paid**: `allMonthsHaveGst = true`, `gstPaid = true` → **"GST Paid" Badge**
- **Quarterly Q4, October profitable + paid, November loss, December profitable + paid**: `allMonthsHaveGst = false` → **Disabled Button** (even though paid for Oct/Dec)

#### Thumb Rule 4: Payment Type Visibility Rules

| Payment Type | When Shown | When Hidden |
|-------------|------------|-------------|
| **GST Payment** | Always (for non-partner users) | Partner users |
| **Service Charge** | Partner vehicles only | Company vehicles |
| **Partner Payment** | Partner vehicles only | Company vehicles |
| **Owner Payment** | Always (for non-partner users) | Partner users |

#### Thumb Rule 5: Button Text and Actions

**Monthly View Actions:**
- **Button Text**: `"Pay [Type] ₹{actuallyPayable}"`
- **Click Action**: Direct confirmation dialog
- **Payment**: Single transaction for the month

**Quarterly/Yearly View Actions:**
- **Button Text**: `"Pay [Type] ₹{actuallyPayable}"`
- **Click Action**: Opens Individual Payment Dialog (Section 5.5)
- **Payment**: Month selection dialog with auto-selection

#### Thumb Rule 6: Actually Payable Calculation

**Formula**: `actuallyPayable = MAX(0, calculatedAmount - paidAmount)`

Where `paidAmount` is calculated using `getLatestTransactionAmount()`:
- Groups transactions by month
- For each month in period, gets latest transaction
- Only counts `status === 'completed'` transactions
- Sums amounts across all relevant months

#### Thumb Rule 7: getLatestTransactionStatus() Behavior

```javascript
const getLatestTransactionStatus = (transactions, vehicleId, type, month) => {
  const relevantTransactions = transactions.filter(t =>
    t.vehicleId === vehicleId && t.type === type && t.month === month
  );

  if (relevantTransactions.length === 0) return null;

  // Sort by completedAt descending (latest first)
  const sorted = relevantTransactions.sort((a, b) =>
    new Date(b.completedAt || 0) - new Date(a.completedAt || 0)
  );

  return sorted[0].status; // 'completed', 'pending', or 'reversed'
};
```

**Key Points:**
- Returns `null` if no transactions exist
- Returns latest transaction status (handles undo/redo operations)
- Used only for monthly view logic

#### Thumb Rule 8: allMonthsHaveX Flag Calculation

**Calculated in getPeriodData() for each payment type:**

```javascript
let allMonthsHaveGst = true;
months.forEach(monthIndex => {
  // Calculate profit for this month
  const monthProfit = calculateMonthProfit(monthIndex);

  // GST = 0 if profit <= 0
  if (monthProfit <= 0) {
    allMonthsHaveGst = false;
  }
});
```

**Same logic applies to all payment types:**
- `allMonthsHaveServiceCharge`: false if any month has service charge = 0
- `allMonthsHavePartnerShare`: false if any month has partner share = 0
- `allMonthsHaveOwnerPayment`: false if any month has owner payment = 0

#### Thumb Rule 9: Period String Matching

**Transaction lookup uses periodStrings[] for matching:**

```javascript
const isInPeriod = periodStrings.includes(t.month) ||
  (filterType === 'quarterly' && t.month === `${year}-${selectedQuarter}`) ||
  (filterType === 'yearly' && t.month === `${year}`);
```

**Examples:**
- Monthly "2025-11": `periodStrings = ["2025-11"]`
- Quarterly "Q4 2025": `periodStrings = ["2025-10", "2025-11", "2025-12"]`
- Yearly "2025": `periodStrings = ["2025-01", ..., "2025-12"]`

#### Thumb Rule 10: User Role Impact

**Partner users see different buttons:**
- Cannot see GST, Service Charge, Partner Payment, Owner Payment buttons
- Can only see rent collection and EMI payment buttons
- Logic: `{userInfo?.role !== Role.PARTNER && (...)}`

### 5.5 Complete Calculation Flow for Each Vehicle

#### Step 1: Determine Period Months Based on Selection Type
The `getPeriodData()` function uses the same logic for all period types, but determines different month arrays:

```javascript
// Same method handles all period types
const year = parseInt(selectedYear);
let months: number[] = [];

// Period type determines which months to include
if (filterType === 'monthly') {
  // Single month: Find month index from month name
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  const monthIndex = monthNames.indexOf(monthName); // e.g., 'November' → 10
  months = [monthIndex]; // e.g., [10] for November only
} else if (filterType === 'quarterly') {
  // Quarter months: 3 months based on selected quarter
  const quarterMonths = {
    'Q1': [0, 1, 2],    // Jan, Feb, Mar
    'Q2': [3, 4, 5],    // Apr, May, Jun
    'Q3': [6, 7, 8],    // Jul, Aug, Sep
    'Q4': [9, 10, 11]   // Oct, Nov, Dec
  };
  months = quarterMonths[selectedQuarter]; // e.g., [9,10,11] for Q4
} else if (filterType === 'yearly') {
  // All months: 12 months for full year
  months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
}
```

#### Step 2: Calculate Cumulative Earnings and Expenses
**Same logic for all period types - accumulates data across selected months:**

```javascript
// Initialize cumulative variables for each vehicle
let cumulativeEarnings = 0;
let cumulativeExpenses = 0;

// Loop through each month in the period (1 month for monthly, 3 for quarterly, 12 for yearly)
months.forEach(monthIndex => {
  const monthStart = new Date(year, monthIndex, 1);        // 1st of month
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59); // Last day of month

  // Get payments for this specific month
  const monthPayments = payments.filter(p =>
    p.vehicleId === vehicleId &&
    p.status === 'paid' &&
    new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
    new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
  );

  // Get expenses for this specific month
  const monthExpenses = expenses.filter(e =>
    e.vehicleId === vehicleId &&
    e.status === 'approved' &&
    new Date(e.createdAt) >= monthStart &&
    new Date(e.createdAt) <= monthEnd
  );

  // Sum amounts for this month
  const monthEarnings = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const monthExpensesAmount = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Add to cumulative totals
  cumulativeEarnings += monthEarnings;
  cumulativeExpenses += monthExpensesAmount;
});
```

#### Step 3: Calculate Gross Profit
```javascript
cumulativeProfit = cumulativeEarnings - cumulativeExpenses;
```

#### Step 4: Calculate GST (4% on Gross Profit)
```javascript
// GST only applies to positive profit
cumulativeGst = cumulativeProfit > 0 ? cumulativeProfit * 0.04 : 0;
```

#### Step 5: Calculate Service Charge (Partner Vehicles Only)
```javascript
const isPartnerVehicle = vehicle.isPartnership === true;
const serviceChargeRate = (vehicle.serviceChargeRate || 10) / 100; // Default 10%

// Service charge only for partner vehicles with positive profit
cumulativeServiceCharge = isPartnerVehicle && cumulativeProfit > 0
  ? cumulativeProfit * serviceChargeRate
  : 0;
```

#### Step 6: Calculate Net Profit
```javascript
// Deduct GST and service charge from gross profit
const netProfit = cumulativeProfit > 0
  ? cumulativeProfit - cumulativeGst - cumulativeServiceCharge
  : 0;
```

#### Step 7: Calculate Partner Share and Owner Payment
```javascript
const partnerSharePercentage = vehicle.partnershipPercentage
  ? vehicle.partnershipPercentage / 100
  : 0.50; // Default 50%

if (isPartnerVehicle) {
  // Partner vehicles: Split net profit between partner and owner
  cumulativePartnerShare = netProfit * partnerSharePercentage;
  cumulativeOwnerPayment = netProfit - cumulativePartnerShare;
} else {
  // Company vehicles: All net profit goes to owner
  cumulativeOwnerPayment = netProfit;
  cumulativePartnerShare = 0;
}
```

#### Step 8: Generate Period Strings for Transaction Lookup
**Critical for payment status checking and actually payable calculations:**

```javascript
// Generate period strings array (same format for all period types)
let periodStrings: string[] = months.map(monthIndex =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}`
);

// Also create a single periodStr for transaction creation
const periodStr = filterType === 'yearly' ? `${year}` :
                  filterType === 'quarterly' ? `${year}-${selectedQuarter}` :
                  `${year}-${String(parseInt(selectedMonth)).padStart(2, '0')}`;
```

#### Step 9: Check Payment Status for Period
**Uses periodStrings to check if payments exist for the selected period:**

```javascript
// Check if ANY transaction exists for the period (same logic for all types)
const gstPaid = periodStrings.some(periodStr =>
  accountingTransactions.some(t =>
    t.vehicleId === vehicleId &&
    t.type === 'gst_payment' &&
    t.month === periodStr &&
    t.status === 'completed'
  )
);

// Same logic for serviceChargeCollected, partnerPaid, ownerPaid
const serviceChargeCollected = periodStrings.some(periodStr => /* same check */);
const partnerPaid = periodStrings.some(periodStr => /* same check */);
const ownerPaid = periodStrings.some(periodStr => /* same check */);
```

#### Step 10: Calculate Actually Payable Amounts
**Complex filtering logic that handles all period types:**

```javascript
// Sum ALL paid amounts for the period (handles monthly/quarterly/yearly)
const paidGstAmount = accountingTransactions
  .filter(t =>
    t.vehicleId === vehicleId &&
    t.type === 'gst_payment' &&
    // Complex condition: periodStrings OR special quarterly/yearly logic
    (periodStrings.includes(t.month) ||
     (filterType === 'quarterly' && t.month === `${year}-${selectedQuarter}`) ||
     (filterType === 'yearly' && t.month === `${year}`))
  )
  .reduce((sum, t) => sum + t.amount, 0);

// Calculate actually payable (prevent negative values)
const gstActuallyPayable = Math.max(0, cumulativeGst - paidGstAmount);

// Same logic for all payment types
const paidServiceChargeAmount = /* similar complex filter */;
const serviceChargeActuallyPayable = Math.max(0, cumulativeServiceCharge - paidServiceChargeAmount);

const paidPartnerAmount = /* similar complex filter */;
const partnerShareActuallyPayable = Math.max(0, cumulativePartnerShare - paidPartnerAmount);

const paidOwnerAmount = /* similar complex filter */;
const ownerActuallyPayable = Math.max(0, cumulativeOwnerPayment - paidOwnerAmount);
```

### 5.6 Payment Button Display Logic

#### GST Payment Button
- **Amount Displayed**: `₹{gstActuallyPayable.toLocaleString()}`
- **Enabled When**: `gstActuallyPayable > 0`
- **Disabled When**: `gstActuallyPayable <= 0`
- **Status Badge**: Shows "Paid" when `gstPaid = true`

#### Service Charge Button (Partner Vehicles Only)
- **Amount Displayed**: `₹{serviceChargeActuallyPayable.toLocaleString()}`
- **Enabled When**: `serviceChargeActuallyPayable > 0`
- **Disabled When**: `serviceChargeActuallyPayable <= 0`
- **Status Badge**: Shows "Collected" when `serviceChargeCollected = true`

#### Partner Payment Button (Partner Vehicles Only)
- **Amount Displayed**: `₹{partnerShareActuallyPayable.toLocaleString()}`
- **Enabled When**: `partnerShareActuallyPayable > 0`
- **Disabled When**: `partnerShareActuallyPayable <= 0`
- **Status Badge**: Shows "Paid" when `partnerPaid = true`

#### Owner Payment Button (All Vehicles)
- **Amount Displayed**: `₹{ownerActuallyPayable.toLocaleString()}`
- **Enabled When**: `ownerActuallyPayable > 0`
- **Disabled When**: `ownerActuallyPayable <= 0`
- **Status Badge**: Shows "Paid" when `ownerPaid = true`

### 5.7 Payment Processing Flow

#### Step 1: User Clicks Payment Button
- Button shows the calculated "actually payable" amount
- Triggers confirmation dialog with payment details

#### Step 2: Confirmation Dialog Display
```javascript
// Example for Owner Payment Dialog
const dialogProps = {
  title: `Confirm Owner Payment`,
  description: `Pay ₹${ownerActuallyPayable.toLocaleString()} to owner for ${vehicle.registrationNumber} - ${periodLabel} ${selectedYear}`,
  amount: ownerActuallyPayable,
  vehicle: vehicle,
  paymentType: 'owner_payment'
};
```

#### Step 3: User Confirms Payment
- Dialog validates no additional checks (button enable logic already handles validation)
- Proceeds to payment processing

#### Step 4: Create Accounting Transaction
```javascript
// Create transaction document in Firestore
const transactionRef = collection(firestore,
  `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accountingTransactions`
);

const newTransaction = {
  vehicleId: vehicleId,
  type: 'owner_payment', // 'gst_payment', 'service_charge', 'partner_payment'
  amount: paymentAmount,
  month: periodStr, // e.g., "2025-11", "2025-Q4", "2025"
  description: `Owner Payment for ${registrationNumber} - ${periodLabel} ${year}`,
  status: 'completed',
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString()
};

const docRef = await addDoc(transactionRef, newTransaction);
```

#### Step 5: Update Vehicle Cash Balance
```javascript
// Decrease vehicle cash in hand
const cashRef = doc(firestore,
  `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/cashInHand`,
  vehicleId
);

await setDoc(cashRef, {
  balance: increment(-paymentAmount) // Atomic decrement
}, { merge: true });
```

#### Step 6: Update Company Cash Balance
```javascript
// Decrease company cash balance
const companyCashRef = doc(firestore,
  `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/companyCashInHand`,
  'main'
);

await setDoc(companyCashRef, {
  balance: increment(-paymentAmount), // Atomic decrement
  lastUpdated: new Date().toISOString()
}, { merge: true });
```

#### Step 7: Update Local State
```javascript
// Add transaction to local state
setAccountingTransactions(prev => [...prev, { ...newTransaction, id: docRef.id }]);

// Update vehicle cash balance in local state
setVehicleCashBalances(prev => ({
  ...prev,
  [vehicleId]: (prev[vehicleId] || 0) - paymentAmount
}));

// Show success toast
toast({
  title: 'Owner Payment Completed',
  description: `₹${paymentAmount.toLocaleString()} paid to owner for ${registrationNumber}`,
});
```

#### Step 8: UI Updates Automatically
- Payment button becomes disabled (actually payable becomes 0)
- Status badge shows "Paid"
- Cash balances update across the interface
- Button text changes from "Pay ₹X" to disabled state

### 5.8 Key Technical Implementation Details

#### Single Method, Multiple Period Types
The `getPeriodData()` function uses **identical calculation logic** for all period types:
- **Monthly**: `months = [singleMonthIndex]` → 1 iteration of calculation loop
- **Quarterly**: `months = [month1, month2, month3]` → 3 iterations of calculation loop
- **Yearly**: `months = [0,1,2,...,11]` → 12 iterations of calculation loop

#### Period String Generation
- **Monthly**: `periodStrings = ["2025-MM"]` (1 string)
- **Quarterly**: `periodStrings = ["2025-MM", "2025-MM", "2025-MM"]` (3 strings)
- **Yearly**: `periodStrings = ["2025-01", "2025-02", ..., "2025-12"]` (12 strings)

#### Transaction Lookup Logic
Payment status checking uses `periodStrings.some()` to find if ANY month in the period has transactions, while actually payable calculations use complex filtering to sum amounts across all relevant transactions.

#### Transaction Types Used
| Button | Firestore Type | Description |
|--------|----------------|-------------|
| GST Payment | `'gst_payment'` | 4% government tax |
| Service Charge | `'service_charge'` | Company fee on partners |
| Partner Payment | `'partner_payment'` | Partner's profit share |
| Owner Payment | `'owner_payment'` | Owner's payment (unified) |

#### Period String Formats
- **Monthly**: `"2025-11"` (single month)
- **Quarterly**: `"2025-Q4"` (quarter identifier)
- **Yearly**: `"2025"` (year only)

#### Atomic Operations
- All cash balance updates use `increment()` for thread safety
- Transactions are created with `status: 'completed'` immediately
- No pending states for individual vehicle payments

#### Calculation Flow Summary
```
1. Determine months[] based on period type
2. Loop through months[] to accumulate earnings/expenses
3. Calculate profit, GST, service charge, net profit
4. Calculate partner share and owner payment
5. Generate periodStrings[] for transaction lookup
6. Check payment status using periodStrings.some()
7. Calculate actually payable using complex transaction filtering
8. Display buttons based on actually payable amounts
9. Payment process = Create transaction + Update balances + Update UI
```

This unified approach ensures consistent calculations across all period types while handling the different granularities appropriately.

## Payment Types and Firestore Transaction Types

### Complete AccountingTransaction Interface
```typescript
interface AccountingTransaction {
  id: string;                    // Auto-generated Firestore document ID
  vehicleId: string;             // Reference to vehicle document ID
  type: 'gst_payment' | 'service_charge' | 'partner_payment' | 'owner_payment';
  amount: number;                // Payment amount in rupees
  month: string;                 // Period string (e.g., "2025-11", "2025-Q4", "2025")
  description: string;           // Human-readable description of the transaction
  status: 'pending' | 'completed' | 'reversed';  // Transaction status
  createdAt: string;             // ISO timestamp when transaction was created
  completedAt?: string;          // ISO timestamp when transaction was completed
  reversedAt?: string;           // ISO timestamp when transaction was reversed (optional)
}
```

### All Payment Types and Their Firestore Types

| Payment Type | Firestore Type | Description | Amount Source |
|-------------|----------------|-------------|---------------|
| **GST Payment** | `'gst_payment'` | 4% Government tax on profits | `vehicleInfo.gstAmount` |
| **Service Charge** | `'service_charge'` | Company fee on partner vehicles | `vehicleInfo.serviceCharge` |
| **Partner Payment** | `'partner_payment'` | Partner's share of profits | `vehicleInfo.partnerShare` |
| **Owner Payment** | `'owner_payment'` | Owner's payment (both partner and company vehicles) | `vehicleInfo.ownerPayment` |

### Transaction Status Values
- `'pending'`: Transaction initiated but not yet processed
- `'completed'`: Transaction successfully processed
- `'reversed'`: Transaction cancelled/undone (includes `reversedAt` timestamp)

### Firestore Collection Path
**Collection**: `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/accountingTransactions`

### Complete AccountingTransaction Interface
```typescript
interface AccountingTransaction {
  id: string;                    // Auto-generated Firestore document ID
  vehicleId: string;             // Reference to vehicle document ID
  type: 'gst_payment' | 'service_charge' | 'partner_payment' | 'owner_payment';
  amount: number;                // Payment amount in rupees
  month: string;                 // Period string (e.g., "2025-11", "2025-Q4", "2025")
  description: string;           // Human-readable description of the transaction
  status: 'pending' | 'completed' | 'reversed';  // Transaction status
  createdAt: string;             // ISO timestamp when transaction was created
  completedAt?: string;          // ISO timestamp when transaction was completed
  reversedAt?: string;           // ISO timestamp when transaction was reversed (optional)
}
```

### All Payment Types and Their Firestore Types

| Payment Type | Firestore Type | Description | Amount Source |
|-------------|----------------|-------------|---------------|
| **GST Payment** | `'gst_payment'` | 4% Government tax on profits | `vehicleInfo.gstAmount` |
| **Service Charge** | `'service_charge'` | Company fee on partner vehicles | `vehicleInfo.serviceCharge` |
| **Partner Payment** | `'partner_payment'` | Partner's share of profits | `vehicleInfo.partnerShare` |
| **Owner Payment** | `'owner_payment'` | Owner's payment (both partner and company vehicles) | `vehicleInfo.ownerPayment` |

### Transaction Status Values
- `'pending'`: Transaction initiated but not yet processed
- `'completed'`: Transaction successfully processed
- `'reversed'`: Transaction cancelled/undone (includes `reversedAt` timestamp)

### Firestore Collection Path
**Collection**: `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/accountingTransactions`

### Sample Transaction Documents

#### GST Payment Transaction
```json
{
  "id": "auto-generated-firestore-id",
  "vehicleId": "vehicle-doc-id-123",
  "type": "gst_payment",
  "amount": 2400,
  "month": "2025-11",
  "description": "GST Payment for MH12AB1234 - November 2025",
  "status": "completed",
  "createdAt": "2025-11-15T10:30:00.000Z",
  "completedAt": "2025-11-15T10:30:00.000Z"
}
```

#### Service Charge Transaction
```json
{
  "id": "auto-generated-firestore-id",
  "vehicleId": "vehicle-doc-id-456", 
  "type": "service_charge",
  "amount": 5000,
  "month": "2025-Q4",
  "description": "Service Charge for MH12CD5678 - Q4 2025",
  "status": "completed",
  "createdAt": "2025-11-15T10:35:00.000Z",
  "completedAt": "2025-11-15T10:35:00.000Z"
}
```

#### Partner Payment Transaction
```json
{
  "id": "auto-generated-firestore-id",
  "vehicleId": "vehicle-doc-id-789",
  "type": "partner_payment",
  "amount": 15000,
  "month": "2025-10",
  "description": "Partner Payment for MH12EF9012 - October 2025",
  "status": "completed",
  "createdAt": "2025-11-10T09:00:00.000Z",
  "completedAt": "2025-11-10T09:00:00.000Z"
}
```

#### Owner Payment Transaction (Consolidated)
```json
{
  "id": "auto-generated-firestore-id",
  "vehicleId": "vehicle-doc-id-101",
  "type": "owner_payment",
  "amount": 25000,
  "month": "2025-11",
  "description": "Owner Payment for MH12GH3456 - November 2025",
  "status": "completed",
  "createdAt": "2025-11-15T11:00:00.000Z",
  "completedAt": "2025-11-15T11:00:00.000Z"
}
```

#### Reversed Transaction Example
```json
{
  "id": "auto-generated-firestore-id",
  "vehicleId": "vehicle-doc-id-789",
  "type": "partner_payment",
  "amount": 15000,
  "month": "2025-10",
  "description": "Partner Payment for MH12EF9012 - October 2025",
  "status": "reversed",
  "createdAt": "2025-11-10T09:00:00.000Z",
  "completedAt": "2025-11-15T11:00:00.000Z", // Updated to reversal timestamp (last updated)
  "reversedAt": "2025-11-15T11:00:00.000Z"
}
```

### Field Validation Rules
- `id`: Auto-generated by Firestore, never set manually
- `vehicleId`: Must match existing vehicle document ID
- `type`: Must be one of the 5 allowed payment types
- `amount`: Must be positive number > 0
- `month`: Must follow period string format (YYYY-MM, YYYY-Q#, YYYY)
- `status`: Defaults to 'completed' for new payments
- `createdAt`: ISO 8601 timestamp when transaction was created
- `completedAt`: ISO 8601 timestamp representing the last time transaction status was updated (serves as "last updated" timestamp)
- `reversedAt`: Only present when status is 'reversed'

## Payment Types and Firestore Transaction Types

#### For Monthly Selection
- **Standard logic applies** (unchanged)
- Badge shows if payment completed for that month

#### For Quarterly/Yearly Selection  
- **If actuallyPayable > 0**: Show "Pay [Type] ₹{amount}" (enabled)
- **If actuallyPayable = 0 AND allMonthsHaveAmount = true**: Show "[Type] Paid" badge
- **If actuallyPayable = 0 AND allMonthsHaveAmount = false**: Show "Pay [Type] ₹0" (disabled)

### Examples

**Quarterly Example (Q4 2025 - All Months Have Profit):**
- All 3 months have profit > 0 → `allMonthsHaveGst = true`, `allMonthsHaveServiceCharge = true`, etc.
- GST paid → Shows "GST Paid" badge
- Service Charge paid → Shows "Service Charge Collected" badge
- Partner Payment paid → Shows "Partner Paid" badge
- Owner Payment paid → Shows "Owner Paid" badge

**Quarterly Example (Q4 2025 - Mixed Months):**
- October: profit > 0 (all payments > 0)
- November: profit = 0 (all payments = 0)  
- December: profit > 0 (all payments > 0)
- `allMonthsHaveGst = false`, `allMonthsHaveServiceCharge = false`, etc. (because November has no profit)
- Even if payments completed for Oct/Dec → Shows "Pay [Type] ₹0" (disabled) instead of "Paid"

This ensures users only see "Paid" when the entire period is actually payable and paid for all payment types.

### Query Patterns Used in Section 5

#### Find Paid Amount for Period (Latest Transaction Logic)
```javascript
// IMPROVED: Get latest transaction per month to handle multiple undo/redo operations
const getLatestTransactionAmount = (paymentType) => {
  // Group transactions by month
  const transactionsByMonth = new Map();

  accountingTransactions
    .filter(t => t.vehicleId === vehicleId && t.type === paymentType)
    .forEach(t => {
      if (!transactionsByMonth.has(t.month)) {
        transactionsByMonth.set(t.month, []);
      }
      transactionsByMonth.get(t.month).push(t);
    });

  let totalPaid = 0;

  // For each month in period, get latest transaction
  transactionsByMonth.forEach(monthTransactions => {
    if (periodStrings.includes(monthTransactions[0].month)) {
      // Sort by completedAt descending
      const sortedTransactions = monthTransactions.sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime;
      });

      const latestTransaction = sortedTransactions[0];
      // Only count if latest transaction is completed
      if (latestTransaction.status === 'completed') {
        totalPaid += latestTransaction.amount;
      }
      // If latest is 'reversed', amount = 0 for this month
    }
  });

  return totalPaid;
};

const paidAmount = getLatestTransactionAmount(paymentType);
```

#### Find Transactions for Undo
```javascript
const transactionsToReverse = accountingTransactions.filter(t =>
  t.vehicleId === vehicleId &&
  t.type === paymentType &&
  periodStrings.includes(t.month) &&
  t.status === 'completed'
);
```

## Core Concepts

### Period Types & Period Strings
- **Monthly**: Single month (e.g., "2025-11") â†’ periodStrings: ["2025-11"]
- **Quarterly**: 3 months (e.g., "2025-Q4" includes Oct, Nov, Dec) â†’ periodStrings: ["2025-10", "2025-11", "2025-12"]
- **Yearly**: 12 months (e.g., "2025") â†’ periodStrings: ["2025-01", "2025-02", ..., "2025-12"]

### Payment Tracking
All payments tracked in `accountingTransactions` collection with:
- `type`: 'gst_payment', 'service_charge', 'partner_payment', 'owner_payment'
- `month`: Period string from periodStrings[]
- `status`: 'completed' (paid), 'pending', 'reversed'
- `amount`: Payment amount

## Base Profit Calculation (Per Vehicle, Per Period)

```
Monthly Earnings = Î£(payments.amountPaid) for that month where status === 'paid'
Monthly Expenses = Î£(expenses.amount) for that month where status === 'approved'
Monthly Profit = Monthly Earnings - Monthly Expenses

Cumulative Earnings = Î£(Monthly Earnings) for all months in period
Cumulative Expenses = Î£(Monthly Expenses) for all months in period
Cumulative Profit = Cumulative Earnings - Cumulative Expenses
```

## Payment Type Calculations

### 1. GST Payment (4% to Government)
**Formula**: `GST = Cumulative Profit > 0 ? Cumulative Profit Ã— 0.04 : 0`

### 2. Service Charge (Company Fee on Partner Vehicles)
**Formula**: `Service Charge = (isPartnerVehicle && Cumulative Profit > 0) ? Cumulative Profit Ã— serviceChargeRate : 0`
**Where**: `serviceChargeRate = (vehicle.serviceChargeRate || 10) / 100`

### 3. Partner Share & Owner Payment (Profit Distribution)
**Remaining Profit**: `Remaining Profit = Cumulative Profit - GST - Service Charge`

**Partner Share**: `Partner Share = Remaining Profit Ã— partnerPercentage` (if partner vehicle)
**Owner Payment**: `Owner Payment = Remaining Profit Ã— (1 - partnerPercentage)` (if partner vehicle)
**Owner Payment**: `Owner Payment = Cumulative Profit - GST` (if company vehicle)

### 4. Owner Payment (Consolidated for All Vehicles)
**Formula**: `Owner Payment = vehicleInfo.ownerPayment` (unified calculation for both partner and company vehicles)

## Button Amount Calculation Cases

### Case 1: All Months Not Paid (Fresh Vehicle - No Prior Payments)

#### Monthly Selection (e.g., November 2025)
```
periodStrings = ["2025-11"]
Total GST = GST for November only
Paid GST Amount = 0 (no transactions found)
GST Button Amount = Total GST - 0 = Total GST

Same for all payment types:
- Service Charge Button = Total Service Charge
- Partner Payment Button = Total Partner Share  
- Owner's Share Button = Total Owner Share + Total Owner Full Share
- Owner's Withdrawal Button = Total Owner's Withdrawal
```

#### Quarterly Selection (e.g., Q4 2025: Oct, Nov, Dec)
```
periodStrings = ["2025-10", "2025-11", "2025-12"]
Total GST = Σ(GST for Oct + Nov + Dec)
Paid GST Amount = 0
GST Button Amount = Total GST

Same pattern for all payments - sum across all 3 months
```

### How Quarterly Individual Payments Work

**Individual Vehicle Button Behavior (Section 5):**
- **Button Shows**: Total amount for the entire quarter (sum of all 3 months)
- **Payment Process**: When clicked, creates individual transactions for each unpaid month in the quarter
- **Status Logic**: Uses `gstPaid = periodStrings.some(...)` - shows "Paid" when ANY month in the quarter has a transaction
- **Result**: After payment, status immediately shows "Paid" for the entire quarter

**Example**: For Q4 2025 with no prior payments:
- Button shows: "Pay GST ₹9,000" (₹3,000 × 3 months)
- User clicks → confirmation dialog
- User confirms → creates 3 transactions: one for "2025-10" ₹3,000, one for "2025-11" ₹3,000, one for "2025-12" ₹3,000
- Status immediately changes to "Paid" because `periodStrings.some()` finds transactions for the quarter months

**Why it shows "Paid" immediately**: The individual button pays for the entire quarter at once by creating transactions for all unpaid months, so the quarter status becomes "paid" right after the payment.

### Individual Buttons vs Bulk Buttons for Quarterly

**Individual Vehicle Buttons (Section 5):**
- Pay for entire quarter at once
- Create transactions for all unpaid months
- Status shows "Paid" immediately
- No month selection - pays everything

**Bulk Payment Buttons (Section 5 Top):**
- Allow selective month payment
- Show month selection checkboxes
- Can pay for partial quarters
- Status remains "unpaid" for unselected months

#### Yearly Selection (e.g., 2025)
```
periodStrings = ["2025-01", "2025-02", ..., "2025-12"]
Total GST = Î£(GST for all 12 months)
Paid GST Amount = 0
GST Button Amount = Total GST

Same pattern for all payments - sum across all 12 months
```

### Case 2: Some Months Paid (Partial Payments)

#### Monthly Selection (e.g., November 2025, but November already paid)
```
periodStrings = ["2025-11"]
Total GST = GST for November
Paid GST Amount = Amount from LATEST transaction where:
  - vehicleId matches
  - type === 'gst_payment'
  - month === "2025-11"
  - Latest transaction status === 'completed' (else 0)
GST Button Amount = MAX(0, Total GST - Paid GST Amount)

If Latest Transaction Status = 'completed' → Paid GST Amount = transaction amount
If Latest Transaction Status = 'reversed' → Paid GST Amount = 0
If No Transaction → Paid GST Amount = 0
```

#### Quarterly Selection (e.g., Q4 2025, November paid, Oct & Dec not paid)
```
periodStrings = ["2025-10", "2025-11", "2025-12"]
Total GST = GST for Oct + GST for Nov + GST for Dec

Paid GST Amount = Î£(amount) from LATEST transaction per month where:
  - vehicleId matches
  - type === 'gst_payment' 
  - month in ["2025-10", "2025-11", "2025-12"]
  - Latest transaction status === 'completed' (else 0 for that month)

GST Button Amount = MAX(0, Total GST - Paid GST Amount)

Example: If November GST = â‚¹800 already paid (latest transaction completed)
Total GST = â‚¹2,400 (for 3 months)
Paid GST Amount = â‚¹800 (only November paid, Oct & Dec = 0)
GST Button Amount = â‚¹2,400 - â‚¹800 = â‚¹1,600 (Oct + Dec GST)
```

#### Yearly Selection (e.g., 2025, some months paid)
```
periodStrings = ["2025-01", ..., "2025-12"]
Total GST = Î£(GST for all 12 months)

Paid GST Amount = Î£(amount) from LATEST transaction per month where:
  - vehicleId matches
  - type === 'gst_payment'
  - month in periodStrings
  - Latest transaction status === 'completed' (else 0 for that month)

GST Button Amount = MAX(0, Total GST - Paid GST Amount)
```

**Same logic applies to all payment types** - Service Charge, Partner Payment, Owner's Share, Owner's Withdrawal

### Case 3: All Months Paid (Fully Paid for Period)

#### Any Selection (Monthly/Quarterly/Yearly)
```
Total [Payment Type] = Calculated amount for period
Paid [Payment Type] Amount = Î£(amount) from LATEST transaction per month where:
  - vehicleId matches
  - type matches payment type
  - month in periodStrings
  - Latest transaction status === 'completed' (else 0 for that month)

[Payment Type] Button Amount = MAX(0, Total [Payment Type] - Paid [Payment Type] Amount)

Since all months paid: Paid Amount >= Total Amount
Button Amount = 0 (button disabled/hidden)
```
