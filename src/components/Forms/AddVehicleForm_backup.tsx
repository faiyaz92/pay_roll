import React, { useState, useEffect } from 'react';om 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';/components/ui/select';
import { Progress } from '@/components/ui/progress';mLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  Plus,  Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
  Car, { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
  Search, abel } from '@/components/ui/label';
  Eye, { Checkbox } from '@/components/ui/checkbox';
  Edit,  useFirebaseData } from '@/hooks/useFirebaseData';
  DollarSign, ast } from '@/hooks/use-toast';
  TrendingUp, le } from '@/types/user';
  AlertCircle,
  CreditCard,ehicle Schema with new conditions
  Calendar,leSchema = z.object({
  Fuelasic Vehicle Information
} from 'lucide-react';g().min(2, 'Vehicle name is required'),
import AddItemModal from '@/components/Modals/AddItemModal'; is required'),
import AddVehicleForm from '@/components/Forms/AddVehicleForm';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { toast } from '@/hooks/use-toast';).getFullYear() + 1),
  condition: z.enum(['new', 'used', 'new_in_operation']),
const Vehicles: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');is required'),
  const [showAddModal, setShowAddModal] = useState(false);on rate should be between 0 and 100%'),
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { vehicles, loading, deleteVehicle } = useFirebaseData();
  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {ate: z.number().optional(),
        await deleteVehicle(vehicleId);
        toast({ title: 'Vehicle Deleted', description: 'Vehicle has been deleted successfully.' });
      } catch (error: any) {g().optional(),
        toast({ title: 'Error', description: error.message || 'Failed to delete vehicle', variant: 'destructive' });
      }
    }Historical Data for vehicles in operation
  };erationStartDate: z.string().optional(),
  lastPaidInstallmentDate: z.string().optional(),
  const getStatusBadge = (status: string) => {
    const statusConfig = {number().optional(),
      available: { 
        color: 'bg-green-500 hover:bg-green-600', 
        text: 'Available',(0, 'Odometer reading is required'),
        icon: <Car className="h-4 w-4" />ast maintenance km is required'),
      },
      rented: { 
        color: 'bg-blue-500 hover:bg-blue-600', ema>;
        text: 'Rented',
        icon: <DollarSign className="h-4 w-4" />
      },ess: () => void;
      maintenance: { 
        color: 'bg-red-500 hover:bg-red-600', 
        text: 'Maintenance',FC<AddVehicleFormProps> = ({ onSuccess }) => {
        icon: <AlertCircle className="h-4 w-4" />
      },{ toast } = useToast();
    };t [activeTab, setActiveTab] = useState('basic');
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    resolver: zodResolver(vehicleSchema),
    return (alues: {
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}ber: '',
        {config.text}
      </Badge>',
    );year: new Date().getFullYear(),
  };  condition: 'new',
      purchasePrice: 0,
  const getFinancialStatusBadge = (financialStatus: string) => {
    const statusConfig = {',
      cash: { nt: 0,
        color: 'bg-emerald-500 hover:bg-emerald-600', 
        text: 'Cash Purchase',
        icon: <TrendingUp className="h-4 w-4" />
      },nureMonths: 60,
      loan_active: { er: '',
        color: 'bg-yellow-500 hover:bg-yellow-600', 
        text: 'Loan Active',,
        icon: <CreditCard className="h-4 w-4" />
      },eviousExpenses: 0,
      loan_cleared: { ings: 0,
        color: 'bg-purple-500 hover:bg-purple-600', 
        text: 'Loan Cleared',
        icon: <Calendar className="h-4 w-4" />
      },
    };
    nst watchFinancingType = form.watch('financingType');
    const config = statusConfig[financialStatus as keyof typeof statusConfig] || statusConfig.cash;
    nst watchLoanAmount = form.watch('loanAmount');
    return (hInterestRate = form.watch('interestRate');
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}Price = form.watch('purchasePrice');
        {config.text}ent = form.watch('downPayment');
      </Badge>
    );uto-calculate EMI when loan details change
  };eEffect(() => {
    if (watchLoanAmount && watchInterestRate && watchTenureMonths && watchFinancingType === 'loan') {
  const calculateMonthlyProfit = (vehicle: any) => {
    // Use real rental dataatchInterestRate / 12 / 100;
    const monthlyRent = vehicle.currentRental ? 
      (vehicle.currentRental.weeklyRent * 52) / 12 : 0;
    const monthlyEMI = vehicle.loanDetails?.emiPerMonth || 0;thlyRate, months)) / 
    const monthlyExpenses = vehicle.monthlyExpenses || 0;;
      
    return monthlyRent - monthlyEMI - monthlyExpenses;
  };}
  }, [watchLoanAmount, watchInterestRate, watchTenureMonths, watchFinancingType, form]);
  const calculateROI = (vehicle: any) => {
    const totalInvested = vehicle.initialInvestment + vehicle.totalExpenses;
    const totalEarned = vehicle.totalEarnings;
    const currentValue = vehicle.residualValue;&& watchFinancingType === 'loan') {
      const calculatedLoanAmount = watchPurchasePrice - watchDownPayment;
    if (totalInvested === 0) return 0;
    return ((totalEarned + currentValue - totalInvested) / totalInvested) * 100;
  };  }
    }
  const filteredVehicles = vehicles.filter(vehicle => {ingType, form]);
    const matchesSearch = 
      vehicle.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    const lastPaid = new Date(lastPaidDate);
    return matchesSearch && matchesStatus;
  });onst monthsDiff = (lastPaid.getFullYear() - first.getFullYear()) * 12 + 
                      (lastPaid.getMonth() - first.getMonth()) + 1;
  const getVehicleStats = () => {
    const total = vehicles.length;;
    const available = vehicles.filter(v => v.status === 'available').length;
    const rented = vehicles.filter(v => v.status === 'rented').length;
  // Generate comprehensive amortization schedule
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
      const paidDate = isPaid ? new Date(dueDate.getTime() - (3 * 24 * 60 * 60 * 1000)) : null; // 3 days before due date as mock paid date

      schedule.push({
        month,
        interest: Math.round(interest * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        outstanding: Math.round(outstanding * 100) / 100,
        dueDate: dueDate.toISOString(),
        isPaid,
        paidDate: paidDate?.toISOString() || null,
        canEdit: isPaid ? false : true, // Will be calculated based on 3-day rule
      });

      if (outstanding <= 0) break;
    }

    return schedule;
  };

  const onSubmit = async (data: VehicleFormData) => {
    try {
      // Calculate initial investment
      const initialInvestment = data.financingType === 'cash' ? 
        data.purchasePrice : (data.downPayment || 0) + (data.previousExpenses || 0);

      // Calculate paid installments for historical data
      let paidInstallments = 0;
      if (data.condition === 'new_in_operation' && data.firstInstallmentDate && data.lastPaidInstallmentDate) {
        paidInstallments = calculatePaidInstallments(data.firstInstallmentDate, data.lastPaidInstallmentDate);
      } else if (data.condition === 'used' && data.previousExpenses) {
        // Estimate based on operation period
        paidInstallments = Math.floor((data.previousExpenses || 0) / (data.emiPerMonth || 1));
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
          firstInstallmentDate: data.firstInstallmentDate || new Date().toISOString(),
          paidInstallments: paidInstallments,
          amortizationSchedule,
        },
        
        // Historical Data
        previousData: {
          expenses: data.previousExpenses || 0,
          emiPaid: paidInstallments,
          rentEarnings: data.previousRentEarnings || 0,
          operationStartDate: data.operationStartDate || new Date().toISOString(),
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
      };

      await addVehicle(vehicleData);
      
      toast({
        title: 'Success',
        description: `Vehicle "${data.vehicleName}" added successfully! ${paidInstallments > 0 ? `${paidInstallments} EMI installments marked as paid.` : ''}`,
      });
      
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add vehicle',
        variant: 'destructive',
      });
    }
  };

  const isHistoricalDataRequired = watchCondition === 'used' || watchCondition === 'new_in_operation';

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Label htmlFor="new">New</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="new_in_operation" id="new_in_operation" />
                              <Label htmlFor="new_in_operation">New but in Operation</Label>
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
                              placeholder="Will be calculated automatically"
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
                              placeholder="Auto calculated"
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
            {isHistoricalDataRequired ? (
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

                  {watchFinancingType === 'loan' && (
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

          <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Adding Vehicle...' : 'Add Vehicle to Fleet'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddVehicleForm;

