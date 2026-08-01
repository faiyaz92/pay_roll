/**
 * Office Directory Page
 * Lists all offices with filtering and search
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOfficeStore } from '@/stores';
import { useAuthStore } from '@/stores';
import { useAppStore } from '@/stores';

export default function OfficeDirectory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { direction } = useAppStore();
  const { user } = useAuthStore();
  const {
    officeListItems,
    loading,
    error,
    fetchOfficeListItems,
    searchOfficesList,
  } = useOfficeStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  useEffect(() => {
    if (user?.companyId) {
      fetchOfficeListItems(user.companyId);
    }
  }, [user?.companyId]);
  
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (user?.companyId) {
      if (value.trim()) {
        searchOfficesList(user.companyId, value);
      } else {
        fetchOfficeListItems(user.companyId);
      }
    }
  };
  
  const filteredOffices = officeListItems.filter(office => {
    if (typeFilter !== 'all' && office.type !== typeFilter) return false;
    if (statusFilter !== 'all' && office.status !== statusFilter) return false;
    return true;
  });
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              {t('offices.page.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('offices.page.subtitle')}
            </p>
          </div>
          <Button onClick={() => navigate('/hr/offices/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('offices.page.create_office')}
          </Button>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('offices.page.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('offices.filter.all_types')}</SelectItem>
                  <SelectItem value="head_office">{t('offices.type.head_office')}</SelectItem>
                  <SelectItem value="branch">{t('offices.type.branch')}</SelectItem>
                  <SelectItem value="remote">{t('offices.type.remote')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('offices.filter.all_status')}</SelectItem>
                  <SelectItem value="active">{t('offices.status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('offices.status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm">
            Failed to load offices: {error}
          </div>
        )}

        {/* Office List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : filteredOffices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t('offices.page.no_offices')}</p>
              <p className="text-muted-foreground mt-2">{t('offices.page.no_offices_desc')}</p>
              <Button onClick={() => navigate('/hr/offices/new')} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                {t('offices.page.create_first')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOffices.map((office) => (
              <Card
                key={office.officeId}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/hr/offices/${office.officeId}/edit`)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{office.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={office.status === 'active' ? 'default' : 'secondary'}>
                            {t(`offices.status.${office.status}`)}
                          </Badge>
                          <Badge variant="outline">
                            {t(`offices.type.${office.type}`)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{office.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{t('offices.page.employee_count', { count: office.employeeCount })}</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {t('offices.page.coordinates')}: {office.latitude.toFixed(6)}, {office.longitude.toFixed(6)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
