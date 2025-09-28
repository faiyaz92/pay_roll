import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebaseData, useAssignments } from '@/hooks/useFirebaseData';
import { Assignment } from '@/types/user';
import { Calendar, Car, User, DollarSign, FileText, MapPin, Clock, AlertCircle } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Assignment form schema with comprehensive validation
const assignmentSchema = z.object({
  vehicleId: z.string().min(1, 'Please select a vehicle'),
  driverId: z.string().min(1, 'Please select a driver'),
  startDate: z.string().min(1, 'Start date is required'),
  dailyRent: z.number().min(100, 'Daily rent must be at least ₹100'),
  collectionDay: z.number().min(0).max(6, 'Invalid collection day'),
  initialOdometer: z.number().min(0, 'Initial odometer reading is required'),
  securityDeposit: z.number().min(0, 'Security deposit is required'),
  agreementDuration: z.number().min(1, 'Agreement duration must be at least 1 month'),
  driverAddress: z.string().min(10, 'Driver address is required for agreement'),
  emergencyContact: z.string().min(10, 'Emergency contact is required'),
  specialTerms: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignmentDocumentUpload {
  id: string;
  name: string;
  url: string;
  type: 'agreement' | 'vehicleHandover' | 'driverPhoto' | 'additional';
  uploadedAt: string;
  size: number;
  file?: File;
}

interface AddAssignmentFormProps {
  onSuccess: () => void;
}

const AddAssignmentForm: React.FC<AddAssignmentFormProps> = ({ onSuccess }) => {
  const { userInfo } = useAuth();
  const { toast } = useToast();
  const { vehicles, drivers, updateVehicle } = useFirebaseData();
  const { addAssignment } = useAssignments();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Assignment Documents State
  const [assignmentDocs, setAssignmentDocs] = useState<{
    agreement: AssignmentDocumentUpload | null;
    vehicleHandover: AssignmentDocumentUpload | null;
    driverPhoto: AssignmentDocumentUpload | null;
    additional: AssignmentDocumentUpload[];
  }>({
    agreement: null,
    vehicleHandover: null,
    driverPhoto: null,
    additional: []
  });
  
  const [imagePreviewUrls, setImagePreviewUrls] = useState<{
    agreement: string | null;
    vehicleHandover: string | null;
    driverPhoto: string | null;
    additional: string[];
  }>({
    agreement: null,
    vehicleHandover: null,
    driverPhoto: null,
    additional: []
  });
  
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      vehicleId: '',
      driverId: '',
      startDate: new Date().toISOString().split('T')[0],
      dailyRent: 500,
      collectionDay: 1, // Monday
      initialOdometer: 0,
      securityDeposit: 5000,
      agreementDuration: 12, // 12 months default
      driverAddress: '',
      emergencyContact: '',
      specialTerms: '',
    },
  });

  const watchVehicleId = form.watch('vehicleId');
  const watchDriverId = form.watch('driverId');
  const watchDailyRent = form.watch('dailyRent');

  // Get available vehicles (not assigned)
  const availableVehicles = vehicles.filter(vehicle => 
    vehicle.status === 'available' && !vehicle.assignedDriverId
  );

  // Get available drivers (not assigned)
  const availableDrivers = drivers.filter(driver => driver.isActive);

  // Auto-populate driver address when driver is selected
  useEffect(() => {
    if (watchDriverId) {
      const selectedDriver = drivers.find(d => d.id === watchDriverId);
      if (selectedDriver && selectedDriver.address) {
        form.setValue('driverAddress', selectedDriver.address);
      }
      if (selectedDriver && selectedDriver.phone) {
        form.setValue('emergencyContact', selectedDriver.phone);
      }
    }
  }, [watchDriverId, drivers, form]);

  // Image handling functions similar to AddVehicleForm
  const handleImageChange = (
    docType: 'agreement' | 'vehicleHandover' | 'driverPhoto' | 'additional', 
    file: File | null, 
    index?: number
  ) => {
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Only JPEG, PNG, and PDF files are allowed',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    const newDoc: AssignmentDocumentUpload = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: docType,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      file: file
    };

    // Update documents
    const updatedDocs = { ...assignmentDocs };
    
    if (docType === 'additional') {
      if (updatedDocs.additional.length < 3) {
        updatedDocs.additional = [...updatedDocs.additional, newDoc];
      } else {
        toast({
          title: 'Too Many Documents',
          description: 'You can only upload up to 3 additional documents',
          variant: 'destructive',
        });
        return;
      }
    } else {
      updatedDocs[docType] = newDoc;
    }

    setAssignmentDocs(updatedDocs);

    // Create preview URL
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImagePreviewUrls(prev => {
          const updated = { ...prev };
          if (docType === 'additional') {
            updated.additional = [...prev.additional, url];
          } else {
            updated[docType] = url;
          }
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (docType: 'agreement' | 'vehicleHandover' | 'driverPhoto' | 'additional', index?: number) => {
    const updatedDocs = { ...assignmentDocs };
    
    if (docType === 'additional' && typeof index === 'number') {
      updatedDocs.additional = updatedDocs.additional.filter((_, i) => i !== index);
    } else {
      updatedDocs[docType] = null;
    }
    
    setAssignmentDocs(updatedDocs);

    // Remove preview URL
    setImagePreviewUrls(prev => {
      const updated = { ...prev };
      if (docType === 'additional' && typeof index === 'number') {
        updated.additional = prev.additional.filter((_, i) => i !== index);
      } else {
        updated[docType] = null;
      }
      return updated;
    });
  };

  // Upload assignment documents to Cloudinary
  const uploadAssignmentDocs = async () => {
    const uploadedDocs: Record<string, string> = {};
    
    // Upload main documents
    for (const [type, doc] of Object.entries(assignmentDocs)) {
      if (doc && type !== 'additional' && !Array.isArray(doc)) {
        try {
          const cloudinaryUrl = await uploadToCloudinary(doc.file!);
          uploadedDocs[type] = cloudinaryUrl;
        } catch (error) {
          console.error(`Failed to upload ${type} document:`, error);
          throw new Error(`Failed to upload ${type} document`);
        }
      }
    }
    
    // Upload additional documents
    const additionalUrls: string[] = [];
    for (const doc of assignmentDocs.additional) {
      if (doc.file) {
        try {
          const cloudinaryUrl = await uploadToCloudinary(doc.file);
          additionalUrls.push(cloudinaryUrl);
        } catch (error) {
          console.error('Failed to upload additional document:', error);
          throw new Error(`Failed to upload additional document: ${doc.name}`);
        }
      }
    }
    
    if (additionalUrls.length > 0) {
      uploadedDocs.additional = JSON.stringify(additionalUrls);
    }
    
    return uploadedDocs;
  };

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      if (!userInfo?.companyId) {
        toast({
          title: 'Error',
          description: 'Company information not found. Please login again.',
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);
      setIsUploadingImages(true);

      // Upload documents first
      let uploadedImages = {};
      try {
        uploadedImages = await uploadAssignmentDocs();
      } catch (error) {
        toast({
          title: 'Image Upload Failed',
          description: error.message || 'Failed to upload assignment documents. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Calculate weekly rent
      const weeklyRent = data.dailyRent * 7;

      // Create assignment data
      const assignmentData: Omit<Assignment, 'id'> = {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        startDate: new Date(data.startDate).toISOString(),
        dailyRent: data.dailyRent,
        weeklyRent: weeklyRent,
        collectionDay: data.collectionDay,
        initialOdometer: data.initialOdometer,
        endDate: null, // Will be set when assignment ends
        status: 'active',
        companyId: userInfo.companyId,

        // Additional assignment details
        securityDeposit: data.securityDeposit,
        agreementDuration: data.agreementDuration,
        driverAddress: data.driverAddress,
        emergencyContact: data.emergencyContact,
        specialTerms: data.specialTerms || '',

        // Document URLs
        documents: uploadedImages,

        // System fields
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addAssignment(assignmentData);

      // Update vehicle status to 'rented' and assign driver
      try {
        await updateVehicle(data.vehicleId, {
          status: 'rented',
          assignedDriverId: data.driverId,
          updatedAt: new Date().toISOString()
        });
      } catch (vehicleError) {
        console.error('Failed to update vehicle status:', vehicleError);
        // Assignment was created successfully, but vehicle status update failed
        // This is not critical, so we'll just log it
      }
      
      toast({
        title: 'Success',
        description: `Assignment created successfully! Vehicle assigned to driver with weekly rent of ₹${weeklyRent.toLocaleString()}.`,
      });
      
      // Reset form
      form.reset();
      setAssignmentDocs({
        agreement: null,
        vehicleHandover: null,
        driverPhoto: null,
        additional: []
      });
      setImagePreviewUrls({
        agreement: null,
        vehicleHandover: null,
        driverPhoto: null,
        additional: []
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating assignment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create assignment. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  const getCollectionDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const selectedVehicle = vehicles.find(v => v.id === watchVehicleId);
  const selectedDriver = drivers.find(d => d.id === watchDriverId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="terms">Agreement Terms</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle & Driver Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vehicle Selection */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vehicleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          Select Vehicle
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an available vehicle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableVehicles.length === 0 ? (
                              <SelectItem value="no-vehicles" disabled>No vehicles available</SelectItem>
                            ) : (
                              availableVehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.vehicleName || `${vehicle.make} ${vehicle.model}`} ({vehicle.registrationNumber})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedVehicle && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {selectedVehicle.images?.front && (
                            <img 
                              src={selectedVehicle.images.front} 
                              alt="Vehicle" 
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="space-y-2 text-sm">
                            <div className="font-medium text-blue-900">
                              {selectedVehicle.vehicleName || `${selectedVehicle.make} ${selectedVehicle.model}`}
                            </div>
                            <div className="text-blue-700">
                              Registration: {selectedVehicle.registrationNumber}
                            </div>
                            <div className="text-blue-700">
                              Odometer: {selectedVehicle.odometer.toLocaleString()} km
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Driver Selection */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="driverId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Select Driver
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a driver" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableDrivers.length === 0 ? (
                              <SelectItem value="no-drivers" disabled>No drivers available</SelectItem>
                            ) : (
                              availableDrivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {driver.name} - {driver.phone}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedDriver && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {selectedDriver.photoUrl && (
                            <img 
                              src={selectedDriver.photoUrl} 
                              alt="Driver" 
                              className="w-20 h-20 object-cover rounded-full"
                            />
                          )}
                          <div className="space-y-2 text-sm">
                            <div className="font-medium text-green-900">{selectedDriver.name}</div>
                            <div className="text-green-700">Phone: {selectedDriver.phone}</div>
                            <div className="text-green-700">License: {selectedDriver.licenseNumber}</div>
                            <div className="text-green-700">Email: {selectedDriver.email}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Assignment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Start Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="initialOdometer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Odometer (km)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter starting odometer reading"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dailyRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Daily Rent (₹)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter daily rent amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Weekly rent will be ₹{(watchDailyRent * 7).toLocaleString()} 
                          (₹{watchDailyRent.toLocaleString()} × 7 days)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="collectionDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Collection Day
                        </FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 7 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {getCollectionDayName(i)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Day of the week to collect rent payments
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agreement Terms Tab */}
          <TabsContent value="terms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Agreement Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="securityDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter security deposit amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Refundable security deposit from driver
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agreementDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agreement Duration (months)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter duration in months"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum rental agreement period
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="driverAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Driver Address
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Complete address for rental agreement"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Emergency contact number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Terms & Conditions</FormLabel>
                      <FormControl>
                        <textarea 
                          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Enter any additional terms, restrictions, or special conditions..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional terms specific to this assignment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Assignment Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">📄 Document Requirements</h4>
                  <p className="text-sm text-blue-700">
                    Upload assignment-related documents for record keeping and legal compliance.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Rental Agreement */}
                  <Card className="relative">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Rental Agreement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {assignmentDocs.agreement ? (
                        <div className="space-y-3">
                          {imagePreviewUrls.agreement && (
                            <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={imagePreviewUrls.agreement}
                                alt="Agreement"
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 p-1 h-6 w-6"
                                onClick={() => removeImage('agreement')}
                              >
                                ×
                              </Button>
                            </div>
                          )}
                          <div className="text-sm">
                            <div className="font-medium">{assignmentDocs.agreement.name}</div>
                            <div className="text-gray-500">
                              {(assignmentDocs.agreement.size / 1024).toFixed(0)} KB
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageChange('agreement', file);
                            }}
                            className="hidden"
                            id="upload-agreement"
                            accept="image/*,application/pdf"
                          />
                          <label htmlFor="upload-agreement" className="cursor-pointer block">
                            <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Upload Agreement</p>
                          </label>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Vehicle Handover */}
                  <Card className="relative">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Vehicle Handover</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {assignmentDocs.vehicleHandover ? (
                        <div className="space-y-3">
                          {imagePreviewUrls.vehicleHandover && (
                            <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={imagePreviewUrls.vehicleHandover}
                                alt="Handover"
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 p-1 h-6 w-6"
                                onClick={() => removeImage('vehicleHandover')}
                              >
                                ×
                              </Button>
                            </div>
                          )}
                          <div className="text-sm">
                            <div className="font-medium">{assignmentDocs.vehicleHandover.name}</div>
                            <div className="text-gray-500">
                              {(assignmentDocs.vehicleHandover.size / 1024).toFixed(0)} KB
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageChange('vehicleHandover', file);
                            }}
                            className="hidden"
                            id="upload-handover"
                            accept="image/*,application/pdf"
                          />
                          <label htmlFor="upload-handover" className="cursor-pointer block">
                            <Car className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Upload Handover</p>
                          </label>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Driver Photo */}
                  <Card className="relative">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Current Driver Photo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {assignmentDocs.driverPhoto ? (
                        <div className="space-y-3">
                          {imagePreviewUrls.driverPhoto && (
                            <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={imagePreviewUrls.driverPhoto}
                                alt="Driver"
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 p-1 h-6 w-6"
                                onClick={() => removeImage('driverPhoto')}
                              >
                                ×
                              </Button>
                            </div>
                          )}
                          <div className="text-sm">
                            <div className="font-medium">{assignmentDocs.driverPhoto.name}</div>
                            <div className="text-gray-500">
                              {(assignmentDocs.driverPhoto.size / 1024).toFixed(0)} KB
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageChange('driverPhoto', file);
                            }}
                            className="hidden"
                            id="upload-driver-photo"
                            accept="image/*"
                          />
                          <label htmlFor="upload-driver-photo" className="cursor-pointer block">
                            <User className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Upload Photo</p>
                          </label>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Documents */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Additional Documents (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignmentDocs.additional.map((doc, index) => (
                      <Card key={doc.id}>
                        <CardContent className="p-4">
                          {imagePreviewUrls.additional[index] && (
                            <div className="relative w-full h-24 bg-gray-100 rounded-lg overflow-hidden mb-2">
                              <img
                                src={imagePreviewUrls.additional[index]}
                                alt="Additional document"
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 p-1 h-5 w-5 text-xs"
                                onClick={() => removeImage('additional', index)}
                              >
                                ×
                              </Button>
                            </div>
                          )}
                          <div className="text-sm">
                            <div className="font-medium truncate">{doc.name}</div>
                            <div className="text-gray-500">{(doc.size / 1024).toFixed(0)} KB</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {assignmentDocs.additional.length < 3 && (
                      <Card className="border-dashed">
                        <CardContent className="p-4">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageChange('additional', file);
                              }}
                              className="hidden"
                              id={`upload-additional-${assignmentDocs.additional.length}`}
                              accept="image/*,application/pdf"
                            />
                            <label htmlFor={`upload-additional-${assignmentDocs.additional.length}`} className="cursor-pointer block">
                              <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">Add Document</p>
                            </label>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Card */}
        {watchVehicleId && watchDriverId && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-green-900 mb-2">Assignment Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-green-800">Vehicle</div>
                  <div className="text-green-700">
                    {selectedVehicle ? (selectedVehicle.vehicleName || `${selectedVehicle.make} ${selectedVehicle.model}`) : 'Not selected'}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-green-800">Driver</div>
                  <div className="text-green-700">{selectedDriver?.name || 'Not selected'}</div>
                </div>
                <div>
                  <div className="font-medium text-green-800">Weekly Rent</div>
                  <div className="text-green-700">₹{(watchDailyRent * 7).toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-green-800">Collection Day</div>
                  <div className="text-green-700">{getCollectionDayName(form.watch('collectionDay'))}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              const tabs = ['basic', 'terms', 'documents'];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex > 0) {
                setActiveTab(tabs[currentIndex - 1]);
              }
            }}
            disabled={activeTab === 'basic'}
          >
            Previous
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              const tabs = ['basic', 'terms', 'documents'];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex < tabs.length - 1) {
                setActiveTab(tabs[currentIndex + 1]);
              }
            }}
            disabled={activeTab === 'documents'}
          >
            Next
          </Button>

          <Button 
            type="submit" 
            className="flex-1" 
            disabled={isSubmitting || isUploadingImages || !watchVehicleId || !watchDriverId}
          >
            {isUploadingImages 
              ? 'Uploading Documents...' 
              : isSubmitting 
                ? 'Creating Assignment...' 
                : 'Create Assignment'
            }
          </Button>
        </div>

        {availableVehicles.length === 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-800">No Available Vehicles</div>
                  <div className="text-sm text-yellow-700">
                    All vehicles are currently assigned. Please add new vehicles or end existing assignments.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
};

export default AddAssignmentForm;