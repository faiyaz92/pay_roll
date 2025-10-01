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

interface FuelRecordData {
  vehicleId: string;
  amount: number;
  description: string;
  billUrl: string;
  submittedBy: string;
  status: 'approved';
  approvedAt: string;
  adjustmentWeeks: number;
  expenseType: 'fuel';
  type: 'fuel';
  verifiedKm: number;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  fuelType: string;
  quantity: number;
  pricePerLiter: number;
  odometerReading: number;
  station: string;
  isCorrection: boolean;
  originalTransactionRef: string | null;
}

interface AddFuelRecordFormProps {
  onSuccess: (data: FuelRecordData) => void | Promise<void>;
  isCorrection?: boolean;
}

const AddFuelRecordForm: React.FC<AddFuelRecordFormProps> = ({ onSuccess, isCorrection = false }) => {
  // Define schema inside component to access isCorrection prop
  const fuelRecordSchema = z.object({
    vehicleId: z.string().min(1, 'Vehicle is required'),
    driverId: z.string().min(1, 'Driver is required'),
    amount: z.string().min(1, 'Amount is required'),
    quantity: z.string().min(1, 'Quantity is required'),
    pricePerLiter: z.string().min(1, 'Price per liter is required'),
    fuelType: z.string().min(1, 'Fuel type is required'),
    location: z.string().min(1, 'Location is required'),
    odometer: z.string().min(1, 'Odometer reading is required'),
    // Correction fields - required when isCorrection is true
    originalTransactionRef: z.string().optional(),
  }).superRefine((data, ctx) => {
    // If this is a correction form, originalTransactionRef is required
    if (isCorrection && (!data.originalTransactionRef || data.originalTransactionRef.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Original transaction ID is required for corrections',
        path: ['originalTransactionRef'],
      });
    }
  });

  type FuelRecordFormData = z.infer<typeof fuelRecordSchema>;
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
      originalTransactionRef: '',
    },
  });

  const onSubmit = async (data: FuelRecordFormData) => {
    try {
      // Skip odometer validation for corrections
      if (!isCorrection) {
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
      }

      const fuelRecordData = {
        vehicleId: data.vehicleId,
        amount: parseFloat(data.amount), // Allow any amount for corrections (positive or negative)
        description: isCorrection 
          ? `Fuel correction - Ref: ${data.originalTransactionRef} - ${data.quantity}L @ ₹${data.pricePerLiter}/L`
          : `Fuel ${data.fuelType} - ${data.quantity}L @ ₹${data.pricePerLiter}/L`,
        billUrl: '',
        submittedBy: data.driverId, // Use driver as submitter
        status: 'approved' as const,
        approvedAt: new Date().toISOString(),
        adjustmentWeeks: 0,
        expenseType: 'fuel' as const,
        type: 'fuel' as const,
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
        isCorrection: isCorrection,
        originalTransactionRef: data.originalTransactionRef || null,
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

        {/* Correction Section - Only show when isCorrection is true */}
        {isCorrection && (
          <div className="space-y-4 border-t pt-4">
            <FormField
              control={form.control}
              name="originalTransactionRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Transaction ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Paste the original transaction ID to correct" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" className="w-full">
          {isCorrection ? 'Record Correction' : 'Add Fuel Record'}
        </Button>
      </form>
    </Form>
  );
};

export default AddFuelRecordForm;