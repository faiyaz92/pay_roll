import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { Vehicle } from '@/types/user';
import { VehicleFinancialData, Payment } from '@/hooks/useFirebaseData';

interface RentTabProps {
  vehicle: Vehicle;
  vehicleId: string;
  firebasePayments: Payment[];
  financialData: VehicleFinancialData;
  getCurrentAssignmentDetails: () => any;
  markRentCollected: (weekIndex: number, assignment: any, weekStartDate: Date) => void;
  isProcessingRentPayment: number | null;
}

export const RentTab: React.FC<RentTabProps> = ({
  vehicle,
  vehicleId,
  firebasePayments,
  financialData,
  getCurrentAssignmentDetails,
  markRentCollected,
  isProcessingRentPayment
}) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Weekly Rent Collection</h3>
          <Badge variant="outline">
            Driver: {vehicle.assignedDriverId || 'Not Assigned'}
          </Badge>
        </div>

        {/* Rent Collection Summary */}
        {vehicle.assignedDriverId && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <Card className="bg-yellow-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  ₹{getCurrentAssignmentDetails()?.weeklyRent.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-yellow-700">Weekly Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(((getCurrentAssignmentDetails()?.weeklyRent || 0) * 52) / 12).toLocaleString()}
                </div>
                <div className="text-sm text-purple-700">Est. Monthly</div>
              </CardContent>
            </Card>
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
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
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
                              <div className={`text-xs ${textColor} mt-1 font-semibold`}>
                                ₹{weekRentPayment.amountPaid.toLocaleString()}
                              </div>
                            ) : canMarkPaid ? (
                              <Button
                                size="sm"
                                className="text-xs py-1 px-2 h-6 w-full mt-2"
                                disabled={isProcessingRentPayment === weekIndex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markRentCollected(weekIndex, currentAssignment, weekStartDate);
                                }}
                              >
                                {isProcessingRentPayment === weekIndex ? 'Processing...' : 'Mark Paid'}
                              </Button>
                            ) : (
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
              <Button>Assign Driver</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};