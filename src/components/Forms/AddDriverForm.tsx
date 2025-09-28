import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDrivers, Driver, DocumentUpload } from '@/hooks/useFirebaseData';
import DocumentUploader from './DocumentUploader';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface DocumentWithFile extends DocumentUpload {
  file?: File;
}

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
  
  // Document state
  const [documents, setDocuments] = useState<{
    drivingLicense: DocumentWithFile | null;
    idCard: DocumentWithFile | null;
    photo: DocumentWithFile | null;
    additional: DocumentWithFile[];
  }>({
    drivingLicense: null,
    idCard: null,
    photo: null,
    additional: []
  });
  const [isUploading, setIsUploading] = useState(false);

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

  // Helper function to upload individual documents
  const uploadDocument = async (doc: DocumentWithFile, type: string): Promise<DocumentUpload> => {
    try {
      if (!doc.file) throw new Error('No file to upload');
      const cloudinaryUrl = await uploadToCloudinary(doc.file);
      return {
        id: doc.id,
        name: doc.name,
        url: cloudinaryUrl,
        type: type as any,
        uploadedAt: doc.uploadedAt,
        size: doc.size
      };
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      throw new Error(`Failed to upload ${doc.name}`);
    }
  };

  const onSubmit = async (data: DriverFormData) => {
    try {
      console.log('Form submission started');
      console.log('User info:', userInfo);
      console.log('Form data:', data);
      console.log('Documents:', documents);

      if (!userInfo?.companyId) {
        console.error('No company ID found in userInfo:', userInfo);
        toast({
          title: 'Error',
          description: 'Company information not found. Please login again.',
          variant: 'destructive',
        });
        return;
      }

      // Validate required documents
      if (!documents.drivingLicense || !documents.idCard || !documents.photo) {
        toast({
          title: 'Missing Documents',
          description: 'Please upload Driving License, ID Card, and Driver Photo.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Using company ID:', userInfo.companyId);
      setIsUploading(true);

      // Upload all documents to Cloudinary
      const uploadPromises: Promise<DocumentUpload>[] = [];
      
      // Upload required documents
      if (documents.drivingLicense && documents.drivingLicense.file) {
        uploadPromises.push(uploadDocument(documents.drivingLicense, 'license'));
      }
      if (documents.idCard && documents.idCard.file) {
        uploadPromises.push(uploadDocument(documents.idCard, 'idCard'));
      }
      if (documents.photo && documents.photo.file) {
        uploadPromises.push(uploadDocument(documents.photo, 'photo'));
      }
      
      // Upload additional documents
      documents.additional.forEach(doc => {
        if (doc.file) {
          uploadPromises.push(uploadDocument(doc, 'additional'));
        }
      });

      console.log('Starting document uploads...');
      const uploadedDocs = await Promise.all(uploadPromises);
      console.log('Documents uploaded successfully:', uploadedDocs);

      // Organize uploaded documents
      const organizedDocs = {
        drivingLicense: uploadedDocs.find(doc => doc.type === 'license') || null,
        idCard: uploadedDocs.find(doc => doc.type === 'idCard') || null,
        photo: uploadedDocs.find(doc => doc.type === 'photo') || null,
        additional: uploadedDocs.filter(doc => doc.type === 'additional')
      };

      // Create driver record for fleet rental business with document URLs
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
        userType: 'Driver', // Required for Firestore query filtering
        
        // New document structure with Cloudinary URLs
        documents: organizedDocs,
        
        // Legacy fields for backward compatibility (using new documents)
        drivingLicense: {
          number: data.licenseNumber,
          expiry: '',
          photoUrl: organizedDocs.drivingLicense?.url || '',
        },
        idCard: {
          number: '',
          photoUrl: organizedDocs.idCard?.url || '',
        },
        photoUrl: organizedDocs.photo?.url || '',
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Driver data to be saved:', driverData);
      console.log('Calling addDriver function...');
      
      const result = await addDriver(driverData);
      console.log('addDriver result:', result);
      
      toast({
        title: 'Success',
        description: 'Driver added successfully with all documents uploaded securely.',
      });
      
      // Reset form and documents
      form.reset();
      setDocuments({
        drivingLicense: null,
        idCard: null,
        photo: null,
        additional: []
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error adding driver:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to add driver. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
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

        {/* Document Upload Section */}
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Required Documents</h3>
            <DocumentUploader
              documents={documents}
              onDocumentsChange={setDocuments}
              isUploading={isUploading}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting || isUploading}
        >
          {isUploading 
            ? 'Uploading Documents...' 
            : form.formState.isSubmitting 
              ? 'Adding Driver...' 
              : 'Add Driver with Documents'
          }
        </Button>
      </form>
    </Form>
  );
};

export default AddDriverForm;