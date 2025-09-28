import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Car, 
  Search, 
  Eye, 
  Edit, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CreditCard,
  Calendar,
  Fuel
} from 'lucide-react';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddVehicleForm from '@/components/Forms/AddVehicleForm';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { toast } from '@/hooks/use-toast';

const Vehicles: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { vehicles, vehiclesWithFinancials, loading, deleteVehicle } = useFirebaseData();
  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(vehicleId);
        toast({ title: 'Vehicle Deleted', description: 'Vehicle has been deleted successfully.' });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to delete vehicle', variant: 'destructive' });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { 
        color: 'bg-green-500 hover:bg-green-600', 
        text: 'Available',
        icon: <Car className="h-4 w-4" />
      },
      rented: { 
        color: 'bg-blue-500 hover:bg-blue-600', 
        text: 'Rented',
        icon: <DollarSign className="h-4 w-4" />
      },
      maintenance: { 
        color: 'bg-red-500 hover:bg-red-600', 
        text: 'Maintenance',
        icon: <AlertCircle className="h-4 w-4" />
      },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const getFinancialStatusBadge = (financialStatus: string) => {
    const statusConfig = {
      cash: { 
        color: 'bg-emerald-500 hover:bg-emerald-600', 
        text: 'Cash Purchase',
        icon: <TrendingUp className="h-4 w-4" />
      },
      loan_active: { 
        color: 'bg-yellow-500 hover:bg-yellow-600', 
        text: 'Loan Active',
        icon: <CreditCard className="h-4 w-4" />
      },
      loan_cleared: { 
        color: 'bg-purple-500 hover:bg-purple-600', 
        text: 'Loan Cleared',
        icon: <Calendar className="h-4 w-4" />
      },
    };
    
    const config = statusConfig[financialStatus as keyof typeof statusConfig] || statusConfig.cash;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const calculateMonthlyProfit = (vehicle: any) => {
    // Use real financial data from enhanced hook
    return vehicle.financialData?.monthlyProfit || 0;
  };

  const calculateROI = (vehicle: any) => {
    // Use real ROI calculation from enhanced hook
    return vehicle.financialData?.currentROI || 0;
  };

  const getCurrentMonthlyRent = (vehicle: any) => {
    // Only show rent if vehicle is actually rented
    return vehicle.financialData?.isCurrentlyRented ? vehicle.financialData?.monthlyRent || 0 : 0;
  };

  const filteredVehicles = vehiclesWithFinancials.filter(vehicle => {
    const matchesSearch = 
      vehicle.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getVehicleStats = () => {
    const total = vehicles.length;
    const available = vehicles.filter(v => v.status === 'available').length;
    const rented = vehicles.filter(v => v.status === 'rented').length;
    const maintenance = vehicles.filter(v => v.status === 'maintenance').length;
    const loanActive = vehicles.filter(v => v.financialStatus === 'loan_active').length;
    
    return { total, available, rented, maintenance, loanActive };
  };

  const stats = getVehicleStats();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading vehicles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="h-8 w-8 text-blue-600" />
            Fleet Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your rental vehicle fleet with comprehensive financial tracking
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Fleet Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Fleet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.rented}</div>
            <div className="text-sm text-gray-600">Rented</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.loanActive}</div>
            <div className="text-sm text-gray-600">Loan Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.maintenance}</div>
            <div className="text-sm text-gray-600">Maintenance</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by vehicle name, registration, or make/model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="rented">Rented</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600 mb-4">
              {vehicles.length === 0 
                ? "Get started by adding your first vehicle to the fleet."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {vehicles.length === 0 && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Vehicle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-1">
                      {vehicle.vehicleName || `${vehicle.make} ${vehicle.model}`}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {vehicle.year} • {vehicle.registrationNumber}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(vehicle.status)}
                    {getFinancialStatusBadge(vehicle.financialStatus || 'cash')}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Investment</div>
                    <div className="font-semibold text-blue-600">
                      ₹{vehicle.initialInvestment?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      {vehicle.financialData?.isCurrentlyRented ? "Monthly Rent" : "Current Value"}
                    </div>
                    <div className={`font-semibold ${vehicle.financialData?.isCurrentlyRented ? 'text-green-600' : ''}`}>
                      {vehicle.financialData?.isCurrentlyRented 
                        ? `₹${Math.round(getCurrentMonthlyRent(vehicle)).toLocaleString()}`
                        : `₹${vehicle.residualValue?.toLocaleString() || 'N/A'}`
                      }
                    </div>
                  </div>
                </div>

                {/* Rental Status */}
                {vehicle.financialData?.isCurrentlyRented ? (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Currently Rented</span>
                    </div>
                    <div className="text-xs text-green-600">
                      Generating ₹{Math.round(getCurrentMonthlyRent(vehicle)).toLocaleString()}/month
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Available for Rental</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      No rental income currently
                    </div>
                  </div>
                )}

                {/* Financial Performance */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Profit</span>
                    <span className={`font-medium ${
                      calculateMonthlyProfit(vehicle) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {vehicle.financialData?.isCurrentlyRented 
                        ? `₹${Math.round(calculateMonthlyProfit(vehicle)).toLocaleString()}`
                        : 'Not Rented'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ROI</span>
                    <span className={`font-medium ${
                      calculateROI(vehicle) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateROI(vehicle).toFixed(1)}%
                    </span>
                  </div>
                  {vehicle.financialData && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Earnings</span>
                      <span className="font-medium text-green-600">
                        ₹{vehicle.financialData.totalEarnings.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Loan Progress (if applicable) */}
                {vehicle.financingType === 'loan' && vehicle.loanDetails && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">EMI Progress</span>
                      <span className="text-sm font-medium">
                        {vehicle.loanDetails.paidInstallments?.length || 0} / {vehicle.loanDetails.totalInstallments}
                      </span>
                    </div>
                    <Progress 
                      value={((vehicle.loanDetails.paidInstallments?.length || 0) / vehicle.loanDetails.totalInstallments) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Outstanding:</span>
                      <span className="font-medium text-red-600">
                        ₹{(vehicle.financialData?.outstandingLoan || 0).toLocaleString()}
                      </span>
                    </div>
                    {vehicle.financialData?.nextEMIDue && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Next EMI:</span>
                        <span className={`${vehicle.financialData.daysUntilEMI <= 7 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {vehicle.financialData.daysUntilEMI >= 0 ? 
                            `${vehicle.financialData.daysUntilEMI} days` : 
                            'Overdue'
                          }
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Vehicle Details */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Fuel className="h-4 w-4" />
                    {vehicle.odometer?.toLocaleString() || 'N/A'} km
                  </div>
                  {vehicle.needsMaintenance && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Maintenance Due
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Handle edit - you can implement edit modal or navigate to edit page
                      console.log('Edit vehicle:', vehicle.id);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <AddItemModal
        isOpen={showAddModal}
        onOpenChange={setShowAddModal}
        title="Add New Vehicle to Fleet"
        buttonText="Add Vehicle"
      >
        <AddVehicleForm onSuccess={() => setShowAddModal(false)} />
      </AddItemModal>
    </div>
  );
};

export default Vehicles;
