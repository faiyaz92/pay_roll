import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Users, DollarSign, Wrench, TrendingUp, Gauge } from 'lucide-react';

const DashboardStats: React.FC = () => {
  const stats = {
    totalVehicles: 25,
    rentedVehicles: 18,
    availableVehicles: 7,
    driversCount: 20,
    monthlyRevenue: 450000,
    maintenanceDue: 3,
    profitMargin: 72.5,
    weeklyCollection: 126000,
    overduePayments: 2
  };

  const statsData = [
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles.toString(),
      change: `${stats.rentedVehicles} rented, ${stats.availableVehicles} available`,
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Drivers',
      value: stats.driversCount.toString(),
      change: `${stats.rentedVehicles} assigned`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Monthly Revenue',
      value: `${(stats.monthlyRevenue / 1000)}K`,
      change: `${stats.profitMargin}% profit margin`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
