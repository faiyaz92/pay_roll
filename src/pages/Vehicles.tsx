import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Fuel,
  X
} from 'lucide-react';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddVehicleForm from '@/components/Forms/AddVehicleForm';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Role } from '@/types/user';

const Vehicles: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const { vehicles, vehiclesWithFinancials, loading, deleteVehicle } = useFirebaseData();
  const handleDeleteVehicle = async (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    try {
      await deleteVehicle(vehicleToDelete.id);
      toast({ title: 'Vehicle Deleted', description: 'Vehicle has been deleted successfully.' });
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete vehicle', variant: 'destructive' });
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
      inactive: {
        color: 'bg-gray-500 hover:bg-gray-600',
        text: 'Inactive',
        icon: <X className="h-4 w-4" />
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

    // For partners, only show vehicles where they are the partner
    const matchesPartner = userInfo?.role === Role.PARTNER 
      ? (vehicle.partnerId && vehicle.partnerId === userInfo.userId)
      : true;

    return matchesSearch && matchesStatus && matchesPartner;
  });

  const getVehicleStats = () => {
    // For partners, only count their vehicles
    const relevantVehicles = userInfo?.role === Role.PARTNER 
      ? vehicles.filter(v => v.partnerId && v.partnerId === userInfo.userId)
      : vehicles;

    const total = relevantVehicles.length;
    const available = relevantVehicles.filter(v => v.status === 'available').length;
    const rented = relevantVehicles.filter(v => v.status === 'rented').length;
    const maintenance = relevantVehicles.filter(v => v.status === 'maintenance').length;
    const loanActive = relevantVehicles.filter(v => v.financialStatus === 'loan_active').length;

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            Fleet Management
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your rental vehicle fleet with comprehensive financial tracking
          </p>
        </div>

        {/* Add Vehicle Modal - Only show for admins */}
        {userInfo?.role === Role.COMPANY_ADMIN && (
          <AddItemModal
            isOpen={showAddModal}
            onOpenChange={setShowAddModal}
            title="Add New Vehicle to Fleet"
            buttonText="Add Vehicle"
          >
            <AddVehicleForm onSuccess={() => setShowAddModal(false)} />
          </AddItemModal>
        )}
      </div>

      {/* Fleet Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Fleet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-xs sm:text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.rented}</div>
            <div className="text-xs sm:text-sm text-gray-600">Rented</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.loanActive}</div>
            <div className="text-xs sm:text-sm text-gray-600">Loan Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.maintenance}</div>
            <div className="text-xs sm:text-sm text-gray-600">Maintenance</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by vehicle name, registration, or make/model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="overflow-x-auto">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-max">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-auto">
              <TabsTrigger value="all" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">All</TabsTrigger>
              <TabsTrigger value="available" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Available</TabsTrigger>
              <TabsTrigger value="rented" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Rented</TabsTrigger>
              <TabsTrigger value="maintenance" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Maintenance</TabsTrigger>
              <TabsTrigger value="inactive" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600 mb-4">
              {userInfo?.role === Role.PARTNER
                ? vehicles.length === 0
                  ? "No vehicles are currently assigned to your partnership."
                  : "No vehicles match your search criteria."
                : vehicles.length === 0
                  ? "Get started by adding your first vehicle to the fleet."
                  : "Try adjusting your search or filter criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
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

              <CardContent className="flex flex-col flex-grow">
                <div className="space-y-4 flex-grow">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-sm text-gray-600">Monthly Profit</span>
                      <span className={`font-medium ${calculateMonthlyProfit(vehicle) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {vehicle.financialData?.isCurrentlyRented
                          ? `₹${Math.round(calculateMonthlyProfit(vehicle)).toLocaleString()}`
                          : 'Not Rented'
                        }
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-sm text-gray-600">ROI</span>
                      <span className={`font-medium ${calculateROI(vehicle) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {calculateROI(vehicle).toFixed(1)}%
                      </span>
                    </div>
                    {vehicle.financialData && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-sm text-gray-600">Total Earnings</span>
                        <span className="font-medium text-green-600">
                          ₹{vehicle.financialData.totalEarnings.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Fuel className="h-4 w-4" />
                      {vehicle.odometer?.toLocaleString() || 'N/A'} km
                    </div>
                    {vehicle.needsMaintenance && (
                      <Badge variant="destructive" className="text-xs w-fit">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Maintenance Due
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Loan Progress (if applicable) - Always at same position */}
                <div className="mt-4">
                  {vehicle.financingType === 'loan' && vehicle.loanDetails ? (
                    <div className="space-y-2 bg-blue-50 p-3 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-sm text-gray-600">EMI Progress</span>
                        <span className="text-sm font-medium">
                          {vehicle.loanDetails.amortizationSchedule?.filter(emi => emi.isPaid).length || 0} / {vehicle.loanDetails.totalInstallments}
                        </span>
                      </div>
                      <Progress
                        value={((vehicle.loanDetails.amortizationSchedule?.filter(emi => emi.isPaid).length || 0) / vehicle.loanDetails.totalInstallments) * 100}
                        className="h-2"
                      />
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                        <span className="text-gray-600">Outstanding:</span>
                        <span className="font-medium text-red-600">
                          ₹{(vehicle.financialData?.outstandingLoan || 0).toLocaleString()}
                        </span>
                      </div>
                      {vehicle.financialData?.nextEMIDue && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs">
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
                  ) : (
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-emerald-700">Cash Purchase</div>
                      <div className="text-xs text-emerald-600">No EMI obligations</div>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Always at bottom */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/vehicles/${encodeURIComponent(vehicle.id)}`)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  {/* Edit and Delete buttons only for admins */}
                  {userInfo?.role === Role.COMPANY_ADMIN && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditVehicle(vehicle);
                          setEditModalOpen(true);
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Vehicle Modal - Only for admins */}
      {userInfo?.role === Role.COMPANY_ADMIN && editVehicle && (
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit Vehicle: {editVehicle.vehicleName || editVehicle.make + ' ' + editVehicle.model}
              </DialogTitle>
            </DialogHeader>
            <AddVehicleForm 
              vehicle={editVehicle} 
              onSuccess={() => setEditModalOpen(false)} 
              mode="edit" 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Vehicle Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete Vehicle
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-gray-700">
                  Are you sure you want to delete <span className="font-semibold">{vehicleToDelete?.vehicleName || vehicleToDelete?.make + ' ' + vehicleToDelete?.model}</span>?
                </p>
                <p className="text-sm text-gray-600">
                  This action cannot be undone. All associated data including assignments, payments, and financial records will be permanently removed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setVehicleToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVehicle}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Vehicle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vehicles;
