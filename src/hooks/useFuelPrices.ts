import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestorePaths } from './useFirestorePaths';

export interface FuelPrice {
  id: string;
  fuelType: 'Diesel' | 'Petrol' | 'CNG' | 'Electric';
  pricePerLiter: number;
  pricePerKg?: number; // for CNG
  pricePerUnit?: number; // for Electric
  lastUpdated: string;
  companyId: string;
}

export const useFuelPrices = () => {
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const paths = useFirestorePaths(userInfo?.companyId);

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const fuelPricesRef = collection(firestore, paths.getFuelPricesPath());
    const q = query(fuelPricesRef, orderBy('fuelType'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fuelPricesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FuelPrice[];
      setFuelPrices(fuelPricesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  const updateFuelPrice = async (fuelType: string, priceData: Partial<FuelPrice>) => {
    if (!userInfo?.companyId) return;
    
    const fuelPriceRef = doc(firestore, paths.getFuelPricesPath(), fuelType);
    return await setDoc(fuelPriceRef, {
      ...priceData,
      fuelType,
      lastUpdated: new Date().toISOString(),
      companyId: userInfo.companyId
    }, { merge: true });
  };

  const getFuelPrice = (fuelType: string): FuelPrice | null => {
    return fuelPrices.find(fp => fp.fuelType === fuelType) || null;
  };

  const calculateFuelCost = (vehicleMileage: number, mileageUnit: 'kmpl' | 'kmkg', distance: number, fuelType: string): number => {
    const fuelPrice = getFuelPrice(fuelType);
    if (!fuelPrice || !vehicleMileage || !distance) return 0;

    let fuelConsumption = distance / vehicleMileage; // liters or kg consumed
    let pricePerUnit = 0;

    if (mileageUnit === 'kmpl') {
      pricePerUnit = fuelPrice.pricePerLiter;
    } else if (mileageUnit === 'kmkg') {
      pricePerUnit = fuelPrice.pricePerKg || fuelPrice.pricePerLiter;
    }

    return fuelConsumption * pricePerUnit;
  };

  return {
    fuelPrices,
    loading,
    updateFuelPrice,
    getFuelPrice,
    calculateFuelCost
  };
};