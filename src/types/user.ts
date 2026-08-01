// GCC Payroll System Roles - Must match Database-Info-v1.md Section 2
export enum Role {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  HR_MANAGER = 'hr_manager',
  EMPLOYEE = 'employee'
}

// GCC Payroll User Interface - Must match /users collection schema
export interface UserInfo {
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  role: Role;
  employeeId?: string; // Links to /employees collection
  companyId: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // GCC-specific fields
  preferredLanguage?: 'en' | 'ar';
  rtlEnabled?: boolean;
}

// GCC Payroll Employee Interface - Must match /employees collection schema
export interface EmployeeInfo {
  employeeId: string;
  userId: string;
  companyId: string;
  personal: {
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female';
    nationality: string;
    maritalStatus: 'single' | 'married' | 'divorced';
    dependents: number;
  };
  employment: {
    department: string;
    designation: string;
    grade: string;
    costCenter: string;
    officeId: string;
    contractType: 'limited' | 'unlimited';
    startDate: Date;
    probationEndDate?: Date;
    managerId?: string;
  };
  payroll: {
    basicSalary: number;
    hra: { amount: number; percentage: number };
    transportation: number;
    mobile: number;
    utilities: number;
    otherAllowances: Array<{ name: string; amount: number }>;
    overtimeRate: number;
    currency: 'AED' | 'SAR';
  };
  banking: {
    bankName: string;
    branch: string;
    iban: string;
    swiftCode: string;
    accountNumber: string;
    routingCode: string;
  };
  compliance: {
    emiratesId: string;
    passportNumber: string;
    passportExpiry: Date;
    visaStatus: string;
    labourCardNumber: string;
    gosiNumber: string;
  };
  gratuity: {
    eligibilityYears: number;
    startDate: Date;
    status: 'eligible' | 'not_eligible';
  };
  status: 'active' | 'inactive' | 'terminated';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// GCC Payroll Company Interface
export interface CompanyInfo {
  companyId: string;
  name: string;
  email: string;
  country: string;
  registrationNumber: string;
  taxId: string;
  establishedDate: Date;
  industry: string;
  employeeCount: number;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy Car Rental interfaces (keep for backward compatibility)
export enum TenantCompanyType {
  CAR_RENTAL = 'Car Rental'
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
  
  // Partnership Information
  isPartnership?: boolean;
  partnerId?: string;
  partnerPaymentAmount?: number;
  partnershipPercentage?: number;
  
  ownershipType?: 'owned' | 'partner'; // For accounting - owned by company or partner
  partnerShare?: number; // Partner share percentage (e.g., 50 for 50-50 partnership)
  serviceChargeRate?: number; // Service charge rate for partner taxis (default 10%)
  odometer: number;
  status: 'available' | 'rented' | 'maintenance' | 'inactive'; // Operational status
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
  previousOwnerName?: string;
  previousOwnerMobile?: string;

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
  partnerId?: string; // Added for partner filtering
  // Optional fields for document management:
  documents?: {
    agreement?: string;
    vehicleHandover?: string;
    driverPhoto?: string;
    additional?: string; // JSON string of array
  };
  // End assignment fields:
  endReason?: string; // Reason for ending assignment early
  endedBy?: string; // User ID who ended the assignment
  endedAt?: Date | string | any; // When assignment was ended
  finalOdometer?: number; // Odometer reading when assignment ended
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
  expenseType?: 'maintenance' | 'insurance' | 'fuel' | 'penalties' | 'general' | 'emi' | 'prepayment';
  partnerId?: string; // Added for partner filtering
  companyId: string;
  // Display properties (added when creating payment records)
  date?: string;
  description?: string;
  paymentMethod?: string;
  reference?: string;
  transactionId?: string;
  amount?: number; // For backward compatibility
  billUrl?: string; // Document URL for payment receipts
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
  partnerId?: string; // Added for partner filtering
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
