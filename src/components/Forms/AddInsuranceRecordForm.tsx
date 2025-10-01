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

interface InsuranceRecordData {
  vehicleId: string;
  amount: number;
  description: string;
  billUrl: string;
  submittedBy: string;
  status: 'approved';
  approvedAt: string;
  adjustmentWeeks: number;
  type: string;
  verifiedKm: number;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  paymentType: string;
  expenseType: string;
  vendor: string;
  receiptNumber?: string;
  notes?: string;
  insuranceDetails: {
    insuranceType: 'third_party' | 'zero_dept' | 'comprehensive' | 'topup';
    policyNumber: string;
    startDate: string;
    endDate: string;
  };
  isCorrection: boolean;
  originalTransactionRef?: string;
}

interface AddInsuranceRecordFormProps {
  onSuccess?: (data: InsuranceRecordData) => void;
  editingRecord?: Expense;
  isCorrection?: boolean;
}

const AddInsuranceRecordForm: React.FC<AddInsuranceRecordFormProps> = ({ onSuccess, editingRecord, isCorrection = false }) => {
  // Define schema inside component to access isCorrection prop
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

  type InsuranceRecordFormData = z.infer<typeof insuranceRecordSchema>;
  const { vehicles, drivers, addExpense, updateExpense } = useFirebaseData();
  const { userInfo } = useAuth();
  const { toast } = useToast();

  const form = useForm<InsuranceRecordFormData>({
    resolver: zodResolver(insuranceRecordSchema),
    defaultValues: {
      vehicleId: '',
      driverId: '',
      insuranceType: 'third_party',
      policyNumber: '',
      description: isCorrection ? 'Insurance correction' : '',
      amount: '',
      vendor: '',
      startDate: '',
      endDate: '',
      receiptNumber: '',
      notes: '',
      originalTransactionRef: '',
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
        originalTransactionRef: '',
      });
    } else {
      form.reset();
    }
  }, [editingRecord, form]);

  const onSubmit = async (data: InsuranceRecordFormData) => {
    try {

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
          amount: isCorrection ? parseFloat(data.amount) : parseFloat(data.amount), // Allow negative amounts for corrections
          description: isCorrection 
            ? `Insurance correction - Ref: ${data.originalTransactionRef} - ${data.description}`
            : data.description,
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
          isCorrection: isCorrection,
          originalTransactionRef: data.originalTransactionRef,
        };

        await addExpense(expenseData);

      

        toast({
          title: 'Success',
          description: isCorrection
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
          {editingRecord ? 'Update Insurance Dates' : isCorrection ? 'Record Correction' : 'Add Insurance Expense'}
        </Button>
      </form>
    </Form>
  );
};

export default AddInsuranceRecordForm;