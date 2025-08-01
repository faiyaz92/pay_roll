import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Layout from "@/components/Layout/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Trips from "@/pages/Trips";
import Vehicles from "@/pages/Vehicles";
import Drivers from "@/pages/Drivers";
import NotFound from "@/pages/NotFound";
import Cities from "./pages/Cities";
import Routes1 from "./pages/Routes";
import FuelRecords from "./pages/FuelRecords";
import MaintenanceRecords from "./pages/MaintenanceRecords";
import VehicleAnalysis from "./pages/VehicleAnalysis";
import RouteAnalysis from "./pages/RouteAnalysis";
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
              <Route path="trips" element={<Trips />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="cities" element={<Cities/>} />
              <Route path="routes" element={<Routes1/>} />
              <Route path="maintenance-records" element={<MaintenanceRecords/>} />
              <Route path="fuel-records" element={<FuelRecords/>} />
              <Route path="vehicle-analysis" element={<VehicleAnalysis/>} />
              <Route path="route-analysis" element={<RouteAnalysis/>} />
              <Route path="expenses" element={<div className="p-6"><h1 className="text-3xl font-bold">Expense Management</h1><p className="text-gray-600 mt-2">Track and manage transportation expenses</p></div>} />
              <Route path="reports" element={<div className="p-6"><h1 className="text-3xl font-bold">Reports & Analytics</h1><p className="text-gray-600 mt-2">Generate detailed reports and analytics</p></div>} />
              <Route path="bookings" element={<div className="p-6"><h1 className="text-3xl font-bold">Booking Management</h1><p className="text-gray-600 mt-2">Manage customer bookings and reservations</p></div>} />
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
