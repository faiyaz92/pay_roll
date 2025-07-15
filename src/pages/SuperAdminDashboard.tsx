
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, Users, Eye, Settings, BarChart3 } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage all tenant companies, customers, and system settings</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Active tenant companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Types</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Available business types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowAddCompany(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Add Company</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">New</div>
            <p className="text-xs text-muted-foreground">Create tenant company</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewChange('companies')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manage Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View</div>
            <p className="text-xs text-muted-foreground">Manage all companies</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowAddCustomer(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Add Customer</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">New</div>
            <p className="text-xs text-muted-foreground">Create customer account</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewChange('customers')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manage Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View</div>
            <p className="text-xs text-muted-foreground">Manage all customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Business Type Management */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Business Types</CardTitle>
          <CardDescription>Manage available business types for tenant companies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Transportation',
              'Inventory',
              'Billing', 
              'Performance Tracking',
              'Logistics',
              'Delivery',
              'Retail'
            ].map((type) => (
              <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{type}</span>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
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
              <CardTitle>Customers</CardTitle>
              <CardDescription>Manage all customers in the system</CardDescription>
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
