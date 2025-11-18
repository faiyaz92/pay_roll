import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useToast } from '@/hooks/use-toast';

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  children
}) => {
  const { canInstall, installPWA } = usePWAInstall();
  const { toast } = useToast();

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      toast({
        title: 'App Installed!',
        description: 'Route Glide has been installed on your device.',
      });
    } else {
      toast({
        title: 'Installation Cancelled',
        description: 'You can install the app later from your browser menu.',
        variant: 'default'
      });
    }
  };

  // Don't render if installation is not available
  if (!canInstall) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstall}
      className={className}
    >
      {showIcon && <Download className="w-4 h-4 mr-2" />}
      {children || (
        <>
          <Smartphone className="w-4 h-4 mr-2" />
          Install App
        </>
      )}
    </Button>
  );
};

export default PWAInstallButton;