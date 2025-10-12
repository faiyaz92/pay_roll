import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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
  Clock
} from 'lucide-react';

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

const AccountsTab: React.FC<AccountsTabProps> = ({ vehicle, vehicleId }) => {
  const { userInfo } = useAuth();
  const { expenses, payments } = useFirebaseData();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedQuarter, setSelectedQuarter] = useState('1');
  const [accountingTransactions, setAccountingTransactions] = useState<AccountingTransaction[]>([]);
  const [cashInHand, setCashInHand] = useState(0);

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

      // GST calculation (4% - only if profit is positive)
      const gstAmount = profit > 0 ? profit * 0.04 : 0;

      // Service charge (10% for partner taxis - only if profit is positive)
      const isPartnerTaxi = vehicle?.ownershipType === 'partner';
      const serviceChargeRate = vehicle?.serviceChargeRate || 0.10; // Default 10%
      const serviceCharge = isPartnerTaxi && profit > 0 ? profit * serviceChargeRate : 0;

      // Partner share (configurable percentage after GST and service charge - only if remaining profit is positive)
      const partnerSharePercentage = vehicle?.partnerShare || 0.50; // Default 50%
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
      await updateDoc(cashRef, {
        balance: cashInHand - monthData.gstAmount,
        lastUpdated: new Date().toISOString()
      });

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

      // Update cash in hand - INCREASE when owner collects service charge (additional income)
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicleId);
      await updateDoc(cashRef, {
        balance: cashInHand + monthData.serviceCharge,  // Service charge is additional income
        lastUpdated: new Date().toISOString()
      });

      toast({
        title: 'Service Charge Collected',
        description: `₹${monthData.serviceCharge.toLocaleString()} service charge collected as additional income for ${monthData.monthName} ${monthData.year}`,
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
      await updateDoc(cashRef, {
        balance: cashInHand - monthData.partnerShare,
        lastUpdated: new Date().toISOString()
      });

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
      await updateDoc(cashRef, {
        balance: cashInHand - monthData.ownerShare,
        lastUpdated: new Date().toISOString()
      });

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
      await updateDoc(cashRef, {
        balance: cashInHand - monthData.ownerFullShare,
        lastUpdated: new Date().toISOString()
      });

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
    const totalProfit = monthlyData.reduce((sum, m) => sum + m.profit, 0);
    const totalGst = monthlyData.reduce((sum, m) => sum + m.gstAmount, 0);
    const totalServiceCharge = monthlyData.reduce((sum, m) => sum + m.serviceCharge, 0);
    const totalPartnerShare = monthlyData.reduce((sum, m) => sum + m.partnerShare, 0);
    const totalOwnerShare = monthlyData.reduce((sum, m) => sum + m.ownerShare, 0);
    const totalOwnerWithdrawal = monthlyData.reduce((sum, m) => sum + m.ownerFullShare, 0);

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
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* Cash in Hand Display */}
      <Card>
        <CardHeader>
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
      {(selectedPeriod === 'quarter' || selectedPeriod === 'year') && (
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Summary ({selectedPeriod === 'year' ? selectedYear : `Q${selectedQuarter} ${selectedYear}`})</CardTitle>
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
          </CardContent>
        </Card>
      )}

      {/* Monthly Accounting Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthlyData.map((monthData) => (
          <Card key={monthData.month} className="flex flex-col">
            <CardHeader>
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
                    <div key={idx} className="flex justify-between">
                      <span className="truncate">{expense.description || expense.type}</span>
                      <span>₹{expense.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {monthData.expenses.length > 3 && (
                    <div className="text-gray-500 text-xs">
                      +{monthData.expenses.length - 3} more expenses
                    </div>
                  )}
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
                    <span className="font-medium">Partner Share (50%)</span>
                    <span className="font-bold text-purple-600">
                      ₹{monthData.partnerShare.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Owner's Full Share (only for company-owned taxis) */}
                {monthData.ownerFullShare > 0 && (
                  <div className="flex justify-between text-sm border-t pt-1">
                    <span className="font-medium">Owner's Share (100%)</span>
                    <span className="font-bold text-green-600">
                      ₹{monthData.ownerFullShare.toLocaleString()}
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
                    {monthData.gstPaid ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGstPayment(monthData)}
                        disabled={monthData.gstAmount <= 0}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay GST
                      </Button>
                    )}
                  </div>

                  {/* Service Charge Collection - Only for partner taxis */}
                  {vehicle?.ownershipType === 'partner' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Service Charge</span>
                      {monthData.serviceChargeCollected ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Collected
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleServiceChargeCollection(monthData)}
                          disabled={monthData.serviceCharge <= 0}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Collect
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Partner Payment - Only for partner taxis */}
                  {vehicle?.ownershipType === 'partner' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Partner Payment</span>
                      {monthData.partnerPaid ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePartnerPayment(monthData)}
                          disabled={monthData.partnerShare <= 0}
                        >
                          <Banknote className="h-3 w-3 mr-1" />
                          Pay Partner
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Owner's Share Collection - Only for partner taxis */}
                  {vehicle?.ownershipType === 'partner' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Collect Owner's Share</span>
                      {monthData.ownerShareCollected ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Collected
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOwnerShareCollection(monthData)}
                          disabled={monthData.ownerShare <= 0}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Collect Share
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
    </div>
  );
};

export default AccountsTab;