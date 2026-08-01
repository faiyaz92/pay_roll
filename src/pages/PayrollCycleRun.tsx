import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Calculator,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Building2,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import {
  calculateMonthlyPayroll,
  savePayrollCycle,
  type PayrollCycleRecord,
} from '@/useCases/payrollUseCases';
import { DEMO_COMPANY_ID, DEMO_COMPANY_NAME } from '@/lib/demoDataSeeder';
import { Link } from 'react-router-dom';

const PayrollCycleRun = () => {
  const { userInfo } = useAuth();
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payrollResult, setPayrollResult] = useState<PayrollCycleRecord | null>(null);

  const companyId = userInfo?.companyId || DEMO_COMPANY_ID;
  const companyName = DEMO_COMPANY_NAME;

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const result = await calculateMonthlyPayroll(
        companyId,
        companyName,
        month,
        year,
        userInfo?.displayName || 'HR Manager'
      );
      setPayrollResult(result);
      toast.success(`Calculated payroll for ${result.totalEmployees} employees!`);
    } catch (err) {
      toast.error('Error calculating payroll');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [month, year]);

  const handleLockCycle = async () => {
    if (!payrollResult) return;
    setSaving(true);
    try {
      await savePayrollCycle(payrollResult);
      toast.success(`Payroll Cycle ${payrollResult.cycleId} locked & saved successfully!`);
      setPayrollResult({ ...payrollResult, status: 'completed' });
    } catch (err) {
      toast.error('Failed to lock payroll cycle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Monthly Payroll Processing Engine</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              GCC Compliant
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Automated monthly payroll calculation linking basic salary, HRA, allowances, overtime, and attendance deductions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/hr/payroll/history">
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-white gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Payroll History
            </Button>
          </Link>
          <Link to="/hr/payroll/wps">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
              Export WPS (.SIF)
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-6 space-y-6">
        {/* Controls Card */}
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-600">Payroll Period:</span>
              </div>

              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900"
              >
                {[
                  'January',
                  'February',
                  'March',
                  'April',
                  'May',
                  'June',
                  'July',
                  'August',
                  'September',
                  'October',
                  'November',
                  'December',
                ].map((mName, i) => (
                  <option key={i + 1} value={i + 1}>
                    {mName}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>

              <Button
                onClick={handleCalculate}
                disabled={loading}
                variant="secondary"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs"
              >
                {loading ? 'Recalculating…' : 'Recalculate Period'}
              </Button>
            </div>

            {payrollResult && (
              <div className="flex items-center gap-3">
                <Badge
                  className={
                    payrollResult.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-700 border-amber-500/30'
                  }
                >
                  Status: {payrollResult.status.toUpperCase()}
                </Badge>

                {payrollResult.status !== 'completed' && (
                  <Button
                    onClick={handleLockCycle}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-950"
                  >
                    <Lock className="w-4 h-4" />
                    {saving ? 'Locking…' : 'Lock & Save Payroll Cycle'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Metric Cards */}
        {payrollResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Total Active Employees</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{payrollResult.totalEmployees}</h3>
                <p className="text-xs text-emerald-600 mt-1">100% Verified Profiles</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Total Gross Earnings</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {payrollResult.totalGross.toLocaleString()} {payrollResult.currency}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Includes Basic + Allowances + Overtime</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Total Deductions</p>
                <h3 className="text-2xl font-bold text-rose-600 mt-1">
                  {payrollResult.totalDeductions.toLocaleString()} {payrollResult.currency}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Unpaid leaves & deductions</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 border-l-4 border-l-emerald-500">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Total Net Disbursement</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                  {payrollResult.totalNet.toLocaleString()} {payrollResult.currency}
                </h3>
                <p className="text-xs text-emerald-700 mt-1">Ready for Bank / WPS Export</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Payroll Table */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Employee Payroll Breakdown List
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Itemized salary structure and deductions for each employee in the active payroll period.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {payrollResult && (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Basic</th>
                    <th className="py-3 px-4 text-right">HRA</th>
                    <th className="py-3 px-4 text-right">Allowances</th>
                    <th className="py-3 px-4 text-right">Overtime</th>
                    <th className="py-3 px-4 text-right">Gross Pay</th>
                    <th className="py-3 px-4 text-right">Deductions</th>
                    <th className="py-3 px-4 text-right">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {payrollResult.components.map((comp) => (
                    <tr key={comp.employeeId} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {comp.employeeName}
                        <span className="block text-xs text-slate-500 font-mono">{comp.employeeId}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{comp.department}</td>
                      <td className="py-3 px-4 text-right font-mono">{comp.earnings.basic.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{comp.earnings.hra.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {(comp.earnings.transportation + comp.earnings.mobile + comp.earnings.utilities).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">
                        +{comp.earnings.overtime.toLocaleString()}
                        <span className="block text-[10px] text-slate-500">({comp.overtimeHours} hrs)</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {comp.grossPay.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600">
                        -{comp.totalDeductions.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {comp.netPay.toLocaleString()} {payrollResult.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayrollCycleRun;
