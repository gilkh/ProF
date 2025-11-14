
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ServiceCard } from './service-card';
import { OfferCard } from './offer-card';
import Link from 'next/link';
import { Calendar, Compass, Heart, Star, Tag, ArrowRight, MessageSquare, Wallet, Camera, Building2, Cake as CakeIcon, UtensilsCrossed, Video, Music, Headphones, Brush, Flower, Car, Shirt, PartyPopper } from 'lucide-react';
import type { CarouselApi } from '@/components/ui/carousel';
import { useEffect, useState, useMemo, memo } from 'react';
import type { Booking, ServiceOrOffer, UserProfile, SponsoredBanner, VendorProfile } from '@/lib/types';
import { getBookingsForUser, getSavedItems, getServicesAndOffers, getUserProfile, getSponsoredBanners, getTopVendors } from '@/lib/services';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';


const MemoizedOfferCard = memo(OfferCard);
const MemoizedServiceCard = memo(ServiceCard);

const StatCard = memo(({ title, value, icon: Icon, linkHref, linkText, isLoading }: { title: string, value: string | number, icon: React.ElementType, linkHref: string, linkText: string, isLoading: boolean }) => (
    <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium">
            {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
        {isLoading ? <Skeleton className="h-6 w-16 mt-1" /> : <div className="text-xl font-bold">{value}</div>}
        <Link href={linkHref}>
            <p className="text-xs text-muted-foreground underline hover:text-primary">
                {linkText}
            </p>
        </Link>
        </CardContent>
    </Card>
));
StatCard.displayName = 'StatCard';

const QuickTile = memo(({ title, value, icon: Icon, href, subtext, isLoading }: { title: string; value: string | number; icon: React.ElementType; href: string; subtext: string; isLoading: boolean }) => (
    <Link href={href}>
        <Card className="hover:shadow-sm transition">
            <CardContent className="p-2 flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                    <div className="text-xs font-semibold leading-tight">{title}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight hidden sm:block">{subtext}</div>
                </div>
                <div>
                    {isLoading ? (<Skeleton className="h-4 w-8" />) : (<Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{value}</Badge>)}
                </div>
            </CardContent>
        </Card>
    </Link>
));
QuickTile.displayName = 'QuickTile';


export function ClientHome() {
    const { userId, isLoading: isAuthLoading } = useAuth();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
    const [savedItemsCount, setSavedItemsCount] = useState(0);
    const [featuredItems, setFeaturedItems] = useState<ServiceOrOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [banners, setBanners] = useState<SponsoredBanner[]>([]);
    const [topVendors, setTopVendors] = useState<VendorProfile[]>([]);
    const [vendorCarouselApi, setVendorCarouselApi] = useState<CarouselApi | null>(null);
    const [picksCarouselApi, setPicksCarouselApi] = useState<CarouselApi | null>(null);

    // Debug instrumentation state
    const [notifDebug, setNotifDebug] = useState<{
        platform?: string;
        isNative?: boolean;
        hasCapacitor?: boolean;
        plugins?: string[];
        permission?: any;
        token?: string;
        tokenError?: string;
        backendUpdate?: string;
        listeners?: string[];
        steps: string[];
    }>({ steps: [] });

    useEffect(() => {
        async function loadDashboardData() {
            if (!userId) {
                if (!isAuthLoading) setIsLoading(false);
                return;
            };

            setIsLoading(true);
            try {
                // Fetch data in parallel for better performance
                const [userProfile, bookings, saved, featured, bannersRes, topVendorsRes] = await Promise.all([
                    getUserProfile(userId),
                    getBookingsForUser(userId),
                    getSavedItems(userId, true), // Only fetch count
                    getServicesAndOffers(undefined, 4), // Fetch 4 featured items
                    getSponsoredBanners(),
                    getTopVendors({ count: 12 }),
                ]);
                
                setUser(userProfile)
                setUpcomingBookings(bookings.filter(b => b.date >= new Date()));
                setSavedItemsCount(Array.isArray(saved) ? saved.length : 0);
                setFeaturedItems(featured);
                setBanners(bannersRes);
                setTopVendors(topVendorsRes);

            } catch (error) {
                console.error("Failed to load client dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadDashboardData();
    }, [userId, isAuthLoading]);

    // Notification debug: run as soon as client home mounts with a user
    useEffect(() => {
        let unsubWeb: any = null;
        async function runNotificationDiag() {
            if (!userId) return;
            const steps: string[] = [];
            try {
                const hasCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
                const platform = hasCapacitor ? ((window as any).Capacitor.getPlatform?.() || (window as any).Capacitor.platform || 'unknown') : 'web';
                const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
                const plugins = hasCapacitor ? Object.keys(((window as any).Capacitor.Plugins) || {}) : [];
                steps.push(`[env] platform=${platform} isNative=${isNative} hasCapacitor=${hasCapacitor} plugins=${plugins.join(',')}`);
                setNotifDebug(d => ({ ...d, platform, isNative, hasCapacitor, plugins, steps: [...steps] }));

                // Web permission check (even in WebView this API may exist)
                if (typeof Notification !== 'undefined') {
                    try {
                        const perm = await Notification.requestPermission();
                        steps.push(`[perm] Notification.requestPermission -> ${perm}`);
                        setNotifDebug(d => ({ ...d, permission: perm, steps: [...steps] }));
                    } catch (e: any) {
                        steps.push(`[perm] Notification.requestPermission error: ${e?.message || String(e)}`);
                        setNotifDebug(d => ({ ...d, steps: [...steps] }));
                    }
                }

                // Attach foreground listeners to surface incoming payloads
                try {
                    const listeners: string[] = [];
                    const cap = (window as any).Capacitor;
                    const FM = cap?.Plugins?.FirebaseMessaging;
                    const PN = cap?.Plugins?.PushNotifications;
                    if (FM?.addListener) {
                        FM.addListener('messageReceived', (payload: any) => {
                            setNotifDebug(d => ({ ...d, steps: [...d.steps, `[recv:FM] ${JSON.stringify(payload)}`] }));
                        });
                        FM.addListener('tokenReceived', (e: any) => {
                            setNotifDebug(d => ({ ...d, steps: [...d.steps, `[token:FM] ${e?.token}`], token: e?.token }));
                        });
                        listeners.push('FirebaseMessaging.messageReceived', 'FirebaseMessaging.tokenReceived');
                    }
                    if (PN?.addListener) {
                        PN.addListener('pushNotificationReceived', (n: any) => {
                            setNotifDebug(d => ({ ...d, steps: [...d.steps, `[recv:PN] ${JSON.stringify(n)}`] }));
                        });
                        PN.addListener('registration', (t: any) => {
                            setNotifDebug(d => ({ ...d, steps: [...d.steps, `[token:PN] ${t?.value}`], token: t?.value }));
                        });
                        PN.addListener('registrationError', (err: any) => {
                            setNotifDebug(d => ({ ...d, steps: [...d.steps, `[err:PN] ${JSON.stringify(err)}`], tokenError: JSON.stringify(err) }));
                        });
                        listeners.push('PushNotifications.pushNotificationReceived', 'PushNotifications.registration', 'PushNotifications.registrationError');
                    }
                    setNotifDebug(d => ({ ...d, listeners, steps: [...d.steps, `[listeners] attached: ${listeners.join(', ') || 'none'}`] }));
                } catch (e: any) {
                    steps.push(`[listeners] error: ${e?.message || String(e)}`);
                    setNotifDebug(d => ({ ...d, steps: [...steps] }));
                }

                // Trigger the app's initialization flow (uses web or native depending on platform)
                try {
                    const { initializeNotifications } = await import('@/lib/notifications');
                    steps.push('[init] initializeNotifications(...) start');
                    setNotifDebug(d => ({ ...d, steps: [...steps] }));
                    await initializeNotifications(userId);
                    steps.push('[init] initializeNotifications(...) done');
                    setNotifDebug(d => ({ ...d, steps: [...steps] }));
                } catch (e: any) {
                    steps.push(`[init] initializeNotifications error: ${e?.message || String(e)}`);
                    setNotifDebug(d => ({ ...d, steps: [...steps], tokenError: e?.message || String(e) }));
                }
            } catch (e: any) {
                steps.push(`[fatal] ${e?.message || String(e)}`);
                setNotifDebug(d => ({ ...d, steps: [...steps] }));
            }
        }
        runNotificationDiag();
        return () => {
            try { if (unsubWeb) unsubWeb(); } catch {}
        };
    }, [userId]);
    
    const { specialOffers, featuredServices } = useMemo(() => ({
        specialOffers: featuredItems.filter(i => i.type === 'offer').slice(0, 2),
        featuredServices: featuredItems.filter(i => i.type === 'service').slice(0, 2)
    }), [featuredItems]);

    const pageIsLoading = isLoading || isAuthLoading;

    useEffect(() => {
        if (!vendorCarouselApi) return;
        const id = setInterval(() => {
            try {
                if (vendorCarouselApi.canScrollNext()) vendorCarouselApi.scrollNext();
                else vendorCarouselApi.scrollTo(0);
            } catch {}
        }, 3500);
        return () => clearInterval(id);
    }, [vendorCarouselApi]);

    useEffect(() => {
        if (!picksCarouselApi) return;
        const id = setInterval(() => {
            try {
                if (picksCarouselApi.canScrollNext()) picksCarouselApi.scrollNext();
                else picksCarouselApi.scrollTo(0);
            } catch {}
        }, 4000);
        return () => clearInterval(id);
    }, [picksCarouselApi]);

    return (
        <div className="space-y-8">
            

            <Card className="relative overflow-hidden border-0 shadow-none">
                <CardHeader className="p-0">
                    <div className="relative rounded-xl px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-3 bg-gradient-to-br from-primary/10 via-accent/20 to-transparent">
                        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/40 blur-xl" />
                        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/20 blur-xl" />
                        <div className="sparkle-overlay" />
                        <div className="flex flex-col gap-2">
                            {pageIsLoading ? (
                                <Skeleton className="h-7 w-56" />
                            ) : (
                                <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
                                    {`Welcome back, ${user?.firstName || 'User'} 👋`}
                                </div>
                            )}
                            <div className="text-sm md:text-base text-muted-foreground">What event are you planning today?</div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="space-y-0 -mt-10">
                {pageIsLoading ? (
                    <Skeleton className="h-40 w-full rounded-xl" />
                ) : (
                    <Card className="overflow-hidden">
                        <div className="relative">
                            <Carousel opts={{ loop: true }}>
                                <CarouselContent>
                                    {(banners.length ? banners : featuredItems).map((b, i) => (
                                        <CarouselItem key={(b as any).id ?? i}>
                                            <div className="relative h-56 sm:h-72 w-full">
                                                <img src={(b as any).image || (b as any).media?.[0]?.url || (b as any).imageUrl || ''} alt={(b as any).title || (b as any).vendorName || 'Sponsored'} className="h-full w-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-white font-semibold text-lg">
                                                            {(b as any).vendorName || (b as any).title || 'Sponsored Vendor'}
                                                        </div>
                                                        <div className="text-white/80 text-xs flex items-center gap-1">
                                                            <Tag className="h-3 w-3" /> Sponsored
                                                        </div>
                                                    </div>
                                                    <Link href={(b as any).ctaHref || ((b as any).vendorId ? `/vendor/${(b as any).vendorId}` : '/client/explore')}>
                                                        <Button variant="secondary" className="bg-white/90 text-black hover:bg-white">
                                                            {(b as any).ctaLabel || 'View Package'}
                                                            <ArrowRight className="ml-1 h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                            </Carousel>
                        </div>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-3 gap-1">
                <QuickTile 
                    title="Upcoming Bookings"
                    value={upcomingBookings.length}
                    icon={Calendar}
                    href="/client/bookings"
                    subtext="View your calendar"
                    isLoading={pageIsLoading}
                />
                <QuickTile 
                    title="Saved Items"
                    value={savedItemsCount}
                    icon={Heart}
                    href="/client/saved"
                    subtext="View your favorites"
                    isLoading={pageIsLoading}
                />
                <QuickTile 
                    title="Explore Services"
                    value={"50+"}
                    icon={Compass}
                    href="/client/explore"
                    subtext="Find vendors fast"
                    isLoading={pageIsLoading}
                />
            </div>
            
            <div className="rounded-2xl bg-accent/3 backdrop-blur-sm border border-primary/40 p-3 sm:p-4">
                <Tabs defaultValue="categories">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs sm:text-sm text-muted-foreground">Browse by category or event type</p>
                        <TabsList className="rounded-full bg-gradient-to-br from-white/10 to-white/3 backdrop-blur-lg border border-primary/40 p-2 shadow-lg ring-1 ring-primary/10">
                            <TabsTrigger value="categories" className="rounded-full px-5 py-2 text-sm sm:text-base font-semibold transition data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow">
                                Categories
                            </TabsTrigger>
                            <TabsTrigger value="event-types" className="rounded-full px-5 py-2 text-sm sm:text-base font-semibold transition data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow">
                                Event Types
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="categories">
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold">Categories</h2>
                    <p className="text-muted-foreground">Explore by service type</p>
                </div>
                {/* Mobile: fun, compact tiles (3 per row) */}
                <div className="grid grid-cols-4 gap-2 sm:hidden">
                    {[
                        { label: 'Catering', q: 'Catering & Sweets', Icon: UtensilsCrossed },
                        { label: 'Photography', q: 'Photography & Videography', Icon: Camera },
                        { label: 'Videography', q: 'Photography & Videography', Icon: Video },
                        { label: 'Cakes', q: 'Catering & Sweets', Icon: CakeIcon },
                        { label: 'Zaffe', q: 'Entertainment', Icon: Music },
                        { label: 'DJ & Sound', q: 'Lighting & Sound', Icon: Headphones },
                        { label: 'Makeup & Hair', q: 'Beauty & Grooming', Icon: Brush },
                        { label: 'Flowers', q: 'Decoration', Icon: Flower },
                        { label: 'Venues', q: 'Venues', Icon: Building2 },
                        { label: 'Cars', q: 'Transportation', Icon: Car },
                        { label: 'Dresses', q: 'Rentals & Furniture', Icon: Shirt },
                        { label: 'Decoration', q: 'Decoration', Icon: PartyPopper },
                    ].map((c, i) => (
                        <Link key={c.label} href={`/client/explore?category=${encodeURIComponent(c.q)}`} aria-label={c.label} className="group">
                            <div className="flex flex-col items-center gap-1 p-2 rounded-xl transition duration-200">
                                <div className="h-12 w-12 rounded-xl border border-red-200 bg-white flex items-center justify-center hover:border-red-300 group-active:bg-red-50 group-active:border-red-300 active:scale-95 pulse-slow">
                                    <c.Icon className="h-5 w-5 text-red-500 group-active:text-red-600" />
                                </div>
                                <div className="text-[11px] font-medium">{c.label}</div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Desktop/Tablet: rich image tiles */}
                <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Catering', emoji: '🍽️', q: 'Catering & Sweets', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'Photography', emoji: '📸', q: 'Photography & Videography', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'Videography', emoji: '🎥', q: 'Photography & Videography', image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'Cakes', emoji: '🎂', q: 'Catering & Sweets', image: 'https://images.unsplash.com/photo-1521302080371-727c5a1b3f5f?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'Zaffe', emoji: '🎼', q: 'Entertainment', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'DJ & Sound', emoji: '🎧', q: 'Lighting & Sound', image: 'https://images.unsplash.com/photo-1511268553-1b1a5bb2f3aa?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'Makeup & Hair', emoji: '💄', q: 'Beauty & Grooming', image: 'https://images.unsplash.com/photo-1519415943484-9fa18778a0e1?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'Flowers', emoji: '🌸', q: 'Decoration', image: 'https://images.unsplash.com/photo-1445404590072-16c2e99ebba9?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'Venues', emoji: '🏛️', q: 'Venues', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'Cars', emoji: '🚗', q: 'Transportation', image: 'https://images.unsplash.com/photo-1493238792000-8113da709137?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'Dresses', emoji: '👗', q: 'Rentals & Furniture', image: 'https://images.unsplash.com/photo-1520974691648-5f65a2ede8d9?q=80&w=1200&auto=format&fit=crop' },
                        { label: 'Decoration', emoji: '🎈', q: 'Decoration', image: 'https://images.unsplash.com/photo-1532438764749-f600a4f478f1?q=80&w=1200&auto=format&fit=crop' },
                    ].map((c) => (
                        <Link key={c.label} href={`/client/explore?category=${encodeURIComponent(c.q)}`}>
                            <Card className="group overflow-hidden hover:shadow-md transition transform hover:scale-[1.02] animate-scale-in">
                                <div className="relative h-36">
                                    <img loading="lazy" src={c.image} alt={c.label} className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-white">
                                            <span className="text-xl">{c.emoji}</span>
                                            <div className="text-sm font-semibold">{c.label}</div>
                                        </div>
                                        <Button size="sm" variant="secondary" className="bg-white/90 text-black hover:bg-white">Explore</Button>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
                    </TabsContent>

                    <TabsContent value="event-types">
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold">Event Types</h2>
                    <p className="text-muted-foreground">Get inspired and start planning</p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
                    {[
                        { label: 'Birthdays', emoji: '🎂', q: 'Birthday Party' },
                        { label: 'Newborn Celebrations', emoji: '👶', q: 'Baby Shower' },
                        { label: 'Engagements', emoji: '💍', q: 'Engagement' },
                        { label: 'Weddings', emoji: '💒', q: 'Wedding' },
                        { label: 'Private Parties', emoji: '🎉', q: 'Other' },
                        { label: 'Corporate Events', emoji: '🏢', q: 'Corporate Event' },
                        { label: 'Graduations', emoji: '🎓', q: 'Graduation' },
                        { label: 'Photoshoots', emoji: '📸', q: 'Other' },
                    ].map((e) => (
                        <Link key={e.label} href={`/client/explore?eventType=${encodeURIComponent(e.q)}`}>
                            <div className="relative h-16 px-3 flex items-center justify-start">
                                <div className="flex items-center gap-2">
                                    <div className="relative tilt-mini">
                                        <span className="text-xl">{e.emoji}</span>
                                        {e.label === 'Birthdays' && (
                                            <span className="absolute -top-2 -right-2 flame-dot" />
                                        )}
                                        {e.label === 'Engagements' && (
                                            <span className="absolute -top-2 -right-2 spark-dot" />
                                        )}
                                        {e.label === 'Photoshoots' && (
                                            <span className="flash-overlay" style={{ right: '-6px', top: '-6px' }} />
                                        )}
                                    </div>
                                    <div className="text-sm font-semibold">{e.label}</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Featured Vendors</h2>
                    <Link href="/client/explore"><Button variant="link">View All</Button></Link>
                </div>
                {pageIsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                    </div>
                ) : (
                    <Card className="overflow-hidden">
                        <Carousel setApi={setVendorCarouselApi} opts={{ loop: true, align: 'start' }}>
                            <CarouselContent>
                                {topVendors.map(v => (
                                    <CarouselItem key={v.id} className="basis-1/2 p-2">
                                        <Link href={`/vendor/${v.id}`}>
                                            <Card className="w-full">
                                                <CardContent className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={v.avatar || '/placeholder.png'} alt={v.businessName} className="h-10 w-10 rounded-full object-cover" />
                                                        <div>
                                                            <div className="text-sm font-semibold">{v.businessName}</div>
                                                            <div className="text-xs text-muted-foreground">{v.category}</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex items-center gap-2 text-sm">
                                                        <Star className="h-4 w-4 text-yellow-500" />
                                                        <span>{(v.rating || 0).toFixed(1)} ({v.reviewCount || 0})</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </Card>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold">Editorial Picks</h2>
                    <p className="text-muted-foreground">Curated highlights for you</p>
                </div>
                {pageIsLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
                    </div>
                ) : (
                    <Card className="overflow-hidden">
                        <Carousel setApi={setPicksCarouselApi} opts={{ loop: true, align: 'start' }}>
                            <CarouselContent>
                                {[
                                    { title: 'Best Photographers This Week', href: '/client/explore?category=Photography%20%26%20Videography', Icon: Camera, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop' },
                                    { title: 'Top Wedding Venues in Beirut', href: '/client/explore?category=Venues', Icon: Building2, image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop' },
                                    { title: 'Popular Cake Designers in 2025', href: '/client/explore?category=Catering%20%26%20Sweets', Icon: CakeIcon, image: 'https://images.unsplash.com/photo-1521302080371-727c5a1b3f5f?q=80&w=800&auto=format&fit=crop' },
                                    { title: 'Budget-Friendly Catering Options', href: '/client/explore?category=Catering%20%26%20Sweets', Icon: UtensilsCrossed, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop' },
                                ].map((p) => (
                                    <CarouselItem key={p.title} className="basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3 p-2">
                                        <Link href={p.href}>
                                            <Card className="overflow-hidden">
                                                <div className="relative h-28">
                                                    <img loading="lazy" src={p.image} alt={p.title} className="h-full w-full object-cover" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-white">
                                                            <p.Icon className="h-5 w-5" />
                                                            <div className="text-sm font-semibold line-clamp-1">{p.title}</div>
                                                        </div>
                                                        <ArrowRight className="h-4 w-4 text-white" />
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </Card>
                )}
            </div>


            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Offers & Promotions</h2>
                    <p className="text-muted-foreground">Limited-time packages and deals</p>
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

            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold">Planning Tools</h2>
                    <p className="text-muted-foreground">Plan, budget, and manage your event</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link href="/client/event-planner">
                        <Card className="hover:shadow-md transition h-16 md:h-20">
                            <CardContent className="p-4 h-full flex items-center gap-3">
                                <Calendar className="h-5 w-5" />
                                <div className="text-sm font-medium">Event Timeline</div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/client/event-planner">
                        <Card className="hover:shadow-md transition h-16 md:h-20">
                            <CardContent className="p-4 h-full flex items-center gap-3">
                                <Wallet className="h-5 w-5" />
                                <div className="text-sm font-medium">Budget Calculator</div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/client/bookings">
                        <Card className="hover:shadow-md transition h-16 md:h-20">
                            <CardContent className="p-4 h-full flex items-center gap-3">
                                <Compass className="h-5 w-5" />
                                <div className="text-sm font-medium">Manage Bookings</div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/client/messages">
                        <Card className="hover:shadow-md transition h-16 md:h-20">
                            <CardContent className="p-4 h-full flex items-center gap-3">
                                <MessageSquare className="h-5 w-5" />
                                <div className="text-sm font-medium">Vendor Messages</div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

        </div>
    )
}
