import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wrench, Calendar, DollarSign, User, Settings, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { SectionNumberBadge } from '@/components/VehicleDetails/SectionNumberBadge';

const MaintenanceDetails: React.FC = () => {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  const { expenses, vehicles, drivers } = useFirebaseData();
  const [maintenance, setMaintenance] = useState<any>(null);

  useEffect(() => {
    if (expenseId && expenses.length > 0) {
      const foundMaintenance = expenses.find(exp => exp.id === expenseId);
      if (foundMaintenance) {
        setMaintenance(foundMaintenance);
      }
    }
  }, [expenseId, expenses]);

  if (!maintenance) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading maintenance details...</p>
          </div>
        </div>
      </div>
    );
  }

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model})` : 'Unknown Vehicle';
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  };

  const getMaintenanceTypeLabel = (type: string) => {
    switch (type) {
      case 'routine': return 'Routine Service';
      case 'repair': return 'Repair';
      case 'inspection': return 'Inspection';
      case 'other': return 'Other';
      default: return 'Maintenance';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Maintenance Details</h1>
            <p className="text-gray-600">Comprehensive view of maintenance record</p>
          </div>
        </div>

        {/* Maintenance Overview */}
        <Card>
          <CardHeader>
            <SectionNumberBadge id="1" label="Maintenance Overview" className="mb-2" />
            <CardTitle className="flex items-center gap-3">
              <Wrench className="h-6 w-6 text-orange-600" />
              <span>{maintenance.description}</span>
              {maintenance.isCorrection && (
                <Badge variant="outline" className="ml-2 border-orange-500 text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Correction
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-gray-600">{new Date(maintenance.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className={`text-sm font-semibold ${maintenance.isCorrection && maintenance.amount < 0 ? 'text-red-600' : maintenance.isCorrection && maintenance.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {maintenance.amount < 0 ? '-' : ''}₹{Math.abs(maintenance.amount).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Submitted By</p>
                  <p className="text-sm text-gray-600">{getDriverName(maintenance.submittedBy)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={maintenance.status === 'approved' ? 'default' : maintenance.status === 'pending' ? 'secondary' : 'destructive'}>
                  {maintenance.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Details */}
        <Card>
          <CardHeader>
            <SectionNumberBadge id="2" label="Maintenance Details" className="mb-2" />
            <CardTitle className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-orange-600" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Vehicle</p>
                <p className="text-sm text-gray-600">{getVehicleName(maintenance.vehicleId)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Maintenance Type</p>
                <p className="text-sm text-gray-600">{getMaintenanceTypeLabel(maintenance.maintenanceType)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Service Provider</p>
                <p className="text-sm text-gray-600">{maintenance.serviceProvider || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Odometer Reading</p>
                <p className="text-sm text-gray-600">{maintenance.odometerReading?.toLocaleString() || 'Not recorded'} km</p>
              </div>
              {maintenance.nextDueOdometer && (
                <div>
                  <p className="text-sm font-medium">Next Service Due</p>
                  <p className="text-sm text-gray-600">{maintenance.nextDueOdometer.toLocaleString()} km</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Transaction ID</p>
                <p className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                  {maintenance.id}
                </p>
              </div>
            </div>

            {maintenance.isCorrection && maintenance.originalTransactionRef && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800">Correction Reference</p>
                <p className="text-sm text-yellow-700">Original Transaction: {maintenance.originalTransactionRef}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <SectionNumberBadge id="3" label="Additional Information" className="mb-2" />
            <CardTitle className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              Record Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Created At</p>
                <p className="text-sm text-gray-600">{new Date(maintenance.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-gray-600">{new Date(maintenance.updatedAt || maintenance.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Verified KM</p>
                <p className="text-sm text-gray-600">{maintenance.verifiedKm?.toLocaleString() || 'Not verified'} km</p>
              </div>
              <div>
                <p className="text-sm font-medium">Adjustment Weeks</p>
                <p className="text-sm text-gray-600">{maintenance.adjustmentWeeks || 0} weeks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MaintenanceDetails;