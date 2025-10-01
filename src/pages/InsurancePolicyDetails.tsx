import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, Calendar, DollarSign, FileText, Eye, Download, Car, User, Building, AlertTriangle, ImageIcon } from 'lucide-react';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useToast } from '@/hooks/use-toast';

const InsurancePolicyDetails: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { vehicles, expenses, loading } = useFirebaseData();
  const { toast } = useToast();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Find the vehicle
  const vehicle = vehicles.find(v => v.id === vehicleId);

  // Find insurance records for this vehicle
  const vehicleInsuranceRecords = expenses.filter(expense =>
    expense.vehicleId === vehicleId &&
    (expense.expenseType === 'insurance' || expense.type === 'insurance')
  );

  // Get the latest insurance record (most recent)
  const latestInsuranceRecord = vehicleInsuranceRecords.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/insurance')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Insurance
          </Button>
        </div>
        <div className="text-center py-8">Loading insurance policy details...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/insurance')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Insurance
          </Button>
        </div>
        <div className="text-center py-8">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Vehicle not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested vehicle could not be found.</p>
        </div>
      </div>
    );
  }

  const expiryDate = vehicle.insuranceExpiryDate ? new Date(vehicle.insuranceExpiryDate) : null;
  const now = new Date();
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/insurance')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Insurance
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Insurance Policy Details
            </h1>
            <p className="text-muted-foreground mt-2">
              {vehicle.registrationNumber} ({vehicle.make} {vehicle.model})
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Policy Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* Policy Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Policy Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Current Policy Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Policy Number</div>
                    <div className="font-medium">
                      {vehicle.insurancePolicyNumber || 'Not Set'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Insurance Provider</div>
                    <div className="font-medium">
                      {vehicle.insuranceProvider || 'Not Set'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Premium Amount</div>
                    <div className="font-medium text-green-600">
                      {vehicle.insurancePremium ? formatCurrency(vehicle.insurancePremium) : 'Not Set'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium">
                      {vehicle.insuranceExpiryDate ? (isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Active') : 'Not Set'}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Expiry Date</div>
                      <div className="font-medium">
                        {expiryDate ? formatDate(expiryDate.toISOString()) : 'Not Set'}
                      </div>
                    </div>
                    <Badge
                      variant={
                        isExpired ? 'destructive' :
                        isExpiring ? 'secondary' :
                        'default'
                      }
                    >
                      {isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Active'}
                    </Badge>
                  </div>

                  {daysLeft !== null && (
                    <div className="mt-2">
                      <div className="text-sm text-muted-foreground">Days Remaining</div>
                      <div className={`font-medium ${
                        isExpired ? 'text-red-600' :
                        isExpiring ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                      </div>
                    </div>
                  )}
                </div>

                {!vehicle.insuranceExpiryDate && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Insurance Not Configured</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      This vehicle doesn't have insurance details configured yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Registration Number</div>
                    <div className="font-medium">{vehicle.registrationNumber}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Make & Model</div>
                    <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Year</div>
                    <div className="font-medium">{vehicle.year}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Odometer</div>
                    <div className="font-medium">{vehicle.odometer?.toLocaleString() || 0} km</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Latest Insurance Record Details */}
          {latestInsuranceRecord && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Insurance Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Transaction ID</div>
                    <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                      {latestInsuranceRecord.id}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Amount</div>
                    <div className="font-medium text-green-600">
                      {formatCurrency(latestInsuranceRecord.amount)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium">
                      {formatDate(latestInsuranceRecord.createdAt)}
                    </div>
                  </div>
                </div>

                {latestInsuranceRecord.description && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="text-sm">{latestInsuranceRecord.description}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {(vehicle.insuranceDocuments && Object.keys(vehicle.insuranceDocuments).length > 0) ||
           (latestInsuranceRecord?.insuranceDocuments && Object.keys(latestInsuranceRecord.insuranceDocuments).length > 0) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Insurance Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Insurance Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Show documents from vehicle record first */}
                    {vehicle.insuranceDocuments && Object.entries(vehicle.insuranceDocuments).map(([type, url]) => (
                      <div key={`vehicle-${type}`} className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          {getDocumentTypeName(type)}
                          <Badge variant="outline" className="text-xs">Vehicle Record</Badge>
                        </Label>
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 aspect-square bg-gray-50">
                          <div className="relative w-full h-full">
                            {url && typeof url === 'string' && (url.includes('.pdf') || url.includes('.PDF')) ? (
                              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <FileText className="w-8 h-8 mb-2 text-red-500" />
                                <span className="text-xs text-center">PDF Document</span>
                              </div>
                            ) : (
                              <img
                                src={url as string}
                                alt={getDocumentTypeName(type)}
                                className="w-full h-full object-cover rounded-md"
                              />
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="absolute top-2 right-2 p-1 h-8 w-8"
                              onClick={() => handleDocumentPreview(url as string, getDocumentTypeName(type))}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show documents from latest insurance record if not already shown */}
                    {latestInsuranceRecord?.insuranceDocuments && Object.entries(latestInsuranceRecord.insuranceDocuments).map(([type, url]) => {
                      // Skip if this document type is already shown from vehicle record
                      if (vehicle.insuranceDocuments && vehicle.insuranceDocuments[type]) {
                        return null;
                      }
                      return (
                        <div key={`expense-${type}`} className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            {getDocumentTypeName(type)}
                            <Badge variant="secondary" className="text-xs">Expense Record</Badge>
                          </Label>
                          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 aspect-square bg-gray-50">
                            <div className="relative w-full h-full">
                              {url && typeof url === 'string' && (url.includes('.pdf') || url.includes('.PDF')) ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                  <FileText className="w-8 h-8 mb-2 text-red-500" />
                                  <span className="text-xs text-center">PDF Document</span>
                                </div>
                              ) : (
                                <img
                                  src={url as string}
                                  alt={getDocumentTypeName(type)}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2 p-1 h-8 w-8"
                                onClick={() => handleDocumentPreview(url as string, getDocumentTypeName(type))}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-500">Registration Number</Label>
                      <p className="font-medium">{vehicle.registrationNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Make & Model</Label>
                      <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Year</Label>
                      <p className="font-medium">{vehicle.year}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Odometer</Label>
                      <p className="font-medium">{vehicle.odometer?.toLocaleString() || 0} km</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Insurance documents will appear here once they are uploaded.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          {vehicleInsuranceRecords.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Insurance Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicleInsuranceRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {formatCurrency(record.amount)}
                            </span>
                            <Badge variant={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                            {record.isCorrection && (
                              <Badge variant="secondary">
                                Correction
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(record.createdAt)}
                          </div>
                          {record.description && (
                            <div className="text-sm">{record.description}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Transaction ID</div>
                          <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {record.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No payment history</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Insurance payment records will appear here once they are added.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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