import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GCCPayrollAuthProvider, useAuth } from "@/contexts/GCCPayrollAuthContext";
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";
import CompanyAdminDashboard from "@/pages/CompanyAdminDashboard";
import HRDashboard from "@/pages/HRDashboard";
import { useAppStore } from '@/stores';
import { Loader2 } from "lucide-react";
import { Role } from "@/types/user";
import { getRoleHomeRoute } from "@/lib/roleRoutes";
import InviteHR from "@/pages/InviteHR";
import OnboardEmployee from "@/pages/OnboardEmployee";
import EmployeeDirectory from "@/pages/EmployeeDirectory";
import CreateEmployee from "@/pages/CreateEmployee";
import EditEmployee from "@/pages/EditEmployee";
import EmployeeDocuments from "@/pages/EmployeeDocuments";
import BulkOperations from "@/pages/BulkOperations";
import OfficeDirectory from "@/pages/OfficeDirectory";
import CreateOffice from "@/pages/CreateOffice";
import EditOffice from "@/pages/EditOffice";
import OfficeHierarchy from "@/pages/OfficeHierarchy";
import Attendance from "@/pages/Attendance";
import Overtime from "@/pages/Overtime";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import PayrollCycleRun from "@/pages/PayrollCycleRun";
import WPSExport from "@/pages/WPSExport";
import SalarySlips from "@/pages/SalarySlips";
import LeaveManagement from "@/pages/LeaveManagement";
import GratuityCalculator from "@/pages/GratuityCalculator";
import ReportBuilder from "@/pages/ReportBuilder";
import AuditLogViewer from "@/pages/AuditLogViewer";
import BankIntegrationSetup from "@/pages/BankIntegrationSetup";
import HolidayCalendar from "@/pages/HolidayCalendar";
import NotificationCenter from "@/pages/NotificationCenter";
import LeavePolicyBuilder from "@/pages/LeavePolicyBuilder";
import ShiftManagement from "@/pages/ShiftManagement";
import EmployeePortalView from "@/pages/EmployeePortalView";
import ExpenseClaims from "@/pages/ExpenseClaims";
import EmployeeExitManagement from "@/pages/EmployeeExitManagement";
import PerformanceAppraisals from "@/pages/PerformanceAppraisals";
import CompanyAnnouncements from "@/pages/CompanyAnnouncements";

const queryClient = new QueryClient();

const RoleLanding = () => {
  const { userInfo } = useAuth();

  if (!userInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin mb-3" aria-hidden />
        <p className="text-slate-300">Preparing your dashboard…</p>
      </div>
    );
  }

  const target = getRoleHomeRoute(userInfo.role);
  return <Navigate to={target} replace />;
};

const App = () => {
  const initializeLanguage = useAppStore((state) => state.initializeLanguage);
  const initialized = useAppStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized) {
      initializeLanguage();
    }
  }, [initialized, initializeLanguage]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <I18nextProvider i18n={i18n}>
            <GCCPayrollAuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={(
                    <ProtectedRoute>
                      <RoleLanding />
                    </ProtectedRoute>
                  )}
                />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route
                  path="/super-admin/dashboard"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/company-admin/overview"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN]}>
                      <CompanyAdminDashboard />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/company-admin/onboarding"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN]}>
                      <InviteHR />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/overview"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <HRDashboard />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/payroll/run"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <PayrollCycleRun />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/payroll/wps"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <WPSExport />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/payroll/slips"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE]}>
                      <SalarySlips />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/leave"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE]}>
                      <LeaveManagement />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/gratuity"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <GratuityCalculator />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/reports"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <ReportBuilder />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/audit-logs"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <AuditLogViewer />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/bank-integration"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <BankIntegrationSetup />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/holidays"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE]}>
                      <HolidayCalendar />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/notifications"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE]}>
                      <NotificationCenter />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/leave-policies"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <LeavePolicyBuilder />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/shifts"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <ShiftManagement />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/employee/portal"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE]}>
                      <EmployeePortalView />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/employee/expenses"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE]}>
                      <ExpenseClaims />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/exit-management"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <EmployeeExitManagement />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/performance"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <PerformanceAppraisals />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/announcements"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE]}>
                      <CompanyAnnouncements />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/onboarding"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <OnboardEmployee />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/employees"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <EmployeeDirectory />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/employees/new"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <CreateEmployee />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/employees/:employeeId/edit"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <EditEmployee />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/employees/:employeeId/documents"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <EmployeeDocuments />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/employees/bulk"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <BulkOperations />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/offices"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <OfficeDirectory />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/offices/new"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <CreateOffice />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/offices/:officeId/edit"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <EditOffice />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/offices/hierarchy"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <OfficeHierarchy />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/attendance"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <Attendance />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/hr/overtime"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER]}>
                      <Overtime />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/employee/home"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.EMPLOYEE]}>
                      <EmployeePortalView />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/employee/attendance"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE]}>
                      <Attendance />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/employee/overtime"
                  element={(
                    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE]}>
                      <Overtime />
                    </ProtectedRoute>
                  )}
                />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </GCCPayrollAuthProvider>
          </I18nextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
