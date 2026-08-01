/**
 * Office Form Component
 * Form for creating and editing offices with GPS coordinates
 * Note: Google Maps integration requires API key - using manual coordinate input for now
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { MapPin, LocateFixed, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { OfficeInput } from '@/types/office';

const officeSchema = z.object({
  name: z.string().min(1, 'Office name is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(10).max(1000).default(100),
  type: z.enum(['head_office', 'branch', 'remote']),
  parentOfficeId: z.string().optional(),
  workingHours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  }),
});

type OfficeFormData = z.infer<typeof officeSchema>;

interface OfficeFormProps {
  defaultValues?: Partial<OfficeFormData>;
  onSubmit: (data: OfficeFormData) => Promise<void>;
  isLoading?: boolean;
  offices?: Array<{ officeId: string; name: string; type: string }>;
}

export default function OfficeForm({ defaultValues, onSubmit, isLoading, offices = [] }: OfficeFormProps) {
  const { t } = useTranslation();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfficeFormData>({
    resolver: zodResolver(officeSchema),
    defaultValues: {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      radius: 100,
      type: 'branch',
      workingHours: {
        start: '09:00',
        end: '18:00',
      },
      ...defaultValues,
    },
  });
  
  const [locating, setLocating] = useState(false);
  const officeType = watch('type');
  const headOffices = offices.filter(o => o.type === 'head_office');

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', Number(position.coords.latitude.toFixed(6)));
        setValue('longitude', Number(position.coords.longitude.toFixed(6)));
        toast.success('Location captured from your current position');
        setLocating(false);
      },
      (error) => {
        toast.error(error.message || 'Unable to get your location');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  
  const errorMessages = Object.values(errors).flatMap((err: any) => {
    if (!err) return [];
    if (err.message) return [err.message as string];
    // Nested error object (e.g. workingHours.start)
    return Object.values(err)
      .map((nested: any) => nested?.message)
      .filter(Boolean) as string[];
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {errorMessages.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm space-y-1">
          <p className="font-medium">Please fix the following before saving:</p>
          <ul className="list-disc list-inside">
            {errorMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('offices.form.basic_info')}</CardTitle>
          <CardDescription>{t('offices.form.basic_info_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('offices.form.name')} *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder={t('offices.form.name_placeholder')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">{t('offices.form.address')} *</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder={t('offices.form.address_placeholder')}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t('offices.form.type')} *</Label>
              <Select
                value={officeType}
                onValueChange={(value) => setValue('type', value as any)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head_office">{t('offices.type.head_office')}</SelectItem>
                  <SelectItem value="branch">{t('offices.type.branch')}</SelectItem>
                  <SelectItem value="remote">{t('offices.type.remote')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>
            
            {officeType !== 'head_office' && headOffices.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parentOfficeId">{t('offices.form.parent_office')}</Label>
                <Select
                  value={watch('parentOfficeId') || ''}
                  onValueChange={(value) => setValue('parentOfficeId', value || undefined)}
                >
                  <SelectTrigger id="parentOfficeId">
                    <SelectValue placeholder={t('offices.form.parent_office_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('common.none')}</SelectItem>
                    {headOffices.map(office => (
                      <SelectItem key={office.officeId} value={office.officeId}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* GPS Coordinates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('offices.form.gps_coordinates')}
          </CardTitle>
          <CardDescription>{t('offices.form.gps_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleUseCurrentLocation}
            disabled={locating}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            Use My Current Location
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">{t('offices.form.latitude')} *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register('latitude', { valueAsNumber: true })}
                placeholder="25.2048"
              />
              {errors.latitude && (
                <p className="text-sm text-destructive">{errors.latitude.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longitude">{t('offices.form.longitude')} *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register('longitude', { valueAsNumber: true })}
                placeholder="55.2708"
              />
              {errors.longitude && (
                <p className="text-sm text-destructive">{errors.longitude.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="radius">{t('offices.form.radius')} (m) *</Label>
              <Input
                id="radius"
                type="number"
                {...register('radius', { valueAsNumber: true })}
                placeholder="100"
              />
              {errors.radius && (
                <p className="text-sm text-destructive">{errors.radius.message}</p>
              )}
            </div>
          </div>
          
          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium mb-1">{t('offices.form.gps_help')}</p>
            <p className="text-muted-foreground">{t('offices.form.gps_help_desc')}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle>{t('offices.form.working_hours')}</CardTitle>
          <CardDescription>{t('offices.form.working_hours_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">{t('offices.form.start_time')} *</Label>
              <Input
                id="start"
                type="time"
                {...register('workingHours.start')}
              />
              {errors.workingHours?.start && (
                <p className="text-sm text-destructive">{errors.workingHours.start.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end">{t('offices.form.end_time')} *</Label>
              <Input
                id="end"
                type="time"
                {...register('workingHours.end')}
              />
              {errors.workingHours?.end && (
                <p className="text-sm text-destructive">{errors.workingHours.end.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
