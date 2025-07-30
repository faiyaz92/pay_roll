
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  MapPin, 
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
  { name: 'Companies', href: '/super-admin/companies', icon: Building },
  { name: 'Users', href: '/super-admin/users', icon: Users },
  { name: 'Cities', href: '/super-admin/cities', icon: MapPin },
  { name: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
  { name: 'System Settings', href: '/super-admin/settings', icon: Settings },
];

interface SuperAdminSidebarProps {
  collapsed: boolean;
}

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ collapsed }) => {
  const location = useLocation();
  const { logout, userInfo } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={cn(
      "bg-slate-900 text-white transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg">Super Admin</h1>
              <p className="text-xs text-slate-400">System Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-5 h-5 mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-700">
        {!collapsed && userInfo && (
          <div className="mb-3">
            <p className="text-sm font-medium">{userInfo.name || userInfo.email}</p>
            <p className="text-xs text-slate-400 capitalize">Super Administrator</p>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="w-full text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className={cn("w-4 h-4", !collapsed && "mr-2")} />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;
