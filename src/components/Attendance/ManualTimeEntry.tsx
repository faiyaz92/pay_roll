/**
 * Manual Time Entry
 * Lets an employee log their own check-in/check-out time by hand for a
 * given day, for when GPS check-in wasn't used.
 */

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { submitManualAttendance } from '@/useCases/attendanceUseCases';

interface ManualTimeEntryProps {
  employeeId: string;
  companyId: string;
  officeId: string;
  onSuccess?: () => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export const ManualTimeEntry = ({ employeeId, companyId, officeId, onSuccess }: ManualTimeEntryProps) => {
  const [date, setDate] = useState(todayISO());
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('18:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInTime) {
      toast.error('Check-in time is required');
      return;
    }

    setSubmitting(true);
    try {
      await submitManualAttendance(
        employeeId,
        companyId,
        officeId,
        new Date(`${date}T00:00:00`),
        checkInTime,
        checkOutTime,
        notes,
        employeeId
      );
      toast.success('Time logged successfully');
      onSuccess?.();
    } catch (err) {
      console.error('Manual time entry failed:', err);
      toast.error('Failed to log time');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Log Time Manually
        </CardTitle>
        <CardDescription>Didn't use GPS check-in? Enter your hours for a day here.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div className="col-span-2 md:col-span-1">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <Label className="text-xs">Check In</Label>
            <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} required />
          </div>
          <div>
            <Label className="text-xs">Check Out</Label>
            <Input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
          <div className="col-span-2 md:col-span-4">
            <Label className="text-xs">Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. worked from home" />
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
