
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Clock, User, Truck } from 'lucide-react';
import { useTrips } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/user';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddTripForm from '@/components/Forms/AddTripForm';
import TripControls from '@/components/Trip/TripControls';

const Trips: React.FC = () => {
  const { trips, loading } = useTrips();
  const { userInfo } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAddSuccess = () => {
    setIsModalOpen(false);
  };

  const getPageTitle = () => {
    if (userInfo?.role === Role.DRIVER) {
      return 'My Trips';
    }
    return 'Trip Management';
  };

  const getPageDescription = () => {
    if (userInfo?.role === Role.DRIVER) {
      return 'Manage your assigned trips and create new ones';
    }
    return 'Manage and monitor all transportation trips';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-gray-600 mt-2">{getPageDescription()}</p>
          </div>
          <AddItemModal
            title="Add New Trip"
            buttonText="New Trip"
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <AddTripForm onSuccess={handleAddSuccess} />
          </AddItemModal>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600 mt-2">{getPageDescription()}</p>
        </div>
        <AddItemModal
          title="Add New Trip"
          buttonText="New Trip"
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <AddTripForm onSuccess={handleAddSuccess} />
        </AddItemModal>
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-500 text-center mb-4">
              {userInfo?.role === Role.DRIVER 
                ? "You don't have any trips yet. Create your first trip when you get a pickup order."
                : "Get started by creating your first trip in the system."
              }
            </p>
            <AddItemModal
              title="Add New Trip"
              buttonText={userInfo?.role === Role.DRIVER ? "Create Trip" : "Create First Trip"}
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
            >
              <AddTripForm onSuccess={handleAddSuccess} />
            </AddItemModal>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{trip.route}</CardTitle>
                  <TripControls trip={trip} compact />
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
                  <div>
                    <p className="text-gray-500">Start Time</p>
                    <p className="font-medium">{new Date(trip.startTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">ETA</p>
                    <p className="font-medium">{new Date(trip.estimatedArrival).toLocaleString()}</p>
                  </div>
                </div>

                {trip.fare && (
                  <div className="text-sm">
                    <p className="text-gray-500">Fare</p>
                    <p className="font-medium text-green-600">₹{trip.fare}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Load Capacity</span>
                    <span>{trip.currentLoad} / {trip.totalCapacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ 
                        width: `${trip.currentLoad && trip.totalCapacity ? 
                          (parseInt(trip.currentLoad.replace(/\D/g, '')) / parseInt(trip.totalCapacity.replace(/\D/g, ''))) * 100 : 0}%` 
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

                <div className="text-xs text-gray-500">
                  Created by: {trip.createdByRole === Role.DRIVER ? 'Driver' : 'Admin'} • {new Date(trip.createdAt).toLocaleDateString()}
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.location.href = `/trip-details/${trip.id}`}
                  >
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
      )}
    </div>
  );
};

export default Trips;
