import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { SectionNumberBadge } from './SectionNumberBadge';

interface TotalReturnsBreakdownCardProps {
  vehicle: any;
  financialData: any;
  firebasePayments: any[];
  vehicleId: string;
}

const TotalReturnsBreakdownCard: React.FC<TotalReturnsBreakdownCardProps> = ({
  vehicle,
  financialData,
  firebasePayments,
  vehicleId
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <SectionNumberBadge id="1" label="Total Returns Breakdown" className="mb-2" />
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Total Returns Breakdown
        </CardTitle>
        <CardDescription>
          Components that make up your total returns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <SectionNumberBadge id="2" label="Return Components" className="mb-2" />
        <div className="flex justify-between">
          <span className="text-gray-600">Current Car Value:</span>
          <span className="font-medium text-green-600">+₹{(() => {
            const initialValue = vehicle.initialInvestment || vehicle.initialCost || 0;
            const depreciationRate = vehicle.depreciationRate ?? 10;
            const depreciationPerYear = depreciationRate / 100;

            // Calculate operational years since purchase (add 1 to include current year)
            const purchaseYear = vehicle.year || new Date().getFullYear();
            const currentYear = new Date().getFullYear();
            const operationalYears = Math.max(1, currentYear - purchaseYear + 1);

            const depreciatedValue = initialValue * Math.pow((1 - depreciationPerYear), operationalYears);
            return Math.round(depreciatedValue).toLocaleString();
          })()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Earnings:</span>
          <span className="font-medium text-green-600">+₹{financialData.totalEarnings.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Outstanding Loan:</span>
          <span className="font-medium text-red-600">-₹{financialData.outstandingLoan.toLocaleString()}</span>
        </div>
        <div className="h-6"></div>
        <div className="h-6"></div>
        <div className="h-6"></div>
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total Returns:</span>
          <span className="text-green-600">₹{financialData.totalReturn.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalReturnsBreakdownCard;