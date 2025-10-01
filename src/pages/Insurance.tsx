import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Shield, AlertTriangle, Calendar, TrendingUp, DollarSign, Clock, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddInsuranceRecordForm from '@/components/Forms/AddInsuranceRecordForm';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';

const Insurance: React.FC = () => {
  const { vehicles, drivers, expenses, loading, updateVehicle, addExpense } = useFirebaseData();
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
  const expiringInsurance = vehicles.filter(vehicle => {
    if (vehicle.insuranceExpiryDate) {
      const expiryDate = new Date(vehicle.insuranceExpiryDate);
      return expiryDate >= now && expiryDate <= thirtyDaysFromNow;
    }
    return false;
  }).length;

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Insurance Management</h1>
          <p className="text-muted-foreground mt-2">Manage vehicle insurance policies, renewals, and claims</p>
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
            <DialogContent className="max-w-md">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insurance Cost</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalInsuranceCost.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Cost</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{thisMonthCost.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(averageCostPerRecord).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expiringInsurance}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Insurance Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Insurance Status</CardTitle>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => {
                  const expiryDate = vehicle.insuranceExpiryDate ? new Date(vehicle.insuranceExpiryDate) : null;
                  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const isExpired = daysLeft !== null && daysLeft < 0;
                  const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
                  
                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        {vehicle.registrationNumber} ({vehicle.make} {vehicle.model})
                      </TableCell>
                      <TableCell>
                        {vehicle.insurancePolicyNumber || 'Not Set'}
                      </TableCell>
                      <TableCell>
                        {vehicle.insuranceProvider || 'Not Set'}
                      </TableCell>
                      <TableCell>
                        {vehicle.insurancePremium ? `₹${vehicle.insurancePremium.toLocaleString()}` : 'Not Set'}
                      </TableCell>
                      <TableCell>
                        {expiryDate ? expiryDate.toLocaleDateString() : 'Not Set'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            isExpired ? 'destructive' : 
                            isExpiring ? 'secondary' : 
                            'default'
                          }
                        >
                          {isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {daysLeft !== null ? (
                          <span className={
                            isExpired ? 'text-red-600' : 
                            isExpiring ? 'text-amber-600' : 
                            'text-green-600'
                          }>
                            {isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                          </span>
                        ) : (
                          'Not Set'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Create a mock insurance record for editing
                            const mockRecord = {
                              id: `vehicle-${vehicle.id}`,
                              vehicleId: vehicle.id,
                              insuranceDetails: {
                                policyNumber: vehicle.insurancePolicyNumber || '',
                                endDate: vehicle.insuranceExpiryDate || '',
                              },
                              vendor: vehicle.insuranceProvider || '',
                              notes: '',
                            };
                            setEditingRecord(mockRecord);
                            setIsModalOpen(true);
                          }}
                          disabled={!vehicle.insuranceExpiryDate}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Dates
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Insurance;