
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Truck, Gauge, Wrench, Calendar, MapPin } from 'lucide-react';

// Mock data for vehicles
const vehicles = [
  {
    id: 'VH001',
    registrationNumber: 'MH-01-AB-1234',
    make: 'Tata',
    model: 'LPT 1109',
    year: 2022,
    capacity: '20 tons',
    fuelType: 'Diesel',
    status: 'active',
    currentDriver: 'Rajesh Kumar',
    currentLocation: 'Mumbai, MH',
    mileage: '12.5 km/l',
    lastMaintenance: '2024-06-15',
    nextMaintenance: '2024-09-15',
    totalKms: 45678,
    insuranceExpiry: '2024-12-31'
  },
  {
    id: 'VH002',
    registrationNumber: 'GJ-02-CD-5678', 
    make: 'Ashok Leyland',
    model: 'Dost Plus',
    year: 2021,
    capacity: '15 tons',
    fuelType: 'Diesel',
    status: 'maintenance',
    currentDriver: 'Amit Singh',
    currentLocation: 'Pune, MH',
    mileage: '11.8 km/l',
    lastMaintenance: '2024-07-01',
    nextMaintenance: '2024-10-01',
    totalKms: 67890,
    insuranceExpiry: '2025-03-15'
  },
  {
    id: 'VH003',
    registrationNumber: 'KA-03-EF-9012',
    make: 'Mahindra',
    model: 'Blazo X',
    year: 2023,
    capacity: '18 tons',
    fuelType: 'Diesel',
    status: 'available',
    currentDriver: null,
    currentLocation: 'Chennai, TN',
    mileage: '13.2 km/l',
    lastMaintenance: '2024-05-20',
    nextMaintenance: '2024-08-20',
    totalKms: 23456,
    insuranceExpiry: '2025-06-30'
  }
];

const Vehicles: React.FC = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case 'available':
        return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600 mt-2">Manage your fleet vehicles and their maintenance</p>
        </div>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{vehicle.registrationNumber}</CardTitle>
                    <p className="text-sm text-gray-500">{vehicle.make} {vehicle.model}</p>
                  </div>
                </div>
                {getStatusBadge(vehicle.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Year</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-gray-500">Capacity</p>
                  <p className="font-medium">{vehicle.capacity}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fuel Type</p>
                  <p className="font-medium">{vehicle.fuelType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Mileage</p>
                  <p className="font-medium">{vehicle.mileage}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{vehicle.currentLocation}</span>
              </div>

              {vehicle.currentDriver && (
                <div className="text-sm">
                  <p className="text-gray-500">Current Driver</p>
                  <p className="font-medium">{vehicle.currentDriver}</p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total KMs:</span>
                  <span className="font-medium">{vehicle.totalKms.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Maintenance:</span>
                  <span className="font-medium">{new Date(vehicle.lastMaintenance).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next Maintenance:</span>
                  <span className="font-medium">{new Date(vehicle.nextMaintenance).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Gauge className="w-4 h-4 mr-1" />
                  Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Wrench className="w-4 h-4 mr-1" />
                  Maintenance
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Vehicles;
