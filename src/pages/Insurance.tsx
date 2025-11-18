import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Shield, AlertTriangle, Calendar, TrendingUp, DollarSign, Clock, Edit, Eye, FileText, Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddInsuranceRecordForm from '@/components/Forms/AddInsuranceRecordForm';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';

const Insurance: React.FC = () => {
  const { vehicles, drivers, expenses, loading, updateVehicle, addExpense } = useFirebaseData();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  // Filter insurance expenses from the expenses collection using new hierarchical structure
  const insuranceRecords = expenses.filter(expense => 
    expense.expenseType === 'insurance' || // New hierarchical structure
    expense.type === 'insurance' // Backward compatibility
  );

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model})` : 'Unknown Vehicle';
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  };

  const handleViewPolicyDetails = (vehicle: any) => {
    navigate(`/insurance/${vehicle.id}`);
  };

  // Calculate insurance stats
  const totalInsuranceCost = insuranceRecords.reduce((sum, record) => sum + record.amount, 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthRecords = insuranceRecords.filter(record => {
    const recordDate = new Date(record.createdAt);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  const thisMonthCost = thisMonthRecords.reduce((sum, record) => sum + record.amount, 0);
  const averageCostPerRecord = insuranceRecords.length > 0 ? totalInsuranceCost / insuranceRecords.length : 0;

  // Calculate vehicles with expiring insurance (next 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get insurance policies grouped by vehicle and type
  const getVehicleInsurancePolicies = (vehicleId: string) => {
    const vehicleInsurances = insuranceRecords.filter(record => record.vehicleId === vehicleId);

    // Group by insurance type and get the latest record for each type
    const policiesByType: { [key: string]: any } = {};

    vehicleInsurances.forEach(record => {
      const insuranceType = record.insuranceDetails?.insuranceType || record.insuranceType || 'third_party';
      if (!policiesByType[insuranceType] ||
          new Date(record.insuranceDetails?.endDate || record.endDate) > new Date(policiesByType[insuranceType].insuranceDetails?.endDate || policiesByType[insuranceType].endDate)) {
        policiesByType[insuranceType] = record;
      }
    });

    return Object.values(policiesByType);
  };

  // Calculate expiring policies count (not vehicles)
  const expiringPoliciesCount = vehicles.reduce((count, vehicle) => {
    const policies = getVehicleInsurancePolicies(vehicle.id);
    const expiringCount = policies.filter((policy: any) => {
      const endDate = policy.insuranceDetails?.endDate || policy.endDate;
      if (endDate) {
        const expiryDate = new Date(endDate);
        return expiryDate >= now && expiryDate <= thirtyDaysFromNow;
      }
      return false;
    }).length;
    return count + expiringCount;
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Insurance Management</h1>
            <p className="text-muted-foreground mt-2">Track vehicle insurance policies and renewals</p>
          </div>
        </div>
        <div className="text-center py-8">Loading insurance records...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Insurance Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track vehicle insurance policies and renewals
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {vehicles.length} Vehicles
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ₹{totalInsuranceCost.toLocaleString()} Total Cost
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {expiringPoliciesCount} Expiring Soon
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <AddItemModal
            title={editingRecord ? "Edit Insurance Dates" : "Add Insurance Record"}
            buttonText="Add Insurance"
            isOpen={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                setEditingRecord(null);
              }
            }}
          >
            <AddInsuranceRecordForm editingRecord={editingRecord} />
          </AddItemModal>
          
          <Dialog open={isCorrectionModalOpen} onOpenChange={setIsCorrectionModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Correction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Insurance Correction
                </DialogTitle>
                <DialogDescription className="text-left">
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-orange-800 font-medium mb-2">⚠️ Important Notes:</p>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Corrections create new entries, not modify existing ones</li>
                      <li>• Use positive amounts to add to previous transactions</li>
                      <li>• Use negative amounts to subtract from previous transactions</li>
                      <li>• Always reference the original transaction ID</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600">
                    Enter the transaction ID you want to correct and the adjustment amount.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <AddInsuranceRecordForm 
                isCorrection={true} 
                onSuccess={() => setIsCorrectionModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Insurance Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Insurance Cost</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalInsuranceCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time insurance expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">This Month Cost</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{thisMonthCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Average Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(averageCostPerRecord).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per insurance record
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expiringPoliciesCount}</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Insurance Status Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Insurance Status
          </CardTitle>
          <CardDescription>
            Current insurance status and renewal dates for all vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No vehicles found</h3>
              <p className="mt-1 text-sm text-gray-500">Add vehicles to track their insurance status.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {vehicles.map((vehicle) => {
                const vehiclePolicies = getVehicleInsurancePolicies(vehicle.id);

                return (
                  <Card key={vehicle.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Car className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">
                            {vehicle.registrationNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {vehiclePolicies.length} Insurance{vehiclePolicies.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPolicyDetails(vehicle)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingRecord(null);
                            setIsModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Insurance
                        </Button>
                      </div>
                    </div>

                    {/* Insurance Policies for this vehicle */}
                    {vehiclePolicies.length === 0 ? (
                      <div className="text-center py-4 border-t">
                        <Shield className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">No insurance policies found</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setIsModalOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Insurance
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 border-t pt-4">
                        {vehiclePolicies.map((policy: any, index: number) => {
                          const endDate = policy.insuranceDetails?.endDate || policy.endDate;
                          const startDate = policy.insuranceDetails?.startDate || policy.startDate;
                          const insuranceType = policy.insuranceDetails?.insuranceType || policy.insuranceType || 'third_party';
                          const policyNumber = policy.insuranceDetails?.policyNumber || policy.policyNumber || 'N/A';
                          const provider = policy.vendor || policy.insuranceProvider || 'N/A';
                          const premium = policy.amount || policy.insurancePremium || 0;

                          const expiryDate = endDate ? new Date(endDate) : null;
                          const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                          const isExpired = daysLeft !== null && daysLeft < 0;
                          const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;

                          // Format insurance type display name
                          const getInsuranceTypeDisplay = (type: string) => {
                            const typeMap: { [key: string]: string } = {
                              'fix_insurance': 'Fix Insurance',
                              'rego': 'REGO',
                              'green_slip': 'Green Slip',
                              'pink_slip': 'Pink Slip',
                              'third_party': 'Third Party'
                            };
                            return typeMap[type] || type;
                          };

                          return (
                            <div key={`${policy.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                                  <Shield className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">
                                    {getInsuranceTypeDisplay(insuranceType)}
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    Policy: {policyNumber}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-center">
                                  <div className="text-xs text-gray-600">Provider</div>
                                  <div className="font-medium">{provider}</div>
                                </div>

                                <div className="text-center">
                                  <div className="text-xs text-gray-600">Premium</div>
                                  <div className="font-medium">₹{premium.toLocaleString()}</div>
                                </div>

                                <div className="text-center">
                                  <div className="text-xs text-gray-600">Expiry</div>
                                  <div className="font-medium">
                                    {expiryDate ? expiryDate.toLocaleDateString() : 'Not Set'}
                                  </div>
                                </div>

                                <div className="text-center">
                                  <div className="text-xs text-gray-600">Status</div>
                                  <Badge
                                    variant={
                                      isExpired ? 'destructive' :
                                      isExpiring ? 'secondary' :
                                      'default'
                                    }
                                    className="text-xs"
                                  >
                                    {isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Active'}
                                  </Badge>
                                </div>

                                <div className="text-center">
                                  <div className="text-xs text-gray-600">Days Left</div>
                                  <div className={`font-medium text-sm ${
                                    isExpired ? 'text-red-600' :
                                    isExpiring ? 'text-amber-600' :
                                    'text-green-600'
                                  }`}>
                                    {daysLeft !== null ? (
                                      isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`
                                    ) : (
                                      'Not Set'
                                    )}
                                  </div>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingRecord(policy);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance Expense History */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Expense History</CardTitle>
          <CardDescription>
            Insurance payments, renewals, and claims history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insuranceRecords.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No insurance records</h3>
              <p className="mt-1 text-sm text-gray-500">Start tracking insurance expenses by adding your first record.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insuranceRecords.map((record) => (
                  <TableRow key={record.id} className={record.isCorrection ? 'bg-yellow-50 border-yellow-200' : ''}>
                    <TableCell>
                      {new Date(record.createdAt).toLocaleDateString()}
                      {record.isCorrection && (
                        <div className="text-xs text-yellow-600 font-medium mt-1">
                          {record.correctionType === 'add' ? '↗️ Correction (+)' : '↘️ Correction (-)'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span 
                        className="font-mono text-xs bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(record.id);
                          toast({
                            title: "Copied",
                            description: "Transaction ID copied to clipboard",
                          });
                        }}
                        title="Click to copy Transaction ID"
                      >
                        {record.id.slice(0, 8)}...
                      </span>
                      {record.isCorrection && (
                        <div className="text-xs text-yellow-600 mt-1">Correction</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getVehicleName(record.vehicleId)}
                    </TableCell>
                    <TableCell>
                      {record.description}
                      {record.isCorrection && record.originalTransactionRef && (
                        <div className="text-xs text-gray-500 mt-1">
                          Ref: {record.originalTransactionRef}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={`font-medium ${record.isCorrection && record.amount < 0 ? 'text-red-600' : record.isCorrection && record.amount > 0 ? 'text-green-600' : ''}`}>
                      {record.amount < 0 ? '-' : ''}₹{Math.abs(record.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'approved' ? 'default' : record.status === 'pending' ? 'secondary' : 'destructive'}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getDriverName(record.submittedBy)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default Insurance;