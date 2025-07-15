
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

const citySchema = z.object({
  name: z.string().min(2, 'City name must be at least 2 characters'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  pincode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CityFormData = z.infer<typeof citySchema>;

interface AddCityFormProps {
  onSuccess: () => void;
}

const AddCityForm: React.FC<AddCityFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const { userInfo } = useAuth();

  const form = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: '',
      state: '',
      country: 'India',
      pincode: '',
      latitude: '',
      longitude: '',
      isActive: true,
    },
  });

  const onSubmit = async (data: CityFormData) => {
    if (!userInfo?.companyId) {
      toast({
        title: 'Error',
        description: 'Company ID not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      const citiesRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cities`);
      
      const cityData = {
        name: data.name,
        state: data.state,
        country: data.country,
        pincode: data.pincode || '',
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        isActive: data.isActive,
        createdAt: new Date(),
        companyId: userInfo.companyId,
      };

      await addDoc(citiesRef, cityData);
      
      toast({
        title: 'Success',
        description: 'City added successfully',
      });
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding city:', error);
      toast({
        title: 'Error',
        description: 'Failed to add city',
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
              <FormLabel>City Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter city name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="Enter state" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Enter country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="pincode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pincode (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter pincode" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="Enter latitude" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="Enter longitude" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable this city for route selection
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Add City
        </Button>
      </form>
    </Form>
  );
};

export default AddCityForm;
