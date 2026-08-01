/**
 * Office Hierarchy Page
 * Visualize and manage office hierarchy
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, GitBranch, MapPin, MoveHorizontal, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores';
import { useAppStore } from '@/stores';
import { useToast } from '@/hooks/use-toast';
import OfficeHierarchyTree from '@/components/OfficeHierarchyTree';
import type { Office } from '@/types/office';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOfficeStore } from '@/stores';
import { moveOfficeInHierarchy, getOfficeHierarchyPath } from '@/useCases/officeUseCases';

export default function OfficeHierarchy() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { direction } = useAppStore();
  const { user } = useAuthStore();
  const { offices, fetchOffices } = useOfficeStore();
  
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [hierarchyPath, setHierarchyPath] = useState<Office[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [newParentId, setNewParentId] = useState<string>('');
  const [moving, setMoving] = useState(false);
  
  useEffect(() => {
    if (user?.companyId) {
      fetchOffices(user.companyId);
    }
  }, [user?.companyId]);
  
  useEffect(() => {
    if (selectedOffice) {
      loadHierarchyPath(selectedOffice.officeId);
    }
  }, [selectedOffice]);
  
  const loadHierarchyPath = async (officeId: string) => {
    try {
      const path = await getOfficeHierarchyPath(officeId);
      setHierarchyPath(path);
    } catch (error: any) {
      toast({
        title: t('offices.hierarchy.error_loading_path'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const handleMoveOffice = async () => {
    if (!selectedOffice) return;
    
    setMoving(true);
    try {
      await moveOfficeInHierarchy(
        selectedOffice.officeId,
        newParentId === 'root' ? undefined : newParentId
      );
      
      toast({
        title: t('offices.hierarchy.moved_success'),
        description: t('offices.hierarchy.moved_desc'),
      });
      
      setMoveDialogOpen(false);
      setNewParentId('');
      
      // Refresh data
      if (user?.companyId) {
        await fetchOffices(user.companyId);
      }
      
      // Reload hierarchy path
      await loadHierarchyPath(selectedOffice.officeId);
    } catch (error: any) {
      toast({
        title: t('offices.hierarchy.moved_error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setMoving(false);
    }
  };
  
  const availableParents = offices.filter(
    (office) =>
      office.officeId !== selectedOffice?.officeId &&
      office.type === 'head_office'
  );
  
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/hr/offices')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <GitBranch className="h-8 w-8" />
                {t('offices.hierarchy.page_title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('offices.hierarchy.page_subtitle')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hierarchy Tree */}
          <div className="lg:col-span-2">
            {user?.companyId && (
              <OfficeHierarchyTree
                companyId={user.companyId}
                onOfficeSelect={setSelectedOffice}
              />
            )}
          </div>
          
          {/* Office Details */}
          <div className="space-y-4">
            {selectedOffice ? (
              <>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedOffice.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t(`offices.type.${selectedOffice.type}`)}
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{selectedOffice.address}</span>
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">
                        {t('offices.hierarchy.hierarchy_path')}
                      </p>
                      {hierarchyPath.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {hierarchyPath.map((office, index) => (
                            <div key={office.officeId} className="flex items-center gap-2">
                              <span className={office.officeId === selectedOffice.officeId ? 'font-semibold' : ''}>
                                {office.name}
                              </span>
                              {index < hierarchyPath.length - 1 && (
                                <span className="text-muted-foreground">→</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {t('offices.hierarchy.root_office')}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => setMoveDialogOpen(true)}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      <MoveHorizontal className="h-4 w-4" />
                      {t('offices.hierarchy.move_office')}
                    </Button>
                    
                    <Button
                      onClick={() => navigate(`/hr/offices/${selectedOffice.officeId}/edit`)}
                      className="w-full"
                    >
                      {t('common.edit')}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {t('offices.hierarchy.select_office')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Move Office Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('offices.hierarchy.move_office')}</DialogTitle>
            <DialogDescription>
              {t('offices.hierarchy.move_office_desc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('offices.hierarchy.new_parent')}
              </label>
              <Select value={newParentId} onValueChange={setNewParentId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('offices.hierarchy.select_parent')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    {t('offices.hierarchy.root_level')}
                  </SelectItem>
                  {availableParents.map((office) => (
                    <SelectItem key={office.officeId} value={office.officeId}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMoveDialogOpen(false)}
              disabled={moving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleMoveOffice}
              disabled={!newParentId || moving}
            >
              {moving ? t('common.saving') : t('offices.hierarchy.confirm_move')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
