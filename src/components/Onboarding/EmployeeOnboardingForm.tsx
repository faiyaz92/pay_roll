import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { useAppStore } from '@/stores';
import { getOffices } from '@/useCases/officeUseCases';
import type { Office } from '@/types/office';

const employeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  preferredLanguage: z.enum(['en', 'ar']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.enum(['male', 'female']),
  maritalStatus: z.enum(['single', 'married', 'divorced']),
  dependents: z.coerce.number().min(0),
  nationality: z.string().min(1),
  emiratesId: z.string().min(1),
  department: z.string().min(1),
  designation: z.string().min(1),
  grade: z.string().optional().default(''),
  costCenter: z.string().optional().default(''),
  officeId: z.string().min(1, 'Office is required'),
  contractType: z.enum(['limited', 'unlimited']),
  startDate: z.string().min(1),
  probationEndDate: z.string().optional().default(''),
  basicSalary: z.coerce.number().min(0),
  hraAmount: z.coerce.number().min(0),
  hraPercentage: z.coerce.number().min(0),
  transportation: z.coerce.number().min(0),
  mobile: z.coerce.number().min(0),
  utilities: z.coerce.number().min(0),
  overtimeRate: z.coerce.number().min(0),
  currency: z.enum(['AED', 'SAR']),
  bankName: z.string().min(1),
  branch: z.string().min(1),
  iban: z.string().min(1),
  swiftCode: z.string().min(1),
  accountNumber: z.string().min(1),
  routingCode: z.string().min(1),
  passportNumber: z.string().min(1),
  passportExpiry: z.string().min(1),
  visaStatus: z.string().min(1),
  labourCardNumber: z.string().min(1),
  gosiNumber: z.string().min(1),
  eligibilityYears: z.coerce.number().min(0)
});

export type EmployeeOnboardingValues = z.infer<typeof employeeSchema>;

const defaultValues: EmployeeOnboardingValues = {
  email: '',
  password: '',
  preferredLanguage: 'en',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'male',
  maritalStatus: 'single',
  dependents: 0,
  nationality: '',
  emiratesId: '',
  department: '',
  designation: '',
  grade: '',
  costCenter: '',
  officeId: '',
  contractType: 'unlimited',
  startDate: '',
  probationEndDate: '',
  basicSalary: 0,
  hraAmount: 0,
  hraPercentage: 0,
  transportation: 0,
  mobile: 0,
  utilities: 0,
  overtimeRate: 0,
  currency: 'AED',
  bankName: '',
  branch: '',
  iban: '',
  swiftCode: '',
  accountNumber: '',
  routingCode: '',
  passportNumber: '',
  passportExpiry: '',
  visaStatus: '',
  labourCardNumber: '',
  gosiNumber: '',
  eligibilityYears: 1
};

const EmployeeOnboardingForm: React.FC = () => {
  const { t } = useTranslation();
  const { createEmployeeUser, userInfo } = useAuth();
  const navigate = useNavigate();
  const direction = useAppStore((state) => state.direction);
  const rtl = direction === 'rtl';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);

  useEffect(() => {
    if (userInfo?.companyId) {
      getOffices(userInfo.companyId).then(setOffices).catch(() => setOffices([]));
    }
  }, [userInfo?.companyId]);

  const form = useForm<EmployeeOnboardingValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues
  });

  const onSubmit = async (values: EmployeeOnboardingValues) => {
    setIsSubmitting(true);
    try {
      const startDate = new Date(values.startDate);
      const probationDate = values.probationEndDate ? new Date(values.probationEndDate) : undefined;
      const dateOfBirth = new Date(values.dateOfBirth);
      const passportExpiry = new Date(values.passportExpiry);

      await createEmployeeUser(values.email, values.password, {
        preferredLanguage: values.preferredLanguage,
        rtlEnabled: values.preferredLanguage === 'ar',
        personal: {
          firstName: values.firstName,
          lastName: values.lastName,
          fullName: `${values.firstName} ${values.lastName}`.trim(),
          dateOfBirth,
          gender: values.gender,
          nationality: values.nationality,
          maritalStatus: values.maritalStatus,
          dependents: values.dependents
        },
        employment: {
          department: values.department,
          designation: values.designation,
          grade: values.grade ?? '',
          costCenter: values.costCenter ?? '',
          officeId: values.officeId ?? '',
          contractType: values.contractType,
          startDate,
          probationEndDate: probationDate
        },
        payroll: {
          basicSalary: values.basicSalary,
          hra: { amount: values.hraAmount, percentage: values.hraPercentage },
          transportation: values.transportation,
          mobile: values.mobile,
          utilities: values.utilities,
          otherAllowances: [],
          overtimeRate: values.overtimeRate,
          currency: values.currency
        },
        banking: {
          bankName: values.bankName,
          branch: values.branch,
          iban: values.iban,
          swiftCode: values.swiftCode,
          accountNumber: values.accountNumber,
          routingCode: values.routingCode
        },
        compliance: {
          emiratesId: values.emiratesId,
          passportNumber: values.passportNumber,
          passportExpiry,
          visaStatus: values.visaStatus,
          labourCardNumber: values.labourCardNumber,
          gosiNumber: values.gosiNumber
        },
        gratuity: {
          eligibilityYears: values.eligibilityYears,
          startDate,
          status: 'not_eligible'
        },
        status: 'active'
      });

      toast.success(t('onboarding.employee.success', { email: values.email }));
      form.reset(defaultValues);
      navigate('/hr/employees');
    } catch (error) {
      console.error('Employee onboarding failed:', error);
      toast.error(t('onboarding.employee.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const textAlign = rtl ? 'text-right' : 'text-left';

  return (
    <Form {...form}>
      <form className="space-y-6" dir={direction} noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader className={rtl ? 'text-right' : 'text-left'}>
            <CardTitle>{t('onboarding.employee.title')}</CardTitle>
            <CardDescription className="text-slate-500">
              {t('onboarding.employee.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" inputMode="email" autoComplete="email" dir="ltr" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.password')}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.language')}</FormLabel>
                  <Select disabled={isSubmitting} value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger dir={direction}>
                        <SelectValue placeholder={t('common.language')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir={direction}>
                      <SelectItem value="en">{t('common.languageEnglish')}</SelectItem>
                      <SelectItem value="ar">{t('common.languageArabic')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eligibilityYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.eligibilityYears')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader className={rtl ? 'text-right' : 'text-left'}>
            <CardTitle>{t('onboarding.sections.personal')}</CardTitle>
            <CardDescription className="text-slate-500">
              {t('onboarding.sections.personalHint')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.firstName')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.lastName')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.dateOfBirth')}</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.gender')}</FormLabel>
                  <Select disabled={isSubmitting} value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger dir={direction}>
                        <SelectValue placeholder={t('common.gender')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir={direction}>
                      <SelectItem value="male">{t('common.genderMale')}</SelectItem>
                      <SelectItem value="female">{t('common.genderFemale')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.maritalStatus')}</FormLabel>
                  <Select disabled={isSubmitting} value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger dir={direction}>
                        <SelectValue placeholder={t('common.maritalStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir={direction}>
                      <SelectItem value="single">{t('common.maritalSingle')}</SelectItem>
                      <SelectItem value="married">{t('common.maritalMarried')}</SelectItem>
                      <SelectItem value="divorced">{t('common.maritalDivorced')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dependents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.dependents')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.nationality')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emiratesId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.emiratesId')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader className={rtl ? 'text-right' : 'text-left'}>
            <CardTitle>{t('onboarding.sections.employment')}</CardTitle>
            <CardDescription className="text-slate-500">
              {t('onboarding.sections.employmentHint')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.department')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.designation')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.grade')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costCenter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.costCenter')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="officeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.officeId')} *</FormLabel>
                  <Select disabled={isSubmitting} value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger dir={direction}>
                        <SelectValue placeholder={offices.length ? 'Select office' : 'No offices yet — add one under Offices first'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir={direction}>
                      {offices.map((office) => (
                        <SelectItem key={office.officeId} value={office.officeId}>
                          {office.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.contractType')}</FormLabel>
                  <Select disabled={isSubmitting} value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger dir={direction}>
                        <SelectValue placeholder={t('onboarding.employee.contractType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir={direction}>
                      <SelectItem value="limited">{t('onboarding.employee.contractLimited')}</SelectItem>
                      <SelectItem value="unlimited">{t('onboarding.employee.contractUnlimited')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.startDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="probationEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.probationEndDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader className={rtl ? 'text-right' : 'text-left'}>
            <CardTitle>{t('onboarding.sections.payroll')}</CardTitle>
            <CardDescription className="text-slate-500">
              {t('onboarding.sections.payrollHint')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="basicSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.basicSalary')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hraAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.hraAmount')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hraPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.hraPercentage')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transportation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.transportation')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.mobileAllowance')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="utilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.utilities')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="overtimeRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.overtimeRate')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.currency')}</FormLabel>
                  <Select disabled={isSubmitting} value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger dir={direction}>
                        <SelectValue placeholder={t('common.currency')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir={direction}>
                      <SelectItem value="AED">{t('common.currencyAED')}</SelectItem>
                      <SelectItem value="SAR">{t('common.currencySAR')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader className={rtl ? 'text-right' : 'text-left'}>
            <CardTitle>{t('onboarding.sections.banking')}</CardTitle>
            <CardDescription className="text-slate-500">
              {t('onboarding.sections.bankingHint')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.bankName')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.bankBranch')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.iban')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className="text-left" dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="swiftCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.swiftCode')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className="text-left" dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.accountNumber')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className="text-left" dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="routingCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.routingCode')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className="text-left" dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900">
          <CardHeader className={rtl ? 'text-right' : 'text-left'}>
            <CardTitle>{t('onboarding.sections.compliance')}</CardTitle>
            <CardDescription className="text-slate-500">
              {t('onboarding.sections.complianceHint')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="passportNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.passportNumber')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passportExpiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.passportExpiry')}</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visaStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.visaStatus')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="labourCardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.labourCardNumber')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gosiNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('onboarding.employee.gosiNumber')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={textAlign} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
            {isSubmitting ? t('common.submitting') : t('onboarding.employee.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EmployeeOnboardingForm;
