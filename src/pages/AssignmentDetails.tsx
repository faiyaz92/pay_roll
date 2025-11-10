import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseData, useAssignments } from '@/hooks/useFirebaseData';
import { Assignment } from '@/types/user';
import { 
  Car, 
  User,
  CreditCard, 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Calculator,
  Settings,
  Plus,
  History,
  Camera,
  Eye,
  FileText,
  ImageIcon,
  ArrowLeft
} from 'lucide-react';
import { SectionNumberBadge } from '@/components/VehicleDetails/SectionNumberBadge';
import { collection, addDoc, doc, setDoc, increment } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

const AssignmentDetails: React.FC = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, drivers, loading } = useFirebaseData();
  const { userInfo } = useAuth();
  const { assignments, updateAssignment } = useAssignments();
  const [showRentForm, setShowRentForm] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // Period selection for financial actions
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedQuarter, setSelectedQuarter] = useState('1');

  // GST payment confirmation dialog
  const [confirmGstPaymentDialog, setConfirmGstPaymentDialog] = useState(false);
  const [selectedMonthData, setSelectedMonthData] = useState<any>(null);

  // Find assignment from the assignments array
  const assignment = assignments.find(a => a.id === assignmentId);
  const vehicle = assignment ? vehicles.find(v => v.id === assignment.vehicleId) : null;
  const driver = assignment ? drivers.find(d => d.id === assignment.driverId) : null;

  // Generate weekly rent schedule
  const generateWeeklySchedule = () => {
    if (!assignment) return [];
    
    const startDate = new Date(assignment.startDate);
    const endDate = assignment.endDate ? new Date(assignment.endDate) : new Date();
    const schedule = [];
    
    // Start from the first collection day
    const firstCollectionDate = new Date(startDate);
    const daysToAdd = (assignment.collectionDay - startDate.getDay() + 7) % 7;
    firstCollectionDate.setDate(startDate.getDate() + daysToAdd);
    
    let currentDate = new Date(firstCollectionDate);
    let weekNumber = 1;
    
    while (currentDate <= endDate) {
      const isPaid = Math.random() > 0.3; // Mock paid status - replace with real data
      const isOverdue = currentDate < new Date() && !isPaid;
      
      schedule.push({
        weekNumber,
        dueDate: new Date(currentDate),
        amount: assignment.weeklyRent,
        isPaid,
        isOverdue,
        paidAt: isPaid ? new Date(currentDate.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000) : null
      });
      
      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;
    }
    
    return schedule;
  };

  const weeklySchedule = generateWeeklySchedule();
  
  const calculateProjectedEarnings = () => {
    if (!assignment) return { totalPaid: 0, totalDue: 0, projected: 0 };
    
    const totalPaid = weeklySchedule.filter(w => w.isPaid).reduce((sum, w) => sum + w.amount, 0);
    const totalDue = weeklySchedule.filter(w => !w.isPaid && w.dueDate <= new Date()).reduce((sum, w) => sum + w.amount, 0);
    
    // Project earnings for full year
    const weeksInYear = 52;
    const weeksSoFar = weeklySchedule.length;
    const averageWeeklyRent = assignment.weeklyRent;
    const projected = averageWeeklyRent * weeksInYear;
    
    return { totalPaid, totalDue, projected };
  };

  const earnings = calculateProjectedEarnings();

  // Calculate monthly accounting data for GST payments
  const monthlyData = useMemo(() => {
    if (!assignment) return [];

    const year = parseInt(selectedYear);
    let monthsToShow: number[] = [];

    if (selectedPeriod === 'month') {
      const month = parseInt(selectedMonth) - 1;
      monthsToShow = [month];
    } else if (selectedPeriod === 'quarter') {
      const quarter = parseInt(selectedQuarter);
      const startMonth = (quarter - 1) * 3;
      monthsToShow = [startMonth, startMonth + 1, startMonth + 2];
    } else if (selectedPeriod === 'year') {
      monthsToShow = Array.from({ length: 12 }, (_, i) => i);
    }

    return monthsToShow.map(month => {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

      // Calculate earnings for this month based on assignment payments
      const monthEarnings = weeklySchedule
        .filter(w => w.isPaid && w.dueDate >= monthStart && w.dueDate <= monthEnd)
        .reduce((sum, w) => sum + w.amount, 0);

      // For assignments, expenses would be minimal (maybe some admin costs)
      // For now, we'll use a simple calculation
      const monthExpenses = Math.floor(monthEarnings * 0.05); // 5% admin costs
      const profit = monthEarnings - monthExpenses;

      // GST calculation (4% - only if profit is positive)
      const gstAmount = profit > 0 ? profit * 0.04 : 0;

      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

      return {
        month,
        monthName: new Date(year, month).toLocaleString('default', { month: 'long' }),
        year,
        earnings: monthEarnings,
        expenses: monthExpenses,
        profit,
        gstAmount,
        monthStr
      };
    });
  }, [assignment, selectedPeriod, selectedYear, selectedMonth, selectedQuarter, weeklySchedule]);

  // Handle GST payment
  const handleGstPayment = async (monthData: any) => {
    try {
      if (!userInfo?.companyId) {
        toast({
          title: 'Error',
          description: 'Company information not found.',
          variant: 'destructive'
        });
        return;
      }

      const transactionRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
      await addDoc(transactionRef, {
        assignmentId: assignment?.id,
        type: 'gst_payment',
        amount: monthData.gstAmount,
        month: monthData.monthStr,
        description: `GST Payment for ${monthData.monthName} ${monthData.year} - Assignment ${assignment?.id}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      toast({
        title: 'GST Paid Successfully',
        description: `₹${monthData.gstAmount.toLocaleString()} GST payment recorded for ${monthData.monthName} ${monthData.year}`,
      });
    } catch (error) {
      console.error('Error recording GST payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record GST payment',
        variant: 'destructive'
      });
    }
  };

  // Get months/quarters for selected period
  const periodOptions = useMemo(() => {
    const year = parseInt(selectedYear);
    if (selectedPeriod === 'month') {
      return Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: new Date(year, i).toLocaleString('default', { month: 'long' })
      }));
    } else if (selectedPeriod === 'quarter') {
      return [
        { value: '1', label: 'Q1 (Jan-Mar)' },
        { value: '2', label: 'Q2 (Apr-Jun)' },
        { value: '3', label: 'Q3 (Jul-Sep)' },
        { value: '4', label: 'Q4 (Oct-Dec)' }
      ];
    }
    return [];
  }, [selectedPeriod, selectedYear]);

  const markRentPaid = async (weekNumber: number) => {
    // Update the rent payment status
    toast({
      title: 'Rent Marked as Paid',
      description: `Weekly rent for week ${weekNumber} has been recorded.`,
    });
    
    // Here you would update the payment record in Firestore
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!assignment) {
    return <div className="flex justify-center items-center h-64">Assignment not found</div>;
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-500', text: 'Active' },
      ended: { color: 'bg-gray-500', text: 'Ended' },
      idle: { color: 'bg-yellow-500', text: 'Idle' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <SectionNumberBadge id="1" label="Assignment Header" className="mb-1" />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/assignments')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assignment Details</h1>
              <p className="text-gray-600 mt-1">
                {vehicle?.vehicleName || `${vehicle?.make} ${vehicle?.model}`} - {driver?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(assignment.status)}
            <Button variant="outline" onClick={() => navigate(`/assignments/${assignmentId}/edit`)}>
              Edit Assignment
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <SectionNumberBadge id="2" label="Assignment Summary" className="mb-1" />
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{earnings.totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">₹{earnings.totalDue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projected/Year</p>
                <p className="text-2xl font-bold text-blue-600">₹{earnings.projected.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.ceil((new Date().getTime() - new Date(assignment.startDate).getTime()) / (1000 * 60 * 60 * 24))} Days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      <div className="space-y-2">
        <SectionNumberBadge id="3" label="Assignment Detail Tabs" className="mb-1" />
        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rent">Rent Schedule</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Agreement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Start Date</Label>
                    <p className="font-medium">{new Date(assignment.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">End Date</Label>
                    <p className="font-medium">
                      {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : 'Ongoing'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Daily Rent</Label>
                    <p className="font-medium">₹{assignment.dailyRent.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Weekly Rent</Label>
                    <p className="font-medium">₹{assignment.weeklyRent.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Collection Day</Label>
                    <p className="font-medium">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][assignment.collectionDay]}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Initial Odometer</Label>
                    <p className="font-medium">{assignment.initialOdometer?.toLocaleString() || 'N/A'} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle & Driver Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle:</span>
                      <span className="font-medium">
                        {vehicle?.vehicleName || `${vehicle?.make} ${vehicle?.model}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registration:</span>
                      <span className="font-medium">{vehicle?.registrationNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">{vehicle?.year}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => navigate(`/vehicles/${assignment.vehicleId}`)}
                    >
                      View Vehicle Details
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Driver Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{driver?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{driver?.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">License:</span>
                      <span className="font-medium">{driver?.licenseNumber}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => navigate(`/drivers/${assignment.driverId}`)}
                    >
                      View Driver Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Rent Schedule Tab */}
        <TabsContent value="rent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Rent Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklySchedule.map((week) => (
                  <div 
                    key={week.weekNumber} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      week.isPaid 
                        ? 'bg-green-50 border-green-200' 
                        : week.isOverdue 
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        week.isPaid 
                          ? 'bg-green-500 text-white' 
                          : week.isOverdue 
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-300 text-gray-700'
                      }`}>
                        {week.isPaid ? <CheckCircle className="w-4 h-4" /> : week.weekNumber}
                      </div>
                      <div>
                        <div className="font-medium">
                          Week {week.weekNumber} - {week.dueDate.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Amount: ₹{week.amount.toLocaleString()}
                          {week.isPaid && week.paidAt && (
                            <span className="ml-2 text-green-600">
                              • Paid on {week.paidAt.toLocaleDateString()}
                            </span>
                          )}
                          {week.isOverdue && (
                            <span className="ml-2 text-red-600">
                              • Overdue by {Math.ceil((new Date().getTime() - week.dueDate.getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!week.isPaid && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markRentPaid(week.weekNumber)}
                        >
                          Mark Paid
                        </Button>
                      )}
                      {week.isPaid && (
                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agreement Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Agreement Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Agreement Document 1</p>
                    <Button variant="outline" size="sm" className="mt-2">Upload Document</Button>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Agreement Document 2</p>
                    <Button variant="outline" size="sm" className="mt-2">Upload Document</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Vehicle Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {['Front', 'Back', 'Interior', 'Documents'].map((type) => (
                    <div key={type} className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{type}</Label>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 aspect-square bg-gray-50">
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-xs">No image</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Collection Rate</span>
                    <span className="font-bold text-green-600">
                      {((weeklySchedule.filter(w => w.isPaid).length / weeklySchedule.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Weekly Collection</span>
                    <span className="font-bold">₹{assignment.weeklyRent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monthly Projection</span>
                    <span className="font-bold text-blue-600">
                      ₹{((assignment.weeklyRent * 52) / 12).toFixed(0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Yearly Projection</span>
                    <span className="font-bold text-purple-600">
                      ₹{(assignment.weeklyRent * 52).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Payment Compliance</span>
                      <span>{((weeklySchedule.filter(w => w.isPaid).length / weeklySchedule.length) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(weeklySchedule.filter(w => w.isPaid).length / weeklySchedule.length) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Assignment Progress</span>
                      <span>{Math.min(100, (weeklySchedule.length / 52) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(100, (weeklySchedule.length / 52) * 100)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Assignment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="font-medium">Assignment Created</div>
                  <div className="text-sm text-gray-600">
                    {new Date(assignment.startDate).toLocaleDateString()} - Agreement started with {driver?.name}
                  </div>
                </div>
                {/* Add more history items as needed */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Quick Financial Actions */}
      <div className="space-y-2">
        <SectionNumberBadge id="4" label="Quick Financial Actions" className="mb-1" />
        <Card>
          <CardHeader>
            <CardTitle>Quick Financial Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Period Selection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="period">Period</Label>
                <select
                  id="period"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                  <option value="year">Year</option>
                </select>
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              {selectedPeriod === 'month' && (
                <div>
                  <Label htmlFor="month">Month</Label>
                  <select
                    id="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {periodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedPeriod === 'quarter' && (
                <div>
                  <Label htmlFor="quarter">Quarter</Label>
                  <select
                    id="quarter"
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {periodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() => {
                  const totalGst = monthlyData.reduce((sum, m) => sum + m.gstAmount, 0);
                  if (totalGst <= 0) {
                    toast({
                      title: 'No GST Due',
                      description: 'There is no GST due for the selected period.',
                      variant: 'destructive'
                    });
                    return;
                  }
                  setSelectedMonthData({
                    gstAmount: totalGst,
                    periodStr: selectedPeriod === 'year'
                      ? selectedYear
                      : selectedPeriod === 'quarter'
                      ? `${selectedYear}-Q${selectedQuarter}`
                      : `${selectedYear}-${selectedMonth.padStart(2, '0')}`,
                    monthName: selectedPeriod === 'year'
                      ? selectedYear
                      : selectedPeriod === 'quarter'
                      ? `Q${selectedQuarter} ${selectedYear}`
                      : `${new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`,
                    isCumulative: true
                  });
                  setConfirmGstPaymentDialog(true);
                }}
                disabled={monthlyData.reduce((sum, m) => sum + m.gstAmount, 0) === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Pay GST ({monthlyData.reduce((sum, m) => sum + m.gstAmount, 0).toLocaleString()})
              </Button>
              <Button
                onClick={() => markRentPaid(weeklySchedule.filter(w => !w.isPaid).length > 0 ? weeklySchedule.filter(w => !w.isPaid)[0].weekNumber : 1)}
                disabled={weeklySchedule.filter(w => !w.isPaid).length === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Collect Rent (₹{earnings.totalDue.toLocaleString()})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Accounting Cards */}
      <div className="space-y-2">
        <SectionNumberBadge id="5" label="Monthly Accounting" className="mb-1" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthlyData.map((monthData, index) => (
            <Card key={monthData.month} className="flex flex-col">
              <CardHeader>
                <SectionNumberBadge
                  id={`5.${index + 1}`}
                  label={`${monthData.monthName} ${monthData.year}`}
                  className="mb-2"
                />
                <CardTitle className="flex items-center justify-between">
                  <span>{monthData.monthName} {monthData.year}</span>
                  <Badge variant={monthData.profit >= 0 ? "default" : "destructive"}>
                    {monthData.profit >= 0 ? 'Profit' : 'Loss'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                {/* Earnings */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <TrendingUp className="h-4 w-4" />
                    Earnings
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    ₹{monthData.earnings.toLocaleString()}
                  </div>
                </div>

                {/* Expenses */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                    <Calculator className="h-4 w-4" />
                    Expenses
                  </div>
                  <div className="text-lg font-semibold text-red-600">
                    ₹{monthData.expenses.toLocaleString()}
                  </div>
                </div>

                {/* Profit */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <DollarSign className="h-4 w-4" />
                    Profit
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    ₹{monthData.profit.toLocaleString()}
                  </div>
                </div>

                {/* GST Amount */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                    <CreditCard className="h-4 w-4" />
                    GST (4%)
                  </div>
                  <div className="text-lg font-semibold text-purple-600">
                    ₹{monthData.gstAmount.toLocaleString()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-auto">
                  <Button
                    onClick={() => {
                      setSelectedMonthData(monthData);
                      setConfirmGstPaymentDialog(true);
                    }}
                    disabled={monthData.gstAmount === 0}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Pay GST (₹{monthData.gstAmount.toLocaleString()})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* GST Payment Confirmation Dialog */}
      <Dialog open={confirmGstPaymentDialog} onOpenChange={setConfirmGstPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm GST Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">GST Amount:</span>
                <span className="text-lg font-bold text-purple-600">
                  ₹{selectedMonthData?.gstAmount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Period:</span>
                <span className="text-sm text-gray-600">
                  {selectedMonthData?.monthName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Assignment:</span>
                <span className="text-sm text-gray-600">
                  {assignment?.id}
                </span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmGstPaymentDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (selectedMonthData) {
                    await handleGstPayment(selectedMonthData);
                    setConfirmGstPaymentDialog(false);
                    setSelectedMonthData(null);
                  }
                }}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentDetails;