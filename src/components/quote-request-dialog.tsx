
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Service, UserProfile, Offer, QuoteRequest } from '@/lib/types';
import { createQuoteRequest, getUserProfile } from '@/lib/services';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface QuoteRequestDialogProps {
  children: React.ReactNode;
  service: Service | Offer;
}

export function QuoteRequestDialog({ children, service }: QuoteRequestDialogProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    if (userId && open) {
        getUserProfile(userId).then(setUserProfile);
    }
  }, [userId, open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !userProfile) {
        toast({ title: "Not Logged In", description: "You must be logged in to request a quote.", variant: "destructive" });
        return;
    }
    setIsSending(true);

    const formData = new FormData(event.currentTarget);
    const message = formData.get('message') as string;
    const eventDate = formData.get('date') as string;
    const phone = formData.get('phone') as string;
    const guestCount = parseInt(formData.get('guests') as string, 10) || 0;


    try {
        const quoteData: Omit<QuoteRequest, 'id'| 'status' | 'createdAt'> = {
            clientId: userId,
            clientName: `${userProfile.firstName} ${userProfile.lastName}`,
            clientAvatar: userProfile.avatar,
            vendorId: service.vendorId,
            serviceId: service.id,
            serviceTitle: service.title,
            message,
            eventDate,
            guestCount,
            phone,
        };

        await createQuoteRequest({
            ...quoteData,
            item: service, // Pass the full service/offer object
        });

        toast({
            title: 'Quote Request Sent!',
            description: `Your request has been sent to ${service.vendorName}. You can see their reply in your Messages.`,
        });
        setOpen(false);
    } catch (error) {
        console.error("Failed to send quote request", error);
        toast({ title: "Send Failed", description: "Could not send your request. Please try again.", variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };
  
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault(); 
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={handleTriggerClick}>
        {children}
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a Quote: {service.title}</DialogTitle>
          <DialogDescription>
            Fill out your event details to get a personalized quote from {service.vendorName}.
          </DialogDescription>
        </DialogHeader>
        <form id="quote-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right">
              Message
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Hi, I'm interested in this. Could you tell me more about..."
              className="col-span-3"
              rows={5}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Event Date
            </Label>
            <Input id="date" name="date" type="date" className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="guests" className="text-right">
              Est. Guests
            </Label>
            <Input id="guests" name="guests" type="number" placeholder="e.g., 150" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input id="phone" name="phone" type="tel" defaultValue={userProfile?.phone} placeholder="Your contact number" className="col-span-3" required />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="quote-form" disabled={isSending} className="w-full sm:w-auto">
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
