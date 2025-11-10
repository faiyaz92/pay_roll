import React, { useState, useMemo } from 'react';
import { Search, Calendar, Clock, CheckCircle2, AlertCircle, DollarSign, ArrowUpCircle, ArrowDownCircle, Filter, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebaseData, Payment, Expense } from '@/hooks/useFirebaseData';

// Normalized transaction interface
interface Transaction {
  id: string;
  type: 'received' | 'paid';
  paymentType: 'rent' | 'emi' | 'prepayment' | 'expenses';
  expenseType?: 'maintenance' | 'fuel' | 'insurance' | 'penalties' | 'general';
  vehicleId: string;
  driverId?: string;
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'overdue';
  originalData: Payment | Expense | any; // Allow EMI data as well
}

const Payments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<string>('all');
  const { userInfo } = useAuth();
  const { payments, vehicles, drivers, expenses } = useFirebaseData();

  // Helper functions to get names
  const getVehicleName = (vehicleId: string) => {
    if (!vehicleId) return 'Unknown Vehicle';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.vehicleName || vehicle.make + ' ' + vehicle.model} (${vehicle.registrationNumber})` : `Vehicle ${vehicleId}`;
  };

  const getDriverName = (driverId: string) => {
    if (!driverId) return 'N/A';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : `Driver ${driverId}`;
  };

  // Normalize all transactions
  const normalizedTransactions: Transaction[] = useMemo(() => {
    const transactions: Transaction[] = [];

    // Add rent payments (received)
    payments.forEach(payment => {
      transactions.push({
        id: `rent-${payment.id}`,
        type: 'received',
        paymentType: 'rent',
        vehicleId: payment.vehicleId,
        driverId: payment.driverId,
        amount: payment.amountPaid,
        description: `Weekly rent payment`,
        date: payment.paidAt || payment.weekStart,
        status: payment.status === 'paid' ? 'completed' : payment.status === 'overdue' ? 'overdue' : 'pending',
        originalData: payment
      });
    });

    // Add EMI payments from amortization schedules
    vehicles.forEach(vehicle => {
      if (vehicle.loanDetails?.amortizationSchedule) {
        vehicle.loanDetails.amortizationSchedule.forEach((emi, index) => {
          if (emi.isPaid) {
            transactions.push({
              id: `emi-${vehicle.id}-${index}`,
              type: 'paid',
              paymentType: 'emi',
              vehicleId: vehicle.id,
              amount: emi.interest + emi.principal,
              description: `EMI Payment - Month ${index + 1}`,
              date: emi.paidAt || emi.dueDate,
              status: 'completed',
              originalData: { ...emi, vehicleId: vehicle.id }
            });
          }
        });
      }
    });

    // Add expenses (paid)
    expenses.forEach(expense => {
      let paymentType: 'emi' | 'prepayment' | 'expenses' = 'expenses';
      let expenseType: 'maintenance' | 'fuel' | 'insurance' | 'penalties' | 'general' | undefined;

      // Map EMI and prepayment to specific payment types
      if (expense.paymentType === 'emi') {
        paymentType = 'emi';
        expenseType = undefined;
      } else if (expense.paymentType === 'prepayment') {
        paymentType = 'prepayment';
        expenseType = undefined;
      } else if (expense.description.toLowerCase().includes('fuel')) {
        expenseType = 'fuel';
      } else {
        expenseType = expense.type as 'maintenance' | 'insurance' | 'penalties' | 'general';
      }

      transactions.push({
        id: `expense-${expense.id}`,
        type: 'paid',
        paymentType,
        expenseType,
        vehicleId: expense.vehicleId,
        driverId: expense.submittedBy,
        amount: expense.amount,
        description: expense.description,
        date: expense.createdAt,
        status: expense.status === 'approved' ? 'completed' : expense.status === 'rejected' ? 'overdue' : 'pending',
        originalData: expense
      });
    });

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, expenses]);

  const filteredTransactions = normalizedTransactions.filter((transaction) => {
    const vehicleName = getVehicleName(transaction.vehicleId || '');
    const driverName = getDriverName(transaction.driverId || '');
    const matchesSearch = vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTransactionType = transactionTypeFilter === 'all' || transaction.type === transactionTypeFilter;
    const matchesPaymentType = paymentTypeFilter === 'all' || transaction.paymentType === paymentTypeFilter;
    const matchesExpenseType = expenseTypeFilter === 'all' ||
                               (transaction.expenseType && transaction.expenseType === expenseTypeFilter) ||
                               (expenseTypeFilter === 'fuel' && transaction.description.toLowerCase().includes('fuel'));

    return matchesSearch && matchesTransactionType && matchesPaymentType && matchesExpenseType;
  });

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'received') {
      return <ArrowDownCircle className="w-4 h-4 text-green-600" />;
    } else {
      switch (transaction.paymentType) {
        case 'emi':
          return <CreditCard className="w-4 h-4 text-blue-600" />;
        case 'prepayment':
          return <DollarSign className="w-4 h-4 text-purple-600" />;
        case 'expenses':
          return <AlertCircle className="w-4 h-4 text-orange-600" />;
        default:
          return <ArrowUpCircle className="w-4 h-4 text-red-600" />;
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'received' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getPaymentTypeDisplay = (transaction: Transaction) => {
    if (transaction.type === 'received') return 'Rent Received';
    switch (transaction.paymentType) {
      case 'emi': return 'EMI Payment';
      case 'prepayment': return 'Prepayment';
      case 'expenses': return `${transaction.expenseType?.charAt(0).toUpperCase()}${transaction.expenseType?.slice(1)} Expense`;
      default: return 'Payment';
    }
  };

  const handleMarkCollected = (transactionId: string) => {
    // Handle marking payment as collected
    console.log('Marking transaction as collected:', transactionId);
    // TODO: Implement Firestore update
  };

  // Calculate summary statistics
  const totalReceived = filteredTransactions
    .filter(t => t.type === 'received' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaid = filteredTransactions
    .filter(t => t.type === 'paid' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingReceived = filteredTransactions
    .filter(t => t.type === 'received' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalReceived - totalPaid;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Transactions</h1>
          <p className="text-gray-600">Track all payments, expenses, EMI, and rent across all vehicles</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ArrowDownCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-green-600">₹{totalReceived.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ArrowUpCircle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-red-600">₹{totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Received</p>
                <p className="text-2xl font-bold text-yellow-600">₹{pendingReceived.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className={`w-8 h-8 mr-3 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{netCashFlow.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by vehicle, driver, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={transactionTypeFilter} onValueChange={(value) => {
          setTransactionTypeFilter(value);
          setPaymentTypeFilter('all'); // Reset second level
          setExpenseTypeFilter('all'); // Reset third level
        }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Transaction Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        {/* Second Level Filter - Only show when transaction type is selected */}
        {transactionTypeFilter !== 'all' && (
          <Select value={paymentTypeFilter} onValueChange={(value) => {
            setPaymentTypeFilter(value);
            setExpenseTypeFilter('all'); // Reset third level
          }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={transactionTypeFilter === 'paid' ? 'Paid Type' : 'Received Type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {transactionTypeFilter === 'paid' ? 'All Paid Types' : 'All Received Types'}
              </SelectItem>
              {transactionTypeFilter === 'received' && (
                <>
                  <SelectItem value="rent">Rent Collection</SelectItem>
                  <SelectItem value="security">Security Deposit</SelectItem>
                </>
              )}
              {transactionTypeFilter === 'paid' && (
                <>
                  <SelectItem value="emi">EMI</SelectItem>
                  <SelectItem value="prepayment">Prepayment</SelectItem>
                  <SelectItem value="expenses">Expenses</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        )}

        {/* Third Level Filter - Only show when expenses is selected */}
        {paymentTypeFilter === 'expenses' && (
          <Select value={expenseTypeFilter} onValueChange={setExpenseTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Expense Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expenses</SelectItem>
              <SelectItem value="fuel">Fuel</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="penalties">Penalties</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Active Filters Indicator */}
      {(transactionTypeFilter !== 'all' || paymentTypeFilter !== 'all' || expenseTypeFilter !== 'all') && (
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {transactionTypeFilter !== 'all' && (
            <Badge variant="secondary">
              {transactionTypeFilter === 'paid' ? 'Paid Transactions' : 'Received Transactions'}
            </Badge>
          )}
          {paymentTypeFilter !== 'all' && (
            <Badge variant="secondary">
              {paymentTypeFilter === 'emi' ? 'EMI' : 
               paymentTypeFilter === 'prepayment' ? 'Prepayment' : 
               paymentTypeFilter === 'rent' ? 'Rent' :
               paymentTypeFilter === 'security' ? 'Security Deposit' : 
               'Expenses'}
            </Badge>
          )}
          {expenseTypeFilter !== 'all' && (
            <Badge variant="secondary">
              {expenseTypeFilter.charAt(0).toUpperCase() + expenseTypeFilter.slice(1)}
            </Badge>
          )}
          <button 
            onClick={() => {
              setTransactionTypeFilter('all');
              setPaymentTypeFilter('all');
              setExpenseTypeFilter('all');
            }}
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Transactions List */}
      <div className="max-h-[600px] overflow-y-auto space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No transactions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction)}
                        <h3 className="font-semibold text-lg">
                          {getVehicleName(transaction.vehicleId)}
                          {transaction.driverId && ` - ${getDriverName(transaction.driverId)}`}
                        </h3>
                      </div>
                      <Badge className={getTransactionTypeColor(transaction.type)}>
                        {transaction.type === 'received' ? 'Received' : 'Paid'}
                      </Badge>
                      <Badge variant="outline">
                        {getPaymentTypeDisplay(transaction)}
                      </Badge>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Description:</span>{' '}
                        {transaction.description}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span>{' '}
                        <span className={`font-semibold ${
                          transaction.type === 'received' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'received' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>

                    {transaction.expenseType && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Category:</span>{' '}
                        <Badge variant="secondary" className="ml-1">
                          {transaction.expenseType.charAt(0).toUpperCase() + transaction.expenseType.slice(1)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {transaction.status === 'pending' && transaction.type === 'received' ? (
                      <Button 
                        onClick={() => handleMarkCollected(transaction.id)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        Mark Collected
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Payments;