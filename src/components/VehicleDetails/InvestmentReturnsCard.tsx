import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionNumberBadge } from './SectionNumberBadge';

interface InvestmentReturnsCardProps {
  vehicle: any;
  financialData: any;
  expenseData: any;
  getTotalInvestment: () => number;
}

const InvestmentReturnsCard: React.FC<InvestmentReturnsCardProps> = ({
  vehicle,
  financialData,
  expenseData,
  getTotalInvestment
}) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <SectionNumberBadge id="1" label="Investment & Returns" className="mb-2" />
        <CardTitle>Investment & Returns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {/* Investment Breakdown */}
          <div className="space-y-2 pb-3 border-b">
            <SectionNumberBadge id="2" label="Investment Breakdown" className="mb-2" />
            <h4 className="font-semibold text-sm text-gray-700">Investment Breakdown</h4>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span>Initial investment</span>
              <span className="font-medium">₹{(vehicle.initialInvestment || vehicle.initialCost)?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span>Prepayment</span>
              <span className="font-medium">₹{expenseData.prepayments.toLocaleString()}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span>Total expenses</span>
              <span className="font-medium text-red-600">₹{expenseData.totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-t pt-2 font-semibold">
              <span>Total investment</span>
              <span className="text-lg">₹{getTotalInvestment().toLocaleString()}</span>
            </div>
          </div>

          {/* Returns & Performance */}
          <div className="space-y-2">
            <SectionNumberBadge id="3" label="Returns & Performance" className="mb-2" />
            <h4 className="font-semibold text-sm text-gray-700">Returns & Performance</h4>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span>Total Earnings</span>
              <span className="font-medium text-green-600">₹{financialData.totalEarnings.toLocaleString()}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span>Current Vehicle Value</span>
              <span className="font-medium text-green-600">₹{vehicle.residualValue?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span>Outstanding Loan</span>
              <span className="font-medium text-red-600">₹{financialData.outstandingLoan.toLocaleString()}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-t pt-2">
              <span>Total Return <span className="text-xs text-gray-500">(Earnings + Current Car Value - Outstanding Loan)</span></span>
              <span className="font-medium text-green-600">₹{financialData.totalReturn.toLocaleString()}</span>
            </div>
            {financialData.isInvestmentCovered && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span>Investment Status</span>
                <Badge variant="default" className="bg-green-500 text-white">
                  Investment Covered
                </Badge>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="font-medium">ROI</span>
              <span className={`font-bold ${financialData.roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {financialData.roiPercentage >= 0 ? '+' : ''}{financialData.roiPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="font-medium">Total Net Cash Flow</span>
              <span className={`font-bold ${(financialData.totalEarnings - financialData.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{(financialData.totalEarnings - financialData.totalExpenses).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t pt-2 mt-auto space-y-2">
          <SectionNumberBadge id="4" label="Profit & Loss" />
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="font-medium">Profit/Loss</span>
            <span className={`font-bold ${financialData.isProfit ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(financialData.totalReturn - financialData.totalInvestment).toLocaleString()} ({financialData.grossProfitLossPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentReturnsCard;