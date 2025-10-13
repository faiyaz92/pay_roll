import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, DollarSign } from 'lucide-react';
import InvestmentReturnsCard from './InvestmentReturnsCard';
import TotalReturnsBreakdownCard from './TotalReturnsBreakdownCard';
import TotalExpensesBreakdownCard from './TotalExpensesBreakdownCard';

interface AnalyticsTabProps {
  vehicle: any;
  financialData: any;
  expenseData: any;
  firebasePayments: any[];
  vehicleId: string;
  getTotalInvestment: () => number;
  projectionYear: number;
  setProjectionYear: (year: number) => void;
  projectionMode: 'current' | 'assumed';
  setProjectionMode: (mode: 'current' | 'assumed') => void;
  assumedMonthlyRent: string;
  setAssumedMonthlyRent: (rent: string) => void;
  increasedEMI: string;
  setIncreasedEMI: (emi: string) => void;
  netCashFlowMode: boolean;
  setNetCashFlowMode: (mode: boolean) => void;
  calculateProjection: (years: number, assumedMonthlyRent?: number, increasedEMIAmount?: number, netCashFlowMode?: boolean) => any;
  vehicleExpenses?: any[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  vehicle,
  financialData,
  expenseData,
  firebasePayments,
  vehicleId,
  getTotalInvestment,
  projectionYear,
  setProjectionYear,
  projectionMode,
  setProjectionMode,
  assumedMonthlyRent,
  setAssumedMonthlyRent,
  increasedEMI,
  setIncreasedEMI,
  netCashFlowMode,
  setNetCashFlowMode,
  calculateProjection,
  vehicleExpenses = []
}) => {
  // Add time period state with more granular options
  const [timePeriod, setTimePeriod] = React.useState<'yearly' | 'quarterly' | 'monthly'>('yearly');
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = React.useState<number>(1);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth());

  // Prepare chart data
  const earningsVsExpensesData = React.useMemo(() => {
    let startDate: Date;
    let endDate: Date;
    let dataPoints: any[] = [];

    // Set date range based on selected period
    switch (timePeriod) {
      case 'yearly':
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
        // Monthly data for selected year
        for (let month = 0; month < 12; month++) {
          const monthStart = new Date(selectedYear, month, 1);
          const monthEnd = new Date(selectedYear, month + 1, 0, 23, 59, 59);

          const monthPayments = firebasePayments.filter(p =>
            p.vehicleId === vehicleId &&
            p.status === 'paid' &&
            new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
            new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
          );

          const monthEarnings = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);

          // Calculate actual expenses for this month from expense records
          const monthExpenses = vehicleExpenses.filter(e => {
            const expenseDate = new Date(e.date || e.createdAt);
            return expenseDate >= monthStart && expenseDate <= monthEnd;
          }).reduce((sum, e) => sum + e.amount, 0);

          dataPoints.push({
            period: new Date(selectedYear, month).toLocaleString('default', { month: 'short' }),
            earnings: monthEarnings,
            expenses: monthExpenses,
            profit: monthEarnings - monthExpenses
          });
        }
        break;

      case 'quarterly':
        // Quarterly data for selected year and quarter
        const quarterStartMonth = (selectedQuarter - 1) * 3;
        startDate = new Date(selectedYear, quarterStartMonth, 1);
        endDate = new Date(selectedYear, quarterStartMonth + 3, 0, 23, 59, 59);

        // Monthly data for the selected quarter
        for (let month = quarterStartMonth; month < quarterStartMonth + 3; month++) {
          const monthStart = new Date(selectedYear, month, 1);
          const monthEnd = new Date(selectedYear, month + 1, 0, 23, 59, 59);

          const monthPayments = firebasePayments.filter(p =>
            p.vehicleId === vehicleId &&
            p.status === 'paid' &&
            new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
            new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
          );

          const monthEarnings = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);

          // Calculate actual expenses for this month from expense records
          const monthExpenses = vehicleExpenses.filter(e => {
            const expenseDate = new Date(e.date || e.createdAt);
            return expenseDate >= monthStart && expenseDate <= monthEnd;
          }).reduce((sum, e) => sum + e.amount, 0);

          dataPoints.push({
            period: new Date(selectedYear, month).toLocaleString('default', { month: 'short' }),
            earnings: monthEarnings,
            expenses: monthExpenses,
            profit: monthEarnings - monthExpenses
          });
        }
        break;

      case 'monthly':
        // Single month data for selected year and month
        startDate = new Date(selectedYear, selectedMonth, 1);
        endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

        // Daily data for the selected month (simplified to weekly for readability)
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const weeksInMonth = Math.ceil(daysInMonth / 7);

        for (let week = 0; week < weeksInMonth; week++) {
          const weekStart = new Date(selectedYear, selectedMonth, week * 7 + 1);
          const weekEnd = new Date(selectedYear, selectedMonth, Math.min((week + 1) * 7, daysInMonth), 23, 59, 59);

          const weekPayments = firebasePayments.filter(p =>
            p.vehicleId === vehicleId &&
            p.status === 'paid' &&
            new Date(p.paidAt || p.collectionDate || p.createdAt) >= weekStart &&
            new Date(p.paidAt || p.collectionDate || p.createdAt) <= weekEnd
          );

          const weekEarnings = weekPayments.reduce((sum, p) => sum + p.amountPaid, 0);

          // Calculate actual expenses for this week from expense records
          const weekExpenses = vehicleExpenses.filter(e => {
            const expenseDate = new Date(e.date || e.createdAt);
            return expenseDate >= weekStart && expenseDate <= weekEnd;
          }).reduce((sum, e) => sum + e.amount, 0);

          dataPoints.push({
            period: `Week ${week + 1}`,
            earnings: weekEarnings,
            expenses: weekExpenses,
            profit: weekEarnings - weekExpenses
          });
        }
        break;
    }

    return dataPoints;
  }, [firebasePayments, expenseData, vehicleId, timePeriod, selectedYear, selectedQuarter, selectedMonth, vehicleExpenses]);

  // Expense breakdown pie chart data - Now filtered by selected time period
  const expenseBreakdownData = React.useMemo(() => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0000', '#8b5cf6', '#ff69b4', '#32cd32', '#daa520'];

    // Filter expenses based on selected time period
    let filteredExpenses = vehicleExpenses;

    if (timePeriod !== 'yearly') {
      let startDate: Date;
      let endDate: Date;

      if (timePeriod === 'quarterly') {
        const quarterStartMonth = (selectedQuarter - 1) * 3;
        startDate = new Date(selectedYear, quarterStartMonth, 1);
        endDate = new Date(selectedYear, quarterStartMonth + 3, 0, 23, 59, 59);
      } else { // monthly
        startDate = new Date(selectedYear, selectedMonth, 1);
        endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      }

      filteredExpenses = vehicleExpenses.filter(expense => {
        const expenseDate = new Date(expense.date || expense.createdAt);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    } else {
      // For yearly, filter by selected year
      filteredExpenses = vehicleExpenses.filter(expense => {
        const expenseDate = new Date(expense.date || expense.createdAt);
        return expenseDate.getFullYear() === selectedYear;
      });
    }

    // Calculate expenses by type from filtered expense records
    const categoryTotals: { [key: string]: number } = {};

    filteredExpenses.forEach(expense => {
      // Use the same categorization logic as expenseData calculation
      let category = 'general'; // default

      if ((expense.expenseType === 'fuel') ||
          expense.description.toLowerCase().includes('fuel') ||
          expense.description.toLowerCase().includes('petrol') ||
          expense.description.toLowerCase().includes('diesel')) {
        category = 'fuel';
      } else if ((expense.expenseType === 'maintenance') ||
                 (expense.type === 'maintenance') ||
                 (expense.expenseType as string) === 'repair' ||
                 (expense.expenseType as string) === 'service' ||
                 expense.description.toLowerCase().includes('maintenance') ||
                 expense.description.toLowerCase().includes('repair') ||
                 expense.description.toLowerCase().includes('service')) {
        category = 'maintenance';
      } else if ((expense.expenseType === 'insurance') ||
                 (expense.type === 'insurance') ||
                 expense.description.toLowerCase().includes('insurance')) {
        category = 'insurance';
      } else if ((expense.expenseType === 'penalties') ||
                 (expense.type === 'penalties') ||
                 (expense.expenseType as string) === 'penalty' ||
                 (expense.expenseType as string) === 'fine' ||
                 expense.description.toLowerCase().includes('penalty') ||
                 expense.description.toLowerCase().includes('fine') ||
                 expense.description.toLowerCase().includes('late fee')) {
        category = 'penalties';
      } else if ((expense.paymentType === 'emi') ||
                 (expense.type === 'emi') ||
                 expense.description.toLowerCase().includes('emi') ||
                 expense.description.toLowerCase().includes('installment')) {
        category = 'emi';
      } else if ((expense.paymentType === 'prepayment') ||
                 (expense.type === 'prepayment') ||
                 expense.description.toLowerCase().includes('prepayment') ||
                 expense.description.toLowerCase().includes('principal')) {
        category = 'prepayment';
      } else if (expense.expenseType) {
        category = expense.expenseType;
      } else if (expense.type) {
        category = expense.type;
      }

      // Skip only payment status types, not expense types
      if (category === 'paid' || category === 'due' || category === 'overdue') return;

      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });

    // Convert to array format for pie chart
    const breakdown = Object.entries(categoryTotals)
      .map(([name, value], index) => {
        // Format names nicely
        let displayName = name.charAt(0).toUpperCase() + name.slice(1);
        if (name === 'emi') displayName = 'EMI';
        if (name === 'prepayment') displayName = 'Prepayment';
        if (name === 'penalties') displayName = 'Penalties';

        return {
          name: displayName,
          value,
          color: colors[index % colors.length]
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value); // Sort by value descending

    return breakdown;
  }, [vehicleExpenses, timePeriod, selectedYear, selectedQuarter, selectedMonth]);

  // 5-year projection with partner earnings - Now dependent on projection settings
  const partnerProjectionData = React.useMemo(() => {
    const projectionData = [];
    const isPartnerTaxi = vehicle?.ownershipType === 'partner';
    const partnerSharePercentage = vehicle?.partnerShare || 0.50;
    const serviceChargeRate = vehicle?.serviceChargeRate || 0.10;

    // Use current projection settings
    const assumedRent = projectionMode === 'assumed' && assumedMonthlyRent ?
      parseFloat(assumedMonthlyRent) : undefined;
    const increasedEMIAmt = increasedEMI ? parseFloat(increasedEMI) : undefined;

    for (let year = 1; year <= projectionYear; year++) {
      const projection = calculateProjection(year, assumedRent, increasedEMIAmt, netCashFlowMode);
      const monthlyEarnings = projection.monthlyEarnings;
      const monthlyOperatingExpenses = projection.monthlyOperatingExpenses;
      const monthlyProfit = monthlyEarnings - monthlyOperatingExpenses;

      // GST calculation (4%)
      const gstAmount = monthlyProfit > 0 ? monthlyProfit * 0.04 : 0;

      // Service charge (10% for partner taxis)
      const serviceCharge = isPartnerTaxi && monthlyProfit > 0 ? monthlyProfit * serviceChargeRate : 0;

      // Partner share calculation
      const remainingProfitAfterDeductions = monthlyProfit - gstAmount - serviceCharge;
      const partnerMonthlyShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
        remainingProfitAfterDeductions * partnerSharePercentage : 0;

      // Owner's share
      const ownerMonthlyShare = isPartnerTaxi && remainingProfitAfterDeductions > 0 ?
        remainingProfitAfterDeductions * (1 - partnerSharePercentage) : (monthlyProfit - gstAmount);

      projectionData.push({
        year: `Year ${year}`,
        totalEarnings: projection.projectedEarnings,
        totalExpenses: projection.projectedTotalExpenses || projection.projectedOperatingExpenses,
        totalProfit: projection.projectedEarnings - (projection.projectedTotalExpenses || projection.projectedOperatingExpenses),
        partnerEarnings: partnerMonthlyShare * 12 * year,
        ownerEarnings: ownerMonthlyShare * 12 * year,
        monthlyPartnerShare: partnerMonthlyShare,
        monthlyOwnerShare: ownerMonthlyShare
      });
    }

    return projectionData;
  }, [calculateProjection, vehicle, projectionYear, projectionMode, assumedMonthlyRent, increasedEMI, netCashFlowMode]);

  // Gross margin utilization data - Now filtered by selected time period
  const grossMarginData = React.useMemo(() => {
    let filteredEarnings = 0;
    let filteredExpenses = 0;

    // Calculate earnings and expenses based on selected time period
    if (timePeriod === 'yearly') {
      // For yearly, sum all payments and expenses for the selected year
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);

      filteredEarnings = firebasePayments
        .filter(p =>
          p.vehicleId === vehicleId &&
          p.status === 'paid' &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) >= yearStart &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) <= yearEnd
        )
        .reduce((sum, p) => sum + p.amountPaid, 0);

      filteredExpenses = vehicleExpenses
        .filter(e => {
          const expenseDate = new Date(e.date || e.createdAt);
          return expenseDate >= yearStart && expenseDate <= yearEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);

    } else if (timePeriod === 'quarterly') {
      // For quarterly, sum payments and expenses for the selected quarter
      const quarterStartMonth = (selectedQuarter - 1) * 3;
      const quarterStart = new Date(selectedYear, quarterStartMonth, 1);
      const quarterEnd = new Date(selectedYear, quarterStartMonth + 3, 0, 23, 59, 59);

      filteredEarnings = firebasePayments
        .filter(p =>
          p.vehicleId === vehicleId &&
          p.status === 'paid' &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) >= quarterStart &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) <= quarterEnd
        )
        .reduce((sum, p) => sum + p.amountPaid, 0);

      filteredExpenses = vehicleExpenses
        .filter(e => {
          const expenseDate = new Date(e.date || e.createdAt);
          return expenseDate >= quarterStart && expenseDate <= quarterEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);

    } else { // monthly
      // For monthly, sum payments and expenses for the selected month
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      filteredEarnings = firebasePayments
        .filter(p =>
          p.vehicleId === vehicleId &&
          p.status === 'paid' &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
          new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
        )
        .reduce((sum, p) => sum + p.amountPaid, 0);

      filteredExpenses = vehicleExpenses
        .filter(e => {
          const expenseDate = new Date(e.date || e.createdAt);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);
    }

    const grossProfit = filteredEarnings - filteredExpenses;

    return [
      { name: 'Earnings', value: filteredEarnings, color: '#22c55e' },
      { name: 'Expenses', value: filteredExpenses, color: '#ef4444' },
      { name: 'Gross Profit', value: grossProfit, color: '#3b82f6' }
    ].filter(item => item.value > 0);
  }, [firebasePayments, vehicleExpenses, vehicleId, timePeriod, selectedYear, selectedQuarter, selectedMonth]);
  return (
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings vs Expenses Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Earnings vs Expenses ({timePeriod === 'yearly' ? `${selectedYear}` : timePeriod === 'quarterly' ? `Q${selectedQuarter} ${selectedYear}` : `${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })} ${selectedYear}`})
                </CardTitle>
              </div>
              <div className="flex items-center justify-between">
                <CardDescription>
                  {timePeriod === 'yearly' ? `Monthly comparison for ${selectedYear}` :
                   timePeriod === 'quarterly' ? `Monthly breakdown for Q${selectedQuarter} ${selectedYear}` :
                   `Weekly breakdown for ${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })} ${selectedYear}`}
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="w-32">
                  <Label htmlFor="time-period" className="text-xs text-gray-600">Time Period</Label>
                  <Select value={timePeriod} onValueChange={(value: 'yearly' | 'quarterly' | 'monthly') => setTimePeriod(value)}>
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label htmlFor="year" className="text-xs text-gray-600">Year</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
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
                {timePeriod === 'quarterly' && (
                  <div className="w-32">
                    <Label htmlFor="quarter" className="text-xs text-gray-600">Quarter</Label>
                    <Select value={selectedQuarter.toString()} onValueChange={(value) => setSelectedQuarter(parseInt(value))}>
                      <SelectTrigger className="mt-1 h-8">
                        <SelectValue placeholder="Select quarter" />
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
                {timePeriod === 'monthly' && (
                  <div className="w-28">
                    <Label htmlFor="month" className="text-xs text-gray-600">Month</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger className="mt-1 h-8">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {new Date(2024, i).toLocaleString('default', { month: 'short' })}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earningsVsExpensesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="earnings" fill="#22c55e" name="Earnings" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>Distribution of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gross Margin Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gross Margin Utilization
          </CardTitle>
          <CardDescription>Overall profitability breakdown showing earnings, expenses, and profit</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={grossMarginData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {financialData.totalEarnings > 0 ?
                (((financialData.totalEarnings - expenseData.totalExpenses) / financialData.totalEarnings) * 100).toFixed(1) : 0
              }% Gross Margin
            </div>
            <p className="text-sm text-gray-600">Profit margin from total earnings</p>
          </div>
        </CardContent>
      </Card>

      {/* Original Analytics Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Performance - Dynamic Data */}
        <InvestmentReturnsCard
          vehicle={vehicle}
          financialData={financialData}
          expenseData={expenseData}
          getTotalInvestment={getTotalInvestment}
        />

        {/* Projections - Dynamic Data */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Yearly Projections</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow min-h-0">
            <div className="space-y-3 flex-grow overflow-y-auto">
              <div className="flex justify-between">
                <span>Current Monthly Rent</span>
                <span className="font-medium">
                  ₹{Math.round(financialData.monthlyRent).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Monthly Profit</span>
                <span className={`font-medium ${financialData.avgMonthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{Math.round(financialData.avgMonthlyProfit).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Projected Yearly Profit/Loss</span>
                <span className={`font-bold ${financialData.projectedYearlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{Math.round(financialData.projectedYearlyProfit).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ROI</span>
                <span className={`font-medium ${financialData.roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialData.roiPercentage >= 0 ? '+' : ''}{financialData.roiPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Projected ROI (1 Year)</span>
                <span className={`font-medium ${financialData.projectedYearlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getTotalInvestment() > 0 ?
                    ((financialData.projectedYearlyProfit / getTotalInvestment()) * 100).toFixed(1) : 0
                  }%
                </span>
              </div>
              {financialData.isInvestmentCovered && (
                <div className="flex justify-between">
                  <span>Investment Status</span>
                  <Badge variant="default" className="bg-green-500 text-white">
                    Investment Covered
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 mt-auto">
              <div className="flex justify-between border-t pt-2 mb-2">
                <span className="font-medium">Business Status</span>
                <Badge variant={financialData.projectedYearlyProfit >= 0 ? "default" : "destructive"}>
                  {financialData.projectedYearlyProfit >= 0 ? "Profitable Projection" : "Loss Projection"}
                </Badge>
              </div>

              {!financialData.isCurrentlyRented && (
                <div className="bg-yellow-50 p-2 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    <strong>Note:</strong> Vehicle is not currently rented. Projections will be accurate once assigned to a driver.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TotalReturnsBreakdownCard
          vehicle={vehicle}
          financialData={financialData}
          firebasePayments={firebasePayments}
          vehicleId={vehicleId}
        />

        <TotalExpensesBreakdownCard
          expenseData={expenseData}
        />
      </div>

      {/* Financial Projections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Projections Card - Shows all metrics like Financial Performance */}
        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Financial Projections ({projectionYear} Year{projectionYear > 1 ? 's' : ''})</CardTitle>
                <CardDescription>
                  {projectionMode === 'current' ? 'Based on current trends' : 'Based on assumed rent amount'}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-32">
                  <Label htmlFor="projection-year" className="text-xs text-gray-600">Projection Period</Label>
                  <Select value={projectionYear.toString()} onValueChange={(value) => setProjectionYear(parseInt(value))}>
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Year</SelectItem>
                      <SelectItem value="2">2 Years</SelectItem>
                      <SelectItem value="3">3 Years</SelectItem>
                      <SelectItem value="5">5 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Label htmlFor="projection-mode" className="text-xs text-gray-600">Projection Mode</Label>
                  <Select value={projectionMode} onValueChange={(value: 'current' | 'assumed') => setProjectionMode(value)}>
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Trends</SelectItem>
                      <SelectItem value="assumed">Assumed Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {projectionMode === 'assumed' && (
              <div className="mt-3">
                <Label htmlFor="assumed-rent" className="text-sm text-gray-600">Assumed Monthly Rent (₹)</Label>
                <Input
                  id="assumed-rent"
                  type="number"
                  value={assumedMonthlyRent}
                  onChange={(e) => setAssumedMonthlyRent(e.target.value)}
                  placeholder={`Current: ₹${Math.round(financialData.monthlyRent).toLocaleString()}`}
                  className="mt-1 h-8"
                />
              </div>
            )}
            {vehicle.financingType === 'loan' && (
              <div className="mt-3">
                <Label htmlFor="increased-emi" className="text-sm text-gray-600">Increased EMI Amount (₹)</Label>
                <Input
                  id="increased-emi"
                  type="number"
                  value={increasedEMI}
                  onChange={(e) => setIncreasedEMI(e.target.value)}
                  placeholder={`Current EMI: ₹${(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}`}
                  className="mt-1 h-8"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter amount to pay extra towards EMI for faster loan clearance
                </p>
              </div>
            )}
            <div className="mt-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="net-cash-flow"
                  checked={netCashFlowMode}
                  onCheckedChange={(checked) => setNetCashFlowMode(checked as boolean)}
                />
                <Label htmlFor="net-cash-flow" className="text-sm text-gray-600">
                  Use Net Cash Flow for EMI Payment
                </Label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Automatically use monthly net cash flow (rent - expenses) to pay extra EMI
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            {(() => {
              const assumedRent = projectionMode === 'assumed' && assumedMonthlyRent ?
                parseFloat(assumedMonthlyRent) : undefined;
              const increasedEMIAmt = increasedEMI ? parseFloat(increasedEMI) : undefined;
              const projection = calculateProjection(projectionYear, assumedRent, increasedEMIAmt, netCashFlowMode);
              const fixedInvestment = getTotalInvestment();
              const projectedIsProfit = projection.projectedProfitLoss >= 0;
              const projectedGrossProfitLossPercentage = fixedInvestment > 0 ?
                (projection.projectedProfitLoss / fixedInvestment) * 100 : 0;

              return (
                <>
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between">
                      <span>Initial Investment</span>
                      <span className="font-medium">₹{(vehicle.initialInvestment || vehicle.initialCost)?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prepayment</span>
                      <span className="font-medium">₹{expenseData.prepayments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Earnings ({projectionYear} year{projectionYear > 1 ? 's' : ''})</span>
                      <span className="font-medium text-green-600">₹{projection.projectedEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projected Vehicle Value ({projectionYear} year{projectionYear > 1 ? 's' : ''})</span>
                      <span className="font-medium text-green-600">₹{projection.projectedDepreciatedCarValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Expenses ({projectionYear} year{projectionYear > 1 ? 's' : ''})</span>
                      <span className="font-medium text-red-600">₹{(projection.projectedTotalExpenses || projection.projectedOperatingExpenses).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total Investment</span>
                      <span className="font-medium">₹{fixedInvestment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projected Total Return</span>
                      <span className="font-medium text-green-600">₹{projection.projectedTotalReturn.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Projected ROI</span>
                      <span className={`font-bold ${projection.projectedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {projection.projectedROI >= 0 ? '+' : ''}{projection.projectedROI.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Projected Net Cash Flow</span>
                      <span className={`font-bold ${projection.projectedNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{projection.projectedNetCashFlow.toLocaleString()}
                      </span>
                    </div>
                    {projection.breakEvenMonths && (
                      <div className="flex justify-between">
                        <span className="font-medium">Break-even Point</span>
                        <span className="font-bold text-blue-600">
                          {projection.breakEvenMonths} months ({projection.breakEvenDate})
                        </span>
                      </div>
                    )}
                    {projection.loanClearanceMonths && (
                      <div className="flex justify-between">
                        <span className="font-medium">Loan Clearance</span>
                        <span className="font-bold text-purple-600">
                          {projection.loanClearanceMonths} months ({projection.loanClearanceDate})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-auto">
                    <span className="font-medium">Projected Profit/Loss</span>
                    <span className={`font-bold ${projectedIsProfit ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{projection.projectedProfitLoss.toLocaleString()} ({projectedGrossProfitLossPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Projection Summary */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Projection Summary & Insights</CardTitle>
            <CardDescription>
              Key insights from {projectionYear}-year projection
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {(() => {
              const assumedRent = projectionMode === 'assumed' && assumedMonthlyRent ?
                parseFloat(assumedMonthlyRent) : undefined;
              const increasedEMIAmt = increasedEMI ? parseFloat(increasedEMI) : undefined;
              const projection = calculateProjection(projectionYear, assumedRent, increasedEMIAmt, netCashFlowMode);
              const isProfitable = projection.projectedProfitLoss >= 0;
              const roiPositive = projection.projectedROI >= 0;

              return (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between">
                      <span>Investment Recovery:</span>
                      <Badge variant={isProfitable ? "default" : "destructive"}>
                        {isProfitable ? "Recovered" : "Not Recovered"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>ROI Status:</span>
                      <Badge variant={roiPositive ? "default" : "destructive"}>
                        {roiPositive ? "Positive" : "Negative"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Flow:</span>
                      <Badge variant={projection.projectedNetCashFlow >= 0 ? "default" : "destructive"}>
                        {projection.projectedNetCashFlow >= 0 ? "Positive" : "Negative"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Loan Status:</span>
                      <Badge variant={projection.futureOutstandingLoan === 0 ? "default" : "secondary"}>
                        {projection.futureOutstandingLoan === 0 ? "Cleared" : "Outstanding"}
                      </Badge>
                    </div>

                    {projection.breakEvenMonths && (
                      <div className="flex justify-between">
                        <span>Break-even Point:</span>
                        <span className="font-medium text-blue-600">
                          {projection.breakEvenMonths} months ({projection.breakEvenDate})
                        </span>
                      </div>
                    )}

                    {projection.loanClearanceMonths && (
                      <div className="flex justify-between">
                        <span>Loan Clearance:</span>
                        <span className="font-medium text-purple-600">
                          {projection.loanClearanceMonths} months ({projection.loanClearanceDate})
                        </span>
                      </div>
                    )}

                    {/* Net Cash Flow EMI Payoff Projection */}
                    {vehicle.financingType === 'loan' && financialData.outstandingLoan > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <h4 className="font-medium text-sm mb-2">Net Cash Flow EMI Payoff</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Monthly Net Cash Flow:</span>
                            <span>₹{Math.round((financialData.totalEarnings - financialData.totalExpenses) / Math.max(1, firebasePayments.filter(p => p.vehicleId === vehicleId && p.status === 'paid').length)).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Outstanding Loan:</span>
                            <span>₹{financialData.outstandingLoan.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Months to Clear Loan:</span>
                            <span className={`font-medium ${(financialData.totalEarnings - financialData.totalExpenses) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(financialData.totalEarnings - financialData.totalExpenses) > 0 ?
                                Math.ceil(financialData.outstandingLoan / ((financialData.totalEarnings - financialData.totalExpenses) / Math.max(1, firebasePayments.filter(p => p.vehicleId === vehicleId && p.status === 'paid').length))) :
                                'Never (Negative Cash Flow)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Increased EMI Projection */}
                    {vehicle.financingType === 'loan' && increasedEMI && (
                      <div className="border-t pt-3 mt-3">
                        <h4 className="font-medium text-sm mb-2">Increased EMI Impact</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Current EMI:</span>
                            <span>₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Increased EMI:</span>
                            <span>₹{parseInt(increasedEMI).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Monthly Savings:</span>
                            <span className="font-medium text-green-600">
                              ₹{(parseInt(increasedEMI) - (vehicle.loanDetails?.emiPerMonth || 0)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Loan Clear Months:</span>
                            <span className="font-medium text-blue-600">
                              {parseInt(increasedEMI) > (vehicle.loanDetails?.emiPerMonth || 0) ?
                                Math.ceil(financialData.outstandingLoan / parseInt(increasedEMI)) :
                                'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 mt-auto">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Assumptions:</strong> {projectionMode === 'current' ?
                          `Projections based on current monthly earnings (₹${financialData.monthlyRent.toLocaleString()}) and expenses (₹${financialData.monthlyExpenses.toLocaleString()})` :
                          `Projections based on assumed monthly rent (₹${assumedMonthlyRent || '0'}) and current expenses (₹${financialData.monthlyExpenses.toLocaleString()})`
                        }, with {vehicle.depreciationRate ?? 10}% annual depreciation and loan payments.
                      </p>
                    </div>

                    {/* Increased EMI Input */}
                    {vehicle.financingType === 'loan' && (
                      <div className="mt-3">
                        <Label htmlFor="increased-emi" className="text-xs text-gray-600">Test Increased EMI (₹)</Label>
                        <Input
                          id="increased-emi"
                          type="number"
                          value={increasedEMI}
                          onChange={(e) => setIncreasedEMI(e.target.value)}
                          placeholder={`Current: ₹${(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}`}
                          className="mt-1 h-8 text-xs"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          See how increasing EMI affects loan payoff timeline
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Partner Earnings Projection - Now dependent on projection settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Partner Earnings Projection ({projectionYear} Year{projectionYear > 1 ? 's' : ''})
          </CardTitle>
          <CardDescription>
            Projected earnings for owner and partner over {projectionYear} year{projectionYear > 1 ? 's' : ''} based on {vehicle?.partnerShare ? (vehicle.partnerShare * 100) : 50}% profit sharing
            {vehicle?.ownershipType === 'partner' && (
              <span className="block mt-1 text-blue-600 font-medium">
                Partner will earn ₹{(partnerProjectionData[projectionYear - 1]?.partnerEarnings || 0).toLocaleString()} in {projectionYear} year{projectionYear > 1 ? 's' : ''}!
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={partnerProjectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString()}`,
                  name === 'ownerEarnings' ? 'Owner Earnings' : 'Partner Earnings'
                ]}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="ownerEarnings"
                stackId="1"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.6}
                name="Owner Earnings"
              />
              <Area
                type="monotone"
                dataKey="partnerEarnings"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Partner Earnings"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                ₹{(partnerProjectionData[projectionYear - 1]?.ownerEarnings || 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Owner Earnings ({projectionYear} Year{projectionYear > 1 ? 's' : ''})</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                ₹{(partnerProjectionData[projectionYear - 1]?.partnerEarnings || 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Partner Earnings ({projectionYear} Year{projectionYear > 1 ? 's' : ''})</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                ₹{((partnerProjectionData[projectionYear - 1]?.ownerEarnings || 0) + (partnerProjectionData[projectionYear - 1]?.partnerEarnings || 0)).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Total Profit ({projectionYear} Year{projectionYear > 1 ? 's' : ''})</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;