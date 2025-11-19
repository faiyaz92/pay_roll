import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleSelectionDialog } from '@/components/VehicleDetails/VehicleSelectionDialog';
import { CreditCard, DollarSign, TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
            </div>
            <div className="text-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Utility Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Quick access to vehicle financial management tools</p>
            </div>
            <div className="w-24 sm:w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] aspect-square md:aspect-auto flex flex-col"
            onClick={() => handleCardClick('emi')}
          >
            <CardHeader className="pb-2 flex-shrink-0 md:pb-3">
              <CardTitle className="flex flex-col items-center gap-2 text-sm sm:text-base md:text-lg">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 md:h-6 md:w-6 text-blue-600" />
                <span className="text-center">EMI Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center leading-tight">
                Track and manage vehicle loan EMI payments, schedules, and overdue amounts.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] aspect-square md:aspect-auto flex flex-col"
            onClick={() => handleCardClick('rent')}
          >
            <CardHeader className="pb-2 flex-shrink-0 md:pb-3">
              <CardTitle className="flex flex-col items-center gap-2 text-sm sm:text-base md:text-lg">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 md:h-6 md:w-6 text-green-600" />
                <span className="text-center">Rent Collection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center leading-tight">
                Monitor weekly rent payments, track overdue amounts, and manage driver assignments.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] aspect-square md:aspect-auto flex flex-col"
            onClick={() => handleCardClick('expenses')}
          >
            <CardHeader className="pb-2 flex-shrink-0 md:pb-3">
              <CardTitle className="flex flex-col items-center gap-2 text-sm sm:text-base md:text-lg">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 md:h-6 md:w-6 text-orange-600" />
                <span className="text-center">Expense Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center leading-tight">
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