import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFuelRecords, useVehicles, useDrivers } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const fuelRecordSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  tripId: z.string().optional(),
  amount: z.string().min(1, 'Amount is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  pricePerLiter: z.string().min(1, 'Price per liter is required'),
  fuelType: z.string().min(1, 'Fuel type is required'),
  location: z.string().min(1, 'Location is required'),
  odometer: z.string().min(1, 'Odometer reading is required'),
});

type FuelRecordFormData = z.infer<typeof fuelRecordSchema>;

interface AddFuelRecordFormProps {
  onSuccess: () => void;
}

const AddFuelRecordForm: React.FC<AddFuelRecordFormProps> = ({ onSuccess }) => {
  const { addFuelRecord, fuelRecords } = useFuelRecords();
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { userInfo } = useAuth();
  const { toast } = useToast();

  const form = useForm<FuelRecordFormData>({
    resolver: zodResolver(fuelRecordSchema),
    defaultValues: {
      vehicleId: '',
      driverId: '',
      tripId: '',
      amount: '',
      quantity: '',
      pricePerLiter: '',
      fuelType: 'Diesel',
      location: '',
      odometer: '',
    },
  });

  const onSubmit = async (data: FuelRecordFormData) => {
    try {
      // Validate odometer reading against previous records
      const existingRecords = fuelRecords.filter(record => record.vehicleId === data.vehicleId);
      const maxOdometer = existingRecords.length > 0 
        ? Math.max(...existingRecords.map(record => record.odometer))
        : 0;
      
      if (parseInt(data.odometer) <= maxOdometer) {
        toast({
          title: "Invalid Odometer Reading",
          description: `Odometer reading must be greater than previous reading (${maxOdometer} km)`,
          variant: "destructive",
        });
        return;
      }

      const fuelRecordData = {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        ...(data.tripId && { tripId: data.tripId }),
        amount: parseFloat(data.amount),
        quantity: parseFloat(data.quantity),
        pricePerLiter: parseFloat(data.pricePerLiter),
        fuelType: data.fuelType,
        location: data.location,
        odometer: parseInt(data.odometer),
        addedBy: userInfo?.userId || '',
        addedAt: new Date().toISOString(),
        companyId: userInfo?.companyId || '',
      };

      await addFuelRecord(fuelRecordData);
      toast({
        title: 'Success',
        description: 'Fuel record added successfully',
      });
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add fuel record',
        variant: 'destructive',
      });
    }
  };

  // Auto-calculate amount when quantity and price change
  const quantity = form.watch('quantity');
  const pricePerLiter = form.watch('pricePerLiter');
  
  React.useEffect(() => {
    if (quantity && pricePerLiter) {
      const calculatedAmount = (parseFloat(quantity) * parseFloat(pricePerLiter)).toFixed(2);
      form.setValue('amount', calculatedAmount);
    }
  }, [quantity, pricePerLiter, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.registrationNumber} ({vehicle.make} {vehicle.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="driverId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Driver</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Fuel station location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity (Liters)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 50.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pricePerLiter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per Liter (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 85.50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Auto-calculated" {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="odometer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Odometer Reading (km)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 75000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Add Fuel Record
        </Button>
      </form>
    </Form>
  );
};

export default AddFuelRecordForm;