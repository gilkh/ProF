'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  getPendingVerificationAccounts, 
  getEmailVerificationSetting, 
  updateEmailVerificationSetting,
  completeEmailVerification,
  resendVerificationEmail 
} from '@/lib/services';
import { adminVerifyAccountServerAction } from '@/app/admin/actions';
import { CheckCircle, XCircle, Mail, User, Calendar, Settings, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

interface PendingAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  accountType: 'client' | 'vendor';
}

export default function AdminEmailVerification() {
  const { toast } = useToast();
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [verifyingAccounts, setVerifyingAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accounts, verificationSetting] = await Promise.all([
        getPendingVerificationAccounts(),
        getEmailVerificationSetting()
      ]);
      setPendingAccounts(accounts);
      setEmailVerificationEnabled(verificationSetting);
    } catch (error) {
      console.error('Error loading email verification data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email verification data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (enabled: boolean) => {
    try {
      await updateEmailVerificationSetting(enabled);
      setEmailVerificationEnabled(enabled);
      toast({
        title: 'Settings Updated',
        description: `Email verification ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error updating email verification setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email verification setting',
        variant: 'destructive'
      });
    }
  };

  const handleVerifyAccount = async (accountId: string, accountType: 'client' | 'vendor') => {
    try {
      setVerifyingAccounts(prev => new Set(prev).add(accountId));
      const success = await adminVerifyAccountServerAction(accountId, accountType);
      
      if (success) {
        setPendingAccounts(prev => prev.filter(account => account.id !== accountId));
        toast({
          title: 'Account Verified',
          description: 'Account has been manually verified and activated',
        });
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify account',
        variant: 'destructive'
      });
    } finally {
      setVerifyingAccounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Verification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Verification Settings
          </CardTitle>
          <CardDescription>
            Control whether new client accounts require email verification before they can log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Require Email Verification</p>
              <p className="text-sm text-muted-foreground">
                When enabled, new clients must verify their email before accessing their account.
              </p>
            </div>
            <Switch
              checked={emailVerificationEnabled}
              onCheckedChange={handleToggleVerification}
            />
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Status:</strong> Email verification is currently{' '}
              <Badge variant={emailVerificationEnabled ? 'default' : 'secondary'}>
                {emailVerificationEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Email Verifications
            <Badge variant="outline">{pendingAccounts.length}</Badge>
          </CardTitle>
          <CardDescription>
            Accounts waiting for email verification. You can manually verify them here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingAccounts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No pending email verifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {account.firstName} {account.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{account.email}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="outline">
                          {account.accountType}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(account.createdAt, 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleVerifyAccount(account.id, account.accountType)}
                    disabled={verifyingAccounts.has(account.id)}
                    size="sm"
                  >
                    {verifyingAccounts.has(account.id) ? (
                      'Verifying...'
                    ) : (
                      'Verify Account'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}