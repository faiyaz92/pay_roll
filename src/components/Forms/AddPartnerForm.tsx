import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { UserInfo } from '@/types/user';

const partnerSchema = z.object({
  name: z.string().min(2, 'Partner name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  userName: z.string().min(3, 'Username must be at least 3 characters'),
  mobileNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(10, 'Full address is required'),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface AddPartnerFormProps {
  onSuccess: (data: PartnerFormData) => void;
  onCancel: () => void;
  initialData?: UserInfo | null;
  mode?: 'add' | 'edit';
}

const AddPartnerForm: React.FC<AddPartnerFormProps> = ({
  onSuccess,
  onCancel,
  initialData = null,
  mode = 'add'
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      userName: initialData?.userName || '',
      mobileNumber: initialData?.mobileNumber || '',
      address: initialData?.address || '',
    },
  });

  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);
    try {
      await onSuccess(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save partner',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter partner's full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="partner@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="userName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username for login" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter mobile number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter full address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Partner' : 'Add Partner'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddPartnerForm;