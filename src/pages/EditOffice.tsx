/**
 * Edit Office Page
 * Page for editing an existing office
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useOfficeStore } from '@/stores';
import { useAppStore } from '@/stores';
import OfficeForm from '@/components/Forms/OfficeForm';

export default function EditOffice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { officeId } = useParams<{ officeId: string }>();
  const { toast } = useToast();
  const { direction } = useAppStore();
  const {
    selectedOffice,
    loading,
    offices,
    fetchOfficeById,
    updateOfficeData,
  } = useOfficeStore();
  
  useEffect(() => {
    if (officeId) {
      fetchOfficeById(officeId);
    }
  }, [officeId]);
  
  const handleSubmit = async (data: any) => {
    if (!officeId) return;
    
    try {
      await updateOfficeData(officeId, data);
      
      toast({
        title: t('offices.messages.updated_success'),
        description: t('offices.messages.updated_desc'),
      });
      
      navigate('/hr/offices');
    } catch (error: any) {
      toast({
        title: t('offices.messages.updated_error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  if (!selectedOffice && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={direction}>
        <div className="text-center">
          <p className="text-lg font-medium">{t('offices.messages.not_found')}</p>
          <Button onClick={() => navigate('/hr/offices')} className="mt-4">
            {t('offices.page.back_to_list')}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/hr/offices')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {t('offices.page.edit_title')}
            </h1>
            <p className="text-muted-foreground">
              {selectedOffice?.name}
            </p>
          </div>
        </div>
        
        {/* Form */}
        {selectedOffice && (
          <OfficeForm
            defaultValues={{
              name: selectedOffice.name,
              address: selectedOffice.address,
              latitude: selectedOffice.latitude,
              longitude: selectedOffice.longitude,
              radius: selectedOffice.radius,
              type: selectedOffice.type,
              parentOfficeId: selectedOffice.parentOfficeId,
              workingHours: selectedOffice.workingHours,
            }}
            onSubmit={handleSubmit}
            isLoading={loading}
            offices={offices}
          />
        )}
      </div>
    </div>
  );
}
