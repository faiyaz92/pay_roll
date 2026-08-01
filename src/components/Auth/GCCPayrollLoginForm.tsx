import React, { useState } from "react";
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/GCCPayrollAuthContext'; // GCC Payroll Auth
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Building2, Languages, DatabaseZap } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores';
import { getRoleHomeRoute } from '@/lib/roleRoutes';
import { seedDemoData } from '@/lib/demoDataSeeder';

const GCCPayrollLoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { currentUser, userInfo, loading: authLoading, login, resetPassword } = useAuth();
  const { t } = useTranslation();

  // App-wide localization state - Must match BRD Section 4.12
  const currentLanguage = useAppStore((state) => state.language);
  const direction = useAppStore((state) => state.direction);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const rtl = direction === 'rtl';

  // Redirect if already logged in with resolved role
  if (userInfo) {
    return <Navigate to={getRoleHomeRoute(userInfo.role)} replace />;
  }

  // Language toggle function - Must support BRD Section 4.12 bilingual requirement
  const toggleLanguage = () => {
    const newLang = currentLanguage === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('common.required'));
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('login.signIn') + ' ' + 'successful!');
      // Navigate to "/" and let RoleLanding redirect once the real role
      // resolves from the freshly-fetched /users doc.
      navigate('/', { replace: true });
    } catch (error: unknown) {
      console.error('GCC Payroll Login error:', error);
      let errorMessage = t('error.loginFailed');

      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/user-not-found') {
          errorMessage = t('error.userNotFound');
        } else if (firebaseError.code === 'auth/wrong-password') {
          errorMessage = t('error.wrongPassword');
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = t('common.invalidEmail');
        } else if (firebaseError.code === 'auth/too-many-requests') {
          errorMessage = t('error.tooManyRequests');
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('login.email') + ' ' + t('common.required'));
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      toast.success(t('login.resetSent'));
      setShowResetPassword(false);
    } catch (error: unknown) {
      console.error('GCC Payroll Password reset error:', error);
      let errorMessage = t('error.resetFailed');

      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/user-not-found') {
          errorMessage = t('error.userNotFound');
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = t('common.invalidEmail');
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      const ok = await seedDemoData();
      if (ok) {
        toast.success('Demo data seeded! You can now log in with any of the demo accounts below.');
      } else {
        toast.error('Seeding failed — check the browser console for details.');
      }
    } catch (err) {
      console.error('Seed demo data failed:', err);
      toast.error('Seeding failed — check the browser console for details.');
    } finally {
      setSeeding(false);
    }
  };

  const handleQuickHRLogin = async () => {
    setEmail('hr@alhilal.ae');
    setPassword('HRManager@123');
    setLoading(true);
    try {
      await login('hr@alhilal.ae', 'HRManager@123');
      toast.success('Signed in as HR Manager');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Quick HR Login notice:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center gradient-primary p-4 ${rtl ? 'rtl' : 'ltr'}`}>
      {/* Language Toggle Button - Must match BRD Section 4.12 */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-10 bg-white/90 backdrop-blur-sm"
        onClick={toggleLanguage}
      >
        <Languages className="w-4 h-4 mr-2" />
        {currentLanguage === 'en' ? 'العربية' : 'English'}
      </Button>

      <Card className={`w-full max-w-md shadow-2xl ${rtl ? 'text-right' : 'text-left'}`}>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('login.title')}</CardTitle>
          <CardDescription>
            {showResetPassword ? t('login.resetPassword') : t('login.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={showResetPassword ? handleResetPassword : handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className={rtl ? 'text-right' : 'text-left'}
                dir={rtl ? 'rtl' : 'ltr'}
              />
            </div>

            {!showResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('login.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className={rtl ? 'text-right' : 'text-left'}
                    dir={rtl ? 'rtl' : 'ltr'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`absolute top-0 h-full px-3 py-2 hover:bg-transparent ${rtl ? 'left-0' : 'right-0'}`}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                className={`w-full gradient-primary hover:opacity-90 ${rtl ? 'flex-row-reverse' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {showResetPassword ? t('login.sendReset') : t('login.signingIn')}
                  </>
                ) : (
                  showResetPassword ? t('login.sendReset') : t('login.signIn')
                )}
              </Button>

              {!showResetPassword ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowResetPassword(true)}
                  disabled={loading}
                >
                  {t('login.forgotPassword')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowResetPassword(false)}
                  disabled={loading}
                >
                  {t('login.backToSignIn')}
                </Button>
              )}
            </div>
          </form>

          {/* First-time setup: seed demo data (creates the demo login
              accounts below). No login required to run this. */}
          <div className="mt-5 pt-4 border-t border-slate-200 space-y-2">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between text-xs gap-3">
              <div>
                <p className="font-semibold text-amber-900">First time here?</p>
                <p className="text-amber-700">Seed demo company, employees & demo logins.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-900 hover:bg-amber-100 gap-1.5 shrink-0"
                onClick={handleSeedDemoData}
                disabled={seeding}
              >
                {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseZap className="w-4 h-4" />}
                Seed Demo Data
              </Button>
            </div>
          </div>

          {/* Quick HR Login Card */}
          <div className="mt-3 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs text-center font-medium text-slate-500">
              Fresh HR Manager Account Details:
            </div>
            <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/50 rounded-lg border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-indigo-950 dark:text-indigo-200">Email: hr@alhilal.ae</p>
                <p className="text-indigo-700 dark:text-indigo-400">Pass: HRManager@123</p>
              </div>
              <Button
                type="button"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
                onClick={handleQuickHRLogin}
                disabled={loading}
              >
                Quick HR Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GCCPayrollLoginForm;