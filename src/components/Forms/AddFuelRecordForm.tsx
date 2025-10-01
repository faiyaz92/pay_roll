import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseData } from '@/hooks/useFirebaseData';

const fuelRecordSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  amount: z.string().min(1, 'Amount is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  pricePerLiter: z.string().min(1, 'Price per liter is required'),
  fuelType: z.string().min(1, 'Fuel type is required'),
  location: z.string().min(1, 'Location is required'),
  odometer: z.string().min(1, 'Odometer reading is required'),
  // Correction fields
  isCorrection: z.boolean().optional(),
  originalTransactionRef: z.string().optional(),
  correctionType: z.enum(['add', 'subtract']).optional(),
});

type FuelRecordFormData = z.infer<typeof fuelRecordSchema>;

interface AddFuelRecordFormProps {
  onSuccess: (data: any) => void; // Changed to pass data to parent
}

const AddFuelRecordForm: React.FC<AddFuelRecordFormProps> = ({ onSuccess }) => {
  // Get real Firebase data instead of mock data
  const { vehicles, drivers, expenses } = useFirebaseData();
  const { userInfo } = useAuth();
  const { toast } = useToast();

  const form = useForm<FuelRecordFormData>({
    resolver: zodResolver(fuelRecordSchema),
    defaultValues: {
      vehicleId: '',
      driverId: '',
      amount: '',
      quantity: '',
      pricePerLiter: '',
      fuelType: 'Diesel',
      location: '',
      odometer: '',
      isCorrection: false,
      originalTransactionRef: '',
      correctionType: 'add',
    },
  });

  const onSubmit = async (data: FuelRecordFormData) => {
    try {
      // Validate odometer reading against previous records
      const existingRecords = expenses.filter(expense => 
        expense.vehicleId === data.vehicleId && 
        (expense.expenseType === 'fuel' || expense.description?.toLowerCase().includes('fuel')) &&
        expense.odometerReading
      );
      const maxOdometer = existingRecords.length > 0 
        ? Math.max(...existingRecords.map(record => typeof record.odometerReading === 'number' ? record.odometerReading : 0))
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
        amount: data.isCorrection && data.correctionType === 'subtract' 
          ? -parseFloat(data.amount) // Negative amount for subtractions
          : parseFloat(data.amount), // Positive amount for additions/corrections
        description: data.isCorrection 
          ? `Fuel ${data.correctionType} correction - Ref: ${data.originalTransactionRef} - ${data.quantity}L @ ₹${data.pricePerLiter}/L`
          : `Fuel ${data.fuelType} - ${data.quantity}L @ ₹${data.pricePerLiter}/L`,
        billUrl: '',
        submittedBy: data.driverId, // Use driver as submitter
        status: 'approved' as const,
        approvedAt: new Date().toISOString(),
        adjustmentWeeks: 0,
        type: 'fuel',
        verifiedKm: parseInt(data.odometer) || 0,
        companyId: '',
        createdAt: '',
        updatedAt: '',
        // Additional fuel-specific fields
        fuelType: data.fuelType,
        quantity: parseFloat(data.quantity),
        pricePerLiter: parseFloat(data.pricePerLiter),
        odometerReading: parseInt(data.odometer),
        station: data.location,
        // Correction fields
        isCorrection: data.isCorrection || false,
        originalTransactionRef: data.originalTransactionRef || null,
        correctionType: data.correctionType || null,
      };

      // Call parent's onSuccess with the fuel record data
      await onSuccess(fuelRecordData);
      
      // Reset form on successful submission
      form.reset();
    } catch (error) {
      console.error('Error in fuel form submission:', error);
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

        {/* Correction Entry Section */}
        <div className="space-y-4 border-t pt-4">
          <FormField
            control={form.control}
            name="isCorrection"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium">
                    This is a correction entry
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Check this if you're correcting a previous fuel entry (add/subtract amount)
                  </p>
                </div>
              </FormItem>
            )}
          />

          {form.watch('isCorrection') && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="originalTransactionRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Transaction Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Receipt # or Transaction ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="correctionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select correction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="add">Add Amount (Increase total)</SelectItem>
                        <SelectItem value="subtract">Subtract Amount (Decrease total)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Button type="submit" className="w-full">
          {form.watch('isCorrection') ? 'Add Fuel Correction' : 'Add Fuel Record'}
        </Button>
      </form>
    </Form>
  );
};

export default AddFuelRecordForm;