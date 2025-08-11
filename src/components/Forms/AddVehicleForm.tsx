import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useVehicles } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/hooks/useFirebaseData';

const vehicleSchema = z.object({
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

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface AddVehicleFormProps {
  onSuccess: () => void;
}

const AddVehicleForm: React.FC<AddVehicleFormProps> = ({ onSuccess }) => {
  const { addVehicle } = useVehicles();
  const { toast } = useToast();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      capacity: '',
      fuelType: '',
      status: 'available',
      currentLocation: '',
      mileage: '',
      mileageValue: 0,
      mileageUnit: 'kmpl',
      totalKms: 0,
      insuranceExpiry: '',
    },
  });

  const onSubmit = async (data: VehicleFormData) => {
    try {
      const vehicleData: Omit<Vehicle, 'id'> = {
        registrationNumber: data.registrationNumber,
        make: data.make,
        model: data.model,
        year: data.year,
        capacity: data.capacity,
        fuelType: data.fuelType,
        status: data.status,
        currentLocation: data.currentLocation,
        mileage: data.mileage,
        mileageValue: data.mileageValue,
        mileageUnit: data.mileageUnit,
        totalKms: data.totalKms,
        insuranceExpiry: data.insuranceExpiry,
        lastMaintenance: new Date().toISOString(),
        nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        companyId: '', // Will be set by the hook
      };

      await addVehicle(vehicleData);
      toast({
        title: 'Success',
        description: 'Vehicle added successfully',
      });
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add vehicle',
        variant: 'destructive',
      });
    }
  };

  return (
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
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          Add Vehicle
        </Button>
      </form>
    </Form>
  );
};

export default AddVehicleForm;
