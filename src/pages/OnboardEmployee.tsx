import React from 'react';
import { useTranslation } from 'react-i18next';
import EmployeeOnboardingForm from '@/components/Onboarding/EmployeeOnboardingForm';
import { useAppStore } from '@/stores';

const OnboardEmployee: React.FC = () => {
  const { t } = useTranslation();
  const direction = useAppStore((state) => state.direction);
  const rtl = direction === 'rtl';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className={`space-y-2 ${rtl ? 'text-right' : 'text-left'}`} dir={direction}>
          <h1 className="text-3xl font-semibold">{t('onboarding.employee.pageTitle')}</h1>
          <p className="text-slate-600">{t('onboarding.employee.pageSubtitle')}</p>
        </header>
        <EmployeeOnboardingForm />
      </div>
    </div>
  );
};

export default OnboardEmployee;
