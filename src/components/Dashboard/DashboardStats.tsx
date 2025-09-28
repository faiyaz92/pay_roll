import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Users, DollarSign, Wrench, TrendingUp, Gauge } from 'lucide-react';
import { useFirebaseData } from '@/hooks/useFirebaseData';

const DashboardStats: React.FC = () => {
  const { vehicles, drivers, assignments, payments, vehiclesWithFinancials } = useFirebaseData();

  // Calculate real stats from database
  const rentedVehicles = vehicles.filter(v => v.status === 'rented').length;
  const availableVehicles = vehicles.filter(v => v.status === 'available').length;
  const activeDrivers = drivers.filter(d => d.isActive).length;
  
  // Calculate monthly revenue from actual payments
  const currentMonth = new Date();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthlyPayments = payments.filter(p => 
    p.status === 'paid' && 
    new Date(p.paidAt || p.collectionDate || p.createdAt) >= firstDayOfMonth
  );
  const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  // Calculate maintenance due
  const maintenanceDue = vehicles.filter(v => v.needsMaintenance).length;

  const statsData = [
    {
      title: 'Total Vehicles',
      value: vehicles.length.toString(),
      change: `${rentedVehicles} rented, ${availableVehicles} available`,
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Drivers',
      value: activeDrivers.toString(),
      change: `${rentedVehicles} assigned`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${(monthlyRevenue / 1000).toFixed(0)}K`,
      change: `${monthlyPayments.length} payments collected`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Maintenance Due',
      value: maintenanceDue.toString(),
      change: `${vehicles.length - maintenanceDue} vehicles healthy`,
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
