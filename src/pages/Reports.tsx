import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Car,
  Users,
  Fuel,
  Wrench,
  Shield,
  PieChart,
  LineChart,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [reportType, setReportType] = useState('summary');

  const {
    vehicles,
    drivers,
    assignments,
    payments,
    expenses,
    vehiclesWithFinancials,
    loading
  } = useFirebaseData();

  const { userInfo } = useAuth();

  // Filter data based on user role (partners see only their vehicles' data)
  const filteredDataSources = useMemo(() => {
    // Filter vehicles based on user role
    const userVehicles = vehicles.filter(vehicle => {
      if (userInfo?.role === 'partner') {
        return vehicle.partnerId && vehicle.partnerId === userInfo.userId;
      }
      return true; // Company admin sees all vehicles
    });

    // Filter other data sources to only include data for user's vehicles
    const userPayments = userInfo?.role === 'partner'
      ? payments.filter(payment => userVehicles.some(vehicle => vehicle.id === payment.vehicleId))
      : payments;

    const userExpenses = userInfo?.role === 'partner'
      ? expenses.filter(expense => userVehicles.some(vehicle => vehicle.id === expense.vehicleId))
      : expenses;

    const userAssignments = userInfo?.role === 'partner'
      ? assignments.filter(assignment => userVehicles.some(vehicle => vehicle.id === assignment.vehicleId))
      : assignments;

    return {
      vehicles: userVehicles,
      payments: userPayments,
      expenses: userExpenses,
      assignments: userAssignments,
      drivers // Drivers are not filtered by vehicle ownership
    };
  }, [vehicles, payments, expenses, assignments, userInfo]);

  // Filter drivers for dropdown based on assignments with user's vehicles
  const availableDrivers = useMemo(() => {
    if (userInfo?.role === 'partner') {
      return drivers.filter(driver => 
        filteredDataSources.assignments.some(assignment => assignment.driverId === driver.id)
      );
    }
    return drivers;
  }, [drivers, filteredDataSources.assignments, userInfo?.role]);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const days = parseInt(dateRange);
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return { startDate, endDate: now };
  };

  // Filter data by date range and selections
  const filteredData = useMemo(() => {
    const { startDate, endDate } = getDateRange();

    const filteredPayments = filteredDataSources.payments.filter(p => {
      const paymentDate = new Date(p.paidAt || p.collectionDate || p.createdAt);
      const vehicleMatch = selectedVehicle === 'all' || p.vehicleId === selectedVehicle;
      return paymentDate >= startDate && paymentDate <= endDate && vehicleMatch;
    });

    const filteredExpenses = filteredDataSources.expenses.filter(e => {
      const expenseDate = new Date(e.createdAt);
      const vehicleMatch = selectedVehicle === 'all' || e.vehicleId === selectedVehicle;
      return expenseDate >= startDate && expenseDate <= endDate && vehicleMatch;
    });

    const filteredAssignments = filteredDataSources.assignments.filter(a => {
      const assignmentDate = new Date(a.startDate);
      const vehicleMatch = selectedVehicle === 'all' || a.vehicleId === selectedVehicle;
      const driverMatch = selectedDriver === 'all' || a.driverId === selectedDriver;
      return assignmentDate >= startDate && assignmentDate <= endDate && vehicleMatch && driverMatch;
    });

    return { filteredPayments, filteredExpenses, filteredAssignments };
  }, [filteredDataSources, dateRange, selectedVehicle, selectedDriver]);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const { filteredPayments, filteredExpenses, filteredAssignments } = filteredData;

    // Financial Metrics
    const totalRevenue = filteredPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const totalExpenses = filteredExpenses
      .filter(e => e.status === 'approved')
      .filter(e => !(e.paymentType === 'prepayment' || e.type === 'prepayment' ||
                     e.description.toLowerCase().includes('prepayment') ||
                     e.description.toLowerCase().includes('principal')))
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Expense Breakdown
    const fuelExpenses = filteredExpenses
      .filter(e => e.expenseType === 'fuel' || e.description?.toLowerCase().includes('fuel'))
      .reduce((sum, e) => sum + e.amount, 0);

    const maintenanceExpenses = filteredExpenses
      .filter(e => e.expenseType === 'maintenance' || e.type === 'maintenance')
      .reduce((sum, e) => sum + e.amount, 0);

    const insuranceExpenses = filteredExpenses
      .filter(e => e.expenseType === 'insurance' || e.type === 'insurance')
      .reduce((sum, e) => sum + e.amount, 0);

    const otherExpenses = totalExpenses - fuelExpenses - maintenanceExpenses - insuranceExpenses;

    // Operational Metrics
    const totalAssignments = filteredAssignments.length;
    const completedAssignments = filteredAssignments.filter(a => a.status === 'ended').length;
    const activeAssignments = filteredAssignments.filter(a => a.status === 'active').length;
    const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

    // Vehicle Performance
    const vehiclePerformance = filteredDataSources.vehicles.map(vehicle => {
      const vehiclePayments = filteredPayments.filter(p => p.vehicleId === vehicle.id);
      const vehicleExpenses = filteredExpenses.filter(e => e.vehicleId === vehicle.id);
      const vehicleAssignments = filteredAssignments.filter(a => a.vehicleId === vehicle.id);

      const vehicleRevenue = vehiclePayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const vehicleExpenseTotal = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
      const vehicleProfit = vehicleRevenue - vehicleExpenseTotal;

      const totalTrips = vehicleAssignments.length;
      const completedTrips = vehicleAssignments.filter(a => a.status === 'ended').length;

      return {
        id: vehicle.id,
        name: `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})`,
        revenue: vehicleRevenue,
        expenses: vehicleExpenseTotal,
        profit: vehicleProfit,
        totalTrips,
        completedTrips,
        utilization: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Driver Performance - filter drivers based on assignments with user's vehicles
    const driverPerformance = availableDrivers.map(driver => {
      const driverAssignments = filteredAssignments.filter(a => a.driverId === driver.id);
      const driverPayments = filteredPayments.filter(p => p.driverId === driver.id);

      const totalEarnings = driverPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const totalTrips = driverAssignments.length;
      const completedTrips = driverAssignments.filter(a => a.status === 'ended').length;

      return {
        id: driver.id,
        name: driver.name,
        totalEarnings,
        totalTrips,
        completedTrips,
        completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0
      };
    }).sort((a, b) => b.totalEarnings - a.totalEarnings);

    // Monthly Trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthPayments = filteredDataSources.payments.filter(p => {
        const paymentDate = new Date(p.paidAt || p.collectionDate || p.createdAt);
        return paymentDate >= monthStart && paymentDate <= monthEnd && p.status === 'paid';
      });

      const monthExpenses = filteredDataSources.expenses.filter(e => {
        const expenseDate = new Date(e.createdAt);
        return expenseDate >= monthStart && expenseDate <= monthEnd && e.status === 'approved';
      });

      monthlyTrends.push({
        month: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        revenue: monthPayments.reduce((sum, p) => sum + p.amountPaid, 0),
        expenses: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
        profit: monthPayments.reduce((sum, p) => sum + p.amountPaid, 0) - monthExpenses.reduce((sum, e) => sum + e.amount, 0)
      });
    }

    return {
      financial: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        expenseBreakdown: {
          fuel: fuelExpenses,
          maintenance: maintenanceExpenses,
          insurance: insuranceExpenses,
          other: otherExpenses
        }
      },
      operational: {
        totalAssignments,
        completedAssignments,
        activeAssignments,
        completionRate
      },
      performance: {
        vehiclePerformance,
        driverPerformance
      },
      trends: monthlyTrends
    };
  }, [filteredData, filteredDataSources, userInfo]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportToExcel = () => {
    // Create Excel export data
    const exportData = {
      summary: {
        totalRevenue: analytics.financial.totalRevenue,
        totalExpenses: analytics.financial.totalExpenses,
        netProfit: analytics.financial.netProfit,
        profitMargin: analytics.financial.profitMargin
      },
      expenseBreakdown: analytics.financial.expenseBreakdown,
      vehiclePerformance: analytics.performance.vehiclePerformance,
      driverPerformance: analytics.performance.driverPerformance,
      monthlyTrends: analytics.trends
    };

    // Convert to CSV format for Excel
    const csvContent = generateCSV(exportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fleet-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export Successful",
      description: "Analytics data exported to Excel successfully",
    });
  };

  const exportToPDF = () => {
    // PDF export functionality would require a library like jsPDF
    toast({
      title: "PDF Export",
      description: "PDF export functionality coming soon",
    });
  };

  const generateCSV = (data: any) => {
    let csv = 'Category,Metric,Value\n';

    // Summary
    csv += `Financial,Total Revenue,${data.summary.totalRevenue}\n`;
    csv += `Financial,Total Expenses,${data.summary.totalExpenses}\n`;
    csv += `Financial,Net Profit,${data.summary.netProfit}\n`;
    csv += `Financial,Profit Margin,${data.summary.profitMargin.toFixed(2)}%\n\n`;

    // Expense Breakdown
    csv += 'Expense Breakdown,Type,Amount\n';
    Object.entries(data.expenseBreakdown).forEach(([type, amount]) => {
      csv += `Expense Breakdown,${type.charAt(0).toUpperCase() + type.slice(1)},${amount}\n`;
    });
    csv += '\n';

    // Vehicle Performance
    csv += 'Vehicle Performance,Vehicle,Revenue,Expenses,Profit,Trips,Utilization\n';
    data.vehiclePerformance.forEach((vehicle: any) => {
      csv += `Vehicle Performance,"${vehicle.name}",${vehicle.revenue},${vehicle.expenses},${vehicle.profit},${vehicle.totalTrips},${vehicle.utilization.toFixed(1)}%\n`;
    });
    csv += '\n';

    // Driver Performance
    csv += 'Driver Performance,Driver,Earnings,Trips,Completion Rate\n';
    data.driverPerformance.forEach((driver: any) => {
      csv += `Driver Performance,"${driver.name}",${driver.totalEarnings},${driver.totalTrips},${driver.completionRate.toFixed(1)}%\n`;
    });

    return csv;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive fleet performance and financial analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vehicle">Vehicle</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {filteredDataSources.vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.registrationNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="driver">Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {availableDrivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <div className="w-full overflow-hidden">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto w-full min-w-0">
            <TabsTrigger value="summary" className="whitespace-nowrap flex-shrink-0">Summary</TabsTrigger>
            <TabsTrigger value="financial" className="whitespace-nowrap flex-shrink-0">Financial</TabsTrigger>
            <TabsTrigger value="operational" className="whitespace-nowrap flex-shrink-0">Operational</TabsTrigger>
            <TabsTrigger value="performance" className="whitespace-nowrap flex-shrink-0">Performance</TabsTrigger>
          </TabsList>
        </div>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.financial.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(analytics.financial.totalExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.financial.netProfit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                    <p className="text-2xl font-bold text-purple-600">{analytics.financial.profitMargin.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-orange-600" />
                    <span>Fuel Expenses</span>
                  </div>
                  <div className="text-right sm:text-right">
                    <div className="font-semibold">{formatCurrency(analytics.financial.expenseBreakdown.fuel)}</div>
                    <div className="text-sm text-gray-500">
                      {analytics.financial.totalExpenses > 0 ? ((analytics.financial.expenseBreakdown.fuel / analytics.financial.totalExpenses) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
                <Progress value={analytics.financial.totalExpenses > 0 ? (analytics.financial.expenseBreakdown.fuel / analytics.financial.totalExpenses) * 100 : 0} className="h-2" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span>Maintenance</span>
                  </div>
                  <div className="text-right sm:text-right">
                    <div className="font-semibold">{formatCurrency(analytics.financial.expenseBreakdown.maintenance)}</div>
                    <div className="text-sm text-gray-500">
                      {analytics.financial.totalExpenses > 0 ? ((analytics.financial.expenseBreakdown.maintenance / analytics.financial.totalExpenses) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
                <Progress value={analytics.financial.totalExpenses > 0 ? (analytics.financial.expenseBreakdown.maintenance / analytics.financial.totalExpenses) * 100 : 0} className="h-2" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Insurance</span>
                  </div>
                  <div className="text-right sm:text-right">
                    <div className="font-semibold">{formatCurrency(analytics.financial.expenseBreakdown.insurance)}</div>
                    <div className="text-sm text-gray-500">
                      {analytics.financial.totalExpenses > 0 ? ((analytics.financial.expenseBreakdown.insurance / analytics.financial.totalExpenses) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
                <Progress value={analytics.financial.totalExpenses > 0 ? (analytics.financial.expenseBreakdown.insurance / analytics.financial.totalExpenses) * 100 : 0} className="h-2" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-gray-600" />
                    <span>Other Expenses</span>
                  </div>
                  <div className="text-right sm:text-right">
                    <div className="font-semibold">{formatCurrency(analytics.financial.expenseBreakdown.other)}</div>
                    <div className="text-sm text-gray-500">
                      {analytics.financial.totalExpenses > 0 ? ((analytics.financial.expenseBreakdown.other / analytics.financial.totalExpenses) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
                <Progress value={analytics.financial.totalExpenses > 0 ? (analytics.financial.expenseBreakdown.other / analytics.financial.totalExpenses) * 100 : 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.trends.map((trend, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
                    <div className="font-medium">{trend.month}</div>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm">
                      <div className="text-green-600">
                        <div className="font-semibold">{formatCurrency(trend.revenue)}</div>
                        <div>Revenue</div>
                      </div>
                      <div className="text-red-600">
                        <div className="font-semibold">{formatCurrency(trend.expenses)}</div>
                        <div>Expenses</div>
                      </div>
                      <div className={`font-semibold ${trend.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        <div>{formatCurrency(trend.profit)}</div>
                        <div>Profit</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operational Tab */}
        <TabsContent value="operational" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-bold">{analytics.operational.totalAssignments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.operational.completedAssignments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-yellow-600">{analytics.operational.activeAssignments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assignment Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                  <span>Completion Rate</span>
                  <span>{analytics.operational.completionRate.toFixed(1)}%</span>
                </div>
                <Progress value={analytics.operational.completionRate} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Vehicle Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Expenses</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Trips</TableHead>
                      <TableHead>Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.performance.vehiclePerformance.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.name}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(vehicle.revenue)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(vehicle.expenses)}</TableCell>
                        <TableCell className={`font-semibold ${vehicle.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatCurrency(vehicle.profit)}
                        </TableCell>
                        <TableCell>{vehicle.totalTrips}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={vehicle.utilization} className="w-16 h-2" />
                            <span className="text-sm">{vehicle.utilization.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Driver Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Driver</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Trips</TableHead>
                      <TableHead>Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.performance.driverPerformance.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(driver.totalEarnings)}</TableCell>
                        <TableCell>{driver.totalTrips}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={driver.completionRate} className="w-16 h-2" />
                            <span className="text-sm">{driver.completionRate.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;