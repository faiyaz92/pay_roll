
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { TenantCompanyType } from '@/types/user';

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'Zip code is required'),
  gstin: z.string().optional(),
  companyType: z.enum(['Transportation', 'Logistics', 'Delivery', 'Retail']),
  fleetSize: z.string().optional(),
  operatingLicense: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface AddTenantCompanyFormProps {
  onSuccess: () => void;
}

const AddTenantCompanyForm: React.FC<AddTenantCompanyFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      email: '',
      mobileNumber: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      gstin: '',
      companyType: 'Transportation',
      fleetSize: '',
      operatingLicense: '',
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    try {
      const companiesRef = collection(db, 'Easy2Solutions/companyDirectory/tenantCompanies');
      
      const companyData = {
        name: data.name,
        email: data.email,
        mobileNumber: data.mobileNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        gstin: data.gstin || '',
        companyType: data.companyType as TenantCompanyType,
        fleetSize: data.fleetSize ? parseInt(data.fleetSize) : 0,
        operatingLicense: data.operatingLicense || '',
        createdAt: new Date(),
        createdBy: 'super_admin', // This should be dynamic based on current user
      };

      await addDoc(companiesRef, companyData);
      
      toast({
        title: 'Success',
        description: 'Tenant company added successfully',
      });
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding company:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tenant company',
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
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
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
                <Input type="email" placeholder="Enter company email" {...field} />
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
          name="companyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Logistics">Logistics</SelectItem>
                  <SelectItem value="Delivery">Delivery</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zip Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter zip code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gstin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GSTIN (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter GSTIN" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fleetSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fleet Size (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Number of vehicles" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="operatingLicense"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operating License (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter license number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">
          Add Tenant Company
        </Button>
      </form>
    </Form>
  );
};

export default AddTenantCompanyForm;
