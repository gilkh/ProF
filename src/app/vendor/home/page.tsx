
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Users, Briefcase, CalendarClock, PlusCircle, Gem } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, memo } from 'react';
import type { Booking, QuoteRequest, ServiceOrOffer, VendorProfile, VendorAnalyticsData } from '@/lib/types';
import { getBookingsForVendor, getVendorQuoteRequests, getServicesAndOffers, getVendorProfile, getVendorAnalytics } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { RequestUpgradeDialog } from '@/components/request-upgrade-dialog';
import { VendorAnalyticsChart } from '@/components/vendor-analytics-chart';

const StatCard = memo(({ title, value, icon: Icon, linkHref, linkText, isLoading }: { title: string, value: string | number, icon: React.ElementType, linkHref?: string, linkText?: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : <div className="text-2xl font-bold">{value}</div>}
            {linkHref && <Link href={linkHref}><p className="text-xs text-muted-foreground underline hover:text-primary">{linkText}</p></Link>}
            {!linkHref && <p className="text-xs text-muted-foreground">{linkText}</p>}
        </CardContent>
    </Card>
));
StatCard.displayName = 'StatCard';


const UpcomingBookingsCard = memo(({ bookings, isLoading }: { bookings: Booking[], isLoading: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Your next two events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : bookings.length > 0 ? bookings.map(booking => (
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
));
UpcomingBookingsCard.displayName = 'UpcomingBookingsCard';

export default function VendorHomePage() {
  const { userId: vendorId, isLoading: isAuthLoading } = useAuth();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [listings, setListings] = useState<ServiceOrOffer[]>([]);
  const [pendingRequests, setPendingRequests] = useState<QuoteRequest[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [analyticsData, setAnalyticsData] = useState<VendorAnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
        if (!vendorId) {
            if (!isAuthLoading) setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [profile, vendorListings, requests, bookings, analytics] = await Promise.all([
                getVendorProfile(vendorId),
                getServicesAndOffers(vendorId), // Fetch only this vendor's listings
                getVendorQuoteRequests(vendorId),
                getBookingsForVendor(vendorId),
                getVendorAnalytics(vendorId)
            ]);
            setVendorProfile(profile);
            setListings(vendorListings);
            setPendingRequests(requests.filter(r => r.status === 'pending'));
            setUpcomingBookings(bookings.filter(b => b.date >= new Date()).slice(0,2));
            setAnalyticsData(analytics);
        } catch (error) {
            console.error("Failed to load vendor dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    }
    loadDashboardData();
  }, [vendorId, isAuthLoading]);

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
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        {vendorProfile && (
                            <RequestUpgradeDialog vendor={vendorProfile}>
                                <Badge variant="outline" className="text-lg capitalize border-green-600 bg-green-50 text-green-700 gap-2 p-3 w-full justify-center md:w-auto cursor-pointer hover:bg-green-100">
                                    <Gem className="h-5 w-5" />
                                    {vendorProfile.accountTier} Tier
                                </Badge>
                            </RequestUpgradeDialog>
                        )}
                        <Link href="/vendor/manage-services" className="w-full md:w-auto">
                            <Button size="lg" className="w-full">
                                <PlusCircle className="mr-2" />
                                Create New Listing
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard 
                title="Active Listings"
                value={listings.length}
                icon={Briefcase}
                linkText={`${listings.filter(l => l.type === 'service').length} Services, ${listings.filter(l => l.type === 'offer').length} Offers`}
                isLoading={pageIsLoading}
            />
             <StatCard 
                title="Pending Requests"
                value={`+${pendingRequests.length}`}
                icon={Users}
                linkHref="/vendor/client-requests"
                linkText="New quote requests from clients"
                isLoading={pageIsLoading}
            />
            <StatCard 
                title="Upcoming Bookings"
                value={upcomingBookings.length}
                icon={CalendarClock}
                linkHref="/vendor/bookings"
                linkText="Confirmed and scheduled events"
                isLoading={pageIsLoading}
            />
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
                 <VendorAnalyticsChart data={analyticsData} isLoading={pageIsLoading} />
            </div>
            <div className="lg:col-span-2">
                <UpcomingBookingsCard bookings={upcomingBookings} isLoading={pageIsLoading} />
            </div>
        </div>
    </div>
  );
}
