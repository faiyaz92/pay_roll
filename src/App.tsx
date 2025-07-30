import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Layout from "@/components/Layout/Layout";
import SuperAdminLayout from "@/components/Layout/SuperAdminLayout";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import Cities from "@/pages/Cities";
import RoutesPage from "@/pages/Routes";
import Trips from "@/pages/Trips";
import FuelRecords from "@/pages/FuelRecords";
import MaintenanceRecords from "@/pages/MaintenanceRecords";
import Drivers from "@/pages/Drivers";
import Vehicles from "@/pages/Vehicles";
import NotFound from "@/pages/NotFound";
import { Role } from "@/types/user";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/super-admin" 
                element={
                  <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
                    <SuperAdminLayout>
                      <SuperAdminDashboard />
                    </SuperAdminLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.DRIVER, Role.CUSTOMER]}>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/drivers" 
                element={
                  <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN]}>
                    <Layout>
                      <Drivers />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vehicles" 
                element={
                  <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN]}>
                    <Layout>
                      <Vehicles />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cities" 
                element={
                  <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN]}>
                    <Layout>
                      <Cities />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/routes" 
                element={
                  <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN]}>
                    <Layout>
                      <RoutesPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/trips" 
                element={
                  <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.DRIVER]}>
                    <Layout>
                      <Trips />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/fuel-records" 
                element={
                  <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN, Role.DRIVER]}>
                    <Layout>
                      <FuelRecords />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/maintenance-records" 
                element={
                  <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN]}>
                    <Layout>
                      <MaintenanceRecords />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;