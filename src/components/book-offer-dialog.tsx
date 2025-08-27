

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
import { useToast } from '@/hooks/use-toast';
import type { Offer, ServiceOrOffer } from '@/lib/types';
import { Calendar } from './ui/calendar';
import { Clock, CreditCard, Loader2, Lock } from 'lucide-react';
import { Separator } from './ui/separator';
import { createBooking } from '@/lib/services';
import { useAuth } from '@/hooks/use-auth';

interface BookOfferDialogProps {
  children: React.ReactNode;
  offer: Offer;
}

export function BookOfferDialog({ children, offer }: BookOfferDialogProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [step, setStep] = React.useState(1);
  const [isBooking, setIsBooking] = React.useState(false);

  const availableDates = React.useMemo(() => {
    return offer.availableDates?.map(d => new Date(d)) || [];
  }, [offer.availableDates]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
        toast({ title: "Not Logged In", description: "You must be logged in to book an offer.", variant: "destructive" });
        return;
    }
    if (step === 1) {
        if (!date) {
            toast({ title: "Missing Date", description: "Please select a date for your booking.", variant: "destructive" });
            return;
        }
        setStep(2);
    } else {
        setIsBooking(true);
        try {
            const form = event.currentTarget;
            const time = (form.elements.namedItem('time') as HTMLInputElement).value;
            const name = (form.elements.namedItem('name') as HTMLInputElement).value;

            if (!date || !time || !name) {
                toast({ title: "Missing Information", description: "Please fill out all fields.", variant: "destructive" });
                return;
            }

            await createBooking({
                title: offer.title,
                with: name,
                clientId: userId,
                vendorId: offer.vendorId,
                date: date,
                time: time,
                serviceId: offer.id,
                serviceType: 'offer',
            });
            
            toast({
                title: 'Booking Successful!',
                description: `Your booking for "${offer.title}" has been confirmed.`,
            });
            setOpen(false);
            setStep(1); 
        } catch (error) {
            console.error("Failed to create booking:", error);
            toast({ title: "Booking Failed", description: "Could not complete your booking. Please try again.", variant: "destructive" });
        } finally {
            setIsBooking(false);
        }
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
       <div onClick={handleTriggerClick}>
        {children}
      </div>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Book Offer' : 'Confirm & Pay'}: {offer.title}</DialogTitle>
          <DialogDescription>
            {step === 1 ? `Confirm your booking with ${offer.vendorName}.` : `Secure your booking by completing the payment.`}
          </DialogDescription>
        </DialogHeader>

        <form id="book-form" onSubmit={handleSubmit} className="grid gap-6 py-4">
            {step === 1 && (
                 <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-grow">
                        <Label className="mb-2">Select an Available Date</Label>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                            disabled={(d) => !availableDates.some(ad => ad.getTime() === d.getTime())}
                            initialFocus
                        />
                    </div>
                    <div className="space-y-4 sm:w-2/5">
                        <div>
                            <Label htmlFor="time">Select a Time</Label>
                            <Input id="time" name="time" type="time" required defaultValue="14:00" />
                        </div>
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" placeholder="John Doe" required />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required/>
                        </div>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="card-number">Card Number</Label>
                        <div className="relative">
                            <Input id="card-number" placeholder="1234 5678 9101 1121" required />
                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                         <div>
                            <Label htmlFor="expiry">Expiry</Label>
                            <Input id="expiry" placeholder="MM/YY" required />
                        </div>
                         <div>
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" placeholder="123" required />
                        </div>
                        <div>
                            <Label htmlFor="zip">ZIP</Label>
                            <Input id="zip" placeholder="12345" required />
                        </div>
                    </div>
                     <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                        <Lock className="h-3 w-3" />
                        <span>Payments are secure and encrypted.</span>
                    </div>
                </div>
            )}
        </form>

        <Separator />

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between items-center sm:items-end w-full gap-4">
            <div className="text-left w-full sm:w-auto">
                <p className="text-muted-foreground">Total Price</p>
                <p className="text-3xl font-bold text-primary">${offer.price}</p>
            </div>
            {step === 1 ? (
                 <Button type="submit" form="book-form" size="lg">
                    Proceed to Payment
                </Button>
            ): (
                 <Button type="submit" form="book-form" size="lg" disabled={isBooking}>
                    {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm & Book for ${offer.price}
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
