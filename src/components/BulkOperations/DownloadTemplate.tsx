/**
 * Download Template Component
 * Provides CSV template download with documentation
 */

import { useTranslation } from 'react-i18next';
import { Download, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateCsvTemplate } from '@/lib/csvUtils';

export default function DownloadTemplate() {
  const { t } = useTranslation();
  
  const handleDownload = () => {
    const template = generateCsvTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employee_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };
  
  const requiredFields = [
    { field: 'firstName, lastName', description: t('bulk.template.required.name') },
    { field: 'dateOfBirth', description: t('bulk.template.required.dob') },
    { field: 'gender', description: t('bulk.template.required.gender') },
    { field: 'nationality', description: t('bulk.template.required.nationality') },
    { field: 'department, designation', description: t('bulk.template.required.employment') },
    { field: 'officeId', description: t('bulk.template.required.office') },
    { field: 'contractType', description: t('bulk.template.required.contract') },
    { field: 'startDate', description: t('bulk.template.required.start_date') },
    { field: 'basicSalary, currency', description: t('bulk.template.required.salary') },
    { field: 'bankName, iban, accountNumber', description: t('bulk.template.required.banking') },
    { field: 'email', description: t('bulk.template.required.email') },
  ];
  
  const optionalFields = [
    { field: 'grade, costCenter', description: t('bulk.template.optional.employment_details') },
    { field: 'hraAmount, hraPercentage', description: t('bulk.template.optional.hra') },
    { field: 'transportation, mobile, utilities', description: t('bulk.template.optional.allowances') },
    { field: 'otherAllowancesJson', description: t('bulk.template.optional.other_allowances') },
    { field: 'emiratesId, passportNumber, gosiNumber', description: t('bulk.template.optional.compliance') },
    { field: 'phoneNumber', description: t('bulk.template.optional.phone') },
  ];
  
  const formatRules = [
    t('bulk.template.rules.dates'),
    t('bulk.template.rules.gender'),
    t('bulk.template.rules.marital'),
    t('bulk.template.rules.contract'),
    t('bulk.template.rules.currency'),
    t('bulk.template.rules.allowances'),
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('bulk.template.title')}
              </CardTitle>
              <CardDescription>
                {t('bulk.template.subtitle')}
              </CardDescription>
            </div>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              {t('bulk.template.download')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('bulk.template.info')}
            </AlertDescription>
          </Alert>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {t('bulk.template.required_fields')}
            </h3>
            <div className="space-y-2">
              {requiredFields.map(({ field, description }) => (
                <div key={field} className="flex gap-3">
                  <code className="text-sm bg-muted px-2 py-1 rounded min-w-[200px]">
                    {field}
                  </code>
                  <span className="text-sm text-muted-foreground">
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {t('bulk.template.optional_fields')}
            </h3>
            <div className="space-y-2">
              {optionalFields.map(({ field, description }) => (
                <div key={field} className="flex gap-3">
                  <code className="text-sm bg-muted px-2 py-1 rounded min-w-[200px]">
                    {field}
                  </code>
                  <span className="text-sm text-muted-foreground">
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {t('bulk.template.format_rules')}
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {formatRules.map((rule, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
