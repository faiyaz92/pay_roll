# Profit Distribution Flow - Payment Calculations & Processing

## Overview
This document outlines the complete profit distribution flow and payment calculations for Section 5 buttons (GST, Service Charge, Partner Payment, Owner Payment). All payments follow the same transaction pattern with different calculation formulas.

## Core Concepts

### Period Types & Period Strings
- **Monthly**: Single month (e.g., "2025-11") → periodStrings: ["2025-11"]
- **Quarterly**: 3 months (e.g., "2025-Q4" includes Oct, Nov, Dec) → periodStrings: ["2025-10", "2025-11", "2025-12"]
- **Yearly**: 12 months (e.g., "2025") → periodStrings: ["2025-01", "2025-02", ..., "2025-12"]

### Payment Tracking
All payments tracked in `accountingTransactions` collection with:
- `type`: 'gst_payment', 'service_charge', 'partner_payment', 'owner_payment'
- `month`: Period string from periodStrings[]
- `status`: 'completed' (paid), 'pending', 'reversed'
- `amount`: Payment amount

## Base Profit Calculation (Per Vehicle, Per Period)

```
Monthly Earnings = Σ(payments.amountPaid) for that month where status === 'paid'
Monthly Expenses = Σ(expenses.amount) for that month where status === 'approved'
Monthly Profit = Monthly Earnings - Monthly Expenses

Cumulative Earnings = Σ(Monthly Earnings) for all months in period
Cumulative Expenses = Σ(Monthly Expenses) for all months in period
Cumulative Profit = Cumulative Earnings - Cumulative Expenses
```

## Payment Type Calculations

### 1. GST Payment (4% to Government)
**Formula**: `GST = Cumulative Profit > 0 ? Cumulative Profit × 0.04 : 0`

### 2. Service Charge (Company Fee on Partner Vehicles)
**Formula**: `Service Charge = (isPartnerVehicle && Cumulative Profit > 0) ? Cumulative Profit × serviceChargeRate : 0`
**Where**: `serviceChargeRate = (vehicle.serviceChargeRate || 10) / 100`

### 3. Partner Share & Owner Payment (Profit Distribution)
**Remaining Profit**: `Remaining Profit = Cumulative Profit - GST - Service Charge`

**Partner Share**: `Partner Share = Remaining Profit × partnerPercentage` (if partner vehicle)
**Owner Payment**: `Owner Payment = Remaining Profit × (1 - partnerPercentage)` (if partner vehicle)
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

#### Yearly Selection (e.g., 2025)
```
periodStrings = ["2025-01", "2025-02", ..., "2025-12"]
Total GST = Σ(GST for all 12 months)
Paid GST Amount = 0
GST Button Amount = Total GST

Same pattern for all payments - sum across all 12 months
```

### Case 2: Some Months Paid (Partial Payments)

#### Monthly Selection (e.g., November 2025, but November already paid)
```
periodStrings = ["2025-11"]
Total GST = GST for November
Paid GST Amount = Σ(amount) from accountingTransactions where:
  - vehicleId matches
  - type === 'gst_payment'
  - month === "2025-11"
  - status === 'completed'
GST Button Amount = MAX(0, Total GST - Paid GST Amount)

If Paid GST Amount >= Total GST → Button Amount = 0
If Paid GST Amount < Total GST → Button Amount = Total GST - Paid GST Amount
```

#### Quarterly Selection (e.g., Q4 2025, November paid, Oct & Dec not paid)
```
periodStrings = ["2025-10", "2025-11", "2025-12"]
Total GST = GST for Oct + GST for Nov + GST for Dec

Paid GST Amount = Σ(amount) from accountingTransactions where:
  - vehicleId matches
  - type === 'gst_payment' 
  - month in ["2025-10", "2025-11", "2025-12"]
  - status === 'completed'

GST Button Amount = MAX(0, Total GST - Paid GST Amount)

Example: If November GST = ₹800 already paid
Total GST = ₹2,400 (for 3 months)
Paid GST Amount = ₹800
GST Button Amount = ₹2,400 - ₹800 = ₹1,600 (Oct + Dec GST)
```

#### Yearly Selection (e.g., 2025, some months paid)
```
periodStrings = ["2025-01", ..., "2025-12"]
Total GST = Σ(GST for all 12 months)

Paid GST Amount = Σ(amount) from accountingTransactions where:
  - vehicleId matches
  - type === 'gst_payment'
  - month in periodStrings
  - status === 'completed'

GST Button Amount = MAX(0, Total GST - Paid GST Amount)
```

**Same logic applies to all payment types** - Service Charge, Partner Payment, Owner's Share, Owner's Withdrawal

### Case 3: All Months Paid (Fully Paid for Period)

#### Any Selection (Monthly/Quarterly/Yearly)
```
Total [Payment Type] = Calculated amount for period
Paid [Payment Type] Amount = Σ(amount) from accountingTransactions where:
  - vehicleId matches
  - type matches payment type
  - month in periodStrings
  - status === 'completed'

[Payment Type] Button Amount = MAX(0, Total [Payment Type] - Paid [Payment Type] Amount)

Since all months paid: Paid Amount >= Total Amount
Button Amount = 0 (button disabled/hidden)
```

## Payment Processing Flow

### 1. User Clicks Payment Button
- Button shows "Actually Payable" amount (after deductions)
- Opens confirmation dialog

### 2. Dialog Shows Month Selection (Quarterly/Yearly only)
- Lists all months in period
- Shows payment status for each month:
  - ✅ Paid (with amount and date)
  - ⏳ Unpaid (with calculated amount)
- User selects months to pay (unpaid months selected by default)
- Amount updates based on selection

### 3. Payment Confirmation
- Creates transaction document(s) in `accountingTransactions`:
  - One document per selected month
  - `month`: Individual month string (e.g., "2025-11")
  - `amount`: Payment amount for that month
  - `type`: Payment type
  - `status`: 'completed'

### 4. Database Operations (Per Transaction)
```
1. accountingTransactions Collection:
   - Path: Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/accountingTransactions
   - Operation: addDoc() - create new document

2. cashInHand Subcollection:
   - Path: Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/cashInHand/{vehicleId}
   - Operation: setDoc(..., { balance: increment(-amount) }, { merge: true })

3. companyCashInHand Collection:
   - Path: Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/companyCashInHand/main
   - Operation: setDoc(..., { balance: increment(-amount), lastUpdated: new Date() }, { merge: true })
```

### 5. Local State Updates
- Add new transaction to `accountingTransactions` array
- Update `vehicleCashBalances[vehicleId] -= totalAmount`
- Recalculate button amounts (should become 0 for paid months)

## Key Technical Implementation Notes

1. **Period String Matching**: Always use `periodStrings.includes(t.month)` for finding existing payments
2. **Atomic Updates**: All cash operations use `increment()` for thread safety
3. **Bulk Payments**: Create multiple transaction documents for quarterly/yearly selections
4. **Status Tracking**: Only `status === 'completed'` counts as paid
5. **Amount Deduction**: Button amount = MAX(0, calculated - paid) to prevent negative values

## Undo Process (Reverse Payment)
1. Find transaction(s) by vehicleId, type, periodStrings.includes(month), status === 'completed'
2. Update transaction status to 'reversed', add reversedAt timestamp
3. Increment cash balances by +originalAmount
4. Update local state: remove from accountingTransactions or mark as reversed

This flow ensures accurate profit distribution and payment tracking using only existing fields in the accountingTransactions collection.

### Document ID
- **Auto-generated** by Firestore using `addDoc()`
- Stored in the `id` field of the local state object

### Transaction Types by Button

| Button | Transaction Type | Amount Source |
|--------|------------------|---------------|
| GST Payment | `'gst_payment'` | `vehicleInfo.gstAmount` |
| Service Charge | `'service_charge'` | `vehicleInfo.serviceCharge` |
| Partner Payment | `'partner_payment'` | `vehicleInfo.partnerShare` |
| Owner Payment | `'owner_payment'` | `vehicleInfo.ownerPayment` |

## How Documents Are Added

### Firestore Operation
```javascript
const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);

const docRef = await addDoc(transactionRef, {
  vehicleId: vehicleInfo.vehicle.id,
  type: 'gst_payment', // varies by button
  amount: paymentAmount,
  month: monthStr, // period string
  description: paymentDescription,
  status: 'completed',
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString()
});
```

### Local State Update
```javascript
const newTransaction = {
  id: docRef.id, // Firestore auto-generated ID
  vehicleId: vehicleInfo.vehicle.id,
  type: 'gst_payment',
  amount: paymentAmount,
  month: monthStr,
  description: paymentDescription,
  status: 'completed',
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString()
};

setAccountingTransactions([...accountingTransactions, newTransaction]);
```

## Database Operations Per Button

Each button performs **exactly 3 database operations**:

### 1. accountingTransactions Collection
- **Path**: `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/accountingTransactions`
- **Operation**: Creates **1 new document** with transaction details
- **Fields**: vehicleId, type, amount, month, description, status, createdAt, completedAt

### 2. cashInHand Subcollection
- **Path**: `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/cashInHand/{vehicleId}`
- **Operation**: Updates **1 document** (vehicle-specific cash balance)
- **Update**: `balance` field using `increment(-amount)` (decreases cash)

### 3. companyCashInHand Collection
- **Path**: `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/companyCashInHand/main`
- **Operation**: Updates **1 document** (company-wide cash balance)
- **Update**: `balance` field using `increment(-amount)` and `lastUpdated` timestamp

## Total Impact Summary

### Individual Button Impact
- **3 collections** updated per button
- **3 documents** modified per button
- All operations are **cash outflows** (negative amounts)

### Combined Impact (All 4 Buttons)
- **3 collections** total (same for all buttons)
- **12 documents** updated across all buttons
- **12 database operations** total

## Undo Operations Required

For proper undo functionality, each payment must be reversed by:

### 1. Update Transaction Status
- Change `status` from `'completed'` to `'reversed'`
- Add `reversedAt` timestamp

### 2. Reverse Cash Balance Updates
- **cashInHand**: `increment(+originalAmount)` (add back the deducted amount)
- **companyCashInHand**: `increment(+originalAmount)` (add back the deducted amount)

### 3. Update Local State
- Update `accountingTransactions` array
- Update `vehicleCashBalances` state

## Key Technical Notes

- All operations use Firestore `increment()` for atomic updates
- Period strings must match between creation and lookup for undo to work
- Bulk payments create multiple transaction documents (one per month)
- Local state synchronization is critical for UI consistency

## Period String Logic

For undo to work correctly, period strings must be consistent:

- **Monthly**: `YYYY-MM` (e.g., "2025-01")
- **Quarterly**: `YYYY-Q#` (e.g., "2025-Q1")
- **Yearly**: `YYYY` (e.g., "2025")

The undo function uses `periodStrings.includes(t.month)` for matching, so all transaction creation must follow the same format.

## Bulk Payment Considerations

For quarterly/yearly periods with month selection:
- Multiple transactions created (one per selected month)
- Each transaction gets its own period string
- Undo must handle multiple transactions
- Cash amounts are divided by months in period

## Undo Implementation Code Template

If you forget the process, here's the exact code structure needed for undo functionality:

### Undo Function Signature
```typescript
const handleUndoPayment = async (vehicleInfo: any, paymentType: PaymentType) => {
  // 1. Get period strings for matching
  const periodData = getPeriodData(vehicleInfo.vehicle.id);
  const periodStrings = periodData.periodStrings;

  // 2. Find transaction(s) to reverse
  const transactionsToReverse = accountingTransactions.filter(t => 
    t.vehicleId === vehicleInfo.vehicle.id && 
    t.type === paymentType && 
    periodStrings.includes(t.month) &&
    t.status === 'completed'
  );

  if (transactionsToReverse.length === 0) {
    throw new Error('Transaction not found');
  }

  // 3. Reverse each transaction
  for (const transaction of transactionsToReverse) {
    // Update Firestore transaction status
    const transactionRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`, transaction.id);
    await updateDoc(transactionRef, {
      status: 'reversed',
      reversedAt: new Date().toISOString()
    });

    // Reverse cash balances
    const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
    await setDoc(cashRef, {
      balance: increment(transaction.amount) // Add back the amount
    }, { merge: true });

    const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
    await setDoc(companyCashRef, {
      balance: increment(transaction.amount), // Add back the amount
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  }

  // 4. Update local state
  setAccountingTransactions(prev => prev.map(t => {
    if (transactionsToReverse.some(tr => tr.id === t.id)) {
      return { ...t, status: 'reversed' as const, reversedAt: new Date().toISOString() };
    }
    return t;
  }));

  setVehicleCashBalances(prev => ({
    ...prev,
    [vehicleInfo.vehicle.id]: (prev[vehicleInfo.vehicle.id] || 0) + totalReversedAmount
  }));
};
```

### Key Points to Remember:
1. **Filter transactions** using `periodStrings.includes(t.month)` for proper matching
2. **Loop through multiple transactions** for bulk payments
3. **Use increment(+amount)** to reverse the cash deductions
4. **Update status to 'reversed'** and add `reversedAt` timestamp
5. **Calculate total reversed amount** for local state updates

## Memory Recovery Checklist

If you forget the process, ask yourself:

1. **What collections are updated?** 
   - accountingTransactions (create document)
   - cashInHand (update balance) 
   - companyCashInHand (update balance)

2. **What needs to be reversed?**
   - Transaction status: 'completed' → 'reversed'
   - Cash balances: increment(+amount) to add money back
   - Local state: update arrays and balances

3. **How to find transactions to reverse?**
   - Match vehicleId, type, periodStrings.includes(month), status === 'completed'

4. **What fields are in accountingTransactions documents?**
   - vehicleId, type, amount, month, description, status, createdAt, completedAt, reversedAt

5. **What are the period string formats?**
   - Monthly: "2025-01", Quarterly: "2025-Q1", Yearly: "2025"

This documentation contains everything needed to implement undo functionality from scratch.

## Section 4: Bulk Payment Actions - Multi-Vehicle Payment Processing

### Overview
Section 4 implements bulk payment functionality that allows processing multiple vehicles simultaneously for GST, Service Charge, Partner Share, Owner Payment, Rent Collection, and EMI payments. Unlike Section 5 (individual vehicle payments), Section 4 aggregates calculations across all vehicles and provides batch processing capabilities.

### Core Data Structures

#### Actually Payable Calculations
The `calculateActuallyPayable()` function aggregates unpaid amounts across all vehicles:

```typescript
const actuallyPayable = {
  gstActuallyPayable: vehicles.filter(v => v.gstAmount > 0 && !v.gstPaid).reduce((sum, v) => sum + v.gstAmount, 0),
  serviceChargeActuallyPayable: vehicles.filter(v => v.serviceCharge > 0 && v.vehicle.isPartnership === true && !v.serviceChargeCollected).reduce((sum, v) => sum + v.serviceCharge, 0),
  partnerShareActuallyPayable: vehicles.filter(v => v.partnerShare > 0 && v.vehicle.isPartnership === true && !v.partnerPaid).reduce((sum, v) => sum + v.partnerShare, 0),
  ownerPaymentActuallyPayable: vehicles.filter(v => v.ownerPayment > 0 && !v.ownerPaid).reduce((sum, v) => sum + v.ownerPayment, 0),
  rentActuallyPayable: rentCollectionOverview.vehicles.reduce((sum, v) => sum + v.rentStatus.totalDue, 0),
  emiActuallyPayable: vehicles.filter(v => hasOverdueEMI(v)).reduce((sum, v) => sum + calculateOverdueEMIAmount(v), 0)
};
```

#### Paid Amounts (for display)
```typescript
const paidAmounts = {
  gstPaid: totalGST - actuallyPayable.gstActuallyPayable,
  serviceChargePaid: totalServiceCharge - actuallyPayable.serviceChargeActuallyPayable,
  partnerSharePaid: totalPartnerShare - actuallyPayable.partnerShareActuallyPayable,
  ownerPaymentPaid: totalOwnerPayment - actuallyPayable.ownerPaymentActuallyPayable,
  rentPaid: totalRent - actuallyPayable.rentActuallyPayable,
  emiPaid: totalEMI - actuallyPayable.emiActuallyPayable
};
```

### Button Enable/Disable Logic

#### Visibility Rules
- **Non-partner users**: See all bulk payment buttons
- **Partner users**: Cannot see any bulk payment buttons (restricted access)

#### Enable Conditions
```typescript
// GST Button
actuallyPayable.gstActuallyPayable > 0 && userInfo.role !== 'partner'

// Service Charge Button  
actuallyPayable.serviceChargeActuallyPayable > 0 && userInfo.role !== 'partner'

// Partner Share Button
actuallyPayable.partnerShareActuallyPayable > 0 && userInfo.role !== 'partner'

// Owner Payment Button
actuallyPayable.ownerPaymentActuallyPayable > 0 && userInfo.role !== 'partner'

// Rent Collection Button
actuallyPayable.rentActuallyPayable > 0 && userInfo.role !== 'partner'

// EMI Button
actuallyPayable.emiActuallyPayable > 0 && userInfo.role !== 'partner'
```

### Bulk Payment Dialog Flow

#### 1. Dialog Opening (`openBulkPaymentDialog`)
Each payment type opens a specialized dialog with vehicle-specific filtering:

**GST Dialog**:
```typescript
items = periodData
  .filter(vehicle => vehicle.gstAmount > 0 && !vehicle.gstPaid)
  .map(vehicle => ({
    vehicleId: vehicle.vehicle.id,
    vehicleName: vehicle.vehicle.registrationNumber,
    amount: vehicle.gstAmount,
    monthBreakdown: getGSTBreakdown(vehicle),
    checked: true
  }));
```

**Service Charge Dialog**:
```typescript
items = periodData
  .filter(vehicle => vehicle.serviceCharge > 0 && vehicle.vehicle.isPartnership === true && !vehicle.serviceChargeCollected)
  .map(vehicle => ({
    vehicleId: vehicle.vehicle.id,
    vehicleName: vehicle.vehicle.registrationNumber,
    amount: vehicle.serviceCharge,
    monthBreakdown: getServiceChargeBreakdown(vehicle),
    checked: true
  }));
```

**Partner Share Dialog**:
```typescript
items = periodData
  .filter(vehicle => vehicle.partnerShare > 0 && vehicle.vehicle.isPartnership === true && !vehicle.partnerPaid)
  .map(vehicle => ({
    vehicleId: vehicle.vehicle.id,
    vehicleName: vehicle.vehicle.registrationNumber,
    amount: vehicle.partnerShare,
    monthBreakdown: getPartnerShareBreakdown(vehicle),
    checked: true
  }));
```

**Owner Payment Dialog**:
```typescript
items = periodData
  .filter(vehicle => vehicle.ownerPayment > 0 && !vehicle.ownerPaid)
  .map(vehicle => ({
    vehicleId: vehicle.vehicle.id,
    vehicleName: vehicle.vehicle.registrationNumber,
    amount: vehicle.ownerPayment,
    monthBreakdown: getOwnerShareBreakdown(vehicle),
    checked: true
  }));
```

**Rent Collection Dialog**:
```typescript
items = rentCollectionOverview.vehicles.map(({ vehicle, rentStatus, overdueWeeks }) => ({
  vehicleId: vehicle.id,
  vehicleName: vehicle.registrationNumber,
  amount: rentStatus.totalDue,
  overdueWeeks: overdueWeeks.map(week => ({
    weekIndex: week.weekIndex,
    weekStartDate: week.weekStartDate.toISOString(),
    rentAmount: week.amount
  })),
  checked: true
}));
```

**EMI Dialog**:
```typescript
items = periodData
  .filter(vehicle => {
    if (!vehicle.vehicle.loanDetails?.amortizationSchedule) return false;
    return vehicle.vehicle.loanDetails.amortizationSchedule.some(schedule => {
      const dueDate = new Date(schedule.dueDate);
      const now = new Date();
      return !schedule.isPaid && dueDate <= now;
    });
  })
  .map(vehicle => {
    const overdueEmisWithIndex = vehicle.vehicle.loanDetails.amortizationSchedule
      .map((schedule: any, index: number) => ({ schedule, index }))
      .filter(({ schedule }) => {
        const dueDate = new Date(schedule.dueDate);
        const now = new Date();
        return !schedule.isPaid && dueDate <= now;
      });

    const totalOverdueAmount = overdueEmisWithIndex.length * (vehicle.vehicle.loanDetails.emiPerMonth || 0);

    return {
      vehicleId: vehicle.vehicle.id,
      vehicleName: vehicle.vehicle.registrationNumber,
      amount: totalOverdueAmount,
      overdueEMIs: overdueEmisWithIndex.map(({ schedule, index }) => ({
        monthIndex: index,
        emiAmount: vehicle.vehicle.loanDetails.emiPerMonth,
        dueDate: schedule.dueDate
      })),
      checked: true
    };
  });
```

#### 2. Dialog UI Features
- **Vehicle Selection**: Checkboxes allow deselection of vehicles
- **Amount Display**: Shows total amount per vehicle
- **Month Breakdown**: For quarterly/yearly periods, shows per-month amounts
- **EMI Penalties**: For EMI payments, allows penalty amount input per overdue EMI
- **Rent Details**: Shows overdue weeks with amounts for rent collection

#### 3. Confirmation Processing (`handleBulkPaymentConfirm`)

**Main Processing Loop**:
```typescript
for (const item of selectedItems) {
  const vehicleInfo = periodData.find((v: any) => v.vehicle.id === item.vehicleId);
  if (!vehicleInfo) continue;

  let itemTotal = item.amount;
  if (bulkDialogType === 'emi' && item.overdueEMIs && emiPenalties) {
    // Add penalties to EMI total
    item.overdueEMIs.forEach(emi => {
      const penalty = parseFloat(vehiclePenalties[emi.monthIndex] || '0') || 0;
      itemTotal += penalty;
    });
  }
  totalAmount += itemTotal;

  // Process payment based on type
  switch (bulkDialogType) {
    case 'gst': collectGstPaymentTransactions(vehicleInfo, item.selectedMonthIndices);
    case 'service_charge': collectServiceChargeTransactions(vehicleInfo, item.selectedMonthIndices);
    case 'partner_share': collectPartnerPaymentTransactions(vehicleInfo, item.selectedMonthIndices);
    case 'owner_payment': collectOwnerPaymentTransactions(vehicleInfo, item.selectedMonthIndices);
    case 'emi': handleBulkEmiPayment(vehicleInfo, item, emiPenalties);
    case 'rent': handleBulkRentCollection(vehicleInfo, item);
  }

  await new Promise(resolve => setTimeout(resolve, 100)); // Prevent Firestore overload
}
```

### Transaction Collection Functions

#### GST Payment Processing (`collectGstPaymentTransactions`)
```typescript
// Create transactions for each period month
for (let i = 0; i < periodStrings.length; i++) {
  const monthStr = periodStrings[i];
  const amount = selectedMonths ? 
    getGSTBreakdown(vehicleInfo).find(b => b.month === monthNames[monthIndex])?.amount || 0 :
    paymentAmount / periodStrings.length;

  const docRef = await addDoc(transactionRef, {
    vehicleId: vehicleInfo.vehicle.id,
    type: 'gst_payment',
    amount: amount,
    month: monthStr,
    description: `GST Payment for ${vehicleInfo.vehicle.registrationNumber} - ${periodLabel} ${selectedYear}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  });
}

// Update cash balances atomically
await setDoc(cashRef, { balance: increment(-paymentAmount) }, { merge: true });
await setDoc(companyCashRef, { balance: increment(-paymentAmount) }, { merge: true });
```

#### Service Charge Processing (`collectServiceChargeTransactions`)
- Similar structure to GST but with `type: 'service_charge'`
- Updates vehicle cash balance (deduct) and company cash balance (add)
- Uses `getServiceChargeBreakdown()` for month-wise calculations

#### Partner Share Processing (`collectPartnerPaymentTransactions`)
- Similar structure with `type: 'partner_payment'`
- Updates vehicle cash balance (deduct) and company cash balance (add)
- Uses `getPartnerShareBreakdown()` for calculations

#### Owner Payment Processing (`collectOwnerPaymentTransactions`)
- Similar structure with `type: 'owner_payment'`
- Updates vehicle cash balance (deduct) and company cash balance (add)
- Uses `getOwnerShareBreakdown()` for calculations

#### EMI Processing (`handleBulkEmiPayment`)
- Special handling for loan amortization schedules
- Marks individual EMIs as paid in vehicle document
- Updates cash balances
- Handles penalty amounts separately

#### Rent Processing (`handleBulkRentCollection`)
- Special handling for rent collection with overdue weeks
- Updates rent payment status in assignments
- Updates cash balances

### Cash Balance Updates

#### Atomic Operations Using Firestore `increment()`
```typescript
// Vehicle cash balance (always deduct for payments)
const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
await setDoc(cashRef, { balance: increment(-paymentAmount) }, { merge: true });

// Company cash balance (add for collections, deduct for payments)
const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
await setDoc(companyCashRef, { 
  balance: increment(paymentAmount), // + for collections, - for payments
  lastUpdated: new Date().toISOString()
}, { merge: true });
```

#### Local State Updates
```typescript
// Update local cash balances
setVehicleCashBalances(prev => ({
  ...prev,
  [vehicleInfo.vehicle.id]: (prev[vehicleInfo.vehicle.id] || 0) - paymentAmount
}));

// Add new transactions to state
setAccountingTransactions(prev => [...prev, ...allNewTransactions]);
```

### Error Handling & User Feedback

#### Success Notification
```typescript
toast({
  title: 'Bulk Payment Completed',
  description: `Successfully processed ${selectedItems.length} payments totaling ₹${totalAmount.toLocaleString()}`,
});
```

#### Error Handling
```typescript
try {
  // Payment processing
} catch (error) {
  toast({
    title: 'Bulk Payment Failed',
    description: 'Some payments may have failed. Please check individual vehicle cards.',
    variant: 'destructive'
  });
} finally {
  setIsBulkProcessing(false);
}
```

### Key Differences from Section 5

1. **Aggregation vs Individual**: Section 4 aggregates across vehicles, Section 5 processes individual vehicles
2. **Dialog Selection**: Section 4 allows vehicle deselection, Section 4 processes single vehicle
3. **Batch Processing**: Section 4 processes multiple vehicles in sequence with delays
4. **State Updates**: Section 4 updates state once with all transactions, Section 5 updates incrementally
5. **Button Logic**: Section 4 buttons based on aggregate actually payable amounts, Section 5 buttons based on individual vehicle status

### Month Breakdown Functions

#### `getGSTBreakdown(vehicleInfo)`
Calculates GST per month based on monthly profit × 0.04

#### `getServiceChargeBreakdown(vehicleInfo)`
Calculates service charge per month based on monthly profit × serviceChargeRate (for partner vehicles)

#### `getPartnerShareBreakdown(vehicleInfo)`
Calculates partner share per month: (monthly profit - GST - service charge) × partnerPercentage

#### `getOwnerShareBreakdown(vehicleInfo)`
Calculates owner payment per month: remaining profit after deductions

All breakdown functions filter payments and expenses by month ranges and calculate period-specific amounts.