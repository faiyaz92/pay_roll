import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Truck, Gauge, Wrench, Calendar, MapPin } from 'lucide-react';
import { useVehicles } from '@/hooks/useFirebaseData';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddVehicleForm from '@/components/Forms/AddVehicleForm';

const Vehicles: React.FC = () => {
  const { vehicles, loading } = useVehicles();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleAddSuccess = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
            <p className="text-gray-600 mt-2">Manage your fleet vehicles and their maintenance</p>
          </div>
          <AddItemModal
            title="Add New Vehicle"
            buttonText="Add Vehicle"
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <AddVehicleForm onSuccess={handleAddSuccess} />
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
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600 mt-2">Manage your fleet vehicles and their maintenance</p>
        </div>
        <AddItemModal
          title="Add New Vehicle"
          buttonText="Add Vehicle"
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <AddVehicleForm onSuccess={handleAddSuccess} />
        </AddItemModal>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-500 text-center mb-4">
              Get started by adding your first vehicle to the fleet.
            </p>
            <AddItemModal
              title="Add New Vehicle"
              buttonText="Add First Vehicle"
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
            >
              <AddVehicleForm onSuccess={handleAddSuccess} />
            </AddItemModal>
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
};

export default Vehicles;
