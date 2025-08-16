import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, User, Truck, Clock, DollarSign, Fuel, Package, Navigation } from 'lucide-react';
import { useTrips } from '@/hooks/useFirebaseData';
import { useNavigate } from 'react-router-dom';

const ActiveTripsList: React.FC = () => {
  const { trips, loading } = useTrips();
  const navigate = useNavigate();

  const activeTrips = trips.filter(trip => 
    trip.status === 'in-progress'
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      'in-progress': 'bg-green-100 text-green-800',
      'pending': 'bg-blue-100 text-blue-800',
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Active Trips</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (activeTrips.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Active Trips</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Navigation className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active trips</h3>
            <p className="text-gray-500 text-center">
              All trips are either completed or not yet started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Active Trips</h2>
        <Badge variant="secondary">{activeTrips.length} active</Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeTrips.map((trip) => (
          <Card key={trip.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{trip.route}</CardTitle>
                <Badge className={getStatusBadge(trip.status)}>
                  {trip.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{trip.pickupLocation} → {trip.dropLocation}</span>
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
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Start Time</p>
                    <p className="text-gray-500">
                      {trip.startTime ? new Date(trip.startTime).toLocaleString() : 'Not started'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Fare</p>
                    <p className="text-gray-500">₹{trip.fare || 0}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Load</p>
                    <p className="text-gray-500">
                      {trip.currentLoad || 0} / {trip.totalCapacity || 0} kg
                    </p>
                    {parseFloat((trip.currentLoad || '0').toString()) / parseFloat((trip.totalCapacity || '1').toString()) > 0.9 && (
                      <p className="text-red-500 text-xs">⚠️ Overloaded</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Fuel className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Distance</p>
                    <p className="text-gray-500">{trip.distance || 0} km</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => navigate(`/trip-details/${trip.id}`)}
                >
                  View Details
                </Button>
                {trip.status === 'in-progress' && (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/trip-details/${trip.id}`)}
                  >
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

export default ActiveTripsList;