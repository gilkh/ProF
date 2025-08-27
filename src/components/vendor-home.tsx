

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Users, Briefcase, CalendarClock, PlusCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import type { Booking, QuoteRequest, ServiceOrOffer, VendorProfile } from '@/lib/types';
import { getBookingsForVendor, getVendorQuoteRequests, getServicesAndOffers, getVendorProfile } from '@/lib/services';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

export function VendorHome() {
  const { userId: vendorId, isLoading: isAuthLoading } = useAuth();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [listings, setListings] = useState<ServiceOrOffer[]>([]);
  const [pendingRequests, setPendingRequests] = useState<QuoteRequest[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
        if (!vendorId) {
            if (!isAuthLoading) setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            // All data fetching is now done in the page component.
            // This component will receive data via props in a future step if needed,
            // but for now we can rely on the page-level loading.
            // This avoids redundant fetches.
            const [profile, allListings, requests, bookings] = await Promise.all([
                getVendorProfile(vendorId),
                getServicesAndOffers(vendorId, { includePending: true }),
                getVendorQuoteRequests(vendorId),
                getBookingsForVendor(vendorId),
            ]);
            setVendorProfile(profile);
            setListings(allListings);
            setPendingRequests(requests.filter(r => r.status === 'pending'));
            setUpcomingBookings(bookings.filter(b => b.date >= new Date()).slice(0,2));
        } catch (error) {
            console.error("Failed to load vendor dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    }
    loadDashboardData();
  }, [vendorId, isAuthLoading]);

  const recentActivity = [
      ...pendingRequests.slice(0, 1).map(r => ({ type: 'request', data: r, time: new Date(r.createdAt) })),
      ...upcomingBookings.slice(0, 1).map(b => ({ type: 'booking', data: b, time: new Date(b.date) })),
  ].filter(activity => activity.data).sort((a, b) => b.time.getTime() - a.time.getTime());


  const pageIsLoading = isLoading || isAuthLoading;

  return (
    <div className="space-y-8">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-lg">
            <CardHeader>
                 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-3xl font-bold">
                             {pageIsLoading ? <Skeleton className="h-9 w-64" /> : `Welcome, ${vendorProfile?.businessName || 'Vendor'}!`}
                        </CardTitle>
                        <CardDescription className="mt-2 text-lg">Here's what's happening with your business today.</CardDescription>
                    </div>
                    <Link href="/vendor/manage-services">
                        <Button size="lg" className="w-full md:w-auto">
                            <PlusCircle className="mr-2" />
                            Create New Listing
                        </Button>
                    </Link>
                </div>
            </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Listings
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {pageIsLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : <div className="text-2xl font-bold">{listings.length}</div>}
              <p className="text-xs text-muted-foreground">
                {listings.filter(l => l.type === 'service').length} Services, {listings.filter(l => l.type === 'offer').length} Offers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Requests
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {pageIsLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : <div className="text-2xl font-bold">+{pendingRequests.length}</div>}
               <Link href="/vendor/client-requests">
                <p className="text-xs text-muted-foreground underline hover:text-primary">
                    New quote requests from clients
                </p>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {pageIsLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : <div className="text-2xl font-bold">{upcomingBookings.length}</div>}
              <Link href="/vendor/bookings">
                <p className="text-xs text-muted-foreground underline hover:text-primary">
                    Confirmed and scheduled events
                </p>
               </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
                 <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>A summary of your latest notifications and tasks.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pageIsLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : recentActivity.length > 0 ? (
                            <ul className="space-y-4">
                               {recentActivity.map((activity, index) => (
                                    <li key={index} className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                                            {activity.type === 'request' && <Users className="h-5 w-5 text-secondary-foreground" />}
                                            {activity.type === 'booking' && <CalendarClock className="h-5 w-5 text-secondary-foreground" />}
                                        </div>
                                        <div className="flex-grow">
                                            {activity.type === 'request' && (
                                                <p>New quote request from <span className="font-semibold">{(activity.data as QuoteRequest).clientName}</span>.</p>
                                            )}
                                             {activity.type === 'booking' && (
                                                <p>New booking confirmed with <span className="font-semibold">{(activity.data as Booking).with}</span>.</p>
                                            )}
                                            <p className="text-sm text-muted-foreground">{formatDistanceToNow(activity.time, { addSuffix: true })}</p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            View Details
                                        </Button>
                                    </li>
                               ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">No recent activity.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Bookings</CardTitle>
                         <CardDescription>Your next two events.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pageIsLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ) : upcomingBookings.length > 0 ? upcomingBookings.map(booking => (
                            <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                <div className="text-center w-16 flex-shrink-0">
                                    <p className="font-bold text-lg text-primary">{booking.date.getDate()}</p>
                                    <p className="text-xs text-muted-foreground uppercase">{booking.date.toLocaleString('default', { month: 'short' })}</p>
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold">{booking.title}</p>
                                    <p className="text-sm text-muted-foreground">With: {booking.with}</p>
                                </div>
                                <Badge variant="outline">{booking.time}</Badge>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-4">No upcoming bookings.</p>
                        )}
                        <Button asChild variant="secondary" className="w-full">
                            <Link href="/vendor/bookings">View All Bookings</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
