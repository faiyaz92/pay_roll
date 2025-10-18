# Overdue Payment Settlement & Bulk Payment Implementation

## Overview
This document explains the comprehensive overdue rent management and bulk payment features implemented in both **RentTab** and **FinancialAccountsTab** components.

## Core Features

### 1. Overdue Week Tracking
Both tabs now automatically identify and track overdue rent weeks:
- **Overdue Definition**: Any week where `weekEndDate < today` and payment status is not 'paid'
- **Automatic Calculation**: Uses assignment start dates to determine actual week boundaries
- **Real-time Monitoring**: Overdue status updates automatically as dates progress

### 2. Oldest-First Payment Settlement Rule
**Enforced Payment Order**:
- Users **cannot** pay a newer week if older overdue weeks exist
- When attempting to pay any week while overdue weeks exist, a confirmation dialog appears
- Dialog **automatically redirects** the payment to the oldest unpaid week
- This ensures chronological payment order and prevents payment gaps

**User Experience Flow**:
1. User clicks on "Mark as Paid" for any week (e.g., Week 8)
2. If Week 5 is overdue, confirmation dialog appears
3. Dialog shows: "You must settle the oldest overdue week first: Week 5"
4. Clicking "Pay Oldest Week" processes Week 5 payment (not Week 8)
5. User can then proceed to Week 6, 7, and finally Week 8

### 3. Bulk "Pay All Overdue" Feature

#### RentTab Implementation
**Location**: "Total Due Now" summary card
**Button**: Appears only when `overdueWeeks.length > 0`
**Label**: "Pay All Overdue"

**Visual Design**:
```tsx
<Button
  size="sm"
  variant="outline"
  className="h-7 px-2 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
  onClick={() => handleMarkPaidClick(-1)} // Special flag
>
  Pay All Overdue
</Button>
```

#### FinancialAccountsTab Implementation
**Location**: Vehicle card rent collection section header
**Button**: Appears only when vehicle has overdue weeks
**Label**: "Pay All Overdue (count) - ₹amount"

**Visual Design**:
```tsx
<Button
  size="sm"
  variant="destructive"
  className="h-6 px-2 text-xs"
  onClick={() => handlePayAllOverdueClick(assignment, overdueWeeks)}
>
  Pay All Overdue ({overdueWeeks.length}) - ₹{totalOverdueAmount.toLocaleString()}
</Button>
```

**Sequential Processing**:
- All overdue weeks are paid in chronological order (oldest to newest)
- 300ms delay between each payment to prevent race conditions
- Database updates happen sequentially for data integrity
- Toast notification appears after all payments complete

## Technical Implementation

### Data Structures

#### Overdue Week Object
```typescript
{
  weekIndex: number;        // 0-based index from assignment start
  weekStartDate: Date;      // Start date of the week
  amount: number;           // Weekly rent amount
}
```

#### Selected Rent Week State
```typescript
{
  weekIndex: number;        // -1 for bulk payment, else specific week
  assignment: any;          // Full assignment object
  weekStartDate: Date;      // Week start date for payment
  vehicleId: string;        // Vehicle identifier
  isBulkPayment?: boolean;  // Flag to distinguish bulk vs single
  overdueWeeks?: any[];     // Array of all overdue weeks (for bulk)
}
```

### Key Functions

#### 1. `getVehicleOverdueWeeks(vehicleId, assignment)`
**Purpose**: Calculate all overdue weeks for a vehicle
**Returns**: Array of overdue week objects sorted by date (oldest first)
**Logic**:
- Iterates through all assignment weeks
- Checks if `weekEndDate < today` AND no payment exists
- Returns complete overdue week details

#### 2. `handleRentPaymentClick(weekIndex, assignment, weekStartDate)` (FinancialAccountsTab)
**Purpose**: Intercept payment clicks and enforce oldest-first rule
**Logic**:
```typescript
const overdueWeeks = getVehicleOverdueWeeks(vehicleId, assignment);

if (overdueWeeks.length > 0 && weekIndex !== overdueWeeks[0].weekIndex) {
  // Show confirmation dialog with oldest week
  setSelectedRentWeek({ ...overdueWeeks[0], isBulkPayment: false });
  setConfirmRentPaymentDialog(true);
} else {
  // Proceed with payment directly
  markRentCollected(weekIndex, assignment, weekStartDate);
}
```

#### 3. `handlePayAllOverdueClick(assignment, overdueWeeks)`
**Purpose**: Initiate bulk payment for all overdue weeks
**Logic**:
- Sets `weekIndex = -1` as special flag for bulk payment
- Stores all overdue weeks in state
- Opens confirmation dialog with full overdue list

#### 4. `confirmRentPayment()` (FinancialAccountsTab) / `confirmPayment()` (RentTab)
**Purpose**: Execute confirmed payment (single or bulk)
**Logic**:
```typescript
if (selectedRentWeek.isBulkPayment) {
  // Process all overdue weeks sequentially
  for (const overdueWeek of selectedRentWeek.overdueWeeks) {
    await markRentCollected(overdueWeek.weekIndex, assignment, overdueWeek.weekStartDate);
    await delay(300); // Prevent race conditions
  }
} else {
  // Process single oldest overdue week
  await markRentCollected(weekIndex, assignment, weekStartDate);
}
```

## UI Components

### Summary Cards (RentTab Only)
**6 Cards Displayed**:
1. **Weeks Collected** - Count of paid weeks (green)
2. **Total Collected** - Sum of all paid rent (green)
3. **Total Overdue** - Sum of unpaid past weeks (red/gray)
4. **Due Today** - Amount due in current week (yellow/gray)
5. **Total Due Now** - Overdue + Due Today with "Pay All" button (orange/gray)
6. **Weekly Rate** - Base rent amount (blue)

### Alert Banner (RentTab Only)
**Displays when**: `overdueWeeks.length > 0`
**Content**:
```tsx
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Overdue Rent Detected</AlertTitle>
  <AlertDescription>
    There are {overdueWeeks.length} overdue week(s). 
    Total overdue amount: ₹{totalOverdue.toLocaleString()}
  </AlertDescription>
</Alert>
```

### Confirmation Dialog
**Two Modes**:

#### Single Payment Mode (`isBulkPayment = false`)
- Shows oldest overdue week details
- Explains oldest-first settlement rule
- Button: "Pay Oldest Week"

#### Bulk Payment Mode (`isBulkPayment = true`)
- Lists ALL overdue weeks with dates and amounts
- Shows total overdue amount at bottom
- Button: "Pay All Overdue"

**Dialog Structure**:
```tsx
<AlertDialog>
  <AlertDialogHeader>
    <AlertDialogTitle>
      {isBulkPayment ? 'Confirm Bulk Overdue Payment' : 'Confirm Overdue Payment Settlement'}
    </AlertDialogTitle>
    <AlertDialogDescription>
      {/* Conditional content based on payment type */}
    </AlertDialogDescription>
  </AlertDialogHeader>
  <AlertDialogFooter>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <AlertDialogAction onClick={confirmPayment}>
      {isBulkPayment ? 'Pay All Overdue' : 'Pay Oldest Week'}
    </AlertDialogAction>
  </AlertDialogFooter>
</AlertDialog>
```

## Database Updates

### Payment Record Creation
Each payment creates a document in `payments` collection:
```typescript
{
  assignmentId: string;
  vehicleId: string;
  driverId: string;
  weekStart: string;           // ISO date
  weekNumber: number;          // Assignment week number (1-based)
  amountDue: number;
  amountPaid: number;
  paidAt: string;             // ISO timestamp
  collectionDate: string;     // ISO timestamp
  status: 'paid';
  companyId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Cash Balance Update
Each payment updates `cashInHand/{vehicleId}` document:
```typescript
await updateDoc(cashRef, {
  balance: increment(weeklyRent),  // Increases balance
  updatedAt: new Date().toISOString()
});
```

**Bulk Payment**: Sequential updates ensure accurate balance tracking

## Visual Status Indicators

### Week Box Colors
- 🟢 **Green** (`bg-green-100`): Paid week
- 🔴 **Red** (`bg-red-100`): Overdue week (unpaid past week)
- 🟡 **Yellow** (`bg-yellow-100`): Due now (current week, unpaid)
- 🔵 **Blue** (`bg-blue-100`): Upcoming within 5 weeks
- ⚪ **Gray** (`bg-gray-100`): Future weeks beyond 5 weeks

### Payment Button States
- **Enabled**: Current week or overdue weeks
- **Disabled**: Future weeks or already paid weeks
- **Processing**: Shows "Processing..." during payment

## Benefits

### For Users
✅ Clear visibility of overdue amounts
✅ Prevents accidental payment gaps
✅ One-click bulk payment for efficiency
✅ Automatic oldest-first enforcement
✅ Real-time balance updates

### For Business Logic
✅ Ensures chronological payment records
✅ Prevents data inconsistencies
✅ Maintains audit trail integrity
✅ Simplifies reconciliation

## Testing Scenarios

### Scenario 1: No Overdue Weeks
- User can click any current/past week
- Payment processes immediately
- No confirmation dialog appears

### Scenario 2: Single Overdue Week
- User clicks Week 8
- Dialog shows Week 5 is overdue
- Payment redirects to Week 5
- Week 8 remains unpaid until older weeks are settled

### Scenario 3: Multiple Overdue Weeks (Bulk Payment)
- User clicks "Pay All Overdue" button
- Dialog lists all overdue weeks (5, 6, 7)
- Total amount shown: ₹15,000
- Confirm processes all three sequentially
- Balance increases by ₹15,000 total

### Scenario 4: Clicking Oldest Overdue Week
- User clicks Week 5 (oldest overdue)
- Payment processes immediately
- No confirmation needed (following the rule)

## Implementation Files

### Modified Components
1. **RentTab.tsx** (Full-width dedicated rent management)
   - Summary cards with financial breakdown
   - Alert banner for overdue warnings
   - Confirmation dialog for payment settlement
   - "Pay All Overdue" button in Total Due Now card

2. **FinancialAccountsTab.tsx** (Compact multi-function dashboard)
   - Overdue calculation per vehicle
   - Confirmation dialog for rent payments
   - "Pay All Overdue" button in vehicle card header
   - Week box status indicators

### Shared Logic
- Both components use identical week calculation (assignment-based)
- Both enforce oldest-first settlement rule
- Both support bulk overdue payment
- Both update same database collections (payments, cashInHand)

## Future Enhancements (Potential)

1. **Email Notifications**: Alert when overdue weeks detected
2. **Penalty Calculation**: Automatic late fees after X days overdue
3. **Payment Plans**: Allow installment payments for large overdue amounts
4. **Export Reports**: Download overdue payment history
5. **Dashboard Widget**: Company-wide overdue summary card

---

**Implementation Date**: January 2025
**Version**: 1.0
**Status**: ✅ Complete and Production Ready
