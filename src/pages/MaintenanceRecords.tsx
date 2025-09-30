import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Wrench, AlertTriangle, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddMaintenanceRecordForm from '@/components/Forms/AddMaintenanceRecordForm';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';

const MaintenanceRecords: React.FC = () => {
  const { vehicles, drivers, expenses, loading } = useFirebaseData();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Handle recording maintenance expense transaction
  const handleExpenseAdded = async (expenseData: any) => {
    try {
      // Record the expense in expenses collection (for backward compatibility)
      await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        type: 'maintenance', // Keep for backward compatibility
        createdAt: new Date(),
      });

      // Record the transaction in payments collection using hierarchical structure
      await addDoc(collection(db, 'payments'), {
        vehicleId: expenseData.vehicleId,
        driverId: expenseData.driverId,
        amount: expenseData.amount,
        description: expenseData.description || `Maintenance payment - ${getVehicleName(expenseData.vehicleId)}`,
        date: expenseData.date || new Date(),
        createdAt: new Date(),
        type: 'paid',
        paymentType: 'expenses',
        expenseType: 'maintenance',
        // Additional maintenance-specific fields
        maintenanceType: expenseData.maintenanceType,
        serviceProvider: expenseData.serviceProvider,
        odometerReading: expenseData.odometerReading,
        nextDueDate: expenseData.nextDueDate,
        nextDueOdometer: expenseData.nextDueOdometer,
        status: expenseData.status,
        priority: expenseData.priority,
        receiptNumber: expenseData.receiptNumber,
        notes: expenseData.notes,
      });

      toast({
        title: "Success",
        description: "Maintenance expense recorded successfully.",
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fuel Records</h1>
            <p className="text-muted-foreground mt-2">Track fuel consumption and costs</p>
          </div>
        </div>
        <div className="text-center py-8">Loading fuel records...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Records</h1>
          <p className="text-muted-foreground mt-2">Track vehicle maintenance, repairs, and service schedules</p>
        </div>
        <AddItemModal
          title="Add Maintenance Record"
          buttonText="Add Maintenance"
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <AddMaintenanceRecordForm onSuccess={handleExpenseAdded} />
        </AddItemModal>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Maintenance Cost</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalMaintenanceCost.toLocaleString()}</div>
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
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(averageCostPerRecord).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getVehicleName(record.vehicleId)}
                    </TableCell>
                    <TableCell>
                      {record.description}
                    </TableCell>
                    <TableCell className="font-medium">₹{record.amount.toLocaleString()}</TableCell>
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

export default MaintenanceRecords;