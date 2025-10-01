import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { Expense } from '@/hooks/useFirebaseData';

const insuranceRecordSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().optional(),
  insuranceType: z.enum(['third_party', 'zero_dept', 'comprehensive', 'topup']),
  policyNumber: z.string().min(1, 'Policy number is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  vendor: z.string().min(1, 'Insurance provider is required'),
  startDate: z.string().min(1, 'Insurance start date is required'),
  endDate: z.string().min(1, 'Insurance end date is required'),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  // Correction fields
  isCorrection: z.boolean().optional(),
  originalTransactionRef: z.string().optional(),
  correctionType: z.enum(['add', 'subtract']).optional(),
});

type InsuranceRecordFormData = z.infer<typeof insuranceRecordSchema>;

interface AddInsuranceRecordFormProps {
  onSuccess?: (data: any) => void;
  editingRecord?: any;
}

const AddInsuranceRecordForm: React.FC<AddInsuranceRecordFormProps> = ({ onSuccess, editingRecord }) => {
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
      isCorrection: false,
      originalTransactionRef: '',
      correctionType: 'add',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingRecord) {
      form.reset({
        vehicleId: editingRecord.vehicleId || '',
        driverId: editingRecord.driverId || '',
        insuranceType: editingRecord.insuranceDetails?.insuranceType || editingRecord.insuranceType || 'third_party',
        policyNumber: editingRecord.insuranceDetails?.policyNumber || editingRecord.policyNumber || '',
        description: editingRecord.description || '',
        amount: editingRecord.amount?.toString() || '',
        vendor: editingRecord.vendor || '',
        startDate: editingRecord.insuranceDetails?.startDate || editingRecord.startDate || '',
        endDate: editingRecord.insuranceDetails?.endDate || editingRecord.endDate || '',
        receiptNumber: editingRecord.receiptNumber || '',
        notes: editingRecord.notes || '',
        isCorrection: false,
        originalTransactionRef: '',
        correctionType: 'add',
      });
    } else {
      form.reset();
    }
  }, [editingRecord, form]);

  const onSubmit = async (data: InsuranceRecordFormData) => {
    try {
      const { addExpense, updateExpense } = useFirebaseData();

      if (editingRecord) {
        // Handle editing vehicle insurance dates
        // await updateVehicleInsuranceStatus(editingRecord.vehicleId, {
        //   policyNumber: editingRecord.insuranceDetails?.policyNumber || editingRecord.policyNumber || '',
        //   insuranceType: editingRecord.insuranceDetails?.insuranceType || editingRecord.insuranceType || 'third_party',
        //   startDate: data.startDate,
        //   endDate: data.endDate,
        //   status: 'active',
        // });

        toast({
          title: 'Success',
          description: 'Insurance dates updated successfully',
        });
      } else {
        // Handle new record creation
        const expenseData: Omit<Expense, 'id'> = {
          vehicleId: data.vehicleId,
          amount: parseFloat(data.amount),
          description: data.description,
          billUrl: '',
          submittedBy: data.driverId || 'owner',
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          adjustmentWeeks: 0,
          type: 'insurance',
          verifiedKm: 0,
          companyId: '',
          createdAt: '',
          updatedAt: '',
          paymentType: 'expenses',
          expenseType: 'insurance',
          // Additional insurance-specific fields
          vendor: data.vendor,
          receiptNumber: data.receiptNumber,
          notes: data.notes,
          insuranceDetails: {
            insuranceType: data.insuranceType,
            policyNumber: data.policyNumber,
            startDate: data.startDate,
            endDate: data.endDate,
          },
          isCorrection: data.isCorrection,
          originalTransactionRef: data.originalTransactionRef,
          correctionType: data.correctionType,
        };

        await addExpense(expenseData);

      

        toast({
          title: 'Success',
          description: data.isCorrection
            ? 'Insurance correction recorded successfully'
            : data.insuranceType === 'topup'
            ? 'Insurance topup recorded successfully'
            : 'Insurance record added successfully',
        });
      }

      // Reset form on successful submission
      form.reset();
    } catch (error) {
      console.error('Error in insurance form submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to process insurance record',
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingRecord}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingRecord}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingRecord}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select insurance type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="third_party">Third Party</SelectItem>
                    <SelectItem value="zero_dept">Zero Dept</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    <SelectItem value="topup">Topup</SelectItem>
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
                  <Input placeholder="e.g., POL12345678" {...field} disabled={!!editingRecord} />
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
                  <Input type="number" step="0.01" placeholder="e.g., 15000" {...field} disabled={!!editingRecord} />
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
                  <Input placeholder="e.g., HDFC ERGO, ICICI Lombard" {...field} disabled={!!editingRecord} />
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
                <Textarea placeholder="Describe the insurance transaction..." {...field} disabled={!!editingRecord} />
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
                  <Input placeholder="Receipt/Transaction number" {...field} disabled={!!editingRecord} />
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

        {/* Correction Section - Only show when not editing */}
        {!editingRecord && (
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
                    <FormLabel>This is a correction entry</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check this if you're correcting a previous insurance transaction
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
                      <FormLabel>Original Transaction ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Paste the original transaction ID" {...field} />
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
                          <SelectItem value="add">Add to original amount</SelectItem>
                          <SelectItem value="subtract">Subtract from original amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        )}        <Button type="submit" className="w-full">
          {editingRecord ? 'Update Insurance Dates' : 'Add Insurance Expense'}
        </Button>
      </form>
    </Form>
  );
};

export default AddInsuranceRecordForm;