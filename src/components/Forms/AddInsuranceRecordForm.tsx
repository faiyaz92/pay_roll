import React, { useEffect, useState, useMemo } from 'react';
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
import { firestore } from '@/config/firebase';
import { addDoc, collection } from 'firebase/firestore';

// Define schema outside component to avoid recreation on every render
const createInsuranceRecordSchema = (editingRecord: Expense | undefined, isCorrection: boolean) => z.object({
  vehicleId: editingRecord ? z.string().optional() : z.string().min(1, 'Vehicle is required'),
  driverId: z.string().optional(),
  insuranceType: editingRecord ? z.string().optional() : z.enum(['fix_insurance', 'rego', 'green_slip', 'pink_slip']),
  policyNumber: editingRecord ? z.string().optional() : z.string().min(1, 'Policy number is required'),
  description: editingRecord ? z.string().optional() : z.string().min(1, 'Description is required'),
  amount: editingRecord ? z.string().optional() : z.string().min(1, 'Amount is required'),
  vendor: editingRecord ? z.string().optional() : z.string().min(1, 'Insurance provider is required'),
  startDate: z.string().min(1, 'Insurance start date is required'),
  endDate: z.string().min(1, 'Insurance end date is required'),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  // Proration field
  isAdvance: z.boolean().optional(),
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
    insuranceType: 'fix_insurance' | 'rego' | 'green_slip' | 'pink_slip';
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
  console.log('AddInsuranceRecordForm rendered with editingRecord:', editingRecord, 'isCorrection:', isCorrection);
interface InsuranceDocument {
  id: string;
  name: string;
  url: string;
  type: 'policy' | 'rc' | 'previous' | 'additional';
  uploadedAt: string;
  size: number;
  file?: File;
}

const [insuranceDocuments, setInsuranceDocuments] = useState<{
  policyCopy: InsuranceDocument | null;
  rcCopy: InsuranceDocument | null;
  previousYearPolicy: InsuranceDocument | null;
  additional: InsuranceDocument[];
}>({
  policyCopy: null,
  rcCopy: null,
  previousYearPolicy: null,
  additional: [],
});
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [prorationValues, setProrationValues] = useState({
    coverageMonths: 0,
    proratedMonthly: 0,
  });

  // Current month checkbox state
  const [useCurrentMonth, setUseCurrentMonth] = useState(false);

  // Create schema based on current props
  const insuranceRecordSchema = useMemo(() => createInsuranceRecordSchema(editingRecord, isCorrection), [editingRecord, isCorrection]);

  type InsuranceRecordFormData = z.infer<typeof insuranceRecordSchema>;

  const { vehicles, drivers, expenses, addExpense, updateExpense, updateVehicle } = useFirebaseData();
  const { userInfo } = useAuth();
  const { toast } = useToast();

  // Check for overlapping insurance policies of the same type
  const checkInsuranceOverlap = (vehicleId: string, insuranceType: string, startDate: string, endDate: string, excludeRecordId?: string): boolean => {
    const vehicleInsurances = expenses.filter(expense =>
      expense.vehicleId === vehicleId &&
      (expense.expenseType === 'insurance' || expense.type === 'insurance') &&
      expense.id !== excludeRecordId // Exclude current record when editing
    );

    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    for (const insurance of vehicleInsurances) {
      const existingType = insurance.insuranceDetails?.insuranceType || insurance.insuranceType;
      if (existingType === insuranceType) {
        const existingStart = new Date(insurance.insuranceDetails?.startDate || insurance.startDate);
        const existingEnd = new Date(insurance.insuranceDetails?.endDate || insurance.endDate);

        // Check for date overlap
        if (newStart <= existingEnd && newEnd >= existingStart) {
          return true; // Overlap found
        }
      }
    }

    return false; // No overlap
  };

  // Calculate proration values
  const calculateProration = (startDate: string, endDate: string, amount: number) => {
    if (!startDate || !endDate || !amount) return { coverageMonths: 0, proratedMonthly: 0 };

    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const proratedMonthly = amount / months;

    return { coverageMonths: months, proratedMonthly };
  };

  const form = useForm<InsuranceRecordFormData>({
    resolver: zodResolver(insuranceRecordSchema),
    defaultValues: {
      vehicleId: '',
      driverId: '',
      insuranceType: 'fix_insurance',
      policyNumber: '',
      description: isCorrection ? 'Insurance correction' : '',
      amount: '',
      vendor: '',
      startDate: '',
      endDate: '',
      receiptNumber: '',
      notes: '',
      // Proration default
      isAdvance: false,
      originalTransactionRef: '',
    },
  });

  // Upload insurance documents to Cloudinary
  const uploadInsuranceDocuments = async () => {
    const uploadedDocuments: Record<string, string> = {};

    for (const [type, doc] of Object.entries(insuranceDocuments)) {
      if (type === 'additional') {
        // Handle additional documents array
        const additionalDocs = doc as InsuranceDocument[];
        for (const additionalDoc of additionalDocs) {
          if (additionalDoc && additionalDoc.file) {
            try {
              const cloudinaryUrl = await uploadToCloudinary(additionalDoc.file);
              uploadedDocuments[`additional_${additionalDoc.id}`] = cloudinaryUrl;
            } catch (error) {
              console.error(`Failed to upload additional document ${additionalDoc.name}:`, error);
              throw new Error(`Failed to upload additional document ${additionalDoc.name}`);
            }
          }
        }
      } else {
        // Handle single document properties
        const singleDoc = doc as InsuranceDocument | null;
        if (singleDoc && singleDoc.file) {
          try {
            const cloudinaryUrl = await uploadToCloudinary(singleDoc.file);
            uploadedDocuments[type] = cloudinaryUrl;
          } catch (error) {
            console.error(`Failed to upload ${type} document:`, error);
            throw new Error(`Failed to upload ${type} document`);
          }
        }
      }
    }

    return uploadedDocuments;
  };

  // Populate form when editing
  useEffect(() => {
    console.log('Form useEffect triggered, editingRecord:', editingRecord);
    if (editingRecord) {
      console.log('Populating form for editing:', editingRecord);
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
        // Proration field
        isAdvance: editingRecord.isAdvance || false,
        originalTransactionRef: '',
      });

      // Populate existing documents if available
      if (editingRecord.insuranceDocuments) {
        const existingDocs = { ...insuranceDocuments };
        Object.entries(editingRecord.insuranceDocuments).forEach(([key, url]) => {
          if (key === 'policyCopy' && url) {
            existingDocs.policyCopy = {
              id: `policy-${Date.now()}`,
              url: url as string,
              name: 'Insurance Policy Copy',
              type: 'policy',
              size: 0, // We don't have size info for existing docs
              uploadedAt: new Date().toISOString()
            };
          } else if (key === 'rcCopy' && url) {
            existingDocs.rcCopy = {
              id: `rc-${Date.now()}`,
              url: url as string,
              name: 'RC Copy',
              type: 'rc',
              size: 0,
              uploadedAt: new Date().toISOString()
            };
          } else if (key === 'previousYearPolicy' && url) {
            existingDocs.previousYearPolicy = {
              id: `previous-${Date.now()}`,
              url: url as string,
              name: 'Previous Year Policy',
              type: 'previous',
              size: 0,
              uploadedAt: new Date().toISOString()
            };
          }
        });
        setInsuranceDocuments(existingDocs);
      }
    } else {
      console.log('Resetting form for new record');
      form.reset();
      setInsuranceDocuments({
        policyCopy: null,
        rcCopy: null,
        previousYearPolicy: null,
        additional: [],
      });
    }
  }, [editingRecord, form]);

  // Recalculate proration when insurance dates or amount change
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if ((name === 'startDate' || name === 'endDate' || name === 'amount') && value.isAdvance) {
        const startDate = value.startDate;
        const endDate = value.endDate;
        const amount = parseFloat(value.amount || '0');
        
        if (startDate && endDate && amount > 0) {
          const proration = calculateProration(startDate, endDate, amount);
          setProrationValues(proration);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Auto-set insurance dates for current month
  useEffect(() => {
    if (useCurrentMonth) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // First day of current month
      const firstDay = new Date(currentYear, currentMonth, 1);
      const firstDayString = firstDay.toISOString().split('T')[0];

      // Last day of current month
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const lastDayString = lastDay.toISOString().split('T')[0];

      form.setValue('startDate', firstDayString);
      form.setValue('endDate', lastDayString);
    }
  }, [useCurrentMonth, form]);

  const onSubmit = async (data: InsuranceRecordFormData) => {
    console.log('Form submitted with data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.startDate || !data.endDate) {
      console.error('Missing required date fields');
      toast({
        title: 'Validation Error',
        description: 'Start date and end date are required.',
        variant: 'destructive',
      });
      return;
    }

    // Temporary fallback dates while we resolve upstream data issues
    const normalizedStartDate = typeof data.startDate === 'string' && data.startDate.trim()
      ? data.startDate.trim()
      : '2025-01-01';
    const normalizedEndDate = typeof data.endDate === 'string' && data.endDate.trim()
      ? data.endDate.trim()
      : '2025-12-31';

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

      // Check for overlapping insurance policies (only for new records, not edits)
      if (!editingRecord) {
        const hasOverlap = checkInsuranceOverlap(
          data.vehicleId,
          data.insuranceType,
          data.startDate,
          data.endDate
        );

        if (hasOverlap) {
          toast({
            title: 'Insurance Overlap Detected',
            description: `A ${data.insuranceType.replace('_', ' ').toUpperCase()} policy already exists for this vehicle with overlapping dates. Please choose different dates or edit the existing policy.`,
            variant: 'destructive',
          });
          setIsUploadingDocuments(false);
          return;
        }
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
        console.log('Creating expense data:', {
          isAdvance: data.isAdvance,
          isAdvanceType: typeof data.isAdvance,
          isAdvanceTruthy: !!data.isAdvance,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          startDateLength: normalizedStartDate.length,
          endDateLength: normalizedEndDate.length,
          startDateTrimmed: normalizedStartDate,
          endDateTrimmed: normalizedEndDate,
          prorationValues
        });

        // Build expense data object step by step to avoid undefined values
        const expenseData: Omit<Expense, 'id'> = {
          vehicleId: data.vehicleId,
          amount: isCorrection ? parseFloat(data.amount) : parseFloat(data.amount),
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
          companyId: userInfo.companyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentType: 'expenses',
          expenseType: 'insurance',
          vendor: data.vendor,
          insuranceDetails: {
            insuranceType: data.insuranceType,
            policyNumber: data.policyNumber,
            startDate: new Date(normalizedStartDate).toISOString(),
            endDate: new Date(normalizedEndDate).toISOString(),
          },
          isAdvance: data.isAdvance || false,
          isCorrection: isCorrection,
        };

        // Conditionally add optional fields only if they have valid values
        if (data.receiptNumber && data.receiptNumber.trim()) {
          expenseData.receiptNumber = data.receiptNumber;
        }
        if (data.notes && data.notes.trim()) {
          expenseData.notes = data.notes;
        }
        if (Object.keys(uploadedDocuments).length > 0) {
          expenseData.insuranceDocuments = uploadedDocuments;
        }

        // Only add coverage fields if isAdvance is true and dates are valid
        console.log('Checking coverage conditions:', {
          isAdvance: data.isAdvance,
          isAdvanceType: typeof data.isAdvance,
          startDate: normalizedStartDate,
          startDateType: typeof normalizedStartDate,
          endDate: normalizedEndDate,
          endDateType: typeof normalizedEndDate,
          startDateTrimmed: normalizedStartDate,
          endDateTrimmed: normalizedEndDate
        });

        const shouldAddCoverage = data.isAdvance === true &&
                                  typeof normalizedStartDate === 'string' &&
                                  typeof normalizedEndDate === 'string' &&
                                  normalizedStartDate.length > 0 &&
                                  normalizedEndDate.length > 0;

        console.log('Should add coverage fields:', shouldAddCoverage);

        if (shouldAddCoverage) {
          expenseData.coverageStartDate = Timestamp.fromDate(new Date(normalizedStartDate));
          expenseData.coverageEndDate = Timestamp.fromDate(new Date(normalizedEndDate));
          expenseData.coverageMonths = prorationValues.coverageMonths;
          expenseData.proratedMonthly = prorationValues.proratedMonthly;
          console.log('Added coverage fields:', {
            coverageStartDate: expenseData.coverageStartDate,
            coverageEndDate: expenseData.coverageEndDate
          });
        } else {
          console.log('Skipping coverage fields - condition not met');
        }

        // Add correction reference if this is a correction
        if (isCorrection && data.originalTransactionRef && data.originalTransactionRef.trim()) {
          expenseData.originalTransactionRef = data.originalTransactionRef;
        }

        console.log('Final expenseData before submission:', JSON.stringify(expenseData, null, 2));

        // Show exactly what will be stored in Firebase
        console.log('=== FIREBASE DOCUMENT STRUCTURE ===');
        console.log('Collection Path:', `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/expenses`);
        console.log('Document ID: [AUTO-GENERATED]');
        console.log('Document Data:');
        Object.entries(expenseData).forEach(([key, value]) => {
          console.log(`  ${key}:`, typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
        });
        console.log('=====================================');

        // Test: Create a minimal document to verify Firebase connection
        console.log('Testing Firebase connection with minimal document...');
        try {
          const testDoc = {
            test: true,
            timestamp: new Date().toISOString(),
            companyId: userInfo.companyId
          };
          console.log('Test document:', testDoc);
          await addDoc(collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/expenses`), testDoc);
          console.log('✅ Firebase connection works!');
        } catch (testError) {
          console.error('❌ Firebase connection failed:', testError);
          throw testError; // Re-throw to stop submission
        }

        await addExpense(expenseData);

        // Also update the vehicle record with insurance details
        await updateVehicle(data.vehicleId, {
          insuranceExpiryDate: normalizedEndDate,
          insuranceStartDate: normalizedStartDate,
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

      // Reset form on successful submission - COMMENTED OUT to prevent auto-clearing
      // form.reset();
      // setUseCurrentMonth(false);
      // setInsuranceDocuments({
      //   policyCopy: null,
      //   rcCopy: null,
      //   previousYearPolicy: null,
      //   additional: [],
      // });
      // setIsUploadingDocuments(false);
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select insurance type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fix_insurance">Fix Insurance</SelectItem>
                    <SelectItem value="rego">REGO</SelectItem>
                    <SelectItem value="green_slip">Green Slip</SelectItem>
                    <SelectItem value="pink_slip">Pink Slip</SelectItem>
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

        {/* Current Month Checkbox */}
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={useCurrentMonth}
                  onChange={(e) => setUseCurrentMonth(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium">
                  Use Current Month Dates
                </FormLabel>
                <p className="text-xs text-gray-500">
                  Check this to automatically set insurance dates from 1st to last day of current month
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={useCurrentMonth} />
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
                  <Input type="date" {...field} disabled={useCurrentMonth} />
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

        {/* Proration Section */}
        <div className="space-y-4 border-t pt-4">
          <FormField
            control={form.control}
            name="isAdvance"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked) {
                        // When checked, calculate proration using insurance start/end dates
                        const startDate = form.getValues('startDate');
                        const endDate = form.getValues('endDate');
                        const amount = parseFloat(form.getValues('amount') || '0');
                        if (startDate && endDate && amount > 0) {
                          const proration = calculateProration(startDate, endDate, amount);
                          setProrationValues(proration);
                        }
                      } else {
                        setProrationValues({ coverageMonths: 0, proratedMonthly: 0 });
                      }
                    }}
                    disabled={false}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium">
                    This is a periodic payment
                  </FormLabel>
                  <p className="text-xs text-gray-500">
                    Check if this insurance premium should be prorated over the policy period
                  </p>
                </div>
              </FormItem>
            )}
          />

          {form.watch('isAdvance') && prorationValues.coverageMonths > 0 && (
            <div className="pl-6 border-l-2 border-gray-200">
              <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-blue-700 font-medium">Coverage Period</div>
                  <div className="text-lg font-bold text-blue-900">{prorationValues.coverageMonths} months</div>
                </div>
                <div>
                  <div className="text-sm text-blue-700 font-medium">Monthly Prorated Amount</div>
                  <div className="text-lg font-bold text-blue-900">₹{prorationValues.proratedMonthly.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
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

        <div className="flex gap-4">
          <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting || isUploadingDocuments}>
            {isUploadingDocuments ? 'Uploading Documents...' : form.formState.isSubmitting ? (editingRecord ? 'Updating Insurance Dates...' : 'Adding Insurance Record...') : (editingRecord ? 'Update Insurance Dates' : isCorrection ? 'Record Correction' : 'Add Insurance Record')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setUseCurrentMonth(false);
              setInsuranceDocuments({
                policyCopy: null,
                rcCopy: null,
                previousYearPolicy: null,
                additional: [],
              });
            }}
            disabled={form.formState.isSubmitting || isUploadingDocuments}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddInsuranceRecordForm;