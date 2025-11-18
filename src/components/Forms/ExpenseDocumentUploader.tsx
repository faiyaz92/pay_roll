import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Eye, FileText, Plus, Trash2, Shield } from 'lucide-react';

interface ExpenseDocument {
  id: string;
  name: string;
  url: string;
  type: 'main' | 'additional';
  uploadedAt: string;
  size: number;
  file?: File;
}

interface ExpenseDocumentUploaderProps {
  documents: {
    mainDocument: ExpenseDocument | null;
    additional: ExpenseDocument[];
  };
  onDocumentsChange: (documents: {
    mainDocument: ExpenseDocument | null;
    additional: ExpenseDocument[];
  }) => void;
  isUploading: boolean;
}

const ExpenseDocumentUploader: React.FC<ExpenseDocumentUploaderProps> = ({
  documents,
  onDocumentsChange,
  isUploading
}) => {
  const [additionalDocName, setAdditionalDocName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File, type: 'main' | 'additional', customName?: string) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    const documentId = `${type}-${Date.now()}`;
    const documentName = customName || file.name;

    const newDocument: ExpenseDocument = {
      id: documentId,
      name: documentName,
      url: URL.createObjectURL(file), // Create temporary URL for preview
      type,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      file
    };

    if (type === 'main') {
      onDocumentsChange({
        ...documents,
        mainDocument: newDocument
      });
    } else {
      // Check if we already have 3 additional documents
      if (documents.additional.length >= 3) {
        alert('Maximum 3 additional documents allowed');
        return;
      }

      onDocumentsChange({
        ...documents,
        additional: [...documents.additional, newDocument]
      });
    }
  };

  const removeDocument = (type: 'main' | 'additional', documentId: string) => {
    if (type === 'main') {
      onDocumentsChange({
        ...documents,
        mainDocument: null
      });
    } else {
      onDocumentsChange({
        ...documents,
        additional: documents.additional.filter(doc => doc.id !== documentId)
      });
    }
  };

  const previewDocument = (url: string) => {
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    return <Shield className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Main Document Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Main Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.mainDocument ? (
            <div className="space-y-3">
              {/* Image Preview - Show inline preview */}
              {documents.mainDocument.url && !documents.mainDocument.url.includes('.pdf') && (
                <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={documents.mainDocument.url}
                    alt={documents.mainDocument.name}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 p-1 h-6 w-6"
                    onClick={() => previewDocument(documents.mainDocument!.url)}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Document Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm truncate flex-1">{documents.mainDocument.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {formatFileSize(documents.mainDocument.size)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {documents.mainDocument.url.includes('.pdf') ? 'PDF' : 'Image'}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => previewDocument(documents.mainDocument!.url)}
                  disabled={isUploading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeDocument('main', documents.mainDocument!.id)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-4">Upload main expense document (receipt, invoice, etc.)</p>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'main');
                }}
                disabled={isUploading}
                className="max-w-xs mx-auto"
              />
              <p className="text-xs text-gray-500 mt-2">JPEG, PNG, PDF up to 5MB</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Additional Documents
            <Badge variant="secondary">{documents.additional.length}/3</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Existing Additional Documents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documents.additional.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    {doc.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => previewDocument(doc.url)}
                      className="h-6 w-6 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument('additional', doc.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Inline Image Preview for Additional Documents */}
                  {doc.url && !doc.url.includes('.pdf') && (
                    <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={doc.url}
                        alt={doc.name}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 p-1 h-6 w-6"
                        onClick={() => previewDocument(doc.url)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* Document Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm truncate flex-1">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(doc.size)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {doc.url.includes('.pdf') ? 'PDF' : 'Image'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Additional Document */}
          {documents.additional.length < 3 && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Document name (optional)"
                    value={additionalDocName}
                    onChange={(e) => setAdditionalDocName(e.target.value)}
                    disabled={isUploading}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(file, 'additional', additionalDocName.trim() || `Additional Document ${documents.additional.length + 1}`);
                          setAdditionalDocName('');
                        }
                      }}
                      className="hidden"
                      id="upload-additional-expense"
                      accept="image/*,application/pdf"
                      disabled={isUploading}
                    />
                    <label htmlFor="upload-additional-expense" className="cursor-pointer block">
                      <Plus className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Add Additional Document</p>
                      <p className="text-xs text-gray-400">Optional: Enter name above, then click to upload</p>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h3 className="font-medium">Expense Document Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              {previewUrl.includes('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-96"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm text-blue-700">Uploading expense documents to secure cloud storage...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseDocumentUploader;