import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { useAppStore } from '@/stores';

const inviteHrSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  preferredLanguage: z.enum(['en', 'ar'])
});

export type InviteHrFormValues = z.infer<typeof inviteHrSchema>;

const InviteHrForm: React.FC = () => {
  const { t } = useTranslation();
  const { createHRUser } = useAuth();
  const direction = useAppStore((state) => state.direction);
  const rtl = direction === 'rtl';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<InviteHrFormValues>({
    resolver: zodResolver(inviteHrSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
      preferredLanguage: 'en'
    }
  });

  const onSubmit = async (values: InviteHrFormValues) => {
    setIsSubmitting(true);
    try {
      await createHRUser(values.email, values.password, {
        displayName: values.displayName,
        preferredLanguage: values.preferredLanguage,
        rtlEnabled: values.preferredLanguage === 'ar'
      });
      toast.success(t('onboarding.hr.success', { email: values.email }));
      form.reset({
        email: '',
        password: '',
        displayName: '',
        preferredLanguage: 'en'
      });
    } catch (error) {
      console.error('Error inviting HR user:', error);
      toast.error(t('onboarding.hr.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white text-slate-900">
      <CardHeader className={rtl ? 'text-right' : 'text-left'}>
        <CardTitle>{t('onboarding.hr.title')}</CardTitle>
        <CardDescription className="text-slate-500">
          {t('onboarding.hr.description')}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form className="space-y-6" dir={direction} onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" inputMode="email" dir="ltr" autoComplete="email" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.displayName')}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} className={rtl ? 'text-right' : 'text-left'} {...field} />
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
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        className={rtl ? 'pr-12 text-right' : 'pl-12 text-left'}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`absolute top-1/2 -translate-y-1/2 ${rtl ? 'left-2' : 'right-2'}`}
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={isSubmitting}
                        aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
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
                        <SelectValue placeholder={t('onboarding.hr.languagePlaceholder')} />
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
              {isSubmitting ? t('common.submitting') : t('onboarding.hr.submit')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default InviteHrForm;
