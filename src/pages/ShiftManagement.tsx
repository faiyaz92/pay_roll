import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Users, Building2 } from 'lucide-react';
import { INITIAL_SHIFTS, type ShiftSchedule } from '@/useCases/leavePolicyUseCases';

const ShiftManagement = () => {
  const [shifts] = useState<ShiftSchedule[]>(INITIAL_SHIFTS);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Work Shifts & Roster Scheduling</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Shift Roster
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Configure working hours, break durations, and office assignment rosters.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Configured Work Shifts</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Daily working hours applied to employee attendance geo-fencing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shifts.map((shift) => (
                <div
                  key={shift.shiftId}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-base">{shift.shiftName}</h4>
                    <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-xs">
                      {shift.activeEmployeesCount} Employees
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500">
                    Hours: <strong className="text-slate-800 font-mono">{shift.startTime} - {shift.endTime}</strong> ({shift.breakDurationMinutes} mins break)
                  </p>

                  <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {shift.assignedOffice}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShiftManagement;
