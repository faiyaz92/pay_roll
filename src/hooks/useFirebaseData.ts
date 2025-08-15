
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, where, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Role, TenantCompanyType, Route, City, TripExpense, FuelRecord, MaintenanceRecord } from '@/types/user';

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
  userId?: string; // Link to auth user
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
  mileage: string; // kmpl/kmkg format like "15 kmpl" or "8 kmkg"
  mileageValue: number; // numeric value for calculations
  mileageUnit: 'kmpl' | 'kmkg'; // unit type
  lastMaintenance: string;
  nextMaintenance: string;
  totalKms: number;
  insuranceExpiry: string;
  companyId: string;
}

export interface TripStop {
  id: string;
  stopName: string;
  loadAmount: number;
  unloadAmount: number;
  notes?: string;
  reachedAt: string;
  status: 'pending' | 'reached';
}

export interface TripCollection {
  id: string;
  amount: number;
  description: string;
  location: string;
  collectedAt: string;
}

export interface TripExpenseRecord {
  id: string;
  amount: number;
  category: string;
  description: string;
  location: string;
  incurredAt: string;
}

export interface Trip {
  id: string;
  driver: string;
  driverId?: string; // Link to auth user ID
  vehicle: string;
  route: string;
  routeId?: string; // Link to selected route
  pickupCity: string;
  dropCity: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  estimatedArrival: string;
  actualArrival?: string;
  currentLoad: string;
  totalCapacity: string;
  distance: string;
  fuelConsumption: string;
  progress?: number;
  currentLocation?: string;
  companyId: string;
  createdBy: string; // Who created this trip (admin or driver)
  createdByRole: Role; // Role of who created the trip
  createdAt: string;
  updatedAt: string;
  pickupLocation: string;
  dropLocation: string;
  customerInfo?: string;
  fare?: number;
  notes?: string;
  totalExpenses?: number;
  driverAllowance?: number;
  cleanerAllowance?: number;
  collection?: number;
  // Subcollections
  stops?: TripStop[];
  collections?: TripCollection[];
  expenses?: TripExpenseRecord[];
}

export interface TripAction {
  tripId: string;
  action: 'start' | 'end' | 'pause' | 'resume';
  performedBy: string;
  performedAt: string;
  location?: string;
  notes?: string;
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

  const updateVehicle = async (vehicleId: string, vehicleData: Partial<Vehicle>) => {
    if (!userInfo?.companyId) return;
    const vehicleRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/vehicles`, vehicleId);
    return await updateDoc(vehicleRef, vehicleData);
  };

  return { vehicles, loading, addVehicle, updateVehicle };
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
    
    // Filter trips based on role
    let q;
    if (userInfo.role === Role.DRIVER) {
      // Drivers see only their own trips
      q = query(tripsRef, where('driverId', '==', userInfo.userId), orderBy('createdAt', 'desc'));
    } else {
      // Admins see all trips
      q = query(tripsRef, orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tripsData = await Promise.all(
        snapshot.docs.map(async (tripDoc) => {
          const tripData = { id: tripDoc.id, ...tripDoc.data() } as Trip;
          
          // Fetch subcollections
          const stopsRef = collection(tripDoc.ref, 'stops');
          const collectionsRef = collection(tripDoc.ref, 'collections');
          const expensesRef = collection(tripDoc.ref, 'expenses');
          
          const [stopsSnapshot, collectionsSnapshot, expensesSnapshot] = await Promise.all([
            getDocs(stopsRef),
            getDocs(collectionsRef),
            getDocs(expensesRef)
          ]);
          
          tripData.stops = stopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TripStop[];
          tripData.collections = collectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TripCollection[];
          tripData.expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TripExpenseRecord[];
          
          return tripData;
        })
      );
      
      setTrips(tripsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId, userInfo?.role, userInfo?.userId]);

  const addTrip = async (tripData: Omit<Trip, 'id'>) => {
    if (!userInfo?.companyId) return;
    const tripsRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/trips`);
    
    const newTrip = {
      ...tripData,
      companyId: userInfo.companyId,
      createdBy: userInfo.userId,
      createdByRole: userInfo.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return await addDoc(tripsRef, newTrip);
  };

  const updateTripStatus = async (tripId: string, status: Trip['status'], location?: string) => {
    if (!userInfo?.companyId) return;
    
    const tripRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/trips`, tripId);
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };
    
    if (location) {
      updateData.currentLocation = location;
    }
    
    if (status === 'in-progress') {
      updateData.startTime = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.endTime = new Date().toISOString();
      updateData.actualArrival = new Date().toISOString();
    }
    
    return await updateDoc(tripRef, updateData);
  };

  return { trips, loading, addTrip, updateTripStatus };
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

// Hook for tenant companies (for customer login)
export const useTenantCompanies = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const companiesRef = collection(firestore, 'Easy2Solutions/companyDirectory/tenantCompanies');
    const q = query(companiesRef, where('companyType', '==', TenantCompanyType.TRANSPORTATION));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { companies, loading };
};

// Hook for routes
export const useRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const routesRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/routes`);
    const q = query(routesRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const routesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Route[];
      setRoutes(routesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  const addRoute = async (routeData: Omit<Route, 'id'>) => {
    if (!userInfo?.companyId) return;
    const routesRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/routes`);
    return await addDoc(routesRef, { ...routeData, companyId: userInfo.companyId });
  };

  return { routes, loading, addRoute };
};

// Hook for cities
export const useCities = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const citiesRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cities`);
    const q = query(citiesRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const citiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as City[];
      setCities(citiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  const addCity = async (cityData: Omit<City, 'id'>) => {
    if (!userInfo?.companyId) return;
    const citiesRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cities`);
    return await addDoc(citiesRef, { ...cityData, companyId: userInfo.companyId });
  };

  return { cities, loading, addCity };
};

// Hook for fuel records
export const useFuelRecords = () => {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const fuelRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/fuelRecords`);
    const q = query(fuelRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fuelData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FuelRecord[];
      setFuelRecords(fuelData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  const addFuelRecord = async (fuelData: Omit<FuelRecord, 'id'>) => {
    if (!userInfo?.companyId) return;
    const fuelRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/fuelRecords`);
    return await addDoc(fuelRef, { ...fuelData, companyId: userInfo.companyId });
  };

  return { fuelRecords, loading, addFuelRecord };
};

// Hook for maintenance records
export const useMaintenanceRecords = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();

  useEffect(() => {
    if (!userInfo?.companyId) {
      setLoading(false);
      return;
    }

    const maintenanceRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/maintenanceRecords`);
    const q = query(maintenanceRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const maintenanceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaintenanceRecord[];
      setMaintenanceRecords(maintenanceData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  const addMaintenanceRecord = async (maintenanceData: Omit<MaintenanceRecord, 'id'>) => {
    if (!userInfo?.companyId) return;
    const maintenanceRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/maintenanceRecords`);
    return await addDoc(maintenanceRef, { ...maintenanceData, companyId: userInfo.companyId });
  };

  return { maintenanceRecords, loading, addMaintenanceRecord };
};

// Enhanced trip management hook for active trips
export const useTripManagement = () => {
  const { userInfo } = useAuth();

  const addTripStop = async (tripId: string, stopData: Omit<TripStop, 'id'>) => {
    if (!userInfo?.companyId) return;
    
    const tripRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/trips`, tripId);
    const stopsRef = collection(tripRef, 'stops');
    
    const docRef = await addDoc(stopsRef, stopData);
    
    // Update the current load in the trip document
    const loadAmount = stopData.loadAmount || 0;
    const unloadAmount = stopData.unloadAmount || 0;
    const currentLoadNumber = parseInt(tripId) || 0; // This should be fetched from trip data
    
    await updateDoc(tripRef, {
      updatedAt: new Date().toISOString()
    });
    
    return docRef;
  };

  const addTripCollection = async (tripId: string, collectionData: Omit<TripCollection, 'id'>) => {
    if (!userInfo?.companyId) return;
    
    const tripRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/trips`, tripId);
    const collectionsRef = collection(tripRef, 'collections');
    
    const docRef = await addDoc(collectionsRef, collectionData);
    
    await updateDoc(tripRef, {
      updatedAt: new Date().toISOString()
    });
    
    return docRef;
  };

  const addTripExpense = async (tripId: string, expenseData: Omit<TripExpenseRecord, 'id'>) => {
    if (!userInfo?.companyId) return;
    
    const tripRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/trips`, tripId);
    const expensesRef = collection(tripRef, 'expenses');
    
    const docRef = await addDoc(expensesRef, expenseData);
    
    await updateDoc(tripRef, {
      updatedAt: new Date().toISOString()
    });
    
    return docRef;
  };

  const markStopReached = async (tripId: string, stopId: string) => {
    if (!userInfo?.companyId) return;
    
    const stopRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/trips/${tripId}/stops`, stopId);
    const tripRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/trips`, tripId);
    
    await updateDoc(stopRef, {
      status: 'reached',
      reachedAt: new Date().toISOString()
    });
    
    // Update trip's updatedAt
    return await updateDoc(tripRef, {
      updatedAt: new Date().toISOString()
    });
  };

  return {
    addTripStop,
    addTripCollection,
    addTripExpense,
    markStopReached
  };
};
