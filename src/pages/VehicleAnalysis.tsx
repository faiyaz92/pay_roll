import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useVehicles, useTrips, useFuelRecords, useMaintenanceRecords } from '@/hooks/useFirebaseData';
import { CalendarIcon, TrendingDownIcon, TrendingUpIcon, DollarSignIcon } from 'lucide-react';

const VehicleAnalysis: React.FC = () => {
  const { vehicles } = useVehicles();
  const { trips } = useTrips();
  const { fuelRecords } = useFuelRecords();
  const { maintenanceRecords } = useMaintenanceRecords();
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const getVehicleAnalysis = (vehicleId: string, year: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return null;

    const yearStart = new Date(`${year}-01-01`);
    const yearEnd = new Date(`${year}-12-31`);

    // Filter data for selected vehicle and year
    const vehicleTrips = trips.filter(trip => 
      trip.vehicle === vehicle.registrationNumber &&
      new Date(trip.createdAt) >= yearStart &&
      new Date(trip.createdAt) <= yearEnd
    );

    const vehicleFuelRecords = fuelRecords.filter(record => 
      record.vehicleId === vehicleId &&
      new Date(record.addedAt) >= yearStart &&
      new Date(record.addedAt) <= yearEnd
    );

    const vehicleMaintenanceRecords = maintenanceRecords.filter(record => 
      record.vehicleId === vehicleId &&
      new Date(record.addedAt) >= yearStart &&
      new Date(record.addedAt) <= yearEnd
    );

    // Calculate totals
    const totalFuelCost = vehicleFuelRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalMaintenanceCost = vehicleMaintenanceRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalDriverAllowance = vehicleTrips.reduce((sum, trip) => sum + (trip.driverAllowance || 0), 0);
    const totalCleanerAllowance = vehicleTrips.reduce((sum, trip) => sum + (trip.cleanerAllowance || 0), 0);
    const totalCollection = vehicleTrips.reduce((sum, trip) => sum + (trip.collection || 0), 0);
    
    const totalCosts = totalFuelCost + totalMaintenanceCost + totalDriverAllowance + totalCleanerAllowance;
    const profitLoss = totalCollection - totalCosts;

    // Calculate efficiency
    const totalCurrentLoad = vehicleTrips.reduce((sum, trip) => {
      const load = parseFloat(trip.currentLoad.replace(/[^0-9.]/g, '')) || 0;
      return sum + load;
    }, 0);
    
    const totalCapacity = vehicleTrips.reduce((sum, trip) => {
      const capacity = parseFloat(trip.totalCapacity.replace(/[^0-9.]/g, '')) || 0;
      return sum + capacity;
    }, 0);

    const efficiency = totalCapacity > 0 ? (totalCurrentLoad / totalCapacity) * 100 : 0;

    return {
      vehicle,
      totalTrips: vehicleTrips.length,
      totalFuelCost,
      totalMaintenanceCost,
      totalDriverAllowance,
      totalCleanerAllowance,
      totalCollection,
      totalCosts,
      profitLoss,
      efficiency,
      trips: vehicleTrips,
      fuelRecords: vehicleFuelRecords,
      maintenanceRecords: vehicleMaintenanceRecords
    };
  };

  const analysis = selectedVehicle ? getVehicleAnalysis(selectedVehicle, selectedYear) : null;

  const getProfitLossColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitLossIcon = (amount: number) => {
    if (amount > 0) return <TrendingUpIcon className="h-4 w-4" />;
    if (amount < 0) return <TrendingDownIcon className="h-4 w-4" />;
    return <DollarSignIcon className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Analysis</h1>
          <p className="text-muted-foreground">Analyze vehicle costs, collections, and profitability</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedVehicle}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a vehicle to analyze" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Year</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{analysis.totalCollection.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {analysis.totalTrips} trips
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₹{analysis.totalCosts.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All operational costs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
                {getProfitLossIcon(analysis.profitLoss)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getProfitLossColor(analysis.profitLoss)}`}>
                  ₹{Math.abs(analysis.profitLoss).toLocaleString()}
                  {analysis.profitLoss < 0 && ' Loss'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Net {analysis.profitLoss >= 0 ? 'profit' : 'loss'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Load Efficiency</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.efficiency.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average capacity utilization
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Detailed cost analysis for {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Fuel Costs</span>
                    <span className="font-semibold">₹{analysis.totalFuelCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Maintenance Costs</span>
                    <span className="font-semibold">₹{analysis.totalMaintenanceCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Driver Allowance</span>
                    <span className="font-semibold">₹{analysis.totalDriverAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cleaner Allowance</span>
                    <span className="font-semibold">₹{analysis.totalCleanerAllowance.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-bold">
                    <span>Total Costs</span>
                    <span>₹{analysis.totalCosts.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
                <CardDescription>{analysis.vehicle.registrationNumber}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Make & Model:</span>
                    <span>{analysis.vehicle.make} {analysis.vehicle.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year:</span>
                    <span>{analysis.vehicle.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span>{analysis.vehicle.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fuel Type:</span>
                    <span>{analysis.vehicle.fuelType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={analysis.vehicle.status === 'active' ? 'default' : 'secondary'}>
                      {analysis.vehicle.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trip Summary</CardTitle>
              <CardDescription>All trips for this vehicle in {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.trips.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Load</TableHead>
                      <TableHead>Collection</TableHead>
                      <TableHead>Driver Allowance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          {new Date(trip.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{trip.route}</TableCell>
                        <TableCell>{trip.currentLoad}</TableCell>
                        <TableCell>₹{(trip.collection || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{(trip.driverAllowance || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={trip.status === 'completed' ? 'default' : 'secondary'}>
                            {trip.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No trips found for this vehicle in {selectedYear}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedVehicle && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Select a vehicle to view detailed analysis</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VehicleAnalysis;