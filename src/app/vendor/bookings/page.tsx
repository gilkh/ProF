
'use client';
import { CalendarView } from '@/components/calendar-view';
import { VendorAvailabilityCalendar } from '@/components/vendor-availability-calendar';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { getBookingsForVendor } from '@/lib/services';
import type { Booking } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Calendar, Settings } from 'lucide-react';

export default function VendorBookingsPage() {
    const { userId, isLoading: isAuthLoading } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadBookings() {
            if (!userId) {
                if (!isAuthLoading) setIsLoading(false);
                return;
            };
            setIsLoading(true);
            try {
                const vendorBookings = await getBookingsForVendor(userId);
                setBookings(vendorBookings);
            } catch(error) {
                console.error("Failed to load bookings", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadBookings();
    }, [userId, isAuthLoading]);

  return (
    <div>
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>Manage your bookings and availability settings for all services and offers.</CardDescription>
            </CardHeader>
        </Card>
        
        <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bookings" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    My Bookings
                </TabsTrigger>
                <TabsTrigger value="availability" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Availability Management
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="bookings" className="mt-6">
                <CalendarView bookings={bookings} isLoading={isLoading || isAuthLoading} />
            </TabsContent>
            
            <TabsContent value="availability" className="mt-6">
                {userId && (
                    <VendorAvailabilityCalendar 
                        vendorId={userId} 
                        bookings={bookings}
                        onBookingUpdate={() => {
                            // Refresh bookings when availability changes affect them
                            if (userId) {
                                getBookingsForVendor(userId).then(setBookings).catch(console.error);
                            }
                        }}
                    />
                )}
            </TabsContent>
        </Tabs>
    </div>
  )
}
