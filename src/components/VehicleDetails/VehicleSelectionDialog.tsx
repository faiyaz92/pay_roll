import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { Vehicle } from '@/types/user';

interface VehicleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleSelect: (vehicleId: string) => void;
}

export const VehicleSelectionDialog: React.FC<VehicleSelectionDialogProps> = ({
  open,
  onOpenChange,
  onVehicleSelect,
}) => {
  const { vehicles, loading } = useFirebaseData();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const handleSelect = () => {
    if (selectedVehicleId) {
      onVehicleSelect(selectedVehicleId);
      onOpenChange(false);
      setSelectedVehicleId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Vehicle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <p>Loading vehicles...</p>
          ) : vehicles && vehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className={`cursor-pointer transition-colors ${
                    selectedVehicleId === vehicle.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {vehicle.vehicleName?.charAt(0) || 'V'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{vehicle.vehicleName}</h3>
                        <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No vehicles available.</p>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedVehicleId}>
            Select Vehicle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};