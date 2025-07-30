import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Fuel, Filter, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFuelRecords, useVehicles, useDrivers } from '@/hooks/useFirebaseData';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddFuelRecordForm from '@/components/Forms/AddFuelRecordForm';

const FuelRecords: React.FC = () => {
  const { fuelRecords, loading } = useFuelRecords();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model})` : 'Unknown Vehicle';
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  };

  const totalFuelCost = fuelRecords.reduce((sum, record) => sum + record.amount, 0);
  const totalFuelQuantity = fuelRecords.reduce((sum, record) => sum + record.quantity, 0);
  const averagePrice = totalFuelQuantity > 0 ? totalFuelCost / totalFuelQuantity : 0;

  // Group records by month for better analysis
  const monthlyStats = fuelRecords.reduce((acc, record) => {
    const month = new Date(record.addedAt).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { cost: 0, quantity: 0, count: 0 };
    }
    acc[month].cost += record.amount;
    acc[month].quantity += record.quantity;
    acc[month].count += 1;
    return acc;
  }, {} as Record<string, { cost: number; quantity: number; count: number }>);

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
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFuelQuantity.toFixed(1)}L</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averagePrice.toFixed(2)}/L</div>
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
                  <TableHead>Driver</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Quantity (L)</TableHead>
                  <TableHead>Price/L</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.addedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getVehicleName(record.vehicleId)}
                    </TableCell>
                    <TableCell>
                      {getDriverName(record.driverId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.fuelType}</Badge>
                    </TableCell>
                    <TableCell>{record.quantity}L</TableCell>
                    <TableCell>₹{record.pricePerLiter}</TableCell>
                    <TableCell className="font-medium">₹{record.amount}</TableCell>
                    <TableCell>{record.odometer.toLocaleString()} km</TableCell>
                    <TableCell>{record.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Monthly Analysis */}
      {Object.keys(monthlyStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Fuel Analysis</CardTitle>
            <CardDescription>
              Month-wise fuel consumption and cost breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Total Quantity</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Average Price/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(monthlyStats).map(([month, stats]) => {
                  const typedStats = stats as { cost: number; quantity: number; count: number };
                  return (
                    <TableRow key={month}>
                      <TableCell className="font-medium">{month}</TableCell>
                      <TableCell>{typedStats.count}</TableCell>
                      <TableCell>{typedStats.quantity.toFixed(1)}L</TableCell>
                      <TableCell>₹{typedStats.cost.toLocaleString()}</TableCell>
                      <TableCell>₹{(typedStats.cost / typedStats.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FuelRecords;