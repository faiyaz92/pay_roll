
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { useTrips } from '@/hooks/useFirebaseData';

const LiveTripsMap: React.FC = () => {
  const { trips, loading } = useTrips();
  
  const activeTrips = trips.filter(trip => trip.status === 'in-progress');

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="flex items-center justify-center h-80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading trip data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <span>Active Trips ({activeTrips.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-80 overflow-y-auto">
          {activeTrips.length === 0 ? (
            <div className="text-center py-8">
              <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No active trips</p>
              <p className="text-sm text-gray-400">Active trips will appear here</p>
            </div>
          ) : (
            activeTrips.map((trip) => (
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
                  
                  {trip.currentLocation && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{trip.currentLocation}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>ETA: {trip.estimatedArrival}</span>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Load: {trip.currentLoad} / {trip.totalCapacity}</span>
                      <span>{trip.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${trip.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveTripsMap;
