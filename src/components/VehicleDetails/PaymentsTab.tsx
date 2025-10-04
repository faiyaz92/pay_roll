import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, CreditCard, CircleDollarSign, History, AlertTriangle } from 'lucide-react';
import { Payment } from '@/types/user';

interface PaymentsTabProps {
  transactionTypeFilter: string;
  setTransactionTypeFilter: (value: string) => void;
  paidSubTypeFilter: string;
  setPaidSubTypeFilter: (value: string) => void;
  expenseSubTypeFilter: string;
  setExpenseSubTypeFilter: (value: string) => void;
  paymentFilter: string;
  setPaymentFilter: (value: string) => void;
  paymentDateFilter: string;
  setPaymentDateFilter: (value: string) => void;
  filteredPayments: Payment[];
  setShowEmiForm: (show: boolean) => void;
  setShowRentForm: (show: boolean) => void;
  setShowExpenseForm: (show: boolean) => void;
  setShowExpenseCorrectionForm: (show: boolean) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
  transactionTypeFilter,
  setTransactionTypeFilter,
  paidSubTypeFilter,
  setPaidSubTypeFilter,
  expenseSubTypeFilter,
  setExpenseSubTypeFilter,
  paymentFilter,
  setPaymentFilter,
  paymentDateFilter,
  setPaymentDateFilter,
  filteredPayments,
  setShowEmiForm,
  setShowRentForm,
  setShowExpenseForm,
  setShowExpenseCorrectionForm
}) => {
  return (
    <div className="space-y-4">
      {/* Payment History Header and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Payment History</h3>
          <p className="text-sm text-muted-foreground">Track all payments and receipts for this vehicle</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Level 1: Transaction Type Filter */}
          <select
            className="px-3 py-2 border rounded-md text-sm min-w-[120px]"
            value={transactionTypeFilter}
            onChange={(e) => {
              setTransactionTypeFilter(e.target.value);
              setPaidSubTypeFilter('all'); // Reset sub-filters
              setExpenseSubTypeFilter('all');
              setPaymentFilter('all'); // Reset legacy filter
            }}
          >
            <option value="all">All Transactions</option>
            <option value="paid">Paid</option>
            <option value="received">Received</option>
          </select>

          {/* Level 2: Paid Sub-Type Filter (only show when "Paid" is selected) */}
          {transactionTypeFilter === 'paid' && (
            <select
              className="px-3 py-2 border rounded-md text-sm min-w-[120px]"
              value={paidSubTypeFilter}
              onChange={(e) => {
                setPaidSubTypeFilter(e.target.value);
                setExpenseSubTypeFilter('all'); // Reset expense sub-filter
              }}
            >
              <option value="all">All Paid Types</option>
              <option value="emi">EMI</option>
              <option value="prepayment">Prepayment</option>
              <option value="expenses">Expenses</option>
            </select>
          )}

          {/* Level 3: Expense Sub-Type Filter (only show when "Expenses" is selected) */}
          {paidSubTypeFilter === 'expenses' && (
            <select
              className="px-3 py-2 border rounded-md text-sm min-w-[120px]"
              value={expenseSubTypeFilter}
              onChange={(e) => setExpenseSubTypeFilter(e.target.value)}
            >
              <option value="all">All Expenses</option>
              <option value="maintenance">Maintenance</option>
              <option value="insurance">Insurance</option>
              <option value="fuel">Fuel</option>
              <option value="penalties">Penalties</option>
              <option value="general">General</option>
            </select>
          )}

          {/* Legacy Filter (hidden when using new system) */}
          {transactionTypeFilter === 'all' && (
            <select
              className="px-3 py-2 border rounded-md text-sm"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="emi">EMI Payments</option>
              <option value="prepayment">Prepayments</option>
              <option value="rent">Rent Received</option>
              <option value="expense">Expenses</option>
              <option value="maintenance">Maintenance</option>
            </select>
          )}

          {/* Date Filter */}
          <input
            type="month"
            className="px-3 py-2 border rounded-md text-sm"
            value={paymentDateFilter}
            onChange={(e) => setPaymentDateFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Active Filters Indicator */}
      {(transactionTypeFilter !== 'all' || paidSubTypeFilter !== 'all' || expenseSubTypeFilter !== 'all' || paymentDateFilter) && (
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {transactionTypeFilter !== 'all' && (
            <Badge variant="secondary">
              {transactionTypeFilter === 'paid' ? 'Paid Transactions' : 'Received Transactions'}
            </Badge>
          )}
          {paidSubTypeFilter !== 'all' && (
            <Badge variant="secondary">
              {paidSubTypeFilter === 'emi' ? 'EMI' :
               paidSubTypeFilter === 'prepayment' ? 'Prepayment' : 'Expenses'}
            </Badge>
          )}
          {expenseSubTypeFilter !== 'all' && (
            <Badge variant="secondary">
              {expenseSubTypeFilter.charAt(0).toUpperCase() + expenseSubTypeFilter.slice(1)}
            </Badge>
          )}
          {paymentDateFilter && (
            <Badge variant="secondary">
              {new Date(paymentDateFilter).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </Badge>
          )}
          <button
            onClick={() => {
              setTransactionTypeFilter('all');
              setPaidSubTypeFilter('all');
              setExpenseSubTypeFilter('all');
              setPaymentDateFilter('');
              setPaymentFilter('all');
            }}
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid Out</p>
                <p className="text-xl font-bold text-red-500">
                  ₹{(filteredPayments.filter(p => p.type === 'paid')
                    .reduce((sum, p) => sum + (p.amountPaid || 0), 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Received</p>
                <p className="text-xl font-bold text-green-500">
                  ₹{(filteredPayments.filter(p => p.type === 'received')
                    .reduce((sum, p) => sum + (p.amountPaid || p.amountDue || 0), 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">EMI Payments</p>
                <p className="text-xl font-bold">
                  ₹{(filteredPayments.filter(p => p.type === 'paid' && p.paymentType === 'emi')
                    .reduce((sum, p) => sum + (p.amountPaid || 0), 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CircleDollarSign className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prepayments</p>
                <p className="text-xl font-bold text-purple-500">
                  ₹{(filteredPayments.filter(p => p.type === 'paid' && p.paymentType === 'prepayment')
                    .reduce((sum, p) => sum + (p.amountPaid || 0), 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
            <Badge variant="secondary" className="ml-auto">
              {filteredPayments.length} transactions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[500px] overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Date</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-left p-2 font-medium">Description</th>
                  <th className="text-right p-2 font-medium">Amount</th>
                  <th className="text-left p-2 font-medium">Method</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {new Date(payment.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={
                            payment.type === 'received' ? 'default' :
                            payment.paymentType === 'emi' ? 'secondary' :
                            payment.paymentType === 'prepayment' ? 'outline' :
                            payment.expenseType === 'insurance' ? 'secondary' :
                            payment.expenseType === 'penalties' ? 'destructive' :
                            payment.expenseType === 'fuel' ? 'secondary' :
                            'destructive'
                          }
                          className={
                            payment.type === 'received' ? 'bg-green-100 text-green-800' :
                            payment.paymentType === 'emi' ? 'bg-indigo-100 text-indigo-800' :
                            payment.paymentType === 'prepayment' ? 'bg-orange-100 text-orange-800' :
                            payment.expenseType === 'insurance' ? 'bg-blue-100 text-blue-800' :
                            payment.expenseType === 'penalties' ? 'bg-red-100 text-red-800' :
                            payment.expenseType === 'fuel' ? 'bg-blue-100 text-blue-800' :
                            payment.expenseType === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-purple-100 text-purple-800'
                          }
                        >
                          {payment.type === 'received' && payment.paymentType === 'rent' ? 'RENT' :
                           payment.type === 'received' && payment.paymentType === 'security' ? 'SECURITY' :
                           payment.paymentType === 'emi' ? 'EMI' :
                           payment.paymentType === 'prepayment' ? 'PREPAYMENT' :
                           payment.expenseType === 'insurance' ? 'INSURANCE' :
                           payment.expenseType === 'penalties' ? 'PENALTY' :
                           payment.expenseType === 'maintenance' ? 'MAINTENANCE' :
                           payment.expenseType === 'fuel' ? 'FUEL' :
                           payment.expenseType === 'general' ? 'GENERAL' :
                           'EXPENSE'}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm">
                        {payment.description || `${payment.type} payment`}
                      </td>
                      <td className={`p-2 text-right font-medium ${
                        payment.type === 'received' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {payment.type === 'received' ? '+' : '-'}₹{(payment.amount || payment.amountPaid || payment.amountDue || 0).toLocaleString()}
                      </td>
                      <td className="p-2 text-sm">
                        {payment.paymentMethod || 'Bank Transfer'}
                      </td>
                      <td className="p-2">
                        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                          {payment.status || 'due'}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {payment.reference || payment.transactionId || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <History className="h-8 w-8 opacity-50" />
                        <p>No payment history found</p>
                        <p className="text-sm">Transactions will appear here once recorded</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setShowEmiForm(true)}
          className="flex items-center gap-2"
        >
          <CreditCard className="h-4 w-4" />
          Record EMI Payment
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowRentForm(true)}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Record Rent Receipt
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowExpenseForm(true)}
          className="flex items-center gap-2"
        >
          <TrendingDown className="h-4 w-4" />
          Add Expense
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowExpenseCorrectionForm(true)}
          className="border-orange-500 text-orange-600 hover:bg-orange-50 flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Correction
        </Button>
      </div>
    </div>
  );
};