/**
 * Bulk Operations Page
 * Main page for CSV import/export of employee data
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores';
import DownloadTemplate from '@/components/BulkOperations/DownloadTemplate';
import ImportPreview from '@/components/BulkOperations/ImportPreview';
import ExportOptions from '@/components/BulkOperations/ExportOptions';

export default function BulkOperations() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { direction } = useAppStore();
  const [activeTab, setActiveTab] = useState('template');
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/hr/employees')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {t('bulk.page.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('bulk.page.subtitle')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="template" className="gap-2">
              <FileText className="h-4 w-4" />
              {t('bulk.tabs.template')}
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="h-4 w-4" />
              {t('bulk.tabs.import')}
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              {t('bulk.tabs.export')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="template" className="mt-6">
            <DownloadTemplate />
          </TabsContent>
          
          <TabsContent value="import" className="mt-6">
            <ImportPreview />
          </TabsContent>
          
          <TabsContent value="export" className="mt-6">
            <ExportOptions />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
