/**
 * Export Options Component
 * Provides filters and options for exporting employee data to CSV
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useBulkOperationsStore } from '@/stores';
import { useAuthStore } from '@/stores';
import type { ExportOptions as ExportOptionsType } from '@/types/bulkOperations';

export default function ExportOptions() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { exportEmployees, downloadCsv, loading } = useBulkOperationsStore();
  
  const [filters, setFilters] = useState<ExportOptionsType['filters']>({
    status: undefined,
    department: undefined,
    officeId: undefined,
    dateRange: undefined,
  });
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const handleExport = async () => {
    if (!user?.companyId) return;
    
    const options: ExportOptionsType = {
      filters: {
        ...filters,
        dateRange: startDate && endDate 
          ? { startDate: new Date(startDate), endDate: new Date(endDate) }
          : undefined,
      },
      format: 'csv',
      includeHeaders: true,
    };
    
    await exportEmployees(user.companyId, options);
    
    // Auto-download after export
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCsv(`employees_export_${timestamp}.csv`);
  };
  
  const handleClearFilters = () => {
    setFilters({
      status: undefined,
      department: undefined,
      officeId: undefined,
      dateRange: undefined,
    });
    setStartDate('');
    setEndDate('');
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('bulk.export.title')}
          </CardTitle>
          <CardDescription>
            {t('bulk.export.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="text-sm font-medium">{t('bulk.export.filters')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">{t('bulk.export.filter.status')}</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => 
                    setFilters({ ...filters, status: value === 'all' ? undefined : value as any })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('bulk.export.filter.all_status')}</SelectItem>
                    <SelectItem value="active">{t('employees.status.active')}</SelectItem>
                    <SelectItem value="inactive">{t('employees.status.inactive')}</SelectItem>
                    <SelectItem value="terminated">{t('employees.status.terminated')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Department Filter */}
              <div className="space-y-2">
                <Label htmlFor="department">{t('bulk.export.filter.department')}</Label>
                <Input
                  id="department"
                  placeholder={t('bulk.export.filter.department_placeholder')}
                  value={filters.department || ''}
                  onChange={(e) => 
                    setFilters({ ...filters, department: e.target.value || undefined })
                  }
                />
              </div>
              
              {/* Office Filter */}
              <div className="space-y-2">
                <Label htmlFor="office">{t('bulk.export.filter.office')}</Label>
                <Input
                  id="office"
                  placeholder={t('bulk.export.filter.office_placeholder')}
                  value={filters.officeId || ''}
                  onChange={(e) => 
                    setFilters({ ...filters, officeId: e.target.value || undefined })
                  }
                />
              </div>
              
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">{t('bulk.export.filter.start_date')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              {/* End Date */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endDate">{t('bulk.export.filter.end_date')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClearFilters}>
              {t('bulk.export.clear_filters')}
            </Button>
            <Button onClick={handleExport} disabled={loading} className="gap-2">
              <Download className="h-4 w-4" />
              {t('bulk.export.export_button')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
