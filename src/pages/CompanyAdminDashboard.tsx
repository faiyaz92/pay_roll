import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Users2, PieChart, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { Button } from '@/components/ui/button';

const CompanyAdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userInfo } = useAuth();
  const focus = new URLSearchParams(location.search).get('focus');

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto py-10 px-6 space-y-8">
        <header className="bg-white border border-slate-200 rounded-xl px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-emerald-600" aria-hidden />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Company Administration</h1>
              <p className="text-slate-500">
                {userInfo?.displayName ? `Logged in as ${userInfo.displayName}` : 'Manage company profile, departments, and payroll governance.'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-white gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div
            className={`bg-white border rounded-xl p-5 transition ${
              focus === 'directory' ? 'border-emerald-400' : 'border-slate-200'
            }`}
          >
            <Users2 className="w-7 h-7 text-emerald-600 mb-3" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">User Management</h2>
            <p className="text-slate-500 mb-4">Review onboarding requests, assign roles, and monitor active accounts.</p>
            <Link className="text-emerald-600 font-medium" to="/company-admin/onboarding">Invite HR users</Link>
          </div>

          <div
            className={`bg-white border rounded-xl p-5 transition ${
              focus === 'financial' ? 'border-emerald-400' : 'border-slate-200'
            }`}
          >
            <PieChart className="w-7 h-7 text-emerald-600 mb-3" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Financial Oversight</h2>
            <p className="text-slate-500 mb-4">Track revenue distribution, outstanding payments, and ROI metrics.</p>
            <Link className="text-emerald-600 font-medium" to="/company-admin/overview?focus=financial">Financial insights</Link>
          </div>

          <div
            className={`bg-white border rounded-xl p-5 transition ${
              focus === 'compliance' ? 'border-emerald-400' : 'border-slate-200'
            }`}
          >
            <ClipboardList className="w-7 h-7 text-emerald-600 mb-3" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Compliance Tasks</h2>
            <p className="text-slate-500 mb-4">Monitor regulatory filings, policy acknowledgements, and payroll cycles.</p>
            <Link className="text-emerald-600 font-medium" to="/company-admin/overview?focus=compliance">View compliance</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;
