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
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';

interface AccountingTransaction {
  id: string;
  vehicleId: string;
  type: 'gst_payment' | 'service_charge' | 'partner_payment' | 'owner_payment';
  amount: number;
  month: string;
  description: string;
  status: 'pending' | 'completed' | 'reversed';
  createdAt: string;
  completedAt?: string;
  reversedAt?: string;
}

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [reportType, setReportType] = useState('summary');
  const [accountingTransactions, setAccountingTransactions] = useState<AccountingTransaction[]>([]);

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

  // Load accounting transactions
  React.useEffect(() => {
    if (!userInfo?.companyId) return;

    const transactionsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/accountingTransactions`);
    const q = query(transactionsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as AccountingTransaction[];
      setAccountingTransactions(transactions);
    }, (error) => {
      console.error('Error loading accounting transactions:', error);
    });

    return () => unsubscribe();
  }, [userInfo]);

  // Filter accounting transactions by date range and vehicle
  const filteredAccountingTransactions = React.useMemo(() => {
    const { startDate, endDate } = getDateRange();

    return accountingTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      const vehicleMatch = selectedVehicle === 'all' || transaction.vehicleId === selectedVehicle;
      return transactionDate >= startDate && transactionDate <= endDate && vehicleMatch;
    });
  }, [accountingTransactions, dateRange, selectedVehicle]);

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

  const exportToExcel = async () => {
    try {
      // Dynamic import for ExcelJS
      const ExcelJS = await import('exceljs');

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Route Glide Transpo Hub';
      workbook.created = new Date();

      // Helper function to format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      };

      // Helper function to format date
      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN');
      };

      // ===== EXECUTIVE SUMMARY SHEET =====
      const summarySheet = workbook.addWorksheet('Executive Summary');
      summarySheet.getColumn('A').width = 30;
      summarySheet.getColumn('B').width = 20;
      summarySheet.getColumn('C').width = 20;
      summarySheet.getColumn('D').width = 15;

      // Title
      const titleRow = summarySheet.addRow(['Fleet Analytics Report']);
      titleRow.font = { size: 16, bold: true };
      titleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };

      summarySheet.addRow(['Generated On:', new Date().toLocaleDateString('en-IN')]);
      summarySheet.addRow(['Report Period:', `${dateRange} days`]);
      summarySheet.addRow(['Selected Vehicle:', selectedVehicle === 'all' ? 'All Vehicles' : filteredDataSources.vehicles.find(v => v.id === selectedVehicle)?.registrationNumber || 'N/A']);
      summarySheet.addRow(['Selected Driver:', selectedDriver === 'all' ? 'All Drivers' : availableDrivers.find(d => d.id === selectedDriver)?.name || 'N/A']);
      summarySheet.addRow([]);

      // Key Metrics
      const metricsHeader = summarySheet.addRow(['Key Performance Indicators', '', '', '']);
      metricsHeader.font = { bold: true };
      metricsHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCE5FF' }
      };

      summarySheet.addRow(['Total Revenue', formatCurrency(analytics.financial.totalRevenue), '', '']);
      summarySheet.addRow(['Total Expenses', formatCurrency(analytics.financial.totalExpenses), '', '']);
      summarySheet.addRow(['Net Profit', formatCurrency(analytics.financial.netProfit), '', '']);
      summarySheet.addRow(['Profit Margin', `${analytics.financial.profitMargin.toFixed(2)}%`, '', '']);

      summarySheet.addRow([]);
      summarySheet.addRow(['Operational Metrics', '', '', '']);
      summarySheet.addRow(['Total Assignments', analytics.operational.totalAssignments, '', '']);
      summarySheet.addRow(['Completed Assignments', analytics.operational.completedAssignments, '', '']);
      summarySheet.addRow(['Active Assignments', analytics.operational.activeAssignments, '', '']);
      summarySheet.addRow(['Completion Rate', `${analytics.operational.completionRate.toFixed(1)}%`, '', '']);

      // ===== FINANCIAL ANALYSIS SHEET =====
      const financialSheet = workbook.addWorksheet('Financial Analysis');
      financialSheet.getColumn('A').width = 25;
      financialSheet.getColumn('B').width = 15;
      financialSheet.getColumn('C').width = 15;
      financialSheet.getColumn('D').width = 15;
      financialSheet.getColumn('E').width = 15;
      financialSheet.getColumn('F').width = 15;

      const finHeader = financialSheet.addRow(['Financial Analysis - Last 6 Months']);
      finHeader.font = { size: 14, bold: true };
      finHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };

      financialSheet.addRow(['Month', 'Revenue', 'Expenses', 'Profit', 'Profit Margin', 'Growth %']);
      const headerRow = financialSheet.getRow(financialSheet.rowCount);
      headerRow.font = { bold: true };
      headerRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCE5FF' }
      };

      analytics.trends.forEach((trend, index) => {
        const prevProfit = index > 0 ? analytics.trends[index - 1].profit : 0;
        const growth = prevProfit !== 0 ? ((trend.profit - prevProfit) / Math.abs(prevProfit)) * 100 : 0;

        const row = financialSheet.addRow([
          trend.month,
          trend.revenue,
          trend.expenses,
          trend.profit,
          trend.revenue > 0 ? ((trend.profit / trend.revenue) * 100).toFixed(2) + '%' : '0.00%',
          index > 0 ? growth.toFixed(2) + '%' : 'N/A'
        ]);

        // Color coding for profit/loss
        if (trend.profit > 0) {
          row.getCell(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' }
          };
        } else if (trend.profit < 0) {
          row.getCell(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8D7DA' }
          };
        }
      });

      // ===== VEHICLE PERFORMANCE SHEET =====
      const vehicleSheet = workbook.addWorksheet('Vehicle Performance');
      vehicleSheet.getColumn('A').width = 30;
      vehicleSheet.getColumn('B').width = 15;
      vehicleSheet.getColumn('C').width = 15;
      vehicleSheet.getColumn('D').width = 15;
      vehicleSheet.getColumn('E').width = 12;
      vehicleSheet.getColumn('F').width = 12;
      vehicleSheet.getColumn('G').width = 15;
      vehicleSheet.getColumn('H').width = 15;
      vehicleSheet.getColumn('I').width = 15;

      const vehHeader = vehicleSheet.addRow(['Vehicle Performance Analysis']);
      vehHeader.font = { size: 14, bold: true };
      vehHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };

      vehicleSheet.addRow(['Vehicle', 'Revenue', 'Expenses', 'Profit', 'Trips', 'Completed', 'Utilization', 'ROI %', 'Status']);
      const vehDataHeader = vehicleSheet.getRow(vehicleSheet.rowCount);
      vehDataHeader.font = { bold: true };
      vehDataHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCE5FF' }
      };

      analytics.performance.vehiclePerformance.forEach(vehicle => {
        const vehicleData = filteredDataSources.vehicles.find(v => v.id === vehicle.id);
        const roi = vehicleData ? ((vehicle.profit / (vehicleData.initialInvestment || vehicleData.initialCost || 0)) * 100) : 0;

        const row = vehicleSheet.addRow([
          vehicle.name,
          vehicle.revenue,
          vehicle.expenses,
          vehicle.profit,
          vehicle.totalTrips,
          vehicle.completedTrips,
          `${vehicle.utilization.toFixed(1)}%`,
          roi.toFixed(2) + '%',
          vehicleData?.status || 'N/A'
        ]);

        // Color coding
        if (vehicle.profit > 0) {
          row.getCell(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' }
          };
        } else {
          row.getCell(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8D7DA' }
          };
        }

        if (vehicle.utilization > 80) {
          row.getCell(7).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' }
          };
        }
      });

      // ===== DRIVER PERFORMANCE SHEET =====
      const driverSheet = workbook.addWorksheet('Driver Performance');
      driverSheet.getColumn('A').width = 25;
      driverSheet.getColumn('B').width = 15;
      driverSheet.getColumn('C').width = 12;
      driverSheet.getColumn('D').width = 12;
      driverSheet.getColumn('E').width = 15;
      driverSheet.getColumn('F').width = 15;
      driverSheet.getColumn('G').width = 15;

      const drvHeader = driverSheet.addRow(['Driver Performance Analysis']);
      drvHeader.font = { size: 14, bold: true };
      drvHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };

      driverSheet.addRow(['Driver', 'Earnings', 'Trips', 'Completed', 'Completion Rate', 'Avg/Trip', 'Status']);
      const drvDataHeader = driverSheet.getRow(driverSheet.rowCount);
      drvDataHeader.font = { bold: true };
      drvDataHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCE5FF' }
      };

      analytics.performance.driverPerformance.forEach(driver => {
        const driverData = availableDrivers.find(d => d.id === driver.id);
        const avgPerTrip = driver.totalTrips > 0 ? driver.totalEarnings / driver.totalTrips : 0;

        const row = driverSheet.addRow([
          driver.name,
          driver.totalEarnings,
          driver.totalTrips,
          driver.completedTrips,
          `${driver.completionRate.toFixed(1)}%`,
          avgPerTrip.toFixed(0),
          driverData?.isActive ? 'Active' : 'Inactive'
        ]);

        if (driver.completionRate > 90) {
          row.getCell(5).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' }
          };
        }
      });

      // ===== TRANSACTION HISTORY SHEET =====
      const transactionSheet = workbook.addWorksheet('Transaction History');
      transactionSheet.getColumn('A').width = 12;
      transactionSheet.getColumn('B').width = 20;
      transactionSheet.getColumn('C').width = 25;
      transactionSheet.getColumn('D').width = 15;
      transactionSheet.getColumn('E').width = 15;
      transactionSheet.getColumn('F').width = 20;
      transactionSheet.getColumn('G').width = 15;
      transactionSheet.getColumn('H').width = 15;

      const transHeader = transactionSheet.addRow(['Transaction History']);
      transHeader.font = { size: 14, bold: true };
      transHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };

      transactionSheet.addRow(['Date', 'Type', 'Description', 'Vehicle', 'Driver', 'Amount', 'Status', 'Category']);
      const transDataHeader = transactionSheet.getRow(transactionSheet.rowCount);
      transDataHeader.font = { bold: true };
      transDataHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCE5FF' }
      };

      // Add payment transactions
      filteredData.filteredPayments.forEach(payment => {
        const vehicle = filteredDataSources.vehicles.find(v => v.id === payment.vehicleId);
        const driver = availableDrivers.find(d => d.id === payment.driverId);

        transactionSheet.addRow([
          formatDate(payment.paidAt || payment.collectionDate || payment.createdAt),
          'Payment',
          `Rent Collection - ${payment.weekStart ? `Week of ${formatDate(payment.weekStart)}` : 'N/A'}`,
          vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'N/A',
          driver ? driver.name : 'N/A',
          payment.amountPaid,
          payment.status,
          'Revenue'
        ]);
      });

      // Add expense transactions
      filteredData.filteredExpenses.forEach(expense => {
        const vehicle = filteredDataSources.vehicles.find(v => v.id === expense.vehicleId);

        transactionSheet.addRow([
          formatDate(expense.createdAt),
          'Expense',
          expense.description,
          vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'N/A',
          'N/A',
          expense.amount,
          expense.status,
          expense.expenseType || expense.type || 'Other'
        ]);
      });

      // ===== ASSIGNMENT HISTORY SHEET =====
      const assignmentSheet = workbook.addWorksheet('Assignment History');
      assignmentSheet.getColumn('A').width = 12;
      assignmentSheet.getColumn('B').width = 25;
      assignmentSheet.getColumn('C').width = 20;
      assignmentSheet.getColumn('D').width = 12;
      assignmentSheet.getColumn('E').width = 12;
      assignmentSheet.getColumn('F').width = 15;
      assignmentSheet.getColumn('G').width = 15;
      assignmentSheet.getColumn('H').width = 15;

      const assignHeader = assignmentSheet.addRow(['Assignment History']);
      assignHeader.font = { size: 14, bold: true };
      assignHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };

      assignmentSheet.addRow(['Start Date', 'Vehicle', 'Driver', 'Weekly Rent', 'Daily Rent', 'Status', 'Duration', 'Collection Day']);
      const assignDataHeader = assignmentSheet.getRow(assignmentSheet.rowCount);
      assignDataHeader.font = { bold: true };
      assignDataHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCE5FF' }
      };

      filteredData.filteredAssignments.forEach(assignment => {
        const vehicle = filteredDataSources.vehicles.find(v => v.id === assignment.vehicleId);
        const driver = availableDrivers.find(d => d.id === assignment.driverId);

        const startDate = new Date(assignment.startDate);
        const endDate = assignment.endDate ? new Date(assignment.endDate) : new Date();
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        assignmentSheet.addRow([
          formatDate(assignment.startDate),
          vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'N/A',
          driver ? driver.name : 'N/A',
          assignment.weeklyRent,
          assignment.dailyRent,
          assignment.status,
          `${duration} days`,
          assignment.collectionDay || 'N/A'
        ]);
      });

      // ===== ACCOUNTING TRANSACTIONS SHEET =====
      const accountingSheet = workbook.addWorksheet('Accounting Transactions');
      accountingSheet.getColumn('A').width = 12;
      accountingSheet.getColumn('B').width = 25;
      accountingSheet.getColumn('C').width = 15;
      accountingSheet.getColumn('D').width = 12;
      accountingSheet.getColumn('E').width = 15;
      accountingSheet.getColumn('F').width = 30;
      accountingSheet.getColumn('G').width = 12;
      accountingSheet.getColumn('H').width = 15;
      accountingSheet.getColumn('I').width = 15;
      accountingSheet.getColumn('J').width = 15;

      const acctHeader = accountingSheet.addRow(['Accounting Transactions - Profit Distribution']);
      acctHeader.font = { size: 14, bold: true };
      acctHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };

      accountingSheet.addRow(['Date', 'Vehicle', 'Type', 'Month', 'Amount', 'Description', 'Status', 'Completed At', 'Reversed At', 'Category']);
      const acctDataHeader = accountingSheet.getRow(accountingSheet.rowCount);
      acctDataHeader.font = { bold: true };
      acctDataHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCE5FF' }
      };

      // Add accounting transactions
      filteredAccountingTransactions.forEach(transaction => {
        const vehicle = filteredDataSources.vehicles.find(v => v.id === transaction.vehicleId);

        let category = '';
        switch (transaction.type) {
          case 'gst_payment':
            category = 'GST Collection';
            break;
          case 'service_charge':
            category = 'Service Charge';
            break;
          case 'partner_payment':
            category = 'Partner Share';
            break;
          case 'owner_payment':
            category = 'Owner Share';
            break;
          default:
            category = 'Other';
        }

        const row = accountingSheet.addRow([
          formatDate(transaction.createdAt),
          vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'N/A',
          transaction.type.replace('_', ' ').toUpperCase(),
          transaction.month,
          transaction.amount,
          transaction.description,
          transaction.status,
          transaction.completedAt ? formatDate(transaction.completedAt) : '',
          transaction.reversedAt ? formatDate(transaction.reversedAt) : '',
          category
        ]);

        // Color coding based on status
        if (transaction.status === 'completed') {
          row.getCell(7).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' }
          };
        } else if (transaction.status === 'pending') {
          row.getCell(7).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF3CD' }
          };
        } else if (transaction.status === 'reversed') {
          row.getCell(7).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8D7DA' }
          };
        }
      });

      // Add summary section for accounting transactions
      accountingSheet.addRow([]);
      accountingSheet.addRow(['Accounting Transactions Summary', '', '', '', '', '', '', '', '', '']);
      const summaryHeader = accountingSheet.getRow(accountingSheet.rowCount);
      summaryHeader.font = { bold: true };
      summaryHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };

      // Calculate summary by type
      const gstTotal = filteredAccountingTransactions
        .filter(t => t.type === 'gst_payment' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const serviceChargeTotal = filteredAccountingTransactions
        .filter(t => t.type === 'service_charge' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const partnerTotal = filteredAccountingTransactions
        .filter(t => t.type === 'partner_payment' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const ownerTotal = filteredAccountingTransactions
        .filter(t => t.type === 'owner_payment' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      accountingSheet.addRow(['GST Payments', '', '', '', gstTotal, 'Total GST collected and paid', '', '', '', 'GST Collection']);
      accountingSheet.addRow(['Service Charges', '', '', '', serviceChargeTotal, 'Total service charges collected', '', '', '', 'Service Charge']);
      accountingSheet.addRow(['Partner Shares', '', '', '', partnerTotal, 'Total partner shares distributed', '', '', '', 'Partner Share']);
      accountingSheet.addRow(['Owner Shares', '', '', '', ownerTotal, 'Total owner shares distributed', '', '', '', 'Owner Share']);
      accountingSheet.addRow(['Grand Total', '', '', '', gstTotal + serviceChargeTotal + partnerTotal + ownerTotal, 'Total profit distribution', '', '', '', 'All Categories']);

      // ===== CASH FLOW ANALYSIS SHEET =====
      const cashFlowSheet = workbook.addWorksheet('Cash Flow Analysis');
      cashFlowSheet.getColumn('A').width = 20;
      cashFlowSheet.getColumn('B').width = 15;
      cashFlowSheet.getColumn('C').width = 15;
      cashFlowSheet.getColumn('D').width = 15;
      cashFlowSheet.getColumn('E').width = 15;
      cashFlowSheet.getColumn('F').width = 15;

      const cfHeader = cashFlowSheet.addRow(['Cash Flow Analysis']);
      cfHeader.font = { size: 14, bold: true };
      cfHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };

      cashFlowSheet.addRow(['Month', 'Revenue Inflow', 'Expense Outflow', 'Net Cash Flow', 'Cumulative Cash', 'Cash Flow Trend']);
      const cfDataHeader = cashFlowSheet.getRow(cashFlowSheet.rowCount);
      cfDataHeader.font = { bold: true };
      cfDataHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCE5FF' }
      };

      let cumulativeCash = 0;
      analytics.trends.forEach((trend, index) => {
        cumulativeCash += trend.profit;

        const row = cashFlowSheet.addRow([
          trend.month,
          trend.revenue,
          trend.expenses,
          trend.profit,
          cumulativeCash,
          index > 0 ? (trend.profit > analytics.trends[index - 1].profit ? 'Increasing' : 'Decreasing') : 'Baseline'
        ]);

        // Color coding for cash flow
        if (trend.profit > 0) {
          row.getCell(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' }
          };
        } else {
          row.getCell(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8D7DA' }
          };
        }

        if (cumulativeCash > 0) {
          row.getCell(5).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' }
          };
        } else {
          row.getCell(5).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8D7DA' }
          };
        }
      });

      // Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `fleet-analytics-comprehensive-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();

      toast({
        title: "Export Successful",
        description: "Comprehensive analytics with accounting transactions exported to Excel successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data. Please try again.",
        variant: "destructive"
      });
    }
  };  const exportToPDF = () => {
    // PDF export functionality would require a library like jsPDF
    toast({
      title: "PDF Export",
      description: "PDF export functionality coming soon",
    });
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