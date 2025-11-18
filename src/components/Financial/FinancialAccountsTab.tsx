import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, doc, updateDoc, setDoc, onSnapshot, increment, getDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';
import BulkPaymentDialog from './BulkPaymentDialog';
import { SectionNumberBadge } from '../VehicleDetails/SectionNumberBadge';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Users,
  User,
  Banknote,
  CheckCircle,
  Filter,
  Calendar,
  CreditCard,
  Clock,
  AlertCircle,
  AlertTriangle,
  Plus,
  Car,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  DollarSign as DollarSignIcon
} from 'lucide-react';
import { Role } from '@/types/user';

interface EMIPaymentSectionProps {
  vehicle: any;
  onPayEMI: (monthIndex: number, emi: any) => void;
  onShowMore: () => void;
  periodType: string;
  selectedYear: string;
  selectedMonth?: string;
  selectedQuarter?: string;
}

const EMIPaymentSection: React.FC<EMIPaymentSectionProps> = ({
  vehicle,
  onPayEMI,
  onShowMore,
  periodType,
  selectedYear,
  selectedMonth,
  selectedQuarter
}) => {
  // Calculate overdue and due EMIs
  const getEMISummary = () => {
    if (!vehicle.loanDetails?.amortizationSchedule) {
      return { overdueEMIs: [], dueSoonEMIs: [], totalOverdue: 0, totalDueSoon: 0, totalDue: 0 };
    }

    const today = new Date();
    const overdueEMIs: Array<{ index: number; emi: any; daysPastDue: number }> = [];
    const dueSoonEMIs: Array<{ index: number; emi: any; daysUntilDue: number }> = [];

    vehicle.loanDetails.amortizationSchedule.forEach((emi, index) => {
      if (emi.isPaid) return;

      const dueDate = new Date(emi.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < 0) {
        overdueEMIs.push({ index, emi, daysPastDue: Math.abs(daysDiff) });
      } else if (daysDiff <= 3) {
        dueSoonEMIs.push({ index, emi, daysUntilDue: daysDiff });
      }
    });

    const emiAmount = vehicle.loanDetails?.emiPerMonth || 0;
    const totalOverdue = overdueEMIs.length * emiAmount;
    const totalDueSoon = dueSoonEMIs.length * emiAmount;
    const totalDue = totalOverdue + totalDueSoon;

    return { overdueEMIs, dueSoonEMIs, totalOverdue, totalDueSoon, totalDue };
  };

  const emiSummary = getEMISummary();

  // Get EMIs for the selected period
  const getPeriodEMIs = () => {
    const year = parseInt(selectedYear);
    const schedule = vehicle.loanDetails?.amortizationSchedule || [];
    let relevantEMIs: { index: number; emi: any }[] = [];

    if (periodType === 'monthly' && selectedMonth) {
      const monthIndex = new Date(`${selectedMonth} 1, ${year}`).getMonth();
      // Find EMIs due in this month
      schedule.forEach((emi: any, index: number) => {
        const dueDate = new Date(emi.dueDate);
        if (dueDate.getMonth() === monthIndex && dueDate.getFullYear() === year) {
          relevantEMIs.push({ index, emi });
        }
      });
    } else if (periodType === 'quarterly' && selectedQuarter) {
      const quarterMonths = {
        'Q1': [0, 1, 2], // Jan, Feb, Mar
        'Q2': [3, 4, 5], // Apr, May, Jun
        'Q3': [6, 7, 8], // Jul, Aug, Sep
        'Q4': [9, 10, 11] // Oct, Nov, Dec
      };
      const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths];
      
      // Find EMIs due in this quarter
      schedule.forEach((emi: any, index: number) => {
        const dueDate = new Date(emi.dueDate);
        if (months.includes(dueDate.getMonth()) && dueDate.getFullYear() === year) {
          relevantEMIs.push({ index, emi });
        }
      });
    } else if (periodType === 'yearly') {
      // For yearly, show first 3 unpaid EMIs or all if less than 3
      const unpaidEMIs = schedule
        .map((emi: any, index: number) => ({ index, emi }))
        .filter(({ emi }) => !emi.isPaid);
      
      relevantEMIs = unpaidEMIs.slice(0, 3);
    }

    return relevantEMIs;
  };

  const periodEMIs = getPeriodEMIs();

  if (periodEMIs.length === 0 && emiSummary.totalDue === 0) {
    return null;
  }

  // For monthly view - show single EMI badge button
  if (periodType === 'monthly') {
    if (periodEMIs.length === 0) return null;
    
    const { index, emi } = periodEMIs[0]; // Only one EMI per month
    const dueDate = new Date(emi.dueDate);
    const today = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    const canPayNow = dueDate <= threeDaysFromNow || daysDiff < 0;

    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-600';
    let borderColor = 'border-gray-200';
    let statusText = 'Future';
    let icon = <Clock className="h-3 w-3" />;

    if (emi.isPaid) {
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      borderColor = 'border-green-200';
      statusText = 'Paid';
      icon = <CheckCircle className="h-3 w-3" />;
    } else if (daysDiff < 0) {
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      borderColor = 'border-red-200';
      statusText = `${Math.abs(daysDiff)} days overdue`;
      icon = <AlertCircle className="h-3 w-3" />;
    } else if (daysDiff <= 3) {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
      borderColor = 'border-yellow-200';
      statusText = daysDiff === 0 ? 'Due Today' : `Due in ${daysDiff} days`;
      icon = <AlertCircle className="h-3 w-3" />;
    }

    return (
      <div className="border-t pt-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-medium text-gray-700">EMI Payment</div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className={`w-full h-auto py-2 ${bgColor} ${textColor} border ${borderColor} hover:${bgColor} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1`}
          disabled={!canPayNow && !emi.isPaid}
          onClick={() => canPayNow && !emi.isPaid && onPayEMI(index, emi)}
        >
          <div className="flex items-center gap-2">
            {icon}
            <div className="text-left">
              <div className="text-xs font-medium">
                EMI {emi.month}
              </div>
              <div className="text-xs">
                {statusText}
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold">
            ₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}
          </div>
        </Button>
      </div>
    );
  }

  // For quarterly/yearly view - show multiple EMI badges with Pay button
  return (
    <div className="border-t pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div className="text-xs font-medium text-gray-700">EMI Payments</div>
        <div className="flex items-center gap-1">
          {emiSummary.totalDue > 0 && (
            <Button
              size="sm"
              variant="destructive"
              className="h-6 px-2 text-xs"
              onClick={() => {
                // Pay oldest overdue EMIs first
                const emisToPay = [...emiSummary.overdueEMIs, ...emiSummary.dueSoonEMIs];
                if (emisToPay.length > 0) {
                  onPayEMI(emisToPay[0].index, emisToPay[0].emi);
                }
              }}
            >
              Pay Oldest - ₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}
            </Button>
          )}
          {periodEMIs.length > 3 && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs text-blue-600 border-blue-300"
              onClick={onShowMore}
            >
              View All ({periodEMIs.length})
            </Button>
          )}
        </div>
      </div>
      
      {/* Overdue Warning */}
      {emiSummary.overdueEMIs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs mb-2">
          <div className="flex items-start gap-1">
            <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-red-800">
              <span className="font-semibold">
                {emiSummary.overdueEMIs.length} EMI{emiSummary.overdueEMIs.length > 1 ? 's' : ''} overdue
              </span>
              <br />
              <span className="text-xs">
                ⚠️ Oldest: EMI {emiSummary.overdueEMIs[0].emi.month} ({emiSummary.overdueEMIs[0].daysPastDue} days overdue) will be settled first
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {periodEMIs.map(({ index, emi }) => {
          const dueDate = new Date(emi.dueDate);
          const today = new Date();
          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(today.getDate() + 3);
          const canPayNow = dueDate <= threeDaysFromNow || daysDiff < 0;

          let bgColor = 'bg-gray-100';
          let textColor = 'text-gray-600';
          let borderColor = 'border-gray-200';
          let statusText = '';
          let icon = <Clock className="h-3 w-3" />;

          if (emi.isPaid) {
            bgColor = 'bg-green-100';
            textColor = 'text-green-700';
            borderColor = 'border-green-200';
            statusText = 'Paid';
            icon = <CheckCircle className="h-3 w-3" />;
          } else if (daysDiff < 0) {
            bgColor = 'bg-red-100';
            textColor = 'text-red-700';
            borderColor = 'border-red-200';
            statusText = 'Overdue';
            icon = <AlertCircle className="h-3 w-3" />;
          } else if (daysDiff <= 3) {
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-700';
            borderColor = 'border-yellow-200';
            statusText = 'Due Now';
            icon = <DollarSign className="h-3 w-3" />;
          } else {
            const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            statusText = `${daysUntil} days`;
          }

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 px-2 text-xs ${bgColor} ${textColor} border ${borderColor} hover:${bgColor} flex items-center gap-1`}
                  disabled={!canPayNow && !emi.isPaid}
                  onClick={() => canPayNow && !emi.isPaid && onPayEMI(index, emi)}
                >
                  {icon}
                  EMI {emi.month}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="space-y-1">
                  <div className="font-semibold">EMI {emi.month}</div>
                  <div>{dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="font-semibold">₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}</div>
                  <div>{statusText}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};











interface AccountingTransaction {
  id: string;
  vehicleId: string;
  type: 'gst_payment' | 'service_charge' | 'partner_payment' | 'owner_payment';
  amount: number;
  month: string;
  description: string;
  status: 'pending' | 'completed' | 'reversed';
  createdAt: string;
  completedAt?: string;
  reversedAt?: string;
}

interface FinancialAccountsTabProps {
  companyFinancialData: any;
  accountingTransactions: AccountingTransaction[];
  setAccountingTransactions: React.Dispatch<React.SetStateAction<AccountingTransaction[]>>;
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    available: {
      color: 'bg-green-500 hover:bg-green-600',
      text: 'Available',
      icon: <Car className="h-4 w-4" />
    },
    rented: {
      color: 'bg-blue-500 hover:bg-blue-600',
      text: 'Rented',
      icon: <DollarSign className="h-4 w-4" />
    },
    maintenance: {
      color: 'bg-red-500 hover:bg-red-600',
      text: 'Maintenance',
      icon: <AlertCircle className="h-4 w-4" />
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;

  return (
    <Badge className={`${config.color} text-white flex items-center gap-1`}>
      {config.icon}
      {config.text}
    </Badge>
  );
};

const getLatestTransactionStatus = (transactions: AccountingTransaction[], vehicleId: string, type: string, month: string) => {
  // Filter transactions for this vehicle, type, and month
  const relevantTransactions = transactions.filter((t: any) =>
    t.vehicleId === vehicleId && t.type === type && t.month === month
  );

  if (relevantTransactions.length === 0) {
    return null; // No transaction found
  }

  // Sort by completedAt descending to get the latest transaction
  const sortedTransactions = relevantTransactions.sort((a: any, b: any) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });

  return sortedTransactions[0].status; // Return the status of the latest transaction
};

const FinancialAccountsTab: React.FC<FinancialAccountsTabProps> = ({
  companyFinancialData,
  accountingTransactions,
  setAccountingTransactions
}) => {
  const { userInfo } = useAuth();
  const { vehicles, assignments, payments, addExpense } = useFirebaseData();
  const navigate = useNavigate();
  const [vehicleCashBalances, setVehicleCashBalances] = useState<Record<string, number>>({});

  // Bulk payment dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkDialogType, setBulkDialogType] = useState<'gst' | 'service_charge' | 'partner_share' | 'owner_payment' | 'emi' | 'rent'>('gst');
  const [bulkDialogItems, setBulkDialogItems] = useState<any[]>([]);
  const [bulkDialogTitle, setBulkDialogTitle] = useState('');
  const [bulkDialogDescription, setBulkDialogDescription] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Bulk payment selected months state
  const [selectedMonths, setSelectedMonths] = useState<Record<string, number[]>>({});

  // EMI payment dialog state
  const [emiDialogOpen, setEmiDialogOpen] = useState(false);
  const [selectedVehicleForEMI, setSelectedVehicleForEMI] = useState<any>(null);
  const [selectedEmiIndices, setSelectedEmiIndices] = useState<number[]>([]);
  const [isProcessingEMI, setIsProcessingEMI] = useState(false);

  // Penalty dialog state for individual EMI payments
  const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [selectedEMIForPenalty, setSelectedEMIForPenalty] = useState<{vehicle: any, monthIndex: number, scheduleItem: any, dueDate: string, emiAmount: number} | null>(null);

  // Bulk EMI penalty state
  const [emiPenalties, setEmiPenalties] = useState<Record<number, string>>({});

  // Rent collection state
  const [isProcessingRentPayment, setIsProcessingRentPayment] = useState<number | null>(null);
  const [rentPopoverOpen, setRentPopoverOpen] = useState<{[key: string]: boolean}>({});
  const [selectedRentWeek, setSelectedRentWeek] = useState<{weekIndex: number, assignment: any, weekStartDate: Date, vehicleId: string, isBulkPayment?: boolean, overdueWeeks?: any[]} | null>(null);
  const [confirmRentPaymentDialog, setConfirmRentPaymentDialog] = useState(false);

  // Backdoor cash increase state (for testing only)
  const [backdoorDialogOpen, setBackdoorDialogOpen] = useState(false);
  const [selectedVehicleForBackdoor, setSelectedVehicleForBackdoor] = useState<string>('');
  const [backdoorAmount, setBackdoorAmount] = useState<string>('');
  const [isProcessingBackdoor, setIsProcessingBackdoor] = useState(false);

  // Rent View All Dialog state
  const [rentViewAllDialog, setRentViewAllDialog] = useState(false);
  const [selectedVehicleForRent, setSelectedVehicleForRent] = useState<any>(null);

  // Rent Overdue Dialog state (similar to EMI)
  const [rentDialogOpen, setRentDialogOpen] = useState(false);
  const [selectedVehicleForRentOverdue, setSelectedVehicleForRentOverdue] = useState<any>(null);
  const [selectedRentWeekIndices, setSelectedRentWeekIndices] = useState<number[]>([]);
  const [isProcessingRentOverdue, setIsProcessingRentOverdue] = useState(false);

  // EMI View All Dialog state
  const [emiViewAllDialog, setEmiViewAllDialog] = useState(false);
  const [selectedVehicleForEMIView, setSelectedVehicleForEMIView] = useState<any>(null);

  // Payment confirmation dialog states
  const [confirmGstPaymentDialog, setConfirmGstPaymentDialog] = useState(false);
  const [confirmServiceChargeDialog, setConfirmServiceChargeDialog] = useState(false);
  const [confirmPartnerPaymentDialog, setConfirmPartnerPaymentDialog] = useState(false);
  const [confirmOwnerPaymentDialog, setConfirmOwnerPaymentDialog] = useState(false);
  const [selectedVehicleForPayment, setSelectedVehicleForPayment] = useState<any>(null);

  // Individual payment dialog state for quarterly/yearly views
  const [individualPaymentDialogOpen, setIndividualPaymentDialogOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'gst' | 'service_charge' | 'partner_share' | 'owner_payment' | null>(null);
  const [selectedVehicleForIndividualPayment, setSelectedVehicleForIndividualPayment] = useState<any>(null);
  const [selectedPaymentMonths, setSelectedPaymentMonths] = useState<number[]>([]);

  // Auto-select months with positive amounts when dialog opens
  useEffect(() => {
    if (individualPaymentDialogOpen && selectedVehicleForIndividualPayment && selectedPaymentType) {
      let breakdown;
      if (selectedPaymentType === 'gst') {
        breakdown = getGSTBreakdown(selectedVehicleForIndividualPayment);
      } else if (selectedPaymentType === 'service_charge') {
        breakdown = getServiceChargeBreakdown(selectedVehicleForIndividualPayment);
      } else if (selectedPaymentType === 'partner_share') {
        breakdown = getPartnerShareBreakdown(selectedVehicleForIndividualPayment);
      } else if (selectedPaymentType === 'owner_payment') {
        breakdown = getOwnerShareBreakdown(selectedVehicleForIndividualPayment);
      }

      const positiveMonthIndices = breakdown
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.amount > 0)
        .map(({ index }) => {
          const quarterMonths = { 'Q1': [0,1,2], 'Q2': [3,4,5], 'Q3': [6,7,8], 'Q4': [9,10,11] };
          const months = companyFinancialData.filterType === 'quarterly' 
            ? quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths]
            : Array.from({length: 12}, (_, i) => i);
          return months[index];
        });

      setSelectedPaymentMonths(positiveMonthIndices);
    } else if (!individualPaymentDialogOpen) {
      setSelectedPaymentMonths([]);
    }
  }, [individualPaymentDialogOpen, selectedVehicleForIndividualPayment, selectedPaymentType]);

  // Auto-select months with positive amounts when bulk dialog opens
  useEffect(() => {
    if (bulkDialogOpen && bulkDialogItems.length > 0) {
      const newSelectedMonths: Record<string, number[]> = {};
      bulkDialogItems.forEach(item => {
        if (item.monthBreakdown) {
          const positiveIndices = item.monthBreakdown
            .map((_, index) => index)
            .filter(index => item.monthBreakdown[index].amount > 0);
          newSelectedMonths[item.vehicleId] = positiveIndices;
        }
      });
      setSelectedMonths(newSelectedMonths);
    } else if (!bulkDialogOpen) {
      setSelectedMonths({});
    }
  }, [bulkDialogOpen, bulkDialogItems]);

  // Handler for individual payment confirmation
  const handleIndividualPaymentConfirm = async () => {
    if (!selectedVehicleForIndividualPayment || !selectedPaymentType || selectedPaymentMonths.length === 0) return;

    setIsBulkProcessing(true);
    try {
      let newTransactions: AccountingTransaction[] = [];

      if (selectedPaymentType === 'gst') {
        newTransactions = await collectGstPaymentTransactions(selectedVehicleForIndividualPayment, selectedPaymentMonths);
      } else if (selectedPaymentType === 'service_charge') {
        newTransactions = await collectServiceChargeTransactions(selectedVehicleForIndividualPayment, selectedPaymentMonths);
      } else if (selectedPaymentType === 'partner_share') {
        await handlePartnerPayment(selectedVehicleForIndividualPayment, selectedPaymentMonths);
        setIndividualPaymentDialogOpen(false);
        setSelectedPaymentType(null);
        setSelectedVehicleForIndividualPayment(null);
        setSelectedPaymentMonths([]);
        return;
      } else if (selectedPaymentType === 'owner_payment') {
        await handleOwnerPayment(selectedVehicleForIndividualPayment, selectedPaymentMonths);
        setIndividualPaymentDialogOpen(false);
        setSelectedPaymentType(null);
        setSelectedVehicleForIndividualPayment(null);
        setSelectedPaymentMonths([]);
        return;
      }

      // Update state
      if (newTransactions.length > 0) {
        setAccountingTransactions([...accountingTransactions, ...newTransactions]);
      }

      setIndividualPaymentDialogOpen(false);
      setSelectedPaymentType(null);
      setSelectedVehicleForIndividualPayment(null);
      setSelectedPaymentMonths([]);

      toast({
        title: 'Payment Successful',
        description: `${selectedPaymentType.replace('_', ' ').toUpperCase()} payment completed for selected months.`,
      });
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Utility function for currency formatting
  const formatCurrency = (value?: number | null) => (value ?? 0).toLocaleString();

  const dueEmiDetails = useMemo(() => {
    if (!selectedVehicleForEMI?.loanDetails?.amortizationSchedule) {
      return [] as Array<{ index: number; emi: any; dueDate: Date; daysDiff: number }>;
    }

    const schedule = selectedVehicleForEMI.loanDetails.amortizationSchedule;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    return schedule
      .map((emi: any, index: number) => {
        const dueDate = new Date(emi.dueDate);
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const canPayNow = dueDate <= threeDaysFromNow || daysDiff < 0;

        if (emi.isPaid || !canPayNow) {
          return null;
        }

        return { index, emi, dueDate, daysDiff };
      })
      .filter((detail): detail is { index: number; emi: any; dueDate: Date; daysDiff: number } => detail !== null);
  }, [selectedVehicleForEMI]);

  const orderedDueEmiIndices = useMemo(() => dueEmiDetails.map(detail => detail.index), [dueEmiDetails]);

  useEffect(() => {
    if (!emiDialogOpen) {
      setSelectedEmiIndices([]);
      setEmiPenalties({});
      return;
    }

    if (orderedDueEmiIndices.length === 0) {
      setSelectedEmiIndices([]);
      return;
    }

    setSelectedEmiIndices(prev => (prev.length > 0 ? prev : [...orderedDueEmiIndices]));
  }, [emiDialogOpen, orderedDueEmiIndices]);

  useEffect(() => {
    setSelectedEmiIndices(prev => {
      const filtered = prev.filter(index => orderedDueEmiIndices.includes(index));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [orderedDueEmiIndices]);

  useEffect(() => {
    setEmiPenalties(prev => {
      if (!prev || Object.keys(prev).length === 0) {
        return prev;
      }

      const updated: Record<number, string> = {};
      let changed = false;

      Object.keys(prev).forEach(key => {
        const numericKey = Number(key);
        if (orderedDueEmiIndices.includes(numericKey)) {
          updated[numericKey] = prev[numericKey];
        } else {
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [orderedDueEmiIndices]);

  const deriveSequentialSelection = (
    targetIndex: number,
    orderedIndices: number[],
    currentSelection: number[]
  ) => {
    const position = orderedIndices.indexOf(targetIndex);
    if (position === -1) {
      return currentSelection;
    }

    const isSelected = currentSelection.includes(targetIndex);
    const nextSelection = isSelected
      ? orderedIndices.slice(0, position)
      : orderedIndices.slice(0, position + 1);

    if (
      nextSelection.length === currentSelection.length &&
      nextSelection.every((value, index) => value === currentSelection[index])
    ) {
      return currentSelection;
    }

    return nextSelection;
  };

  const handleToggleEmiSelection = (emiIndex: number) => {
    const orderedIndices = orderedDueEmiIndices;

    setSelectedEmiIndices(prevSelection => {
      const nextSelection = deriveSequentialSelection(emiIndex, orderedIndices, prevSelection);

      if (nextSelection === prevSelection) {
        return prevSelection;
      }

      if (nextSelection.length < prevSelection.length) {
        setEmiPenalties(prevPenalties => {
          if (!prevPenalties || Object.keys(prevPenalties).length === 0) {
            return prevPenalties;
          }

          const updated: Record<number, string> = { ...prevPenalties };
          prevSelection.forEach(index => {
            if (!nextSelection.includes(index)) {
              delete updated[index];
            }
          });
          return updated;
        });
      }

      return nextSelection;
    });
  };

  const handleSelectAllEmis = () => {
    if (orderedDueEmiIndices.length === 0) {
      setSelectedEmiIndices([]);
      return;
    }
    setSelectedEmiIndices([...orderedDueEmiIndices]);
  };

  const selectedCount = selectedEmiIndices.length;

  // Function to navigate to vehicle details payments tab with current period criteria
  const handleViewExpenses = (vehicleId: string) => {
    const params = new URLSearchParams({
      tab: 'payments',
      period: companyFinancialData.filterType,
      year: companyFinancialData.selectedYear
    });

    if (companyFinancialData.filterType === 'monthly' && companyFinancialData.selectedMonth) {
      params.set('month', companyFinancialData.selectedMonth);
    } else if (companyFinancialData.filterType === 'quarterly' && companyFinancialData.selectedQuarter) {
      params.set('quarter', companyFinancialData.selectedQuarter);
    }

    navigate(`/vehicles/${vehicleId}?${params.toString()}`);
  };

  // Load cash balances for all vehicles
  useEffect(() => {
    if (!userInfo?.companyId) return;

    const loadCashBalances = async () => {
      const balances: Record<string, number> = {};

      for (const vehicle of vehicles) {
        try {
          const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicle.id);
          // Use a one-time read for initial load
          const cashDoc = await new Promise<any>((resolve) => {
            const unsubscribe = onSnapshot(cashRef, (doc) => {
              resolve(doc);
              unsubscribe(); // Clean up immediately
            });
          });

          balances[vehicle.id] = cashDoc.exists() ? cashDoc.data().balance || 0 : 0;
        } catch (error) {
          balances[vehicle.id] = 0;
        }
      }

      setVehicleCashBalances(balances);
    };

    loadCashBalances();
  }, [userInfo?.companyId, vehicles]);

  // Handle GST payment
  const handleGstPayment = async (vehicleInfo: any, selectedMonths?: number[]) => {
    // For quarterly/yearly views without selected months, open month selection dialog
    if ((companyFinancialData.filterType === 'quarterly' || companyFinancialData.filterType === 'yearly') && !selectedMonths) {
      setSelectedPaymentType('gst');
      setSelectedVehicleForIndividualPayment(vehicleInfo);
      setSelectedPaymentMonths([]);
      setIndividualPaymentDialogOpen(true);
      return;
    }

    try {
      const newTransactions = await collectGstPaymentTransactions(vehicleInfo, selectedMonths);
      setAccountingTransactions([...accountingTransactions, ...newTransactions]);

      const paymentAmount = newTransactions.reduce((sum, t) => sum + t.amount, 0);
      toast({
        title: 'GST Payment Successful',
        description: `₹${paymentAmount.toLocaleString()} GST paid for ${vehicleInfo.vehicle.registrationNumber}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record GST payment',
        variant: 'destructive'
      });
    }
  };

  // Handle service charge collection
  const handleServiceChargePayment = async (vehicleInfo: any, selectedMonths?: number[]) => {
    // For quarterly/yearly views without selected months, open month selection dialog
    if ((companyFinancialData.filterType === 'quarterly' || companyFinancialData.filterType === 'yearly') && !selectedMonths) {
      setSelectedPaymentType('service_charge');
      setSelectedVehicleForIndividualPayment(vehicleInfo);
      setSelectedPaymentMonths([]);
      setIndividualPaymentDialogOpen(true);
      return;
    }

    try {
      const newTransactions = await collectServiceChargeTransactions(vehicleInfo, selectedMonths);
      setAccountingTransactions([...accountingTransactions, ...newTransactions]);

      const paymentAmount = newTransactions.reduce((sum, t) => sum + t.amount, 0);
      toast({
        title: 'Service Charge Collected',
        description: `₹${paymentAmount.toLocaleString()} service charge collected for ${vehicleInfo.vehicle.registrationNumber}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to collect service charge',
        variant: 'destructive'
      });
    }
  };

  // Handle partner payment
  const handlePartnerPayment = async (vehicleInfo: any, selectedMonths?: number[]) => {
    // For quarterly/yearly views without selected months, open month selection dialog
    if ((companyFinancialData.filterType === 'quarterly' || companyFinancialData.filterType === 'yearly') && !selectedMonths) {
      setSelectedPaymentType('partner_share');
      setSelectedVehicleForIndividualPayment(vehicleInfo);
      setSelectedPaymentMonths([]);
      setIndividualPaymentDialogOpen(true);
      return;
    }

    try {
      const year = parseInt(companyFinancialData.selectedYear);
      const monthsInPeriod = companyFinancialData.filterType === 'quarterly' ? 3 : companyFinancialData.filterType === 'yearly' ? 12 : 1;

      // Generate period strings based on filter type or selected months
      let periodStrings: string[] = [];
      let paymentAmount: number;

      if (selectedMonths && selectedMonths.length > 0) {
        // Bulk payment - use actual amounts for selected months
        const breakdown = getPartnerShareBreakdown(vehicleInfo);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        periodStrings = selectedMonths.map(monthIndex => `${year}-${String(monthIndex + 1).padStart(2, '0')}`);
        paymentAmount = selectedMonths.reduce((sum, monthIndex) => {
          const monthName = monthNames[monthIndex];
          const breakdownItem = breakdown.find(b => b.month === monthName);
          return sum + (breakdownItem?.amount || 0);
        }, 0);
      } else {
        // Individual payment - use entire period
        if (companyFinancialData.filterType === 'monthly') {
          periodStrings = [`${year}-${companyFinancialData.selectedMonth}`];
        } else if (companyFinancialData.filterType === 'quarterly') {
          const quarterMonths = {
            'Q1': ['01', '02', '03'],
            'Q2': ['04', '05', '06'],
            'Q3': ['07', '08', '09'],
            'Q4': ['10', '11', '12']
          };
          periodStrings = quarterMonths[companyFinancialData.selectedQuarter].map(m => `${year}-${m}`);
        } else {
          periodStrings = Array.from({length: 12}, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
        }
        paymentAmount = vehicleInfo.partnerShare;
      }

      const paymentDescription = `Partner Payment for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;

      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      const newTransactions: AccountingTransaction[] = [];

      // Create transactions for all months in the period
      for (let i = 0; i < periodStrings.length; i++) {
        const monthStr = periodStrings[i];
        let amount: number;
        
        if (selectedMonths && selectedMonths.length > 0) {
          // Use actual amount for this month
          const monthIndex = selectedMonths[i];
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthName = monthNames[monthIndex];
          const breakdown = getPartnerShareBreakdown(vehicleInfo);
          const breakdownItem = breakdown.find(b => b.month === monthName);
          amount = breakdownItem?.amount || 0;
        } else {
          // Divide equally for full period payments
          amount = paymentAmount / periodStrings.length;
        }
        
        const docRef = await addDoc(transactionRef, {
          vehicleId: vehicleInfo.vehicle.id,
          type: 'partner_payment',
          amount: amount,
          month: monthStr,
          description: paymentDescription,
          status: 'completed',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });
        newTransactions.push({
          id: docRef.id,
          vehicleId: vehicleInfo.vehicle.id,
          type: 'partner_payment',
          amount: amount,
          month: monthStr,
          description: paymentDescription,
          status: 'completed',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });
      }

      // Update local accounting transactions state
      if (newTransactions.length > 0) {
        setAccountingTransactions([...accountingTransactions, ...newTransactions]);
      }

      // Update cash in hand
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
      const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
      await setDoc(cashRef, {
        balance: increment(-paymentAmount)
      }, { merge: true });

      // Update company-level cash balance
      const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
      await setDoc(companyCashRef, {
        balance: increment(-paymentAmount),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Update local state
      setVehicleCashBalances(prev => ({
        ...prev,
        [vehicleInfo.vehicle.id]: (prev[vehicleInfo.vehicle.id] || 0) - paymentAmount
      }));

      toast({
        title: 'Partner Paid Successfully',
        description: `₹${paymentAmount.toLocaleString()} paid to partner for ${vehicleInfo.vehicle.registrationNumber}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record partner payment',
        variant: 'destructive'
      });
    }
  };

  // Handle owner payment (consolidated for both partner and company vehicles)
  const handleOwnerPayment = async (vehicleInfo: any, selectedMonths?: number[]) => {
    // For quarterly/yearly views without selected months, open month selection dialog
    if ((companyFinancialData.filterType === 'quarterly' || companyFinancialData.filterType === 'yearly') && !selectedMonths) {
      setSelectedPaymentType('owner_payment');
      setSelectedVehicleForIndividualPayment(vehicleInfo);
      setSelectedPaymentMonths([]);
      setIndividualPaymentDialogOpen(true);
      return;
    }

    try {
      const year = parseInt(companyFinancialData.selectedYear);
      const monthsInPeriod = companyFinancialData.filterType === 'quarterly' ? 3 : companyFinancialData.filterType === 'yearly' ? 12 : 1;

      // Generate period strings based on filter type or selected months
      let periodStrings: string[] = [];
      let paymentAmount: number;

      if (selectedMonths && selectedMonths.length > 0) {
        // Bulk payment - use actual amounts for selected months
        const breakdown = getOwnerShareBreakdown(vehicleInfo);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        periodStrings = selectedMonths.map(monthIndex => `${year}-${String(monthIndex + 1).padStart(2, '0')}`);
        paymentAmount = selectedMonths.reduce((sum, monthIndex) => {
          const monthName = monthNames[monthIndex];
          const breakdownItem = breakdown.find(b => b.month === monthName);
          return sum + (breakdownItem?.amount || 0);
        }, 0);
      } else {
        // Individual payment - use entire period
        if (companyFinancialData.filterType === 'monthly') {
          periodStrings = [`${year}-${companyFinancialData.selectedMonth}`];
        } else if (companyFinancialData.filterType === 'quarterly') {
          const quarterMonths = {
            'Q1': ['01', '02', '03'],
            'Q2': ['04', '05', '06'],
            'Q3': ['07', '08', '09'],
            'Q4': ['10', '11', '12']
          };
          periodStrings = quarterMonths[companyFinancialData.selectedQuarter].map(m => `${year}-${m}`);
        } else {
          periodStrings = Array.from({length: 12}, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
        }
        paymentAmount = vehicleInfo.ownerActuallyPayable;
      }

      const paymentDescription = `Owner Payment for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;

      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      const newTransactions: AccountingTransaction[] = [];

      // Create transactions for all months in the period
      for (let i = 0; i < periodStrings.length; i++) {
        const monthStr = periodStrings[i];
        let amount: number;
        
        if (selectedMonths && selectedMonths.length > 0) {
          // Use actual amount for this month
          const monthIndex = selectedMonths[i];
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthName = monthNames[monthIndex];
          const breakdown = getOwnerShareBreakdown(vehicleInfo);
          const breakdownItem = breakdown.find(b => b.month === monthName);
          amount = breakdownItem?.amount || 0;
        } else {
          // Divide equally for full period payments
          amount = paymentAmount / periodStrings.length;
        }
        
        const docRef = await addDoc(transactionRef, {
          vehicleId: vehicleInfo.vehicle.id,
          type: 'owner_payment',
          amount: amount,
          month: monthStr,
          description: paymentDescription,
          status: 'completed',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });
        newTransactions.push({
          id: docRef.id,
          vehicleId: vehicleInfo.vehicle.id,
          type: 'owner_payment',
          amount: amount,
          month: monthStr,
          description: paymentDescription,
          status: 'completed',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });
      }

      // Update local accounting transactions state
      if (newTransactions.length > 0) {
        setAccountingTransactions([...accountingTransactions, ...newTransactions]);
      }

      // Update cash in hand
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
      const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
      await setDoc(cashRef, {
        balance: increment(-paymentAmount)
      }, { merge: true });

      // Update company-level cash balance
      const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
      await setDoc(companyCashRef, {
        balance: increment(-paymentAmount),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Update local state
      setVehicleCashBalances(prev => ({
        ...prev,
        [vehicleInfo.vehicle.id]: (prev[vehicleInfo.vehicle.id] || 0) - paymentAmount
      }));

      toast({
        title: 'Owner Payment Completed',
        description: `₹${paymentAmount.toLocaleString()} paid to owner for ${vehicleInfo.vehicle.registrationNumber}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process owner payment',
        variant: 'destructive'
      });
    }
  };

  // Backdoor function to increase vehicle cash in hand (for testing only)
  const handleBackdoorCashIncrease = async () => {
    if (!selectedVehicleForBackdoor || !backdoorAmount) return;

    const amount = parseFloat(backdoorAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessingBackdoor(true);
    try {
      // Update vehicle cash in hand - INCREASE
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, selectedVehicleForBackdoor);
      await setDoc(cashRef, {
        balance: increment(amount)
      }, { merge: true });

      // Update company-level cash balance
      const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
      await setDoc(companyCashRef, {
        balance: increment(amount),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Update local state
      setVehicleCashBalances(prev => ({
        ...prev,
        [selectedVehicleForBackdoor]: (prev[selectedVehicleForBackdoor] || 0) + amount
      }));

      // Reset form
      setSelectedVehicleForBackdoor('');
      setBackdoorAmount('');
      setBackdoorDialogOpen(false);

      toast({
        title: 'Cash Increased (Testing)',
        description: `₹${amount.toLocaleString()} added to vehicle cash in hand`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to increase cash',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingBackdoor(false);
    }
  };

  // Penalty dialog handlers
  const handlePenaltyConfirm = async () => {
    if (!selectedEMIForPenalty) return;
    
    const penalty = parseFloat(penaltyAmount) || 0;
    setPenaltyDialogOpen(false);
    
    await handleEMIPayment(selectedEMIForPenalty.vehicle, selectedEMIForPenalty.monthIndex, penalty);
    
    setPenaltyAmount('0');
    setSelectedEMIForPenalty(null);
  };

  // Bulk EMI payment handler
  const handleBulkRentCollection = async (vehicleInfo: any, item: any) => {
    const assignment = vehicleInfo.assignment || vehicleInfo.currentAssignment;
    if (!item.overdueWeeks || !assignment) return;

    for (const week of item.overdueWeeks) {
      const weekStartDate = new Date(week.weekStartDate);
      await markRentCollected(week.weekIndex, assignment, weekStartDate, false);
      // Small delay between rent collections
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const handleBulkEmiPayment = async (vehicleInfo: any, item: any, emiPenalties?: Record<string, Record<number, string>>) => {
    const vehiclePenalties = emiPenalties?.[item.vehicleId] || {};
    
    for (const emi of item.overdueEMIs) {
      const penalty = parseFloat(vehiclePenalties[emi.monthIndex] || '0') || 0;
      await handleEMIPayment(vehicleInfo.vehicle, emi.monthIndex, penalty);
      // Small delay between EMI payments
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  // Bulk payment functions
  const openBulkPaymentDialog = (type: 'gst' | 'service_charge' | 'partner_share' | 'owner_payment' | 'emi' | 'rent') => {
    const { periodData } = getPeriodData();
    let items: any[] = [];
    let title = '';
    let description = '';

    switch (type) {
      case 'rent':
        title = `Bulk Rent Collection - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;
        description = `Collect overdue rent for all vehicles with active assignments. Oldest rent weeks will be settled first for each vehicle.`;
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
        break;

      case 'gst':
        title = `Bulk GST Payment - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;
        description = `Pay GST for all vehicles in the selected period. You can deselect vehicles that should not have GST paid.`;
        items = periodData
          .filter(vehicle => vehicle.gstAmount > 0 && !vehicle.gstPaid)
          .map(vehicle => ({
            vehicleId: vehicle.vehicle.id,
            vehicleName: vehicle.vehicle.registrationNumber,
            amount: vehicle.gstAmount,
            monthBreakdown: getGSTBreakdown(vehicle),
            checked: true
          }));
        break;

      case 'service_charge':
        title = `Bulk Service Charge Collection - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;
        description = `Collect service charges from all partner vehicles in the selected period. You can deselect vehicles that should not have service charges collected.`;
        items = periodData
          .filter(vehicle => vehicle.serviceCharge > 0 && vehicle.vehicle.isPartnership === true && !vehicle.serviceChargeCollected)
          .map(vehicle => ({
            vehicleId: vehicle.vehicle.id,
            vehicleName: vehicle.vehicle.registrationNumber,
            amount: vehicle.serviceCharge,
            monthBreakdown: getServiceChargeBreakdown(vehicle),
            checked: true
          }));
        break;

      case 'partner_share':
        title = `Bulk Partner Share Payment - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;
        description = `Pay partner shares for all partner vehicles in the selected period. You can deselect vehicles that should not have partner shares paid.`;
        items = periodData
          .filter(vehicle => vehicle.partnerShare > 0 && vehicle.vehicle.isPartnership === true && !vehicle.partnerPaid)
          .map(vehicle => ({
            vehicleId: vehicle.vehicle.id,
            vehicleName: vehicle.vehicle.registrationNumber,
            amount: vehicle.partnerShare,
            monthBreakdown: getPartnerShareBreakdown(vehicle),
            checked: true
          }));
        break;

      case 'owner_payment':
        title = `Bulk Owner Payment - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;
        description = `Pay owner payments for all vehicles in the selected period. You can deselect vehicles that should not have owner payments paid.`;
        items = periodData
          .filter(vehicle => vehicle.ownerPayment > 0 && !vehicle.ownerPaid)
          .map(vehicle => ({
            vehicleId: vehicle.vehicle.id,
            vehicleName: vehicle.vehicle.registrationNumber,
            amount: vehicle.ownerPayment,
            monthBreakdown: getOwnerShareBreakdown(vehicle),
            checked: true
          }));
        break;

      case 'emi':
        title = `Bulk EMI Payment - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;
        description = `Pay overdue EMIs for all vehicles. You can deselect vehicles or modify penalty amounts for each EMI.`;
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
        break;
    }

    setBulkDialogType(type);
    setBulkDialogItems(items);
    setBulkDialogTitle(title);
    setBulkDialogDescription(description);
    setBulkDialogOpen(true);
  };

  // Helper functions for period breakdowns (quarterly/yearly)
  const getGSTBreakdown = (vehicleInfo: any) => {
    const year = parseInt(companyFinancialData.selectedYear);
    let months: number[];

    if (companyFinancialData.filterType === 'monthly') {
      const monthIndex = new Date(`${companyFinancialData.selectedMonth} 1, ${year}`).getMonth();
      months = [monthIndex];
    } else if (companyFinancialData.filterType === 'quarterly') {
      const quarterMonths = {
        'Q1': [0, 1, 2], // Jan, Feb, Mar
        'Q2': [3, 4, 5], // Apr, May, Jun
        'Q3': [6, 7, 8], // Jul, Aug, Sep
        'Q4': [9, 10, 11] // Oct, Nov, Dec
      };
      months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];
    } else {
      // yearly - all 12 months
      months = Array.from({length: 12}, (_, i) => i);
    }

    return months.map(monthIndex => {
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

      // Calculate GST for this specific month
      const monthPayments = (companyFinancialData.payments || []).filter((p: any) =>
        p.vehicleId === vehicleInfo.vehicle.id &&
        p.status === 'paid' &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
      );

      const monthExpenses = (companyFinancialData.expenses || []).filter((e: any) =>
        e.vehicleId === vehicleInfo.vehicle.id &&
        e.status === 'approved' &&
        new Date(e.createdAt) >= monthStart &&
        new Date(e.createdAt) <= monthEnd
      );

      const monthEarnings = monthPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
      const monthExpensesAmount = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const monthProfit = monthEarnings - monthExpensesAmount;
      const monthGst = monthProfit > 0 ? monthProfit * 0.04 : 0;

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: monthNames[monthIndex],
        amount: monthGst
      };
    });
  };

  const getServiceChargeBreakdown = (vehicleInfo: any) => {
    const year = parseInt(companyFinancialData.selectedYear);
    let months: number[];

    if (companyFinancialData.filterType === 'monthly') {
      const monthIndex = new Date(`${companyFinancialData.selectedMonth} 1, ${year}`).getMonth();
      months = [monthIndex];
    } else if (companyFinancialData.filterType === 'quarterly') {
      const quarterMonths = {
        'Q1': [0, 1, 2], // Jan, Feb, Mar
        'Q2': [3, 4, 5], // Apr, May, Jun
        'Q3': [6, 7, 8], // Jul, Aug, Sep
        'Q4': [9, 10, 11] // Oct, Nov, Dec
      };
      months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];
    } else {
      // yearly - all 12 months
      months = Array.from({length: 12}, (_, i) => i);
    }

    return months.map(monthIndex => {
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

      // Calculate service charge for this specific month
      const monthPayments = (companyFinancialData.payments || []).filter((p: any) =>
        p.vehicleId === vehicleInfo.vehicle.id &&
        p.status === 'paid' &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
      );

      const monthExpenses = (companyFinancialData.expenses || []).filter((e: any) =>
        e.vehicleId === vehicleInfo.vehicle.id &&
        e.status === 'approved' &&
        new Date(e.createdAt) >= monthStart &&
        new Date(e.createdAt) <= monthEnd
      );

      const monthEarnings = monthPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
      const monthExpensesAmount = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const monthProfit = monthEarnings - monthExpensesAmount;

      const isPartnerTaxi = vehicleInfo.vehicle.isPartnership === true;
      const serviceChargeRate = (vehicleInfo.vehicle.serviceChargeRate || 10) / 100; // Convert percentage to decimal
      const monthServiceCharge = isPartnerTaxi && monthProfit > 0 ? monthProfit * serviceChargeRate : 0;

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: monthNames[monthIndex],
        amount: monthServiceCharge
      };
    });
  };

  const getPartnerShareBreakdown = (vehicleInfo: any) => {
    const year = parseInt(companyFinancialData.selectedYear);
    let months: number[];

    if (companyFinancialData.filterType === 'monthly') {
      const monthIndex = new Date(`${companyFinancialData.selectedMonth} 1, ${year}`).getMonth();
      months = [monthIndex];
    } else if (companyFinancialData.filterType === 'quarterly') {
      const quarterMonths = {
        'Q1': [0, 1, 2], // Jan, Feb, Mar
        'Q2': [3, 4, 5], // Apr, May, Jun
        'Q3': [6, 7, 8], // Jul, Aug, Sep
        'Q4': [9, 10, 11] // Oct, Nov, Dec
      };
      months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];
    } else {
      // yearly - all 12 months
      months = Array.from({length: 12}, (_, i) => i);
    }

    return months.map(monthIndex => {
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

      // Calculate partner share for this specific month
      const monthPayments = (companyFinancialData.payments || []).filter((p: any) =>
        p.vehicleId === vehicleInfo.vehicle.id &&
        p.status === 'paid' &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
      );

      const monthExpenses = (companyFinancialData.expenses || []).filter((e: any) =>
        e.vehicleId === vehicleInfo.vehicle.id &&
        e.status === 'approved' &&
        new Date(e.createdAt) >= monthStart &&
        new Date(e.createdAt) <= monthEnd
      );

      const monthEarnings = monthPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
      const monthExpensesAmount = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const monthProfit = monthEarnings - monthExpensesAmount;

      const gstAmount = monthProfit > 0 ? monthProfit * 0.04 : 0;
      const isPartnerTaxi = vehicleInfo.vehicle.isPartnership === true;
      const serviceChargeRate = (vehicleInfo.vehicle.serviceChargeRate || 10) / 100; // Convert percentage to decimal
      const serviceCharge = isPartnerTaxi && monthProfit > 0 ? monthProfit * serviceChargeRate : 0;

      const remainingProfitAfterDeductions = monthProfit - gstAmount - serviceCharge;
      const partnerSharePercentage = vehicleInfo.vehicle.partnershipPercentage ? vehicleInfo.vehicle.partnershipPercentage / 100 : 0.50;
      const monthPartnerShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
        remainingProfitAfterDeductions * partnerSharePercentage : 0;

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: monthNames[monthIndex],
        amount: monthPartnerShare
      };
    });
  };

  const getOwnerShareBreakdown = (vehicleInfo: any) => {
    const year = parseInt(companyFinancialData.selectedYear);
    let months: number[];

    if (companyFinancialData.filterType === 'monthly') {
      const monthIndex = new Date(`${companyFinancialData.selectedMonth} 1, ${year}`).getMonth();
      months = [monthIndex];
    } else if (companyFinancialData.filterType === 'quarterly') {
      const quarterMonths = {
        'Q1': [0, 1, 2], // Jan, Feb, Mar
        'Q2': [3, 4, 5], // Apr, May, Jun
        'Q3': [6, 7, 8], // Jul, Aug, Sep
        'Q4': [9, 10, 11] // Oct, Nov, Dec
      };
      months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];
    } else {
      // yearly - all 12 months
      months = Array.from({length: 12}, (_, i) => i);
    }

    return months.map(monthIndex => {
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

      // Calculate owner share for this specific month
      const monthPayments = (companyFinancialData.payments || []).filter((p: any) =>
        p.vehicleId === vehicleInfo.vehicle.id &&
        p.status === 'paid' &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
      );

      const monthExpenses = (companyFinancialData.expenses || []).filter((e: any) =>
        e.vehicleId === vehicleInfo.vehicle.id &&
        e.status === 'approved' &&
        new Date(e.createdAt) >= monthStart &&
        new Date(e.createdAt) <= monthEnd
      );

      const monthEarnings = monthPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
      const monthExpensesAmount = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const monthProfit = monthEarnings - monthExpensesAmount;

      const gstAmount = monthProfit > 0 ? monthProfit * 0.04 : 0;
      const isPartnerTaxi = vehicleInfo.vehicle.isPartnership === true;
      const serviceChargeRate = (vehicleInfo.vehicle.serviceChargeRate || 10) / 100; // Convert percentage to decimal
      const serviceCharge = isPartnerTaxi && monthProfit > 0 ? monthProfit * serviceChargeRate : 0;

      const remainingProfitAfterDeductions = monthProfit - gstAmount - serviceCharge;
      const partnerSharePercentage = vehicleInfo.vehicle.partnershipPercentage ? vehicleInfo.vehicle.partnershipPercentage / 100 : 0.50;
      const monthOwnerShare = remainingProfitAfterDeductions > 0 ?
        (isPartnerTaxi ? remainingProfitAfterDeductions * (1 - partnerSharePercentage) : remainingProfitAfterDeductions) : 0;

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: monthNames[monthIndex],
        amount: monthOwnerShare
      };
    });
  };

  // Rent summary calculation for overdue dialog (similar to EMI)
  const rentSummary = useMemo(() => {
    if (!selectedVehicleForRentOverdue?.assignedDriverId || !selectedVehicleForRentOverdue?.currentAssignment) {
      return {
        overdueWeeks: [] as Array<{ weekIndex: number; weekStartDate: Date; amount: number }>,
        currentWeekDue: null as { weekIndex: number; weekStartDate: Date; amount: number } | null,
        totalOverdue: 0,
        dueTodayAmount: 0,
        totalDue: 0
      };
    }

    // Filter payments for this vehicle (same as AccountsTab)
    const vehiclePayments = payments.filter((payment: any) => payment.vehicleId === selectedVehicleForRentOverdue.id);
    const startDateRaw = selectedVehicleForRentOverdue.currentAssignment.startDate;
    const assignmentStartDate = new Date(
      typeof startDateRaw === 'string'
        ? startDateRaw
        : startDateRaw?.toDate?.() || startDateRaw
    );

    const agreementEndDate = new Date(assignmentStartDate);
    agreementEndDate.setMonth(agreementEndDate.getMonth() + (selectedVehicleForRentOverdue.currentAssignment.agreementDuration || 12));
    const totalWeeks = Math.ceil((agreementEndDate.getTime() - assignmentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const today = new Date();

    const overdueWeeks: Array<{ weekIndex: number; weekStartDate: Date; amount: number }> = [];
    let currentWeekDue: { weekIndex: number; weekStartDate: Date; amount: number } | null = null;

    for (let weekIndex = 0; weekIndex < Math.min(totalWeeks, 52); weekIndex++) {
      const weekStartDate = new Date(assignmentStartDate);
      weekStartDate.setDate(weekStartDate.getDate() + (weekIndex * 7));
      weekStartDate.setHours(0, 0, 0, 0);

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);

      // Use same payment matching logic as AccountsTab
      const weekRentPayment = vehiclePayments.find((payment: any) => {
        if (payment.vehicleId !== selectedVehicleForRentOverdue.id || payment.status !== 'paid') return false;
        const paymentWeekStart = new Date(payment.weekStart);
        return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
      });

      if (weekRentPayment) continue;

      const isPastWeek = weekEndDate < today;
      const isCurrentWeek = weekStartDate <= today && today <= weekEndDate;

      if (isPastWeek) {
        overdueWeeks.push({
          weekIndex,
          weekStartDate,
          amount: selectedVehicleForRentOverdue.currentAssignment.weeklyRent
        });
      } else if (isCurrentWeek) {
        currentWeekDue = {
          weekIndex,
          weekStartDate,
          amount: selectedVehicleForRentOverdue.currentAssignment.weeklyRent
        };
      }
    }

    const totalOverdue = overdueWeeks.reduce((sum, week) => sum + week.amount, 0);
    const dueTodayAmount = currentWeekDue ? currentWeekDue.amount : 0;

    return {
      overdueWeeks,
      currentWeekDue,
      totalOverdue,
      dueTodayAmount,
      totalDue: totalOverdue + dueTodayAmount
    };
  }, [selectedVehicleForRentOverdue, payments]);

  const allDueWeeks = useMemo(() => {
    const combined = [...rentSummary.overdueWeeks];
    if (rentSummary.currentWeekDue) {
      combined.push(rentSummary.currentWeekDue);
    }
    return combined;
  }, [rentSummary.overdueWeeks, rentSummary.currentWeekDue]);

  const orderedRentWeekIndices = useMemo(() => allDueWeeks.map(week => week.weekIndex), [allDueWeeks]);

  const selectedRentWeeks = useMemo(() => {
    if (selectedRentWeekIndices.length === 0) {
      return [] as typeof allDueWeeks;
    }

    const selected = new Set(selectedRentWeekIndices);
    return allDueWeeks
      .filter(week => selected.has(week.weekIndex))
      .sort((a, b) => a.weekIndex - b.weekIndex);
  }, [allDueWeeks, selectedRentWeekIndices]);

  const selectedRentWeekCount = selectedRentWeeks.length;

  const selectedRentWeekTotal = useMemo(
    () => selectedRentWeeks.reduce((sum, week) => sum + week.amount, 0),
    [selectedRentWeeks]
  );

  // Rent selection handlers (similar to EMI)
  const handleToggleRentWeekSelection = (weekIndex: number) => {
    const orderedIndices = orderedRentWeekIndices;

    setSelectedRentWeekIndices(prevSelection =>
      deriveSequentialSelection(weekIndex, orderedIndices, prevSelection)
    );
  };

  const handleSelectAllRentWeeks = () => {
    if (orderedRentWeekIndices.length === 0) {
      setSelectedRentWeekIndices([]);
      return;
    }
    setSelectedRentWeekIndices([...orderedRentWeekIndices]);
  };

  // Rent bulk payment handler
  const handleRentBulkPayment = async () => {
    if (!selectedVehicleForRentOverdue?.currentAssignment) {
      toast({
        title: 'Error',
        description: 'No active assignment found for this vehicle.',
        variant: 'destructive'
      });
      return;
    }

    const weeksToProcess = allDueWeeks.filter(week => selectedRentWeekIndices.includes(week.weekIndex));

    if (weeksToProcess.length === 0) {
      toast({
        title: 'No Weeks Selected',
        description: 'Select at least one week to process the rent collection.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingRentOverdue(true);
    let successCount = 0;
    let totalAmount = 0;

    try {
      for (const week of weeksToProcess) {
        try {
          await markRentCollected(week.weekIndex, selectedVehicleForRentOverdue.currentAssignment, week.weekStartDate, false);
          successCount++;
          totalAmount += week.amount;

          toast({
            title: `Week ${week.weekIndex + 1} Rent Collected ✅`,
            description: `₹${week.amount.toLocaleString()} collected successfully.`
          });

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error processing week ${week.weekIndex + 1}:`, error);
          toast({
            title: `Error on Week ${week.weekIndex + 1}`,
            description: 'Failed to collect rent for this week.',
            variant: 'destructive'
          });
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Rent Collection Completed! 🎉',
          description: `Successfully collected rent for ${successCount} of ${weeksToProcess.length} selected weeks totaling ₹${totalAmount.toLocaleString()}.`
        });
      } else {
        throw new Error('No rent collections were processed successfully');
      }

      setRentDialogOpen(false);
      setSelectedVehicleForRentOverdue(null);
      setSelectedRentWeekIndices([]);
    } catch (error) {
      console.error('Error processing bulk rent collection:', error);
      toast({
        title: 'Rent Collection Failed',
        description: `Only ${successCount} collections were processed. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsProcessingRentOverdue(false);
    }
  };

  // Rent dialog state management (similar to EMI)
  useEffect(() => {
    if (!rentDialogOpen) {
      setSelectedRentWeekIndices([]);
      return;
    }

    if (orderedRentWeekIndices.length === 0) {
      setSelectedRentWeekIndices([]);
      return;
    }

    setSelectedRentWeekIndices(prev => (prev.length > 0 ? prev : [...orderedRentWeekIndices]));
  }, [rentDialogOpen, orderedRentWeekIndices]);

  useEffect(() => {
    setSelectedRentWeekIndices(prev => {
      const filtered = prev.filter(index => orderedRentWeekIndices.includes(index));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [orderedRentWeekIndices]);

  // Handle bulk payment confirmation
  const handleBulkPaymentConfirm = async (selectedItems: any[], emiPenalties?: Record<string, Record<number, string>>) => {
    if (selectedItems.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const { periodData } = getPeriodData();
      let totalAmount = 0;
      const allNewTransactions: AccountingTransaction[] = []; // Collect all transactions

      for (const item of selectedItems) {
        const vehicleInfo = periodData.find((v: any) => v.vehicle.id === item.vehicleId);
        if (!vehicleInfo) continue;

        let itemTotal = item.amount;
        if (bulkDialogType === 'emi' && item.overdueEMIs && emiPenalties) {
          const vehiclePenalties = emiPenalties[item.vehicleId] || {};
          item.overdueEMIs.forEach(emi => {
            const penalty = parseFloat(vehiclePenalties[emi.monthIndex] || '0') || 0;
            itemTotal += penalty;
          });
        }
        totalAmount += itemTotal;

        // Process payment based on type - collect transactions instead of updating state
        switch (bulkDialogType) {
          case 'rent':
            await handleBulkRentCollection(vehicleInfo, item);
            break;
          case 'gst':
            const gstTransactions = await collectGstPaymentTransactions(vehicleInfo, item.selectedMonthIndices || []);
            allNewTransactions.push(...gstTransactions);
            break;
          case 'service_charge':
            const serviceChargeTransactions = await collectServiceChargeTransactions(vehicleInfo, item.selectedMonthIndices || []);
            allNewTransactions.push(...serviceChargeTransactions);
            break;
          case 'partner_share':
            const partnerTransactions = await collectPartnerPaymentTransactions(vehicleInfo, item.selectedMonthIndices || []);
            allNewTransactions.push(...partnerTransactions);
            break;
          case 'owner_payment':
            const ownerTransactions = await collectOwnerPaymentTransactions(vehicleInfo, item.selectedMonthIndices || []);
            allNewTransactions.push(...ownerTransactions);
            break;
          case 'emi':
            await handleBulkEmiPayment(vehicleInfo, item, emiPenalties);
            break;
        }

        // Small delay to prevent overwhelming Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Single state update with all collected transactions
      if (allNewTransactions.length > 0) {
        setAccountingTransactions(prev => [...prev, ...allNewTransactions]);
      }

      toast({
        title: 'Bulk Payment Completed',
        description: `Successfully processed ${selectedItems.length} payments totaling ₹${totalAmount.toLocaleString()}`,
      });

      setBulkDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Bulk Payment Failed',
        description: 'Some payments may have failed. Please check individual vehicle cards.',
        variant: 'destructive'
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // EMI Payment Functions
  const markEMIPaid = async (vehicle: any, monthIndex: number, scheduleItem: any) => {
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

    // Check for overdue EMIs - always settle oldest first (like EMITab)
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

    // Handle overdue payments with penalty option (like VehicleDetails)
    if (daysPastDue > 0) {
      // Set up penalty dialog
      setSelectedEMIForPenalty({ 
        vehicle, 
        monthIndex, 
        scheduleItem, 
        dueDate: scheduleItem.dueDate,
        emiAmount: vehicle.loanDetails?.emiPerMonth || 0
      });
      setPenaltyAmount('');
      setPenaltyDialogOpen(true);
    } else {
      // Regular on-time payment - process directly
      await handleEMIPayment(vehicle, monthIndex, 0);
    }
  };

  const handleEMIPayment = async (vehicle: any, monthIndex: number, penalty: number = 0) => {
    try {
      if (!vehicle?.id) {
        throw new Error('Vehicle not found');
      }

      let latestLoanDetails = vehicle?.loanDetails;
      try {
        const vehicleRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/vehicles`, vehicle.id);
        const vehicleSnapshot = await getDoc(vehicleRef);
        if (vehicleSnapshot.exists()) {
          const latestData = vehicleSnapshot.data() as any;
          if (latestData.loanDetails) {
            latestLoanDetails = latestData.loanDetails;
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

      const updatedPaidInstallments = [...(latestLoanDetails.paidInstallments || [])];
      if (!updatedPaidInstallments.includes(paymentDate)) {
        updatedPaidInstallments.push(paymentDate);
      }

      // Update vehicle in Firestore
      const vehicleRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/vehicles`, vehicle.id);
      await updateDoc(vehicleRef, {
        loanDetails: {
          ...latestLoanDetails,
          amortizationSchedule: updatedSchedule,
          paidInstallments: updatedPaidInstallments
        }
      });

      if (vehicle?.loanDetails) {
        vehicle.loanDetails = {
          ...vehicle.loanDetails,
          amortizationSchedule: updatedSchedule,
          paidInstallments: updatedPaidInstallments
        };
      }

      const emiAmount = latestLoanDetails.emiPerMonth || 0;

      // Generate transaction timestamp for consistent createdAt across EMI and penalty
      const transactionTimestamp = new Date().toISOString();

      const expenseEntries: Array<{
        amount: number;
        description: string;
        type: 'paid' | 'general' | 'penalties';
        paymentType?: 'emi';
        dueDate?: string;
        createdAt: string;
      }> = [
        {
          amount: emiAmount,
          description: `EMI Payment - Month ${monthIndex + 1} (${new Date().toLocaleDateString()})`,
          type: 'paid',
          paymentType: 'emi',
          dueDate: targetEMI.dueDate,
          createdAt: transactionTimestamp
        }
      ];

      if (penalty > 0) {
        expenseEntries.push({
          amount: penalty,
          description: `EMI penalty for month ${monthIndex + 1} (${Math.ceil((new Date().getTime() - new Date(targetEMI.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days late)`,
          type: 'penalties',
          dueDate: targetEMI.dueDate, // Add dueDate for penalty linking
          createdAt: transactionTimestamp
        });
      }

      // Add expense entries
      await expenseEntries.reduce(
        (chain, entry) =>
          chain.then(() =>
            addExpense({
              vehicleId: vehicle.id,
              amount: entry.amount,
              description: entry.description,
              billUrl: '',
              submittedBy: 'owner',
              status: 'approved',
              approvedAt: new Date().toISOString(),
              adjustmentWeeks: 0,
              type: entry.type,
              paymentType: entry.paymentType,
              verifiedKm: 0,
              dueDate: entry.dueDate,
              createdAt: entry.createdAt
            })
          ),
        Promise.resolve()
      );

      const totalPaid = emiAmount + penalty;

      toast({
        title: penalty > 0 ? 'Overdue EMI Payment Recorded' : 'EMI Payment Recorded',
        description: penalty > 0
          ? `EMI for month ${monthIndex + 1} marked as paid:\n• EMI: ₹${emiAmount.toLocaleString()}\n• Penalty: ₹${penalty.toLocaleString()}\n• Total: ₹${totalPaid.toLocaleString()}`
          : `EMI for month ${monthIndex + 1} (₹${emiAmount.toLocaleString()}) has been marked as paid.`,
      });

    } catch (error) {
      console.error('Error updating EMI payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record EMI payment. Please try again.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const openEMIDialog = (vehicle: any) => {
    setSelectedVehicleForEMI(vehicle);
    setSelectedEmiIndices([]);
    setEmiPenalties({});
    setEmiDialogOpen(true);
  };

  const openRentDialog = (vehicleContext: any) => {
    if (!vehicleContext) {
      return;
    }

    const vehicle = vehicleContext.vehicle || vehicleContext;
    const currentAssignment = vehicleContext.currentAssignment || vehicleContext.assignment || vehicle.currentAssignment || null;

    setSelectedVehicleForRentOverdue(
      currentAssignment
        ? {
            ...vehicle,
            currentAssignment
          }
        : vehicle
    );

    setSelectedRentWeekIndices([]);
    setRentDialogOpen(true);
  };

  const handleEMIBulkPayment = async () => {
    if (!selectedVehicleForEMI?.loanDetails?.amortizationSchedule) {
      toast({
        title: 'Error',
        description: 'Bulk payment functionality not available.',
        variant: 'destructive'
      });
      return;
    }

    const emisToProcess = selectedVehicleForEMI.loanDetails.amortizationSchedule.filter((_, index) => selectedEmiIndices.includes(index));

    if (emisToProcess.length === 0) {
      toast({
        title: 'No EMIs Selected',
        description: 'Select at least one EMI in sequence to process the payment.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingEMI(true);
    let successCount = 0;
    let totalAmount = 0;

    try {
      for (const emiIndex of selectedEmiIndices) {
        const penalty = parseFloat(emiPenalties[emiIndex] || '0');

        try {
          await handleEMIPayment(selectedVehicleForEMI, emiIndex, penalty);
          successCount++;
          totalAmount += (selectedVehicleForEMI.loanDetails?.emiPerMonth || 0) + penalty;

          toast({
            title: `EMI ${selectedVehicleForEMI.loanDetails?.amortizationSchedule[emiIndex]?.month} Paid ✅`,
            description: `₹${((selectedVehicleForEMI.loanDetails?.emiPerMonth || 0) + penalty).toLocaleString()} paid successfully.`
          });

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error processing EMI ${selectedVehicleForEMI.loanDetails?.amortizationSchedule[emiIndex]?.month}:`, error);
          toast({
            title: `Error on EMI ${selectedVehicleForEMI.loanDetails?.amortizationSchedule[emiIndex]?.month}`,
            description: 'Failed to process this EMI payment.',
            variant: 'destructive'
          });
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Bulk EMI Payment Completed! 🎉',
          description: `Successfully paid ${successCount} of ${emisToProcess.length} selected EMIs totaling ₹${totalAmount.toLocaleString()}.`
        });
      } else {
        throw new Error('No payments were processed successfully');
      }

      setEmiDialogOpen(false);
      setSelectedVehicleForEMI(null);
      setSelectedEmiIndices([]);
      setEmiPenalties({});
    } catch (error) {
      console.error('Error processing bulk EMI payment:', error);
      toast({
        title: 'Bulk Payment Failed',
        description: `Only ${successCount} payments were processed. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsProcessingEMI(false);
    }
  };

  // Helper function to get overdue weeks and current week due for a vehicle
  const getVehicleRentStatus = (vehicleId: string, assignment: any) => {
    if (!assignment) return { overdueWeeks: [], currentWeekDue: null, totalOverdue: 0, dueTodayAmount: 0, totalDue: 0 };

    const assignmentStartDate = new Date(
      typeof assignment.startDate === 'string'
        ? assignment.startDate
        : assignment.startDate?.toDate?.() || assignment.startDate
    );
    
    const agreementEndDate = new Date(assignmentStartDate);
    agreementEndDate.setMonth(agreementEndDate.getMonth() + (assignment.agreementDuration || 12));
    const totalWeeks = Math.ceil((agreementEndDate.getTime() - assignmentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueWeeks: Array<{ weekIndex: number; weekStartDate: Date; amount: number }> = [];
    let currentWeekDue: { weekIndex: number; weekStartDate: Date; amount: number } | null = null;

    for (let weekIndex = 0; weekIndex < Math.min(totalWeeks, 52); weekIndex++) {
      const weekStartDate = new Date(assignmentStartDate);
      weekStartDate.setDate(weekStartDate.getDate() + (weekIndex * 7));
      weekStartDate.setHours(0, 0, 0, 0);

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);

      // Check if paid
      const weekRentPayment = payments.find((payment: any) => {
        if (payment.vehicleId !== vehicleId || payment.status !== 'paid') return false;
        const paymentWeekStart = new Date(payment.weekStart || payment.collectionDate);
        return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
      });

      if (!weekRentPayment) {
        const isPastWeek = weekEndDate < today;
        const isCurrentWeek = weekStartDate <= today && today <= weekEndDate;

        if (isPastWeek) {
          overdueWeeks.push({
            weekIndex,
            weekStartDate,
            amount: assignment.weeklyRent
          });
        } else if (isCurrentWeek) {
          currentWeekDue = {
            weekIndex,
            weekStartDate,
            amount: assignment.weeklyRent
          };
        }
      }
    }

    const totalOverdue = overdueWeeks.reduce((sum, week) => sum + week.amount, 0);
    const dueTodayAmount = currentWeekDue ? currentWeekDue.amount : 0;
    const totalDue = totalOverdue + dueTodayAmount;

    return { overdueWeeks, currentWeekDue, totalOverdue, dueTodayAmount, totalDue };
  };

  // Handler for rent payment click - checks for overdue and shows confirmation
  const handleRentPaymentClick = (weekIndex: number, assignment: any, weekStartDate: Date) => {
    const rentStatus = getVehicleRentStatus(assignment.vehicleId, assignment);
    
    if (rentStatus.overdueWeeks.length > 0 && weekIndex !== rentStatus.overdueWeeks[0].weekIndex) {
      // There are overdue weeks and user is not clicking the oldest one
      setSelectedRentWeek({
        weekIndex: rentStatus.overdueWeeks[0].weekIndex,
        assignment,
        weekStartDate: rentStatus.overdueWeeks[0].weekStartDate,
        vehicleId: assignment.vehicleId,
        isBulkPayment: false,
        overdueWeeks: rentStatus.overdueWeeks
      });
      setConfirmRentPaymentDialog(true);
    } else {
      // Either no overdue or clicking the oldest one - proceed directly
      markRentCollected(weekIndex, assignment, weekStartDate);
    }
  };

  // Handler for bulk overdue payment
  const handlePayAllOverdueClick = (assignment: any, overdueWeeks: Array<{ weekIndex: number; weekStartDate: Date; amount: number }>) => {
    if (overdueWeeks.length === 0) return;
    
    setSelectedRentWeek({
      weekIndex: -1, // Special flag for bulk payment
      assignment,
      weekStartDate: overdueWeeks[0].weekStartDate,
      vehicleId: assignment.vehicleId,
      isBulkPayment: true,
      overdueWeeks
    });
    setConfirmRentPaymentDialog(true);
  };

  // Confirm rent payment (single oldest or bulk)
  const confirmRentPayment = async () => {
    if (!selectedRentWeek) return;

    setConfirmRentPaymentDialog(false);

    try {
      if (selectedRentWeek.isBulkPayment && selectedRentWeek.overdueWeeks) {
        // Process all overdue weeks sequentially
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let successCount = 0;
        let failCount = 0;
        
        for (const overdueWeek of selectedRentWeek.overdueWeeks) {
          try {
            await markRentCollected(
              overdueWeek.weekIndex,
              selectedRentWeek.assignment,
              overdueWeek.weekStartDate,
              false // Suppress individual toasts
            );
            successCount++;
            await delay(300); // Small delay between payments
          } catch (error) {
            console.error('Error processing week:', overdueWeek.weekIndex, error);
            failCount++;
          }
        }

        // Show summary toast only after all are processed
        if (successCount > 0 && failCount === 0) {
          toast({
            title: 'All Rent Collected Successfully! 🎉',
            description: `Successfully collected rent for ${successCount} week${successCount > 1 ? 's' : ''}.`,
          });
        } else if (successCount > 0 && failCount > 0) {
          toast({
            title: 'Partial Success',
            description: `Collected ${successCount} week${successCount > 1 ? 's' : ''}, but ${failCount} failed. Please check details.`,
            variant: 'default'
          });
        }
      } else {
        // Process single payment (oldest overdue) - show individual toast
        await markRentCollected(
          selectedRentWeek.weekIndex,
          selectedRentWeek.assignment,
          selectedRentWeek.weekStartDate,
          true
        );
      }
    } catch (error) {
      console.error('Error in confirmRentPayment:', error);
    } finally {
      setSelectedRentWeek(null);
    }
  };

  // Rent Collection Function
  const markRentCollected = async (weekIndex: number, assignment: any, weekStartDate: Date, showToast: boolean = true) => {
    // Prevent double-click processing
    if (isProcessingRentPayment === weekIndex) return;

    try {
      setIsProcessingRentPayment(weekIndex);

      if (!assignment || !assignment.driverId) {
        if (showToast) {
          toast({
            title: 'Error',
            description: 'No active assignment found for this vehicle.',
            variant: 'destructive'
          });
        }
        return;
      }

      // Get week start and end dates (already calculated and passed)
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);

      // Calculate assignment week number (1-based, starting from assignment start)
      const assignmentStartDate = new Date(assignment.startDate);
      const assignmentWeekNumber = Math.floor((weekStartDate.getTime() - assignmentStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

      // Check if this rent payment already exists
      const existingPayment = payments.find((payment: any) => {
        if (payment.vehicleId !== assignment.vehicleId || payment.status !== 'paid') return false;
        const paymentWeekStart = new Date(payment.weekStart || payment.collectionDate);
        // More precise matching - check if payment week matches this assignment week
        return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
      });

      if (existingPayment) {
        if (showToast) {
          toast({
            title: 'Already Collected',
            description: `Rent for week ${assignmentWeekNumber} has already been recorded on ${new Date(existingPayment.paidAt || existingPayment.createdAt).toLocaleDateString()}.`,
            variant: 'destructive'
          });
        }
        return;
      }

      if (!userInfo?.companyId) {
        if (showToast) {
          toast({
            title: 'Error',
            description: 'Company information not found.',
            variant: 'destructive'
          });
        }
        return;
      }

      // Create payment record in Firebase payments collection
      const paymentData = {
        assignmentId: assignment.id || '',
        vehicleId: assignment.vehicleId,
        driverId: assignment.driverId,
        weekStart: weekStartDate.toISOString().split('T')[0],
        weekNumber: assignmentWeekNumber, // Week number within assignment
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

      const vehicleId = assignment.vehicleId;

      // Update cash in hand - INCREASE when rent is collected
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await updateDoc(cashRef, {
        balance: increment(assignment.weeklyRent),
        updatedAt: new Date().toISOString()
      });

      // Keep local cash snapshot aligned since we are not listening to real-time changes here
      setVehicleCashBalances(prev => ({
        ...prev,
        [vehicleId]: (prev[vehicleId] || 0) + assignment.weeklyRent
      }));

      if (showToast) {
        toast({
          title: 'Rent Collected Successfully! 🎉',
          description: `Weekly rent of ₹${assignment.weeklyRent.toLocaleString()} for assignment week ${assignmentWeekNumber} (${weekStartDate.toLocaleDateString('en-IN')}) has been recorded and will reflect in earnings immediately.`,
        });
      }

    } catch (error) {
      console.error('Error recording rent payment:', error);
      if (showToast) {
        toast({
          title: 'Error',
          description: 'Failed to record rent payment. Please try again.',
          variant: 'destructive'
        });
      }
      throw error; // Re-throw to let caller handle it
    } finally {
      setIsProcessingRentPayment(null);
    }
  };

  // Calculate period-based data (yearly, quarterly, or monthly)
  const getPeriodData = () => {
    const year = parseInt(companyFinancialData.selectedYear);
    let months: number[] = [];

    // Determine which months to include based on period type
    if (companyFinancialData.filterType === 'yearly') {
      // All 12 months for yearly view
      months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    } else if (companyFinancialData.filterType === 'quarterly') {
      // Quarter months for quarterly view
      const quarterMonths = {
        'Q1': [0, 1, 2], // Jan, Feb, Mar
        'Q2': [3, 4, 5], // Apr, May, Jun
        'Q3': [6, 7, 8], // Jul, Aug, Sep
        'Q4': [9, 10, 11] // Oct, Nov, Dec
      };
      months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];
    } else if (companyFinancialData.filterType === 'monthly') {
      // Single month for monthly view
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.indexOf(companyFinancialData.monthName);
      if (monthIndex !== -1) {
        months = [monthIndex];
      }
    }

    // Filter vehicles based on partner filter
    const filteredVehicles = companyFinancialData.vehicleData.filter((vehicleInfo: any) => {
      if (companyFinancialData.partnerFilter === 'all') return true;
      if (companyFinancialData.partnerFilter === 'partner') {
        const isPartnerVehicle = vehicleInfo.vehicle.isPartnership === true;
        if (!isPartnerVehicle) return false;
        // If a specific partner is selected, filter by that partner
        if (companyFinancialData.selectedPartner && companyFinancialData.selectedPartner !== '') {
          return vehicleInfo.vehicle.partnerId === companyFinancialData.selectedPartner;
        }
        return true;
      }
      if (companyFinancialData.partnerFilter === 'company') return vehicleInfo.vehicle.isPartnership !== true;
      return true;
    });

    // Calculate cumulative data for the selected period
    const periodData = filteredVehicles.map((vehicleInfo: any) => {
      // Calculate allMonthsHaveGst - check if ALL months have positive profit (GST > 0)
      let allMonthsHaveGst = true;
      months.forEach(monthIndex => {
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

        // Get payments and expenses for this month
        const monthPayments = payments.filter((p: any) =>
          p.vehicleId === vehicleInfo.vehicle.id &&
          p.status === 'paid' &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
        ) || [];

        const monthExpenses = (companyFinancialData.expenses || []).filter((e: any) =>
          e.vehicleId === vehicleInfo.vehicle.id &&
          e.status === 'approved' &&
          new Date(e.createdAt) >= monthStart &&
          new Date(e.createdAt) <= monthEnd
        ) || [];

        const monthEarnings = monthPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
        const monthExpensesAmount = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
        const monthProfit = monthEarnings - monthExpensesAmount;

        // If any month has profit <= 0, GST = 0 for that month
        if (monthProfit <= 0) {
          allMonthsHaveGst = false;
        }
      });

      // Calculate allMonthsHavePartnerShare - check if ALL months have positive partner share
      let allMonthsHavePartnerShare = true;
      if (vehicleInfo.vehicle.isPartnership === true) {
        months.forEach(monthIndex => {
          const monthStart = new Date(year, monthIndex, 1);
          const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

          // Get payments and expenses for this month
          const monthPayments = payments.filter((p: any) =>
            p.vehicleId === vehicleInfo.vehicle.id &&
            p.status === 'paid' &&
            new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
            new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
          ) || [];

          const monthExpenses = (companyFinancialData.expenses || []).filter((e: any) =>
            e.vehicleId === vehicleInfo.vehicle.id &&
            e.status === 'approved' &&
            new Date(e.createdAt) >= monthStart &&
            new Date(e.createdAt) <= monthEnd
          ) || [];

          const monthEarnings = monthPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
          const monthExpensesAmount = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
          const monthProfit = monthEarnings - monthExpensesAmount;

          // Calculate monthly GST and service charge
          const monthlyGst = monthProfit > 0 ? monthProfit * 0.04 : 0;
          const serviceChargeRate = (vehicleInfo.vehicle.serviceChargeRate || 10) / 100;
          const monthlyServiceCharge = monthProfit > 0 ? monthProfit * serviceChargeRate : 0;

          // Net profit
          const netProfit = monthProfit > 0 ? monthProfit - monthlyGst - monthlyServiceCharge : 0;

          // Partner share
          const partnerSharePercentage = vehicleInfo.vehicle.partnershipPercentage ? vehicleInfo.vehicle.partnershipPercentage / 100 : 0.50;
          const monthlyPartnerShare = netProfit * partnerSharePercentage;

          // If any month has partner share <= 0, set flag to false
          if (monthlyPartnerShare <= 0) {
            allMonthsHavePartnerShare = false;
          }
        });
      } else {
        allMonthsHavePartnerShare = false; // Not a partner vehicle
      }

      // Calculate allMonthsHaveServiceCharge - check if ALL months have positive service charge
      let allMonthsHaveServiceCharge = true;
      if (vehicleInfo.vehicle.isPartnership === true) {
        months.forEach(monthIndex => {
          const monthStart = new Date(year, monthIndex, 1);
          const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

          // Get payments and expenses for this month
          const monthPayments = payments.filter((p: any) =>
            p.vehicleId === vehicleInfo.vehicle.id &&
            p.status === 'paid' &&
            new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
            new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
          ) || [];

          const monthExpenses = (companyFinancialData.expenses || []).filter((e: any) =>
            e.vehicleId === vehicleInfo.vehicle.id &&
            e.status === 'approved' &&
            new Date(e.createdAt) >= monthStart &&
            new Date(e.createdAt) <= monthEnd
          ) || [];

          const monthEarnings = monthPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
          const monthExpensesAmount = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
          const monthProfit = monthEarnings - monthExpensesAmount;

          // Service charge
          const serviceChargeRate = (vehicleInfo.vehicle.serviceChargeRate || 10) / 100;
          const monthlyServiceCharge = monthProfit > 0 ? monthProfit * serviceChargeRate : 0;

          // If any month has service charge <= 0, set flag to false
          if (monthlyServiceCharge <= 0) {
            allMonthsHaveServiceCharge = false;
          }
        });
      } else {
        allMonthsHaveServiceCharge = false; // Not a partner vehicle
      }

      // Calculate allMonthsHaveOwnerPayment - check if ALL months have positive owner payment
      let allMonthsHaveOwnerPayment = true;
      months.forEach(monthIndex => {
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

        // Get payments and expenses for this month
        const monthPayments = payments.filter((p: any) =>
          p.vehicleId === vehicleInfo.vehicle.id &&
          p.status === 'paid' &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
        ) || [];

        const monthExpenses = (companyFinancialData.expenses || []).filter((e: any) =>
          e.vehicleId === vehicleInfo.vehicle.id &&
          e.status === 'approved' &&
          new Date(e.createdAt) >= monthStart &&
          new Date(e.createdAt) <= monthEnd
        ) || [];

        const monthEarnings = monthPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
        const monthExpensesAmount = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
        const monthProfit = monthEarnings - monthExpensesAmount;

        // Calculate monthly GST and service charge
        const monthlyGst = monthProfit > 0 ? monthProfit * 0.04 : 0;
        const serviceChargeRate = (vehicleInfo.vehicle.serviceChargeRate || 10) / 100;
        const monthlyServiceCharge = monthProfit > 0 ? monthProfit * serviceChargeRate : 0;

        // Net profit
        const netProfit = monthProfit > 0 ? monthProfit - monthlyGst - monthlyServiceCharge : 0;

        // Owner payment
        let monthlyOwnerPayment = 0;
        if (vehicleInfo.vehicle.isPartnership === true) {
          const partnerSharePercentage = vehicleInfo.vehicle.partnershipPercentage ? vehicleInfo.vehicle.partnershipPercentage / 100 : 0.50;
          const monthlyPartnerShare = netProfit * partnerSharePercentage;
          monthlyOwnerPayment = netProfit - monthlyPartnerShare;
        } else {
          monthlyOwnerPayment = netProfit;
        }

        // If any month has owner payment <= 0, set flag to false
        if (monthlyOwnerPayment <= 0) {
          allMonthsHaveOwnerPayment = false;
        }
      });
      // Find current active assignment for this vehicle
      const currentAssignment = assignments.find((a: any) =>
        a.vehicleId === vehicleInfo.vehicle.id && a.status === 'active'
      );

      let cumulativeEarnings = 0;
      let cumulativeExpenses = 0;
      let cumulativeProfit = 0;
      let cumulativeGst = 0;
      let cumulativeServiceCharge = 0;
      let cumulativePartnerShare = 0;
      let cumulativeOwnerPayment = 0;
      let cumulativeRentCollected = 0;

      // Sum up data for each month in the period to get cumulative earnings and expenses
      months.forEach(monthIndex => {
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

        // Get payments and expenses for this month
        const monthPayments = payments.filter((p: any) =>
          p.vehicleId === vehicleInfo.vehicle.id &&
          p.status === 'paid' &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
        ) || [];

        const monthExpenses = (companyFinancialData.expenses || []).filter((e: any) =>
          e.vehicleId === vehicleInfo.vehicle.id &&
          e.status === 'approved' &&
          new Date(e.createdAt) >= monthStart &&
          new Date(e.createdAt) <= monthEnd
        ) || [];

        const monthEarnings = monthPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
        const monthExpensesAmount = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

        cumulativeEarnings += monthEarnings;
        cumulativeExpenses += monthExpensesAmount;
      });

      // Calculate rent collected in this period
      const periodRentPayments = payments.filter((p: any) =>
        p.vehicleId === vehicleInfo.vehicle.id &&
        p.status === 'paid' &&
        months.some(monthIndex => {
          const monthStart = new Date(year, monthIndex, 1);
          const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);
          const paymentDate = new Date(p.paidAt || p.collectionDate || p.createdAt);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        })
      );
      cumulativeRentCollected = periodRentPayments.reduce((sum, p) => sum + p.amountPaid, 0);

      // Calculate cumulative profit
      cumulativeProfit = cumulativeEarnings - cumulativeExpenses;

      // GST calculation (4% on cumulative profit - only if cumulative profit is positive)
      cumulativeGst = cumulativeProfit > 0 ? cumulativeProfit * 0.04 : 0;

      // Service charge (configurable rate for partner taxis - only if cumulative profit is positive)
      const isPartnerTaxi = vehicleInfo.vehicle.isPartnership === true;
      const serviceChargeRate = (vehicleInfo.vehicle.serviceChargeRate || 10) / 100; // Convert percentage to decimal
      cumulativeServiceCharge = isPartnerTaxi && cumulativeProfit > 0 ? cumulativeProfit * serviceChargeRate : 0;

      // Net profit after GST and service charge
      const netProfit = cumulativeProfit > 0 ? cumulativeProfit - cumulativeGst - cumulativeServiceCharge : 0;

      // Partner share and owner payment calculations
      const partnerSharePercentage = vehicleInfo.vehicle.partnershipPercentage ? vehicleInfo.vehicle.partnershipPercentage / 100 : 0.50;

      if (isPartnerTaxi) {
        cumulativePartnerShare = netProfit * partnerSharePercentage;
        cumulativeOwnerPayment = netProfit - cumulativePartnerShare;
      } else {
        cumulativeOwnerPayment = netProfit;
      }

      // Check if payments are completed for the period
      const periodStr = companyFinancialData.filterType === 'yearly'
        ? `${year}`
        : companyFinancialData.filterType === 'quarterly'
        ? `${year}-${companyFinancialData.selectedQuarter}`
        : `${year}-${String(parseInt(companyFinancialData.selectedMonth)).padStart(2, '0')}`;

      // Generate period strings
      let periodStrings: string[] = months.map(monthIndex => `${year}-${String(monthIndex + 1).padStart(2, '0')}`);

      // Helper function to check if payment type is paid (latest transaction is completed)
      const isPaymentTypePaid = (paymentType: string) => {
        // Group transactions by month for this vehicle and payment type
        const transactionsByMonth = new Map();

        accountingTransactions
          .filter((t: any) => t.vehicleId === vehicleInfo.vehicle.id && t.type === paymentType)
          .forEach((t: any) => {
            const monthKey = t.month;
            if (!transactionsByMonth.has(monthKey)) {
              transactionsByMonth.set(monthKey, []);
            }
            transactionsByMonth.get(monthKey).push(t);
          });

        // Check if any month in our period has a completed latest transaction
        for (const [monthKey, monthTransactions] of transactionsByMonth) {
          const isInPeriod = periodStrings.includes(monthKey) ||
            (companyFinancialData.filterType === 'quarterly' && monthKey === `${year}-${companyFinancialData.selectedQuarter}`) ||
            (companyFinancialData.filterType === 'yearly' && monthKey === `${year}`);

          if (isInPeriod) {
            // Sort by completedAt descending to get the latest transaction
            const sortedTransactions = monthTransactions.sort((a: any, b: any) => {
              const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
              const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
              return bTime - aTime;
            });

            const latestTransaction = sortedTransactions[0];
            if (latestTransaction.status === 'completed') {
              return true; // At least one month has a completed latest transaction
            }
          }
        }

        return false; // No months have completed latest transactions
      };

      const gstPaid = isPaymentTypePaid('gst_payment');
      const serviceChargeCollected = isPaymentTypePaid('service_charge');
      const partnerPaid = isPaymentTypePaid('partner_payment');
      const ownerPaid = isPaymentTypePaid('owner_payment');

      // Helper function to get the latest transaction amount for a payment type
      const getLatestTransactionAmount = (paymentType: string) => {
        // Group transactions by month for this vehicle and payment type
        const transactionsByMonth = new Map();

        accountingTransactions
          .filter((t: any) => t.vehicleId === vehicleInfo.vehicle.id && t.type === paymentType)
          .forEach((t: any) => {
            const monthKey = t.month;
            if (!transactionsByMonth.has(monthKey)) {
              transactionsByMonth.set(monthKey, []);
            }
            transactionsByMonth.get(monthKey).push(t);
          });

        let totalPaid = 0;

        // For each month, get the latest transaction
        transactionsByMonth.forEach((monthTransactions) => {
          // Check if this month is in our period
          const isInPeriod = periodStrings.includes(monthTransactions[0].month) ||
            (companyFinancialData.filterType === 'quarterly' && monthTransactions[0].month === `${year}-${companyFinancialData.selectedQuarter}`) ||
            (companyFinancialData.filterType === 'yearly' && monthTransactions[0].month === `${year}`);

          if (isInPeriod) {
            // Sort by completedAt descending to get the latest transaction
            const sortedTransactions = monthTransactions.sort((a: any, b: any) => {
              const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
              const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
              return bTime - aTime;
            });

            const latestTransaction = sortedTransactions[0];
            // Only count as paid if the latest transaction is completed
            if (latestTransaction.status === 'completed') {
              totalPaid += latestTransaction.amount;
            }
            // If latest is 'reversed', we don't add anything (amount = 0 for this month)
          }
        });

        return totalPaid;
      };

      const paidGstAmount = getLatestTransactionAmount('gst_payment');
      const gstActuallyPayable = Math.max(0, cumulativeGst - paidGstAmount);

      const paidServiceChargeAmount = getLatestTransactionAmount('service_charge');
      const serviceChargeActuallyPayable = Math.max(0, cumulativeServiceCharge - paidServiceChargeAmount);

      const paidPartnerAmount = getLatestTransactionAmount('partner_payment');
      const partnerShareActuallyPayable = Math.max(0, cumulativePartnerShare - paidPartnerAmount);

      const paidOwnerAmount = getLatestTransactionAmount('owner_payment');

      const ownerActuallyPayable = Math.max(0, cumulativeOwnerPayment - paidOwnerAmount);


      return {
        ...vehicleInfo,
        currentAssignment,
        earnings: cumulativeEarnings,
        expenses: cumulativeExpenses,
        profit: cumulativeProfit,
        gstAmount: cumulativeGst,
        serviceCharge: cumulativeServiceCharge,
        partnerShare: cumulativePartnerShare,
        ownerPayment: cumulativeOwnerPayment,
        rentCollected: cumulativeRentCollected,
        gstPaid,
        serviceChargeCollected,
        partnerPaid,
        ownerPaid,
        periodStr,
        gstActuallyPayable,
        serviceChargeActuallyPayable,
        partnerShareActuallyPayable,
        ownerActuallyPayable,
        allMonthsHaveGst,
        allMonthsHavePartnerShare,
        allMonthsHaveServiceCharge,
        allMonthsHaveOwnerPayment
      };
    });

    // Calculate period totals
    const periodTotals = {
      totalEarnings: periodData.reduce((sum, v) => sum + v.earnings, 0),
      totalExpenses: periodData.reduce((sum, v) => sum + v.expenses, 0),
      totalProfit: periodData.reduce((sum, v) => sum + v.profit, 0),
      totalGst: periodData.reduce((sum, v) => sum + v.gstAmount, 0),
      totalServiceCharge: periodData.reduce((sum, v) => sum + v.serviceCharge, 0),
      totalPartnerShare: periodData.reduce((sum, v) => sum + v.partnerShare, 0),
      totalOwnerPayment: periodData.reduce((sum, v) => sum + v.ownerPayment, 0),
      totalRentCollected: periodData.reduce((sum, v) => sum + v.rentCollected, 0),
      totalRent: periodData.reduce((sum, v) => {
        // Calculate total overdue rent for vehicles with active assignments within the selected period
        if (v.vehicle.status !== 'rented' || !v.vehicle.assignedDriverId || !v.currentAssignment) return sum;
        
        const currentAssignment = v.currentAssignment;
        const assignmentStartDate = new Date(
          typeof currentAssignment.startDate === 'string'
            ? currentAssignment.startDate
            : currentAssignment.startDate?.toDate?.() || currentAssignment.startDate
        );
        
        const agreementEndDate = new Date(assignmentStartDate);
        agreementEndDate.setMonth(agreementEndDate.getMonth() + (currentAssignment.agreementDuration || 12));
        
        // Get period date range (same logic as vehicle cards)
        const year = parseInt(companyFinancialData.selectedYear);
        let periodStart: Date, periodEnd: Date;
        
        if (companyFinancialData.filterType === 'monthly' && companyFinancialData.selectedMonth) {
          const monthIndex = new Date(`${companyFinancialData.selectedMonth} 1, ${year}`).getMonth();
          periodStart = new Date(year, monthIndex, 1);
          periodEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);
        } else if (companyFinancialData.filterType === 'quarterly' && companyFinancialData.selectedQuarter) {
          const quarterMonths = { 'Q1': [0,1,2], 'Q2': [3,4,5], 'Q3': [6,7,8], 'Q4': [9,10,11] };
          const months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];
          periodStart = new Date(year, months[0], 1);
          periodEnd = new Date(year, months[months.length - 1] + 1, 0, 23, 59, 59);
        } else if (companyFinancialData.filterType === 'yearly') {
          periodStart = new Date(year, 0, 1);
          periodEnd = new Date(year, 11, 31, 23, 59, 59);
        } else {
          return sum;
        }
        
        const totalWeeks = Math.ceil((agreementEndDate.getTime() - assignmentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const today = new Date();
        
        let overdueAmount = 0;
        let currentWeekDue = 0;
        
        for (let weekIndex = 0; weekIndex < Math.min(totalWeeks, 52); weekIndex++) {
          const weekStartDate = new Date(assignmentStartDate);
          weekStartDate.setDate(weekStartDate.getDate() + (weekIndex * 7));
          weekStartDate.setHours(0, 0, 0, 0);
          
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekEndDate.getDate() + 6);
          weekEndDate.setHours(23, 59, 59, 999);
          
          // Check if this assignment week overlaps with the selected period
          const weekOverlapsPeriod = 
            (weekStartDate >= periodStart && weekStartDate <= periodEnd) ||
            (weekEndDate >= periodStart && weekEndDate <= periodEnd) ||
            (weekStartDate <= periodStart && weekEndDate >= periodEnd);
            
          if (!weekOverlapsPeriod) continue;
          
          // Check if rent was collected for this week
          const weekRentPayment = payments.find((payment: any) => {
            if (payment.vehicleId !== v.vehicle.id || payment.status !== 'paid') return false;
            const paymentWeekStart = new Date(payment.weekStart);
            return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
          });
          
          if (weekRentPayment) continue;
          
          const isPastWeek = weekEndDate < today;
          const isCurrentWeek = weekStartDate <= today && today <= weekEndDate;
          
          if (isPastWeek) {
            overdueAmount += currentAssignment.weeklyRent;
          } else if (isCurrentWeek) {
            currentWeekDue = currentAssignment.weeklyRent;
          }
        }
        
        return sum + overdueAmount + currentWeekDue;
      }, 0),
      totalEMI: periodData.reduce((sum, v) => {
        if (!v.vehicle.loanDetails?.amortizationSchedule) return sum;
        const overdueEMIs = v.vehicle.loanDetails.amortizationSchedule.filter(schedule => {
          const dueDate = new Date(schedule.dueDate);
          const now = new Date();
          return !schedule.isPaid && dueDate <= now;
        });
        return sum + overdueEMIs.reduce((emiSum, schedule) => emiSum + v.vehicle.loanDetails.emiPerMonth, 0);
      }, 0),
      vehicleCount: periodData.length
    };

    return { periodData, periodTotals };
  };

  const { periodData, periodTotals } = getPeriodData();

  // Calculate actually payable amounts (Total - Already Paid for current period)
  const calculateActuallyPayable = () => {
    // Calculate amounts for vehicles that haven't paid yet
    const gstActuallyPayable = periodData
      .filter(v => !v.gstPaid)
      .reduce((sum, v) => sum + v.gstAmount, 0);

    const serviceChargeActuallyPayable = periodData
      .filter(v => !v.serviceChargeCollected)
      .reduce((sum, v) => sum + v.serviceCharge, 0);

    const partnerShareActuallyPayable = periodData
      .filter(v => !v.partnerPaid)
      .reduce((sum, v) => sum + v.partnerShare, 0);

    const ownerActuallyPayable = periodData
      .filter(v => !v.ownerPaid)
      .reduce((sum, v) => sum + v.ownerPayment, 0);

    // Calculate paid amounts (total - actually payable)
    const paidAmounts = {
      gst: periodTotals.totalGst - gstActuallyPayable,
      serviceCharge: periodTotals.totalServiceCharge - serviceChargeActuallyPayable,
      partnerShare: periodTotals.totalPartnerShare - partnerShareActuallyPayable,
      ownerPayment: periodTotals.totalOwnerPayment - ownerActuallyPayable
    };

    return {
      gstActuallyPayable,
      serviceChargeActuallyPayable,
      partnerShareActuallyPayable,
      ownerActuallyPayable,
      paidAmounts
    };
  };

  const actuallyPayable = calculateActuallyPayable();

  const rentCollectionOverview = useMemo(() => {
    const overview = {
      vehicles: [] as Array<{
        vehicle: any;
        assignment: any;
        rentStatus: {
          overdueWeeks: Array<{ weekIndex: number; weekStartDate: Date; amount: number }>;
          currentWeekDue: { weekIndex: number; weekStartDate: Date; amount: number } | null;
          totalOverdue: number;
          dueTodayAmount: number;
          totalDue: number;
        };
        overdueWeeks: Array<{ weekIndex: number; weekStartDate: Date; amount: number }>;
      }>,
      totalOverdue: 0,
      dueTodayAmount: 0,
      totalDue: 0
    };

    periodData.forEach((vehicleInfo: any) => {
      const vehicle = vehicleInfo.vehicle;
      const assignment = vehicleInfo.currentAssignment || vehicleInfo.assignment;

      if (!vehicle || vehicle.status !== 'rented' || !vehicle.assignedDriverId || !assignment) {
        return;
      }

      const rentStatus = getVehicleRentStatus(vehicle.id, assignment);
      if (rentStatus.totalDue <= 0) {
        return;
      }

      const allDueWeeks = [...rentStatus.overdueWeeks];
      if (rentStatus.currentWeekDue) {
        allDueWeeks.push(rentStatus.currentWeekDue);
      }

      overview.totalOverdue += rentStatus.totalOverdue;
      overview.dueTodayAmount += rentStatus.dueTodayAmount;
      overview.vehicles.push({
        vehicle,
        assignment,
        rentStatus,
        overdueWeeks: allDueWeeks.sort((a, b) => a.weekIndex - b.weekIndex)
      });
    });

    overview.totalDue = overview.totalOverdue + overview.dueTodayAmount;
    overview.vehicles.sort((a, b) => b.rentStatus.totalDue - a.rentStatus.totalDue);

    return overview;
  }, [periodData, payments]);

  // Helper functions to collect transactions without updating state
  const collectGstPaymentTransactions = async (vehicleInfo: any, selectedMonths?: number[]): Promise<AccountingTransaction[]> => {
    const year = parseInt(companyFinancialData.selectedYear);
    const monthsInPeriod = companyFinancialData.filterType === 'quarterly' ? 3 : companyFinancialData.filterType === 'yearly' ? 12 : 1;

    let periodStrings: string[] = [];
    let paymentAmount: number;

    if (selectedMonths && selectedMonths.length > 0) {
      periodStrings = selectedMonths.map(monthIndex => `${year}-${String(monthIndex + 1).padStart(2, '0')}`);
      const breakdown = getGSTBreakdown(vehicleInfo);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      paymentAmount = selectedMonths.reduce((sum, monthIndex) => {
        const monthName = monthNames[monthIndex];
        const breakdownItem = breakdown.find(b => b.month === monthName);
        return sum + (breakdownItem?.amount || 0);
      }, 0);
    } else {
      if (companyFinancialData.filterType === 'monthly') {
        periodStrings = [`${year}-${companyFinancialData.selectedMonth}`];
      } else if (companyFinancialData.filterType === 'quarterly') {
        const quarterMonths = {
          'Q1': ['01', '02', '03'],
          'Q2': ['04', '05', '06'],
          'Q3': ['07', '08', '09'],
          'Q4': ['10', '11', '12']
        };
        periodStrings = quarterMonths[companyFinancialData.selectedQuarter].map(m => `${year}-${m}`);
      } else {
        periodStrings = Array.from({length: 12}, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
      }
      paymentAmount = vehicleInfo.gstAmount;
    }

    const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
    const newTransactions: AccountingTransaction[] = [];

    for (let i = 0; i < periodStrings.length; i++) {
      const monthStr = periodStrings[i];
      let amount: number;
      
      if (selectedMonths && selectedMonths.length > 0) {
        // Use actual amount for this month
        const monthIndex = selectedMonths[i];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[monthIndex];
        const breakdown = getGSTBreakdown(vehicleInfo);
        const breakdownItem = breakdown.find(b => b.month === monthName);
        amount = breakdownItem?.amount || 0;
      } else {
        // Divide equally for full period payments
        amount = paymentAmount / periodStrings.length;
      }
      
      const docRef = await addDoc(transactionRef, {
        vehicleId: vehicleInfo.vehicle.id,
        type: 'gst_payment',
        amount: amount,
        month: monthStr,
        description: `GST Payment for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
      newTransactions.push({
        id: docRef.id,
        vehicleId: vehicleInfo.vehicle.id,
        type: 'gst_payment',
        amount: amount,
        month: monthStr,
        description: `GST Payment for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
    }

    // Update cash in hand for this vehicle
    const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
    const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
    await setDoc(cashRef, {
      balance: increment(-paymentAmount)
    }, { merge: true });

    // Update company-level cash balance
    const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
    await setDoc(companyCashRef, {
      balance: increment(-paymentAmount),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // Update local state
    setVehicleCashBalances(prev => ({
      ...prev,
      [vehicleInfo.vehicle.id]: (prev[vehicleInfo.vehicle.id] || 0) - paymentAmount
    }));

    return newTransactions;
  };

  const collectServiceChargeTransactions = async (vehicleInfo: any, selectedMonths?: number[]): Promise<AccountingTransaction[]> => {
    const year = parseInt(companyFinancialData.selectedYear);
    const monthsInPeriod = companyFinancialData.filterType === 'quarterly' ? 3 : companyFinancialData.filterType === 'yearly' ? 12 : 1;

    let periodStrings: string[] = [];
    let paymentAmount: number;

    if (selectedMonths && selectedMonths.length > 0) {
      periodStrings = selectedMonths.map(monthIndex => `${year}-${String(monthIndex + 1).padStart(2, '0')}`);
      const breakdown = getServiceChargeBreakdown(vehicleInfo);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      paymentAmount = selectedMonths.reduce((sum, monthIndex) => {
        const monthName = monthNames[monthIndex];
        const breakdownItem = breakdown.find(b => b.month === monthName);
        return sum + (breakdownItem?.amount || 0);
      }, 0);
    } else {
      if (companyFinancialData.filterType === 'monthly') {
        periodStrings = [`${year}-${companyFinancialData.selectedMonth}`];
      } else if (companyFinancialData.filterType === 'quarterly') {
        const quarterMonths = {
          'Q1': ['01', '02', '03'],
          'Q2': ['04', '05', '06'],
          'Q3': ['07', '08', '09'],
          'Q4': ['10', '11', '12']
        };
        periodStrings = quarterMonths[companyFinancialData.selectedQuarter].map(m => `${year}-${m}`);
      } else {
        periodStrings = Array.from({length: 12}, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
      }
      paymentAmount = vehicleInfo.serviceCharge;
    }

    const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
    const newTransactions: AccountingTransaction[] = [];

    for (let i = 0; i < periodStrings.length; i++) {
      const monthStr = periodStrings[i];
      let amount: number;
      
      if (selectedMonths && selectedMonths.length > 0) {
        // Use actual amount for this month
        const monthIndex = selectedMonths[i];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[monthIndex];
        const breakdown = getServiceChargeBreakdown(vehicleInfo);
        const breakdownItem = breakdown.find(b => b.month === monthName);
        amount = breakdownItem?.amount || 0;
      } else {
        // Divide equally for full period payments
        amount = paymentAmount / periodStrings.length;
      }
      
      const docRef = await addDoc(transactionRef, {
        vehicleId: vehicleInfo.vehicle.id,
        type: 'service_charge',
        amount: amount,
        month: monthStr,
        description: `Service Charge Collection for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
      newTransactions.push({
        id: docRef.id,
        vehicleId: vehicleInfo.vehicle.id,
        type: 'service_charge',
        amount: amount,
        month: monthStr,
        description: `Service Charge Collection for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
    }

    // Update cash in hand - DECREASE when owner withdraws service charge
    const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
    const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
    await setDoc(cashRef, {
      balance: increment(-paymentAmount)
    }, { merge: true });

    // Update company-level cash balance
    const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
    await setDoc(companyCashRef, {
      balance: increment(-paymentAmount),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // Update local state
    setVehicleCashBalances(prev => ({
      ...prev,
      [vehicleInfo.vehicle.id]: currentBalance - paymentAmount
    }));

    return newTransactions;
  };

  const collectPartnerPaymentTransactions = async (vehicleInfo: any, selectedMonths?: number[]): Promise<AccountingTransaction[]> => {
    const year = parseInt(companyFinancialData.selectedYear);
    const monthsInPeriod = companyFinancialData.filterType === 'quarterly' ? 3 : companyFinancialData.filterType === 'yearly' ? 12 : 1;

    let periodStrings: string[] = [];
    let paymentAmount: number;

    if (selectedMonths && selectedMonths.length > 0) {
      periodStrings = selectedMonths.map(monthIndex => `${year}-${String(monthIndex + 1).padStart(2, '0')}`);
      paymentAmount = (vehicleInfo.partnerShare / monthsInPeriod) * selectedMonths.length;
    } else {
      if (companyFinancialData.filterType === 'monthly') {
        periodStrings = [`${year}-${companyFinancialData.selectedMonth}`];
      } else if (companyFinancialData.filterType === 'quarterly') {
        const quarterMonths = {
          'Q1': ['01', '02', '03'],
          'Q2': ['04', '05', '06'],
          'Q3': ['07', '08', '09'],
          'Q4': ['10', '11', '12']
        };
        periodStrings = quarterMonths[companyFinancialData.selectedQuarter].map(m => `${year}-${m}`);
      } else {
        periodStrings = Array.from({length: 12}, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
      }
      paymentAmount = vehicleInfo.partnerShare;
    }

    const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
    const newTransactions: AccountingTransaction[] = [];

    for (const monthStr of periodStrings) {
      const docRef = await addDoc(transactionRef, {
        vehicleId: vehicleInfo.vehicle.id,
        type: 'partner_payment',
        amount: paymentAmount / periodStrings.length,
        month: monthStr,
        description: `Partner Share Payment for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
      newTransactions.push({
        id: docRef.id,
        vehicleId: vehicleInfo.vehicle.id,
        type: 'partner_payment',
        amount: paymentAmount / periodStrings.length,
        month: monthStr,
        description: `Partner Share Payment for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
    }

    // Update cash in hand for this vehicle
    const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
    const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
    await setDoc(cashRef, {
      balance: increment(-paymentAmount)
    }, { merge: true });

    // Update company-level cash balance
    const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
    await setDoc(companyCashRef, {
      balance: increment(-paymentAmount),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // Update local state
    setVehicleCashBalances(prev => ({
      ...prev,
      [vehicleInfo.vehicle.id]: (prev[vehicleInfo.vehicle.id] || 0) - paymentAmount
    }));

    return newTransactions;
  };

  const collectOwnerPaymentTransactions = async (vehicleInfo: any, selectedMonths?: number[]): Promise<AccountingTransaction[]> => {
    const year = parseInt(companyFinancialData.selectedYear);
    const monthsInPeriod = companyFinancialData.filterType === 'quarterly' ? 3 : companyFinancialData.filterType === 'yearly' ? 12 : 1;

    let periodStrings: string[] = [];
    let paymentAmount: number;

    if (selectedMonths && selectedMonths.length > 0) {
      periodStrings = selectedMonths.map(monthIndex => `${year}-${String(monthIndex + 1).padStart(2, '0')}`);
      paymentAmount = (vehicleInfo.ownerPayment / monthsInPeriod) * selectedMonths.length;
    } else {
      if (companyFinancialData.filterType === 'monthly') {
        periodStrings = [`${year}-${companyFinancialData.selectedMonth}`];
      } else if (companyFinancialData.filterType === 'quarterly') {
        const quarterMonths = {
          'Q1': ['01', '02', '03'],
          'Q2': ['04', '05', '06'],
          'Q3': ['07', '08', '09'],
          'Q4': ['10', '11', '12']
        };
        periodStrings = quarterMonths[companyFinancialData.selectedQuarter].map(m => `${year}-${m}`);
      } else {
        periodStrings = Array.from({length: 12}, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
      }
      paymentAmount = vehicleInfo.ownerPayment;
    }

    const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
    const newTransactions: AccountingTransaction[] = [];

    for (const monthStr of periodStrings) {
      const docRef = await addDoc(transactionRef, {
        vehicleId: vehicleInfo.vehicle.id,
        type: 'owner_payment',
        amount: paymentAmount / periodStrings.length,
        month: monthStr,
        description: `Owner Payment for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
      newTransactions.push({
        id: docRef.id,
        vehicleId: vehicleInfo.vehicle.id,
        type: 'owner_payment',
        amount: paymentAmount / periodStrings.length,
        month: monthStr,
        description: `Owner Payment for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
    }

    // Update cash in hand for this vehicle
    const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
    const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
    await setDoc(cashRef, {
      balance: increment(-paymentAmount)
    }, { merge: true });

    // Update company-level cash balance
    const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
    await setDoc(companyCashRef, {
      balance: increment(-paymentAmount),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // Update local state
    setVehicleCashBalances(prev => ({
      ...prev,
      [vehicleInfo.vehicle.id]: (prev[vehicleInfo.vehicle.id] || 0) - paymentAmount
    }));

    return newTransactions;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Quarterly Summary */}
      <SectionNumberBadge id="1" label="Period Summary" className="mb-2" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {companyFinancialData.periodLabel} Summary ({periodTotals.vehicleCount} vehicles)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{periodTotals.totalEarnings.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">{companyFinancialData.periodLabel} Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                ₹{periodTotals.totalExpenses.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">{companyFinancialData.periodLabel} Expenses</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${periodTotals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{periodTotals.totalProfit.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">{companyFinancialData.periodLabel} Profit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                ₹{Object.values(vehicleCashBalances).reduce((sum, balance) => sum + balance, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Current Cash</div>
            </div>
          </div>

          {/* Additional period breakdown */}
          <SectionNumberBadge id="2" label="Additional Period Breakdown" className="mb-2" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-b border-dashed border-gray-300 pb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                ₹{periodTotals.totalGst.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">GST Payable</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                ₹{periodTotals.totalServiceCharge.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Service Charges</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                ₹{periodTotals.totalPartnerShare.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Partner Shares</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                ₹{periodTotals.totalOwnerPayment.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Owner Payments</div>
            </div>
          </div>

          {/* Paid Amounts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 border-b border-dashed border-gray-300 pb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                ₹{actuallyPayable.paidAmounts.gst.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">GST Paid</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                ₹{actuallyPayable.paidAmounts.serviceCharge.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Service Charges Collected</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                ₹{actuallyPayable.paidAmounts.partnerShare.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Partner Shares Paid</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                ₹{actuallyPayable.paidAmounts.ownerPayment.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Owner Payments Paid</div>
            </div>
          </div>

          {/* Actually Payable Amounts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 pb-4 border-b border-dashed border-gray-300">
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-700">
                ₹{actuallyPayable.gstActuallyPayable.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">GST Actually Payable</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-700">
                ₹{actuallyPayable.serviceChargeActuallyPayable.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Service Charges Actually Payable</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-700">
                ₹{actuallyPayable.partnerShareActuallyPayable.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Partner Shares Actually Payable</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-700">
                ₹{actuallyPayable.ownerActuallyPayable.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Owner Payments Actually Payable</div>
            </div>
          </div>

          {/* Bulk Payment Actions */}
          {userInfo?.role !== Role.PARTNER && (
            <>
              <SectionNumberBadge id="4" label="Bulk Payment Actions" className="mb-2" />
              <div className="mt-6 pt-4 border-t">
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    onClick={() => openBulkPaymentDialog('rent')}
                    disabled={rentCollectionOverview.totalDue === 0}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Collect Overdue Rent (₹{rentCollectionOverview.totalDue.toLocaleString()})
                  </Button>
                  <Button
                    onClick={() => openBulkPaymentDialog('gst')}
                    disabled={actuallyPayable.gstActuallyPayable <= 0}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pay GST (₹{actuallyPayable.gstActuallyPayable.toLocaleString()})
                  </Button>
                  <Button
                    onClick={() => openBulkPaymentDialog('service_charge')}
                    disabled={actuallyPayable.serviceChargeActuallyPayable <= 0}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Withdraw Service Charges (₹{actuallyPayable.serviceChargeActuallyPayable.toLocaleString()})
                  </Button>
                  <Button
                    onClick={() => openBulkPaymentDialog('partner_share')}
                    disabled={actuallyPayable.partnerShareActuallyPayable <= 0}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Pay Partner Shares (₹{actuallyPayable.partnerShareActuallyPayable.toLocaleString()})
                  </Button>
                  <Button
                    onClick={() => openBulkPaymentDialog('owner_payment')}
                    disabled={actuallyPayable.ownerActuallyPayable <= 0}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Pay Owner Payment (₹{actuallyPayable.ownerActuallyPayable.toLocaleString()})
                  </Button>
                  <Button
                    onClick={() => openBulkPaymentDialog('emi')}
                    disabled={periodTotals.totalEMI === 0}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pay Overdue EMIs ({periodTotals.totalEMI.toLocaleString()})
                  </Button>
                  <Button
                    onClick={() => setBackdoorDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-red-50 border-red-200 hover:bg-red-100"
                  >
                    <Plus className="h-4 w-4" />
                    Add Cash (Testing)
                  </Button>
                </div>
                <div className="text-xs text-gray-500 text-center mt-2">
                  Bulk payments allow you to process multiple vehicles at once. You can deselect vehicles in the dialog.
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Accounting Cards */}
      <SectionNumberBadge id="5" label="Vehicle Accounting Cards" className="mb-2" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {periodData.map((vehicleInfo: any) => (
          <Card key={vehicleInfo.vehicle.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-lg font-semibold">
                    {vehicleInfo.vehicle.vehicleName || `${vehicleInfo.vehicle.make} ${vehicleInfo.vehicle.model}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {vehicleInfo.vehicle.year} • {vehicleInfo.vehicle.registrationNumber}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(vehicleInfo.vehicle.status)}
                  <Badge variant="outline" className="text-xs">
                    {vehicleInfo.vehicle.isPartnership === true ? 'Partner' : 'Company'}
                  </Badge>
                  <Badge variant={vehicleInfo.profit >= 0 ? "default" : "destructive"}>
                    {vehicleInfo.profit >= 0 ? 'Profit' : 'Loss'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* Cash in Hand for this vehicle */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">
                  ₹{(vehicleCashBalances[vehicleInfo.vehicle.id] || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Cash in Hand</div>
              </div>

              {/* Earnings */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <TrendingUp className="h-4 w-4" />
                  Earnings
                </div>
                <div className="text-lg font-semibold text-green-600">
                  ₹{vehicleInfo.earnings.toLocaleString()}
                </div>
              </div>

              {/* Expenses Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                  <Receipt className="h-4 w-4" />
                  Expenses
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-lg font-semibold text-red-600">
                    ₹{vehicleInfo.expenses.toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleViewExpenses(vehicleInfo.vehicle.id)}
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                  >
                    view breakup
                  </button>
                </div>
              </div>

              {/* Profit Calculation */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                  <span>Profit (Earnings - Expenses)</span>
                  <span className={`font-medium ${vehicleInfo.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{vehicleInfo.profit.toLocaleString()}
                  </span>
                </div>

                {/* GST */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                  <span>GST (4%)</span>
                  <span className="font-medium text-orange-600">
                    ₹{vehicleInfo.gstAmount.toLocaleString()}
                  </span>
                </div>

                {/* Service Charge (only for partner taxis) */}
                {vehicleInfo.serviceCharge > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                    <span>Service Charge (10%)</span>
                    <span className="font-medium text-blue-600">
                      ₹{vehicleInfo.serviceCharge.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Partner Share (only for partner taxis) */}
                {vehicleInfo.partnerShare > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm border-t pt-1">
                    <span className="font-medium">Partner Share ({vehicleInfo.vehicle.partnershipPercentage || 50}%)</span>
                    <span className="font-bold text-purple-600">
                      ₹{vehicleInfo.partnerShare.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Owner Payment (for both partner and company taxis) */}
                {vehicleInfo.ownerPayment > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm border-t pt-1">
                    <span className="font-medium">Owner Payment ({vehicleInfo.vehicle.isPartnership === true ? `${100 - (vehicleInfo.vehicle.partnershipPercentage || 50)}%` : '100%'})</span>
                    <span className="font-bold text-green-600">
                      ₹{vehicleInfo.ownerPayment.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Owner's Full Share (only for company-owned taxis) - Keep for backward compatibility */}
                {vehicleInfo.ownerFullShare > 0 && !vehicleInfo.ownerPayment && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm border-t pt-1">
                    <span className="font-medium">Owner's Share (100%)</span>
                    <span className="font-bold text-green-600">
                      ₹{vehicleInfo.ownerFullShare.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Always show at bottom for consistent alignment */}
              <div className="flex-1 flex flex-col justify-end border-t pt-3">
                  <div className="space-y-2">
                    {/* GST Payment - Always shown */}
                    {userInfo?.role !== Role.PARTNER && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm">GST Payment</span>
                        {(() => {
                          // For monthly view, use latest transaction status logic
                          if (companyFinancialData.filterType === 'monthly') {
                            const monthStr = `${companyFinancialData.selectedYear}-${companyFinancialData.selectedMonth.padStart(2, '0')}`;
                            const latestGstStatus = getLatestTransactionStatus(accountingTransactions, vehicleInfo.vehicle.id, 'gst_payment', monthStr);

                            if (vehicleInfo.gstAmount <= 0) {
                              // GST = 0, don't show button
                              return null;
                            } else if (latestGstStatus === null) {
                              // No transaction, show button
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (companyFinancialData.filterType === 'monthly') {
                                      setSelectedVehicleForPayment(vehicleInfo);
                                      setConfirmGstPaymentDialog(true);
                                    } else {
                                      setSelectedVehicleForIndividualPayment(vehicleInfo);
                                      setSelectedPaymentType('gst');
                                      setIndividualPaymentDialogOpen(true);
                                    }
                                  }}
                                  disabled={vehicleInfo.gstActuallyPayable <= 0}
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Pay GST ₹{vehicleInfo.gstActuallyPayable.toLocaleString()}
                                </Button>
                              );
                            } else if (latestGstStatus === 'completed') {
                              // Latest transaction completed, show badge
                              return (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Paid
                                </Badge>
                              );
                            } else if (latestGstStatus === 'reversed') {
                              // Latest transaction reversed, show button for re-payment
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (companyFinancialData.filterType === 'monthly') {
                                      setSelectedVehicleForPayment(vehicleInfo);
                                      setConfirmGstPaymentDialog(true);
                                    } else {
                                      setSelectedVehicleForIndividualPayment(vehicleInfo);
                                      setSelectedPaymentType('gst');
                                      setIndividualPaymentDialogOpen(true);
                                    }
                                  }}
                                  disabled={vehicleInfo.gstActuallyPayable <= 0}
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Pay GST ₹{vehicleInfo.gstActuallyPayable.toLocaleString()}
                                </Button>
                              );
                            }
                          } else {
                            // For non-monthly views, use thumb rule: only show Paid if all months have GST > 0 AND gstPaid
                            return vehicleInfo.allMonthsHaveGst && vehicleInfo.gstPaid ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedVehicleForIndividualPayment(vehicleInfo);
                                  setSelectedPaymentType('gst');
                                  setIndividualPaymentDialogOpen(true);
                                }}
                                disabled={vehicleInfo.gstActuallyPayable <= 0}
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
                                Pay GST ₹{vehicleInfo.gstActuallyPayable.toLocaleString()}
                              </Button>
                            );
                          }
                        })()}
                      </div>
                    )}                    {/* Service Charge Collection - Only for partner taxis */}
                    {userInfo?.role !== Role.PARTNER && vehicleInfo.vehicle.isPartnership === true && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm">Service Charge</span>
                        {(() => {
                          // For monthly view, use latest transaction status logic
                          if (companyFinancialData.filterType === 'monthly') {
                            const monthStr = `${companyFinancialData.selectedYear}-${companyFinancialData.selectedMonth.padStart(2, '0')}`;
                            const latestServiceChargeStatus = getLatestTransactionStatus(accountingTransactions, vehicleInfo.vehicle.id, 'service_charge', monthStr);

                            if (vehicleInfo.serviceCharge <= 0) {
                              // Service Charge = 0, don't show button
                              return null;
                            } else if (latestServiceChargeStatus === null) {
                              // No transaction, show button
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (companyFinancialData.filterType === 'monthly') {
                                      setSelectedVehicleForPayment(vehicleInfo);
                                      setConfirmServiceChargeDialog(true);
                                    } else {
                                      setSelectedVehicleForIndividualPayment(vehicleInfo);
                                      setSelectedPaymentType('service_charge');
                                      setIndividualPaymentDialogOpen(true);
                                    }
                                  }}
                                  disabled={vehicleInfo.serviceChargeActuallyPayable <= 0}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Collect ₹{vehicleInfo.serviceChargeActuallyPayable.toLocaleString()}
                                </Button>
                              );
                            } else if (latestServiceChargeStatus === 'completed') {
                              // Latest transaction completed, show badge
                              return (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Collected
                                </Badge>
                              );
                            } else if (latestServiceChargeStatus === 'reversed') {
                              // Latest transaction reversed, show button for re-collection
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (companyFinancialData.filterType === 'monthly') {
                                      setSelectedVehicleForPayment(vehicleInfo);
                                      setConfirmServiceChargeDialog(true);
                                    } else {
                                      setSelectedVehicleForIndividualPayment(vehicleInfo);
                                      setSelectedPaymentType('service_charge');
                                      setIndividualPaymentDialogOpen(true);
                                    }
                                  }}
                                  disabled={vehicleInfo.serviceChargeActuallyPayable <= 0}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Collect ₹{vehicleInfo.serviceChargeActuallyPayable.toLocaleString()}
                                </Button>
                              );
                            }
                          } else {
                            // For non-monthly views, use thumb rule: only show Collected if all months have service charge > 0 AND serviceChargeCollected
                            return vehicleInfo.allMonthsHaveServiceCharge && vehicleInfo.serviceChargeCollected ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Collected
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedVehicleForIndividualPayment(vehicleInfo);
                                  setSelectedPaymentType('service_charge');
                                  setIndividualPaymentDialogOpen(true);
                                }}
                                disabled={vehicleInfo.serviceChargeActuallyPayable <= 0}
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Collect ₹{vehicleInfo.serviceChargeActuallyPayable.toLocaleString()}
                              </Button>
                            );
                          }
                        })()}
                      </div>
                    )}

                    {/* Partner Payment - Only for partner taxis */}
                    {userInfo?.role !== Role.PARTNER && vehicleInfo.vehicle.isPartnership === true && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm">Partner Payment</span>
                        {(() => {
                          // For monthly view, use latest transaction status logic
                          if (companyFinancialData.filterType === 'monthly') {
                            const monthStr = `${companyFinancialData.selectedYear}-${companyFinancialData.selectedMonth.padStart(2, '0')}`;
                            const latestPartnerPaymentStatus = getLatestTransactionStatus(accountingTransactions, vehicleInfo.vehicle.id, 'partner_payment', monthStr);

                            if (vehicleInfo.partnerShare <= 0) {
                              // Partner Share = 0, don't show button
                              return null;
                            } else if (latestPartnerPaymentStatus === null) {
                              // No transaction, show button
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (companyFinancialData.filterType === 'monthly') {
                                      setSelectedVehicleForPayment(vehicleInfo);
                                      setConfirmPartnerPaymentDialog(true);
                                    } else {
                                      setSelectedVehicleForIndividualPayment(vehicleInfo);
                                      setSelectedPaymentType('partner_share');
                                      setIndividualPaymentDialogOpen(true);
                                    }
                                  }}
                                  disabled={vehicleInfo.partnerShareActuallyPayable <= 0}
                                >
                                  <Banknote className="h-3 w-3 mr-1" />
                                  Pay Partner ₹{vehicleInfo.partnerShareActuallyPayable.toLocaleString()}
                                </Button>
                              );
                            } else if (latestPartnerPaymentStatus === 'completed') {
                              // Latest transaction completed, show badge
                              return (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Paid
                                </Badge>
                              );
                            } else if (latestPartnerPaymentStatus === 'reversed') {
                              // Latest transaction reversed, show button for re-payment
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (companyFinancialData.filterType === 'monthly') {
                                      setSelectedVehicleForPayment(vehicleInfo);
                                      setConfirmPartnerPaymentDialog(true);
                                    } else {
                                      setSelectedVehicleForIndividualPayment(vehicleInfo);
                                      setSelectedPaymentType('partner_share');
                                      setIndividualPaymentDialogOpen(true);
                                    }
                                  }}
                                  disabled={vehicleInfo.partnerShareActuallyPayable <= 0}
                                >
                                  <Banknote className="h-3 w-3 mr-1" />
                                  Pay Partner ₹{vehicleInfo.partnerShareActuallyPayable.toLocaleString()}
                                </Button>
                              );
                            }
                          } else {
                            // For non-monthly views, use thumb rule: only show Paid if all months have partner share > 0 AND partnerPaid
                            return vehicleInfo.allMonthsHavePartnerShare && vehicleInfo.partnerPaid ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedVehicleForIndividualPayment(vehicleInfo);
                                  setSelectedPaymentType('partner_share');
                                  setIndividualPaymentDialogOpen(true);
                                }}
                                disabled={vehicleInfo.partnerShareActuallyPayable <= 0}
                              >
                                <Banknote className="h-3 w-3 mr-1" />
                                Pay Partner ₹{vehicleInfo.partnerShareActuallyPayable.toLocaleString()}
                              </Button>
                            );
                          }
                        })()}
                      </div>
                    )}

                    {/* Owner Payment - For all vehicles */}
                    {userInfo?.role !== Role.PARTNER && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm">Owner Payment</span>
                        {(() => {
                          // For monthly view, calculate monthly owner payment
                          if (companyFinancialData.filterType === 'monthly') {
                            const monthStr = `${companyFinancialData.selectedYear}-${companyFinancialData.selectedMonth.padStart(2, '0')}`;
                            const latestOwnerPaymentStatus = getLatestTransactionStatus(accountingTransactions, vehicleInfo.vehicle.id, 'owner_payment', monthStr);

                            // Calculate monthly owner payment for this vehicle
                            const year = parseInt(companyFinancialData.selectedYear);
                            const monthIndex = companyFinancialData.selectedMonthIndex; // 0-based
                            const monthStart = new Date(year, monthIndex, 1);
                            const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

                            // Get payments and expenses for this month
                            const monthPayments = payments.filter((p: any) =>
                              p.vehicleId === vehicleInfo.vehicle.id &&
                              p.status === 'paid' &&
                              new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
                              new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
                            );

                            const monthExpenses = (companyFinancialData.expenses || []).filter((e: any) =>
                              e.vehicleId === vehicleInfo.vehicle.id &&
                              e.status === 'approved' &&
                              new Date(e.createdAt) >= monthStart &&
                              new Date(e.createdAt) <= monthEnd
                            );

                            const monthEarnings = monthPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
                            const monthExpensesAmount = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
                            const monthlyProfit = monthEarnings - monthExpensesAmount;

                            // GST calculation
                            const monthlyGst = monthlyProfit > 0 ? monthlyProfit * 0.04 : 0;

                            // Service charge
                            const isPartnerTaxi = vehicleInfo.vehicle.isPartnership === true;
                            const serviceChargeRate = (vehicleInfo.vehicle.serviceChargeRate || 10) / 100;
                            const monthlyServiceCharge = isPartnerTaxi && monthlyProfit > 0 ? monthlyProfit * serviceChargeRate : 0;

                            // Remaining profit
                            const remainingProfit = monthlyProfit - monthlyGst - monthlyServiceCharge;

                            // Partner share percentage
                            const partnerSharePercentage = vehicleInfo.vehicle.partnershipPercentage ? vehicleInfo.vehicle.partnershipPercentage / 100 : 0.50;

                            // Partner share

                            // Paid amount
                            const paidOwnerAmount = accountingTransactions.filter((t: any) =>
                              t.vehicleId === vehicleInfo.vehicle.id &&
                              t.type === 'owner_payment' &&
                              t.month === monthStr &&
                              t.status === 'completed'
                            ).reduce((sum, t) => sum + t.amount, 0);

                            if (latestOwnerPaymentStatus === null) {
                              // No transaction, show button
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (companyFinancialData.filterType === 'monthly') {
                                      setSelectedVehicleForPayment(vehicleInfo);
                                      setConfirmOwnerPaymentDialog(true);
                                    } else {
                                      setSelectedVehicleForIndividualPayment(vehicleInfo);
                                      setSelectedPaymentType('owner_payment');
                                      setIndividualPaymentDialogOpen(true);
                                    }
                                  }}
                                  disabled={vehicleInfo.ownerActuallyPayable <= 0}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Pay Owner ₹{vehicleInfo.ownerActuallyPayable.toLocaleString()}
                                </Button>
                              );
                            } else if (latestOwnerPaymentStatus === 'completed') {
                              // Latest transaction completed, show badge
                              return (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Paid
                                </Badge>
                              );
                            } else if (latestOwnerPaymentStatus === 'reversed') {
                              // Latest transaction reversed, show button for re-payment
                              return (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (companyFinancialData.filterType === 'monthly') {
                                      setSelectedVehicleForPayment(vehicleInfo);
                                      setConfirmOwnerPaymentDialog(true);
                                    } else {
                                      setSelectedVehicleForIndividualPayment(vehicleInfo);
                                      setSelectedPaymentType('owner_payment');
                                      setIndividualPaymentDialogOpen(true);
                                    }
                                  }}
                                  disabled={vehicleInfo.ownerActuallyPayable <= 0}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Pay Owner ₹{vehicleInfo.ownerActuallyPayable.toLocaleString()}
                                </Button>
                              );
                            }
                          } else {
                            // For non-monthly views, use thumb rule: only show Paid if all months have owner payment > 0 AND ownerPaid
                            return vehicleInfo.allMonthsHaveOwnerPayment && vehicleInfo.ownerPaid ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedVehicleForIndividualPayment(vehicleInfo);
                                  setSelectedPaymentType('owner_payment');
                                  setIndividualPaymentDialogOpen(true);
                                }}
                                disabled={vehicleInfo.ownerActuallyPayable <= 0}
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pay Owner ₹{vehicleInfo.ownerActuallyPayable.toLocaleString()}
                              </Button>
                            );
                          }
                        })()}
                      </div>
                    )}

                    {/* EMI Payments - Only for financed vehicles */}
                    {userInfo?.role !== Role.PARTNER && vehicleInfo.vehicle.financingType === 'loan' && vehicleInfo.vehicle.loanDetails && (
                      <EMIPaymentSection 
                        vehicle={vehicleInfo.vehicle} 
                        onPayEMI={(monthIndex, emi) => markEMIPaid(vehicleInfo.vehicle, monthIndex, emi)}
                        onShowMore={() => openEMIDialog(vehicleInfo.vehicle)}
                        periodType={companyFinancialData.filterType}
                        selectedYear={companyFinancialData.selectedYear}
                        selectedMonth={companyFinancialData.selectedMonth}
                        selectedQuarter={companyFinancialData.selectedQuarter}
                      />
                    )}

                    {/* Rent Collection - Only for rented vehicles */}
                    {vehicleInfo.vehicle.status === 'rented' && vehicleInfo.vehicle.assignedDriverId && (() => {
                      const currentAssignment = vehicleInfo.currentAssignment;
                      if (!currentAssignment) return null;

                      // Calculate assignment dates (same as RentTab)
                      const assignmentStartDate = new Date(
                        typeof currentAssignment.startDate === 'string'
                          ? currentAssignment.startDate
                          : currentAssignment.startDate?.toDate?.() || currentAssignment.startDate
                      );
                      assignmentStartDate.setHours(0, 0, 0, 0);

                      // Calculate end date based on agreement duration
                      const agreementEndDate = new Date(assignmentStartDate);
                      agreementEndDate.setMonth(agreementEndDate.getMonth() + (currentAssignment.agreementDuration || 12));

                      // Get period date range
                      const year = parseInt(companyFinancialData.selectedYear);
                      let periodStart: Date, periodEnd: Date;

                      if (companyFinancialData.filterType === 'monthly' && companyFinancialData.selectedMonth) {
                        const monthIndex = new Date(`${companyFinancialData.selectedMonth} 1, ${year}`).getMonth();
                        periodStart = new Date(year, monthIndex, 1);
                        periodEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);
                      } else if (companyFinancialData.filterType === 'quarterly' && companyFinancialData.selectedQuarter) {
                        const quarterMonths = { 'Q1': [0,1,2], 'Q2': [3,4,5], 'Q3': [6,7,8], 'Q4': [9,10,11] };
                        const months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];
                        periodStart = new Date(year, months[0], 1);
                        periodEnd = new Date(year, months[months.length - 1] + 1, 0, 23, 59, 59);
                      } else if (companyFinancialData.filterType === 'yearly') {
                        periodStart = new Date(year, 0, 1);
                        periodEnd = new Date(year, 11, 31, 23, 59, 59);
                      } else {
                        return null;
                      }

                      // Calculate total weeks in assignment
                      const totalWeeks = Math.ceil((agreementEndDate.getTime() - assignmentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

                      // Calculate assignment-based weeks that fall within the selected period
                      // This matches the logic from RentTab
                      const allPeriodWeeks: { weekIndex: number; assignmentWeekNumber: number; weekStartDate: Date; weekEndDate: Date }[] = [];

                      for (let weekIndex = 0; weekIndex < Math.min(totalWeeks, 52); weekIndex++) {
                        // Calculate week dates based on assignment start date (same as RentTab)
                        const weekStartDate = new Date(assignmentStartDate);
                        weekStartDate.setDate(weekStartDate.getDate() + (weekIndex * 7));
                        weekStartDate.setHours(0, 0, 0, 0);

                        const weekEndDate = new Date(weekStartDate);
                        weekEndDate.setDate(weekEndDate.getDate() + 6);
                        weekEndDate.setHours(23, 59, 59, 999);

                        // Check if this assignment week overlaps with the selected period
                        const weekOverlapsPeriod = 
                          (weekStartDate >= periodStart && weekStartDate <= periodEnd) || // Week starts in period
                          (weekEndDate >= periodStart && weekEndDate <= periodEnd) ||     // Week ends in period
                          (weekStartDate <= periodStart && weekEndDate >= periodEnd);     // Week spans entire period

                        if (weekOverlapsPeriod) {
                          allPeriodWeeks.push({
                            weekIndex,
                            assignmentWeekNumber: weekIndex + 1, // Display as Week 1, Week 2, etc.
                            weekStartDate: new Date(weekStartDate),
                            weekEndDate: new Date(weekEndDate)
                          });
                        }
                      }

                      if (allPeriodWeeks.length === 0) return null;

                      // Show only first 12 weeks in card, rest in dialog
                      const periodWeeks = allPeriodWeeks.slice(0, 12);
                      const hasMoreWeeks = allPeriodWeeks.length > 12;

                    // Calculate rent status for this vehicle
                    const rentStatus = getVehicleRentStatus(vehicleInfo.vehicle.id, currentAssignment);
                    
                    // Prepare weeks to pay (overdue + current week due)
                    const weeksToPay = [...rentStatus.overdueWeeks];
                    if (rentStatus.currentWeekDue) {
                      weeksToPay.push(rentStatus.currentWeekDue);
                    }

                    return userInfo?.role !== Role.PARTNER ? (
                      <div className="border-t pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <div className="text-xs font-medium text-gray-700">Rent Collection</div>
                          <div className="flex gap-1">
                            {rentStatus.totalDue > 0 && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 px-2 text-xs"
                                onClick={() => handlePayAllOverdueClick(currentAssignment, weeksToPay)}
                              >
                                Pay All Due ({weeksToPay.length}) - ₹{rentStatus.totalDue.toLocaleString()}
                              </Button>
                            )}
                            {rentStatus.overdueWeeks.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => openRentDialog(vehicleInfo)}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Overdue ({rentStatus.overdueWeeks.length})
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {periodWeeks.map(({ weekIndex, assignmentWeekNumber, weekStartDate, weekEndDate }) => {
                            // Check if rent was collected for this week (same logic as RentTab)
                            const weekRentPayment = payments.find(payment => {
                              if (payment.vehicleId !== vehicleInfo.vehicle.id || payment.status !== 'paid') return false;
                              const paymentWeekStart = new Date(payment.weekStart);
                              // More precise matching - check if payment week matches this assignment week
                              return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
                            });

                            const today = new Date();
                            // Determine week status relative to today (same logic as RentTab)
                            const isPastWeek = weekEndDate < today;
                            const isCurrentWeek = weekStartDate <= today && today <= weekEndDate;
                            const isFutureWeek = weekStartDate > today;
                            const isUpcoming = isFutureWeek && weekStartDate <= new Date(today.getTime() + (5 * 7 * 24 * 60 * 60 * 1000));

                            // Determine status and styling (exact same logic as RentTab)
                            let bgColor = 'bg-gray-100';
                            let textColor = 'text-gray-600';
                            let borderColor = 'border-gray-200';
                            let icon = <Clock className="h-3 w-3" />;
                            let status = '';

                            if (isPastWeek) {
                              if (weekRentPayment) {
                                bgColor = 'bg-green-100';
                                textColor = 'text-green-700';
                                borderColor = 'border-green-200';
                                icon = <CheckCircle className="h-3 w-3" />;
                                status = 'Collected';
                              } else {
                                bgColor = 'bg-red-100';
                                textColor = 'text-red-700';
                                borderColor = 'border-red-200';
                                icon = <AlertCircle className="h-3 w-3" />;
                                status = 'Overdue';
                              }
                            } else if (isCurrentWeek) {
                              if (weekRentPayment) {
                                bgColor = 'bg-green-100';
                                textColor = 'text-green-700';
                                borderColor = 'border-green-200';
                                icon = <CheckCircle className="h-3 w-3" />;
                                status = 'Collected';
                              } else {
                                bgColor = 'bg-yellow-100';
                                textColor = 'text-yellow-700';
                                borderColor = 'border-yellow-200';
                                icon = <DollarSign className="h-3 w-3" />;
                                status = 'Due Now';
                              }
                            } else if (isUpcoming) {
                              bgColor = 'bg-blue-100';
                              textColor = 'text-blue-700';
                              borderColor = 'border-blue-200';
                              icon = <Calendar className="h-3 w-3" />;
                              const daysUntil = Math.ceil((weekStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              status = `${daysUntil} days`;
                            }

                            // Determine if payment can be made (current week or overdue) - same as RentTab
                            const canMarkPaid = !weekRentPayment && (isCurrentWeek || isPastWeek);

                            const popoverKey = `${vehicleInfo.vehicle.id}-${weekIndex}`;

                            return (
                              <Tooltip key={weekIndex}>
                                <TooltipTrigger asChild>
                                  <Popover
                                    open={rentPopoverOpen[popoverKey] || false}
                                    onOpenChange={(open) => {
                                      setRentPopoverOpen(prev => ({
                                        ...prev,
                                        [popoverKey]: open
                                      }));
                                      if (open) {
                                        setSelectedRentWeek({
                                          weekIndex,
                                          assignment: currentAssignment,
                                          weekStartDate,
                                          vehicleId: vehicleInfo.vehicle.id
                                        });
                                      }
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className={`h-7 px-2 text-xs ${bgColor} ${textColor} border ${borderColor} hover:${bgColor} flex items-center gap-1`}
                                        disabled={!canMarkPaid && !weekRentPayment}
                                      >
                                        {icon}
                                        Week {assignmentWeekNumber}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64" side="top" align="center">
                                      <div className="space-y-3">
                                        <div className="text-center">
                                          <div className="font-semibold text-sm">
                                            Week {assignmentWeekNumber}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            {weekStartDate.toLocaleDateString('en-IN', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric'
                                            })} - {weekEndDate.toLocaleDateString('en-IN', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric'
                                            })}
                                          </div>
                                        </div>

                                        <div className="text-center">
                                          <div className={`text-sm font-medium ${textColor}`}>
                                            {status}
                                          </div>
                                          {weekRentPayment ? (
                                            <div className="text-sm font-semibold text-green-600">
                                              ₹{weekRentPayment.amountPaid.toLocaleString()}
                                            </div>
                                          ) : (
                                            <div className="text-sm text-gray-600">
                                              ₹{currentAssignment.weeklyRent.toLocaleString()}
                                            </div>
                                          )}
                                        </div>

                                        {canMarkPaid && (
                                          <Button
                                            size="sm"
                                            className="w-full"
                                            disabled={isProcessingRentPayment === weekIndex}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRentPopoverOpen(prev => ({
                                                ...prev,
                                                [popoverKey]: false
                                              }));
                                              handleRentPaymentClick(weekIndex, currentAssignment, weekStartDate);
                                            }}
                                          >
                                            {isProcessingRentPayment === weekIndex ? 'Processing...' : 'Mark as Paid'}
                                          </Button>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Week {assignmentWeekNumber} - {weekStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}

                          {hasMoreWeeks && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedVehicleForRent({
                                  vehicle: vehicleInfo.vehicle,
                                  assignment: currentAssignment,
                                  allWeeks: allPeriodWeeks,
                                  periodStart,
                                  periodEnd
                                });
                                setRentViewAllDialog(true);
                              }}
                            >
                              View All ({allPeriodWeeks.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

  {/* Rent View All Dialog */}
  <SectionNumberBadge id="5" label="Rent View All Dialog" className="mb-2" />
      <Dialog open={rentViewAllDialog} onOpenChange={setRentViewAllDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>All Rent Collection - {selectedVehicleForRent?.vehicle?.registrationNumber}</DialogTitle>
            <DialogDescription>
              View and manage all rent payments for the selected period
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {selectedVehicleForRent && (() => {
              const rentStatus = getVehicleRentStatus(selectedVehicleForRent.vehicle.id, selectedVehicleForRent.assignment);
              
              return (
                <>
                  {/* Overdue Alert */}
                  {rentStatus.overdueWeeks.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-start gap-2">
                        <DollarSignIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-green-800">
                            {rentStatus.overdueWeeks.length} week{rentStatus.overdueWeeks.length > 1 ? 's' : ''} pending -
                            Total: ₹{rentStatus.totalOverdue.toLocaleString()}
                          </div>
                          <div className="text-xs text-green-700 mt-1">
                            💰 Collection applies to the oldest pending week first
                            (Week {rentStatus.overdueWeeks[0].weekIndex + 1} - {rentStatus.overdueWeeks[0].weekStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Weeks Grid */}
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {selectedVehicleForRent.allWeeks.map(({ weekIndex, assignmentWeekNumber, weekStartDate, weekEndDate }) => {
                      const weekRentPayment = payments.find(payment => {
                        if (payment.vehicleId !== selectedVehicleForRent.vehicle.id || payment.status !== 'paid') return false;
                        const paymentWeekStart = new Date(payment.weekStart);
                        return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
                      });

                      const today = new Date();
                      const isPastWeek = weekEndDate < today;
                      const isCurrentWeek = weekStartDate <= today && today <= weekEndDate;
                      const isFutureWeek = weekStartDate > today;

                      let bgColor = 'bg-gray-100';
                      let textColor = 'text-gray-600';
                      let borderColor = 'border-gray-200';
                      let icon = <Clock className="h-3 w-3" />;
                      let status = '';

                      if (isPastWeek) {
                        if (weekRentPayment) {
                          bgColor = 'bg-green-100';
                          textColor = 'text-green-700';
                          borderColor = 'border-green-200';
                          icon = <CheckCircle className="h-3 w-3" />;
                          status = 'Collected';
                        } else {
                          bgColor = 'bg-emerald-50';
                          textColor = 'text-emerald-700';
                          borderColor = 'border-emerald-200';
                          icon = <DollarSignIcon className="h-3 w-3" />;
                          status = 'Pending';
                        }
                      } else if (isCurrentWeek) {
                        if (weekRentPayment) {
                          bgColor = 'bg-green-100';
                          textColor = 'text-green-700';
                          borderColor = 'border-green-200';
                          icon = <CheckCircle className="h-3 w-3" />;
                          status = 'Collected';
                        } else {
                          bgColor = 'bg-emerald-100';
                          textColor = 'text-emerald-700';
                          borderColor = 'border-emerald-200';
                          icon = <DollarSignIcon className="h-3 w-3" />;
                          status = 'Collect Now';
                        }
                      }

                      const canMarkPaid = !weekRentPayment && (isCurrentWeek || isPastWeek);

                      return (
                        <div key={weekIndex} className={`${bgColor} ${borderColor} border rounded p-2 text-center`}>
                          <div className={`${textColor} flex justify-center mb-1`}>{icon}</div>
                          <div className={`text-xs font-semibold ${textColor}`}>Week {assignmentWeekNumber}</div>
                          <div className={`text-xs ${textColor}`}>{status}</div>
                          {canMarkPaid && (
                            <Button
                              size="sm"
                              className="w-full mt-1 h-6 text-xs bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setRentViewAllDialog(false);
                                handleRentPaymentClick(weekIndex, selectedVehicleForRent.assignment, weekStartDate);
                              }}
                            >
                              Collect
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Collect Total Due Button */}
                  {rentStatus.totalDue > 0 && (
                    <div className="pt-4 mt-4 border-t border-green-100">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          const weeksToPay = [...rentStatus.overdueWeeks];
                          if (rentStatus.currentWeekDue) {
                            weeksToPay.push(rentStatus.currentWeekDue);
                          }
                          setSelectedRentWeek({
                            weekIndex: -1,
                            assignment: selectedVehicleForRent.assignment,
                            weekStartDate: weeksToPay[0].weekStartDate,
                            vehicleId: selectedVehicleForRent.vehicle.id,
                            isBulkPayment: true,
                            overdueWeeks: weeksToPay
                          });
                          setRentViewAllDialog(false);
                          setConfirmRentPaymentDialog(true);
                        }}
                      >
                        Collect Total Due ({rentStatus.overdueWeeks.length + (rentStatus.currentWeekDue ? 1 : 0)} week{(rentStatus.overdueWeeks.length + (rentStatus.currentWeekDue ? 1 : 0)) !== 1 ? 's' : ''}) - ₹{rentStatus.totalDue.toLocaleString()}
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRentViewAllDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

  {/* Bulk Payment Dialog */}
  <SectionNumberBadge id="6" label="Bulk Payment Dialog" className="mb-2" />
      <BulkPaymentDialog
        isOpen={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        title={bulkDialogTitle}
        description={bulkDialogDescription}
        paymentType={bulkDialogType}
        items={bulkDialogItems}
        onConfirm={handleBulkPaymentConfirm}
        isLoading={isBulkProcessing}
        // Month selection props
        periodType={companyFinancialData.filterType}
        selectedYear={companyFinancialData.selectedYear}
        selectedQuarter={companyFinancialData.selectedQuarter}
      />

  {/* EMI Payment Dialog */}
  <SectionNumberBadge id="7" label="EMI Payment Dialog" className="mb-2" />
      <Dialog open={emiDialogOpen} onOpenChange={setEmiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>EMI Payments - {selectedVehicleForEMI?.registrationNumber}</DialogTitle>
            <DialogDescription>
              Select EMIs to mark as paid. Only unpaid EMIs that can be paid now are shown.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedVehicleForEMI && (
              <>
                {dueEmiDetails.length > 0 && (
                  <div className="rounded border border-dashed border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
                    Select EMIs oldest-first. Choosing a later EMI automatically includes every older due EMI; unselecting one clears all newer selections to keep the order intact.
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {dueEmiDetails.length === 0 ? (
                    <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                      All eligible EMIs are up to date. There is nothing pending right now.
                    </div>
                  ) : (
                    dueEmiDetails.map(({ index, emi, dueDate, daysDiff }) => {
                    const isSelected = selectedEmiIndices.includes(index);

                    let statusText = '';
                    let statusColor = 'text-gray-500';

                    if (daysDiff < 0) {
                      statusText = `${Math.abs(daysDiff)} days overdue`;
                      statusColor = 'text-red-600';
                    } else if (daysDiff <= 7) {
                      statusText = daysDiff === 0 ? 'Due Today' : `${daysDiff} days left`;
                      statusColor = 'text-yellow-600';
                    } else {
                      statusText = `Due ${dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
                    }

                    const checkboxId = `emi-${index}`;

                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-3 border rounded-lg ${isSelected ? 'border-orange-300 bg-orange-50' : ''}`}
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={isSelected}
                          onCheckedChange={() => handleToggleEmiSelection(index)}
                        />
                        <div className="flex-1">
                          <label htmlFor={checkboxId} className="font-medium cursor-pointer">
                            EMI {emi.month}
                          </label>
                          <div className={`text-sm ${statusColor}`}>{statusText}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{(selectedVehicleForEMI.loanDetails?.emiPerMonth || 0).toLocaleString()}</div>
                          {daysDiff < 0 && (
                            <div className="text-xs text-red-500">
                              +₹{Math.max(100, (selectedVehicleForEMI.loanDetails?.emiPerMonth || 0) * 0.02).toLocaleString()} penalty
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                  )}
                </div>
              </>
            )}
            
            {selectedCount > 0 && selectedVehicleForEMI && (
              <div className="flex flex-col gap-3 pt-4 border-t">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-medium">{selectedCount} EMI{selectedCount > 1 ? 's' : ''} selected</div>
                    <div className="text-sm text-gray-600">
                      Total: ₹{selectedEmiIndices.reduce((total, index) => {
                        const emi = selectedVehicleForEMI.loanDetails?.amortizationSchedule?.[index];
                        if (!emi) return total;
                        const dueDate = new Date(emi.dueDate);
                        const today = new Date();
                        const daysPastDue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                        const penalty = daysPastDue > 0 ? Math.max(100, (selectedVehicleForEMI.loanDetails?.emiPerMonth || 0) * 0.02) : 0;
                        return total + (selectedVehicleForEMI.loanDetails?.emiPerMonth || 0) + penalty;
                      }, 0).toLocaleString()}
                    </div>
                  </div>
                  {selectedCount < orderedDueEmiIndices.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllEmis}
                    >
                      Select Oldest Sequence
                    </Button>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleEMIBulkPayment}
                    disabled={isProcessingEMI}
                  >
                    {isProcessingEMI ? 'Processing...' : 'Mark as Paid'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

  {/* Penalty Dialog for Individual EMI Payments */}
  <SectionNumberBadge id="8" label="Penalty Dialog" className="mb-2" />
      <Dialog open={penaltyDialogOpen} onOpenChange={setPenaltyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Penalty Amount</DialogTitle>
            <DialogDescription>
              This EMI is overdue. Enter the penalty amount to be charged (leave as 0 if no penalty).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedEMIForPenalty && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm font-medium text-red-800">Overdue EMI Details</div>
                <div className="mt-2 space-y-1 text-sm text-red-700">
                  <div>Month: {selectedEMIForPenalty.monthIndex + 1}</div>
                  <div>Due Date: {new Date(selectedEMIForPenalty.dueDate).toLocaleDateString()}</div>
                  <div>EMI Amount: ₹{selectedEMIForPenalty.emiAmount.toLocaleString()}</div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="penalty-amount">Penalty Amount (₹)</Label>
              <Input
                id="penalty-amount"
                type="number"
                placeholder="0"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPenaltyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePenaltyConfirm}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

  {/* Rent Payment Confirmation Dialog */}
  <SectionNumberBadge id="9" label="Rent Payment Confirmation" className="mb-2" />
      <AlertDialog open={confirmRentPaymentDialog} onOpenChange={setConfirmRentPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {selectedRentWeek?.isBulkPayment ? 'Confirm Bulk Payment' : 'Confirm Overdue Payment Settlement'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {selectedRentWeek?.isBulkPayment ? (
                // Bulk payment mode
                <>
                  <p className="text-gray-700">
                    You are about to pay all due rent weeks. The following weeks will be processed:
                  </p>
                  <div className="bg-orange-50 p-3 rounded-md space-y-2 max-h-48 overflow-y-auto">
                    {selectedRentWeek.overdueWeeks?.map((week, idx) => {
                      const assignmentStartDate = new Date(selectedRentWeek.assignment.startDate);
                      const weekNumber = Math.floor((week.weekStartDate.getTime() - assignmentStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
                          <span className="font-medium text-gray-700">
                            Week {weekNumber} - {week.weekStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="font-semibold text-orange-700">
                            ₹{week.amount.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-2 mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm font-bold">
                      <span className="text-gray-800">Total Amount:</span>
                      <span className="text-orange-700">
                        ₹{selectedRentWeek.overdueWeeks?.reduce((sum, week) => sum + week.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    All due weeks will be marked as paid in sequence.
                  </p>
                </>
              ) : (
                // Single payment mode (oldest overdue)
                <>
                  <p className="text-gray-700">
                    There are <span className="font-semibold text-red-600">{selectedRentWeek?.overdueWeeks?.length || 0} overdue week(s)</span> for this vehicle.
                  </p>
                  <p className="text-gray-700">
                    You must settle the <span className="font-semibold text-orange-600">oldest overdue week first</span>:
                  </p>
                  {selectedRentWeek && (
                    <div className="bg-orange-50 p-3 rounded-md">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                        <span className="text-sm font-medium text-gray-700">
                          Week {Math.floor((selectedRentWeek.weekStartDate.getTime() - new Date(selectedRentWeek.assignment.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}
                        </span>
                        <span className="text-sm font-semibold text-orange-700">
                          ₹{selectedRentWeek.assignment.weeklyRent.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {selectedRentWeek.weekStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    After settling this, you can proceed with other weeks in order.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRentPayment} className="bg-orange-600 hover:bg-orange-700">
              {selectedRentWeek?.isBulkPayment ? 'Pay All Due' : 'Pay Oldest Week'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GST Payment Confirmation Dialog */}
      <AlertDialog open={confirmGstPaymentDialog} onOpenChange={setConfirmGstPaymentDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="5.1" label="GST Payment Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Confirm GST Payment
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  You are about to pay GST for <span className="font-semibold">{selectedVehicleForPayment?.vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{companyFinancialData.filterType === 'monthly' ? `${companyFinancialData.selectedMonth} ${companyFinancialData.selectedYear}` : companyFinancialData.filterType === 'quarterly' ? `${companyFinancialData.selectedQuarter} ${companyFinancialData.selectedYear}` : companyFinancialData.selectedYear}</span>.
                </p>

                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span className="font-semibold text-blue-800">GST Amount:</span>
                    <span className="font-bold text-blue-700 text-lg">₹{formatCurrency(selectedVehicleForPayment?.gstAmount)}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  This action will record the GST payment and update the cash balance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedVehicleForPayment) {
                  handleGstPayment(selectedVehicleForPayment);
                }
                setConfirmGstPaymentDialog(false);
                setSelectedVehicleForPayment(null);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Pay GST ₹{formatCurrency(selectedVehicleForPayment?.gstActuallyPayable)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Service Charge Collection Confirmation Dialog */}
      <AlertDialog open={confirmServiceChargeDialog} onOpenChange={setConfirmServiceChargeDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="5.2" label="Service Charge Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Confirm Service Charge Collection
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  You are about to withdraw service charge from <span className="font-semibold">{selectedVehicleForPayment?.vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{companyFinancialData.filterType === 'monthly' ? `${companyFinancialData.selectedMonth} ${companyFinancialData.selectedYear}` : companyFinancialData.filterType === 'quarterly' ? `${companyFinancialData.selectedQuarter} ${companyFinancialData.selectedYear}` : companyFinancialData.selectedYear}</span>.
                </p>

                <div className="bg-green-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-800">Service Charge Amount:</span>
                    <span className="font-bold text-green-700 text-lg">₹{formatCurrency(selectedVehicleForPayment?.serviceCharge)}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  This action will withdraw the service charge and update the cash balance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedVehicleForPayment) {
                  handleServiceChargePayment(selectedVehicleForPayment);
                }
                setConfirmServiceChargeDialog(false);
                setSelectedVehicleForPayment(null);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Withdraw ₹{formatCurrency(selectedVehicleForPayment?.serviceCharge)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Partner Payment Confirmation Dialog */}
      <AlertDialog open={confirmPartnerPaymentDialog} onOpenChange={setConfirmPartnerPaymentDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="5.3" label="Partner Payment Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-purple-500" />
              Confirm Partner Payment
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  You are about to pay partner share to <span className="font-semibold">{selectedVehicleForPayment?.vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{companyFinancialData.filterType === 'monthly' ? `${companyFinancialData.selectedMonth} ${companyFinancialData.selectedYear}` : companyFinancialData.filterType === 'quarterly' ? `${companyFinancialData.selectedQuarter} ${companyFinancialData.selectedYear}` : companyFinancialData.selectedYear}</span>.
                </p>

                <div className="bg-purple-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-purple-800">Partner Share Amount:</span>
                    <span className="font-bold text-purple-700 text-lg">₹{formatCurrency(selectedVehicleForPayment?.partnerShare)}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  This action will pay the partner share and update the cash balance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedVehicleForPayment) {
                  handlePartnerPayment(selectedVehicleForPayment);
                }
                setConfirmPartnerPaymentDialog(false);
                setSelectedVehicleForPayment(null);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Pay Partner ₹{formatCurrency(selectedVehicleForPayment?.partnerShare)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Owner Payment Confirmation Dialog */}
      <AlertDialog open={confirmOwnerPaymentDialog} onOpenChange={setConfirmOwnerPaymentDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="5.4" label="Owner Payment Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Confirm Owner Payment
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  You are about to pay the owner for <span className="font-semibold">{selectedVehicleForPayment?.vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{companyFinancialData.filterType === 'monthly' ? `${companyFinancialData.selectedMonth} ${companyFinancialData.selectedYear}` : companyFinancialData.filterType === 'quarterly' ? `${companyFinancialData.selectedQuarter} ${companyFinancialData.selectedYear}` : companyFinancialData.selectedYear}</span>.
                </p>

                <div className="bg-green-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-800">Owner Payment Amount:</span>
                    <span className="font-bold text-green-700 text-lg">₹{formatCurrency(selectedVehicleForPayment?.ownerActuallyPayable)}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  This action will pay the owner and update the cash balance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedVehicleForPayment) {
                  handleOwnerPayment(selectedVehicleForPayment);
                }
                setConfirmOwnerPaymentDialog(false);
                setSelectedVehicleForPayment(null);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Pay Owner ₹{formatCurrency(selectedVehicleForPayment?.ownerActuallyPayable)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backdoor Cash Increase Dialog (Testing Only) */}
      <Dialog open={backdoorDialogOpen} onOpenChange={setBackdoorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Plus className="h-5 w-5" />
              Add Cash to Vehicle (Testing Only)
            </DialogTitle>
            <DialogDescription>
              This is a testing utility to increase vehicle cash in hand. This action is not recorded in accounting transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="vehicle-select">Select Vehicle</Label>
              <Select value={selectedVehicleForBackdoor} onValueChange={setSelectedVehicleForBackdoor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.registrationNumber} - {vehicle.vehicleName || `${vehicle.make} ${vehicle.model}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount to Add (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={backdoorAmount}
                onChange={(e) => setBackdoorAmount(e.target.value)}
                min="1"
                step="1"
              />
            </div>
            {selectedVehicleForBackdoor && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                Current cash in hand: ₹{(vehicleCashBalances[selectedVehicleForBackdoor] || 0).toLocaleString()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBackdoorDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBackdoorCashIncrease}
              disabled={!selectedVehicleForBackdoor || !backdoorAmount || isProcessingBackdoor}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessingBackdoor ? 'Adding...' : 'Add Cash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Payment Month Selection Dialog */}
      <Dialog open={individualPaymentDialogOpen} onOpenChange={setIndividualPaymentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <SectionNumberBadge id="5.5" label="Individual Payment Dialog" className="mb-2" />
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              Select Months for {selectedPaymentType?.replace('_', ' ').toUpperCase()} Payment
            </DialogTitle>
            <DialogDescription>
              Select the months you want to pay for {selectedVehicleForIndividualPayment?.vehicle?.registrationNumber}.
              The amount will be calculated based on actual monthly calculations, not divided equally.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {(() => {
                const quarterMonths = { 'Q1': [0,1,2], 'Q2': [3,4,5], 'Q3': [6,7,8], 'Q4': [9,10,11] };
                const months = companyFinancialData.filterType === 'quarterly' 
                  ? quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths]
                  : Array.from({length: 12}, (_, i) => i);
                
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                
                let breakdown: any[] = [];
                if (selectedPaymentType === 'gst') {
                  breakdown = getGSTBreakdown(selectedVehicleForIndividualPayment);
                } else if (selectedPaymentType === 'service_charge') {
                  breakdown = getServiceChargeBreakdown(selectedVehicleForIndividualPayment);
                } else if (selectedPaymentType === 'partner_share') {
                  breakdown = getPartnerShareBreakdown(selectedVehicleForIndividualPayment);
                } else if (selectedPaymentType === 'owner_payment') {
                  breakdown = getOwnerShareBreakdown(selectedVehicleForIndividualPayment);
                }

                return months.map(monthIndex => {
                  const monthName = monthNames[monthIndex];
                  const breakdownItem = breakdown.find(b => b.month === monthName);
                  const amount = breakdownItem?.amount || 0;
                  const isSelected = selectedPaymentMonths.includes(monthIndex);

                  return (
                    <div
                      key={monthIndex}
                      className={`p-3 border rounded-lg transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      } ${amount === 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:border-gray-300'}`}
                      {...(amount === 0 ? {} : {
                        onClick: () => {
                          setSelectedPaymentMonths(prev => 
                            prev.includes(monthIndex) 
                              ? prev.filter(m => m !== monthIndex)
                              : [...prev, monthIndex]
                          );
                        }
                      })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isSelected} disabled={amount === 0} />
                          <span className="font-medium">{monthName}</span>
                        </div>
                        <span className={`font-semibold ${amount === 0 ? 'text-gray-400' : 'text-green-600'}`}>
                          ₹{formatCurrency(amount)}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-800">Total Selected Amount:</span>
                <span className="font-bold text-blue-700 text-lg">
                  ₹{(() => {
                    if (!selectedVehicleForIndividualPayment || !selectedPaymentType) return '0';
                    
                    let breakdown: any[] = [];
                    if (selectedPaymentType === 'gst') {
                      breakdown = getGSTBreakdown(selectedVehicleForIndividualPayment);
                    } else if (selectedPaymentType === 'service_charge') {
                      breakdown = getServiceChargeBreakdown(selectedVehicleForIndividualPayment);
                    } else if (selectedPaymentType === 'partner_share') {
                      breakdown = getPartnerShareBreakdown(selectedVehicleForIndividualPayment);
                    } else if (selectedPaymentType === 'owner_payment') {
                      breakdown = getOwnerShareBreakdown(selectedVehicleForIndividualPayment);
                    }

                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return formatCurrency(selectedPaymentMonths.reduce((sum, monthIndex) => {
                      const monthName = monthNames[monthIndex];
                      const breakdownItem = breakdown.find(b => b.month === monthName);
                      return sum + (breakdownItem?.amount || 0);
                    }, 0));
                  })()}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIndividualPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleIndividualPaymentConfirm}
              disabled={selectedPaymentMonths.length === 0 || isBulkProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isBulkProcessing ? 'Processing...' : `Pay Selected Months`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default FinancialAccountsTab;
