/**
 * Document Upload Component
 * RTL-compatible file upload with progress tracking
 * Supports passport, visa, contract, certificate uploads
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Progress } from '../ui/progress';
import { Card, CardContent } from '../ui/card';
import { useDocumentStore } from '../../stores';
import { useAppStore } from '../../stores';

interface DocumentUploadProps {
  employeeId: string;
  uploadedBy: string;
  onUploadComplete?: () => void;
}

export default function DocumentUpload({
  employeeId,
  uploadedBy,
  onUploadComplete,
}: DocumentUploadProps) {
  const { t } = useTranslation();
  const { direction } = useAppStore();
  const { uploadDocument, uploading, uploadProgress } = useDocumentStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<
    'passport' | 'visa' | 'contract' | 'certificate'
  >('passport');
  const [expiryDate, setExpiryDate] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('documents.errors.fileTooLarge'));
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(t('documents.errors.invalidFileType'));
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error(t('documents.errors.noFileSelected'));
      return;
    }

    try {
      const expiry = expiryDate ? new Date(expiryDate) : undefined;

      await uploadDocument(employeeId, selectedFile, documentType, uploadedBy, expiry);

      toast.success(t('documents.messages.uploadSuccess'));
      
      // Reset form
      setSelectedFile(null);
      setExpiryDate('');
      
      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('documents.errors.uploadFailed'));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card>
      <CardContent className="pt-6" dir={direction}>
        <div className="space-y-4">
          {/* Document Type */}
          <div className="space-y-2">
            <Label>{t('documents.fields.documentType')}</Label>
            <Select
              value={documentType}
              onValueChange={(value: any) => setDocumentType(value)}
              disabled={uploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">{t('documents.types.passport')}</SelectItem>
                <SelectItem value="visa">{t('documents.types.visa')}</SelectItem>
                <SelectItem value="contract">{t('documents.types.contract')}</SelectItem>
                <SelectItem value="certificate">
                  {t('documents.types.certificate')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expiry Date (optional) */}
          <div className="space-y-2">
            <Label>{t('documents.fields.expiryDate')} ({t('common.optional')})</Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* File Selection */}
          {!selectedFile ? (
            <div className="space-y-2">
              <Label htmlFor="file-upload">{t('documents.fields.selectFile')}</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">{t('documents.upload.clickToUpload')}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('documents.upload.fileTypes')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('documents.upload.maxSize')}
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t('documents.fields.selectedFile')}</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </span>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('documents.upload.uploading')}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? t('documents.upload.uploading') : t('documents.upload.uploadButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
