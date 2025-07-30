import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MapPin, Edit, Trash2 } from 'lucide-react';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddCityForm from '@/components/Forms/AddCityForm';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { City } from '@/types/user';

const Cities: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userInfo } = useAuth();
  const { toast } = useToast();

  const fetchCities = async () => {
    if (!userInfo?.companyId) return;

    try {
      const citiesRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cities`);
      const q = query(citiesRef);
      const querySnapshot = await getDocs(q);
      
      const citiesData: City[] = [];
      querySnapshot.forEach((doc) => {
        citiesData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as City);
      });

      setCities(citiesData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching cities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cities',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    if (!userInfo?.companyId) return;

    try {
      await deleteDoc(doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/cities`, cityId));
      toast({
        title: 'Success',
        description: 'City deleted successfully',
      });
      fetchCities();
    } catch (error) {
      console.error('Error deleting city:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete city',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchCities();
  }, [userInfo?.companyId]);

  const activeCities = cities.filter(city => city.isActive);
  const inactiveCities = cities.filter(city => !city.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cities Management</h1>
          <p className="text-gray-600 mt-2">Manage cities for route planning</p>
        </div>
        <AddItemModal
          title="Add New City"
          buttonText="Add City"
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <AddCityForm 
            onSuccess={() => {
              setIsModalOpen(false);
              fetchCities();
            }} 
          />
        </AddItemModal>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cities</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cities</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Cities</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCities.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cities List</CardTitle>
          <CardDescription>
            Manage your cities for transportation routes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading cities...</div>
          ) : cities.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No cities</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first city.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City Name</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Pincode</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell>{city.state}</TableCell>
                    <TableCell>{city.country}</TableCell>
                    <TableCell>{city.pincode || '-'}</TableCell>
                    <TableCell>
                      {city.latitude && city.longitude ? (
                        <span className="text-sm text-gray-600">
                          {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={city.isActive ? "default" : "secondary"}>
                        {city.isActive ? 'Active' : 'Inactive'}
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
                          onClick={() => handleDeleteCity(city.id)}
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

export default Cities;