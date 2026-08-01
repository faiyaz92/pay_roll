import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ClipboardSignature,
  CalendarCheck,
  Calculator,
  FileCode2,
  FileText,
  CalendarDays,
  Award,
  Users,
  Building2,
  MapPin,
  LogOut,
  DatabaseZap,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { seedDemoData } from '@/lib/demoDataSeeder';

const HRDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userInfo } = useAuth();
  const focus = new URLSearchParams(location.search).get('focus');
  const [seeding, setSeeding] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      const ok = await seedDemoData();
      toast[ok ? 'success' : 'error'](ok ? 'Demo data seeded (employees, attendance history, leave balances).' : 'Seeding failed — check the browser console.');
    } catch (err) {
      console.error('Seed demo data failed:', err);
      toast.error('Seeding failed — check the browser console.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-10 h-10 text-emerald-600" aria-hidden />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">HR Operations & Payroll Hub</h1>
                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                  GCC Compliant
                </Badge>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">
                {userInfo?.displayName ? `Logged in as ${userInfo.displayName}` : 'Manage employee master records, run monthly payroll, generate WPS files, and handle leave approvals.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 gap-2"
              onClick={handleSeedDemoData}
              disabled={seeding}
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseZap className="w-4 h-4" />}
              Seed Demo Data
            </Button>
            <Link to="/hr/payroll/run">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-950">
                <Calculator className="w-4 h-4" />
                Run Monthly Payroll
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-white gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Quick Launch Payroll Operations Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/hr/payroll/run" className="group">
            <Card className="bg-white border-slate-200 hover:border-emerald-500/50 transition h-full">
              <CardContent className="pt-6">
                <Calculator className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Run Monthly Payroll</h3>
                <p className="text-slate-500 text-xs mb-3">
                  Calculate gross earnings, overtime pay, allowances, and unpaid leave deductions.
                </p>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  Launch Payroll Engine →
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/hr/payroll/wps" className="group">
            <Card className="bg-white border-slate-200 hover:border-emerald-500/50 transition h-full">
              <CardContent className="pt-6">
                <FileCode2 className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Export WPS (.SIF) File</h3>
                <p className="text-slate-500 text-xs mb-3">
                  Pre-check employee IBANs and generate MOHRE/Central Bank compliant SIF files.
                </p>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  Generate SIF File →
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/hr/payroll/slips" className="group">
            <Card className="bg-white border-slate-200 hover:border-emerald-500/50 transition h-full">
              <CardContent className="pt-6">
                <FileText className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Salary Slip Center</h3>
                <p className="text-slate-500 text-xs mb-3">
                  View itemized payslips and print/download official PDF salary slips for employees.
                </p>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  View Payslips →
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/hr/leave" className="group">
            <Card className="bg-white border-slate-200 hover:border-emerald-500/50 transition h-full">
              <CardContent className="pt-6">
                <CalendarDays className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Leave Management</h3>
                <p className="text-slate-500 text-xs mb-3">
                  Track annual leave balances, approve requests, and sync unpaid leave deductions.
                </p>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  Manage Leave Queue →
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/hr/gratuity" className="group">
            <Card className="bg-white border-slate-200 hover:border-emerald-500/50 transition h-full">
              <CardContent className="pt-6">
                <Award className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">GCC Gratuity Calculator</h3>
                <p className="text-slate-500 text-xs mb-3">
                  Calculate End-of-Service Benefit (EOSB) according to UAE Labor Law Article 132.
                </p>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  Open Calculator →
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/hr/employees" className="group">
            <Card className="bg-white border-slate-200 hover:border-emerald-500/50 transition h-full">
              <CardContent className="pt-6">
                <Users className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Employee Directory</h3>
                <p className="text-slate-500 text-xs mb-3">
                  Manage employee master records, passports, Emirates IDs, and salary structures.
                </p>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  Manage Workforce →
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/hr/offices" className="group">
            <Card className="bg-white border-slate-200 hover:border-emerald-500/50 transition h-full">
              <CardContent className="pt-6">
                <MapPin className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Offices & Geo-fence</h3>
                <p className="text-slate-500 text-xs mb-3">
                  Set office GPS location and check-in radius so employees can clock in/out correctly.
                </p>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  Manage Offices →
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
