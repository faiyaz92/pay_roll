import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

const NotFound: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-4">
    <Compass className="w-16 h-16 text-emerald-600 mb-6" aria-hidden />
    <h1 className="text-3xl font-semibold mb-2">Page not found</h1>
    <p className="text-center text-slate-600 mb-6">
      The page you are looking for no longer exists or has moved.
    </p>
    <Link
      to="/dashboard"
      className="px-5 py-2 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 transition"
    >
      Go to dashboard
    </Link>
  </div>
);

export default NotFound;
