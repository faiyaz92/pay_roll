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
import ExpenseDocumentUploader from './ExpenseDocumentUploader';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { firestore } from '@/config/firebase';
import { addDoc, collection } from 'firebase/firestore';

// Define schema outside component to avoid recreation on every render
const createExpenseRecordSchema = (editingRecord: Expense | undefined, isCorrection: boolean) => z.object({
  vehicleId: z.string().optional(), // Made optional since vehicle is pre-selected
  expenseType: editingRecord ? z.string().optional() : z.enum(['fuel', 'maintenance', 'insurance', 'penalties', 'general']),
  description: editingRecord ? z.string().optional() : z.string().optional(),
  amount: editingRecord ? z.string().optional() : z.string().min(1, 'Amount is required'),
  vendor: editingRecord ? z.string().optional() : z.string().optional(),
  expenseDate: editingRecord ? z.string().optional() : z.string().optional(),
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

interface ExpenseRecordData {
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
  expenseDate: string;
  isCorrection: boolean;
  originalTransactionRef?: string;
}

interface AddExpenseFormProps {
  onSuccess?: (data: ExpenseRecordData) => void;
  editingRecord?: Expense;
  isCorrection?: boolean;
  vehicleId: string; // Add vehicleId as required prop
}

const AddExpenseForm: React.FC<AddExpenseFormProps> = ({ onSuccess, editingRecord, isCorrection = false, vehicleId }) => {
  console.log('AddExpenseForm rendered with editingRecord:', editingRecord, 'isCorrection:', isCorrection);

interface ExpenseDocument {
  id: string;
  name: string;
  url: string;
  type: 'main' | 'additional';
  uploadedAt: string;
  size: number;
  file?: File;
}

const [expenseDocuments, setExpenseDocuments] = useState<{
  mainDocument: ExpenseDocument | null;
  additional: ExpenseDocument[];
}>({
  mainDocument: null,
  additional: [],
});
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  // Create schema based on current props
  const expenseRecordSchema = useMemo(() => createExpenseRecordSchema(editingRecord, isCorrection), [editingRecord, isCorrection]);

  type ExpenseRecordFormData = z.infer<typeof expenseRecordSchema>;

  const { vehicles, drivers, expenses, addExpense, updateExpense } = useFirebaseData();
  const { userInfo } = useAuth();
  const { toast } = useToast();

  const form = useForm<ExpenseRecordFormData>({
    resolver: zodResolver(expenseRecordSchema),
    defaultValues: {
      vehicleId: '',
      expenseType: 'general',
      description: isCorrection ? 'Expense correction' : '',
      amount: '',
      vendor: '',
      expenseDate: '',
      receiptNumber: '',
      notes: '',
      originalTransactionRef: '',
    },
  });

  // Upload expense documents to Cloudinary
  const uploadExpenseDocuments = async () => {
    const uploadedDocuments: Record<string, string> = {};

    // Upload main document
    if (expenseDocuments.mainDocument && expenseDocuments.mainDocument.file) {
      try {
        const cloudinaryUrl = await uploadToCloudinary(expenseDocuments.mainDocument.file);
        uploadedDocuments['mainDocument'] = cloudinaryUrl;
      } catch (error) {
        console.error(`Failed to upload main document ${expenseDocuments.mainDocument.name}:`, error);
        throw new Error(`Failed to upload main document ${expenseDocuments.mainDocument.name}`);
      }
    }

    // Upload additional documents
    for (const additionalDoc of expenseDocuments.additional) {
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
        expenseType: editingRecord.expenseType || 'other',
        description: editingRecord.description || '',
        amount: editingRecord.amount?.toString() || '',
        vendor: editingRecord.vendor || '',
        expenseDate: formatDateForInput(editingRecord.expenseDate || editingRecord.createdAt),
        receiptNumber: editingRecord.receiptNumber || '',
        notes: editingRecord.notes || '',
        originalTransactionRef: '',
      });

      // Populate existing documents if available
      if (editingRecord.expenseDocuments) {
        const existingDocs = { mainDocument: null as ExpenseDocument | null, additional: [] as ExpenseDocument[] };
        Object.entries(editingRecord.expenseDocuments).forEach(([key, url]) => {
          if (key === 'mainDocument' && url) {
            existingDocs.mainDocument = {
              id: `main-${Date.now()}`,
              url: url as string,
              name: 'Main Expense Document',
              type: 'main',
              size: 0, // We don't have size info for existing docs
              uploadedAt: new Date().toISOString()
            };
          } else if (key.startsWith('additional_') && url) {
            existingDocs.additional.push({
              id: key.replace('additional_', ''),
              url: url as string,
              name: `Additional Document ${existingDocs.additional.length + 1}`,
              type: 'additional',
              size: 0,
              uploadedAt: new Date().toISOString()
            });
          }
        });
        setExpenseDocuments(existingDocs);
      }
    } else {
      console.log('Resetting form for new record');
      form.reset();
      setExpenseDocuments({
        mainDocument: null,
        additional: [],
      });
    }
  }, [editingRecord, form]);

  const onSubmit = async (data: ExpenseRecordFormData) => {
    console.log('Form submitted with data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.expenseDate) {
      console.error('Missing required date field');
      toast({
        title: 'Validation Error',
        description: 'Expense date is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingDocuments(true);

      // Upload expense documents first
      let uploadedDocuments = {};
      try {
        uploadedDocuments = await uploadExpenseDocuments();
      } catch (error) {
        toast({
          title: 'Document Upload Failed',
          description: error.message || 'Failed to upload expense documents. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (editingRecord) {
        // Handle editing expense
        const updatedExpenseData: Partial<Expense> = {
          vehicleId: vehicleId,
          amount: parseFloat(data.amount),
          description: isCorrection
            ? `Expense correction - Ref: ${data.originalTransactionRef} - ${data.description}`
            : data.description,
          expenseType: data.expenseType as 'maintenance' | 'insurance' | 'fuel' | 'penalties' | 'general',
          vendor: data.vendor,
          expenseDate: new Date(data.expenseDate).toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Conditionally add optional fields only if they have valid values
        if (data.receiptNumber && data.receiptNumber.trim()) {
          updatedExpenseData.receiptNumber = data.receiptNumber;
        }
        if (data.notes && data.notes.trim()) {
          updatedExpenseData.notes = data.notes;
        }
        if (Object.keys(uploadedDocuments).length > 0) {
          updatedExpenseData.expenseDocuments = {
            ...editingRecord.expenseDocuments,
            ...uploadedDocuments
          };
        }

        // Add correction reference if this is a correction
        if (isCorrection && data.originalTransactionRef && data.originalTransactionRef.trim()) {
          updatedExpenseData.originalTransactionRef = data.originalTransactionRef;
        }

        await updateExpense(editingRecord.id, updatedExpenseData);

        toast({
          title: 'Success',
          description: 'Expense updated successfully',
        });
      } else {
        // Handle new record creation
        console.log('Creating expense data:', {
          expenseDate: data.expenseDate,
          expenseDateLength: data.expenseDate.length,
          expenseDateTrimmed: data.expenseDate.trim()
        });

        // Build expense data object step by step to avoid undefined values
        const expenseData: Omit<Expense, 'id'> = {
          vehicleId: vehicleId,
          amount: parseFloat(data.amount),
          description: isCorrection
            ? `Expense correction - Ref: ${data.originalTransactionRef} - ${data.description}`
            : data.description || 'Expense',
          billUrl: '',
          submittedBy: 'owner',
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          adjustmentWeeks: 0,
          type: 'expense',
          verifiedKm: 0,
          companyId: userInfo.companyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentType: 'expenses',
          expenseType: data.expenseType,
          vendor: data.vendor || '',
          expenseDate: data.expenseDate ? new Date(data.expenseDate).toISOString() : new Date().toISOString(),
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
          expenseData.expenseDocuments = uploadedDocuments;
        }

        // Add correction reference if this is a correction
        if (isCorrection && data.originalTransactionRef && data.originalTransactionRef.trim()) {
          expenseData.originalTransactionRef = data.originalTransactionRef;
        }

        console.log('Final expenseData before submission:', JSON.stringify(expenseData, null, 2));

        await addExpense(expenseData);

        toast({
          title: 'Success',
          description: 'Expense added successfully',
        });
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess({
          vehicleId: data.vehicleId,
          amount: parseFloat(data.amount),
          description: data.description,
          billUrl: '',
          submittedBy: 'owner',
          status: 'approved',
          approvedAt: new Date().toISOString(),
          adjustmentWeeks: 0,
          type: 'expense',
          verifiedKm: 0,
          companyId: userInfo.companyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentType: 'expenses',
          expenseType: data.expenseType,
          vendor: data.vendor,
          expenseDate: data.expenseDate,
          isCorrection: isCorrection,
        });
      }

      // Reset form after successful submission
      if (!editingRecord) {
        form.reset();
        setExpenseDocuments({
          mainDocument: null,
          additional: [],
        });
      }

    } catch (error) {
      console.error('Error submitting expense:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingDocuments(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Form Fields in Horizontal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Expense Type */}
            <FormField
              control={form.control}
              name="expenseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expense type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="penalties">Penalties</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendor */}
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter vendor name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expense Date */}
            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receipt Number */}
            <FormField
              control={form.control}
              name="receiptNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter receipt number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Description - Full Width */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter expense description"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes - Full Width */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Original Transaction Reference (for corrections) */}
          {isCorrection && (
            <FormField
              control={form.control}
              name="originalTransactionRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Transaction ID *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter original transaction ID"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Document Upload Section */}
          <ExpenseDocumentUploader
            documents={expenseDocuments}
            onDocumentsChange={setExpenseDocuments}
            isUploading={isUploadingDocuments}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isUploadingDocuments}
          >
            {isUploadingDocuments ? 'Uploading Documents...' : editingRecord ? 'Update Expense' : 'Add Expense'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AddExpenseForm;