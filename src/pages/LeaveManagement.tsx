import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  CalendarDays,
  Check,
  X,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  getLeaveBalance,
  getLeaveRequests,
  submitLeaveRequest,
  updateLeaveStatus,
  type LeaveBalance,
  type LeaveRequest,
} from '@/useCases/leaveUseCases';
import { Role } from '@/types/user';

const LeaveManagement = () => {
  const { userInfo } = useAuth();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Apply Form State
  const [leaveType, setLeaveType] = useState<'annual' | 'sick' | 'casual'>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState('');

  const isApprover = userInfo?.role === Role.HR_MANAGER || userInfo?.role === Role.COMPANY_ADMIN || userInfo?.role === Role.SUPER_ADMIN;

  const loadData = async () => {
    if (!userInfo?.companyId) return;

    if (userInfo.employeeId) {
      const bal = await getLeaveBalance(userInfo.employeeId);
      setBalance(bal);
    }

    // Employees see only their own requests; HR/Admin see the whole company.
    const scopedEmployeeId = isApprover ? undefined : userInfo.employeeId;
    const reqs = await getLeaveRequests(userInfo.companyId, scopedEmployeeId);
    setRequests(reqs);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.companyId, userInfo?.employeeId]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    if (!userInfo?.employeeId || !userInfo.companyId) {
      toast.error('No employee profile linked to your account — contact HR.');
      return;
    }

    try {
      await submitLeaveRequest(
        userInfo.employeeId,
        userInfo.displayName,
        userInfo.companyId,
        leaveType,
        startDate,
        endDate,
        Number(days),
        reason || 'Personal leave'
      );

      toast.success('Leave request submitted successfully!');
      setShowApplyModal(false);
      loadData();
    } catch (err) {
      toast.error('Failed to submit leave request');
    }
  };

  const handleStatusChange = async (leaveId: string, status: 'approved' | 'rejected') => {
    if (!isApprover || !userInfo) return;
    try {
      await updateLeaveStatus(leaveId, status, userInfo.displayName);
      toast.success(`Leave request ${status}!`);
      loadData();
    } catch (err) {
      toast.error('Failed to update leave request');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Leave Management & Balances</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Accruals & Requests
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Track annual leave accruals, approve employee leave submissions, and sync unpaid leave deductions.
          </p>
        </div>

        {userInfo?.employeeId && (
          <Button
            onClick={() => setShowApplyModal(!showApplyModal)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            Apply for Leave
          </Button>
        )}
      </div>

      <div className="max-w-7xl mx-auto mt-6 space-y-6">
        {/* Leave Balance Cards */}
        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200 border-l-4 border-l-emerald-500">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Annual Leave Balance</p>
                <h3 className="text-3xl font-bold text-emerald-600 mt-1">
                  {balance.annualRemaining} <span className="text-sm font-normal text-slate-500">/ {balance.annualAccrued} Days</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">{balance.annualUsed} Days Used This Year</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Sick Leave Balance</p>
                <h3 className="text-3xl font-bold text-blue-600 mt-1">
                  {balance.sickRemaining} <span className="text-sm font-normal text-slate-500">/ {balance.sickAccrued} Days</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">{balance.sickUsed} Days Used</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 border-l-4 border-l-amber-500">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Emergency / Casual Leave</p>
                <h3 className="text-3xl font-bold text-amber-600 mt-1">
                  {balance.emergencyRemaining} <span className="text-sm font-normal text-slate-500">/ {balance.emergencyAccrued} Days</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">0 Days Pending</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Apply Modal */}
        {showApplyModal && (
          <Card className="bg-white border-emerald-500/50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Submit New Leave Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApplyLeave} noValidate className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-slate-600">Leave Type</Label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual / Emergency</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-slate-600">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 bg-slate-50 border-slate-200 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-600">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 bg-slate-50 border-slate-200 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-600">Total Days</Label>
                  <Input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="mt-1 bg-slate-50 border-slate-200 text-slate-900"
                    min={1}
                  />
                </div>

                <div className="md:col-span-3">
                  <Label className="text-xs text-slate-600">Reason</Label>
                  <Input
                    placeholder="Provide reason for leave..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 bg-slate-50 border-slate-200 text-slate-900"
                  />
                </div>

                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                    Submit Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Leave Requests Table */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              {isApprover ? 'Leave Requests & Approval Queue' : 'My Leave Requests'}
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              {isApprover ? 'Review and approve employee leave requests.' : 'Track the status of your submitted leave requests.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">No leave requests found.</p>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.leaveId}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800">{req.employeeName}</h4>
                        <Badge variant="outline" className="text-xs uppercase bg-white">
                          {req.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Dates: <strong className="text-slate-800">{req.startDate} to {req.endDate}</strong> ({req.totalDays} Days)
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Reason: {req.reason}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          req.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30'
                            : req.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-600 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-700 border-amber-500/30'
                        }
                      >
                        {req.status.toUpperCase()}
                      </Badge>

                      {isApprover && req.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(req.leaveId, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(req.leaveId, 'rejected')}
                            className="border-slate-200 text-rose-600 hover:bg-rose-950/30 text-xs gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveManagement;
