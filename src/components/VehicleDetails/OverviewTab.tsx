import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SectionNumberBadge } from './SectionNumberBadge';

interface OverviewTabProps {
  vehicle: any;
  financialData: any;
  expenseData: any;
  getTotalInvestment: () => number;
  getDriverName: (driverId: string) => string;
  getCurrentAssignmentDetails: () => any;
  getCurrentMonthlyRent: () => number;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  vehicle,
  financialData,
  expenseData,
  getTotalInvestment,
  getDriverName,
  getCurrentAssignmentDetails,
  getCurrentMonthlyRent
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Vehicle Info Card */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="1" label="Vehicle Information" className="mb-2" />
          <CardTitle className="text-lg">Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Condition:</span>
            <Badge variant="outline" className="capitalize">
              {vehicle.condition || 'N/A'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Purchase Price:</span>
            <span className="font-medium">₹{vehicle.initialCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Current Value:</span>
            <span className="font-medium">₹{(() => {
              const initialValue = vehicle.initialInvestment || vehicle.initialCost || 0;
              const depreciationRate = vehicle.depreciationRate ?? 10;
              const depreciationPerYear = depreciationRate / 100;

              // Calculate operational years since purchase (add 1 to include current year)
              const purchaseYear = vehicle.year || new Date().getFullYear();
              const currentYear = new Date().getFullYear();
              const operationalYears = Math.max(1, currentYear - purchaseYear + 1);

              const depreciatedValue = initialValue * Math.pow((1 - depreciationPerYear), operationalYears);
              return Math.round(depreciatedValue).toLocaleString();
            })()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Depreciation:</span>
            <span className="text-red-600">
              {(vehicle.depreciationRate ?? 10).toFixed(1)}% yearly
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Card */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="2" label="Investment & Returns" className="mb-2" />
          <CardTitle className="text-lg">Investment & Returns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Initial investment:</span>
            <span className="font-medium">₹{(vehicle.initialInvestment || vehicle.initialCost)?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Prepayment:</span>
            <span className="font-medium">₹{expenseData.prepayments.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total expenses:</span>
            <span className="font-medium text-red-600">₹{expenseData.totalExpenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span className="text-gray-700">Total investment:</span>
            <span className="text-lg">₹{getTotalInvestment().toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Rental Status Card */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="3" label="Current Rental Status" className="mb-2" />
          <CardTitle className="text-lg">Current Rental Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <Badge variant={financialData.isCurrentlyRented ? "default" : "secondary"}>
              {financialData.isCurrentlyRented ? "Rented" : "Available"}
            </Badge>
          </div>
          {financialData.isCurrentlyRented && getCurrentAssignmentDetails() ? (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Driver:</span>
                <span className="font-medium text-blue-600">
                  {getDriverName(getCurrentAssignmentDetails()!.driverId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly Rent:</span>
                <span className="font-medium text-green-600">
                  ₹{getCurrentAssignmentDetails()!.weeklyRent.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Rate:</span>
                <span className="font-medium">
                  ₹{getCurrentAssignmentDetails()!.dailyRent.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly (Est.):</span>
                <span className="font-medium text-green-600">
                  ₹{Math.round(getCurrentMonthlyRent()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Since:</span>
                <span className="text-sm">
                  {new Date(getCurrentAssignmentDetails()!.startDate).toLocaleDateString()}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">Vehicle is currently available for rental</p>
              <p className="text-xs text-gray-400 mt-1">No monthly rent being generated</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loan Status Card */}
      {vehicle.financingType === 'loan' && vehicle.loanDetails && (
        <Card>
          <CardHeader>
            <SectionNumberBadge id="4" label="Loan Status" className="mb-2" />
            <CardTitle className="text-lg">Loan Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Outstanding:</span>
              <span className="font-medium text-red-600">
                ₹{vehicle.loanDetails.outstandingLoan?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly EMI:</span>
              <span className="font-medium">₹{vehicle.loanDetails.emiPerMonth?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EMIs Paid:</span>
              <span className="font-medium">
                {vehicle.loanDetails.amortizationSchedule?.filter(emi => emi.isPaid).length || 0}/{vehicle.loanDetails.totalInstallments || 0}
              </span>
            </div>

            <Progress
              value={((vehicle.loanDetails.amortizationSchedule?.filter(emi => emi.isPaid).length || 0) / (vehicle.loanDetails.totalInstallments || 1)) * 100}
              className="h-2"
            />

            <div className="text-center">
              <Badge variant="outline">
                Next EMI Due: {vehicle.loanDetails.emiDueDate || 'N/A'}th of every month
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partnership Information Card */}
      {financialData.isPartnership && (
        <Card>
          <CardHeader>
            <SectionNumberBadge id="5" label="Partnership Information" className="mb-2" />
            <CardTitle className="text-lg">Partnership Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Partnership Share:</span>
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                {financialData.partnershipPercentage}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Partner Payment:</span>
              <span className="font-medium">₹{vehicle.partnerPaymentAmount?.toLocaleString() || 'N/A'}</span>
            </div>
            
            {/* Monthly Profit/Loss Sharing */}
            <div className="border-t pt-3 mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Profit/Loss Sharing</h4>
              <div className="space-y-2">
                {financialData.isCurrentlyRented ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Partner's share (Profit):</span>
                      <span className={`font-medium ${financialData.partnerShareMonthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.abs(financialData.partnerShareMonthlyProfit).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Owner's share (Profit):</span>
                      <span className={`font-medium ${financialData.ownerShareMonthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.abs(financialData.ownerShareMonthlyProfit).toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Partner's share (EMI Loss):</span>
                      <span className="font-medium text-red-600">
                        -₹{financialData.partnerShareMonthlyLoss.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Owner's share (EMI Loss):</span>
                      <span className="font-medium text-red-600">
                        -₹{financialData.ownerShareMonthlyLoss.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-red-50 rounded">
                      Vehicle is idle. Partner bears {financialData.partnershipPercentage}% of EMI payments.
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OverviewTab;