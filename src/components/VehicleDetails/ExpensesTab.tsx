import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Fuel, Settings, Shield, CreditCard, Banknote, DollarSign, Plus, AlertCircle, Eye, ExternalLink } from 'lucide-react';
import { VehicleFinancialData, Expense } from '@/hooks/useFirebaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/user';
import AddInsuranceRecordForm from '@/components/Forms/AddInsuranceRecordForm';
import { SectionNumberBadge } from './SectionNumberBadge';

interface ExpenseData {
  totalExpenses: number;
  monthlyAverage: number;
  recentExpenses: Expense[];
  expenseRatio: number;
  fuelExpenses: number;
  maintenanceExpenses: number;
  insuranceExpenses: number;
  emiPayments: number;
  prepayments: number;
  penaltyExpenses: number;
  otherExpenses: number;
}

interface ExpensesTabProps {
  expenseData: ExpenseData;
  financialData: VehicleFinancialData;
  addExpenseDialogOpen: boolean;
  setAddExpenseDialogOpen: (open: boolean) => void;
  addInsuranceDialogOpen: boolean;
  setAddInsuranceDialogOpen: (open: boolean) => void;
  onInsuranceAdded?: () => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenseData,
  financialData,
  addExpenseDialogOpen,
  setAddExpenseDialogOpen,
  addInsuranceDialogOpen,
  setAddInsuranceDialogOpen,
  onInsuranceAdded
}) => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <SectionNumberBadge id="1" label="Expenses Overview" className="mb-2" />
            <h3 className="text-lg font-semibold">Vehicle Expenses</h3>
            <p className="text-sm text-gray-600 mt-1">
              Track fuel, maintenance, and other vehicle-related expenses
            </p>
          </div>
          <div className="flex gap-2">
            {userInfo?.role !== Role.PARTNER && (
              <>
                <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                </Dialog>
                <Dialog open={addInsuranceDialogOpen} onOpenChange={setAddInsuranceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Insurance
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Expense Summary Cards */}
        <div className="mb-6">
          <SectionNumberBadge id="2" label="Expense Summary Cards" className="mb-2" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-red-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  ₹{expenseData.totalExpenses.toLocaleString()}
                </div>
                <div className="text-sm text-red-700">Total Expenses</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{Math.round(expenseData.monthlyAverage).toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">Monthly Average</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {expenseData.recentExpenses.length}
                </div>
                <div className="text-sm text-yellow-700">Total Records</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {expenseData.expenseRatio.toFixed(1)}%
                </div>
                <div className="text-sm text-green-700">Expense Ratio</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="mb-6">
          <SectionNumberBadge id="3" label="Expense Categories" className="mb-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-blue-600" />
                  Fuel Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-medium">₹{Math.round(expenseData.fuelExpenses / 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="font-medium">₹{expenseData.fuelExpenses.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {expenseData.totalExpenses > 0 ? ((expenseData.fuelExpenses / expenseData.totalExpenses) * 100).toFixed(1) : '0'}% of total expenses
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-medium">₹{Math.round(expenseData.maintenanceExpenses / 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="font-medium">₹{expenseData.maintenanceExpenses.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {expenseData.totalExpenses > 0 ? ((expenseData.maintenanceExpenses / expenseData.totalExpenses) * 100).toFixed(1) : '0'}% of total expenses
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Insurance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-medium">₹{Math.round(expenseData.insuranceExpenses / 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="font-medium">₹{expenseData.insuranceExpenses.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {expenseData.totalExpenses > 0 ? ((expenseData.insuranceExpenses / expenseData.totalExpenses) * 100).toFixed(1) : '0'}% of total expenses
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  EMI Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-medium">₹{Math.round(expenseData.emiPayments / 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="font-medium">₹{expenseData.emiPayments.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Monthly loan payments
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-orange-600" />
                  Prepayments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-medium">₹{Math.round(expenseData.prepayments / 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="font-medium">₹{expenseData.prepayments.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Early loan payments
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  Other Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Penalties</span>
                    <span className="font-medium">₹{expenseData.penaltyExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">General</span>
                    <span className="font-medium">₹{expenseData.otherExpenses.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Permits, fines, misc. expenses
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Expenses Table */}
        <Card>
          <CardHeader>
            <SectionNumberBadge id="4" label="Recent Expenses" className="mb-2" />
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseData.recentExpenses.length > 0 ? (
                <div className="space-y-3">
                  {expenseData.recentExpenses.map((expense, index) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          expense.description.toLowerCase().includes('fuel') ? 'bg-blue-100' :
                          expense.type === 'maintenance' ? 'bg-orange-100' :
                          expense.type === 'insurance' ? 'bg-green-100' :
                          expense.type === 'penalties' ? 'bg-red-100' :
                          expense.type === 'emi' ? 'bg-indigo-100' :
                          expense.type === 'prepayment' ? 'bg-orange-100' :
                          'bg-purple-100'
                        }`}>
                          {expense.description.toLowerCase().includes('fuel') ? (
                            <Fuel className="h-4 w-4 text-blue-600" />
                          ) : expense.type === 'maintenance' ? (
                            <Settings className="h-4 w-4 text-orange-600" />
                          ) : expense.type === 'insurance' ? (
                            <Shield className="h-4 w-4 text-green-600" />
                          ) : expense.type === 'penalties' ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : expense.type === 'emi' ? (
                            <CreditCard className="h-4 w-4 text-indigo-600" />
                          ) : expense.type === 'prepayment' ? (
                            <Banknote className="h-4 w-4 text-orange-600" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          <div className="text-sm text-gray-500">
                            {expense.type === 'maintenance' ? 'Maintenance' :
                             expense.type === 'insurance' ? 'Insurance' :
                             expense.type === 'penalties' ? 'Penalties' :
                             expense.type === 'emi' ? 'EMI Payment' :
                             expense.type === 'prepayment' ? 'Prepayment' :
                             expense.description.toLowerCase().includes('fuel') ? 'Fuel' :
                             'General Expense'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <div className="font-medium text-red-600">₹{expense.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">{new Date(expense.createdAt).toLocaleDateString()}</div>
                        </div>
                        {expense.expenseDocuments && Object.keys(expense.expenseDocuments).length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/expense-details/${expense.id}`)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No expenses recorded yet</p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Expense
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6"></div>

        {/* Expense Analysis */}
        <Card>
          <CardHeader>
            <SectionNumberBadge id="5" label="Expense Analysis" className="mb-2" />
            <CardTitle>Expense Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Monthly Trends</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Month</span>
                    <span className="font-medium">₹{Math.round(expenseData.monthlyAverage).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average Monthly</span>
                    <span className="font-medium">₹{Math.round(expenseData.totalExpenses / 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Records</span>
                    <span className="font-medium">{expenseData.recentExpenses.length} transactions</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Expense vs Earnings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Earnings</span>
                    <span className="font-medium text-green-600">₹{financialData.totalEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Expenses</span>
                    <span className="font-medium text-red-600">₹{expenseData.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expense Ratio</span>
                    <span className="font-medium">
                      {expenseData.expenseRatio.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Insurance Dialog */}
      <Dialog open={addInsuranceDialogOpen} onOpenChange={setAddInsuranceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <SectionNumberBadge id="6" label="Add Insurance Dialog" className="mb-2" />
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Add Insurance Record
            </DialogTitle>
          </DialogHeader>
          <AddInsuranceRecordForm
            onSuccess={() => {
              setAddInsuranceDialogOpen(false);
              onInsuranceAdded?.();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};