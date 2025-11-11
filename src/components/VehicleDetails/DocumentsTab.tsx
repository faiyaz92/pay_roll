import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, FileText, Eye, ImageIcon } from 'lucide-react';
import { Vehicle } from '@/types/user';
import { SectionNumberBadge } from './SectionNumberBadge';

interface DocumentsTabProps {
  vehicle: Vehicle;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ vehicle }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Vehicle Images */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="1" label="Vehicle Images" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Vehicle Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Front Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Front View</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 aspect-square bg-gray-50">
                {vehicle.images?.front ? (
                  <div className="relative w-full h-full">
                    <img
                      src={vehicle.images.front}
                      alt="Vehicle Front"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 p-1 h-8 w-8"
                      onClick={() => window.open(vehicle.images?.front, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm">No front image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Back Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Back View</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 aspect-square bg-gray-50">
                {vehicle.images?.back ? (
                  <div className="relative w-full h-full">
                    <img
                      src={vehicle.images.back}
                      alt="Vehicle Back"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 p-1 h-8 w-8"
                      onClick={() => window.open(vehicle.images?.back, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm">No back image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interior Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Interior</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 aspect-square bg-gray-50">
                {vehicle.images?.interior ? (
                  <div className="relative w-full h-full">
                    <img
                      src={vehicle.images.interior}
                      alt="Vehicle Interior"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 p-1 h-8 w-8"
                      onClick={() => window.open(vehicle.images?.interior, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm">No interior image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Documents Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Documents</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 aspect-square bg-gray-50">
                {vehicle.images?.documents ? (
                  <div className="relative w-full h-full">
                    <img
                      src={vehicle.images.documents}
                      alt="Vehicle Documents"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 p-1 h-8 w-8"
                      onClick={() => window.open(vehicle.images?.documents, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FileText className="w-8 h-8 mb-2" />
                    <span className="text-sm">No documents image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <SectionNumberBadge id="2" label="Vehicle Information" className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
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
              <Label className="text-gray-500">Condition</Label>
              <p className="font-medium capitalize">{vehicle.condition?.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-gray-500">Purchase Price</Label>
              <p className="font-medium">₹{vehicle.initialCost?.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-gray-500">Current Odometer</Label>
              <p className="font-medium">{vehicle.odometer?.toLocaleString()} km</p>
            </div>
          </div>

          {vehicle.financingType === 'loan' && vehicle.loanDetails && (
            <div className="border-t pt-4">
              <Label className="text-gray-500 text-sm">Loan Information</Label>
              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                <div>
                  <Label className="text-gray-500">Loan Account</Label>
                  <p className="font-medium">{vehicle.loanDetails.loanAccountNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Interest Rate</Label>
                  <p className="font-medium">{vehicle.loanDetails.interestRate}% p.a.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};