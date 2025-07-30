import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Wrench, AlertTriangle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMaintenanceRecords, useVehicles } from '@/hooks/useFirebaseData';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddMaintenanceRecordForm from '@/components/Forms/AddMaintenanceRecordForm';

const MaintenanceRecords: React.FC = () => {
  const { maintenanceRecords, loading } = useMaintenanceRecords();
  const { vehicles } = useVehicles();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model})` : 'Unknown Vehicle';
  };

  const getMaintenanceTypeBadge = (type: string) => {
    switch (type) {
      case 'routine':
        return <Badge variant="default">Routine</Badge>;
      case 'repair':
        return <Badge variant="destructive">Repair</Badge>;
      case 'inspection':
        return <Badge variant="secondary">Inspection</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + record.amount, 0);
  const routineCount = maintenanceRecords.filter(r => r.type === 'routine').length;
  const repairCount = maintenanceRecords.filter(r => r.type === 'repair').length;
  const inspectionCount = maintenanceRecords.filter(r => r.type === 'inspection').length;

  // Upcoming maintenance alerts (next service within 1000 km)
  const upcomingMaintenance = maintenanceRecords
    .filter(record => record.nextServiceOdometer)
    .map(record => {
      const vehicle = vehicles.find(v => v.id === record.vehicleId);
      if (vehicle && record.nextServiceOdometer && vehicle.totalKms) {
        const remaining = record.nextServiceOdometer - vehicle.totalKms;
        return { ...record, remaining, vehicle };
      }
      return null;
    })
    .filter(item => item && item.remaining <= 1000 && item.remaining > 0)
    .sort((a, b) => (a?.remaining || 0) - (b?.remaining || 0));

  // Monthly maintenance costs
  const monthlyStats = maintenanceRecords.reduce((acc, record) => {
    const month = new Date(record.addedAt).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { cost: 0, count: 0 };
    }
    acc[month].cost += record.amount;
    acc[month].count += 1;
    return acc;
  }, {} as Record<string, { cost: number; count: number }>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Maintenance Records</h1>
            <p className="text-muted-foreground mt-2">Track vehicle maintenance and repairs</p>
          </div>
        </div>
        <div className="text-center py-8">Loading maintenance records...</div>
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
          <AddMaintenanceRecordForm onSuccess={() => setIsModalOpen(false)} />
        </AddItemModal>
      </div>

      {/* Upcoming Maintenance Alerts */}
      {upcomingMaintenance.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Upcoming Maintenance
            </CardTitle>
            <CardDescription className="text-orange-700">
              Vehicles requiring maintenance soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingMaintenance.map((item) => (
                <div key={item!.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{getVehicleName(item!.vehicleId)}</p>
                    <p className="text-sm text-muted-foreground">{item!.description}</p>
                  </div>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    {item!.remaining} km remaining
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardTitle className="text-sm font-medium">Routine Services</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routineCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repairs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repairCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspections</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inspectionCount}</div>
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
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No maintenance records</h3>
              <p className="mt-1 text-sm text-gray-500">Start tracking maintenance by adding your first record.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Service Provider</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.addedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getVehicleName(record.vehicleId)}
                    </TableCell>
                    <TableCell>
                      {getMaintenanceTypeBadge(record.type)}
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>{record.serviceProvider}</TableCell>
                    <TableCell>{record.odometer.toLocaleString()} km</TableCell>
                    <TableCell>
                      {record.nextServiceOdometer ? `${record.nextServiceOdometer.toLocaleString()} km` : '-'}
                    </TableCell>
                    <TableCell className="font-medium">₹{record.amount.toLocaleString()}</TableCell>
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
            <CardTitle>Monthly Maintenance Analysis</CardTitle>
            <CardDescription>
              Month-wise maintenance cost breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Average Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(monthlyStats).map(([month, stats]) => {
                  const typedStats = stats as { cost: number; count: number };
                  return (
                    <TableRow key={month}>
                      <TableCell className="font-medium">{month}</TableCell>
                      <TableCell>{typedStats.count}</TableCell>
                      <TableCell>₹{typedStats.cost.toLocaleString()}</TableCell>
                      <TableCell>₹{Math.round(typedStats.cost / typedStats.count).toLocaleString()}</TableCell>
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

export default MaintenanceRecords;