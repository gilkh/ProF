"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInUser, signInWithGoogle, resendVerificationEmail } from '@/lib/services';
import { useAuth, logout } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function AdminSecretLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<false | 'google'>(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [userType, setUserType] = useState<'client' | 'vendor'>('client');
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [resendEmailInput, setResendEmailInput] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (role === 'admin') {
      router.replace('/admin/home');
    }
  }, [role, router]);

  useEffect(() => {
    const err = searchParams.get('error');
    setShowVerifyBanner(err === 'verify-email');
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    const email = resendEmailInput.trim();
    if (!email) {
      toast({ title: 'Enter your email', description: 'Please provide the email you used to sign up.', variant: 'destructive' });
      return;
    }
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      const res = await resendVerificationEmail(email);
      if (res.success) {
        toast({ title: 'Email Sent', description: res.message || 'Please check your inbox for the verification email.' });
      } else {
        toast({ title: 'Resend Failed', description: res.message || 'Unable to resend verification email right now.', variant: 'destructive' });
      }
      setResendCooldown(60);
    } catch (e: any) {
      toast({ title: 'Resend Failed', description: e?.message || 'Unable to resend verification email.', variant: 'destructive' });
      setResendCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  // Helper to finalize navigation after establishing server session
  const finalizeLogin = (redirect: string) => {
    toast({ title: 'Sign In Successful!', description: 'Welcome! Redirecting to your dashboard...' });
    router.push(redirect);
  };

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

  const handleSocialLogin = async (provider: 'google') => {
    setIsSocialLoading(provider);
    await logout();
    try {
      // Sign in with provider to obtain Firebase ID token
      const result = await signInWithGoogle();
      if (!result.success) {
        toast({ title: 'Sign In Failed', description: result.message || 'Unable to sign in with Google.', variant: 'destructive' });
        return;
      }
      // Establish HttpOnly session cookie via server
      const csrfRes = await fetch('/api/auth/csrf');
      const { token } = await csrfRes.json();
      const sessRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ idToken: result.idToken }),
      });
      const sessJson = await sessRes.json();
      if (!sessRes.ok || !sessJson?.success) {
        // If admin detected here, block and clear any session
        if (sessJson?.role === 'admin') {
          toast({ title: 'Admin Login Restricted', description: 'Please use your dedicated admin login URL.', variant: 'destructive' });
          await logout();
          return;
        }
        if (sessRes.status === 403 && sessJson?.redirect) {
          if (resendCooldown <= 0) {
            try {
              const user = auth.currentUser;
              if (user?.email) {
                const res = await resendVerificationEmail(user.email, { allowFirebaseFallback: false });
                setResendEmailInput(user.email);
                toast({ title: res.success ? 'Verification Email Sent' : 'Resend Failed', description: res.message, variant: res.success ? 'default' : 'destructive' });
              }
            } catch (e: any) {
              console.warn('Failed to trigger verification email:', e);
            }
            setResendCooldown(60);
          }
          await logout();
          setShowVerifyBanner(true);
          toast({ title: 'Email Not Verified', description: 'Please verify your email to continue. You can resend below.', variant: 'default' });
          return;
        }
        toast({ title: 'Sign In Failed', description: (sessJson?.error ? `${sessJson.error}${sessJson?.details ? ` – ${sessJson.details}` : ''}` : 'Failed to establish session.'), variant: 'destructive' });
        return;
      }
      if (sessJson.role === 'admin') {
        toast({ title: 'Admin Login Restricted', description: 'Please use your dedicated admin login URL.', variant: 'destructive' });
        await logout();
        return;
      }
      finalizeLogin(sessJson.redirect || (sessJson.role === 'vendor' ? '/vendor/home' : '/client/home'));
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
    // Capture form element before any await to avoid SyntheticEvent issues
    const formEl = event.currentTarget as HTMLFormElement;
    const formData = new FormData(formEl);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    await logout();

    try {
      const result = await signInUser(email, password);
      if (!result.success) {
        toast({
          title: 'Sign In Failed',
          description: result.message || 'No account found with that email or password.',
          variant: 'destructive',
        });
        return;
      }
      // Establish HttpOnly session cookie via server
      const csrfRes = await fetch('/api/auth/csrf');
      const { token } = await csrfRes.json();
      const sessRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ idToken: result.idToken }),
      });
      const sessJson = await sessRes.json();
      if (!sessRes.ok || !sessJson?.success) {
        if (sessJson?.role === 'admin') {
          toast({ title: 'Admin Login Restricted', description: 'Please use your dedicated admin login URL.', variant: 'destructive' });
          await logout();
          return;
        }
        if (sessRes.status === 403 && sessJson?.redirect) {
          if (resendCooldown <= 0) {
            try {
              const res = await resendVerificationEmail(email, { allowFirebaseFallback: false });
              setResendEmailInput(email);
              toast({ title: res.success ? 'Verification Email Sent' : 'Resend Failed', description: res.message, variant: res.success ? 'default' : 'destructive' });
            } catch (e: any) {
              console.warn('Failed to trigger verification email:', e);
            }
            setResendCooldown(60);
          }
          await logout();
          setShowVerifyBanner(true);
          toast({ title: 'Email Not Verified', description: 'Please verify your email to continue. You can resend below.', variant: 'default' });
          return;
        }
        toast({ title: 'Sign In Failed', description: (sessJson?.error ? `${sessJson.error}${sessJson?.details ? ` – ${sessJson.details}` : ''}` : 'Failed to establish session.'), variant: 'destructive' });
        return;
      }
      if (sessJson.role === 'admin') {
        toast({ title: 'Admin Login Restricted', description: 'Please use your dedicated admin login URL.', variant: 'destructive' });
        await logout();
        return;
      }
      finalizeLogin(sessJson.redirect || (sessJson.role === 'vendor' ? '/vendor/home' : '/client/home'));
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
    // Capture form element before any await to avoid SyntheticEvent issues
    const formEl = event.currentTarget as HTMLFormElement;
    const formData = new FormData(formEl);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    // Clear any previous session
    await logout();

    try {
      const result = await signInUser(email, password);
      if (!result.success) {
        toast({ title: 'Sign In Failed', description: result.message || 'Invalid admin credentials.', variant: 'destructive' });
        return;
      }
      // Establish HttpOnly session cookie via server
      const csrfRes = await fetch('/api/auth/csrf');
      const { token } = await csrfRes.json();
      const sessRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ idToken: result.idToken }),
      });
      const sessJson = await sessRes.json();
      if (!sessRes.ok || !sessJson?.success) {
        toast({ title: 'Sign In Failed', description: (sessJson?.error ? `${sessJson.error}${sessJson?.details ? ` – ${sessJson.details}` : ''}` : 'Failed to establish session.'), variant: 'destructive' });
        return;
      }
      if (sessJson.role !== 'admin') {
        await logout();
        toast({ title: 'Access Denied', description: 'This login is for admin users only.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Admin Login Successful', description: 'Redirecting to admin dashboard...' });
      finalizeLogin('/admin/home');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An error occurred during sign-in.';
      toast({ title: 'Sign In Failed', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      {showVerifyBanner && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-md p-3">
          <p className="text-sm text-amber-900 mb-2">
            Email verification required to continue. Please check your inbox and click the link. If you don’t see it, check Spam.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <Input
                id="resend-email"
                name="resend-email"
                type="email"
                placeholder="Enter your email to resend"
                value={resendEmailInput}
                onChange={(e) => setResendEmailInput(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={handleResendVerification}
              disabled={isResending || resendCooldown > 0}
            >
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </Button>
          </div>
        </div>
      )}
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
          <div className="mt-3 text-center text-sm">
            Don't have an account?
            <Button
              type="button"
              variant="link"
              className="ml-1 p-0 h-auto"
              onClick={() => {
                try {
                  document.cookie = `signup_access=1; path=/; max-age=120; samesite=lax`;
                } catch {}
                router.push('/signup');
              }}
            >
              Sign Up
            </Button>
          </div>
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
                  <Input id="cv-email" name="email" type="email" required defaultValue={resendEmailInput} />
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
                <div className="mt-3 text-sm text-center">
                  New here?
                  <Button
                    type="button"
                    variant="link"
                    className="ml-1 p-0 h-auto"
                    onClick={() => {
                      try {
                        document.cookie = `signup_access=1; path=/; max-age=120; samesite=lax`;
                      } catch {}
                      router.push('/signup');
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}