
import React from 'react';
import DashboardStats from '@/components/Dashboard/DashboardStats';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CarRentalPro Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your car rental business performance</p>
      </div>
      
      <DashboardStats />
      
      {/* Additional car rental specific dashboard widgets can be added here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Assignments</h3>
          <p className="text-gray-500">Vehicle assignment overview will be displayed here</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Payment Collections</h3>
          <p className="text-gray-500">Upcoming payment collections will be shown here</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
