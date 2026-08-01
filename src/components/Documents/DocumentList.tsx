/**
 * Document List Component
 * Displays employee documents with download, delete, and expiry tracking
 * RTL-compatible with bilingual support
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useDocumentStore } from '../../stores';
import { useAppStore } from '../../stores';
import type { EmployeeDocument } from '../../types/employee';

interface DocumentListProps {
  employeeId: string;
}

export default function DocumentList({ employeeId }: DocumentListProps) {
  const { t } = useTranslation();
  const { direction } = useAppStore();
  
  const {
    documents,
    loading,
    expiredDocuments,
    expiringSoonDocuments,
    fetchDocuments,
    removeDocument,
    fetchExpiredDocuments,
    fetchExpiringSoonDocuments,
  } = useDocumentStore();

  useEffect(() => {
    if (employeeId) {
      fetchDocuments(employeeId);
      fetchExpiredDocuments(employeeId);
      fetchExpiringSoonDocuments(employeeId);
    }
  }, [employeeId]);

  const handleDownload = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleDelete = async (documentId: string, fileUrl: string) => {
    try {
      await removeDocument(documentId, fileUrl);
      toast.success(t('documents.messages.deleteSuccess'));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('documents.errors.deleteFailed'));
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    const variants = {
      passport: 'default',
      visa: 'secondary',
      contract: 'outline',
      certificate: 'default',
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {t(`documents.types.${type}`)}
      </Badge>
    );
  };

  const getStatusBadge = (doc: EmployeeDocument) => {
    if (!doc.expiryDate) {
      return null;
    }

    const expiry = doc.expiryDate instanceof Date 
      ? doc.expiryDate 
      : (doc.expiryDate as any).toDate();

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (expiry < today) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t('documents.status.expired')}
        </Badge>
      );
    } else if (expiry <= thirtyDaysFromNow) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t('documents.status.expiringSoon')}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          {t('documents.status.valid')}
        </Badge>
      );
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US');
  };

  return (
    <div className="space-y-4" dir={direction}>
      {/* Alerts for expired/expiring documents */}
      {expiredDocuments.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {t('documents.alerts.expiredTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('documents.alerts.expiredMessage', { count: expiredDocuments.length })}
            </p>
          </CardContent>
        </Card>
      )}

      {expiringSoonDocuments.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              {t('documents.alerts.expiringSoonTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('documents.alerts.expiringSoonMessage', { count: expiringSoonDocuments.length })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('documents.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('documents.list.noDocuments')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('documents.fields.documentType')}</TableHead>
                  <TableHead>{t('documents.fields.fileName')}</TableHead>
                  <TableHead>{t('documents.fields.uploadedAt')}</TableHead>
                  <TableHead>{t('documents.fields.expiryDate')}</TableHead>
                  <TableHead>{t('documents.fields.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.employeeId}>
                    <TableCell>{getDocumentTypeBadge(doc.documentType)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-xs">{doc.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell>{formatDate(doc.expiryDate)}</TableCell>
                    <TableCell>{getStatusBadge(doc)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.fileUrl, doc.fileName)}
                          title={t('documents.actions.download')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t('documents.actions.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t('documents.delete.confirmTitle')}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('documents.delete.confirmMessage')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doc.employeeId, doc.fileUrl)}
                              >
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
