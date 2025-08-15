import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, User, Truck, Calendar, Clock, DollarSign, Package, Fuel, Route, Receipt } from 'lucide-react';
import { useTrips } from '@/hooks/useFirebaseData';
import ActiveTripManager from '@/components/Trip/ActiveTripManager';

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { trips, loading } = useTrips();
  
  const trip = trips.find(t => t.id === tripId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/trips')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/trips')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Trip not found</h3>
            <p className="text-gray-500 text-center">
              The trip you're looking for doesn't exist or may have been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  // Calculate financial summary
  const initialCollection = parseFloat((trip.fare || '0').toString()) || 0;
  const initialExpenses = (parseFloat((trip.fuelConsumption || '0').toString()) || 0) + 
                         (parseFloat((trip.driverAllowance || '0').toString()) || 0) + 
                         (parseFloat((trip.cleanerAllowance || '0').toString()) || 0);
  
  const additionalCollections = trip.collections?.reduce((sum, col) => sum + col.amount, 0) || 0;
  const additionalExpenses = trip.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  
  const totalCollections = initialCollection + additionalCollections;
  const totalExpenses = initialExpenses + additionalExpenses;
  const tripProfit = totalCollections - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/trips')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{trip.route}</h1>
            <p className="text-gray-600 mt-1">{trip.pickupLocation} → {trip.dropLocation}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(trip.status)}
        </div>
      </div>

      {trip.status === 'in-progress' && (
        <ActiveTripManager trip={trip} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Trip Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Trip ID</p>
              <p className="font-medium">{trip.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Route</p>
              <p className="font-medium">{trip.route}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Distance</p>
              <p className="font-medium">{trip.distance}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="mt-1">{getStatusBadge(trip.status)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Personnel Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personnel</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Driver</p>
              <p className="font-medium">{trip.driver}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vehicle</p>
              <p className="font-medium">{trip.vehicle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created by</p>
              <p className="font-medium">{trip.createdByRole === 'driver' ? 'Driver' : 'Admin'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Timing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Start Time</p>
              <p className="font-medium">{new Date(trip.startTime).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estimated Arrival</p>
              <p className="font-medium">{new Date(trip.estimatedArrival).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{new Date(trip.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Capacity Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Load Capacity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Capacity</p>
              <p className="font-medium">{trip.totalCapacity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Load</p>
              <p className="font-medium">{trip.currentLoad}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilization</span>
                <span>
                  {trip.currentLoad && trip.totalCapacity ? 
                    ((parseInt(trip.currentLoad.replace(/\D/g, '')) / parseInt(trip.totalCapacity.replace(/\D/g, ''))) * 100).toFixed(1) 
                    : 0}%
                </span>
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
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Financial Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Initial Fare</p>
              <p className="font-medium text-green-600">₹{initialCollection}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Additional Collections</p>
              <p className="font-medium text-green-600">₹{additionalCollections}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="font-medium text-red-600">₹{totalExpenses}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Net Result</p>
              <p className={`font-bold text-lg ${tripProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tripProfit >= 0 ? 'Profit' : 'Loss'}: ₹{Math.abs(tripProfit)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Fuel className="w-5 h-5" />
              <span>Fuel Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Estimated Consumption</p>
              <p className="font-medium">{trip.fuelConsumption}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vehicle Type</p>
              <p className="font-medium">{trip.vehicle || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stops Information */}
      {trip.stops && trip.stops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Route className="w-5 h-5" />
              <span>Trip Stops ({trip.stops.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trip.stops.map((stop, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <h4 className="font-medium">{stop.stopName}</h4>
                      <Badge variant={stop.status === 'reached' ? 'default' : 'secondary'}>
                        {stop.status === 'reached' ? 'Reached' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <span>Load: {stop.loadAmount}kg</span>
                      <span>Unload: {stop.unloadAmount}kg</span>
                    </div>
                    {stop.notes && (
                      <p className="text-sm text-gray-500">{stop.notes}</p>
                    )}
                  </div>
                  {stop.reachedAt && (
                    <div className="text-sm text-gray-500">
                      {new Date(stop.reachedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collections & Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Collections</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Initial Fare</span>
                  <span className="font-bold text-green-600">₹{initialCollection}</span>
                </div>
                <p className="text-sm text-gray-500">Base trip fare</p>
              </div>
              {trip.collections?.map((collection, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">₹{collection.amount}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(collection.collectedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{collection.description}</p>
                  <p className="text-xs text-gray-500">{collection.location}</p>
                </div>
              )) || (
                <p className="text-center text-gray-500 py-4">No additional collections</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5" />
              <span>Expenses</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Initial Costs</span>
                  <span className="font-bold text-red-600">₹{initialExpenses}</span>
                </div>
                <p className="text-sm text-gray-500">Fuel, driver & cleaner allowance</p>
              </div>
              {trip.expenses?.map((expense, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">₹{expense.amount}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(expense.incurredAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{expense.description}</p>
                  <p className="text-xs text-gray-500">{expense.category} • {expense.location}</p>
                </div>
              )) || (
                <p className="text-center text-gray-500 py-4">No additional expenses</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TripDetails;