import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calculator
} from 'lucide-react';
import { SectionNumberBadge } from '../VehicleDetails/SectionNumberBadge';

interface FinancialAnalyticsTabProps {
  companyFinancialData: any;
}

const FinancialAnalyticsTab: React.FC<FinancialAnalyticsTabProps> = ({ companyFinancialData }) => {
  const {
    monthName,
    selectedYear,
    totalEarnings,
    totalExpenses,
    totalProfit,
    vehicleData
  } = companyFinancialData;

  const profitMargin = totalEarnings > 0 ? (totalProfit / totalEarnings) * 100 : 0;

  // Calculate expense breakdown
  const expenseBreakdown = vehicleData.reduce((acc: any, vehicle: any) => {
    // This is a simplified breakdown - in real implementation you'd categorize expenses
    acc.fuel = (acc.fuel || 0) + (vehicle.expenses * 0.3); // Assume 30% fuel
    acc.maintenance = (acc.maintenance || 0) + (vehicle.expenses * 0.25); // Assume 25% maintenance
    acc.insurance = (acc.insurance || 0) + (vehicle.expenses * 0.15); // Assume 15% insurance
    acc.other = (acc.other || 0) + (vehicle.expenses * 0.3); // Assume 30% other
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <SectionNumberBadge id="1" label="Financial Summary" className="mb-2" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
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
            <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total monthly costs
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
              {profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit per Vehicle</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(vehicleData.length > 0 ? totalProfit / vehicleData.length : 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Average per vehicle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="2" label="Expense Breakdown" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Expense Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹{expenseBreakdown.fuel?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Fuel Expenses</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: totalExpenses > 0 ? `${(expenseBreakdown.fuel / totalExpenses) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ₹{expenseBreakdown.maintenance?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Maintenance</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: totalExpenses > 0 ? `${(expenseBreakdown.maintenance / totalExpenses) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                ₹{expenseBreakdown.insurance?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Insurance</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: totalExpenses > 0 ? `${(expenseBreakdown.insurance / totalExpenses) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                ₹{expenseBreakdown.other?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Other Expenses</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gray-500 h-2 rounded-full"
                  style={{ width: totalExpenses > 0 ? `${(expenseBreakdown.other / totalExpenses) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Performance Table */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="3" label="Vehicle Performance Analysis" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Vehicle Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehicleData.map((vehicle: any) => {
              const margin = vehicle.earnings > 0 ? (vehicle.profit / vehicle.earnings) * 100 : 0;
              return (
                <div key={vehicle.vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{vehicle.vehicle.registrationNumber}</h4>
                      <Badge variant={vehicle.profit >= 0 ? "default" : "destructive"}>
                        {vehicle.profit >= 0 ? 'Profitable' : 'Loss Making'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600">Earnings:</span>
                        <span className="font-medium text-green-600 ml-1">₹{vehicle.earnings.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Expenses:</span>
                        <span className="font-medium text-red-600 ml-1">₹{vehicle.expenses.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Profit:</span>
                        <span className={`font-medium ml-1 ${vehicle.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{vehicle.profit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {margin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Margin</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Indicators */}
      <SectionNumberBadge id="4" label="Financial Health Indicators" className="mb-2" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <SectionNumberBadge id="5" label="Profitability Analysis" className="mb-2" />
            <CardTitle>Profitability Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Profit Margin</span>
                <span className={`font-medium ${profitMargin >= 20 ? 'text-green-600' : profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${profitMargin >= 20 ? 'bg-green-500' : profitMargin >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(profitMargin * 2, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">
                {profitMargin >= 20 ? 'Excellent profitability' :
                 profitMargin >= 10 ? 'Good profitability' :
                 'Needs improvement'}
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2">Profit Distribution</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Profitable Vehicles</span>
                  <span>{vehicleData.filter((v: any) => v.profit > 0).length} / {vehicleData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Loss Making Vehicles</span>
                  <span>{vehicleData.filter((v: any) => v.profit <= 0).length} / {vehicleData.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionNumberBadge id="6" label="Expense Efficiency" className="mb-2" />
            <CardTitle>Expense Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Expense Ratio</span>
                <span className={`font-medium ${totalEarnings > 0 && (totalExpenses / totalEarnings) <= 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalEarnings > 0 ? ((totalExpenses / totalEarnings) * 100).toFixed(1) : '0'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${totalEarnings > 0 && (totalExpenses / totalEarnings) <= 0.7 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${totalEarnings > 0 ? Math.min((totalExpenses / totalEarnings) * 100, 100) : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">
                {totalEarnings > 0 && (totalExpenses / totalEarnings) <= 0.7 ? 'Good expense control' : 'High expense ratio'}
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2">Top Expense Categories</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Fuel</span>
                  <span>₹{expenseBreakdown.fuel?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maintenance</span>
                  <span>₹{expenseBreakdown.maintenance?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Insurance</span>
                  <span>₹{expenseBreakdown.insurance?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialAnalyticsTab;