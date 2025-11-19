import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFirebaseData, VehicleFinancialData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Vehicle, Role } from '@/types/user';
import { ExpensesTab } from '@/components/VehicleDetails/ExpensesTab';
import AddExpenseForm from '@/components/Forms/AddExpenseForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft } from 'lucide-react';

const StandaloneExpensesTab: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vehicleId = searchParams.get('vehicleId');
  const { vehicles, loading, expenses, getVehicleFinancialData } = useFirebaseData();
  const { userInfo } = useAuth();
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [addInsuranceDialogOpen, setAddInsuranceDialogOpen] = useState(false);

  const vehicle = vehicles.find(v => v.id === vehicleId);

  // Get financial data using the same function as VehicleDetails
  const financialData = vehicle ? getVehicleFinancialData(vehicleId!) : null;

  // Filter expenses for this vehicle
  const vehicleExpenses = useMemo(() => {
    return expenses.filter(e => e.vehicleId === vehicleId);
  }, [expenses, vehicleId]);

  // Calculate expense data - exact same logic as VehicleDetails
  const getVehicleExpenseData = () => {
    // Use the already filtered vehicleExpenses
    
    // Calculate totals by category using new hierarchical structure
    // For backward compatibility, also check old 'type' field
    const fuelExpenses = vehicleExpenses.filter(e => 
      (e.expenseType === 'fuel') || 
      e.description.toLowerCase().includes('fuel') ||
      e.description.toLowerCase().includes('petrol') ||
      e.description.toLowerCase().includes('diesel')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    const maintenanceExpenses = vehicleExpenses.filter(e => 
      (e.expenseType === 'maintenance') || 
      (e.type === 'maintenance') ||
      (e.expenseType as string) === 'repair' ||
      (e.expenseType as string) === 'service' ||
      e.description.toLowerCase().includes('maintenance') ||
      e.description.toLowerCase().includes('repair') ||
      e.description.toLowerCase().includes('service')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    const insuranceExpenses = vehicleExpenses.filter(e => 
      (e.expenseType === 'insurance') || 
      (e.type === 'insurance') ||
      e.description.toLowerCase().includes('insurance')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    const penaltyExpenses = vehicleExpenses.filter(e => 
      (e.expenseType === 'penalties') || 
      (e.type === 'penalties') ||
      (e.expenseType as string) === 'penalty' ||
      (e.expenseType as string) === 'fine' ||
      e.description.toLowerCase().includes('penalty') ||
      e.description.toLowerCase().includes('fine') ||
      e.description.toLowerCase().includes('late fee')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    const emiPayments = vehicleExpenses.filter(e => 
      (e.paymentType === 'emi') || 
      (e.type === 'emi') ||
      e.description.toLowerCase().includes('emi') ||
      e.description.toLowerCase().includes('installment')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    const prepayments = vehicleExpenses.filter(e => 
      (e.paymentType === 'prepayment') || 
      (e.type === 'prepayment') ||
      e.description.toLowerCase().includes('prepayment') ||
      e.description.toLowerCase().includes('principal')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate total expenses excluding prepayments
    const operationalExpenses = vehicleExpenses.filter(e => 
      !(e.paymentType === 'prepayment' || e.type === 'prepayment' ||
        e.description.toLowerCase().includes('prepayment') ||
        e.description.toLowerCase().includes('principal'))
    );
    
    const totalExpenses = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // All other operational expenses go into "Other Expenses"
    const categorizedExpenses = fuelExpenses + maintenanceExpenses + insuranceExpenses + 
                               penaltyExpenses + emiPayments;
    const otherExpenses = totalExpenses - categorizedExpenses;
    
    // Calculate monthly average (last 12 months) - exclude prepayments
    const currentDate = new Date();
    const lastYear = new Date(currentDate.getFullYear(), currentDate.getMonth() - 12, currentDate.getDate());
    const recentExpenses = vehicleExpenses.filter(e => new Date(e.createdAt) >= lastYear);
    const recentOperationalExpenses = recentExpenses.filter(e => 
      !(e.paymentType === 'prepayment' || e.type === 'prepayment' ||
        e.description.toLowerCase().includes('prepayment') ||
        e.description.toLowerCase().includes('principal'))
    );
    const monthlyAverage = recentOperationalExpenses.length > 0 ? recentOperationalExpenses.reduce((sum, e) => sum + e.amount, 0) / 12 : 0;
    
    // Get recent expenses (last 10)
    const recentExpensesList = vehicleExpenses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    return {
      totalExpenses,
      monthlyAverage,
      fuelExpenses,
      maintenanceExpenses,
      insuranceExpenses,
      penaltyExpenses,
      emiPayments,
      prepayments,
      otherExpenses,
      recentExpenses: recentExpensesList,
      expenseRatio: financialData?.totalEarnings ? (totalExpenses / financialData.totalEarnings) * 100 : 0,
      vehicleExpenses // Add the filtered vehicle expenses array
    };
  };

  const expenseData = getVehicleExpenseData();

  const handleInsuranceAdded = () => {
    // Refresh the vehicle data to show the new insurance record
    // The AddInsuranceRecordForm handles all the Firebase operations
    // We just need to trigger a re-render of the component
    window.location.reload();
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!vehicle) {
    return <div className="p-6">Vehicle not found</div>;
  }

  if (!financialData) {
    return <div className="p-6">Error loading financial data</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/utility')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Utility
          </Button>
          <h1 className="text-xl font-semibold">Expense Tracking - {vehicle.vehicleName}</h1>
        </div>
        
        {/* Horizontal Vehicle Selector */}
        <div className="overflow-x-auto pb-2 px-1 pt-1">
          <div className="flex gap-3 min-w-max">
            {vehicles.map((v) => (
              <div
                key={v.id}
                onClick={() => navigate(`/expenses?vehicleId=${v.id}`)}
                className={`cursor-pointer transition-all duration-200 ${
                  v.id === vehicleId
                    ? 'bg-blue-500 shadow-md'
                    : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                } rounded-lg p-3 min-w-[200px]`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    v.id === vehicleId ? 'bg-blue-600' : 'bg-gray-100'
                  }`}>
                    <span className={`font-semibold ${
                      v.id === vehicleId ? 'text-white' : 'text-gray-600'
                    }`}>
                      {v.vehicleName?.charAt(0) || 'V'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium text-sm ${
                      v.id === vehicleId ? 'text-white' : 'text-gray-900'
                    }`}>
                      {v.vehicleName}
                    </h3>
                    <p className={`text-xs ${
                      v.id === vehicleId ? 'text-blue-100' : 'text-gray-500'
                    }`}>{v.make} {v.model}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-6">
        <ExpensesTab
          expenseData={expenseData}
          financialData={financialData}
          addExpenseDialogOpen={addExpenseDialogOpen}
          setAddExpenseDialogOpen={setAddExpenseDialogOpen}
          addInsuranceDialogOpen={addInsuranceDialogOpen}
          setAddInsuranceDialogOpen={setAddInsuranceDialogOpen}
          onInsuranceAdded={handleInsuranceAdded}
        />
      </div>

      {/* Add Expense Dialog - Must be outside ExpensesTab */}
      {userInfo?.role !== Role.PARTNER && (
        <Dialog open={addExpenseDialogOpen} onOpenChange={(open) => {
          setAddExpenseDialogOpen(open);
          if (!open) {
            // Reset any state if needed when closing
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <AddExpenseForm
              vehicleId={vehicleId!}
              onSuccess={() => {
                setAddExpenseDialogOpen(false);
                // Refresh data if needed
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StandaloneExpensesTab;