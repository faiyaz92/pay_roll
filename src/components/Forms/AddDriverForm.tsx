import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDrivers, Driver } from '@/hooks/useFirebaseData';

const driverSchema = z.object({
  name: z.string().min(2, 'Driver name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  licenseNumber: z.string().min(5, 'Driving license number is required'),
  address: z.string().min(10, 'Full address is required for rental agreement'),
});

type DriverFormData = z.infer<typeof driverSchema>;

interface AddDriverFormProps {
  onSuccess: () => void;
}

const AddDriverForm: React.FC<AddDriverFormProps> = ({ onSuccess }) => {
  const { userInfo } = useAuth();
  const { toast } = useToast();
  const { addDriver } = useDrivers();

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      address: '',
    },
  });

  const onSubmit = async (data: DriverFormData) => {
    try {
      if (!userInfo?.companyId) {
        toast({
          title: 'Error',
          description: 'Company information not found',
          variant: 'destructive',
        });
        return;
      }

      // Create driver record for fleet rental business
      const driverData: Omit<Driver, 'id'> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        address: data.address,
        rentedVehicles: [], // Initially no vehicles rented
        totalWeeklyRent: 0, // Will be calculated when vehicles are assigned
        joinDate: new Date().toISOString(),
        isActive: true,
        companyId: userInfo.companyId,
        // Identity documents (empty initially, can be added later)
        drivingLicense: {
          number: data.licenseNumber,
          expiry: '',
          photoUrl: '',
        },
        idCard: {
          number: '',
          photoUrl: '',
        },
        photoUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDriver(driverData);
      
      toast({
        title: 'Success',
        description: 'Driver added successfully. You can now assign vehicles for rent.',
      });
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding driver:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add driver',
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
              <FormLabel>Driver Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter driver's full name" {...field} />
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
                <Input type="email" placeholder="Enter email for rental communications" {...field} />
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
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter contact number" {...field} />
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
              <FormLabel>Driving License Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter valid driving license number" {...field} />
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
              <FormLabel>Full Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter complete address for rental agreement" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
          <p className="text-sm text-blue-700">
            After adding the driver, you can assign vehicles from your fleet for weekly rent. 
            The driver will pay fixed weekly rent regardless of vehicle usage.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding Driver...' : 'Add Driver to Fleet Rental'}
        </Button>
      </form>
    </Form>
  );
};

export default AddDriverForm;
