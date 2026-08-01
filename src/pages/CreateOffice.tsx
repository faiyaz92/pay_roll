/**
 * Create Office Page
 * Page for creating a new office
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useOfficeStore } from '@/stores';
import { useAuthStore } from '@/stores';
import { useAppStore } from '@/stores';
import OfficeForm from '@/components/Forms/OfficeForm';
import type { OfficeInput } from '@/types/office';

export default function CreateOffice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { direction } = useAppStore();
  const { user } = useAuthStore();
  const { createNewOffice, loading, offices } = useOfficeStore();
  
  const handleSubmit = async (data: any) => {
    if (!user?.companyId || !user?.uid) {
      toast({
        title: 'Not signed in',
        description: 'Your session info is missing a company/user ID. Try logging out and back in.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const officeData: OfficeInput = {
        ...data,
        companyId: user.companyId,
        createdBy: user.uid,
      };
      
      await createNewOffice(officeData);
      
      toast({
        title: t('offices.messages.created_success'),
        description: t('offices.messages.created_desc'),
      });
      
      navigate('/hr/offices');
    } catch (error: any) {
      toast({
        title: t('offices.messages.created_error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
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
              {t('offices.page.create_title')}
            </h1>
            <p className="text-muted-foreground">
              {t('offices.page.create_subtitle')}
            </p>
          </div>
        </div>
        
        {/* Form */}
        <OfficeForm
          onSubmit={handleSubmit}
          isLoading={loading}
          offices={offices}
        />
      </div>
    </div>
  );
}
