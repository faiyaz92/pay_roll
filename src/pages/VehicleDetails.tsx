import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseData, useAssignments } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestorePaths } from '@/hooks/useFirestorePaths';
import { collection, addDoc, updateDoc, doc, increment, getDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Import types
import { Vehicle, Assignment } from '@/types/user';

// Import components
import AddFuelRecordForm from '@/components/Forms/AddFuelRecordForm';
import AddInsuranceRecordForm from '@/components/Forms/AddInsuranceRecordForm';
import InsuranceDocumentUploader from '@/components/Forms/InsuranceDocumentUploader';

// Import tab components
import OverviewTab from '@/components/VehicleDetails/OverviewTab';
import FinancialTab from '@/components/VehicleDetails/FinancialTab';
import AnalyticsTab from '@/components/VehicleDetails/AnalyticsTab';
import { EMITab } from '@/components/VehicleDetails/EMITab';
import { RentTab } from '@/components/VehicleDetails/RentTab';
import { ExpensesTab } from '@/components/VehicleDetails/ExpensesTab';
import { PaymentsTab } from '@/components/VehicleDetails/PaymentsTab';
import { DocumentsTab } from '@/components/VehicleDetails/DocumentsTab';
import { AssignmentsTab } from '@/components/VehicleDetails/AssignmentsTab';
import AccountsTab from '@/components/VehicleDetails/AccountsTab';

// Define EMI schedule item type
type EMIScheduleItem = {
  month: number;
  interest: number;
  principal: number;
  outstanding: number;
  dueDate: string;
  isPaid: boolean;
  paidAt?: string;
  editableUntil?: string;
  prepaid?: boolean; // For prepayment tracking
};

// Define fuel record data type
type FuelRecordData = {
  vehicleId: string;
  amount: number;
  description: string;
  billUrl: string;
  submittedBy: string;
  status: 'approved';
  approvedAt: string;
  adjustmentWeeks: number;
  expenseType: 'fuel';
  type: 'fuel';
  verifiedKm: number;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  fuelType: string;
  quantity: number;
  pricePerLiter: number;
  odometerReading: number;
  station: string;
  isCorrection?: boolean;
  originalTransactionRef?: string | null;
};
import { 
  Car, 
  CreditCard, 
  Banknote,
  TrendingUp, 
  TrendingDown,
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  CircleDollarSign,
  Calculator,
  Settings,
  Plus,
  Fuel,
  History,
  Camera,
  Eye,
  FileText,
  ImageIcon,
  Shield,
  AlertTriangle,
  Download
} from 'lucide-react';

// Define InsuranceDocument type
type InsuranceDocument = {
  id: string;
  name: string;
  url: string;
  type: 'policy' | 'rc' | 'previous' | 'additional';
  uploadedAt: string;
  size: number;
  file?: File;
};

const VehicleDetails: React.FC = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { userInfo } = useAuth();
  const { vehicles, drivers, expenses, getVehicleFinancialData, updateVehicle, addExpense, loading, markPaymentCollected, payments: firebasePayments, assignments: allAssignments } = useFirebaseData();
  const paths = useFirestorePaths(userInfo?.companyId);
  const [prepaymentAmount, setPrepaymentAmount] = useState('');
  const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [addInsuranceDialogOpen, setAddInsuranceDialogOpen] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [selectedEMI, setSelectedEMI] = useState<{monthIndex: number, scheduleItem: EMIScheduleItem} | null>(null);
  const [prepaymentResults, setPrepaymentResults] = useState<{
    amount: number;
    newOutstanding: number;
    newTenure: number;
    tenureReduction: number;
    interestSavings: number;
  } | null>(null);
  const [showPrepaymentResults, setShowPrepaymentResults] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    type: 'fuel',
    // Proration fields for advance payments
    isAdvance: false,
    coverageStartDate: '',
    coverageEndDate: '',
    coverageMonths: 0
  });
  
  // Insurance-specific state for expense form
  const [insuranceExpenseData, setInsuranceExpenseData] = useState({
    driverId: '',
    insuranceType: 'fix_insurance' as 'fix_insurance' | 'rego' | 'green_slip' | 'pink_slip',
    policyNumber: '',
    vendor: '',
    startDate: '',
    endDate: '',
    receiptNumber: '',
    notes: '',
    isAdvance: false
  });

  // Insurance document upload state
  const [insuranceDocuments, setInsuranceDocuments] = useState<{
    policyCopy: any;
    rcCopy: any;
    previousYearPolicy: any;
    additional: any[];
  }>({
    policyCopy: null,
    rcCopy: null,
    previousYearPolicy: null,
    additional: [],
  });
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  // Proration calculation state
  const [prorationValues, setProrationValues] = useState({
    coverageMonths: 0,
    proratedMonthly: 0,
  });

  // Current month checkbox state
  const [useCurrentMonth, setUseCurrentMonth] = useState(false);

  // Calculate proration values when insurance dates or amount change
  React.useEffect(() => {
    if (insuranceExpenseData.isAdvance && insuranceExpenseData.startDate && insuranceExpenseData.endDate && newExpense.amount) {
      const start = new Date(insuranceExpenseData.startDate);
      const end = new Date(insuranceExpenseData.endDate);
      const amount = parseFloat(newExpense.amount || '0');
      
      if (amount > 0) {
        const months = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        const proratedMonthly = amount / months;
        
        setProrationValues({
          coverageMonths: months,
          proratedMonthly
        });
      }
    } else {
      setProrationValues({ coverageMonths: 0, proratedMonthly: 0 });
    }
  }, [insuranceExpenseData.startDate, insuranceExpenseData.endDate, insuranceExpenseData.isAdvance, newExpense.amount]);

  // Auto-set insurance dates for current month
  useEffect(() => {
    if (useCurrentMonth) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // First day of current month
      const firstDay = new Date(currentYear, currentMonth, 1);
      const firstDayString = firstDay.toISOString().split('T')[0];

      // Last day of current month
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const lastDayString = lastDay.toISOString().split('T')[0];

      setInsuranceExpenseData(prev => ({
        ...prev,
        startDate: firstDayString,
        endDate: lastDayString
      }));
    }
  }, [useCurrentMonth]);

  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentDateFilter, setPaymentDateFilter] = useState('');
  // New 3-level filtering states
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all'); // 'all' | 'paid' | 'received'
  const [paidSubTypeFilter, setPaidSubTypeFilter] = useState('all'); // 'all' | 'emi' | 'prepayment' | 'expenses'
  const [expenseSubTypeFilter, setExpenseSubTypeFilter] = useState('all'); // 'all' | 'maintenance' | 'insurance' | 'fuel' | 'penalties' | 'general'
  const [showEmiForm, setShowEmiForm] = useState(false);
  const [showRentForm, setShowRentForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showExpenseCorrectionForm, setShowExpenseCorrectionForm] = useState(false);
  const [selectedExpenseType, setSelectedExpenseType] = useState('fuel');
  const [isProcessingRentPayment, setIsProcessingRentPayment] = useState<number | null>(null);
  const [projectionYear, setProjectionYear] = useState(1); // Default to 1 year projection
  const [activeTab, setActiveTab] = useState('overview');

  const [assumedMonthlyRent, setAssumedMonthlyRent] = useState(''); // For assumption-based projections
  const [projectionMode, setProjectionMode] = useState<'current' | 'assumed'>('current'); // Current trends vs assumptions

  // Read URL parameters and set initial state
  useEffect(() => {
    const tab = searchParams.get('tab');
    const period = searchParams.get('period');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const quarter = searchParams.get('quarter');

    if (tab) {
      setActiveTab(tab);
    }

    if (period && tab === 'payments') {
      // Set PaymentsTab filters when navigating from FinancialAccountsTab
      if (period === 'monthly' && month) {
        setTransactionTypeFilter('paid');
        setPaidSubTypeFilter('expenses');
        setExpenseSubTypeFilter('all');
        setPaymentDateFilter(`${year}-${String(parseInt(month)).padStart(2, '0')}-01`);
      } else if (period === 'quarterly' && quarter) {
        // For quarterly, we can't easily filter by quarter in payments tab
        // Just set to show all expenses
        setTransactionTypeFilter('paid');
        setPaidSubTypeFilter('expenses');
        setExpenseSubTypeFilter('all');
        setPaymentDateFilter(''); // Clear date filter for quarterly
      } else if (period === 'yearly') {
        // For yearly, show all expenses without date filter
        setTransactionTypeFilter('paid');
        setPaidSubTypeFilter('expenses');
        setExpenseSubTypeFilter('all');
        setPaymentDateFilter(''); // Clear date filter for yearly
      }
    }
  }, [searchParams]);
  const [increasedEMI, setIncreasedEMI] = useState(''); // For increased EMI projections
  const [netCashFlowMode, setNetCashFlowMode] = useState(false); // Use net cash flow for EMI payoff

  // Find vehicle from the vehicles array
  const vehicle = vehicles.find(v => v.id === vehicleId);
  
  // Get real-time financial data
  const financialData = vehicle ? getVehicleFinancialData(vehicleId!) : null;

  // Filter expenses for this vehicle
  const vehicleExpenses = React.useMemo(() => 
    expenses.filter(e => e.vehicleId === vehicleId && e.status === 'approved'),
    [expenses, vehicleId]
  );

  // Calculate historical monthly net cash flow (average)
  const historicalMonthlyNetCashFlow = useMemo(() => {
    if (!financialData || !vehicle) return 0;
    
    // Calculate operational months
    const vehiclePayments = firebasePayments.filter(payment => 
      payment.vehicleId === vehicleId && payment.status === 'paid'
    );
    let operationalMonths = 1; // Minimum 1 month
    if (vehiclePayments.length > 0) {
      const earliestPaymentDate = vehiclePayments
        .map(p => new Date(p.paidAt || p.collectionDate || p.createdAt))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - earliestPaymentDate.getFullYear()) * 12 + 
                        (currentDate.getMonth() - earliestPaymentDate.getMonth());
      operationalMonths = Math.max(1, monthsDiff + 1); // +1 to include current month
    }
    
    return operationalMonths > 0 ? 
      (financialData.totalEarnings - financialData.totalExpenses) / operationalMonths : 0;
  }, [financialData, vehicle, firebasePayments, vehicleId]);

  // Helper function to get vehicle expense data
  const getVehicleExpenseData = () => {
    // Use the already filtered vehicleExpenses
    
    // Calculate totals by category using new hierarchical structure
    // For backward compatibility, also check old 'type' field
    const fuelExpenses = vehicleExpenses.filter(e => 
      (e.expenseType === 'fuel') || 
      e.description.toLowerCase().includes('fuel') ||
      e.description.toLowerCase().includes('petrol') ||
      e.description.toLowerCase().includes('diesel')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    const maintenanceExpenses = vehicleExpenses.filter(e => 
      (e.expenseType === 'maintenance') || 
      (e.type === 'maintenance') ||
      (e.expenseType as string) === 'repair' ||
      (e.expenseType as string) === 'service' ||
      e.description.toLowerCase().includes('maintenance') ||
      e.description.toLowerCase().includes('repair') ||
      e.description.toLowerCase().includes('service')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    const insuranceExpenses = vehicleExpenses.filter(e => 
      (e.expenseType === 'insurance') || 
      (e.type === 'insurance') ||
      e.description.toLowerCase().includes('insurance')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    const penaltyExpenses = vehicleExpenses.filter(e => 
      (e.expenseType === 'penalties') || 
      (e.type === 'penalties') ||
      (e.expenseType as string) === 'penalty' ||
      (e.expenseType as string) === 'fine' ||
      e.description.toLowerCase().includes('penalty') ||
      e.description.toLowerCase().includes('fine') ||
      e.description.toLowerCase().includes('late fee')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    const emiPayments = vehicleExpenses.filter(e => 
      (e.paymentType === 'emi') || 
      (e.type === 'emi') ||
      e.description.toLowerCase().includes('emi') ||
      e.description.toLowerCase().includes('installment')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    const prepayments = vehicleExpenses.filter(e => 
      (e.paymentType === 'prepayment') || 
      (e.type === 'prepayment') ||
      e.description.toLowerCase().includes('prepayment') ||
      e.description.toLowerCase().includes('principal')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate total expenses excluding prepayments
    const operationalExpenses = vehicleExpenses.filter(e => 
      !(e.paymentType === 'prepayment' || e.type === 'prepayment' ||
        e.description.toLowerCase().includes('prepayment') ||
        e.description.toLowerCase().includes('principal'))
    );
    
    const totalExpenses = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // All other operational expenses go into "Other Expenses"
    const categorizedExpenses = fuelExpenses + maintenanceExpenses + insuranceExpenses + 
                               penaltyExpenses + emiPayments;
    const otherExpenses = totalExpenses - categorizedExpenses;
    
    // Calculate monthly average (last 12 months) - exclude prepayments
    const currentDate = new Date();
    const lastYear = new Date(currentDate.getFullYear(), currentDate.getMonth() - 12, currentDate.getDate());
    const recentExpenses = vehicleExpenses.filter(e => new Date(e.createdAt) >= lastYear);
    const recentOperationalExpenses = recentExpenses.filter(e => 
      !(e.paymentType === 'prepayment' || e.type === 'prepayment' ||
        e.description.toLowerCase().includes('prepayment') ||
        e.description.toLowerCase().includes('principal'))
    );
    const monthlyAverage = recentOperationalExpenses.length > 0 ? recentOperationalExpenses.reduce((sum, e) => sum + e.amount, 0) / 12 : 0;
    
    // Get recent expenses (last 10)
    const recentExpensesList = vehicleExpenses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    return {
      totalExpenses,
      monthlyAverage,
      fuelExpenses,
      maintenanceExpenses,
      insuranceExpenses,
      penaltyExpenses,
      emiPayments,
      prepayments,
      otherExpenses,
      recentExpenses: recentExpensesList,
      expenseRatio: financialData?.totalEarnings ? (totalExpenses / financialData.totalEarnings) * 100 : 0,
      vehicleExpenses // Add the filtered vehicle expenses array
    };
  };
  
  // Get real expense data for this vehicle
  const expenseData = getVehicleExpenseData();

  // Helper function to get total investment (Initial + Prepayments + Total Expenses)
  const getTotalInvestment = () => {
    return (vehicle.initialInvestment || vehicle.initialCost || 0) + expenseData.prepayments + expenseData.totalExpenses;
  };

  // Helper function to get driver name
  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : driverId;
  };

  // Generate payment history data
  const generatePaymentHistory = () => {
    const payments = [];

    if (!vehicle || !financialData) return payments;

    // Add EMI payments from amortization schedule
    if (vehicle.loanDetails?.amortizationSchedule) {
      vehicle.loanDetails.amortizationSchedule.forEach((emi, index) => {
        if (emi.isPaid) {
          payments.push({
            date: emi.paidAt || emi.dueDate,
            type: 'paid',
            paymentType: 'emi',
            amount: emi.interest + emi.principal,
            description: `EMI Payment - Month ${index + 1}`,
            paymentMethod: 'Bank Transfer',
            status: 'completed',
            reference: `EMI${vehicleId?.slice(-4)}${String(index + 1).padStart(2, '0')}`
          });
        }
      });
    }

    // Add prepayments from vehicle data
    // Note: Currently using placeholder logic as prepayments structure needs to be defined
    // This section can be updated once prepayment data structure is established

    // Add rent collections from actual payments collection (not mock data)
    const vehicleRentPayments = firebasePayments.filter(payment => 
      payment.vehicleId === vehicleId && payment.status === 'paid'
    );
    
    vehicleRentPayments.forEach((payment) => {
      payments.push({
        date: payment.paidAt || payment.collectionDate || payment.createdAt,
        type: 'received',
        paymentType: 'rent',
        amount: payment.amountPaid,
        description: `Weekly rent collection - Week starting ${new Date(payment.weekStart).toLocaleDateString()}`,
        paymentMethod: 'Cash', // Default, can be updated based on actual data
        status: 'completed',
        reference: payment.id || `RENT${vehicleId?.slice(-4)}${String(payments.length + 1).padStart(2, '0')}`
      });
    });

    // Add expenses
    expenses.filter(e => e.vehicleId === vehicleId && e.status === 'approved').forEach((expense, index) => {
      // Check if this is a special payment type (prepayment, emi) that was recorded as expense
      let paymentType = 'expenses';
      let expenseType = 'general';

      if (expense.paymentType === 'prepayment' || expense.type === 'prepayment') {
        paymentType = 'prepayment';
        expenseType = 'prepayment';
      } else if (expense.paymentType === 'emi' || expense.type === 'emi') {
        paymentType = 'emi';
        expenseType = 'emi';
      } else {
        // Determine expense type based on description or type for regular expenses
        if (expense.description?.toLowerCase().includes('fuel')) {
          expenseType = 'fuel';
        } else if (expense.expenseType === 'fuel' || expense.type === 'fuel') {
          expenseType = 'fuel';
        } else if (expense.expenseType === 'maintenance' || expense.type === 'maintenance') {
          expenseType = 'maintenance';
        } else if (expense.expenseType === 'insurance' || expense.type === 'insurance') {
          expenseType = 'insurance';
        } else if (expense.expenseType === 'penalties' || expense.type === 'penalties') {
          expenseType = 'penalties';
        }
      }

      payments.push({
        date: expense.createdAt,
        type: 'paid',
        paymentType: paymentType,
        expenseType: expenseType,
        amount: expense.amount,
        description: expense.description,
        paymentMethod: 'Bank Transfer',
        status: 'completed',
        reference: expense.id || `EXP${vehicleId?.slice(-4)}${String(index + 1).padStart(2, '0')}`
      });
    });

    // Sort by date (newest first)
    return payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Get all payment history
  const allPayments = generatePaymentHistory();

  // Filter payments based on selected filters
  const filteredPayments = allPayments.filter(payment => {
    // 3-level filtering system using new hierarchical structure
    
    // Level 1: Transaction Type (Paid/Received)
    if (transactionTypeFilter !== 'all') {
      if (transactionTypeFilter === 'paid' && payment.type !== 'paid') {
        return false;
      }
      if (transactionTypeFilter === 'received' && payment.type !== 'received') {
        return false;
      }
    }
    
    // Level 2: Payment Sub-Type
    if (paidSubTypeFilter !== 'all') {
      // Check both paymentType and expenseType for backward compatibility
      const matchesPaymentType = payment.paymentType === paidSubTypeFilter;
      const matchesExpenseType = payment.expenseType === paidSubTypeFilter;
      if (!matchesPaymentType && !matchesExpenseType) {
        return false;
      }
    }
    
    // Level 3: Expense Sub-Type (only for expenses)
    if (paidSubTypeFilter === 'expenses' && expenseSubTypeFilter !== 'all') {
      if (payment.expenseType !== expenseSubTypeFilter) {
        return false;
      }
    }

    // Legacy single-level filter (keep for backward compatibility)
    if (paymentFilter !== 'all') {
      // Map legacy filters to new structure
      if (paymentFilter === 'emi' && !(payment.type === 'paid' && payment.paymentType === 'emi')) {
        return false;
      }
      if (paymentFilter === 'prepayment' && !(payment.type === 'paid' && payment.paymentType === 'prepayment')) {
        return false;
      }
      if (paymentFilter === 'rent' && !(payment.type === 'received' && payment.paymentType === 'rent')) {
        return false;
      }
      if (paymentFilter === 'expense' && !(payment.type === 'paid' && payment.paymentType === 'expenses')) {
        return false;
      }
      if (paymentFilter === 'maintenance' && !(payment.type === 'paid' && payment.paymentType === 'expenses' && payment.expenseType === 'maintenance')) {
        return false;
      }
    }

    // Filter by date (month/year)
    if (paymentDateFilter) {
      const paymentDate = new Date(payment.date);
      const filterDate = new Date(paymentDateFilter);
      if (paymentDate.getFullYear() !== filterDate.getFullYear() || 
          paymentDate.getMonth() !== filterDate.getMonth()) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!vehicle || !financialData) {
    return <div className="flex justify-center items-center h-64">Vehicle not found</div>;
  }

  // Helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { color: 'bg-green-500', text: 'Available' },
      rented: { color: 'bg-blue-500', text: 'Rented' },
      maintenance: { color: 'bg-red-500', text: 'Maintenance' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getFinancialStatusBadge = (financialStatus: string) => {
    const statusConfig = {
      cash: { color: 'bg-emerald-500', text: 'Cash Purchase' },
      loan_active: { color: 'bg-yellow-500', text: 'Loan Active' },
      loan_cleared: { color: 'bg-purple-500', text: 'Loan Cleared' },
    };
    
    const config = statusConfig[financialStatus as keyof typeof statusConfig] || statusConfig.cash;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const calculateMonthlyProfit = () => {
    // Use real-time financial data
    return financialData.monthlyProfit;
  };

  const calculateROI = () => {
    // Use real-time financial data  
    return financialData.currentROI;
  };

  const getCurrentMonthlyRent = () => {
    // Return 0 if vehicle is not currently rented
    return financialData.isCurrentlyRented ? financialData.monthlyRent : 0;
  };

  const getCurrentAssignmentDetails = () => {
    if (!financialData.isCurrentlyRented || !financialData.currentAssignment) {
      return null;
    }
    
    const assignment = financialData.currentAssignment;
    return {
      weeklyRent: assignment.weeklyRent,
      dailyRent: assignment.dailyRent,
      startDate: assignment.startDate,
      collectionDay: assignment.collectionDay,
      driverId: assignment.driverId
    };
  };

  const handlePrepayment = () => {
    const amount = parseFloat(prepaymentAmount);
    const outstandingLoan = financialData.outstandingLoan;

    if (amount > 0 && amount <= outstandingLoan) {
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

      // Store results to display in card
      setPrepaymentResults({
        amount,
        newOutstanding,
        newTenure,
        tenureReduction,
        interestSavings
      });
      setShowPrepaymentResults(true);

    } else if (amount > outstandingLoan) {
      toast({
        title: 'Amount Exceeds Outstanding Loan',
        description: `Maximum prepayment amount is ₹${outstandingLoan.toLocaleString()}. This would clear the entire loan.`,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid prepayment amount greater than ₹0.',
        variant: 'destructive'
      });
    }
  };

  // Helper function to recalculate amortization schedule after prepayment
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

  const processPrepayment = async () => {
    if (!prepaymentResults) return;
    
    try {
      // Recalculate the amortization schedule with new outstanding amount
      const currentSchedule = vehicle.loanDetails?.amortizationSchedule || [];
      const newSchedule = recalculateAmortizationSchedule(
        currentSchedule,
        prepaymentResults.newOutstanding,
        vehicle.loanDetails?.emiPerMonth || 0,
        vehicle.loanDetails?.interestRate || 8.5
      );

      // Update vehicle in Firestore with new schedule and outstanding loan
      await updateVehicle(vehicleId!, {
        loanDetails: {
          ...vehicle.loanDetails!,
          amortizationSchedule: newSchedule,
          outstandingLoan: prepaymentResults.newOutstanding
        }
      });

      // Add prepayment record to expenses/payments collection
      await addExpense({
        vehicleId: vehicleId!,
        amount: prepaymentResults.amount,
        description: `Loan prepayment - Principal: ₹${prepaymentResults.amount.toLocaleString()}, Tenure reduced by ${prepaymentResults.tenureReduction} months`,
        billUrl: '',
        submittedBy: 'owner',
        status: 'approved' as const,
        approvedAt: new Date().toISOString(),
        adjustmentWeeks: 0,
        type: 'paid' as const,
        paymentType: 'prepayment' as const,
        verifiedKm: 0,
        companyId: '',
        createdAt: '',
        updatedAt: ''
      });

      toast({
        title: 'Prepayment Successful',
        description: `₹${prepaymentResults.amount.toLocaleString()} prepayment processed successfully. Outstanding reduced to ₹${prepaymentResults.newOutstanding.toLocaleString()}. Tenure reduced by ${prepaymentResults.tenureReduction} months.`,
      });

      // Reset form and close results
      setPrepaymentAmount('');
      setShowPrepaymentResults(false);
      setPrepaymentResults(null);

    } catch (error) {
      console.error('Error processing prepayment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process prepayment. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const markEMIPaid = async (monthIndex: number, scheduleItem: EMIScheduleItem) => {
    const currentDate = new Date();
    const dueDate = new Date(scheduleItem.dueDate);
    const daysPastDue = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(currentDate.getDate() + 3);
    
    // Check if payment is too early (more than 3 days before due date)
    const canEdit = dueDate <= threeDaysFromNow;
    
    if (!canEdit && daysPastDue < -3) {
      toast({
        title: 'Payment Too Early',
        description: `You can only mark EMI as paid starting 3 days before due date (${new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString()})`,
        variant: 'destructive'
      });
      return;
    }

    if (scheduleItem.isPaid) {
      toast({
        title: 'Already Paid',
        description: `EMI for month ${monthIndex + 1} has already been marked as paid.`,
        variant: 'destructive'
      });
      return;
    }

    // Check for overdue EMIs - always settle oldest first (like RentTab)
    const schedule = vehicle.loanDetails?.amortizationSchedule || [];
    const overdueEMIs = schedule
      .map((emi, index) => ({ emi, index }))
      .filter(({ emi }) => {
        if (emi.isPaid) return false;
        const emiDueDate = new Date(emi.dueDate);
        const daysDiff = Math.ceil((emiDueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff < 0; // Overdue
      })
      .sort((a, b) => {
        // Sort by due date (oldest first)
        return new Date(a.emi.dueDate).getTime() - new Date(b.emi.dueDate).getTime();
      });

    // If there are overdue EMIs and user is trying to pay a different one
    if (overdueEMIs.length > 0 && overdueEMIs[0].index !== monthIndex) {
      const oldestEMI = overdueEMIs[0];
      const oldestDueDate = new Date(oldestEMI.emi.dueDate);
      const oldestDaysPastDue = Math.ceil((currentDate.getTime() - oldestDueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      toast({
        title: 'Must Settle Oldest Overdue First',
        description: `You must pay the oldest overdue EMI first (EMI ${oldestEMI.emi.month} - ${oldestDaysPastDue} days overdue). Click on that EMI to proceed.`,
        variant: 'destructive'
      });
      return;
    }

    // Handle overdue payments with penalty option
    if (daysPastDue > 0) {
      // Set up penalty dialog
      setSelectedEMI({ monthIndex, scheduleItem });
      setPenaltyAmount('');
      setPenaltyDialogOpen(true);
    } else {
      // Regular on-time payment - update directly
      await processEMIPayment(monthIndex, scheduleItem, 0);
    }
  };

  const processEMIPayment = async (monthIndex: number, scheduleItem: EMIScheduleItem, penalty: number = 0, suppressToast: boolean = false) => {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle not found');
      }

      // Always use the latest snapshot to avoid overwriting earlier bulk updates
      let latestLoanDetails = vehicle.loanDetails;
      try {
        const vehiclesPath = paths.getVehiclesPath();
        if (vehiclesPath) {
          const vehicleRef = doc(firestore, vehiclesPath, vehicleId);
          const vehicleSnapshot = await getDoc(vehicleRef);
          if (vehicleSnapshot.exists()) {
            const latestData = vehicleSnapshot.data() as Vehicle;
            if (latestData.loanDetails) {
              latestLoanDetails = latestData.loanDetails;
            }
          }
        }
      } catch (refreshError) {
        console.warn('Unable to refresh vehicle data before EMI update:', refreshError);
      }

      if (!latestLoanDetails?.amortizationSchedule) {
        throw new Error('Loan schedule unavailable');
      }

      const paymentDate = new Date().toISOString().split('T')[0];
      const updatedSchedule = [...latestLoanDetails.amortizationSchedule];
      const targetEMI = updatedSchedule[monthIndex];

      if (!targetEMI) {
        throw new Error(`EMI at index ${monthIndex} not found`);
      }

      updatedSchedule[monthIndex] = {
        ...targetEMI,
        isPaid: true,
        paidAt: paymentDate
      };

      // Keep the passed schedule reference in sync for immediate UI feedback
      scheduleItem.isPaid = true;
      scheduleItem.paidAt = paymentDate;

      const updatedPaidInstallments = [...(latestLoanDetails.paidInstallments || [])];
      if (!updatedPaidInstallments.includes(paymentDate)) {
        updatedPaidInstallments.push(paymentDate);
      }

      await updateVehicle(vehicleId, {
        loanDetails: {
          ...latestLoanDetails,
          amortizationSchedule: updatedSchedule,
          paidInstallments: updatedPaidInstallments
        }
      });

      // Mutate local cache so subsequent bulk iterations work with the updated snapshot
      if (vehicle.loanDetails) {
        vehicle.loanDetails = {
          ...vehicle.loanDetails,
          amortizationSchedule: updatedSchedule,
          paidInstallments: updatedPaidInstallments
        };
      }

      const emiAmount = latestLoanDetails.emiPerMonth || 0;

      const expenseEntries: Array<{
        amount: number;
        description: string;
        type: 'paid' | 'general';
        paymentType?: 'emi';
      }> = [
        {
          amount: emiAmount,
          description: `EMI Payment - Month ${monthIndex + 1} (${new Date().toLocaleDateString()})`,
          type: 'paid' as const,
          paymentType: 'emi' as const
        }
      ];

      if (penalty > 0) {
        expenseEntries.push({
          amount: penalty,
          description: `EMI penalty for month ${monthIndex + 1} (${Math.ceil((new Date().getTime() - new Date(scheduleItem.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days late)`,
          type: 'general' as const,
          paymentType: undefined
        });
      }

      // Firestore write batching keeps the UI responsive during bulk processing
      await expenseEntries.reduce(
        (chain, entry) =>
          chain.then(() =>
            addExpense({
              vehicleId,
              amount: entry.amount,
              description: entry.description,
              billUrl: '',
              submittedBy: 'owner',
              status: 'approved' as const,
              approvedAt: new Date().toISOString(),
              adjustmentWeeks: 0,
              type: entry.type,
              paymentType: entry.paymentType,
              verifiedKm: 0,
              companyId: '',
              createdAt: '',
              updatedAt: ''
            })
          ),
        Promise.resolve()
      );

      const totalPaid = emiAmount + penalty;

      if (!suppressToast) {
        toast({
          title: penalty > 0 ? 'Overdue EMI Payment Recorded' : 'EMI Payment Recorded',
          description: penalty > 0
            ? `EMI for month ${monthIndex + 1} marked as paid:\n• EMI: ₹${emiAmount.toLocaleString()}\n• Penalty: ₹${penalty.toLocaleString()}\n• Total: ₹${totalPaid.toLocaleString()}`
            : `EMI for month ${monthIndex + 1} (₹${emiAmount.toLocaleString()}) has been marked as paid.`,
        });
      }

      setPenaltyDialogOpen(false);
      setSelectedEMI(null);
      setPenaltyAmount('');

    } catch (error) {
      console.error('Error updating EMI payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record EMI payment. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleAddExpense = async () => {
    try {
      const amount = parseFloat(newExpense.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid expense amount.',
          variant: 'destructive'
        });
        return;
      }

      if (!newExpense.description.trim()) {
        toast({
          title: 'Missing Description',
          description: 'Please provide a description for the expense.',
          variant: 'destructive'
        });
        return;
      }

      // Handle insurance expenses with full insurance data structure
      if (selectedExpenseType === 'insurance') {
        // Validate insurance-specific fields
        if (!insuranceExpenseData.policyNumber.trim()) {
          toast({
            title: 'Missing Policy Number',
            description: 'Please enter the insurance policy number.',
            variant: 'destructive'
          });
          return;
        }
        if (!insuranceExpenseData.vendor.trim()) {
          toast({
            title: 'Missing Insurance Provider',
            description: 'Please enter the insurance provider name.',
            variant: 'destructive'
          });
          return;
        }
        if (!insuranceExpenseData.startDate) {
          toast({
            title: 'Missing Start Date',
            description: 'Please enter the insurance start date.',
            variant: 'destructive'
          });
          return;
        }
        if (!insuranceExpenseData.endDate) {
          toast({
            title: 'Missing End Date',
            description: 'Please enter the insurance end date.',
            variant: 'destructive'
          });
          return;
        }

        setIsUploadingDocuments(true);

        // Upload insurance documents first
        let uploadedDocuments = {};
        try {
          // Upload documents to Cloudinary
          for (const [type, doc] of Object.entries(insuranceDocuments)) {
            if (type === 'additional') {
              // Handle additional documents array
              const additionalDocs = doc as InsuranceDocument[];
              for (const additionalDoc of additionalDocs) {
                if (additionalDoc && additionalDoc.file) {
                  const cloudinaryUrl = await uploadToCloudinary(additionalDoc.file);
                  uploadedDocuments[`additional_${additionalDoc.id}`] = cloudinaryUrl;
                }
              }
            } else {
              // Handle single document properties
              const singleDoc = doc as InsuranceDocument | null;
              if (singleDoc && singleDoc.file) {
                const cloudinaryUrl = await uploadToCloudinary(singleDoc.file);
                uploadedDocuments[type] = cloudinaryUrl;
              }
            }
          }
        } catch (error) {
          console.error('Failed to upload insurance documents:', error);
          toast({
            title: 'Document Upload Failed',
            description: 'Failed to upload insurance documents. Please try again.',
            variant: 'destructive'
          });
          setIsUploadingDocuments(false);
          return;
        }

        // Calculate proration for insurance if it's an advance payment
        let coverageMonths = 0;
        let proratedMonthly = 0;
        if (insuranceExpenseData.isAdvance) {
          const start = new Date(insuranceExpenseData.startDate);
          const end = new Date(insuranceExpenseData.endDate);
          coverageMonths = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
          proratedMonthly = amount / coverageMonths;
        }

        // Create insurance expense with full structure matching AddInsuranceRecordForm
        const insuranceExpenseDataFull: any = {
          vehicleId: vehicleId!,
          driverId: insuranceExpenseData.driverId || undefined,
          amount: amount,
          description: newExpense.description.trim(),
          billUrl: '',
          submittedBy: 'owner',
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          adjustmentWeeks: 0,
          expenseType: 'insurance',
          type: 'insurance',
          verifiedKm: 0,
          companyId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentType: 'expenses',
          vendor: insuranceExpenseData.vendor.trim(),
          receiptNumber: insuranceExpenseData.receiptNumber || '',
          notes: insuranceExpenseData.notes || '',
          insuranceDetails: {
            insuranceType: insuranceExpenseData.insuranceType,
            policyNumber: insuranceExpenseData.policyNumber.trim(),
            startDate: insuranceExpenseData.startDate,
            endDate: insuranceExpenseData.endDate,
          },
          isAdvance: insuranceExpenseData.isAdvance,
          coverageStartDate: insuranceExpenseData.isAdvance ? insuranceExpenseData.startDate : undefined,
          coverageEndDate: insuranceExpenseData.isAdvance ? insuranceExpenseData.endDate : undefined,
          coverageMonths: insuranceExpenseData.isAdvance ? coverageMonths : undefined,
          proratedMonthly: insuranceExpenseData.isAdvance ? proratedMonthly : undefined,
          // Include uploaded documents
          insuranceDocuments: Object.keys(uploadedDocuments).length > 0 ? uploadedDocuments : undefined,
        };

        await addExpense(insuranceExpenseDataFull);

        // Also update the vehicle record with insurance details (same as AddInsuranceRecordForm)
        const normalizedStartDate = insuranceExpenseData.startDate;
        const normalizedEndDate = insuranceExpenseData.endDate;

        const vehicleUpdateData: any = {
          insuranceExpiryDate: normalizedEndDate,
          insuranceStartDate: normalizedStartDate,
          insurancePolicyNumber: insuranceExpenseData.policyNumber.trim(),
          insuranceProvider: insuranceExpenseData.vendor.trim(),
          insurancePremium: amount,
        };

        // Only include insuranceDocuments if there are actual documents
        if (Object.keys(uploadedDocuments).length > 0) {
          vehicleUpdateData.insuranceDocuments = uploadedDocuments;
        }

        await updateVehicle(vehicleId!, vehicleUpdateData);

        toast({
          title: 'Insurance Expense Added',
          description: `Insurance expense of ₹${amount.toLocaleString()} has been recorded and vehicle insurance details updated.`,
        });

        // Reset insurance form and documents
        setInsuranceExpenseData({
          driverId: '',
          insuranceType: 'fix_insurance',
          policyNumber: '',
          vendor: '',
          startDate: '',
          endDate: '',
          receiptNumber: '',
          notes: '',
          isAdvance: false
        });
        setInsuranceDocuments({
          policyCopy: null,
          rcCopy: null,
          previousYearPolicy: null,
          additional: [],
        });
        setIsUploadingDocuments(false);
        setUseCurrentMonth(false);
      } else {
        // Handle non-insurance expenses (existing logic)
        // Build the expense object conditionally
        const expenseData: any = {
          vehicleId: vehicleId!,
          amount: amount,
          description: newExpense.description.trim(),
          billUrl: '',
          submittedBy: 'owner',
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          adjustmentWeeks: 0,
          expenseType: selectedExpenseType,
          type: selectedExpenseType as ('general' | 'maintenance' | 'insurance' | 'penalties' | 'fuel' | 'emi' | 'prepayment'),
          verifiedKm: 0,
          companyId: '',
          createdAt: '',
          updatedAt: '',
          paymentType: 'expenses',
          // Proration fields for advance payments
          isAdvance: newExpense.isAdvance
        };

        // Only include proration fields if it's an advance payment
        if (newExpense.isAdvance) {
          expenseData.coverageStartDate = newExpense.coverageStartDate;
          expenseData.coverageEndDate = newExpense.coverageEndDate;
          expenseData.coverageMonths = newExpense.coverageMonths;
          expenseData.proratedMonthly = amount / newExpense.coverageMonths;
        }

        await addExpense(expenseData);

        toast({
          title: 'Expense Added',
          description: `${selectedExpenseType} expense of ₹${amount.toLocaleString()} has been recorded.`,
        });
      }

      // Reset form and close dialog AFTER successful save
      setNewExpense({
        amount: '',
        description: '',
        type: 'fuel',
        // Reset proration fields
        isAdvance: false,
        coverageStartDate: '',
        coverageEndDate: '',
        coverageMonths: 0
      });
      setSelectedExpenseType('fuel');
      setShowExpenseForm(false);

    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add expense. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle fuel record addition (similar to FuelRecords page)
  const handleFuelRecordAdded = async (fuelRecordData: FuelRecordData) => {
    try {
      await addExpense(fuelRecordData);

      toast({
        title: "Success",
        description: fuelRecordData.isCorrection 
          ? "Fuel expense correction recorded successfully." 
          : "Fuel expense recorded successfully.",
      });

      // Reset form state and close dialog AFTER successful save
      setSelectedExpenseType('fuel');
      setShowExpenseForm(false);
    } catch (error) {
      console.error('Error recording fuel expense:', error);
      toast({
        title: "Error",
        description: "Failed to record fuel expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle insurance expense addition
  const handleAddInsuranceExpense = async (insuranceData: any) => {
    try {
      // The AddInsuranceRecordForm already handles all the logic including Firebase operations
      // We just need to close the dialog and reset the form
      setSelectedExpenseType('fuel');
      setShowExpenseForm(false);
    } catch (error) {
      console.error('Error in insurance expense callback:', error);
      toast({
        title: "Error",
        description: "Failed to process insurance expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInsuranceAdded = () => {
    // Refresh the vehicle data to show the new insurance record
    // The AddInsuranceRecordForm handles all the Firebase operations
    // We just need to trigger a re-render of the component
    window.location.reload();
  };

  const markRentCollected = async (weekIndex: number, assignment: Assignment, weekStartDate: Date) => {
    // Prevent double-click processing
    if (isProcessingRentPayment === weekIndex) return;
    
    try {
      setIsProcessingRentPayment(weekIndex);
      
      if (!assignment || !vehicle.assignedDriverId) {
        toast({
          title: 'Error',
          description: 'No active assignment found for this vehicle.',
          variant: 'destructive'
        });
        return;
      }

      // Get week start and end dates (already calculated and passed)
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);
      
      // Check if this rent payment already exists
      const existingPayment = firebasePayments.find(payment => {
        if (payment.vehicleId !== vehicleId || payment.status !== 'paid') return false;
        const paymentWeekStart = new Date(payment.weekStart);
        // More precise matching - check if payment week matches this assignment week
        return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
      });
      
      if (existingPayment) {
        toast({
          title: 'Already Collected',
          description: `Rent for week ${weekIndex + 1} has already been recorded on ${new Date(existingPayment.paidAt || existingPayment.createdAt).toLocaleDateString()}.`,
          variant: 'destructive'
        });
        return;
      }

      if (!userInfo?.companyId) {
        toast({
          title: 'Error',
          description: 'Company information not found.',
          variant: 'destructive'
        });
        return;
      }

      // Create payment record in Firebase payments collection
      const paymentData = {
        assignmentId: assignment.id || '',
        vehicleId: vehicleId!,
        driverId: vehicle.assignedDriverId,
        weekStart: weekStartDate.toISOString().split('T')[0],
        weekNumber: weekIndex + 1, // Week number within assignment
        amountDue: assignment.weeklyRent,
        amountPaid: assignment.weeklyRent,
        paidAt: new Date().toISOString(),
        collectionDate: new Date().toISOString(),
        nextDueDate: new Date(weekEndDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
        daysLeft: 7, // Will be recalculated on load
        status: 'paid' as const,
        companyId: userInfo.companyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add payment record directly to payments collection using correct path
      const paymentsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/payments`);
      await addDoc(paymentsRef, paymentData);

      // Update cash in hand - INCREASE when rent is collected
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await updateDoc(cashRef, {
        balance: increment(assignment.weeklyRent),
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Rent Collected Successfully! 🎉',
        description: `Weekly rent of ₹${assignment.weeklyRent.toLocaleString()} for assignment week ${weekIndex + 1} (${weekStartDate.toLocaleDateString('en-IN')}) has been recorded and will reflect in earnings immediately.`,
      });

    } catch (error) {
      console.error('Error recording rent payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record rent payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingRentPayment(null);
    }
  };

  // Assignment History Tab Component


  // Export Functions
  const exportToExcel = async () => {
    try {
      // Dynamic import to avoid bundle size issues
      const ExcelJS = await import('exceljs');

      const workbook = new ExcelJS.Workbook();

      // Vehicle Overview Sheet
      const overviewSheet = workbook.addWorksheet('Overview');
      overviewSheet.addRow(['Vehicle Details']);
      overviewSheet.addRow(['Vehicle Name', vehicle.vehicleName || `${vehicle.make} ${vehicle.model}`]);
      overviewSheet.addRow(['Registration Number', vehicle.registrationNumber]);
      overviewSheet.addRow(['Make', vehicle.make]);
      overviewSheet.addRow(['Model', vehicle.model]);
      overviewSheet.addRow(['Year', vehicle.year]);
      overviewSheet.addRow(['Status', vehicle.status]);
      overviewSheet.addRow(['Financial Status', vehicle.financialStatus || 'cash']);
      overviewSheet.addRow(['Odometer Reading', vehicle.odometer || 'N/A']);
      overviewSheet.addRow(['']);
      overviewSheet.addRow(['Current Assignment']);
      overviewSheet.addRow(['Assigned Driver', vehicle.assignedDriverId ? getDriverName(vehicle.assignedDriverId) : 'Not Assigned']);
      overviewSheet.addRow(['Current Status', financialData.isCurrentlyRented ? 'Rented' : 'Available']);
      overviewSheet.addRow(['Monthly Rent', financialData.isCurrentlyRented ? `₹${financialData.monthlyRent.toLocaleString()}` : 'N/A']);
      overviewSheet.addRow(['']);
      overviewSheet.addRow(['Financial Summary']);
      overviewSheet.addRow(['Total Return', `₹${financialData.totalReturn.toLocaleString()}`]);
      overviewSheet.addRow(['Total Expenses', `₹${expenseData.totalExpenses.toLocaleString()}`]);
      overviewSheet.addRow(['Profit/Loss', `₹${(financialData.totalReturn - financialData.totalInvestment).toLocaleString()}`]);
      overviewSheet.addRow(['ROI', `${financialData.roiPercentage >= 0 ? '+' : ''}${financialData.roiPercentage.toFixed(1)}%`]);
      overviewSheet.addRow(['Outstanding Loan', vehicle.financingType === 'loan' ? `₹${financialData.outstandingLoan.toLocaleString()}` : 'N/A']);

      // Financials Sheet
      const financialsSheet = workbook.addWorksheet('Financials');
      financialsSheet.addRow(['Financial Performance']);
      financialsSheet.addRow(['Metric', 'Amount']);
      financialsSheet.addRow(['Total Return', financialData.totalReturn]);
      financialsSheet.addRow(['Total Expenses', expenseData.totalExpenses]);
      financialsSheet.addRow(['Profit/Loss', financialData.totalReturn - financialData.totalInvestment]);
      financialsSheet.addRow(['Monthly Profit', calculateMonthlyProfit()]);
      financialsSheet.addRow(['ROI', `${financialData.roiPercentage >= 0 ? '+' : ''}${financialData.roiPercentage.toFixed(1)}%`]);
      financialsSheet.addRow(['Outstanding Loan', vehicle.financingType === 'loan' ? financialData.outstandingLoan : 0]);
      financialsSheet.addRow(['Total Investment', getTotalInvestment()]);
      financialsSheet.addRow(['']);
      financialsSheet.addRow(['Expense Breakdown']);
      financialsSheet.addRow(['Category', 'Amount', 'Percentage']);
      financialsSheet.addRow(['Fuel', expenseData.fuelExpenses, expenseData.totalExpenses > 0 ? ((expenseData.fuelExpenses / expenseData.totalExpenses) * 100).toFixed(2) + '%' : '0%']);
      financialsSheet.addRow(['Maintenance', expenseData.maintenanceExpenses, expenseData.totalExpenses > 0 ? ((expenseData.maintenanceExpenses / expenseData.totalExpenses) * 100).toFixed(2) + '%' : '0%']);
      financialsSheet.addRow(['Insurance', expenseData.insuranceExpenses, expenseData.totalExpenses > 0 ? ((expenseData.insuranceExpenses / expenseData.totalExpenses) * 100).toFixed(2) + '%' : '0%']);
      financialsSheet.addRow(['Penalties', expenseData.penaltyExpenses, expenseData.totalExpenses > 0 ? ((expenseData.penaltyExpenses / expenseData.totalExpenses) * 100).toFixed(2) + '%' : '0%']);
      financialsSheet.addRow(['EMI Payments', expenseData.emiPayments, 'Separate loan payment']);
      financialsSheet.addRow(['Prepayments', expenseData.prepayments, 'Principal reduction']);
      financialsSheet.addRow(['Other', expenseData.otherExpenses, expenseData.totalExpenses > 0 ? ((expenseData.otherExpenses / expenseData.totalExpenses) * 100).toFixed(2) + '%' : '0%']);

      // EMI Tracking Sheet
      const emiSheet = workbook.addWorksheet('EMI Tracking');
      emiSheet.addRow(['EMI Tracking Details']);
      emiSheet.addRow(['Loan Amount', vehicle.loanDetails?.totalLoan ? `₹${vehicle.loanDetails.totalLoan.toLocaleString()}` : 'N/A']);
      emiSheet.addRow(['Interest Rate', vehicle.loanDetails?.interestRate ? `${vehicle.loanDetails.interestRate}%` : 'N/A']);
      emiSheet.addRow(['EMI Amount', vehicle.loanDetails?.emiPerMonth ? `₹${vehicle.loanDetails.emiPerMonth.toLocaleString()}` : 'N/A']);
      emiSheet.addRow(['Outstanding Loan', `₹${financialData.outstandingLoan.toLocaleString()}`]);
      emiSheet.addRow(['']);
      emiSheet.addRow(['EMI Schedule']);
      emiSheet.addRow(['Month', 'Due Date', 'Interest', 'Principal', 'Outstanding', 'Status', 'Paid Date']);

      if (vehicle.loanDetails?.amortizationSchedule) {
        vehicle.loanDetails.amortizationSchedule.forEach((emi, index) => {
          emiSheet.addRow([
            (index + 1).toString(),
            emi.dueDate,
            emi.interest.toString(),
            emi.principal.toString(),
            emi.outstanding.toString(),
            emi.isPaid ? 'Paid' : 'Pending',
            emi.paidAt || 'N/A'
          ]);
        });
      }

      // Payment History Sheet
      const paymentHistorySheet = workbook.addWorksheet('Payment History');
      paymentHistorySheet.addRow(['Payment History']);
      paymentHistorySheet.addRow(['Date', 'Type', 'Payment Type', 'Expense Type', 'Amount', 'Description', 'Status']);

      allPayments.forEach(payment => {
        paymentHistorySheet.addRow([
          payment.date,
          payment.type,
          payment.paymentType,
          payment.expenseType || 'N/A',
          payment.amount,
          payment.description,
          payment.status
        ]);
      });

      // Expenses Sheet
      const expensesSheet = workbook.addWorksheet('Expenses');
      expensesSheet.addRow(['Expense Details']);
      expensesSheet.addRow(['Date', 'Type', 'Category', 'Amount', 'Description', 'Status']);

      expenseData.recentExpenses.forEach(expense => {
        expensesSheet.addRow([
          expense.createdAt,
          expense.expenseType || expense.type,
          expense.expenseType || expense.type,
          expense.amount.toString(),
          expense.description,
          expense.status
        ]);
      });

      // Assignments Sheet
      const vehicleAssignments = allAssignments.filter(a => a.vehicleId === vehicleId);

      const assignmentsSheet = workbook.addWorksheet('Assignments');
      assignmentsSheet.addRow(['Assignment History']);
      assignmentsSheet.addRow(['Start Date', 'End Date', 'Driver', 'Weekly Rent', 'Daily Rent', 'Status', 'Total Weeks']);

      vehicleAssignments.forEach(assignment => {
        const startDate = new Date(assignment.startDate);
        const endDate = assignment.endDate ? new Date(assignment.endDate) : new Date();
        const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        
        assignmentsSheet.addRow([
          assignment.startDate,
          assignment.endDate || 'Ongoing',
          getDriverName(assignment.driverId),
          assignment.weeklyRent.toString(),
          assignment.dailyRent.toString(),
          assignment.status,
          totalWeeks.toString()
        ]);
      });

      // Analytics Sheet
      const analyticsSheet = workbook.addWorksheet('Analytics');
      analyticsSheet.addRow(['Analytics Summary']);
      analyticsSheet.addRow(['Metric', 'Value']);
      analyticsSheet.addRow(['Total Distance Travelled', `${vehicle.odometer?.toLocaleString() || 'N/A'} km`]);
      analyticsSheet.addRow(['Average Monthly Expenses', `₹${expenseData.monthlyAverage.toFixed(0)}`]);
      analyticsSheet.addRow(['Expense to Earnings Ratio', `${expenseData.expenseRatio.toFixed(2)}%`]);
      analyticsSheet.addRow(['Total Assignments', vehicleAssignments.length.toString()]);
      analyticsSheet.addRow(['Completed Assignments', vehicleAssignments.filter(a => a.status === 'ended').length.toString()]);
      analyticsSheet.addRow(['Active Assignments', vehicleAssignments.filter(a => a.status === 'active').length.toString()]);
      analyticsSheet.addRow(['Average Assignment Duration', vehicleAssignments.length > 0 ? `${(vehicleAssignments.reduce((sum, a) => {
        const startDate = new Date(a.startDate);
        const endDate = a.endDate ? new Date(a.endDate) : new Date();
        const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return sum + weeks;
      }, 0) / vehicleAssignments.length).toFixed(1)} weeks` : 'N/A']);
      analyticsSheet.addRow(['']);
      analyticsSheet.addRow(['Performance Metrics']);
      analyticsSheet.addRow(['Utilization Rate', vehicleAssignments.length > 0 ? `${((vehicleAssignments.filter(a => a.status === 'ended').length / vehicleAssignments.length) * 100).toFixed(1)}%` : '0%']);
      analyticsSheet.addRow(['Revenue per Kilometer', vehicle.odometer && vehicle.odometer > 0 ? `₹${(financialData.totalEarnings / vehicle.odometer).toFixed(2)}` : 'N/A']);
      analyticsSheet.addRow(['Expense per Kilometer', vehicle.odometer && vehicle.odometer > 0 ? `₹${(expenseData.totalExpenses / vehicle.odometer).toFixed(2)}` : 'N/A']);

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${vehicle.registrationNumber}_Vehicle_Details_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Excel Export Successful",
        description: `Vehicle details exported to ${vehicle.registrationNumber}_Vehicle_Details_${new Date().toISOString().split('T')[0]}.xlsx`,
      });

    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data to Excel. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = () => {
    // PDF export functionality would require jsPDF library
    toast({
      title: "PDF Export",
      description: "PDF export functionality coming soon",
    });
  };

  // Projection calculation function
  // ===== CORRECTED PROJECTION CALCULATION =====
  // Based on Investment & Returns logic: ROI = (Returns - Investment) / Investment
  const calculateProjection = (years: number, assumedMonthlyRent?: number, increasedEMIAmount?: number, netCashFlowMode?: boolean) => {
    const months = years * 12;

    // ===== FIXED INVESTMENT (DOESN'T GROW OVER TIME) =====
    // Investment = Initial Investment + Prepayments (one-time costs)
    const fixedInvestment = (vehicle.initialInvestment || vehicle.initialCost || 0) + expenseData.prepayments;

    // ===== CURRENT FINANCIAL STATE =====
    const currentTotalEarnings = financialData.totalEarnings;
    const currentTotalOperatingExpenses = expenseData.totalExpenses;
    const currentOutstandingLoan = financialData.outstandingLoan;
    const currentTotalEmiPaid = financialData.totalEmiPaid;

    // Calculate current depreciated car value (yearly depreciation)
    const initialCarValue = vehicle.initialInvestment || vehicle.initialCost || 0;
    const depreciationRate = vehicle.depreciationRate ?? 10;
    const depreciationPerYear = depreciationRate / 100;

    // Calculate operational years since purchase (add 1 to include current year)
    const purchaseYear = vehicle.year || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const operationalYears = Math.max(1, currentYear - purchaseYear + 1);

    const currentDepreciatedCarValue = initialCarValue * Math.pow((1 - depreciationPerYear), operationalYears);

    // ===== CURRENT TOTAL RETURNS =====
    // Returns = Earnings + Current Depreciated Car Value - Outstanding Loan
    const currentTotalReturns = currentTotalEarnings + currentDepreciatedCarValue - currentOutstandingLoan;

    // ===== CURRENT ROI =====
    const currentROI = fixedInvestment > 0 ? ((currentTotalReturns - fixedInvestment) / fixedInvestment) * 100 : 0;

    // ===== MONTHLY PROJECTION PARAMETERS =====
    const monthlyEarnings = assumedMonthlyRent || financialData.monthlyRent;
    const monthlyOperatingExpenses = expenseData.monthlyAverage;
    let monthlyEMI = increasedEMIAmount || vehicle.loanDetails?.emiPerMonth || 0;

    // Net cash flow mode: Use net cash flow to pay extra EMI
    if (netCashFlowMode && monthlyEarnings > monthlyOperatingExpenses) {
      const netCashFlow = monthlyEarnings - monthlyOperatingExpenses;
      monthlyEMI += netCashFlow;
    }

    // ===== MONTH-BY-MONTH PROJECTION SIMULATION =====
    let projectedEarnings = currentTotalEarnings;
    let projectedOperatingExpenses = currentTotalOperatingExpenses;
    let projectedEmiPaid = currentTotalEmiPaid;
    let projectedOutstandingLoan = currentOutstandingLoan;
    let projectedDepreciatedCarValue = currentDepreciatedCarValue;
    let projectedTotalExpenses = currentTotalOperatingExpenses; // Initialize with current operating expenses

    const monthlyInterestRate = (vehicle.loanDetails?.interestRate || 8.5) / 12 / 100;

    // Simulate each month
    for (let month = 0; month < months; month++) {
      // Add monthly earnings and operating expenses
      projectedEarnings += monthlyEarnings;
      projectedOperatingExpenses += monthlyOperatingExpenses;

      // Process loan payments and add EMI to total expenses only while loan is outstanding
      if (projectedOutstandingLoan > 0) {
        const monthlyInterest = projectedOutstandingLoan * monthlyInterestRate;
        const monthlyPrincipal = Math.min(monthlyEMI - monthlyInterest, projectedOutstandingLoan);
        const monthlyEmiPayment = monthlyInterest + monthlyPrincipal;
        projectedEmiPaid += monthlyEmiPayment;
        projectedTotalExpenses += monthlyEmiPayment; // Add EMI to total expenses only while loan is outstanding
        projectedOutstandingLoan -= monthlyPrincipal;
        if (projectedOutstandingLoan < 0) projectedOutstandingLoan = 0;
      }

      // Apply yearly depreciation (only at end of each year)
      if ((month + 1) % 12 === 0) {
        projectedDepreciatedCarValue *= (1 - depreciationPerYear);
      }
    }

    // ===== PROJECTED TOTAL RETURNS =====
    // Projected Returns = Projected Earnings + Projected Depreciated Car Value - Projected Outstanding Loan
    const projectedTotalReturns = projectedEarnings + projectedDepreciatedCarValue - projectedOutstandingLoan;

    // ===== PROJECTED ROI =====
    // ROI = (Total Returns - Fixed Investment) / Fixed Investment × 100
    const projectedROI = fixedInvestment > 0 ?
      ((projectedTotalReturns - fixedInvestment) / fixedInvestment) * 100 : 0;

    // ===== PROJECTED PROFIT/LOSS =====
    const projectedProfitLoss = projectedTotalReturns - fixedInvestment;

    // ===== PROJECTED NET CASH FLOW =====
    const projectedNetCashFlow = projectedEarnings - projectedOperatingExpenses;

    // ===== BREAK-EVEN ANALYSIS =====
    // Find when cumulative total return >= cumulative total investment
    let breakEvenMonths = 0;
    let breakEvenDate = null;

    let tempEarnings = currentTotalEarnings;
    let tempOperatingExpenses = currentTotalOperatingExpenses;
    let tempEmiPaid = currentTotalEmiPaid;
    let tempOutstandingLoan = currentOutstandingLoan;
    let tempDepreciatedCarValue = currentDepreciatedCarValue;

    while (breakEvenMonths < 120) { // Max 10 years
      // Monthly updates
      tempEarnings += monthlyEarnings;
      tempOperatingExpenses += monthlyOperatingExpenses;

      // Process loan payments
      if (tempOutstandingLoan > 0) {
        const interest = tempOutstandingLoan * monthlyInterestRate;
        const principal = Math.min(monthlyEMI - interest, tempOutstandingLoan);
        tempEmiPaid += interest + principal;
        tempOutstandingLoan -= principal;
        if (tempOutstandingLoan < 0) tempOutstandingLoan = 0;
      }

      // Apply yearly depreciation (only at end of each year)
      if ((breakEvenMonths + 1) % 12 === 0) {
        tempDepreciatedCarValue *= (1 - depreciationPerYear);
      }

      // Check break-even condition: Total Return >= Fixed Investment
      // Fixed investment = initial investment + prepayments (one-time costs)
      const tempTotalReturn = tempEarnings + tempDepreciatedCarValue - tempOutstandingLoan;
      const tempProfitLoss = tempTotalReturn - fixedInvestment;

      if (tempProfitLoss >= 0) {
        breakEvenDate = new Date();
        breakEvenDate.setMonth(breakEvenDate.getMonth() + breakEvenMonths);
        break;
      }

      breakEvenMonths++;
    }

    // ===== LOAN CLEARANCE TIMELINE =====
    // Find when loan will be fully paid off
    let loanClearanceMonths = 0;
    let loanClearanceDate = null;
    let tempOutstandingLoanForClearance = currentOutstandingLoan;

    while (loanClearanceMonths < 120 && tempOutstandingLoanForClearance > 0) {
      if (tempOutstandingLoanForClearance > 0) {
        const interest = tempOutstandingLoanForClearance * monthlyInterestRate;
        const principal = Math.min(monthlyEMI - interest, tempOutstandingLoanForClearance);
        tempOutstandingLoanForClearance -= principal;

        if (tempOutstandingLoanForClearance <= 0) {
          loanClearanceDate = new Date();
          loanClearanceDate.setMonth(loanClearanceDate.getMonth() + loanClearanceMonths);
          break;
        }
      }

      loanClearanceMonths++;
    }

    // ===== ADDITIONAL PROJECTION METRICS =====
    // projectedNetCashFlow is already calculated above

    return {
      // Current state
      currentTotalInvestment: fixedInvestment,
      currentTotalReturn: currentTotalReturns,
      currentDepreciatedCarValue,

      // Projected results
      projectedEarnings,
      projectedOperatingExpenses,
      projectedTotalExpenses, // Total expenses including EMI only while loan is outstanding
      projectedNetCashFlow,
      projectedEmiPaid,
      projectedTotalReturn: projectedTotalReturns,
      projectedProfitLoss,
      projectedROI,
      projectedDepreciatedCarValue,

      // Future values
      futureOutstandingLoan: projectedOutstandingLoan,

      // Analysis results
      breakEvenMonths: breakEvenMonths < 120 ? breakEvenMonths : null,
      breakEvenDate: breakEvenDate ? breakEvenDate.toLocaleDateString() : null,
      loanClearanceMonths: loanClearanceMonths < 120 ? loanClearanceMonths : null,
      loanClearanceDate: loanClearanceDate ? loanClearanceDate.toLocaleDateString() : null,

      // Monthly parameters (for reference)
      monthlyEarnings,
      monthlyOperatingExpenses,
      monthlyEMI
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Car className="h-8 w-8" />
            {vehicle.vehicleName || `${vehicle.make} ${vehicle.model}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {vehicle.make} {vehicle.model} ({vehicle.year}) • {vehicle.registrationNumber}
          </p>
          <div className="flex gap-2 mt-2">
            {getStatusBadge(vehicle.status)}
            {getFinancialStatusBadge(vehicle.financialStatus || 'cash')}
            <Badge variant="outline">
              {vehicle.odometer?.toLocaleString() || 'N/A'} km
            </Badge>
            {vehicle.needsMaintenance && (
              <Badge variant="destructive">
                <AlertCircle className="h-4 w-4 mr-1" />
                Maintenance Due
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => navigate('/vehicles')}>
            Back to Fleet
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Edit Vehicle
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="emi">EMI Tracking</TabsTrigger>
          <TabsTrigger value="rent">Rent Collection</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab
            vehicle={vehicle}
            financialData={financialData}
            expenseData={expenseData}
            getTotalInvestment={getTotalInvestment}
            getDriverName={getDriverName}
            getCurrentAssignmentDetails={getCurrentAssignmentDetails}
            getCurrentMonthlyRent={getCurrentMonthlyRent}
          />
        </TabsContent>

        {/* Financials Tab */}
        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-4">
          <FinancialTab
            vehicle={vehicle}
            financialData={financialData}
            expenseData={expenseData}
            firebasePayments={firebasePayments}
            vehicleId={vehicleId}
            getTotalInvestment={getTotalInvestment}
            historicalMonthlyNetCashFlow={historicalMonthlyNetCashFlow}
            prepaymentAmount={prepaymentAmount}
            setPrepaymentAmount={setPrepaymentAmount}
            handlePrepayment={handlePrepayment}
            showPrepaymentResults={showPrepaymentResults}
            setShowPrepaymentResults={setShowPrepaymentResults}
            prepaymentResults={prepaymentResults}
            processPrepayment={processPrepayment}
          />
        </TabsContent>

        {/* EMI Tracking Tab */}
        <TabsContent value="emi" className="space-y-4">
          <EMITab
            vehicle={vehicle}
            financialData={financialData}
            markEMIPaid={markEMIPaid}
            processEMIPayment={processEMIPayment}
          />
        </TabsContent>

        {/* Rent Collection Tab */}
        <TabsContent value="rent" className="space-y-4">
          <RentTab
            vehicle={vehicle}
            vehicleId={vehicleId}
            firebasePayments={firebasePayments}
            financialData={financialData}
            getCurrentAssignmentDetails={getCurrentAssignmentDetails}
            markRentCollected={markRentCollected}
            isProcessingRentPayment={isProcessingRentPayment}
          />
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <ExpensesTab
            expenseData={expenseData}
            financialData={financialData}
            addExpenseDialogOpen={addExpenseDialogOpen}
            setAddExpenseDialogOpen={setAddExpenseDialogOpen}
            addInsuranceDialogOpen={addInsuranceDialogOpen}
            setAddInsuranceDialogOpen={setAddInsuranceDialogOpen}
            onInsuranceAdded={handleInsuranceAdded}
          />
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="space-y-4">
          <PaymentsTab
            transactionTypeFilter={transactionTypeFilter}
            setTransactionTypeFilter={setTransactionTypeFilter}
            paidSubTypeFilter={paidSubTypeFilter}
            setPaidSubTypeFilter={setPaidSubTypeFilter}
            expenseSubTypeFilter={expenseSubTypeFilter}
            setExpenseSubTypeFilter={setExpenseSubTypeFilter}
            paymentFilter={paymentFilter}
            setPaymentFilter={setPaymentFilter}
            paymentDateFilter={paymentDateFilter}
            setPaymentDateFilter={setPaymentDateFilter}
            filteredPayments={filteredPayments}
            setShowEmiForm={setShowEmiForm}
            setShowRentForm={setShowRentForm}
            setShowExpenseForm={setShowExpenseForm}
            setShowExpenseCorrectionForm={setShowExpenseCorrectionForm}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab
            vehicle={vehicle}
            financialData={financialData}
            expenseData={expenseData}
            firebasePayments={firebasePayments}
            vehicleId={vehicleId}
            getTotalInvestment={getTotalInvestment}
            projectionYear={projectionYear}
            setProjectionYear={setProjectionYear}
            projectionMode={projectionMode}
            setProjectionMode={setProjectionMode}
            assumedMonthlyRent={assumedMonthlyRent}
            setAssumedMonthlyRent={setAssumedMonthlyRent}
            increasedEMI={increasedEMI}
            setIncreasedEMI={setIncreasedEMI}
            netCashFlowMode={netCashFlowMode}
            setNetCashFlowMode={setNetCashFlowMode}
            calculateProjection={calculateProjection}
            vehicleExpenses={vehicleExpenses}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <DocumentsTab vehicle={vehicle} />
        </TabsContent>

        {/* Assignment History Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <AssignmentsTab vehicleId={vehicleId!} getDriverName={getDriverName} />
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <AccountsTab vehicle={vehicle} vehicleId={vehicleId!} />
        </TabsContent>
      </Tabs>

      {/* Penalty Payment Dialog */}
      <Dialog open={penaltyDialogOpen} onOpenChange={setPenaltyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>EMI Payment - Penalty Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEMI && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>EMI Details:</strong><br />
                  Month: {selectedEMI.monthIndex + 1}<br />
                  Due Date: {new Date(selectedEMI.scheduleItem.dueDate).toLocaleDateString()}<br />
                  Days Overdue: {Math.ceil((new Date().getTime() - new Date(selectedEMI.scheduleItem.dueDate).getTime()) / (1000 * 60 * 60 * 24))}<br />
                  EMI Amount: ₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="penalty">Penalty Amount (₹)</Label>
              <Input
                id="penalty"
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                placeholder="Enter penalty amount (0 if no penalty)"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter 0 if no penalty was charged for this late payment.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPenaltyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                const penalty = parseFloat(penaltyAmount || '0');
                if (selectedEMI) {
                  processEMIPayment(selectedEMI.monthIndex, selectedEMI.scheduleItem, penalty);
                }
              }}>
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseDialogOpen} onOpenChange={(open) => {
        setAddExpenseDialogOpen(open);
        if (open) {
          setSelectedExpenseType('fuel');
          setNewExpense({
            amount: '',
            description: '',
            type: 'fuel',
            // Reset proration fields
            isAdvance: false,
            coverageStartDate: '',
            coverageEndDate: '',
            coverageMonths: 0
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expenseType">Transaction Type</Label>
              <Select value={selectedExpenseType} onValueChange={(value) => setSelectedExpenseType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emi">EMI Payment</SelectItem>
                  <SelectItem value="prepayment">Prepayment</SelectItem>
                  <SelectItem value="fuel">Fuel Expense</SelectItem>
                  <SelectItem value="maintenance">Maintenance Expense</SelectItem>
                  <SelectItem value="insurance">Insurance Expense</SelectItem>
                  <SelectItem value="penalties">Penalties Expense</SelectItem>
                  <SelectItem value="general">General Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expenseAmount">Amount (₹)</Label>
              <Input
                id="expenseAmount"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter expense amount"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="expenseDescription">Description</Label>
              <Input
                id="expenseDescription"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the expense"
              />
            </div>

            {/* Proration fields for advance payments */}
            {(selectedExpenseType === 'insurance' || selectedExpenseType === 'prepayment') && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdvance"
                    checked={newExpense.isAdvance}
                    onChange={(e) => setNewExpense(prev => ({
                      ...prev,
                      isAdvance: e.target.checked,
                      // Reset dates if unchecked
                      coverageStartDate: e.target.checked ? prev.coverageStartDate : '',
                      coverageEndDate: e.target.checked ? prev.coverageEndDate : '',
                      coverageMonths: e.target.checked ? prev.coverageMonths : 0
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="isAdvance" className="text-sm">
                    This is an advance payment covering multiple months
                  </Label>
                </div>

                {newExpense.isAdvance && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="coverageStartDate" className="text-sm">Coverage Start Date</Label>
                        <Input
                          id="coverageStartDate"
                          type="date"
                          value={newExpense.coverageStartDate}
                          onChange={(e) => {
                            const startDate = e.target.value;
                            const start = new Date(startDate);
                            const end = new Date(start);
                            end.setMonth(end.getMonth() + 12); // Default 1 year
                            const endDateStr = end.toISOString().split('T')[0];
                            const months = 12;

                            setNewExpense(prev => ({
                              ...prev,
                              coverageStartDate: startDate,
                              coverageEndDate: endDateStr,
                              coverageMonths: months
                            }));
                          }}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="coverageEndDate" className="text-sm">Coverage End Date</Label>
                        <Input
                          id="coverageEndDate"
                          type="date"
                          value={newExpense.coverageEndDate}
                          onChange={(e) => {
                            const endDate = e.target.value;
                            const start = new Date(newExpense.coverageStartDate);
                            const end = new Date(endDate);
                            const months = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;

                            setNewExpense(prev => ({
                              ...prev,
                              coverageEndDate: endDate,
                              coverageMonths: months
                            }));
                          }}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    {newExpense.amount && newExpense.coverageMonths > 0 && (
                      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                        <strong>Proration Preview:</strong> ₹{parseFloat(newExpense.amount).toLocaleString()} total payment will be prorated as
                        ₹{Math.round(parseFloat(newExpense.amount) / newExpense.coverageMonths).toLocaleString()}/month for {newExpense.coverageMonths} months
                        in statistical calculations.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddExpenseDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddExpense}>
                Add Expense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EMI Payment Modal */}
      <Dialog open={showEmiForm} onOpenChange={setShowEmiForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record EMI Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emi-date">Payment Date</Label>
              <Input
                id="emi-date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emi-amount">EMI Amount</Label>
              <Input
                id="emi-amount"
                type="number"
                placeholder="Enter EMI amount"
                defaultValue={vehicle.loanDetails?.emiPerMonth?.toString() || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emi-method">Payment Method</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emi-reference">Transaction Reference</Label>
              <Input
                id="emi-reference"
                placeholder="Enter transaction ID or reference"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEmiForm(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "EMI Payment Recorded",
                  description: "EMI payment has been successfully recorded.",
                });
                setShowEmiForm(false);
              }}>
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rent Receipt Modal */}
      <Dialog open={showRentForm} onOpenChange={setShowRentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Rent Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rent-date">Receipt Date</Label>
              <Input
                id="rent-date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-amount">Rent Amount</Label>
              <Input
                id="rent-amount"
                type="number"
                placeholder="Enter rent amount received"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-driver">Driver Name</Label>
              <Input
                id="rent-driver"
                placeholder="Enter driver name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-period">Rent Period</Label>
              <Input
                id="rent-period"
                placeholder="e.g., January 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-method">Payment Method</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRentForm(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Rent Receipt Recorded",
                  description: "Rent receipt has been successfully recorded.",
                });
                setShowRentForm(false);
              }}>
                Record Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Modal */}
      <Dialog open={showExpenseForm} onOpenChange={(open) => {
        setShowExpenseForm(open);
        if (open) {
          // Reset form state when dialog opens
          setSelectedExpenseType('fuel');
          setNewExpense({
            amount: '',
            description: '',
            type: 'fuel',
            // Reset proration fields
            isAdvance: false,
            coverageStartDate: '',
            coverageEndDate: '',
            coverageMonths: 0
          });
          setInsuranceExpenseData({
            driverId: '',
            insuranceType: 'fix_insurance',
            policyNumber: '',
            vendor: '',
            startDate: '',
            endDate: '',
            receiptNumber: '',
            notes: '',
            isAdvance: false
          });
        }
        // Remove state reset when dialog closes - let handleAddExpense handle it after successful save
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-type">Expense Type</Label>
              <select
                id="expense-type"
                value={selectedExpenseType}
                onChange={(e) => setSelectedExpenseType(e.target.value as typeof selectedExpenseType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="fuel">Fuel</option>
                <option value="maintenance">Maintenance</option>
                <option value="penalties">Penalty/Fine</option>
                <option value="general">General</option>
              </select>
            </div>
            {selectedExpenseType === 'fuel' ? (
              <AddFuelRecordForm onSuccess={handleFuelRecordAdded} />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Expense Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    placeholder="Enter expense amount"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-description">Description</Label>
                  <Input
                    id="expense-description"
                    placeholder="Enter expense description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-method">Payment Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowExpenseForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddExpense}>
                    Record Expense
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Correction Modal */}
      <Dialog open={showExpenseCorrectionForm} onOpenChange={(open) => {
        setShowExpenseCorrectionForm(open);
        if (!open) {
          // Reset form state when dialog closes
          setSelectedExpenseType('fuel');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Expense Correction
            </DialogTitle>
            <DialogDescription className="text-left">
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
                <p className="text-sm text-orange-800 font-medium mb-2">⚠️ Important Notes:</p>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Corrections create new entries, not modify existing ones</li>
                  <li>• Use positive amounts to add to previous transactions</li>
                  <li>• Use negative amounts to subtract from previous transactions</li>
                  <li>• Always reference the original transaction ID</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Enter the transaction ID you want to correct and the adjustment amount.
              </p>
            </DialogDescription>
          </DialogHeader>
          <AddFuelRecordForm 
            onSuccess={() => setShowExpenseCorrectionForm(false)} 
            isCorrection={true} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleDetails;


