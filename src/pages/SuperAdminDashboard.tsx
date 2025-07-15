
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, Users, Eye } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage tenant companies and customers</p>
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

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowCompaniesList(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View</div>
            <p className="text-xs text-muted-foreground">Manage companies</p>
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

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowCustomersList(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View</div>
            <p className="text-xs text-muted-foreground">Manage customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Content based on selection */}
      {showCompaniesList && (
        <Card>
          <CardHeader>
            <CardTitle>Tenant Companies</CardTitle>
            <CardDescription>Manage all tenant companies in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <TenantCompaniesList />
          </CardContent>
        </Card>
      )}

      {showCustomersList && (
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Manage all customers in the system</CardDescription>
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
