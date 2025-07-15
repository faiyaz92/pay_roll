
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { City } from '@/types/user';

const routeSchema = z.object({
  name: z.string().min(2, 'Route name must be at least 2 characters'),
  fromCity: z.string().min(1, 'From city is required'),
  toCity: z.string().min(1, 'To city is required'),
  distance: z.string().min(1, 'Distance is required'),
  estimatedDuration: z.string().min(1, 'Estimated duration is required'),
  farePerKm: z.string().optional(),
  baseFare: z.string().optional(),
  tollCharges: z.string().optional(),
  isActive: z.boolean().default(true),
});

type RouteFormData = z.infer<typeof routeSchema>;

interface AddRouteFormProps {
  onSuccess: () => void;
}

const AddRouteForm: React.FC<AddRouteFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const { userInfo } = useAuth();
  const [cities, setCities] = useState<City[]>([]);

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: '',
      fromCity: '',
      toCity: '',
      distance: '',
      estimatedDuration: '',
      farePerKm: '',
      baseFare: '',
      tollCharges: '',
      isActive: true,
    },
  });

  // Load cities
  useEffect(() => {
    if (!userInfo?.companyId) return;

    const citiesRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cities`);
    const q = query(citiesRef, where('isActive', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const citiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as City[];
      setCities(citiesData);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  const onSubmit = async (data: RouteFormData) => {
    if (!userInfo?.companyId) {
      toast({
        title: 'Error',
        description: 'Company ID not found',
        variant: 'destructive',
      });
      return;
    }

    if (data.fromCity === data.toCity) {
      toast({
        title: 'Error',
        description: 'From city and To city cannot be the same',
        variant: 'destructive',
      });
      return;
    }

    try {
      const routesRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/routes`);
      
      const routeData = {
        name: data.name,
        fromCity: data.fromCity,
        toCity: data.toCity,
        distance: parseFloat(data.distance),
        estimatedDuration: parseInt(data.estimatedDuration),
        farePerKm: data.farePerKm ? parseFloat(data.farePerKm) : 0,
        baseFare: data.baseFare ? parseFloat(data.baseFare) : 0,
        tollCharges: data.tollCharges ? parseFloat(data.tollCharges) : 0,
        isActive: data.isActive,
        createdAt: new Date(),
        companyId: userInfo.companyId,
      };

      await addDoc(routesRef, routeData);
      
      toast({
        title: 'Success',
        description: 'Route added successfully',
      });
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding route:', error);
      toast({
        title: 'Error',
        description: 'Failed to add route',
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
              <FormLabel>Route Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter route name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fromCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From City</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select from city" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}, {city.state}
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
            name="toCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To City</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select to city" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}, {city.state}
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
            name="distance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distance (KM)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="Enter distance" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (Minutes)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter duration" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="farePerKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fare per KM (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter fare" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="baseFare"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Fare (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter base fare" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tollCharges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Toll Charges (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter toll charges" {...field} />
                </FormControl>
                <FormMessage />
              </FormMessage>
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
                  Enable this route for trip selection
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
          Add Route
        </Button>
      </form>
    </Form>
  );
};

export default AddRouteForm;
