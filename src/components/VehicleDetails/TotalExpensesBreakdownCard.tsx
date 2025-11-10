import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';
import { SectionNumberBadge } from './SectionNumberBadge';

interface TotalExpensesBreakdownCardProps {
  expenseData: any;
}

const TotalExpensesBreakdownCard: React.FC<TotalExpensesBreakdownCardProps> = ({
  expenseData
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <SectionNumberBadge id="1" label="Total Expenses Breakdown" className="mb-2" />
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-600" />
          Total Expenses Breakdown
        </CardTitle>
        <CardDescription>
          Components that make up your total costs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <SectionNumberBadge id="2" label="Expense Components" className="mb-2" />
        <div className="flex justify-between">
          <span className="text-gray-600">Fuel Expenses:</span>
          <span className="font-medium text-red-600">₹{expenseData.fuelExpenses.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Maintenance:</span>
          <span className="font-medium text-red-600">₹{expenseData.maintenanceExpenses.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Insurance:</span>
          <span className="font-medium text-red-600">₹{expenseData.insuranceExpenses.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Penalties:</span>
          <span className="font-medium text-red-600">₹{expenseData.penaltyExpenses.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">EMI Payments:</span>
          <span className="font-medium text-blue-600">₹{expenseData.emiPayments.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Other Expenses:</span>
          <span className="font-medium text-red-600">₹{expenseData.otherExpenses.toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total Expenses:</span>
          <span className="text-red-600">₹{expenseData.totalExpenses.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalExpensesBreakdownCard;