/**
 * Overtime Log Form Component
 * For creating/editing overtime records
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOvertimeStore, OVERTIME_RATES } from '@/stores/overtime/overtime.store';
import { useAuthStore } from '@/stores/auth/auth.store';
import type { OvertimeInput } from '@/types/attendance';

const overtimeFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  hours: z.string().min(1, 'Hours are required').refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 24;
    },
    { message: 'Hours must be between 0 and 24' }
  ),
  rateType: z.enum(['regular', 'weekend', 'holiday']),
  notes: z.string().optional(),
});

type OvertimeFormValues = z.infer<typeof overtimeFormSchema>;

interface OvertimeLogFormProps {
  employeeId: string;
  companyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OvertimeLogForm = ({
  employeeId,
  companyId,
  onSuccess,
  onCancel,
}: OvertimeLogFormProps) => {
  const { createLog, loading, error } = useOvertimeStore();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      hours: '',
      rateType: 'regular',
      notes: '',
    },
  });

  const onSubmit = async (values: OvertimeFormValues) => {
    setSubmitting(true);
    try {
      const overtimeInput: OvertimeInput = {
        employeeId,
        companyId,
        date: new Date(values.date),
        hours: parseFloat(values.hours),
        rateType: values.rateType,
        notes: values.notes,
      };

      await createLog(overtimeInput, user?.uid || 'unknown');
      form.reset();
      onSuccess?.();
    } catch (err) {
      console.error('Failed to create overtime log:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overtime Hours</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  placeholder="e.g., 2.5"
                  {...field}
                />
              </FormControl>
              <FormDescription>Enter hours worked beyond standard 8 hours</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rateType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="regular">
                    Regular ({OVERTIME_RATES.regular}x) - Working Day
                  </SelectItem>
                  <SelectItem value="weekend">
                    Weekend ({OVERTIME_RATES.weekend}x) - Friday/Saturday
                  </SelectItem>
                  <SelectItem value="holiday">
                    Holiday ({OVERTIME_RATES.holiday}x) - Public Holiday
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>GCC overtime rate multipliers</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about the overtime work..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading || submitting}>
            {submitting ? 'Creating...' : 'Create Overtime Log'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
