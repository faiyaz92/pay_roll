import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, CheckCircle, AlertCircle, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { Vehicle, Role } from '@/types/user';
import { VehicleFinancialData, Payment } from '@/hooks/useFirebaseData';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { SectionNumberBadge } from './SectionNumberBadge';
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

interface RentTabProps {
  vehicle: Vehicle;
  vehicleId: string;
  firebasePayments: Payment[];
  financialData: VehicleFinancialData;
  getCurrentAssignmentDetails: () => any;
  markRentCollected: (weekIndex: number, assignment: any, weekStartDate: Date) => void;
  reverseRentPayment: (weekIndex: number, assignment: any, weekStartDate: Date) => void;
  isProcessingRentPayment: number | null;
}

export const RentTab: React.FC<RentTabProps> = ({
  vehicle,
  vehicleId,
  firebasePayments,
  financialData,
  getCurrentAssignmentDetails,
  markRentCollected,
  reverseRentPayment,
  isProcessingRentPayment
}) => {
  const { userInfo } = useAuth();
  const [confirmPaymentDialog, setConfirmPaymentDialog] = React.useState(false);
  const [selectedPaymentWeek, setSelectedPaymentWeek] = React.useState<{
    weekIndex: number;
    assignment: any;
    weekStartDate: Date;
    willSettleWeek?: number;
  } | null>(null);
  const [selectedWeekIndices, setSelectedWeekIndices] = React.useState<number[]>([]);

  const [reverseDialog, setReverseDialog] = React.useState<{ open: boolean; weekIndex: number; assignment: any; weekStartDate: Date }>({ open: false, weekIndex: -1, assignment: null, weekStartDate: new Date() });

  // Calculate overdue and due amounts
  const rentSummary = useMemo(() => {
    if (!vehicle.assignedDriverId || !financialData.currentAssignment) {
      return { overdueWeeks: [], currentWeekDue: null, totalOverdue: 0, dueTodayAmount: 0, totalDue: 0 };
    }

    const currentAssignment = financialData.currentAssignment;
    const assignmentStartDate = new Date(
      typeof currentAssignment.startDate === 'string'
        ? currentAssignment.startDate
        : currentAssignment.startDate?.toDate?.() || currentAssignment.startDate
    );
    
    const agreementEndDate = new Date(assignmentStartDate);
    agreementEndDate.setMonth(agreementEndDate.getMonth() + (currentAssignment.agreementDuration || 12));
    const totalWeeks = Math.ceil((agreementEndDate.getTime() - assignmentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const today = new Date();
    
    const overdueWeeks: Array<{ weekIndex: number; weekStartDate: Date; amount: number }> = [];
    let currentWeekDue: { weekIndex: number; weekStartDate: Date; amount: number } | null = null;

    for (let weekIndex = 0; weekIndex < Math.min(totalWeeks, 52); weekIndex++) {
      const weekStartDate = new Date(assignmentStartDate);
      weekStartDate.setDate(weekStartDate.getDate() + (weekIndex * 7));
      weekStartDate.setHours(0, 0, 0, 0);

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);

      // Check if paid
      const weekRentPayment = firebasePayments.find(payment => {
        if (payment.vehicleId !== vehicleId || payment.status !== 'paid') return false;
        const paymentWeekStart = new Date(payment.weekStart);
        return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
      });

      if (!weekRentPayment) {
        const isPastWeek = weekEndDate < today;
        const isCurrentWeek = weekStartDate <= today && today <= weekEndDate;

        if (isPastWeek) {
          overdueWeeks.push({
            weekIndex,
            weekStartDate,
            amount: currentAssignment.weeklyRent
          });
        } else if (isCurrentWeek) {
          currentWeekDue = {
            weekIndex,
            weekStartDate,
            amount: currentAssignment.weeklyRent
          };
        }
      }
    }

    const totalOverdue = overdueWeeks.reduce((sum, week) => sum + week.amount, 0);
    const dueTodayAmount = currentWeekDue ? currentWeekDue.amount : 0;
    const totalDue = totalOverdue + dueTodayAmount;

    return { overdueWeeks, currentWeekDue, totalOverdue, dueTodayAmount, totalDue };
  }, [vehicle, vehicleId, firebasePayments, financialData]);

  const allDueWeeks = React.useMemo(() => {
    const combined = [...rentSummary.overdueWeeks];
    if (rentSummary.currentWeekDue) {
      combined.push(rentSummary.currentWeekDue);
    }
    return combined;
  }, [rentSummary.overdueWeeks, rentSummary.currentWeekDue]);

  const orderedDueWeekIndices = React.useMemo(
    () => allDueWeeks.map(week => week.weekIndex),
    [allDueWeeks]
  );

  const selectedWeeks = React.useMemo(
    () => allDueWeeks.filter(week => selectedWeekIndices.includes(week.weekIndex)),
    [allDueWeeks, selectedWeekIndices]
  );

  const selectedWeekTotal = React.useMemo(
    () => selectedWeeks.reduce((sum, week) => sum + week.amount, 0),
    [selectedWeeks]
  );

  const selectedWeekCount = selectedWeekIndices.length;

  const handleToggleWeekSelection = (weekIndex: number) => {
    const orderedIndices = orderedDueWeekIndices;
    const position = orderedIndices.indexOf(weekIndex);
    if (position === -1) {
      return;
    }

    const isSelected = selectedWeekIndices.includes(weekIndex);

    if (!isSelected) {
      setSelectedWeekIndices(orderedIndices.slice(0, position + 1));
    } else {
      const retained = orderedIndices.slice(0, position);
      setSelectedWeekIndices(retained);
    }
  };

  const handleSelectAllWeeks = () => {
    if (orderedDueWeekIndices.length === 0) {
      setSelectedWeekIndices([]);
      return;
    }
    setSelectedWeekIndices([...orderedDueWeekIndices]);
  };

  React.useEffect(() => {
    if (confirmPaymentDialog && selectedPaymentWeek?.weekIndex === -1) {
      if (orderedDueWeekIndices.length > 0) {
        setSelectedWeekIndices(orderedDueWeekIndices);
      } else {
        setSelectedWeekIndices([]);
      }
    }

    if (!confirmPaymentDialog) {
      setSelectedWeekIndices([]);
    }
  }, [confirmPaymentDialog, orderedDueWeekIndices, selectedPaymentWeek]);

  const handleMarkPaidClick = (weekIndex: number, assignment: any, weekStartDate: Date) => {
    // Check if there are overdue weeks and this is not the oldest overdue
    if (rentSummary.overdueWeeks.length > 0) {
      const oldestOverdueWeek = rentSummary.overdueWeeks[0];
      
      setSelectedPaymentWeek({
        weekIndex,
        assignment,
        weekStartDate,
        willSettleWeek: oldestOverdueWeek.weekIndex
      });
      setConfirmPaymentDialog(true);
    } else {
      // No overdue, proceed directly
      markRentCollected(weekIndex, assignment, weekStartDate);
    }
  };

  const confirmPayment = async () => {
    if (selectedPaymentWeek) {
      // Check if this is bulk payment (weekIndex === -1)
      if (selectedPaymentWeek.weekIndex === -1) {
        const weeksToPay = allDueWeeks.filter(week => selectedWeekIndices.includes(week.weekIndex));

        if (weeksToPay.length === 0) {
          return;
        }

        for (const week of weeksToPay) {
          await markRentCollected(
            week.weekIndex,
            selectedPaymentWeek.assignment,
            week.weekStartDate
          );
          // Small delay between payments for better UX
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } else {
        // Single payment - Always settle the oldest overdue week first
        if (rentSummary.overdueWeeks.length > 0) {
          const oldestOverdueWeek = rentSummary.overdueWeeks[0];
          markRentCollected(
            oldestOverdueWeek.weekIndex,
            selectedPaymentWeek.assignment,
            oldestOverdueWeek.weekStartDate
          );
        } else {
          // No overdue, mark the selected week
          markRentCollected(
            selectedPaymentWeek.weekIndex,
            selectedPaymentWeek.assignment,
            selectedPaymentWeek.weekStartDate
          );
        }
      }
    }
    setConfirmPaymentDialog(false);
    setSelectedPaymentWeek(null);
    setSelectedWeekIndices([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <SectionNumberBadge id="1" label="Weekly Rent Collection" className="mb-2" />
            <h3 className="text-lg font-semibold">Weekly Rent Collection</h3>
          </div>
          <Badge variant="outline">
            Driver: {vehicle.assignedDriverId || 'Not Assigned'}
          </Badge>
        </div>

        {/* Overdue Alert */}
        {vehicle.assignedDriverId && rentSummary.overdueWeeks.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Overdue Rent Payments!</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="font-semibold">
                  {rentSummary.overdueWeeks.length} week{rentSummary.overdueWeeks.length > 1 ? 's' : ''} overdue - 
                  Total: ₹{rentSummary.totalOverdue.toLocaleString()}
                </p>
                <p className="text-xs mt-1">
                  ⚠️ <strong>Important:</strong> Any payment will automatically settle the oldest overdue week first 
                  (Week {rentSummary.overdueWeeks[0].weekIndex + 1} - {rentSummary.overdueWeeks[0].weekStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}).
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Rent Collection Summary */}
        {vehicle.assignedDriverId && (
          <div className="mb-6">
            <SectionNumberBadge id="2" label="Rent Collection Summary" className="mb-2" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-green-50">
                <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {firebasePayments.filter(p => p.vehicleId === vehicleId && p.status === 'paid').length}
                </div>
                <div className="text-sm text-green-700">Weeks Collected</div>
              </CardContent>
              </Card>
              <Card className="bg-blue-50">
                <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{firebasePayments
                    .filter(p => p.vehicleId === vehicleId && p.status === 'paid')
                    .reduce((sum, p) => sum + p.amountPaid, 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">Total Collected</div>
              </CardContent>
              </Card>
              <Card className={`${rentSummary.totalOverdue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${rentSummary.totalOverdue > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  ₹{rentSummary.totalOverdue.toLocaleString()}
                </div>
                <div className={`text-sm ${rentSummary.totalOverdue > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                  Total Overdue
                </div>
              </CardContent>
              </Card>
              <Card className={`${rentSummary.totalDue > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between h-full space-y-2 md:space-y-0">
                  <div className="text-center md:text-left md:flex-1">
                    <div className={`text-2xl font-bold ${rentSummary.totalDue > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                      ₹{rentSummary.totalDue.toLocaleString()}
                    </div>
                    <div className={`text-sm ${rentSummary.totalDue > 0 ? 'text-orange-700' : 'text-gray-700'}`}>
                      Total Due Now
                    </div>
                  </div>
                  {rentSummary.totalDue > 0 && (
                    <div
                      className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm cursor-pointer transition-colors px-4 py-2 md:px-3 md:py-0 md:h-full md:ml-2 rounded-md w-full md:w-auto text-center md:text-left flex items-center justify-center"
                      onClick={() => {
                        // Prepare all weeks to pay (overdue + current week due)
                        const weeksToPay = [...rentSummary.overdueWeeks];
                        if (rentSummary.currentWeekDue) {
                          weeksToPay.push(rentSummary.currentWeekDue);
                        }

                        setSelectedPaymentWeek({
                          weekIndex: -1, // Special flag for bulk payment
                          assignment: financialData.currentAssignment,
                          weekStartDate: new Date(),
                          willSettleWeek: -1
                        });
                        setConfirmPaymentDialog(true);
                      }}
                    >
                      Collect
                    </div>
                  )}
                </div>
              </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ₹{getCurrentAssignmentDetails()?.weeklyRent.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-purple-700">Weekly Rate</div>
              </CardContent>
              </Card>
            </div>
          </div>
        )}

        {vehicle.assignedDriverId ? (
          <div>
            {(() => {
              const currentAssignment = financialData.currentAssignment;
              if (!currentAssignment) {
                return (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500 mb-4">No active assignment found for this vehicle</p>
                    </CardContent>
                  </Card>
                );
              }

              // Calculate assignment dates
              const assignmentStartDate = new Date(
                typeof currentAssignment.startDate === 'string'
                  ? currentAssignment.startDate
                  : currentAssignment.startDate?.toDate?.() || currentAssignment.startDate
              );

              // Calculate end date based on agreement duration (in months)
              const agreementEndDate = new Date(assignmentStartDate);
              agreementEndDate.setMonth(agreementEndDate.getMonth() + (currentAssignment.agreementDuration || 12));

              // Calculate total weeks in assignment
              const totalWeeks = Math.ceil((agreementEndDate.getTime() - assignmentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

              // Get current date for comparison
              const today = new Date();

              return (
                <div>
                  {/* Assignment Info Header */}
                  <Card className="mb-4 bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <SectionNumberBadge id="3" label="Assignment Period" className="mb-2" />
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-blue-900">Assignment Period</h4>
                          <p className="text-sm text-blue-700">
                            {assignmentStartDate.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })} - {agreementEndDate.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">{totalWeeks}</div>
                          <div className="text-sm text-blue-700">Total Weeks</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rent Collection Grid - Based on Assignment Timeline */}
                  <SectionNumberBadge id="4" label="Rent Collection Timeline" className="mb-2" />
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {Array.from({ length: Math.min(totalWeeks, 52) }, (_, weekIndex) => {
                      // Calculate this week's dates based on assignment start date
                      const weekStartDate = new Date(assignmentStartDate);
                      weekStartDate.setDate(weekStartDate.getDate() + (weekIndex * 7));
                      weekStartDate.setHours(0, 0, 0, 0);

                      const weekEndDate = new Date(weekStartDate);
                      weekEndDate.setDate(weekEndDate.getDate() + 6);
                      weekEndDate.setHours(23, 59, 59, 999);

                      // Determine week status relative to today
                      const isPastWeek = weekEndDate < today;
                      const isCurrentWeek = weekStartDate <= today && today <= weekEndDate;
                      const isFutureWeek = weekStartDate > today;
                      const isUpcoming = isFutureWeek && weekStartDate <= new Date(today.getTime() + (5 * 7 * 24 * 60 * 60 * 1000));

                      // Check if rent was actually collected for this week from the database
                      const weekRentPayment = firebasePayments.find(payment => {
                        if (payment.vehicleId !== vehicleId || payment.status !== 'paid') return false;
                        const paymentWeekStart = new Date(payment.weekStart);
                        // More precise matching - check if payment week matches this assignment week
                        return Math.abs(paymentWeekStart.getTime() - weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
                      });

                      let bgColor = 'bg-gray-100';
                      let textColor = 'text-gray-600';
                      let icon = <Clock className="h-4 w-4" />;
                      let status = '';

                      if (isPastWeek) {
                        if (weekRentPayment) {
                          bgColor = 'bg-green-100';
                          textColor = 'text-green-700';
                          icon = <CheckCircle className="h-4 w-4" />;
                          status = 'Collected';
                        } else {
                          bgColor = 'bg-red-100';
                          textColor = 'text-red-700';
                          icon = <AlertCircle className="h-4 w-4" />;
                          status = 'Overdue';
                        }
                      } else if (isCurrentWeek) {
                        if (weekRentPayment) {
                          bgColor = 'bg-green-100';
                          textColor = 'text-green-700';
                          icon = <CheckCircle className="h-4 w-4" />;
                          status = 'Collected';
                        } else {
                          bgColor = 'bg-yellow-100';
                          textColor = 'text-yellow-700';
                          icon = <DollarSign className="h-4 w-4" />;
                          status = 'Due Now';
                        }
                      } else if (isUpcoming) {
                        bgColor = 'bg-blue-100';
                        textColor = 'text-blue-700';
                        icon = <Calendar className="h-4 w-4" />;
                        const daysUntil = Math.ceil((weekStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        status = `${daysUntil} days`;
                      }

                      // Determine if payment can be made (current week or overdue)
                      const canMarkPaid = !weekRentPayment && (isCurrentWeek || isPastWeek);

                      return (
                        <Card
                          key={weekIndex}
                          className={`${bgColor} transition-shadow`}
                        >
                          <CardContent className="p-3 text-center">
                            <div className={`${textColor} mb-1`}>
                              {icon}
                            </div>
                            <div className={`text-sm font-medium ${textColor}`}>
                              Week {weekIndex + 1}
                            </div>
                            <div className={`text-xs ${textColor}`}>
                              {weekStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                            {status && (
                              <div className={`text-xs ${textColor} mt-1`}>
                                {status}
                              </div>
                            )}
                            {weekRentPayment ? (
                              <div className="mt-1">
                                <div className={`text-xs ${textColor} font-semibold`}>
                                  ₹{weekRentPayment.amountPaid.toLocaleString()}
                                </div>
                                {(() => {
                                  const paidAt = new Date(weekRentPayment.paidAt || weekRentPayment.createdAt);
                                  const hoursSincePayment = (new Date().getTime() - paidAt.getTime()) / (1000 * 60 * 60);
                                  const canReverse = hoursSincePayment <= 24 && userInfo?.role !== Role.PARTNER;
                                  return canReverse ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs py-1 px-2 h-6 w-full mt-1 text-red-600 border-red-300 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReverseDialog({ open: true, weekIndex, assignment: currentAssignment, weekStartDate });
                                      }}
                                    >
                                      Reverse
                                    </Button>
                                  ) : null;
                                })()}
                              </div>
                            ) : canMarkPaid && userInfo?.role !== Role.PARTNER ? (
                              <Button
                                size="sm"
                                className="text-xs py-1 px-2 h-6 w-full mt-2"
                                disabled={isProcessingRentPayment === weekIndex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkPaidClick(weekIndex, currentAssignment, weekStartDate);
                                }}
                              >
                                {isProcessingRentPayment === weekIndex ? 'Processing...' : 'Mark Collected'}
                              </Button>
                            ) : canMarkPaid && userInfo?.role === Role.PARTNER ? null : (
                              <div className={`text-xs ${textColor} mt-1`}>
                                ₹{currentAssignment.weeklyRent.toLocaleString()}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {totalWeeks > 52 && (
                    <Card className="mt-4 bg-orange-50 border-orange-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-orange-700">
                          Assignment has {totalWeeks} weeks. Showing first 52 weeks.
                          <br />
                          <span className="text-sm">Complete assignment: {agreementEndDate.toLocaleDateString('en-IN')}</span>
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No driver assigned to this vehicle</p>
              {userInfo?.role !== Role.PARTNER && (
                <Button>Assign Driver</Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={confirmPaymentDialog} onOpenChange={setConfirmPaymentDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[75vh] overflow-y-auto">
          <AlertDialogHeader>
            <SectionNumberBadge id="5" label="Overdue Payment Settlement" className="mb-2" />
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Overdue Payment Settlement
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {selectedPaymentWeek && rentSummary.overdueWeeks.length > 0 && (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="font-semibold text-red-800">
                      ⚠️ You have {rentSummary.overdueWeeks.length} overdue week{rentSummary.overdueWeeks.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Total Overdue: ₹{rentSummary.totalOverdue.toLocaleString()}
                    </p>
                  </div>

                  {selectedPaymentWeek.weekIndex === -1 ? (
                    // Bulk payment dialog
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <p className="font-semibold text-green-800 mb-1">
                          Pay Due Weeks
                        </p>
                        <p className="text-xs text-green-700">
                          Select consecutive weeks starting from the oldest overdue entry. Older weeks stay locked in order.
                        </p>
                        {allDueWeeks.length === 0 ? (
                          <div className="mt-3 bg-white border border-dashed border-green-300 rounded p-3 text-sm text-green-700">
                            All rent collections are up to date. There is nothing pending right now.
                          </div>
                        ) : (
                          <div className="mt-3 border border-green-200 rounded">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-green-200 bg-white text-xs text-green-700">
                              <span>Selected: {selectedWeekCount} of {allDueWeeks.length}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs border-green-200 text-green-700"
                                onClick={handleSelectAllWeeks}
                                disabled={selectedWeekCount === orderedDueWeekIndices.length}
                              >
                                Select All
                              </Button>
                            </div>
                            <div className="max-h-40 overflow-y-auto divide-y divide-green-100 bg-white">
                              {allDueWeeks.map((week) => {
                                const isSelected = selectedWeekIndices.includes(week.weekIndex);
                                const checkboxId = `bulk-week-${week.weekIndex}`;

                                return (
                                  <label
                                    key={week.weekIndex}
                                    htmlFor={checkboxId}
                                    className={`flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-green-50' : ''}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={checkboxId}
                                        checked={isSelected}
                                        onCheckedChange={() => handleToggleWeekSelection(week.weekIndex)}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium text-green-900">Week {week.weekIndex + 1}</span>
                                        <span className="text-xs text-gray-500">
                                          Start {week.weekStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">
                                      ₹{week.amount.toLocaleString()}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between text-sm font-semibold text-green-900">
                          <span>Selected Amount</span>
                          <span>₹{selectedWeekTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-xs text-yellow-700">
                          <strong>Note:</strong> Selected weeks will be collected sequentially from oldest to newest. Unselecting a week clears all newer selections to keep the order intact.
                        </p>
                      </div>
                    </>
                  ) : (
                    // Single payment dialog
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="font-semibold text-blue-800">
                          Payment Settlement Order:
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                          This payment of <strong>₹{getCurrentAssignmentDetails()?.weeklyRent.toLocaleString()}</strong> will be settled for:
                        </p>
                        <div className="mt-2 bg-white border border-blue-300 rounded p-2">
                          <p className="font-semibold text-blue-900">
                            Week {rentSummary.overdueWeeks[0].weekIndex + 1}
                          </p>
                          <p className="text-xs text-blue-600">
                            Due Date: {rentSummary.overdueWeeks[0].weekStartDate.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <Badge variant="destructive" className="mt-1 text-xs">
                            Oldest Overdue
                          </Badge>
                        </div>
                      </div>

                      {rentSummary.overdueWeeks.length > 1 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <p className="text-xs text-yellow-700">
                            <strong>Note:</strong> After this payment, you will still have {rentSummary.overdueWeeks.length - 1} overdue week{rentSummary.overdueWeeks.length - 1 > 1 ? 's' : ''} remaining 
                            (₹{(rentSummary.totalOverdue - (getCurrentAssignmentDetails()?.weeklyRent || 0)).toLocaleString()}).
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <p className="text-sm text-gray-600 mt-2">
                    Do you want to proceed with this payment?
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPayment}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={selectedPaymentWeek?.weekIndex === -1 && selectedWeekCount === 0}
            >
              {selectedPaymentWeek?.weekIndex === -1 && selectedWeekCount > 0
                ? `Collect ${selectedWeekCount} Week${selectedWeekCount > 1 ? 's' : ''}`
                : 'Confirm Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rent Reverse Confirmation Dialog */}
      <AlertDialog open={reverseDialog.open} onOpenChange={(open) => setReverseDialog({ open, weekIndex: -1, assignment: null, weekStartDate: new Date() })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Rent Payment Reversal
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to reverse the rent collection for <strong>Week {reverseDialog.weekIndex + 1}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">
                    <strong>Warning:</strong> This action will:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 space-y-1">
                    <li>• Mark the rent as unpaid</li>
                    <li>• Mark the payment record as reversed</li>
                    <li>• Decrease cash in hand by ₹{(() => {
                      const payment = firebasePayments.find(p => {
                        if (p.vehicleId !== vehicleId || p.status !== 'paid') return false;
                        const paymentWeekStart = new Date(p.weekStart);
                        return Math.abs(paymentWeekStart.getTime() - reverseDialog.weekStartDate.getTime()) < (24 * 60 * 60 * 1000);
                      });
                      return payment ? payment.amountPaid.toLocaleString() : '0';
                    })()}</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  This action can only be performed within 24 hours of the original payment.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reverseDialog.assignment && reverseDialog.weekStartDate) {
                  reverseRentPayment(reverseDialog.weekIndex, reverseDialog.assignment, reverseDialog.weekStartDate);
                }
                setReverseDialog({ open: false, weekIndex: -1, assignment: null, weekStartDate: new Date() });
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