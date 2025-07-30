
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, Users, Eye, Settings, BarChart3, Globe, Shield } from 'lucide-react';
import { useState } from 'react';
import AddTenantCompanyForm from '@/components/Forms/AddTenantCompanyForm';
import AddCustomerForm from '@/components/Forms/AddCustomerForm';
import TenantCompaniesList from '@/components/Lists/TenantCompaniesList';
import CustomersList from '@/components/Lists/CustomersList';
import AddItemModal from '@/components/Modals/AddItemModal';

const SuperAdminDashboard: React.FC = () => {
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showCompaniesList, setShowCompaniesList] = useState(false);
  const [showCustomersList, setShowCustomersList] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null);

  const resetViews = () => {
    setShowCompaniesList(false);
    setShowCustomersList(false);
    setActiveView(null);
  };

  const handleViewChange = (view: string) => {
    resetViews();
    setActiveView(view);
    if (view === 'companies') {
      setShowCompaniesList(true);
    } else if (view === 'customers') {
      setShowCustomersList(true);
    }
  };

  const businessTypes = [
    { name: 'Transportation', count: 8, icon: '🚛' },
    { name: 'Inventory', count: 5, icon: '📦' },
    { name: 'Billing', count: 12, icon: '💰' },
    { name: 'Performance Tracking', count: 3, icon: '📊' },
    { name: 'Logistics', count: 7, icon: '🚚' },
    { name: 'Delivery', count: 9, icon: '📮' },
    { name: 'Retail', count: 4, icon: '🏪' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Super Admin Control Center</h1>
        </div>
        <p className="text-blue-100">Manage all tenant companies, users, and system-wide settings</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">48</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">1,247</div>
            <p className="text-xs text-muted-foreground">+15% growth</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Types</CardTitle>
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">7</div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Globe className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">99.9%</div>
            <p className="text-xs text-muted-foreground">Uptime status</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200" 
          onClick={() => setShowAddCompany(true)}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Add Company</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Create new tenant company</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-green-200" 
          onClick={() => handleViewChange('companies')}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Manage Companies</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">View and edit companies</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-purple-200" 
          onClick={() => setShowAddCustomer(true)}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <Plus className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Add Customer</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Create customer account</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-orange-200" 
          onClick={() => handleViewChange('customers')}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-lg">Manage Users</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">View and manage users</p>
          </CardContent>
        </Card>
      </div>

      {/* Business Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Business Types Distribution</span>
          </CardTitle>
          <CardDescription>Overview of companies by business category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {businessTypes.map((type) => (
              <div key={type.name} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-semibold text-sm">{type.name}</div>
                <div className="text-lg font-bold text-blue-600">{type.count}</div>
                <div className="text-xs text-muted-foreground">companies</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content based on selection */}
      {showCompaniesList && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tenant Companies</CardTitle>
              <CardDescription>Manage all tenant companies in the system</CardDescription>
            </div>
            <Button variant="outline" onClick={resetViews}>
              <Eye className="h-4 w-4 mr-2" />
              Close View
            </Button>
          </CardHeader>
          <CardContent>
            <TenantCompaniesList />
          </CardContent>
        </Card>
      )}

      {showCustomersList && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Users</CardTitle>
              <CardDescription>Manage all users across the platform</CardDescription>
            </div>
            <Button variant="outline" onClick={resetViews}>
              <Eye className="h-4 w-4 mr-2" />
              Close View
            </Button>
          </CardHeader>
          <CardContent>
            <CustomersList />
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <AddItemModal
        isOpen={showAddCompany}
        onOpenChange={setShowAddCompany}
        title="Add Tenant Company"
        buttonText="Add Company"
      >
        <AddTenantCompanyForm onSuccess={() => setShowAddCompany(false)} />
      </AddItemModal>

      <AddItemModal
        isOpen={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        title="Add Customer"
        buttonText="Add Customer"
      >
        <AddCustomerForm onSuccess={() => setShowAddCustomer(false)} />
      </AddItemModal>
    </div>
  );
};

export default SuperAdminDashboard;
