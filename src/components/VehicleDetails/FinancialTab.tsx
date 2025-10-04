import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Calculator } from 'lucide-react';
import InvestmentReturnsCard from './InvestmentReturnsCard';
import TotalReturnsBreakdownCard from './TotalReturnsBreakdownCard';
import TotalExpensesBreakdownCard from './TotalExpensesBreakdownCard';

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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Investment & Returns */}
        <InvestmentReturnsCard
          vehicle={vehicle}
          financialData={financialData}
          expenseData={expenseData}
          getTotalInvestment={getTotalInvestment}
        />

        {/* Monthly Breakdown */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            <div className="space-y-3 flex-1">
              <div className="flex justify-between">
                <span>Monthly Earnings</span>
                <span className="font-medium text-green-600">₹{Math.round(financialData.isCurrentlyRented ? financialData.monthlyRent : 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Expenses (Avg.)</span>
                <span className="font-medium text-red-600">₹{Math.round(financialData.monthlyExpenses).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly EMI</span>
                <span className="font-medium text-blue-600">₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}</span>
              </div>
              {financialData.isCurrentlyRented && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Net Operating Profit</span>
                    <span className={`font-bold ${financialData.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.round(financialData.monthlyProfit).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">After EMI Deduction</span>
                    <span className={`font-bold ${(financialData.monthlyProfit - (vehicle.loanDetails?.emiPerMonth || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.round(financialData.monthlyProfit - (vehicle.loanDetails?.emiPerMonth || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Yearly Profit (Est.)</span>
                    <span className={`font-bold ${financialData.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(Math.round(financialData.monthlyProfit) * 12).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-between border-t pt-2 mt-auto">
              <span className="font-medium">Monthly Net Cash Flow</span>
              <span className={`font-bold ${historicalMonthlyNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.round(historicalMonthlyNetCashFlow).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Loan Details */}
        {vehicle.financingType === 'loan' && vehicle.loanDetails && (
          <Card>
            <CardHeader>
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
                      {vehicle.loanDetails.paidInstallments?.length || 0} / {vehicle.loanDetails.totalInstallments || 0}
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
                  value={(vehicle.loanDetails.paidInstallments?.length || 0) / (vehicle.loanDetails.totalInstallments || 1) * 100}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prepayment Calculator */}
        {vehicle.financingType === 'loan' && vehicle.loanDetails && financialData.outstandingLoan > 0 && (
          <Card id="prepayment">
            <CardHeader>
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
    </div>
  );
};

export default FinancialTab;