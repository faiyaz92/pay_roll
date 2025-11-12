import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Users,
  Truck,
  DollarSign,
  TrendingUp,
  Calendar,
  Receipt,
  Banknote,
  PieChart,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  Mail
} from 'lucide-react';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { Role, UserInfo } from '@/types/user';
import { toast } from '@/hooks/use-toast';

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

const PartnerDetails: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const { vehicles, assignments, payments, expenses } = useFirebaseData();

  const [partner, setPartner] = useState<UserInfo | null>(null);
  const [accountingTransactions, setAccountingTransactions] = useState<AccountingTransaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedQuarter, setSelectedQuarter] = useState('1');
  const [loading, setLoading] = useState(true);

  // Load partner data
  useEffect(() => {
    if (!partnerId || !userInfo?.companyId) return;

    const partnerRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/users`);
    const q = query(partnerRef, where('role', '==', Role.PARTNER));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const partnersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        userId: doc.id
      })) as UserInfo[];

      const foundPartner = partnersData.find(p => p.userId === partnerId);
      setPartner(foundPartner || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId, userInfo?.companyId]);

  // Load accounting transactions
  useEffect(() => {
    if (!userInfo?.companyId) return;

    const transactionsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
    const unsubscribe = onSnapshot(transactionsRef, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as AccountingTransaction[];
      setAccountingTransactions(transactions);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  // Get partner's vehicles
  const partnerVehicles = useMemo(() => {
    if (!partner) return [];
    return vehicles.filter(vehicle => vehicle.partnerId === partner.userId);
  }, [partner, vehicles]);

  // Calculate partner financials
  const partnerFinancials = useMemo(() => {
    if (!partner || partnerVehicles.length === 0) {
      return {
        totalInvestment: 0,
        totalEarnings: 0,
        totalPaid: 0,
        currentPayable: 0,
        vehiclesCount: 0,
        lastSettlement: null,
        settlementHistory: []
      };
    }

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate period dates
    let periodStart: Date;
    let periodEnd: Date;
    let periodKey: string;

    if (selectedPeriod === 'month') {
      periodStart = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
      periodEnd = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0);
      periodKey = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
    } else if (selectedPeriod === 'quarter') {
      const quarterStartMonth = (parseInt(selectedQuarter) - 1) * 3;
      periodStart = new Date(parseInt(selectedYear), quarterStartMonth, 1);
      periodEnd = new Date(parseInt(selectedYear), quarterStartMonth + 3, 0);
      periodKey = `${selectedYear}-Q${selectedQuarter}`;
    } else {
      periodStart = new Date(parseInt(selectedYear), 0, 1);
      periodEnd = new Date(parseInt(selectedYear), 11, 31);
      periodKey = selectedYear;
    }

    // Calculate financials for each vehicle
    const vehicleFinancials = partnerVehicles.map(vehicle => {
      const vehiclePayments = payments.filter(p =>
        p.vehicleId === vehicle.id &&
        p.status === 'paid' &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) >= periodStart &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) <= periodEnd
      );

      const vehicleExpenses = expenses.filter(e =>
        e.vehicleId === vehicle.id &&
        e.status === 'approved' &&
        new Date(e.createdAt) >= periodStart &&
        new Date(e.createdAt) <= periodEnd
      );

      const earnings = vehiclePayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = earnings - totalExpenses;

      // Calculate deductions
      const gst = profit > 0 ? profit * 0.04 : 0;
      const serviceCharge = vehicle.serviceChargeRate ? profit * (vehicle.serviceChargeRate / 100) : 0;
      const remainingProfit = profit - gst - serviceCharge;
      const partnerShare = remainingProfit * ((vehicle.partnershipPercentage || 0) / 100);

      return {
        vehicle,
        earnings,
        expenses: totalExpenses,
        profit,
        gst,
        serviceCharge,
        partnerShare,
        investment: (vehicle.initialInvestment || vehicle.initialCost || 0) * ((vehicle.partnershipPercentage || 0) / 100),
        totalVehicleInvestment: (vehicle.initialInvestment || vehicle.initialCost || 0)
      };
    });

    // Aggregate totals
    const totalInvestment = vehicleFinancials.reduce((sum, v) => sum + v.investment, 0);
    const totalVehicleInvestment = vehicleFinancials.reduce((sum, v) => sum + v.totalVehicleInvestment, 0);
    const totalEarnings = vehicleFinancials.reduce((sum, v) => sum + v.earnings, 0);
    const totalExpenses = vehicleFinancials.reduce((sum, v) => sum + v.expenses, 0);
    const totalProfit = vehicleFinancials.reduce((sum, v) => sum + v.profit, 0);
    const totalGst = vehicleFinancials.reduce((sum, v) => sum + v.gst, 0);
    const totalServiceCharge = vehicleFinancials.reduce((sum, v) => sum + v.serviceCharge, 0);
    const currentPayable = vehicleFinancials.reduce((sum, v) => sum + v.partnerShare, 0);

    // Get payment history for this partner
    const partnerPayments = accountingTransactions.filter(t =>
      t.type === 'partner_payment' &&
      partnerVehicles.some(v => v.id === t.vehicleId) &&
      t.status === 'completed'
    ).sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

    const totalPaid = partnerPayments.reduce((sum, p) => sum + p.amount, 0);
    const lastSettlement = partnerPayments.length > 0 ? partnerPayments[0] : null;

    return {
      totalInvestment,
      totalVehicleInvestment,
      totalEarnings,
      totalExpenses,
      totalProfit,
      totalGst,
      totalServiceCharge,
      currentPayable,
      totalPaid,
      outstanding: currentPayable - totalPaid,
      vehiclesCount: partnerVehicles.length,
      vehicleFinancials,
      lastSettlement,
      settlementHistory: partnerPayments.slice(0, 10), // Last 10 settlements
      periodKey
    };
  }, [partner, partnerVehicles, payments, expenses, accountingTransactions, selectedPeriod, selectedYear, selectedMonth, selectedQuarter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading partner details...</div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Partner not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/partners')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Partners
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            {partner.name}
          </h1>
          <p className="text-gray-600 mt-1">Partner financial overview and settlement details</p>
        </div>
      </div>

      {/* Partner Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Partner Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{partner.mobileNumber || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{partner.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{partner.address || 'No address'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{partnerFinancials.vehiclesCount} vehicles</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partner Investment Summary */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Banknote className="w-6 h-6" />
            Partner Investment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {formatCurrency(partnerFinancials.totalVehicleInvestment)}
              </div>
              <div className="text-sm font-medium text-gray-600">Total Investment</div>
              <div className="text-xs text-gray-500 mt-1">Total vehicle investments</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatCurrency(partnerFinancials.totalInvestment)}
              </div>
              <div className="text-sm font-medium text-gray-600">Partner's Investment</div>
              <div className="text-xs text-gray-500 mt-1">Partner's share of total vehicle investments</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(partnerFinancials.totalPaid)}
              </div>
              <div className="text-sm font-medium text-gray-600">Total Returned</div>
              <div className="text-xs text-gray-500 mt-1">Amount received through settlements</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className={`text-3xl font-bold mb-2 ${partnerFinancials.totalPaid - partnerFinancials.totalInvestment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(partnerFinancials.totalPaid - partnerFinancials.totalInvestment)}
              </div>
              <div className="text-sm font-medium text-gray-600">Net Position</div>
              <div className="text-xs text-gray-500 mt-1">
                {partnerFinancials.totalPaid - partnerFinancials.totalInvestment >= 0 ? 'Profit' : 'Outstanding'}
              </div>
            </div>
          </div>

          {/* Investment Details */}
          <div className="mt-6 pt-4 border-t border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">Investment Breakdown by Vehicle</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partnerFinancials.vehicleFinancials?.map((vehicleData: any) => (
                <div key={vehicleData.vehicle.id} className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm text-gray-800 mb-1">
                    {vehicleData.vehicle.make} {vehicleData.vehicle.model}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {vehicleData.vehicle.registrationNumber}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(vehicleData.totalVehicleInvestment)}
                      </div>
                      <div className="text-xs text-gray-500">Total Investment</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(vehicleData.investment)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Partner's {vehicleData.vehicle.partnershipPercentage}% share
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Financial Period
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      return (
                        <SelectItem key={month} value={month.toString()}>
                          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      );
                    })}
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
                    <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                    <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                    <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                    <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Period Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(partnerFinancials.totalEarnings)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Payable</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(partnerFinancials.currentPayable)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
                <p className={`text-2xl font-bold ${partnerFinancials.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(partnerFinancials.outstanding)}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle-wise Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Vehicle-wise Financial Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {partnerFinancials.vehicleFinancials?.map((vehicleData: any) => (
              <Card key={vehicleData.vehicle.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{vehicleData.vehicle.registrationNumber}</h4>
                      <p className="text-sm text-gray-600">{vehicleData.vehicle.make} {vehicleData.vehicle.model}</p>
                      <Badge variant="outline" className="mt-1">
                        {vehicleData.vehicle.partnershipPercentage}% Partnership
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Partner Investment</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(vehicleData.investment)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Earnings:</span>
                      <div className="font-semibold text-green-600">{formatCurrency(vehicleData.earnings)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Expenses:</span>
                      <div className="font-semibold text-red-600">{formatCurrency(vehicleData.expenses)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Profit:</span>
                      <div className={`font-semibold ${vehicleData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(vehicleData.profit)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Partner Share:</span>
                      <div className="font-semibold text-purple-600">{formatCurrency(vehicleData.partnerShare)}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>GST Deducted: {formatCurrency(vehicleData.gst)}</div>
                    <div>Service Charge: {formatCurrency(vehicleData.serviceCharge)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settlement History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Settlement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partnerFinancials.lastSettlement && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Last Settlement</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <div className="font-semibold">{formatCurrency(partnerFinancials.lastSettlement.amount)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <div className="font-semibold">
                    {new Date(partnerFinancials.lastSettlement.completedAt || partnerFinancials.lastSettlement.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Period:</span>
                  <div className="font-semibold">{partnerFinancials.lastSettlement.month}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold">Recent Settlements</h4>
            {partnerFinancials.settlementHistory.length > 0 ? (
              partnerFinancials.settlementHistory.map((settlement: AccountingTransaction) => (
                <div key={settlement.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                  <div>
                    <div className="font-semibold">{formatCurrency(settlement.amount)}</div>
                    <div className="text-sm text-gray-600">
                      {settlement.month} • {settlement.vehicleId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(settlement.completedAt || settlement.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(settlement.completedAt || settlement.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No settlement history found</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(partnerFinancials.totalPaid)}</p>
                <p className="text-sm text-gray-600">Total Paid to Date</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${partnerFinancials.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(partnerFinancials.outstanding))}
                </p>
                <p className="text-sm text-gray-600">
                  {partnerFinancials.outstanding > 0 ? 'Outstanding' : 'Overpaid'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerDetails;