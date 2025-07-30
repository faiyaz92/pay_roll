
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, Mail, Phone, MapPin, Eye, Edit, Trash2 } from 'lucide-react';

interface TenantCompany {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  address: string;
  city: string;
  state: string;
  companyType: string;
  fleetSize?: number;
  createdAt: any;
}

const TenantCompaniesList: React.FC = () => {
  const [companies, setCompanies] = useState<TenantCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const companiesRef = collection(db, 'Easy2Solutions/companyDirectory/tenantCompanies');
    const q = query(companiesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TenantCompany[];
      setCompanies(companiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading companies...</div>;
  }

  return (
    <div className="space-y-4">
      {companies.length === 0 ? (
        <div className="text-center py-8">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No companies</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a tenant company.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  <Badge variant="secondary">{company.companyType}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{company.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{company.mobileNumber}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{company.city}, {company.state}</span>
                </div>
                {company.fleetSize && (
                  <div className="text-sm text-gray-600">
                    Fleet Size: {company.fleetSize} vehicles
                  </div>
                )}
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantCompaniesList;
