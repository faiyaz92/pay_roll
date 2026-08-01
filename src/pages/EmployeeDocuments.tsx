/**
 * Employee Documents Page
 * Manages document upload and viewing for an employee
 * Combines DocumentUpload and DocumentList components
 */

import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useAppStore } from '../stores';
import DocumentUpload from '../components/Documents/DocumentUpload';
import DocumentList from '../components/Documents/DocumentList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function EmployeeDocuments() {
  const { t } = useTranslation();
  const { employeeId } = useParams<{ employeeId: string }>();
  const { firebaseUser } = useAuthStore();
  const { direction } = useAppStore();

  if (!employeeId) {
    return (
      <div className="container mx-auto p-6" dir={direction}>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('documents.errors.noEmployeeId')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir={direction}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {t('documents.page.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">{t('documents.tabs.list')}</TabsTrigger>
              <TabsTrigger value="upload">{t('documents.tabs.upload')}</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <DocumentList employeeId={employeeId} />
            </TabsContent>

            <TabsContent value="upload">
              <DocumentUpload
                employeeId={employeeId}
                uploadedBy={firebaseUser?.uid || ''}
                onUploadComplete={() => {
                  // Switch to list tab after upload
                  const listTab = document.querySelector('[value="list"]') as HTMLElement;
                  if (listTab) listTab.click();
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
