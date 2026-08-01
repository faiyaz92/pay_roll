import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { INITIAL_EXIT_RECORDS, type ExitManagementRecord } from '@/useCases/extendedHRUseCases';

const EmployeeExitManagement = () => {
  const [exits] = useState<ExitManagementRecord[]>(INITIAL_EXIT_RECORDS);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LogOut className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Employee Exit & Offboarding Clearance</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              EOSB & Offboarding
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Manage employee notice periods, IT hardware clearance, visa cancellation, and final settlement payouts.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Active Exit Offboarding Workflows</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Departmental clearance tracking before MOHRE visa cancellation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exits.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{rec.employeeName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      Resignation: <strong className="text-slate-800">{rec.resignationDate}</strong> | Last Day: <strong className="text-emerald-600">{rec.lastWorkingDay}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 mb-1">
                      {rec.status.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <p className="text-xs text-slate-500 font-mono">
                      Final Settlement: <strong className="text-emerald-600 text-sm">{rec.finalSettlementAmount.toLocaleString()} AED</strong>
                    </p>
                  </div>
                </div>

                {/* Clearance Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/60 p-2.5 rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">IT Hardware:</span>
                    {rec.clearanceStatus.itHardware ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Returned</span>
                    ) : (
                      <span className="text-amber-600 font-bold">Pending</span>
                    )}
                  </div>

                  <div className="bg-white/60 p-2.5 rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Finance Dues:</span>
                    {rec.clearanceStatus.financeDues ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Cleared</span>
                    ) : (
                      <span className="text-amber-600 font-bold">Pending</span>
                    )}
                  </div>

                  <div className="bg-white/60 p-2.5 rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">HR Interview:</span>
                    {rec.clearanceStatus.hrExitInterview ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>
                    ) : (
                      <span className="text-amber-600 font-bold">Pending</span>
                    )}
                  </div>

                  <div className="bg-white/60 p-2.5 rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Visa Cancel:</span>
                    {rec.clearanceStatus.visaCancellation ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Cancelled</span>
                    ) : (
                      <span className="text-amber-600 font-bold">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeExitManagement;
