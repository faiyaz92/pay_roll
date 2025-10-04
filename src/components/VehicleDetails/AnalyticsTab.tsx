import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
  calculateProjection
}) => {
  return (
    <div className="space-y-4">
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
                      <span className="font-medium text-red-600">₹{projection.projectedOperatingExpenses.toLocaleString()}</span>
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
    </div>
  );
};

export default AnalyticsTab;