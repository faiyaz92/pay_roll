import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Layout from "@/components/Layout/Layout";
import VehicleDetails from "@/pages/VehicleDetails";
import InsurancePolicyDetails from "@/pages/InsurancePolicyDetails";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Vehicles from "@/pages/Vehicles";
import Drivers from "@/pages/Drivers";
import DriverDetails from "@/pages/DriverDetails";
import Assignments from "@/pages/Assignments";
import Insurance from "@/pages/Insurance";
import Payments from "@/pages/Payments";
import FuelRecords from "@/pages/FuelRecords";
import MaintenanceRecords from "@/pages/MaintenanceRecords";
import FuelPrices from "@/pages/FuelPrices";
import NotFound from "@/pages/NotFound";
import Reports from "@/pages/Reports";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="vehicles/:vehicleId" element={<VehicleDetails />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="drivers/:driverId" element={<DriverDetails />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="insurance" element={<Insurance />} />
              <Route path="insurance/:vehicleId" element={<InsurancePolicyDetails />} />
              <Route path="payments" element={<Payments />} />
              <Route path="maintenance-records" element={<MaintenanceRecords/>} />
              <Route path="fuel-records" element={<FuelRecords/>} />
              <Route path="fuel-prices" element={<FuelPrices/>} />
              <Route path="expenses" element={<div className="p-6"><h1 className="text-3xl font-bold">Expense Management</h1><p className="text-gray-600 mt-2">Track and manage car rental expenses</p></div>} />
              <Route path="reports" element={<Reports />} />
              <Route path="bookings" element={<div className="p-6"><h1 className="text-3xl font-bold">Booking Management</h1><p className="text-gray-600 mt-2">Manage customer car rental bookings</p></div>} />
              <Route path="notifications" element={<div className="p-6"><h1 className="text-3xl font-bold">Notifications</h1><p className="text-gray-600 mt-2">View and manage system notifications</p></div>} />
              <Route path="settings" element={<div className="p-6"><h1 className="text-3xl font-bold">Settings</h1><p className="text-gray-600 mt-2">Configure system settings and preferences</p></div>} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
