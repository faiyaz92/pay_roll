import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, User, Phone, MapPin, Calendar, CreditCard, 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, 
  Clock, Truck, FileText, Star, DollarSign, Target
} from 'lucide-react';
import { useFirebaseData, Driver } from '@/hooks/useFirebaseData';

const DriverDetails: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { drivers, vehicles, assignments, payments } = useFirebaseData();
  
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverAssignments, setDriverAssignments] = useState<any[]>([]);
  const [driverPayments, setDriverPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'analytics');
  const [analytics, setAnalytics] = useState({
    creditScore: 0,
    totalPaid: 0,
    totalDue: 0,
    onTimePayments: 0,
    latePayments: 0,
    averagePaymentDelay: 0,
    nextDueDate: '',
    nextDueAmount: 0,
    nextDueVehicleName: '',
    totalEngagementDays: 0,
    currentVehicleCount: 0
  });

  // Helper function to get vehicle name
  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.vehicleName || vehicle.make + ' ' + vehicle.model} (${vehicle.registrationNumber})` : vehicleId;
  };

  useEffect(() => {
    if (!driverId || !drivers.length) return;

    // Find the driver
    const foundDriver = drivers.find(d => d.id === driverId);
    if (!foundDriver) {
      navigate('/drivers');
      return;
    }
    setDriver(foundDriver);

    // Get driver's assignments
    const driverAssns = assignments.filter(a => a.driverId === driverId);
    setDriverAssignments(driverAssns);

    // Get driver's payments - payments are linked through assignments
    const driverAssignmentIds = driverAssns.map(a => a.id);
    const driverPmts = payments.filter(p => 
      p.driverId === driverId || driverAssignmentIds.includes(p.assignmentId)
    );
    setDriverPayments(driverPmts);

    // Calculate analytics
    calculateDriverAnalytics(foundDriver, driverAssns, driverPmts);
  }, [driverId, drivers, assignments, payments, navigate]);

  const calculateDriverAnalytics = (driver: Driver, assns: any[], pmts: any[]) => {
    const now = new Date();
    
    // Payment analytics - only count paid payments
    const paidPayments = pmts.filter(p => p.status === 'paid');
    const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const onTimePayments = paidPayments.filter(p => {
      if (!p.nextDueDate || !p.paidAt) return false;
      return new Date(p.paidAt) <= new Date(p.nextDueDate);
    }).length;
    const latePayments = paidPayments.length - onTimePayments;
    
    // Calculate average delay for late payments
    const delays = paidPayments
      .filter(p => p.nextDueDate && p.paidAt && new Date(p.paidAt) > new Date(p.nextDueDate))
      .map(p => Math.ceil((new Date(p.paidAt).getTime() - new Date(p.nextDueDate).getTime()) / (1000 * 60 * 60 * 24)));
    const averagePaymentDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;

    // Credit score calculation (0-1000)
    let creditScore = 700; // Base score
    if (paidPayments.length > 0) {
      const onTimeRatio = onTimePayments / paidPayments.length;
      creditScore += (onTimeRatio * 200) - 100; // -100 to +100 based on on-time ratio
      creditScore -= Math.min(averagePaymentDelay * 2, 100); // Penalty for delays
      creditScore = Math.max(300, Math.min(900, creditScore)); // Clamp between 300-900
    }

    // Engagement analytics
    const totalEngagementDays = assns.reduce((total, assn) => {
      const start = new Date(assn.startDate);
      const end = assn.endDate ? new Date(assn.endDate) : now;
      return total + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);

    // Current assignments
    const activeAssignments = assns.filter(a => !a.endDate);
    const currentVehicleCount = activeAssignments.length;

    // Calculate total due - sum of all due payments
    const duePayments = pmts.filter(p => p.status === 'due' || p.status === 'overdue');
    const totalDue = duePayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
    
    // Next due date and amount - get earliest due date across all assignments
    const nextDuePayment = duePayments
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())[0];
    const nextDueDate = nextDuePayment?.nextDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const nextDueAmount = nextDuePayment?.amountDue || 0;
    
    // Get vehicle name for next due payment
    let nextDueVehicleName = '';
    if (nextDuePayment) {
      const vehicle = vehicles.find(v => v.id === nextDuePayment.vehicleId);
      nextDueVehicleName = vehicle ? `${vehicle.vehicleName || vehicle.make + ' ' + vehicle.model} (${vehicle.registrationNumber})` : 'Unknown Vehicle';
    }

    setAnalytics({
      creditScore: Math.round(creditScore),
      totalPaid,
      totalDue,
      onTimePayments,
      latePayments,
      averagePaymentDelay: Math.round(averagePaymentDelay),
      nextDueDate: nextDueDate,
      nextDueAmount: nextDueAmount,
      nextDueVehicleName: nextDueVehicleName,
      totalEngagementDays,
      currentVehicleCount
    });
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCreditScoreBadge = (score: number) => {
    if (score >= 750) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 650) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  if (!driver) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Driver not found</h3>
          <Button onClick={() => navigate('/drivers')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Drivers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button onClick={() => navigate('/drivers')} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{driver.name}</h1>
            <p className="text-gray-600">Driver Details & Analytics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={driver.isActive ? "default" : "secondary"}>
            {driver.isActive ? "Active" : "Inactive"}
          </Badge>
          {analytics.currentVehicleCount > 0 && (
            <Badge className="bg-blue-100 text-blue-800">
              {analytics.currentVehicleCount} Vehicle{analytics.currentVehicleCount > 1 ? 's' : ''} Assigned
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Credit Score</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${getCreditScoreColor(analytics.creditScore)}`}>
                {analytics.creditScore}
              </div>
              {getCreditScoreBadge(analytics.creditScore)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{analytics.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {driverPayments.length} payment{driverPayments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{analytics.totalDue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Next: ₹{analytics.nextDueAmount.toLocaleString()} on {new Date(analytics.nextDueDate).toLocaleDateString()}
              {analytics.nextDueVehicleName && (
                <><br />Vehicle: {analytics.nextDueVehicleName}</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Truck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEngagementDays}</div>
            <p className="text-xs text-muted-foreground">
              Days with us • {analytics.currentVehicleCount} active vehicles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Driver Profile and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver Information */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Driver Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {driver.documents?.photo?.url || driver.photoUrl ? (
                  <img
                    src={driver.documents?.photo?.url || driver.photoUrl}
                    alt={driver.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-600" />
                )}
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{driver.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium">{driver.phone}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-500">License:</span>
                <span className="font-medium">{driver.licenseNumber}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-500">Join Date:</span>
                <span className="font-medium">{new Date(driver.joinDate).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-gray-500">Address:</span>
                <span className="font-medium text-left sm:text-right">{driver.address}</span>
              </div>
            </div>

            {/* Document Status */}
            {driver.documents && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Badge variant={driver.documents.drivingLicense ? "default" : "secondary"} className="text-xs">
                    License {driver.documents.drivingLicense ? '✓' : '✗'}
                  </Badge>
                  <Badge variant={driver.documents.idCard ? "default" : "secondary"} className="text-xs">
                    ID Card {driver.documents.idCard ? '✓' : '✗'}
                  </Badge>
                  <Badge variant={driver.documents.photo ? "default" : "secondary"} className="text-xs">
                    Photo {driver.documents.photo ? '✓' : '✗'}
                  </Badge>
                  {driver.documents.additional?.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{driver.documents.additional.length} More
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics and Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="w-full overflow-hidden">
              <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto w-full min-w-0">
                <TabsTrigger value="analytics" className="whitespace-nowrap flex-shrink-0">Analytics</TabsTrigger>
                <TabsTrigger value="assignments" className="whitespace-nowrap flex-shrink-0">Assignments</TabsTrigger>
                <TabsTrigger value="payments" className="whitespace-nowrap flex-shrink-0">Payments</TabsTrigger>
                <TabsTrigger value="documents" className="whitespace-nowrap flex-shrink-0">Documents</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics.onTimePayments}</div>
                      <p className="text-sm text-gray-500">On-Time Payments</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{analytics.latePayments}</div>
                      <p className="text-sm text-gray-500">Late Payments</p>
                    </div>
                  </div>
                  {analytics.averagePaymentDelay > 0 && (
                    <div className="mt-4 text-center">
                      <div className="text-lg font-medium text-orange-600">{analytics.averagePaymentDelay} days</div>
                      <p className="text-sm text-gray-500">Average Payment Delay</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Credit Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span>Payment History</span>
                      <div className="flex items-center space-x-2">
                        {analytics.onTimePayments >= analytics.latePayments ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          {driverPayments.length > 0 ? Math.round((analytics.onTimePayments / driverPayments.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span>Average Delay</span>
                      <div className="flex items-center space-x-2">
                        {analytics.averagePaymentDelay <= 3 ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-orange-600" />
                        )}
                        <span className="font-medium">{analytics.averagePaymentDelay} days</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span>Engagement Length</span>
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{analytics.totalEngagementDays} days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {driverAssignments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No vehicle assignments found</p>
                  ) : (
                    <div className="space-y-3">
                      {driverAssignments.map((assignment, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg gap-3">
                          <div>
                            <p className="font-medium">{getVehicleName(assignment.vehicleId)}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(assignment.startDate).toLocaleDateString()} - 
                              {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : 'Ongoing'}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-bold">₹{assignment.weeklyRent?.toLocaleString() || 'N/A'}</p>
                            <p className="text-sm text-gray-500">per week</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {driverPayments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No payment records found</p>
                  ) : (
                    <div className="space-y-3">
                      {driverPayments.slice(0, 10).map((payment, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg gap-3">
                          <div>
                            <p className="font-medium">₹{payment.amountPaid?.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">
                              {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Pending'}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <Badge 
                              variant={payment.status === 'paid' ? 'default' : 'secondary'}
                            >
                              {payment.status || 'Pending'}
                            </Badge>
                            {payment.nextDueDate && payment.paidAt && (
                              <p className="text-xs text-gray-500">
                                {new Date(payment.paidAt) <= new Date(payment.nextDueDate) ? 'On Time' : 'Late'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {driverPayments.length > 10 && (
                        <p className="text-center text-gray-500 text-sm">
                          Showing latest 10 of {driverPayments.length} payments
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {driver.documents?.drivingLicense && (
                      <div className="border rounded-lg p-4 text-center">
                        <h4 className="font-medium mb-2">Driving License</h4>
                        <img 
                          src={driver.documents.drivingLicense.url} 
                          alt="Driving License" 
                          className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80"
                          onClick={() => window.open(driver.documents.drivingLicense.url, '_blank')}
                        />
                      </div>
                    )}
                    {driver.documents?.idCard && (
                      <div className="border rounded-lg p-4 text-center">
                        <h4 className="font-medium mb-2">ID Card</h4>
                        <img 
                          src={driver.documents.idCard.url} 
                          alt="ID Card" 
                          className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80"
                          onClick={() => window.open(driver.documents.idCard.url, '_blank')}
                        />
                      </div>
                    )}
                    {driver.documents?.photo && (
                      <div className="border rounded-lg p-4 text-center">
                        <h4 className="font-medium mb-2">Driver Photo</h4>
                        <img 
                          src={driver.documents.photo.url} 
                          alt="Driver Photo" 
                          className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80"
                          onClick={() => window.open(driver.documents.photo.url, '_blank')}
                        />
                      </div>
                    )}
                    {driver.documents?.additional?.map((doc, index) => (
                      <div key={index} className="border rounded-lg p-4 text-center">
                        <h4 className="font-medium mb-2">{doc.name}</h4>
                        <img 
                          src={doc.url} 
                          alt={doc.name} 
                          className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80"
                          onClick={() => window.open(doc.url, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                  {!driver.documents?.drivingLicense && !driver.documents?.idCard && !driver.documents?.photo && (
                    <p className="text-center text-gray-500 py-8">No documents uploaded</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DriverDetails;