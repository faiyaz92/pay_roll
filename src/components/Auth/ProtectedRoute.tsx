import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { Loader2 } from 'lucide-react';
import { Role } from '@/types/user';

// Update interface to match App.jsx prop usage
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[]; // Changed to array to match App.jsx
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { currentUser, userInfo, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Check if user is authenticated
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has one of the allowed roles
  if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
