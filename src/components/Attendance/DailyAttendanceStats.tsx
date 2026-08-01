/**
 * Daily Attendance Stats Card
 * Shows real-time attendance statistics for a specific day
 */

import { useEffect } from 'react';
import { Users, UserCheck, UserX, Clock, Home, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAttendanceStore } from '@/stores/attendance/attendance.store';

interface DailyAttendanceStatsProps {
  companyId: string;
  date: Date;
  officeId?: string;
}

export const DailyAttendanceStats = ({
  companyId,
  date,
  officeId,
}: DailyAttendanceStatsProps) => {
  const { dailyStats, getDailyStats, loading } = useAttendanceStore();

  useEffect(() => {
    getDailyStats(companyId, date, officeId);
  }, [companyId, date, officeId, getDailyStats]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!dailyStats) {
    return null;
  }

  const stats = [
    {
      label: 'Total Employees',
      value: dailyStats.totalEmployees,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Present',
      value: dailyStats.present,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Absent',
      value: dailyStats.absent,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      label: 'Late',
      value: dailyStats.late,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'On Leave',
      value: dailyStats.onLeave,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Work From Home',
      value: dailyStats.wfh,
      icon: Home,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
  ];

  const attendanceRate = dailyStats.totalEmployees > 0
    ? Math.round((dailyStats.present / dailyStats.totalEmployees) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Attendance</CardTitle>
        <CardDescription>
          {date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Attendance Rate</span>
            <span className="text-2xl font-bold">{attendanceRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full transition-all"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {dailyStats.notCheckedIn > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <span className="font-semibold">{dailyStats.notCheckedIn}</span> employees haven't checked in yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
