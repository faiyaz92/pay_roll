# Payment Collection Updates - Section 5 Buttons

## Overview
This document explains the database operations performed by the 4 payment buttons in Section 5 of the Financial Accounts Tab. Understanding these operations is crucial for implementing proper undo functionality.

## The 4 Payment Buttons

For **partner vehicles**, these 4 buttons are visible in Section 5:

1. **GST Payment** (`handleGstPayment`)
2. **Service Charge Collection** (`handleServiceChargeCollection`)
3. **Partner Payment** (`handlePartnerPayment`)
4. **Owner's Share Collection** (`handleOwnerShareCollection`)

## Firebase Document Structure - accountingTransactions Collection

### Collection Path
```
Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/accountingTransactions
```

### Document Structure
Each document in the `accountingTransactions` collection has the following fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `vehicleId` | `string` | ID of the vehicle this transaction belongs to | `"abc123"` |
| `type` | `string` | Type of payment transaction | `'gst_payment'`, `'service_charge'`, `'partner_payment'`, `'owner_share'`, `'owner_withdrawal'` |
| `amount` | `number` | Payment amount in rupees | `4500.00` |
| `month` | `string` | Period string for the transaction | `"2025-01"`, `"2025-Q1"`, `"2025"` |
| `description` | `string` | Human-readable description of the transaction | `"GST Payment for MH12AB1234 - January 2025"` |
| `status` | `string` | Transaction status | `'pending'`, `'completed'`, `'reversed'` |
| `createdAt` | `string` | ISO timestamp when transaction was created | `"2025-01-15T10:30:00.000Z"` |
| `completedAt` | `string` | ISO timestamp when transaction was completed | `"2025-01-15T10:30:00.000Z"` |
| `reversedAt` | `string` | ISO timestamp when transaction was reversed (for undo) | `"2025-01-15T11:00:00.000Z"` |

### Document ID
- **Auto-generated** by Firestore using `addDoc()`
- Stored in the `id` field of the local state object

### Transaction Types by Button

| Button | Transaction Type | Amount Source |
|--------|------------------|---------------|
| GST Payment | `'gst_payment'` | `vehicleInfo.gstAmount` |
| Service Charge | `'service_charge'` | `vehicleInfo.serviceCharge` |
| Partner Payment | `'partner_payment'` | `vehicleInfo.partnerShare` |
| Owner's Share | `'owner_share'` | `vehicleInfo.ownerShare` |
| Owner's Withdrawal | `'owner_withdrawal'` | `vehicleInfo.ownerFullShare` |

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