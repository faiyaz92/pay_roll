import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, LogOut } from 'lucide-react';
import { CheckInOutWidget } from '@/components/Attendance/CheckInOutWidget';
import { getLeaveBalance, type LeaveBalance } from '@/useCases/leaveUseCases';

const EmployeePortalView = () => {
  const { userInfo, employeeInfo, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (userInfo?.employeeId) {
      getLeaveBalance(userInfo.employeeId).then(setBalance);
    }
  }, [userInfo?.employeeId]);

  const initials = (userInfo?.displayName || 'Employee')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 font-bold text-xl">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{userInfo?.displayName}</h1>
                {employeeInfo?.employment?.designation && (
                  <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-xs">
                    {employeeInfo.employment.designation}
                  </Badge>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                ID: <span className="font-mono text-slate-800">{userInfo?.employeeId ?? '—'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/hr/payroll/slips">
              <Button variant="outline" className="border-slate-200 text-slate-600 text-xs gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                My Payslips
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-100 text-xs gap-1.5"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Check-In */}
      {userInfo?.employeeId && employeeInfo?.employment?.officeId ? (
        <CheckInOutWidget
          employeeId={userInfo.employeeId}
          officeId={employeeInfo.employment.officeId}
        />
      ) : (
        <Card className="bg-white border-slate-200">
          <CardContent className="py-6 text-sm text-slate-500 text-center">
            No office assigned to your profile yet — contact HR to enable attendance check-in.
          </CardContent>
        </Card>
      )}

      {/* Leave Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Leave Balance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Annual Leave Remaining:</span>
              <strong className="text-emerald-600 font-mono text-sm">
                {balance ? `${balance.annualRemaining} Days` : '—'}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Sick Leave Remaining:</span>
              <strong className="text-blue-600 font-mono text-sm">
                {balance ? `${balance.sickRemaining} Days` : '—'}
              </strong>
            </div>
            <Link to="/hr/leave" className="text-emerald-600 text-xs font-semibold block pt-2">
              Request Leave →
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Payroll</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <p className="text-slate-500">View and download your salary slips once payroll has been processed.</p>
            <Link to="/hr/payroll/slips" className="text-emerald-600 text-xs font-semibold block pt-2">
              View Payslips →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeePortalView;
