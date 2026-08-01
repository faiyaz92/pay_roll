/**
 * Check-in/Check-out Widget
 * Allows employees to check in/out with geolocation validation
 */

import { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAttendanceStore } from '@/stores/attendance/attendance.store';
import { useAuthStore } from '@/stores/auth/auth.store';
import type { CheckInOutRequest } from '@/types/attendance';

interface CheckInOutWidgetProps {
  employeeId: string;
  officeId: string;
  onSuccess?: () => void;
}

export const CheckInOutWidget = ({
  employeeId,
  officeId,
  onSuccess,
}: CheckInOutWidgetProps) => {
  const { todayRecord, employeeCheckIn, employeeCheckOut, getTodayRecord, validationResult, validateLocation, clearValidation, loading, error, clearError } = useAttendanceStore();
  const { user } = useAuthStore();
  
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    getTodayRecord(employeeId);
  }, [employeeId, getTodayRecord]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => {
          let message = 'Unable to get your location';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location permission denied. Please enable location access.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Location information unavailable';
          } else if (error.code === error.TIMEOUT) {
            message = 'Location request timed out';
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleCheckIn = async () => {
    setGettingLocation(true);
    setLocationError(null);
    clearValidation();

    try {
      const position = await getCurrentLocation();
      
      // Validate location first
      await validateLocation(
        officeId,
        position.coords.latitude,
        position.coords.longitude
      );

      const request: CheckInOutRequest = {
        employeeId,
        officeId,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
        timestamp: new Date(),
      };

      await employeeCheckIn(request);
      onSuccess?.();
    } catch (err: any) {
      setLocationError(err.message);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleCheckOut = async () => {
    setGettingLocation(true);
    setLocationError(null);
    clearValidation();

    try {
      const position = await getCurrentLocation();
      
      // Validate location first
      await validateLocation(
        officeId,
        position.coords.latitude,
        position.coords.longitude
      );

      const request: CheckInOutRequest = {
        employeeId,
        officeId,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
        timestamp: new Date(),
      };

      await employeeCheckOut(request);
      onSuccess?.();
    } catch (err: any) {
      setLocationError(err.message);
    } finally {
      setGettingLocation(false);
    }
  };

  const canCheckIn = !todayRecord || !todayRecord.checkIn;
  const canCheckOut = todayRecord && todayRecord.checkIn && !todayRecord.checkOut;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Attendance
        </CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        {todayRecord && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge
                variant={
                  todayRecord.status === 'present'
                    ? 'default'
                    : todayRecord.status === 'late'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {todayRecord.status.replace('_', ' ')}
              </Badge>
            </div>

            {todayRecord.checkIn && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Check-in</span>
                <span className="font-medium">
                  {todayRecord.checkIn.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}

            {todayRecord.checkOut && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Check-out</span>
                <span className="font-medium">
                  {todayRecord.checkOut.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}

            {todayRecord.workHours !== undefined && todayRecord.workHours > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Work Hours</span>
                <span className="font-medium">{todayRecord.workHours.toFixed(2)}h</span>
              </div>
            )}
          </div>
        )}

        {/* Validation Result */}
        {validationResult && (
          <Alert variant={validationResult.withinGeofence ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {validationResult.withinGeofence ? (
                <CheckCircle className="h-4 w-4 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5" />
              )}
              <div className="space-y-1 flex-1">
                <AlertDescription>{validationResult.message}</AlertDescription>
                {validationResult.distance && (
                  <p className="text-xs text-muted-foreground">
                    Distance from office: {Math.round(validationResult.distance)}m
                  </p>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Error Messages */}
        {(error || locationError) && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error || locationError}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {canCheckIn && (
            <Button
              className="w-full"
              onClick={handleCheckIn}
              disabled={loading || gettingLocation}
            >
              {gettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Check In
                </>
              )}
            </Button>
          )}

          {canCheckOut && (
            <Button
              className="w-full"
              onClick={handleCheckOut}
              disabled={loading || gettingLocation}
              variant="outline"
            >
              {gettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Check Out
                </>
              )}
            </Button>
          )}

          {todayRecord && todayRecord.checkOut && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium">You're all set for today!</p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>Location verification required</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
