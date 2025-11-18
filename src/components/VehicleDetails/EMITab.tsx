import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, CheckCircle, AlertCircle, Calculator, Calendar, TrendingUp, AlertTriangle, RotateCcw } from 'lucide-react';
import { Vehicle, Role } from '@/types/user';
import { VehicleFinancialData } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionNumberBadge } from './SectionNumberBadge';

interface EMITabProps {
  vehicle: Vehicle;
  financialData: VehicleFinancialData;
  markEMIPaid: (index: number, emi: any) => void;
  processEMIPayment?: (monthIndex: number, scheduleItem: any, penalty?: number, suppressToast?: boolean) => void;
  reverseEMIPayment?: (monthIndex: number, scheduleItem: any) => void;
}

export const EMITab: React.FC<EMITabProps> = ({ vehicle, financialData, markEMIPaid, processEMIPayment, reverseEMIPayment }) => {
  const { userInfo } = useAuth();
  const { toast } = useToast();
  const [bulkPaymentDialog, setBulkPaymentDialog] = useState(false);
  const [penaltyAmounts, setPenaltyAmounts] = useState<{[key: number]: string}>({});
  const [selectedEmiIndices, setSelectedEmiIndices] = useState<number[]>([]);
  const [isProcessingBulkPayment, setIsProcessingBulkPayment] = useState(false);
  const [reverseDialog, setReverseDialog] = useState<{ open: boolean; emiIndex: number; emi: any }>({ open: false, emiIndex: -1, emi: null });
  // Calculate overdue and due EMIs
  const emiSummary = useMemo(() => {
    if (!vehicle.loanDetails?.amortizationSchedule) {
      return { overdueEMIs: [], dueSoonEMIs: [], totalOverdue: 0, totalDueSoon: 0, totalDue: 0, allDueEMIs: [] };
    }

    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const overdueEMIs: Array<{ index: number; emi: any; daysPastDue: number; amount: number }> = [];
    const dueSoonEMIs: Array<{ index: number; emi: any; daysUntilDue: number; amount: number }> = [];
  const allDueEMIs: Array<{ index: number; emi: any; amount: number; daysPastDue?: number; daysUntilDue?: number }> = [];

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
        allDueEMIs.push({
          index,
          emi,
          amount: emiAmount,
          daysPastDue: Math.abs(daysDiff)
        });
      } else if (daysDiff <= 3) {
        // Due soon (within 3 days)
        dueSoonEMIs.push({
          index,
          emi,
          daysUntilDue: daysDiff,
          amount: emiAmount
        });
        allDueEMIs.push({
          index,
          emi,
          amount: emiAmount,
          daysUntilDue: daysDiff
        });
      }
    });

    const totalOverdue = overdueEMIs.reduce((sum, emi) => sum + emi.amount, 0);
    const totalDueSoon = dueSoonEMIs.reduce((sum, emi) => sum + emi.amount, 0);
    const totalDue = totalOverdue + totalDueSoon;

    return { overdueEMIs, dueSoonEMIs, totalOverdue, totalDueSoon, totalDue, allDueEMIs };
  }, [vehicle]);

  const orderedDueEmiIndices = useMemo(
    () => emiSummary.allDueEMIs.map(item => item.index),
    [emiSummary.allDueEMIs]
  );

  useEffect(() => {
    if (bulkPaymentDialog) {
      if (orderedDueEmiIndices.length > 0) {
        setSelectedEmiIndices(orderedDueEmiIndices);
      } else {
        setSelectedEmiIndices([]);
      }
    } else {
      setSelectedEmiIndices([]);
      setPenaltyAmounts({});
    }
  }, [bulkPaymentDialog, orderedDueEmiIndices]);

  const selectedEmis = emiSummary.allDueEMIs.filter(emi => selectedEmiIndices.includes(emi.index));
  const totalSelectedEmiAmount = selectedEmis.reduce((sum, emi) => sum + emi.amount, 0);
  const totalSelectedPenalties = selectedEmis.reduce((sum, emi) => sum + (parseFloat(penaltyAmounts[emi.index]) || 0), 0);
  const grandTotal = totalSelectedEmiAmount + totalSelectedPenalties;
  const selectedCount = selectedEmiIndices.length;

  const handleToggleEmiSelection = (emiIndex: number) => {
    const orderedIndices = orderedDueEmiIndices;
    const position = orderedIndices.indexOf(emiIndex);
    if (position === -1) {
      return;
    }

    const isSelected = selectedEmiIndices.includes(emiIndex);

    if (!isSelected) {
      // Selecting an EMI automatically includes all older due EMIs
      setSelectedEmiIndices(orderedIndices.slice(0, position + 1));
    } else {
      // Unselecting drops this EMI and everything after it to keep the sequence
      const retained = orderedIndices.slice(0, position);
      setSelectedEmiIndices(retained);
      setPenaltyAmounts(prev => {
        const updated = { ...prev };
        orderedIndices.slice(position).forEach(idx => {
          if (updated[idx] !== undefined) {
            delete updated[idx];
          }
        });
        return updated;
      });
    }
  };

  const handleSelectAllEmis = () => {
    if (orderedDueEmiIndices.length === 0) {
      return;
    }
    setSelectedEmiIndices(orderedDueEmiIndices);
  };

  const handleBulkEMIPayment = async () => {
    if (!processEMIPayment) {
      toast({
        title: 'Error',
        description: 'Bulk payment functionality not available.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingBulkPayment(true);
    let successCount = 0;
    let totalAmount = 0;
    
    try {
      const emisToProcess = emiSummary.allDueEMIs.filter(emi => selectedEmiIndices.includes(emi.index));

      if (emisToProcess.length === 0) {
        toast({
          title: 'No EMIs Selected',
          description: 'Select at least one EMI in sequence to process the payment.',
          variant: 'destructive'
        });
        return;
      }

      // Process each EMI payment sequentially - exactly like RentTab bulk collection
      for (const emi of emisToProcess) {
        const penalty = parseFloat(penaltyAmounts[emi.index]) || 0;
        
        try {
          // Process the payment - same pattern as RentTab
          await processEMIPayment(emi.index, emi.emi, penalty, true);
          successCount++;
          totalAmount += emi.amount + penalty;
          
          // Show progress toast for each payment
          toast({
            title: `EMI ${emi.emi.month} Paid ✅`,
            description: `₹${(emi.amount + penalty).toLocaleString()} paid successfully.`,
          });
          
          // Small delay between payments for better UX - same as RentTab (300ms)
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error processing EMI ${emi.emi.month}:`, error);
          toast({
            title: `Error on EMI ${emi.emi.month}`,
            description: 'Failed to process this EMI payment.',
            variant: 'destructive'
          });
          // Continue with next EMI even if one fails
        }
      }

      // Final success message
      if (successCount > 0) {
        toast({
          title: 'Bulk EMI Payment Completed! 🎉',
          description: `Successfully paid ${successCount} of ${emisToProcess.length} selected EMIs totaling ₹${totalAmount.toLocaleString()}.`,
        });
      } else {
        throw new Error('No payments were processed successfully');
      }

      // Reset dialog state
      setBulkPaymentDialog(false);
      setPenaltyAmounts({});
      setSelectedEmiIndices([]);
      
    } catch (error) {
      console.error('Error processing bulk EMI payment:', error);
      toast({
        title: 'Bulk Payment Failed',
        description: `Only ${successCount} payments were processed. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsProcessingBulkPayment(false);
    }
  };

  return (
    <div className="space-y-4">
      {vehicle.financingType === 'loan' && vehicle.loanDetails ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <SectionNumberBadge id="1" label="EMI Payment Schedule" className="mb-2" />
              <h3 className="text-lg font-semibold">EMI Payment Schedule</h3>
              <p className="text-sm text-gray-600 mt-1">
                ₹{(vehicle.loanDetails.emiPerMonth || 0).toLocaleString()} per month • {vehicle.loanDetails.interestRate}% annual interest
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {vehicle.loanDetails.amortizationSchedule?.filter(emi => emi.isPaid).length || 0} of {vehicle.loanDetails.totalInstallments || 0} paid
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
          <div className="mb-6">
            <SectionNumberBadge id="2" label="EMI Summary" className="mb-2" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-green-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {vehicle.loanDetails.amortizationSchedule?.filter(emi => emi.isPaid).length || 0}
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
              <CardContent className="p-4">
                <div className="flex items-center justify-between h-full">
                  <div className="text-center flex-1">
                    <div className={`text-2xl font-bold ${emiSummary.totalDue > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                      ₹{emiSummary.totalDue.toLocaleString()}
                    </div>
                    <div className={`text-sm ${emiSummary.totalDue > 0 ? 'text-orange-700' : 'text-gray-700'}`}>
                      Total Due Now
                    </div>
                  </div>
                  {emiSummary.totalDue > 0 && (
                    <div 
                      className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm cursor-pointer transition-colors h-full px-3 rounded-md ml-2"
                      onClick={() => setBulkPaymentDialog(true)}
                    >
                      Pay
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {((vehicle.loanDetails.amortizationSchedule?.filter(emi => emi.isPaid).length || 0) / (vehicle.loanDetails.totalInstallments || 1) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-purple-700">Completed</div>
              </CardContent>
            </Card>
            </div>
          </div>

          {/* EMI Schedule Grid */}
          <div>
            <SectionNumberBadge id="3" label="EMI Payment Grid" className="mb-2" />
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
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
                      {!emi.isPaid && canPayNow && userInfo?.role !== Role.PARTNER && (
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
                      {emi.isPaid && emi.paidAt && userInfo?.role !== Role.PARTNER && (() => {
                        const paidAt = new Date(emi.paidAt);
                        const now = new Date();
                        const hoursSincePayment = (now.getTime() - paidAt.getTime()) / (1000 * 60 * 60);
                        const canReverse = hoursSincePayment <= 24;

                        return canReverse ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs py-1 px-2 h-6 w-full mt-2 text-red-600 border-red-300 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReverseDialog({ open: true, emiIndex: index, emi });
                            }}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reverse
                          </Button>
                        ) : null;
                      })()}
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
          {userInfo?.role !== Role.PARTNER && (
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
                    const paidCount = vehicle.loanDetails?.amortizationSchedule?.filter(emi => emi.isPaid).length || 0;
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
          )}
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

      {/* Bulk EMI Payment Dialog */}
      <AlertDialog open={bulkPaymentDialog} onOpenChange={setBulkPaymentDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <SectionNumberBadge id="4" label="Bulk EMI Payment" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pay All Due EMIs
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <p className="font-semibold text-orange-800">
                      Select Due EMIs (Oldest First)
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-orange-700">
                        Selected: {selectedCount} of {emiSummary.allDueEMIs.length} (₹{emiSummary.totalDue.toLocaleString()})
                      </span>
                      {emiSummary.allDueEMIs.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-xs border-orange-300 text-orange-700"
                          onClick={handleSelectAllEmis}
                          disabled={isProcessingBulkPayment}
                        >
                          Select All
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-orange-700">
                    Choose consecutive EMIs starting from the oldest overdue instalment. Selecting a later EMI will automatically include every older due EMI.
                  </p>
                  <div className="mt-3 space-y-2 overflow-visible">
                    {(() => {
                      const dueEMIs = emiSummary.allDueEMIs;
                      if (dueEMIs.length === 0) {
                        return (
                          <div className="bg-white border border-dashed border-orange-300 rounded p-3 text-sm text-orange-700">
                            All EMIs are up to date. There is nothing pending right now.
                          </div>
                        );
                      }

                      return dueEMIs.map((emi) => {
                        const isSelected = selectedEmiIndices.includes(emi.index);
                        const checkboxId = `bulk-emi-${emi.index}`;
                        const isOverdue = !!(emi.daysPastDue && emi.daysPastDue > 0);
                        const isDueSoon = !isOverdue && typeof emi.daysUntilDue === 'number';

                        return (
                          <div
                            key={emi.index}
                            className={`bg-white border rounded p-3 transition-all ${isSelected ? 'border-orange-400 ring-1 ring-orange-400 shadow-sm' : 'border-orange-300'}`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={checkboxId}
                                checked={isSelected}
                                onCheckedChange={() => handleToggleEmiSelection(emi.index)}
                                disabled={isProcessingBulkPayment}
                              />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label htmlFor={checkboxId} className="font-semibold text-orange-900 cursor-pointer">
                                    EMI {emi.emi.month}
                                  </label>
                                  <span className="text-sm text-orange-600">
                                    Due: {new Date(emi.emi.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-sm text-gray-600">
                                    ₹{emi.amount.toLocaleString()}
                                  </span>
                                  {isOverdue && (
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`penalty-${emi.index}`} className="text-xs text-red-600">
                                        Penalty (₹):
                                      </Label>
                                      <Input
                                        id={`penalty-${emi.index}`}
                                        type="number"
                                        placeholder="0"
                                        className="w-20 h-7 text-xs"
                                        value={penaltyAmounts[emi.index] || ''}
                                        onChange={(e) => setPenaltyAmounts(prev => ({ ...prev, [emi.index]: e.target.value }))}
                                        disabled={!isSelected || isProcessingBulkPayment}
                                      />
                                    </div>
                                  )}
                                </div>
                                {isOverdue && (
                                  <div className="text-xs text-red-600">
                                    {emi.daysPastDue} days overdue
                                  </div>
                                )}
                                {isDueSoon && (
                                  <div className="text-xs text-amber-600">
                                    Due in {emi.daysUntilDue === 0 ? 'today' : `${emi.daysUntilDue} day${emi.daysUntilDue === 1 ? '' : 's'}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="mt-3 pt-3 border-t border-orange-300 space-y-1">
                    <div className="flex justify-between items-center font-bold text-orange-900">
                      <span>Selected EMIs: {selectedCount} of {emiSummary.allDueEMIs.length}</span>
                      <span>₹{totalSelectedEmiAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-red-700">
                      <span>Selected Penalties:</span>
                      <span>₹{totalSelectedPenalties.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-orange-900 pt-1 border-t border-orange-400">
                      <span>Grand Total:</span>
                      <span>₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-xs text-yellow-700">
                    <strong>Note:</strong> Selected EMIs will be paid sequentially from oldest to newest. Unselecting an EMI automatically clears all newer selections to keep the order intact.
                  </p>
                </div>

                <p className="text-sm text-gray-600">
                  Do you want to proceed with this bulk payment?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingBulkPayment}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkEMIPayment}
              disabled={isProcessingBulkPayment || selectedCount === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessingBulkPayment ? 'Processing...' : selectedCount > 0 ? `Pay ${selectedCount} EMI${selectedCount > 1 ? 's' : ''}` : 'Select EMIs to Pay'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EMI Reverse Confirmation Dialog */}
      <AlertDialog open={reverseDialog.open} onOpenChange={(open) => setReverseDialog({ open, emiIndex: -1, emi: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm EMI Payment Reversal
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Are you sure you want to reverse the payment for <strong>EMI {reverseDialog.emi?.month}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm font-semibold text-red-800 mb-2">This action will:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Mark EMI {reverseDialog.emi?.month} as unpaid</li>
                    <li>• Create a negative expense entry to offset the original payment</li>
                    <li>• Restore ₹{(vehicle.loanDetails?.emiPerMonth || 0).toLocaleString()} to cash balance</li>
                    <li>• Reverse any penalty charges if applicable</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500">
                  <strong>Note:</strong> This action can only be performed within 24 hours of the original payment.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reverseEMIPayment && reverseDialog.emi) {
                  reverseEMIPayment(reverseDialog.emiIndex, reverseDialog.emi);
                }
                setReverseDialog({ open: false, emiIndex: -1, emi: null });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Reverse Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};