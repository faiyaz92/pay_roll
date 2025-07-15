import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useTrips, useDrivers, useVehicles } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';
import { Trip } from '@/hooks/useFirebaseData';

const tripSchema = z.object({
  driver: z.string().min(1, 'Driver is required'),
  vehicle: z.string().min(1, 'Vehicle is required'),
  route: z.string().min(2, 'Route is required'),
  status: z.enum(['pending', 'in-progress', 'completed']),
  startTime: z.string().min(1, 'Start time is required'),
  estimatedArrival: z.string().min(1, 'Estimated arrival is required'),
  currentLoad: z.string().min(1, 'Current load is required'),
  totalCapacity: z.string().min(1, 'Total capacity is required'),
  distance: z.string().min(1, 'Distance is required'),
  fuelConsumption: z.string().min(1, 'Fuel consumption is required'),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  dropLocation: z.string().min(1, 'Drop location is required'),
  customerInfo: z.string().optional(),
  fare: z.string().optional(),
  notes: z.string().optional(),
});

type TripFormData = z.infer<typeof tripSchema>;

interface AddTripFormProps {
  onSuccess: () => void;
}

const AddTripForm: React.FC<AddTripFormProps> = ({ onSuccess }) => {
  const { addTrip } = useTrips();
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();
  const { toast } = useToast();

  const availableDrivers = drivers.filter(driver => driver.status === 'available');
  const availableVehicles = vehicles.filter(vehicle => vehicle.status === 'available');

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      driver: '',
      vehicle: '',
      route: '',
      status: 'pending',
      startTime: '',
      estimatedArrival: '',
      currentLoad: '',
      totalCapacity: '',
      distance: '',
      fuelConsumption: '',
      pickupLocation: '',
      dropLocation: '',
      customerInfo: '',
      fare: '',
      notes: '',
    },
  });

  const onSubmit = async (data: TripFormData) => {
    try {
      const tripData: Omit<Trip, 'id'> = {
        driver: data.driver,
        vehicle: data.vehicle,
        route: data.route,
        status: data.status,
        startTime: data.startTime,
        estimatedArrival: data.estimatedArrival,
        currentLoad: data.currentLoad,
        totalCapacity: data.totalCapacity,
        distance: data.distance,
        fuelConsumption: data.fuelConsumption,
        pickupLocation: data.pickupLocation,
        dropLocation: data.dropLocation,
        customerInfo: data.customerInfo || '',
        fare: data.fare ? parseFloat(data.fare) : 0,
        notes: data.notes || '',
        progress: 0,
        currentLocation: 'Starting Point',
        companyId: '', // Will be set by the hook
        createdBy: '', // Will be set by the hook
        createdByRole: 'company_admin' as any, // Will be set by the hook
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        driverId: '', // Will be set by the hook if needed
        endTime: undefined,
        actualArrival: undefined,
      };

      await addTrip(tripData);
      toast({
        title: 'Success',
        description: 'Trip added successfully',
      });
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add trip',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="driver"
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
                  {availableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.name}>
                      {driver.name}
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
          name="vehicle"
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
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.registrationNumber}>
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
          name="route"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Mumbai to Pune" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pickupLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mumbai Central" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dropLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drop Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Pune Station" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedArrival"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Arrival</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currentLoad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Load</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 500 kg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalCapacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Capacity</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1000 kg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="distance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distance</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 150 km" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuelConsumption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel Consumption</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 10 L" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="customerInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Info (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Customer name or details" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fare"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fare (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Amount in ₹" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Additional notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">
          Add Trip
        </Button>
      </form>
    </Form>
  );
};

export default AddTripForm;
