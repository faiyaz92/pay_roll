import React, { useState } from 'react';
import { Plus, Search, Filter, Car, User, Calendar, DollarSign, Clock, Eye, Edit, Trash2, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebaseData, useAssignments } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';
import { Assignment } from '@/types/user';
import AddItemModal from '@/components/Modals/AddItemModal';
// If the file exists at src/components/Forms/AddAssignmentForm.tsx, ensure it is exported as default.
// If the file is in a different location, update the import path accordingly, for example:
import AddAssignmentForm from '../components/Forms/AddAssignmentForm';
// Or, if the file is named differently or in another folder, update the path to match the actual file location.
import { useNavigate } from 'react-router-dom';

const Assignments: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const { userInfo } = useAuth();
  const { vehicles, drivers, payments } = useFirebaseData();
  const { assignments, loading, addAssignment, updateAssignment, deleteAssignment } = useAssignments();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

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

  // Fix the instanceof check for dates - Firebase dates might be Timestamp objects
  const calculateDuration = (startDate: Date | string | { toDate(): Date }, endDate: Date | string | { toDate(): Date } | null) => {
    try {
      const start = startDate && typeof (startDate as any).toDate === 'function' 
        ? (startDate as { toDate(): Date }).toDate() 
        : (startDate instanceof Date ? startDate : new Date(startDate as string));
      const end = endDate 
        ? (endDate && typeof (endDate as any).toDate === 'function' 
            ? (endDate as { toDate(): Date }).toDate() 
            : (endDate instanceof Date ? endDate : new Date(endDate as string)))
        : new Date();
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return '0 days';
      }
      
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
    } catch (error) {
      console.error('Error calculating duration:', error);
      return '0 days';
    }
  };

  const calculateTotalEarnings = (assignment: Assignment) => {
    // Use actual payment records instead of estimated calculations
    const assignmentPayments = payments.filter(payment => 
      payment.assignmentId === assignment.id && payment.status === 'paid'
    );
    
    return assignmentPayments.reduce((total, payment) => total + payment.amountPaid, 0);
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
          <AddAssignmentForm onSuccess={handleAddSuccess} />
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
              {activeAssignments.map((assignment) => {
                const vehicle = vehicles.find(v => v.id === assignment.vehicleId);
                const driver = drivers.find(d => d.id === assignment.driverId);
                
                return (
                  <Card key={assignment.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          {/* Vehicle Image */}
                          <div className="relative">
                            {vehicle?.images?.front ? (
                              <img 
                                src={vehicle.images.front} 
                                alt="Vehicle" 
                                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                                <Car className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <Badge 
                              className={`absolute -top-2 -right-2 ${getStatusColor(assignment.status)} text-xs`}
                            >
                              {assignment.status}
                            </Badge>
                          </div>
                          
                          {/* Vehicle & Assignment Info */}
                          <div className="flex-1 space-y-1">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {getVehicleName(assignment.vehicleId)}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>Assigned to {getDriverName(assignment.driverId)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Started {
                                  (() => {
                                    try {
                                      const date = assignment.startDate instanceof Date ? assignment.startDate : new Date(assignment.startDate);
                                      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                                    } catch {
                                      return 'Invalid Date';
                                    }
                                  })()
                                }</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{calculateDuration(assignment.startDate, assignment.endDate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/assignments/${assignment.id}`)}
                            className="hover:bg-blue-50 hover:border-blue-200"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="hover:bg-gray-50"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (!window.confirm('Are you sure you want to delete this assignment? This cannot be undone.')) return;
                              try {
                                await deleteAssignment(assignment.id);
                                toast({ title: 'Assignment Deleted', description: 'Assignment removed successfully.' });
                              } catch (error) {
                                console.error('Error deleting assignment:', error);
                                toast({ title: 'Delete Failed', description: 'Could not delete assignment.', variant: 'destructive' });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Driver Details Card */}
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Driver Avatar */}
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={driver?.photoUrl} alt={driver?.name} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {driver?.name?.charAt(0) || 'D'}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <Label className="text-xs text-gray-500 uppercase">Driver Name</Label>
                                <p className="font-medium">{driver?.name || 'Unknown Driver'}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 uppercase">Phone</Label>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <p className="font-medium text-sm">{driver?.phone || 'N/A'}</p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 uppercase">License</Label>
                                <p className="font-medium text-sm">{driver?.licenseNumber || 'N/A'}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 uppercase">Collection Day</Label>
                                <p className="font-medium text-sm">
                                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][assignment.collectionDay]}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Financial Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4 text-center">
                            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                            <div className="text-lg font-bold text-green-900">
                              ₹{assignment.weeklyRent.toLocaleString()}
                            </div>
                            <div className="text-xs text-green-600">Weekly Rent</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4 text-center">
                            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                            <div className="text-lg font-bold text-blue-900">
                              ₹{((assignment.weeklyRent * 52) / 12).toFixed(0).toLocaleString()}
                            </div>
                            <div className="text-xs text-blue-600">Monthly Revenue</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-purple-50 border-purple-200">
                          <CardContent className="p-4 text-center">
                            <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                            <div className="text-lg font-bold text-purple-900">
                              ₹{calculateTotalEarnings(assignment).toLocaleString()}
                            </div>
                            <div className="text-xs text-purple-600">Total Earned</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-orange-50 border-orange-200">
                          <CardContent className="p-4 text-center">
                            <Clock className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                            <div className="text-lg font-bold text-orange-900">
                              {Math.floor(calculateTotalEarnings(assignment) / assignment.weeklyRent)}
                            </div>
                            <div className="text-xs text-orange-600">Weeks Active</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Vehicle Info */}
                      {vehicle && (
                        <Card className="bg-gray-50 border-gray-200">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-gray-500 uppercase">Make & Model</Label>
                                <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 uppercase">Year</Label>
                                <p className="font-medium">{vehicle.year}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 uppercase">Odometer</Label>
                                <p className="font-medium">{vehicle.odometer.toLocaleString()} km</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 uppercase">Initial Reading</Label>
                                <p className="font-medium">{assignment.initialOdometer.toLocaleString()} km</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
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
              {endedAssignments.map((assignment) => {
                const vehicle = vehicles.find(v => v.id === assignment.vehicleId);
                const driver = drivers.find(d => d.id === assignment.driverId);
                
                return (
                  <Card key={assignment.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-gray-400">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          {/* Vehicle Image */}
                          <div className="relative grayscale">
                            {vehicle?.images?.front ? (
                              <img 
                                src={vehicle.images.front} 
                                alt="Vehicle" 
                                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                                <Car className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <Badge 
                              className={`absolute -top-2 -right-2 ${getStatusColor(assignment.status)} text-xs`}
                            >
                              {assignment.status}
                            </Badge>
                          </div>
                          
                          {/* Vehicle & Assignment Info */}
                          <div className="flex-1 space-y-1">
                            <h3 className="text-xl font-semibold text-gray-700">
                              {getVehicleName(assignment.vehicleId)}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>Was assigned to {getDriverName(assignment.driverId)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{
                                  (() => {
                                    try {
                                      const startDate = assignment.startDate instanceof Date ? assignment.startDate : new Date(assignment.startDate);
                                      const endDate = assignment.endDate 
                                        ? (assignment.endDate instanceof Date ? assignment.endDate : new Date(assignment.endDate))
                                        : null;
                                      
                                      const startStr = isNaN(startDate.getTime()) ? 'Invalid Date' : startDate.toLocaleDateString();
                                      const endStr = endDate 
                                        ? (isNaN(endDate.getTime()) ? 'Invalid Date' : endDate.toLocaleDateString())
                                        : 'Ongoing';
                                      
                                      return `${startStr} - ${endStr}`;
                                    } catch {
                                      return 'Invalid Date - Invalid Date';
                                    }
                                  })()
                                }</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{calculateDuration(assignment.startDate, assignment.endDate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/assignments/${assignment.id}`)}
                            className="hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View History
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Assignment Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-gray-50 border-gray-200">
                          <CardContent className="p-4 text-center">
                            <DollarSign className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                            <div className="text-lg font-bold text-gray-700">
                              ₹{assignment.weeklyRent.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Weekly Rent</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-50 border-gray-200">
                          <CardContent className="p-4 text-center">
                            <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                            <div className="text-lg font-bold text-gray-700">
                              {payments.filter(p => p.assignmentId === assignment.id && p.status === 'paid').length}
                            </div>
                            <div className="text-xs text-gray-500">Total Weeks</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-50 border-gray-200">
                          <CardContent className="p-4 text-center">
                            <DollarSign className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                            <div className="text-lg font-bold text-gray-700">
                              ₹{calculateTotalEarnings(assignment).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Total Earned</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-50 border-gray-200">
                          <CardContent className="p-4 text-center">
                            <Clock className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                            <div className="text-lg font-bold text-gray-700">
                              {assignment.endDate ? 'Completed' : 'Ongoing'}
                            </div>
                            <div className="text-xs text-gray-500">Status</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Driver & Vehicle Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-gray-50 border-gray-200">
                          <CardContent className="p-4">
                            <h4 className="font-medium text-gray-700 mb-2">Driver Details</h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex justify-between">
                                <span>Name:</span>
                                <span className="font-medium">{driver?.name || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>License:</span>
                                <span className="font-medium">{driver?.licenseNumber || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Collection Day:</span>
                                <span className="font-medium">
                                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][assignment.collectionDay]}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-50 border-gray-200">
                          <CardContent className="p-4">
                            <h4 className="font-medium text-gray-700 mb-2">Vehicle Details</h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex justify-between">
                                <span>Make & Model:</span>
                                <span className="font-medium">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Year:</span>
                                <span className="font-medium">{vehicle?.year || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Initial Odometer:</span>
                                <span className="font-medium">{assignment.initialOdometer.toLocaleString()} km</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <AddItemModal
          title={`Edit Assignment - ${selectedAssignment.id}`}
          buttonText="Edit Assignment"
          isOpen={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open) setSelectedAssignment(null);
          }}
        >
          <AddAssignmentForm
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedAssignment(null);
            }}
            assignment={selectedAssignment}
            mode="edit"
          />
        </AddItemModal>
      )}
    </div>
  );
};

export default Assignments;