import React, { useState, useEffect } from 'react';
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

const AssignmentDetails: React.FC = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, drivers, loading } = useFirebaseData();
  const { assignments, updateAssignment } = useAssignments();
  const [showRentForm, setShowRentForm] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

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
  );
};

export default AssignmentDetails;