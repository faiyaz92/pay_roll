/**
 * Attendance Calendar Component
 * Monthly calendar view with attendance status indicators
 */

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAttendanceStore } from '@/stores/attendance/attendance.store';
import type { AttendanceRecord, AttendanceStatus } from '@/types/attendance';

interface AttendanceCalendarProps {
  employeeId: string;
  month: string; // YYYY-MM format
  onDateSelect?: (date: Date, record?: AttendanceRecord) => void;
}

const statusColors: Record<AttendanceStatus, string> = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  late: 'bg-yellow-500',
  half_day: 'bg-orange-500',
  on_leave: 'bg-blue-500',
  weekend: 'bg-gray-400',
  holiday: 'bg-purple-500',
  work_from_home: 'bg-teal-500',
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: 'attendance.status.present',
  absent: 'attendance.status.absent',
  late: 'attendance.status.late',
  half_day: 'attendance.status.halfDay',
  on_leave: 'attendance.status.onLeave',
  weekend: 'attendance.status.weekend',
  holiday: 'attendance.status.holiday',
  work_from_home: 'attendance.status.wfh',
};

export const AttendanceCalendar = ({
  employeeId,
  month,
  onDateSelect,
}: AttendanceCalendarProps) => {
  const { attendanceRecords, getEmployeeRecords, loading } = useAttendanceStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    getEmployeeRecords({
      employeeId,
      dateFrom: startDate,
      dateTo: endDate,
    });
  }, [employeeId, month, getEmployeeRecords]);

  const [year, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const recordsByDate = new Map<string, AttendanceRecord>();
  attendanceRecords.forEach(record => {
    const dateKey = record.date.toISOString().split('T')[0];
    recordsByDate.set(dateKey, record);
  });

  const handleDateClick = (day: number) => {
    const date = new Date(year, monthNum - 1, day);
    const dateKey = date.toISOString().split('T')[0];
    const record = recordsByDate.get(dateKey);
    
    setSelectedDate(date);
    onDateSelect?.(date, record);
  };

  const getDayClass = (day: number) => {
    const date = new Date(year, monthNum - 1, day);
    const dateKey = date.toISOString().split('T')[0];
    const record = recordsByDate.get(dateKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let classes = 'w-full aspect-square flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all hover:ring-2 hover:ring-primary';

    if (date.getTime() === today.getTime()) {
      classes += ' ring-2 ring-primary';
    }

    if (selectedDate && date.getTime() === selectedDate.getTime()) {
      classes += ' bg-primary/10';
    }

    return classes;
  };

  const getDayContent = (day: number) => {
    const date = new Date(year, monthNum - 1, day);
    const dateKey = date.toISOString().split('T')[0];
    const record = recordsByDate.get(dateKey);

    return (
      <div className={getDayClass(day)} onClick={() => handleDateClick(day)}>
        <span className="text-sm font-medium">{day}</span>
        {record && (
          <div className="mt-1 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${statusColors[record.status]}`} />
            {record.checkIn && record.checkOut && (
              <Clock className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {new Date(year, monthNum - 1).toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </CardTitle>
            <CardDescription>Monthly attendance calendar</CardDescription>
          </div>
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => (
                <div key={i + 1}>{getDayContent(i + 1)}</div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Status Legend</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(statusColors).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-xs text-muted-foreground">
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
