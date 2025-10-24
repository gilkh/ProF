

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
import type { Offer, ServiceOrOffer, AvailabilitySlot, ServiceAvailability } from '@/lib/types';
import { Calendar } from './ui/calendar';
import { Clock, CreditCard, Loader2, Lock, AlertCircle } from 'lucide-react';
import { Separator } from './ui/separator';
import { createBooking, getAvailableSlots, bookTimeSlot, subscribeToServiceAvailability } from '@/lib/services';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { format, isSameDay } from 'date-fns';

interface BookOfferDialogProps {
  children: React.ReactNode;
  offer: Offer;
}

export function BookOfferDialog({ children, offer }: BookOfferDialogProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string | undefined>(undefined);
  const [step, setStep] = React.useState(1);
  const [isBooking, setIsBooking] = React.useState(false);
  const [availableSlots, setAvailableSlots] = React.useState<AvailabilitySlot[]>([]);
  const [serviceAvailability, setServiceAvailability] = React.useState<ServiceAvailability | null>(null);
  const [loadingSlots, setLoadingSlots] = React.useState(false);

  // Subscribe to real-time availability updates
  React.useEffect(() => {
    if (!open || !offer.vendorId) return;

    const unsubscribe = subscribeToServiceAvailability(
      offer.vendorId,
      offer.id,
      (availability) => {
        setServiceAvailability(availability);
      }
    );

    return unsubscribe;
  }, [open, offer.vendorId, offer.id]);

  // Load available slots when date changes
  React.useEffect(() => {
    if (!date || !offer.vendorId) return;

    setLoadingSlots(true);
    getAvailableSlots(offer.vendorId, offer.id, date)
      .then(slots => {
        setAvailableSlots(slots);
      })
      .catch(error => {
        console.error('Failed to load available slots:', error);
        toast({
          title: 'Error',
          description: 'Failed to load available time slots.',
          variant: 'destructive'
        });
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [date, offer.vendorId, offer.id, toast]);

  const availableDates = React.useMemo(() => {
    if (!serviceAvailability?.isVisible) return [];
    
    // Get dates from vendor availability or fallback to offer's availableDates
    const dates = serviceAvailability?.availableDates || offer.availableDates;
    return dates?.map(d => new Date(d)) || [];
  }, [serviceAvailability, offer.availableDates]);

  const isDateAvailable = React.useCallback((checkDate: Date) => {
    if (!serviceAvailability?.isVisible) return false;
    
    // Check if date is in available dates
    const isInAvailableDates = availableDates.some(d => isSameDay(d, checkDate));
    if (!isInAvailableDates) return false;

    // Check if day is not fully booked
    const dayKey = format(checkDate, 'yyyy-MM-dd');
    const dayAvailability = serviceAvailability?.dayAvailability?.[dayKey];
    
    return dayAvailability?.isAvailable !== false;
  }, [serviceAvailability, availableDates]);

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
        if (!selectedTimeSlot) {
            toast({ title: "Missing Time", description: "Please select an available time slot.", variant: "destructive" });
            return;
        }
        setStep(2);
    } else {
        setIsBooking(true);
        try {
            const form = event.currentTarget;
            const name = (form.elements.namedItem('name') as HTMLInputElement).value;

            if (!date || !selectedTimeSlot || !name) {
                toast({ title: "Missing Information", description: "Please fill out all fields.", variant: "destructive" });
                return;
            }

            // Book the time slot first to ensure it's still available
            await bookTimeSlot(offer.vendorId, offer.id, date, selectedTimeSlot);

            // Create the booking record
            await createBooking({
                title: offer.title,
                with: name,
                clientId: userId,
                vendorId: offer.vendorId,
                date: date,
                time: selectedTimeSlot,
                serviceId: offer.id,
                serviceType: 'offer',
            });
            
            toast({
                title: 'Booking Successful!',
                description: `Your booking for "${offer.title}" has been confirmed for ${format(date, 'PPP')} at ${selectedTimeSlot}.`,
            });
            setOpen(false);
            setStep(1);
            setSelectedTimeSlot(undefined);
            setDate(undefined);
        } catch (error) {
            console.error("Failed to create booking:", error);
            toast({ 
                title: "Booking Failed", 
                description: error instanceof Error ? error.message : "Could not complete your booking. Please try again.", 
                variant: "destructive" 
            });
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
                <div className="flex flex-col gap-6">
                    {/* Service Availability Status */}
                    {serviceAvailability && !serviceAvailability.isVisible && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">
                                This service is currently not accepting bookings.
                            </span>
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-grow">
                            <Label className="mb-2">Select an Available Date</Label>
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                    setDate(newDate);
                                    setSelectedTimeSlot(undefined); // Reset time slot when date changes
                                }}
                                className="rounded-md border"
                                disabled={(d) => !isDateAvailable(d)}
                                initialFocus
                            />
                        </div>
                        
                        <div className="space-y-4 sm:w-2/5">
                            {/* Available Time Slots */}
                            {date && (
                                <div>
                                    <Label className="mb-2">Available Time Slots</Label>
                                    {loadingSlots ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="ml-2 text-sm text-muted-foreground">Loading slots...</span>
                                        </div>
                                    ) : availableSlots.length > 0 ? (
                                        <ScrollArea className="h-32 border rounded-md p-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                {availableSlots.map((slot) => (
                                                    <Button
                                                        key={slot.time}
                                                        type="button"
                                                        variant={selectedTimeSlot === slot.time ? "default" : "outline"}
                                                        size="sm"
                                                        className="justify-start"
                                                        onClick={() => setSelectedTimeSlot(slot.time)}
                                                    >
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {slot.time}
                                                    </Button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    ) : (
                                        <div className="flex items-center justify-center p-4 border rounded-md bg-gray-50">
                                            <span className="text-sm text-muted-foreground">No available slots for this date</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
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
                 <Button 
                    type="submit" 
                    form="book-form" 
                    size="lg"
                    disabled={!date || !selectedTimeSlot || (serviceAvailability && !serviceAvailability.isVisible)}
                 >
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
