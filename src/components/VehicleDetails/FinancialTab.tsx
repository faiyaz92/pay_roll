import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/user';
import InvestmentReturnsCard from './InvestmentReturnsCard';
import TotalReturnsBreakdownCard from './TotalReturnsBreakdownCard';
import TotalExpensesBreakdownCard from './TotalExpensesBreakdownCard';
import { SectionNumberBadge } from './SectionNumberBadge';

interface FinancialTabProps {
  vehicle: any;
  financialData: any;
  expenseData: any;
  firebasePayments: any[];
  vehicleId: string;
  getTotalInvestment: () => number;
  historicalMonthlyNetCashFlow: number;
  prepaymentAmount: string;
  setPrepaymentAmount: (value: string) => void;
  handlePrepayment: () => void;
  showPrepaymentResults: boolean;
  setShowPrepaymentResults: (value: boolean) => void;
  prepaymentResults: any;
  processPrepayment: () => void;
}

const FinancialTab: React.FC<FinancialTabProps> = ({
  vehicle,
  financialData,
  expenseData,
  firebasePayments,
  vehicleId,
  getTotalInvestment,
  historicalMonthlyNetCashFlow,
  prepaymentAmount,
  setPrepaymentAmount,
  handlePrepayment,
  showPrepaymentResults,
  setShowPrepaymentResults,
  prepaymentResults,
  processPrepayment
}) => {
  const { userInfo } = useAuth();
  // State for month/year selection
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Calculate current month earnings and expenses
  const currentMonthData = useMemo(() => {
    const monthStart = new Date(selectedYear, selectedMonth, 1);
    const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

    // Calculate earnings for selected month
    const monthlyEarnings = (firebasePayments || [])
      .filter(p =>
        p.vehicleId === vehicleId &&
        p.status === 'paid' &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) >= monthStart &&
        new Date(p.paidAt || p.collectionDate || p.createdAt) <= monthEnd
      )
      .reduce((sum, p) => sum + p.amountPaid, 0);

    // Calculate expenses for selected month
    const monthlyExpenses = (expenseData?.vehicleExpenses || [])
      .filter((e: any) => {
        // Filter by vehicleId and status first, then by date
        if (e.vehicleId !== vehicleId || e.status !== 'approved') return false;
        const expenseDate = new Date(e.date || e.createdAt);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      })
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    const netOperatingProfit = monthlyEarnings - monthlyExpenses;
    const afterEMIDeduction = netOperatingProfit - (vehicle.financingType === 'loan' ? (vehicle.loanDetails?.emiPerMonth || 0) : 0);
    const yearlyProfitEst = netOperatingProfit * 12;

    return {
      earnings: monthlyEarnings,
      expenses: monthlyExpenses,
      netOperatingProfit,
      afterEMIDeduction,
      yearlyProfitEst
    };
  }, [firebasePayments, expenseData?.vehicleExpenses, vehicleId, selectedYear, selectedMonth, vehicle.financingType, vehicle.loanDetails]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 
          ⚠️ SAFETY NOTICE: Investment & Returns calculations are PERFECT and WORKING CORRECTLY
          All ROI calculations, investment tracking, and returns breakdown are accurate.
          DO NOT MODIFY these calculations without explicit approval.
          Last verified: October 4, 2025 - All calculations confirmed correct.
        */}
        {/* Investment & Returns */}
        <div className="space-y-2">
          <SectionNumberBadge id="1" label="Investment & Returns" className="mb-2" />
          <InvestmentReturnsCard
            vehicle={vehicle}
            financialData={financialData}
            expenseData={expenseData}
            getTotalInvestment={getTotalInvestment}
          />
        </div>

        {/* Monthly Breakdown */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <SectionNumberBadge id="2" label="Monthly Breakdown" className="mb-2" />
            <CardTitle>Monthly Breakdown</CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <Label htmlFor="month-select" className="text-sm">Month</Label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger id="month-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="year-select" className="text-sm">Year</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger id="year-select">
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            {/* Current Month Data */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-blue-600 border-b pb-1">Current Month ({new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })})</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Earnings</span>
                  <span className="font-medium text-green-600 text-sm">₹{Math.round(currentMonthData.earnings).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Expenses</span>
                  <span className="font-medium text-red-600 text-sm">₹{Math.round(currentMonthData.expenses).toLocaleString()}</span>
                </div>
                {vehicle.financingType === 'loan' && vehicle.loanDetails && (
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly EMI</span>
                    <span className="font-medium text-blue-600 text-sm">₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}</span>
                  </div>
                )}
                {financialData.isCurrentlyRented && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Net Operating Profit</span>
                      <span className={`font-bold text-sm ${currentMonthData.netOperatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.round(currentMonthData.netOperatingProfit).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">After EMI Deduction</span>
                      <span className={`font-bold text-sm ${currentMonthData.afterEMIDeduction >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.round(currentMonthData.afterEMIDeduction).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Yearly Profit (Est.)</span>
                      <span className={`font-bold text-sm ${currentMonthData.netOperatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(Math.round(currentMonthData.netOperatingProfit) * 12).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Historical Average Data */}
            <div className="space-y-3 border-t pt-3">
                      <div className="space-y-2">
                        <SectionNumberBadge id="5" label="Total Returns Breakdown" className="mb-2" />
                {vehicle.financingType === 'loan' && vehicle.loanDetails && (
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly EMI</span>
                    <span className="font-medium text-blue-600 text-sm">₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}</span>
                  </div>
                )}
                {financialData.isCurrentlyRented && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Net Operating Profit</span>
                      <span className={`font-bold text-sm ${financialData.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.round(financialData.monthlyProfit).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">After EMI Deduction</span>
                      <span className={`font-bold text-sm ${(financialData.monthlyProfit - (vehicle.financingType === 'loan' ? (vehicle.loanDetails?.emiPerMonth || 0) : 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.round(financialData.monthlyProfit - (vehicle.financingType === 'loan' ? (vehicle.loanDetails?.emiPerMonth || 0) : 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Yearly Profit (Est.)</span>
                      <span className={`font-bold text-sm ${financialData.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(Math.round(financialData.monthlyProfit) * 12).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Performance Comparison */}
            <div className="space-y-2 border-t pt-3">
              <h4 className="font-semibold text-sm text-purple-600 border-b pb-1">Performance vs Average</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Earnings:</span>
                  <span className={`${currentMonthData.earnings >= (financialData.isCurrentlyRented ? financialData.monthlyRent : 0) ? 'text-green-600' : 'text-red-600'}`}>
                    {currentMonthData.earnings >= (financialData.isCurrentlyRented ? financialData.monthlyRent : 0) ? '↑ Above Avg' : '↓ Below Avg'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Expenses:</span>
                  <span className={`${currentMonthData.expenses <= financialData.monthlyExpenses ? 'text-green-600' : 'text-red-600'}`}>
                    {currentMonthData.expenses <= financialData.monthlyExpenses ? '↓ Below Avg' : '↑ Above Avg'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Profit:</span>
                  <span className={`${currentMonthData.netOperatingProfit >= financialData.monthlyProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {currentMonthData.netOperatingProfit >= financialData.monthlyProfit ? '↑ Above Avg' : '↓ Below Avg'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between border-t pt-2 mt-auto">
              <span className="font-medium text-sm">Monthly Net Cash Flow</span>
              <span className={`font-bold text-sm ${historicalMonthlyNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.round(historicalMonthlyNetCashFlow).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Loan Details */}
        {vehicle.financingType === 'loan' && vehicle.loanDetails && (
          <Card>
            <CardHeader>
              <SectionNumberBadge id="3" label="Loan Details" className="mb-2" />
              <CardTitle>Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Original Loan</span>
                  <span className="font-medium">₹{vehicle.loanDetails.totalLoan?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding Balance</span>
                  <span className="font-medium text-red-600">₹{financialData.outstandingLoan.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>EMIs Paid</span>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {vehicle.loanDetails.amortizationSchedule?.filter(emi => emi.isPaid).length || 0} / {vehicle.loanDetails.totalInstallments || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      ₹{financialData.totalEmiPaid.toLocaleString()}
                    </div>
                  </div>
                </div>
                {financialData.nextEMIDue && (
                  <div className="flex justify-between">
                    <span>Next EMI Due</span>
                    <span className={`font-medium ${financialData.daysUntilEMI <= 7 ? 'text-red-600' : 'text-gray-600'}`}>
                      {new Date(financialData.nextEMIDue).toLocaleDateString()}
                      {financialData.daysUntilEMI >= 0 && (
                        <span className="text-xs block">({financialData.daysUntilEMI} days)</span>
                      )}
                    </span>
                  </div>
                )}
                <Progress
                  value={(vehicle.loanDetails.amortizationSchedule?.filter(emi => emi.isPaid).length || 0) / (vehicle.loanDetails.totalInstallments || 1) * 100}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prepayment Calculator */}
        {userInfo?.role !== Role.PARTNER && vehicle.financingType === 'loan' && vehicle.loanDetails && financialData.outstandingLoan > 0 && (
          <Card id="prepayment">
            <CardHeader>
              <SectionNumberBadge id="4" label="Prepayment Calculator" className="mb-2" />
              <CardTitle>Prepayment Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-700">
                  <strong>Outstanding:</strong> ₹{financialData.outstandingLoan.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Calculate how prepayment reduces your loan tenure
                </p>
              </div>

              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Make prepayments before paying the current month's EMI to avoid restructuring an already paid installment.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="prepayment">Prepayment Amount (₹)</Label>
                <Input
                  id="prepayment"
                  type="number"
                  value={prepaymentAmount}
                  onChange={(e) => setPrepaymentAmount(e.target.value)}
                  placeholder="Enter amount to prepay"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Outstanding loan: ₹{financialData.outstandingLoan.toLocaleString()} • You can pay more than the EMI amount
                </p>
              </div>
              <Button
                onClick={handlePrepayment}
                disabled={!prepaymentAmount || parseFloat(prepaymentAmount) <= 0}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Benefits
              </Button>

              {/* Prepayment Results Card */}
              {showPrepaymentResults && prepaymentResults && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-green-800">Prepayment Analysis</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPrepaymentResults(false)}
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Prepayment Amount:</span>
                      <span className="font-medium">₹{prepaymentResults.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Outstanding:</span>
                      <span className="font-medium text-green-600">₹{prepaymentResults.newOutstanding.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tenure Reduction:</span>
                      <span className="font-medium text-blue-600">{prepaymentResults.tenureReduction} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Savings:</span>
                      <span className="font-medium text-green-600">₹{prepaymentResults.interestSavings.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={processPrepayment}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Confirm & Pay ₹{prepaymentResults.amount.toLocaleString()}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPrepaymentResults(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Financial Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <SectionNumberBadge id="5" label="Total Returns Breakdown" className="mb-2" />
          <TotalReturnsBreakdownCard
            vehicle={vehicle}
            financialData={financialData}
            firebasePayments={firebasePayments}
            vehicleId={vehicleId}
          />
        </div>

        <div className="space-y-2">
          <SectionNumberBadge id="6" label="Total Expenses Breakdown" className="mb-2" />
          {/* 
            ⚠️ SAFETY NOTICE: Total Expenses Breakdown calculations are PERFECT and WORKING CORRECTLY
            All expense categorization, totals, and breakdown calculations are accurate.
            DO NOT MODIFY these calculations without explicit approval.
            Last verified: October 4, 2025 - All calculations confirmed correct.
          */}
          <TotalExpensesBreakdownCard
            expenseData={expenseData}
          />
        </div>
      </div>
    </div>
  );
};

export default FinancialTab;