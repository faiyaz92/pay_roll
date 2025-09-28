import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, User, Phone, MapPin, Truck, Clock, FileText, Eye } from 'lucide-react';
import AddItemModal from '@/components/Modals/AddItemModal';
import AddDriverForm from '@/components/Forms/AddDriverForm';
import { useDrivers } from '@/hooks/useFirebaseData';

const Drivers: React.FC = () => {
  const navigate = useNavigate();
  const { drivers, loading, addDriver, updateDriver, deleteDriver } = useDrivers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  // Delete driver handler
  const handleDeleteDriver = async (driverId: string) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await deleteDriver(driverId);
        // Optionally show toast
      } catch (error) {
        // Optionally show error toast
      }
    }
  };

  // Edit modal success handler
  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setEditDriver(null);
  };

  console.log('=== DRIVERS DEBUG INFO ===');
  console.log('Drivers component render');
  console.log('drivers:', drivers);
  console.log('loading:', loading);
  console.log('drivers length:', drivers?.length);
  console.log('drivers type:', typeof drivers);
  console.log('drivers array check:', Array.isArray(drivers));
  console.log('=== END DEBUG INFO ===');

  // Sort drivers to show actively engaged drivers first
  const sortedDrivers = [...drivers].sort((a, b) => {
    // Priority 1: Active drivers with assignments first
    const aHasAssignments = a.rentedVehicles && a.rentedVehicles.length > 0;
    const bHasAssignments = b.rentedVehicles && b.rentedVehicles.length > 0;
    
    if (aHasAssignments && !bHasAssignments) return -1;
    if (!aHasAssignments && bHasAssignments) return 1;
    
    // Priority 2: Active status
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    
    // Priority 3: Name alphabetically
    return a.name.localeCompare(b.name);
  });

  // Debug Firestore paths
  useEffect(() => {
    const debugPaths = async () => {
      try {
        const { useFirestorePaths } = await import('@/hooks/useFirestorePaths');
        const { useAuth } = await import('@/contexts/AuthContext');
        
        const authContext = useAuth();
        const paths = useFirestorePaths(authContext.userInfo?.companyId);
        const path = paths.getUsersPath();
        console.log('=== FIRESTORE PATH DEBUG ===');
        console.log('Firestore path being used for drivers:', path);
        console.log('Company ID:', authContext.userInfo?.companyId);
        console.log('=== END PATH DEBUG ===');
      } catch (error) {
        console.error('Error getting path:', error);
      }
    };
    debugPaths();
  }, []);

  const getStatusBadge = (driver: any) => {
    if (!driver.isActive) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    
    if (driver.rentedVehicles && driver.rentedVehicles.length > 0) {
      return <Badge className="bg-blue-100 text-blue-800">On Assignment</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800">Available</Badge>;
  };

  const handleAddSuccess = () => {
    setIsModalOpen(false);
  };

  // Test function to add a driver directly to Firestore for debugging
  const addTestDriver = async () => {
    console.log('=== ADD TEST DRIVER STARTED ===');
    try {
      const { useAuth } = await import('@/contexts/AuthContext');
      const { useDrivers } = await import('@/hooks/useFirebaseData');
      
      // Get current user info
      const authContext = useAuth();
      console.log('Auth context:', authContext);
      console.log('Current user info:', authContext.userInfo);
      console.log('Company ID:', authContext.userInfo?.companyId);
      
      const testDriverData = {
        name: 'Test Driver Debug',
        email: 'testdriver@example.com',
        phone: '1234567890',
        licenseNumber: 'DL123456789',
        address: 'Test Address, Test City, Test State',
        rentedVehicles: [],
        totalWeeklyRent: 0,
        joinDate: new Date().toISOString(),
        isActive: true,
        companyId: authContext.userInfo?.companyId || 'test-company-123',
        userType: 'Driver',
        documents: {
          drivingLicense: null,
          idCard: null,
          photo: null,
          additional: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Test driver data to save:', testDriverData);
      
      // Use addDriver from useFirebaseData
      const result = await addDriver(testDriverData);
      console.log('Test driver save result:', result);
      console.log('=== ADD TEST DRIVER COMPLETED ===');
      
    } catch (error) {
      console.error('=== ADD TEST DRIVER ERROR ===');
      console.error('Error adding test driver:', error);
      console.error('Error details:', error);
    }
  };

  // Debug function to directly check Firestore collection
  const checkFirestoreDirectly = async () => {
    console.log('=== FIRESTORE DIRECT CHECK STARTED ===');
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { firestore } = await import('@/config/firebase');
      const { useFirestorePaths } = await import('@/hooks/useFirestorePaths');
      const { useAuth } = await import('@/contexts/AuthContext');
      
      const authContext = useAuth();
      const paths = useFirestorePaths(authContext.userInfo?.companyId);
      const usersPath = paths.getUsersPath();
      
      console.log('Checking Firestore path:', usersPath);
      console.log('Company ID used:', authContext.userInfo?.companyId);
      
      // Get all documents in the users collection
      const usersRef = collection(firestore, usersPath);
      const allDocsSnapshot = await getDocs(usersRef);
      
      console.log('Total documents in users collection:', allDocsSnapshot.docs.length);
      allDocsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Document ${index + 1}:`, {
          id: doc.id,
          userType: data.userType,
          name: data.name,
          email: data.email,
          data: data
        });
      });
      
      // Query specifically for drivers
      const driversQuery = query(usersRef, where('userType', '==', 'Driver'));
      const driversSnapshot = await getDocs(driversQuery);
      
      console.log('Documents with userType=Driver:', driversSnapshot.docs.length);
      driversSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Driver ${index + 1}:`, {
          id: doc.id,
          name: data.name,
          email: data.email,
          userType: data.userType
        });
      });
      
      console.log('=== FIRESTORE DIRECT CHECK COMPLETED ===');
      
    } catch (error) {
      console.error('=== FIRESTORE DIRECT CHECK ERROR ===');
      console.error('Error checking Firestore directly:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
            <p className="text-gray-600 mt-2">Manage your fleet drivers and their assignments</p>
          </div>
          <AddItemModal
            title="Add New Driver"
            buttonText="Add Driver"
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <AddDriverForm onSuccess={handleAddSuccess} />
          </AddItemModal>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600 mt-2">Manage your fleet drivers and their assignments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addTestDriver} variant="secondary">
            🧪 Add Test Driver
          </Button>
          <Button onClick={checkFirestoreDirectly} variant="outline">
            🔍 Check Firestore
          </Button>
          <AddItemModal
            title="Add New Driver"
            buttonText="Add Driver"
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <AddDriverForm onSuccess={handleAddSuccess} />
          </AddItemModal>
        </div>
      </div>

      {sortedDrivers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
            <p className="text-gray-500 text-center mb-4">
              Get started by adding your first driver to the system.
            </p>
            <AddItemModal
              title="Add New Driver"
              buttonText="Add First Driver"
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
            >
              <AddDriverForm onSuccess={handleAddSuccess} />
            </AddItemModal>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {driver.documents?.photo?.url || driver.photoUrl ? (
                        <img
                          src={driver.documents?.photo?.url || driver.photoUrl}
                          alt={driver.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <User className={`w-6 h-6 text-gray-600 fallback-icon ${driver.documents?.photo?.url || driver.photoUrl ? 'hidden' : 'flex'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{driver.name}</CardTitle>
                      <p className="text-sm text-gray-500">{driver.id}</p>
                    </div>
                  </div>
                  {getStatusBadge(driver)}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <div className="space-y-4 flex-grow">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{driver.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{driver.address || 'Address not set'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">License:</span>
                      <span className="font-medium">{driver.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium">{driver.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="font-medium">{driver.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  {driver.rentedVehicles && driver.rentedVehicles.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span>Vehicles: {driver.rentedVehicles.length} rented</span>
                    </div>
                  )}

                  {/* Document Status */}
                  {driver.documents && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Documents:</span>
                      <div className="flex space-x-1">
                        <Badge variant={driver.documents.drivingLicense ? "default" : "secondary"} className="text-xs">
                          License
                        </Badge>
                        <Badge variant={driver.documents.idCard ? "default" : "secondary"} className="text-xs">
                          ID
                        </Badge>
                        <Badge variant={driver.documents.photo ? "default" : "secondary"} className="text-xs">
                          Photo
                        </Badge>
                        {driver.documents.additional?.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{driver.documents.additional.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Weekly Rent</p>
                      <p className="font-bold text-lg">₹{driver.totalWeeklyRent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Join Date</p>
                      <p className="font-medium">{new Date(driver.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Always at bottom */}
                <div className="space-y-2 pt-4">
                  {/* First row: Profile and Assignment */}
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/drivers/${driver.id}`)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/drivers/${driver.id}?tab=assignments`)}
                    >
                      Assignment
                    </Button>
                  </div>
                  {/* Second row: Edit and Delete */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditDriver(driver);
                        setEditModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteDriver(driver.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    {/* Edit Driver Modal */}
    {editDriver && (
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Driver: {editDriver.name}
            </DialogTitle>
          </DialogHeader>
          <AddDriverForm 
            driver={editDriver} 
            onSuccess={handleEditSuccess} 
            mode="edit" 
          />
        </DialogContent>
      </Dialog>
    )}
    </div>
  );
};

export default Drivers;
