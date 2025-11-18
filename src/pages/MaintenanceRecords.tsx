import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Wrench, AlertTriangle, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddMaintenanceRecordForm from '@/components/Forms/AddMaintenanceRecordForm';
import { toast } from '@/hooks/use-toast';

const MaintenanceRecords: React.FC = () => {
  const { vehicles, drivers, expenses, loading, addExpense } = useFirebaseData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // Filter maintenance expenses from the expenses collection using new hierarchical structure
  const maintenanceRecords = expenses.filter(expense => 
    expense.expenseType === 'maintenance' || // New hierarchical structure
    expense.type === 'maintenance' // Backward compatibility
  );

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model})` : 'Unknown Vehicle';
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  };

  // Calculate quick stats for decoration
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + record.amount, 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthRecords = maintenanceRecords.filter(record => {
    const recordDate = new Date(record.createdAt);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  const thisMonthCost = thisMonthRecords.reduce((sum, record) => sum + record.amount, 0);
  const averageCostPerRecord = maintenanceRecords.length > 0 ? totalMaintenanceCost / maintenanceRecords.length : 0;
  const pendingRecords = maintenanceRecords.filter(record => record.status === 'pending').length;

  // Handle recording maintenance expense using the standard expense recording pattern
  const handleExpenseAdded = async (maintenanceRecordData: any) => {
    try {
      await addExpense(maintenanceRecordData);

      toast({
        title: "Success",
        description: maintenanceRecordData.isCorrection 
          ? "Maintenance expense correction recorded successfully." 
          : "Maintenance expense recorded successfully.",
      });

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error recording maintenance expense:', error);
      toast({
        title: "Error",
        description: "Failed to record maintenance expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Maintenance Records</h1>
            <p className="text-muted-foreground mt-2">Track vehicle maintenance, repairs, and service schedules</p>
          </div>
        </div>
        <div className="text-center py-8">Loading fuel records...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Records</h1>
          <p className="text-muted-foreground mt-2">Track vehicle maintenance, repairs, and service schedules</p>
        </div>
        <div className="flex gap-2">
          <AddItemModal
            title="Add Maintenance Record"
            buttonText="Add Maintenance"
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <AddMaintenanceRecordForm onSuccess={handleExpenseAdded} />
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
                  Maintenance Correction
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
              <AddMaintenanceRecordForm 
                onSuccess={() => setIsCorrectionModalOpen(false)} 
                isCorrection={true} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Maintenance Cost</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalMaintenanceCost.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Cost</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{thisMonthCost.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(averageCostPerRecord).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Records</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRecords}</div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
          <CardDescription>
            Complete maintenance and repair history for all vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {maintenanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No maintenance records</h3>
              <p className="mt-1 text-sm text-gray-500">Start tracking maintenance by adding your first record.</p>
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
                {maintenanceRecords.map((record) => (
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

export default MaintenanceRecords;