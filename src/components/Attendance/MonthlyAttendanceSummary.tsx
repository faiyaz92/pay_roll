/**
 * Monthly Attendance Summary Component
 * Displays attendance statistics for a month
 */

import { useEffect } from 'react';
import { Calendar, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAttendanceStore } from '@/stores/attendance/attendance.store';

interface MonthlyAttendanceSummaryProps {
  employeeId: string;
  month: string; // YYYY-MM format
}

export const MonthlyAttendanceSummary = ({
  employeeId,
  month,
}: MonthlyAttendanceSummaryProps) => {
  const { monthlySummary, getMonthlySummary, loading } = useAttendanceStore();

  useEffect(() => {
    getMonthlySummary(employeeId, month);
  }, [employeeId, month, getMonthlySummary]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!monthlySummary) {
    return null;
  }

  const workingDays = monthlySummary.totalDays - monthlySummary.weekendDays - monthlySummary.holidayDays;
  const attendanceRate = workingDays > 0
    ? Math.round((monthlySummary.presentDays / workingDays) * 100)
    : 0;

  const stats = [
    {
      label: 'Total Days',
      value: monthlySummary.totalDays,
      color: 'text-blue-600',
    },
    {
      label: 'Present',
      value: monthlySummary.presentDays,
      color: 'text-green-600',
    },
    {
      label: 'Absent',
      value: monthlySummary.absentDays,
      color: 'text-red-600',
    },
    {
      label: 'Late',
      value: monthlySummary.lateDays,
      color: 'text-yellow-600',
    },
    {
      label: 'Leave',
      value: monthlySummary.leaveDays,
      color: 'text-purple-600',
    },
    {
      label: 'Half Day',
      value: monthlySummary.halfDays,
      color: 'text-orange-600',
    },
    {
      label: 'WFH',
      value: monthlySummary.wfhDays,
      color: 'text-teal-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>
              {new Date(month + '-01').toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </CardDescription>
          </div>
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Attendance Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Attendance Rate</span>
            <span className="text-2xl font-bold">{attendanceRate}%</span>
          </div>
          <Progress value={attendanceRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {monthlySummary.presentDays} out of {workingDays} working days
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Work Hours */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Work Hours</span>
            </div>
            <span className="text-lg font-bold">{monthlySummary.totalWorkHours.toFixed(1)}h</span>
          </div>

          {monthlySummary.totalOvertimeHours > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Overtime Hours</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {monthlySummary.totalOvertimeHours.toFixed(1)}h
              </span>
            </div>
          )}

          {monthlySummary.totalLateMinutes > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Total Late Time</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">
                {Math.round(monthlySummary.totalLateMinutes)} min
              </span>
            </div>
          )}
        </div>

        {/* Warnings */}
        {attendanceRate < 80 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Attendance rate is below 80%. Please maintain regular attendance.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
