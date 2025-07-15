
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Layout from "@/components/Layout/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import Trips from "@/pages/Trips";
import Vehicles from "@/pages/Vehicles";
import Drivers from "@/pages/Drivers";
import NotFound from "@/pages/NotFound";
import { Role } from "@/types/user";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { userInfo } = useAuth();

  if (userInfo?.role === Role.SUPER_ADMIN) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/super-admin" replace />} />
        <Route path="/super-admin" element={
          <ProtectedRoute requiredRole={Role.SUPER_ADMIN}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="trips" element={<Trips />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="cities" element={<div className="p-6"><h1 className="text-3xl font-bold">Cities Management</h1><p className="text-gray-600 mt-2">Manage cities and locations for your transportation network</p></div>} />
        <Route path="routes" element={<div className="p-6"><h1 className="text-3xl font-bold">Route Management</h1><p className="text-gray-600 mt-2">Define and manage transportation routes</p></div>} />
        <Route path="maintenance" element={<div className="p-6"><h1 className="text-3xl font-bold">Maintenance Records</h1><p className="text-gray-600 mt-2">Track vehicle maintenance and service records</p></div>} />
        <Route path="fuel-records" element={<div className="p-6"><h1 className="text-3xl font-bold">Fuel Records</h1><p className="text-gray-600 mt-2">Monitor fuel consumption and expenses</p></div>} />
        <Route path="expenses" element={<div className="p-6"><h1 className="text-3xl font-bold">Expense Management</h1><p className="text-gray-600 mt-2">Track and manage transportation expenses</p></div>} />
        <Route path="reports" element={<div className="p-6"><h1 className="text-3xl font-bold">Reports & Analytics</h1><p className="text-gray-600 mt-2">Generate detailed reports and analytics</p></div>} />
        <Route path="bookings" element={<div className="p-6"><h1 className="text-3xl font-bold">Booking Management</h1><p className="text-gray-600 mt-2">Manage customer bookings and reservations</p></div>} />
        <Route path="notifications" element={<div className="p-6"><h1 className="text-3xl font-bold">Notifications</h1><p className="text-gray-600 mt-2">View and manage system notifications</p></div>} />
        <Route path="settings" element={<div className="p-6"><h1 className="text-3xl font-bold">Settings</h1><p className="text-gray-600 mt-2">Configure system settings and preferences</p></div>} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
