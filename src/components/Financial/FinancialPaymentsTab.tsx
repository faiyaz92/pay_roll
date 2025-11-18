import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  History,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Car
} from 'lucide-react';
import { SectionNumberBadge } from '../VehicleDetails/SectionNumberBadge';

interface FinancialPaymentsTabProps {
  companyFinancialData: any;
  selectedYear: string;
  selectedMonth: string;
}

const FinancialPaymentsTab: React.FC<FinancialPaymentsTabProps> = ({
  companyFinancialData,
  selectedYear,
  selectedMonth
}) => {
  const { vehicleData, payments, expenses } = companyFinancialData;

  // Get the date range for filtering
  const year = parseInt(selectedYear);
  const month = parseInt(selectedMonth) - 1; // Convert to 0-based
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  // Filter payments for the selected month
  const monthPayments = payments.filter((payment: any) => {
    const paymentDate = new Date(payment.paidAt || payment.collectionDate || payment.createdAt);
    return paymentDate >= monthStart && paymentDate <= monthEnd && payment.status === 'paid';
  });

  // Filter expenses for the selected month
  const monthExpenses = expenses.filter((expense: any) => {
    const expenseDate = new Date(expense.createdAt);
    return expenseDate >= monthStart && expenseDate <= monthEnd && expense.status === 'approved';
  });

  // Add vehicle registration to payments and expenses
  const incomeTransactions = monthPayments.map((payment: any) => {
    const vehicle = vehicleData.find((v: any) => v.vehicle.id === payment.vehicleId);
    return {
      ...payment,
      vehicleReg: vehicle?.vehicle?.registrationNumber || 'Unknown',
      type: 'income'
    };
  });

  const expenseTransactions = monthExpenses.map((expense: any) => {
    const vehicle = vehicleData.find((v: any) => v.vehicle.id === expense.vehicleId);
    return {
      ...expense,
      vehicleReg: vehicle?.vehicle?.registrationNumber || 'Unknown',
      type: 'expense'
    };
  });

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <SectionNumberBadge id="1" label="Payment Summary" className="mb-2" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{companyFinancialData.totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {companyFinancialData.monthName} {selectedYear}
            </p>
          </CardContent>
        </Card>

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
              Operating costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${companyFinancialData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{companyFinancialData.totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Income - Expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income Transactions */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="2" label="Income Transactions" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Income Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incomeTransactions.length > 0 ? (
              incomeTransactions
                .sort((a: any, b: any) => new Date(b.paidAt || b.collectionDate || b.createdAt).getTime() -
                                          new Date(a.paidAt || a.collectionDate || a.createdAt).getTime())
                .map((payment: any, idx: number) => (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg bg-green-50 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Rent Payment</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Car className="h-3 w-3" />
                          {payment.vehicleId}
                          <span>•</span>
                          {new Date(payment.paidAt || payment.collectionDate || payment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-bold text-green-600">
                        +₹{payment.amountPaid.toLocaleString()}
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        Income
                      </Badge>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No income transactions found for {companyFinancialData.monthName} {selectedYear}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense Transactions */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="3" label="Expense Transactions" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Expense Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenseTransactions.length > 0 ? (
              expenseTransactions
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((expense: any, idx: number) => (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg bg-red-50 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="font-medium">{expense.description || expense.type}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Car className="h-3 w-3" />
                          {expense.vehicleId}
                          <span>•</span>
                          {new Date(expense.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-bold text-red-600">
                        -₹{expense.amount.toLocaleString()}
                      </div>
                      <Badge variant="destructive">
                        Expense
                      </Badge>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No expense transactions found for {companyFinancialData.monthName} {selectedYear}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Summary by Vehicle */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="4" label="Transaction Summary by Vehicle" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction Summary by Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehicleData.map((vehicle: any) => (
              <div key={vehicle.vehicle.id} className="border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {vehicle.vehicle.registrationNumber}
                  </h4>
                  <div className="text-left sm:text-right">
                    <div className={`text-lg font-bold ${vehicle.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{vehicle.profit.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Net Profit</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Income:</span>
                    <span className="font-medium text-green-600">₹{vehicle.earnings.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600">Expenses:</span>
                    <span className="font-medium text-red-600">₹{vehicle.expenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialPaymentsTab;