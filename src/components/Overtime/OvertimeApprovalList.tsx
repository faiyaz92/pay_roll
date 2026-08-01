/**
 * Overtime Approval List Component
 * For HR/Admin to approve/reject overtime requests
 */

import { useEffect, useState } from 'react';
import { Check, X, Clock, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOvertimeStore, OVERTIME_RATES } from '@/stores/overtime/overtime.store';
import { useAuthStore } from '@/stores/auth/auth.store';
import type { OvertimeLog } from '@/types/attendance';

interface OvertimeApprovalListProps {
  companyId: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export const OvertimeApprovalList = ({
  companyId,
  status = 'pending',
}: OvertimeApprovalListProps) => {
  const { overtimeLogs, getCompanyLogs, approveLog, rejectLog, loading } = useOvertimeStore();
  const { user } = useAuthStore();
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    getCompanyLogs(companyId, status);
  }, [companyId, status, getCompanyLogs]);

  const handleApprove = async (overtimeId: string) => {
    if (!user?.uid) return;
    setProcessingId(overtimeId);
    try {
      await approveLog(overtimeId, user.uid);
      // Refresh list
      await getCompanyLogs(companyId, status);
    } catch (error) {
      console.error('Failed to approve overtime:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (overtimeId: string) => {
    if (!user?.uid) return;
    setProcessingId(overtimeId);
    try {
      await rejectLog(overtimeId, user.uid);
      // Refresh list
      await getCompanyLogs(companyId, status);
    } catch (error) {
      console.error('Failed to reject overtime:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (log: OvertimeLog) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    } as const;

    return (
      <Badge variant={variants[log.status]}>
        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
      </Badge>
    );
  };

  const getRateTypeLabel = (rateType: string) => {
    const labels = {
      regular: `Regular (${OVERTIME_RATES.regular}x)`,
      weekend: `Weekend (${OVERTIME_RATES.weekend}x)`,
      holiday: `Holiday (${OVERTIME_RATES.holiday}x)`,
    };
    return labels[rateType as keyof typeof labels] || rateType;
  };

  if (loading && overtimeLogs.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Overtime Approvals</CardTitle>
            <CardDescription>
              {status === 'pending' && 'Review and approve overtime requests'}
              {status === 'approved' && 'Approved overtime records'}
              {status === 'rejected' && 'Rejected overtime requests'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg">
            {overtimeLogs.length} {status === 'pending' ? 'Pending' : 'Records'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {overtimeLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {status} overtime records
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Rate Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                {status === 'pending' && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {overtimeLogs.map((log) => (
                <TableRow key={log.overtimeId}>
                  <TableCell className="font-medium">{log.employeeId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {log.date.toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {log.hours.toFixed(1)}h
                    </div>
                  </TableCell>
                  <TableCell>{getRateTypeLabel(log.rateType)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-semibold text-green-600">
                      <DollarSign className="h-4 w-4" />
                      {log.amount.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(log)}</TableCell>
                  {status === 'pending' && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(log.overtimeId)}
                          disabled={processingId === log.overtimeId}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(log.overtimeId)}
                          disabled={processingId === log.overtimeId}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
