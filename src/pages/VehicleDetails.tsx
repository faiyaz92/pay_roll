import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { Vehicle } from '@/types/user';
import { 
  Car, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  CircleDollarSign,
  Calculator,
  Settings,
  Plus,
  Fuel,
  History
} from 'lucide-react';

const VehicleDetails: React.FC = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, expenses, getVehicleFinancialData, updateVehicle, addExpense, loading } = useFirebaseData();
  const [prepaymentAmount, setPrepaymentAmount] = useState('');
  const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [selectedEMI, setSelectedEMI] = useState<{monthIndex: number, scheduleItem: any} | null>(null);
  const [prepaymentResults, setPrepaymentResults] = useState<{
    amount: number;
    newOutstanding: number;
    newTenure: number;
    tenureReduction: number;
    interestSavings: number;
  } | null>(null);
  const [showPrepaymentResults, setShowPrepaymentResults] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    type: 'fuel'
  });
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentDateFilter, setPaymentDateFilter] = useState('');
  const [showEmiForm, setShowEmiForm] = useState(false);
  const [showRentForm, setShowRentForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Find vehicle from the vehicles array
  const vehicle = vehicles.find(v => v.id === vehicleId);
  
  // Get real-time financial data
  const financialData = vehicle ? getVehicleFinancialData(vehicleId!) : null;

  // Helper function to get vehicle expense data
  const getVehicleExpenseData = () => {
    // Filter expenses for this vehicle
    const vehicleExpenses = expenses.filter(e => e.vehicleId === vehicleId && e.status === 'approved');
    
    // Calculate totals by category
    const fuelExpenses = vehicleExpenses.filter(e => e.description.toLowerCase().includes('fuel')).reduce((sum, e) => sum + e.amount, 0);
    const maintenanceExpenses = vehicleExpenses.filter(e => e.type === 'maintenance').reduce((sum, e) => sum + e.amount, 0);
    const penaltyExpenses = vehicleExpenses.filter(e => e.description.toLowerCase().includes('penalty')).reduce((sum, e) => sum + e.amount, 0);
    const otherExpenses = vehicleExpenses.filter(e => e.type === 'general' && !e.description.toLowerCase().includes('penalty') && !e.description.toLowerCase().includes('fuel')).reduce((sum, e) => sum + e.amount, 0);
    
    const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate monthly average (last 12 months)
    const currentDate = new Date();
    const lastYear = new Date(currentDate.getFullYear(), currentDate.getMonth() - 12, currentDate.getDate());
    const recentExpenses = vehicleExpenses.filter(e => new Date(e.createdAt) >= lastYear);
    const monthlyAverage = recentExpenses.length > 0 ? recentExpenses.reduce((sum, e) => sum + e.amount, 0) / 12 : 0;
    
    // Get recent expenses (last 10)
    const recentExpensesList = vehicleExpenses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    return {
      totalExpenses,
      monthlyAverage,
      fuelExpenses,
      maintenanceExpenses,
      penaltyExpenses,
      otherExpenses,
      recentExpenses: recentExpensesList,
      expenseRatio: financialData?.totalEarnings ? (totalExpenses / financialData.totalEarnings) * 100 : 0
    };
  };
  
  // Get real expense data for this vehicle
  const expenseData = getVehicleExpenseData();

  // Generate payment history data
  const generatePaymentHistory = () => {
    const payments = [];

    if (!vehicle || !financialData) return payments;

    // Add EMI payments from amortization schedule
    if (vehicle.loanDetails?.amortizationSchedule) {
      vehicle.loanDetails.amortizationSchedule.forEach((emi, index) => {
        if (emi.isPaid) {
          payments.push({
            date: emi.paidAt || emi.dueDate,
            type: 'emi',
            amount: emi.interest + emi.principal,
            description: `EMI Payment - Month ${index + 1}`,
            paymentMethod: 'Bank Transfer',
            status: 'completed',
            reference: `EMI${vehicleId?.slice(-4)}${String(index + 1).padStart(2, '0')}`
          });
        }
      });
    }

    // Add prepayments from vehicle data
    // Note: Currently using placeholder logic as prepayments structure needs to be defined
    // This section can be updated once prepayment data structure is established

    // Add rent collections from assignments
    if ((vehicle as any).assignments && (vehicle as any).assignments.length > 0) {
      (vehicle as any).assignments.forEach((assignment: any) => {
        if (assignment.rentPayments && assignment.rentPayments.length > 0) {
          assignment.rentPayments.forEach((rent: any, index: number) => {
            payments.push({
              date: rent.date,
              type: 'rent',
              amount: rent.amount,
              description: `Rent from ${assignment.driverName}`,
              paymentMethod: rent.paymentMethod || 'Cash',
              status: 'completed',
              reference: rent.transactionId || `RENT${vehicleId?.slice(-4)}${String(index + 1).padStart(2, '0')}`
            });
          });
        }
      });
    }

    // Add expenses
    expenses.filter(e => e.vehicleId === vehicleId && e.status === 'approved').forEach((expense, index) => {
      payments.push({
        date: expense.createdAt,
        type: expense.type === 'maintenance' ? 'maintenance' : 'expense',
        amount: expense.amount,
        description: expense.description,
        paymentMethod: 'Bank Transfer',
        status: 'completed',
        reference: expense.id || `EXP${vehicleId?.slice(-4)}${String(index + 1).padStart(2, '0')}`
      });
    });

    // Sort by date (newest first)
    return payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Get all payment history
  const allPayments = generatePaymentHistory();

  // Filter payments based on selected filters
  const filteredPayments = allPayments.filter(payment => {
    // Filter by type
    if (paymentFilter !== 'all' && payment.type !== paymentFilter) {
      return false;
    }

    // Filter by date (month/year)
    if (paymentDateFilter) {
      const paymentDate = new Date(payment.date);
      const filterDate = new Date(paymentDateFilter);
      if (paymentDate.getFullYear() !== filterDate.getFullYear() || 
          paymentDate.getMonth() !== filterDate.getMonth()) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!vehicle || !financialData) {
    return <div className="flex justify-center items-center h-64">Vehicle not found</div>;
  }

  // Helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { color: 'bg-green-500', text: 'Available' },
      rented: { color: 'bg-blue-500', text: 'Rented' },
      maintenance: { color: 'bg-red-500', text: 'Maintenance' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getFinancialStatusBadge = (financialStatus: string) => {
    const statusConfig = {
      cash: { color: 'bg-emerald-500', text: 'Cash Purchase' },
      loan_active: { color: 'bg-yellow-500', text: 'Loan Active' },
      loan_cleared: { color: 'bg-purple-500', text: 'Loan Cleared' },
    };
    
    const config = statusConfig[financialStatus as keyof typeof statusConfig] || statusConfig.cash;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const calculateMonthlyProfit = () => {
    // Use real-time financial data
    return financialData.monthlyProfit;
  };

  const calculateROI = () => {
    // Use real-time financial data  
    return financialData.currentROI;
  };

  const getCurrentMonthlyRent = () => {
    // Return 0 if vehicle is not currently rented
    return financialData.isCurrentlyRented ? financialData.monthlyRent : 0;
  };

  const getCurrentAssignmentDetails = () => {
    if (!financialData.isCurrentlyRented || !financialData.currentAssignment) {
      return null;
    }
    
    const assignment = financialData.currentAssignment;
    return {
      weeklyRent: assignment.weeklyRent,
      dailyRent: assignment.dailyRent,
      startDate: assignment.startDate,
      collectionDay: assignment.collectionDay
    };
  };

  const handlePrepayment = () => {
    const amount = parseFloat(prepaymentAmount);
    const outstandingLoan = financialData.outstandingLoan;
    
    if (amount > 0 && amount <= outstandingLoan) {
      // Calculate new outstanding and tenure
      const monthlyRate = (vehicle.loanDetails?.interestRate || 8.5) / 12 / 100;
      const newOutstanding = outstandingLoan - amount;
      const emiPerMonth = vehicle.loanDetails?.emiPerMonth || 0;
      
      let newTenure = 0;
      let outstanding = newOutstanding;
      
      // Calculate new tenure with same EMI
      while (outstanding > 0 && newTenure < 360) { // Max 30 years
        const interest = outstanding * monthlyRate;
        const principal = Math.max(emiPerMonth - interest, outstanding); // Ensure we don't go negative
        outstanding -= principal;
        newTenure++;
        
        if (principal <= 0 || outstanding <= 0) break;
      }
      
      const currentTenure = vehicle.loanDetails?.amortizationSchedule?.filter(s => !s.isPaid).length || 0;
      const tenureReduction = Math.max(0, currentTenure - newTenure);
      const interestSavings = Math.max(0, (emiPerMonth * tenureReduction) - amount);
      
      // Store results to display in card
      setPrepaymentResults({
        amount,
        newOutstanding,
        newTenure,
        tenureReduction,
        interestSavings
      });
      setShowPrepaymentResults(true);
      
    } else if (amount > outstandingLoan) {
      toast({
        title: 'Amount Exceeds Outstanding Loan',
        description: `Maximum prepayment amount is ₹${outstandingLoan.toLocaleString()}. This would clear the entire loan.`,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid prepayment amount greater than ₹0.',
        variant: 'destructive'
      });
    }
  };

  const processPrepayment = async () => {
    if (!prepaymentResults) return;
    
    try {
      // Update vehicle with new outstanding loan
      const updatedSchedule = [...(vehicle.loanDetails?.amortizationSchedule || [])];
      
      // Mark enough EMIs as prepaid to account for the prepayment
      let remainingPrepayment = prepaymentResults.amount;
      for (let i = 0; i < updatedSchedule.length && remainingPrepayment > 0; i++) {
        if (!updatedSchedule[i].isPaid) {
          const principalAmount = updatedSchedule[i].principal || 0;
          if (remainingPrepayment >= principalAmount) {
            updatedSchedule[i].isPaid = true;
            updatedSchedule[i].paidAt = new Date().toISOString().split('T')[0];
            (updatedSchedule[i] as any).prepaid = true;
            remainingPrepayment -= principalAmount;
          } else {
            // Partial payment for this EMI
            updatedSchedule[i].principal = principalAmount - remainingPrepayment;
            remainingPrepayment = 0;
          }
        }
      }

      // Update vehicle in Firestore
      await updateVehicle(vehicleId!, {
        loanDetails: {
          ...vehicle.loanDetails!,
          amortizationSchedule: updatedSchedule,
          outstandingLoan: prepaymentResults.newOutstanding
        }
      });

      // Add prepayment record to expenses/payments collection
      await addExpense({
        vehicleId: vehicleId!,
        amount: prepaymentResults.amount,
        description: `Loan prepayment - Principal: ₹${prepaymentResults.amount.toLocaleString()}, Tenure reduced by ${prepaymentResults.tenureReduction} months`,
        billUrl: '',
        submittedBy: 'owner',
        status: 'approved' as const,
        approvedAt: new Date().toISOString(),
        adjustmentWeeks: 0,
        type: 'general' as const,
        verifiedKm: 0,
        companyId: '',
        createdAt: '',
        updatedAt: ''
      });

      toast({
        title: 'Prepayment Successful',
        description: `₹${prepaymentResults.amount.toLocaleString()} prepayment processed successfully. Outstanding reduced to ₹${prepaymentResults.newOutstanding.toLocaleString()}.`,
      });

      // Reset form and close results
      setPrepaymentAmount('');
      setShowPrepaymentResults(false);
      setPrepaymentResults(null);

    } catch (error) {
      console.error('Error processing prepayment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process prepayment. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const markEMIPaid = async (monthIndex: number, scheduleItem: any) => {
    const currentDate = new Date();
    const dueDate = new Date(scheduleItem.dueDate);
    const daysPastDue = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(currentDate.getDate() + 3);
    
    // Check if payment is too early (more than 3 days before due date)
    const canEdit = dueDate <= threeDaysFromNow;
    
    if (!canEdit && daysPastDue < -3) {
      toast({
        title: 'Payment Too Early',
        description: `You can only mark EMI as paid starting 3 days before due date (${new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString()})`,
        variant: 'destructive'
      });
      return;
    }

    if (scheduleItem.isPaid) {
      toast({
        title: 'Already Paid',
        description: `EMI for month ${monthIndex + 1} has already been marked as paid.`,
        variant: 'destructive'
      });
      return;
    }

    // Handle overdue payments with penalty option
    if (daysPastDue > 0) {
      // Set up penalty dialog
      setSelectedEMI({ monthIndex, scheduleItem });
      setPenaltyAmount('');
      setPenaltyDialogOpen(true);
    } else {
      // Regular on-time payment - update directly
      await processEMIPayment(monthIndex, scheduleItem, 0);
    }
  };

  const processEMIPayment = async (monthIndex: number, scheduleItem: any, penalty: number = 0) => {
    try {
      // Update the amortization schedule
      const updatedSchedule = [...(vehicle.loanDetails?.amortizationSchedule || [])];
      updatedSchedule[monthIndex] = {
        ...scheduleItem,
        isPaid: true,
        paidDate: new Date().toISOString().split('T')[0]
      };

      // Update paid installments array with payment date
      const updatedPaidInstallments = [...(vehicle.loanDetails?.paidInstallments || [])];
      const paymentDate = new Date().toISOString().split('T')[0];
      if (!updatedPaidInstallments.includes(paymentDate)) {
        updatedPaidInstallments.push(paymentDate);
      }

      // Update vehicle in Firestore
      await updateVehicle(vehicleId!, {
        loanDetails: {
          ...vehicle.loanDetails!,
          amortizationSchedule: updatedSchedule,
          paidInstallments: updatedPaidInstallments
        }
      });

      // Add penalty as expense if applicable
      if (penalty > 0) {
        await addExpense({
          vehicleId: vehicleId!,
          amount: penalty,
          description: `EMI penalty for month ${monthIndex + 1} (${Math.ceil((new Date().getTime() - new Date(scheduleItem.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days late)`,
          billUrl: '',
          submittedBy: 'owner',
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          adjustmentWeeks: 0,
          type: 'general' as const,
          verifiedKm: 0,
          companyId: '',
          createdAt: '',
          updatedAt: ''
        });
      }

      const totalPaid = (vehicle.loanDetails?.emiPerMonth || 0) + penalty;
      
      toast({
        title: penalty > 0 ? 'Overdue EMI Payment Recorded' : 'EMI Payment Recorded',
        description: penalty > 0 
          ? `EMI for month ${monthIndex + 1} marked as paid:\n• EMI: ₹${(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}\n• Penalty: ₹${penalty.toLocaleString()}\n• Total: ₹${totalPaid.toLocaleString()}`
          : `EMI for month ${monthIndex + 1} (₹${(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}) has been marked as paid.`,
      });

      // Close penalty dialog if open
      setPenaltyDialogOpen(false);
      setSelectedEMI(null);
      setPenaltyAmount('');

    } catch (error) {
      console.error('Error updating EMI payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record EMI payment. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleAddExpense = async () => {
    try {
      const amount = parseFloat(newExpense.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid expense amount.',
          variant: 'destructive'
        });
        return;
      }

      if (!newExpense.description.trim()) {
        toast({
          title: 'Missing Description',
          description: 'Please provide a description for the expense.',
          variant: 'destructive'
        });
        return;
      }

      await addExpense({
        vehicleId: vehicleId!,
        amount: amount,
        description: newExpense.description.trim(),
        billUrl: '',
        submittedBy: 'owner',
        status: 'approved' as const,
        approvedAt: new Date().toISOString(),
        adjustmentWeeks: 0,
        type: newExpense.type as ('general' | 'maintenance'),
        verifiedKm: 0,
        companyId: '',
        createdAt: '',
        updatedAt: ''
      });

      toast({
        title: 'Expense Added',
        description: `${newExpense.type} expense of ₹${amount.toLocaleString()} has been recorded.`,
      });

      // Reset form and close dialog
      setNewExpense({
        amount: '',
        description: '',
        type: 'fuel'
      });
      setAddExpenseDialogOpen(false);

    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add expense. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const markRentCollected = (weekIndex: number) => {
    toast({
      title: 'Rent Collected',
      description: `Weekly rent for week ${weekIndex + 1} has been marked as collected.`,
    });
    
    // Here you would update the payment record in Firestore
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Car className="h-8 w-8" />
            {vehicle.vehicleName || `${vehicle.make} ${vehicle.model}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {vehicle.make} {vehicle.model} ({vehicle.year}) • {vehicle.registrationNumber}
          </p>
          <div className="flex gap-2 mt-2">
            {getStatusBadge(vehicle.status)}
            {getFinancialStatusBadge(vehicle.financialStatus || 'cash')}
            <Badge variant="outline">
              {vehicle.odometer?.toLocaleString() || 'N/A'} km
            </Badge>
            {vehicle.needsMaintenance && (
              <Badge variant="destructive">
                <AlertCircle className="h-4 w-4 mr-1" />
                Maintenance Due
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/vehicles')}>
            Back to Fleet
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Edit Vehicle
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="emi">EMI Tracking</TabsTrigger>
          <TabsTrigger value="rent">Rent Collection</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vehicle Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Condition:</span>
                  <Badge variant="outline" className="capitalize">
                    {vehicle.condition || 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Purchase Price:</span>
                  <span className="font-medium">₹{vehicle.initialCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Value:</span>
                  <span className="font-medium">₹{vehicle.residualValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Depreciation:</span>
                  <span className="text-red-600">
                    {((vehicle.depreciationRate) * 100).toFixed(1)}% yearly
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Initial Investment:</span>
                  <span className="font-medium">₹{(vehicle.initialInvestment || vehicle.initialCost)?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Earnings:</span>
                  <span className="font-medium text-green-600">₹{financialData.totalEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expenses:</span>
                  <span className="font-medium text-red-600">₹{financialData.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Profit:</span>
                  <span className={`font-medium ${calculateMonthlyProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.round(calculateMonthlyProfit()).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current ROI:</span>
                  <span className={`font-medium ${calculateROI() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateROI().toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Rental Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Rental Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={financialData.isCurrentlyRented ? "default" : "secondary"}>
                    {financialData.isCurrentlyRented ? "Rented" : "Available"}
                  </Badge>
                </div>
                {financialData.isCurrentlyRented && getCurrentAssignmentDetails() ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weekly Rent:</span>
                      <span className="font-medium text-green-600">
                        ₹{getCurrentAssignmentDetails()!.weeklyRent.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily Rate:</span>
                      <span className="font-medium">
                        ₹{getCurrentAssignmentDetails()!.dailyRent.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly (Est.):</span>
                      <span className="font-medium text-green-600">
                        ₹{Math.round(getCurrentMonthlyRent()).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Since:</span>
                      <span className="text-sm">
                        {new Date(getCurrentAssignmentDetails()!.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Vehicle is currently available for rental</p>
                    <p className="text-xs text-gray-400 mt-1">No monthly rent being generated</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loan Status Card */}
            {vehicle.financingType === 'loan' && vehicle.loanDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Loan Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Outstanding:</span>
                    <span className="font-medium text-red-600">
                      ₹{vehicle.loanDetails.outstandingLoan?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly EMI:</span>
                    <span className="font-medium">₹{vehicle.loanDetails.emiPerMonth?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">EMIs Paid:</span>
                    <span className="font-medium">
                      {vehicle.loanDetails.paidInstallments?.length || 0}/{vehicle.loanDetails.totalInstallments || 0}
                    </span>
                  </div>
                  
                  <Progress 
                    value={((vehicle.loanDetails.paidInstallments?.length || 0) / (vehicle.loanDetails.totalInstallments || 1)) * 100} 
                    className="h-2"
                  />
                  
                  <div className="text-center">
                    <Badge variant="outline">
                      Next EMI Due: {vehicle.loanDetails.emiDueDate || 'N/A'}th of every month
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Investment & Returns */}
            <Card>
              <CardHeader>
                <CardTitle>Investment & Returns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Initial Investment</span>
                    <span className="font-medium">₹{(vehicle.initialInvestment || vehicle.initialCost)?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses</span>
                    <span className="font-medium text-red-600">₹{financialData.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Earnings</span>
                    <span className="font-medium text-green-600">₹{financialData.totalEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Vehicle Value</span>
                    <span className="font-medium">₹{vehicle.residualValue?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Current ROI</span>
                    <span className={`font-bold ${financialData.currentROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {financialData.currentROI.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {financialData.isCurrentlyRented ? (
                    <>
                      <div className="flex justify-between">
                        <span>Monthly Rent (Est.)</span>
                        <span className="font-medium text-green-600">₹{Math.round(financialData.monthlyRent).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Expenses (Avg.)</span>
                        <span className="font-medium text-red-600">₹{Math.round(financialData.monthlyExpenses).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly EMI</span>
                        <span className="font-medium text-red-600">₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Net Monthly Profit</span>
                        <span className={`font-bold ${financialData.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{Math.round(financialData.monthlyProfit).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Yearly Profit (Est.)</span>
                        <span className={`font-bold ${financialData.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{(Math.round(financialData.monthlyProfit) * 12).toLocaleString()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Vehicle not currently rented</p>
                      <p className="text-xs text-gray-400 mt-1">Monthly breakdown not available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Loan Details */}
            {vehicle.financingType === 'loan' && vehicle.loanDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Loan Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Original Loan</span>
                      <span className="font-medium">₹{vehicle.loanDetails.totalLoan?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding Balance</span>
                      <span className="font-medium text-red-600">₹{financialData.outstandingLoan.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EMIs Paid</span>
                      <span className="font-medium text-green-600">
                        {vehicle.loanDetails.paidInstallments?.length || 0} / {vehicle.loanDetails.totalInstallments || 0}
                      </span>
                    </div>
                    {financialData.nextEMIDue && (
                      <div className="flex justify-between">
                        <span>Next EMI Due</span>
                        <span className={`font-medium ${financialData.daysUntilEMI <= 7 ? 'text-red-600' : 'text-gray-600'}`}>
                          {new Date(financialData.nextEMIDue).toLocaleDateString()} 
                          {financialData.daysUntilEMI >= 0 && (
                            <span className="text-xs block">({financialData.daysUntilEMI} days)</span>
                          )}
                        </span>
                      </div>
                    )}
                    <Progress 
                      value={(vehicle.loanDetails.paidInstallments?.length || 0) / (vehicle.loanDetails.totalInstallments || 1) * 100} 
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prepayment Calculator */}
            {vehicle.financingType === 'loan' && vehicle.loanDetails && financialData.outstandingLoan > 0 && (
              <Card id="prepayment">
                <CardHeader>
                  <CardTitle>Prepayment Calculator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-700">
                      <strong>Outstanding:</strong> ₹{financialData.outstandingLoan.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Calculate how prepayment reduces your loan tenure
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="prepayment">Prepayment Amount (₹)</Label>
                    <Input
                      id="prepayment"
                      type="number"
                      value={prepaymentAmount}
                      onChange={(e) => setPrepaymentAmount(e.target.value)}
                      placeholder="Enter amount to prepay"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Outstanding loan: ₹{financialData.outstandingLoan.toLocaleString()} • You can pay more than the EMI amount
                    </p>
                  </div>
                  <Button 
                    onClick={handlePrepayment}
                    disabled={!prepaymentAmount || parseFloat(prepaymentAmount) <= 0}
                    className="w-full"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Benefits
                  </Button>
                  
                  {/* Prepayment Results Card */}
                  {showPrepaymentResults && prepaymentResults && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-green-800">Prepayment Analysis</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowPrepaymentResults(false)}
                        >
                          ✕
                        </Button>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Prepayment Amount:</span>
                          <span className="font-medium">₹{prepaymentResults.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>New Outstanding:</span>
                          <span className="font-medium text-green-600">₹{prepaymentResults.newOutstanding.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tenure Reduction:</span>
                          <span className="font-medium text-blue-600">{prepaymentResults.tenureReduction} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Interest Savings:</span>
                          <span className="font-medium text-green-600">₹{prepaymentResults.interestSavings.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <Button 
                          onClick={processPrepayment}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Confirm & Pay ₹{prepaymentResults.amount.toLocaleString()}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowPrepaymentResults(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* EMI Tracking Tab */}
        <TabsContent value="emi" className="space-y-4">
          {vehicle.financingType === 'loan' && vehicle.loanDetails ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">EMI Payment Schedule</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    ₹{(vehicle.loanDetails.emiPerMonth || 0).toLocaleString()} per month • {vehicle.loanDetails.interestRate}% annual interest
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">
                    {vehicle.loanDetails.paidInstallments?.length || 0} of {vehicle.loanDetails.totalInstallments || 0} paid
                  </Badge>
                  <p className="text-sm text-gray-600">
                    Outstanding: ₹{financialData.outstandingLoan.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* EMI Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {vehicle.loanDetails.paidInstallments?.length || 0}
                    </div>
                    <div className="text-sm text-blue-700">EMIs Paid</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {financialData.daysUntilEMI >= 0 ? financialData.daysUntilEMI : 'Overdue'}
                    </div>
                    <div className="text-sm text-yellow-700">Days to Next EMI</div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      ₹{Math.round(financialData.outstandingLoan / 100000).toFixed(1)}L
                    </div>
                    <div className="text-sm text-red-700">Outstanding</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {((vehicle.loanDetails.paidInstallments?.length || 0) / (vehicle.loanDetails.totalInstallments || 1) * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-green-700">Completed</div>
                  </CardContent>
                </Card>
              </div>

              {/* EMI Schedule Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">EMI Payment Grid</h4>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-100 rounded"></div>
                      <span>Paid</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                      <span>Due Soon</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-100 rounded"></div>
                      <span>Overdue</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-100 rounded"></div>
                      <span>Future</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {(vehicle.loanDetails.amortizationSchedule || []).map((emi, index) => {
                    const dueDate = emi.dueDate ? new Date(emi.dueDate) : new Date();
                    const today = new Date();
                    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Check if payment can be made (3 days before due date OR overdue)
                    const threeDaysFromNow = new Date();
                    threeDaysFromNow.setDate(today.getDate() + 3);
                    const canPayNow = dueDate <= threeDaysFromNow || daysDiff < 0; // Allow if due soon OR overdue
                    
                    let bgColor = 'bg-gray-100 hover:bg-gray-200';
                    let textColor = 'text-gray-600';
                    let borderColor = 'border-gray-200';
                    let icon = <Clock className="h-4 w-4" />;
                    let status = 'Future';
                    
                    if (emi.isPaid) {
                      bgColor = 'bg-green-100 hover:bg-green-150';
                      textColor = 'text-green-700';
                      borderColor = 'border-green-200';
                      icon = <CheckCircle className="h-4 w-4" />;
                      status = 'Paid';
                      if (emi.paidAt) {
                        status = `Paid ${new Date(emi.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
                      }
                    } else if (daysDiff < 0) {
                      bgColor = 'bg-red-100 hover:bg-red-150';
                      textColor = 'text-red-700';
                      borderColor = 'border-red-300';
                      icon = <AlertCircle className="h-4 w-4" />;
                      status = `${Math.abs(daysDiff)} days overdue`;
                    } else if (daysDiff <= 7) {
                      bgColor = 'bg-yellow-100 hover:bg-yellow-150';
                      textColor = 'text-yellow-700';
                      borderColor = 'border-yellow-300';
                      icon = <AlertCircle className="h-4 w-4" />;
                      status = daysDiff === 0 ? 'Due Today' : `${daysDiff} days left`;
                    }
                    
                    return (
                      <Card 
                        key={index} 
                        className={`${bgColor} ${borderColor} border-2 transition-all duration-200 ${
                          !emi.isPaid && canPayNow ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                        }`}
                        onClick={() => !emi.isPaid && canPayNow && markEMIPaid(index, emi)}
                      >
                        <CardContent className="p-3 text-center space-y-2">
                          <div className={`${textColor} flex justify-center`}>
                            {icon}
                          </div>
                          <div className={`text-sm font-bold ${textColor}`}>
                            EMI {emi.month}
                          </div>
                          <div className={`text-xs ${textColor}`}>
                            {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </div>
                          <div className={`text-xs ${textColor} font-medium`}>
                            ₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}
                          </div>
                          <div className={`text-xs ${textColor}`}>
                            {status}
                          </div>
                          {!emi.isPaid && canPayNow && (
                            <Button 
                              size="sm" 
                              className="text-xs py-1 px-2 h-6 w-full mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                markEMIPaid(index, emi);
                              }}
                            >
                              Pay Now
                            </Button>
                          )}
                          {!emi.isPaid && !canPayNow && daysDiff > 3 && (
                            <div className="text-xs text-gray-400 mt-1">
                              Available in {daysDiff - 3} days
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-700 border-blue-300"
                    onClick={() => {
                      // Scroll to prepayment calculator in Financials tab
                      const financialsTab = document.querySelector('[value="financials"]') as HTMLElement;
                      if (financialsTab) {
                        financialsTab.click();
                        setTimeout(() => {
                          const prepaymentSection = document.querySelector('#prepayment');
                          if (prepaymentSection) {
                            prepaymentSection.scrollIntoView({ behavior: 'smooth' });
                            (prepaymentSection as HTMLInputElement).focus();
                          }
                        }, 100);
                      }
                    }}
                  >
                    <Calculator className="h-4 w-4 mr-1" />
                    Calculate Prepayment
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-700 border-blue-300"
                    onClick={() => {
                      toast({
                        title: 'Reminder Set',
                        description: `EMI payment reminders will be sent 3 days before each due date for ${vehicle.vehicleName || 'this vehicle'}.`,
                      });
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Set Payment Reminders
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-700 border-blue-300"
                    onClick={() => {
                      const paidCount = vehicle.loanDetails?.paidInstallments?.length || 0;
                      const totalCount = vehicle.loanDetails?.totalInstallments || 0;
                      const completionPercentage = totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(1) : '0';
                      
                      toast({
                        title: 'Payment History Summary',
                        description: `EMIs Paid: ${paidCount} of ${totalCount}\nCompletion: ${completionPercentage}%\nRemaining: ${totalCount - paidCount} installments\nOutstanding: ₹${financialData.outstandingLoan.toLocaleString()}`,
                      });
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    View Payment History
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  <strong>Note:</strong> EMI payments can be marked as paid starting 3 days before due date. Overdue payments can include penalty charges.
                </p>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Cash Purchase</h3>
                <p className="text-gray-500">This vehicle was purchased with cash payment - no EMI tracking required</p>
                <p className="text-sm text-gray-400 mt-2">You have full ownership without any loan obligations</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rent Collection Tab */}
        <TabsContent value="rent" className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Weekly Rent Collection</h3>
              <Badge variant="outline">
                Driver: {vehicle.assignedDriverId || 'Not Assigned'}
              </Badge>
            </div>
            
            {vehicle.assignedDriverId ? (
              <div>
                {/* Rent Collection Grid - Previous 36 weeks + Next 36 weeks */}
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {Array.from({ length: 72 }, (_, index) => {
                    const weekOffset = index - 36; // -36 to +35 (current week is 0)
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
                    
                    const isPastWeek = weekOffset < 0;
                    const isCurrentWeek = weekOffset === 0;
                    const isFutureWeek = weekOffset > 0;
                    const isUpcoming = weekOffset > 0 && weekOffset <= 5;
                    
                    let bgColor = 'bg-gray-100';
                    let textColor = 'text-gray-600';
                    let icon = <Clock className="h-4 w-4" />;
                    let status = '';
                    
                    if (isPastWeek) {
                      // Mock: assume most past weeks are collected
                      const isCollected = Math.random() > 0.1;
                      if (isCollected) {
                        bgColor = 'bg-green-100';
                        textColor = 'text-green-700';
                        icon = <CheckCircle className="h-4 w-4" />;
                        status = 'Collected';
                      } else {
                        bgColor = 'bg-red-100';
                        textColor = 'text-red-700';
                        icon = <AlertCircle className="h-4 w-4" />;
                        status = 'Missed';
                      }
                    } else if (isCurrentWeek) {
                      bgColor = 'bg-yellow-100';
                      textColor = 'text-yellow-700';
                      icon = <DollarSign className="h-4 w-4" />;
                      status = 'Due Now';
                    } else if (isUpcoming) {
                      bgColor = 'bg-blue-100';
                      textColor = 'text-blue-700';
                      icon = <Calendar className="h-4 w-4" />;
                      status = `${weekOffset} week${weekOffset > 1 ? 's' : ''}`;
                    }
                    
                    return (
                      <Card 
                        key={index} 
                        className={`${bgColor} cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => (isCurrentWeek || isPastWeek) && markRentCollected(index)}
                      >
                        <CardContent className="p-3 text-center">
                          <div className={`${textColor} mb-1`}>
                            {icon}
                          </div>
                          <div className={`text-sm font-medium ${textColor}`}>
                            Week {index + 1}
                          </div>
                          <div className={`text-xs ${textColor}`}>
                            {weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                          {status && (
                            <div className={`text-xs ${textColor} mt-1`}>
                              {status}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 mb-4">No driver assigned to this vehicle</p>
                  <Button>Assign Driver</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold">Vehicle Expenses</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Track fuel, maintenance, and other vehicle-related expenses
                </p>
              </div>
              <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {/* Expense Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-red-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    ₹{expenseData.totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-sm text-red-700">Total Expenses</div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{Math.round(expenseData.monthlyAverage).toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Monthly Average</div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {expenseData.recentExpenses.length}
                  </div>
                  <div className="text-sm text-yellow-700">Total Records</div>
                </CardContent>
              </Card>
              <Card className="bg-green-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {expenseData.expenseRatio.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Expense Ratio</div>
                </CardContent>
              </Card>
            </div>

            {/* Expense Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-blue-600" />
                    Fuel Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-medium">₹{Math.round(expenseData.fuelExpenses / 12).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="font-medium">₹{expenseData.fuelExpenses.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {expenseData.totalExpenses > 0 ? ((expenseData.fuelExpenses / expenseData.totalExpenses) * 100).toFixed(1) : '0'}% of total expenses
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-orange-600" />
                    Maintenance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-medium">₹{Math.round(expenseData.maintenanceExpenses / 12).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="font-medium">₹{expenseData.maintenanceExpenses.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {expenseData.totalExpenses > 0 ? ((expenseData.maintenanceExpenses / expenseData.totalExpenses) * 100).toFixed(1) : '0'}% of total expenses
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    Other Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Penalties</span>
                      <span className="font-medium">₹{expenseData.penaltyExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Other</span>
                      <span className="font-medium">₹{expenseData.otherExpenses.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Insurance, permits, etc.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Expenses Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseData.recentExpenses.length > 0 ? (
                    <div className="space-y-3">
                      {expenseData.recentExpenses.map((expense, index) => (
                        <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              expense.description.toLowerCase().includes('fuel') ? 'bg-blue-100' :
                              expense.type === 'maintenance' ? 'bg-orange-100' :
                              expense.description.toLowerCase().includes('penalty') ? 'bg-red-100' :
                              'bg-purple-100'
                            }`}>
                              {expense.description.toLowerCase().includes('fuel') ? (
                                <Fuel className="h-4 w-4 text-blue-600" />
                              ) : expense.type === 'maintenance' ? (
                                <Settings className="h-4 w-4 text-orange-600" />
                              ) : expense.description.toLowerCase().includes('penalty') ? (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <DollarSign className="h-4 w-4 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{expense.description}</div>
                              <div className="text-sm text-gray-500">{expense.type === 'maintenance' ? 'Maintenance' : 'General Expense'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-red-600">₹{expense.amount.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">{new Date(expense.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No expenses recorded yet</p>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Expense
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expense Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Monthly Trends</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Month</span>
                        <span className="font-medium">₹{Math.round(expenseData.monthlyAverage).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Average Monthly</span>
                        <span className="font-medium">₹{Math.round(expenseData.totalExpenses / 12).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Records</span>
                        <span className="font-medium">{expenseData.recentExpenses.length} transactions</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Expense vs Earnings</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Earnings</span>
                        <span className="font-medium text-green-600">₹{financialData.totalEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Expenses</span>
                        <span className="font-medium text-red-600">₹{expenseData.totalExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Expense Ratio</span>
                        <span className="font-medium">
                          {expenseData.expenseRatio.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="space-y-4">
            {/* Payment History Header and Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">Payment History</h3>
                <p className="text-sm text-muted-foreground">Track all payments and receipts for this vehicle</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select 
                  className="px-3 py-2 border rounded-md text-sm"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  <option value="all">All Transactions</option>
                  <option value="emi">EMI Payments</option>
                  <option value="prepayment">Prepayments</option>
                  <option value="rent">Rent Received</option>
                  <option value="expense">Expenses</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <input
                  type="month"
                  className="px-3 py-2 border rounded-md text-sm"
                  value={paymentDateFilter}
                  onChange={(e) => setPaymentDateFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Paid Out</p>
                      <p className="text-xl font-bold text-red-500">
                        ₹{(filteredPayments.filter(p => ['emi', 'prepayment', 'expense', 'maintenance'].includes(p.type))
                          .reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Received</p>
                      <p className="text-xl font-bold text-green-500">
                        ₹{(filteredPayments.filter(p => p.type === 'rent')
                          .reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">EMI Payments</p>
                      <p className="text-xl font-bold">
                        ₹{(filteredPayments.filter(p => p.type === 'emi')
                          .reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CircleDollarSign className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Prepayments</p>
                      <p className="text-xl font-bold text-purple-500">
                        ₹{(filteredPayments.filter(p => p.type === 'prepayment')
                          .reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment History Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Transaction History
                  <Badge variant="secondary" className="ml-auto">
                    {filteredPayments.length} transactions
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Description</th>
                        <th className="text-right p-2 font-medium">Amount</th>
                        <th className="text-left p-2 font-medium">Method</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length > 0 ? (
                        filteredPayments.map((payment, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              {new Date(payment.date).toLocaleDateString('en-IN')}
                            </td>
                            <td className="p-2">
                              <Badge 
                                variant={
                                  payment.type === 'rent' ? 'default' :
                                  payment.type === 'emi' ? 'secondary' :
                                  payment.type === 'prepayment' ? 'outline' :
                                  'destructive'
                                }
                              >
                                {payment.type.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-2 text-sm">
                              {payment.description || `${payment.type} payment`}
                            </td>
                            <td className={`p-2 text-right font-medium ${
                              payment.type === 'rent' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {payment.type === 'rent' ? '+' : '-'}₹{payment.amount.toLocaleString()}
                            </td>
                            <td className="p-2 text-sm">
                              {payment.paymentMethod || 'Bank Transfer'}
                            </td>
                            <td className="p-2">
                              <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                                {payment.status || 'completed'}
                              </Badge>
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {payment.reference || payment.transactionId || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <History className="h-8 w-8 opacity-50" />
                              <p>No payment history found</p>
                              <p className="text-sm">Transactions will appear here once recorded</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => setShowEmiForm(true)}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Record EMI Payment
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowRentForm(true)}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Record Rent Receipt
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowExpenseForm(true)}
                className="flex items-center gap-2"
              >
                <TrendingDown className="h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Performance - Dynamic Data */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Investment</span>
                    <span className="font-medium">₹{((vehicle.initialInvestment || 0) + financialData.totalExpenses).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Earnings</span>
                    <span className="font-medium text-green-600">₹{financialData.totalEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses</span>
                    <span className="font-medium text-red-600">₹{financialData.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Paid (Est.)</span>
                    <span className="font-medium text-red-600">
                      ₹{vehicle.loanDetails ? 
                        ((vehicle.loanDetails.paidInstallments?.length || 0) * 
                        (vehicle.loanDetails.emiPerMonth || 0) - 
                        ((vehicle.loanDetails.totalLoan || 0) - financialData.outstandingLoan)).toLocaleString() 
                        : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Principal Paid</span>
                    <span className="font-medium text-blue-600">
                      ₹{vehicle.loanDetails ? 
                        ((vehicle.loanDetails.totalLoan || 0) - financialData.outstandingLoan).toLocaleString() 
                        : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Profit</span>
                    <span className={`font-bold ${
                      (financialData.totalEarnings - financialData.totalExpenses - (vehicle.loanDetails?.paidInstallments?.length || 0) * (vehicle.loanDetails?.emiPerMonth || 0)) >= 0 
                      ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{(financialData.totalEarnings - financialData.totalExpenses - 
                        (vehicle.loanDetails?.paidInstallments?.length || 0) * (vehicle.loanDetails?.emiPerMonth || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projections - Dynamic Data */}
            <Card>
              <CardHeader>
                <CardTitle>Yearly Projections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Avg Monthly Rent</span>
                    <span className="font-medium">
                      ₹{financialData.isCurrentlyRented ? 
                        Math.round(financialData.monthlyRent).toLocaleString() : 
                        '0 (Not Rented)'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Monthly Profit</span>
                    <span className={`font-medium ${financialData.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{financialData.isCurrentlyRented ? 
                        Math.round(financialData.monthlyProfit).toLocaleString() : 
                        '0 (Not Rented)'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projected Yearly Profit</span>
                    <span className={`font-medium ${(financialData.monthlyProfit * 12) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{financialData.isCurrentlyRented ? 
                        (Math.round(financialData.monthlyProfit) * 12).toLocaleString() : 
                        '0 (Not Rented)'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ROI (Current)</span>
                    <span className={`font-medium ${financialData.currentROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {financialData.currentROI.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Break-even Status</span>
                    <Badge variant={financialData.currentROI >= 0 ? "default" : "destructive"}>
                      {financialData.currentROI >= 0 ? "Profitable" : "Loss Making"}
                    </Badge>
                  </div>
                </div>
                
                {!financialData.isCurrentlyRented && (
                  <div className="bg-yellow-50 p-3 rounded-lg mt-4">
                    <p className="text-sm text-yellow-700">
                      <strong>Note:</strong> Vehicle is not currently rented. Projections will be accurate once assigned to a driver.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Penalty Payment Dialog */}
      <Dialog open={penaltyDialogOpen} onOpenChange={setPenaltyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>EMI Payment - Penalty Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEMI && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>EMI Details:</strong><br />
                  Month: {selectedEMI.monthIndex + 1}<br />
                  Due Date: {new Date(selectedEMI.scheduleItem.dueDate).toLocaleDateString()}<br />
                  Days Overdue: {Math.ceil((new Date().getTime() - new Date(selectedEMI.scheduleItem.dueDate).getTime()) / (1000 * 60 * 60 * 24))}<br />
                  EMI Amount: ₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="penalty">Penalty Amount (₹)</Label>
              <Input
                id="penalty"
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                placeholder="Enter penalty amount (0 if no penalty)"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter 0 if no penalty was charged for this late payment.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPenaltyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                const penalty = parseFloat(penaltyAmount || '0');
                if (selectedEMI) {
                  processEMIPayment(selectedEMI.monthIndex, selectedEMI.scheduleItem, penalty);
                }
              }}>
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expenseType">Expense Type</Label>
              <Select value={newExpense.type} onValueChange={(value) => setNewExpense(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="general">Insurance/Penalties</SelectItem>
                  <SelectItem value="general">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expenseAmount">Amount (₹)</Label>
              <Input
                id="expenseAmount"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter expense amount"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="expenseDescription">Description</Label>
              <Input
                id="expenseDescription"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the expense"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddExpenseDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddExpense}>
                Add Expense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EMI Payment Modal */}
      <Dialog open={showEmiForm} onOpenChange={setShowEmiForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record EMI Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emi-date">Payment Date</Label>
              <Input
                id="emi-date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emi-amount">EMI Amount</Label>
              <Input
                id="emi-amount"
                type="number"
                placeholder="Enter EMI amount"
                defaultValue={vehicle.loanDetails?.emiPerMonth?.toString() || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emi-method">Payment Method</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emi-reference">Transaction Reference</Label>
              <Input
                id="emi-reference"
                placeholder="Enter transaction ID or reference"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEmiForm(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "EMI Payment Recorded",
                  description: "EMI payment has been successfully recorded.",
                });
                setShowEmiForm(false);
              }}>
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rent Receipt Modal */}
      <Dialog open={showRentForm} onOpenChange={setShowRentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Rent Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rent-date">Receipt Date</Label>
              <Input
                id="rent-date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-amount">Rent Amount</Label>
              <Input
                id="rent-amount"
                type="number"
                placeholder="Enter rent amount received"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-driver">Driver Name</Label>
              <Input
                id="rent-driver"
                placeholder="Enter driver name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-period">Rent Period</Label>
              <Input
                id="rent-period"
                placeholder="e.g., January 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-method">Payment Method</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRentForm(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Rent Receipt Recorded",
                  description: "Rent receipt has been successfully recorded.",
                });
                setShowRentForm(false);
              }}>
                Record Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Modal */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-date">Expense Date</Label>
              <Input
                id="expense-date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <Input
                id="expense-amount"
                type="number"
                placeholder="Enter expense amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-type">Expense Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="penalty">Penalty/Fine</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                placeholder="Enter expense description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-method">Payment Method</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowExpenseForm(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Expense Recorded",
                  description: "Expense has been successfully recorded.",
                });
                setShowExpenseForm(false);
              }}>
                Record Expense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleDetails;