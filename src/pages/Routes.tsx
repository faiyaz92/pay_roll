import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Route as RouteIcon, Edit, Trash2, MapPin } from 'lucide-react';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddRouteForm from '@/components/Forms/AddRouteForm';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Route, City } from '@/types/user';

const Routes: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userInfo } = useAuth();
  const { toast } = useToast();

  const fetchRoutes = async () => {
    if (!userInfo?.companyId) return;

    try {
      const routesRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/routes`);
      const querySnapshot = await getDocs(routesRef);
      
      const routesData: Route[] = [];
      querySnapshot.forEach((doc) => {
        routesData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as Route);
      });

      setRoutes(routesData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch routes',
        variant: 'destructive',
      });
    }
  };

  const fetchCities = async () => {
    if (!userInfo?.companyId) return;

    try {
      const citiesRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cities`);
      const querySnapshot = await getDocs(citiesRef);
      
      const citiesData: City[] = [];
      querySnapshot.forEach((doc) => {
        citiesData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as City);
      });

      setCities(citiesData);
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!userInfo?.companyId) return;

    try {
      await deleteDoc(doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/routes`, routeId));
      toast({
        title: 'Success',
        description: 'Route deleted successfully',
      });
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete route',
        variant: 'destructive',
      });
    }
  };

  const getCityName = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : 'Unknown City';
  };

  const getWaypointNames = (waypoints?: string[]) => {
    if (!waypoints || waypoints.length === 0) return '-';
    return waypoints.map(cityId => getCityName(cityId)).join(' → ');
  };

  useEffect(() => {
    Promise.all([fetchRoutes(), fetchCities()]);
  }, [userInfo?.companyId]);

  const activeRoutes = routes.filter(route => route.isActive);
  const inactiveRoutes = routes.filter(route => !route.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Routes Management</h1>
          <p className="text-gray-600 mt-2">Manage transportation routes with stops</p>
        </div>
        <AddItemModal
          title="Add New Route"
          buttonText="Add Route"
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <AddRouteForm 
            onSuccess={() => {
              setIsModalOpen(false);
              fetchRoutes();
            }} 
          />
        </AddItemModal>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <RouteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRoutes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Routes</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveRoutes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Cities</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cities.filter(c => c.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routes List</CardTitle>
          <CardDescription>
            Manage your transportation routes with pickup, drop-off, and intermediate stops
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading routes...</div>
          ) : routes.length === 0 ? (
            <div className="text-center py-8">
              <RouteIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No routes</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first route.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Via (Stops)</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Base Fare</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">{route.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{getCityName(route.fromCity)}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm">{getCityName(route.toCity)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {getWaypointNames(route.waypoints)}
                      </span>
                    </TableCell>
                    <TableCell>{route.distance} km</TableCell>
                    <TableCell>{Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m</TableCell>
                    <TableCell>₹{route.baseFare || 0}</TableCell>
                    <TableCell>
                      <Badge variant={route.isActive ? "default" : "secondary"}>
                        {route.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteRoute(route.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Routes;