import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Car,
  DollarSign,
  Banknote,
  Calculator,
  PieChart
} from 'lucide-react';
import { SectionNumberBadge } from '../VehicleDetails/SectionNumberBadge';

interface FinancialOverviewTabProps {
  companyFinancialData: any;
}

const FinancialOverviewTab: React.FC<FinancialOverviewTabProps> = ({ companyFinancialData }) => {
  const {
    monthName,
    selectedYear,
    totalEarnings,
    totalExpenses,
    totalProfit,
    totalVehicles,
    activeVehicles,
    vehicleData
  } = companyFinancialData;

  const profitMargin = totalEarnings > 0 ? (totalProfit / totalEarnings) * 100 : 0;
  const fleetUtilization = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <SectionNumberBadge id="1" label="Financial Summary" className="mb-2" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthName} {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Operational costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {profitMargin.toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeVehicles}/{totalVehicles}
            </div>
            <p className="text-xs text-muted-foreground">
              {fleetUtilization.toFixed(1)}% utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Performance Overview */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="2" label="Vehicle Performance Overview" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Vehicle Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicleData.map((vehicleInfo: any) => (
              <Card key={vehicleInfo.vehicle.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{vehicleInfo.vehicle.registrationNumber}</h4>
                    <Badge variant={vehicleInfo.profit >= 0 ? "default" : "destructive"} className="text-xs">
                      {vehicleInfo.profit >= 0 ? 'Profit' : 'Loss'}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Earnings:</span>
                      <span className="text-green-600 font-medium">₹{vehicleInfo.earnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expenses:</span>
                      <span className="text-red-600 font-medium">₹{vehicleInfo.expenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-600 font-medium">Profit:</span>
                      <span className={`font-bold ${vehicleInfo.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{vehicleInfo.profit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Indicators */}
      <SectionNumberBadge id="3" label="Financial Health Indicators" className="mb-2" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profitability Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gross Profit Margin</span>
                <span className={`font-medium ${profitMargin >= 20 ? 'text-green-600' : profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${profitMargin >= 20 ? 'bg-green-500' : profitMargin >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(profitMargin * 2, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">
                {profitMargin >= 20 ? 'Excellent profitability' :
                 profitMargin >= 10 ? 'Good profitability' :
                 'Needs improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fleet Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fleet Utilization</span>
                <span className={`font-medium ${fleetUtilization >= 80 ? 'text-green-600' : fleetUtilization >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {fleetUtilization.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${fleetUtilization >= 80 ? 'bg-green-500' : fleetUtilization >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${fleetUtilization}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">
                {activeVehicles} of {totalVehicles} vehicles active
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialOverviewTab;