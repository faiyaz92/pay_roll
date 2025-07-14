
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Navigation, Users, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useFirebaseData';

const DashboardStats: React.FC = () => {
  const stats = useDashboardStats();

  const statsData = [
    {
      title: 'Active Trips',
      value: stats.activeTrips.toString(),
      change: `${stats.completedTrips} completed`,
      icon: Navigation,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles.toString(),
      change: `${stats.availableVehicles} available`,
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Drivers',
      value: stats.activeDrive.toString(),
      change: `${stats.onTripDrivers} on trip`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Cities Covered',
      value: '15',
      change: '2 new routes',
      icon: MapPin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Load Efficiency',
      value: '87%',
      change: '+5% this week',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Alerts',
      value: '3',
      change: 'Capacity warnings',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
      {statsData.map((stat) => (
        <Card key={stat.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
