import { Link } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/GCCPayrollAuthContext";
import { getRoleHomeRoute, getRoleLabel } from "@/lib/roleRoutes";
import { Role } from "@/types/user";

type RoleSection = {
  title: string;
  description: string;
  to: string;
};

const ROLE_SECTIONS: Record<Role, RoleSection[]> = {
  [Role.COMPANY_ADMIN]: [
    {
      title: "User Onboarding",
      description: "Invite HR managers and monitor onboarding progress for key staff.",
      to: "/company-admin/onboarding"
    },
    {
      title: "Financial Health",
      description: "Review rent collection efficiency, ROI performance, and expense ratios.",
      to: "/company-admin/overview?focus=financial"
    },
    {
      title: "Compliance & Reporting",
      description: "Monitor statutory filings, audit tasks, and export centralized reports.",
      to: "/company-admin/overview?focus=compliance"
    }
  ],
  [Role.HR_MANAGER]: [
    {
      title: "Workforce Directory",
      description: "Maintain employee profiles, contract statuses, and supporting documents.",
      to: "/hr/overview?focus=directory"
    },
    {
      title: "Onboarding Pipeline",
      description: "Approve user requests, flag missing HR paperwork, and assign system roles.",
      to: "/hr/onboarding"
    },
    {
      title: "Attendance Compliance",
      description: "Track attendance anomalies, pending approvals, and leave summaries.",
      to: "/hr/overview?focus=attendance"
    }
  ],
  [Role.EMPLOYEE]: [
    {
      title: "My Payroll",
      description: "Access salary slips, settlements, and incentive breakdowns.",
      to: "/employee/home?focus=payroll"
    },
    {
      title: "Assignments",
      description: "View active assignments, schedules, and operational guidelines.",
      to: "/employee/home?focus=assignments"
    },
    {
      title: "Fuel & Expenses",
      description: "Submit fuel receipts, track reimbursements, and review adjustments.",
      to: "/employee/home?focus=expenses"
    }
  ]
};

const Dashboard = () => {
  const { userInfo } = useAuth();

  if (!userInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <Loader2 className="w-10 h-10 animate-spin mb-3" aria-hidden />
        <p className="text-slate-600">Fetching your dashboard roles…</p>
      </div>
    );
  }

  const sections = ROLE_SECTIONS[userInfo.role] ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto py-10 px-6 space-y-10">
        <header className="space-y-2">
          <p className="text-emerald-600 font-medium">{getRoleLabel(userInfo.role)}</p>
          <h1 className="text-3xl font-semibold">Welcome back, {userInfo.displayName || userInfo.email}</h1>
          <p className="text-slate-600 max-w-2xl">
            This dashboard highlights the primary actions required for your role. Use the quick links below to jump to
            the modules that need your attention right now.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            to={getRoleHomeRoute(userInfo.role)}
            className="group border border-slate-200 rounded-xl p-6 bg-white hover:border-emerald-400 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm uppercase tracking-wide text-slate-500">Primary workspace</span>
              <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold mb-2">Continue where you left off</h2>
            <p className="text-slate-600">Open the dedicated workspace tailored to your responsibilities.</p>
          </Link>

          <div className="border border-slate-200 rounded-xl p-6 bg-white">
            <h2 className="text-xl font-semibold mb-3">Account summary</h2>
            <ul className="text-slate-600 space-y-2">
              <li><span className="text-slate-500">Role:</span> {getRoleLabel(userInfo.role)}</li>
              <li><span className="text-slate-500">Company ID:</span> {userInfo.companyId}</li>
              <li><span className="text-slate-500">Status:</span> {userInfo.status}</li>
            </ul>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.title}
              to={section.to}
              className="group border border-slate-200 rounded-xl p-5 bg-white hover:border-emerald-400 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition" aria-hidden />
              </div>
              <p className="text-slate-600 text-sm">{section.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
