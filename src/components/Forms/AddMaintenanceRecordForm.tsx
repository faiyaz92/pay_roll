import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMaintenanceRecords, useVehicles } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const maintenanceRecordSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  type: z.enum(['routine', 'repair', 'inspection', 'other']),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  serviceProvider: z.string().min(1, 'Service provider is required'),
  odometer: z.string().min(1, 'Odometer reading is required'),
  nextServiceOdometer: z.string().optional(),
});

type MaintenanceRecordFormData = z.infer<typeof maintenanceRecordSchema>;

interface AddMaintenanceRecordFormProps {
  onSuccess: () => void;
}

const AddMaintenanceRecordForm: React.FC<AddMaintenanceRecordFormProps> = ({ onSuccess }) => {
  const { addMaintenanceRecord } = useMaintenanceRecords();
  const { vehicles } = useVehicles();
  const { userInfo } = useAuth();
  const { toast } = useToast();

  const form = useForm<MaintenanceRecordFormData>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: {
      vehicleId: '',
      type: 'routine',
      description: '',
      amount: '',
      serviceProvider: '',
      odometer: '',
      nextServiceOdometer: '',
    },
  });

  const onSubmit = async (data: MaintenanceRecordFormData) => {
    try {
      const maintenanceRecordData = {
        vehicleId: data.vehicleId,
        type: data.type,
        description: data.description,
        amount: parseFloat(data.amount),
        serviceProvider: data.serviceProvider,
        odometer: parseInt(data.odometer),
        ...(data.nextServiceOdometer && { nextServiceOdometer: parseInt(data.nextServiceOdometer) }),
        addedBy: userInfo?.userId || '',
        addedAt: new Date().toISOString(),
        companyId: userInfo?.companyId || '',
      };

      await addMaintenanceRecord(maintenanceRecordData);
      toast({
        title: 'Success',
        description: 'Maintenance record added successfully',
      });
      form.reset();
      onSuccess();
    } catch (error) {
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

        <Button type="submit" className="w-full">
          Add Maintenance Record
        </Button>
      </form>
    </Form>
  );
};

export default AddMaintenanceRecordForm;