import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseData } from '@/hooks/useFirebaseData';

const maintenanceRecordSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().optional(), // Optional for maintenance records
  type: z.enum(['routine', 'repair', 'inspection', 'other']),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  serviceProvider: z.string().min(1, 'Service provider is required'),
  odometer: z.string().min(1, 'Odometer reading is required'),
  nextServiceOdometer: z.string().optional(),
  // Correction fields
  isCorrection: z.boolean().optional(),
  originalTransactionRef: z.string().optional(),
  correctionType: z.enum(['add', 'subtract']).optional(),
});

type MaintenanceRecordFormData = z.infer<typeof maintenanceRecordSchema>;

interface AddMaintenanceRecordFormProps {
  onSuccess: (data: any) => void; // Changed to pass data to parent
}

const AddMaintenanceRecordForm: React.FC<AddMaintenanceRecordFormProps> = ({ onSuccess }) => {
  // Get real Firebase data instead of mock data
  const { vehicles, drivers, expenses } = useFirebaseData();
  const { userInfo } = useAuth();
  const { toast } = useToast();

  const form = useForm<MaintenanceRecordFormData>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: {
      vehicleId: '',
      driverId: '',
      type: 'routine',
      description: '',
      amount: '',
      serviceProvider: '',
      odometer: '',
      nextServiceOdometer: '',
      isCorrection: false,
      originalTransactionRef: '',
      correctionType: 'add',
    },
  });

  const onSubmit = async (data: MaintenanceRecordFormData) => {
    try {
      // Validate odometer reading against previous records
      const existingRecords = expenses.filter(expense => 
        expense.vehicleId === data.vehicleId && 
        (expense.expenseType === 'maintenance' || expense.type === 'maintenance') &&
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

      const maintenanceRecordData = {
        vehicleId: data.vehicleId,
        amount: data.isCorrection && data.correctionType === 'subtract' 
          ? -parseFloat(data.amount) // Negative amount for subtractions
          : parseFloat(data.amount), // Positive amount for additions/corrections
        description: data.isCorrection 
          ? `Maintenance ${data.correctionType} correction - ${data.type} - Ref: ${data.originalTransactionRef} - ${data.serviceProvider}`
          : `Maintenance ${data.type} - ${data.serviceProvider}`,
        billUrl: '',
        submittedBy: data.driverId || 'owner', // Use driver as submitter or default to owner
        status: 'approved' as const,
        approvedAt: new Date().toISOString(),
        adjustmentWeeks: 0,
        type: 'maintenance',
        verifiedKm: parseInt(data.odometer) || 0,
        companyId: '',
        createdAt: '',
        updatedAt: '',
        // Additional maintenance-specific fields
        maintenanceType: data.type,
        serviceProvider: data.serviceProvider,
        odometerReading: parseInt(data.odometer),
        ...(data.nextServiceOdometer && { nextDueOdometer: parseInt(data.nextServiceOdometer) }),
        // Correction fields
        isCorrection: data.isCorrection || false,
        originalTransactionRef: data.originalTransactionRef || null,
        correctionType: data.correctionType || null,
      };

      // Call parent's onSuccess with the maintenance record data
      await onSuccess(maintenanceRecordData);
      
      // Reset form on successful submission
      form.reset();
    } catch (error) {
      console.error('Error in maintenance form submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to add maintenance record',
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
                <FormLabel>Driver (Optional)</FormLabel>
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="routine">Routine Service</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 5000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the maintenance work performed..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceProvider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Provider</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ABC Auto Service Center" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="odometer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Odometer (km)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 75000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextServiceOdometer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Service at (km) - Optional</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 80000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  <FormLabel>
                    This is a correction entry
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Check this if you're correcting a previous maintenance record
                  </p>
                </div>
              </FormItem>
            )}
          />

          {form.watch('isCorrection') && (
            <div className="space-y-4 border border-yellow-200 bg-yellow-50 p-4 rounded-md">
              <FormField
                control={form.control}
                name="originalTransactionRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Transaction ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Paste the original transaction ID here" {...field} />
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
                        <SelectItem value="add">Add Amount (+)</SelectItem>
                        <SelectItem value="subtract">Subtract Amount (-)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded">
                <strong>Note:</strong> This will create a new correction entry, not modify the original record. 
                The correction amount will be {form.watch('correctionType') === 'subtract' ? 'subtracted from' : 'added to'} the vehicle's expense total.
              </div>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full">
          {form.watch('isCorrection') ? 'Add Maintenance Correction' : 'Add Maintenance Record'}
        </Button>
      </form>
    </Form>
  );
};

export default AddMaintenanceRecordForm;