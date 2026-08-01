import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  FileText,
  Printer,
  Download,
  Building2,
  UserCheck,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import {
  calculateMonthlyPayroll,
  type PayrollCycleRecord,
  type PayrollComponentRecord,
} from '@/useCases/payrollUseCases';
import { DEMO_COMPANY_ID, DEMO_COMPANY_NAME } from '@/lib/demoDataSeeder';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SalarySlips = () => {
  const { userInfo } = useAuth();
  const [cycle, setCycle] = useState<PayrollCycleRecord | null>(null);
  const [selectedComp, setSelectedComp] = useState<PayrollComponentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const companyId = userInfo?.companyId || DEMO_COMPANY_ID;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const loadData = async () => {
      const res = await calculateMonthlyPayroll(
        companyId,
        DEMO_COMPANY_NAME,
        month,
        year,
        'HR Admin'
      );
      if (cancelled) return;
      setCycle(res);
      setSelectedComp(res.components.length > 0 ? res.components[0] : null);
      setLoading(false);
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [companyId, month, year]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Salary Slip Center</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Interactive & Printable
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Generate, view, and print official employee payslips with full GCC earnings and deductions breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
          >
            {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Selector Sidebar */}
        <Card className="bg-white border-slate-200 lg:col-span-1 print:hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Select Employee
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Choose employee to generate payslip view.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {cycle?.components.map((comp) => (
              <button
                key={comp.employeeId}
                onClick={() => setSelectedComp(comp)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedComp?.employeeId === comp.employeeId
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{comp.employeeName}</h4>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {comp.employeeId}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs mt-1 text-slate-500">
                  <span>{comp.department}</span>
                  <span className="font-mono text-emerald-600 font-semibold">{comp.netPay.toLocaleString()} AED</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Payslip Document Preview */}
        <Card className="bg-white border-slate-200 lg:col-span-2 text-slate-900 bg-white p-8 rounded-xl shadow-2xl print:col-span-3 print:p-0">
          {selectedComp && cycle ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-6 border-b-2 border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{cycle.companyName}</h2>
                  <p className="text-xs text-slate-500">Business Bay, Tower 4, Office 602, Dubai, UAE</p>
                  <p className="text-xs text-slate-500">TRN: 100293847500003 | GCC Payroll System</p>
                </div>

                <div className="text-right">
                  <Badge className="bg-white text-white text-xs px-3 py-1 uppercase">
                    SALARY SLIP
                  </Badge>
                  <p className="text-xs text-slate-500 mt-2">Pay Period: <strong>{MONTH_NAMES[month - 1]} {year}</strong></p>
                  <p className="text-xs text-slate-500">Slip No: <strong>SLIP-{selectedComp.employeeId}-{year}{String(month).padStart(2, '0')}</strong></p>
                </div>
              </div>

              {/* Employee & Bank Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-xs">
                <div>
                  <p className="text-slate-500">Employee Name:</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedComp.employeeName}</p>
                  <p className="text-slate-500 mt-1">Designation: <span className="font-medium text-slate-800">{selectedComp.designation}</span></p>
                  <p className="text-slate-500">Department: <span className="font-medium text-slate-800">{selectedComp.department}</span></p>
                </div>

                <div>
                  <p className="text-slate-500">Employee ID: <span className="font-mono text-slate-800 font-bold">{selectedComp.employeeId}</span></p>
                  <p className="text-slate-500 mt-1">Bank IBAN: <span className="font-mono text-slate-800">{selectedComp.iban}</span></p>
                  <p className="text-slate-500">Payable Days: <span className="font-medium text-slate-800">{selectedComp.payableDays} Days</span></p>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                {/* Earnings */}
                <div>
                  <h4 className="font-bold text-xs uppercase text-emerald-700 pb-2 border-b border-emerald-200">
                    Earnings Breakdown
                  </h4>
                  <div className="space-y-2 text-xs pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Basic Salary</span>
                      <span className="font-mono font-medium">{selectedComp.earnings.basic.toLocaleString()} AED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Housing Allowance (HRA)</span>
                      <span className="font-mono font-medium">{selectedComp.earnings.hra.toLocaleString()} AED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Transportation</span>
                      <span className="font-mono font-medium">{selectedComp.earnings.transportation.toLocaleString()} AED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Mobile & Utilities</span>
                      <span className="font-mono font-medium">
                        {(selectedComp.earnings.mobile + selectedComp.earnings.utilities).toLocaleString()} AED
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Overtime Pay ({selectedComp.overtimeHours} hrs)</span>
                      <span className="font-mono">+{selectedComp.earnings.overtime.toLocaleString()} AED</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2 text-slate-900">
                      <span>Gross Earnings</span>
                      <span className="font-mono">{selectedComp.grossPay.toLocaleString()} AED</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h4 className="font-bold text-xs uppercase text-rose-700 pb-2 border-b border-rose-200">
                    Deductions Breakdown
                  </h4>
                  <div className="space-y-2 text-xs pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Unpaid Leave Deductions</span>
                      <span className="font-mono text-rose-600">-{selectedComp.deductions.unpaidLeave.toLocaleString()} AED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Other Deductions / Loans</span>
                      <span className="font-mono text-rose-600">0.00 AED</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2 text-slate-900 mt-12">
                      <span>Total Deductions</span>
                      <span className="font-mono text-rose-700">-{selectedComp.totalDeductions.toLocaleString()} AED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-emerald-800 font-bold">Net Salary Payout</p>
                  <p className="text-xs text-emerald-600">Transferred via UAE Central Bank WPS</p>
                </div>
                <h3 className="text-3xl font-extrabold text-emerald-700 font-mono">
                  {selectedComp.netPay.toLocaleString()} AED
                </h3>
              </div>

              {/* Footer Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-slate-500 text-center">
                <div>
                  <div className="border-b border-slate-300 h-10 mb-1"></div>
                  <p>Employer / HR Authorization</p>
                </div>
                <div>
                  <div className="border-b border-slate-300 h-10 mb-1"></div>
                  <p>Employee Signature</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-12">
              {loading ? 'Calculating payslip...' : `No employees found for ${MONTH_NAMES[month - 1]} ${year}.`}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SalarySlips;
