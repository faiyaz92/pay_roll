/**
 * Attendance Page
 * Main attendance tracking interface with calendar and check-in/out
 */

import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceCalendar } from '@/components/Attendance/AttendanceCalendar';
import { CheckInOutWidget } from '@/components/Attendance/CheckInOutWidget';
import { ManualTimeEntry } from '@/components/Attendance/ManualTimeEntry';
import { MonthlyAttendanceSummary } from '@/components/Attendance/MonthlyAttendanceSummary';
import { DailyAttendanceStats } from '@/components/Attendance/DailyAttendanceStats';
import { TeamAttendanceList } from '@/components/Attendance/TeamAttendanceList';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import type { AttendanceRecord } from '@/types/attendance';

export default function AttendancePage() {
  const { userInfo, employeeInfo } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleDateSelect = (date: Date, record?: AttendanceRecord) => {
    setSelectedDate(date);
    setSelectedRecord(record || null);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1);
    
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }

    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const employeeId = employeeInfo?.employeeId;
  const companyId = userInfo?.companyId;
  const officeId = employeeInfo?.employment?.officeId;
  const hasEmployeeProfile = Boolean(employeeId && officeId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Track and manage attendance records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="my-attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-attendance">My Attendance</TabsTrigger>
          <TabsTrigger value="team-attendance">Team Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="my-attendance" className="space-y-6">
          {!hasEmployeeProfile ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-center text-sm text-muted-foreground">
                No employee profile is linked to your account, so personal attendance isn't available. Use the Team Attendance tab instead.
              </CardContent>
            </Card>
          ) : (
            <>
          {/* Check-in/out Widget and Today's Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CheckInOutWidget
                key={`checkin-${refreshKey}`}
                employeeId={employeeId!}
                officeId={officeId!}
                onSuccess={() => setRefreshKey((k) => k + 1)}
              />
            </div>
            <div className="lg:col-span-2">
              <MonthlyAttendanceSummary
                key={`summary-${refreshKey}`}
                employeeId={employeeId!}
                month={currentMonth}
              />
            </div>
          </div>

          {/* Manual Time Entry */}
          {companyId && (
            <ManualTimeEntry
              employeeId={employeeId!}
              companyId={companyId}
              officeId={officeId!}
              onSuccess={() => setRefreshKey((k) => k + 1)}
            />
          )}

          {/* Calendar View */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Attendance Calendar</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMonthChange('prev')}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMonthChange('next')}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <AttendanceCalendar
                key={`calendar-${refreshKey}`}
                employeeId={employeeId!}
                month={currentMonth}
                onDateSelect={handleDateSelect}
              />
            </div>
          </div>
            </>
          )}

          {/* Selected Date Details */}
          {selectedRecord && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Attendance Details - {selectedDate.toLocaleDateString()}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">
                      {selectedRecord.status.replace('_', ' ')}
                    </p>
                  </div>
                  {selectedRecord.checkIn && (
                    <div>
                      <p className="text-sm text-muted-foreground">Check In</p>
                      <p className="font-medium">
                        {selectedRecord.checkIn.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  {selectedRecord.checkOut && (
                    <div>
                      <p className="text-sm text-muted-foreground">Check Out</p>
                      <p className="font-medium">
                        {selectedRecord.checkOut.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  {selectedRecord.workHours !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Work Hours</p>
                      <p className="font-medium">{selectedRecord.workHours.toFixed(2)}h</p>
                    </div>
                  )}
                </div>
                {selectedRecord.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedRecord.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team-attendance" className="space-y-6">
          {/* Daily Stats for Managers/HR — scoped by company only, since
              per-office assignment data isn't populated yet in the MVP. */}
          {companyId && (
            <>
              <DailyAttendanceStats
                companyId={companyId}
                date={new Date()}
              />
              <TeamAttendanceList companyId={companyId} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
