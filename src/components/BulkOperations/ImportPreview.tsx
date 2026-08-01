/**
 * Import Preview Component
 * Shows parsed CSV data, validation errors, and import confirmation
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, AlertCircle, CheckCircle, FileUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBulkOperationsStore } from '@/stores';
import { useAuthStore } from '@/stores';

export default function ImportPreview() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const { user } = useAuthStore();
  const {
    parsedData,
    importResult,
    uploadProgress,
    loading,
    error,
    validateCsv,
    importEmployees,
    clearImportResult,
    clearError,
  } = useBulkOperationsStore();
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    clearError();
    clearImportResult();
    
    // Validate the CSV file
    await validateCsv(selectedFile);
  };
  
  const handleImport = async () => {
    if (!file || !user?.companyId) return;
    
    await importEmployees(file, user.companyId);
  };
  
  const handleClear = () => {
    setFile(null);
    clearImportResult();
    clearError();
  };
  
  const hasErrors = parsedData && parsedData.errors.length > 0;
  const canImport = parsedData && !hasErrors && !importResult;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('bulk.import.title')}
          </CardTitle>
          <CardDescription>
            {t('bulk.import.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => document.getElementById('csv-file')?.click()}
              disabled={loading}
              className="gap-2"
            >
              <FileUp className="h-4 w-4" />
              {file ? t('bulk.import.change_file') : t('bulk.import.select_file')}
            </Button>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Upload Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t(`bulk.import.status.${uploadProgress.status}`)}</span>
                <span>{uploadProgress.percentage}%</span>
              </div>
              <Progress value={uploadProgress.percentage} />
            </div>
          )}
          
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('bulk.import.error_title')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Validation Errors */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('bulk.import.validation_errors')}</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                  {parsedData.errors.map((err, index) => (
                    <div key={index} className="text-sm">
                      <strong>Row {err.row}:</strong> {err.field} - {err.message}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Success Summary */}
          {parsedData && !hasErrors && !importResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>{t('bulk.import.validation_success')}</AlertTitle>
              <AlertDescription>
                {t('bulk.import.rows_ready', { count: parsedData.rows.length })}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Import Result */}
          {importResult && (
            <div className="space-y-4">
              <Alert variant={importResult.failed > 0 ? 'default' : 'default'}>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>{t('bulk.import.result_title')}</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{t('bulk.import.total')}: {importResult.total}</Badge>
                      <Badge variant="default">{t('bulk.import.successful')}: {importResult.successful}</Badge>
                      {importResult.failed > 0 && (
                        <Badge variant="destructive">{t('bulk.import.failed')}: {importResult.failed}</Badge>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              
              {/* Import Errors */}
              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('bulk.import.import_errors')}</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                      {importResult.errors.map((err, index) => (
                        <div key={index} className="text-sm">
                          <strong>Row {err.row}:</strong> {err.message}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          {canImport && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClear}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleImport} disabled={loading}>
                {t('bulk.import.confirm', { count: parsedData.rows.length })}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
