
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock } from 'lucide-react';

// Mock data for live trips
const liveTrips = [
  {
    id: 'TR001',
    driver: 'Rajesh Kumar',
    vehicle: 'MH-01-AB-1234',
    route: 'Mumbai → Delhi',
    status: 'in-progress',
    currentLocation: 'Near Surat',
    loadCapacity: '15/20 tons',
    estimatedArrival: '2 hours',
    progress: 65,
  },
  {
    id: 'TR002',
    driver: 'Amit Singh',
    vehicle: 'GJ-02-CD-5678',
    route: 'Pune → Bangalore',
    status: 'in-progress',
    currentLocation: 'Near Hubli',
    loadCapacity: '18/20 tons',
    estimatedArrival: '4 hours',
    progress: 40,
  },
  {
    id: 'TR003',
    driver: 'Vikram Patel',
    vehicle: 'KA-03-EF-9012',
    route: 'Chennai → Hyderabad',
    status: 'in-progress',
    currentLocation: 'Near Kurnool',
    loadCapacity: '12/18 tons',
    estimatedArrival: '1.5 hours',
    progress: 80,
  },
];

const LiveTripsMap: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Map Placeholder */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Live Trip Tracking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Interactive Map</p>
              <p className="text-sm text-gray-400">Live tracking will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Trips List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Navigation className="w-5 h-5" />
            <span>Active Trips</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-80 overflow-y-auto">
          {liveTrips.map((trip) => (
            <div key={trip.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-sm">{trip.id}</h4>
                  <p className="text-sm text-gray-600">{trip.driver}</p>
                </div>
                <Badge className="status-in-progress">
                  In Progress
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Navigation className="w-4 h-4 text-gray-400" />
                  <span>{trip.route}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{trip.currentLocation}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>ETA: {trip.estimatedArrival}</span>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Load: {trip.loadCapacity}</span>
                    <span>{trip.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${trip.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveTripsMap;
