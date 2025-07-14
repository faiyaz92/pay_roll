
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Clock, User, Truck } from 'lucide-react';

// Mock data for trips
const trips = [
  {
    id: 'TR001',
    driver: 'Rajesh Kumar',
    vehicle: 'MH-01-AB-1234',
    route: 'Mumbai → Delhi',
    status: 'in-progress',
    startTime: '06:00 AM',
    estimatedArrival: '08:00 PM',
    currentLoad: '15 tons',
    totalCapacity: '20 tons',
    distance: '1,400 km',
    fuelConsumption: '12 L/100km',
  },
  {
    id: 'TR002',
    driver: 'Amit Singh',
    vehicle: 'GJ-02-CD-5678',
    route: 'Pune → Bangalore',
    status: 'pending',
    startTime: 'Not Started',
    estimatedArrival: '10 hours',
    currentLoad: '18 tons',
    totalCapacity: '20 tons',
    distance: '840 km',
    fuelConsumption: '11 L/100km',
  },
  {
    id: 'TR003',
    driver: 'Vikram Patel',
    vehicle: 'KA-03-EF-9012',
    route: 'Chennai → Hyderabad',
    status: 'completed',
    startTime: '05:30 AM',
    estimatedArrival: 'Arrived',
    currentLoad: '12 tons',
    totalCapacity: '18 tons',
    distance: '630 km',
    fuelConsumption: '10.5 L/100km',
  },
];

const Trips: React.FC = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="status-pending">Pending</Badge>;
      case 'in-progress':
        return <Badge className="status-in-progress">In Progress</Badge>;
      case 'completed':
        return <Badge className="status-completed">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-gray-600 mt-2">Manage and monitor all transportation trips</p>
        </div>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Trip
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <Card key={trip.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{trip.id}</CardTitle>
                {getStatusBadge(trip.status)}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{trip.route}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div className="text-sm">
                    <p className="font-medium">{trip.driver}</p>
                    <p className="text-gray-500">Driver</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <div className="text-sm">
                    <p className="font-medium">{trip.vehicle}</p>
                    <p className="text-gray-500">Vehicle</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Start Time</p>
                  <p className="font-medium">{trip.startTime}</p>
                </div>
                <div>
                  <p className="text-gray-500">ETA</p>
                  <p className="font-medium">{trip.estimatedArrival}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Load Capacity</span>
                  <span>{trip.currentLoad} / {trip.totalCapacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ 
                      width: `${(parseInt(trip.currentLoad) / parseInt(trip.totalCapacity)) * 100}%` 
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Distance</p>
                  <p className="font-medium">{trip.distance}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fuel Usage</p>
                  <p className="font-medium">{trip.fuelConsumption}</p>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                {trip.status === 'in-progress' && (
                  <Button variant="outline" size="sm" className="flex-1">
                    Track Live
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Trips;
