
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, User, Phone, MapPin, Truck, Clock } from 'lucide-react';

// Mock data for drivers
const drivers = [
  {
    id: 'DR001',
    name: 'Rajesh Kumar',
    email: 'rajesh@transportpro.com',
    phone: '+91 98765 43210',
    licenseNumber: 'DL-1420110012345',
    experience: '8 years',
    status: 'available',
    currentLocation: 'Mumbai, MH',
    assignedVehicle: 'MH-01-AB-1234',
    totalTrips: 245,
    rating: 4.8,
    joinDate: '2020-03-15'
  },
  {
    id: 'DR002', 
    name: 'Amit Singh',
    email: 'amit@transportpro.com',
    phone: '+91 98765 43211',
    licenseNumber: 'GJ-1420110054321',
    experience: '5 years',
    status: 'on-trip',
    currentLocation: 'Pune, MH',
    assignedVehicle: 'GJ-02-CD-5678',
    totalTrips: 178,
    rating: 4.6,
    joinDate: '2021-07-22'
  },
  {
    id: 'DR003',
    name: 'Vikram Patel',
    email: 'vikram@transportpro.com', 
    phone: '+91 98765 43212',
    licenseNumber: 'KA-1420110098765',
    experience: '12 years',
    status: 'off-duty',
    currentLocation: 'Chennai, TN',
    assignedVehicle: 'KA-03-EF-9012',
    totalTrips: 456,
    rating: 4.9,
    joinDate: '2018-11-08'
  }
];

const Drivers: React.FC = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'on-trip':
        return <Badge className="bg-blue-100 text-blue-800">On Trip</Badge>;
      case 'off-duty':
        return <Badge className="bg-gray-100 text-gray-800">Off Duty</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600 mt-2">Manage your fleet drivers and their assignments</p>
        </div>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Driver
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{driver.name}</CardTitle>
                    <p className="text-sm text-gray-500">{driver.id}</p>
                  </div>
                </div>
                {getStatusBadge(driver.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{driver.currentLocation}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">License:</span>
                  <span className="font-medium">{driver.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Experience:</span>
                  <span className="font-medium">{driver.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rating:</span>
                  <span className="font-medium">⭐ {driver.rating}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Truck className="w-4 h-4 text-gray-400" />
                <span>Assigned: {driver.assignedVehicle}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Trips</p>
                  <p className="font-bold text-lg">{driver.totalTrips}</p>
                </div>
                <div>
                  <p className="text-gray-500">Join Date</p>
                  <p className="font-medium">{new Date(driver.joinDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  View Profile
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Assign Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Drivers;
