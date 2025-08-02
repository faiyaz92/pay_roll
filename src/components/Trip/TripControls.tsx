
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Play, Square, Pause, MapPin, Clock, Settings } from 'lucide-react';
import { Trip } from '@/hooks/useFirebaseData';
import { useTrips } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/user';
import { toast } from 'sonner';
import ActiveTripManager from './ActiveTripManager';

interface TripControlsProps {
  trip: Trip;
  compact?: boolean;
}

const TripControls: React.FC<TripControlsProps> = ({ trip, compact = false }) => {
  const { updateTripStatus } = useTrips();
  const { userInfo } = useAuth();
  const [loading, setLoading] = useState(false);

  const canControlTrip = () => {
    if (!userInfo) return false;
    
    // Admin can control any trip
    if (userInfo.role === Role.COMPANY_ADMIN) return true;
    
    // Driver can only control their own trips
    if (userInfo.role === Role.DRIVER && trip.driverId === userInfo.userId) return true;
    
    return false;
  };

  const handleTripAction = async (action: 'start' | 'end' | 'pause') => {
    if (!canControlTrip()) {
      toast.error('You do not have permission to control this trip');
      return;
    }

    setLoading(true);
    try {
      let newStatus: Trip['status'];
      
      switch (action) {
        case 'start':
          newStatus = 'in-progress';
          break;
        case 'end':
          newStatus = 'completed';
          break;
        case 'pause':
          newStatus = 'pending';
          break;
        default:
          return;
      }

      await updateTripStatus(trip.id, newStatus, trip.currentLocation);
      
      const actionMessages = {
        start: 'Trip started successfully',
        end: 'Trip completed successfully',
        pause: 'Trip paused successfully'
      };
      
      toast.success(actionMessages[action]);
    } catch (error) {
      console.error('Error updating trip status:', error);
      toast.error('Failed to update trip status');
    } finally {
      setLoading(false);
    }
  };

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

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusBadge(trip.status)}
        {canControlTrip() && (
          <div className="flex space-x-1">
            {trip.status === 'pending' && (
              <Button 
                size="sm" 
                onClick={() => handleTripAction('start')}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600"
              >
                <Play className="w-3 h-3 mr-1" />
                Start
              </Button>
            )}
            {trip.status === 'in-progress' && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Settings className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <ActiveTripManager trip={trip} />
                  </DialogContent>
                </Dialog>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleTripAction('pause')}
                  disabled={loading}
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleTripAction('end')}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Square className="w-3 h-3 mr-1" />
                  End
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trip Controls</span>
          {getStatusBadge(trip.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <div>
              <p className="font-medium">Current Location</p>
              <p className="text-gray-500">{trip.currentLocation || 'Unknown'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="font-medium">Status</p>
              <p className="text-gray-500">{trip.status}</p>
            </div>
          </div>
        </div>

        {canControlTrip() && (
          <div className="flex space-x-2">
            {trip.status === 'pending' && (
              <Button 
                onClick={() => handleTripAction('start')}
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Trip
              </Button>
            )}
            {trip.status === 'in-progress' && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Trip
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <ActiveTripManager trip={trip} />
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline"
                  onClick={() => handleTripAction('pause')}
                  disabled={loading}
                  className="flex-1"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Trip
                </Button>
                <Button 
                  onClick={() => handleTripAction('end')}
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  <Square className="w-4 h-4 mr-2" />
                  End Trip
                </Button>
              </>
            )}
          </div>
        )}

        {!canControlTrip() && (
          <p className="text-sm text-gray-500 text-center p-4 bg-gray-50 rounded">
            {userInfo?.role === Role.DRIVER 
              ? "You can only control your own trips"
              : "You don't have permission to control this trip"}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TripControls;
