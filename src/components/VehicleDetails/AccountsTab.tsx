import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/user';
import { useFirestorePaths } from '@/hooks/useFirestorePaths';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, setDoc, getDoc, increment } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  Banknote,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  AlertTriangle
} from 'lucide-react';
import { SectionNumberBadge } from './SectionNumberBadge';

interface AccountsTabProps {
  vehicle: any;
  vehicleId: string;
}

interface AccountingTransaction {
  id: string;
  vehicleId: string;
  type: 'gst_payment' | 'service_charge' | 'partner_payment' | 'owner_share' | 'owner_withdrawal';
  amount: number;
  month: string;
  description: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

const SHOW_SECTION_NUMBERS = true;

const AccountsTab: React.FC<AccountsTabProps> = ({ vehicle, vehicleId }) => {
  const { userInfo } = useAuth();
  const { expenses, payments, addExpense, updateVehicle, getVehicleFinancialData } = useFirebaseData();
  const paths = useFirestorePaths(userInfo?.companyId);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedQuarter, setSelectedQuarter] = useState('1');
  const [accountingTransactions, setAccountingTransactions] = useState<AccountingTransaction[]>([]);
  const [cashInHand, setCashInHand] = useState(0);
  const [confirmRentPaymentDialog, setConfirmRentPaymentDialog] = useState(false);
  const [selectedRentPaymentWeek, setSelectedRentPaymentWeek] = useState<{
    weekIndex: number;
    assignment: any;
    weekStartDate: Date;
    willSettleWeek?: number;
  } | null>(null);
  const [selectedRentWeekIndices, setSelectedRentWeekIndices] = useState<number[]>([]);
  const [isProcessingRentPayment, setIsProcessingRentPayment] = useState(false);
  const [bulkPaymentDialog, setBulkPaymentDialog] = useState(false);
  const [penaltyAmounts, setPenaltyAmounts] = useState<Record<number, string>>({});
  const [selectedEmiIndices, setSelectedEmiIndices] = useState<number[]>([]);
  const [isProcessingBulkPayment, setIsProcessingBulkPayment] = useState(false);
  const [isProcessingGstPayment, setIsProcessingGstPayment] = useState(false);
  const [isProcessingServiceCharge, setIsProcessingServiceCharge] = useState(false);
  const [isProcessingPartnerPayment, setIsProcessingPartnerPayment] = useState(false);
  const [isProcessingOwnerShare, setIsProcessingOwnerShare] = useState(false);
  const [selectedGstMonthIndices, setSelectedGstMonthIndices] = useState<number[]>([]);
  const [selectedServiceChargeMonthIndices, setSelectedServiceChargeMonthIndices] = useState<number[]>([]);
  const [selectedPartnerMonthIndices, setSelectedPartnerMonthIndices] = useState<number[]>([]);
  const [selectedOwnerShareMonthIndices, setSelectedOwnerShareMonthIndices] = useState<number[]>([]);

  // Confirmation dialogs for financial actions
  const [confirmGstPaymentDialog, setConfirmGstPaymentDialog] = useState(false);
  const [confirmServiceChargeDialog, setConfirmServiceChargeDialog] = useState(false);
  const [confirmPartnerPaymentDialog, setConfirmPartnerPaymentDialog] = useState(false);
  const [confirmOwnerShareDialog, setConfirmOwnerShareDialog] = useState(false);
  const [confirmOwnerWithdrawalDialog, setConfirmOwnerWithdrawalDialog] = useState(false);

  // Month selection dialogs for financial actions
  const [confirmServiceChargeMonthSelectionDialog, setConfirmServiceChargeMonthSelectionDialog] = useState(false);
  const [confirmPartnerMonthSelectionDialog, setConfirmPartnerMonthSelectionDialog] = useState(false);
  const [confirmOwnerShareMonthSelectionDialog, setConfirmOwnerShareMonthSelectionDialog] = useState(false);

  const [selectedMonthData, setSelectedMonthData] = useState<any>(null);

  const formatCurrency = (value?: number | null) => (value ?? 0).toLocaleString();

  const financialData = useMemo(() => {
    if (!getVehicleFinancialData) {
      return null;
    }
    return getVehicleFinancialData(vehicleId) || null;
  }, [getVehicleFinancialData, vehicleId, payments, expenses, vehicle]);

  const vehiclePayments = useMemo(() => {
    return payments.filter((payment: any) => payment.vehicleId === vehicleId);
  }, [payments, vehicleId]);

  const rentSummary = useMemo(() => {
    if (!vehicle?.assignedDriverId || !financialData?.currentAssignment) {
      return {
        overdueWeeks: [] as Array<{ weekIndex: number; weekStartDate: Date; amount: number }> ,
        currentWeekDue: null as { weekIndex: number; weekStartDate: Date; amount: number } | null,
        totalOverdue: 0,
        dueTodayAmount: 0,
        totalDue: 0
      };
    }

    const currentAssignment = financialData.currentAssignment;
    const startDateRaw = currentAssignment.startDate;
    const assignmentStartDate = new Date(
      typeof startDateRaw === 'string'
        ? startDateRaw
        : startDateRaw?.toDate?.() || startDateRaw
    );

    const agreementEndDate = new Date(assignmentStartDate);
    agreementEndDate.setMonth(agreementEndDate.getMonth() + (currentAssignment.agreementDuration || 12));
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

      const weekRentPayment = vehiclePayments.find((payment: any) => {
        if (payment.vehicleId !== vehicleId || payment.status !== 'paid') return false;
        const paymentWeekStart = new Date(payment.weekStart);
        return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
      });

      if (weekRentPayment) {
        continue;
      }

      const isPastWeek = weekEndDate < today;
      const isCurrentWeek = weekStartDate <= today && today <= weekEndDate;

      if (isPastWeek) {
        overdueWeeks.push({
          weekIndex,
          weekStartDate,
          amount: currentAssignment.weeklyRent
        });
      } else if (isCurrentWeek) {
        currentWeekDue = {
          weekIndex,
          weekStartDate,
          amount: currentAssignment.weeklyRent
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
  }, [vehicle, vehicleId, vehiclePayments, financialData]);

  const allDueWeeks = useMemo(() => {
    const combined = [...rentSummary.overdueWeeks];
    if (rentSummary.currentWeekDue) {
      combined.push(rentSummary.currentWeekDue);
    }
    return combined;
  }, [rentSummary.overdueWeeks, rentSummary.currentWeekDue]);

  const orderedRentWeekIndices = useMemo(() => allDueWeeks.map(week => week.weekIndex), [allDueWeeks]);

  const selectedRentWeeks = useMemo(() => {
    return allDueWeeks.filter(week => selectedRentWeekIndices.includes(week.weekIndex));
  }, [allDueWeeks, selectedRentWeekIndices]);

  const selectedRentWeekTotal = useMemo(() => {
    return selectedRentWeeks.reduce((sum, week) => sum + week.amount, 0);
  }, [selectedRentWeeks]);

  const selectedRentWeekCount = selectedRentWeekIndices.length;

  const handleToggleRentWeekSelection = (weekIndex: number) => {
    const orderedIndices = orderedRentWeekIndices;
    const position = orderedIndices.indexOf(weekIndex);
    if (position === -1) {
      return;
    }

    const isSelected = selectedRentWeekIndices.includes(weekIndex);

    if (!isSelected) {
      setSelectedRentWeekIndices(orderedIndices.slice(0, position + 1));
    } else {
      const retained = orderedIndices.slice(0, position);
      setSelectedRentWeekIndices(retained);
    }
  };

  const handleSelectAllRentWeeks = () => {
    if (orderedRentWeekIndices.length === 0) {
      setSelectedRentWeekIndices([]);
      return;
    }
    setSelectedRentWeekIndices([...orderedRentWeekIndices]);
  };

  useEffect(() => {
    if (confirmRentPaymentDialog && selectedRentPaymentWeek?.weekIndex === -1) {
      if (selectedRentWeekIndices.length === 0) {
        if (orderedRentWeekIndices.length > 0) {
          setSelectedRentWeekIndices(orderedRentWeekIndices);
        } else {
          setSelectedRentWeekIndices([]);
        }
      }
    }

    if (!confirmRentPaymentDialog) {
      setSelectedRentWeekIndices([]);
    }
  }, [
    confirmRentPaymentDialog,
    orderedRentWeekIndices,
    selectedRentPaymentWeek,
    selectedRentWeekIndices.length
  ]);

  const emiSummary = useMemo(() => {
    if (!vehicle?.loanDetails?.amortizationSchedule) {
      return {
        overdueEMIs: [] as Array<{ index: number; emi: any; daysPastDue: number; amount: number }> ,
        dueSoonEMIs: [] as Array<{ index: number; emi: any; daysUntilDue: number; amount: number }> ,
        totalOverdue: 0,
        totalDueSoon: 0,
        totalDue: 0,
        allDueEMIs: [] as Array<{ index: number; emi: any; amount: number; daysPastDue?: number; daysUntilDue?: number }>
      };
    }

    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const overdueEMIs: Array<{ index: number; emi: any; daysPastDue: number; amount: number }> = [];
    const dueSoonEMIs: Array<{ index: number; emi: any; daysUntilDue: number; amount: number }> = [];
    const allDueEMIs: Array<{ index: number; emi: any; amount: number; daysPastDue?: number; daysUntilDue?: number }> = [];

    vehicle.loanDetails.amortizationSchedule.forEach((emi: any, index: number) => {
      if (emi.isPaid) return;

      const dueDate = new Date(emi.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const emiAmount = vehicle.loanDetails?.emiPerMonth || 0;

      if (daysDiff < 0) {
        overdueEMIs.push({
          index,
          emi,
          daysPastDue: Math.abs(daysDiff),
          amount: emiAmount
        });
        allDueEMIs.push({
          index,
          emi,
          amount: emiAmount,
          daysPastDue: Math.abs(daysDiff)
        });
      } else if (daysDiff <= 3) {
        dueSoonEMIs.push({
          index,
          emi,
          daysUntilDue: daysDiff,
          amount: emiAmount
        });
        allDueEMIs.push({
          index,
          emi,
          amount: emiAmount,
          daysUntilDue: daysDiff
        });
      }
    });

    const totalOverdue = overdueEMIs.reduce((sum, item) => sum + item.amount, 0);
    const totalDueSoon = dueSoonEMIs.reduce((sum, item) => sum + item.amount, 0);

    return {
      overdueEMIs,
      dueSoonEMIs,
      totalOverdue,
      totalDueSoon,
      totalDue: totalOverdue + totalDueSoon,
      allDueEMIs
    };
  }, [vehicle]);

  const orderedDueEmiIndices = useMemo(
    () => emiSummary.allDueEMIs.map(item => item.index),
    [emiSummary.allDueEMIs]
  );

  useEffect(() => {
    if (bulkPaymentDialog) {
      if (orderedDueEmiIndices.length > 0) {
        setSelectedEmiIndices(orderedDueEmiIndices);
      } else {
        setSelectedEmiIndices([]);
      }
    } else {
      setSelectedEmiIndices([]);
      setPenaltyAmounts({});
    }
  }, [bulkPaymentDialog, orderedDueEmiIndices]);

  const selectedEmis = useMemo(
    () => emiSummary.allDueEMIs.filter(emi => selectedEmiIndices.includes(emi.index)),
    [emiSummary.allDueEMIs, selectedEmiIndices]
  );

  const totalSelectedEmiAmount = useMemo(
    () => selectedEmis.reduce((sum, emi) => sum + emi.amount, 0),
    [selectedEmis]
  );

  const totalSelectedPenalties = useMemo(
    () => selectedEmis.reduce((sum, emi) => sum + (parseFloat(penaltyAmounts[emi.index]) || 0), 0),
    [selectedEmis, penaltyAmounts]
  );

  const grandTotal = totalSelectedEmiAmount + totalSelectedPenalties;
  const selectedCount = selectedEmiIndices.length;

  const handleToggleEmiSelection = (emiIndex: number) => {
    const orderedIndices = orderedDueEmiIndices;
    const position = orderedIndices.indexOf(emiIndex);
    if (position === -1) {
      return;
    }

    const isSelected = selectedEmiIndices.includes(emiIndex);

    if (!isSelected) {
      setSelectedEmiIndices(orderedIndices.slice(0, position + 1));
    } else {
      const retained = orderedIndices.slice(0, position);
      setSelectedEmiIndices(retained);
      setPenaltyAmounts(prev => {
        const updated = { ...prev };
        orderedIndices.slice(position).forEach(idx => {
          if (updated[idx] !== undefined) {
            delete updated[idx];
          }
        });
        return updated;
      });
    }
  };

  const handleSelectAllEmis = () => {
    if (orderedDueEmiIndices.length === 0) {
      return;
    }
    setSelectedEmiIndices(orderedDueEmiIndices);
  };

  const handleToggleGstMonthSelection = (monthIndex: number) => {
    const isSelected = selectedGstMonthIndices.includes(monthIndex);
    if (isSelected) {
      setSelectedGstMonthIndices(prev => prev.filter(idx => idx !== monthIndex));
    } else {
      setSelectedGstMonthIndices(prev => [...prev, monthIndex]);
    }
  };

  const markRentCollected = async (weekIndex: number, assignment: any, weekStartDate: Date, showToast: boolean = true) => {
    try {
      if (!assignment || !vehicle?.assignedDriverId) {
        toast({
          title: 'Error',
          description: 'No active assignment found for this vehicle.',
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

      const existingPayment = vehiclePayments.find((payment: any) => {
        if (payment.vehicleId !== vehicleId || payment.status !== 'paid') return false;
        const paymentWeekStart = new Date(payment.weekStart);
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

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);

      const paymentData = {
        assignmentId: assignment.id || '',
        vehicleId: vehicleId,
        driverId: vehicle.assignedDriverId,
        weekStart: weekStartDate.toISOString().split('T')[0],
        weekNumber: weekIndex + 1,
        amountDue: assignment.weeklyRent,
        amountPaid: assignment.weeklyRent,
        paidAt: new Date().toISOString(),
        collectionDate: new Date().toISOString(),
        nextDueDate: new Date(weekEndDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysLeft: 7,
        status: 'paid' as const,
        companyId: userInfo.companyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const paymentsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/payments`);
      await addDoc(paymentsRef, paymentData);

      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await setDoc(cashRef, {
        balance: increment(assignment.weeklyRent),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      if (showToast) {
        toast({
          title: 'Rent Collected Successfully! 🎉',
          description: `Weekly rent of ₹${assignment.weeklyRent.toLocaleString()} for assignment week ${weekIndex + 1} (${weekStartDate.toLocaleDateString('en-IN')}) has been recorded.`,
        });
      }
    } catch (error) {
      console.error('Error recording rent payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record rent payment. Please try again.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleConfirmRentPayment = async () => {
    if (!selectedRentPaymentWeek) {
      setConfirmRentPaymentDialog(false);
      return;
    }

    const assignment = selectedRentPaymentWeek.assignment || financialData?.currentAssignment;

    if (!assignment) {
      toast({
        title: 'Assignment Missing',
        description: 'Unable to find an active assignment for this vehicle. Please refresh and try again.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedRentPaymentWeek.weekIndex === -1) {
      const weeksToPay = allDueWeeks
        .filter(week => selectedRentWeekIndices.includes(week.weekIndex))
        .sort((a, b) => a.weekIndex - b.weekIndex);

      if (weeksToPay.length === 0) {
        toast({
          title: 'No Weeks Selected',
          description: 'Select at least one week in sequence to collect rent.',
          variant: 'destructive'
        });
        return;
      }

      setIsProcessingRentPayment(true);

      try {
        for (const week of weeksToPay) {
          await markRentCollected(week.weekIndex, assignment, week.weekStartDate, false);
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        toast({
          title: 'Bulk Rent Collection Completed! 🎉',
          description: `Collected ${weeksToPay.length} week${weeksToPay.length > 1 ? 's' : ''} totaling ₹${selectedRentWeekTotal.toLocaleString()}.`
        });

        setConfirmRentPaymentDialog(false);
        setSelectedRentPaymentWeek(null);
        setSelectedRentWeekIndices([]);
      } catch (error) {
        console.error('Error recording bulk rent payments:', error);
        toast({
          title: 'Bulk Collection Failed',
          description: 'Some rent payments could not be recorded. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsProcessingRentPayment(false);
      }
    } else {
      setIsProcessingRentPayment(true);

      try {
        if (rentSummary.overdueWeeks.length > 0) {
          const oldestOverdueWeek = rentSummary.overdueWeeks[0];
          await markRentCollected(
            oldestOverdueWeek.weekIndex,
            assignment,
            oldestOverdueWeek.weekStartDate
          );
        } else {
          await markRentCollected(
            selectedRentPaymentWeek.weekIndex,
            assignment,
            selectedRentPaymentWeek.weekStartDate
          );
        }

        setConfirmRentPaymentDialog(false);
        setSelectedRentPaymentWeek(null);
        setSelectedRentWeekIndices([]);
      } catch (error) {
        console.error('Error recording rent payment:', error);
        toast({
          title: 'Payment Failed',
          description: 'The rent payment could not be recorded. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsProcessingRentPayment(false);
      }
    }
  };

  const processEMIPayment = async (monthIndex: number, scheduleItem: any, penalty: number = 0, suppressToast: boolean = false) => {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle not found');
      }

      let latestLoanDetails = vehicle?.loanDetails;
      try {
        const vehiclesPath = paths?.getVehiclesPath?.();
        if (vehiclesPath) {
          const vehicleRef = doc(firestore, vehiclesPath, vehicleId);
          const vehicleSnapshot = await getDoc(vehicleRef);
          if (vehicleSnapshot.exists()) {
            const latestData = vehicleSnapshot.data() as any;
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

      if (scheduleItem) {
        scheduleItem.isPaid = true;
        scheduleItem.paidAt = paymentDate;
      }

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

      if (vehicle?.loanDetails) {
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
          type: 'paid',
          paymentType: 'emi'
        }
      ];

      if (penalty > 0) {
        expenseEntries.push({
          amount: penalty,
          description: `EMI penalty for month ${monthIndex + 1} (${Math.ceil((new Date().getTime() - new Date(scheduleItem?.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days late)`,
          type: 'general'
        });
      }

      await expenseEntries.reduce(
        (chain, entry) =>
          chain.then(() =>
            addExpense({
              vehicleId,
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

  const handleBulkEMIPayment = async () => {
    if (!vehicle?.loanDetails?.amortizationSchedule) {
      toast({
        title: 'Error',
        description: 'Bulk payment functionality not available.',
        variant: 'destructive'
      });
      return;
    }

    const emisToProcess = emiSummary.allDueEMIs.filter(emi => selectedEmiIndices.includes(emi.index));

    if (emisToProcess.length === 0) {
      toast({
        title: 'No EMIs Selected',
        description: 'Select at least one EMI in sequence to process the payment.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingBulkPayment(true);
    let successCount = 0;
    let totalAmount = 0;

    try {
      for (const emi of emisToProcess) {
        const penalty = parseFloat(penaltyAmounts[emi.index]) || 0;

        try {
          await processEMIPayment(emi.index, emi.emi, penalty, true);
          successCount++;
          totalAmount += emi.amount + penalty;

          toast({
            title: `EMI ${emi.emi.month} Paid ✅`,
            description: `₹${(emi.amount + penalty).toLocaleString()} paid successfully.`
          });

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error processing EMI ${emi.emi.month}:`, error);
          toast({
            title: `Error on EMI ${emi.emi.month}`,
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

      setBulkPaymentDialog(false);
      setPenaltyAmounts({});
      setSelectedEmiIndices([]);
    } catch (error) {
      console.error('Error processing bulk EMI payment:', error);
      toast({
        title: 'Bulk Payment Failed',
        description: `Only ${successCount} payments were processed. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsProcessingBulkPayment(false);
    }
  };

  // Load accounting transactions
  useEffect(() => {
    if (!userInfo?.companyId || !vehicleId) return;

    const transactionsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
    const q = query(
      transactionsRef,
      where('vehicleId', '==', vehicleId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccountingTransaction[];
      setAccountingTransactions(transactions);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId, vehicleId]);

  // Calculate cash in hand
  useEffect(() => {
    if (!userInfo?.companyId || !vehicleId) return;

    const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
    const unsubscribe = onSnapshot(cashRef, (doc) => {
      if (doc.exists()) {
        setCashInHand(doc.data().balance || 0);
      }
    });

    return () => unsubscribe();
  }, [userInfo?.companyId, vehicleId]);

  // Get months/quarters for selected period
  const periodOptions = useMemo(() => {
    const year = parseInt(selectedYear);
    if (selectedPeriod === 'month') {
      return Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: new Date(year, i).toLocaleString('default', { month: 'long' })
      }));
    } else if (selectedPeriod === 'quarter') {
      return [
        { value: '1', label: 'Q1 (Jan-Mar)' },
        { value: '2', label: 'Q2 (Apr-Jun)' },
        { value: '3', label: 'Q3 (Jul-Sep)' },
        { value: '4', label: 'Q4 (Oct-Dec)' }
      ];
    }
    return [];
  }, [selectedPeriod, selectedYear]);

  // Calculate monthly accounting data
  const monthlyData = useMemo(() => {
    const year = parseInt(selectedYear);
    let monthsToShow: number[] = [];

    if (selectedPeriod === 'month') {
      const month = parseInt(selectedMonth) - 1;
      monthsToShow = [month];
    } else if (selectedPeriod === 'quarter') {
      const quarter = parseInt(selectedQuarter);
      const startMonth = (quarter - 1) * 3;
      monthsToShow = [startMonth, startMonth + 1, startMonth + 2];
    } else if (selectedPeriod === 'year') {
      monthsToShow = Array.from({ length: 12 }, (_, i) => i);
    }

    return monthsToShow.map(month => {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

      // Filter payments and expenses for this month
      const monthPayments = payments.filter(p =>
        p.vehicleId === vehicleId &&
        p.status === 'paid' &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
      );

      const monthExpenses = expenses.filter(e =>
        e.vehicleId === vehicleId &&
        e.status === 'approved' &&
        new Date(e.createdAt) >= monthStart &&
        new Date(e.createdAt) <= monthEnd
      );

      const earnings = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = earnings - totalExpenses;

      // Debug logging for monthly data
      // console.log(`Month ${month + 1}/${year}: Earnings=${earnings}, Expenses=${totalExpenses}, Profit=${profit}, Payments=${monthPayments.length}`);

      // GST calculation (4% - only if profit is positive)
      const gstAmount = profit > 0 ? profit * 0.04 : 0;

      // Service charge (10% for partner taxis - only if profit is positive)
      const isPartnerTaxi = vehicle?.isPartnership === true;
      const serviceChargeRate = vehicle?.serviceChargeRate || 0.10; // Default 10%
      const serviceCharge = isPartnerTaxi && profit > 0 ? profit * serviceChargeRate : 0;

      // Partner share (configurable percentage after GST and service charge - only if remaining profit is positive)
      const partnerSharePercentage = vehicle?.partnershipPercentage ? vehicle.partnershipPercentage / 100 : 0.50; // Convert percentage to decimal
      const remainingProfitAfterDeductions = profit - gstAmount - serviceCharge;
      const partnerShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
        remainingProfitAfterDeductions * partnerSharePercentage : 0;

      // Owner's share (remaining after partner share - only if remaining profit is positive)
      const ownerSharePercentage = 1 - partnerSharePercentage; // Complement of partner share
      const ownerShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
        remainingProfitAfterDeductions * ownerSharePercentage : 0;

      // Owner's full share for company-owned taxis (profit after GST - no service charge or partner share)
      const ownerFullShare = !isPartnerTaxi && (profit - gstAmount) > 0 ? profit - gstAmount : 0;

      // Check if GST, service charge, partner payment are completed
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const gstPaid = accountingTransactions.some(t =>
        t.type === 'gst_payment' && t.month === monthStr && t.status === 'completed'
      );
      const serviceChargeCollected = accountingTransactions.some(t =>
        t.type === 'service_charge' && t.month === monthStr && t.status === 'completed'
      );
      const partnerPaid = accountingTransactions.some(t =>
        t.type === 'partner_payment' && t.month === monthStr && t.status === 'completed'
      );
      const ownerShareCollected = accountingTransactions.some(t =>
        t.type === 'owner_share' && t.month === monthStr && t.status === 'completed'
      );
      const ownerWithdrawn = accountingTransactions.some(t =>
        t.type === 'owner_withdrawal' && t.month === monthStr && t.status === 'completed'
      );

      return {
        month,
        monthName: new Date(year, month).toLocaleString('default', { month: 'long' }),
        year,
        earnings,
        expenses: monthExpenses,
        totalExpenses,
        profit,
        gstAmount,
        serviceCharge,
        partnerShare,
        ownerShare,
        ownerFullShare,
        gstPaid,
        serviceChargeCollected,
        partnerPaid,
        ownerShareCollected,
        ownerWithdrawn,
        monthStr
      };
    });
  }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter, payments, expenses, accountingTransactions, vehicle, vehicleId]);

  // Handle GST payment
  const handleGstPayment = async (monthData: any) => {
    try {
      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        vehicleId,
        type: 'gst_payment',
        amount: monthData.gstAmount,
        month: monthData.monthStr,
        description: `GST Payment for ${monthData.monthName} ${monthData.year}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Update cash in hand
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await setDoc(cashRef, {
        balance: increment(-monthData.gstAmount),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast({
        title: 'GST Paid Successfully',
        description: `₹${monthData.gstAmount.toLocaleString()} GST payment recorded for ${monthData.monthName} ${monthData.year}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record GST payment',
        variant: 'destructive'
      });
    }
  };

  const selectedGstMonths = useMemo(() => {
    return monthlyData.filter(month => selectedGstMonthIndices.includes(month.month));
  }, [monthlyData, selectedGstMonthIndices]);

  const selectedGstMonthTotal = useMemo(() => {
    return selectedGstMonths.reduce((sum, month) => sum + month.gstAmount, 0);
  }, [selectedGstMonths]);

  const selectedServiceChargeMonths = useMemo(() => {
    return monthlyData.filter(month => selectedServiceChargeMonthIndices.includes(month.month));
  }, [monthlyData, selectedServiceChargeMonthIndices]);

  const selectedServiceChargeMonthTotal = useMemo(() => {
    return selectedServiceChargeMonths.reduce((sum, month) => sum + month.serviceCharge, 0);
  }, [selectedServiceChargeMonths]);

  const selectedPartnerMonths = useMemo(() => {
    return monthlyData.filter(month => selectedPartnerMonthIndices.includes(month.month));
  }, [monthlyData, selectedPartnerMonthIndices]);

  const selectedPartnerMonthTotal = useMemo(() => {
    return selectedPartnerMonths.reduce((sum, month) => sum + month.partnerShare, 0);
  }, [selectedPartnerMonths]);

  const selectedOwnerShareMonths = useMemo(() => {
    return monthlyData.filter(month => selectedOwnerShareMonthIndices.includes(month.month));
  }, [monthlyData, selectedOwnerShareMonthIndices]);

  const selectedOwnerShareMonthTotal = useMemo(() => {
    return selectedOwnerShareMonths.reduce((sum, month) => sum + month.ownerShare, 0);
  }, [selectedOwnerShareMonths]);

  // Handle service charge collection
  const handleServiceChargeCollection = async (monthData: any) => {
    try {
      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        vehicleId,
        type: 'service_charge',
        amount: monthData.serviceCharge,
        month: monthData.monthStr,
        description: `Service Charge Collection for ${monthData.monthName} ${monthData.year}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Update cash in hand - DECREASE when owner withdraws service charge
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await setDoc(cashRef, {
        balance: increment(-monthData.serviceCharge),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast({
        title: 'Service Charge Withdrawn',
        description: `₹${monthData.serviceCharge.toLocaleString()} service charge withdrawn for ${monthData.monthName} ${monthData.year}`,
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
  const handlePartnerPayment = async (monthData: any) => {
    try {
      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        vehicleId,
        type: 'partner_payment',
        amount: monthData.partnerShare,
        month: monthData.monthStr,
        description: `Partner Payment for ${monthData.monthName} ${monthData.year}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Update cash in hand
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await setDoc(cashRef, {
        balance: increment(-monthData.partnerShare),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast({
        title: 'Partner Paid Successfully',
        description: `₹${monthData.partnerShare.toLocaleString()} paid to partner for ${monthData.monthName} ${monthData.year}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record partner payment',
        variant: 'destructive'
      });
    }
  };

  // Handle owner's share collection
  const handleOwnerShareCollection = async (monthData: any) => {
    try {
      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        vehicleId,
        type: 'owner_share',
        amount: monthData.ownerShare,
        month: monthData.monthStr,
        description: `Owner's Share Collection for ${monthData.monthName} ${monthData.year}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Update cash in hand
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await setDoc(cashRef, {
        balance: increment(-monthData.ownerShare),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast({
        title: 'Owner\'s Share Collected',
        description: `₹${monthData.ownerShare.toLocaleString()} collected as owner's share for ${monthData.monthName} ${monthData.year}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to collect owner\'s share',
        variant: 'destructive'
      });
    }
  };

  // Handle owner's withdrawal for company-owned taxis
  const handleOwnerWithdrawal = async (monthData: any) => {
    try {
      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        vehicleId,
        type: 'owner_withdrawal',
        amount: monthData.ownerFullShare,
        month: monthData.monthStr,
        description: `Owner's Withdrawal for ${monthData.monthName} ${monthData.year}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Update cash in hand
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await setDoc(cashRef, {
        balance: increment(-monthData.ownerFullShare),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast({
        title: 'Owner\'s Withdrawal Completed',
        description: `₹${monthData.ownerFullShare.toLocaleString()} withdrawn for ${monthData.monthName} ${monthData.year}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process owner\'s withdrawal',
        variant: 'destructive'
      });
    }
  };

  // Calculate cumulative data
  const cumulativeData = useMemo(() => {
    const totalEarnings = monthlyData.reduce((sum, m) => sum + m.earnings, 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.totalExpenses, 0);
    const totalProfit = totalEarnings - totalExpenses;

    // GST calculation (4% on total profit - only if total profit is positive)
    const totalGst = totalProfit > 0 ? totalProfit * 0.04 : 0;

    // Service charge (10% for partner taxis - only if total profit is positive)
    const isPartnerTaxi = vehicle?.isPartnership === true;
    const serviceChargeRate = vehicle?.serviceChargeRate || 0.10; // Default 10%
    const totalServiceCharge = isPartnerTaxi && totalProfit > 0 ? totalProfit * serviceChargeRate : 0;

    // Partner share and owner share calculations (on remaining profit after GST and service charge)
    const remainingProfitAfterDeductions = totalProfit - totalGst - totalServiceCharge;
    const partnerSharePercentage = vehicle?.partnershipPercentage ? vehicle.partnershipPercentage / 100 : 0.50; // Convert percentage to decimal

    let totalPartnerShare = 0;
    let totalOwnerShare = 0;
    let totalOwnerWithdrawal = 0;

    if (isPartnerTaxi && remainingProfitAfterDeductions > 0) {
      totalPartnerShare = remainingProfitAfterDeductions * partnerSharePercentage;
      totalOwnerShare = remainingProfitAfterDeductions * (1 - partnerSharePercentage);
    } else if (!isPartnerTaxi && (totalProfit - totalGst) > 0) {
      totalOwnerWithdrawal = totalProfit - totalGst;
    }

    // Debug logging
    // console.log('=== Partnership Calculation Debug ===');
    // console.log('Selected Period:', selectedPeriod, 'Year:', selectedYear, 'Month:', selectedMonth, 'Quarter:', selectedQuarter);
    // console.log('Vehicle object:', vehicle);
    // console.log('Vehicle ID:', vehicle?.id, 'Is Partnership:', vehicle?.isPartnership);
    // console.log('Is Partner Taxi:', isPartnerTaxi);
    // console.log('Service Charge Rate:', serviceChargeRate);
    // console.log('Partner Share %:', partnerSharePercentage);
    // console.log('Total Earnings:', totalEarnings);
    // console.log('Total Expenses:', totalExpenses);
    // console.log('Total Profit:', totalProfit);
    // console.log('Total GST:', totalGst);
    // console.log('Total Service Charge:', totalServiceCharge);
    // console.log('Remaining Profit After Deductions:', remainingProfitAfterDeductions);
    // console.log('Total Partner Share:', totalPartnerShare);
    // console.log('Total Owner Share:', totalOwnerShare);

    // Show what the values would be if this was a partner taxi
    // if (!isPartnerTaxi && totalProfit > 0) {
    //   const hypotheticalServiceCharge = totalProfit * serviceChargeRate;
    //   const hypotheticalRemainingProfit = totalProfit - totalGst - hypotheticalServiceCharge;
    //   const hypotheticalPartnerShare = hypotheticalRemainingProfit > 0 ? hypotheticalRemainingProfit * partnerSharePercentage : 0;
    //   const hypotheticalOwnerShare = hypotheticalRemainingProfit > 0 ? hypotheticalRemainingProfit * (1 - partnerSharePercentage) : 0;

    //   console.log('=== HYPOTHETICAL PARTNER TAXI CALCULATIONS ===');
    //   console.log('If this was a partner taxi:');
    //   console.log('Service Charge would be:', hypotheticalServiceCharge);
    //   console.log('Partner Share would be:', hypotheticalPartnerShare);
    //   console.log('Owner Share would be:', hypotheticalOwnerShare);
    //   console.log('===============================================');
    // }

    // console.log('=====================================');

    return {
      totalEarnings,
      totalExpenses,
      totalProfit,
      totalGst,
      totalServiceCharge,
      totalPartnerShare,
      totalOwnerShare,
      totalOwnerWithdrawal
    };
  }, [monthlyData, vehicle]);

  // Calculate actually payable amounts (Total - Already Paid for current period)
  const actuallyPayable = useMemo(() => {
    const year = parseInt(selectedYear);
    let periodStrings: string[] = [];

    // Generate period strings based on current view
    if (selectedPeriod === 'month' && selectedMonth) {
      const monthName = new Date(year, parseInt(selectedMonth) - 1).toLocaleString('default', { month: 'long' });
      periodStrings = [`${year}-${monthName}`];
    } else if (selectedPeriod === 'quarter' && selectedQuarter) {
      const quarterMonths = {
        'Q1': [0, 1, 2], 'Q2': [3, 4, 5], 'Q3': [6, 7, 8], 'Q4': [9, 10, 11]
      };
      const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths];
      if (months) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        periodStrings = months.map(monthIndex => `${year}-${monthNames[monthIndex]}`);
      }
    } else if (selectedPeriod === 'year') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      periodStrings = monthNames.map(monthName => `${year}-${monthName}`);
    }

    // Calculate paid amounts for current period
    const paidAmounts = {
      gst: 0,
      serviceCharge: 0,
      partnerShare: 0,
      ownerShare: 0,
      ownerWithdrawal: 0
    };

    periodStrings.forEach(periodStr => {
      accountingTransactions?.forEach((transaction: any) => {
        if (transaction.status === 'completed' && transaction.month === periodStr && transaction.vehicleId === vehicleId) {
          switch (transaction.type) {
            case 'gst_payment':
              paidAmounts.gst += transaction.amount;
              break;
            case 'service_charge':
              paidAmounts.serviceCharge += transaction.amount;
              break;
            case 'partner_payment':
              paidAmounts.partnerShare += transaction.amount;
              break;
            case 'owner_share':
              paidAmounts.ownerShare += transaction.amount;
              break;
            case 'owner_withdrawal':
              paidAmounts.ownerWithdrawal += transaction.amount;
              break;
          }
        }
      });
    });

    return {
      gstActuallyPayable: Math.max(0, (cumulativeData?.totalGst || 0) - paidAmounts.gst),
      serviceChargeActuallyPayable: Math.max(0, (cumulativeData?.totalServiceCharge || 0) - paidAmounts.serviceCharge),
      partnerShareActuallyPayable: Math.max(0, (cumulativeData?.totalPartnerShare || 0) - paidAmounts.partnerShare),
      ownerShareActuallyPayable: Math.max(0, ((cumulativeData?.totalOwnerShare || 0) + (cumulativeData?.totalOwnerWithdrawal || 0)) - paidAmounts.ownerShare - paidAmounts.ownerWithdrawal),
      paidAmounts
    };
  }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter, accountingTransactions, vehicleId, cumulativeData]);

  const cumulativePeriodKey = useMemo(() => {
    if (selectedPeriod === 'year') {
      return selectedYear;
    }
    if (selectedPeriod === 'quarter') {
      return `${selectedYear}-Q${selectedQuarter}`;
    }
    return `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
  }, [selectedPeriod, selectedYear, selectedQuarter, selectedMonth]);

  const cumulativePeriodLabel = useMemo(() => {
    if (selectedPeriod === 'year') {
      return selectedYear;
    }
    if (selectedPeriod === 'quarter') {
      return `Q${selectedQuarter} ${selectedYear}`;
    }
    const monthName = new Date(
      parseInt(selectedYear),
      Math.max(parseInt(selectedMonth) - 1, 0)
    ).toLocaleString('default', { month: 'long' });
    return `${monthName} ${selectedYear}`;
  }, [selectedPeriod, selectedYear, selectedQuarter, selectedMonth]);

  const selectedDialogPeriodLabel = useMemo(() => {
    if (!selectedMonthData) {
      return '';
    }

    if (selectedMonthData.periodLabel) {
      return selectedMonthData.periodLabel;
    }

    if (selectedMonthData.isCumulative) {
      return cumulativePeriodLabel;
    }

    if (selectedMonthData.monthName && selectedMonthData.year) {
      return `${selectedMonthData.monthName} ${selectedMonthData.year}`;
    }

    return cumulativePeriodLabel;
  }, [selectedMonthData, cumulativePeriodLabel]);

  const isCumulativeSelection = selectedMonthData?.isCumulative === true;

  // Cumulative payment handlers
  const handleCumulativeGstPayment = async (selectedMonthsData?: typeof monthlyData) => {
    // For month period, use all months in the period
    const monthsToPay = selectedMonthsData || (selectedPeriod === 'month' ? monthlyData : selectedGstMonths);

    if (monthsToPay.length === 0) {
      toast({
        title: 'No Months Selected',
        description: 'Please select at least one month to pay GST for.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingGstPayment(true);
    try {
      let totalPaid = 0;

      // Process each selected month
      for (const monthData of monthsToPay) {
        const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
        await addDoc(transactionRef, {
          vehicleId,
          type: 'gst_payment',
          amount: monthData.gstAmount,
          month: monthData.monthStr,
          description: `GST Payment for ${monthData.monthName} ${monthData.year}`,
          status: 'completed',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });

        totalPaid += monthData.gstAmount;
      }

      // Update cash in hand once for total amount
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await setDoc(cashRef, {
        balance: increment(-totalPaid),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast({
        title: 'GST Paid Successfully',
        description: `₹${totalPaid.toLocaleString()} GST payment recorded for ${monthsToPay.length} month${monthsToPay.length > 1 ? 's' : ''}`,
      });

      // Clear selections
      setSelectedGstMonthIndices([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record GST payment',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingGstPayment(false);
    }
  };

  const handleCumulativeServiceChargeCollection = async (selectedMonthsData?: typeof monthlyData) => {
    // For month period, use all months in the period
    const monthsToPay = selectedMonthsData || (selectedPeriod === 'month' ? monthlyData : selectedServiceChargeMonths);

    if (monthsToPay.length === 0) {
      toast({
        title: 'No Months Selected',
        description: 'Please select at least one month to collect service charge for.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingServiceCharge(true);
    try {
      let totalPaid = 0;

      // Process each selected month
      for (const monthData of monthsToPay) {
        const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
        await addDoc(transactionRef, {
          vehicleId,
          type: 'service_charge',
          amount: monthData.serviceCharge,
          month: monthData.monthStr,
          description: `Service Charge Collection for ${monthData.monthName} ${monthData.year}`,
          status: 'completed',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });

        totalPaid += monthData.serviceCharge;
      }

      // Update cash in hand once for total amount
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await setDoc(cashRef, {
        balance: increment(-totalPaid),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast({
        title: 'Service Charge Withdrawn',
        description: `₹${totalPaid.toLocaleString()} service charge withdrawn for ${monthsToPay.length} month${monthsToPay.length > 1 ? 's' : ''}`,
      });

      // Clear selections
      setSelectedServiceChargeMonthIndices([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to collect service charge',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingServiceCharge(false);
    }
  };

  const handleCumulativePartnerPayment = async (selectedMonthsData?: typeof monthlyData) => {
    // For month period, use all months in the period
    const monthsToPay = selectedMonthsData || (selectedPeriod === 'month' ? monthlyData : selectedPartnerMonths);

    if (monthsToPay.length === 0) {
      toast({
        title: 'No Months Selected',
        description: 'Please select at least one month to pay partner for.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingPartnerPayment(true);
    try {
      let totalPaid = 0;

      // Process each selected month
      for (const monthData of monthsToPay) {
        const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
        await addDoc(transactionRef, {
          vehicleId,
          type: 'partner_payment',
          amount: monthData.partnerShare,
          month: monthData.monthStr,
          description: `Partner Payment for ${monthData.monthName} ${monthData.year}`,
          status: 'completed',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });

        totalPaid += monthData.partnerShare;
      }

      // Update cash in hand once for total amount
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await setDoc(cashRef, {
        balance: increment(-totalPaid),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast({
        title: 'Partner Paid Successfully',
        description: `₹${totalPaid.toLocaleString()} paid to partner for ${monthsToPay.length} month${monthsToPay.length > 1 ? 's' : ''}`,
      });

      // Clear selections
      setSelectedPartnerMonthIndices([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record partner payment',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingPartnerPayment(false);
    }
  };

  const handleCumulativeOwnerShareCollection = async (selectedMonthsData?: typeof monthlyData) => {
    // For month period, use all months in the period
    const monthsToPay = selectedMonthsData || (selectedPeriod === 'month' ? monthlyData : selectedOwnerShareMonths);

    if (monthsToPay.length === 0) {
      toast({
        title: 'No Months Selected',
        description: 'Please select at least one month to collect owner share for.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingOwnerShare(true);
    try {
      let totalPaid = 0;

      // Process each selected month
      for (const monthData of monthsToPay) {
        const totalOwnerAmount = monthData.ownerShare + monthData.ownerFullShare;
        if (totalOwnerAmount <= 0) continue;

        const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
        await addDoc(transactionRef, {
          vehicleId,
          type: monthData.ownerShare > 0 ? 'owner_share' : 'owner_withdrawal',
          amount: totalOwnerAmount,
          month: monthData.monthStr,
          description: `Owner Share Collection for ${monthData.monthName} ${monthData.year}`,
          status: 'completed',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });

        totalPaid += totalOwnerAmount;
      }

      // Update cash in hand once for total amount
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await setDoc(cashRef, {
        balance: increment(-totalPaid),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast({
        title: 'Owner Share Collected',
        description: `₹${totalPaid.toLocaleString()} owner share collected for ${monthsToPay.length} month${monthsToPay.length > 1 ? 's' : ''}`,
      });

      // Clear selections
      setSelectedOwnerShareMonthIndices([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to collect owner share',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingOwnerShare(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cash in Hand Display */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="1" label="Cash In Hand" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Cash in Hand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            ₹{cashInHand.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Current cash balance for this taxi
          </p>
        </CardContent>
      </Card>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="2" label="Accounting Period Controls" className="mb-2" />
          <CardTitle>Accounting Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Period Type</label>
              <Select value={selectedPeriod} onValueChange={(value: 'month' | 'quarter' | 'year') => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === 'month' && (
              <div>
                <label className="text-sm font-medium">Month</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedPeriod === 'quarter' && (
              <div>
                <label className="text-sm font-medium">Quarter</label>
                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cumulative Summary */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="3" label="Cumulative Summary" className="mb-2" />
          <CardTitle>Cumulative Summary ({selectedPeriod === 'year' ? selectedYear : selectedPeriod === 'quarter' ? `Q${selectedQuarter} ${selectedYear}` : `${new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₹{cumulativeData.totalEarnings.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">₹{cumulativeData.totalExpenses.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Expenses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₹{cumulativeData.totalProfit.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Profit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ₹{(cumulativeData.totalPartnerShare + cumulativeData.totalOwnerWithdrawal).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Owner Share</div>
            </div>
          </div>

          {/* Cumulative Payables Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                ₹{cumulativeData.totalGst.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">GST Payable</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                ₹{cumulativeData.totalServiceCharge.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Service Charges</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                ₹{cumulativeData.totalPartnerShare.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Partner Shares (25%)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                ₹{cumulativeData.totalOwnerShare.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Owner Shares (75%)</div>
            </div>
          </div>

          {/* Paid Amounts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 border-t border-b border-dashed border-gray-300 pb-4">
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
                ₹{(actuallyPayable.paidAmounts.ownerShare + actuallyPayable.paidAmounts.ownerWithdrawal).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Owner Shares Collected</div>
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
                ₹{actuallyPayable.ownerShareActuallyPayable.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Owner Shares Actually Payable</div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Quick Financial Actions */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="4" label="Quick Financial Actions" className="mb-2" />
          <CardTitle>Quick Financial Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => {
                setConfirmGstPaymentDialog(true);
              }}
              disabled={cumulativeData.totalGst === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Pay GST ({selectedPeriod === 'month' ? cumulativeData.totalGst.toLocaleString() : selectedGstMonthTotal.toLocaleString()})
            </Button>
            <Button
              onClick={() => {
                if (selectedPeriod === 'month') {
                  // For month, directly show confirmation dialog
                  setSelectedMonthData({
                    serviceCharge: cumulativeData.totalServiceCharge,
                    monthStr: cumulativePeriodKey,
                    periodLabel: cumulativePeriodLabel,
                    isCumulative: true
                  });
                  setConfirmServiceChargeDialog(true);
                } else {
                  // For quarter/year, show selection dialog
                  setConfirmServiceChargeMonthSelectionDialog(true);
                }
              }}
              disabled={cumulativeData.totalServiceCharge === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Withdraw Service Charges ({selectedPeriod === 'month' ? cumulativeData.totalServiceCharge.toLocaleString() : selectedServiceChargeMonthTotal.toLocaleString()})
            </Button>
            <Button
              onClick={() => {
                if (selectedPeriod === 'month') {
                  // For month, directly show confirmation dialog
                  setSelectedMonthData({
                    partnerShare: cumulativeData.totalPartnerShare,
                    monthStr: cumulativePeriodKey,
                    periodLabel: cumulativePeriodLabel,
                    isCumulative: true
                  });
                  setConfirmPartnerPaymentDialog(true);
                } else {
                  // For quarter/year, show selection dialog
                  setConfirmPartnerMonthSelectionDialog(true);
                }
              }}
              disabled={cumulativeData.totalPartnerShare === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Pay Partner ({selectedPeriod === 'month' ? cumulativeData.totalPartnerShare.toLocaleString() : selectedPartnerMonthTotal.toLocaleString()})
            </Button>
            <Button
              onClick={() => {
                if (rentSummary.totalDue <= 0) {
                  toast({
                    title: 'No Rent Due',
                    description: 'There are no overdue rent weeks to collect right now.',
                    variant: 'destructive'
                  });
                  return;
                }

                if (!financialData?.currentAssignment) {
                  toast({
                    title: 'Assignment Not Found',
                    description: 'No active assignment available for rent collection.',
                    variant: 'destructive'
                  });
                  return;
                }

                const assignment = financialData.currentAssignment;
                if (assignment) {
                  setSelectedRentPaymentWeek({
                    weekIndex: -1,
                    assignment,
                    weekStartDate: new Date(),
                    willSettleWeek: rentSummary.overdueWeeks[0]?.weekIndex ?? -1
                  });
                }
                setConfirmRentPaymentDialog(true);
              }}
              disabled={rentSummary.totalDue <= 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Collect Overdue Rent (₹{rentSummary.totalDue.toLocaleString()})
            </Button>
            <Button
              onClick={() => {
                if (emiSummary.totalDue <= 0) {
                  toast({
                    title: 'No EMI Due',
                    description: 'There are no overdue or due-soon EMIs to pay.',
                    variant: 'destructive'
                  });
                  return;
                }
                setBulkPaymentDialog(true);
              }}
              disabled={emiSummary.totalDue <= 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Pay Overdue EMI (₹{emiSummary.totalDue.toLocaleString()})
            </Button>
            <Button
              onClick={() => {
                if (selectedPeriod === 'month') {
                  // For month, directly show confirmation dialog
                  const totalOwnerAmount = cumulativeData.totalOwnerShare + cumulativeData.totalOwnerWithdrawal;
                  setSelectedMonthData({
                    ownerShare: totalOwnerAmount,
                    ownerFullShare: totalOwnerAmount,
                    monthStr: cumulativePeriodKey,
                    periodLabel: cumulativePeriodLabel,
                    isCumulative: true
                  });
                  setConfirmOwnerShareDialog(true);
                } else {
                  // For quarter/year, show selection dialog
                  setConfirmOwnerShareMonthSelectionDialog(true);
                }
              }}
              disabled={cumulativeData.totalOwnerShare === 0 && cumulativeData.totalOwnerWithdrawal === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Banknote className="h-4 w-4" />
              Withdraw Owner Share ({selectedPeriod === 'month' ? (cumulativeData.totalOwnerShare + cumulativeData.totalOwnerWithdrawal).toLocaleString() : selectedOwnerShareMonthTotal.toLocaleString()})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Accounting Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthlyData.map((monthData, index) => (
          <Card key={monthData.month} className="flex flex-col">
            <CardHeader>
              <SectionNumberBadge
                id={`5.${index + 1}`}
                label={`${monthData.monthName} ${monthData.year}`}
                className="mb-2"
              />
              <CardTitle className="flex items-center justify-between">
                <span>{monthData.monthName} {monthData.year}</span>
                <Badge variant={monthData.profit >= 0 ? "default" : "destructive"}>
                  {monthData.profit >= 0 ? 'Profit' : 'Loss'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* Earnings */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <TrendingUp className="h-4 w-4" />
                  Earnings
                </div>
                <div className="text-lg font-semibold text-green-600">
                  ₹{monthData.earnings.toLocaleString()}
                </div>
              </div>

              {/* Expenses Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                  <Receipt className="h-4 w-4" />
                  Expenses Breakdown
                </div>
                <div className="space-y-1 text-sm">
                  {monthData.expenses.slice(0, 3).map((expense, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <Badge
                        variant={
                          (expense.paymentType === 'emi' || (expense.expenseType as any) === 'emi') ? 'secondary' :
                          (expense.paymentType === 'prepayment' || (expense.expenseType as any) === 'prepayment') ? 'outline' :
                          expense.expenseType === 'insurance' ? 'secondary' :
                          expense.expenseType === 'penalties' ? 'destructive' :
                          expense.expenseType === 'fuel' ? 'secondary' :
                          expense.expenseType === 'maintenance' ? 'secondary' :
                          expense.expenseType === 'general' ? 'secondary' :
                          'destructive'
                        }
                        className={
                          (expense.paymentType === 'emi' || (expense.expenseType as any) === 'emi') ? 'bg-indigo-100 text-indigo-800' :
                          (expense.paymentType === 'prepayment' || (expense.expenseType as any) === 'prepayment') ? 'bg-orange-100 text-orange-800' :
                          expense.expenseType === 'insurance' ? 'bg-blue-100 text-blue-800' :
                          expense.expenseType === 'penalties' ? 'bg-red-100 text-red-800' :
                          expense.expenseType === 'fuel' ? 'bg-blue-100 text-blue-800' :
                          expense.expenseType === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          expense.expenseType === 'general' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {(expense.paymentType === 'emi' || (expense.expenseType as any) === 'emi') ? 'EMI' :
                         (expense.paymentType === 'prepayment' || (expense.expenseType as any) === 'prepayment') ? 'PREPAYMENT' :
                         expense.expenseType === 'insurance' ? 'INSURANCE' :
                         expense.expenseType === 'penalties' ? 'PENALTY' :
                         expense.expenseType === 'maintenance' ? 'MAINTENANCE' :
                         expense.expenseType === 'fuel' ? 'FUEL' :
                         expense.expenseType === 'general' ? 'GENERAL' :
                         String(expense.expenseType || expense.type || 'EXPENSE').toUpperCase()}
                      </Badge>
                      <span>₹{expense.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-red-600 border-t pt-1">
                  Total: ₹{monthData.totalExpenses.toLocaleString()}
                </div>
              </div>

              {/* Profit Calculation */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span>Profit (Earnings - Expenses)</span>
                  <span className={`font-medium ${monthData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{monthData.profit.toLocaleString()}
                  </span>
                </div>

                {/* GST */}
                <div className="flex justify-between text-sm">
                  <span>GST (4%)</span>
                  <span className="font-medium text-orange-600">
                    ₹{monthData.gstAmount.toLocaleString()}
                  </span>
                </div>

                {/* Service Charge (only for partner taxis) */}
                {monthData.serviceCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Service Charge (10%)</span>
                    <span className="font-medium text-blue-600">
                      ₹{monthData.serviceCharge.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Partner Share (only for partner taxis) */}
                {monthData.partnerShare > 0 && (
                  <div className="flex justify-between text-sm border-t pt-1">
                    <span className="font-medium">Partner Share ({vehicle?.partnershipPercentage || 50}%)</span>
                    <span className="font-bold text-purple-600">
                      ₹{monthData.partnerShare.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Owner's Share (only for partner taxis) */}
                {monthData.ownerShare > 0 && (
                  <div className="flex justify-between text-sm border-t pt-1">
                    <span className="font-medium">Owner's Share ({100 - (vehicle?.partnershipPercentage || 50)}%)</span>
                    <span className="font-bold text-green-600">
                      ₹{monthData.ownerShare.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Always show at bottom for consistent alignment */}
              {userInfo?.role !== Role.PARTNER && (
                <div className="flex-1 flex flex-col justify-end border-t pt-3">
                  <div className="space-y-2">
                    {/* GST Payment - Always shown */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm">GST Payment</span>
                      {monthData.gstPaid ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedMonthData(monthData);
                            setConfirmGstPaymentDialog(true);
                          }}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Pay GST ₹{monthData.gstAmount.toLocaleString()}
                        </Button>
                      )}
                    </div>

                    {/* Service Charge Collection - Only for partner taxis */}
                    {vehicle?.isPartnership === true && monthData.serviceCharge > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Service Charge</span>
                        {monthData.serviceChargeCollected ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Withdrawn
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedMonthData(monthData);
                              setConfirmServiceChargeDialog(true);
                            }}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Withdraw Service Charges ₹{monthData.serviceCharge.toLocaleString()}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Partner Payment - Only for partner taxis */}
                    {vehicle?.isPartnership === true && monthData.partnerShare > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Partner Share</span>
                        {monthData.partnerPaid ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedMonthData(monthData);
                              setConfirmPartnerPaymentDialog(true);
                            }}
                          >
                            <Banknote className="h-3 w-3 mr-1" />
                            Pay Partner ₹{monthData.partnerShare.toLocaleString()}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Owner's Share Collection - Only for partner taxis */}
                    {vehicle?.isPartnership === true && monthData.ownerShare > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Owner's Share</span>
                        {monthData.ownerShareCollected ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Withdrawn
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedMonthData(monthData);
                              setConfirmOwnerShareDialog(true);
                            }}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Withdraw Owner Share ₹{monthData.ownerShare.toLocaleString()}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Owner's Withdrawal - Only for company-owned taxis */}
                    {!vehicle?.isPartnership && monthData.ownerFullShare > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Owner's Share</span>
                        {monthData.ownerWithdrawn ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Withdrawn
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedMonthData(monthData);
                              setConfirmOwnerWithdrawalDialog(true);
                            }}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Withdraw Owner Share ₹{monthData.ownerFullShare.toLocaleString()}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={confirmRentPaymentDialog}
        onOpenChange={(open) => {
          setConfirmRentPaymentDialog(open);
          if (!open) {
            setSelectedRentWeekIndices([]);
            setSelectedRentPaymentWeek(null);
            setIsProcessingRentPayment(false);
          } else if (!selectedRentPaymentWeek && financialData?.currentAssignment) {
            setSelectedRentPaymentWeek({
              weekIndex: -1,
              assignment: financialData.currentAssignment,
              weekStartDate: new Date(),
              willSettleWeek: rentSummary.overdueWeeks[0]?.weekIndex ?? -1
            });
          }
        }}
      >
        <AlertDialogContent className="max-w-2xl max-h-[75vh] overflow-y-auto">
          <AlertDialogHeader>
            <SectionNumberBadge id="6" label="Rent Payment Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Overdue Payment Settlement
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {selectedRentPaymentWeek && rentSummary.overdueWeeks.length > 0 && (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="font-semibold text-red-800">
                      ⚠️ You have {rentSummary.overdueWeeks.length} overdue week{rentSummary.overdueWeeks.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Total Overdue: ₹{rentSummary.totalOverdue.toLocaleString()}
                    </p>
                  </div>

                  {selectedRentPaymentWeek.weekIndex === -1 ? (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <p className="font-semibold text-green-800 mb-1">
                          Pay Due Weeks
                        </p>
                        <p className="text-xs text-green-700">
                          Select consecutive weeks starting from the oldest overdue entry. Older weeks stay locked in order.
                        </p>
                        {allDueWeeks.length === 0 ? (
                          <div className="mt-3 bg-white border border-dashed border-green-300 rounded p-3 text-sm text-green-700">
                            All rent collections are up to date. There is nothing pending right now.
                          </div>
                        ) : (
                          <div className="mt-3 border border-green-200 rounded">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-green-200 bg-white text-xs text-green-700">
                              <span>Selected: {selectedRentWeekCount} of {allDueWeeks.length}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs border-green-200 text-green-700"
                                onClick={handleSelectAllRentWeeks}
                                disabled={selectedRentWeekCount === orderedRentWeekIndices.length}
                              >
                                Select All
                              </Button>
                            </div>
                            <div className="max-h-40 overflow-y-auto divide-y divide-green-100 bg-white">
                              {allDueWeeks.map((week) => {
                                const isSelected = selectedRentWeekIndices.includes(week.weekIndex);
                                const checkboxId = `bulk-week-${week.weekIndex}`;

                                return (
                                  <label
                                    key={week.weekIndex}
                                    htmlFor={checkboxId}
                                    className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-green-50' : ''}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={checkboxId}
                                        checked={isSelected}
                                        onCheckedChange={() => handleToggleRentWeekSelection(week.weekIndex)}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium text-green-900">Week {week.weekIndex + 1}</span>
                                        <span className="text-xs text-gray-500">
                                          Start {week.weekStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">
                                      ₹{week.amount.toLocaleString()}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between text-sm font-semibold text-green-900">
                          <span>Selected Amount</span>
                          <span>₹{selectedRentWeekTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-xs text-yellow-700">
                          <strong>Note:</strong> Selected weeks will be collected sequentially from oldest to newest. Unselecting a week clears all newer selections to keep the order intact.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="font-semibold text-blue-800">
                          Payment Settlement Order:
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                          This payment of <strong>₹{(selectedRentPaymentWeek.assignment?.weeklyRent || financialData?.currentAssignment?.weeklyRent || 0).toLocaleString()}</strong> will be settled for:
                        </p>
                        <div className="mt-2 bg-white border border-blue-300 rounded p-2">
                          <p className="font-semibold text-blue-900">
                            Week {rentSummary.overdueWeeks[0].weekIndex + 1}
                          </p>
                          <p className="text-xs text-blue-600">
                            Due Date: {rentSummary.overdueWeeks[0].weekStartDate.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <Badge variant="destructive" className="mt-1 text-xs">
                            Oldest Overdue
                          </Badge>
                        </div>
                      </div>

                      {rentSummary.overdueWeeks.length > 1 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <p className="text-xs text-yellow-700">
                            <strong>Note:</strong> After this payment, you will still have {rentSummary.overdueWeeks.length - 1} overdue week{rentSummary.overdueWeeks.length - 1 > 1 ? 's' : ''} remaining (₹{(rentSummary.totalOverdue - (selectedRentPaymentWeek.assignment?.weeklyRent || financialData?.currentAssignment?.weeklyRent || 0)).toLocaleString()}).
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <p className="text-sm text-gray-600 mt-2">
                    Do you want to proceed with this payment?
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingRentPayment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRentPayment}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={
                isProcessingRentPayment ||
                (selectedRentPaymentWeek?.weekIndex === -1 && selectedRentWeekCount === 0)
              }
            >
              {isProcessingRentPayment
                ? 'Processing...'
                : selectedRentPaymentWeek?.weekIndex === -1 && selectedRentWeekCount > 0
                ? `Collect ${selectedRentWeekCount} Week${selectedRentWeekCount > 1 ? 's' : ''}`
                : 'Confirm Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkPaymentDialog}
        onOpenChange={(open) => {
          setBulkPaymentDialog(open);
          if (!open) {
            setPenaltyAmounts({});
            setSelectedEmiIndices([]);
          }
        }}
      >
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <SectionNumberBadge id="7" label="Bulk EMI Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pay All Due EMIs
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <p className="font-semibold text-orange-800">
                      Select Due EMIs (Oldest First)
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-orange-700">
                        Selected: {selectedCount} of {emiSummary.allDueEMIs.length} (₹{emiSummary.totalDue.toLocaleString()})
                      </span>
                      {emiSummary.allDueEMIs.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-xs border-orange-300 text-orange-700"
                          onClick={handleSelectAllEmis}
                          disabled={isProcessingBulkPayment}
                        >
                          Select All
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-orange-700">
                    Choose consecutive EMIs starting from the oldest overdue instalment. Selecting a later EMI will automatically include every older due EMI.
                  </p>
                  <div className="mt-3 space-y-2 overflow-visible">
                    {(() => {
                      const dueEMIs = emiSummary.allDueEMIs;
                      if (dueEMIs.length === 0) {
                        return (
                          <div className="bg-white border border-dashed border-orange-300 rounded p-3 text-sm text-orange-700">
                            All EMIs are up to date. There is nothing pending right now.
                          </div>
                        );
                      }

                      return dueEMIs.map((emi) => {
                        const isSelected = selectedEmiIndices.includes(emi.index);
                        const checkboxId = `bulk-emi-${emi.index}`;
                        const isOverdue = !!(emi.daysPastDue && emi.daysPastDue > 0);
                        const isDueSoon = !isOverdue && typeof emi.daysUntilDue === 'number';

                        return (
                          <div
                            key={emi.index}
                            className={`bg-white border rounded p-3 transition-all ${isSelected ? 'border-orange-400 ring-1 ring-orange-400 shadow-sm' : 'border-orange-300'}`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={checkboxId}
                                checked={isSelected}
                                onCheckedChange={() => handleToggleEmiSelection(emi.index)}
                                disabled={isProcessingBulkPayment}
                              />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label htmlFor={checkboxId} className="font-semibold text-orange-900 cursor-pointer">
                                    EMI {emi.emi.month}
                                  </label>
                                  <span className="text-sm text-orange-600">
                                    Due: {new Date(emi.emi.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-sm text-gray-600">
                                    ₹{emi.amount.toLocaleString()}
                                  </span>
                                  {isOverdue && (
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`penalty-${emi.index}`} className="text-xs text-red-600">
                                        Penalty (₹):
                                      </Label>
                                      <Input
                                        id={`penalty-${emi.index}`}
                                        type="number"
                                        placeholder="0"
                                        className="w-20 h-7 text-xs"
                                        value={penaltyAmounts[emi.index] || ''}
                                        onChange={(e) => setPenaltyAmounts(prev => ({ ...prev, [emi.index]: e.target.value }))}
                                        disabled={!isSelected || isProcessingBulkPayment}
                                      />
                                    </div>
                                  )}
                                </div>
                                {isOverdue && (
                                  <div className="text-xs text-red-600">
                                    {emi.daysPastDue} days overdue
                                  </div>
                                )}
                                {isDueSoon && (
                                  <div className="text-xs text-amber-600">
                                    Due in {emi.daysUntilDue === 0 ? 'today' : `${emi.daysUntilDue} day${emi.daysUntilDue === 1 ? '' : 's'}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="mt-3 pt-3 border-t border-orange-300 space-y-1">
                    <div className="flex justify-between items-center font-bold text-orange-900">
                      <span>Selected EMIs: {selectedCount} of {emiSummary.allDueEMIs.length}</span>
                      <span>₹{totalSelectedEmiAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-red-700">
                      <span>Selected Penalties:</span>
                      <span>₹{totalSelectedPenalties.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-orange-900 pt-1 border-t border-orange-400">
                      <span>Grand Total:</span>
                      <span>₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-xs text-yellow-700">
                    <strong>Note:</strong> Selected EMIs will be paid sequentially from oldest to newest. Unselecting an EMI automatically clears all newer selections to keep the order intact.
                  </p>
                </div>

                <p className="text-sm text-gray-600">
                  Do you want to proceed with this bulk payment?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingBulkPayment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkEMIPayment}
              disabled={isProcessingBulkPayment || selectedCount === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessingBulkPayment ? 'Processing...' : selectedCount > 0 ? `Pay ${selectedCount} EMI${selectedCount > 1 ? 's' : ''}` : 'Select EMIs to Pay'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GST Payment Confirmation Dialog */}
      <AlertDialog open={confirmGstPaymentDialog} onOpenChange={(open) => {
        setConfirmGstPaymentDialog(open);
        if (!open) {
          setSelectedGstMonthIndices([]);
        }
      }}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="8" label="GST Payment Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Confirm GST Payment
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  You are about to pay GST for <span className="font-semibold">{vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{selectedDialogPeriodLabel || 'the selected period'}</span>.
                </p>

                {selectedPeriod === 'month' ? (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-blue-800">{selectedDialogPeriodLabel} GST:</span>
                      <span className="font-bold text-blue-700 text-lg">₹{cumulativeData.totalGst.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedPeriod === 'quarter' && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="font-semibold text-blue-800 mb-2">Quarterly GST Breakdown ({selectedDialogPeriodLabel}):</p>
                        <p className="text-xs text-blue-700 mb-3">
                          Select months with GST amounts to pay. Only months with actual GST will be shown.
                        </p>
                        {(() => {
                          const quarterMonths = {
                            '1': [0, 1, 2], '2': [3, 4, 5], '3': [6, 7, 8], '4': [9, 10, 11]
                          } as const;
                          const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths] || [];
                          const gstMonths = months
                            .map(monthIndex => {
                              const monthData = monthlyData.find(m => m.month === monthIndex);
                              return monthData && monthData.gstAmount > 0 ? {
                                month: monthIndex,
                                monthName: new Date(parseInt(selectedYear), monthIndex).toLocaleString('default', { month: 'long' }),
                                gstAmount: monthData.gstAmount,
                                monthStr: monthData.monthStr,
                                isPaid: monthData.gstPaid
                              } : null;
                            })
                            .filter(Boolean);

                          if (gstMonths.length === 0) {
                            return (
                              <div className="bg-white border border-dashed border-blue-300 rounded p-3 text-sm text-blue-700">
                                No GST amounts pending for this quarter.
                              </div>
                            );
                          }

                          return (
                            <div className="border border-blue-200 rounded">
                              <div className="flex items-center justify-between px-3 py-2 border-b border-blue-200 bg-white text-xs text-blue-700">
                                <span>Months with GST: {gstMonths.length}</span>
                              </div>
                              <div className="max-h-40 overflow-y-auto divide-y divide-blue-100 bg-white">
                                {gstMonths.map((gstMonth) => {
                                  const isSelected = selectedGstMonthIndices.includes(gstMonth!.month);
                                  const checkboxId = `gst-month-${gstMonth!.month}`;

                                  return (
                                    <label
                                      key={gstMonth!.month}
                                      htmlFor={checkboxId}
                                      className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          id={checkboxId}
                                          checked={isSelected}
                                          onCheckedChange={() => handleToggleGstMonthSelection(gstMonth!.month)}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium text-blue-900">{gstMonth!.monthName} {selectedYear}</span>
                                          <span className="text-xs text-gray-500">
                                            {gstMonth!.isPaid ? 'Already Paid' : 'Pending'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-sm font-medium text-gray-700">
                                        ₹{gstMonth!.gstAmount.toLocaleString()}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                        <div className="mt-3 flex items-center justify-between text-sm font-semibold text-blue-900">
                          <span>Selected GST Amount</span>
                          <span>₹{selectedGstMonthTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {selectedPeriod === 'year' && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="font-semibold text-blue-800 mb-2">Yearly GST Breakdown ({selectedYear}):</p>
                        <p className="text-xs text-blue-700 mb-3">
                          Select months with GST amounts to pay. Only months with actual GST will be shown.
                        </p>
                        {(() => {
                          const gstMonths = monthlyData
                            .filter(m => m.gstAmount > 0)
                            .map(m => ({
                              month: m.month,
                              monthName: m.monthName,
                              gstAmount: m.gstAmount,
                              monthStr: m.monthStr,
                              isPaid: m.gstPaid
                            }));

                          if (gstMonths.length === 0) {
                            return (
                              <div className="bg-white border border-dashed border-blue-300 rounded p-3 text-sm text-blue-700">
                                No GST amounts pending for this year.
                              </div>
                            );
                          }

                          return (
                            <div className="border border-blue-200 rounded">
                              <div className="flex items-center justify-between px-3 py-2 border-b border-blue-200 bg-white text-xs text-blue-700">
                                <span>Months with GST: {gstMonths.length}</span>
                              </div>
                              <div className="max-h-40 overflow-y-auto divide-y divide-blue-100 bg-white">
                                {gstMonths.map((gstMonth) => {
                                  const isSelected = selectedGstMonthIndices.includes(gstMonth.month);
                                  const checkboxId = `gst-month-${gstMonth.month}`;

                                  return (
                                    <label
                                      key={gstMonth.month}
                                      htmlFor={checkboxId}
                                      className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          id={checkboxId}
                                          checked={isSelected}
                                          onCheckedChange={() => handleToggleGstMonthSelection(gstMonth.month)}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium text-blue-900">{gstMonth.monthName} {selectedYear}</span>
                                          <span className="text-xs text-gray-500">
                                            {gstMonth.isPaid ? 'Already Paid' : 'Pending'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-sm font-medium text-gray-700">
                                        ₹{gstMonth.gstAmount.toLocaleString()}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                        <div className="mt-3 flex items-center justify-between text-sm font-semibold text-blue-900">
                          <span>Selected GST Amount</span>
                          <span>₹{selectedGstMonthTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <p className="text-sm text-gray-600">
                  This action will record the GST payment and update the cash balance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedPeriod === 'month') {
                  // For month, pay for the current month
                  await handleCumulativeGstPayment();
                  setConfirmGstPaymentDialog(false);
                } else {
                  // For quarter/year, pay for selected months
                  if (selectedGstMonthIndices.length > 0) {
                    await handleCumulativeGstPayment(selectedGstMonths);
                    setConfirmGstPaymentDialog(false);
                  }
                }
              }}
              disabled={isProcessingGstPayment || (selectedPeriod !== 'month' && selectedGstMonthIndices.length === 0)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessingGstPayment ? 'Processing...' : `Pay GST ₹${selectedPeriod === 'month' ? cumulativeData.totalGst.toLocaleString() : selectedGstMonthTotal.toLocaleString()}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Service Charge Month Selection Dialog */}
      <AlertDialog open={confirmServiceChargeMonthSelectionDialog} onOpenChange={(open) => {
        setConfirmServiceChargeMonthSelectionDialog(open);
        if (!open) {
          setSelectedServiceChargeMonthIndices([]);
        }
      }}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="9" label="Service Charge Month Selection" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Select Months for Service Charge Withdrawal
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  Select months to withdraw service charges from <span className="font-semibold">{vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{selectedPeriod === 'quarter' ? `Q${selectedQuarter} ${selectedYear}` : selectedYear}</span>.
                </p>

                {selectedPeriod === 'quarter' && (
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="font-semibold text-green-800 mb-2">Quarterly Service Charge Breakdown ({selectedPeriod === 'quarter' ? `Q${selectedQuarter} ${selectedYear}` : selectedYear}):</p>
                    <p className="text-xs text-green-700 mb-3">
                      Select months with service charge amounts to withdraw. Only months with actual service charges will be shown.
                    </p>
                    {(() => {
                      const quarterMonths = {
                        '1': [0, 1, 2], '2': [3, 4, 5], '3': [6, 7, 8], '4': [9, 10, 11]
                      } as const;
                      const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths] || [];
                      const serviceChargeMonths = months
                        .map(monthIndex => {
                          const monthData = monthlyData.find(m => m.month === monthIndex);
                          return monthData && monthData.serviceCharge > 0 ? {
                            month: monthIndex,
                            monthName: new Date(parseInt(selectedYear), monthIndex).toLocaleString('default', { month: 'long' }),
                            serviceCharge: monthData.serviceCharge,
                            monthStr: monthData.monthStr,
                            isCollected: monthData.serviceChargeCollected
                          } : null;
                        })
                        .filter(Boolean);

                      if (serviceChargeMonths.length === 0) {
                        return (
                          <div className="bg-white border border-dashed border-green-300 rounded p-3 text-sm text-green-700">
                            No service charges pending for this quarter.
                          </div>
                        );
                      }

                      return (
                        <div className="border border-green-200 rounded">
                          <div className="flex items-center justify-between px-3 py-2 border-b border-green-200 bg-white text-xs text-green-700">
                            <span>Months with Service Charges: {serviceChargeMonths.length}</span>
                          </div>
                          <div className="max-h-40 overflow-y-auto divide-y divide-green-100 bg-white">
                            {serviceChargeMonths.map((serviceChargeMonth) => {
                              const isSelected = selectedServiceChargeMonthIndices.includes(serviceChargeMonth!.month);
                              const checkboxId = `service-charge-month-${serviceChargeMonth!.month}`;

                              return (
                                <label
                                  key={serviceChargeMonth!.month}
                                  htmlFor={checkboxId}
                                  className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-green-50' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={checkboxId}
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        setSelectedServiceChargeMonthIndices(prev =>
                                          prev.includes(serviceChargeMonth!.month)
                                            ? prev.filter(m => m !== serviceChargeMonth!.month)
                                            : [...prev, serviceChargeMonth!.month]
                                        );
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-green-900">{serviceChargeMonth!.monthName} {selectedYear}</span>
                                      <span className="text-xs text-gray-500">
                                        {serviceChargeMonth!.isCollected ? 'Already Withdrawn' : 'Pending'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-700">
                                    ₹{serviceChargeMonth!.serviceCharge.toLocaleString()}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="mt-3 flex items-center justify-between text-sm font-semibold text-green-900">
                      <span>Selected Service Charge Amount</span>
                      <span>₹{selectedServiceChargeMonthTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {selectedPeriod === 'year' && (
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="font-semibold text-green-800 mb-2">Yearly Service Charge Breakdown ({selectedYear}):</p>
                    <p className="text-xs text-green-700 mb-3">
                      Select months with service charge amounts to withdraw. Only months with actual service charges will be shown.
                    </p>
                    {(() => {
                      const serviceChargeMonths = monthlyData
                        .filter(m => m.serviceCharge > 0)
                        .map(m => ({
                          month: m.month,
                          monthName: m.monthName,
                          serviceCharge: m.serviceCharge,
                          monthStr: m.monthStr,
                          isCollected: m.serviceChargeCollected
                        }));

                      if (serviceChargeMonths.length === 0) {
                        return (
                          <div className="bg-white border border-dashed border-green-300 rounded p-3 text-sm text-green-700">
                            No service charges pending for this year.
                          </div>
                        );
                      }

                      return (
                        <div className="border border-green-200 rounded">
                          <div className="flex items-center justify-between px-3 py-2 border-b border-green-200 bg-white text-xs text-green-700">
                            <span>Months with Service Charges: {serviceChargeMonths.length}</span>
                          </div>
                          <div className="max-h-40 overflow-y-auto divide-y divide-green-100 bg-white">
                            {serviceChargeMonths.map((serviceChargeMonth) => {
                              const isSelected = selectedServiceChargeMonthIndices.includes(serviceChargeMonth.month);
                              const checkboxId = `service-charge-month-${serviceChargeMonth.month}`;

                              return (
                                <label
                                  key={serviceChargeMonth.month}
                                  htmlFor={checkboxId}
                                  className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-green-50' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={checkboxId}
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        setSelectedServiceChargeMonthIndices(prev =>
                                          prev.includes(serviceChargeMonth.month)
                                            ? prev.filter(m => m !== serviceChargeMonth.month)
                                            : [...prev, serviceChargeMonth.month]
                                        );
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-green-900">{serviceChargeMonth.monthName} {selectedYear}</span>
                                      <span className="text-xs text-gray-500">
                                        {serviceChargeMonth.isCollected ? 'Already Withdrawn' : 'Pending'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-700">
                                    ₹{serviceChargeMonth.serviceCharge.toLocaleString()}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="mt-3 flex items-center justify-between text-sm font-semibold text-green-900">
                      <span>Selected Service Charge Amount</span>
                      <span>₹{selectedServiceChargeMonthTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedServiceChargeMonthTotal > 0) {
                  await handleCumulativeServiceChargeCollection(selectedServiceChargeMonths);
                  setConfirmServiceChargeMonthSelectionDialog(false);
                }
              }}
              disabled={selectedServiceChargeMonthTotal === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingServiceCharge ? 'Processing...' : `Continue with ₹${selectedServiceChargeMonthTotal.toLocaleString()}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Partner Payment Month Selection Dialog */}
      <AlertDialog open={confirmPartnerMonthSelectionDialog} onOpenChange={(open) => {
        setConfirmPartnerMonthSelectionDialog(open);
        if (!open) {
          setSelectedPartnerMonthIndices([]);
        }
      }}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="10" label="Partner Payment Month Selection" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Select Months for Partner Payment
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  Select months to pay partner shares to <span className="font-semibold">{vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{selectedPeriod === 'quarter' ? `Q${selectedQuarter} ${selectedYear}` : selectedYear}</span>.
                </p>

                {selectedPeriod === 'quarter' && (
                  <div className="bg-purple-50 p-3 rounded-md">
                    <p className="font-semibold text-purple-800 mb-2">Quarterly Partner Share Breakdown ({selectedPeriod === 'quarter' ? `Q${selectedQuarter} ${selectedYear}` : selectedYear}):</p>
                    <p className="text-xs text-purple-700 mb-3">
                      Select months with partner share amounts to pay. Only months with actual partner shares will be shown.
                    </p>
                    {(() => {
                      const quarterMonths = {
                        '1': [0, 1, 2], '2': [3, 4, 5], '3': [6, 7, 8], '4': [9, 10, 11]
                      } as const;
                      const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths] || [];
                      const partnerMonths = months
                        .map(monthIndex => {
                          const monthData = monthlyData.find(m => m.month === monthIndex);
                          return monthData && monthData.partnerShare > 0 ? {
                            month: monthIndex,
                            monthName: new Date(parseInt(selectedYear), monthIndex).toLocaleString('default', { month: 'long' }),
                            partnerShare: monthData.partnerShare,
                            monthStr: monthData.monthStr,
                            isPaid: monthData.partnerPaid
                          } : null;
                        })
                        .filter(Boolean);

                      if (partnerMonths.length === 0) {
                        return (
                          <div className="bg-white border border-dashed border-purple-300 rounded p-3 text-sm text-purple-700">
                            No partner shares pending for this quarter.
                          </div>
                        );
                      }

                      return (
                        <div className="border border-purple-200 rounded">
                          <div className="flex items-center justify-between px-3 py-2 border-b border-purple-200 bg-white text-xs text-purple-700">
                            <span>Months with Partner Shares: {partnerMonths.length}</span>
                          </div>
                          <div className="max-h-40 overflow-y-auto divide-y divide-purple-100 bg-white">
                            {partnerMonths.map((partnerMonth) => {
                              const isSelected = selectedPartnerMonthIndices.includes(partnerMonth!.month);
                              const checkboxId = `partner-month-${partnerMonth!.month}`;

                              return (
                                <label
                                  key={partnerMonth!.month}
                                  htmlFor={checkboxId}
                                  className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-purple-50' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={checkboxId}
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        setSelectedPartnerMonthIndices(prev =>
                                          prev.includes(partnerMonth!.month)
                                            ? prev.filter(m => m !== partnerMonth!.month)
                                            : [...prev, partnerMonth!.month]
                                        );
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-purple-900">{partnerMonth!.monthName} {selectedYear}</span>
                                      <span className="text-xs text-gray-500">
                                        {partnerMonth!.isPaid ? 'Already Paid' : 'Pending'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-700">
                                    ₹{partnerMonth!.partnerShare.toLocaleString()}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="mt-3 flex items-center justify-between text-sm font-semibold text-purple-900">
                      <span>Selected Partner Share Amount</span>
                      <span>₹{selectedPartnerMonthTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {selectedPeriod === 'year' && (
                  <div className="bg-purple-50 p-3 rounded-md">
                    <p className="font-semibold text-purple-800 mb-2">Yearly Partner Share Breakdown ({selectedYear}):</p>
                    <p className="text-xs text-purple-700 mb-3">
                      Select months with partner share amounts to pay. Only months with actual partner shares will be shown.
                    </p>
                    {(() => {
                      const partnerMonths = monthlyData
                        .filter(m => m.partnerShare > 0)
                        .map(m => ({
                          month: m.month,
                          monthName: m.monthName,
                          partnerShare: m.partnerShare,
                          monthStr: m.monthStr,
                          isPaid: m.partnerPaid
                        }));

                      if (partnerMonths.length === 0) {
                        return (
                          <div className="bg-white border border-dashed border-purple-300 rounded p-3 text-sm text-purple-700">
                            No partner shares pending for this year.
                          </div>
                        );
                      }

                      return (
                        <div className="border border-purple-200 rounded">
                          <div className="flex items-center justify-between px-3 py-2 border-b border-purple-200 bg-white text-xs text-purple-700">
                            <span>Months with Partner Shares: {partnerMonths.length}</span>
                          </div>
                          <div className="max-h-40 overflow-y-auto divide-y divide-purple-100 bg-white">
                            {partnerMonths.map((partnerMonth) => {
                              const isSelected = selectedPartnerMonthIndices.includes(partnerMonth.month);
                              const checkboxId = `partner-month-${partnerMonth.month}`;

                              return (
                                <label
                                  key={partnerMonth.month}
                                  htmlFor={checkboxId}
                                  className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-purple-50' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={checkboxId}
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        setSelectedPartnerMonthIndices(prev =>
                                          prev.includes(partnerMonth.month)
                                            ? prev.filter(m => m !== partnerMonth.month)
                                            : [...prev, partnerMonth.month]
                                        );
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-purple-900">{partnerMonth.monthName} {selectedYear}</span>
                                      <span className="text-xs text-gray-500">
                                        {partnerMonth.isPaid ? 'Already Paid' : 'Pending'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-700">
                                    ₹{partnerMonth.partnerShare.toLocaleString()}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="mt-3 flex items-center justify-between text-sm font-semibold text-purple-900">
                      <span>Selected Partner Share Amount</span>
                      <span>₹{selectedPartnerMonthTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedPartnerMonthTotal > 0) {
                  await handleCumulativePartnerPayment(selectedPartnerMonths);
                  setConfirmPartnerMonthSelectionDialog(false);
                }
              }}
              disabled={selectedPartnerMonthTotal === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessingPartnerPayment ? 'Processing...' : `Continue with ₹${selectedPartnerMonthTotal.toLocaleString()}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Owner Share Month Selection Dialog */}
      <AlertDialog open={confirmOwnerShareMonthSelectionDialog} onOpenChange={(open) => {
        setConfirmOwnerShareMonthSelectionDialog(open);
        if (!open) {
          setSelectedOwnerShareMonthIndices([]);
        }
      }}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="11" label="Owner Share Month Selection" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-indigo-500" />
              Select Months for Owner Share Withdrawal
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  Select months to withdraw owner shares from <span className="font-semibold">{vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{selectedPeriod === 'quarter' ? `Q${selectedQuarter} ${selectedYear}` : selectedYear}</span>.
                </p>

                {selectedPeriod === 'quarter' && (
                  <div className="bg-indigo-50 p-3 rounded-md">
                    <p className="font-semibold text-indigo-800 mb-2">Quarterly Owner Share Breakdown ({selectedPeriod === 'quarter' ? `Q${selectedQuarter} ${selectedYear}` : selectedYear}):</p>
                    <p className="text-xs text-indigo-700 mb-3">
                      Select months with owner share amounts to withdraw. Only months with actual owner shares will be shown.
                    </p>
                    {(() => {
                      const quarterMonths = {
                        '1': [0, 1, 2], '2': [3, 4, 5], '3': [6, 7, 8], '4': [9, 10, 11]
                      } as const;
                      const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths] || [];
                      const ownerShareMonths = months
                        .map(monthIndex => {
                          const monthData = monthlyData.find(m => m.month === monthIndex);
                          const totalOwnerAmount = (monthData?.ownerShare || 0) + (monthData?.ownerFullShare || 0);
                          return monthData && totalOwnerAmount > 0 ? {
                            month: monthIndex,
                            monthName: new Date(parseInt(selectedYear), monthIndex).toLocaleString('default', { month: 'long' }),
                            ownerShare: totalOwnerAmount,
                            monthStr: monthData.monthStr,
                            isCollected: monthData.ownerShareCollected || monthData.ownerWithdrawn
                          } : null;
                        })
                        .filter(Boolean);

                      if (ownerShareMonths.length === 0) {
                        return (
                          <div className="bg-white border border-dashed border-indigo-300 rounded p-3 text-sm text-indigo-700">
                            No owner shares pending for this quarter.
                          </div>
                        );
                      }

                      return (
                        <div className="border border-indigo-200 rounded">
                          <div className="flex items-center justify-between px-3 py-2 border-b border-indigo-200 bg-white text-xs text-indigo-700">
                            <span>Months with Owner Shares: {ownerShareMonths.length}</span>
                          </div>
                          <div className="max-h-40 overflow-y-auto divide-y divide-indigo-100 bg-white">
                            {ownerShareMonths.map((ownerShareMonth) => {
                              const isSelected = selectedOwnerShareMonthIndices.includes(ownerShareMonth!.month);
                              const checkboxId = `owner-share-month-${ownerShareMonth!.month}`;

                              return (
                                <label
                                  key={ownerShareMonth!.month}
                                  htmlFor={checkboxId}
                                  className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={checkboxId}
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        setSelectedOwnerShareMonthIndices(prev =>
                                          prev.includes(ownerShareMonth!.month)
                                            ? prev.filter(m => m !== ownerShareMonth!.month)
                                            : [...prev, ownerShareMonth!.month]
                                        );
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-indigo-900">{ownerShareMonth!.monthName} {selectedYear}</span>
                                      <span className="text-xs text-gray-500">
                                        {ownerShareMonth!.isCollected ? 'Already Withdrawn' : 'Pending'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-700">
                                    ₹{ownerShareMonth!.ownerShare.toLocaleString()}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="mt-3 flex items-center justify-between text-sm font-semibold text-indigo-900">
                      <span>Selected Owner Share Amount</span>
                      <span>₹{selectedOwnerShareMonthTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {selectedPeriod === 'year' && (
                  <div className="bg-indigo-50 p-3 rounded-md">
                    <p className="font-semibold text-indigo-800 mb-2">Yearly Owner Share Breakdown ({selectedYear}):</p>
                    <p className="text-xs text-indigo-700 mb-3">
                      Select months with owner share amounts to withdraw. Only months with actual owner shares will be shown.
                    </p>
                    {(() => {
                      const ownerShareMonths = monthlyData
                        .filter(m => (m.ownerShare || 0) + (m.ownerFullShare || 0) > 0)
                        .map(m => ({
                          month: m.month,
                          monthName: m.monthName,
                          ownerShare: (m.ownerShare || 0) + (m.ownerFullShare || 0),
                          monthStr: m.monthStr,
                          isCollected: m.ownerShareCollected || m.ownerWithdrawn
                        }));

                      if (ownerShareMonths.length === 0) {
                        return (
                          <div className="bg-white border border-dashed border-indigo-300 rounded p-3 text-sm text-indigo-700">
                            No owner shares pending for this year.
                          </div>
                        );
                      }

                      return (
                        <div className="border border-indigo-200 rounded">
                          <div className="flex items-center justify-between px-3 py-2 border-b border-indigo-200 bg-white text-xs text-indigo-700">
                            <span>Months with Owner Shares: {ownerShareMonths.length}</span>
                          </div>
                          <div className="max-h-40 overflow-y-auto divide-y divide-indigo-100 bg-white">
                            {ownerShareMonths.map((ownerShareMonth) => {
                              const isSelected = selectedOwnerShareMonthIndices.includes(ownerShareMonth.month);
                              const checkboxId = `owner-share-month-${ownerShareMonth.month}`;

                              return (
                                <label
                                  key={ownerShareMonth.month}
                                  htmlFor={checkboxId}
                                  className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={checkboxId}
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        setSelectedOwnerShareMonthIndices(prev =>
                                          prev.includes(ownerShareMonth.month)
                                            ? prev.filter(m => m !== ownerShareMonth.month)
                                            : [...prev, ownerShareMonth.month]
                                        );
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-indigo-900">{ownerShareMonth.monthName} {selectedYear}</span>
                                      <span className="text-xs text-gray-500">
                                        {ownerShareMonth.isCollected ? 'Already Withdrawn' : 'Pending'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-700">
                                    ₹{ownerShareMonth.ownerShare.toLocaleString()}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="mt-3 flex items-center justify-between text-sm font-semibold text-indigo-900">
                      <span>Selected Owner Share Amount</span>
                      <span>₹{selectedOwnerShareMonthTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedOwnerShareMonthTotal > 0) {
                  await handleCumulativeOwnerShareCollection(selectedOwnerShareMonths);
                  setConfirmOwnerShareMonthSelectionDialog(false);
                }
              }}
              disabled={selectedOwnerShareMonthTotal === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isProcessingOwnerShare ? 'Processing...' : `Continue with ₹${selectedOwnerShareMonthTotal.toLocaleString()}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Owner Share Confirmation Dialog */}
      <AlertDialog open={confirmOwnerShareDialog} onOpenChange={setConfirmOwnerShareDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="11" label="Owner Share Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-500" />
              Confirm Owner Share Collection
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  You are about to collect owner share from <span className="font-semibold">{vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{selectedDialogPeriodLabel || 'the selected period'}</span>.
                </p>

                {isCumulativeSelection ? (
                  <>
                    {selectedPeriod === 'quarter' && (
                      <div className="bg-indigo-50 p-3 rounded-md">
                        <p className="font-semibold text-indigo-800 mb-2">Quarterly Breakdown ({selectedDialogPeriodLabel}):</p>
                        <div className="space-y-1 text-sm">
                          {(() => {
                            const quarterMonths = {
                              '1': ['January', 'February', 'March'],
                              '2': ['April', 'May', 'June'],
                              '3': ['July', 'August', 'September'],
                              '4': ['October', 'November', 'December']
                            } as const;
                            const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths] || [];
                            return months.map((monthName, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{monthName} {selectedYear}:</span>
                                <span className="font-medium">₹{formatCurrency((selectedMonthData?.ownerShare ?? 0) / 3)}</span>
                              </div>
                            ));
                          })()}
                          <div className="border-t pt-1 mt-2 flex justify-between font-bold">
                            <span>Total Owner Share:</span>
                            <span>₹{formatCurrency(selectedMonthData?.ownerShare)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPeriod === 'year' && (
                      <div className="bg-indigo-50 p-3 rounded-md">
                        <p className="font-semibold text-indigo-800 mb-2">Yearly Breakdown ({selectedYear}):</p>
                        <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                          {Array.from({ length: 12 }, (_, i) => {
                            const monthName = new Date(parseInt(selectedYear), i).toLocaleString('default', { month: 'long' });
                            return (
                              <div key={i} className="flex justify-between">
                                <span>{monthName} {selectedYear}:</span>
                                <span className="font-medium">₹{formatCurrency((selectedMonthData?.ownerShare ?? 0) / 12)}</span>
                              </div>
                            );
                          })}
                          <div className="border-t pt-1 mt-2 flex justify-between font-bold">
                            <span>Total Owner Share:</span>
                            <span>₹{formatCurrency(selectedMonthData?.ownerShare)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPeriod === 'month' && (
                      <div className="bg-indigo-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-indigo-800">{selectedDialogPeriodLabel} Owner Share:</span>
                          <span className="font-bold text-indigo-700 text-lg">₹{formatCurrency(selectedMonthData?.ownerShare)}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-indigo-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-indigo-800">
                        {selectedMonthData?.monthName} {selectedMonthData?.year} Owner Share:
                      </span>
                      <span className="font-bold text-indigo-700 text-lg">
                        ₹{formatCurrency(selectedMonthData?.ownerShare)}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  This action will collect the owner share and update the cash balance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedMonthData?.isCumulative) {
                  handleCumulativeOwnerShareCollection();
                } else if (selectedMonthData) {
                  handleOwnerShareCollection(selectedMonthData);
                }
                setConfirmOwnerShareDialog(false);
                setSelectedMonthData(null);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Collect ₹{formatCurrency(selectedMonthData?.ownerShare)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Service Charge Confirmation Dialog */}
      <AlertDialog open={confirmServiceChargeDialog} onOpenChange={setConfirmServiceChargeDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="9" label="Service Charge Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Confirm Service Charge Collection
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  You are about to collect service charges from <span className="font-semibold">{vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{selectedDialogPeriodLabel || 'the selected period'}</span>.
                </p>

                {isCumulativeSelection ? (
                  <>
                    {selectedPeriod === 'quarter' && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="font-semibold text-green-800 mb-2">Quarterly Breakdown ({selectedDialogPeriodLabel}):</p>
                        <div className="space-y-1 text-sm">
                          {(() => {
                            const quarterMonths = {
                              '1': ['January', 'February', 'March'],
                              '2': ['April', 'May', 'June'],
                              '3': ['July', 'August', 'September'],
                              '4': ['October', 'November', 'December']
                            } as const;
                            const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths] || [];
                            return months.map((monthName, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{monthName} {selectedYear}:</span>
                                <span className="font-medium">₹{formatCurrency((selectedMonthData?.serviceCharge ?? 0) / 3)}</span>
                              </div>
                            ));
                          })()}
                          <div className="border-t pt-1 mt-2 flex justify-between font-bold">
                            <span>Total Service Charge:</span>
                            <span>₹{formatCurrency(selectedMonthData?.serviceCharge)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPeriod === 'year' && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="font-semibold text-green-800 mb-2">Yearly Breakdown ({selectedYear}):</p>
                        <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                          {Array.from({ length: 12 }, (_, i) => {
                            const monthName = new Date(parseInt(selectedYear), i).toLocaleString('default', { month: 'long' });
                            return (
                              <div key={i} className="flex justify-between">
                                <span>{monthName} {selectedYear}:</span>
                                <span className="font-medium">₹{formatCurrency((selectedMonthData?.serviceCharge ?? 0) / 12)}</span>
                              </div>
                            );
                          })}
                          <div className="border-t pt-1 mt-2 flex justify-between font-bold">
                            <span>Total Service Charge:</span>
                            <span>₹{formatCurrency(selectedMonthData?.serviceCharge)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPeriod === 'month' && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-800">{selectedDialogPeriodLabel} Service Charge:</span>
                          <span className="font-bold text-green-700 text-lg">₹{formatCurrency(selectedMonthData?.serviceCharge)}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800">
                        {selectedMonthData?.monthName} {selectedMonthData?.year} Service Charge:
                      </span>
                      <span className="font-bold text-green-700 text-lg">
                        ₹{formatCurrency(selectedMonthData?.serviceCharge)}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  This action will collect the service charge and update the cash balance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingServiceCharge}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedMonthData?.isCumulative) {
                  handleCumulativeServiceChargeCollection();
                } else if (selectedMonthData) {
                  handleServiceChargeCollection(selectedMonthData);
                }
                setConfirmServiceChargeDialog(false);
                setSelectedMonthData(null);
              }}
              disabled={isProcessingServiceCharge}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingServiceCharge ? 'Processing...' : `Collect ₹${formatCurrency(selectedMonthData?.serviceCharge)}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Partner Payment Confirmation Dialog */}
      <AlertDialog open={confirmPartnerPaymentDialog} onOpenChange={setConfirmPartnerPaymentDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="10" label="Partner Payment Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Confirm Partner Payment
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  You are about to pay partner share to <span className="font-semibold">{vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{selectedDialogPeriodLabel || 'the selected period'}</span>.
                </p>

                {isCumulativeSelection ? (
                  <>
                    {selectedPeriod === 'quarter' && (
                      <div className="bg-purple-50 p-3 rounded-md">
                        <p className="font-semibold text-purple-800 mb-2">Quarterly Breakdown ({selectedDialogPeriodLabel}):</p>
                        <div className="space-y-1 text-sm">
                          {(() => {
                            const quarterMonths = {
                              '1': ['January', 'February', 'March'],
                              '2': ['April', 'May', 'June'],
                              '3': ['July', 'August', 'September'],
                              '4': ['October', 'November', 'December']
                            } as const;
                            const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths] || [];
                            return months.map((monthName, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{monthName} {selectedYear}:</span>
                                <span className="font-medium">₹{formatCurrency((selectedMonthData?.partnerShare ?? 0) / 3)}</span>
                              </div>
                            ));
                          })()}
                          <div className="border-t pt-1 mt-2 flex justify-between font-bold">
                            <span>Total Partner Share:</span>
                            <span>₹{formatCurrency(selectedMonthData?.partnerShare)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPeriod === 'year' && (
                      <div className="bg-purple-50 p-3 rounded-md">
                        <p className="font-semibold text-purple-800 mb-2">Yearly Breakdown ({selectedYear}):</p>
                        <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                          {Array.from({ length: 12 }, (_, i) => {
                            const monthName = new Date(parseInt(selectedYear), i).toLocaleString('default', { month: 'long' });
                            return (
                              <div key={i} className="flex justify-between">
                                <span>{monthName} {selectedYear}:</span>
                                <span className="font-medium">₹{formatCurrency((selectedMonthData?.partnerShare ?? 0) / 12)}</span>
                              </div>
                            );
                          })}
                          <div className="border-t pt-1 mt-2 flex justify-between font-bold">
                            <span>Total Partner Share:</span>
                            <span>₹{formatCurrency(selectedMonthData?.partnerShare)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPeriod === 'month' && (
                      <div className="bg-purple-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-purple-800">{selectedDialogPeriodLabel} Partner Share:</span>
                          <span className="font-bold text-purple-700 text-lg">₹{formatCurrency(selectedMonthData?.partnerShare)}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-purple-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-purple-800">
                        {selectedMonthData?.monthName} {selectedMonthData?.year} Partner Share:
                      </span>
                      <span className="font-bold text-purple-700 text-lg">
                        ₹{formatCurrency(selectedMonthData?.partnerShare)}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  This action will pay the partner share and update the cash balance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingPartnerPayment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedMonthData?.isCumulative) {
                  handleCumulativePartnerPayment();
                } else if (selectedMonthData) {
                  handlePartnerPayment(selectedMonthData);
                }
                setConfirmPartnerPaymentDialog(false);
                setSelectedMonthData(null);
              }}
              disabled={isProcessingPartnerPayment}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessingPartnerPayment ? 'Processing...' : `Pay ₹${formatCurrency(selectedMonthData?.partnerShare)}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Owner Withdrawal Confirmation Dialog */}
      <AlertDialog open={confirmOwnerWithdrawalDialog} onOpenChange={setConfirmOwnerWithdrawalDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <SectionNumberBadge id="12" label="Owner Withdrawal Dialog" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-orange-500" />
              Confirm Owner Withdrawal
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-gray-700">
                  You are about to withdraw owner share from <span className="font-semibold">{vehicle?.registrationNumber}</span> for{' '}
                  <span className="font-semibold">{selectedDialogPeriodLabel || 'the selected period'}</span>.
                </p>

                {isCumulativeSelection ? (
                  <>
                    {selectedPeriod === 'quarter' && (
                      <div className="bg-orange-50 p-3 rounded-md">
                        <p className="font-semibold text-orange-800 mb-2">Quarterly Breakdown ({selectedDialogPeriodLabel}):</p>
                        <div className="space-y-1 text-sm">
                          {(() => {
                            const quarterMonths = {
                              '1': ['January', 'February', 'March'],
                              '2': ['April', 'May', 'June'],
                              '3': ['July', 'August', 'September'],
                              '4': ['October', 'November', 'December']
                            } as const;
                            const months = quarterMonths[selectedQuarter as keyof typeof quarterMonths] || [];
                            return months.map((monthName, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{monthName} {selectedYear}:</span>
                                <span className="font-medium">₹{formatCurrency((selectedMonthData?.ownerFullShare ?? 0) / 3)}</span>
                              </div>
                            ));
                          })()}
                          <div className="border-t pt-1 mt-2 flex justify-between font-bold">
                            <span>Total Owner Withdrawal:</span>
                            <span>₹{formatCurrency(selectedMonthData?.ownerFullShare)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPeriod === 'year' && (
                      <div className="bg-orange-50 p-3 rounded-md">
                        <p className="font-semibold text-orange-800 mb-2">Yearly Breakdown ({selectedYear}):</p>
                        <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                          {Array.from({ length: 12 }, (_, i) => {
                            const monthName = new Date(parseInt(selectedYear), i).toLocaleString('default', { month: 'long' });
                            return (
                              <div key={i} className="flex justify-between">
                                <span>{monthName} {selectedYear}:</span>
                                <span className="font-medium">₹{formatCurrency((selectedMonthData?.ownerFullShare ?? 0) / 12)}</span>
                              </div>
                            );
                          })}
                          <div className="border-t pt-1 mt-2 flex justify-between font-bold">
                            <span>Total Owner Withdrawal:</span>
                            <span>₹{formatCurrency(selectedMonthData?.ownerFullShare)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPeriod === 'month' && (
                      <div className="bg-orange-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-orange-800">{selectedDialogPeriodLabel} Owner Withdrawal:</span>
                          <span className="font-bold text-orange-700 text-lg">₹{formatCurrency(selectedMonthData?.ownerFullShare)}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-orange-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-orange-800">
                        {selectedDialogPeriodLabel} Owner Withdrawal:
                      </span>
                      <span className="font-bold text-orange-700 text-lg">
                        ₹{formatCurrency(selectedMonthData?.ownerFullShare)}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  This action will withdraw the owner share and update the cash balance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedMonthData?.isCumulative) {
                  handleCumulativeOwnerShareCollection();
                } else if (selectedMonthData) {
                  handleOwnerWithdrawal(selectedMonthData);
                }
                setConfirmOwnerWithdrawalDialog(false);
                setSelectedMonthData(null);
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Withdraw ₹{formatCurrency(selectedMonthData?.ownerFullShare)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default AccountsTab;