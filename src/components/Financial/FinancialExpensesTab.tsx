import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Receipt,
  TrendingDown,
  Calendar,
  Car,
  Filter
} from 'lucide-react';
import { SectionNumberBadge } from '../VehicleDetails/SectionNumberBadge';

interface FinancialExpensesTabProps {
  companyFinancialData: any;
  selectedYear: string;
  selectedMonth: string;
}

const FinancialExpensesTab: React.FC<FinancialExpensesTabProps> = ({
  companyFinancialData,
  selectedYear,
  selectedMonth
}) => {
  const { vehicleData, expenses } = companyFinancialData;

  // Get the date range for filtering
  const year = parseInt(selectedYear);
  const month = parseInt(selectedMonth) - 1; // Convert to 0-based
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  // Filter expenses for the selected period
  const periodExpenses = expenses.filter((expense: any) =>
    expense.status === 'approved' &&
    new Date(expense.createdAt) >= monthStart &&
    new Date(expense.createdAt) <= monthEnd
  );

  // Add vehicle registration to each expense
  const allExpenses = periodExpenses.map((expense: any) => {
    const vehicle = vehicleData.find((v: any) => v.vehicle.id === expense.vehicleId);
    return {
      ...expense,
      vehicleReg: vehicle?.vehicle?.registrationNumber || 'Unknown'
    };
  });

  // Group expenses by category
  const expensesByCategory = allExpenses.reduce((acc: any, expense: any) => {
    const category = expense.expenseType || expense.type || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(expense);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Expense Summary */}
      <SectionNumberBadge id="1" label="Expense Summary" className="mb-2" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{companyFinancialData.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {companyFinancialData.monthName} {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expense Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {allExpenses.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Vehicle</CardTitle>
            <Car className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₹{(vehicleData.length > 0 ? companyFinancialData.totalExpenses / vehicleData.length : 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Average expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Categories */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="2" label="Expenses by Category" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Expenses by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(expensesByCategory).map(([category, expenses]: [string, any]) => {
              const totalAmount = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
              const percentage = companyFinancialData.totalExpenses > 0 ?
                (totalAmount / companyFinancialData.totalExpenses) * 100 : 0;

              return (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <h4 className="font-medium capitalize">{category}</h4>
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-bold text-red-600">
                        ₹{totalAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <div className="space-y-2">
                    {expenses.slice(0, 5).map((expense: any, idx: number) => (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Car className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{expense.vehicleReg}</span>
                          <span className="truncate">{expense.description || expense.type}</span>
                        </div>
                        <span className="font-medium">₹{expense.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    {expenses.length > 5 && (
                      <div className="text-sm text-gray-500 text-center">
                        +{expenses.length - 5} more expenses
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="3" label="Recent Expenses" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allExpenses
              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 20)
              .map((expense: any, idx: number) => (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">{expense.description || expense.type}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Car className="h-3 w-3" />
                        {expense.vehicleReg}
                        <span>•</span>
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-bold text-red-600">
                      ₹{expense.amount.toLocaleString()}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {expense.expenseType || expense.type || 'other'}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialExpensesTab;