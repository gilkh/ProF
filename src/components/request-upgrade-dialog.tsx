
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gem } from 'lucide-react';
import { createUpgradeRequest } from '@/lib/services';
import type { VendorProfile } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

interface RequestUpgradeDialogProps {
  vendor: VendorProfile;
  children: React.ReactNode;
}

export function RequestUpgradeDialog({ vendor, children }: RequestUpgradeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [phone, setPhone] = useState(vendor.phone || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
        toast({ title: "Phone number required", description: "Please enter your phone number.", variant: "destructive"});
        return;
    }
    setIsSending(true);
    try {
      await createUpgradeRequest({
          vendorId: vendor.id,
          vendorName: vendor.businessName,
          currentTier: vendor.accountTier,
          phone: phone,
      });
      toast({
        title: 'Request Sent!',
        description: 'Our team will contact you shortly about upgrading your account.',
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to send upgrade request:", error);
      toast({ title: "Request Failed", description: "Could not send your request. Please try again.", variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Account Upgrade</DialogTitle>
          <DialogDescription>
            Interested in more features? Our team will contact you to discuss our premium tiers. Please confirm your contact number below.
          </DialogDescription>
        </DialogHeader>
        <form id="upgrade-request-form" onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                        Phone
                    </Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" required />
                </div>
            </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="upgrade-request-form" disabled={isSending}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gem className="mr-2 h-4 w-4" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
