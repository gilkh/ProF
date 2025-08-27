
'use client';
import { CalendarView } from '@/components/calendar-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getBookingsForUser, getReviewsForVendor } from '@/lib/services';
import type { Booking, Review } from '@/lib/types';
import { useEffect, useState } from 'react';
import { LeaveReviewDialog } from '@/components/leave-review-dialog';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function ClientBookingsPage() {
  const { userId, isLoading: isAuthLoading } = useAuth();
  const { language, translations } = useLanguage();
  const t = translations.clientBookings;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    if (!userId) {
      if (!isAuthLoading) setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [userBookings, userReviews] = await Promise.all([
        getBookingsForUser(userId),
        // A more optimized approach would be a dedicated 'getReviewedBookingIdsForClient'
        getReviewsForVendor(userId), // This is a temporary workaround to get reviews by this client
      ]);
      
      setBookings(userBookings);
      setReviewedBookingIds(new Set(userReviews.map(r => r.bookingId)));

    } catch(error) {
        console.error("Failed to load bookings", error);
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isAuthLoading]);

  const pastBookings = bookings.filter(b => b.date < new Date()).sort((a,b) => b.date.getTime() - a.date.getTime());
  const upcomingBookings = bookings.filter(b => b.date >= new Date()).sort((a,b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-8">
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
            </CardHeader>
        </Card>
        <CalendarView bookings={upcomingBookings} isLoading={isLoading || isAuthLoading} />

        <Card>
            <CardHeader>
                <CardTitle>{t.history.title}</CardTitle>
                <CardDescription>{t.history.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {pastBookings.map(booking => (
                        <li key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg">
                            <div>
                                <h3 className="font-semibold">{booking.title}</h3>
                                <p className="text-sm text-muted-foreground">{t.history.with} {booking.with} on {booking.date.toLocaleDateString(language)}</p>
                            </div>
                            {reviewedBookingIds.has(booking.id) ? (
                                 <Button variant="outline" disabled className="w-full sm:w-auto">
                                    <Star className="mr-2 h-4 w-4 fill-amber-400 text-amber-500" />
                                    {t.history.reviewSubmitted}
                                </Button>
                            ) : (
                                <LeaveReviewDialog booking={booking} onReviewSubmit={fetchBookings}>
                                    <Button className="w-full sm:w-auto">{t.history.leaveReview}</Button>
                                </LeaveReviewDialog>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    </div>
  )
}
