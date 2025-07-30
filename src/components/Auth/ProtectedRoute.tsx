import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Role } from '@/types/user';

// Define expected shape of userInfo for type safety
interface UserInfo {
  role: Role;
}

// Extend AuthContext type to ensure consistency
interface AuthContextType {
  currentUser: unknown | null;
  userInfo: UserInfo | null;
  loading: boolean;
}

// Update interface to match App.jsx prop usage
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[]; // Changed to array to match App.jsx
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { currentUser, userInfo, loading } = useAuth() as AuthContextType;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Check if user is authenticated
  if (!currentUser || !userInfo) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has one of the allowed roles
  if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
    return <Navigate to="/not-found" replace />; // Changed to /not-found for consistency
  }

  return <>{children}</>;
};

export default ProtectedRoute;
