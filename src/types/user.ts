import { DocumentUpload } from "@/hooks/useFirebaseData";

export enum Role {
  COMPANY_ADMIN = 'company_admin'
  // Future roles can be added here as needed
}

export enum TenantCompanyType {
  CAR_RENTAL = 'Car Rental'
}

export interface UserInfo {
  userId: string;
  companyId?: string | null;
  name: string;
  email: string;
  userName: string;
  role: Role;
  mobileNumber?: string;
  address?: string;
  photoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Driver specific fields (for drivers managed by owner)
  drivingLicense?: {
    number: string;
    expiry: string;
    photoUrl: string;
  };
  idCard?: {
    number: string;
    photoUrl: string;
  };
  assignedTaxis?: string[]; // Array of vehicle IDs
  isActive?: boolean;
}

export interface TenantCompany {
  companyId: string;
  name: string;
  email: string;
  mobileNumber?: string;
  gstin?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address?: string;
  createdBy: string;
  createdAt: Date;
  companyType: TenantCompanyType;
  // Car rental specific fields
  fleetSize?: number;
  operatingLicense?: string;
  insuranceDetails?: string;
}

// Car Rental Specific Interfaces based on BRD
export interface LoanDetails {
  totalLoan: number;
  outstandingLoan: number;
  emiPerMonth: number;
  totalInstallments: number;
  interestRate: number;
  downPayment: number;
  loanAccountNumber: string;
  emiDueDate: number; // Day of month (1-31)
  paidInstallments: string[]; // Array of payment dates
  amortizationSchedule: {
    month: number;
    interest: number;
    principal: number;
    outstanding: number;
    dueDate: string;
    isPaid: boolean;
    paidAt?: string; // Timestamp when marked paid
    editableUntil?: string; // 3 days after payment for edit protection
  }[];
}

export interface Vehicle {

  insuranceExpiryDate: any;
  insuranceStartDate: any;
  insurancePolicyNumber: string;
  insuranceProvider: string;
  insurancePremium: any;
  insuranceDocuments?: Record<string, string>;
  id: string;
  vehicleName: string;
  registrationNumber: string; // Changed from licensePlate
  make: string;
  model: string;
  year: number;
  condition: 'new' | 'used' | 'new_in_operation';
  initialCost: number;
  residualValue: number;
  depreciationRate: number;
  initialInvestment: number;
  financingType: 'cash' | 'loan';
  odometer: number;
  status: 'available' | 'rented' | 'maintenance'; // Operational status
  financialStatus: 'cash' | 'loan_active' | 'loan_cleared'; // Financial/loan status
  assignedDriverId?: string;
  loanDetails: LoanDetails;
  previousData?: {
    expenses: number;
    emiPaid: number;
    rentEarnings: number;
  };
  expenses: string[]; // Expense IDs
  payments: string[]; // Payment IDs
  history: {
    driverId: string;
    startDate: Date;
    endDate: Date | null;
    milesDriven: number;
    rentPaid: number;
  }[];
  lastMaintenanceKm: number;
  needsMaintenance: boolean;
  maintenanceHistory: {
    date: Date;
    odometerAtMaintenance: number;
    description: string;
    expenseId: string;
  }[];
  averageDailyKm: number;
  createdAt: string;
  updatedAt: string;
  companyId: string;

  // Operation dates for historical tracking
  operationStartDate?: string;
  firstInstallmentDate?: string;
  lastPaidInstallmentDate?: string;

  // Current rental information (dynamic)
  currentRental?: {
    driverId: string;
    dailyRent: number;
    weeklyRent: number;
    startDate: string;
    collectionDay: number; // 0-6 (Sunday-Saturday)
  };

  // Real financial data
  monthlyEarnings: number; // Actual rent collected this month
  monthlyExpenses: number; // Actual expenses this month
  totalEarnings: number;   // Lifetime earnings
  totalExpenses: number;   // Lifetime expenses
  
  // Vehicle Images
  images?: {
    front?: string;
    back?: string;
    interior?: string;
    documents?: string;
  };
}

export interface Assignment {
  id: string;
  vehicleId: string;
  driverId: string;
  startDate: Date | string | any; // Allow Firebase Timestamp
  endDate: Date | string | any | null; // Allow Firebase Timestamp
  dailyRent: number;
  weeklyRent: number;
  collectionDay: number; // 0-6 (Sunday-Saturday)
  initialOdometer: number;
  status: 'active' | 'ended' | 'idle';
  // Add the missing fields that were causing type errors:
  securityDeposit: number;
  agreementDuration: number;
  driverAddress: string;
  emergencyContact: string;
  specialTerms?: string;
  // Optional fields for document management:
  documents?: {
    agreement?: string;
    vehicleHandover?: string;
    driverPhoto?: string;
    additional?: string; // JSON string of array
  };
  // System fields:
  createdAt?: Date | string | any;
  updatedAt?: Date | string | any;
  companyId: string;
}

export interface Payment {
  id: string;
  assignmentId: string;
  vehicleId: string;
  driverId: string;
  weekStart: string;
  amountDue: number;
  amountPaid: number;
  paidAt: string | null;
  collectionDate: string | null;
  nextDueDate: string;
  daysLeft: number;
  status: 'due' | 'paid' | 'overdue';
  // New hierarchical structure
  type: 'paid' | 'received';
  paymentType: 'rent' | 'security' | 'emi' | 'prepayment' | 'expenses';
  expenseType?: 'maintenance' | 'insurance' | 'fuel' | 'penalties' | 'general';
  companyId: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  amount: number;
  description: string;
  billUrl?: string;
  submittedBy: string; // Driver ID
  status: 'pending' | 'approved' | 'rejected';
  approvedAt: string | null;
  adjustmentWeeks?: number;
  // New hierarchical structure
  type: 'paid' | 'received';
  paymentType: 'rent' | 'security' | 'emi' | 'prepayment' | 'expenses';
  expenseType?: 'maintenance' | 'insurance' | 'fuel' | 'penalties' | 'general';
  verifiedKm?: number;
  companyId: string;
  createdAt: string;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  driverId: string;
  amount: number;
  quantity: number;
  pricePerLiter: number;
  fuelType: string;
  location: string;
  odometer: number;
  addedBy: string;
  addedAt: string;
  receiptUrl?: string;
  companyId: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'routine' | 'repair' | 'inspection' | 'other';
  description: string;
  amount: number;
  serviceProvider: string;
  odometer: number;
  nextServiceOdometer?: number;
  addedBy: string;
  addedAt: string;
  receiptUrl?: string;
  companyId: string;
}
