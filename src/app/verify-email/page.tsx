'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

function VerifyEmailStatus() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!oobCode) {
      setStatus('error');
      setMessage('No verification token provided. The link may be invalid.');
      return;
    }

    async function verify() {
      try {
        await applyActionCode(auth, oobCode as string);
        
        // After successful verification, complete the user profile creation
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            // Import the completion function
            const { completeEmailVerification } = await import('@/lib/services');
            await completeEmailVerification(currentUser.uid);
          } catch (profileError) {
            console.error('Error completing profile after verification:', profileError);
            // Don't fail the verification if profile completion fails
          }
        }
        
        setStatus('success');
        setMessage('Your email has been successfully verified. You can now log in.');
        toast({
          title: 'Email Verified!',
          description: 'You can now log in to your account.',
        });
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        let errorMessage = 'An unknown error occurred during verification.';
        
        // Handle different Firebase Auth error codes
        switch (error.code) {
          case 'auth/invalid-action-code':
            errorMessage = 'The verification link is invalid or has expired. Please try signing up again or request a new link.';
            break;
          case 'auth/expired-action-code':
            errorMessage = 'The verification link has expired. Please request a new verification email.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This user account has been disabled. Please contact support.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No user account found for this verification link. Please try signing up again.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. Please choose a stronger password.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection and try again.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          default:
            errorMessage = `Verification failed: ${error.message || 'Unknown error'}`;
        }
        
        setMessage(errorMessage);
        toast({
          title: 'Verification Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
    verify();
  }, [oobCode, toast]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
      {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
      {status === 'error' && <XCircle className="h-12 w-12 text-destructive" />}
      <p className="text-center text-muted-foreground">{message}</p>
      
      {status === 'error' && message.includes('expired') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            Your verification link has expired. Please sign up again to receive a new verification email.
          </p>
        </div>
      )}
      
      {status === 'success' && (
        <Button asChild>
          <Link href="/login">Proceed to Login</Link>
        </Button>
      )}
      
      {status === 'error' && (
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/signup">Sign Up Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            We are confirming your email address. Please wait a moment.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Suspense fallback={<Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />}>
              <VerifyEmailStatus />
            </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
