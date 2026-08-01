import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const location = useLocation();
  const state = location.state as { from?: string } | null;
  const fromPath = state?.from ?? '/dashboard';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-4">
      <ShieldAlert className="w-16 h-16 text-amber-600 mb-6" aria-hidden />
      <h1 className="text-3xl font-semibold mb-2">Access Restricted</h1>
      <p className="text-center text-slate-600 mb-6 max-w-md">
        Your account does not have permission to view <span className="font-medium text-slate-900">{fromPath}</span>.
        If you believe this is an error, please contact your company administrator.
      </p>
      <Link
        to="/dashboard"
        className="px-5 py-2 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 transition"
      >
        Return to dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
