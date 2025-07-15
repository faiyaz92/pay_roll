
import React, { useState } from "react";
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Truck, User, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@/types/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [loginType, setLoginType] = useState<'admin' | 'driver' | 'customer'>('admin');
  const { currentUser, login, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset email sent! Check your inbox.');
      setShowResetPassword(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getLoginDescription = () => {
    switch (loginType) {
      case 'admin':
        return 'Sign in as Company Admin to manage your transportation fleet';
      case 'driver':
        return 'Sign in as Driver to manage your trips and deliveries';
      case 'customer':
        return 'Sign in as Customer to book transportation services';
      default:
        return 'Sign in to your transportation management system';
    }
  };

  const getLoginIcon = () => {
    switch (loginType) {
      case 'admin':
        return <UserCheck className="w-8 h-8 text-white" />;
      case 'driver':
        return <Truck className="w-8 h-8 text-white" />;
      case 'customer':
        return <User className="w-8 h-8 text-white" />;
      default:
        return <Truck className="w-8 h-8 text-white" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            {getLoginIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">TransportPro</CardTitle>
          <CardDescription>
            {showResetPassword ? 'Reset your password' : getLoginDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showResetPassword && (
            <Tabs value={loginType} onValueChange={(value) => setLoginType(value as any)} className="mb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="driver">Driver</TabsTrigger>
                <TabsTrigger value="customer">Customer</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <form onSubmit={showResetPassword ? handleResetPassword : handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder={
                  loginType === 'admin' ? 'admin@transportpro.com' :
                  loginType === 'driver' ? 'driver@transportpro.com' :
                  'customer@transportpro.com'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            
            {!showResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                className="w-full gradient-primary hover:opacity-90" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {showResetPassword ? 'Sending...' : 'Signing in...'}
                  </>
                ) : (
                  showResetPassword ? 'Send Reset Email' : `Sign In as ${loginType.charAt(0).toUpperCase() + loginType.slice(1)}`
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
                  Forgot your password?
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowResetPassword(false)}
                  disabled={loading}
                >
                  Back to Sign In
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
