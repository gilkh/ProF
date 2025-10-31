'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInUser, signInWithGoogle } from '@/lib/services';
import { useAuth, logout } from '@/hooks/use-auth';

function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

export default function AdminSecretLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<false | 'google'>(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [userType, setUserType] = useState<'client' | 'vendor'>('client');

  useEffect(() => {
    if (role === 'admin') {
      router.replace('/admin/home');
    }
  }, [role, router]);

  // Client/Vendor buttons on this secret page are always enabled, regardless of main login settings

  function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.918l-6.573,4.817C9.656,39.663,16.318,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,34.551,44,29.865,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
      </svg>
    );
  }

  const onSocialLoginSuccess = (role: 'client' | 'vendor' | 'admin') => {
    toast({
      title: 'Sign In Successful!',
      description: `Welcome! Redirecting to your dashboard...`,
    });
    if (role === 'client') {
      router.push('/client/home');
    } else if (role === 'vendor') {
      router.push('/vendor/home');
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    setIsSocialLoading(provider);
    logout();
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        // Block admin sessions via client/vendor buttons (same as normal login page)
        if (result.role === 'admin') {
          toast({
            title: 'Admin Login Restricted',
            description: 'Please use your dedicated admin login URL.',
            variant: 'destructive',
          });
          logout();
          return;
        }
        localStorage.setItem('userId', result.userId);
        localStorage.setItem('role', result.role);
        setCookie('role', result.role, 7);
        setCookie('userId', result.userId, 7);
        onSocialLoginSuccess(result.role);
      } else {
        toast({ title: 'Sign In Failed', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign-in.';
      toast({ title: 'Sign In Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleClientVendorLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    logout();

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signInUser(email, password);
      if (result.success) {
        // Block admin sessions via client/vendor buttons (same as normal login page)
        if (result.role === 'admin') {
          toast({
            title: 'Admin Login Restricted',
            description: 'Please use your dedicated admin login URL.',
            variant: 'destructive',
          });
          logout();
          return;
        }
        localStorage.setItem('userId', result.userId!);
        localStorage.setItem('role', result.role);
        setCookie('role', result.role, 7);
        setCookie('userId', result.userId!, 7);
        onSocialLoginSuccess(result.role);
      } else {
        toast({
          title: 'Sign In Failed',
          description: result.message || 'No account found with that email or password.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign-in.';
      toast({ title: 'Sign In Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    // Clear any previous session
    logout();

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signInUser(email, password);
      if (result.success && result.role === 'admin') {
        // Persist session for middleware and client auth
        localStorage.setItem('userId', result.userId!);
        localStorage.setItem('role', result.role);
        setCookie('role', result.role, 7);
        setCookie('userId', result.userId!, 7);
        toast({ title: 'Admin Login Successful', description: 'Redirecting to admin dashboard...' });
        router.push('/admin/home');
      } else if (result.success && result.role !== 'admin') {
        // Prevent non-admin sessions from this page
        logout();
        toast({ title: 'Access Denied', description: 'This login is for admin users only.', variant: 'destructive' });
      } else {
        toast({ title: 'Sign In Failed', description: result.message || 'Invalid admin credentials.', variant: 'destructive' });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An error occurred during sign-in.';
      toast({ title: 'Sign In Failed', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      {/* Admin-only login card */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>Private login. Use admin credentials only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@tradecraft.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Client/Vendor login entry, mirrors normal login behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Client & Vendor Access</CardTitle>
          <CardDescription>Use these to sign in when main login is disabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className={"flex-1"}
              onClick={() => {
                setUserType('client');
                setShowLoginForm(true);
              }}
            >
              Client Login
            </Button>
            <Button
              variant="outline"
              className={"flex-1"}
              onClick={() => {
                setUserType('vendor');
                setShowLoginForm(true);
              }}
            >
              Vendor Login
            </Button>
          </div>

          {showLoginForm && (
            <div className="mt-6">
              <form onSubmit={handleClientVendorLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cv-email">Email</Label>
                  <Input id="cv-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cv-password">Password</Label>
                  <Input id="cv-password" name="password" type="password" required />
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <Button type="button" variant="outline" disabled={isSocialLoading === 'google'} onClick={() => handleSocialLogin('google')}>
                    <GoogleIcon className="mr-2" /> Sign in with Google
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowLoginForm(false)}>Cancel</Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}