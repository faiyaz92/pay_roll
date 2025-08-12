import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useVehicles, Vehicle } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';

const editVehicleSchema = z.object({
  registrationNumber: z.string().min(3, 'Registration number is required'),
  make: z.string().min(2, 'Make is required'),
  model: z.string().min(2, 'Model is required'),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  capacity: z.string().min(1, 'Capacity is required'),
  fuelType: z.string().min(2, 'Fuel type is required'),
  status: z.enum(['active', 'maintenance', 'available']),
  currentLocation: z.string().min(2, 'Current location is required'),
  mileage: z.string().min(1, 'Mileage is required'),
  mileageValue: z.number().min(1, 'Mileage value is required'),
  mileageUnit: z.enum(['kmpl', 'kmkg']),
  totalKms: z.number().min(0),
  insuranceExpiry: z.string().min(1, 'Insurance expiry date is required'),
});

type EditVehicleFormData = z.infer<typeof editVehicleSchema>;

interface EditVehicleFormProps {
  vehicle: Vehicle;
  onSuccess: () => void;
}

const EditVehicleForm: React.FC<EditVehicleFormProps> = ({ vehicle, onSuccess }) => {
  const { updateVehicle } = useVehicles();
  const { toast } = useToast();
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);

  const form = useForm<EditVehicleFormData>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: {
      registrationNumber: vehicle.registrationNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      capacity: vehicle.capacity,
      fuelType: vehicle.fuelType,
      status: vehicle.status,
      currentLocation: vehicle.currentLocation,
      mileage: vehicle.mileage,
      mileageValue: vehicle.mileageValue,
      mileageUnit: vehicle.mileageUnit,
      totalKms: vehicle.totalKms,
      insuranceExpiry: vehicle.insuranceExpiry,
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== vehicle.status) {
      setPendingStatusChange(newStatus);
      setShowStatusConfirmation(true);
    }
  };

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      form.setValue('status', pendingStatusChange as any);
      setShowStatusConfirmation(false);
      setPendingStatusChange(null);
    }
  };

  const cancelStatusChange = () => {
    form.setValue('status', vehicle.status);
    setShowStatusConfirmation(false);
    setPendingStatusChange(null);
  };

  const onSubmit = async (data: EditVehicleFormData) => {
    try {
      const vehicleData = {
        ...vehicle,
        ...data,
      };

      await updateVehicle(vehicle.id, vehicleData);
      toast({
        title: 'Success',
        description: 'Vehicle updated successfully',
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update vehicle',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter registration number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="make"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Make</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Tata" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ace" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="2024" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1000 kg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                    <SelectItem value="CNG">CNG</SelectItem>
                    <SelectItem value="Electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status (Manual Override)</FormLabel>
                <Select onValueChange={handleStatusChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter current location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mileage Description</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 15 kmpl or 8 kmkg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mileageValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mileage Value</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      placeholder="15" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mileageUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mileage Unit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="kmpl">km per liter (kmpl)</SelectItem>
                      <SelectItem value="kmkg">km per kg (kmkg)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="totalKms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total KMs</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insuranceExpiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Expiry</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Update Vehicle
          </Button>
        </form>
      </Form>

      <AlertDialog open={showStatusConfirmation} onOpenChange={setShowStatusConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to manually change the vehicle status from "{vehicle.status}" to "{pendingStatusChange}"? 
              Normally, vehicle status is automatically managed based on trip assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelStatusChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirm Change</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditVehicleForm;