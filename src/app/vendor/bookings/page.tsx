
'use client';
import { CalendarView } from '@/components/calendar-view';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getBookingsForVendor } from '@/lib/services';
import type { Booking } from '@/lib/types';
import { useEffect, useState } from 'react';

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
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>An overview of all your scheduled events and appointments.</CardDescription>
            </CardHeader>
        </Card>
        <CalendarView bookings={bookings} isLoading={isLoading || isAuthLoading} />
    </div>
  )
}
