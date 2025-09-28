import React, { useState } from 'react';
import { Plus, Search, Filter, Car, User, Calendar, DollarSign, Clock, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebaseData, useAssignments } from '@/hooks/useFirebaseData';
import { Assignment } from '@/types/user';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddAssignmentForm from '@/components/Forms/AddAssignmentForm';
import { useNavigate } from 'react-router-dom';

const Assignments: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const { userInfo } = useAuth();
  const { vehicles, drivers } = useFirebaseData();
  const { assignments, loading, addAssignment } = useAssignments();

  // Filter assignments based on search and status
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.driverId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Separate active and ended assignments
  const activeAssignments = filteredAssignments.filter(a => a.status === 'active');
  const endedAssignments = filteredAssignments.filter(a => a.status === 'ended');

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

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.vehicleName || vehicle.make + ' ' + vehicle.model} (${vehicle.registrationNumber})` : vehicleId;
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : driverId;
  };

  const calculateDuration = (startDate: Date, endDate: Date | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      return `${months}m ${remainingDays}d`;
    } else {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return `${years}y ${months}m`;
    }
  };

  const calculateTotalEarnings = (assignment: Assignment) => {
    const startDate = new Date(assignment.startDate);
    const endDate = assignment.endDate ? new Date(assignment.endDate) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) * assignment.weeklyRent;
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Assignments</h1>
          <p className="text-gray-600">Manage vehicle-driver assignments and rental agreements</p>
        </div>
        <AddItemModal
          title="Create New Assignment"
          buttonText="New Assignment"
          isOpen={showAddModal}
          onOpenChange={setShowAddModal}
        >
          <div className="p-4">
            <p className="text-center text-gray-600">Assignment form will be created next</p>
            <Button onClick={handleAddSuccess} className="w-full mt-4">Close</Button>
          </div>
        </AddItemModal>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{assignments.length}</div>
            <div className="text-sm text-gray-600">Total Assignments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{activeAssignments.length}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{endedAssignments.length}</div>
            <div className="text-sm text-gray-600">Ended</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              ₹{activeAssignments.reduce((sum, a) => sum + ((a.weeklyRent * 52) / 12), 0).toFixed(0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Monthly Revenue</div>
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
      </div>

      {/* Assignment Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeAssignments.length})</TabsTrigger>
          <TabsTrigger value="previous">Previous ({endedAssignments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Car className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active assignments</h3>
                <p className="text-gray-500 mb-4">
                  Start by creating your first vehicle assignment.
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Assignment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Car className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-lg">{getVehicleName(assignment.vehicleId)}</h3>
                          </div>
                          <Badge className={getStatusColor(assignment.status)}>
                            {assignment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">Driver</div>
                              <div className="text-gray-600">{getDriverName(assignment.driverId)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">Weekly Rent</div>
                              <div className="text-gray-600">₹{assignment.weeklyRent.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">Collection Day</div>
                              <div className="text-gray-600">
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][assignment.collectionDay]}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">Duration</div>
                              <div className="text-gray-600">{calculateDuration(assignment.startDate, assignment.endDate)}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium text-green-900">Total Earnings</div>
                            <div className="text-green-700">₹{calculateTotalEarnings(assignment).toLocaleString()}</div>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-green-900">Monthly Income</div>
                            <div className="text-green-700">₹{((assignment.weeklyRent * 52) / 12).toFixed(0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/assignments/${assignment.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="previous" className="space-y-4">
          {endedAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No previous assignments</h3>
                <p className="text-gray-500">Completed assignments will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {endedAssignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Car className="w-5 h-5 text-gray-600" />
                            <h3 className="font-semibold text-lg">{getVehicleName(assignment.vehicleId)}</h3>
                          </div>
                          <Badge className={getStatusColor(assignment.status)}>
                            {assignment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">Driver</div>
                              <div className="text-gray-600">{getDriverName(assignment.driverId)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">Start Date</div>
                              <div className="text-gray-600">{new Date(assignment.startDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">End Date</div>
                              <div className="text-gray-600">
                                {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">Total Earned</div>
                              <div className="text-gray-600">₹{calculateTotalEarnings(assignment).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/assignments/${assignment.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assignments;