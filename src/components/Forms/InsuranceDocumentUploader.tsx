import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Eye, FileText, Plus, Trash2, Shield } from 'lucide-react';

interface InsuranceDocument {
  id: string;
  name: string;
  url: string;
  type: 'policy' | 'rc' | 'previous' | 'additional';
  uploadedAt: string;
  size: number;
  file?: File;
}

interface InsuranceDocumentUploaderProps {
  documents: {
    policyCopy: InsuranceDocument | null;
    rcCopy: InsuranceDocument | null;
    previousYearPolicy: InsuranceDocument | null;
    additional: InsuranceDocument[];
  };
  onDocumentsChange: (documents: {
    policyCopy: InsuranceDocument | null;
    rcCopy: InsuranceDocument | null;
    previousYearPolicy: InsuranceDocument | null;
    additional: InsuranceDocument[];
  }) => void;
  isUploading: boolean;
}

const InsuranceDocumentUploader: React.FC<InsuranceDocumentUploaderProps> = ({
  documents,
  onDocumentsChange,
  isUploading
}) => {
  const [additionalDocName, setAdditionalDocName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File, type: 'policy' | 'rc' | 'previous' | 'additional', customName?: string) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create document object
    const newDoc: InsuranceDocument = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customName || getDocumentTypeName(type),
      url: URL.createObjectURL(file), // Temporary URL for preview
      type: type,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      file: file // Store file for upload
    };

    // Update documents based on type
    const updatedDocs = { ...documents };

    if (type === 'policy') {
      updatedDocs.policyCopy = newDoc;
    } else if (type === 'rc') {
      updatedDocs.rcCopy = newDoc;
    } else if (type === 'previous') {
      updatedDocs.previousYearPolicy = newDoc;
    } else if (type === 'additional') {
      if (updatedDocs.additional.length < 3) {
        updatedDocs.additional = [...updatedDocs.additional, newDoc];
      } else {
        alert('You can only upload up to 3 additional documents');
        return;
      }
    }

    onDocumentsChange(updatedDocs);
  };

  const handleRemoveDocument = (type: 'policy' | 'rc' | 'previous' | 'additional', index?: number) => {
    const updatedDocs = { ...documents };

    if (type === 'policy') {
      updatedDocs.policyCopy = null;
    } else if (type === 'rc') {
      updatedDocs.rcCopy = null;
    } else if (type === 'previous') {
      updatedDocs.previousYearPolicy = null;
    } else if (type === 'additional' && typeof index === 'number') {
      updatedDocs.additional = updatedDocs.additional.filter((_, i) => i !== index);
    }

    onDocumentsChange(updatedDocs);
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'policy': return 'Insurance Policy Copy';
      case 'rc': return 'RC Copy (Registration Certificate)';
      case 'previous': return 'Previous Year Policy';
      case 'additional': return 'Additional Document';
      default: return 'Document';
    }
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
  };

  const DocumentCard = ({ doc, type, onRemove, isRequired = false }: {
    doc: InsuranceDocument | null;
    type: string;
    onRemove: () => void;
    isRequired?: boolean;
  }) => (
    <Card className={`relative ${isRequired && !doc ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            {getDocumentTypeName(type)}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </CardTitle>
          {doc && (
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handlePreview(doc.url)}
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {doc ? (
          <div className="space-y-3">
            {/* Image Preview - Show inline preview like AddVehicleForm */}
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
                  onClick={() => handlePreview(doc.url)}
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
                  {(doc.size || 0) < 1024 * 1024
                    ? `${Math.round((doc.size || 0) / 1024)} KB`
                    : `${((doc.size || 0) / (1024 * 1024)).toFixed(1)} MB`
                  }
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {doc.url.includes('.pdf') ? 'PDF' : 'Image'}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file, type as any);
              }}
              className="hidden"
              id={`upload-${type}`}
              accept="image/*,application/pdf"
              disabled={isUploading}
            />
            <label htmlFor={`upload-${type}`} className="cursor-pointer block">
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click to upload</p>
              <p className="text-xs text-gray-400">PNG, JPG, PDF up to 5MB</p>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Insurance Document Requirements
        </h4>
        <p className="text-sm text-blue-700">
          Please upload clear photos or scans of the required insurance documents. All documents will be securely stored and used for policy verification and claims processing.
        </p>
      </div>

      {/* Required Documents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DocumentCard
          doc={documents.policyCopy}
          type="policy"
          onRemove={() => handleRemoveDocument('policy')}
          isRequired
        />
        <DocumentCard
          doc={documents.rcCopy}
          type="rc"
          onRemove={() => handleRemoveDocument('rc')}
          isRequired
        />
        <DocumentCard
          doc={documents.previousYearPolicy}
          type="previous"
          onRemove={() => handleRemoveDocument('previous')}
          isRequired
        />
      </div>

      {/* Additional Documents */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-gray-700">Additional Documents (Optional)</h4>
          <span className="text-sm text-gray-500">
            {documents.additional.length}/3 uploaded
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documents.additional.map((doc, index) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    {doc.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(doc.url)}
                      className="h-6 w-6 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument('additional', index)}
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
                        onClick={() => handlePreview(doc.url)}
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
                        {(doc.size || 0) < 1024 * 1024
                          ? `${Math.round((doc.size || 0) / 1024)} KB`
                          : `${((doc.size || 0) / (1024 * 1024)).toFixed(1)} MB`
                        }
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

          {documents.additional.length < 3 && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Document name (e.g., Survey Report, Claim Documents)"
                    value={additionalDocName}
                    onChange={(e) => setAdditionalDocName(e.target.value)}
                    disabled={isUploading}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && additionalDocName.trim()) {
                          handleFileSelect(file, 'additional', additionalDocName.trim());
                          setAdditionalDocName('');
                        } else if (!additionalDocName.trim()) {
                          alert('Please enter a document name first');
                        }
                      }}
                      className="hidden"
                      id="upload-additional-insurance"
                      accept="image/*,application/pdf"
                      disabled={isUploading}
                    />
                    <label htmlFor="upload-additional-insurance" className="cursor-pointer block">
                      <Plus className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Add Additional Document</p>
                      <p className="text-xs text-gray-400">Enter name above, then click to upload</p>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium">Insurance Document Preview</h3>
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
            <span className="text-sm text-blue-700">Uploading insurance documents to secure cloud storage...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceDocumentUploader;