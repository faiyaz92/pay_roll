
import React from 'react';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import LiveTripsMap from '@/components/Dashboard/LiveTripsMap';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transportation Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your fleet operations in real-time</p>
      </div>
      
      <DashboardStats />
      
      <LiveTripsMap />
    </div>
  );
};

export default Dashboard;
