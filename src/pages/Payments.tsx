import React, { useState } from 'react';
import { Search, Calendar, Clock, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Payment } from '@/types/user';

const Payments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { userInfo } = useAuth();

  // Mock data - replace with actual Firestore data
  const payments: Payment[] = [
    {
      id: 'pay_001',
      assignmentId: 'assign_001',
      vehicleId: 'vehicle_001',
      driverId: 'driver_001',
      weekStart: new Date('2025-09-22'),
      amountDue: 3500,
      amountPaid: 3500,
      paidAt: new Date('2025-09-27'),
      collectionDate: new Date('2025-09-27'),
      nextDueDate: new Date('2025-09-29'),
      daysLeft: 2,
      status: 'paid',
      companyId: 'carrental'
    },
    {
      id: 'pay_002',
      assignmentId: 'assign_002',
      vehicleId: 'vehicle_002',
      driverId: 'driver_002',
      weekStart: new Date('2025-09-22'),
      amountDue: 4000,
      amountPaid: 0,
      paidAt: null,
      collectionDate: null,
      nextDueDate: new Date('2025-09-29'),
      daysLeft: 2,
      status: 'due',
      companyId: 'carrental'
    }
  ];

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.driverId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'due':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'due':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysLeftDisplay = (payment: Payment) => {
    if (payment.status === 'paid') return 'Paid';
    if (payment.daysLeft > 0) return `${payment.daysLeft} days left`;
    if (payment.daysLeft === 0) return 'Due today';
    return `Overdue by ${Math.abs(payment.daysLeft)} days`;
  };

  const handleMarkCollected = (paymentId: string) => {
    // Handle marking payment as collected
    console.log('Marking payment as collected:', paymentId);
    // TODO: Implement Firestore update
  };

  const totalDue = filteredPayments
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + p.amountDue, 0);

  const totalCollected = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amountPaid, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Rent Payments</h1>
          <p className="text-gray-600">Track and collect weekly rental payments from drivers</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">₹{totalCollected.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <p className="text-2xl font-bold text-yellow-600">₹{totalDue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredPayments.filter(p => p.status === 'due').length} Due
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by vehicle or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="due">Due</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No payments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <h3 className="font-semibold text-lg">
                          {payment.vehicleId} - {payment.driverId}
                        </h3>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                      <span className="text-sm font-medium text-gray-600">
                        {getDaysLeftDisplay(payment)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Week Start:</span>{' '}
                        {payment.weekStart.toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Amount Due:</span> ₹{payment.amountDue}
                      </div>
                      <div>
                        <span className="font-medium">Amount Paid:</span> ₹{payment.amountPaid}
                      </div>
                      <div>
                        <span className="font-medium">Next Due:</span>{' '}
                        {payment.nextDueDate.toLocaleDateString()}
                      </div>
                    </div>

                    {payment.collectionDate && (
                      <div className="text-sm text-green-600">
                        <span className="font-medium">Collected on:</span>{' '}
                        {payment.collectionDate.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {payment.status === 'due' || payment.status === 'overdue' ? (
                      <Button 
                        onClick={() => handleMarkCollected(payment.id)}
                        className="bg-green-600 hover:bg-green-700"
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