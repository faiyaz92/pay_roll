import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFuelPrices } from '@/hooks/useFuelPrices';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const FuelPriceManager: React.FC = () => {
  const { fuelPrices, updateFuelPrice } = useFuelPrices();
  const { toast } = useToast();
  const [prices, setPrices] = useState<{[key: string]: string}>({});

  const fuelTypes = ['Diesel', 'Petrol', 'CNG', 'Electric'];

  const handlePriceChange = (fuelType: string, price: string) => {
    setPrices(prev => ({ ...prev, [fuelType]: price }));
  };

  const handleUpdatePrice = async (fuelType: string) => {
    const price = parseFloat(prices[fuelType]);
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    try {
      const priceData: any = { pricePerLiter: price };
      
      if (fuelType === 'CNG') {
        priceData.pricePerKg = price;
      } else if (fuelType === 'Electric') {
        priceData.pricePerUnit = price;
      }

      await updateFuelPrice(fuelType, priceData);
      toast({
        title: 'Success',
        description: `${fuelType} price updated successfully`,
      });
      setPrices(prev => ({ ...prev, [fuelType]: '' }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update fuel price',
        variant: 'destructive',
      });
    }
  };

  const getCurrentPrice = (fuelType: string): number => {
    const fuelPrice = fuelPrices.find(fp => fp.fuelType === fuelType);
    if (!fuelPrice) return 0;
    
    if (fuelType === 'CNG') return fuelPrice.pricePerKg || 0;
    if (fuelType === 'Electric') return fuelPrice.pricePerUnit || 0;
    return fuelPrice.pricePerLiter;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Fuel Price Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fuelTypes.map((fuelType) => (
          <Card key={fuelType}>
            <CardHeader>
              <CardTitle className="text-sm">
                {fuelType} - Current: ₹{getCurrentPrice(fuelType)}/
                {fuelType === 'CNG' ? 'kg' : fuelType === 'Electric' ? 'unit' : 'liter'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor={`price-${fuelType}`}>
                  New Price (₹/{fuelType === 'CNG' ? 'kg' : fuelType === 'Electric' ? 'unit' : 'liter'})
                </Label>
                <Input
                  id={`price-${fuelType}`}
                  type="number"
                  step="0.1"
                  placeholder="Enter price"
                  value={prices[fuelType] || ''}
                  onChange={(e) => handlePriceChange(fuelType, e.target.value)}
                />
              </div>
              <Button 
                onClick={() => handleUpdatePrice(fuelType)}
                className="w-full"
                disabled={!prices[fuelType]}
              >
                Update Price
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FuelPriceManager;