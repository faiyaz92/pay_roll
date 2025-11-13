import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import {
  DollarSign,
  Calculator,
  Calendar,
  Receipt,
  BarChart3,
  History} from 'lucide-react';

// Import tab components (we'll create these)
import FinancialOverviewTab from '@/components/Financial/FinancialOverviewTab';
import FinancialAnalyticsTab from '@/components/Financial/FinancialAnalyticsTab';
import FinancialExpensesTab from '@/components/Financial/FinancialExpensesTab';
import FinancialPaymentsTab from '@/components/Financial/FinancialPaymentsTab';
import FinancialAccountsTab from '@/components/Financial/FinancialAccountsTab';

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

const FinancialPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userInfo } = useAuth();
  const { vehicles, expenses, payments, getVehicleFinancialData } = useFirebaseData();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [filterType, setFilterType] = useState<'yearly' | 'quarterly' | 'monthly'>('monthly');
  const [partnerFilter, setPartnerFilter] = useState('all'); // 'all' | 'partner' | 'company'
  const [selectedPartner, setSelectedPartner] = useState<string>(''); // Selected partner ID when partnerFilter is 'partner'
  const [partners, setPartners] = useState<any[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [accountingTransactions, setAccountingTransactions] = useState<AccountingTransaction[]>([]);
  const [companyCashInHand, setCompanyCashInHand] = useState(0);

  // Load accounting transactions for all vehicles
  useEffect(() => {
    if (!userInfo?.companyId) return;

    const transactionsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
    const q = query(transactionsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccountingTransaction[];
      setAccountingTransactions(transactions);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  // Calculate company-wide cash in hand
  useEffect(() => {
    if (!userInfo?.companyId) return;

    let totalCash = 0;
    const cashPromises = vehicles.map(vehicle => {
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, vehicle.id);
      return new Promise<number>((resolve) => {
        const unsubscribe = onSnapshot(cashRef, (doc) => {
          const balance = doc.exists() ? doc.data().balance || 0 : 0;
          resolve(balance);
        });
        // Clean up listener after first read
        setTimeout(() => unsubscribe(), 1000);
      });
    });

    Promise.all(cashPromises).then(balances => {
      setCompanyCashInHand(balances.reduce((sum, balance) => sum + balance, 0));
    });
  }, [userInfo?.companyId, vehicles]);

  // Fetch partners for partner selection dropdown
  useEffect(() => {
    const fetchPartners = async () => {
      setLoadingPartners(true);
      try {
        if (!userInfo?.companyId) return;

        const partnersRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/users`);
        const q = query(partnersRef, where('role', '==', 'partner'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const partnersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPartners(partnersData);
          setLoadingPartners(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching partners:', error);
        setLoadingPartners(false);
      }
    };

    fetchPartners();
  }, [userInfo?.companyId]);

  // Calculate company financial data
  const companyFinancialData = useMemo(() => {
    const year = parseInt(selectedYear);
    let monthStart: Date;
    let monthEnd: Date;
    let periodLabel: string;

    if (filterType === 'yearly') {
      monthStart = new Date(year, 0, 1); // January 1st
      monthEnd = new Date(year, 11, 31, 23, 59, 59); // December 31st
      periodLabel = `${year} (Yearly)`;
    } else if (filterType === 'quarterly') {
      const quarterMonths = {
        'Q1': [0, 2], // Jan-Mar
        'Q2': [3, 5], // Apr-Jun
        'Q3': [6, 8], // Jul-Sep
        'Q4': [9, 11] // Oct-Dec
      };
      const [startMonth, endMonth] = quarterMonths[selectedQuarter as keyof typeof quarterMonths];
      monthStart = new Date(year, startMonth, 1);
      monthEnd = new Date(year, endMonth + 1, 0, 23, 59, 59);
      periodLabel = `${selectedQuarter} ${year} (Quarterly)`;
    } else { // monthly
      const month = parseInt(selectedMonth) - 1;
      monthStart = new Date(year, month, 1);
      monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
      periodLabel = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year} (Monthly)`;
    }

    // Aggregate data across all vehicles
    let totalEarnings = 0;
    let totalExpenses = 0;
    let totalVehicles = vehicles.length;
    let activeVehicles = 0;

    const vehicleData = vehicles.map(vehicle => {
      const financialData = getVehicleFinancialData(vehicle.id);

      // Filter payments and expenses for this month
      const monthPayments = payments.filter(p =>
        p.vehicleId === vehicle.id &&
        p.status === 'paid' &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
      );

      const monthExpenses = expenses.filter(e =>
        e.vehicleId === vehicle.id &&
        e.status === 'approved' &&
        new Date(e.createdAt) >= monthStart &&
        new Date(e.createdAt) <= monthEnd
      );

      const vehicleEarnings = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const vehicleExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const vehicleProfit = vehicleEarnings - vehicleExpenses;

      // GST calculation (4% - only if profit is positive)
      const gstAmount = vehicleProfit > 0 ? vehicleProfit * 0.04 : 0;

      // Service charge (10% for partner taxis - only if profit is positive)
      const isPartnerTaxi = vehicle.ownershipType === 'partner';
      const serviceChargeRate = vehicle.serviceChargeRate || 0.10; // Default 10%
      const serviceCharge = isPartnerTaxi && vehicleProfit > 0 ? vehicleProfit * serviceChargeRate : 0;

      // Partner share (configurable percentage after GST and service charge - only if remaining profit is positive)
      const partnerSharePercentage = vehicle.partnerShare || 0.50; // Default 50%
      const remainingProfitAfterDeductions = vehicleProfit - gstAmount - serviceCharge;
      const partnerShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
        remainingProfitAfterDeductions * partnerSharePercentage : 0;

      // Owner's share (remaining after partner share - only if remaining profit is positive)
      const ownerShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
        remainingProfitAfterDeductions * (1 - partnerSharePercentage) : 0;

      // Owner's full share for company-owned taxis (profit after GST - no service charge or partner share)
      const ownerFullShare = !isPartnerTaxi && (vehicleProfit - gstAmount) > 0 ? vehicleProfit - gstAmount : 0;

      // Count active vehicles
      if (financialData?.isCurrentlyRented) {
        activeVehicles++;
      }

      // Accumulate totals
      totalEarnings += vehicleEarnings;
      totalExpenses += vehicleExpenses;

      return {
        vehicle,
        financialData,
        earnings: vehicleEarnings,
        expenses: vehicleExpenses,
        profit: vehicleProfit,
        gstAmount,
        serviceCharge,
        partnerShare,
        ownerShare,
        ownerFullShare
      };
    });

    const totalProfit = totalEarnings - totalExpenses;

    return {
      selectedYear,
      selectedMonth,
      selectedQuarter,
      filterType,
      partnerFilter,
      selectedPartner,
      periodLabel,
      monthName: new Date(year, parseInt(selectedMonth) - 1).toLocaleString('default', { month: 'long' }),
      totalEarnings,
      totalExpenses,
      totalProfit,
      totalVehicles,
      activeVehicles,
      vehicleData,
      payments, // Add payments data
      expenses  // Add expenses data
    };
  }, [selectedYear, selectedMonth, selectedQuarter, filterType, partnerFilter, selectedPartner, vehicles, payments, expenses, accountingTransactions, getVehicleFinancialData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Financial Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive financial overview and accounting for all vehicles
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{companyCashInHand.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Company Cash in Hand</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Financial Period & Filters
          </CardTitle>
          <CardDescription>
            Select filter type and period for financial analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* All Filters in One Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Filter Type Selection */}
              <div>
                <label className="text-sm font-medium">Filter Type</label>
                <Select value={filterType} onValueChange={(value: 'yearly' | 'quarterly' | 'monthly') => setFilterType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Selection - Always shown */}
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

              {/* Month/Quarter Selection - Only for Monthly and Quarterly */}
              <div>
                <label className="text-sm font-medium">
                  {filterType === 'monthly' ? 'Month' : filterType === 'quarterly' ? 'Quarter' : 'Period'}
                </label>
                {filterType === 'monthly' ? (
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : filterType === 'quarterly' ? (
                  <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                      <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                      <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                      <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="N/A for Yearly" />
                    </SelectTrigger>
                  </Select>
                )}
              </div>

              {/* Vehicle Type Filter */}
              <div>
                <label className="text-sm font-medium">Vehicle Type</label>
                <Select value={partnerFilter} onValueChange={(value) => {
                  setPartnerFilter(value);
                  // Reset selected partner when changing filter type
                  if (value !== 'partner') {
                    setSelectedPartner('');
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    <SelectItem value="partner">Partner Vehicles</SelectItem>
                    <SelectItem value="company">Company Vehicles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Partner Selection - Only shown when partnerFilter is 'partner' */}
              <div>
                <label className="text-sm font-medium">
                  {partnerFilter === 'partner' ? 'Select Partner' : 'Partner'}
                </label>
                {partnerFilter === 'partner' ? (
                  <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a partner" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingPartners ? (
                        <SelectItem value="loading" disabled>
                          Loading partners...
                        </SelectItem>
                      ) : partners.length === 0 ? (
                        <SelectItem value="no-partners" disabled>
                          No partners available
                        </SelectItem>
                      ) : (
                        partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name} - {partner.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="N/A" />
                    </SelectTrigger>
                  </Select>
                )}
              </div>
            </div>

            {/* Current Period Display */}
            <div className="pt-2 border-t">
              <div className="text-sm text-gray-600">
                Current Period: <span className="font-medium text-gray-900">{companyFinancialData.periodLabel}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinancialOverviewTab companyFinancialData={companyFinancialData} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialAnalyticsTab companyFinancialData={companyFinancialData} />
        </TabsContent>

        <TabsContent value="expenses">
          <FinancialExpensesTab
            companyFinancialData={companyFinancialData}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        </TabsContent>

        <TabsContent value="payments">
          <FinancialPaymentsTab
            companyFinancialData={companyFinancialData}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        </TabsContent>

        <TabsContent value="accounts">
          <FinancialAccountsTab
            companyFinancialData={companyFinancialData}
            accountingTransactions={accountingTransactions}
            setAccountingTransactions={setAccountingTransactions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialPage;