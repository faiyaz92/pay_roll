import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseData } from '@/hooks/useFirebaseData';

const insuranceRecordSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().optional(),
  category: z.enum(['premium', 'claim', 'renewal', 'registration', 'other']),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  vendor: z.string().min(1, 'Insurance provider is required'),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

type InsuranceRecordFormData = z.infer<typeof insuranceRecordSchema>;

interface AddInsuranceRecordFormProps {
  onSuccess: (data: any) => void;
}

const AddInsuranceRecordForm: React.FC<AddInsuranceRecordFormProps> = ({ onSuccess }) => {
  const { vehicles, drivers } = useFirebaseData();
  const { userInfo } = useAuth();
  const { toast } = useToast();

  const form = useForm<InsuranceRecordFormData>({
    resolver: zodResolver(insuranceRecordSchema),
    defaultValues: {
      vehicleId: '',
      driverId: '',
      category: 'premium',
      description: '',
      amount: '',
      vendor: '',
      receiptNumber: '',
      notes: '',
    },
  });

  const onSubmit = async (data: InsuranceRecordFormData) => {
    try {
      const insuranceRecordData = {
        vehicleId: data.vehicleId,
        driverId: data.driverId || undefined, // Convert empty string to undefined
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        vendor: data.vendor,
        receiptNumber: data.receiptNumber,
        notes: data.notes,
        date: new Date(),
        addedBy: userInfo?.userId || '',
        companyId: userInfo?.companyId || '',
        status: 'approved' // Auto-approve insurance records
      };

      // Call parent's onSuccess with the insurance record data
      await onSuccess(insuranceRecordData);
      
      // Reset form on successful submission
      form.reset();
    } catch (error) {
      console.error('Error in insurance form submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to add insurance record',
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="premium">Premium Payment</SelectItem>
                    <SelectItem value="claim">Insurance Claim</SelectItem>
                    <SelectItem value="renewal">Policy Renewal</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
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
                  <Input type="number" step="0.01" placeholder="e.g., 15000" {...field} />
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
                <Textarea placeholder="Describe the insurance transaction..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Provider</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., HDFC ERGO, ICICI Lombard" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="receiptNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receipt Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Receipt/Policy number" {...field} />
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
                <Textarea placeholder="Additional notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Add Insurance Record
        </Button>
      </form>
    </Form>
  );
};

export default AddInsuranceRecordForm;