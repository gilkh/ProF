'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Mail, Copy } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function AdminEmailTest() {
  const { toast } = useToast();
  const { user } = useAuth();
  const accountEmail = user?.email || '';
  const [isSending, setIsSending] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [companyName, setCompanyName] = useState('TradeCraft');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  

  const handleSend = async () => {
    if (!email) {
      toast({ title: 'Email required', description: 'Please enter an email address.' });
      return;
    }
    setIsSending(true);
    try {
      // If testing with the signed-in account email, reuse Firebase's default verification
      if (user?.email && email.toLowerCase() === user.email.toLowerCase()) {
        const actionCodeSettings = {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: true,
        } as const;
        await sendEmailVerification(user, actionCodeSettings);
        toast({ title: 'Verification sent', description: `Sent to your account (${email}).` });
        return;
      }

      // Otherwise, call the server route to send a styled email via provider (if configured)
      const res = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName: firstName || 'there', companyName: companyName || 'TradeCraft' })
      });
      const data = await res.json();
      setVerificationLink(data?.verificationLink || null);
      if (res.ok && data?.success) {
        toast({ title: 'Verification email sent', description: `Sent to ${email}.` });
      } else {
        const status = res.status;
        const message = data?.message || 'Failed to send verification email.';
        const providerNotConfigured = message.includes('Email provider not configured') || status === 503;
        if (status === 429) {
          toast({ title: 'Too many requests', description: 'You are being rate limited. Please wait a minute and try again.' });
          return;
        }
        if (providerNotConfigured) {
          toast({
            title: 'Provider not configured',
            description: 'To send to any address automatically, configure Resend or SendGrid. Preview is shown below for testing.',
          });
          if (data?.previewHtml) {
            setPreviewHtml(data.previewHtml);
            setDialogOpen(true);
          }
          return;
        }
        if (status === 400) {
          toast({ title: 'Bad request', description: 'Please check the email address and try again.' });
        } else if (status >= 500) {
          toast({ title: 'Provider error', description: 'Email provider is unavailable. Try again later.' });
        } else {
          toast({ title: 'Email send issue', description: message });
        }
        if (data?.previewHtml) {
          setPreviewHtml(data.previewHtml);
          setDialogOpen(true);
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Unknown error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTestUser = async () => {
    if (!email) {
      toast({ title: 'Email required', description: 'Please enter an email address.' });
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch('/api/email/create-test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName: firstName || 'there', companyName: companyName || 'TradeCraft' })
      });
      const data = await res.json();
      setVerificationLink(data?.verificationLink || null);
      if (res.ok && data?.success) {
        toast({ title: 'Test user ready', description: `Created/ensured and sent verification to ${email}.` });
      } else {
        const status = res.status;
        const message = data?.message || 'Failed to create test user or send email.';
        const providerNotConfigured = message.includes('Email provider not configured') || status === 503;
        if (status === 429) {
          toast({ title: 'Too many requests', description: 'Rate limit hit. Please wait a minute and try again.' });
        } else if (providerNotConfigured) {
          // Show styled preview and link for manual copy
          toast({ title: 'Provider not configured', description: 'Showing preview and verification link.' });
          if (data?.previewHtml) {
            setPreviewHtml(data.previewHtml);
            setDialogOpen(true);
          }
        } else if (status >= 500) {
          toast({ title: 'Server error', description: 'Unable to create user or send email.' });
        } else {
          toast({ title: 'Issue', description: message });
          if (data?.previewHtml) {
            setPreviewHtml(data.previewHtml);
            setDialogOpen(true);
          }
        }
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Unknown error' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test Verification Email
          </CardTitle>
          <CardDescription>
            Send to any address. If providers are not configured, you’ll get a styled preview and the verification link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="test@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name (optional)</Label>
              <Input id="firstName" placeholder="Alex" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="companyName">Company (optional)</Label>
              <Input id="companyName" placeholder="TradeCraft" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Verification Email'}
            </Button>
            <Button variant="outline" onClick={handleCreateTestUser} disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Test User + Link'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            If the email matches your signed-in account, it uses Firebase default. For other addresses, configure Resend or SendGrid; otherwise a styled preview and link will be shown.
          </p>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>Styled verification email content. You can copy and test the link.</DialogDescription>
          </DialogHeader>
          {verificationLink && (
            <div className="mb-3 flex items-center gap-2">
              <code className="text-xs break-all flex-1 p-2 bg-muted rounded">{verificationLink}</code>
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  if (verificationLink) await navigator.clipboard.writeText(verificationLink);
                  toast({ title: 'Copied', description: 'Verification link copied to clipboard.' });
                } catch {
                  toast({ title: 'Copy failed', description: 'Could not copy the link.' });
                }
              }}>
                <Copy className="h-3 w-3 mr-1" /> Copy Link
              </Button>
            </div>
          )}
          <div className="max-h-[70vh] overflow-auto border rounded-md">
            {previewHtml && (
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}