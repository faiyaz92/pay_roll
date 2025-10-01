import React, { useEffect, useState } from 'react';
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
import InsuranceDocumentUploader from './InsuranceDocumentUploader';
import { uploadToCloudinary } from '@/lib/cloudinary';

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
  const [insuranceDocuments, setInsuranceDocuments] = useState({
    policyCopy: null as any,
    rcCopy: null as any,
    previousYearPolicy: null as any,
    additional: [] as any[],
  });
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  // Define schema inside component to access isCorrection prop and editingRecord
  const insuranceRecordSchema = z.object({
    vehicleId: editingRecord ? z.string().optional() : z.string().min(1, 'Vehicle is required'),
    driverId: z.string().optional(),
    insuranceType: editingRecord ? z.string().optional() : z.enum(['third_party', 'zero_dept', 'comprehensive', 'topup']),
    policyNumber: editingRecord ? z.string().optional() : z.string().min(1, 'Policy number is required'),
    description: editingRecord ? z.string().optional() : z.string().min(1, 'Description is required'),
    amount: editingRecord ? z.string().optional() : z.string().min(1, 'Amount is required'),
    vendor: editingRecord ? z.string().optional() : z.string().min(1, 'Insurance provider is required'),
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
  const { vehicles, drivers, addExpense, updateExpense, updateVehicle } = useFirebaseData();
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

  // Upload insurance documents to Cloudinary
  const uploadInsuranceDocuments = async () => {
    const uploadedDocuments: Record<string, string> = {};

    for (const [type, doc] of Object.entries(insuranceDocuments)) {
      if (doc && doc.file) {
        try {
          const cloudinaryUrl = await uploadToCloudinary(doc.file);
          uploadedDocuments[type] = cloudinaryUrl;
        } catch (error) {
          console.error(`Failed to upload ${type} document:`, error);
          throw new Error(`Failed to upload ${type} document`);
        }
      }
    }

    return uploadedDocuments;
  };

  // Populate form when editing
  useEffect(() => {
    if (editingRecord) {
      // Helper function to format date for HTML input
      const formatDateForInput = (dateString: string | undefined) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch {
          return '';
        }
      };

      form.reset({
        vehicleId: editingRecord.vehicleId || '',
        driverId: editingRecord.driverId || '',
        insuranceType: editingRecord.insuranceDetails?.insuranceType || editingRecord.insuranceType || 'third_party',
        policyNumber: editingRecord.insuranceDetails?.policyNumber || editingRecord.policyNumber || '',
        description: editingRecord.description || '',
        amount: editingRecord.amount?.toString() || '',
        vendor: editingRecord.vendor || '',
        startDate: formatDateForInput(editingRecord.insuranceDetails?.startDate || editingRecord.startDate),
        endDate: formatDateForInput(editingRecord.insuranceDetails?.endDate || editingRecord.endDate),
        receiptNumber: editingRecord.receiptNumber || '',
        notes: editingRecord.notes || '',
        originalTransactionRef: '',
      });

      // Populate existing documents if available
      if (editingRecord.insuranceDocuments) {
        const existingDocs = { ...insuranceDocuments };
        Object.entries(editingRecord.insuranceDocuments).forEach(([key, url]) => {
          if (key === 'policyCopy' && url) {
            existingDocs.policyCopy = {
              url: url as string,
              name: 'Insurance Policy Copy',
              size: 0, // We don't have size info for existing docs
              uploadedAt: new Date().toISOString()
            };
          } else if (key === 'rcCopy' && url) {
            existingDocs.rcCopy = {
              url: url as string,
              name: 'RC Copy (Registration Certificate)',
              size: 0,
              uploadedAt: new Date().toISOString()
            };
          } else if (key === 'previousYearPolicy' && url) {
            existingDocs.previousYearPolicy = {
              url: url as string,
              name: 'Previous Year Policy',
              size: 0,
              uploadedAt: new Date().toISOString()
            };
          }
        });
        setInsuranceDocuments(existingDocs);
      }
    } else {
      form.reset();
      setInsuranceDocuments({
        policyCopy: null,
        rcCopy: null,
        previousYearPolicy: null,
        additional: [],
      });
    }
  }, [editingRecord, form]);

  const onSubmit = async (data: InsuranceRecordFormData) => {
    try {
      setIsUploadingDocuments(true);

      // Upload insurance documents first
      let uploadedDocuments = {};
      try {
        uploadedDocuments = await uploadInsuranceDocuments();
      } catch (error) {
        toast({
          title: 'Document Upload Failed',
          description: error.message || 'Failed to upload insurance documents. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (editingRecord) {
        // Handle editing insurance dates and documents - only update vehicle record
        await updateVehicle(editingRecord.vehicleId, {
          insuranceExpiryDate: data.endDate,
          insuranceStartDate: data.startDate,
          insurancePolicyNumber: data.policyNumber,
          insuranceProvider: data.vendor,
          insuranceDocuments: Object.keys(uploadedDocuments).length > 0 ? {
            ...editingRecord.insuranceDocuments,
            ...uploadedDocuments
          } : editingRecord.insuranceDocuments,
        });

        toast({
          title: 'Success',
          description: 'Insurance dates and documents updated successfully',
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
          insuranceDocuments: Object.keys(uploadedDocuments).length > 0 ? uploadedDocuments : undefined,
          isCorrection: isCorrection,
          originalTransactionRef: data.originalTransactionRef,
        };

        await addExpense(expenseData);

        // Also update the vehicle record with insurance details
        await updateVehicle(data.vehicleId, {
          insuranceExpiryDate: data.endDate,
          insuranceStartDate: data.startDate,
          insurancePolicyNumber: data.policyNumber,
          insuranceProvider: data.vendor,
          insurancePremium: parseFloat(data.amount),
          insuranceDocuments: Object.keys(uploadedDocuments).length > 0 ? uploadedDocuments : undefined,
        });

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
      setInsuranceDocuments({
        policyCopy: null,
        rcCopy: null,
        previousYearPolicy: null,
        additional: [],
      });
      setIsUploadingDocuments(false);
    } catch (error) {
      console.error('Error in insurance form submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to process insurance record',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingDocuments(false);
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

        {/* Insurance Documents Upload Section */}
        <div className="border-t pt-6">
          <InsuranceDocumentUploader
            documents={insuranceDocuments}
            onDocumentsChange={setInsuranceDocuments}
            isUploading={isUploadingDocuments}
          />
        </div>

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

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isUploadingDocuments}>
          {isUploadingDocuments ? 'Uploading Documents...' : form.formState.isSubmitting ? (editingRecord ? 'Updating Insurance Dates...' : 'Adding Insurance Record...') : (editingRecord ? 'Update Insurance Dates' : isCorrection ? 'Record Correction' : 'Add Insurance Record')}
        </Button>
      </form>
    </Form>
  );
};

export default AddInsuranceRecordForm;