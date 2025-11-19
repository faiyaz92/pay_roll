
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Car,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Shield,
  Wrench,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CreditCard,
  Fuel,
  Settings,
  Eye
} from 'lucide-react';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PWAInstallButton from '@/components/PWAInstallButton';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const {
    vehicles,
    drivers,
    assignments,
    payments,
    expenses,
    vehiclesWithFinancials,
    loading
  } = useFirebaseData();

  // Calculate comprehensive dashboard data
  const dashboardData = useMemo(() => {
    if (loading) return null;

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentYear = new Date(now.getFullYear(), 0, 1);

    // Filter data for partners - only show their vehicles and related data
    const isPartner = userInfo?.role === 'partner';
    const partnerVehicles = isPartner ? vehicles.filter(v => v.partnerId === userInfo.userId) : vehicles;
    const partnerVehicleIds = new Set(partnerVehicles.map(v => v.id));
    
    const partnerPayments = isPartner ? payments.filter(p => partnerVehicleIds.has(p.vehicleId)) : payments;
    const partnerExpenses = isPartner ? expenses.filter(e => partnerVehicleIds.has(e.vehicleId)) : expenses;
    const partnerAssignments = isPartner ? assignments.filter(a => partnerVehicleIds.has(a.vehicleId)) : assignments;
    const partnerVehiclesWithFinancials = isPartner ? vehiclesWithFinancials.filter(v => partnerVehicleIds.has(v.id)) : vehiclesWithFinancials;

    // Fleet Statistics
    const totalVehicles = partnerVehicles.length;
    const rentedVehicles = partnerVehicles.filter(v => v.status === 'rented').length;
    const availableVehicles = partnerVehicles.filter(v => v.status === 'available').length;
    const maintenanceVehicles = partnerVehicles.filter(v => v.status === 'maintenance').length;
    const fleetUtilization = totalVehicles > 0 ? (rentedVehicles / totalVehicles) * 100 : 0;

    // Financial Calculations
    const monthlyPayments = partnerPayments.filter(p =>
      p.status === 'paid' &&
      new Date(p.paidAt || p.collectionDate || p.createdAt) >= currentMonth
    );
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amountPaid, 0);

    const lastMonthPayments = partnerPayments.filter(p =>
      p.status === 'paid' &&
      new Date(p.paidAt || p.collectionDate || p.createdAt) >= lastMonth &&
      new Date(p.paidAt || p.collectionDate || p.createdAt) < currentMonth
    );
    const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Expenses calculation
    const monthlyExpenses = partnerExpenses.filter(e =>
      e.status === 'approved' &&
      new Date(e.createdAt) >= currentMonth
    );
    const totalMonthlyExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Expense breakdown
    const fuelExpenses = monthlyExpenses.filter(e =>
      e.expenseType === 'fuel' || e.description?.toLowerCase().includes('fuel')
    ).reduce((sum, e) => sum + e.amount, 0);

    const maintenanceExpenses = monthlyExpenses.filter(e =>
      e.expenseType === 'maintenance' || e.type === 'maintenance'
    ).reduce((sum, e) => sum + e.amount, 0);

    const insuranceExpenses = monthlyExpenses.filter(e =>
      e.expenseType === 'insurance' || e.type === 'insurance'
    ).reduce((sum, e) => sum + e.amount, 0);

    // Net Profit
    const monthlyProfit = monthlyRevenue - totalMonthlyExpenses;
    const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

    // Insurance Alerts
    const expiringInsurance = partnerVehicles.filter(v => {
      if (!v.insuranceExpiryDate) return false;
      const expiryDate = new Date(v.insuranceExpiryDate);
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 30 && daysLeft >= 0;
    });

    const expiredInsurance = partnerVehicles.filter(v => {
      if (!v.insuranceExpiryDate) return false;
      const expiryDate = new Date(v.insuranceExpiryDate);
      return expiryDate < now;
    });

    // Recent Activities (last 10 transactions)
    const recentPayments = partnerPayments
      .filter(p => p.status === 'paid')
      .sort((a, b) => new Date(b.paidAt || b.collectionDate || b.createdAt).getTime() -
                     new Date(a.paidAt || a.collectionDate || a.createdAt).getTime())
      .slice(0, 5);

    const recentExpenses = partnerExpenses
      .filter(e => e.status === 'approved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const recentActivities = [...recentPayments.map(p => ({
      type: 'payment' as const,
      amount: p.amountPaid,
      description: `Rent collected from ${p.driverId || 'Driver'}`,
      date: p.paidAt || p.collectionDate || p.createdAt,
      vehicleId: p.vehicleId
    })), ...recentExpenses.map(e => ({
      type: 'expense' as const,
      amount: e.amount,
      description: e.description,
      date: e.createdAt,
      vehicleId: e.vehicleId
    }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    // Active Assignments
    const activeAssignments = partnerAssignments.filter(a => a.status === 'active');

    // Pending Collections (due payments)
    const pendingCollections = partnerPayments.filter(p =>
      p.status === 'due' || p.status === 'overdue'
    );

    // Due EMI and Rent Alerts (oldest one per vehicle type)
    const dueEMIAlert = partnerVehicles
      .filter(v => v.loanDetails?.amortizationSchedule)
      .map(vehicle => {
        const schedule = vehicle.loanDetails.amortizationSchedule;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);

        const dueEmis = schedule
          .map((emi: any, index: number) => {
            const dueDate = new Date(emi.dueDate);
            const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const canPayNow = dueDate <= threeDaysFromNow || daysDiff < 0;

            if (emi.isPaid || !canPayNow) {
              return null;
            }

            return { vehicle, index, emi, dueDate, daysDiff };
          })
          .filter((detail): detail is { vehicle: any; index: number; emi: any; dueDate: Date; daysDiff: number } => detail !== null)
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()); // Sort by due date (oldest first)

        return dueEmis.length > 0 ? dueEmis[0] : null;
      })
      .filter(alert => alert !== null)
      .sort((a, b) => a!.dueDate.getTime() - b!.dueDate.getTime())[0] || null; // Get the oldest due EMI across all vehicles

    const dueRentAlert = partnerVehiclesWithFinancials
      .filter(v => v.assignedDriverId && v.financialData?.currentAssignment)
      .map(vehicle => {
        const vehiclePayments = partnerPayments.filter((payment: any) => payment.vehicleId === vehicle.id);
        const startDateRaw = vehicle.financialData.currentAssignment.startDate;
        const assignmentStartDate = new Date(
          typeof startDateRaw === 'string'
            ? startDateRaw
            : startDateRaw?.toDate?.() || startDateRaw
        );

        const agreementEndDate = new Date(assignmentStartDate);
        agreementEndDate.setMonth(agreementEndDate.getMonth() + (vehicle.financialData.currentAssignment.agreementDuration || 12));
        const totalWeeks = Math.ceil((agreementEndDate.getTime() - assignmentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const today = new Date();

        const overdueWeeks: Array<{ vehicle: any; weekIndex: number; weekStartDate: Date; amount: number }> = [];

        for (let weekIndex = 0; weekIndex < Math.min(totalWeeks, 52); weekIndex++) {
          const weekStartDate = new Date(assignmentStartDate);
          weekStartDate.setDate(weekStartDate.getDate() + (weekIndex * 7));
          weekStartDate.setHours(0, 0, 0, 0);

          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekEndDate.getDate() + 6);
          weekEndDate.setHours(23, 59, 59, 999);

          // Check if payment exists for this week
          const weekRentPayment = vehiclePayments.find((payment: any) => {
            if (payment.vehicleId !== vehicle.id || payment.status !== 'paid') return false;
            const paymentWeekStart = new Date(payment.weekStart);
            return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
          });

          if (weekRentPayment) continue;

          const isPastWeek = weekEndDate < today;

          if (isPastWeek) {
            overdueWeeks.push({
              vehicle,
              weekIndex,
              weekStartDate,
              amount: vehicle.financialData.currentAssignment.weeklyRent
            });
          }
        }

        // Return oldest overdue week
        return overdueWeeks.length > 0 ? overdueWeeks[0] : null;
      })
      .filter(alert => alert !== null)
      .sort((a, b) => a!.weekStartDate.getTime() - b!.weekStartDate.getTime())[0] || null; // Get the oldest due rent across all vehicles

    return {
      fleet: {
        totalVehicles,
        rentedVehicles,
        availableVehicles,
        maintenanceVehicles,
        fleetUtilization
      },
      financial: {
        monthlyRevenue,
        lastMonthRevenue,
        revenueGrowth,
        totalMonthlyExpenses,
        monthlyProfit,
        profitMargin,
        fuelExpenses,
        maintenanceExpenses,
        insuranceExpenses
      },
      alerts: {
        expiringInsurance,
        expiredInsurance,
        pendingCollections,
        dueEMIAlert,
        dueRentAlert
      },
      activities: {
        recentActivities,
        activeAssignments
      }
    };
  }, [vehicles, vehiclesWithFinancials, drivers, assignments, payments, expenses, loading, userInfo]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading || !dashboardData) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 md:h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Fleet Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive overview of your car rental business performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <PWAInstallButton variant="default" size="sm" className="w-full sm:w-auto" />
          <Button variant="outline" onClick={() => navigate('/vehicles')} className="w-full sm:w-auto">
            <Car className="w-4 h-4 mr-2" />
            View Fleet
          </Button>
          <Button variant="outline" onClick={() => navigate('/assignments')} className="w-full sm:w-auto">
            <Users className="w-4 h-4 mr-2" />
            Assignments
          </Button>
          <Button variant="outline" onClick={() => navigate('/utility')} className="w-full sm:w-auto">
            <Settings className="w-4 h-4 mr-2" />
            Utility
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.financial.monthlyRevenue)}
                </p>
                <div className="flex items-center mt-1">
                  {dashboardData.financial.revenueGrowth >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${dashboardData.financial.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(dashboardData.financial.revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-lg self-start">
                <DollarSign className="w-5 md:w-6 h-5 md:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Profit</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.financial.monthlyProfit)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {dashboardData.financial.profitMargin.toFixed(1)}% margin
                </p>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-lg self-start">
                <TrendingUp className="w-5 md:w-6 h-5 md:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Fleet Utilization</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {dashboardData.fleet.fleetUtilization.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {dashboardData.fleet.rentedVehicles} of {dashboardData.fleet.totalVehicles} vehicles
                </p>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 rounded-lg self-start">
                <Car className="w-5 md:w-6 h-5 md:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {dashboardData.activities.activeAssignments.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Vehicles currently rented
                </p>
              </div>
              <div className="p-2 md:p-3 bg-orange-100 rounded-lg self-start">
                <Users className="w-5 md:w-6 h-5 md:h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Status & Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Fleet Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Car className="w-4 md:w-5 h-4 md:h-5" />
              Fleet Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium">Available</span>
                <div className="flex items-center gap-2 mt-1">
                  <Progress
                    value={(dashboardData.fleet.availableVehicles / dashboardData.fleet.totalVehicles) * 100}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm text-gray-600">{dashboardData.fleet.availableVehicles}</span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Rented</span>
                <div className="flex items-center gap-2 mt-1">
                  <Progress
                    value={(dashboardData.fleet.rentedVehicles / dashboardData.fleet.totalVehicles) * 100}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm text-gray-600">{dashboardData.fleet.rentedVehicles}</span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Maintenance</span>
                <div className="flex items-center gap-2 mt-1">
                  <Progress
                    value={(dashboardData.fleet.maintenanceVehicles / dashboardData.fleet.totalVehicles) * 100}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm text-gray-600">{dashboardData.fleet.maintenanceVehicles}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                <div>
                  <p className="text-xl md:text-2xl font-bold text-green-600">{dashboardData.fleet.availableVehicles}</p>
                  <p className="text-xs text-gray-500">Available</p>
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">{dashboardData.fleet.rentedVehicles}</p>
                  <p className="text-xs text-gray-500">Rented</p>
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-orange-600">{dashboardData.fleet.maintenanceVehicles}</p>
                  <p className="text-xs text-gray-500">Maintenance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <CreditCard className="w-4 md:w-5 h-4 md:h-5" />
              Monthly Financial Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Revenue</span>
                </div>
                <span className="font-medium text-green-600">
                  {formatCurrency(dashboardData.financial.monthlyRevenue)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Fuel</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(dashboardData.financial.fuelExpenses)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Maintenance</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(dashboardData.financial.maintenanceExpenses)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Insurance</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(dashboardData.financial.insuranceExpenses)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Other Expenses</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(dashboardData.financial.totalMonthlyExpenses -
                      dashboardData.financial.fuelExpenses -
                      dashboardData.financial.maintenanceExpenses -
                      dashboardData.financial.insuranceExpenses)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="font-medium">Net Profit</span>
                  <span className={`font-bold ${dashboardData.financial.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dashboardData.financial.monthlyProfit)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <AlertTriangle className="w-4 md:w-5 h-4 md:h-5" />
              Important Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            {dashboardData.alerts.expiredInsurance.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800">
                    {dashboardData.alerts.expiredInsurance.length} Insurance{dashboardData.alerts.expiredInsurance.length > 1 ? 's' : ''} Expired
                  </span>
                </div>
                <p className="text-xs text-red-700 mt-1">
                  Vehicles with expired insurance require immediate attention
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate('/insurance')}
                >
                  View Insurance
                </Button>
              </div>
            )}

            {dashboardData.alerts.expiringInsurance.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-800">
                    {dashboardData.alerts.expiringInsurance.length} Insurance{dashboardData.alerts.expiringInsurance.length > 1 ? 's' : ''} Expiring Soon
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Insurance policies expiring within 30 days
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate('/insurance')}
                >
                  View Insurance
                </Button>
              </div>
            )}

            {dashboardData.alerts.pendingCollections.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-800">
                    {dashboardData.alerts.pendingCollections.length} Pending Collection{dashboardData.alerts.pendingCollections.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Outstanding rent payments need to be collected
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate('/payments')}
                >
                  View Payments
                </Button>
              </div>
            )}

            {dashboardData.fleet.maintenanceVehicles > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-800">
                    {dashboardData.fleet.maintenanceVehicles} Vehicle{dashboardData.fleet.maintenanceVehicles > 1 ? 's' : ''} in Maintenance
                  </span>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  Vehicles currently undergoing maintenance
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate('/vehicles')}
                >
                  View Vehicles
                </Button>
              </div>
            )}

            {dashboardData.alerts.dueEMIAlert && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800">
                    EMI Due - {dashboardData.alerts.dueEMIAlert.vehicle.registrationNumber}
                  </span>
                </div>
                <p className="text-xs text-red-700 mt-1">
                  EMI for {dashboardData.alerts.dueEMIAlert.emi.month} is {dashboardData.alerts.dueEMIAlert.daysDiff < 0 ? `${Math.abs(dashboardData.alerts.dueEMIAlert.daysDiff)} days overdue` : `due in ${dashboardData.alerts.dueEMIAlert.daysDiff} days`}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate(`/vehicles/${dashboardData.alerts.dueEMIAlert.vehicle.id}`)}
                >
                  View Vehicle
                </Button>
              </div>
            )}

            {dashboardData.alerts.dueRentAlert && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-800">
                    Rent Due - {dashboardData.alerts.dueRentAlert.vehicle.registrationNumber}
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Week {dashboardData.alerts.dueRentAlert.weekIndex + 1} rent payment is overdue
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate(`/vehicles/${dashboardData.alerts.dueRentAlert.vehicle.id}`)}
                >
                  View Vehicle
                </Button>
              </div>
            )}

            {dashboardData.alerts.expiredInsurance.length === 0 &&
             dashboardData.alerts.expiringInsurance.length === 0 &&
             dashboardData.alerts.pendingCollections.length === 0 &&
             dashboardData.fleet.maintenanceVehicles === 0 &&
             !dashboardData.alerts.dueEMIAlert &&
             !dashboardData.alerts.dueRentAlert && (
              <div className="p-6 text-center">
                <Activity className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">All systems running smoothly!</p>
                <p className="text-xs text-gray-500 mt-1">No urgent alerts at this time</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Activity className="w-4 md:w-5 h-4 md:h-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3">
              {dashboardData.activities.recentActivities.length > 0 ? (
                dashboardData.activities.recentActivities.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'payment' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {activity.type === 'payment' ? (
                          <DollarSign className={`w-4 h-4 ${activity.type === 'payment' ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${
                      activity.type === 'payment' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.type === 'payment' ? '+' : '-'}{formatCurrency(activity.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activities</p>
                </div>
              )}
            </div>

            {dashboardData.activities.recentActivities.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => navigate('/payments')}>
                  <Eye className="w-4 h-4 mr-2" />
                  View All Transactions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
