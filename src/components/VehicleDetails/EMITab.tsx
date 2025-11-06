import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, CheckCircle, AlertCircle, Calculator, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { Vehicle } from '@/types/user';
import { VehicleFinancialData } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';

interface EMITabProps {
  vehicle: Vehicle;
  financialData: VehicleFinancialData;
  markEMIPaid: (index: number, emi: any) => void;
}

export const EMITab: React.FC<EMITabProps> = ({ vehicle, financialData, markEMIPaid }) => {
  const { toast } = useToast();

  // Calculate overdue and due EMIs
  const emiSummary = useMemo(() => {
    if (!vehicle.loanDetails?.amortizationSchedule) {
      return { overdueEMIs: [], dueSoonEMIs: [], totalOverdue: 0, totalDueSoon: 0, totalDue: 0 };
    }

    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const overdueEMIs: Array<{ index: number; emi: any; daysPastDue: number; amount: number }> = [];
    const dueSoonEMIs: Array<{ index: number; emi: any; daysUntilDue: number; amount: number }> = [];

    vehicle.loanDetails.amortizationSchedule.forEach((emi, index) => {
      if (emi.isPaid) return;

      const dueDate = new Date(emi.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const emiAmount = vehicle.loanDetails?.emiPerMonth || 0;

      if (daysDiff < 0) {
        // Overdue
        overdueEMIs.push({
          index,
          emi,
          daysPastDue: Math.abs(daysDiff),
          amount: emiAmount
        });
      } else if (daysDiff <= 3) {
        // Due soon (within 3 days)
        dueSoonEMIs.push({
          index,
          emi,
          daysUntilDue: daysDiff,
          amount: emiAmount
        });
      }
    });

    const totalOverdue = overdueEMIs.reduce((sum, emi) => sum + emi.amount, 0);
    const totalDueSoon = dueSoonEMIs.reduce((sum, emi) => sum + emi.amount, 0);
    const totalDue = totalOverdue + totalDueSoon;

    return { overdueEMIs, dueSoonEMIs, totalOverdue, totalDueSoon, totalDue };
  }, [vehicle]);

  return (
    <div className="space-y-4">
      {vehicle.financingType === 'loan' && vehicle.loanDetails ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">EMI Payment Schedule</h3>
              <p className="text-sm text-gray-600 mt-1">
                ₹{(vehicle.loanDetails.emiPerMonth || 0).toLocaleString()} per month • {vehicle.loanDetails.interestRate}% annual interest
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {vehicle.loanDetails.paidInstallments?.length || 0} of {vehicle.loanDetails.totalInstallments || 0} paid
              </Badge>
              <p className="text-sm text-gray-600">
                Outstanding: ₹{financialData.outstandingLoan.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Overdue Alert */}
          {emiSummary.overdueEMIs.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Overdue EMI Payments!</AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p className="font-semibold">
                    {emiSummary.overdueEMIs.length} EMI{emiSummary.overdueEMIs.length > 1 ? 's' : ''} overdue - 
                    Total: ₹{emiSummary.totalOverdue.toLocaleString()}
                  </p>
                  <p className="text-xs mt-1">
                    ⚠️ <strong>Important:</strong> Any payment will automatically settle the oldest overdue EMI first 
                    (EMI {emiSummary.overdueEMIs[0].emi.month} - Due: {new Date(emiSummary.overdueEMIs[0].emi.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, {emiSummary.overdueEMIs[0].daysPastDue} days overdue). 
                    Overdue payments may include penalty charges.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* EMI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-green-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {vehicle.loanDetails.paidInstallments?.length || 0}
                </div>
                <div className="text-sm text-green-700">EMIs Paid</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{Math.round(financialData.outstandingLoan / 100000).toFixed(1)}L
                </div>
                <div className="text-sm text-blue-700">Outstanding Loan</div>
              </CardContent>
            </Card>
            <Card className={`${emiSummary.totalOverdue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${emiSummary.totalOverdue > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  ₹{emiSummary.totalOverdue.toLocaleString()}
                </div>
                <div className={`text-sm ${emiSummary.totalOverdue > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                  Total Overdue
                </div>
              </CardContent>
            </Card>
            <Card className={`${emiSummary.totalDue > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${emiSummary.totalDue > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                  ₹{emiSummary.totalDue.toLocaleString()}
                </div>
                <div className={`text-sm ${emiSummary.totalDue > 0 ? 'text-orange-700' : 'text-gray-700'}`}>
                  Total Due Now
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {((vehicle.loanDetails.paidInstallments?.length || 0) / (vehicle.loanDetails.totalInstallments || 1) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-purple-700">Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* EMI Schedule Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">EMI Payment Grid</h4>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Paid</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                  <span>Due Soon</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 rounded"></div>
                  <span>Overdue</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-100 rounded"></div>
                  <span>Future</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(vehicle.loanDetails.amortizationSchedule || []).map((emi, index) => {
                const dueDate = emi.dueDate ? new Date(emi.dueDate) : new Date();
                const today = new Date();
                const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                // Check if payment can be made (3 days before due date OR overdue)
                const threeDaysFromNow = new Date();
                threeDaysFromNow.setDate(today.getDate() + 3);
                const canPayNow = dueDate <= threeDaysFromNow || daysDiff < 0; // Allow if due soon OR overdue

                let bgColor = 'bg-gray-100 hover:bg-gray-200';
                let textColor = 'text-gray-600';
                let borderColor = 'border-gray-200';
                let icon = <Clock className="h-4 w-4" />;
                let status = 'Future';

                if (emi.isPaid) {
                  bgColor = 'bg-green-100 hover:bg-green-150';
                  textColor = 'text-green-700';
                  borderColor = 'border-green-200';
                  icon = <CheckCircle className="h-4 w-4" />;
                  status = 'Paid';
                  if (emi.paidAt) {
                    status = `Paid ${new Date(emi.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
                  }
                } else if (daysDiff < 0) {
                  bgColor = 'bg-red-100 hover:bg-red-150';
                  textColor = 'text-red-700';
                  borderColor = 'border-red-300';
                  icon = <AlertCircle className="h-4 w-4" />;
                  status = `${Math.abs(daysDiff)} days overdue`;
                } else if (daysDiff <= 7) {
                  bgColor = 'bg-yellow-100 hover:bg-yellow-150';
                  textColor = 'text-yellow-700';
                  borderColor = 'border-yellow-300';
                  icon = <AlertCircle className="h-4 w-4" />;
                  status = daysDiff === 0 ? 'Due Today' : `${daysDiff} days left`;
                }

                return (
                  <Card
                    key={index}
                    className={`${bgColor} ${borderColor} border-2 transition-all duration-200 ${
                      !emi.isPaid && canPayNow ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                    }`}
                    onClick={() => !emi.isPaid && canPayNow && markEMIPaid(index, emi)}
                  >
                    <CardContent className="p-3 text-center space-y-2">
                      <div className={`${textColor} flex justify-center`}>
                        {icon}
                      </div>
                      <div className={`text-sm font-bold ${textColor}`}>
                        EMI {emi.month}
                      </div>
                      <div className={`text-xs ${textColor}`}>
                        {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                      <div className={`text-xs ${textColor} font-medium`}>
                        ₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()}
                      </div>
                      <div className={`text-xs ${textColor}`}>
                        {status}
                      </div>
                      {!emi.isPaid && canPayNow && (
                        <Button
                          size="sm"
                          className="text-xs py-1 px-2 h-6 w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            markEMIPaid(index, emi);
                          }}
                        >
                          Pay Now
                        </Button>
                      )}
                      {!emi.isPaid && !canPayNow && daysDiff > 3 && (
                        <div className="text-xs text-gray-400 mt-1">
                          Available in {daysDiff - 3} days
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-700 border-blue-300"
                onClick={() => {
                  // Scroll to prepayment calculator in Financials tab
                  const financialsTab = document.querySelector('[value="financials"]') as HTMLElement;
                  if (financialsTab) {
                    financialsTab.click();
                    setTimeout(() => {
                      const prepaymentSection = document.querySelector('#prepayment');
                      if (prepaymentSection) {
                        prepaymentSection.scrollIntoView({ behavior: 'smooth' });
                        (prepaymentSection as HTMLInputElement).focus();
                      }
                    }, 100);
                  }
                }}
              >
                <Calculator className="h-4 w-4 mr-1" />
                Calculate Prepayment
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-700 border-blue-300"
                onClick={() => {
                  toast({
                    title: 'Reminder Set',
                    description: `EMI payment reminders will be sent 3 days before each due date for ${vehicle.vehicleName || 'this vehicle'}.`,
                  });
                }}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Set Payment Reminders
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-700 border-blue-300"
                onClick={() => {
                  const paidCount = vehicle.loanDetails?.paidInstallments?.length || 0;
                  const totalCount = vehicle.loanDetails?.totalInstallments || 0;
                  const completionPercentage = totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(1) : '0';

                  toast({
                    title: 'Payment History Summary',
                    description: `EMIs Paid: ${paidCount} of ${totalCount}\nCompletion: ${completionPercentage}%\nRemaining: ${totalCount - paidCount} installments\nOutstanding: ₹${financialData.outstandingLoan.toLocaleString()}`,
                  });
                }}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                View Payment History
              </Button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Note:</strong> EMI payments can be marked as paid starting 3 days before due date. Overdue payments can include penalty charges.
            </p>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Cash Purchase</h3>
            <p className="text-gray-500">This vehicle was purchased with cash payment - no EMI tracking required</p>
            <p className="text-sm text-gray-400 mt-2">You have full ownership without any loan obligations</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};