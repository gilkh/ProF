
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceCard } from './service-card';
import { OfferCard } from './offer-card';
import Link from 'next/link';
import { Calendar, Compass, Heart, PartyPopper } from 'lucide-react';
import { useEffect, useState, useMemo, memo } from 'react';
import type { Booking, ServiceOrOffer, UserProfile } from '@/lib/types';
import { getBookingsForUser, getSavedItems, getServicesAndOffers, getUserProfile } from '@/lib/services';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';


const MemoizedOfferCard = memo(OfferCard);
const MemoizedServiceCard = memo(ServiceCard);

const StatCard = memo(({ title, value, icon: Icon, linkHref, linkText, isLoading }: { title: string, value: string | number, icon: React.ElementType, linkHref: string, linkText: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
            {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
        {isLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : <div className="text-2xl font-bold">{value}</div>}
        <Link href={linkHref}>
            <p className="text-xs text-muted-foreground underline hover:text-primary">
                {linkText}
            </p>
        </Link>
        </CardContent>
    </Card>
));
StatCard.displayName = 'StatCard';


export function ClientHome() {
    const { userId, isLoading: isAuthLoading } = useAuth();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
    const [savedItemsCount, setSavedItemsCount] = useState(0);
    const [featuredItems, setFeaturedItems] = useState<ServiceOrOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadDashboardData() {
            if (!userId) {
                if (!isAuthLoading) setIsLoading(false);
                return;
            };

            setIsLoading(true);
            try {
                // Fetch data in parallel for better performance
                const [userProfile, bookings, saved, featured] = await Promise.all([
                    getUserProfile(userId),
                    getBookingsForUser(userId),
                    getSavedItems(userId, true), // Only fetch count
                    getServicesAndOffers(undefined, 4), // Fetch 4 featured items
                ]);
                
                setUser(userProfile)
                setUpcomingBookings(bookings.filter(b => b.date >= new Date()));
                setSavedItemsCount(Array.isArray(saved) ? saved.length : 0);
                setFeaturedItems(featured);

            } catch (error) {
                console.error("Failed to load client dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadDashboardData();
    }, [userId, isAuthLoading]);
    
    const { specialOffers, featuredServices } = useMemo(() => ({
        specialOffers: featuredItems.filter(i => i.type === 'offer').slice(0, 2),
        featuredServices: featuredItems.filter(i => i.type === 'service').slice(0, 2)
    }), [featuredItems]);

    const pageIsLoading = isLoading || isAuthLoading;

    return (
        <div className="space-y-8">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-3xl font-bold">
                                {pageIsLoading ? <Skeleton className="h-9 w-64" /> : `Welcome back, ${user?.firstName || 'User'}!`}
                            </CardTitle>
                            <CardDescription className="mt-2 text-lg">Let's start planning your next amazing event.</CardDescription>
                        </div>
                        <Link href="/client/event-planner">
                            <Button size="lg" className="w-full md:w-auto">
                                <PartyPopper className="mr-2" />
                                Open Event Planner
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Upcoming Bookings"
                    value={upcomingBookings.length}
                    icon={Calendar}
                    linkHref="/client/bookings"
                    linkText="View your calendar"
                    isLoading={pageIsLoading}
                />
                 <StatCard 
                    title="Saved Items"
                    value={savedItemsCount}
                    icon={Heart}
                    linkHref="/client/saved"
                    linkText="View your favorites"
                    isLoading={pageIsLoading}
                />
                <StatCard 
                    title="Explore Services"
                    value="50+"
                    icon={Compass}
                    linkHref="/client/explore"
                    linkText="Find vendors for any need"
                    isLoading={pageIsLoading}
                />
            </div>
            
             <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Special Offers</h2>
                    <p className="text-muted-foreground">Don't miss these limited-time deals.</p>
                </div>
                 {pageIsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-96 w-full rounded-xl" />
                        <Skeleton className="h-96 w-full rounded-xl" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {specialOffers.map((item) =>
                            <MemoizedOfferCard key={item.id} offer={item} role="client" />
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Featured Services</h2>
                    <p className="text-muted-foreground">Top-rated professionals to make your event unforgettable.</p>
                </div>
                 {pageIsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-96 w-full rounded-xl" />
                        <Skeleton className="h-96 w-full rounded-xl" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {featuredServices.map((item) =>
                            <MemoizedServiceCard key={item.id} service={item} role="client" />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
