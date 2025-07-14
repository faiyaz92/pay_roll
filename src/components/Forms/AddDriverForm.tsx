
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useDrivers } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';
import { Driver } from '@/hooks/useFirebaseData';

const driverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  licenseNumber: z.string().min(5, 'License number is required'),
  experience: z.string().min(1, 'Experience is required'),
  status: z.enum(['available', 'on-trip', 'off-duty']),
  currentLocation: z.string().min(2, 'Current location is required'),
});

type DriverFormData = z.infer<typeof driverSchema>;

interface AddDriverFormProps {
  onSuccess: () => void;
}

const AddDriverForm: React.FC<AddDriverFormProps> = ({ onSuccess }) => {
  const { addDriver } = useDrivers();
  const { toast } = useToast();

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      experience: '',
      status: 'available',
      currentLocation: '',
    },
  });

  const onSubmit = async (data: DriverFormData) => {
    try {
      const driverData: Omit<Driver, 'id'> = {
        ...data,
        totalTrips: 0,
        rating: 5.0,
        joinDate: new Date().toISOString(),
        companyId: '', // Will be set by the hook
      };

      await addDriver(driverData);
      toast({
        title: 'Success',
        description: 'Driver added successfully',
      });
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add driver',
        variant: 'destructive',
      });
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter driver name" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="licenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter license number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 5 years" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on-trip">On Trip</SelectItem>
                  <SelectItem value="off-duty">Off Duty</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currentLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Location</FormLabel>
              <FormControl>
                <Input placeholder="Enter current location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Add Driver
        </Button>
      </form>
    </Form>
  );
};

export default AddDriverForm;
