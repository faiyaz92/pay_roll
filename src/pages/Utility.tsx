import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleSelectionDialog } from '@/components/VehicleDetails/VehicleSelectionDialog';
import { CreditCard, DollarSign, TrendingUp } from 'lucide-react';

const Utility: React.FC = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'emi' | 'rent' | 'expenses' | null>(null);

  const handleCardClick = (tab: 'emi' | 'rent' | 'expenses') => {
    setSelectedTab(tab);
    setDialogOpen(true);
  };

  const handleVehicleSelect = (vehicleId: string) => {
    if (selectedTab) {
      navigate(`/${selectedTab}?vehicleId=${vehicleId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Utility Dashboard</h1>
          <p className="text-gray-600">Quick access to vehicle financial management tools</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick('emi')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-blue-600" />
                EMI Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track and manage vehicle loan EMI payments, schedules, and overdue amounts.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick('rent')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                Rent Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor weekly rent payments, track overdue amounts, and manage driver assignments.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCardClick('expenses')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                Expense Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View and analyze vehicle expenses including fuel, maintenance, insurance, and more.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <VehicleSelectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onVehicleSelect={handleVehicleSelect}
      />
    </div>
  );
};

export default Utility;