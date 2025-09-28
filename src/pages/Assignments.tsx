import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Assignment } from '@/types/user';

const Assignments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { userInfo } = useAuth();

  // Mock data - replace with actual Firestore data
  const assignments: Assignment[] = [
    {
      id: 'assignment_001',
      vehicleId: 'vehicle_001',
      driverId: 'driver_001',
      startDate: new Date('2025-01-15'),
      endDate: null,
      dailyRent: 1500,
      weeklyRent: 10500, // dailyRent * 7
      collectionDay: 6, // Saturday (0=Sunday, 6=Saturday)
      initialOdometer: 30000,
      status: 'active',
      companyId: 'carrental'
    },
    {
      id: 'assignment_002',
      vehicleId: 'vehicle_002',
      driverId: 'driver_002',
      startDate: new Date('2025-01-10'),
      endDate: null,
      dailyRent: 1200,
      weeklyRent: 8400, // dailyRent * 7
      collectionDay: 0, // Sunday (0=Sunday, 6=Saturday)
      initialOdometer: 45000,
      status: 'active',
      companyId: 'carrental'
    }
  ];

  const loading = false;
  const error = null;

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.driverId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading assignments: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Assignments</h1>
          <p className="text-gray-600">Manage vehicle-driver assignments and rental terms</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Assignment
        </Button>
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
          <option value="active">Active</option>
          <option value="ended">Ended</option>
          <option value="idle">Idle</option>
        </select>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No assignments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">Vehicle: {assignment.vehicleId}</h3>
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Driver:</span> {assignment.driverId}
                      </div>
                      <div>
                        <span className="font-medium">Daily Rent:</span> ₹{assignment.dailyRent}
                      </div>
                      <div>
                        <span className="font-medium">Weekly Rent:</span> ₹{assignment.weeklyRent}
                      </div>
                      <div>
                        <span className="font-medium">Collection Day:</span> {
                          ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][assignment.collectionDay]
                        }
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Start Date:</span> {assignment.startDate.toLocaleString()}
                      {assignment.endDate && (
                        <span className="ml-4"><span className="font-medium">End Date:</span> {assignment.endDate.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    {assignment.status === 'active' && (
                      <Button variant="destructive" size="sm">
                        End Assignment
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

export default Assignments;