import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Fuel, Filter, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddFuelRecordForm from '@/components/Forms/AddFuelRecordForm';

const FuelRecords: React.FC = () => {
  const { vehicles, drivers, expenses, loading } = useFirebaseData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter fuel expenses from the expenses collection
  const fuelRecords = expenses.filter(expense => 
    expense.description.toLowerCase().includes('fuel') || 
    expense.description.toLowerCase().includes('petrol') ||
    expense.description.toLowerCase().includes('diesel')
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
  const totalFuelCost = fuelRecords.reduce((sum, record) => sum + record.amount, 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthRecords = fuelRecords.filter(record => {
    const recordDate = new Date(record.createdAt);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  const thisMonthCost = thisMonthRecords.reduce((sum, record) => sum + record.amount, 0);
  const averageCostPerRecord = fuelRecords.length > 0 ? totalFuelCost / fuelRecords.length : 0;

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
          <h1 className="text-3xl font-bold">Fuel Records</h1>
          <p className="text-muted-foreground mt-2">Track fuel consumption and costs for better fleet management</p>
        </div>
        <AddItemModal
          title="Add Fuel Record"
          buttonText="Add Fuel Record"
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <AddFuelRecordForm onSuccess={() => setIsModalOpen(false)} />
        </AddItemModal>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalFuelCost.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Cost</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{thisMonthCost.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(averageCostPerRecord).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fuelRecords.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Records</CardTitle>
          <CardDescription>
            Complete fuel consumption history with cost analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fuelRecords.length === 0 ? (
            <div className="text-center py-8">
              <Fuel className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No fuel records</h3>
              <p className="mt-1 text-sm text-gray-500">Start tracking fuel consumption by adding your first record.</p>
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
                {fuelRecords.map((record) => (
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

export default FuelRecords;