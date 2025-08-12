import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useTrips, useDrivers, useVehicles, useRoutes, useCities } from '@/hooks/useFirebaseData';
import { useFuelPrices } from '@/hooks/useFuelPrices';
import { useToast } from '@/hooks/use-toast';
import { Trip } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';

const tripSchema = z.object({
  driver: z.string().min(1, 'Driver is required'),
  vehicle: z.string().min(1, 'Vehicle is required'),
  pickupCity: z.string().min(1, 'Pickup city is required'),
  dropCity: z.string().min(1, 'Drop city is required'),
  routeId: z.string().optional(),
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
  driverAllowance: z.string().optional(),
  cleanerAllowance: z.string().optional(),
  notes: z.string().optional(),
  collection: z.string().optional(),
});

type TripFormData = z.infer<typeof tripSchema>;

interface AddTripFormProps {
  onSuccess: () => void;
}

const AddTripForm: React.FC<AddTripFormProps> = ({ onSuccess }) => {
  const { addTrip } = useTrips();
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();
  const { routes } = useRoutes();
  const { cities } = useCities();
  const { calculateFuelCost } = useFuelPrices();
  const { toast } = useToast();
  const { userInfo } = useAuth();
  
  const [selectedPickupCity, setSelectedPickupCity] = useState('');
  const [selectedDropCity, setSelectedDropCity] = useState('');
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [calculatedFuelCost, setCalculatedFuelCost] = useState(0);

  const availableDrivers = drivers.filter(driver => driver.status === 'available');
  const availableVehicles = vehicles.filter(vehicle => vehicle.status === 'available');
  const activeCities = cities.filter(city => city.isActive);

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      driver: '',
      vehicle: '',
      pickupCity: '',
      dropCity: '',
      routeId: '',
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
      driverAllowance: '',
      cleanerAllowance: '',
      notes: '',
      collection: '',
    },
  });

  // Filter routes based on selected cities
  useEffect(() => {
    if (selectedPickupCity && selectedDropCity) {
      const filtered = routes.filter(route => 
        (route.fromCity === selectedPickupCity && route.toCity === selectedDropCity) ||
        (route.fromCity === selectedDropCity && route.toCity === selectedPickupCity) // Reverse route
      ).filter(route => route.isActive);
      setAvailableRoutes(filtered);
    } else {
      setAvailableRoutes([]);
    }
  }, [selectedPickupCity, selectedDropCity, routes]);

  // Update form when route is selected
  useEffect(() => {
    if (selectedRoute) {
      form.setValue('distance', `${selectedRoute.distance} km`);
      if (selectedRoute.baseFare) {
        form.setValue('fare', selectedRoute.baseFare.toString());
      }
      
      // Calculate fuel consumption if vehicle is also selected
      if (selectedVehicle && selectedVehicle.mileageValue) {
        const fuelConsumption = selectedRoute.distance / selectedVehicle.mileageValue;
        const unit = selectedVehicle.mileageUnit === 'kmpl' ? 'L' : 'kg';
        form.setValue('fuelConsumption', `${fuelConsumption.toFixed(2)} ${unit}`);
        
        // Calculate fuel cost
        const fuelCost = calculateFuelCost(
          selectedVehicle.mileageValue,
          selectedVehicle.mileageUnit,
          selectedRoute.distance,
          selectedVehicle.fuelType
        );
        setCalculatedFuelCost(fuelCost);
      }
    }
  }, [selectedRoute, selectedVehicle, form, calculateFuelCost]);

  // Update form when vehicle is selected - auto-fill load capacity and calculate fuel cost
  useEffect(() => {
    if (selectedVehicle) {
      form.setValue('totalCapacity', selectedVehicle.capacity);
      
      // Calculate fuel consumption and cost if distance is available
      const distance = form.watch('distance');
      const distanceValue = parseFloat(distance.replace(/[^0-9.]/g, ''));
      if (distanceValue > 0 && selectedVehicle.mileageValue && selectedVehicle.mileageUnit && selectedVehicle.fuelType) {
        // Calculate fuel consumption
        const fuelConsumption = distanceValue / selectedVehicle.mileageValue;
        const unit = selectedVehicle.mileageUnit === 'kmpl' ? 'L' : 'kg';
        form.setValue('fuelConsumption', `${fuelConsumption.toFixed(2)} ${unit}`);
        
        // Calculate fuel cost
        const fuelCost = calculateFuelCost(
          selectedVehicle.mileageValue, 
          selectedVehicle.mileageUnit, 
          distanceValue, 
          selectedVehicle.fuelType
        );
        setCalculatedFuelCost(fuelCost);
      }
    }
  }, [selectedVehicle, form, calculateFuelCost]);

  // Recalculate fuel consumption and cost when distance changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'distance' && selectedVehicle && value.distance) {
        const distanceValue = parseFloat(value.distance.replace(/[^0-9.]/g, ''));
        if (distanceValue > 0 && selectedVehicle.mileageValue) {
          // Calculate fuel consumption
          const fuelConsumption = distanceValue / selectedVehicle.mileageValue;
          const unit = selectedVehicle.mileageUnit === 'kmpl' ? 'L' : 'kg';
          form.setValue('fuelConsumption', `${fuelConsumption.toFixed(2)} ${unit}`);
          
          // Calculate fuel cost
          const fuelCost = calculateFuelCost(
            selectedVehicle.mileageValue,
            selectedVehicle.mileageUnit,
            distanceValue,
            selectedVehicle.fuelType
          );
          setCalculatedFuelCost(fuelCost);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [selectedVehicle, form, calculateFuelCost]);

  const onSubmit = async (data: TripFormData) => {
    try {
      const pickupCityName = cities.find(c => c.id === data.pickupCity)?.name || '';
      const dropCityName = cities.find(c => c.id === data.dropCity)?.name || '';
      
      const tripData: Omit<Trip, 'id'> = {
        driver: data.driver,
        vehicle: data.vehicle,
        route: selectedRoute ? selectedRoute.name : `${pickupCityName} to ${dropCityName}`,
        routeId: data.routeId || '',
        pickupCity: data.pickupCity,
        dropCity: data.dropCity,
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
        driverAllowance: data.driverAllowance ? parseFloat(data.driverAllowance) : 0,
        cleanerAllowance: data.cleanerAllowance ? parseFloat(data.cleanerAllowance) : 0,
        notes: data.notes || '',
        collection: data.collection ? parseFloat(data.collection) : 0,
        progress: 0,
        currentLocation: 'Starting Point',
        companyId: '', // Will be set by the hook
        createdBy: '', // Will be set by the hook
        createdByRole: 'company_admin' as any, // Will be set by the hook
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        driverId: '', // Will be set by the hook if needed
        // Don't include endTime and actualArrival for new trips - they'll be added when the trip status changes
        expenses: [],
        totalExpenses: 0,
      };

      await addTrip(tripData);
      toast({
        title: 'Success',
        description: 'Trip added successfully',
      });
      form.reset();
      setSelectedPickupCity('');
      setSelectedDropCity('');
      setSelectedRoute(null);
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
        <div className="grid grid-cols-2 gap-4">
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
                <Select onValueChange={(value) => {
                  field.onChange(value);
                  const vehicle = availableVehicles.find(v => v.registrationNumber === value);
                  setSelectedVehicle(vehicle);
                }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.registrationNumber}>
                        {vehicle.registrationNumber} ({vehicle.make} {vehicle.model}) - {vehicle.capacity}
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
            name="pickupCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup City</FormLabel>
                <Select onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedPickupCity(value);
                }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pickup city" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeCities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
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
            name="dropCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drop City</FormLabel>
                <Select onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedDropCity(value);
                }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select drop city" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeCities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {availableRoutes.length > 0 && (
          <FormField
            control={form.control}
            name="routeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Route (Optional)</FormLabel>
                <Select onValueChange={(value) => {
                  field.onChange(value);
                  const route = availableRoutes.find(r => r.id === value);
                  setSelectedRoute(route);
                }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select route (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableRoutes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name} - {route.distance}km - ₹{route.baseFare || 0}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pickupLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mumbai Central Station" {...field} />
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
                  <Input placeholder="e.g., Pune Railway Station" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
              <FormLabel>Total Capacity {selectedVehicle && `(Auto-filled: ${selectedVehicle.capacity})`}</FormLabel>
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
                <FormLabel>Fuel Consumption {selectedVehicle && selectedRoute && '(Auto-calculated)'}</FormLabel>
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

        <div className="grid grid-cols-3 gap-4">
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
            name="driverAllowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Driver Allowance</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Amount in ₹" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cleanerAllowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cleaner Allowance</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Amount in ₹" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        <FormField
          control={form.control}
          name="collection"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection Amount (Optional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Amount collected in ₹" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {calculatedFuelCost > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Estimated Trip Costs</h4>
            <div className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <div>Estimated Fuel Cost: ₹{calculatedFuelCost.toFixed(2)}</div>
              <div>Driver Allowance: ₹{(parseFloat(form.watch('driverAllowance') || '0')).toFixed(2)}</div>
              <div>Cleaner Allowance: ₹{(parseFloat(form.watch('cleanerAllowance') || '0')).toFixed(2)}</div>
              <div className="font-semibold pt-1 border-t border-blue-200 dark:border-blue-800">
                Total Estimated Cost: ₹{(calculatedFuelCost + parseFloat(form.watch('driverAllowance') || '0') + parseFloat(form.watch('cleanerAllowance') || '0')).toFixed(2)}
              </div>
              {form.watch('collection') && (
                <div className="font-semibold text-green-700 dark:text-green-300">
                  Expected Profit: ₹{(parseFloat(form.watch('collection') || '0') - (calculatedFuelCost + parseFloat(form.watch('driverAllowance') || '0') + parseFloat(form.watch('cleanerAllowance') || '0'))).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full">
          Add Trip
        </Button>
      </form>
    </Form>
  );
};

export default AddTripForm;