import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, where, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestorePaths } from './useFirestorePaths';
import { Role, TenantCompanyType, FuelRecord, MaintenanceRecord, Vehicle, LoanDetails, Assignment } from '@/types/user';

// Fleet Rental Business Interfaces (based on BRD)

export interface DocumentUpload {
  id: string;
  name: string;
  url: string;
  type: 'license' | 'idCard' | 'photo' | 'additional';
  uploadedAt: string;
  size?: number;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  address: string;
  rentedVehicles: string[]; // Array of vehicle IDs rented by this driver
  totalWeeklyRent: number; // Total weekly rent for all vehicles
  joinDate: string;
  isActive: boolean;
  companyId: string;
  userType: string; // Required for Firestore query filtering
  
  // Document management with Cloudinary URLs
  documents: {
    drivingLicense: DocumentUpload | null;
    idCard: DocumentUpload | null;
    photo: DocumentUpload | null;
    additional: DocumentUpload[]; // Up to 2 additional documents (total 5)
  };
  
  // Legacy fields for backward compatibility (deprecated)
  drivingLicense?: {
    number: string;
    expiry: string;
    photoUrl: string;
  };
  idCard?: {
    number: string;
    photoUrl: string;
  };
  photoUrl?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface VehicleHistory {
  driverId: string;
  startDate: string;
  endDate: string | null;
  milesDriven: number;
  rentPaid: number;
}

export interface MaintenanceHistory {
  date: string;
  odometerAtMaintenance: number;
  description: string;
  expenseId: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  amount: number;
  description: string;
  billUrl: string;
  submittedBy: string; // Driver ID
  status: 'pending' | 'approved' | 'rejected';
  approvedAt: string | null;
  adjustmentWeeks: number; // Weeks to deduct from rent
  type: 'general' | 'maintenance';
  verifiedKm: number; // Owner-entered km from bill
  companyId: string;
  createdAt: string;
  updatedAt: string;
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
  collectionDate: string | null; // Actual date marked collected
  nextDueDate: string;
  daysLeft: number; // Calculated on load
  status: 'due' | 'paid' | 'overdue';
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerTaxiReport {
  vehicleId: string;
  earnings: number; // Rent - Expenses - EMI
  roi: number; // (Net Cash Profit + Residual Value) / Initial Cost * 100
  netCashRoi: number; // Net Cash Profit / Initial Cost * 100
  totalRent: number;
  totalExpenses: number;
  totalEMI: number;
  foreclosureBenefit: number;
}

export interface PerDriverReport {
  driverId: string;
  totalDues: number;
  taxis: string[];
}

export interface CompanyOverview {
  totalAssets: number; // Sum of residualValues + cashBalance
  totalLiabilities: number; // Sum of outstandingLoans + otherLiabilities
  equity: number; // Assets - Liabilities
  ownerInvestment: number;
  projectedLoanPayments: number;
  projectedIncome: number;
  projectedProfit: number;
  overallRoi: number;
  overallNetCashRoi: number;
}

export interface Report {
  id: string;
  month: string; // YYYY-MM format
  totalEarnings: number;
  perTaxi: PerTaxiReport[];
  perDriver: PerDriverReport[];
  maintenanceStats: {
    count: number;
    avgKmBetween: number;
  };
  companyOverview: CompanyOverview;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  maintenanceThreshold: number; // e.g., 10000 km
  fraudKmThreshold: number; // e.g., 500 km
  defaultBankRate: number; // e.g., 6% for foreclosure
  defaultDepreciationRate: number; // e.g., 0.5
  projectionHorizonMonths: number; // e.g., 12
  ownerInvestment: number;
  cashBalance: number;
  otherLiabilities: number;
  companyId: string;
  updatedAt: string;
}

export interface OdometerHistory {
  id: string;
  updatedBy: string;
  oldValue: number;
  newValue: number;
  updatedAt: string;
}

// Fleet Rental Business Hooks

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const paths = useFirestorePaths(userInfo?.companyId);

  useEffect(() => {
    console.log('useDrivers useEffect triggered');
    console.log('userInfo:', userInfo);
    console.log('companyId:', userInfo?.companyId);
    
    if (!userInfo?.companyId) {
      console.log('No companyId, setting loading to false');
      setLoading(false);
      return;
    }

    console.log('Setting up drivers listener');
    const driversRef = collection(firestore, paths.getUsersPath());
    console.log('Drivers collection path:', paths.getUsersPath());
    
    const q = query(driversRef, where('userType', '==', 'Driver'));
    console.log('Drivers query created without orderBy');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Drivers snapshot received, doc count:', snapshot.docs.length);
      const driversData = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log('Driver doc:', data);
        return data;
      }) as Driver[];
      console.log('Processed drivers data:', driversData);
      setDrivers(driversData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching drivers:', error);
      setLoading(false);
    });

    return () => {
      console.log('Unsubscribing from drivers listener');
      unsubscribe();
    };
  }, [userInfo?.companyId, paths]);

  const addDriver = async (driverData: Omit<Driver, 'id'>) => {
    console.log('addDriver function called');
    console.log('userInfo in addDriver:', userInfo);
    console.log('companyId in addDriver:', userInfo?.companyId);
    
    if (!userInfo?.companyId) {
      console.error('No company ID in addDriver');
      throw new Error('No company ID');
    }
    
    const driversRef = collection(firestore, paths.getUsersPath());
    console.log('addDriver collection path:', paths.getUsersPath());
    
    const now = new Date().toISOString();
    const dataToSave = { 
      ...driverData, 
      companyId: userInfo.companyId,
      createdAt: now,
      updatedAt: now
    };
    
    console.log('Data to save to Firestore:', dataToSave);
    
    const result = await addDoc(driversRef, dataToSave);
    console.log('Firestore addDoc result:', result);
    
    return result;
  };

  const updateDriver = async (driverId: string, driverData: Partial<Driver>) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const driverRef = doc(firestore, paths.getUsersPath(), driverId);
    return await updateDoc(driverRef, { 
      ...driverData, 
      updatedAt: new Date().toISOString() 
    });
  };

  const deleteDriver = async (driverId: string) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const driverRef = doc(firestore, paths.getUsersPath(), driverId);
    return await deleteDoc(driverRef);
  };

  return { drivers, loading, addDriver, updateDriver, deleteDriver };
};

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const paths = useFirestorePaths(userInfo?.companyId);

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const vehiclesRef = collection(firestore, paths.getVehiclesPath());
    const q = query(vehiclesRef, orderBy('registrationNumber'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehiclesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];
      setVehicles(vehiclesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching vehicles:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId, paths]);

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const vehiclesRef = collection(firestore, paths.getVehiclesPath());
    const now = new Date().toISOString();
    return await addDoc(vehiclesRef, { 
      ...vehicleData, 
      companyId: userInfo.companyId,
      createdAt: now,
      updatedAt: now
    });
  };

  const updateVehicle = async (vehicleId: string, vehicleData: Partial<Vehicle>) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const vehicleRef = doc(firestore, paths.getVehiclesPath(), vehicleId);
    return await updateDoc(vehicleRef, { 
      ...vehicleData, 
      updatedAt: new Date().toISOString() 
    });
  };

  const deleteVehicle = async (vehicleId: string) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const vehicleRef = doc(firestore, paths.getVehiclesPath(), vehicleId);
    return await deleteDoc(vehicleRef);
  };

  return { vehicles, loading, addVehicle, updateVehicle, deleteVehicle };
};

export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const paths = useFirestorePaths(userInfo?.companyId);

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const assignmentsRef = collection(firestore, paths.getAssignmentsPath());
    const q = query(assignmentsRef, orderBy('startDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assignmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
      setAssignments(assignmentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching assignments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId, paths]);

  const addAssignment = async (assignmentData: Omit<Assignment, 'id'>) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const assignmentsRef = collection(firestore, paths.getAssignmentsPath());
    const now = new Date().toISOString();
    
    // Auto-calculate weekly rent
    const weeklyRent = assignmentData.dailyRent * 7;
    
    return await addDoc(assignmentsRef, { 
      ...assignmentData, 
      weeklyRent,
      companyId: userInfo.companyId,
      createdAt: now,
      updatedAt: now
    });
  };

  const updateAssignment = async (assignmentId: string, assignmentData: Partial<Assignment>) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const assignmentRef = doc(firestore, paths.getAssignmentsPath(), assignmentId);
    
    // Recalculate weekly rent if daily rent is updated
    if (assignmentData.dailyRent) {
      assignmentData.weeklyRent = assignmentData.dailyRent * 7;
    }
    
    return await updateDoc(assignmentRef, { 
      ...assignmentData, 
      updatedAt: new Date().toISOString() 
    });
  };

  return { assignments, loading, addAssignment, updateAssignment };
};

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const paths = useFirestorePaths(userInfo?.companyId);

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const paymentsRef = collection(firestore, paths.getPaymentsPath());
    const q = query(paymentsRef, orderBy('nextDueDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Calculate days left on load
        const nextDueDate = new Date(data.nextDueDate);
        const today = new Date();
        const daysLeft = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: doc.id,
          ...data,
          daysLeft
        };
      }) as Payment[];
      setPayments(paymentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching payments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId, paths]);

  const markPaymentCollected = async (paymentId: string, amount: number) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const paymentRef = doc(firestore, paths.getPaymentsPath(), paymentId);
    const now = new Date().toISOString();
    
    return await updateDoc(paymentRef, {
      status: 'paid',
      amountPaid: amount,
      paidAt: now,
      collectionDate: now,
      updatedAt: now
    });
  };

  return { payments, loading, markPaymentCollected };
};

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const paths = useFirestorePaths(userInfo?.companyId);

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const expensesRef = collection(firestore, paths.getExpensesPath());
    const q = query(expensesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      setExpenses(expensesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId, paths]);

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const expensesRef = collection(firestore, paths.getExpensesPath());
    const now = new Date().toISOString();
    
    return await addDoc(expensesRef, { 
      ...expenseData, 
      companyId: userInfo.companyId,
      createdAt: now,
      updatedAt: now
    });
  };

  const updateExpense = async (expenseId: string, expenseData: Partial<Expense>) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const expenseRef = doc(firestore, paths.getExpensesPath(), expenseId);
    
    return await updateDoc(expenseRef, { 
      ...expenseData, 
      updatedAt: new Date().toISOString() 
    });
    const deleteVehicle = async (vehicleId: string) => {
      if (!userInfo?.companyId) throw new Error('No company ID');
      const vehicleRef = doc(firestore, paths.getVehiclesPath(), vehicleId);
      return await deleteDoc(vehicleRef);
    };
  };

  return { expenses, loading, addExpense, updateExpense };
};

// Dashboard statistics for Fleet Rental Business
export const useDashboardStats = () => {
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();
  const { assignments } = useAssignments();
  const { payments } = usePayments();

  const stats = {
    // Fleet statistics
    totalVehicles: vehicles.length,
    rentedVehicles: vehicles.filter(vehicle => vehicle.status === 'rented').length,
    availableVehicles: vehicles.filter(vehicle => vehicle.status === 'available').length,
    maintenanceVehicles: vehicles.filter(vehicle => vehicle.status === 'maintenance').length,
    
    // Driver statistics
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(driver => driver.isActive && driver.rentedVehicles.length > 0).length,
    
    // Assignment statistics
    activeAssignments: assignments.filter(assignment => assignment.status === 'active').length,
    
    // Payment statistics
    pendingPayments: payments.filter(payment => payment.status === 'due').length,
    overdue: payments.filter(payment => payment.status === 'overdue').length,
    
    // Financial overview
    totalWeeklyRent: assignments
      .filter(assignment => assignment.status === 'active')
      .reduce((sum, assignment) => sum + assignment.weeklyRent, 0),
      
    totalOutstandingRent: payments
      .filter(payment => payment.status === 'due' || payment.status === 'overdue')
      .reduce((sum, payment) => sum + payment.amountDue, 0),
      
    // Vehicle utilization
    utilizationRate: vehicles.length > 0 
      ? Math.round((vehicles.filter(v => v.status === 'rented').length / vehicles.length) * 100) 
      : 0,
  };

  return { stats, loading: false };
};

// Fuel Records Hook (if still needed for maintenance tracking)
export const useFuelRecords = () => {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const paths = useFirestorePaths(userInfo?.companyId);

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const fuelRecordsRef = collection(firestore, paths.getFuelRecordsPath());
    const q = query(fuelRecordsRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FuelRecord[];
      setFuelRecords(recordsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching fuel records:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId, paths]);

  const addFuelRecord = async (recordData: Omit<FuelRecord, 'id'>) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const recordsRef = collection(firestore, paths.getFuelRecordsPath());
    return await addDoc(recordsRef, { 
      ...recordData, 
      companyId: userInfo.companyId 
    });
  };

  return { fuelRecords, loading, addFuelRecord };
};

// Maintenance Records Hook
export const useMaintenanceRecords = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const paths = useFirestorePaths(userInfo?.companyId);

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const recordsRef = collection(firestore, paths.getMaintenanceRecordsPath());
    const q = query(recordsRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaintenanceRecord[];
      setMaintenanceRecords(recordsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching maintenance records:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId, paths]);

  const addMaintenanceRecord = async (recordData: Omit<MaintenanceRecord, 'id'>) => {
    if (!userInfo?.companyId) throw new Error('No company ID');
    const recordsRef = collection(firestore, paths.getMaintenanceRecordsPath());
    return await addDoc(recordsRef, { 
      ...recordData, 
      companyId: userInfo.companyId 
    });
  };

  return { maintenanceRecords, loading, addMaintenanceRecord };
};

// Hook for tenant companies (for multi-tenant support)
export const useTenantCompanies = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const companiesRef = collection(firestore, 'Easy2Solutions/companyDirectory/tenantCompanies');
    const q = query(companiesRef, where('companyType', '==', TenantCompanyType.CAR_RENTAL));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tenant companies:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { companies, loading };
};

// Enhanced Vehicle Financial Data Calculations
interface VehicleFinancialData {
  monthlyRent: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  totalEarnings: number;
  totalExpenses: number;
  currentROI: number;
  roiAmount: number; // ROI in actual amount
  totalEmiPaid: number; // Total EMI amount paid so far
  totalInvestmentWithPrepayments: number; // Initial investment + prepayments
  isInvestmentCovered: boolean; // Whether profit >= total investment
  grossProfitLoss: number; // Current value + profit - loan (what you get if sold)
  projectedYearlyProfit: number; // Projected profit for one year
  avgMonthlyProfit: number; // Average monthly profit for projections
  isCurrentlyRented: boolean;
  currentAssignment?: Assignment;
  outstandingLoan: number;
  nextEMIDue: string | null;
  daysUntilEMI: number;
}

const calculateVehicleFinancials = (
  vehicleId: string, 
  vehicle: Vehicle, 
  assignments: Assignment[], 
  payments: Payment[], 
  expenses: Expense[]
): VehicleFinancialData => {
  // Get current active assignment
  const currentAssignment = assignments.find(
    a => a.vehicleId === vehicleId && a.status === 'active'
  );

  // Calculate monthly rent from current assignment
  const monthlyRent = currentAssignment ? 
    (currentAssignment.weeklyRent * 52) / 12 : 0;

  // Calculate total earnings from all payments for this vehicle
  const vehiclePayments = payments.filter(p => p.vehicleId === vehicleId && p.status === 'paid');
  const totalEarnings = vehiclePayments.reduce((sum, p) => sum + p.amountPaid, 0) + 
    (vehicle.previousData?.rentEarnings || 0);

  // Calculate total expenses from expenses collection
  const vehicleExpenses = expenses.filter(e => e.vehicleId === vehicleId && e.status === 'approved');
  const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0) + 
    (vehicle.previousData?.expenses || 0);

  // Calculate monthly expenses (average from last 12 months or use recent data)
  const recentExpenses = vehicleExpenses.filter(e => {
    const expenseDate = new Date(e.createdAt);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return expenseDate >= threeMonthsAgo;
  });
  const monthlyExpenses = recentExpenses.length > 0 ? 
    recentExpenses.reduce((sum, e) => sum + e.amount, 0) / 3 : 
    totalExpenses / 12; // Average over year if no recent data

  // Calculate monthly profit
  const monthlyEMI = vehicle.loanDetails?.emiPerMonth || 0;
  const monthlyProfit = monthlyRent - monthlyExpenses - monthlyEMI;

  // Calculate ROI based on cash flows, not asset value
  // ROI should reflect actual returns from the business operation
  const totalInvestment = vehicle.initialInvestment + totalExpenses;
  
  // Calculate outstanding loan and next EMI due
  const paidInstallments = vehicle.loanDetails?.paidInstallments?.length || 0;
  const totalInstallments = vehicle.loanDetails?.totalInstallments || 0;
  const amortizationSchedule = vehicle.loanDetails?.amortizationSchedule || [];
  
  let outstandingLoan = 0;
  let nextEMIDue: string | null = null;
  let daysUntilEMI = 0;

  if (amortizationSchedule.length > 0) {
    const unpaidSchedules = amortizationSchedule.filter(s => !s.isPaid);
    if (unpaidSchedules.length > 0) {
      // Calculate outstanding loan from unpaid EMIs
      outstandingLoan = unpaidSchedules.reduce((sum, emi) => sum + (emi.principal || 0), 0);
      nextEMIDue = unpaidSchedules[0].dueDate;
      daysUntilEMI = Math.ceil((new Date(nextEMIDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }
  } else {
    // Fallback calculation if no amortization schedule
    outstandingLoan = (vehicle.loanDetails?.outstandingLoan || 0);
  }
  
  // Calculate total EMI paid so far
  const totalEmiPaid = amortizationSchedule
    .filter(emi => emi.isPaid)
    .reduce((sum, emi) => sum + (emi.interest || 0) + (emi.principal || 0), 0);
  
  // Calculate total investment including prepayments
  // Prepayments are typically recorded in the expenses or a separate field
  const prepaymentAmount = vehicleExpenses
    .filter(e => e.description.toLowerCase().includes('prepayment') || e.description.toLowerCase().includes('principal'))
    .reduce((sum, e) => sum + e.amount, 0);
  const totalInvestmentWithPrepayments = totalInvestment + prepaymentAmount;
  
  // Calculate ROI based on simple business logic as requested
  // ROI = (Total Earnings - Total Expenses - EMI Paid) vs (Initial Investment + Prepayments)
  const netCashFlow = totalEarnings - totalExpenses - totalEmiPaid;
  const currentValue = vehicle.residualValue || vehicle.initialInvestment || vehicle.initialCost;
  
  // Simple business ROI: Actual cash performance vs total investment
  const currentROI = totalInvestmentWithPrepayments > 0 ? (netCashFlow / totalInvestmentWithPrepayments) * 100 : 0;
  const roiAmount = netCashFlow; // ROI in actual amount (profit/loss)
  
  // Check if investment is covered (profit >= total investment)
  const isInvestmentCovered = netCashFlow >= totalInvestmentWithPrepayments;
  
  // Calculate gross profit/loss (what you get if you sell the taxi)
  const vehicleValue = vehicle.residualValue || vehicle.initialInvestment || vehicle.initialCost;
  const grossProfitLoss = vehicleValue + netCashFlow - outstandingLoan;
  
  // Calculate yearly projections
  const avgMonthlyProfit = monthlyProfit; // Current monthly profit calculation
  const projectedYearlyProfit = avgMonthlyProfit * 12; // Project for full year
  
  // Note: This ROI calculation shows actual cash returns from the business
  // If totalEarnings = 0, ROI will be negative showing the loss of invested capital

  return {
    monthlyRent,
    monthlyExpenses,
    monthlyProfit,
    totalEarnings,
    totalExpenses,
    currentROI,
    roiAmount,
    totalEmiPaid,
    totalInvestmentWithPrepayments,
    isInvestmentCovered,
    grossProfitLoss,
    projectedYearlyProfit,
    avgMonthlyProfit,
    isCurrentlyRented: !!currentAssignment,
    currentAssignment,
    outstandingLoan,
    nextEMIDue,
    daysUntilEMI
  };
};

// Main Firebase Data Hook - combines all hooks for easy access
export const useFirebaseData = () => {
  const { drivers, loading: driversLoading, addDriver } = useDrivers();
  const { vehicles, loading: vehiclesLoading, addVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const { assignments, loading: assignmentsLoading, addAssignment } = useAssignments();
  const { payments, loading: paymentsLoading, markPaymentCollected } = usePayments();
  const { expenses, loading: expensesLoading, addExpense } = useExpenses();

  const loading = driversLoading || vehiclesLoading || assignmentsLoading || paymentsLoading || expensesLoading;

  // Enhanced vehicle data with real financial calculations
  const getVehicleFinancialData = (vehicleId: string): VehicleFinancialData | null => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return null;
    
    return calculateVehicleFinancials(vehicleId, vehicle, assignments, payments, expenses);
  };

  // Enhanced vehicles with financial data
  const vehiclesWithFinancials = vehicles.map(vehicle => {
    const financialData = calculateVehicleFinancials(vehicle.id!, vehicle, assignments, payments, expenses);
    return {
      ...vehicle,
      financialData
    };
  });

  return {
    // Data
    drivers,
    vehicles,
    vehiclesWithFinancials, // Enhanced vehicles with real financial data
    assignments,
    payments,
    expenses,
    loading,
    
    // Helper Functions
    getVehicleFinancialData,
    
    // Actions
    addDriver,
    addVehicle,
    updateVehicle,
    addAssignment,
    addExpense,
    markPaymentCollected,
    deleteVehicle,
  };
};
