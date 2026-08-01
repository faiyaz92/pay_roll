import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  FileSpreadsheet,
  Download,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';

const ReportBuilder = () => {
  const [category, setCategory] = useState('Payroll');
  const [period, setPeriod] = useState('This Month');
  const [format, setFormat] = useState('CSV');

  const handleExportReport = () => {
    toast.success(`Exporting ${category} report (${period}) in ${format} format...`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Custom Report Builder</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Analytics & Export
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Build, filter, and export customized HR, Attendance, Payroll, and Compliance reports.
          </p>
        </div>

        <Button onClick={handleExportReport} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
          <Download className="w-4 h-4" />
          Generate & Export Report
        </Button>
      </div>

      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter Controls */}
        <Card className="bg-white border-slate-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" />
              Report Parameters
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Configure data fields and export layout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Report Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
              >
                <option value="Payroll">Monthly Payroll Summary Report</option>
                <option value="Attendance">Attendance & Overtime Hours Log</option>
                <option value="WPS Compliance">WPS Disbursement & Compliance Status</option>
                <option value="Employee Directory">Employee Identity & Visa Expiry Report</option>
                <option value="Leave Balances">Year-to-Date Leave Accruals</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Time Range</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
              >
                <option value="This Month">This Month (July 2026)</option>
                <option value="Last Month">Last Month (June 2026)</option>
                <option value="Q2 2026">Q2 2026 (Apr - Jun)</option>
                <option value="YTD 2026">Year to Date (2026)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Export Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
              >
                <option value="CSV">Comma Separated Values (.CSV)</option>
                <option value="Excel">Microsoft Excel (.XLSX)</option>
                <option value="PDF">Printable PDF Report (.PDF)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card className="bg-white border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Report Data Preview
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Live preview of aggregated report dataset for Al Hilal Enterprises LLC.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Metric / Field</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Value</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900">Total Base Payroll Payout</td>
                    <td className="py-3 px-3 text-slate-500">Payroll Engine</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600">39,500 AED</td>
                    <td className="py-3 px-3 text-right"><Badge className="bg-emerald-500/20 text-emerald-700">Verified</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900">Total Approved Overtime</td>
                    <td className="py-3 px-3 text-slate-500">Attendance Log</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600">+1,450 AED</td>
                    <td className="py-3 px-3 text-right"><Badge className="bg-emerald-500/20 text-emerald-700">Approved</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900">WPS SIF File Integrity</td>
                    <td className="py-3 px-3 text-slate-500">MOHRE UAE</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800">5 / 5 Employees</td>
                    <td className="py-3 px-3 text-right"><Badge className="bg-emerald-500/20 text-emerald-700">Pass</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900">Active Visa Expiries (30 Days)</td>
                    <td className="py-3 px-3 text-slate-500">Compliance</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-600">1 Passport Expiring</td>
                    <td className="py-3 px-3 text-right"><Badge className="bg-amber-500/20 text-amber-700">Alert</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportBuilder;
