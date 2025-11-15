import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Fuel,
  BarChart3,
  Wrench,
  LogOut,
  DollarSign,
  FileText,
  Shield,
  UserPlus,
  Calculator
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Role } from '@/types/user';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [Role.COMPANY_ADMIN, Role.PARTNER] },
  { name: 'Vehicles', href: '/vehicles', icon: Car, roles: [Role.COMPANY_ADMIN, Role.PARTNER] },
  { name: 'Financial', href: '/financial', icon: Calculator, roles: [Role.COMPANY_ADMIN, Role.PARTNER] },
  { name: 'My Details', href: 'partner-details', icon: Users, roles: [Role.PARTNER], dynamic: true },
  { name: 'Drivers', href: '/drivers', icon: Users, roles: [Role.COMPANY_ADMIN] },
  { name: 'Partners', href: '/partners', icon: UserPlus, roles: [Role.COMPANY_ADMIN] },
  { name: 'Assignments', href: '/assignments', icon: FileText, roles: [Role.COMPANY_ADMIN] },
  { name: 'Insurance', href: '/insurance', icon: Shield, roles: [Role.COMPANY_ADMIN] },
  { name: 'Payments', href: '/payments', icon: DollarSign, roles: [Role.COMPANY_ADMIN] },
  { name: 'Fuel Records', href: '/fuel-records', icon: Fuel, roles: [Role.COMPANY_ADMIN] },
  { name: 'Maintenance', href: '/maintenance-records', icon: Wrench, roles: [Role.COMPANY_ADMIN] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: [Role.COMPANY_ADMIN, Role.PARTNER] },
];

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const location = useLocation();
  const { logout, userInfo } = useAuth();

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => 
    userInfo?.role && item.roles.includes(userInfo.role)
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={cn(
      "bg-primary text-primary-foreground transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-primary-foreground/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg">CarRentalPro</h1>
              <p className="text-xs text-primary-foreground/70">Management System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.dynamic && location.pathname === `/partners/${userInfo?.userId}`);
          const href = item.dynamic ? `/partners/${userInfo?.userId}` : item.href;
          
          return (
            <NavLink
              key={item.name}
              to={href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-secondary text-white shadow-lg"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-white"
              )}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-5 h-5 mr-3")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-primary-foreground/10">
        {!collapsed && userInfo && (
          <div className="mb-3">
            <p className="text-sm font-medium">{userInfo.name}</p>
            <p className="text-xs text-primary-foreground/70 capitalize">{userInfo.role.replace('_', ' ')}</p>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="w-full text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-white"
        >
          <LogOut className={cn("w-4 h-4", !collapsed && "mr-2")} />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
