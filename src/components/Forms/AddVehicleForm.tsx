import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/types/user';
import { Camera, Upload, X } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Enhanced Fleet Rental Vehicle Schema
const vehicleSchema = z.object({
  // Basic Vehicle Information
  vehicleName: z.string().min(2, 'Vehicle name is required'),
  registrationNumber: z.string().min(3, 'Registration number is required'),
  make: z.string().min(2, 'Make is required'),
  model: z.string().min(2, 'Model is required'),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  condition: z.enum(['new', 'used', 'new_in_operation']),
  
  // Financial Information
  purchasePrice: z.number().min(1, 'Purchase price is required'),
  depreciationRate: z.number().min(0).max(100, 'Depreciation rate should be between 0 and 100%'),
  financingType: z.enum(['cash', 'loan']),
  
  // Loan Details (conditional)
  loanAmount: z.number().optional(),
  downPayment: z.number().optional(),
  interestRate: z.number().optional(),
  emiPerMonth: z.number().optional(),
  tenureMonths: z.number().optional(),
  loanAccountNumber: z.string().optional(),
  firstInstallmentDate: z.string().optional(),
  
  // Historical Data for vehicles in operation
  operationStartDate: z.string().optional(),
  lastPaidInstallmentDate: z.string().optional(),
  previousExpenses: z.number().optional(),
  previousRentEarnings: z.number().optional(),
  
  // Maintenance
  odometer: z.number().min(0, 'Odometer reading is required'),
  lastMaintenanceKm: z.number().min(0, 'Last maintenance km is required'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface AddVehicleFormProps {
  onSuccess: () => void;
  vehicle?: any | null;
  mode?: 'add' | 'edit';
}

const AddVehicleForm: React.FC<AddVehicleFormProps> = ({ onSuccess, vehicle = null, mode = 'add' }) => {
  const { addVehicle, updateVehicle } = useFirebaseData();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');

  // Vehicle Images State
  const [vehicleImages, setVehicleImages] = useState<{
    front: File | null;
    back: File | null;
    interior: File | null;
    documents: File | null;
  }>({
    front: null,
    back: null,
    interior: null,
    documents: null
  });
  
  const [imagePreviewUrls, setImagePreviewUrls] = useState<{
    front: string | null;
    back: string | null;
    interior: string | null;
    documents: string | null;
  }>({
    front: null,
    back: null,
    interior: null,
    documents: null
  });
  
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleName: vehicle?.vehicleName || '',
      registrationNumber: vehicle?.registrationNumber || '',
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      year: vehicle?.year || new Date().getFullYear(),
      condition: vehicle?.condition || 'new',
      purchasePrice: vehicle?.initialCost || 0,
      depreciationRate: vehicle?.depreciationRate ? (vehicle.depreciationRate * 100) : 15,
      financingType: vehicle?.financingType || 'loan',
      loanAmount: vehicle?.loanDetails?.totalLoan || 0,
      downPayment: vehicle?.loanDetails?.downPayment || 0,
      interestRate: vehicle?.loanDetails?.interestRate || 8.5,
      emiPerMonth: vehicle?.loanDetails?.emiPerMonth || 0,
      tenureMonths: vehicle?.loanDetails?.totalInstallments || 60,
      loanAccountNumber: vehicle?.loanDetails?.loanAccountNumber || '',
      firstInstallmentDate: vehicle?.firstInstallmentDate || '',
      operationStartDate: vehicle?.operationStartDate || '',
      lastPaidInstallmentDate: vehicle?.lastPaidInstallmentDate || '',
      previousExpenses: vehicle?.previousData?.expenses || 0,
      previousRentEarnings: vehicle?.previousData?.rentEarnings || 0,
      odometer: vehicle?.odometer || 0,
      lastMaintenanceKm: vehicle?.lastMaintenanceKm || 0,
    },
  });

  const watchFinancingType = form.watch('financingType');
  const watchCondition = form.watch('condition');
  const watchPurchasePrice = form.watch('purchasePrice');
  const watchDownPayment = form.watch('downPayment');
  const watchLoanAmount = form.watch('loanAmount');
  const watchInterestRate = form.watch('interestRate');
  const watchTenureMonths = form.watch('tenureMonths');

  // Auto-calculate loan amount when purchase price and down payment change
  useEffect(() => {
    if (watchPurchasePrice && watchDownPayment && watchFinancingType === 'loan') {
      const calculatedLoanAmount = watchPurchasePrice - watchDownPayment;
      if (calculatedLoanAmount > 0) {
        form.setValue('loanAmount', calculatedLoanAmount);
      }
    }
  }, [watchPurchasePrice, watchDownPayment, watchFinancingType, form]);

  // Auto-calculate EMI when loan details change
  useEffect(() => {
    if (watchLoanAmount && watchInterestRate && watchTenureMonths && watchFinancingType === 'loan') {
      const principal = watchLoanAmount;
      const monthlyRate = watchInterestRate / 12 / 100;
      const months = watchTenureMonths;
      
      if (monthlyRate > 0) {
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                    (Math.pow(1 + monthlyRate, months) - 1);
        form.setValue('emiPerMonth', Math.round(emi));
      }
    }
  }, [watchLoanAmount, watchInterestRate, watchTenureMonths, watchFinancingType, form]);

  // Image handling functions
  const handleImageChange = (imageType: 'front' | 'back' | 'interior' | 'documents', file: File | null) => {
    setVehicleImages(prev => ({
      ...prev,
      [imageType]: file
    }));

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrls(prev => ({
          ...prev,
          [imageType]: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviewUrls(prev => ({
        ...prev,
        [imageType]: null
      }));
    }
  };

  const removeImage = (imageType: 'front' | 'back' | 'interior' | 'documents') => {
    handleImageChange(imageType, null);
  };

  // Upload images to Cloudinary
  const uploadVehicleImages = async () => {
    const uploadedImages: Record<string, string> = {};
    
    for (const [type, file] of Object.entries(vehicleImages)) {
      if (file) {
        try {
          const cloudinaryUrl = await uploadToCloudinary(file);
          uploadedImages[type] = cloudinaryUrl;
        } catch (error) {
          console.error(`Failed to upload ${type} image:`, error);
          throw new Error(`Failed to upload ${type} image`);
        }
      }
    }
    
    return uploadedImages;
  };

  // Calculate initial investment
  const calculateInitialInvestment = () => {
    const downPayment = watchDownPayment || 0;
    const previousExpenses = form.watch('previousExpenses') || 0;
    return watchFinancingType === 'cash' ? watchPurchasePrice : downPayment + previousExpenses;
  };

  // Calculate installments paid based on dates
  const calculatePaidInstallments = (firstDate: string, lastPaidDate: string) => {
    if (!firstDate || !lastPaidDate) return 0;
    
    const first = new Date(firstDate);
    const lastPaid = new Date(lastPaidDate);
    
    const monthsDiff = (lastPaid.getFullYear() - first.getFullYear()) * 12 + 
                      (lastPaid.getMonth() - first.getMonth()) + 1;
    
    return Math.max(0, monthsDiff);
  };

  // Generate amortization schedule
  const generateAmortizationSchedule = (
    loanAmount: number,
    emiPerMonth: number,
    tenureMonths: number,
    annualRate: number,
    firstInstallmentDate: string,
    paidInstallments: number = 0
  ) => {
    const monthlyRate = annualRate / 12 / 100;
    const schedule = [];
    let outstanding = loanAmount;
    const startDate = new Date(firstInstallmentDate || Date.now());

    for (let month = 1; month <= tenureMonths; month++) {
      const interest = outstanding * monthlyRate;
      const principal = Math.min(emiPerMonth - interest, outstanding);
      outstanding -= principal;

      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + (month - 1));

      const isPaid = month <= paidInstallments;
      const paidAt = isPaid ? new Date(dueDate.getTime() - (Math.random() * 5 * 24 * 60 * 60 * 1000)).toISOString() : null;

      schedule.push({
        month,
        interest: Math.round(interest * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        outstanding: Math.round(outstanding * 100) / 100,
        dueDate: dueDate.toISOString(),
        isPaid,
        paidAt,
      });

      if (outstanding <= 0) break;
    }

    return schedule;
  };

  const onSubmit = async (data: VehicleFormData) => {
    try {
      setIsUploadingImages(true);
      
      // Upload vehicle images first
      let uploadedImages = {};
      try {
        uploadedImages = await uploadVehicleImages();
      } catch (error) {
        toast({
          title: 'Image Upload Failed',
          description: error.message || 'Failed to upload vehicle images. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      if (mode === 'edit' && vehicle) {
        // Update existing vehicle
        const updateData: Partial<Vehicle> = {
          vehicleName: data.vehicleName,
          registrationNumber: data.registrationNumber,
          make: data.make,
          model: data.model,
          year: data.year,
          condition: data.condition,
          initialCost: data.purchasePrice,
          residualValue: data.purchasePrice * (1 - (data.depreciationRate / 100)),
          depreciationRate: data.depreciationRate / 100,
          financingType: data.financingType,
          odometer: data.odometer,
          lastMaintenanceKm: data.lastMaintenanceKm,
          
          // Update loan details if applicable
          loanDetails: data.financingType === 'loan' ? {
            ...vehicle.loanDetails,
            totalLoan: data.loanAmount || 0,
            emiPerMonth: data.emiPerMonth || 0,
            totalInstallments: data.tenureMonths || 0,
            interestRate: data.interestRate || 0,
            downPayment: data.downPayment || 0,
            loanAccountNumber: data.loanAccountNumber || '',
          } : vehicle.loanDetails,
          
          // Update images if new ones uploaded
          images: Object.keys(uploadedImages).length > 0 ? 
            { ...vehicle.images, ...uploadedImages } : 
            vehicle.images,
          
          updatedAt: new Date().toISOString(),
        };

        await updateVehicle(vehicle.id, updateData);
        
        toast({
          title: 'Success',
          description: `Vehicle "${data.vehicleName}" updated successfully!`,
        });
      } else {
        // Create new vehicle (original add logic)
        // Calculate initial investment
        const initialInvestment = calculateInitialInvestment();

        // Calculate paid installments for historical data
        let paidInstallments = 0;
        if (data.condition === 'new_in_operation' && data.firstInstallmentDate && data.lastPaidInstallmentDate) {
          paidInstallments = calculatePaidInstallments(data.firstInstallmentDate, data.lastPaidInstallmentDate);
        }

        // Generate amortization schedule
        let amortizationSchedule = [];
        let outstandingLoan = 0;
        
        if (data.financingType === 'loan' && data.loanAmount && data.emiPerMonth && data.tenureMonths) {
          amortizationSchedule = generateAmortizationSchedule(
            data.loanAmount,
            data.emiPerMonth,
            data.tenureMonths,
            data.interestRate || 8.5,
            data.firstInstallmentDate || new Date().toISOString(),
            paidInstallments
          );
          
          // Calculate current outstanding
          const unpaidInstallments = amortizationSchedule.filter(schedule => !schedule.isPaid);
          outstandingLoan = unpaidInstallments.length > 0 ? 
            unpaidInstallments[0].outstanding + unpaidInstallments[0].principal : 0;
        }

        // Determine financial status
        let financialStatus: 'cash' | 'loan_active' | 'loan_cleared' = 'cash';
        if (data.financingType === 'cash') {
          financialStatus = 'cash';
        } else if (outstandingLoan > 0) {
          financialStatus = 'loan_active';
        } else {
          financialStatus = 'loan_cleared';
        }

        const vehicleData: Omit<Vehicle, 'id'> = {
          // Basic Information
          vehicleName: data.vehicleName,
          registrationNumber: data.registrationNumber,
          make: data.make,
          model: data.model,
          year: data.year,
          condition: data.condition,

          // Financial Details
          initialCost: data.purchasePrice,
          residualValue: data.purchasePrice * (1 - (data.depreciationRate / 100)),
          depreciationRate: data.depreciationRate / 100,
          initialInvestment,
          financingType: data.financingType,

          // Current State
          odometer: data.odometer,
          status: 'available',
          financialStatus,
          assignedDriverId: '',

          // Loan Details
          loanDetails: {
            totalLoan: data.loanAmount || 0,
            outstandingLoan,
            emiPerMonth: data.emiPerMonth || 0,
            totalInstallments: data.tenureMonths || 0,
            interestRate: data.interestRate || 0,
            downPayment: data.downPayment || 0,
            loanAccountNumber: data.loanAccountNumber || '',
            emiDueDate: 1, // Default to 1st of month
            paidInstallments: Array(paidInstallments).fill(new Date().toISOString()),
            amortizationSchedule,
          },

          // Historical Data
          previousData: {
            expenses: data.previousExpenses || 0,
            emiPaid: paidInstallments,
            rentEarnings: data.previousRentEarnings || 0,
          },

          // Operational Data
          expenses: [],
          payments: [],
          history: [],
          lastMaintenanceKm: data.lastMaintenanceKm,
          needsMaintenance: false,
          maintenanceHistory: [],
          averageDailyKm: 0,

          // System Fields
          companyId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          monthlyEarnings: 0,
          monthlyExpenses: 0,
          totalEarnings: 0,
          totalExpenses: 0,
          
          // Vehicle Images
          images: uploadedImages
        };

        await addVehicle(vehicleData);
        
        toast({
          title: 'Success',
          description: `Vehicle "${data.vehicleName}" added successfully! ${paidInstallments > 0 ? `${paidInstallments} EMI installments marked as paid.` : ''}`,
        });
      }
      
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add vehicle',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="loan">Loan Details</TabsTrigger>
            <TabsTrigger value="history">Historical Data</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Innova Gold, Swift Blue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number Plate</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., MH12AB1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Toyota" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Innova Crysta" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Condition</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new" id="new" />
                            <Label htmlFor="new">New (Just Purchased)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new_in_operation" id="new_in_operation" />
                            <Label htmlFor="new_in_operation">New but In Operation (Migrating to this software)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="used" id="used" />
                            <Label htmlFor="used">Used (Pre-owned)</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="odometer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Odometer (km)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 25000"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastMaintenanceKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Maintenance at (km)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 20000"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Vehicle Images Upload Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Camera className="w-5 h-5 mr-2" />
                    Vehicle Images
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Front Image */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Front View</label>
                      <div className="relative">
                        {imagePreviewUrls.front ? (
                          <div className="relative">
                            <img 
                              src={imagePreviewUrls.front} 
                              alt="Vehicle Front" 
                              className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => removeImage('front')}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Click to upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleImageChange('front', file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Back Image */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Back View</label>
                      <div className="relative">
                        {imagePreviewUrls.back ? (
                          <div className="relative">
                            <img 
                              src={imagePreviewUrls.back} 
                              alt="Vehicle Back" 
                              className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => removeImage('back')}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Click to upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleImageChange('back', file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Interior Image */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Interior</label>
                      <div className="relative">
                        {imagePreviewUrls.interior ? (
                          <div className="relative">
                            <img 
                              src={imagePreviewUrls.interior} 
                              alt="Vehicle Interior" 
                              className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => removeImage('interior')}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Click to upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleImageChange('interior', file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Documents Image */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Documents</label>
                      <div className="relative">
                        {imagePreviewUrls.documents ? (
                          <div className="relative">
                            <img 
                              src={imagePreviewUrls.documents} 
                              alt="Vehicle Documents" 
                              className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => removeImage('documents')}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Click to upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleImageChange('documents', file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload clear images of your vehicle. These will help with identification and record keeping.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Information Tab */}
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 1500000"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="depreciationRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yearly Depreciation Rate (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            placeholder="e.g., 15 for 15% per year"
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="financingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cash" id="cash" />
                            <Label htmlFor="cash">Cash Payment</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="loan" id="loan" />
                            <Label htmlFor="loan">Loan Financing</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Calculated Values:</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p>Initial Investment: ₹{calculateInitialInvestment().toLocaleString()}</p>
                    <p>Current Value: ₹{(watchPurchasePrice * (1 - (form.watch('depreciationRate') / 100))).toLocaleString()}</p>
                    <p>Yearly Depreciation: ₹{(watchPurchasePrice * (form.watch('depreciationRate') / 100)).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loan Details Tab */}
          <TabsContent value="loan" className="space-y-4">
            {watchFinancingType === 'loan' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Loan & EMI Details</CardTitle>
                  <p className="text-sm text-gray-600">EMI will be auto-calculated based on loan amount, interest rate, and tenure</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="downPayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Down Payment (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 300000"
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="loanAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Amount (₹) - Auto Calculated</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="interestRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Interest Rate (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              placeholder="e.g., 8.5"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tenureMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenure (Months)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 60"
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emiPerMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly EMI (₹) - Auto Calculated</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="bg-gray-50"
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
                      name="firstInstallmentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Installment Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="loanAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., HDFC123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Loan details not required for cash payment</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Historical Data Tab */}
          <TabsContent value="history" className="space-y-4">
            {(watchCondition === 'used' || watchCondition === 'new_in_operation') ? (
              <Card>
                <CardHeader>
                  <CardTitle>Historical Data</CardTitle>
                  <p className="text-sm text-gray-600">
                    {watchCondition === 'new_in_operation' 
                      ? "Since you're migrating to this software with a vehicle already in operation, please provide historical data for accurate calculations."
                      : "For used vehicle, add any previous operational data if available."
                    }
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {watchCondition === 'new_in_operation' && (
                    <FormField
                      control={form.control}
                      name="operationStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operation Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="previousExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Cumulative Expenses (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 150000"
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="previousRentEarnings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Total Rent Earnings (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 400000"
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {watchFinancingType === 'loan' && watchCondition === 'new_in_operation' && (
                    <FormField
                      control={form.control}
                      name="lastPaidInstallmentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Paid EMI Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <p className="text-xs text-gray-500 mt-1">
                            System will automatically calculate how many EMIs are paid based on first installment date
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {watchCondition === 'new_in_operation' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Auto-Calculated Values:</h4>
                      <div className="space-y-1 text-sm text-blue-700">
                        <p>• EMI installments paid will be calculated based on first and last payment dates</p>
                        <p>• Outstanding loan amount will be adjusted automatically</p>
                        <p>• Next EMI due date will be highlighted in the EMI tracking grid</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Historical data not required for new vehicles</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">What happens after adding this vehicle:</h4>
          <div className="space-y-1 text-sm text-green-700">
            <p>✓ Vehicle will be available for assignment to drivers</p>
            <p>✓ EMI schedule will be automatically generated and displayed</p>
            <p>✓ You can track weekly rent collections once assigned</p>
            <p>✓ Real-time ROI and profit calculations will be available</p>
            {watchCondition === 'new_in_operation' && (
              <p>✓ Historical EMI payments will be marked as paid in the tracking grid</p>
            )}
          </div>
        </div>

        <div className="flex space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              const tabs = ['basic', 'financial', 'loan', 'history'];
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
              const tabs = ['basic', 'financial', 'loan', 'history'];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex < tabs.length - 1) {
                setActiveTab(tabs[currentIndex + 1]);
              }
            }}
            disabled={activeTab === 'history'}
          >
            Next
          </Button>

          <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting || isUploadingImages}>
            {isUploadingImages ? 'Uploading Images...' : form.formState.isSubmitting ? (mode === 'edit' ? 'Updating Vehicle...' : 'Adding Vehicle...') : (mode === 'edit' ? 'Update Vehicle' : 'Add Vehicle to Fleet')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddVehicleForm;