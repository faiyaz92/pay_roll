import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, User, Phone, MapPin, Truck, Clock, FileText, Eye, UserPlus } from 'lucide-react';
import AddPartnerForm from '@/components/Forms/AddPartnerForm';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Role, UserInfo } from '@/types/user';

const Partners: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const { vehicles } = useFirebaseData();
  const [partners, setPartners] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<UserInfo | null>(null);

  // Load partners
  useEffect(() => {
    if (!userInfo?.companyId) return;

    const partnersRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/users`);
    const q = query(partnersRef, where('role', '==', Role.PARTNER));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const partnersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        userId: doc.id
      })) as UserInfo[];
      setPartners(partnersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.companyId]);

  // Get vehicles assigned to a partner
  const getPartnerVehicles = (partnerId: string) => {
    return vehicles.filter(vehicle => vehicle.assignedDriverId === partnerId);
  };

  // Add partner handler
  const handleAddPartner = async (partnerData: any) => {
    try {
      if (!userInfo?.companyId) return;

      const partnersRef = collection(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/users`);
      await addDoc(partnersRef, {
        ...partnerData,
        role: Role.PARTNER,
        companyId: userInfo.companyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      });

      toast({
        title: 'Partner Added Successfully',
        description: `${partnerData.name} has been added as a partner.`,
      });

      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add partner',
        variant: 'destructive'
      });
    }
  };

  // Update partner handler
  const handleUpdatePartner = async (partnerData: any) => {
    try {
      if (!editPartner || !userInfo?.companyId) return;

      const partnerRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/users`, editPartner.userId);
      await updateDoc(partnerRef, {
        ...partnerData,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Partner Updated Successfully',
        description: `${partnerData.name} has been updated.`,
      });

      setEditModalOpen(false);
      setEditPartner(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update partner',
        variant: 'destructive'
      });
    }
  };

  // Delete partner handler
  const handleDeletePartner = async (partnerId: string) => {
    if (window.confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      try {
        if (!userInfo?.companyId) return;

        const partnerRef = doc(firestore, `Easy2Solutions/companyDirectory/tenantCompanies/${userInfo.companyId}/users`, partnerId);
        await deleteDoc(partnerRef);

        toast({
          title: 'Partner Deleted',
          description: 'Partner has been removed from the system.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete partner',
          variant: 'destructive'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading partners...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Partners</h1>
          <p className="text-gray-600 mt-2">Manage your business partners</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((partner) => (
          <Card key={partner.userId} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  {partner.name}
                </CardTitle>
                <Badge variant={partner.isActive ? "default" : "secondary"}>
                  {partner.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {partner.mobileNumber || 'No phone'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {partner.address || 'No address'}
                </div>
              </div>

              {/* Vehicles Count */}
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-green-600" />
                <span>{getPartnerVehicles(partner.userId).length} vehicles assigned</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditPartner(partner);
                    setEditModalOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePartner(partner.userId)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {partners.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Partners Yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Add your first business partner to start managing shared vehicles.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Partner
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Partner Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Partner</DialogTitle>
          </DialogHeader>
          <AddPartnerForm
            onSuccess={handleAddPartner}
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Partner Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Partner</DialogTitle>
          </DialogHeader>
          {editPartner && (
            <AddPartnerForm
              initialData={editPartner}
              mode="edit"
              onSuccess={handleUpdatePartner}
              onCancel={() => {
                setEditModalOpen(false);
                setEditPartner(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Partners;