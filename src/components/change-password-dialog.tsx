
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendPasswordResetEmail } from '@/lib/services';
import { useAuth } from '@/hooks/use-auth';


interface ChangePasswordDialogProps {
  userId: string;
  children: React.ReactNode;
}

export function ChangePasswordDialog({ userId, children }: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendResetEmail = async () => {
    if (!user?.email) {
        toast({ title: "Error", description: "Could not find user's email address.", variant: "destructive" });
        return;
    }
    setIsSending(true);
    try {
      await sendPasswordResetEmail(user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: `An email has been sent to ${user.email} with instructions to reset your password.`,
        duration: 8000,
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not send the password reset link.";
      toast({ title: "Request Failed", description: errorMessage, variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            To change your password, we'll send a secure password reset link to your email address.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <p>A password reset link will be sent to <span className="font-semibold">{user?.email}</span>.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSendResetEmail} disabled={isSending}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
