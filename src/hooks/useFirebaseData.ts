
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, where, orderBy } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  experience: string;
  status: 'available' | 'on-trip' | 'off-duty';
  currentLocation: string;
  assignedVehicle?: string;
  totalTrips: number;
  rating: number;
  joinDate: string;
  companyId: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  capacity: string;
  fuelType: string;
  status: 'active' | 'maintenance' | 'available';
  currentDriver?: string;
  currentLocation: string;
  mileage: string;
  lastMaintenance: string;
  nextMaintenance: string;
  totalKms: number;
  insuranceExpiry: string;
  companyId: string;
}

export interface Trip {
  id: string;
  driver: string;
  vehicle: string;
  route: string;
  status: 'pending' | 'in-progress' | 'completed';
  startTime: string;
  estimatedArrival: string;
  currentLoad: string;
  totalCapacity: string;
  distance: string;
  fuelConsumption: string;
  progress?: number;
  currentLocation?: string;
  companyId: string;
}

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const driversRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/drivers`);
    const q = query(driversRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const driversData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Driver[];
      setDrivers(driversData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  const addDriver = async (driverData: Omit<Driver, 'id'>) => {
    if (!userInfo?.companyId) return;
    const driversRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/drivers`);
    return await addDoc(driversRef, { ...driverData, companyId: userInfo.companyId });
  };

  return { drivers, loading, addDriver };
};

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const vehiclesRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/vehicles`);
    const q = query(vehiclesRef, orderBy('registrationNumber'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehiclesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];
      setVehicles(vehiclesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
    if (!userInfo?.companyId) return;
    const vehiclesRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/vehicles`);
    return await addDoc(vehiclesRef, { ...vehicleData, companyId: userInfo.companyId });
  };

  return { vehicles, loading, addVehicle };
};

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const tripsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/trips`);
    const q = query(tripsRef, orderBy('startTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trip[];
      setTrips(tripsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  const addTrip = async (tripData: Omit<Trip, 'id'>) => {
    if (!userInfo?.companyId) return;
    const tripsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/trips`);
    return await addDoc(tripsRef, { ...tripData, companyId: userInfo.companyId });
  };

  return { trips, loading, addTrip };
};

export const useDashboardStats = () => {
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();
  const { trips } = useTrips();

  const stats = {
    activeTrips: trips.filter(trip => trip.status === 'in-progress').length,
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter(vehicle => vehicle.status === 'available').length,
    activeDrive: drivers.filter(driver => driver.status !== 'off-duty').length,
    onTripDrivers: drivers.filter(driver => driver.status === 'on-trip').length,
    completedTrips: trips.filter(trip => trip.status === 'completed').length,
  };

  return stats;
};
