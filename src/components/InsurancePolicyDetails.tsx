import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Calendar, DollarSign, FileText, Eye, Download, Car, User, Building, AlertTriangle } from 'lucide-react';
import { Expense } from '@/hooks/useFirebaseData';

interface InsurancePolicyDetailsProps {
  insuranceRecord: Expense;
  vehicleInfo?: {
    registrationNumber: string;
    make: string;
    model: string;
  };
  driverInfo?: {
    name: string;
  };
  onClose?: () => void;
}

const InsurancePolicyDetails: React.FC<InsurancePolicyDetailsProps> = ({
  insuranceRecord,
  vehicleInfo,
  driverInfo,
  onClose
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const handleDocumentPreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'policyCopy': return 'Insurance Policy Copy';
      case 'rcCopy': return 'RC Copy (Registration Certificate)';
      case 'previousYearPolicy': return 'Previous Year Policy';
      default: return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInsuranceTypeLabel = (type: string) => {
    switch (type) {
      case 'third_party': return 'Third Party';
      case 'zero_dept': return 'Zero Depreciation';
      case 'comprehensive': return 'Comprehensive';
      case 'topup': return 'Top-up';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Insurance Policy Details
          </h1>
          <p className="text-muted-foreground mt-2">
            Policy Number: {insuranceRecord.insuranceDetails?.policyNumber || 'N/A'}
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Policy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Policy Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Car className="w-4 h-4" />
                Vehicle
              </div>
              <div className="font-medium">
                {vehicleInfo ? `${vehicleInfo.registrationNumber} (${vehicleInfo.make} ${vehicleInfo.model})` : 'Unknown Vehicle'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                Driver
              </div>
              <div className="font-medium">
                {driverInfo?.name || 'Not Assigned'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="w-4 h-4" />
                Provider
              </div>
              <div className="font-medium">
                {insuranceRecord.vendor || 'Not Specified'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                Premium
              </div>
              <div className="font-medium text-green-600">
                {formatCurrency(insuranceRecord.amount)}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                Insurance Type
              </div>
              <Badge variant="outline">
                {getInsuranceTypeLabel(insuranceRecord.insuranceDetails?.insuranceType || 'third_party')}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Start Date
              </div>
              <div className="font-medium">
                {insuranceRecord.insuranceDetails?.startDate ? formatDate(insuranceRecord.insuranceDetails.startDate) : 'Not Set'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                End Date
              </div>
              <div className="font-medium">
                {insuranceRecord.insuranceDetails?.endDate ? formatDate(insuranceRecord.insuranceDetails.endDate) : 'Not Set'}
              </div>
            </div>
          </div>

          {insuranceRecord.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="text-sm">{insuranceRecord.description}</div>
              </div>
            </>
          )}

          {insuranceRecord.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="text-sm">{insuranceRecord.notes}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Transaction ID</div>
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                {insuranceRecord.id}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant={getStatusColor(insuranceRecord.status)}>
                {insuranceRecord.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Date</div>
              <div className="font-medium">
                {formatDate(insuranceRecord.createdAt)}
              </div>
            </div>
          </div>

          {insuranceRecord.receiptNumber && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Receipt Number</div>
              <div className="font-medium">{insuranceRecord.receiptNumber}</div>
            </div>
          )}

          {insuranceRecord.isCorrection && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                Correction Entry
              </div>
              <div className="text-sm text-yellow-700">
                This is a correction to transaction: {insuranceRecord.originalTransactionRef}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance Documents */}
      {insuranceRecord.insuranceDocuments && Object.keys(insuranceRecord.insuranceDocuments).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Insurance Documents
            </CardTitle>
            <CardDescription>
              Uploaded policy documents and supporting files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(insuranceRecord.insuranceDocuments).map(([type, url]) => (
                <Card key={type} className="relative">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">{getDocumentTypeName(type)}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocumentPreview(url as string, getDocumentTypeName(type))}
                          className="flex-1"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(url as string, '_blank')}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Preview Modal */}
      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{previewTitle}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              {previewUrl.includes('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-96"
                  title={previewTitle}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={previewTitle}
                  className="max-w-full max-h-96 object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InsurancePolicyDetails;