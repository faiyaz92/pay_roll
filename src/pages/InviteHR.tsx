import React from 'react';
import { useTranslation } from 'react-i18next';
import InviteHrForm from '@/components/Onboarding/InviteHrForm';
import { useAppStore } from '@/stores';

const InviteHR: React.FC = () => {
  const { t } = useTranslation();
  const direction = useAppStore((state) => state.direction);
  const rtl = direction === 'rtl';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <header className={`space-y-2 ${rtl ? 'text-right' : 'text-left'}`} dir={direction}>
          <h1 className="text-3xl font-semibold">{t('onboarding.hr.pageTitle')}</h1>
          <p className="text-slate-600">{t('onboarding.hr.pageSubtitle')}</p>
        </header>
        <InviteHrForm />
      </div>
    </div>
  );
};

export default InviteHR;
