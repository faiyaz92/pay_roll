import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { collection, doc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { RotateCcw, Eye, Filter, Search, Calendar, Car, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Vehicle } from '@/types/user';

interface AccountingTransaction {
  id: string;
  vehicleId: string;
  type: 'gst_payment' | 'service_charge' | 'partner_payment' | 'owner_payment';
  amount: number;
  month: string;
  description: string;
  status: 'pending' | 'completed' | 'reversed';
  createdAt: string | any; // Can be ISO string or Firestore Timestamp
  completedAt?: string | any;
  reversedAt?: string | any;
}

interface CompanyFinancialData {
  selectedYear: string;
  selectedMonth: string;
  selectedQuarter: string;
  filterType: 'yearly' | 'quarterly' | 'monthly';
  partnerFilter: string;
  selectedPartner: string;
  periodLabel: string;
  monthName: string;
  totalEarnings: number;
  totalExpenses: number;
  totalProfit: number;
  totalVehicles: number;
  activeVehicles: number;
  vehicleData: any[];
  payments: any[];
  expenses: any[];
}

interface AccountingTransactionsTabProps {
  accountingTransactions: AccountingTransaction[];
  setAccountingTransactions: React.Dispatch<React.SetStateAction<AccountingTransaction[]>>;
  vehicles: Vehicle[];
  companyFinancialData: CompanyFinancialData;
}

const AccountingTransactionsTab: React.FC<AccountingTransactionsTabProps> = ({
  accountingTransactions,
  setAccountingTransactions,
  vehicles,
  companyFinancialData
}) => {
  const { userInfo } = useAuth();
  const { toast } = useToast();

  console.log('AccountingTransactionsTab component mounted/updated');
  console.log('Props received:', { accountingTransactions, vehicles, companyFinancialData });

  // Debug: Log transactions when they change
  React.useEffect(() => {
    console.log('AccountingTransactionsTab received transactions:', accountingTransactions);
    console.log('AccountingTransactionsTab - accountingTransactions length:', accountingTransactions.length);
    console.log('AccountingTransactionsTab - vehicles length:', vehicles.length);
    if (accountingTransactions.length > 0) {
      console.log('First transaction sample:', {
        id: accountingTransactions[0].id,
        status: accountingTransactions[0].status,
        createdAt: accountingTransactions[0].createdAt,
        createdAtType: typeof accountingTransactions[0].createdAt,
        createdAtIsObject: typeof accountingTransactions[0].createdAt === 'object',
        createdAtHasToDate: accountingTransactions[0].createdAt && typeof accountingTransactions[0].createdAt === 'object' && 'toDate' in accountingTransactions[0].createdAt
      });
    }
  }, [accountingTransactions, vehicles]);

  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // State for undo confirmation dialog
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [transactionToUndo, setTransactionToUndo] = useState<AccountingTransaction | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // Get vehicle name by ID
  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? {
      name: vehicle.vehicleName || `${vehicle.make} ${vehicle.model}`,
      registrationNumber: vehicle.registrationNumber
    } : { name: 'Unknown Vehicle', registrationNumber: 'N/A' };
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const getVehicleInfoLocal = (vehicleId: string) => {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      return vehicle ? {
        name: vehicle.vehicleName || `${vehicle.make} ${vehicle.model}`,
        registrationNumber: vehicle.registrationNumber
      } : { name: 'Unknown Vehicle', registrationNumber: 'N/A' };
    };

    const filtered = accountingTransactions.filter(transaction => {
      // Status filter
      if (statusFilter !== 'all' && transaction.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;

      // Search filter (vehicle registration or description)
      if (searchTerm) {
        const vehicleInfo = getVehicleInfoLocal(transaction.vehicleId);
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          vehicleInfo.registrationNumber.toLowerCase().includes(searchLower) ||
          vehicleInfo.name.toLowerCase().includes(searchLower) ||
          transaction.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        // Handle both Firestore Timestamp objects and ISO strings
        const transactionDate = transaction.createdAt && typeof transaction.createdAt === 'object' && 'toDate' in transaction.createdAt
          ? transaction.createdAt.toDate()
          : new Date(transaction.createdAt);

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (transactionDate < fromDate) return false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (transactionDate > toDate) return false;
        }
      }

      return true;
    });

    console.log('AccountingTransactionsTab - filteredTransactions:', filtered);
    console.log('AccountingTransactionsTab - filters:', { statusFilter, typeFilter, searchTerm, dateFrom, dateTo });

    return filtered;
  }, [accountingTransactions, statusFilter, typeFilter, searchTerm, dateFrom, dateTo, vehicles]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'reversed':
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />Reversed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get type display name
  const getTypeDisplayName = (type: string) => {
    const typeMap = {
      gst_payment: 'GST Payment',
      service_charge: 'Service Charge',
      partner_payment: 'Partner Payment',
      owner_payment: 'Owner Payment'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // Get type color
  const getTypeColor = (type: string) => {
    const colorMap = {
      gst_payment: 'bg-orange-100 text-orange-800',
      service_charge: 'bg-blue-100 text-blue-800',
      partner_payment: 'bg-purple-100 text-purple-800',
      owner_payment: 'bg-green-100 text-green-800'
    };
    return colorMap[type as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  // Handle undo transaction
  const handleUndoTransaction = async () => {
    if (!transactionToUndo || !userInfo?.companyId) return;

    setIsUndoing(true);
    try {
      // Update transaction status to reversed
      const transactionRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`, transactionToUndo.id);
      await updateDoc(transactionRef, {
        status: 'reversed',
        reversedAt: new Date().toISOString(),
        completedAt: new Date().toISOString() // Update completedAt as last updated timestamp
      });

      // Reverse cash balance updates (add back the deducted amount)
      const cashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cashInHand`, transactionToUndo.vehicleId);
      await setDoc(cashRef, {
        balance: increment(transactionToUndo.amount) // Add back the amount
      }, { merge: true });

      const companyCashRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/companyCashInHand`, 'main');
      await setDoc(companyCashRef, {
        balance: increment(transactionToUndo.amount), // Add back the amount
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Update local state
      setAccountingTransactions(prev => prev.map(t =>
        t.id === transactionToUndo.id
          ? { ...t, status: 'reversed' as const, reversedAt: new Date().toISOString(), completedAt: new Date().toISOString() }
          : t
      ));

      toast({
        title: 'Transaction Reversed',
        description: `${getTypeDisplayName(transactionToUndo.type)} of ₹${transactionToUndo.amount.toLocaleString()} has been reversed`,
      });

      setUndoDialogOpen(false);
      setTransactionToUndo(null);
    } catch (error) {
      console.error('Error undoing transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to reverse transaction',
        variant: 'destructive'
      });
    } finally {
      setIsUndoing(false);
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      totalTransactions: filteredTransactions.length,
      completedTransactions: filteredTransactions.filter(t => t.status === 'completed').length,
      reversedTransactions: filteredTransactions.filter(t => t.status === 'reversed').length,
      totalAmount: filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
      completedAmount: filteredTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
      reversedAmount: filteredTransactions.filter(t => t.status === 'reversed').reduce((sum, t) => sum + t.amount, 0)
    };
    return stats;
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* Debug Info - Remove this after fixing */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div>Transactions received: {accountingTransactions.length}</div>
            <div>Filtered transactions: {filteredTransactions.length}</div>
            <div>Vehicles available: {vehicles.length}</div>
            <div>Current filters: Status={statusFilter}, Type={typeFilter}, Search="{searchTerm}", Date={dateFrom}-{dateTo}</div>
            {accountingTransactions.length > 0 && (
              <div>First transaction: ID={accountingTransactions[0].id}, Status={accountingTransactions[0].status}, Vehicle={accountingTransactions[0].vehicleId}</div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Accounting Transactions
          </CardTitle>
          <CardDescription>
            View and manage all accounting transactions. Easily reverse completed payments to correct errors.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{summaryStats.totalTransactions}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{summaryStats.completedAmount.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Reversed Amount</p>
                <p className="text-2xl font-bold text-red-600">₹{summaryStats.reversedAmount.toLocaleString()}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reversed">Reversed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium">Transaction Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gst_payment">GST Payment</SelectItem>
                  <SelectItem value="service_charge">Service Charge</SelectItem>
                  <SelectItem value="partner_payment">Partner Payment</SelectItem>
                  <SelectItem value="owner_payment">Owner Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Vehicle or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  console.log('Rendering transaction row:', transaction.id, transaction);
                  const vehicleInfo = getVehicleInfo(transaction.vehicleId);
                  console.log('Vehicle info for transaction:', transaction.id, vehicleInfo);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {(() => {
                          try {
                            // Handle both Firestore Timestamp objects and ISO strings
                            const createdAt = transaction.createdAt && typeof transaction.createdAt === 'object' && 'toDate' in transaction.createdAt
                              ? transaction.createdAt.toDate()
                              : new Date(transaction.createdAt);

                            if (isNaN(createdAt.getTime())) {
                              return 'Invalid Date';
                            }

                            return createdAt.toLocaleDateString();
                          } catch (error) {
                            console.error('Error formatting date for transaction:', transaction.id, error);
                            return 'Invalid Date';
                          }
                        })()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vehicleInfo.name}</div>
                          <div className="text-sm text-gray-500">{vehicleInfo.registrationNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(transaction.type)}>
                          {getTypeDisplayName(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{transaction.month}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        {transaction.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTransactionToUndo(transaction);
                              setUndoDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Undo
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Undo Confirmation Dialog */}
      <Dialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Transaction Reversal</DialogTitle>
            <DialogDescription>
              Are you sure you want to reverse this transaction? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Change the transaction status to "Reversed"</li>
                <li>Add the amount back to the vehicle cash balance</li>
                <li>Add the amount back to the company cash balance</li>
                <li>This action cannot be undone</li>
              </ul>
            </DialogDescription>
          </DialogHeader>

          {transactionToUndo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {getTypeDisplayName(transactionToUndo.type)}
                </div>
                <div>
                  <span className="font-medium">Amount:</span> ₹{transactionToUndo.amount.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Vehicle:</span> {getVehicleInfo(transactionToUndo.vehicleId).registrationNumber}
                </div>
                <div>
                  <span className="font-medium">Period:</span> {transactionToUndo.month}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUndoDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUndoTransaction}
              disabled={isUndoing}
            >
              {isUndoing ? 'Reversing...' : 'Reverse Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingTransactionsTab;