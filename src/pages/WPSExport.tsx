import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  FileCode2,
  CheckCircle2,
  XCircle,
  Download,
  Building2,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import {
  calculateMonthlyPayroll,
  type PayrollCycleRecord,
} from '@/useCases/payrollUseCases';
import {
  validateWPSData,
  generateWPSSifContent,
  type WPSValidationReport,
} from '@/useCases/wpsUseCases';
import { DEMO_COMPANY_ID, DEMO_COMPANY_NAME } from '@/lib/demoDataSeeder';

const WPSExport = () => {
  const { userInfo } = useAuth();
  const [cycle, setCycle] = useState<PayrollCycleRecord | null>(null);
  const [report, setReport] = useState<WPSValidationReport | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('UAE');
  const [bankRouting, setBankRouting] = useState('UAEBANK001');

  const companyId = userInfo?.companyId || DEMO_COMPANY_ID;

  useEffect(() => {
    const loadCycle = async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const res = await calculateMonthlyPayroll(
        companyId,
        DEMO_COMPANY_NAME,
        currentMonth,
        currentYear,
        'HR Admin'
      );
      setCycle(res);
      const valReport = validateWPSData(res);
      setReport(valReport);
    };
    loadCycle();
  }, [companyId]);

  const handleDownloadSIF = () => {
    if (!cycle) return;
    const sifContent = generateWPSSifContent('MOHRE-EST-991823', cycle, bankRouting);
    const blob = new Blob([sifContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WPS_${selectedCountry}_${cycle.cycleId}.sif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`WPS SIF file generated & downloaded successfully!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">WPS (.SIF) File Generator</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              MOHRE & Central Bank Compliant
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Generate and export Wage Protection System (WPS) SIF files for UAE, Saudi Arabia, and GCC central banking portals.
          </p>
        </div>

        {report && (
          <Button
            onClick={handleDownloadSIF}
            disabled={!report.canExport}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-950"
          >
            <Download className="w-4 h-4" />
            Download WPS (.SIF) File
          </Button>
        )}
      </div>

      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Status & Controls */}
        <Card className="bg-white border-slate-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Country & Compliance Setup
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Select GCC region regulatory format and bank routing credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">GCC Jurisdiction Format</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
              >
                <option value="UAE">UAE MOHRE (SIF Format v3.0)</option>
                <option value="Saudi Arabia">Saudi Arabia MHRSD (MOL Format)</option>
                <option value="Kuwait">Kuwait PACI WPS</option>
                <option value="Qatar">Qatar QCB WPS</option>
                <option value="Oman">Oman CBO WPS</option>
                <option value="Bahrain">Bahrain LMRA WPS</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Employer Corporate Establishment ID</label>
              <input
                type="text"
                value="MOHRE-EST-991823"
                readOnly
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Disbursement Bank Routing Code</label>
              <input
                type="text"
                value={bankRouting}
                onChange={(e) => setBankRouting(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 font-mono"
              />
            </div>

            {report && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <h4 className="text-xs font-semibold text-slate-600 uppercase">Pre-flight Compliance Summary</h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Payout Employees:</span>
                  <strong className="text-slate-800">{report.totalEmployees}</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Compliant Profiles:</span>
                  <strong className="text-emerald-600">{report.validEmployeesCount}</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Disbursement:</span>
                  <strong className="text-emerald-600 font-mono">{report.totalAmount.toLocaleString()} AED</strong>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee IBAN & Compliance Verification List */}
        <Card className="bg-white border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Employee Banking & Compliance Pre-Check
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Every employee must have a valid IBAN account and Labour Card number to prevent central bank file rejection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report && (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {report.items.map((item) => (
                  <div
                    key={item.employeeId}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800 text-sm">{item.employeeName}</h4>
                        <span className="text-xs text-slate-500 font-mono">({item.employeeId})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        IBAN: <span className="font-mono text-emerald-700">{item.iban}</span> | Labour Card: <span className="font-mono text-slate-600">{item.labourCardNumber}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'valid' ? (
                        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Compliant
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-500/20 text-rose-600 border-rose-500/30 gap-1 text-xs">
                          <XCircle className="w-3.5 h-3.5" />
                          Non-compliant
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WPSExport;
