import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, User, Phone, MapPin, Truck, Clock } from 'lucide-react';
import { useDrivers } from '@/hooks/useFirebaseData';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddDriverForm from '@/components/Forms/AddDriverForm';

const Drivers: React.FC = () => {
  const { drivers, loading } = useDrivers();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleAddSuccess = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
            <p className="text-gray-600 mt-2">Manage your fleet drivers and their assignments</p>
          </div>
          <AddItemModal
            title="Add New Driver"
            buttonText="Add Driver"
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <AddDriverForm onSuccess={handleAddSuccess} />
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
          <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600 mt-2">Manage your fleet drivers and their assignments</p>
        </div>
        <AddItemModal
          title="Add New Driver"
          buttonText="Add Driver"
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <AddDriverForm onSuccess={handleAddSuccess} />
        </AddItemModal>
      </div>

      {drivers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
            <p className="text-gray-500 text-center mb-4">
              Get started by adding your first driver to the system.
            </p>
            <AddItemModal
              title="Add New Driver"
              buttonText="Add First Driver"
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
            >
              <AddDriverForm onSuccess={handleAddSuccess} />
            </AddItemModal>
          </CardContent>
        </Card>
      ) : (
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

                {driver.assignedVehicle && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span>Assigned: {driver.assignedVehicle}</span>
                  </div>
                )}

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
      )}
    </div>
  );
};

export default Drivers;
