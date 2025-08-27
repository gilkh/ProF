
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
import { Loader2, Send } from 'lucide-react';
import { createVendorInquiry } from '@/lib/services';
import type { VendorInquiry } from '@/lib/types';
import { Textarea } from './ui/textarea';

interface VendorInquiryDialogProps {
  children: React.ReactNode;
}

export function VendorInquiryDialog({ children }: VendorInquiryDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);

    const formData = new FormData(e.currentTarget);
    const inquiryData: Omit<VendorInquiry, 'id' | 'createdAt' | 'status'> = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        businessName: formData.get('businessName') as string,
        phone: formData.get('phone') as string,
        message: formData.get('message') as string,
    };
    
    try {
      await createVendorInquiry(inquiryData);
      toast({
        title: 'Inquiry Sent!',
        description: 'Thank you for your interest. Our team will contact you shortly!',
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to send inquiry:", error);
      toast({ title: "Request Failed", description: "Could not send your inquiry. Please try again.", variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Become a Farhetkoun Vendor</DialogTitle>
          <DialogDescription>
            Interested in joining our platform? Fill out your details below and our team will get in touch with you.
          </DialogDescription>
        </DialogHeader>
        <form id="vendor-inquiry-form" onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" required />
                </div>
                <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" required />
                </div>
            </div>
             <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" name="businessName" required />
            </div>
             <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" required />
            </div>
            <div>
                <Label htmlFor="message">Tell us about your services</Label>
                <Textarea id="message" name="message" rows={4} placeholder="e.g., I'm a wedding photographer based in..."/>
            </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="vendor-inquiry-form" disabled={isSending}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Inquiry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
