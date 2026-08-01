import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, FileText, Fuel } from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const location = useLocation();
  const focus = new URLSearchParams(location.search).get('focus');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto py-10 px-6 space-y-8">
        <header className="bg-white border border-slate-200 rounded-xl px-6 py-5">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-emerald-600" aria-hidden />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Employee Center</h1>
              <p className="text-slate-500">Personal payroll summaries, assignments, and expense tracking.</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div
            className={`bg-white border rounded-xl p-5 transition ${
              focus === 'payroll' ? 'border-emerald-400' : 'border-slate-200'
            }`}
          >
            <Wallet className="w-7 h-7 text-emerald-600 mb-3" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Payroll Snapshot</h2>
            <p className="text-slate-500 mb-4">Review salary slips, incentives, and settlement history.</p>
            <Link className="text-emerald-600 font-medium" to="/employee/home?focus=payroll">View payroll</Link>
          </div>

          <div
            className={`bg-white border rounded-xl p-5 transition ${
              focus === 'assignments' ? 'border-emerald-400' : 'border-slate-200'
            }`}
          >
            <FileText className="w-7 h-7 text-emerald-600 mb-3" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Assignment Details</h2>
            <p className="text-slate-500 mb-4">Stay updated with vehicle assignments and duty instructions.</p>
            <Link className="text-emerald-600 font-medium" to="/employee/home?focus=assignments">Open assignments</Link>
          </div>

          <div
            className={`bg-white border rounded-xl p-5 transition ${
              focus === 'expenses' ? 'border-emerald-400' : 'border-slate-200'
            }`}
          >
            <Fuel className="w-7 h-7 text-emerald-600 mb-3" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Fuel Records</h2>
            <p className="text-slate-500 mb-4">Submit and track fuel receipts for reimbursement.</p>
            <Link className="text-emerald-600 font-medium" to="/employee/home?focus=expenses">View fuel logs</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
