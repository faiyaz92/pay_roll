import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { History } from 'lucide-react';
import { useAssignments } from '@/hooks/useFirebaseData';
import { useNavigate } from 'react-router-dom';
import { SectionNumberBadge } from './SectionNumberBadge';

interface AssignmentsTabProps {
  vehicleId: string;
  getDriverName: (driverId: string) => string;
}

export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({ vehicleId, getDriverName }) => {
  const navigate = useNavigate();
  const { assignments, loading } = useAssignments();

  // Filter assignments for this vehicle
  const vehicleAssignments = assignments.filter(assignment => assignment.vehicleId === vehicleId);

  if (loading) {
    return <div className="flex justify-center py-8">Loading assignment history...</div>;
  }

  if (vehicleAssignments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <SectionNumberBadge id="1" label="Assignment History" className="mb-4" />
          <History className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignment History</h3>
          <p className="text-gray-500 text-center">
            This vehicle has not been assigned to any driver yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <SectionNumberBadge id="1" label="Assignment History" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Assignment History ({vehicleAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehicleAssignments.map((assignment, index) => {
              const startDate = new Date(assignment.startDate);
              const endDate = assignment.endDate ? new Date(assignment.endDate) : null;
              const monthlyRent = (assignment.weeklyRent * 52) / 12;

              return (
                <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={
                          assignment.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : assignment.status === 'ended'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                        {index === 0 && assignment.status === 'active' && (
                          <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-gray-500">Driver</Label>
                          <p className="font-medium">{getDriverName(assignment.driverId)}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Start Date</Label>
                          <p className="font-medium">{startDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">End Date</Label>
                          <p className="font-medium">{endDate ? endDate.toLocaleDateString() : 'Ongoing'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Duration</Label>
                          <p className="font-medium">
                            {endDate
                              ? `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                              : `${Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days (ongoing)`
                            }
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <Label className="text-gray-500">Daily Rent</Label>
                          <p className="font-medium">₹{assignment.dailyRent.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Weekly Rent</Label>
                          <p className="font-medium">₹{assignment.weeklyRent.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Monthly Rent</Label>
                          <p className="font-medium">₹{monthlyRent.toFixed(0).toLocaleString()}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Collection Day</Label>
                          <p className="font-medium">
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][assignment.collectionDay]}
                          </p>
                        </div>
                      </div>

                      {assignment.initialOdometer && (
                        <div className="mt-3 text-sm">
                          <Label className="text-gray-500">Initial Odometer</Label>
                          <p className="font-medium">{assignment.initialOdometer.toLocaleString()} km</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/drivers/${assignment.driverId}`)}
                      >
                        View Driver
                      </Button>
                      {assignment.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/assignments/${assignment.id}`)}
                        >
                          Manage
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div>
        <SectionNumberBadge id="2" label="Assignment Summary Metrics" className="mb-2" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {vehicleAssignments.filter(a => a.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Assignments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {vehicleAssignments.filter(a => a.status === 'ended').length}
              </div>
              <div className="text-sm text-gray-600">Completed Assignments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                ₹{vehicleAssignments
                  .filter(a => a.status === 'active')
                  .reduce((sum, a) => sum + ((a.weeklyRent * 52) / 12), 0)
                  .toFixed(0)
                  .toLocaleString()
                }
              </div>
              <div className="text-sm text-gray-600">Monthly Revenue</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};