/**
 * Employee Directory Page
 * Displays list of all employees with search and filtering
 * RTL-compatible with bilingual support
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter } from 'lucide-react';
import { useEmployeeStore } from '../stores';
import { useAuthStore, useAppStore } from '../stores';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';

export default function EmployeeDirectory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { direction } = useAppStore();
  const { userInfo } = useAuthStore();
  
  const {
    employees,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    fetchEmployees,
    searchEmployeesList,
    fetchActiveCount,
  } = useEmployeeStore();

  // Fetch employees on mount
  useEffect(() => {
    if (userInfo?.companyId) {
      fetchEmployees(userInfo.companyId);
      fetchActiveCount(userInfo.companyId);
    }
  }, [userInfo?.companyId]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (userInfo?.companyId) {
      searchEmployeesList(userInfo.companyId, value);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      terminated: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {t(`employee.status.${status}`)}
      </Badge>
    );
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US');
  };

  return (
    <div className="container mx-auto p-6" dir={direction}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {t('employee.directory.title')}
            </CardTitle>
            {(userInfo?.role === 'company_admin' || userInfo?.role === 'hr_manager') && (
              <Button
                onClick={() => navigate('/hr/onboarding')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('employee.directory.addNew')}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm">
              Failed to load employees: {error}
            </div>
          )}
          {/* Search and Filters */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search
                className={`absolute top-3 h-4 w-4 text-muted-foreground ${
                  direction === 'rtl' ? 'right-3' : 'left-3'
                }`}
              />
              <Input
                placeholder={t('employee.directory.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className={direction === 'rtl' ? 'pr-10' : 'pl-10'}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {t('employee.directory.filter')}
            </Button>
          </div>

          {/* Employee Table */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('employee.directory.noEmployees')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employee.fields.employeeId')}</TableHead>
                  <TableHead>{t('employee.fields.fullName')}</TableHead>
                  <TableHead>{t('employee.fields.department')}</TableHead>
                  <TableHead>{t('employee.fields.designation')}</TableHead>
                  <TableHead>{t('employee.fields.startDate')}</TableHead>
                  <TableHead>{t('employee.fields.status')}</TableHead>
                  <TableHead className="text-right">
                    {t('common.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow
                    key={employee.employeeId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/hr/employees/${employee.employeeId}`)}
                  >
                    <TableCell className="font-medium">
                      {employee.employeeId}
                    </TableCell>
                    <TableCell>{employee.personal.fullName}</TableCell>
                    <TableCell>{employee.employment.department}</TableCell>
                    <TableCell>{employee.employment.designation}</TableCell>
                    <TableCell>
                      {formatDate(employee.employment.startDate)}
                    </TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/hr/employees/${employee.employeeId}/edit`);
                        }}
                      >
                        {t('common.edit')}
                      </Button>
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
}
