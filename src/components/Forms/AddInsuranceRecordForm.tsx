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
  insuranceType: z.enum(['third_party', 'zero_dept', 'comprehensive']),
  policyNumber: z.string().min(1, 'Policy number is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  vendor: z.string().min(1, 'Insurance provider is required'),
  startDate: z.string().min(1, 'Insurance start date is required'),
  endDate: z.string().min(1, 'Insurance end date is required'),
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
      insuranceType: 'third_party',
      policyNumber: '',
      description: '',
      amount: '',
      vendor: '',
      startDate: '',
      endDate: '',
      receiptNumber: '',
      notes: '',
    },
  });

  const onSubmit = async (data: InsuranceRecordFormData) => {
    try {
      // Validate date range
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (endDate <= startDate) {
        toast({
          title: 'Invalid Date Range',
          description: 'Insurance end date must be after start date.',
          variant: 'destructive',
        });
        return;
      }

      const insuranceRecordData = {
        vehicleId: data.vehicleId,
        driverId: data.driverId || undefined, // Convert empty string to undefined
        insuranceType: data.insuranceType,
        policyNumber: data.policyNumber,
        description: data.description,
        amount: parseFloat(data.amount),
        vendor: data.vendor,
        startDate: data.startDate,
        endDate: data.endDate,
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
            name="insuranceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select insurance type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="third_party">Third Party</SelectItem>
                    <SelectItem value="zero_dept">Zero Dept</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="policyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., POL12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Premium Amount (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 15000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            name="receiptNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receipt Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Receipt/Transaction number" {...field} />
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
          Add Insurance Expense
        </Button>
      </form>
    </Form>
  );
};

export default AddInsuranceRecordForm;