/**
 * Team Attendance List
 * Per-employee attendance for a selected day — status (present / half day /
 * absent / late), check-in/check-out times, and hours worked. This is the
 * HR-facing view of "who worked how much today".
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';
import { getEmployeesByCompany } from '@/useCases/employeeUseCases';
import { getEmployeeAttendance, deleteTodayAttendance } from '@/useCases/attendanceUseCases';
import type { Employee } from '@/types/employee';
import type { AttendanceRecord } from '@/types/attendance';

interface TeamAttendanceListProps {
  companyId: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const STATUS_LABEL: Record<string, string> = {
  present: 'Full Day',
  half_day: 'Half Day',
  late: 'Late',
  absent: 'Absent',
  on_leave: 'On Leave',
  weekend: 'Weekend',
  holiday: 'Holiday',
  work_from_home: 'WFH',
};

const STATUS_STYLE: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  half_day: 'bg-amber-100 text-amber-700 border-amber-300',
  late: 'bg-amber-100 text-amber-700 border-amber-300',
  absent: 'bg-rose-100 text-rose-700 border-rose-300',
  on_leave: 'bg-blue-100 text-blue-700 border-blue-300',
  weekend: 'bg-slate-100 text-slate-600 border-slate-300',
  holiday: 'bg-slate-100 text-slate-600 border-slate-300',
  work_from_home: 'bg-purple-100 text-purple-700 border-purple-300',
};

const formatTime = (value?: Date) =>
  value ? value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

export const TeamAttendanceList = ({ companyId }: TeamAttendanceListProps) => {
  const [date, setDate] = useState(todayISO());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const isToday = date === todayISO();

  const loadData = () => {
    setLoading(true);
    const selectedDate = new Date(`${date}T00:00:00`);

    return Promise.all([
      getEmployeesByCompany(companyId),
      getEmployeeAttendance({ companyId, dateFrom: selectedDate, dateTo: selectedDate }),
    ])
      .then(([emps, recs]) => {
        setEmployees(emps.filter((e) => e.status === 'active'));
        setRecords(recs);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, date]);

  const handleReset = async (employeeId: string) => {
    setResettingId(employeeId);
    try {
      await deleteTodayAttendance(employeeId);
      toast.success("Today's attendance cleared for this employee.");
      await loadData();
    } catch (err) {
      console.error('Failed to reset attendance:', err);
      toast.error('Failed to reset attendance');
    } finally {
      setResettingId(null);
    }
  };

  const recordByEmployee = new Map(records.map((r) => [r.employeeId, r]));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Team Attendance</CardTitle>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="w-40" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No employees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Employee</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Check In</th>
                  <th className="py-2 pr-4">Check Out</th>
                  <th className="py-2 pr-4">Hours</th>
                  {isToday && <th className="py-2 pr-4" />}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const record = recordByEmployee.get(emp.employeeId);
                  const status = record?.status ?? 'absent';
                  return (
                    <tr key={emp.employeeId} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{emp.personal?.fullName}</div>
                        <div className="text-xs text-muted-foreground">{emp.employment?.designation}</div>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className={STATUS_STYLE[status] ?? ''}>
                          {STATUS_LABEL[status] ?? status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{formatTime(record?.checkIn as unknown as Date)}</td>
                      <td className="py-2 pr-4">{formatTime(record?.checkOut as unknown as Date)}</td>
                      <td className="py-2 pr-4">{record?.workHours !== undefined ? `${record.workHours.toFixed(1)}h` : '—'}</td>
                      {isToday && (
                        <td className="py-2 pr-4">
                          {record && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                              disabled={resettingId === emp.employeeId}
                              onClick={() => handleReset(emp.employeeId)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reset
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
