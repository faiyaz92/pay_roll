import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, doc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';
import BulkPaymentDialog from './BulkPaymentDialog';
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
  Car,
  Filter,
  Calendar,
  CreditCard
} from 'lucide-react';

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

interface FinancialAccountsTabProps {
  companyFinancialData: any;
  accountingTransactions: AccountingTransaction[];
  setAccountingTransactions: (transactions: AccountingTransaction[]) => void;
}

const FinancialAccountsTab: React.FC<FinancialAccountsTabProps> = ({
  companyFinancialData,
  accountingTransactions,
  setAccountingTransactions
}) => {
  const { userInfo } = useAuth();
  const { vehicles } = useFirebaseData();
  const [vehicleCashBalances, setVehicleCashBalances] = useState<Record<string, number>>({});

  // Bulk payment dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkDialogType, setBulkDialogType] = useState<'gst' | 'service_charge' | 'partner_share' | 'owner_share'>('gst');
  const [bulkDialogItems, setBulkDialogItems] = useState<any[]>([]);
  const [bulkDialogTitle, setBulkDialogTitle] = useState('');
  const [bulkDialogDescription, setBulkDialogDescription] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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
  const handleGstPayment = async (vehicleInfo: any) => {
    try {
      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        vehicleId: vehicleInfo.vehicle.id,
        type: 'gst_payment',
        amount: vehicleInfo.gstAmount,
        month: vehicleInfo.periodStr,
        description: `GST Payment for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Update cash in hand for this vehicle
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
      const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
      await updateDoc(cashRef, {
        balance: currentBalance - vehicleInfo.gstAmount,
        lastUpdated: new Date().toISOString()
      });

      // Update company-level cash balance
      const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
      await updateDoc(companyCashRef, {
        balance: increment(-vehicleInfo.gstAmount),
        lastUpdated: new Date().toISOString()
      });

      // Update local state
      setVehicleCashBalances(prev => ({
        ...prev,
        [vehicleInfo.vehicle.id]: currentBalance - vehicleInfo.gstAmount
      }));

      toast({
        title: 'GST Paid Successfully',
        description: `₹${vehicleInfo.gstAmount.toLocaleString()} GST payment recorded for ${vehicleInfo.vehicle.registrationNumber}`,
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
  const handleServiceChargeCollection = async (vehicleInfo: any) => {
    try {
      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        vehicleId: vehicleInfo.vehicle.id,
        type: 'service_charge',
        amount: vehicleInfo.serviceCharge,
        month: vehicleInfo.periodStr,
        description: `Service Charge Collection for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Update cash in hand - INCREASE when owner collects service charge (additional income)
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
      const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
      await updateDoc(cashRef, {
        balance: currentBalance + vehicleInfo.serviceCharge,  // Service charge is additional income
        lastUpdated: new Date().toISOString()
      });

      // Update company-level cash balance
      const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
      await updateDoc(companyCashRef, {
        balance: increment(vehicleInfo.serviceCharge),
        lastUpdated: new Date().toISOString()
      });

      // Update local state
      setVehicleCashBalances(prev => ({
        ...prev,
        [vehicleInfo.vehicle.id]: currentBalance + vehicleInfo.serviceCharge
      }));

      toast({
        title: 'Service Charge Collected',
        description: `₹${vehicleInfo.serviceCharge.toLocaleString()} service charge collected as additional income for ${vehicleInfo.vehicle.registrationNumber}`,
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
  const handlePartnerPayment = async (vehicleInfo: any) => {
    try {
      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        vehicleId: vehicleInfo.vehicle.id,
        type: 'partner_payment',
        amount: vehicleInfo.partnerShare,
        month: vehicleInfo.periodStr,
        description: `Partner Payment for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Update cash in hand
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
      const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
      await updateDoc(cashRef, {
        balance: currentBalance - vehicleInfo.partnerShare,
        lastUpdated: new Date().toISOString()
      });

      // Update company-level cash balance
      const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
      await updateDoc(companyCashRef, {
        balance: increment(-vehicleInfo.partnerShare),
        lastUpdated: new Date().toISOString()
      });

      // Update local state
      setVehicleCashBalances(prev => ({
        ...prev,
        [vehicleInfo.vehicle.id]: currentBalance - vehicleInfo.partnerShare
      }));

      toast({
        title: 'Partner Paid Successfully',
        description: `₹${vehicleInfo.partnerShare.toLocaleString()} paid to partner for ${vehicleInfo.vehicle.registrationNumber}`,
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
  const handleOwnerShareCollection = async (vehicleInfo: any) => {
    try {
      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        vehicleId: vehicleInfo.vehicle.id,
        type: 'owner_share',
        amount: vehicleInfo.ownerShare,
        month: vehicleInfo.periodStr,
        description: `Owner's Share Collection for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Update cash in hand
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
      const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
      await updateDoc(cashRef, {
        balance: currentBalance - vehicleInfo.ownerShare,
        lastUpdated: new Date().toISOString()
      });

      // Update company-level cash balance
      const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
      await updateDoc(companyCashRef, {
        balance: increment(-vehicleInfo.ownerShare),
        lastUpdated: new Date().toISOString()
      });

      // Update local state
      setVehicleCashBalances(prev => ({
        ...prev,
        [vehicleInfo.vehicle.id]: currentBalance - vehicleInfo.ownerShare
      }));

      toast({
        title: 'Owner\'s Share Collected',
        description: `₹${vehicleInfo.ownerShare.toLocaleString()} collected as owner's share for ${vehicleInfo.vehicle.registrationNumber}`,
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
  const handleOwnerWithdrawal = async (vehicleInfo: any) => {
    try {
      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        vehicleId: vehicleInfo.vehicle.id,
        type: 'owner_withdrawal',
        amount: vehicleInfo.ownerFullShare,
        month: vehicleInfo.periodStr,
        description: `Owner's Withdrawal for ${vehicleInfo.vehicle.registrationNumber} - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Update cash in hand
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleInfo.vehicle.id);
      const currentBalance = vehicleCashBalances[vehicleInfo.vehicle.id] || 0;
      await updateDoc(cashRef, {
        balance: currentBalance - vehicleInfo.ownerFullShare,
        lastUpdated: new Date().toISOString()
      });

      // Update company-level cash balance
      const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
      await updateDoc(companyCashRef, {
        balance: increment(-vehicleInfo.ownerFullShare),
        lastUpdated: new Date().toISOString()
      });

      // Update local state
      setVehicleCashBalances(prev => ({
        ...prev,
        [vehicleInfo.vehicle.id]: currentBalance - vehicleInfo.ownerFullShare
      }));

      toast({
        title: 'Owner\'s Withdrawal Completed',
        description: `₹${vehicleInfo.ownerFullShare.toLocaleString()} withdrawn for ${vehicleInfo.vehicle.registrationNumber}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process owner\'s withdrawal',
        variant: 'destructive'
      });
    }
  };

  // Bulk payment functions
  const openBulkPaymentDialog = (type: 'gst' | 'service_charge' | 'partner_share' | 'owner_share') => {
    const { periodData } = getPeriodData();
    let items: any[] = [];
    let title = '';
    let description = '';

    switch (type) {
      case 'gst':
        title = `Bulk GST Payment - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;
        description = `Pay GST for all vehicles in the selected period. You can deselect vehicles that should not have GST paid.`;
        items = periodData
          .filter(vehicle => vehicle.gstAmount > 0 && !vehicle.gstPaid)
          .map(vehicle => ({
            vehicleId: vehicle.vehicle.id,
            vehicleName: vehicle.vehicle.registrationNumber,
            amount: vehicle.gstAmount,
            monthBreakdown: companyFinancialData.filterType === 'quarterly' ? getQuarterlyGSTBreakdown(vehicle) : undefined,
            checked: true
          }));
        break;

      case 'service_charge':
        title = `Bulk Service Charge Collection - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;
        description = `Collect service charges from all partner vehicles in the selected period. You can deselect vehicles that should not have service charges collected.`;
        items = periodData
          .filter(vehicle => vehicle.serviceCharge > 0 && !vehicle.serviceChargeCollected && vehicle.vehicle.ownershipType === 'partner')
          .map(vehicle => ({
            vehicleId: vehicle.vehicle.id,
            vehicleName: vehicle.vehicle.registrationNumber,
            amount: vehicle.serviceCharge,
            monthBreakdown: companyFinancialData.filterType === 'quarterly' ? getQuarterlyServiceChargeBreakdown(vehicle) : undefined,
            checked: true
          }));
        break;

      case 'partner_share':
        title = `Bulk Partner Share Payment - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;
        description = `Pay partner shares for all partner vehicles in the selected period. You can deselect vehicles that should not have partner shares paid.`;
        items = periodData
          .filter(vehicle => vehicle.partnerShare > 0 && !vehicle.partnerPaid && vehicle.vehicle.ownershipType === 'partner')
          .map(vehicle => ({
            vehicleId: vehicle.vehicle.id,
            vehicleName: vehicle.vehicle.registrationNumber,
            amount: vehicle.partnerShare,
            monthBreakdown: companyFinancialData.filterType === 'quarterly' ? getQuarterlyPartnerShareBreakdown(vehicle) : undefined,
            checked: true
          }));
        break;

      case 'owner_share':
        title = `Bulk Owner Share Collection - ${companyFinancialData.periodLabel} ${companyFinancialData.selectedYear}`;
        description = `Collect owner shares from all partner vehicles in the selected period. You can deselect vehicles that should not have owner shares collected.`;
        items = periodData
          .filter(vehicle => vehicle.ownerShare > 0 && !vehicle.ownerShareCollected && vehicle.vehicle.ownershipType === 'partner')
          .map(vehicle => ({
            vehicleId: vehicle.vehicle.id,
            vehicleName: vehicle.vehicle.registrationNumber,
            amount: vehicle.ownerShare,
            monthBreakdown: companyFinancialData.filterType === 'quarterly' ? getQuarterlyOwnerShareBreakdown(vehicle) : undefined,
            checked: true
          }));
        break;
    }

    setBulkDialogType(type);
    setBulkDialogItems(items);
    setBulkDialogTitle(title);
    setBulkDialogDescription(description);
    setBulkDialogOpen(true);
  };

  // Helper functions for quarterly breakdowns
  const getQuarterlyGSTBreakdown = (vehicleInfo: any) => {
    const year = parseInt(companyFinancialData.selectedYear);
    const quarterMonths = {
      'Q1': [0, 1, 2], // Jan, Feb, Mar
      'Q2': [3, 4, 5], // Apr, May, Jun
      'Q3': [6, 7, 8], // Jul, Aug, Sep
      'Q4': [9, 10, 11] // Oct, Nov, Dec
    };
    const months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];

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

  const getQuarterlyServiceChargeBreakdown = (vehicleInfo: any) => {
    const year = parseInt(companyFinancialData.selectedYear);
    const quarterMonths = {
      'Q1': [0, 1, 2], // Jan, Feb, Mar
      'Q2': [3, 4, 5], // Apr, May, Jun
      'Q3': [6, 7, 8], // Jul, Aug, Sep
      'Q4': [9, 10, 11] // Oct, Nov, Dec
    };
    const months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];

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

      const isPartnerTaxi = vehicleInfo.vehicle.ownershipType === 'partner';
      const serviceChargeRate = vehicleInfo.vehicle.serviceChargeRate || 0.10;
      const monthServiceCharge = isPartnerTaxi && monthProfit > 0 ? monthProfit * serviceChargeRate : 0;

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: monthNames[monthIndex],
        amount: monthServiceCharge
      };
    });
  };

  const getQuarterlyPartnerShareBreakdown = (vehicleInfo: any) => {
    const year = parseInt(companyFinancialData.selectedYear);
    const quarterMonths = {
      'Q1': [0, 1, 2], // Jan, Feb, Mar
      'Q2': [3, 4, 5], // Apr, May, Jun
      'Q3': [6, 7, 8], // Jul, Aug, Sep
      'Q4': [9, 10, 11] // Oct, Nov, Dec
    };
    const months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];

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
      const isPartnerTaxi = vehicleInfo.vehicle.ownershipType === 'partner';
      const serviceChargeRate = vehicleInfo.vehicle.serviceChargeRate || 0.10;
      const serviceCharge = isPartnerTaxi && monthProfit > 0 ? monthProfit * serviceChargeRate : 0;

      const remainingProfitAfterDeductions = monthProfit - gstAmount - serviceCharge;
      const partnerSharePercentage = vehicleInfo.vehicle.partnerShare || 0.50;
      const monthPartnerShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
        remainingProfitAfterDeductions * partnerSharePercentage : 0;

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: monthNames[monthIndex],
        amount: monthPartnerShare
      };
    });
  };

  const getQuarterlyOwnerShareBreakdown = (vehicleInfo: any) => {
    const year = parseInt(companyFinancialData.selectedYear);
    const quarterMonths = {
      'Q1': [0, 1, 2], // Jan, Feb, Mar
      'Q2': [3, 4, 5], // Apr, May, Jun
      'Q3': [6, 7, 8], // Jul, Aug, Sep
      'Q4': [9, 10, 11] // Oct, Nov, Dec
    };
    const months = quarterMonths[companyFinancialData.selectedQuarter as keyof typeof quarterMonths];

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
      const isPartnerTaxi = vehicleInfo.vehicle.ownershipType === 'partner';
      const serviceChargeRate = vehicleInfo.vehicle.serviceChargeRate || 0.10;
      const serviceCharge = isPartnerTaxi && monthProfit > 0 ? monthProfit * serviceChargeRate : 0;

      const remainingProfitAfterDeductions = monthProfit - gstAmount - serviceCharge;
      const partnerSharePercentage = vehicleInfo.vehicle.partnerShare || 0.50;
      const monthOwnerShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
        remainingProfitAfterDeductions * (1 - partnerSharePercentage) : 0;

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: monthNames[monthIndex],
        amount: monthOwnerShare
      };
    });
  };

  // Handle bulk payment confirmation
  const handleBulkPaymentConfirm = async (selectedItems: any[]) => {
    if (selectedItems.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const { periodData } = getPeriodData();
      let totalAmount = 0;

      for (const item of selectedItems) {
        const vehicleInfo = periodData.find((v: any) => v.vehicle.id === item.vehicleId);
        if (!vehicleInfo) continue;

        totalAmount += item.amount;

        // Process payment based on type
        switch (bulkDialogType) {
          case 'gst':
            await handleGstPayment(vehicleInfo);
            break;
          case 'service_charge':
            await handleServiceChargeCollection(vehicleInfo);
            break;
          case 'partner_share':
            await handlePartnerPayment(vehicleInfo);
            break;
          case 'owner_share':
            await handleOwnerShareCollection(vehicleInfo);
            break;
        }

        // Small delay to prevent overwhelming Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
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
      if (companyFinancialData.partnerFilter === 'partner') return vehicleInfo.vehicle.ownershipType === 'partner';
      if (companyFinancialData.partnerFilter === 'company') return vehicleInfo.vehicle.ownershipType !== 'partner';
      return true;
    });

    // Calculate cumulative data for the selected period
    const periodData = filteredVehicles.map((vehicleInfo: any) => {
      let cumulativeEarnings = 0;
      let cumulativeExpenses = 0;
      let cumulativeProfit = 0;
      let cumulativeGst = 0;
      let cumulativeServiceCharge = 0;
      let cumulativePartnerShare = 0;
      let cumulativeOwnerShare = 0;
      let cumulativeOwnerFullShare = 0;

      // Sum up data for each month in the period
      months.forEach(monthIndex => {
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

        // Get payments and expenses for this month
        const monthPayments = (companyFinancialData.payments || []).filter((p: any) =>
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

        cumulativeEarnings += monthEarnings;
        cumulativeExpenses += monthExpensesAmount;
        cumulativeProfit += monthProfit;

        // GST calculation (4% - only if profit is positive)
        const monthGst = monthProfit > 0 ? monthProfit * 0.04 : 0;
        cumulativeGst += monthGst;

        // Service charge (10% for partner taxis - only if profit is positive)
        const isPartnerTaxi = vehicleInfo.vehicle.ownershipType === 'partner';
        const serviceChargeRate = vehicleInfo.vehicle.serviceChargeRate || 0.10;
        const monthServiceCharge = isPartnerTaxi && monthProfit > 0 ? monthProfit * serviceChargeRate : 0;
        cumulativeServiceCharge += monthServiceCharge;

        // Partner share and owner share calculations
        const remainingProfitAfterDeductions = monthProfit - monthGst - monthServiceCharge;
        const partnerSharePercentage = vehicleInfo.vehicle.partnerShare || 0.50;

        if (isPartnerTaxi && remainingProfitAfterDeductions > 0) {
          const monthPartnerShare = remainingProfitAfterDeductions * partnerSharePercentage;
          const monthOwnerShare = remainingProfitAfterDeductions * (1 - partnerSharePercentage);

          cumulativePartnerShare += monthPartnerShare;
          cumulativeOwnerShare += monthOwnerShare;
        } else if (!isPartnerTaxi && (monthProfit - monthGst) > 0) {
          cumulativeOwnerFullShare += (monthProfit - monthGst);
        }
      });

      // Check if payments are completed for the period
      const periodStr = companyFinancialData.filterType === 'yearly'
        ? `${year}`
        : companyFinancialData.filterType === 'quarterly'
        ? `${year}-${companyFinancialData.selectedQuarter}`
        : `${year}-${companyFinancialData.monthName}`;

      const gstPaid = accountingTransactions.some((t: any) =>
        t.vehicleId === vehicleInfo.vehicle.id && t.type === 'gst_payment' && t.month === periodStr && t.status === 'completed'
      );
      const serviceChargeCollected = accountingTransactions.some((t: any) =>
        t.vehicleId === vehicleInfo.vehicle.id && t.type === 'service_charge' && t.month === periodStr && t.status === 'completed'
      );
      const partnerPaid = accountingTransactions.some((t: any) =>
        t.vehicleId === vehicleInfo.vehicle.id && t.type === 'partner_payment' && t.month === periodStr && t.status === 'completed'
      );
      const ownerShareCollected = accountingTransactions.some((t: any) =>
        t.vehicleId === vehicleInfo.vehicle.id && t.type === 'owner_share' && t.month === periodStr && t.status === 'completed'
      );
      const ownerWithdrawn = accountingTransactions.some((t: any) =>
        t.vehicleId === vehicleInfo.vehicle.id && t.type === 'owner_withdrawal' && t.month === periodStr && t.status === 'completed'
      );

      return {
        ...vehicleInfo,
        earnings: cumulativeEarnings,
        expenses: cumulativeExpenses,
        profit: cumulativeProfit,
        gstAmount: cumulativeGst,
        serviceCharge: cumulativeServiceCharge,
        partnerShare: cumulativePartnerShare,
        ownerShare: cumulativeOwnerShare,
        ownerFullShare: cumulativeOwnerFullShare,
        gstPaid,
        serviceChargeCollected,
        partnerPaid,
        ownerShareCollected,
        ownerWithdrawn,
        periodStr
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
      totalOwnerShare: periodData.reduce((sum, v) => sum + v.ownerShare, 0),
      totalOwnerFullShare: periodData.reduce((sum, v) => sum + v.ownerFullShare, 0),
      vehicleCount: periodData.length
    };

    return { periodData, periodTotals };
  };

  const { periodData, periodTotals } = getPeriodData();

  return (
    <div className="space-y-6">
      {/* Quarterly Summary */}
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
              <div className="text-2xl font-bold text-orange-600">
                ₹{periodTotals.totalGst.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">GST Payable</div>
            </div>
          </div>

          {/* Additional period breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
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
                ₹{(periodTotals.totalOwnerShare + periodTotals.totalOwnerFullShare).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Owner Shares</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-indigo-600">
                ₹{Object.values(vehicleCashBalances).reduce((sum, balance) => sum + balance, 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Current Cash</div>
            </div>
          </div>

          {/* Bulk Payment Actions */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() => openBulkPaymentDialog('gst')}
                disabled={periodTotals.totalGst === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Pay GST ({periodTotals.totalGst.toLocaleString()})
              </Button>
              <Button
                onClick={() => openBulkPaymentDialog('service_charge')}
                disabled={periodTotals.totalServiceCharge === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Collect Service Charges ({periodTotals.totalServiceCharge.toLocaleString()})
              </Button>
              <Button
                onClick={() => openBulkPaymentDialog('partner_share')}
                disabled={periodTotals.totalPartnerShare === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Pay Partner Shares ({periodTotals.totalPartnerShare.toLocaleString()})
              </Button>
              <Button
                onClick={() => openBulkPaymentDialog('owner_share')}
                disabled={periodTotals.totalOwnerShare === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Collect Owner Shares ({periodTotals.totalOwnerShare.toLocaleString()})
              </Button>
            </div>
            <div className="text-xs text-gray-500 text-center mt-2">
              Bulk payments allow you to process multiple vehicles at once. You can deselect vehicles in the dialog.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Accounting Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {periodData.map((vehicleInfo: any) => (
          <Card key={vehicleInfo.vehicle.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span className="text-sm">{vehicleInfo.vehicle.registrationNumber}</span>
                  <Badge variant="outline" className="text-xs">
                    {vehicleInfo.vehicle.ownershipType === 'partner' ? 'Partner' : 'Company'}
                  </Badge>
                </div>
                <Badge variant={vehicleInfo.profit >= 0 ? "default" : "destructive"}>
                  {vehicleInfo.profit >= 0 ? 'Profit' : 'Loss'}
                </Badge>
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
                <div className="text-sm font-medium text-red-600">
                  ₹{vehicleInfo.expenses.toLocaleString()}
                </div>
              </div>

              {/* Profit Calculation */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span>Profit (Earnings - Expenses)</span>
                  <span className={`font-medium ${vehicleInfo.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{vehicleInfo.profit.toLocaleString()}
                  </span>
                </div>

                {/* GST */}
                <div className="flex justify-between text-sm">
                  <span>GST (4%)</span>
                  <span className="font-medium text-orange-600">
                    ₹{vehicleInfo.gstAmount.toLocaleString()}
                  </span>
                </div>

                {/* Service Charge (only for partner taxis) */}
                {vehicleInfo.serviceCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Service Charge (10%)</span>
                    <span className="font-medium text-blue-600">
                      ₹{vehicleInfo.serviceCharge.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Partner Share (only for partner taxis) */}
                {vehicleInfo.partnerShare > 0 && (
                  <div className="flex justify-between text-sm border-t pt-1">
                    <span className="font-medium">Partner Share (50%)</span>
                    <span className="font-bold text-purple-600">
                      ₹{vehicleInfo.partnerShare.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Owner's Full Share (only for company-owned taxis) */}
                {vehicleInfo.ownerFullShare > 0 && (
                  <div className="flex justify-between text-sm border-t pt-1">
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GST Payment</span>
                    {vehicleInfo.gstPaid ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGstPayment(vehicleInfo)}
                        disabled={vehicleInfo.gstAmount <= 0}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay GST
                      </Button>
                    )}
                  </div>

                  {/* Service Charge Collection - Only for partner taxis */}
                  {vehicleInfo.vehicle.ownershipType === 'partner' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Service Charge</span>
                      {vehicleInfo.serviceChargeCollected ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Collected
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleServiceChargeCollection(vehicleInfo)}
                          disabled={vehicleInfo.serviceCharge <= 0}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Collect
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Partner Payment - Only for partner taxis */}
                  {vehicleInfo.vehicle.ownershipType === 'partner' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Partner Payment</span>
                      {vehicleInfo.partnerPaid ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePartnerPayment(vehicleInfo)}
                          disabled={vehicleInfo.partnerShare <= 0}
                        >
                          <Banknote className="h-3 w-3 mr-1" />
                          Pay Partner
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Owner's Share Collection - Only for partner taxis */}
                  {vehicleInfo.vehicle.ownershipType === 'partner' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Collect Owner's Share</span>
                      {vehicleInfo.ownerShareCollected ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Collected
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOwnerShareCollection(vehicleInfo)}
                          disabled={vehicleInfo.ownerShare <= 0}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Collect Share
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Owner's Withdrawal - Only for company-owned taxis */}
                  {vehicleInfo.vehicle.ownershipType !== 'partner' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Owner's Withdrawal</span>
                      {vehicleInfo.ownerWithdrawn ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Withdrawn
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOwnerWithdrawal(vehicleInfo)}
                          disabled={vehicleInfo.ownerFullShare <= 0}
                        >
                          <Banknote className="h-3 w-3 mr-1" />
                          Withdraw
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Payment Dialog */}
      <BulkPaymentDialog
        isOpen={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        title={bulkDialogTitle}
        description={bulkDialogDescription}
        paymentType={bulkDialogType}
        items={bulkDialogItems}
        onConfirm={handleBulkPaymentConfirm}
        isLoading={isBulkProcessing}
      />
    </div>
  );
};

export default FinancialAccountsTab;