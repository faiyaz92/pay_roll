import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FuelPriceManager from '@/components/Forms/FuelPriceManager';

const FuelPrices: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Fuel Price Management</h1>
        <p className="text-muted-foreground">
          Set current fuel prices for automatic trip cost calculations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Fuel Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <FuelPriceManager />
        </CardContent>
      </Card>
    </div>
  );
};

export default FuelPrices;